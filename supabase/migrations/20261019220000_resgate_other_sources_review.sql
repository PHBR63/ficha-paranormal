-- Livro Base v1.3, p. 31. Outras fontes de cura/remoção exigem efeito
-- confirmado e atribuição explícita ao médico pelo mestre da campanha.
ALTER TABLE public.character_resgate_defense_grants
 ADD COLUMN reviewed_source_event_id uuid REFERENCES public.character_activity_events(id);
CREATE UNIQUE INDEX character_resgate_reviewed_source_once
 ON public.character_resgate_defense_grants(reviewed_source_event_id)
 WHERE reviewed_source_event_id IS NOT NULL;

-- O contexto é carimbado quando o efeito acontece; horário aproximado ou
-- turno atual no momento da revisão não reconstitui uma ação antiga.
CREATE FUNCTION public.stamp_resgate_effect_turn()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE combat public.campaign_combat_state_v2; matches integer:=0;
BEGIN
 FOR combat IN SELECT state.* FROM public.campaign_combat_state_v2 state
  JOIN public.campaign_members_v2 member ON member.campaign_id=state.campaign_id
  JOIN public.characters target ON target.id=member.character_id AND target.user_id=member.user_id
  WHERE target.id=NEW.character_id AND state.state->'active'='true'::jsonb
   AND (NEW.campaign_id IS NULL OR NEW.campaign_id=state.campaign_id)
   AND (NEW.campaign_version IS NULL OR NEW.campaign_version='v2') LOOP
  matches:=matches+1;
 END LOOP;
 IF matches=1 THEN
  NEW.payload:=NEW.payload||jsonb_build_object('resgateTurnContext',jsonb_build_object(
   'campaignId',combat.campaign_id,'scene',combat.scene_number,
   'turnInstanceId',combat.turn_instance_id,
   'actorId',combat.state->'combatants'->((combat.state->>'currentTurnIndex')::integer)->>'id'));
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.stamp_resgate_effect_turn() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER stamp_resgate_effect_turn BEFORE INSERT ON public.character_activity_events
 FOR EACH ROW WHEN (NEW.category='application' AND NEW.payload->>'kind' IN
  ('resource','resources','heal','replace_conditions'))
 EXECUTE FUNCTION public.stamp_resgate_effect_turn();

-- Aceita somente mudança efetiva, comparando o antes/depois salvos pelo
-- servidor. Trocar metadados de uma condição não equivale a removê-la.
CREATE FUNCTION public.resgate_reviewable_effect(p_payload jsonb)
RETURNS boolean LANGUAGE plpgsql IMMUTABLE SET search_path=public,pg_temp AS $$
DECLARE effect_kind text:=p_payload->>'kind'; before_hp jsonb; after_hp jsonb;
 before_conditions jsonb; after_conditions jsonb; removed boolean:=false;
