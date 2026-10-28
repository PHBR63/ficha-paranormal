-- Livro Base v1.3, pp. 85-86. Ensaio transacional sem dados permanentes.
BEGIN;

DO $$
DECLARE effect jsonb;
BEGIN
 -- Limites exatos independem do RNG do RPC de produção.
 effect:=public.combat_maneuver_effect_v2('push',20,20-4);
 IF effect->>'distanceMeters'<>'1.5' THEN RAISE EXCEPTION 'Empurrar margem 4 incorreto'; END IF;
 effect:=public.combat_maneuver_effect_v2('push',20,20-5);
 IF effect->>'distanceMeters'<>'3.0' THEN RAISE EXCEPTION 'Empurrar margem 5 incorreto'; END IF;
 effect:=public.combat_maneuver_effect_v2('push',20,20-10);
 IF effect->>'distanceMeters'<>'4.5' THEN RAISE EXCEPTION 'Empurrar margem 10 incorreto'; END IF;
 effect:=public.combat_maneuver_effect_v2('trip',20,16);
 IF effect->>'distanceMeters'<>'0' THEN RAISE EXCEPTION 'Derrubar margem 4 deslocou alvo'; END IF;
 effect:=public.combat_maneuver_effect_v2('trip',20,15);
 IF effect->>'distanceMeters'<>'1.5' THEN RAISE EXCEPTION 'Derrubar margem 5 não registrou deslocamento'; END IF;
 effect:=public.combat_maneuver_effect_v2('disarm',20,15);
 IF effect->>'automaticEffect'<>'disarmed' OR effect->'manualPending'<>'true'::jsonb THEN
  RAISE EXCEPTION 'Desarmar não separou item e posição manual'; END IF;
 effect:=public.combat_maneuver_effect_v2('break',20,12);
 IF effect->>'automaticEffect'<>'object_damage_pending' OR effect->'manualPending'<>'true'::jsonb THEN
  RAISE EXCEPTION 'Quebrar alegou aplicação total'; END IF;
 effect:=public.combat_maneuver_effect_v2('grapple',12,19);
 IF effect->>'automaticEffect'<>'none' THEN RAISE EXCEPTION 'Derrota aplicou Agarrado'; END IF;
 BEGIN
  PERFORM public.combat_maneuver_effect_v2('push',17,17);
  RAISE EXCEPTION 'Empate foi aceito como resultado final';
 EXCEPTION WHEN SQLSTATE '22023' THEN NULL; END;
 BEGIN
  PERFORM public.get_unique_equipped_maneuver_item_v2(
   '[{"id":"faca","name":"Faca A","itemType":"weapon","isEquipped":true},{"id":"faca","name":"Faca B","itemType":"weapon","isEquipped":true}]',
   'faca');
  RAISE EXCEPTION 'ID duplicado de item foi aceito em Desarmar/Quebrar';
 EXCEPTION WHEN SQLSTATE '40001' THEN NULL; END;
 IF public.get_unique_equipped_maneuver_item_v2(
  '[{"id":"maleta","name":"Maleta","itemType":"item","isEquipped":true,"isHeld":true}]','maleta')->>'name'<>'Maleta' THEN
  RAISE EXCEPTION 'Objeto realmente empunhado foi recusado'; END IF;
 BEGIN
  PERFORM public.get_unique_equipped_maneuver_item_v2(
   '[{"id":"colete","name":"Colete","itemType":"protection","isEquipped":true,"isHeld":true}]','colete');
  RAISE EXCEPTION 'Proteção foi aceita como item empunhado de Desarmar/Quebrar';
 EXCEPTION WHEN SQLSTATE '40001' THEN NULL; END;
 IF public.append_unique_maneuver_condition_v2(
  '[{"id":"caido","name":"Caído","sourceOperationId":"origem-antiga"},{"id":"caseira","name":"Caseira"}]',
  'caido','Caído','b2800000-0000-4000-8000-000000000099')->0->>'sourceOperationId'<>'origem-antiga' THEN
  RAISE EXCEPTION 'Condição existente foi duplicada ou perdeu sua fonte'; END IF;

 IF has_function_privilege('anon','public.declare_campaign_combat_maneuver_v2(uuid,uuid,uuid,uuid,text,text,text,integer,integer,uuid)','EXECUTE')
  OR has_function_privilege('anon','public.resolve_campaign_combat_maneuver_v2(uuid,uuid,jsonb)','EXECUTE') THEN
  RAISE EXCEPTION 'RPC de manobra exposta ao perfil anônimo'; END IF;
 IF NOT has_function_privilege('authenticated','public.declare_campaign_combat_maneuver_v2(uuid,uuid,uuid,uuid,text,text,text,integer,integer,uuid)','EXECUTE')
  OR NOT has_function_privilege('authenticated','public.resolve_campaign_combat_maneuver_v2(uuid,uuid,jsonb)','EXECUTE') THEN
  RAISE EXCEPTION 'RPC de manobra indisponível ao perfil autenticado'; END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conrelid='public.character_combat_actions'::regclass
  AND conname='character_combat_actions_source_check' AND pg_get_constraintdef(oid) LIKE '%maneuver%') THEN
  RAISE EXCEPTION 'Fonte maneuver ausente do livro de ações'; END IF;
