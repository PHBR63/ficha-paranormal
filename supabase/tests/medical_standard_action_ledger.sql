-- Executar junto à migration nova dentro de BEGIN/ROLLBACK. Nenhum dado persiste.
INSERT INTO auth.users(id) VALUES
 ('a1950000-0000-4000-8000-000000000001'),
 ('a1950000-0000-4000-8000-000000000002'),
 ('a1950000-0000-4000-8000-000000000003');
INSERT INTO public.characters(id,user_id,name,origin,class,class_track,nex,intellect,
 hp_current,hp_max,pe_current,pe_max,san_current,san_max,skills,inventory,conditions)
VALUES
 ('a1950000-0000-4000-8000-000000000011','a1950000-0000-4000-8000-000000000002',
 'QA Ações Médicas','Agente de Saúde','Especialista','medico-campo',65,2,5,30,10,15,20,20,
 '{"medicina":1}','[{"id":"kit-qa","catalogId":"kit_pericia","name":"Kit de Medicina",
 "accessoryConfiguration":{"kitSkill":"medicina"}}]','[]'),
 ('a1950000-0000-4000-8000-000000000012','a1950000-0000-4000-8000-000000000003',
 'QA Aliado Médico','Militar','Combatente',NULL,10,1,5,20,5,5,10,10,'{}','[]',
 '[{"id":"abalado","name":"Abalado"}]');
INSERT INTO public.campaigns_v2(id,master_id,name)
VALUES('a1950000-0000-4000-8000-000000000020','a1950000-0000-4000-8000-000000000001','QA Ações Médicas');
INSERT INTO public.campaign_members_v2(campaign_id,user_id,character_id,role) VALUES
 ('a1950000-0000-4000-8000-000000000020','a1950000-0000-4000-8000-000000000002','a1950000-0000-4000-8000-000000000011','player'),
 ('a1950000-0000-4000-8000-000000000020','a1950000-0000-4000-8000-000000000003','a1950000-0000-4000-8000-000000000012','player');
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','a1950000-0000-4000-8000-000000000001',true);
SELECT public.save_campaign_combat_v2('a1950000-0000-4000-8000-000000000020',0,
 jsonb_build_object('active',true,'round',1,'currentTurnIndex',0,'combatants',jsonb_build_array(
  jsonb_build_object('id','a1950000-0000-4000-8000-000000000011','name','Médico','initiative',20),
  jsonb_build_object('id','a1950000-0000-4000-8000-000000000012','name','Aliado','initiative',10))));
SELECT set_config('request.jwt.claim.sub','a1950000-0000-4000-8000-000000000002',true);
DO $$
DECLARE medic uuid:='a1950000-0000-4000-8000-000000000011';
 ally uuid:='a1950000-0000-4000-8000-000000000012';
 campaign uuid:='a1950000-0000-4000-8000-000000000020';
 budget jsonb; status jsonb; options jsonb; snapshot jsonb; request jsonb;
 receipt public.character_activity_events; grant_receipt public.character_activity_events;
 hp_after integer; turn_key text;
