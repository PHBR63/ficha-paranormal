-- Médico de Campo, Livro Base v1.3 p. 31. Ensaio transacional: nenhum dado permanece.
BEGIN;
INSERT INTO auth.users(id) VALUES
 ('a1830000-0000-4000-8000-000000000001'),
 ('a1830000-0000-4000-8000-000000000002'),
 ('a1830000-0000-4000-8000-000000000003'),
 ('a1830000-0000-4000-8000-000000000004');
INSERT INTO public.characters(id,user_id,name,origin,class,class_track,nex,intellect,
 hp_current,hp_max,pe_current,pe_max,san_current,san_max,skills,inventory,conditions)
VALUES
 ('a1830000-0000-4000-8000-000000000011','a1830000-0000-4000-8000-000000000002',
 'QA Médico','Agente de Saúde','Especialista','medico-campo',65,2,20,30,10,15,20,20,
 '{"medicina":1}','[{"id":"kit-qa","catalogId":"kit_pericia","name":"Kit de Medicina",
 "accessoryConfiguration":{"kitSkill":"medicina"}}]','[]'),
 ('a1830000-0000-4000-8000-000000000012','a1830000-0000-4000-8000-000000000003',
 'QA Aliado v2','Militar','Combatente',NULL,10,1,4,20,5,5,10,10,'{}','[]',
 '[{"id":"abalado","name":"Abalado"},{"id":"custom-boon","name":"Bônus personalizado"}]'),
 ('a1830000-0000-4000-8000-000000000013','a1830000-0000-4000-8000-000000000004',
 'QA Aliado v1','Militar','Combatente',NULL,10,1,4,20,5,5,10,10,'{}','[]',
 '[{"id":"fraco","name":"Fraco"}]');
INSERT INTO public.campaigns_v2(id,master_id,name)
VALUES('a1830000-0000-4000-8000-000000000020','a1830000-0000-4000-8000-000000000001','QA Médico v2');
INSERT INTO public.campaign_members_v2(campaign_id,user_id,character_id,role) VALUES
 ('a1830000-0000-4000-8000-000000000020','a1830000-0000-4000-8000-000000000002','a1830000-0000-4000-8000-000000000011','player'),
 ('a1830000-0000-4000-8000-000000000020','a1830000-0000-4000-8000-000000000003','a1830000-0000-4000-8000-000000000012','player');
INSERT INTO public.campaigns(id,master_id,name)
VALUES('a1830000-0000-4000-8000-000000000021','a1830000-0000-4000-8000-000000000001','QA Médico v1');
INSERT INTO public.campaign_members(campaign_id,user_id,character_id,role) VALUES
 ('a1830000-0000-4000-8000-000000000021','a1830000-0000-4000-8000-000000000002','a1830000-0000-4000-8000-000000000011','player'),
 ('a1830000-0000-4000-8000-000000000021','a1830000-0000-4000-8000-000000000004','a1830000-0000-4000-8000-000000000013','player');
DO $$
DECLARE first_key text; other_actor_key text; next_round_key text;
BEGIN
 first_key:=public.character_resgate_control_key('{"mode":"combat","campaignId":"a1830000-0000-4000-8000-000000000020","scene":1,"round":1,"key":"v2:medic"}'::jsonb);
 other_actor_key:=public.character_resgate_control_key('{"mode":"combat","campaignId":"a1830000-0000-4000-8000-000000000020","scene":1,"round":1,"key":"v2:ally"}'::jsonb);
 next_round_key:=public.character_resgate_control_key('{"mode":"combat","campaignId":"a1830000-0000-4000-8000-000000000020","scene":1,"round":2,"key":"v2:ally"}'::jsonb);
 IF first_key IS NULL OR first_key<>other_actor_key OR first_key=next_round_key THEN
  RAISE EXCEPTION 'Resgate não conservou uma única chave por rodada independente do combatente'; END IF;
END $$;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','a1830000-0000-4000-8000-000000000002',true);
DO $$
DECLARE medic uuid:='a1830000-0000-4000-8000-000000000011';
 ally_v2 uuid:='a1830000-0000-4000-8000-000000000012';
 ally_v1 uuid:='a1830000-0000-4000-8000-000000000013';
 options jsonb; snapshot jsonb; budget jsonb; request jsonb;
 receipt public.character_activity_events;