END $$;

-- Ciclo real com dois jogadores e um mestre. Modificadores nos limites
-- permitidos tornam vitória/derrota determinísticas sem injetar dados secretos.
INSERT INTO auth.users(id) VALUES
 ('b2800000-0000-4000-8000-000000000001'),
 ('b2800000-0000-4000-8000-000000000002'),
 ('b2800000-0000-4000-8000-000000000003');
INSERT INTO public.characters(id,user_id,name,origin,class,nex,strength,agility,
 hp_current,hp_max,pe_current,pe_max,san_current,san_max,skills,inventory,conditions)
VALUES
 ('b2800000-0000-4000-8000-000000000011','b2800000-0000-4000-8000-000000000002',
  'Atacante QA','Lutador','Combatente',5,3,2,20,20,5,5,10,10,'{"luta":1}',
  '[{"id":"espada-qa","name":"Espada","itemType":"weapon","weaponType":"melee","isEquipped":true,"properties":["ÁGIL"]}]',
  '[{"id":"condicao-caseira","name":"Condição caseira"}]'),
 ('b2800000-0000-4000-8000-000000000012','b2800000-0000-4000-8000-000000000003',
  'Defensor QA','Vítima','Combatente',5,2,1,20,20,5,5,10,10,'{"luta":0}',
  '[{"id":"faca-qa","name":"Faca","itemType":"weapon","weaponType":"melee","isEquipped":true}]',
  '[{"id":"condicao-caseira","name":"Condição caseira"},{"id":"caido","name":"Caído","sourceOperationId":"origem-antiga"}]');
INSERT INTO public.campaigns_v2(id,master_id,name)
VALUES('b2800000-0000-4000-8000-000000000020','b2800000-0000-4000-8000-000000000001','QA Manobras');
INSERT INTO public.campaign_members_v2(campaign_id,user_id,character_id,role) VALUES
 ('b2800000-0000-4000-8000-000000000020','b2800000-0000-4000-8000-000000000002','b2800000-0000-4000-8000-000000000011','player'),
 ('b2800000-0000-4000-8000-000000000020','b2800000-0000-4000-8000-000000000003','b2800000-0000-4000-8000-000000000012','player');
INSERT INTO public.campaign_combat_state_v2(campaign_id,scene_number,turn_instance_id,state)
VALUES('b2800000-0000-4000-8000-000000000020',1,'b2800000-0000-4000-8000-000000000030',
 '{"active":true,"round":1,"currentTurnIndex":0,"combatants":[
   {"id":"b2800000-0000-4000-8000-000000000011","name":"Atacante QA","initiative":20},
   {"id":"b2800000-0000-4000-8000-000000000012","name":"Defensor QA","initiative":10}]}');

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','b2800000-0000-4000-8000-000000000002',true);
DO $$ BEGIN
 BEGIN
  PERFORM public.declare_campaign_combat_maneuver_v2(
   'b2800000-0000-4000-8000-000000000039','b2800000-0000-4000-8000-000000000020',
   'b2800000-0000-4000-8000-000000000011','b2800000-0000-4000-8000-000000000012',
   'push','__unarmed__','agility',1,1,'b2800000-0000-4000-8000-000000000030');
  RAISE EXCEPTION 'Agilidade desarmada sem regra Ágil foi aceita';
 EXCEPTION WHEN SQLSTATE '22023' THEN NULL; END;
