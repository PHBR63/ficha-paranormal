-- Livro Base v1.3 pp. 84-86: ações preparadas no combate v2.
-- Fixture inteira é revertida; nenhuma ficha de usuário é alterada.
BEGIN;
INSERT INTO auth.users(id) VALUES
 ('a1990000-0000-4000-8000-000000000001'),
 ('a1990000-0000-4000-8000-000000000002'),
 ('a1990000-0000-4000-8000-000000000003');
INSERT INTO public.characters(id,user_id,name,origin,class,class_track,nex,
 hp_current,hp_max,pe_current,pe_max,san_current,san_max,skills,inventory)
VALUES
 ('a1990000-0000-4000-8000-000000000011','a1990000-0000-4000-8000-000000000002',
  'QA preparado','Militar','Combatente',NULL,20,20,20,20,20,20,20,'{"pontaria":1}',
  '[{"id":"arma-a","name":"Pistola A","itemType":"weapon","type":"Disparo","isEquipped":true}]'),
 ('a1990000-0000-4000-8000-000000000013','a1990000-0000-4000-8000-000000000003',
  'QA ator corrente','Militar','Especialista','atirador-elite',65,20,20,20,20,20,20,'{"pontaria":1}',
  '[{"id":"arma-c","name":"Pistola C","itemType":"weapon","type":"Disparo","ammoType":"balas_curtas","isEquipped":true}]');
INSERT INTO public.campaigns_v2(id,master_id,name)
VALUES('a1990000-0000-4000-8000-000000000020',
 'a1990000-0000-4000-8000-000000000001','QA ação preparada');
INSERT INTO public.campaign_members_v2(campaign_id,user_id,character_id,role) VALUES
 ('a1990000-0000-4000-8000-000000000020','a1990000-0000-4000-8000-000000000002',
  'a1990000-0000-4000-8000-000000000011','player'),
 ('a1990000-0000-4000-8000-000000000020','a1990000-0000-4000-8000-000000000003',
  'a1990000-0000-4000-8000-000000000013','player');
CREATE FUNCTION pg_temp.qa_prepared_slot_count(p_operation_id uuid) RETURNS integer
LANGUAGE sql SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT count(*)::integer FROM public.character_combat_actions
 WHERE operation_id=p_operation_id
$$;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','a1990000-0000-4000-8000-000000000001',true);
SELECT public.save_campaign_combat_v2('a1990000-0000-4000-8000-000000000020',0,
 '{"active":true,"round":1,"currentTurnIndex":0,"combatants":[
  {"id":"a1990000-0000-4000-8000-000000000011","name":"Preparado","initiative":20},
  {"id":"npc-b","name":"NPC B","initiative":15,"isNPC":true},
  {"id":"a1990000-0000-4000-8000-000000000013","name":"Ator","initiative":10}]}');
DO $$
DECLARE campaign uuid:='a1990000-0000-4000-8000-000000000020';
 prepared_actor uuid:='a1990000-0000-4000-8000-000000000011';
 current_actor uuid:='a1990000-0000-4000-8000-000000000013';
 first_id uuid:='a1990000-0000-4000-8000-000000000031';
 trigger_id uuid:='a1990000-0000-4000-8000-000000000032';
 second_id uuid:='a1990000-0000-4000-8000-000000000033';
 combat public.campaign_combat_state_v2; prepared public.character_activity_events;
 triggered public.character_activity_events; budget_before jsonb; budget_after jsonb;
 action_before jsonb; action_after jsonb; receipt_count integer;
