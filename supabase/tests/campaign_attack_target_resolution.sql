-- Ataque contra alvo v2: todos os dados de ensaio são revertidos.
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
  '[{"id":"arma-qa","name":"Arma QA","itemType":"weapon","type":"melee","isEquipped":true}]'),
 ('a1980000-0000-4000-8000-000000000012','a1980000-0000-4000-8000-000000000003',
  'QA defensor','Militar','Combatente',20,20,20,20,20,20,20,
  '{"fortitude":1}','[]');
INSERT INTO public.campaigns_v2(id,master_id,name)
VALUES('a1980000-0000-4000-8000-000000000020','a1980000-0000-4000-8000-000000000001','QA ataque e alvo');
INSERT INTO public.campaign_members_v2(campaign_id,user_id,character_id,role) VALUES
 ('a1980000-0000-4000-8000-000000000020','a1980000-0000-4000-8000-000000000002',
  'a1980000-0000-4000-8000-000000000011','player'),
 ('a1980000-0000-4000-8000-000000000020','a1980000-0000-4000-8000-000000000003',
  'a1980000-0000-4000-8000-000000000012','player');
INSERT INTO public.character_temporary_resources(character_id,resource,source_key,source_name,remaining,damage_types)
VALUES('a1980000-0000-4000-8000-000000000012','hp','qa-corte','Proteção corte',5,ARRAY['Corte']);
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','a1980000-0000-4000-8000-000000000001',true);
SELECT public.save_campaign_combat_v2('a1980000-0000-4000-8000-000000000020',0,
 '{"active":true,"round":1,"currentTurnIndex":0,"combatants":[
  {"id":"a1980000-0000-4000-8000-000000000011","name":"Atacante","initiative":20},
  {"id":"a1980000-0000-4000-8000-000000000012","name":"Defensor","initiative":10}]}');
SELECT set_config('request.jwt.claim.sub','a1980000-0000-4000-8000-000000000002',true);
DO $$
DECLARE attacker uuid:='a1980000-0000-4000-8000-000000000011';
 defender uuid:='a1980000-0000-4000-8000-000000000012';
 campaign uuid:='a1980000-0000-4000-8000-000000000020';
 operation uuid:='a1980000-0000-4000-8000-000000000040';
 intent_id uuid:='a1980000-0000-4000-8000-000000000041';
 defense_id uuid:='a1980000-0000-4000-8000-000000000042';
 attack public.character_activity_events; special public.character_activity_events;
 budget jsonb; request jsonb; result jsonb; replay jsonb;
 combat public.campaign_combat_state_v2;
