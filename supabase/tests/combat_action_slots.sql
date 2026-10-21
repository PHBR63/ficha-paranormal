-- Fixture transacional: nenhum usuário, gasto ou histórico de QA permanece.
BEGIN;
INSERT INTO auth.users(id) VALUES
 ('a1960000-0000-4000-8000-000000000001'),
 ('a1960000-0000-4000-8000-000000000002');
INSERT INTO public.characters(id,user_id,name,origin,class,class_track,nex,
 hp_current,hp_max,pe_current,pe_max,san_current,san_max,skills,inventory)
VALUES('a1960000-0000-4000-8000-000000000011','a1960000-0000-4000-8000-000000000002',
 'QA ações v2','Agente de Saúde','Especialista','atirador-elite',65,5,20,20,20,20,20,
 '{"pontaria":1,"medicina":1}',
 '[{"id":"arma-qa","name":"Fuzil QA","itemType":"weapon","type":"Disparo", "ammoType":"balas_longas","isEquipped":true},
 {"id":"kit-qa","catalogId":"kit_pericia","name":"Kit de Medicina","accessoryConfiguration":{"kitSkill":"medicina"}}]');
INSERT INTO public.campaigns_v2(id,master_id,name)
VALUES('a1960000-0000-4000-8000-000000000020','a1960000-0000-4000-8000-000000000001','QA slots');
INSERT INTO public.campaign_members_v2(campaign_id,user_id,character_id,role)
VALUES('a1960000-0000-4000-8000-000000000020','a1960000-0000-4000-8000-000000000002',
 'a1960000-0000-4000-8000-000000000011','player');
CREATE FUNCTION pg_temp.qa_action_state(p_character_id uuid) RETURNS jsonb
LANGUAGE sql SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT jsonb_build_object('events',(SELECT count(*) FROM public.character_activity_events
  WHERE character_id=p_character_id),
  'pe',(SELECT pe_current FROM public.characters WHERE id=p_character_id))
$$;
-- Troca apenas a trilha da ficha descartável para provar o mesmo slot médico.
CREATE FUNCTION pg_temp.qa_enable_medic(p_character_id uuid) RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path=public,pg_temp AS $$
 UPDATE public.characters SET class_track='medico-campo' WHERE id=p_character_id
$$;
CREATE FUNCTION pg_temp.qa_enable_occultist(p_character_id uuid) RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path=public,pg_temp AS $$
 UPDATE public.characters SET class='Ocultista',class_track=NULL WHERE id=p_character_id
$$;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','a1960000-0000-4000-8000-000000000001',true);
SELECT public.save_campaign_combat_v2('a1960000-0000-4000-8000-000000000020',0,
 '{"active":true,"round":1,"currentTurnIndex":0,"combatants":[
 {"id":"a1960000-0000-4000-8000-000000000011","name":"Agente","initiative":20},
 {"id":"npc-qa","name":"NPC","initiative":10}]}');
SELECT set_config('request.jwt.claim.sub','a1960000-0000-4000-8000-000000000002',true);
DO $$
DECLARE c uuid:='a1960000-0000-4000-8000-000000000011';
 campaign uuid:='a1960000-0000-4000-8000-000000000020';
 budget jsonb; status jsonb; receipt public.character_activity_events;
 selection jsonb:='{"weaponId":"arma-qa","specialAttackIncrements":0,"sneakAttack":false,
 "lethalShot":false,"techniques":[],"lethalCount":0,"otherPaidBonuses":[]}';
 payload jsonb:='{"entry":{"type":"attack","label":"Ataque QA","results":[12],
 "diceCount":1,"bestResult":12,"skillBonus":5,"otherBonuses":0,"bonus":5,"total":17}}';
 before_state jsonb;
