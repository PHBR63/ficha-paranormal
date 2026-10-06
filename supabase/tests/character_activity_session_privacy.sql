-- Receber um efeito não concede acesso ao nome/título de outra campanha.
BEGIN;
SELECT set_config('test.session_master',user_id::text,true) FROM public.characters WHERE id='ecde39f9-2d41-4d39-ad20-c8d013e11ee7';
SELECT set_config('test.session_player',id::text,true) FROM auth.users WHERE id<>current_setting('test.session_master')::uuid ORDER BY created_at LIMIT 1;
INSERT INTO public.characters(id,user_id,name,origin,class,pe_current,pe_max,hp_current,hp_max)
VALUES('94ba0000-0000-4000-8000-000000000001',current_setting('test.session_master')::uuid,'QA SESSION CASTER ROLLBACK','Vítima','Ocultista',4,4,5,10),
 ('94ba0000-0000-4000-8000-000000000002',current_setting('test.session_player')::uuid,'QA SESSION TARGET ROLLBACK','Vítima','Combatente',4,4,5,10);
INSERT INTO public.campaigns_v2(id,master_id,name) VALUES
 ('94ba0000-0000-4000-8000-000000000003',current_setting('test.session_master')::uuid,'QA SESSION SOURCE PRIVADA'),
 ('94ba0000-0000-4000-8000-000000000004',current_setting('test.session_master')::uuid,'QA SESSION TARGET ROLLBACK');
UPDATE public.campaign_members_v2 SET character_id='94ba0000-0000-4000-8000-000000000001'
 WHERE campaign_id='94ba0000-0000-4000-8000-000000000003' AND user_id=current_setting('test.session_master')::uuid;
INSERT INTO public.campaign_members_v2(campaign_id,user_id,character_id,role)
 VALUES('94ba0000-0000-4000-8000-000000000004',current_setting('test.session_player')::uuid,'94ba0000-0000-4000-8000-000000000002','player');
INSERT INTO public.campaign_sessions_v2(id,campaign_id,session_number,title)
 VALUES('94ba0000-0000-4000-8000-000000000005','94ba0000-0000-4000-8000-000000000003',1,'QA SESSION TITLE PRIVADO');
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub',current_setting('test.session_master'),true);
SELECT set_config('request.jwt.claims',json_build_object('sub',current_setting('test.session_master'),'role','authenticated')::text,true);
SELECT public.cast_character_ritual('94ba0000-0000-4000-8000-000000000006','94ba0000-0000-4000-8000-000000000001',4,1,
 '{"ritualId":"qa","ritualName":"QA ritual","sessionId":"94ba0000-0000-4000-8000-000000000005"}',
 '94ba0000-0000-4000-8000-000000000003','v2');
SELECT public.apply_character_effect('94ba0000-0000-4000-8000-000000000007','94ba0000-0000-4000-8000-000000000002','heal','1',
 '{"hp_current":5,"hp_max":10}','94ba0000-0000-4000-8000-000000000006');
DO $$ BEGIN
 IF (SELECT count(*) FROM public.list_character_activity_sessions('94ba0000-0000-4000-8000-000000000002'))<>1 THEN RAISE EXCEPTION 'Mestre perdeu sessão autorizada'; END IF;
END $$;
SELECT set_config('request.jwt.claim.sub',current_setting('test.session_player'),true);
SELECT set_config('request.jwt.claims',json_build_object('sub',current_setting('test.session_player'),'role','authenticated')::text,true);
DO $$ BEGIN
 IF (SELECT count(*) FROM public.list_character_activity('94ba0000-0000-4000-8000-000000000002'))<>1 THEN RAISE EXCEPTION 'Histórico da ficha alvo desapareceu'; END IF;
 IF EXISTS(SELECT 1 FROM public.list_character_activity_sessions('94ba0000-0000-4000-8000-000000000002')) THEN RAISE EXCEPTION 'Nome/título da campanha estrangeira vazou'; END IF;
END $$;
ROLLBACK;
