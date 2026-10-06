-- Fixtures descartáveis e identidades existentes; nenhuma conta é alterada.
BEGIN;
SELECT set_config('test.master_owner',user_id::text,true) FROM public.characters WHERE id='ecde39f9-2d41-4d39-ad20-c8d013e11ee7';
SELECT set_config('test.master_player',id::text,true) FROM auth.users WHERE id<>current_setting('test.master_owner')::uuid ORDER BY created_at LIMIT 1;
INSERT INTO public.characters(id,user_id,name,origin,class,hp_current,hp_max,pe_current,pe_max,san_current,san_max,conditions)
VALUES('98ba0000-0000-4000-8000-000000000001',current_setting('test.master_player')::uuid,'QA MASTER ROLLBACK','Vítima','Combatente',10,10,4,4,15,15,
 '[{"id":"custom","name":"Caseira","params":{"n":7}},"Machucado"]');
INSERT INTO public.campaigns_v2(id,master_id,name) VALUES('98ba0000-0000-4000-8000-000000000002',current_setting('test.master_owner')::uuid,'QA MASTER V2 ROLLBACK');
INSERT INTO public.campaign_members_v2(campaign_id,user_id,character_id,role)
VALUES('98ba0000-0000-4000-8000-000000000002',current_setting('test.master_player')::uuid,'98ba0000-0000-4000-8000-000000000001','player');
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub',current_setting('test.master_owner'),true);
SELECT set_config('request.jwt.claims',json_build_object('sub',current_setting('test.master_owner'),'role','authenticated')::text,true);
DO $$ DECLARE e public.character_activity_events; BEGIN
 e:=public.change_character_resource('98ba0000-0000-4000-8000-000000000010','98ba0000-0000-4000-8000-000000000001','hp','delta',-2,10,10);
 PERFORM public.change_character_resource(e.id,e.character_id,'hp','delta',-2,10,10);
 IF (SELECT hp_current FROM public.characters WHERE id=e.character_id)<>8 THEN RAISE EXCEPTION 'Débito duplicado'; END IF;
 BEGIN
  PERFORM public.change_character_resource('98ba0000-0000-4000-8000-000000000011',e.character_id,'hp','set',5,10,10);
  RAISE EXCEPTION 'CAS ignorado'; EXCEPTION WHEN serialization_failure THEN NULL; END;
 PERFORM public.change_character_resource('98ba0000-0000-4000-8000-000000000011',e.character_id,'pe','delta',-20,4,4);
 PERFORM public.change_character_resource('98ba0000-0000-4000-8000-000000000012',e.character_id,'san','set',100,15,15);
 IF (SELECT pe_current FROM public.characters WHERE id=e.character_id)<>0 OR (SELECT san_current FROM public.characters WHERE id=e.character_id)<>15 THEN RAISE EXCEPTION 'Clamp incorreto'; END IF;
 PERFORM public.replace_character_conditions('98ba0000-0000-4000-8000-000000000013',e.character_id,
 '[{"id":"custom","name":"Caseira","params":{"n":7}}]', '[{"id":"custom","name":"Caseira","params":{"n":7}}]');
 PERFORM public.replace_character_conditions('98ba0000-0000-4000-8000-000000000013',e.character_id,
 '[{"id":"custom","name":"Caseira","params":{"n":7}}]', '[{"id":"custom","name":"Caseira","params":{"n":7}}]');
 IF (SELECT conditions->0->'params'->>'n' FROM public.characters WHERE id=e.character_id)<>'7' THEN RAISE EXCEPTION 'Metadados perdidos'; END IF;
 BEGIN
  PERFORM public.replace_character_conditions('98ba0000-0000-4000-8000-000000000014',e.character_id,'[]','[]');
  RAISE EXCEPTION 'CAS condições ignorado'; EXCEPTION WHEN serialization_failure THEN NULL; END;
 PERFORM public.replace_character_conditions('98ba0000-0000-4000-8000-000000000014',e.character_id,'[]','[{"id":"custom","name":"Caseira","params":{"n":7}}]');
 IF (SELECT count(*) FROM public.character_activity_events WHERE character_id=e.character_id)<>5 THEN RAISE EXCEPTION 'Auditoria ausente/duplicada'; END IF;
END $$;
-- Dono também está autorizado, independentemente da campanha.
SELECT set_config('request.jwt.claim.sub',current_setting('test.master_player'),true);
SELECT set_config('request.jwt.claims',json_build_object('sub',current_setting('test.master_player'),'role','authenticated')::text,true);
SELECT public.change_character_resource('98ba0000-0000-4000-8000-000000000015','98ba0000-0000-4000-8000-000000000001','hp','set',9,8,10);
SELECT set_config('request.jwt.claim.sub','98ba0000-0000-4000-8000-000000000099',true);
SELECT set_config('request.jwt.claims','{"sub":"98ba0000-0000-4000-8000-000000000099","role":"authenticated"}',true);
DO $$ BEGIN
 BEGIN
  PERFORM public.change_character_resource('98ba0000-0000-4000-8000-000000000016','98ba0000-0000-4000-8000-000000000001','hp','delta',-9,9,10);
  RAISE EXCEPTION 'Estranho aplicou recurso'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN
  PERFORM public.replace_character_conditions('98ba0000-0000-4000-8000-000000000017','98ba0000-0000-4000-8000-000000000001','[]','[]');
  RAISE EXCEPTION 'Estranho alterou condições'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
SET LOCAL ROLE anon;
SELECT set_config('request.jwt.claim.sub','',true);
SELECT set_config('request.jwt.claims','{}',true);
DO $$ BEGIN
 BEGIN
  PERFORM public.change_character_resource('98ba0000-0000-4000-8000-000000000018','98ba0000-0000-4000-8000-000000000001','hp','delta',-1,9,10);
  RAISE EXCEPTION 'Anônimo executou RPC'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
ROLLBACK;