BEGIN
 SELECT * INTO combat FROM public.campaign_combat_state_v2 WHERE campaign_id=campaign;
 PERFORM public.declare_campaign_attack_intent_v2(intent_id,campaign,attacker,defender,
  'arma-qa',1,1,combat.turn_instance_id);
 PERFORM set_config('request.jwt.claim.sub','a1980000-0000-4000-8000-000000000001',true);
 PERFORM public.confirm_campaign_attack_defense_choice_v2(defense_id,intent_id,'bloqueio');
 PERFORM set_config('request.jwt.claim.sub','a1980000-0000-4000-8000-000000000002',true);
 budget:=public.get_character_pe_budget(attacker);
 attack:=public.confirm_character_combat_attack(gen_random_uuid(),attacker,20,0,budget->>'key',
  '{"weaponId":"arma-qa","specialAttackIncrements":0,"sneakAttack":false,
    "lethalShot":false,"techniques":[],"lethalCount":0,"otherPaidBonuses":[],
    "targetCharacterId":"a1980000-0000-4000-8000-000000000012",
    "attackIntentId":"a1980000-0000-4000-8000-000000000041"}'::jsonb,
  '{"entry":{"type":"attack","label":"Ataque QA","results":[12],
    "diceCount":1,"bestResult":12,"skillBonus":5,"otherBonuses":0,"bonus":5,"total":17}}'::jsonb);
 PERFORM set_config('request.jwt.claim.sub','a1980000-0000-4000-8000-000000000003',true);
 BEGIN
  PERFORM public.confirm_campaign_attack_target_v2(operation,campaign,attack.id,defender,20,1,1,
   '{"defenseTotal":16,"grossDamage":12,"damageType":"corte","resistedDamage":3,
     "damageReduction":2,"immuneDamage":false}');
  RAISE EXCEPTION 'Jogador resolveu ataque reservado ao mestre';
 EXCEPTION WHEN SQLSTATE '42501' THEN NULL; END;
 PERFORM set_config('request.jwt.claim.sub','a1980000-0000-4000-8000-000000000001',true);
 SELECT * INTO special FROM public.character_activity_events WHERE id=defense_id;
 request:=jsonb_build_object('defenseTotal',16,'grossDamage',12,'damageType','corte',
  'resistedDamage',3,'damageReduction',2,'immuneDamage',false,
  'specialDefenseEventId',special.id,'reviewNote','Bloqueio conferido pela mesa');
 BEGIN
  PERFORM public.confirm_campaign_attack_target_v2(operation,campaign,attack.id,defender,20,1,1,
   request-'specialDefenseEventId');
  RAISE EXCEPTION 'Defesa registrada foi ignorada';
 EXCEPTION WHEN SQLSTATE '22023' THEN NULL; END;
 result:=public.confirm_campaign_attack_target_v2(operation,campaign,attack.id,defender,20,1,1,request);
 IF result->>'hit'<>'true' OR result->>'finalDamage'<>'7'
  OR result->>'temporaryHPUsed'<>'5' OR result->>'hpAfter'<>'18' THEN
  RAISE EXCEPTION 'Acerto, dano, proteção ou PV incorretos: %',result; END IF;
 IF (SELECT count(*) FROM public.character_activity_events WHERE payload->>'operationId'=operation::text)<>2 THEN
  RAISE EXCEPTION 'Históricos do atacante e defensor ausentes'; END IF;
 IF (SELECT payload->>'resolution' FROM public.character_activity_events WHERE id=special.id)
  <> 'mestre_confirmou_resultado'
  OR result->>'timingVerifiedByServer'<>'true'
  OR result->>'specialDefenseReview'<>'declared_before_roll'
  OR (SELECT payload->>'effectApplied' FROM public.character_activity_events WHERE id=special.id)<>'false' THEN
  RAISE EXCEPTION 'Defesa especial perdeu o registro pré-rolagem ou aplicou efeito automaticamente'; END IF;
 replay:=public.confirm_campaign_attack_target_v2(operation,campaign,attack.id,defender,20,1,1,request);
 IF replay IS DISTINCT FROM result OR (SELECT hp_current FROM public.characters WHERE id=defender)<>18
  OR (SELECT count(*) FROM public.character_activity_events WHERE payload->>'operationId'=operation::text)<>2 THEN
  RAISE EXCEPTION 'Reenvio duplicou dano ou histórico'; END IF;
 BEGIN
  PERFORM public.confirm_campaign_attack_target_v2(operation,campaign,attack.id,defender,20,1,1,
   jsonb_set(request,'{grossDamage}','13'));
  RAISE EXCEPTION 'UUID reutilizado com outro dano';
 EXCEPTION WHEN SQLSTATE '23505' THEN NULL; END;
 BEGIN
  PERFORM public.confirm_campaign_attack_target_v2(gen_random_uuid(),campaign,attack.id,defender,18,1,1,
   jsonb_set(request,'{specialDefenseEventId}','null'));
  RAISE EXCEPTION 'Ataque duplicado no alvo';
 EXCEPTION WHEN SQLSTATE '23505' THEN NULL; END;
 BEGIN
  PERFORM public.confirm_campaign_attack_target_v2(gen_random_uuid(),campaign,attack.id,defender,20,1,1,request);
  RAISE EXCEPTION 'PV obsoleto aceito';
 EXCEPTION WHEN SQLSTATE '40001' THEN NULL; END;
