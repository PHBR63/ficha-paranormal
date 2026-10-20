-- Livro Base v1.3, p. 31. Um efeito registrado enquanto o turno manual do
-- médico estava ativo pode ser atribuído a ele pelo mestre da campanha.
-- O carimbo nasce com o evento: avançar o turno nunca recria autoria passada.
CREATE FUNCTION public.stamp_resgate_manual_context()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE contexts jsonb;
BEGIN
 SELECT coalesce(jsonb_agg(context),'[]'::jsonb) INTO contexts FROM (
  SELECT DISTINCT jsonb_build_object('doctorId',doctor.id,'turnKey',
   'manual:'||doctor.id||':'||manual.turn_number,'campaignId',link.campaign_id,
   'campaignVersion',link.version) AS context
  FROM (
   SELECT target.campaign_id,'v1'::text AS version, target.character_id,target.user_id
   FROM public.campaign_members target WHERE target.character_id=NEW.character_id
   UNION ALL
   SELECT target.campaign_id,'v2'::text, target.character_id,target.user_id
   FROM public.campaign_members_v2 target WHERE target.character_id=NEW.character_id
  ) link
  JOIN public.characters target_owner ON target_owner.id=link.character_id
   AND target_owner.user_id=link.user_id
  JOIN public.characters doctor ON doctor.id<>NEW.character_id
   AND lower(doctor.class)='especialista' AND doctor.nex>=65
   AND public.creation_identifier(doctor.class_track) IN ('medico-de-campo','medico-campo')
  JOIN public.character_manual_turns manual ON manual.character_id=doctor.id
   AND manual.active AND manual.turn_number>0
  WHERE (NEW.campaign_id IS NULL OR NEW.campaign_id=link.campaign_id)
   AND (NEW.campaign_version IS NULL OR NEW.campaign_version=link.version)
   AND NOT EXISTS(SELECT 1 FROM public.campaign_members_v2 active_member
    JOIN public.campaign_combat_state_v2 active_combat
     ON active_combat.campaign_id=active_member.campaign_id
    WHERE active_member.character_id=doctor.id
     AND active_combat.state->'active'='true'::jsonb)
   AND ((link.version='v1' AND EXISTS(SELECT 1 FROM public.campaign_members member
     WHERE member.campaign_id=link.campaign_id AND member.character_id=doctor.id
      AND member.user_id=doctor.user_id))
   OR (link.version='v2' AND EXISTS(SELECT 1 FROM public.campaign_members_v2 member
     WHERE member.campaign_id=link.campaign_id AND member.character_id=doctor.id
      AND member.user_id=doctor.user_id)
    AND NOT EXISTS(SELECT 1 FROM public.campaign_combat_state_v2 combat
     WHERE combat.campaign_id=link.campaign_id AND combat.state->'active'='true'::jsonb)))
 ) stamped;
 IF jsonb_array_length(contexts)>0 THEN
  NEW.payload:=NEW.payload||jsonb_build_object('resgateManualContexts',contexts);
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.stamp_resgate_manual_context() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER stamp_resgate_manual_context BEFORE INSERT ON public.character_activity_events
 FOR EACH ROW WHEN (NEW.category='application' AND NEW.payload->>'kind' IN
  ('resource','resources','heal','replace_conditions'))
 EXECUTE FUNCTION public.stamp_resgate_manual_context();

-- Mantém a consulta de combate existente e acrescenta candidatos manuais
-- apenas para campanhas em que a conta atual é mestre.
ALTER FUNCTION public.get_character_resgate_review_options(uuid)
 RENAME TO get_character_resgate_review_options_combat_core;
REVOKE ALL ON FUNCTION public.get_character_resgate_review_options_combat_core(uuid)
 FROM PUBLIC,anon,authenticated;
