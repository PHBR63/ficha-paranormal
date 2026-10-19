-- Executar em transação com ROLLBACK. Usa apenas fichas identificadas como QA.
-- Este teste pressupõe a migration 20261019220000_resgate_other_sources_review
-- e os dados de QA da campanha publicada; não inclui IDs privados no Git.
SELECT set_config('qa.resgate_campaign',campaign.id::text,true),
 set_config('qa.resgate_doctor',doctor.id::text,true),
 set_config('qa.resgate_ally',ally.id::text,true),
 set_config('qa.resgate_master',campaign.master_id::text,true),
 set_config('qa.resgate_ally_user',ally.user_id::text,true)
FROM public.campaigns_v2 campaign
JOIN public.campaign_members_v2 doctor_link ON doctor_link.campaign_id=campaign.id
JOIN public.characters doctor ON doctor.id=doctor_link.character_id AND doctor.user_id=doctor_link.user_id
JOIN public.campaign_members_v2 ally_link ON ally_link.campaign_id=campaign.id
JOIN public.characters ally ON ally.id=ally_link.character_id AND ally.user_id=ally_link.user_id
WHERE campaign.name='[QA] Suporte Médico publicado 19-10'
 AND doctor.name='[QA] Médico publicado 19-10'
 AND ally.name='[QA] Aliado médico publicado 19-10';
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub',current_setting('qa.resgate_master'),true);

DO $$
DECLARE campaign_id uuid:=current_setting('qa.resgate_campaign')::uuid;
 doctor_id uuid:=current_setting('qa.resgate_doctor')::uuid;
 ally_id uuid:=current_setting('qa.resgate_ally')::uuid;
 effect public.character_activity_events; receipt public.character_activity_events;
 options jsonb; budget jsonb; before_conditions jsonb; added_conditions jsonb;
 hp_before integer; hp_maximum integer; operation_id uuid:=gen_random_uuid();
