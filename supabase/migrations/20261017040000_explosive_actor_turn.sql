-- Livro Base v1.3 p.64: arremesso/detonação gastam ação padrão; instalação da mina, ação completa.
-- No combate v2, o tracker confirma o ator. Fora dele, a mesa mantém a declaração da ação.
CREATE OR REPLACE FUNCTION public.assert_explosive_actor_turn(p_character_id uuid,p_budget jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF p_budget->>'mode'='combat' AND p_budget->>'actorId' IS DISTINCT FROM p_character_id::text THEN
  RAISE EXCEPTION 'Aguarde o turno do personagem para usar, instalar ou detonar o explosivo.' USING ERRCODE='55004';
 END IF;
END $$;
REVOKE ALL ON FUNCTION public.assert_explosive_actor_turn(uuid,jsonb) FROM PUBLIC,anon,authenticated;

-- As duas funções abaixo conservam consumo, dano, resistências e recibos; conferem apenas o ator antes de alterar dados.
CREATE OR REPLACE FUNCTION public.confirm_character_explosive_action(p_operation_id uuid, p_character_id uuid, p_request jsonb)
 RETURNS character_activity_events
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE c public.characters; item jsonb; receipt public.character_activity_events; fingerprint text;
 quantity integer; kind text; point text; budget jsonb; dt integer; expert boolean;
 count_dice integer; dice jsonb:='[]'; die integer; total integer:=0; kept integer; keep_low boolean;
 training integer; modifier integer; penalty integer; extra integer; installation jsonb; inventory_after jsonb;
BEGIN
 IF NOT public.can_manage_character_activity(p_character_id) THEN RAISE EXCEPTION 'Ficha não autorizada.' USING ERRCODE='42501'; END IF;
 point:=trim(p_request->>'point');
 IF p_operation_id IS NULL OR jsonb_typeof(p_request) IS DISTINCT FROM 'object' OR octet_length(p_request::text)>16000
 OR p_request->'requirementsConfirmed' IS DISTINCT FROM 'true'::jsonb OR point IS NULL OR length(point) NOT BETWEEN 1 AND 240 THEN
 RAISE EXCEPTION 'Confirme os requisitos e o ponto escolhido.' USING ERRCODE='22023'; END IF;
 fingerprint:=md5(jsonb_build_array(p_character_id,p_request)::text);
 PERFORM pg_advisory_xact_lock(hashtextextended(p_operation_id::text,0));
 SELECT * INTO receipt FROM public.character_activity_events WHERE operation_id=p_operation_id;
 IF FOUND THEN IF receipt.author_id<>auth.uid() OR receipt.request_hash<>fingerprint THEN RAISE EXCEPTION 'Operação reutilizada.' USING ERRCODE='23505'; END IF; RETURN receipt; END IF;
 budget:=public.get_character_pe_budget(p_character_id);
 PERFORM public.assert_explosive_actor_turn(p_character_id,budget);
 SELECT * INTO c FROM public.characters WHERE id=p_character_id FOR UPDATE;
 IF NOT public.physical_explosive_action_allowed(c.conditions) THEN RAISE EXCEPTION 'Uma condição impede esta ação física. Resolva a condição antes de usar ou instalar explosivos.' USING ERRCODE='55004'; END IF;
 IF (SELECT count(*) FROM jsonb_array_elements(c.inventory) WHERE value->>'id'=p_request->'item'->>'id')<>1 THEN RAISE EXCEPTION 'Item ausente ou duplicado.' USING ERRCODE='40001'; END IF;
 SELECT value INTO item FROM jsonb_array_elements(c.inventory) WHERE value->>'id'=p_request->'item'->>'id';
 IF item IS DISTINCT FROM p_request->'item' THEN RAISE EXCEPTION 'O item mudou. Atualize.' USING ERRCODE='40001'; END IF;
 kind:=public.explosive_type(item->>'catalogId');
 IF kind IS NULL OR item->>'catalogType' IS DISTINCT FROM 'explosivo' THEN RAISE EXCEPTION 'Explosivo incompatível.' USING ERRCODE='22023'; END IF;
 IF coalesce(item->>'quantity','1') !~ '^[0-9]{1,6}$' THEN RAISE EXCEPTION 'Quantidade inválida.' USING ERRCODE='22023'; END IF;
 quantity:=coalesce((item->>'quantity')::integer,1);
 IF quantity<1 OR (item ? 'uses' AND coalesce(item->>'uses','0') !~ '^[1-9][0-9]{0,5}$') THEN RAISE EXCEPTION 'Explosivo indisponível.' USING ERRCODE='55004'; END IF;
 IF c.agility NOT BETWEEN 0 AND 5 OR c.intellect NOT BETWEEN 0 AND 5 THEN RAISE EXCEPTION 'Confira os atributos.' USING ERRCODE='22023'; END IF;
 SELECT EXISTS(SELECT 1 FROM jsonb_array_elements(
 CASE WHEN jsonb_typeof(c.powers)='array' THEN c.powers ELSE '[]' END ||
 CASE WHEN jsonb_typeof(c.general_powers)='array' THEN c.general_powers ELSE '[]' END) p
 WHERE p->>'id'='perito-explosivos' OR lower(p->>'name')='perito em explosivos' OR p #>> '{}'='perito-explosivos') INTO expert;
 dt:=10+(budget->>'limit')::integer+CASE WHEN kind='mine' THEN c.intellect ELSE c.agility END+CASE WHEN expert THEN c.intellect ELSE 0 END;
 IF kind='smoke' THEN dt:=NULL; END IF;
 IF kind='mine' THEN
 IF length(trim(coalesce(p_request->>'direction',''))) NOT BETWEEN 1 AND 240 THEN RAISE EXCEPTION 'Informe a direção do cone.' USING ERRCODE='22023'; END IF;
 SELECT coalesce((value #>> '{}')::integer,0) INTO training FROM jsonb_each(c.skills) WHERE lower(key) IN ('tatica','tática') LIMIT 1;
 IF coalesce(training,0) NOT BETWEEN 1 AND 3 THEN RAISE EXCEPTION 'Instalar exige Tática treinada.' USING ERRCODE='55004'; END IF;
 IF coalesce(p_request->>'otherBonuses','0') !~ '^-?[0-9]{1,3}$' OR coalesce(p_request->>'dicePenalty','0') !~ '^[0-9]{1,2}$'
 OR coalesce(p_request->>'extraDice','0') !~ '^[0-9]{1,2}$' THEN RAISE EXCEPTION 'Modificadores inválidos.' USING ERRCODE='22023'; END IF;
 modifier:=coalesce((p_request->>'otherBonuses')::integer,0); penalty:=coalesce((p_request->>'dicePenalty')::integer,0); extra:=coalesce((p_request->>'extraDice')::integer,0);
 IF abs(modifier)>100 OR penalty>10 OR extra>10 THEN RAISE EXCEPTION 'Modificadores fora do limite.' USING ERRCODE='22023'; END IF;
 IF c.intellect=0 THEN count_dice:=2+penalty; keep_low:=true;
 ELSIF c.intellect+extra-penalty>=1 THEN count_dice:=c.intellect+extra-penalty; keep_low:=false;
 ELSE count_dice:=c.intellect+extra+penalty; keep_low:=true; END IF;
 FOR i IN 1..count_dice LOOP die:=floor(random()*20)::integer+1; dice:=dice||to_jsonb(die);
 kept:=CASE WHEN kept IS NULL THEN die WHEN keep_low THEN least(kept,die) ELSE greatest(kept,die) END; END LOOP;
 total:=kept+training*5+modifier;
 installation:=jsonb_build_object('dice',dice,'kept',kept,'trainingBonus',training*5,'declaredOtherBonuses',modifier,'dicePenalty',penalty,'extraDice',extra,'total',total,'dt',15,'passed',total>=15);
 dice:='[]'; total:=0;
 ELSE
 count_dice:=CASE kind WHEN 'fragmentation' THEN 8 WHEN 'incendiary' THEN 6 ELSE 0 END;
 FOR i IN 1..count_dice LOOP die:=floor(random()*6)::integer+1; dice:=dice||to_jsonb(die); total:=total+die; END LOOP;
 END IF;
 SELECT coalesce(jsonb_agg(CASE WHEN value->>'id'=item->>'id' THEN jsonb_set(value,'{quantity}',to_jsonb(quantity-1)) ELSE value END ORDER BY ordinality),'[]')
 INTO inventory_after FROM jsonb_array_elements(c.inventory) WITH ORDINALITY WHERE value->>'id'<>item->>'id' OR quantity>1;
 UPDATE public.characters SET inventory=inventory_after WHERE id=p_character_id;
 INSERT INTO public.character_activity_events(id,operation_id,character_id,author_id,category,status,payload,request_hash)
 VALUES(p_operation_id,p_operation_id,p_character_id,auth.uid(),'roll','confirmed',jsonb_build_object(
 'kind','explosive_event','explosiveType',kind,'stage',CASE WHEN kind='mine' THEN CASE WHEN (installation->>'passed')::boolean THEN 'installed' ELSE 'failed' END ELSE 'active' END,
 'installation',installation,'direction',p_request->>'direction','remainingRounds',CASE kind WHEN 'smoke' THEN 2 WHEN 'stun' THEN 1 ELSE 0 END,
 'itemName',item->>'name','point',point,'radius',6,'actionCost',CASE WHEN kind='mine' THEN 'completa' ELSE 'padrão' END,'peCost',0,'consumed',1,'remainingQuantity',quantity-1,
 'requirementsDeclared',true,'dt',dt,'agility',c.agility,'peLimit',(budget->>'limit')::integer,'expertIntellect',CASE WHEN expert THEN c.intellect ELSE 0 END,
 'maxExcludedTargets',CASE WHEN expert THEN c.intellect ELSE 0 END,'targetResolution','pending',
 'result',jsonb_build_object('label','Explosivo: '||(item->>'name'),'dice',dice,'total',total,'damageType',CASE kind WHEN 'incendiary' THEN 'Fogo' WHEN 'fragmentation' THEN 'Perfuração' WHEN 'mine' THEN 'Perfuração' ELSE NULL END)),
 fingerprint) RETURNING * INTO receipt;
 RETURN receipt;
END $function$
;
CREATE OR REPLACE FUNCTION public.confirm_character_explosive_control(p_operation_id uuid, p_character_id uuid, p_request jsonb)
 RETURNS character_activity_events
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE e public.character_activity_events; receipt public.character_activity_events; fingerprint text; action text:=p_request->>'action';
 target uuid; c public.characters; row public.fragmentation_target_resolutions; rounds integer; dice jsonb:='[]'; die integer; total integer:=0; result_payload jsonb;
BEGIN
 IF p_operation_id IS NULL OR p_request->'requirementsConfirmed' IS DISTINCT FROM 'true'::jsonb OR action NOT IN ('detonate','advance','leave','extinguish') OR action IS NULL THEN
 RAISE EXCEPTION 'Confirme a ação e seus requisitos.' USING ERRCODE='22023'; END IF;
 IF action='extinguish' THEN
  target:=(p_request->>'targetId')::uuid;
  IF NOT ((target=p_character_id AND public.can_manage_character_activity(target)) OR public.is_fragmentation_master(p_character_id,target)) THEN
   RAISE EXCEPTION 'Alvo não autorizado.' USING ERRCODE='42501'; END IF;
  IF p_request->>'method' IS NULL OR p_request->>'method' NOT IN ('standard','water') THEN RAISE EXCEPTION 'Confirme ação padrão ou imersão em água.' USING ERRCODE='22023'; END IF;
 ELSIF action='detonate' THEN
  IF NOT public.can_manage_character_activity(p_character_id) THEN RAISE EXCEPTION 'Mina não autorizada.' USING ERRCODE='42501'; END IF;
 ELSE
  IF NOT public.is_fragmentation_master(p_character_id) THEN RAISE EXCEPTION 'Somente o mestre confirma a duração e a área.' USING ERRCODE='42501'; END IF;
 END IF;
 fingerprint:=md5(jsonb_build_array(p_character_id,p_request)::text);
 PERFORM pg_advisory_xact_lock(hashtextextended(p_operation_id::text,0));
 SELECT * INTO receipt FROM public.character_activity_events WHERE operation_id=p_operation_id;
 IF FOUND THEN IF receipt.author_id<>auth.uid() OR receipt.request_hash<>fingerprint THEN RAISE EXCEPTION 'Operação reutilizada.' USING ERRCODE='23505'; END IF; RETURN receipt; END IF;
 IF action='detonate' THEN
  PERFORM public.assert_explosive_actor_turn(p_character_id,public.get_character_pe_budget(p_character_id));
 END IF;
 IF action='extinguish' THEN
  SELECT * INTO c FROM public.characters WHERE id=target FOR UPDATE;
  IF target=p_character_id AND p_request->>'method'='standard' AND NOT public.physical_explosive_action_allowed(c.conditions) THEN
   RAISE EXCEPTION 'Não é possível gastar a ação padrão para apagar chamas nesta condição. Imersão em água pode ser confirmada pela mesa.' USING ERRCODE='55004'; END IF;
  IF p_request->'expectedConditions' IS DISTINCT FROM c.conditions THEN RAISE EXCEPTION 'Condições mudaram. Atualize.' USING ERRCODE='40001'; END IF;
  IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(c.conditions) x WHERE lower(replace(coalesce(x->>'id',x #>> '{}'),'_','-')) IN ('em-chamas','em chamas')) THEN
   RAISE EXCEPTION 'O alvo não está em chamas.' USING ERRCODE='55004'; END IF;
  UPDATE public.characters SET conditions=public.remove_explosive_conditions(c.conditions,NULL,true) WHERE id=target;
  UPDATE public.fragmentation_target_resolutions SET active=false WHERE target_id=target AND effect_conditions @> ARRAY['em_chamas'];
  result_payload:=jsonb_build_object('kind','explosive_control','action',action,'targetName',c.name,'method',p_request->>'method','conditionsRemoved',ARRAY['em_chamas']);
 ELSE
  SELECT * INTO e FROM public.character_activity_events WHERE id=(p_request->>'explosionId')::uuid AND character_id=p_character_id
  AND payload->>'kind'='explosive_event' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Explosivo ausente.' USING ERRCODE='55004'; END IF;
  IF action='detonate' THEN
   SELECT * INTO c FROM public.characters WHERE id=p_character_id FOR UPDATE;
   IF NOT public.physical_explosive_action_allowed(c.conditions) THEN RAISE EXCEPTION 'Uma condição impede esta ação física. Resolva-a antes de detonar.' USING ERRCODE='55004'; END IF;
   IF e.payload->>'explosiveType'<>'mine' OR e.payload->>'stage'<>'installed' THEN RAISE EXCEPTION 'Mina falhou ou já foi detonada.' USING ERRCODE='55004'; END IF;
   FOR i IN 1..12 LOOP die:=floor(random()*6)::integer+1; dice:=dice||to_jsonb(die); total:=total+die; END LOOP;
   UPDATE public.character_activity_events SET payload=payload||jsonb_build_object('stage','active','shape','cone','detonated',true,
    'result',jsonb_build_object('label','Mina Antipessoal','dice',dice,'total',total,'damageType','Perfuração')) WHERE id=e.id;
   result_payload:=jsonb_build_object('kind','explosive_control','action',action,'explosionId',e.id,'dice',dice,'total',total,'consumed',0,'rangeDeclared','longo','actionCost','padrão');
  ELSIF action='advance' THEN
   IF e.payload->>'explosiveType' NOT IN ('smoke','stun') OR e.payload->>'stage'<>'active' OR (e.payload->>'remainingRounds')::integer<=0 THEN
    RAISE EXCEPTION 'Área já encerrada ou sem duração em rodadas.' USING ERRCODE='55004'; END IF;
   IF p_request->'expectedRounds' IS DISTINCT FROM e.payload->'remainingRounds' THEN RAISE EXCEPTION 'A duração mudou. Atualize.' USING ERRCODE='40001'; END IF;
   rounds:=(e.payload->>'remainingRounds')::integer-1;
   IF rounds=0 THEN
    FOR row IN SELECT * FROM public.fragmentation_target_resolutions WHERE explosion_id=e.id AND active ORDER BY target_id FOR UPDATE LOOP
     SELECT * INTO c FROM public.characters WHERE id=row.target_id FOR UPDATE;
     UPDATE public.characters SET conditions=public.remove_explosive_conditions(c.conditions,e.id) WHERE id=c.id;
     IF c.id<>p_character_id THEN
      INSERT INTO public.character_activity_events(id,operation_id,character_id,author_id,category,status,payload,request_hash)
      VALUES(gen_random_uuid(),gen_random_uuid(),c.id,auth.uid(),'application','confirmed',jsonb_build_object('kind','explosive_control','action','expired','explosionId',e.id,'ended',true,'targetName',c.name),fingerprint);
     END IF;
    END LOOP;
    UPDATE public.fragmentation_target_resolutions SET active=false WHERE explosion_id=e.id;
   END IF;
   UPDATE public.character_activity_events SET payload=payload||jsonb_build_object('remainingRounds',rounds,'stage',CASE WHEN rounds=0 THEN 'ended' ELSE 'active' END) WHERE id=e.id;
   result_payload:=jsonb_build_object('kind','explosive_control','action',action,'explosionId',e.id,'remainingRounds',rounds,'ended',rounds=0);
  ELSE
   target:=(p_request->>'targetId')::uuid;
   IF NOT public.is_fragmentation_master(p_character_id,target) OR e.payload->>'explosiveType'<>'smoke' THEN RAISE EXCEPTION 'Área/alvo não autorizado.' USING ERRCODE='42501'; END IF;
   SELECT * INTO row FROM public.fragmentation_target_resolutions WHERE explosion_id=e.id AND target_id=target FOR UPDATE;
   IF NOT FOUND OR NOT row.active THEN RAISE EXCEPTION 'Alvo já saiu ou não tem efeito desta área.' USING ERRCODE='55004'; END IF;
   SELECT * INTO c FROM public.characters WHERE id=target FOR UPDATE;
   IF p_request->'expectedConditions' IS DISTINCT FROM c.conditions THEN RAISE EXCEPTION 'Condições mudaram. Atualize.' USING ERRCODE='40001'; END IF;
   UPDATE public.characters SET conditions=public.remove_explosive_conditions(c.conditions,e.id) WHERE id=target;
   UPDATE public.fragmentation_target_resolutions SET active=false WHERE explosion_id=e.id AND target_id=target;
   result_payload:=jsonb_build_object('kind','explosive_control','action',action,'explosionId',e.id,'targetName',c.name,'ended',true);
  END IF;
 END IF;
 INSERT INTO public.character_activity_events(id,operation_id,character_id,author_id,category,status,payload,request_hash)
 VALUES(p_operation_id,p_operation_id,p_character_id,auth.uid(),'application','confirmed',result_payload,fingerprint) RETURNING * INTO receipt;
 -- A origem tem o recibo; alvos diferentes também recebem o encerramento em seu histórico.
 IF action IN ('leave','extinguish') AND target<>p_character_id THEN
  INSERT INTO public.character_activity_events(id,operation_id,character_id,author_id,category,status,payload,request_hash)
  VALUES(gen_random_uuid(),gen_random_uuid(),target,auth.uid(),'application','confirmed',result_payload,fingerprint);
 END IF;
 RETURN receipt;
END $function$
;
REVOKE ALL ON FUNCTION public.confirm_character_explosive_action(uuid,uuid,jsonb),public.confirm_character_explosive_control(uuid,uuid,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.confirm_character_explosive_action(uuid,uuid,jsonb),public.confirm_character_explosive_control(uuid,uuid,jsonb) TO authenticated;
