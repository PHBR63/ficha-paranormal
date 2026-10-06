-- Fixtures apenas transacionais. Usa a identidade QA existente, sem criar contas.
BEGIN;
SELECT set_config('test.filters_owner',user_id::text,true) FROM public.characters WHERE id='ecde39f9-2d41-4d39-ad20-c8d013e11ee7';
DO $$ BEGIN IF nullif(current_setting('test.filters_owner',true),'') IS NULL THEN RAISE EXCEPTION 'Ficha QA ausente'; END IF; END $$;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub',current_setting('test.filters_owner'),true);
SELECT set_config('request.jwt.claims',json_build_object('sub',current_setting('test.filters_owner'),'role','authenticated')::text,true);
DO $$ BEGIN
 INSERT INTO public.characters(id,user_id,name,origin,class,hp_current,hp_max,pe_current,pe_max)
 VALUES('98fa0000-0000-4000-8000-000000000001',auth.uid(),'QA FILTROS ROLLBACK','Vítima','Combatente',5,10,4,4);
 INSERT INTO public.campaigns(id,master_id,name) VALUES('98fa0000-0000-4000-8000-000000000010',auth.uid(),'QA FILTROS V1');
 INSERT INTO public.campaigns_v2(id,master_id,name) VALUES('98fa0000-0000-4000-8000-000000000011',auth.uid(),'QA FILTROS V2');
 INSERT INTO public.campaign_members(campaign_id,user_id,character_id,role)
 VALUES('98fa0000-0000-4000-8000-000000000010',auth.uid(),'98fa0000-0000-4000-8000-000000000001','master')
 ON CONFLICT(campaign_id,user_id) DO UPDATE SET character_id=EXCLUDED.character_id;
 INSERT INTO public.campaign_members_v2(campaign_id,user_id,character_id,role)
 VALUES('98fa0000-0000-4000-8000-000000000011',auth.uid(),'98fa0000-0000-4000-8000-000000000001','master')
 ON CONFLICT(campaign_id,user_id) DO UPDATE SET character_id=EXCLUDED.character_id;
 -- IDs iguais em namespaces diferentes não podem misturar v1/v2.
 INSERT INTO public.campaign_sessions(id,campaign_id,session_number,title,status)
 VALUES('98fa0000-0000-4000-8000-000000000020','98fa0000-0000-4000-8000-000000000010',1,'Primeira sessão v1','in_progress');
 INSERT INTO public.campaign_sessions_v2(id,campaign_id,session_number,title,status)
 VALUES('98fa0000-0000-4000-8000-000000000020','98fa0000-0000-4000-8000-000000000011',2,'Segunda sessão v2','active');
 PERFORM public.cast_character_ritual('98fa0000-0000-4000-8000-000000000030','98fa0000-0000-4000-8000-000000000001',4,0,
   '{"ritualId":"qa","ritualName":"QA V1","sessionId":"98fa0000-0000-4000-8000-000000000020"}',
   '98fa0000-0000-4000-8000-000000000010','v1');
 PERFORM public.cast_character_ritual('98fa0000-0000-4000-8000-000000000031','98fa0000-0000-4000-8000-000000000001',4,0,
   '{"ritualId":"qa","ritualName":"QA V2","sessionId":"98fa0000-0000-4000-8000-000000000020"}',
   '98fa0000-0000-4000-8000-000000000011','v2');
 PERFORM public.apply_character_effect('98fa0000-0000-4000-8000-000000000032','98fa0000-0000-4000-8000-000000000001','heal','0',
   '{"hp_current":5,"hp_max":10}','98fa0000-0000-4000-8000-000000000030');
 PERFORM public.record_character_activity('98fa0000-0000-4000-8000-000000000033','98fa0000-0000-4000-8000-000000000001','roll','{"total":3}');
