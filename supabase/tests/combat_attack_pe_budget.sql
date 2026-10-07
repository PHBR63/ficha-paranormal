-- Ensaio isolado: nenhuma ficha, usuário ou migração deste script deve persistir.
BEGIN;
INSERT INTO auth.users(id) VALUES('00000000-0000-4000-8000-000000000731');
INSERT INTO public.characters(id,user_id,name,origin,class,nex,hp_current,hp_max,pe_current,pe_max,san_current,san_max,inventory)
VALUES('00000000-0000-4000-8000-000000000732','00000000-0000-4000-8000-000000000731','QA ataque orçamento','Militar','Combatente',5,20,20,20,20,30,30,
'[{"id":"qa-faca","name":"Faca","itemType":"weapon","isEquipped":true,"favoriteAbilityId":"a-favorita"}]');
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000731',true);
DO $$
DECLARE c uuid:='00000000-0000-4000-8000-000000000732'; receipt public.character_activity_events; budget jsonb; pe integer;
 selection jsonb:='{"weaponId":"qa-faca","specialAttackIncrements":1,"sneakAttack":false,"lethalShot":false,"techniques":[],"lethalCount":0,"otherPaidBonuses":[]}';
 payload jsonb:='{"entry":{"type":"attack","label":"Ataque QA","results":[12],"diceCount":1,"bestResult":12,"skillBonus":5,"otherBonuses":0,"bonus":5,"total":17}}';
 ritual jsonb:='{"ritualId":"arma-atroz","ritualName":"Arma Atroz","ritualElement":"sangue","enhancements":[],"requirementsConfirmed":true,"expectedSan":30,"expectedSanMax":30,"paranormalCost":{"source":"system_roll","element":"sangue","test":{"attribute":1,"dicePenalty":0,"dice":[20],"bonuses":[{"name":"QA","value":20}],"bonus":20,"total":40}}}';