END $$;
SELECT public.declare_campaign_combat_maneuver_v2(
 'b2800000-0000-4000-8000-000000000040','b2800000-0000-4000-8000-000000000020',
 'b2800000-0000-4000-8000-000000000011','b2800000-0000-4000-8000-000000000012',
 'trip','__unarmed__','strength',1,1,'b2800000-0000-4000-8000-000000000030');
DO $$ BEGIN
 BEGIN
  PERFORM public.resolve_campaign_combat_maneuver_v2(
   'b2800000-0000-4000-8000-000000000041','b2800000-0000-4000-8000-000000000040',
   '{"defenderAttribute":"strength","attackerModifier":20,"defenderModifier":-20,
      "justification":"QA determinístico","adjacencyConfirmed":true}');
  RAISE EXCEPTION 'Jogador não mestre resolveu manobra';
 EXCEPTION WHEN SQLSTATE '42501' THEN NULL; END;
END $$;

SELECT set_config('request.jwt.claim.sub','b2800000-0000-4000-8000-000000000001',true);
SELECT public.resolve_campaign_combat_maneuver_v2(
 'b2800000-0000-4000-8000-000000000041','b2800000-0000-4000-8000-000000000040',
 '{"defenderAttribute":"strength","attackerModifier":20,"defenderModifier":-20,
    "justification":"QA determinístico","adjacencyConfirmed":true}');
-- Reenvio idêntico não sorteia, não cria evento e não consome outra ação.
SELECT public.resolve_campaign_combat_maneuver_v2(
 'b2800000-0000-4000-8000-000000000041','b2800000-0000-4000-8000-000000000040',
 '{"defenderAttribute":"strength","attackerModifier":20,"defenderModifier":-20,
    "justification":"QA determinístico","adjacencyConfirmed":true}');
RESET ROLE;
DO $$
BEGIN
 IF (SELECT count(*) FROM public.character_combat_actions WHERE source='maneuver'
  AND character_id='b2800000-0000-4000-8000-000000000011')<>1 THEN
  RAISE EXCEPTION 'Ação padrão de manobra foi duplicada'; END IF;
 IF (SELECT count(*) FROM public.character_activity_events WHERE payload->>'maneuverType'='trip')<>2 THEN
  RAISE EXCEPTION 'Reenvio duplicou histórico correlacionado'; END IF;
 IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements((SELECT conditions FROM public.characters
  WHERE id='b2800000-0000-4000-8000-000000000012')) item WHERE item->>'id'='condicao-caseira') THEN
  RAISE EXCEPTION 'Condição desconhecida do alvo foi removida'; END IF;
 IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements((SELECT conditions FROM public.characters
  WHERE id='b2800000-0000-4000-8000-000000000012')) item WHERE item->>'id'='caido') THEN
  RAISE EXCEPTION 'Derrubar vencido não aplicou Caído'; END IF;
 IF (SELECT count(*) FROM jsonb_array_elements((SELECT conditions FROM public.characters
  WHERE id='b2800000-0000-4000-8000-000000000012')) item WHERE public.creation_identifier(item->>'name')='caido')<>1
  OR NOT EXISTS(SELECT 1 FROM jsonb_array_elements((SELECT conditions FROM public.characters
  WHERE id='b2800000-0000-4000-8000-000000000012')) item WHERE item->>'sourceOperationId'='origem-antiga') THEN
  RAISE EXCEPTION 'Derrubar duplicou Caído ou substituiu a fonte existente'; END IF;
END $$;

-- Soltar é idempotente e remove somente a condição criada pelo vínculo.
INSERT INTO public.campaign_grapples_v2(maneuver_operation_id,campaign_id,actor_id,target_id)
VALUES('b2800000-0000-4000-8000-000000000040','b2800000-0000-4000-8000-000000000020',
 'b2800000-0000-4000-8000-000000000011','b2800000-0000-4000-8000-000000000012');
UPDATE public.characters SET conditions=conditions||jsonb_build_array(jsonb_build_object(
 'id','agarrado','name','Agarrado','sourceKind','combat_maneuver',
 'sourceOperationId','b2800000-0000-4000-8000-000000000040'))
