-- Fixture transacional: intenção, defesa prévia e contra-ataque após erro.
BEGIN;
INSERT INTO auth.users(id) VALUES
 ('a1980000-0000-4000-8000-000000000001'),
 ('a1980000-0000-4000-8000-000000000002'),
 ('a1980000-0000-4000-8000-000000000003');
INSERT INTO public.characters(id,user_id,name,origin,class,nex,
 hp_current,hp_max,pe_current,pe_max,san_current,san_max,skills,inventory)
VALUES
 ('a1980000-0000-4000-8000-000000000011','a1980000-0000-4000-8000-000000000002',
  'QA atacante','Militar','Combatente',20,20,20,20,20,20,20,'{"luta":1}',
  '[{"id":"arma-qa","name":"Espada QA","itemType":"weapon","type":"melee","isEquipped":true}]'),
 ('a1980000-0000-4000-8000-000000000012','a1980000-0000-4000-8000-000000000003',
  'QA defensor','Lutador','Combatente',20,20,20,20,20,20,20,
  '{"fortitude":1,"reflexos":1,"luta":1}','[]');
INSERT INTO public.campaigns_v2(id,master_id,name)
VALUES('a1980000-0000-4000-8000-000000000020','a1980000-0000-4000-8000-000000000001','QA pré-defesa');
INSERT INTO public.campaign_members_v2(campaign_id,user_id,character_id,role) VALUES
 ('a1980000-0000-4000-8000-000000000020','a1980000-0000-4000-8000-000000000002',
  'a1980000-0000-4000-8000-000000000011','player'),
 ('a1980000-0000-4000-8000-000000000020','a1980000-0000-4000-8000-000000000003',
  'a1980000-0000-4000-8000-000000000012','player');
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','a1980000-0000-4000-8000-000000000001',true);
SELECT public.save_campaign_combat_v2('a1980000-0000-4000-8000-000000000020',0,
 '{"active":true,"round":1,"currentTurnIndex":0,"combatants":[
  {"id":"a1980000-0000-4000-8000-000000000011","name":"Atacante","initiative":20},
  {"id":"a1980000-0000-4000-8000-000000000012","name":"Defensor","initiative":10}]}');
DO $$
DECLARE campaign uuid:='a1980000-0000-4000-8000-000000000020';
 attacker uuid:='a1980000-0000-4000-8000-000000000011';
 defender uuid:='a1980000-0000-4000-8000-000000000012';
 intent_id uuid:='a1980000-0000-4000-8000-000000000031';
 defense_id uuid:='a1980000-0000-4000-8000-000000000032';
 second_intent uuid:='a1980000-0000-4000-8000-000000000033';
 second_defense uuid:='a1980000-0000-4000-8000-000000000034';
 cancelled_intent uuid:='a1980000-0000-4000-8000-000000000035';
 expiring_intent uuid:='a1980000-0000-4000-8000-000000000036';
 resolution_id uuid:='a1980000-0000-4000-8000-000000000037';
 second_attack_id uuid:='a1980000-0000-4000-8000-000000000038';
 intent public.campaign_attack_intents_v2; choice public.campaign_attack_defense_choices_v2;
 attack public.character_activity_events; counter public.character_activity_events;
 combat public.campaign_combat_state_v2; budget jsonb; resolution jsonb;
 selection jsonb; payload jsonb:='{"entry":{"type":"attack","label":"Ataque QA",
  "results":[12],"diceCount":1,"bestResult":12,"skillBonus":5,
  "otherBonuses":0,"bonus":5,"total":17}}'::jsonb;