END $$;
-- Vinte natural continua sujeito à Defesa personalizada da mesa.
SELECT set_config('request.jwt.claim.sub','a1980000-0000-4000-8000-000000000001',true);
SELECT public.save_campaign_combat_v2('a1980000-0000-4000-8000-000000000020',1,
 '{"active":true,"round":2,"currentTurnIndex":0,"combatants":[
  {"id":"a1980000-0000-4000-8000-000000000011","name":"Atacante","initiative":20},
  {"id":"a1980000-0000-4000-8000-000000000012","name":"Defensor","initiative":10}]}');
SELECT set_config('request.jwt.claim.sub','a1980000-0000-4000-8000-000000000002',true);
DO $$
DECLARE attack public.character_activity_events; budget jsonb; result jsonb;
 combat public.campaign_combat_state_v2;
 intent_id uuid:='a1980000-0000-4000-8000-000000000043';
BEGIN
 SELECT * INTO combat FROM public.campaign_combat_state_v2
  WHERE campaign_id='a1980000-0000-4000-8000-000000000020';
 PERFORM public.declare_campaign_attack_intent_v2(intent_id,
  'a1980000-0000-4000-8000-000000000020',
  'a1980000-0000-4000-8000-000000000011',
  'a1980000-0000-4000-8000-000000000012',
  'arma-qa',1,2,combat.turn_instance_id);
 PERFORM set_config('request.jwt.claim.sub','a1980000-0000-4000-8000-000000000001',true);
 PERFORM public.confirm_campaign_attack_defense_choice_v2(
  'a1980000-0000-4000-8000-000000000044',intent_id,'none');
 PERFORM set_config('request.jwt.claim.sub','a1980000-0000-4000-8000-000000000002',true);
 budget:=public.get_character_pe_budget('a1980000-0000-4000-8000-000000000011');
 attack:=public.confirm_character_combat_attack(gen_random_uuid(),
  'a1980000-0000-4000-8000-000000000011',20,0,budget->>'key',
  '{"weaponId":"arma-qa","specialAttackIncrements":0,"sneakAttack":false,
    "lethalShot":false,"techniques":[],"lethalCount":0,"otherPaidBonuses":[],
    "targetCharacterId":"a1980000-0000-4000-8000-000000000012",
    "attackIntentId":"a1980000-0000-4000-8000-000000000043"}'::jsonb,
  '{"entry":{"type":"attack","label":"Ataque QA 20 natural","results":[20],
    "diceCount":1,"bestResult":20,"skillBonus":5,"otherBonuses":0,"bonus":5,"total":25}}'::jsonb);
 PERFORM set_config('request.jwt.claim.sub','a1980000-0000-4000-8000-000000000001',true);
 result:=public.confirm_campaign_attack_target_v2(gen_random_uuid(),
  'a1980000-0000-4000-8000-000000000020',attack.id,
  'a1980000-0000-4000-8000-000000000012',18,1,2,
  '{"defenseTotal":30,"grossDamage":10,"damageType":"corte",
    "resistedDamage":0,"damageReduction":0,"immuneDamage":false}');
 IF result->>'hit'<>'false' OR result->>'hpAfter'<>'18'
  OR result->>'finalDamage'<>'0' THEN
  RAISE EXCEPTION '20 natural ignorou a Defesa personalizada: %',result; END IF;
END $$;
RESET ROLE;
DO $$ BEGIN
 IF (SELECT remaining FROM public.character_temporary_resources WHERE source_key='qa-corte')<>0
  THEN RAISE EXCEPTION 'Reservatório de corte não foi consumido'; END IF;
END $$;
UPDATE public.characters SET conditions='[{"id":"marca-da-mesa","name":"Marca da mesa","params":{"valor":7}}]'
WHERE id='a1980000-0000-4000-8000-000000000012';
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','a1980000-0000-4000-8000-000000000001',true);
DO $$
DECLARE campaign uuid:='a1980000-0000-4000-8000-000000000020';
 attacker uuid:='a1980000-0000-4000-8000-000000000011';
 defender uuid:='a1980000-0000-4000-8000-000000000012';
 round_number integer; previous_hp integer:=18; intent_id uuid; operation_id uuid;
 combat public.campaign_combat_state_v2; attack public.character_activity_events;
 budget jsonb; request jsonb; receipt jsonb; conditions jsonb;
