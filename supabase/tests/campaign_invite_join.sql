BEGIN;
SELECT set_config('test.invite_master',user_id::text,true) FROM public.characters WHERE id='ecde39f9-2d41-4d39-ad20-c8d013e11ee7';
SELECT set_config('test.invite_player',id::text,true) FROM auth.users WHERE id<>current_setting('test.invite_master')::uuid ORDER BY created_at LIMIT 1;
INSERT INTO public.campaigns(id,master_id,name) VALUES('95ba0000-0000-4000-8000-000000000001',current_setting('test.invite_master')::uuid,'QA INVITE V1 ROLLBACK');
INSERT INTO public.campaigns_v2(id,master_id,name) VALUES('95ba0000-0000-4000-8000-000000000002',current_setting('test.invite_master')::uuid,'QA INVITE V2 ROLLBACK'),
 ('95ba0000-0000-4000-8000-000000000003',current_setting('test.invite_master')::uuid,'QA INVITE EXPIRADO ROLLBACK');
INSERT INTO public.campaign_invites(campaign_id,created_by,invite_code,max_uses) VALUES('95ba0000-0000-4000-8000-000000000001',current_setting('test.invite_master')::uuid,'QA-V1-95BA',1);
INSERT INTO public.campaign_invites_v2(campaign_id,created_by,invite_code,expires_at) VALUES('95ba0000-0000-4000-8000-000000000003',current_setting('test.invite_master')::uuid,'QA-V2-EXPIRED-95BA',now()-interval '1 day');
INSERT INTO public.characters(id,user_id,name,origin,class) VALUES('95ba0000-0000-4000-8000-000000000004',current_setting('test.invite_player')::uuid,'QA INVITE PLAYER ROLLBACK','Vítima','Combatente');
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub',current_setting('test.invite_master'),true);
SELECT set_config('request.jwt.claims',json_build_object('sub',current_setting('test.invite_master'),'role','authenticated')::text,true);
SELECT set_config('test.invite_code',(public.create_campaign_invite_v2('95ba0000-0000-4000-8000-000000000002',1)).invite_code,true);
SELECT set_config('request.jwt.claim.sub',current_setting('test.invite_player'),true);
SELECT set_config('request.jwt.claims',json_build_object('sub',current_setting('test.invite_player'),'role','authenticated')::text,true);
DO $$ DECLARE result record; BEGIN
 BEGIN
  INSERT INTO public.campaign_members_v2(campaign_id,user_id,role) VALUES('95ba0000-0000-4000-8000-000000000002',auth.uid(),'master');
  RAISE EXCEPTION 'Bypass v2 permitiu autoentrada'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN
  INSERT INTO public.campaign_members(campaign_id,user_id,role) VALUES('95ba0000-0000-4000-8000-000000000001',auth.uid(),'player');
  RAISE EXCEPTION 'Bypass v1 permitiu autoentrada'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN
  PERFORM public.create_campaign_invite_v2('95ba0000-0000-4000-8000-000000000002');
  RAISE EXCEPTION 'Jogador criou convite alheio'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN
  PERFORM public.join_campaign_with_invite(current_setting('test.invite_code'),'ecde39f9-2d41-4d39-ad20-c8d013e11ee7');
  RAISE EXCEPTION 'Ingresso vinculou ficha alheia'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN
  PERFORM public.join_campaign_with_invite('QA-V2-EXPIRED-95BA');
  RAISE EXCEPTION 'Convite expirado aceito'; EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
 BEGIN
  PERFORM public.join_campaign_with_invite('QA-NONEXISTENT-95BA');
  RAISE EXCEPTION 'Código inexistente aceito'; EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
 SELECT * INTO result FROM public.join_campaign_with_invite(lower(current_setting('test.invite_code')),'95ba0000-0000-4000-8000-000000000004');
 IF result.campaign_version<>'v2' OR result.already_member THEN RAISE EXCEPTION 'Ingresso v2 inválido'; END IF;
 SELECT * INTO result FROM public.join_campaign_with_invite(current_setting('test.invite_code'),'95ba0000-0000-4000-8000-000000000004');
 IF NOT result.already_member THEN RAISE EXCEPTION 'Retry de ingresso não idempotente'; END IF;
 SELECT * INTO result FROM public.join_campaign_with_invite('QA-V1-95BA');
 IF result.campaign_version<>'v1' THEN RAISE EXCEPTION 'Compatibilidade v1 perdida'; END IF;
 IF EXISTS(SELECT 1 FROM public.campaign_invites_v2 WHERE campaign_id='95ba0000-0000-4000-8000-000000000002') THEN RAISE EXCEPTION 'Códigos visíveis ao jogador'; END IF;
END $$;
-- Uma identidade sem vínculo não ultrapassa o último uso, antes de qualquer FK.
SELECT set_config('request.jwt.claim.sub','95ba0000-0000-4000-8000-000000000099',true);
SELECT set_config('request.jwt.claims','{"sub":"95ba0000-0000-4000-8000-000000000099","role":"authenticated"}',true);
DO $$ BEGIN
 BEGIN
  PERFORM public.join_campaign_with_invite(current_setting('test.invite_code'));
  RAISE EXCEPTION 'Limite de uso ultrapassado'; EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
END $$;
RESET ROLE;
DO $$ BEGIN
 IF (SELECT uses FROM public.campaign_invites_v2 WHERE invite_code=current_setting('test.invite_code'))<>1 THEN RAISE EXCEPTION 'Uso v2 duplicado'; END IF;
 IF (SELECT uses FROM public.campaign_invites WHERE invite_code='QA-V1-95BA')<>1 THEN RAISE EXCEPTION 'Uso v1 incorreto'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.campaign_members_v2 WHERE campaign_id='95ba0000-0000-4000-8000-000000000002'
   AND user_id=current_setting('test.invite_player')::uuid AND character_id='95ba0000-0000-4000-8000-000000000004' AND role='player') THEN RAISE EXCEPTION 'Vínculo confirmado incorreto'; END IF;
END $$;
SET LOCAL ROLE anon;
SELECT set_config('request.jwt.claim.sub','',true);
SELECT set_config('request.jwt.claims','{}',true);
DO $$ BEGIN
 BEGIN
  PERFORM public.join_campaign_with_invite(current_setting('test.invite_code'));
  RAISE EXCEPTION 'Anônimo entrou'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
ROLLBACK;