CREATE FUNCTION public.get_character_resgate_review_options(p_character_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE budget jsonb; events jsonb;
BEGIN
 IF NOT public.can_manage_character_activity(p_character_id) THEN
  RAISE EXCEPTION 'Ficha não autorizada.' USING ERRCODE='42501'; END IF;
 budget:=public.get_character_pe_budget(p_character_id);
 IF budget->>'mode'<>'manual' THEN
  RETURN public.get_character_resgate_review_options_combat_core(p_character_id);
 END IF;
 SELECT coalesce(jsonb_agg(jsonb_build_object('id',candidate.id,
  'targetId',candidate.target_id,'targetName',candidate.target_name,
  'effect',public.resgate_review_effect_label(candidate.payload),
  'createdAt',candidate.created_at,'campaignId',candidate.campaign_id,
  'campaignVersion',candidate.version) ORDER BY candidate.created_at DESC),'[]'::jsonb)
 INTO events FROM (
  SELECT event.id,event.character_id AS target_id,target.name AS target_name,
   event.payload,event.created_at,(context->>'campaignId')::uuid AS campaign_id,
   context->>'campaignVersion' AS version
  FROM public.character_activity_events event
  JOIN public.characters target ON target.id=event.character_id
  CROSS JOIN LATERAL jsonb_array_elements(coalesce(event.payload->'resgateManualContexts','[]'::jsonb)) context
  WHERE event.status='confirmed' AND event.character_id<>p_character_id
   AND context->>'doctorId'=p_character_id::text
   AND context->>'turnKey'=budget->>'key'
   AND public.resgate_reviewable_effect(event.payload)
   AND (event.payload->>'castEventId' IS NULL OR EXISTS(
    SELECT 1 FROM public.character_activity_events cast_event
    WHERE cast_event.id::text=event.payload->>'castEventId'
     AND cast_event.character_id=p_character_id))
   AND ((context->>'campaignVersion'='v1' AND
     public.is_campaign_master(auth.uid(),(context->>'campaignId')::uuid))
    OR (context->>'campaignVersion'='v2' AND
     public.is_campaign_master_v2(auth.uid(),(context->>'campaignId')::uuid)))
   AND NOT EXISTS(SELECT 1 FROM public.character_resgate_defense_grants grant_row
    WHERE grant_row.reviewed_source_event_id=event.id)
  ORDER BY event.created_at DESC LIMIT 20
 ) candidate;
 RETURN jsonb_build_object('canReview',
  EXISTS(SELECT 1 FROM public.campaign_members member WHERE member.character_id=p_character_id
   AND public.is_campaign_master(auth.uid(),member.campaign_id))
  OR EXISTS(SELECT 1 FROM public.campaign_members_v2 member WHERE member.character_id=p_character_id
   AND public.is_campaign_master_v2(auth.uid(),member.campaign_id)),
  'events',events);
END $$;
REVOKE ALL ON FUNCTION public.get_character_resgate_review_options(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_character_resgate_review_options(uuid) TO authenticated;

-- Atribui a origem já aplicada, salva os dois históricos e concede a Defesa
-- pelo turno manual corrente. A chave de origem impede concessão duplicada.
CREATE FUNCTION public.confirm_character_resgate_manual_review(
 p_operation_id uuid,p_character_id uuid,p_request jsonb)
RETURNS public.character_activity_events LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE receipt public.character_activity_events; effect public.character_activity_events;
 source public.characters; budget jsonb; options jsonb; context jsonb;
 fingerprint text; effect_id uuid; target_id uuid; review_campaign_id uuid; version text;
 target_event_id uuid;
BEGIN
 IF NOT public.can_manage_character_activity(p_character_id) THEN
  RAISE EXCEPTION 'Ficha não autorizada.' USING ERRCODE='42501'; END IF;
 IF p_operation_id IS NULL OR jsonb_typeof(p_request) IS DISTINCT FROM 'object'
  OR octet_length(p_request::text)>1536 OR p_request->'masterConfirmed' IS DISTINCT FROM 'true'::jsonb
  OR coalesce((p_request->>'sourceEventId') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',true)
  OR coalesce((p_request->>'targetId') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',true)
  OR coalesce((p_request->>'campaignId') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',true)
  OR coalesce(p_request->>'campaignVersion','') NOT IN ('v1','v2')
  OR coalesce((p_request->>'expectedTurnKey')='',true) THEN
  RAISE EXCEPTION 'Confirme o efeito, a campanha e o turno manual.' USING ERRCODE='22023'; END IF;
 effect_id:=(p_request->>'sourceEventId')::uuid;
 target_id:=(p_request->>'targetId')::uuid;
 review_campaign_id:=(p_request->>'campaignId')::uuid;
 version:=p_request->>'campaignVersion';
 fingerprint:=md5(jsonb_build_array('resgate-manual-review',p_character_id,p_request)::text);
 PERFORM pg_advisory_xact_lock(hashtextextended(p_operation_id::text,0));
 PERFORM public.lock_character_pe_turn(p_character_id);
 SELECT * INTO receipt FROM public.character_activity_events WHERE operation_id=p_operation_id;
 IF FOUND THEN
  IF receipt.author_id<>auth.uid() OR receipt.character_id<>p_character_id
   OR receipt.request_hash<>fingerprint THEN
   RAISE EXCEPTION 'Operação reutilizada.' USING ERRCODE='23505'; END IF;
  RETURN receipt;
 END IF;
 budget:=public.get_character_pe_budget(p_character_id);
 IF budget->>'mode'<>'manual' OR budget->>'key' IS DISTINCT FROM p_request->>'expectedTurnKey' THEN
  RAISE EXCEPTION 'Turno manual do médico mudou.' USING ERRCODE='40001'; END IF;
 IF NOT ((version='v1' AND public.is_campaign_master(auth.uid(),review_campaign_id))
  OR (version='v2' AND public.is_campaign_master_v2(auth.uid(),review_campaign_id))) THEN
  RAISE EXCEPTION 'Somente o mestre vinculado confirma esta fonte.' USING ERRCODE='42501'; END IF;
 SELECT * INTO source FROM public.characters WHERE id=p_character_id;
 options:=public.get_character_paramedico_options(p_character_id);
 IF lower(source.class)<>'especialista' OR source.nex<65
  OR public.creation_identifier(source.class_track) NOT IN ('medico-de-campo','medico-campo')
  OR options->'trained' IS DISTINCT FROM 'true'::jsonb
  OR options->'medicalKit' IS DISTINCT FROM 'true'::jsonb THEN
  RAISE EXCEPTION 'Resgate exige Médico de Campo NEX 65%%, Medicina e kit.' USING ERRCODE='55004'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.get_character_estrategista_targets(p_character_id) linked
  WHERE linked.id=target_id) THEN
  RAISE EXCEPTION 'Alvo não vinculado ao médico.' USING ERRCODE='42501'; END IF;
 IF NOT ((version='v1' AND EXISTS(
   SELECT 1 FROM public.campaign_members doctor
   JOIN public.campaign_members target ON target.campaign_id=doctor.campaign_id
   WHERE doctor.campaign_id=review_campaign_id AND doctor.character_id=p_character_id
    AND doctor.user_id=source.user_id AND target.character_id=target_id
    AND target.user_id=(SELECT user_id FROM public.characters WHERE id=target_id)))
  OR (version='v2' AND EXISTS(
   SELECT 1 FROM public.campaign_members_v2 doctor
   JOIN public.campaign_members_v2 target ON target.campaign_id=doctor.campaign_id
   WHERE doctor.campaign_id=review_campaign_id AND doctor.character_id=p_character_id
    AND doctor.user_id=source.user_id AND target.character_id=target_id
    AND target.user_id=(SELECT user_id FROM public.characters WHERE id=target_id)))) THEN
  RAISE EXCEPTION 'Fichas fora desta campanha.' USING ERRCODE='42501'; END IF;
 SELECT * INTO effect FROM public.character_activity_events WHERE id=effect_id FOR UPDATE;
 IF NOT FOUND OR effect.status<>'confirmed' OR effect.character_id<>target_id
  OR NOT public.resgate_reviewable_effect(effect.payload) THEN
  RAISE EXCEPTION 'Cura ou remoção não confirmada.' USING ERRCODE='55004'; END IF;
 IF effect.payload->>'castEventId' IS NOT NULL AND NOT EXISTS(
  SELECT 1 FROM public.character_activity_events cast_event
  WHERE cast_event.id::text=effect.payload->>'castEventId'
   AND cast_event.character_id=p_character_id) THEN
  RAISE EXCEPTION 'A conjuração pertence a outra ficha.' USING ERRCODE='55004'; END IF;
 SELECT value INTO context FROM jsonb_array_elements(
  coalesce(effect.payload->'resgateManualContexts','[]'::jsonb)) value
 WHERE value->>'doctorId'=p_character_id::text AND value->>'turnKey'=budget->>'key'
  AND value->>'campaignId'=review_campaign_id::text AND value->>'campaignVersion'=version LIMIT 1;
 IF context IS NULL THEN
  RAISE EXCEPTION 'Efeito não ocorreu neste turno manual do médico.' USING ERRCODE='55004'; END IF;
 IF EXISTS(SELECT 1 FROM public.character_resgate_defense_grants
  WHERE reviewed_source_event_id=effect_id) THEN
  RAISE EXCEPTION 'Este efeito já concedeu Resgate.' USING ERRCODE='55004'; END IF;
 target_event_id:=gen_random_uuid();
 INSERT INTO public.character_activity_events(id,operation_id,character_id,author_id,category,status,payload,
  request_hash,campaign_id,campaign_version)
 VALUES(p_operation_id,p_operation_id,p_character_id,auth.uid(),'application','confirmed',
  jsonb_build_object('kind','resgate_defense_review','sourceEventId',effect_id,
   'targetId',target_id,'targetEventId',target_event_id,'bonus',5,
   'duration','até o início do próximo turno do médico','masterConfirmed',true),
  fingerprint,review_campaign_id,version) RETURNING * INTO receipt;
 INSERT INTO public.character_activity_events(id,operation_id,character_id,author_id,category,status,payload,
  request_hash,campaign_id,campaign_version)
 VALUES(target_event_id,target_event_id,target_id,auth.uid(),'application','confirmed',
  jsonb_build_object('kind','resgate_defense_received','sourceCharacterId',p_character_id,
   'sourceEventId',effect_id,'bonus',5,'duration','até o início do próximo turno do médico'),
  md5(target_event_id::text),review_campaign_id,version);
 PERFORM public.grant_character_resgate_defense(receipt.id,p_character_id,target_id,budget);
 UPDATE public.character_resgate_defense_grants SET reviewed_source_event_id=effect_id
  WHERE operation_id=receipt.id;
 RETURN receipt;
END $$;
REVOKE ALL ON FUNCTION public.confirm_character_resgate_manual_review(uuid,uuid,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.confirm_character_resgate_manual_review(uuid,uuid,jsonb) TO authenticated;
