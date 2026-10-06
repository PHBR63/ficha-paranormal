BEGIN;
SELECT set_config('test.bundle_master',user_id::text,true) FROM public.characters WHERE id='ecde39f9-2d41-4d39-ad20-c8d013e11ee7';
SELECT set_config('test.bundle_owner',id::text,true) FROM auth.users WHERE id<>current_setting('test.bundle_master')::uuid ORDER BY created_at LIMIT 1;
INSERT INTO public.characters(id,user_id,name,origin,class,hp_current,hp_max,pe_current,pe_max,san_current,san_max,conditions)
VALUES('93ba0000-0000-4000-8000-000000000001',current_setting('test.bundle_owner')::uuid,'QA BUNDLE ROLLBACK','Vítima','Combatente',10,10,4,4,15,15,
 '[{"id":"custom","name":"Caseira","params":{"valor":7}}]');
INSERT INTO public.campaigns_v2(id,master_id,name) VALUES('93ba0000-0000-4000-8000-000000000002',current_setting('test.bundle_master')::uuid,'QA BUNDLE V2 ROLLBACK');
INSERT INTO public.campaign_members_v2(campaign_id,user_id,character_id,role)
VALUES('93ba0000-0000-4000-8000-000000000002',current_setting('test.bundle_owner')::uuid,'93ba0000-0000-4000-8000-000000000001','player');
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub',current_setting('test.bundle_master'),true);
SELECT set_config('request.jwt.claims',json_build_object('sub',current_setting('test.bundle_master'),'role','authenticated')::text,true);
DO $$ DECLARE expected jsonb; conditions jsonb; result public.character_activity_events; BEGIN
 conditions:='[{"id":"custom","name":"Caseira","params":{"valor":7}}]';
 expected:=jsonb_build_object('hp_current',10,'hp_max',10,'pe_current',4,'pe_max',4,'san_current',15,'san_max',15,'conditions',conditions);
 result:=public.change_character_resources('93ba0000-0000-4000-8000-000000000010','93ba0000-0000-4000-8000-000000000001','{"hp":8,"pe":2,"san":14}',expected,conditions);
 PERFORM public.change_character_resources(result.id,result.character_id,'{"hp":8,"pe":2,"san":14}',expected,conditions);
 IF (SELECT c.hp_current FROM public.characters c WHERE c.id=result.character_id)<>8 OR (SELECT c.pe_current FROM public.characters c WHERE c.id=result.character_id)<>2
   OR (SELECT count(*) FROM public.character_activity_events e WHERE e.character_id=result.character_id)<>1 THEN RAISE EXCEPTION 'Bundle não atômico/idempotente'; END IF;
 BEGIN
   PERFORM public.change_character_resources('93ba0000-0000-4000-8000-000000000011',result.character_id,'{"hp":7,"pe":1,"san":13}',expected,conditions);
   RAISE EXCEPTION 'Snapshot desatualizado sobrescreveu recursos'; EXCEPTION WHEN serialization_failure THEN NULL; END;
 expected:=result.payload->'after';
 BEGIN
   PERFORM public.change_character_resources('93ba0000-0000-4000-8000-000000000011',result.character_id,'{"hp":7,"pe":1,"san":13}',expected||'{"hp_max":11}',conditions);
   RAISE EXCEPTION 'Máximo divergente ignorado'; EXCEPTION WHEN serialization_failure THEN NULL; END;
 BEGIN
   PERFORM public.change_character_resources('93ba0000-0000-4000-8000-000000000011',result.character_id,'{"hp":7,"pe":1,"san":13}',expected||'{"conditions":[]}',conditions);
   RAISE EXCEPTION 'Condições divergentes ignoradas'; EXCEPTION WHEN serialization_failure THEN NULL; END;
 BEGIN
   PERFORM public.change_character_resources('93ba0000-0000-4000-8000-000000000011',result.character_id,'{"hp":7.5,"pe":1,"san":13}',expected,conditions);
   RAISE EXCEPTION 'Valor fracionário aceito'; EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
END $$;
SELECT set_config('request.jwt.claim.sub',current_setting('test.bundle_owner'),true);
SELECT set_config('request.jwt.claims',json_build_object('sub',current_setting('test.bundle_owner'),'role','authenticated')::text,true);
DO $$ DECLARE expected jsonb; conditions jsonb; BEGIN
 conditions:='[{"id":"custom","name":"Caseira","params":{"valor":7}}]';
 expected:=jsonb_build_object('hp_current',8,'hp_max',10,'pe_current',2,'pe_max',4,'san_current',14,'san_max',15,'conditions',conditions);
 PERFORM public.change_character_resources('93ba0000-0000-4000-8000-000000000011','93ba0000-0000-4000-8000-000000000001','{"hp":99,"pe":-1,"san":99}',expected,conditions);
 IF (SELECT c.hp_current FROM public.characters c WHERE c.id='93ba0000-0000-4000-8000-000000000001')<>10
 OR (SELECT c.pe_current FROM public.characters c WHERE c.id='93ba0000-0000-4000-8000-000000000001')<>0
 OR (SELECT c.san_current FROM public.characters c WHERE c.id='93ba0000-0000-4000-8000-000000000001')<>15
 OR (SELECT c.conditions->0->'params'->>'valor' FROM public.characters c WHERE c.id='93ba0000-0000-4000-8000-000000000001')<>'7' THEN RAISE EXCEPTION 'Clamp/dados desconhecidos incorretos'; END IF;
END $$;
SELECT set_config('request.jwt.claim.sub','93ba0000-0000-4000-8000-000000000099',true);
SELECT set_config('request.jwt.claims','{"sub":"93ba0000-0000-4000-8000-000000000099","role":"authenticated"}',true);
DO $$ BEGIN
 BEGIN
   PERFORM public.change_character_resources('93ba0000-0000-4000-8000-000000000012','93ba0000-0000-4000-8000-000000000001','{"hp":0,"pe":0,"san":0}','{}','[]');
   RAISE EXCEPTION 'Estranho alterou recursos'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
SET LOCAL ROLE anon;
SELECT set_config('request.jwt.claim.sub','',true);
SELECT set_config('request.jwt.claims','{}',true);
DO $$ BEGIN
 BEGIN
   PERFORM public.change_character_resources('93ba0000-0000-4000-8000-000000000012','93ba0000-0000-4000-8000-000000000001','{"hp":0,"pe":0,"san":0}','{}','[]');
   RAISE EXCEPTION 'Anônimo alterou recursos'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
ROLLBACK;
