-- Corrige somente condições novas preparadas a partir de uma perda absorvida por temporários.
CREATE OR REPLACE FUNCTION public.resolve_character_condition_turn(p_operation_id uuid, p_character_id uuid, p_values jsonb, p_expected jsonb, p_conditions jsonb, p_resolution jsonb)
 RETURNS character_activity_events
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE result public.character_activity_events; amount integer; item jsonb; saved_vigor integer; temp_used integer:=0; raw_hash text;
BEGIN
 IF NOT public.can_manage_character_activity(p_character_id) THEN RAISE EXCEPTION 'Sem permissão.' USING ERRCODE='42501'; END IF;
 IF p_operation_id IS NULL THEN RAISE EXCEPTION 'ID obrigatório.' USING ERRCODE='22023'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_operation_id::text,0));
 raw_hash:=md5(jsonb_build_array(p_character_id,p_values,p_expected,p_conditions,p_resolution)::text);
 SELECT * INTO result FROM public.character_activity_events WHERE operation_id=p_operation_id;
 IF FOUND AND result.payload ? 'originalTurnHash' THEN
  IF result.author_id<>auth.uid() OR result.payload->>'originalTurnHash'<>raw_hash THEN RAISE EXCEPTION 'Operação reutilizada.' USING ERRCODE='23505'; END IF;
  RETURN result;
 END IF;
 IF p_resolution IS NULL OR jsonb_typeof(p_resolution)<>'object' OR octet_length(p_resolution::text)>30000
 OR p_resolution->>'profile' IS DISTINCT FROM 'base-v1.3-mesa' OR p_resolution->>'revision' IS DISTINCT FROM '1'
 OR jsonb_typeof(p_resolution->'effects') IS DISTINCT FROM 'array' OR jsonb_array_length(p_resolution->'effects')>100
 OR jsonb_typeof(p_resolution->'bleedingTests') IS DISTINCT FROM 'array'
 OR jsonb_typeof(p_resolution->'removeIndexes') IS DISTINCT FROM 'array'
 OR jsonb_typeof(p_resolution->'notices') IS DISTINCT FROM 'array'
 OR NOT public.activity_json_integer(p_expected->'hp_current',0,1000000)
 OR NOT public.activity_json_integer(p_values->'hp',0,1000000)
 OR p_values->'pe' IS DISTINCT FROM p_expected->'pe_current' OR p_values->'san' IS DISTINCT FROM p_expected->'san_current' THEN
   RAISE EXCEPTION 'Resolução ou recursos inválidos.' USING ERRCODE='22023'; END IF;
 amount:=0;
 FOR item IN SELECT * FROM jsonb_array_elements(p_resolution->'effects') LOOP
   IF item->>'conditionId' NOT IN ('sangrando','em-chamas','em_chamas','envenenado') OR item->>'conditionId' IS NULL
   OR NOT public.activity_json_integer(item->'rolled',0,1000000) OR NOT public.activity_json_integer(item->'finalAmount',0,1000000)
   OR (item->>'finalAmount')::integer>(item->>'rolled')::integer
   OR (item->>'conditionId'='sangrando' AND (item->'finalAmount' IS DISTINCT FROM item->'rolled' OR item->'ignoresResistance' IS DISTINCT FROM 'true'::jsonb)) THEN
     RAISE EXCEPTION 'Dano final inválido.' USING ERRCODE='22023'; END IF;
   amount:=amount+(item->>'finalAmount')::integer;
 END LOOP;
 IF (p_values->>'hp')::integer<>greatest(0,(p_expected->>'hp_current')::integer-amount) THEN
   RAISE EXCEPTION 'PV não corresponde aos efeitos confirmados.' USING ERRCODE='22023'; END IF;
 IF NOT public.activity_json_integer(p_expected->'vigor',-100,100) THEN
   RAISE EXCEPTION 'Snapshot de Vigor inválido.' USING ERRCODE='22023'; END IF;
 -- Mesmo lock do bundle: alteração de atributo durante a prévia invalida os dados do teste.
 SELECT vigor INTO saved_vigor FROM public.characters WHERE id=p_character_id FOR UPDATE;
 IF saved_vigor IS DISTINCT FROM (p_expected->>'vigor')::integer AND NOT EXISTS (
   SELECT 1 FROM public.character_activity_events WHERE id=p_operation_id AND character_id=p_character_id AND author_id=auth.uid()
 ) THEN
   RAISE EXCEPTION 'Vigor mudou. Reabra a ficha e prepare o turno novamente.' USING ERRCODE='40001'; END IF;
 -- Inclui a resolução na impressão do pedido: mudar dados num retry é rejeitado.
 -- O servidor confirma resultados informados pelo jogador, sem alegar sorteio próprio.
 IF NOT EXISTS(SELECT 1 FROM public.character_activity_events WHERE operation_id=p_operation_id) THEN
  -- Fogo usa também reservatórios restritos a Fogo; Sangrando permanece perda direta de PV.
  FOR item IN SELECT value FROM jsonb_array_elements(p_resolution->'effects') WHERE value->>'conditionId'<>'sangrando' LOOP
   temp_used:=temp_used+public.consume_temporary_resource(p_character_id,'hp',(item->>'finalAmount')::integer,
    CASE WHEN item->>'conditionId' IN ('em_chamas','em-chamas') THEN 'Fogo' ELSE NULL END);
  END LOOP;
  p_values:=jsonb_set(p_values,'{hp}',to_jsonb(greatest(0,(p_expected->>'hp_current')::integer-amount+temp_used)));
 END IF;
 -- Temporários já foram descontados: não acrescenta estados de zero/meia vida a partir da prévia anterior.
 -- Preserva condições que já existiam e todas as condições alheias; o hash do pedido original não muda.
 IF temp_used>0 THEN
  SELECT coalesce(jsonb_agg(current_condition ORDER BY position),'[]') INTO p_conditions
  FROM jsonb_array_elements(p_conditions) WITH ORDINALITY AS candidates(current_condition,position)
  WHERE NOT (
   lower(coalesce(current_condition->>'id',current_condition #>> '{}')) IN ('morrendo','inconsciente','machucado')
   AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements(p_expected->'conditions') AS prior(prior_condition)
    WHERE lower(coalesce(prior_condition->>'id',prior_condition #>> '{}'))=lower(coalesce(current_condition->>'id',current_condition #>> '{}')))
   AND CASE WHEN lower(coalesce(current_condition->>'id',current_condition #>> '{}'))='machucado'
    THEN (p_values->>'hp')::integer*2>(p_expected->>'hp_max')::integer
    ELSE (p_values->>'hp')::integer>0 END
  );
 END IF;
 result:=public.change_character_resources(p_operation_id,p_character_id,p_values,
   p_expected||jsonb_build_object('condition_turn_resolution',p_resolution),p_conditions);
 UPDATE public.character_activity_events SET payload=payload||jsonb_build_object('kind','condition_turn','resolution',p_resolution,'temporaryHPUsed',temp_used,'originalTurnHash',raw_hash)
 WHERE id=result.id RETURNING * INTO result;
 RETURN result;
END $function$
;