BEGIN
 -- Fora de controle: grava gasto, mas não cria turno artificial.
 receipt:=public.confirm_character_combat_attack(gen_random_uuid(),c,20,2,NULL,selection,payload);
 IF receipt.payload->>'peAfter'<>'18' OR receipt.payload->'peBudget'->>'tracked'<>'false' THEN RAISE EXCEPTION 'Gasto livre inválido'; END IF;
 PERFORM public.begin_character_manual_turn(gen_random_uuid(),c,0);
 budget:=public.get_character_pe_budget(c);
 receipt:=public.confirm_character_combat_attack(gen_random_uuid(),c,18,2,budget->>'key',selection,payload);
 PERFORM public.confirm_character_combat_attack(receipt.operation_id,c,18,2,budget->>'key',selection,payload);
 IF receipt.category<>'roll' OR receipt.payload->'peBudget'->>'minimumCostException'<>'true'
 OR (public.get_character_pe_budget(c)->>'spent')::integer<>2 OR (SELECT pe_current FROM public.characters WHERE id=c)<>16 THEN
  RAISE EXCEPTION 'Custo mínimo ou retry incorreto'; END IF;
 BEGIN
  PERFORM public.confirm_character_combat_attack(gen_random_uuid(),c,16,2,budget->>'key',selection,payload);
  RAISE EXCEPTION 'Excesso aceito'; EXCEPTION WHEN SQLSTATE '55002' THEN NULL; END;
 IF (SELECT pe_current FROM public.characters WHERE id=c)<>16 THEN RAISE EXCEPTION 'Excesso consumiu PE'; END IF;
 BEGIN
  PERFORM public.confirm_character_combat_attack(gen_random_uuid(),c,16,0,budget->>'key',selection,payload);
  RAISE EXCEPTION 'Custo falsificado aceito'; EXCEPTION WHEN SQLSTATE '22023' THEN NULL; END;
 BEGIN
  PERFORM public.confirm_character_combat_attack(gen_random_uuid(),c,16,2,'turno-antigo',selection,payload);
  RAISE EXCEPTION 'Turno antigo aceito'; EXCEPTION WHEN SQLSTATE '40001' THEN NULL; END;
 BEGIN
  PERFORM public.confirm_character_combat_attack(gen_random_uuid(),c,16,2,budget->>'key',selection,jsonb_set(payload,'{entry,total}','99'));
  RAISE EXCEPTION 'Total adulterado aceito'; EXCEPTION WHEN SQLSTATE '22023' THEN NULL; END;
 BEGIN
  PERFORM public.confirm_character_combat_attack(gen_random_uuid(),c,16,2,budget->>'key',selection,jsonb_set(payload,'{entry,results}','[21]'));
  RAISE EXCEPTION 'Dado inválido aceito'; EXCEPTION WHEN SQLSTATE '22023' THEN NULL; END;
 BEGIN
  PERFORM public.confirm_character_combat_attack(gen_random_uuid(),c,16,2,budget->>'key',selection||'{"weaponId":"arma-inexistente"}',payload);
  RAISE EXCEPTION 'Arma inexistente aceita'; EXCEPTION WHEN SQLSTATE '22023' THEN NULL; END;
 BEGIN
  PERFORM public.confirm_character_combat_attack(gen_random_uuid(),c,16,2,budget->>'key',selection||'{"techniques":["destruidor"]}',payload);
  RAISE EXCEPTION 'Técnica sem requisito aceita'; EXCEPTION WHEN SQLSTATE '22023' THEN NULL; END;
 -- Gastos temporários também contam pelo custo total e têm prioridade de consumo.
 UPDATE public.characters SET nex=15 WHERE id=c;
 PERFORM public.begin_character_manual_turn(gen_random_uuid(),c,1);
 budget:=public.get_character_pe_budget(c);
 PERFORM public.confirm_temporary_resource(gen_random_uuid(),c,'pe','manual:qa','QA temporário',3,false);
 receipt:=public.confirm_character_combat_attack(gen_random_uuid(),c,16,2,budget->>'key',selection,payload);
 IF receipt.payload->>'temporaryPEUsed'<>'2' OR receipt.payload->>'peAfter'<>'16' THEN RAISE EXCEPTION 'Temporários não consumidos primeiro'; END IF;
 -- Ritual compartilha o orçamento usado pelo ataque.
 receipt:=public.cast_character_ritual(gen_random_uuid(),c,16,1,ritual);
 IF (public.get_character_pe_budget(c)->>'spent')::integer<>3 THEN RAISE EXCEPTION 'Ritual não compartilha orçamento'; END IF;
 BEGIN
  PERFORM public.confirm_character_combat_attack(gen_random_uuid(),c,16,2,budget->>'key',selection,payload);
  RAISE EXCEPTION 'Excesso combinado aceito'; EXCEPTION WHEN SQLSTATE '55002' THEN NULL; END;
 -- Técnicas válidas: custo confirmado e progresso de NEX validado no servidor.
 UPDATE public.characters SET nex=65,class_track='aniquilador' WHERE id=c;
 PERFORM public.begin_character_manual_turn(gen_random_uuid(),c,2); budget:=public.get_character_pe_budget(c);
 receipt:=public.confirm_character_combat_attack(gen_random_uuid(),c,16,6,budget->>'key',selection||'{"techniques":["letal"],"lethalCount":2}',payload);
 IF receipt.payload->>'peCost'<>'6' OR receipt.payload->>'peAfter'<>'10' THEN RAISE EXCEPTION 'Custo de técnica repetida inválido'; END IF;
 BEGIN
  PERFORM public.confirm_character_combat_attack(receipt.operation_id,c,16,6,budget->>'key',selection,payload);
  RAISE EXCEPTION 'UUID alterado aceito'; EXCEPTION WHEN SQLSTATE '23505' THEN NULL; END;
 BEGIN
  PERFORM public.confirm_character_combat_attack(gen_random_uuid(),c,10,1,budget->>'key',selection||'{"specialAttackIncrements":0,"otherPaidBonuses":["maos-flamejantes"]}',payload);
  RAISE EXCEPTION 'Custo desconhecido aceito'; EXCEPTION WHEN SQLSTATE '0A000' THEN NULL; END;
 -- Ataque sem custo também possui histórico atômico e não altera o orçamento.
 receipt:=public.confirm_character_combat_attack(gen_random_uuid(),c,10,0,budget->>'key',selection||'{"specialAttackIncrements":0}',payload);
 IF receipt.payload->>'peAfter'<>'10' THEN RAISE EXCEPTION 'Ataque gratuito debitou'; END IF;
END $$;
RESET ROLE;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000733',true);
DO $$ BEGIN
 BEGIN
  PERFORM public.confirm_character_combat_attack(gen_random_uuid(),'00000000-0000-4000-8000-000000000732',10,0,NULL,'{}','{}');
  RAISE EXCEPTION 'Outra conta autorizada'; EXCEPTION WHEN SQLSTATE '42501' THEN NULL; END;
END $$;
RESET ROLE;
ROLLBACK;
SELECT 'combat_attack_pe_budget: passed; fixtures rolled back' AS result;
