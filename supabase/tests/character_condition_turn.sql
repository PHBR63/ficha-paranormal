-- Todas as fichas e alterações deste teste são revertidas; não usa recursos de fichas reais.
BEGIN;
SELECT set_config('test.turn_owner',user_id::text,true) FROM public.characters WHERE id='ecde39f9-2d41-4d39-ad20-c8d013e11ee7';
INSERT INTO public.characters(id,user_id,name,origin,class,vigor,hp_current,hp_max,pe_current,pe_max,san_current,san_max,conditions)
VALUES('94ba0000-0000-4000-8000-000000000001',current_setting('test.turn_owner')::uuid,'QA TURNO ROLLBACK','Vítima','Combatente',2,10,10,4,4,15,15,
 '[{"id":"sangrando","name":"Sangrando"},{"id":"caseira","name":"Caseira","params":{"valor":7}}]');
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub',current_setting('test.turn_owner'),true);
SELECT set_config('request.jwt.claims',json_build_object('sub',current_setting('test.turn_owner'),'role','authenticated')::text,true);
DO $$ DECLARE expected jsonb; conditions jsonb; resolution jsonb; result public.character_activity_events; BEGIN
 conditions:='[{"id":"sangrando","name":"Sangrando"},{"id":"caseira","name":"Caseira","params":{"valor":7}}]';
 expected:=jsonb_build_object('vigor',2,'hp_current',10,'hp_max',10,'pe_current',4,'pe_max',4,'san_current',15,'san_max',15,'conditions',conditions);
 resolution:='{"profile":"base-v1.3-mesa","revision":1,"effects":[{"conditionId":"sangrando","label":"Sangrando","dice":[4],"rolled":4,"finalAmount":4,"ignoresResistance":true}],"bleedingTests":[{"index":0,"dice":[3],"kept":3,"modifier":0,"total":3,"dt":20,"passed":false}],"removeIndexes":[],"notices":[]}';
 result:=public.resolve_character_condition_turn('94ba0000-0000-4000-8000-000000000010','94ba0000-0000-4000-8000-000000000001','{"hp":6,"pe":4,"san":15}',expected,conditions,resolution);
 UPDATE public.characters SET vigor=3 WHERE id=result.character_id;
 PERFORM public.resolve_character_condition_turn(result.id,result.character_id,'{"hp":6,"pe":4,"san":15}',expected,conditions,resolution);
 UPDATE public.characters SET vigor=2 WHERE id=result.character_id;
 IF (SELECT hp_current FROM public.characters WHERE id=result.character_id)<>6 OR (SELECT count(*) FROM public.character_activity_events WHERE character_id=result.character_id)<>1
 OR result.payload->>'kind'<>'condition_turn' OR result.payload->'resolution' IS DISTINCT FROM resolution
 OR (SELECT c.conditions->1->'params'->>'valor' FROM public.characters c WHERE c.id=result.character_id)<>'7' THEN RAISE EXCEPTION 'Turno não atômico/idempotente ou perda de metadados'; END IF;
 BEGIN
   PERFORM public.resolve_character_condition_turn(gen_random_uuid(),result.character_id,'{"hp":6,"pe":4,"san":15}',expected||'{"vigor":3}',conditions,resolution);
   RAISE EXCEPTION 'Vigor divergente aceito'; EXCEPTION WHEN serialization_failure THEN NULL; END;
 BEGIN
   PERFORM public.resolve_character_condition_turn('94ba0000-0000-4000-8000-000000000011',result.character_id,'{"hp":6,"pe":4,"san":15}',expected,conditions,resolution);
   RAISE EXCEPTION 'Snapshot antigo aceito'; EXCEPTION WHEN serialization_failure THEN NULL; END;
 BEGIN
   PERFORM public.resolve_character_condition_turn(result.id,result.character_id,'{"hp":6,"pe":4,"san":15}',expected,conditions,resolution||'{"notices":["outro"]}');
   RAISE EXCEPTION 'UUID reutilizado com dados diferentes'; EXCEPTION WHEN unique_violation THEN NULL; END;
 BEGIN
   PERFORM public.resolve_character_condition_turn('94ba0000-0000-4000-8000-000000000011',result.character_id,'{"hp":5,"pe":4,"san":15}',result.payload->'after',conditions,
    jsonb_set(resolution,'{effects,0,finalAmount}','1'));
   RAISE EXCEPTION 'RD reduz perda de PV'; EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
 BEGIN
   PERFORM public.resolve_character_condition_turn('94ba0000-0000-4000-8000-000000000011',result.character_id,'{"hp":0,"pe":3,"san":15}',result.payload->'after',conditions,resolution);
   RAISE EXCEPTION 'Turno debitou PE'; EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
END $$;
SELECT set_config('request.jwt.claim.sub','94ba0000-0000-4000-8000-000000000099',true);
SELECT set_config('request.jwt.claims','{"sub":"94ba0000-0000-4000-8000-000000000099","role":"authenticated"}',true);
DO $$ BEGIN
 BEGIN
   PERFORM public.resolve_character_condition_turn(gen_random_uuid(),'94ba0000-0000-4000-8000-000000000001','{}','{}','[]','{}');
   RAISE EXCEPTION 'Estranho alterou turno'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
SET LOCAL ROLE anon;
DO $$ BEGIN
 BEGIN
   PERFORM public.resolve_character_condition_turn(gen_random_uuid(),'94ba0000-0000-4000-8000-000000000001','{}','{}','[]','{}');
   RAISE EXCEPTION 'Anônimo alterou turno'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
ROLLBACK;
SELECT 'PASS: turno, retry, conflito, PV, metadados, permissões; rollback' AS result;
