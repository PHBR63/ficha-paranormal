-- Compatibilidade: a antiga RPC de defesa não aceita Bloqueio/Esquiva
-- retrospectivos. O fluxo positivo pré-rolagem tem fixture própria.
BEGIN;
INSERT INTO auth.users(id) VALUES
 ('a1970000-0000-4000-8000-000000000001'),
 ('a1970000-0000-4000-8000-000000000002'),
 ('a1970000-0000-4000-8000-000000000003');
INSERT INTO public.characters(id,user_id,name,origin,class,nex,
 hp_current,hp_max,pe_current,pe_max,san_current,san_max,skills,inventory)
VALUES
 ('a1970000-0000-4000-8000-000000000011','a1970000-0000-4000-8000-000000000002',
  'QA atacante','Militar','Combatente',20,20,20,20,20,20,20,'{"luta":1}',
  '[{"id":"arma-qa","name":"Arma QA","itemType":"weapon","type":"melee","isEquipped":true}]'),
 ('a1970000-0000-4000-8000-000000000012','a1970000-0000-4000-8000-000000000003',
  'QA defensor','Lutador','Combatente',20,20,20,20,20,20,20,
  '{"fortitude":1,"reflexos":1,"luta":1}','[]');
INSERT INTO public.campaigns_v2(id,master_id,name)
VALUES('a1970000-0000-4000-8000-000000000020',
 'a1970000-0000-4000-8000-000000000001','QA defesa antiga');
INSERT INTO public.campaign_members_v2(campaign_id,user_id,character_id,role) VALUES
 ('a1970000-0000-4000-8000-000000000020','a1970000-0000-4000-8000-000000000002',
  'a1970000-0000-4000-8000-000000000011','player'),
 ('a1970000-0000-4000-8000-000000000020','a1970000-0000-4000-8000-000000000003',
  'a1970000-0000-4000-8000-000000000012','player');
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','a1970000-0000-4000-8000-000000000001',true);
SELECT public.save_campaign_combat_v2('a1970000-0000-4000-8000-000000000020',0,
 '{"active":true,"round":1,"currentTurnIndex":0,"combatants":[
  {"id":"a1970000-0000-4000-8000-000000000011","name":"Atacante","initiative":20},
  {"id":"a1970000-0000-4000-8000-000000000012","name":"Defensor","initiative":10}]}');
DO $$
DECLARE attacker uuid:='a1970000-0000-4000-8000-000000000011';
 defender uuid:='a1970000-0000-4000-8000-000000000012';
 campaign uuid:='a1970000-0000-4000-8000-000000000020';
 attack public.character_activity_events; budget jsonb;
BEGIN
 PERFORM set_config('request.jwt.claim.sub','a1970000-0000-4000-8000-000000000002',true);
 budget:=public.get_character_pe_budget(attacker);
 attack:=public.confirm_character_combat_attack(gen_random_uuid(),attacker,20,0,budget->>'key',
  '{"weaponId":"arma-qa","specialAttackIncrements":0,"sneakAttack":false,
    "lethalShot":false,"techniques":[],"lethalCount":0,"otherPaidBonuses":[]}'::jsonb,
  '{"entry":{"type":"attack","label":"Ataque sem alvo","results":[12],
    "diceCount":1,"bestResult":12,"skillBonus":5,"otherBonuses":0,
    "bonus":5,"total":17}}'::jsonb);
 PERFORM set_config('request.jwt.claim.sub','a1970000-0000-4000-8000-000000000001',true);
 BEGIN
  PERFORM public.confirm_character_special_defense_v2(gen_random_uuid(),campaign,defender,
   attack.id,'bloqueio',1,1);
  RAISE EXCEPTION 'Bloqueio pós-rolagem aceito';
 EXCEPTION WHEN SQLSTATE '55004' THEN NULL; END;
 BEGIN
  PERFORM public.confirm_character_special_defense_v2(gen_random_uuid(),campaign,defender,
   attack.id,'esquiva',1,1);
  RAISE EXCEPTION 'Esquiva pós-rolagem aceita';
 EXCEPTION WHEN SQLSTATE '55004' THEN NULL; END;
 BEGIN
  PERFORM public.confirm_character_special_defense_v2(gen_random_uuid(),campaign,defender,
   attack.id,'contra_ataque',1,1);
  RAISE EXCEPTION 'Contra-ataque sem erro resolvido aceito';
 EXCEPTION WHEN SQLSTATE '55004' THEN NULL; END;
 IF EXISTS(SELECT 1 FROM public.character_activity_events event
  WHERE event.character_id=defender AND event.payload->>'kind'='special_defense') THEN
  RAISE EXCEPTION 'Defesa recusada deixou histórico'; END IF;
END $$;
RESET ROLE;
ROLLBACK;
