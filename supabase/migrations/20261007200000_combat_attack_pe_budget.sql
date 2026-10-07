-- Amplia o orçamento sem alterar gastos antigos ou tratar edição manual como habilidade.
ALTER TABLE public.character_pe_turn_spending DROP CONSTRAINT character_pe_turn_spending_kind_check;
ALTER TABLE public.character_pe_turn_spending ADD CONSTRAINT character_pe_turn_spending_kind_check CHECK(kind IN ('ritual','maintenance','ability'));

-- Entrada declarativa: custos oficiais calculados a partir da ficha e seleção.
-- Ataque e custo recebem um único recibo; falhar no orçamento desfaz toda a operação.
CREATE FUNCTION public.confirm_character_combat_attack(
 p_operation_id uuid,p_character_id uuid,p_expected_pe integer,p_expected_cost integer,
 p_expected_turn_key text,p_selection jsonb,p_payload jsonb
) RETURNS public.character_activity_events LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE ficha public.characters; receipt public.character_activity_events; fingerprint text; budget jsonb;
 weapon jsonb; increments integer; maximum_increments integer; techniques jsonb; lethal integer;
 technique_count integer; cost integer:=0; components integer:=0; minimum boolean:=false;
 temporary_before integer; temporary_used integer; track text;
BEGIN
 IF p_operation_id IS NULL OR p_expected_pe IS NULL OR p_expected_pe<0 OR p_expected_cost IS NULL OR p_expected_cost<0
 OR p_selection IS NULL OR jsonb_typeof(p_selection)<>'object' OR octet_length(p_selection::text)>8000
 OR p_payload IS NULL OR jsonb_typeof(p_payload)<>'object' OR octet_length(p_payload::text)>48000 THEN
  RAISE EXCEPTION 'Ataque inválido.' USING ERRCODE='22023'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_operation_id::text,0));
 PERFORM public.lock_character_pe_turn(p_character_id);
 fingerprint:=md5(jsonb_build_array('combat_attack',p_character_id,p_expected_pe,p_expected_cost,p_expected_turn_key,p_selection,p_payload)::text);
 SELECT * INTO receipt FROM public.character_activity_events WHERE operation_id=p_operation_id;
 IF FOUND THEN
  IF receipt.author_id<>auth.uid() OR receipt.request_hash<>fingerprint THEN RAISE EXCEPTION 'Operação reutilizada.' USING ERRCODE='23505'; END IF;
  RETURN receipt;
 END IF;
 SELECT * INTO ficha FROM public.characters WHERE id=p_character_id;
 budget:=public.get_character_pe_budget(p_character_id);
 IF budget->>'key' IS DISTINCT FROM p_expected_turn_key OR ficha.pe_current IS DISTINCT FROM p_expected_pe THEN
  RAISE EXCEPTION 'Turno ou recurso mudou. Recarregue.' USING ERRCODE='40001'; END IF;
 IF coalesce(p_selection->>'specialAttackIncrements','') !~ '^[0-4]$'
 OR coalesce(p_selection->>'lethalCount','') !~ '^[0-2]$'
 OR jsonb_typeof(p_selection->'sneakAttack') IS DISTINCT FROM 'boolean'
 OR jsonb_typeof(p_selection->'lethalShot') IS DISTINCT FROM 'boolean'
 OR jsonb_typeof(p_selection->'techniques') IS DISTINCT FROM 'array'
 OR jsonb_typeof(p_selection->'otherPaidBonuses') IS DISTINCT FROM 'array' THEN
  RAISE EXCEPTION 'Seleção inválida.' USING ERRCODE='22023'; END IF;
 IF jsonb_array_length(p_selection->'otherPaidBonuses')>0 THEN
  RAISE EXCEPTION 'Custo fora do catálogo do Livro Base exige conferência manual.' USING ERRCODE='0A000'; END IF;
 IF ficha.inventory IS NULL OR jsonb_typeof(ficha.inventory)<>'array' THEN
  RAISE EXCEPTION 'Inventário exige revisão.' USING ERRCODE='0A000'; END IF;
 SELECT item INTO weapon FROM jsonb_array_elements(ficha.inventory) item
  WHERE item->>'id'=p_selection->>'weaponId' AND item->>'itemType'='weapon' AND item->'isEquipped'='true'::jsonb;
 IF weapon IS NULL THEN RAISE EXCEPTION 'Arma não equipada.' USING ERRCODE='22023'; END IF;
 increments:=(p_selection->>'specialAttackIncrements')::integer;
 maximum_increments:=CASE WHEN ficha.nex>=85 THEN 4 WHEN ficha.nex>=55 THEN 3 WHEN ficha.nex>=25 THEN 2 ELSE 1 END;
 IF increments>0 THEN
  IF ficha.class<>'Combatente' OR ficha.nex<5 OR increments>maximum_increments THEN
   RAISE EXCEPTION 'Ataque Especial não disponível.' USING ERRCODE='22023'; END IF;
  cost:=increments+1; components:=1; minimum:=increments=1;
 END IF;
 track:=regexp_replace(lower(coalesce(ficha.class_track,'')),'[ _]+','-','g');
 IF p_selection->'sneakAttack'='true'::jsonb THEN
  IF ficha.class<>'Especialista' OR track<>'infiltrador' OR ficha.nex<10 THEN
   RAISE EXCEPTION 'Ataque Furtivo não disponível.' USING ERRCODE='22023'; END IF;
  cost:=cost+1; components:=components+1; minimum:=true;
 END IF;
 IF p_selection->'lethalShot'='true'::jsonb THEN
  IF ficha.class<>'Especialista' OR track<>'atirador-de-elite' OR ficha.nex<40 THEN
   RAISE EXCEPTION 'Disparo Letal não disponível.' USING ERRCODE='22023'; END IF;
  cost:=cost+1; components:=components+1; minimum:=true;
 END IF;
 techniques:=p_selection->'techniques'; lethal:=(p_selection->>'lethalCount')::integer;
 IF jsonb_array_length(techniques)>4 OR EXISTS(SELECT 1 FROM jsonb_array_elements(techniques) t WHERE jsonb_typeof(t)<>'string')
 OR (SELECT count(DISTINCT t) FROM jsonb_array_elements_text(techniques) t)<>jsonb_array_length(techniques)
 OR EXISTS(SELECT 1 FROM jsonb_array_elements_text(techniques) t WHERE t NOT IN ('amplo','destruidor','letal','perfurante'))
 OR (techniques ? 'letal' AND lethal NOT IN (1,2)) OR (NOT (techniques ? 'letal') AND lethal<>0) THEN
  RAISE EXCEPTION 'Técnicas inválidas.' USING ERRCODE='22023'; END IF;
 technique_count:=jsonb_array_length(techniques)+greatest(0,lethal-1);
 IF technique_count>0 THEN
  IF ficha.class<>'Combatente' OR track<>'aniquilador' OR ficha.nex<40
  OR coalesce(weapon->>'favoriteAbilityId','') NOT IN ('a-favorita','tecnica-secreta','maquina-de-matar')
  OR (ficha.nex<65 AND (techniques ? 'letal' OR techniques ? 'perfurante')) THEN
   RAISE EXCEPTION 'Técnicas não disponíveis para esta arma ou NEX.' USING ERRCODE='22023'; END IF;
  cost:=cost+2*technique_count; components:=components+1; minimum:=technique_count=1;
 END IF;
 -- Uma combinação não recebe a exceção reservada a uma habilidade no custo mínimo.
 minimum:=minimum AND components=1;
 IF cost<>p_expected_cost THEN RAISE EXCEPTION 'Custo mostrado diverge da regra.' USING ERRCODE='22023'; END IF;
 IF jsonb_typeof(p_payload->'entry') IS DISTINCT FROM 'object'
 OR jsonb_typeof(p_payload->'entry'->'results') IS DISTINCT FROM 'array'
 OR jsonb_typeof(p_payload->'entry'->'label') IS DISTINCT FROM 'string'
 OR length(coalesce(p_payload->'entry'->>'label','')) NOT BETWEEN 1 AND 200
 OR p_payload->'entry'->>'type' IS DISTINCT FROM 'attack' THEN
  RAISE EXCEPTION 'Histórico inválido.' USING ERRCODE='22023'; END IF;
 IF jsonb_array_length(p_payload->'entry'->'results') NOT BETWEEN 1 AND 100 THEN
  RAISE EXCEPTION 'Pool inválido.' USING ERRCODE='22023'; END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(p_payload->'entry'->'results') d WHERE d::text !~ '^([1-9]|1[0-9]|20)$') THEN
  RAISE EXCEPTION 'Dados de ataque inválidos.' USING ERRCODE='22023'; END IF;
 IF EXISTS(SELECT 1 FROM unnest(ARRAY['diceCount','bestResult','skillBonus','otherBonuses','bonus','total']) field
  WHERE coalesce(p_payload->'entry'->>field,'') !~ '^-?[0-9]{1,6}$') THEN
  RAISE EXCEPTION 'Resultado inválido.' USING ERRCODE='22023'; END IF;
 IF (p_payload->'entry'->>'diceCount')::integer<>jsonb_array_length(p_payload->'entry'->'results')
 OR NOT (p_payload->'entry'->'results' @> jsonb_build_array((p_payload->'entry'->>'bestResult')::integer))
 OR (p_payload->'entry'->>'bonus')::integer<>(p_payload->'entry'->>'skillBonus')::integer+(p_payload->'entry'->>'otherBonuses')::integer
 OR (p_payload->'entry'->>'total')::integer<>(p_payload->'entry'->>'bestResult')::integer+(p_payload->'entry'->>'bonus')::integer THEN
  RAISE EXCEPTION 'Resultado e parcelas divergentes.' USING ERRCODE='22023'; END IF;
 SELECT coalesce(sum(remaining),0) INTO temporary_before FROM public.character_temporary_resources WHERE character_id=p_character_id AND resource='pe';
 IF ficha.pe_current+temporary_before<cost THEN RAISE EXCEPTION 'PE insuficiente.' USING ERRCODE='22023'; END IF;
 temporary_used:=public.consume_temporary_resource(p_character_id,'pe',cost);
 UPDATE public.characters SET pe_current=pe_current-cost+temporary_used WHERE id=p_character_id;
 INSERT INTO public.character_activity_events(id,operation_id,character_id,author_id,category,status,payload,request_hash)
 VALUES(p_operation_id,p_operation_id,p_character_id,auth.uid(),'roll','confirmed',p_payload||jsonb_build_object(
  'kind','combat_attack','selection',p_selection,'peCost',cost,'peBefore',ficha.pe_current,
  'peAfter',ficha.pe_current-cost+temporary_used,'temporaryPEUsed',temporary_used,
  'temporaryPEBefore',temporary_before,'temporaryPEAfter',temporary_before-temporary_used),fingerprint) RETURNING * INTO receipt;
 RETURN public.record_ritual_pe_budget(receipt.id,budget,cost,'ability',minimum);
END $$;
REVOKE ALL ON FUNCTION public.confirm_character_combat_attack(uuid,uuid,integer,integer,text,jsonb,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.confirm_character_combat_attack(uuid,uuid,integer,integer,text,jsonb,jsonb) TO authenticated;