BEGIN
 IF effect_kind='resource' AND p_payload->>'resource'='hp' THEN
  before_hp:=p_payload#>'{before,current}'; after_hp:=p_payload#>'{after,current}';
 ELSIF effect_kind IN ('resources','heal') THEN
  before_hp:=p_payload#>'{before,hp_current}'; after_hp:=p_payload#>'{after,hp_current}';
 END IF;
 IF jsonb_typeof(before_hp)='number' AND jsonb_typeof(after_hp)='number'
  AND (after_hp::text)::numeric>(before_hp::text)::numeric THEN RETURN true; END IF;
 IF effect_kind NOT IN ('replace_conditions','resources') THEN RETURN false; END IF;
 before_conditions:=p_payload#>'{before,conditions}';
 after_conditions:=p_payload#>'{after,conditions}';
 IF jsonb_typeof(before_conditions) IS DISTINCT FROM 'array'
  OR jsonb_typeof(after_conditions) IS DISTINCT FROM 'array' THEN RETURN false; END IF;
 SELECT EXISTS(SELECT 1 FROM jsonb_array_elements(before_conditions) old_condition
  WHERE NOT EXISTS(SELECT 1 FROM jsonb_array_elements(after_conditions) new_condition
   WHERE public.creation_identifier(coalesce(new_condition->>'id',new_condition#>>'{}'))=
    public.creation_identifier(coalesce(old_condition->>'id',old_condition#>>'{}')))) INTO removed;
 RETURN removed;
END $$;
REVOKE ALL ON FUNCTION public.resgate_reviewable_effect(jsonb) FROM PUBLIC,anon,authenticated;

-- Rótulo curto para o mestre conferir o fato antes de atribuir sua autoria.
CREATE FUNCTION public.resgate_review_effect_label(p_payload jsonb)
RETURNS text LANGUAGE plpgsql IMMUTABLE SET search_path=public,pg_temp AS $$
DECLARE before_hp jsonb; after_hp jsonb;
BEGIN
 IF p_payload->>'kind'='resource' THEN
  before_hp:=p_payload#>'{before,current}'; after_hp:=p_payload#>'{after,current}';
 ELSE
  before_hp:=p_payload#>'{before,hp_current}'; after_hp:=p_payload#>'{after,hp_current}';
 END IF;
 IF jsonb_typeof(before_hp)='number' AND jsonb_typeof(after_hp)='number'
  AND (after_hp::text)::numeric>(before_hp::text)::numeric THEN
  RETURN 'PV '||before_hp::text||' → '||after_hp::text;
 END IF;
 RETURN 'Condição removida';
END $$;
REVOKE ALL ON FUNCTION public.resgate_review_effect_label(jsonb) FROM PUBLIC,anon,authenticated;

-- Somente o mestre vê candidatos da rodada/turno atual do médico. A consulta
-- não declara quem curou; essa atribuição é feita na confirmação abaixo.
CREATE FUNCTION public.get_character_resgate_review_options(p_character_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE budget jsonb; combat public.campaign_combat_state_v2; events jsonb;
BEGIN
 IF NOT public.can_manage_character_activity(p_character_id) THEN
  RAISE EXCEPTION 'Ficha não autorizada.' USING ERRCODE='42501'; END IF;
 budget:=public.get_character_pe_budget(p_character_id);
 IF budget->>'mode'<>'combat' OR budget->>'actorId' IS DISTINCT FROM p_character_id::text
  OR NOT public.is_campaign_master_v2(auth.uid(),(budget->>'campaignId')::uuid) THEN
  RETURN jsonb_build_object('canReview',false,'events','[]'::jsonb); END IF;
 SELECT * INTO combat FROM public.campaign_combat_state_v2
  WHERE campaign_id=(budget->>'campaignId')::uuid;
 SELECT coalesce(jsonb_agg(jsonb_build_object('id',candidate.id,'targetId',candidate.character_id,
  'targetName',candidate.target_name,'effect',public.resgate_review_effect_label(candidate.payload),
  'createdAt',candidate.created_at)
  ORDER BY candidate.created_at DESC),'[]'::jsonb) INTO events
 FROM (SELECT event.id,event.character_id,event.payload,event.created_at,target.name AS target_name
  FROM public.character_activity_events event
  JOIN public.characters target ON target.id=event.character_id
  JOIN public.campaign_members_v2 member ON member.character_id=target.id
   AND member.user_id=target.user_id AND member.campaign_id=combat.campaign_id
  WHERE event.status='confirmed' AND event.character_id<>p_character_id
   AND event.payload#>>'{resgateTurnContext,campaignId}'=combat.campaign_id::text
   AND event.payload#>>'{resgateTurnContext,scene}'=combat.scene_number::text
   AND event.payload#>>'{resgateTurnContext,turnInstanceId}'=combat.turn_instance_id::text
   AND event.payload#>>'{resgateTurnContext,actorId}'=p_character_id::text
   AND public.resgate_reviewable_effect(event.payload)
   AND (event.payload->>'castEventId' IS NULL OR EXISTS(
    SELECT 1 FROM public.character_activity_events cast_event
    WHERE cast_event.id::text=event.payload->>'castEventId'
     AND cast_event.character_id=p_character_id))
   AND NOT EXISTS(SELECT 1 FROM public.character_resgate_defense_grants grant_row
    WHERE grant_row.reviewed_source_event_id=event.id)
  ORDER BY event.created_at DESC LIMIT 20) candidate;
 RETURN jsonb_build_object('canReview',true,'events',events);
END $$;
REVOKE ALL ON FUNCTION public.get_character_resgate_review_options(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_character_resgate_review_options(uuid) TO authenticated;

-- O mestre atribui uma origem já aplicada ao médico. Origem, concessão e
-- históricos das duas fichas são atômicos; não há novo efeito ou gasto de PE.
CREATE FUNCTION public.confirm_character_resgate_review(p_operation_id uuid,p_character_id uuid,p_request jsonb)
RETURNS public.character_activity_events LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE receipt public.character_activity_events; source public.characters;
 effect public.character_activity_events; budget jsonb; combat public.campaign_combat_state_v2;
 options jsonb; fingerprint text; effect_id uuid; target_event_id uuid;
BEGIN
 IF NOT public.can_manage_character_activity(p_character_id) THEN
  RAISE EXCEPTION 'Ficha não autorizada.' USING ERRCODE='42501'; END IF;
 IF p_operation_id IS NULL OR jsonb_typeof(p_request) IS DISTINCT FROM 'object'
  OR octet_length(p_request::text)>1024 OR p_request->'masterConfirmed' IS DISTINCT FROM 'true'::jsonb
  OR coalesce((p_request->>'sourceEventId') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',true)
  OR coalesce((p_request->>'targetId') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',true)
  OR coalesce((p_request->>'expectedTurnKey')='',true) THEN
  RAISE EXCEPTION 'Confirme o efeito e o turno antes de conceder Resgate.' USING ERRCODE='22023'; END IF;
 effect_id:=(p_request->>'sourceEventId')::uuid;
 fingerprint:=md5(jsonb_build_array('resgate-review',p_character_id,p_request)::text);
 PERFORM pg_advisory_xact_lock(hashtextextended(p_operation_id::text,0));
 SELECT * INTO receipt FROM public.character_activity_events WHERE operation_id=p_operation_id;
 IF FOUND THEN
  IF receipt.author_id<>auth.uid() OR receipt.character_id<>p_character_id
   OR receipt.request_hash<>fingerprint THEN
   RAISE EXCEPTION 'Operação reutilizada.' USING ERRCODE='23505'; END IF;
  RETURN receipt;
 END IF;
 budget:=public.get_character_pe_budget(p_character_id);
 IF budget->>'mode'<>'combat' OR budget->>'actorId' IS DISTINCT FROM p_character_id::text
  OR p_request->>'expectedTurnKey' IS DISTINCT FROM budget->>'key' THEN
  RAISE EXCEPTION 'Turno do médico mudou. Revise o efeito com a mesa.' USING ERRCODE='40001'; END IF;
 IF NOT public.is_campaign_master_v2(auth.uid(),(budget->>'campaignId')::uuid) THEN
  RAISE EXCEPTION 'Somente o mestre vinculado pode confirmar esta fonte.' USING ERRCODE='42501'; END IF;
 SELECT * INTO combat FROM public.campaign_combat_state_v2
  WHERE campaign_id=(budget->>'campaignId')::uuid;
 SELECT * INTO source FROM public.characters WHERE id=p_character_id;
 IF lower(source.class)<>'especialista' OR source.nex<65
  OR public.creation_identifier(source.class_track) NOT IN ('medico-de-campo','medico-campo') THEN
  RAISE EXCEPTION 'Resgate exige Médico de Campo NEX 65%%.' USING ERRCODE='55004'; END IF;
 options:=public.get_character_paramedico_options(p_character_id);
 IF options->'trained' IS DISTINCT FROM 'true'::jsonb
  OR options->'medicalKit' IS DISTINCT FROM 'true'::jsonb THEN
  RAISE EXCEPTION 'Resgate exige Medicina treinada e kit de Medicina.' USING ERRCODE='55004'; END IF;
 SELECT * INTO effect FROM public.character_activity_events WHERE id=effect_id;
 IF NOT FOUND OR effect.status<>'confirmed' OR effect.character_id=p_character_id
  OR effect.character_id::text IS DISTINCT FROM p_request->>'targetId'
  OR NOT public.resgate_reviewable_effect(effect.payload)
  OR effect.payload#>>'{resgateTurnContext,campaignId}' IS DISTINCT FROM combat.campaign_id::text
  OR effect.payload#>>'{resgateTurnContext,scene}' IS DISTINCT FROM combat.scene_number::text
  OR effect.payload#>>'{resgateTurnContext,turnInstanceId}' IS DISTINCT FROM combat.turn_instance_id::text
  OR effect.payload#>>'{resgateTurnContext,actorId}' IS DISTINCT FROM p_character_id::text THEN
  RAISE EXCEPTION 'Efeito não confirmado neste turno do médico.' USING ERRCODE='55004'; END IF;
 IF effect.payload->>'castEventId' IS NOT NULL AND NOT EXISTS(
  SELECT 1 FROM public.character_activity_events cast_event
  WHERE cast_event.id::text=effect.payload->>'castEventId'
   AND cast_event.character_id=p_character_id) THEN
  RAISE EXCEPTION 'A conjuração pertence a outra ficha.' USING ERRCODE='55004'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.get_character_estrategista_targets(p_character_id) linked
  WHERE linked.id=effect.character_id) THEN
  RAISE EXCEPTION 'Alvo não vinculado à campanha do médico.' USING ERRCODE='42501'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.campaign_members_v2 member JOIN public.characters target
  ON target.id=member.character_id AND target.user_id=member.user_id
  WHERE member.campaign_id=combat.campaign_id AND target.id=effect.character_id) THEN
  RAISE EXCEPTION 'Alvo não vinculado a este combate.' USING ERRCODE='42501'; END IF;
 IF EXISTS(SELECT 1 FROM public.character_resgate_defense_grants
  WHERE reviewed_source_event_id=effect_id) THEN
  RAISE EXCEPTION 'Esta cura ou remoção já concedeu Resgate.' USING ERRCODE='55004'; END IF;
 target_event_id:=gen_random_uuid();
 INSERT INTO public.character_activity_events(id,operation_id,character_id,author_id,category,status,payload,request_hash,campaign_id,campaign_version)
 VALUES(p_operation_id,p_operation_id,p_character_id,auth.uid(),'application','confirmed',
  jsonb_build_object('kind','resgate_defense_review','sourceEventId',effect_id,
   'targetId',effect.character_id,'targetEventId',target_event_id,'bonus',5,
   'duration','até o início do próximo turno do médico','masterConfirmed',true),
  fingerprint,combat.campaign_id,'v2') RETURNING * INTO receipt;
 INSERT INTO public.character_activity_events(id,operation_id,character_id,author_id,category,status,payload,request_hash,campaign_id,campaign_version)
 VALUES(target_event_id,target_event_id,effect.character_id,auth.uid(),'application','confirmed',
  jsonb_build_object('kind','resgate_defense_received','sourceCharacterId',p_character_id,
   'sourceEventId',effect_id,'bonus',5,'duration','até o início do próximo turno do médico'),
  md5(target_event_id::text),combat.campaign_id,'v2');
 PERFORM public.grant_character_resgate_defense(receipt.id,p_character_id,effect.character_id,budget);
 UPDATE public.character_resgate_defense_grants SET reviewed_source_event_id=effect_id
  WHERE operation_id=receipt.id;
 RETURN receipt;
END $$;
REVOKE ALL ON FUNCTION public.confirm_character_resgate_review(uuid,uuid,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.confirm_character_resgate_review(uuid,uuid,jsonb) TO authenticated;