BEGIN
 FOR round_number IN 3..4 LOOP
  PERFORM set_config('request.jwt.claim.sub','a1980000-0000-4000-8000-000000000001',true);
  PERFORM public.save_campaign_combat_v2(campaign,round_number-1,
   jsonb_build_object('active',true,'round',round_number,'currentTurnIndex',0,
    'combatants',jsonb_build_array(
      jsonb_build_object('id',attacker,'name','Atacante','initiative',20),
      jsonb_build_object('id',defender,'name','Defensor','initiative',10))));
  SELECT * INTO combat FROM public.campaign_combat_state_v2 WHERE campaign_id=campaign;
  PERFORM set_config('request.jwt.claim.sub','a1980000-0000-4000-8000-000000000002',true);
  intent_id:=gen_random_uuid();
  PERFORM public.declare_campaign_attack_intent_v2(intent_id,campaign,attacker,defender,
   'arma-qa',1,round_number,combat.turn_instance_id);
  PERFORM set_config('request.jwt.claim.sub','a1980000-0000-4000-8000-000000000001',true);
  PERFORM public.confirm_campaign_attack_defense_choice_v2(gen_random_uuid(),intent_id,'none');
  PERFORM set_config('request.jwt.claim.sub','a1980000-0000-4000-8000-000000000002',true);
  budget:=public.get_character_pe_budget(attacker);
  attack:=public.confirm_character_combat_attack(gen_random_uuid(),attacker,20,0,
   budget->>'key',jsonb_build_object('weaponId','arma-qa','specialAttackIncrements',0,
   'sneakAttack',false,'lethalShot',false,'techniques','[]'::jsonb,'lethalCount',0,
   'otherPaidBonuses','[]'::jsonb,'targetCharacterId',defender,'attackIntentId',intent_id),
   '{"entry":{"type":"attack","label":"QA dano","results":[10],
     "diceCount":1,"bestResult":10,"skillBonus":5,"otherBonuses":0,"bonus":5,"total":15}}');
  PERFORM set_config('request.jwt.claim.sub','a1980000-0000-4000-8000-000000000001',true);
  operation_id:=gen_random_uuid();
  request:='{"defenseTotal":10,"grossDamage":9,"damageType":"corte",
    "resistedDamage":0,"damageReduction":0,"immuneDamage":false}'::jsonb;
  receipt:=public.confirm_campaign_attack_target_v2(operation_id,campaign,attack.id,
   defender,previous_hp,1,round_number,request);
  IF public.confirm_campaign_attack_target_v2(operation_id,campaign,attack.id,
   defender,previous_hp,1,round_number,request) IS DISTINCT FROM receipt THEN
   RAISE EXCEPTION 'Reenvio de ataque mudou recibo de condições'; END IF;
  SELECT c.conditions INTO conditions FROM public.characters c WHERE c.id=defender;
  IF (SELECT c.hp_current FROM public.characters c WHERE c.id=defender)<>previous_hp-9
   OR NOT EXISTS(SELECT 1 FROM jsonb_array_elements(conditions) c
      WHERE c->>'id'='marca-da-mesa' AND c#>>'{params,valor}'='7')
   OR NOT EXISTS(SELECT 1 FROM jsonb_array_elements(conditions) c WHERE c->>'id'='machucado')
   OR (round_number=4 AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements(conditions) c
     WHERE c->>'id'='inconsciente'))
   OR (round_number=4 AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements(conditions) c
     WHERE c->>'id'='morrendo')) THEN
   RAISE EXCEPTION 'Ataque não reconciliou condições no marco de PV: %',round_number; END IF;
  IF (SELECT payload->'conditionsAfter' FROM public.character_activity_events
      WHERE id=(receipt->>'targetEventId')::uuid) IS DISTINCT FROM conditions THEN
   RAISE EXCEPTION 'Histórico do alvo não contém condições confirmadas'; END IF;
  previous_hp:=previous_hp-9;
 END LOOP;
END $$;
ROLLBACK;