BEGIN
 SELECT * INTO combat FROM public.campaign_combat_state_v2 WHERE campaign_id=campaign;
 PERFORM set_config('request.jwt.claim.sub','a1980000-0000-4000-8000-000000000002',true);
 intent:=public.declare_campaign_attack_intent_v2(intent_id,campaign,attacker,defender,
  'arma-qa',1,1,combat.turn_instance_id);
 IF intent.status<>'pending' OR NOT intent.melee THEN
  RAISE EXCEPTION 'Intenção corpo a corpo não registrada'; END IF;
 IF (public.declare_campaign_attack_intent_v2(intent_id,campaign,attacker,defender,
  'arma-qa',1,1,combat.turn_instance_id)).operation_id<>intent_id THEN
  RAISE EXCEPTION 'Retry de intenção falhou'; END IF;
 BEGIN
  PERFORM public.declare_campaign_attack_intent_v2(gen_random_uuid(),campaign,
   attacker,defender,'arma-qa',1,1,combat.turn_instance_id);
  RAISE EXCEPTION 'Duas intenções simultâneas no mesmo turno aceitas';
 EXCEPTION WHEN SQLSTATE '23505' THEN NULL; END;
 budget:=public.get_character_pe_budget(attacker);
 selection:=jsonb_build_object('weaponId','arma-qa','specialAttackIncrements',0,
  'sneakAttack',false,'lethalShot',false,'techniques','[]'::jsonb,
  'lethalCount',0,'otherPaidBonuses','[]'::jsonb,
  'targetCharacterId',defender,'attackIntentId',intent_id);
 BEGIN
  PERFORM public.confirm_character_combat_attack(gen_random_uuid(),attacker,20,0,
   budget->>'key',selection,payload);
  RAISE EXCEPTION 'Rolagem com alvo antes da defesa aceita';
 EXCEPTION WHEN SQLSTATE '55004' THEN NULL; END;
 IF EXISTS(SELECT 1 FROM public.character_activity_events WHERE character_id=attacker) THEN
  RAISE EXCEPTION 'Rejeição deixou histórico'; END IF;
 PERFORM set_config('request.jwt.claim.sub','a1980000-0000-4000-8000-000000000001',true);
 choice:=public.confirm_campaign_attack_defense_choice_v2(defense_id,intent_id,'none');
 IF choice.defense_type<>'none' THEN RAISE EXCEPTION 'Escolha nenhuma não persistiu'; END IF;
 PERFORM set_config('request.jwt.claim.sub','a1980000-0000-4000-8000-000000000002',true);
 attack:=public.confirm_character_combat_attack(gen_random_uuid(),attacker,20,0,
  budget->>'key',selection,payload);
 IF attack.payload->>'attackIntentId'<>intent_id::text OR
  (SELECT status FROM public.campaign_attack_intents_v2 WHERE operation_id=intent_id)<>'rolled' THEN
  RAISE EXCEPTION 'Ataque não foi vinculado à intenção'; END IF;
 PERFORM set_config('request.jwt.claim.sub','a1980000-0000-4000-8000-000000000001',true);
 BEGIN
  PERFORM public.confirm_character_special_defense_v2(gen_random_uuid(),campaign,defender,
   attack.id,'contra_ataque',1,1);
  RAISE EXCEPTION 'Contra-ataque antes do erro resolvido foi aceito';
 EXCEPTION WHEN SQLSTATE '55004' THEN NULL; END;
 BEGIN
  PERFORM public.confirm_character_special_defense_v2(gen_random_uuid(),campaign,defender,
   attack.id,'esquiva',1,1);
  RAISE EXCEPTION 'Esquiva após dado foi aceita';
 EXCEPTION WHEN SQLSTATE '55004' THEN NULL; END;
 BEGIN
  PERFORM public.confirm_campaign_attack_target_v2(gen_random_uuid(),campaign,attack.id,
   attacker,20,1,1,'{"defenseTotal":20,"grossDamage":5,"damageType":"corte",
    "resistedDamage":0,"damageReduction":0,"immuneDamage":false}'::jsonb);
  RAISE EXCEPTION 'Aplicação em alvo diferente da intenção foi aceita';
 EXCEPTION WHEN SQLSTATE '55004' THEN NULL; END;
 resolution:=public.confirm_campaign_attack_target_v2(gen_random_uuid(),campaign,attack.id,
  defender,20,1,1,'{"defenseTotal":20,"grossDamage":5,"damageType":"corte",
   "resistedDamage":0,"damageReduction":0,"immuneDamage":false}'::jsonb);
 IF resolution->'hit' IS DISTINCT FROM 'false'::jsonb THEN
  RAISE EXCEPTION 'Ataque deveria errar'; END IF;
 counter:=public.confirm_character_special_defense_v2(gen_random_uuid(),campaign,defender,
  attack.id,'contra_ataque',1,1);
 IF counter.payload->>'resolution'<>'contra_ataque_pendente' THEN
  RAISE EXCEPTION 'Contra-ataque não ficou pendente'; END IF;
 PERFORM public.save_campaign_combat_v2(campaign,1,
  '{"active":true,"round":2,"currentTurnIndex":0,"combatants":[
   {"id":"a1980000-0000-4000-8000-000000000011","name":"Atacante","initiative":20},
   {"id":"a1980000-0000-4000-8000-000000000012","name":"Defensor","initiative":10}]}');
 SELECT * INTO combat FROM public.campaign_combat_state_v2 WHERE campaign_id=campaign;
 PERFORM set_config('request.jwt.claim.sub','a1980000-0000-4000-8000-000000000002',true);
 PERFORM public.declare_campaign_attack_intent_v2(cancelled_intent,campaign,
  attacker,defender,'arma-qa',1,2,combat.turn_instance_id);
 IF (public.cancel_campaign_attack_intent_v2(cancelled_intent)).status<>'cancelled'
  OR (public.cancel_campaign_attack_intent_v2(cancelled_intent)).status<>'cancelled' THEN
  RAISE EXCEPTION 'Cancelamento não foi idempotente'; END IF;
 intent:=public.declare_campaign_attack_intent_v2(second_intent,campaign,attacker,defender,
  'arma-qa',1,2,combat.turn_instance_id);
 PERFORM set_config('request.jwt.claim.sub','a1980000-0000-4000-8000-000000000001',true);
 choice:=public.confirm_campaign_attack_defense_choice_v2(second_defense,second_intent,'bloqueio');
 IF choice.defense_type<>'bloqueio' THEN RAISE EXCEPTION 'Bloqueio não foi reservado'; END IF;
 PERFORM set_config('request.jwt.claim.sub','a1980000-0000-4000-8000-000000000002',true);
 budget:=public.get_character_pe_budget(attacker);
 selection:=jsonb_set(jsonb_set(selection,'{attackIntentId}',to_jsonb(second_intent)),
  '{targetCharacterId}',to_jsonb(defender));
 selection:=jsonb_set(selection,'{specialAttackIncrements}','1'::jsonb);
 payload:='{"entry":{"type":"attack","label":"20 natural QA","results":[20],
  "diceCount":1,"bestResult":20,"skillBonus":5,"otherBonuses":0,
  "bonus":5,"total":25}}'::jsonb;
 attack:=public.confirm_character_combat_attack(second_attack_id,attacker,20,2,
  budget->>'key',selection,payload);
 IF (SELECT pe_current FROM public.characters WHERE id=attacker)<>18 THEN
  RAISE EXCEPTION 'Ataque Especial não cobrou PE esperado'; END IF;
 IF (public.confirm_character_combat_attack(second_attack_id,attacker,20,2,
  budget->>'key',selection,payload)).id<>attack.id
  OR (SELECT pe_current FROM public.characters WHERE id=attacker)<>18
  OR (SELECT count(*) FROM public.character_activity_events event
   WHERE event.operation_id=second_attack_id)<>1 THEN
  RAISE EXCEPTION 'Retry duplicou PE ou histórico'; END IF;
 PERFORM set_config('request.jwt.claim.sub','a1980000-0000-4000-8000-000000000001',true);
 IF NOT EXISTS(SELECT 1 FROM public.character_activity_events event
  WHERE event.id=second_defense AND event.payload->'declaredBeforeRoll'='true'::jsonb
   AND event.payload->>'attackEventId'=attack.id::text
   AND event.payload->>'defenseType'='bloqueio') THEN
  RAISE EXCEPTION 'Histórico do Bloqueio não preservou a ordem'; END IF;
 resolution:=public.confirm_campaign_attack_target_v2(resolution_id,campaign,attack.id,
  defender,20,1,2,jsonb_build_object('defenseTotal',30,'grossDamage',5,
   'damageType','corte','resistedDamage',0,'damageReduction',5,
   'immuneDamage',false,'specialDefenseEventId',second_defense,
   'reviewNote','Bloqueio declarado antes da rolagem'));
 IF resolution->'timingVerifiedByServer' IS DISTINCT FROM 'true'::jsonb
  OR resolution->>'specialDefenseReview'<>'declared_before_roll'
  OR resolution->'hit' IS DISTINCT FROM 'false'::jsonb
  OR (public.confirm_campaign_attack_target_v2(resolution_id,campaign,attack.id,
   defender,20,1,2,jsonb_build_object('defenseTotal',30,'grossDamage',5,
    'damageType','corte','resistedDamage',0,'damageReduction',5,
    'immuneDamage',false,'specialDefenseEventId',second_defense,
    'reviewNote','Bloqueio declarado antes da rolagem')))->'timingVerifiedByServer'
    IS DISTINCT FROM 'true'::jsonb THEN
  RAISE EXCEPTION 'Resolução não preservou timing pré-rolagem no retry'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.character_activity_events event
  WHERE event.id=second_defense AND event.payload->'timingVerifiedByServer'='true'::jsonb) THEN
  RAISE EXCEPTION 'Histórico da defesa perdeu timing verificado'; END IF;
 PERFORM public.save_campaign_combat_v2(campaign,2,
  '{"active":true,"round":3,"currentTurnIndex":0,"combatants":[
   {"id":"a1980000-0000-4000-8000-000000000011","name":"Atacante","initiative":20},
   {"id":"a1980000-0000-4000-8000-000000000012","name":"Defensor","initiative":10}]}');
 SELECT * INTO combat FROM public.campaign_combat_state_v2 WHERE campaign_id=campaign;
 PERFORM set_config('request.jwt.claim.sub','a1980000-0000-4000-8000-000000000002',true);
 PERFORM public.declare_campaign_attack_intent_v2(expiring_intent,campaign,
  attacker,defender,'arma-qa',1,3,combat.turn_instance_id);
 PERFORM set_config('request.jwt.claim.sub','a1980000-0000-4000-8000-000000000001',true);
 PERFORM public.save_campaign_combat_v2(campaign,3,
  '{"active":true,"round":3,"currentTurnIndex":1,"combatants":[
   {"id":"a1980000-0000-4000-8000-000000000011","name":"Atacante","initiative":20},
   {"id":"a1980000-0000-4000-8000-000000000012","name":"Defensor","initiative":10}]}');
 IF (SELECT status FROM public.campaign_attack_intents_v2
  WHERE operation_id=expiring_intent)<>'expired' THEN
  RAISE EXCEPTION 'Avanço de turno não expirou a intenção'; END IF;
END $$;
RESET ROLE;
ROLLBACK;