BEGIN
 PERFORM public.save_campaign_combat_v2(campaign_id,0,jsonb_build_object('active',true,
  'round',1,'currentTurnIndex',0,'combatants',jsonb_build_array(
   jsonb_build_object('id',doctor_id,'name','Médico QA','initiative',20),
   jsonb_build_object('id',ally_id,'name','Aliado QA','initiative',10))));
 SELECT hp_current,hp_max,conditions INTO hp_before,hp_maximum,before_conditions
  FROM public.characters WHERE id=ally_id;
 effect:=public.change_character_resource(gen_random_uuid(),ally_id,'hp','delta',1,hp_before,hp_maximum);
 IF effect.payload#>>'{resgateTurnContext,actorId}' IS DISTINCT FROM doctor_id::text THEN
  RAISE EXCEPTION 'Cura não recebeu o turno do médico.'; END IF;
 options:=public.get_character_resgate_review_options(doctor_id);
 IF options->'canReview'<>'true'::jsonb OR jsonb_array_length(options->'events')<>1 THEN
  RAISE EXCEPTION 'Cura efetiva não apareceu para o mestre: %',options; END IF;
 budget:=public.get_character_pe_budget(doctor_id);
 receipt:=public.confirm_character_resgate_review(operation_id,doctor_id,
  jsonb_build_object('sourceEventId',effect.id,'targetId',ally_id,
   'expectedTurnKey',budget->>'key','masterConfirmed',true));
 IF receipt.payload->>'kind'<>'resgate_defense_review' THEN RAISE EXCEPTION 'Recibo incorreto.'; END IF;
 IF (public.get_character_resgate_defense_status(doctor_id)->>'bonus')::integer<>5
  OR (public.get_character_resgate_defense_status(ally_id)->>'bonus')::integer<>5 THEN
  RAISE EXCEPTION 'Defesa não chegou às duas fichas.'; END IF;
 options:=public.get_character_resgate_review_options(doctor_id);
 IF jsonb_array_length(options->'events')<>0 THEN RAISE EXCEPTION 'Origem já concedida reapareceu.'; END IF;
 IF (SELECT count(*) FROM public.character_activity_events WHERE payload->>'sourceEventId'=effect.id::text
  AND payload->>'kind'='resgate_defense_received')<>1 THEN RAISE EXCEPTION 'Histórico do aliado ausente.'; END IF;
 IF (public.confirm_character_resgate_review(operation_id,doctor_id,
  jsonb_build_object('sourceEventId',effect.id,'targetId',ally_id,
   'expectedTurnKey',budget->>'key','masterConfirmed',true))).id<>receipt.id THEN
  RAISE EXCEPTION 'Reenvio não recuperou o mesmo recibo.'; END IF;
 BEGIN
  PERFORM public.confirm_character_resgate_review(gen_random_uuid(),doctor_id,
   jsonb_build_object('sourceEventId',effect.id,'targetId',ally_id,
    'expectedTurnKey',budget->>'key','masterConfirmed',true));
  RAISE EXCEPTION 'Segunda operação reutilizou a cura.';
 EXCEPTION WHEN SQLSTATE '55004' THEN NULL; END;
 PERFORM set_config('request.jwt.claim.sub',current_setting('qa.resgate_ally_user'),true);
 BEGIN
  PERFORM public.get_character_resgate_review_options(doctor_id);
  RAISE EXCEPTION 'Jogador consultou a revisão reservada ao mestre.';
 EXCEPTION WHEN SQLSTATE '42501' THEN NULL; END;
 PERFORM set_config('request.jwt.claim.sub',current_setting('qa.resgate_master'),true);

 -- Cura sem ganho real não habilita o bônus.
 PERFORM public.change_character_resource(gen_random_uuid(),ally_id,'hp','delta',0,hp_before+1,hp_maximum);
 options:=public.get_character_resgate_review_options(doctor_id);
 IF jsonb_array_length(options->'events')<>0 THEN RAISE EXCEPTION 'Cura de zero PV apareceu.'; END IF;

 -- Remoção de condição já registrada é elegível; mera adição não é.
 added_conditions:=before_conditions||jsonb_build_array(jsonb_build_object('id','qa-resgate-test','name','Condição QA'));
 PERFORM public.replace_character_conditions(gen_random_uuid(),ally_id,added_conditions,before_conditions);
 options:=public.get_character_resgate_review_options(doctor_id);
 IF jsonb_array_length(options->'events')<>0 THEN RAISE EXCEPTION 'Adição apareceu como remoção.'; END IF;
 effect:=public.replace_character_conditions(gen_random_uuid(),ally_id,before_conditions,added_conditions);
 options:=public.get_character_resgate_review_options(doctor_id);
 IF jsonb_array_length(options->'events')<>1 OR options->'events'->0->>'effect'<>'Condição removida' THEN
  RAISE EXCEPTION 'Remoção não apareceu para revisão.'; END IF;

 PERFORM public.save_campaign_combat_v2(campaign_id,1,jsonb_build_object('active',true,
  'round',1,'currentTurnIndex',1,'combatants',jsonb_build_array(
   jsonb_build_object('id',doctor_id,'name','Médico QA','initiative',20),
   jsonb_build_object('id',ally_id,'name','Aliado QA','initiative',10))));
 IF (public.get_character_resgate_defense_status(ally_id)->>'bonus')::integer<>5 THEN
  RAISE EXCEPTION 'Defesa expirou antes do próximo turno do médico.'; END IF;
 BEGIN
  PERFORM public.confirm_character_resgate_review(gen_random_uuid(),doctor_id,
   jsonb_build_object('sourceEventId',effect.id,'targetId',ally_id,
    'expectedTurnKey',budget->>'key','masterConfirmed',true));
  RAISE EXCEPTION 'Revisão tardia foi aceita.';
 EXCEPTION WHEN SQLSTATE '40001' THEN NULL; END;
 PERFORM public.save_campaign_combat_v2(campaign_id,2,jsonb_build_object('active',true,
  'round',2,'currentTurnIndex',0,'combatants',jsonb_build_array(
   jsonb_build_object('id',doctor_id,'name','Médico QA','initiative',20),
   jsonb_build_object('id',ally_id,'name','Aliado QA','initiative',10))));
 IF (public.get_character_resgate_defense_status(doctor_id)->>'bonus')::integer<>0
  OR (public.get_character_resgate_defense_status(ally_id)->>'bonus')::integer<>0 THEN
  RAISE EXCEPTION 'Defesa não expirou no próximo turno do médico.'; END IF;
END $$;
