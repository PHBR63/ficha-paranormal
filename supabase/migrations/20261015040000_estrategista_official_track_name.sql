-- Compatibilidade com fichas que persistem o nome oficial da trilha.
-- Reaplica a função de confirmação sem alterar concessões ou históricos existentes.
CREATE OR REPLACE FUNCTION public.confirm_character_estrategista(p_operation_id uuid,p_character_id uuid,p_request jsonb)
RETURNS public.character_activity_events LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE ficha public.characters; receipt public.character_activity_events; budget jsonb;
 fingerprint text; targets uuid[]; target_id uuid; cost integer; temporary_before integer; temporary_used integer;
BEGIN
 IF p_operation_id IS NULL OR jsonb_typeof(p_request) IS DISTINCT FROM 'object'
 OR octet_length(p_request::text)>8192 OR p_request->'standardActionConfirmed' IS DISTINCT FROM 'true'::jsonb
 OR p_request->'rangeConfirmed' IS DISTINCT FROM 'true'::jsonb
 OR jsonb_typeof(p_request->'targets') IS DISTINCT FROM 'array' THEN
  RAISE EXCEPTION 'Confirme ação padrão, alcance e aliados.' USING ERRCODE='22023'; END IF;
 fingerprint:=md5(jsonb_build_array(p_character_id,p_request)::text);
 PERFORM pg_advisory_xact_lock(hashtextextended(p_operation_id::text,0));
 PERFORM public.lock_character_pe_turn(p_character_id);
 SELECT * INTO receipt FROM public.character_activity_events WHERE operation_id=p_operation_id;
 IF FOUND THEN
  IF receipt.author_id<>auth.uid() OR receipt.request_hash<>fingerprint THEN
   RAISE EXCEPTION 'Operação reutilizada.' USING ERRCODE='23505'; END IF;
  RETURN receipt;
 END IF;
 SELECT * INTO ficha FROM public.characters WHERE id=p_character_id FOR UPDATE;
 IF NOT FOUND OR lower(ficha.class) IS DISTINCT FROM 'combatente'
 OR COALESCE(public.creation_identifier(ficha.class_track),'') NOT IN ('comandante-campo','comandante-de-campo') OR ficha.nex<40 THEN
  RAISE EXCEPTION 'Estrategista indisponível nesta ficha.' USING ERRCODE='55004'; END IF;
 IF ficha.intellect NOT BETWEEN 0 AND 5 OR p_request->>'expectedPE' IS DISTINCT FROM ficha.pe_current::text
 OR p_request->>'expectedIntellect' IS DISTINCT FROM ficha.intellect::text
 OR p_request->>'expectedNex' IS DISTINCT FROM ficha.nex::text THEN
  RAISE EXCEPTION 'Ficha mudou. Atualize antes de confirmar.' USING ERRCODE='40001'; END IF;
 SELECT array_agg(value::uuid) INTO targets FROM jsonb_array_elements_text(p_request->'targets') value
 WHERE value ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
 cost:=coalesce(array_length(targets,1),0);
 IF cost<1 OR cost>ficha.intellect OR cost<>jsonb_array_length(p_request->'targets')
 OR (SELECT count(DISTINCT value) FROM unnest(targets) value)<>cost
 OR p_character_id=ANY(targets) THEN
  RAISE EXCEPTION 'Escolha aliados distintos até o limite de Intelecto.' USING ERRCODE='22023'; END IF;
 FOREACH target_id IN ARRAY targets LOOP
  IF NOT EXISTS(SELECT 1 FROM public.get_character_estrategista_targets(p_character_id) eligible WHERE eligible.id=target_id) THEN
   RAISE EXCEPTION 'Aliado não está vinculado à mesma campanha.' USING ERRCODE='42501'; END IF;
 END LOOP;
 budget:=public.get_character_pe_budget(p_character_id);
 IF p_request->>'expectedTurnKey' IS DISTINCT FROM budget->>'key' THEN
  RAISE EXCEPTION 'Turno mudou. Atualize antes de confirmar.' USING ERRCODE='40001'; END IF;
 SELECT coalesce(sum(remaining),0)::integer INTO temporary_before FROM public.character_temporary_resources
 WHERE character_id=p_character_id AND resource='pe';
 IF ficha.pe_current+temporary_before<cost THEN RAISE EXCEPTION 'PE insuficiente.' USING ERRCODE='22023'; END IF;
 temporary_used:=public.consume_temporary_resource(p_character_id,'pe',cost);
 UPDATE public.characters SET pe_current=pe_current-cost+temporary_used WHERE id=p_character_id;
 INSERT INTO public.character_activity_events(id,operation_id,character_id,author_id,category,status,payload,request_hash)
 VALUES(p_operation_id,p_operation_id,p_character_id,auth.uid(),'application','confirmed',
  jsonb_build_object('kind','estrategista','targetIds',to_jsonb(targets),
   'targetNames',(SELECT jsonb_agg(c.name ORDER BY c.name) FROM public.characters c WHERE c.id=ANY(targets)),
   'targetCount',cost,
   'range',CASE WHEN ficha.nex>=65 THEN 'medio' ELSE 'curto' END,'actionCost','padrão',
   'effect','uma ação de movimento adicional no próximo turno de cada aliado',
   'peCost',cost,'peBefore',ficha.pe_current,'peAfter',ficha.pe_current-cost+temporary_used,
   'temporaryPEUsed',temporary_used,'targetStatus','pending_next_turn'),fingerprint)
 RETURNING * INTO receipt;
 INSERT INTO public.character_estrategista_grants(operation_id,source_character_id,target_character_id)
 SELECT receipt.id,p_character_id,value FROM unnest(targets) value;
 RETURN public.record_ritual_pe_budget(receipt.id,budget,cost,'ability',false);
END $$;
REVOKE ALL ON FUNCTION public.confirm_character_estrategista(uuid,uuid,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.confirm_character_estrategista(uuid,uuid,jsonb) TO authenticated;