BEGIN
 SELECT * INTO combat FROM public.campaign_combat_state_v2 WHERE campaign_id=campaign;
 PERFORM set_config('request.jwt.claim.sub','a1990000-0000-4000-8000-000000000002',true);
 prepared:=public.prepare_character_action_v2(first_id,campaign,prepared_actor,1,1,
  combat.turn_instance_id,'standard','Disparar após a porta abrir','A porta abrir');
 IF prepared.payload->>'resolution'<>'pending_trigger'
  OR (public.get_character_turn_action_status(prepared_actor)->>'available')<>'0'
  OR NOT EXISTS(SELECT 1 FROM public.character_activity_events event
   WHERE event.id=first_id AND event.payload->'peApplied'='false'::jsonb) THEN
  RAISE EXCEPTION 'Preparar não ocupou padrão ou marcou gasto falso'; END IF;
 IF (public.prepare_character_action_v2(first_id,campaign,prepared_actor,1,1,
  combat.turn_instance_id,'standard','Disparar após a porta abrir','A porta abrir')).id<>first_id THEN
  RAISE EXCEPTION 'Retry de Preparar falhou'; END IF;
 BEGIN
  PERFORM public.prepare_character_action_v2(gen_random_uuid(),campaign,prepared_actor,
   1,1,combat.turn_instance_id,'movement','Andar','Alvo mover');
  RAISE EXCEPTION 'Segundo Preparar aceito sem ação padrão';
 EXCEPTION WHEN SQLSTATE '55004' THEN NULL; END;
 SELECT count(*) INTO receipt_count FROM public.character_activity_events
  WHERE character_id=prepared_actor;
 IF receipt_count<>1 THEN RAISE EXCEPTION 'Rejeição deixou histórico'; END IF;
 PERFORM set_config('request.jwt.claim.sub','a1990000-0000-4000-8000-000000000001',true);
 BEGIN
  PERFORM public.trigger_character_prepared_action_v2(gen_random_uuid(),first_id,1,1,
   combat.turn_instance_id,'Gatilho prematuro');
  RAISE EXCEPTION 'Reação ocorreu no próprio turno de preparação';
 EXCEPTION WHEN SQLSTATE '40001' THEN NULL; END;
 PERFORM public.save_campaign_combat_v2(campaign,1,
  '{"active":true,"round":1,"currentTurnIndex":1,"combatants":[
   {"id":"a1990000-0000-4000-8000-000000000011","name":"Preparado","initiative":20},
   {"id":"npc-b","name":"NPC B","initiative":15,"isNPC":true},
   {"id":"a1990000-0000-4000-8000-000000000013","name":"Ator","initiative":10}]}');
 SELECT * INTO combat FROM public.campaign_combat_state_v2 WHERE campaign_id=campaign;
 PERFORM public.save_campaign_combat_v2(campaign,2,
  '{"active":true,"round":1,"currentTurnIndex":2,"combatants":[
   {"id":"a1990000-0000-4000-8000-000000000011","name":"Preparado","initiative":20},
   {"id":"npc-b","name":"NPC B","initiative":15,"isNPC":true},
   {"id":"a1990000-0000-4000-8000-000000000013","name":"Ator","initiative":10}]}');
 SELECT * INTO combat FROM public.campaign_combat_state_v2 WHERE campaign_id=campaign;
 PERFORM set_config('request.jwt.claim.sub','a1990000-0000-4000-8000-000000000003',true);
 PERFORM public.confirm_character_mirar(gen_random_uuid(),current_actor,
  (public.get_character_pe_budget(current_actor))->>'key','arma-c');
 budget_before:=public.get_character_pe_budget(current_actor);
 action_before:=public.get_character_turn_action_status(current_actor);
 IF action_before->>'movementSpent'<>'1' THEN
  RAISE EXCEPTION 'Movimento do ator atual não foi registrado'; END IF;
 BEGIN
  PERFORM public.trigger_character_prepared_action_v2(gen_random_uuid(),first_id,1,1,
   combat.turn_instance_id,'A porta abriu');
  RAISE EXCEPTION 'Jogador confirmou gatilho reservado ao mestre';
 EXCEPTION WHEN SQLSTATE '42501' THEN NULL; END;
 PERFORM set_config('request.jwt.claim.sub','a1990000-0000-4000-8000-000000000001',true);
 triggered:=public.trigger_character_prepared_action_v2(trigger_id,first_id,1,1,
  combat.turn_instance_id,'A porta abriu; ação resolvida manualmente');
 SELECT * INTO combat FROM public.campaign_combat_state_v2 WHERE campaign_id=campaign;
 IF combat.turn_instance_id<> (budget_before->>'turnInstanceId')::uuid
  OR combat.state->>'currentTurnIndex'<>'2'
  OR combat.state->'combatants'->1->>'id'<>prepared_actor::text
  OR combat.state->'combatants'->2->>'id'<>current_actor::text
  OR combat.state->'combatants'->1->>'initiative'<>'10'
  OR triggered.payload->'effectApplied' IS DISTINCT FROM 'false'::jsonb
  OR triggered.payload->'peApplied' IS DISTINCT FROM 'false'::jsonb THEN
  RAISE EXCEPTION 'Reação mudou o turno/PE ou registrou efeito indevido'; END IF;
 budget_after:=public.get_character_pe_budget(current_actor);
 action_after:=public.get_character_turn_action_status(current_actor);
 IF budget_after->>'key'<>budget_before->>'key'
  OR action_after->>'movementSpent'<>'1'
  OR (public.trigger_character_prepared_action_v2(trigger_id,first_id,1,1,
   (budget_before->>'turnInstanceId')::uuid,
   'A porta abriu; ação resolvida manualmente')).id<>trigger_id THEN
  RAISE EXCEPTION 'Reordenação/reset ou retry incorreto'; END IF;
 BEGIN
  PERFORM public.trigger_character_prepared_action_v2(gen_random_uuid(),first_id,1,1,
   combat.turn_instance_id,'Tentativa duplicada');
  RAISE EXCEPTION 'Reação duplicada aceita';
 EXCEPTION WHEN SQLSTATE '40001' THEN NULL; END;
 -- Novo turno do personagem: a ação não acionada expira sem estorno.
 PERFORM public.save_campaign_combat_v2(campaign,4,
  '{"active":true,"round":2,"currentTurnIndex":0,"combatants":[
   {"id":"npc-b","name":"NPC B","initiative":15,"isNPC":true},
   {"id":"a1990000-0000-4000-8000-000000000011","name":"Preparado","initiative":10},
   {"id":"a1990000-0000-4000-8000-000000000013","name":"Ator","initiative":10}]}');
 PERFORM public.save_campaign_combat_v2(campaign,5,
  '{"active":true,"round":2,"currentTurnIndex":1,"combatants":[
   {"id":"npc-b","name":"NPC B","initiative":15,"isNPC":true},
   {"id":"a1990000-0000-4000-8000-000000000011","name":"Preparado","initiative":10},
   {"id":"a1990000-0000-4000-8000-000000000013","name":"Ator","initiative":10}]}');
 SELECT * INTO combat FROM public.campaign_combat_state_v2 WHERE campaign_id=campaign;
 PERFORM set_config('request.jwt.claim.sub','a1990000-0000-4000-8000-000000000002',true);
 prepared:=public.prepare_character_action_v2(second_id,campaign,prepared_actor,1,2,
  combat.turn_instance_id,'free','Soltar objeto','Sinal do mestre');
 PERFORM set_config('request.jwt.claim.sub','a1990000-0000-4000-8000-000000000001',true);
 PERFORM public.save_campaign_combat_v2(campaign,6,
  '{"active":true,"round":2,"currentTurnIndex":2,"combatants":[
   {"id":"npc-b","name":"NPC B","initiative":15,"isNPC":true},
   {"id":"a1990000-0000-4000-8000-000000000011","name":"Preparado","initiative":10},
   {"id":"a1990000-0000-4000-8000-000000000013","name":"Ator","initiative":10}]}');
 PERFORM public.save_campaign_combat_v2(campaign,7,
  '{"active":true,"round":3,"currentTurnIndex":0,"combatants":[
   {"id":"npc-b","name":"NPC B","initiative":15,"isNPC":true},
   {"id":"a1990000-0000-4000-8000-000000000011","name":"Preparado","initiative":10},
   {"id":"a1990000-0000-4000-8000-000000000013","name":"Ator","initiative":10}]}');
 PERFORM public.save_campaign_combat_v2(campaign,8,
  '{"active":true,"round":3,"currentTurnIndex":1,"combatants":[
   {"id":"npc-b","name":"NPC B","initiative":15,"isNPC":true},
   {"id":"a1990000-0000-4000-8000-000000000011","name":"Preparado","initiative":10},
   {"id":"a1990000-0000-4000-8000-000000000013","name":"Ator","initiative":10}]}');
 IF (SELECT status FROM public.character_prepared_actions_v2 WHERE operation_id=second_id)<>'expired'
  OR pg_temp.qa_prepared_slot_count(second_id)<>1 THEN
  RAISE EXCEPTION 'Ação não usada não expirou ou estornou padrão'; END IF;
END $$;
RESET ROLE;
ROLLBACK;
