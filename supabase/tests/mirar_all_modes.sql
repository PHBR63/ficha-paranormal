-- Ensaio isolado: cobrança ao Mirar sem combate, controle manual e reenvios.
BEGIN;
INSERT INTO auth.users(id) VALUES ('a1810000-0000-4000-8000-000000000001');
INSERT INTO public.characters(id,user_id,name,origin,class,class_track,nex,hp_current,hp_max,pe_current,pe_max,san_current,san_max,skills,inventory)
VALUES('a1810000-0000-4000-8000-000000000002','a1810000-0000-4000-8000-000000000001','QA Mirar modos',
 'Militar','Especialista','atirador-elite',40,20,20,20,20,30,30,'{"pontaria":1}',
 '[{"id":"qa-rifle","name":"Rifle QA","itemType":"weapon","isEquipped":true}]');
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','a1810000-0000-4000-8000-000000000001',true);
DO $$
DECLARE c uuid:='a1810000-0000-4000-8000-000000000002'; budget jsonb;
 aim public.character_activity_events; attack public.character_activity_events;
 selection jsonb:='{"weaponId":"qa-rifle","specialAttackIncrements":0,"sneakAttack":false,"lethalShot":true,"mirarDeclared":true,"techniques":[],"lethalCount":0,"otherPaidBonuses":[]}';
 payload jsonb:='{"entry":{"type":"attack","label":"Disparo QA","results":[12],"diceCount":1,"bestResult":12,"skillBonus":5,"otherBonuses":0,"bonus":5,"total":17}}';
BEGIN
 budget:=public.get_character_pe_budget(c);
 IF budget->>'mode'<>'untracked' OR budget->>'key' IS NOT NULL THEN RAISE EXCEPTION 'Turno artificial criado'; END IF;
 BEGIN
  PERFORM public.confirm_character_combat_attack(gen_random_uuid(),c,20,0,NULL,selection,payload);
  RAISE EXCEPTION 'Ataque aceito sem Mirar pago';
 EXCEPTION WHEN SQLSTATE '55004' THEN NULL; END;
 aim:=public.confirm_character_mirar('a1810000-0000-4000-8000-000000000010',c,NULL,'qa-rifle');
 IF aim.payload->>'mode'<>'untracked' OR aim.payload->'peBudget'->>'tracked'<>'false'
  OR (SELECT pe_current FROM public.characters WHERE id=c)<>19
  OR (public.confirm_character_mirar(aim.id,c,NULL,'qa-rifle')).id<>aim.id THEN
  RAISE EXCEPTION 'Cobrança sem turno ou retry incorreto'; END IF;
 BEGIN
  PERFORM public.confirm_character_mirar(gen_random_uuid(),c,NULL,'qa-rifle');
  RAISE EXCEPTION 'Mirar duplicado aceito';
 EXCEPTION WHEN SQLSTATE '55004' THEN NULL; END;
 attack:=public.confirm_character_combat_attack('a1810000-0000-4000-8000-000000000011',c,19,0,NULL,selection,payload);
 IF attack.payload->>'lethalShotPrepaid'<>'true' OR attack.payload->>'peCost'<>'0'
  OR (SELECT pe_current FROM public.characters WHERE id=c)<>19
  OR public.get_character_mirar_status(c)->>'available'<>'false'
  OR (public.confirm_character_combat_attack(attack.id,c,19,0,NULL,selection,payload)).id<>attack.id THEN
  RAISE EXCEPTION 'Ataque sem turno cobrou de novo ou duplicou histórico'; END IF;
 aim:=public.confirm_character_mirar('a1810000-0000-4000-8000-000000000012',c,NULL,'qa-rifle');
 PERFORM public.dismiss_character_mirar(c,aim.id);
 PERFORM public.dismiss_character_mirar(c,aim.id);
 IF public.get_character_mirar_status(c)->>'available'<>'false'
  OR (SELECT pe_current FROM public.characters WHERE id=c)<>18 THEN
  RAISE EXCEPTION 'Dispensa estornou PE ou manteve preparo'; END IF;
 PERFORM public.begin_character_manual_turn(gen_random_uuid(),c,0);
 budget:=public.get_character_pe_budget(c);
 IF budget->>'mode'<>'manual' OR budget->>'number'<>'1' THEN RAISE EXCEPTION 'Controle manual ausente'; END IF;
 aim:=public.confirm_character_mirar('a1810000-0000-4000-8000-000000000013',c,budget->>'key','qa-rifle');
 IF (SELECT pe_current FROM public.characters WHERE id=c)<>17
  OR aim.payload->'peBudget'->>'tracked'<>'true' THEN RAISE EXCEPTION 'Turno manual não cobrou no Mirar'; END IF;
 PERFORM public.begin_character_manual_turn(gen_random_uuid(),c,1);
 budget:=public.get_character_pe_budget(c);
 IF public.get_character_mirar_status(c)->>'available'<>'true' THEN RAISE EXCEPTION 'Mirar expirou cedo'; END IF;
 attack:=public.confirm_character_combat_attack('a1810000-0000-4000-8000-000000000014',c,17,0,budget->>'key',selection,payload);
 IF attack.payload->>'peCost'<>'0' OR public.get_character_mirar_status(c)->>'available'<>'false'
  OR (SELECT pe_current FROM public.characters WHERE id=c)<>17 THEN RAISE EXCEPTION 'Ataque manual não consumiu preparo'; END IF;
 PERFORM public.confirm_character_mirar(gen_random_uuid(),c,budget->>'key','qa-rifle');
 PERFORM public.begin_character_manual_turn(gen_random_uuid(),c,2);
 IF public.get_character_mirar_status(c)->>'available'<>'true' THEN RAISE EXCEPTION 'Mirar expirou antes do próximo turno'; END IF;
 PERFORM public.begin_character_manual_turn(gen_random_uuid(),c,3);
 IF public.get_character_mirar_status(c)->>'available'<>'false' THEN RAISE EXCEPTION 'Mirar não expirou após próximo turno'; END IF;
END $$;
ROLLBACK;
SELECT 'PASS: sem turnos, manual, PE ao Mirar, reenvio, dispensa, prazo e rollback' AS result;