BEGIN
 options:=public.get_character_equipe_trauma_options(medic);
 IF options->>'eligible'<>'true' OR options->>'trained'<>'true' OR options->>'medicalKit'<>'true'
  OR jsonb_array_length(options->'targets')<>2 THEN
  RAISE EXCEPTION 'Requisitos ou vínculos v1/v2 de Equipe de Trauma incorretos'; END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(options->'targets') target,
  jsonb_array_elements(target->'conditions') condition
  WHERE condition->>'id'='custom-boon') THEN
  RAISE EXCEPTION 'Condição personalizada foi oferecida para remoção automática'; END IF;
 SELECT target->'conditionsSnapshot' INTO snapshot FROM jsonb_array_elements(options->'targets') target
  WHERE target->>'id'=ally_v2::text;
 budget:=public.get_character_pe_budget(medic);
 request:=jsonb_build_object('targetId',ally_v2,'conditionId','abalado',
  'standardActionConfirmed',true,'adjacencyConfirmed',true,
  'expectedTargetConditions',snapshot,'expectedPE',10,'expectedNex',65,
  'expectedTurnKey',budget->>'key');
 receipt:=public.confirm_character_equipe_trauma('a1830000-0000-4000-8000-000000000031',medic,request);
 IF (SELECT pe_current FROM public.characters WHERE id=medic)<>8
  OR receipt.payload->'conditionsAfter'<>'[{"id":"custom-boon","name":"Bônus personalizado"}]'::jsonb
  OR receipt.payload->>'targetEventId' IS NULL THEN
  RAISE EXCEPTION 'Equipe de Trauma não removeu apenas a condição selecionada'; END IF;
 IF (public.confirm_character_equipe_trauma(receipt.id,medic,request)).id<>receipt.id
  OR (SELECT pe_current FROM public.characters WHERE id=medic)<>8 THEN
  RAISE EXCEPTION 'Reenvio duplicou o gasto'; END IF;
 BEGIN
  PERFORM public.confirm_character_equipe_trauma(gen_random_uuid(),medic,request);
  RAISE EXCEPTION 'Condição desatualizada foi aceita';
 EXCEPTION WHEN SQLSTATE '40001' THEN NULL; END;
 options:=public.get_character_equipe_trauma_options(medic);
 SELECT target->'conditionsSnapshot' INTO snapshot FROM jsonb_array_elements(options->'targets') target
  WHERE target->>'id'=ally_v1::text;
 request:=jsonb_build_object('targetId',ally_v1,'conditionId','fraco',
  'standardActionConfirmed',true,'adjacencyConfirmed',true,
  'expectedTargetConditions',snapshot,'expectedPE',8,'expectedNex',65,
  'expectedTurnKey',budget->>'key');
 receipt:=public.confirm_character_equipe_trauma('a1830000-0000-4000-8000-000000000032',medic,request);
 IF (SELECT pe_current FROM public.characters WHERE id=medic)<>6
  OR receipt.payload->'conditionsAfter'<>'[]'::jsonb THEN
  RAISE EXCEPTION 'Remoção em campanha v1 ou cobrança falhou'; END IF;
 request:=jsonb_build_object('targetId',ally_v2,'freeActionConfirmed',true,
  'shortRangeConfirmed',true,'normalMovementConfirmed',true,'roundConfirmed',true,
  'expectedNex',65,'expectedTurnKey',budget->>'key');
 receipt:=public.confirm_character_resgate_movement('a1830000-0000-4000-8000-000000000033',medic,request);
 IF receipt.payload->>'kind'<>'resgate_movement'
  OR (SELECT pe_current FROM public.characters WHERE id=medic)<>6 THEN
  RAISE EXCEPTION 'Movimento de Resgate cobrou PE ou não gerou recibo'; END IF;
 PERFORM public.begin_character_manual_turn(gen_random_uuid(),medic,0);
 budget:=public.get_character_pe_budget(medic);
 request:=request||jsonb_build_object('expectedTurnKey',budget->>'key');
 receipt:=public.confirm_character_resgate_movement('a1830000-0000-4000-8000-000000000034',medic,request);
 BEGIN
  PERFORM public.confirm_character_resgate_movement(gen_random_uuid(),medic,request);
  RAISE EXCEPTION 'Resgate foi repetido no mesmo turno controlado';
 EXCEPTION WHEN SQLSTATE '55004' THEN NULL; END;
 request:=jsonb_build_object('targetId',ally_v1,'extraDice',0,'standardActionConfirmed',true,
  'adjacencyConfirmed',true,'expectedPE',6,'expectedNex',65,'expectedTargetHP',4,
  'expectedTurnKey',budget->>'key');
 receipt:=public.confirm_character_paramedico('a1830000-0000-4000-8000-000000000035',medic,request);
 IF (receipt.payload->>'effectiveHealing')::integer<=0
  OR public.get_character_resgate_defense_status(medic)->>'bonus'<>'5' THEN
  RAISE EXCEPTION 'Cura do aliado não ativou a Defesa de Resgate'; END IF;
 PERFORM public.pause_character_manual_turn(gen_random_uuid(),medic,1);
 IF public.get_character_resgate_defense_status(medic)->>'bonus'<>'5' THEN
  RAISE EXCEPTION 'Pausar turno encerrou Resgate antes do próximo turno'; END IF;
 PERFORM public.begin_character_manual_turn(gen_random_uuid(),medic,1);
 IF public.get_character_resgate_defense_status(medic)->>'bonus'<>'0' THEN
  RAISE EXCEPTION 'Resgate não expirou no início do próximo turno'; END IF;
 -- O tracker legado mantém preparação apenas no navegador. Um UUID enviado
 -- pelo cliente sem recibo de preparação do servidor não autoriza uso externo.
 PERFORM set_config('request.jwt.claim.sub','a1830000-0000-4000-8000-000000000001',true);
 PERFORM public.save_campaign_combat_v2('a1830000-0000-4000-8000-000000000020',0,
  jsonb_build_object('active',true,'round',1,'currentTurnIndex',1,'combatants',
   jsonb_build_array(jsonb_build_object('id',medic,'name','QA Médico','initiative',15),
    jsonb_build_object('id',ally_v2,'name','QA Aliado v2','initiative',10))));
 PERFORM set_config('request.jwt.claim.sub','a1830000-0000-4000-8000-000000000002',true);
 budget:=public.get_character_pe_budget(medic);
 request:=jsonb_build_object('targetId',ally_v2,'freeActionConfirmed',true,
  'shortRangeConfirmed',true,'normalMovementConfirmed',true,'roundConfirmed',true,
  'expectedNex',65,'expectedTurnKey',budget->>'key',
  'preparedActionId','a1830000-0000-4000-8000-000000000099','triggerConfirmed',true);
 BEGIN
  PERFORM public.confirm_character_resgate_movement('a1830000-0000-4000-8000-000000000036',medic,request);
  RAISE EXCEPTION 'Preparação não comprovada liberou Resgate fora do turno';
 EXCEPTION WHEN SQLSTATE '55004' THEN NULL; END;
 IF EXISTS(SELECT 1 FROM public.character_activity_events
  WHERE operation_id='a1830000-0000-4000-8000-000000000036') THEN
  RAISE EXCEPTION 'Tentativa preparada rejeitada deixou recibo'; END IF;
 PERFORM set_config('request.jwt.claim.sub','a1830000-0000-4000-8000-000000000003',true);
 UPDATE public.characters SET conditions='[{"id":"abalado","name":"Abalado"}]'::jsonb
  WHERE id=ally_v2;
 PERFORM set_config('request.jwt.claim.sub','a1830000-0000-4000-8000-000000000002',true);
 options:=public.get_character_equipe_trauma_options(medic);
 SELECT target->'conditionsSnapshot' INTO snapshot FROM jsonb_array_elements(options->'targets') target
  WHERE target->>'id'=ally_v2::text;
 request:=jsonb_build_object('targetId',ally_v2,'conditionId','abalado',
  'standardActionConfirmed',true,'adjacencyConfirmed',true,
  'expectedTargetConditions',snapshot,'expectedPE',4,'expectedNex',65,
  'expectedTurnKey',budget->>'key',
  'preparedActionId','a1830000-0000-4000-8000-000000000098','triggerConfirmed',true);
 BEGIN
  PERFORM public.confirm_character_equipe_trauma('a1830000-0000-4000-8000-000000000037',medic,request);
  RAISE EXCEPTION 'Preparação não comprovada liberou Equipe de Trauma fora do turno';
 EXCEPTION WHEN SQLSTATE '55004' THEN NULL; END;
 IF (SELECT pe_current FROM public.characters WHERE id=medic)<>4
  OR EXISTS(SELECT 1 FROM public.character_activity_events
   WHERE operation_id='a1830000-0000-4000-8000-000000000037') THEN
  RAISE EXCEPTION 'Tentativa preparada de Equipe gerou gasto ou recibo'; END IF;
END $$;
ROLLBACK;
SELECT 'PASS: Equipe de Trauma e Resgate, v1/v2, PE, rodada, histórico, reenvio e turno manual' AS result;
