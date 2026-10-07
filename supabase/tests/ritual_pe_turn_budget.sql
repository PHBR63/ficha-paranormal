-- Exercita o contrato novo; todos os dados e a migration de ensaio devem ser revertidos.
BEGIN;
INSERT INTO auth.users(id) VALUES('00000000-0000-4000-8000-000000000721');
INSERT INTO public.characters(id,user_id,name,origin,class,nex,hp_current,hp_max,pe_current,pe_max,san_current,san_max,conditions)
VALUES('00000000-0000-4000-8000-000000000722','00000000-0000-4000-8000-000000000721','QA orçamento PE','Vítima','Ocultista',10,10,20,50,50,30,30,'[]');
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000721',true);
DO $$
DECLARE c uuid:='00000000-0000-4000-8000-000000000722'; body jsonb;
 receipt public.character_activity_events; cast_event public.character_activity_events;
 start_event public.character_activity_events; clock jsonb; expected jsonb; pe integer; counts integer;
BEGIN
 body:='{"ritualId":"arma-atroz","ritualName":"Arma Atroz","ritualElement":"sangue","enhancements":[],"requirementsConfirmed":true,"expectedSan":30,"expectedSanMax":30,
 "paranormalCost":{"source":"system_roll","element":"sangue","test":{"attribute":1,"dicePenalty":0,"dice":[20],"bonuses":[{"name":"QA","value":20}],"bonus":20,"total":40}}}';
 IF public.get_character_pe_budget(c)->>'mode'<>'untracked' THEN RAISE EXCEPTION 'Inventou turno'; END IF;
 cast_event:=public.cast_character_ritual(gen_random_uuid(),c,50,1,body);
 IF cast_event.payload->'peBudget'->>'tracked'<>'false' THEN RAISE EXCEPTION 'Gasto fora do controle somado'; END IF;
 PERFORM public.apply_character_effect(gen_random_uuid(),c,'sustain',
  '{"ritualId":"arma-atroz","ritualName":"Arma Atroz","element":"Sangue","circle":1,"selectedEnhancements":[],"sustainConfig":{"action":"free"}}','{}',cast_event.id);
 start_event:=public.begin_character_manual_turn(gen_random_uuid(),c,0);
 IF (public.get_character_pe_budget(c)->>'spent')::integer<>0 THEN RAISE EXCEPTION 'Início cobrou ou herdou gasto antigo'; END IF;
 PERFORM public.confirm_temporary_resource(gen_random_uuid(),c,'pe','manual:qa','QA temporário',5,false);
 cast_event:=public.cast_character_ritual(gen_random_uuid(),c,49,1,body);
 PERFORM public.cast_character_ritual(cast_event.operation_id,c,49,1,body);
 IF (public.get_character_pe_budget(c)->>'spent')::integer<>1 THEN RAISE EXCEPTION 'Retry duplicou orçamento'; END IF;
 clock:=public.get_character_ritual_turn(c);
 SELECT jsonb_agg(jsonb_build_object('id',r->'id','ritual_id',r->'ritual_id','turns_active',r->'turns_active',
 'pe_spent_total',r->'pe_spent_total','sustain_config',r->'sustain_config','is_concentrating',r->'is_concentrating') ORDER BY r->>'id')
 INTO expected FROM public.list_character_sustained_rituals(c) r;
 receipt:=public.confirm_sustained_ritual_maintenance(gen_random_uuid(),c,expected,49,clock);
 IF (public.get_character_pe_budget(c)->>'spent')::integer<>2 THEN RAISE EXCEPTION 'Manutenção não somou ao orçamento'; END IF;
 SELECT count(*) INTO counts FROM public.character_activity_events WHERE character_id=c;
 BEGIN
  PERFORM public.cast_character_ritual(gen_random_uuid(),c,49,1,body);
  RAISE EXCEPTION 'Excesso aceito';
 EXCEPTION WHEN SQLSTATE '55002' THEN NULL; END;
 IF (SELECT count(*) FROM public.character_activity_events WHERE character_id=c)<>counts
 OR (SELECT pe_current FROM public.characters WHERE id=c)<>49
 OR (SELECT sum((r->>'remaining')::integer) FROM public.list_character_temporary_resources(c) r WHERE r->>'resource'='pe')<>3 THEN
  RAISE EXCEPTION 'Excesso deixou evento ou débito'; END IF;
 receipt:=public.pause_character_manual_turn(gen_random_uuid(),c,1);
 PERFORM public.pause_character_manual_turn(receipt.operation_id,c,1);
 PERFORM public.begin_character_manual_turn(start_event.operation_id,c,0);
 IF public.get_character_pe_budget(c)->>'mode'<>'untracked' THEN RAISE EXCEPTION 'Retry antigo reativou controle'; END IF;
 IF public.get_character_ritual_turn(c)->>'eligible'<>'false' THEN RAISE EXCEPTION 'Manutenção permitida durante pausa'; END IF;
 PERFORM public.cast_character_ritual(gen_random_uuid(),c,49,1,body);
 PERFORM public.begin_character_manual_turn(gen_random_uuid(),c,1);
 IF (public.get_character_pe_budget(c)->>'spent')::integer<>0 THEN RAISE EXCEPTION 'Novo turno herdou gasto'; END IF;
 -- Base p.23: custo mínimo comprovado; aprimoramento não ganha a exceção.
 UPDATE public.characters SET nex=5 WHERE id=c;
 body:=body||'{"ritualId":"tela-de-ruido","ritualName":"Tela de Ruído"}'::jsonb;
 receipt:=public.cast_character_ritual(gen_random_uuid(),c,49,3,body);
 IF receipt.payload->'peBudget'->>'minimumCostException'<>'true' THEN RAISE EXCEPTION 'Custo mínimo recusado'; END IF;
 PERFORM public.begin_character_manual_turn(gen_random_uuid(),c,2);
 SELECT pe_current INTO pe FROM public.characters WHERE id=c;
 BEGIN
  PERFORM public.cast_character_ritual(gen_random_uuid(),c,pe,3,body||'{"enhancements":["Discente"]}'::jsonb);
  RAISE EXCEPTION 'Aprimoramento ganhou exceção';
 EXCEPTION WHEN SQLSTATE '55002' THEN NULL; END;
 -- Bônus são lidos da ficha; não há limite enviado pelo cliente.
 UPDATE public.characters SET nex=40,origin='Universitário',class_track='Intuitivo',presence=3 WHERE id=c;
 IF (public.get_character_pe_budget(c)->>'limit')::integer<>9 OR (public.get_character_pe_budget(c)->>'ritualLimit')::integer<>12 THEN
  RAISE EXCEPTION 'Bônus oficiais não conferidos'; END IF;