END $$;
-- Só o runner prepara a data histórica; clientes seguem sem UPDATE no ledger.
RESET ROLE;
UPDATE public.character_activity_events SET created_at=clock_timestamp()-interval '45 days' WHERE id='98fa0000-0000-4000-8000-000000000033';
SET LOCAL ROLE authenticated;
DO $$ DECLARE page public.character_activity_events; BEGIN
 IF (SELECT count(*) FROM public.list_character_activity_filtered('98fa0000-0000-4000-8000-000000000001',50,NULL,NULL,NULL,false,clock_timestamp()-interval '7 days'))<>3 THEN RAISE EXCEPTION 'Período incorreto'; END IF;
 IF (SELECT count(*) FROM public.list_character_activity_filtered('98fa0000-0000-4000-8000-000000000001',50,NULL,NULL,NULL,false,NULL,
   '98fa0000-0000-4000-8000-000000000020','98fa0000-0000-4000-8000-000000000010','v1'))<>2 THEN RAISE EXCEPTION 'Sessão v1 não incluiu aplicação ou misturou v2'; END IF;
 IF (SELECT count(*) FROM public.list_character_activity_filtered('98fa0000-0000-4000-8000-000000000001',50,NULL,NULL,NULL,false,NULL,
   '98fa0000-0000-4000-8000-000000000020','98fa0000-0000-4000-8000-000000000011','v2'))<>1 THEN RAISE EXCEPTION 'Sessão v2 misturou v1'; END IF;
 IF (SELECT count(*) FROM public.list_character_activity_sessions('98fa0000-0000-4000-8000-000000000001'))<>2 THEN RAISE EXCEPTION 'Opções de sessão incompletas'; END IF;
 SELECT * INTO page FROM public.list_character_activity_filtered('98fa0000-0000-4000-8000-000000000001',1,NULL,NULL,NULL,false,clock_timestamp()-interval '7 days');
 IF (SELECT count(*) FROM public.list_character_activity_filtered('98fa0000-0000-4000-8000-000000000001',50,NULL,page.created_at,page.id,false,clock_timestamp()-interval '7 days'))<>2 THEN RAISE EXCEPTION 'Filtro aplicado depois da paginação'; END IF;
 BEGIN
  PERFORM public.list_character_activity_filtered('98fa0000-0000-4000-8000-000000000001',50,NULL,NULL,NULL,false,NULL,'98fa0000-0000-4000-8000-000000000020');
  RAISE EXCEPTION 'Contexto incompleto aceito';
 EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
 PERFORM public.hide_character_activity('98fa0000-0000-4000-8000-000000000001');
 IF EXISTS(SELECT 1 FROM public.list_character_activity_filtered('98fa0000-0000-4000-8000-000000000001')) THEN RAISE EXCEPTION 'Filtro perdeu ocultação'; END IF;
 IF (SELECT count(*) FROM public.list_character_activity_filtered('98fa0000-0000-4000-8000-000000000001',50,NULL,NULL,NULL,true))<>4 THEN RAISE EXCEPTION 'Ocultação excluiu registros'; END IF;
END $$;
SELECT set_config('request.jwt.claim.sub','98fa0000-0000-4000-8000-000000000099',true);
SELECT set_config('request.jwt.claims','{"sub":"98fa0000-0000-4000-8000-000000000099","role":"authenticated"}',true);
DO $$ BEGIN
 BEGIN PERFORM public.list_character_activity_filtered('98fa0000-0000-4000-8000-000000000001'); RAISE EXCEPTION 'Estranho leu histórico'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN PERFORM public.list_character_activity_sessions('98fa0000-0000-4000-8000-000000000001'); RAISE EXCEPTION 'Estranho leu sessões'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
SET LOCAL ROLE anon;
SELECT set_config('request.jwt.claim.sub','',true);
SELECT set_config('request.jwt.claims','{}',true);
DO $$ BEGIN
 BEGIN PERFORM public.list_character_activity_filtered('98fa0000-0000-4000-8000-000000000001'); RAISE EXCEPTION 'Anônimo leu histórico'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN PERFORM public.list_character_activity_sessions('98fa0000-0000-4000-8000-000000000001'); RAISE EXCEPTION 'Anônimo leu sessões'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
ROLLBACK;
SELECT 'PASS filtros período/sessão, keyset, v1/v2, aplicações, ocultação e autorização; fixtures rollback' AS result;