WHERE id='b2800000-0000-4000-8000-000000000012';
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','b2800000-0000-4000-8000-000000000002',true);
SELECT public.release_campaign_grapple_v2('b2800000-0000-4000-8000-000000000040');
SELECT public.release_campaign_grapple_v2('b2800000-0000-4000-8000-000000000040');
RESET ROLE;
DO $$ BEGIN
 IF (SELECT active FROM public.campaign_grapples_v2
  WHERE maneuver_operation_id='b2800000-0000-4000-8000-000000000040') THEN
  RAISE EXCEPTION 'Soltar não encerrou o vínculo'; END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements((SELECT conditions FROM public.characters
  WHERE id='b2800000-0000-4000-8000-000000000012')) item
  WHERE item->>'sourceOperationId'='b2800000-0000-4000-8000-000000000040') THEN
  RAISE EXCEPTION 'Soltar não removeu a condição exata do vínculo'; END IF;
END $$;

UPDATE public.campaign_combat_state_v2 SET state=jsonb_set(state,'{currentTurnIndex}','1')
 WHERE campaign_id='b2800000-0000-4000-8000-000000000020';
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','b2800000-0000-4000-8000-000000000003',true);
SELECT public.declare_campaign_combat_maneuver_v2(
 'b2800000-0000-4000-8000-000000000050','b2800000-0000-4000-8000-000000000020',
 'b2800000-0000-4000-8000-000000000012','b2800000-0000-4000-8000-000000000011',
 'trip','__unarmed__','strength',1,1,
 (SELECT turn_instance_id FROM public.campaign_combat_state_v2 WHERE campaign_id='b2800000-0000-4000-8000-000000000020'));
SELECT set_config('request.jwt.claim.sub','b2800000-0000-4000-8000-000000000001',true);
SELECT public.resolve_campaign_combat_maneuver_v2(
 'b2800000-0000-4000-8000-000000000051','b2800000-0000-4000-8000-000000000050',
 '{"defenderAttribute":"strength","attackerModifier":-20,"defenderModifier":20,
    "justification":"QA derrota determinística","adjacencyConfirmed":true}');
RESET ROLE;
DO $$ BEGIN
 IF (SELECT result->'attackerWon' FROM public.campaign_combat_maneuvers_v2
  WHERE operation_id='b2800000-0000-4000-8000-000000000050') IS DISTINCT FROM 'false'::jsonb THEN
  RAISE EXCEPTION 'Derrota determinística não foi registrada'; END IF;
 IF (SELECT count(*) FROM jsonb_array_elements((SELECT conditions FROM public.characters
  WHERE id='b2800000-0000-4000-8000-000000000011')) item
  WHERE item->>'sourceOperationId'='b2800000-0000-4000-8000-000000000050')<>0 THEN
  RAISE EXCEPTION 'Derrota aplicou efeito no alvo'; END IF;
END $$;

-- Em novo turno, Artista Marcial torna o ataque desarmado Ágil; o servidor
-- reconhece a identidade mecânica e aceita Agilidade sem liberar outros casos.
UPDATE public.characters SET abilities='[{"id":"artista-marcial","name":"Artista Marcial"}]'
 WHERE id='b2800000-0000-4000-8000-000000000011';
UPDATE public.campaign_combat_state_v2 SET state=jsonb_set(jsonb_set(state,'{round}','2'),'{currentTurnIndex}','0')
 WHERE campaign_id='b2800000-0000-4000-8000-000000000020';
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','b2800000-0000-4000-8000-000000000002',true);
SELECT public.declare_campaign_combat_maneuver_v2(
 'b2800000-0000-4000-8000-000000000055','b2800000-0000-4000-8000-000000000020',
 'b2800000-0000-4000-8000-000000000011','b2800000-0000-4000-8000-000000000012',
 'push','__unarmed__','agility',1,2,
 (SELECT turn_instance_id FROM public.campaign_combat_state_v2 WHERE campaign_id='b2800000-0000-4000-8000-000000000020'));

-- Um identificador de campanha que não existe no v2 é recusado antes de gravar.
SELECT set_config('request.jwt.claim.sub','b2800000-0000-4000-8000-000000000002',true);
DO $$ BEGIN
 BEGIN
  PERFORM public.declare_campaign_combat_maneuver_v2(
   'b2800000-0000-4000-8000-000000000060','b2800000-0000-4000-8000-000000000099',
   'b2800000-0000-4000-8000-000000000011','b2800000-0000-4000-8000-000000000012',
   'push','__unarmed__','strength',1,1,'b2800000-0000-4000-8000-000000000030');
  RAISE EXCEPTION 'Campanha fora do v2 aceitou manobra';
 EXCEPTION WHEN SQLSTATE '40001' THEN NULL; END;
END $$;

ROLLBACK;