BEGIN
 budget:=public.get_character_pe_budget(c);
 receipt:=public.confirm_character_mirar(gen_random_uuid(),c,budget->>'key','arma-qa');
 status:=public.get_character_turn_action_status(c);
 IF status->>'movementSpent'<>'1' OR status->>'available'<>'1'
  OR receipt.payload#>>'{combatAction,kind}'<>'movement' THEN
  RAISE EXCEPTION 'Mirar não ocupou movimento'; END IF;
 receipt:=public.confirm_character_combat_attack(gen_random_uuid(),c,19,0,budget->>'key',selection,payload);
 status:=public.get_character_medical_action_status(c);
 IF status->>'spent'<>'1' OR status->>'available'<>'0'
  OR receipt.payload#>>'{combatAction,kind}'<>'standard' THEN
  RAISE EXCEPTION 'Ataque não ocupou ação padrão compartilhada'; END IF;
 IF (public.confirm_character_combat_attack(receipt.operation_id,c,19,0,budget->>'key',selection,payload)).id<>receipt.id THEN
  RAISE EXCEPTION 'Retry do ataque falhou'; END IF;
 before_state:=pg_temp.qa_action_state(c);
 BEGIN
  PERFORM public.confirm_character_combat_attack(gen_random_uuid(),c,19,0,budget->>'key',selection,payload);
  RAISE EXCEPTION 'Segunda ação padrão aceita';
 EXCEPTION WHEN SQLSTATE '55004' THEN NULL; END;
 IF pg_temp.qa_action_state(c)<>before_state THEN
  RAISE EXCEPTION 'Rejeição deixou histórico ou gasto'; END IF;
 PERFORM pg_temp.qa_enable_medic(c);
 BEGIN
  PERFORM public.confirm_character_paramedico(gen_random_uuid(),c,
   jsonb_build_object('targetId',c,'extraDice',0,'standardActionConfirmed',true,
    'expectedPE',19,'expectedNex',65,'expectedTargetHP',5,'expectedTurnKey',budget->>'key'));
  RAISE EXCEPTION 'Paramédico aceito após ataque no mesmo turno';
 EXCEPTION WHEN SQLSTATE '55004' THEN NULL; END;
 IF pg_temp.qa_action_state(c)<>before_state THEN
  RAISE EXCEPTION 'Paramédico rejeitado deixou gasto ou histórico'; END IF;
 PERFORM pg_temp.qa_enable_occultist(c);
 BEGIN
  PERFORM public.cast_character_ritual(gen_random_uuid(),c,19,1,
   '{"ritualId":"arma-atroz","ritualName":"Arma Atroz","ritualElement":"sangue",
   "enhancements":[],"requirementsConfirmed":true,"expectedSan":20,"expectedSanMax":20,
   "paranormalCost":{"source":"system_roll","element":"sangue",
    "test":{"attribute":1,"dicePenalty":0,"dice":[20],"bonuses":[{"name":"QA","value":20}],
    "bonus":20,"total":40}}}'::jsonb);
  RAISE EXCEPTION 'Ritual padrão aceito após ataque no mesmo turno';
 EXCEPTION WHEN SQLSTATE '55004' THEN NULL; END;
 IF pg_temp.qa_action_state(c)<>before_state THEN
  RAISE EXCEPTION 'Ritual rejeitado deixou PE ou histórico'; END IF;
 PERFORM set_config('request.jwt.claim.sub','a1960000-0000-4000-8000-000000000001',true);
 PERFORM public.save_campaign_combat_v2(campaign,1,
  '{"active":true,"round":1,"currentTurnIndex":1,"combatants":[
   {"id":"a1960000-0000-4000-8000-000000000011","name":"Agente","initiative":20},
   {"id":"npc-qa","name":"NPC","initiative":10}]}');
 PERFORM set_config('request.jwt.claim.sub','a1960000-0000-4000-8000-000000000002',true);
 budget:=public.get_character_pe_budget(c);
 BEGIN
  PERFORM public.confirm_character_combat_attack(gen_random_uuid(),c,19,0,budget->>'key',selection,payload);
  RAISE EXCEPTION 'Ataque comum fora do turno aceito';
 EXCEPTION WHEN SQLSTATE '55004' THEN NULL; END;
 receipt:=public.cast_character_ritual(gen_random_uuid(),c,19,10,
  '{"ritualId":"alterar-destino","ritualName":"Alterar Destino","ritualElement":"conhecimento",
   "enhancements":[],"requirementsConfirmed":true,"expectedSan":20,"expectedSanMax":20,
   "paranormalCost":{"source":"system_roll","element":"conhecimento",
    "test":{"attribute":1,"dicePenalty":0,"dice":[20],"bonuses":[{"name":"QA","value":20}],
    "bonus":20,"total":40}}}'::jsonb);
 IF receipt.category<>'ritual' OR public.get_character_turn_action_status(c)->>'available'<>'0' THEN
  RAISE EXCEPTION 'Ritual de reação não foi aceito fora do turno ou alterou slots'; END IF;
 PERFORM set_config('request.jwt.claim.sub','a1960000-0000-4000-8000-000000000001',true);
 PERFORM public.save_campaign_combat_v2(campaign,2,
  '{"active":true,"round":1,"currentTurnIndex":0,"combatants":[
   {"id":"a1960000-0000-4000-8000-000000000011","name":"Agente","initiative":20},
   {"id":"npc-qa","name":"NPC","initiative":10}]}');
 PERFORM set_config('request.jwt.claim.sub','a1960000-0000-4000-8000-000000000002',true);
 budget:=public.get_character_pe_budget(c);
 status:=public.get_character_turn_action_status(c);
 IF status->>'available'<>'1' OR status->>'movementSpent'<>'0'
  OR (budget->>'spent')::integer<>0 THEN
  RAISE EXCEPTION 'Novo turno na mesma rodada herdou slots ou PE'; END IF;
END $$;
RESET ROLE;
ROLLBACK;
