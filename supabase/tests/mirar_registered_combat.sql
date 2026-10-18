-- Ensaio isolado no banco com as migrations aplicadas; tudo é revertido.
BEGIN;
INSERT INTO auth.users(id) VALUES
 ('a1800000-0000-4000-8000-000000000001'),('a1800000-0000-4000-8000-000000000002');
INSERT INTO public.characters(id,user_id,name,origin,class,class_track,nex,hp_current,hp_max,pe_current,pe_max,san_current,san_max,skills,inventory)
VALUES('a1800000-0000-4000-8000-000000000003','a1800000-0000-4000-8000-000000000002','QA Mirar rollback',
 'Militar','Especialista','atirador-elite',40,20,20,20,20,30,30,'{"pontaria":1}',
 '[{"id":"qa-rifle","name":"Rifle QA","itemType":"weapon","isEquipped":true}]');
INSERT INTO public.campaigns_v2(id,master_id,name) VALUES
 ('a1800000-0000-4000-8000-000000000004','a1800000-0000-4000-8000-000000000001','QA Mirar rollback');
INSERT INTO public.campaign_members_v2(campaign_id,user_id,character_id,role) VALUES
 ('a1800000-0000-4000-8000-000000000004','a1800000-0000-4000-8000-000000000002',
  'a1800000-0000-4000-8000-000000000003','player');
INSERT INTO public.campaign_combat_state_v2(campaign_id,state) VALUES
 ('a1800000-0000-4000-8000-000000000004',
  '{"active":true,"round":1,"currentTurnIndex":0,"combatants":[{"id":"a1800000-0000-4000-8000-000000000003","name":"QA Mirar","initiative":12}]}');
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','a1800000-0000-4000-8000-000000000002',true);
DO $$
DECLARE c uuid:='a1800000-0000-4000-8000-000000000003'; budget jsonb;
 aim public.character_activity_events; attack public.character_activity_events;
 selection jsonb:='{"weaponId":"qa-rifle","specialAttackIncrements":0,"sneakAttack":false,"lethalShot":true,"mirarDeclared":true,"techniques":[],"lethalCount":0,"otherPaidBonuses":[]}';
 payload jsonb:='{"entry":{"type":"attack","label":"Disparo QA","results":[12],"diceCount":1,"bestResult":12,"skillBonus":5,"otherBonuses":0,"bonus":5,"total":17}}';
BEGIN
 budget:=public.get_character_pe_budget(c);
 IF budget->>'mode'<>'combat' THEN RAISE EXCEPTION 'Combate QA ausente'; END IF;
 BEGIN
  PERFORM public.confirm_character_combat_attack(gen_random_uuid(),c,20,1,budget->>'key',selection,payload);
  RAISE EXCEPTION 'Disparo Letal aceito sem Mirar';
 EXCEPTION WHEN SQLSTATE '55004' THEN NULL; END;
 IF (SELECT pe_current FROM public.characters WHERE id=c)<>20 THEN RAISE EXCEPTION 'Recusa cobrou PE'; END IF;
 aim:=public.confirm_character_mirar('a1800000-0000-4000-8000-000000000010',c,budget->>'key','qa-rifle');
 IF (public.confirm_character_mirar(aim.id,c,budget->>'key','qa-rifle')).id<>aim.id
  OR public.get_character_mirar_status(c)->>'available'<>'true' THEN
  RAISE EXCEPTION 'Mirar não registrado ou retry inválido'; END IF;
 attack:=public.confirm_character_combat_attack('a1800000-0000-4000-8000-000000000011',c,20,1,budget->>'key',selection,payload);
 IF attack.payload->>'mirarOperationId'<>aim.id::text
  OR (public.confirm_character_combat_attack(attack.id,c,20,1,budget->>'key',selection,payload)).id<>attack.id
  OR public.get_character_mirar_status(c)->>'available'<>'false'
  OR (SELECT pe_current FROM public.characters WHERE id=c)<>19 THEN
  RAISE EXCEPTION 'Ataque não vinculou/consumiu Mirar ou cobrou duas vezes'; END IF;
 BEGIN
  PERFORM public.confirm_character_combat_attack(gen_random_uuid(),c,19,1,budget->>'key',selection,payload);
  RAISE EXCEPTION 'Mirar reutilizado';
 EXCEPTION WHEN SQLSTATE '55004' THEN NULL; END;
 PERFORM public.confirm_character_mirar(gen_random_uuid(),c,budget->>'key','qa-rifle');
 PERFORM public.confirm_character_combat_attack(gen_random_uuid(),c,19,0,budget->>'key',
  selection||'{"lethalShot":false,"mirarDeclared":false}',payload);
 IF public.get_character_mirar_status(c)->>'available'<>'false' THEN
  RAISE EXCEPTION 'Ataque comum não consumiu Mirar'; END IF;
 PERFORM public.confirm_character_mirar(gen_random_uuid(),c,budget->>'key','qa-rifle');
END $$;
RESET ROLE;
UPDATE public.campaign_combat_state_v2 SET state=jsonb_set(state,'{round}','2'::jsonb)
 WHERE campaign_id='a1800000-0000-4000-8000-000000000004';
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','a1800000-0000-4000-8000-000000000002',true);
DO $$ DECLARE c uuid:='a1800000-0000-4000-8000-000000000003'; BEGIN
 IF public.get_character_mirar_status(c)->>'available'<>'true' THEN
  RAISE EXCEPTION 'Mirar expirou antes do próximo turno'; END IF;
END $$;
RESET ROLE;
UPDATE public.campaign_combat_state_v2 SET state=jsonb_set(state,'{round}','3'::jsonb)
 WHERE campaign_id='a1800000-0000-4000-8000-000000000004';
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','a1800000-0000-4000-8000-000000000002',true);
DO $$ BEGIN
 IF public.get_character_mirar_status('a1800000-0000-4000-8000-000000000003')->>'available'<>'false' THEN
  RAISE EXCEPTION 'Mirar não expirou após próximo turno'; END IF;
END $$;
ROLLBACK;
SELECT 'PASS: Mirar, próximo ataque, retry, PE, prazo e rollback' AS result;