BEGIN
 status:=public.get_character_medical_action_status(medic);
 IF status->>'tracked'<>'true' OR status->>'available'<>'1' THEN
  RAISE EXCEPTION 'Ação inicial indisponível.'; END IF;
 budget:=public.get_character_pe_budget(medic);
 request:=jsonb_build_object('targetId',medic,'extraDice',0,'standardActionConfirmed',true,
  'expectedPE',10,'expectedNex',65,'expectedTargetHP',5,'expectedTurnKey',budget->>'key');
 receipt:=public.confirm_character_paramedico('a1950000-0000-4000-8000-000000000031',medic,request);
 hp_after:=(SELECT hp_current FROM public.characters WHERE id=medic);
 IF receipt.payload#>>'{medicalAction,spentAfter}'<>'1'
  OR public.get_character_medical_action_status(medic)->>'available'<>'0'
  OR (SELECT pe_current FROM public.characters WHERE id=medic)<>8 THEN
  RAISE EXCEPTION 'Cura não consumiu ação médica e PE uma vez.'; END IF;
 IF (public.confirm_character_paramedico(receipt.id,medic,request)).id<>receipt.id
  OR public.get_character_medical_action_status(medic)->>'spent'<>'1' THEN
  RAISE EXCEPTION 'Reenvio duplicou ação médica.'; END IF;
 options:=public.get_character_equipe_trauma_options(medic);
 SELECT target->'conditionsSnapshot' INTO snapshot FROM jsonb_array_elements(options->'targets') target
  WHERE target->>'id'=ally::text;
 request:=jsonb_build_object('targetId',ally,'conditionId','abalado',
  'standardActionConfirmed',true,'adjacencyConfirmed',true,'expectedTargetConditions',snapshot,
  'expectedPE',8,'expectedNex',65,'expectedTurnKey',budget->>'key');
 BEGIN
  PERFORM public.confirm_character_equipe_trauma('a1950000-0000-4000-8000-000000000032',medic,request);
  RAISE EXCEPTION 'Segunda ação padrão médica foi aceita sem ação extra.';
 EXCEPTION WHEN SQLSTATE '55004' THEN NULL; END;
 IF (SELECT pe_current FROM public.characters WHERE id=medic)<>8
  OR (SELECT conditions FROM public.characters WHERE id=ally)<>snapshot
  OR EXISTS(SELECT 1 FROM public.character_activity_events
   WHERE operation_id='a1950000-0000-4000-8000-000000000032') THEN
  RAISE EXCEPTION 'Rejeição deixou PE, condição ou histórico parcial.'; END IF;
 turn_key:=public.get_character_medical_action_status(medic)->>'turnKey';
 PERFORM set_config('request.jwt.claim.sub','a1950000-0000-4000-8000-000000000003',true);
 BEGIN
  PERFORM public.confirm_character_medical_extra_action(gen_random_uuid(),campaign,medic,turn_key,'Habilidade QA');
  RAISE EXCEPTION 'Jogador concedeu ação extra.';
 EXCEPTION WHEN SQLSTATE '42501' THEN NULL; END;
 PERFORM set_config('request.jwt.claim.sub','a1950000-0000-4000-8000-000000000001',true);
 grant_receipt:=public.confirm_character_medical_extra_action(
  'a1950000-0000-4000-8000-000000000033',campaign,medic,turn_key,'Habilidade QA');
 IF public.get_character_medical_action_status(medic)->>'available'<>'1'
  OR (public.confirm_character_medical_extra_action(grant_receipt.id,campaign,medic,turn_key,'Habilidade QA')).id<>grant_receipt.id THEN
  RAISE EXCEPTION 'Concessão do mestre ausente ou duplicada.'; END IF;
 PERFORM set_config('request.jwt.claim.sub','a1950000-0000-4000-8000-000000000002',true);
 receipt:=public.confirm_character_equipe_trauma('a1950000-0000-4000-8000-000000000034',medic,request);
 IF receipt.payload#>>'{medicalAction,spentAfter}'<>'2'
  OR (SELECT pe_current FROM public.characters WHERE id=medic)<>6
  OR public.get_character_medical_action_status(medic)->>'available'<>'0' THEN
  RAISE EXCEPTION 'Ação extra não liberou Equipe de Trauma.'; END IF;
 PERFORM set_config('request.jwt.claim.sub','a1950000-0000-4000-8000-000000000001',true);
 PERFORM public.save_campaign_combat_v2(campaign,1,
  jsonb_build_object('active',true,'round',1,'currentTurnIndex',1,'combatants',jsonb_build_array(
   jsonb_build_object('id',medic,'name','Médico','initiative',20),
   jsonb_build_object('id',ally,'name','Aliado','initiative',10))));
 IF public.get_character_medical_action_status(medic)->>'available'<>'0' THEN
  RAISE EXCEPTION 'Ação médica liberada fora do turno.'; END IF;
 PERFORM public.save_campaign_combat_v2(campaign,2,
  jsonb_build_object('active',true,'round',2,'currentTurnIndex',0,'combatants',jsonb_build_array(
   jsonb_build_object('id',medic,'name','Médico','initiative',20),
   jsonb_build_object('id',ally,'name','Aliado','initiative',10))));
 IF public.get_character_medical_action_status(medic)->>'available'<>'1' THEN
  RAISE EXCEPTION 'Próximo turno não liberou ação padrão médica.'; END IF;
 PERFORM public.save_campaign_combat_v2(campaign,3,
  jsonb_build_object('active',false,'round',2,'currentTurnIndex',0,'combatants',jsonb_build_array(
   jsonb_build_object('id',medic,'name','Médico','initiative',20),
   jsonb_build_object('id',ally,'name','Aliado','initiative',10))));
 PERFORM set_config('request.jwt.claim.sub','a1950000-0000-4000-8000-000000000002',true);
 IF public.get_character_medical_action_status(medic)->>'tracked'<>'false' THEN
  RAISE EXCEPTION 'Combate encerrado ainda criou turno controlado.'; END IF;
 PERFORM public.begin_character_manual_turn(gen_random_uuid(),medic,0);
 IF public.get_character_medical_action_status(medic)->>'available'<>'1' THEN
  RAISE EXCEPTION 'Turno manual não liberou a ação médica.'; END IF;
 PERFORM public.pause_character_manual_turn(gen_random_uuid(),medic,1);
 IF public.get_character_medical_action_status(medic)->>'tracked'<>'false' THEN
  RAISE EXCEPTION 'Pausa manual ainda consumiu ação médica.'; END IF;
END $$;
SELECT 'PASS: ação médica por turno, rollback, reenvio, mestre, turno seguinte, manual e sem controle' AS result;