END $$;
RESET ROLE;
INSERT INTO public.campaigns_v2(id,master_id,name) VALUES
 ('00000000-0000-4000-8000-000000000724','00000000-0000-4000-8000-000000000721','QA orçamento combate');
INSERT INTO public.campaign_members_v2(campaign_id,user_id,role,character_id) VALUES
 ('00000000-0000-4000-8000-000000000724','00000000-0000-4000-8000-000000000721','player','00000000-0000-4000-8000-000000000722')
 ON CONFLICT(campaign_id,user_id) DO UPDATE SET character_id=EXCLUDED.character_id;
SET LOCAL ROLE authenticated;
DO $$
DECLARE c uuid:='00000000-0000-4000-8000-000000000722'; campaign uuid:='00000000-0000-4000-8000-000000000724';
 combat jsonb:='{"active":true,"round":1,"currentTurnIndex":0,"combatants":[{"id":"npc-a","name":"A","initiative":12},{"id":"npc-b","name":"B","initiative":10}]}';
 first_key text; body jsonb; pe integer; receipt public.character_activity_events;
BEGIN
 PERFORM public.save_campaign_combat_v2(campaign,0,combat);
 first_key:=public.get_character_pe_budget(c)->>'key';
 IF public.get_character_pe_budget(c)->>'mode'<>'combat' THEN RAISE EXCEPTION 'Manual venceu combate ativo'; END IF;
 body:='{"ritualId":"arma-atroz","ritualName":"Arma Atroz","ritualElement":"sangue","enhancements":[],"requirementsConfirmed":true,"expectedSan":30,"expectedSanMax":30,
 "paranormalCost":{"source":"system_roll","element":"sangue","test":{"attribute":1,"dicePenalty":0,"dice":[20],"bonuses":[{"name":"QA","value":20}],"bonus":20,"total":40}}}';
 SELECT pe_current INTO pe FROM public.characters WHERE id=c;
 receipt:=public.cast_character_ritual(gen_random_uuid(),c,pe,1,body);
 IF (public.get_character_pe_budget(c)->>'spent')::integer<>1 THEN RAISE EXCEPTION 'Combate não acumulou'; END IF;
 PERFORM public.save_campaign_combat_v2(campaign,1,combat||'{"currentTurnIndex":1}'::jsonb);
 IF public.get_character_pe_budget(c)->>'key'=first_key OR (public.get_character_pe_budget(c)->>'spent')::integer<>0 THEN
  RAISE EXCEPTION 'Troca de ator não reiniciou orçamento'; END IF;
 PERFORM public.cast_character_ritual(receipt.operation_id,c,pe,1,body);
 IF (public.get_character_pe_budget(c)->>'spent')::integer<>0 THEN RAISE EXCEPTION 'Retry antigo cobrou novo turno'; END IF;
 PERFORM public.save_campaign_combat_v2(campaign,2,combat||'{"round":2}'::jsonb);
 IF public.get_character_pe_budget(c)->>'key'=first_key THEN RAISE EXCEPTION 'Rodada reutilizou chave antiga'; END IF;
 BEGIN PERFORM public.pause_character_manual_turn(gen_random_uuid(),c,3); RAISE EXCEPTION 'Pausa manual durante combate';
 EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
 BEGIN PERFORM 1 FROM public.character_pe_turn_spending; RAISE EXCEPTION 'Ledger direto liberado';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN PERFORM public.lock_character_pe_turn(c); RAISE EXCEPTION 'Helper privado liberado';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000723',true);
DO $$ BEGIN
 BEGIN PERFORM public.get_character_pe_budget('00000000-0000-4000-8000-000000000722'); RAISE EXCEPTION 'Leitura não autorizada';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN PERFORM public.pause_character_manual_turn(gen_random_uuid(),'00000000-0000-4000-8000-000000000722',3); RAISE EXCEPTION 'Pausa não autorizada';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
ROLLBACK;
