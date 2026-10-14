-- Sangrando passa a sortear Vigor e perda de PV no servidor. O pedido antigo
-- permanece como núcleo transacional, mas não é mais executável pelo cliente.
CREATE TABLE public.character_bleeding_turn_confirmations (
 character_id uuid NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
 turn_key text NOT NULL,
 operation_id uuid NOT NULL UNIQUE REFERENCES public.character_activity_events(id) ON DELETE CASCADE,
 PRIMARY KEY(character_id, turn_key)
);
ALTER TABLE public.character_bleeding_turn_confirmations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.character_bleeding_turn_confirmations FROM PUBLIC, anon, authenticated;

CREATE FUNCTION public.confirm_character_condition_turn(
 p_operation_id uuid, p_character_id uuid, p_values jsonb, p_expected jsonb,
 p_conditions jsonb, p_resolution jsonb
) RETURNS public.character_activity_events
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE
 receipt public.character_activity_events; ficha public.characters; client_hash text;
 current_conditions jsonb; next_conditions jsonb; old_bleeding jsonb; bleeding_indexes jsonb;
 condition_ids text[]; penalty integer:=0; modifier integer; dice_count integer;
 keep_lowest boolean; die integer; dice jsonb:='[]'; kept integer; total integer;
 passed boolean; loss integer:=0; effect jsonb; resolution jsonb; values jsonb;
 budget jsonb; key text; index integer; hp integer;
