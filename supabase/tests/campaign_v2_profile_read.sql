-- Nenhuma conta criada, nenhum perfil existente alterado; rollback obrigatório.
BEGIN;
SELECT set_config('test.profile_master',user_id::text,true) FROM public.characters WHERE id='ecde39f9-2d41-4d39-ad20-c8d013e11ee7';
SELECT set_config('test.profile_player',id::text,true) FROM auth.users WHERE id<>current_setting('test.profile_master')::uuid ORDER BY created_at LIMIT 1;
INSERT INTO public.profiles(user_id,display_name) VALUES(current_setting('test.profile_player')::uuid,'QA PROFILE ROLLBACK') ON CONFLICT(user_id) DO NOTHING;
INSERT INTO public.campaigns_v2(id,master_id,name) VALUES('99ba0000-0000-4000-8000-000000000001',current_setting('test.profile_master')::uuid,'QA PROFILE V2 ROLLBACK');
INSERT INTO public.campaign_members_v2(campaign_id,user_id,role) VALUES('99ba0000-0000-4000-8000-000000000001',current_setting('test.profile_player')::uuid,'player');
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub',current_setting('test.profile_master'),true);
SELECT set_config('request.jwt.claims',json_build_object('sub',current_setting('test.profile_master'),'role','authenticated')::text,true);
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE user_id=current_setting('test.profile_player')::uuid) THEN RAISE EXCEPTION 'Mestre não lê perfil do participante v2'; END IF;
END $$;
SELECT set_config('request.jwt.claim.sub',current_setting('test.profile_player'),true);
SELECT set_config('request.jwt.claims',json_build_object('sub',current_setting('test.profile_player'),'role','authenticated')::text,true);
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE user_id=current_setting('test.profile_master')::uuid) THEN RAISE EXCEPTION 'Participante não lê perfil do mestre v2'; END IF;
END $$;
SELECT set_config('request.jwt.claim.sub','99ba0000-0000-4000-8000-000000000099',true);
SELECT set_config('request.jwt.claims','{"sub":"99ba0000-0000-4000-8000-000000000099","role":"authenticated"}',true);
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM public.profiles WHERE user_id IN(current_setting('test.profile_master')::uuid,current_setting('test.profile_player')::uuid)) THEN RAISE EXCEPTION 'Perfil vazou para estranho'; END IF;
END $$;
SET LOCAL ROLE anon;
SELECT set_config('request.jwt.claim.sub','',true);
SELECT set_config('request.jwt.claims','{}',true);
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM public.profiles WHERE user_id IN(current_setting('test.profile_master')::uuid,current_setting('test.profile_player')::uuid)) THEN RAISE EXCEPTION 'Perfil vazou para anônimo'; END IF;
END $$;
ROLLBACK;