BEGIN
 IF NOT public.can_manage_character_activity(p_character_id) THEN
  RAISE EXCEPTION 'Sem permissão para esta ficha.' USING ERRCODE='42501'; END IF;
 IF p_operation_id IS NULL OR p_resolution IS NULL OR jsonb_typeof(p_resolution)<>'object'
 OR octet_length(p_resolution::text)>30000
 OR p_expected IS NULL OR jsonb_typeof(p_expected)<>'object'
 OR octet_length(p_expected::text)>30000
 OR p_conditions IS NULL OR jsonb_typeof(p_conditions)<>'array'
 OR octet_length(p_conditions::text)>30000
 OR p_values IS NULL OR jsonb_typeof(p_values)<>'object'
 OR NOT public.activity_json_integer(p_resolution->'bleedingModifier',-1000,1000)
 OR jsonb_typeof(p_resolution->'bleedingTests') IS DISTINCT FROM 'array'
 OR jsonb_array_length(p_resolution->'bleedingTests')<>0
 OR jsonb_typeof(p_resolution->'effects') IS DISTINCT FROM 'array'
 OR jsonb_array_length(p_resolution->'effects')>100
 OR EXISTS (SELECT 1 FROM jsonb_array_elements(p_resolution->'effects') e WHERE e->>'conditionId'='sangrando')
 OR jsonb_typeof(p_expected->'conditions') IS DISTINCT FROM 'array'
 OR jsonb_array_length(p_expected->'conditions')>100 THEN
  RAISE EXCEPTION 'Pedido de início de turno inválido.' USING ERRCODE='22023'; END IF;
 client_hash:=md5(jsonb_build_array('server_condition_turn',p_character_id,p_values,p_expected,p_conditions,p_resolution)::text);
 PERFORM pg_advisory_xact_lock(hashtextextended(p_operation_id::text,0));
 SELECT * INTO receipt FROM public.character_activity_events WHERE operation_id=p_operation_id;
 IF FOUND THEN
  IF receipt.author_id<>auth.uid() OR receipt.payload->>'conditionTurnRequestHash' IS DISTINCT FROM client_hash THEN
   RAISE EXCEPTION 'Operação reutilizada.' USING ERRCODE='23505'; END IF;
  RETURN receipt;
 END IF;
 PERFORM public.lock_character_pe_turn(p_character_id);
 SELECT * INTO ficha FROM public.characters WHERE id=p_character_id FOR UPDATE;
 IF NOT FOUND OR ficha.vigor IS DISTINCT FROM (p_expected->>'vigor')::integer
 OR ficha.conditions IS DISTINCT FROM p_expected->'conditions' THEN
  RAISE EXCEPTION 'Ficha mudou. Reabra e prepare o turno novamente.' USING ERRCODE='40001'; END IF;
 current_conditions:=coalesce(ficha.conditions,'[]'::jsonb);
 SELECT coalesce(array_agg(lower(replace(coalesce(c->>'id',c->>'name',c #>> '{}'),'_','-'))),'{}'::text[])
 INTO condition_ids FROM jsonb_array_elements(current_conditions) c;
 SELECT coalesce(jsonb_agg(c ORDER BY ord),'[]'::jsonb),coalesce(jsonb_agg(to_jsonb(ord-1) ORDER BY ord),'[]'::jsonb)
 INTO old_bleeding,bleeding_indexes
 FROM jsonb_array_elements(current_conditions) WITH ORDINALITY AS found(c,ord)
 WHERE lower(replace(coalesce(c->>'id',c->>'name',c #>> '{}'),'_','-'))='sangrando';
 resolution:=p_resolution;
 values:=p_values;
 next_conditions:=p_conditions;
 IF jsonb_array_length(old_bleeding)>0 THEN
  -- Graus substituídos e condições compostas seguem o adaptador da ficha.
  penalty:=CASE WHEN 'apavorado'=ANY(condition_ids) THEN 2 WHEN 'abalado'=ANY(condition_ids) THEN 1 ELSE 0 END
   + CASE WHEN 'exausto'=ANY(condition_ids) OR 'debilitado'=ANY(condition_ids) THEN 2
    WHEN 'fatigado'=ANY(condition_ids) OR 'fraco'=ANY(condition_ids) THEN 1 ELSE 0 END;
  IF ficha.vigor NOT BETWEEN -20 AND 20 THEN
   RAISE EXCEPTION 'Vigor exige revisão antes do teste.' USING ERRCODE='22023'; END IF;
  IF ficha.vigor<=0 THEN dice_count:=2+abs(ficha.vigor)+penalty; keep_lowest:=true;
  ELSIF ficha.vigor-penalty>=1 THEN dice_count:=ficha.vigor-penalty; keep_lowest:=false;
  ELSE dice_count:=ficha.vigor+penalty; keep_lowest:=true; END IF;
  modifier:=(p_resolution->>'bleedingModifier')::integer;
  FOR index IN 1..dice_count LOOP
   die:=floor(random()*20)::integer+1; dice:=dice||to_jsonb(die);
   IF kept IS NULL OR (keep_lowest AND die<kept) OR (NOT keep_lowest AND die>kept) THEN kept:=die; END IF;
  END LOOP;
  total:=kept+modifier; passed:=total>=20; -- 20 natural personalizado não garante sucesso.
  budget:=public.get_character_pe_budget(p_character_id);
  key:=budget->>'key';
  IF coalesce((budget->>'tracked')::boolean,false) AND EXISTS (
   SELECT 1 FROM public.character_bleeding_turn_confirmations
   WHERE character_id=p_character_id AND turn_key=key) THEN
   RAISE EXCEPTION 'Sangrando já foi resolvido neste turno.' USING ERRCODE='23505'; END IF;
  IF NOT passed THEN
   loss:=floor(random()*6)::integer+1;
   effect:=jsonb_build_object('conditionId','sangrando','label','Sangrando','dice',jsonb_build_array(loss),
    'rolled',loss,'finalAmount',loss,'ignoresResistance',true);
   resolution:=jsonb_set(resolution,'{effects}',(resolution->'effects')||jsonb_build_array(effect));
  ELSE
   resolution:=jsonb_set(resolution,'{removeIndexes}',coalesce(resolution->'removeIndexes','[]'::jsonb)||bleeding_indexes);
  END IF;
  resolution:=jsonb_set(resolution,'{bleedingTests}',jsonb_build_array(jsonb_build_object(
   'index',(bleeding_indexes->>0)::integer,'dice',dice,'kept',kept,'modifier',modifier,
   'total',total,'dt',20,'passed',passed)));
  -- Condições de Sangrando sempre vêm do snapshot salvo, preservando metadados.
  SELECT coalesce(jsonb_agg(c ORDER BY ord),'[]'::jsonb) INTO next_conditions
  FROM jsonb_array_elements(next_conditions) WITH ORDINALITY AS kept_conditions(c,ord)
  WHERE lower(replace(coalesce(c->>'id',c->>'name',c #>> '{}'),'_','-'))<>'sangrando';
  IF NOT passed THEN next_conditions:=next_conditions||old_bleeding; END IF;
  SELECT coalesce(sum((e->>'finalAmount')::integer),0) INTO hp
  FROM jsonb_array_elements(resolution->'effects') e;
  hp:=greatest(0,ficha.hp_current-hp);
  values:=jsonb_set(values,'{hp}',to_jsonb(hp));
  IF hp*2<=ficha.hp_max AND NOT EXISTS (
   SELECT 1 FROM jsonb_array_elements(next_conditions) c WHERE lower(coalesce(c->>'id',c->>'name',c #>> '{}'))='machucado') THEN
   next_conditions:=next_conditions||'"machucado"'::jsonb; END IF;
  IF hp=0 AND ficha.hp_current>0 THEN
   IF NOT EXISTS (SELECT 1 FROM jsonb_array_elements(next_conditions) c WHERE lower(coalesce(c->>'id',c->>'name',c #>> '{}'))='inconsciente') THEN
    next_conditions:=next_conditions||'"inconsciente"'::jsonb; END IF;
   IF NOT EXISTS (SELECT 1 FROM jsonb_array_elements(next_conditions) c WHERE lower(coalesce(c->>'id',c->>'name',c #>> '{}'))='morrendo') THEN
    next_conditions:=next_conditions||'"morrendo"'::jsonb; END IF;
  END IF;
 END IF;
 receipt:=public.resolve_character_condition_turn(p_operation_id,p_character_id,values,p_expected,next_conditions,resolution);
 UPDATE public.character_activity_events SET payload=payload||jsonb_build_object(
  'conditionTurnRequestHash',client_hash,'diceSource',CASE WHEN jsonb_array_length(old_bleeding)>0 THEN 'server' ELSE 'client-other-effects' END)
 WHERE id=receipt.id RETURNING * INTO receipt;
 IF key IS NOT NULL AND jsonb_array_length(old_bleeding)>0 THEN
  INSERT INTO public.character_bleeding_turn_confirmations(character_id,turn_key,operation_id)
  VALUES(p_character_id,key,receipt.id);
 END IF;
 RETURN receipt;
END $$;
REVOKE ALL ON FUNCTION public.resolve_character_condition_turn(uuid,uuid,jsonb,jsonb,jsonb,jsonb) FROM authenticated;
REVOKE ALL ON FUNCTION public.confirm_character_condition_turn(uuid,uuid,jsonb,jsonb,jsonb,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.confirm_character_condition_turn(uuid,uuid,jsonb,jsonb,jsonb,jsonb) TO authenticated;
