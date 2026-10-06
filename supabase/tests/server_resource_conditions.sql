-- Somente fixtures na transação; encerra com rollback, inclusive eventos.
BEGIN;
-- Limites pares/ímpares, transições e preservação de formatos antigos.
DO $$ DECLARE value jsonb; BEGIN
 value:=public.reconcile_resource_conditions('[]',20,10,20,15,15,15);
 IF value->0->>'id' IS DISTINCT FROM 'machucado' THEN RAISE EXCEPTION 'Metade dos PV não marcou Machucado'; END IF;
 value:=public.reconcile_resource_conditions('["Machucado"]',10,11,20,15,15,15);
 IF value<>'[]'::jsonb THEN RAISE EXCEPTION 'Cura acima da metade manteve Machucado'; END IF;
 value:=public.reconcile_resource_conditions('[]',9,4,9,9,4,9);
 IF NOT value @> '[{"id":"machucado"},{"id":"perturbado"}]' THEN RAISE EXCEPTION 'Máximos ímpares incorretos'; END IF;
 value:=public.reconcile_resource_conditions('["Machucado","Perturbado"]',4,5,9,4,5,9);
 IF value<>'[]'::jsonb THEN RAISE EXCEPTION 'Máximos ímpares não removeram condições'; END IF;
 value:=public.reconcile_resource_conditions('[]',20,20,20,8,7,14);
 IF value<>'[]'::jsonb THEN RAISE EXCEPTION 'Metade exata da SAN foi Perturbado'; END IF;
 value:=public.reconcile_resource_conditions('[{"name":"Inconsciente","duration":7},"Morrendo"]',0,1,20,15,15,15);
 IF value @> '[{"name":"Inconsciente"}]' OR NOT value @> '["Morrendo",{"id":"machucado"}]' THEN RAISE EXCEPTION 'Cura/legado indevido'; END IF;
 value:=public.reconcile_resource_conditions('[{"id":"caseira","name":"Morrendo","params":{"n":7},"duration":2}]',1,20,20,15,15,15);
 IF value<>'[{"id":"caseira","name":"Morrendo","params":{"n":7},"duration":2}]'::jsonb THEN RAISE EXCEPTION 'Nome externo foi reinterpretado'; END IF;
 value:=public.reconcile_resource_conditions('[{"id":"morrendo","name":"Morrendo","dyingCounter":1}]',0,0,20,0,0,15,1);
 IF value->0->>'dyingCounter'<>'1' OR NOT value @> '[{"id":"inconsciente"}]' THEN RAISE EXCEPTION 'Dano recorrente alterou contagem ou omitiu Inconsciente'; END IF;
 BEGIN
   PERFORM public.reconcile_resource_conditions('{}',0,1,20,15,15,15);
   RAISE EXCEPTION 'Formato inválido aceito'; EXCEPTION WHEN invalid_parameter_value THEN NULL;
 END;
END $$;

SELECT set_config('test.resource_owner',user_id::text,true) FROM public.characters WHERE id='ecde39f9-2d41-4d39-ad20-c8d013e11ee7';
SELECT set_config('test.resource_player',id::text,true) FROM auth.users WHERE id<>current_setting('test.resource_owner')::uuid ORDER BY created_at LIMIT 1;
INSERT INTO public.characters(id,user_id,name,origin,class,hp_current,hp_max,pe_current,pe_max,san_current,san_max,conditions)
VALUES('9aba0000-0000-4000-8000-000000000001',current_setting('test.resource_player')::uuid,'QA TRANSITIONS ROLLBACK','Vítima','Combatente',20,20,4,4,15,15,
 '[{"id":"caseira","name":"Regra externa","turnsRemaining":2,"addedAt":"2026-10-06T15:00:00Z","params":{"n":7}}]');
INSERT INTO public.campaigns_v2(id,master_id,name) VALUES('9aba0000-0000-4000-8000-000000000002',current_setting('test.resource_owner')::uuid,'QA TRANSITIONS V2 ROLLBACK');
INSERT INTO public.campaign_members_v2(campaign_id,user_id,character_id,role)
VALUES('9aba0000-0000-4000-8000-000000000002',current_setting('test.resource_player')::uuid,'9aba0000-0000-4000-8000-000000000001','player');
INSERT INTO public.campaigns(id,master_id,name) VALUES('9aba0000-0000-4000-8000-000000000003',current_setting('test.resource_owner')::uuid,'QA TRANSITIONS V1 ROLLBACK');
INSERT INTO public.campaign_members(campaign_id,user_id,character_id,role)
VALUES('9aba0000-0000-4000-8000-000000000003',current_setting('test.resource_player')::uuid,'9aba0000-0000-4000-8000-000000000001','player');
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub',current_setting('test.resource_owner'),true);
SELECT set_config('request.jwt.claims',json_build_object('sub',current_setting('test.resource_owner'),'role','authenticated')::text,true);
DO $$ DECLARE e public.character_activity_events; cast_event public.character_activity_events; before_conditions jsonb; BEGIN
 e:=public.apply_character_effect('9aba0000-0000-4000-8000-000000000010','9aba0000-0000-4000-8000-000000000001','damage','10','{"hp_current":20,"hp_max":20}',NULL,'9aba0000-0000-4000-8000-000000000003','v1');
 IF NOT e.payload->'after'->'conditions' @> '[{"id":"machucado"}]' OR e.payload->'before'->'conditions' @> '[{"id":"machucado"}]' THEN RAISE EXCEPTION 'Dano não inclui transição no recibo'; END IF;
 PERFORM public.apply_character_effect(e.id,e.character_id,'damage','10','{"hp_current":20,"hp_max":20}',NULL,'9aba0000-0000-4000-8000-000000000003','v1');
 IF (SELECT hp_current FROM public.characters WHERE id=e.character_id)<>10 THEN RAISE EXCEPTION 'Retry duplicou dano'; END IF;
 e:=public.apply_character_effect('9aba0000-0000-4000-8000-000000000011',e.character_id,'heal','1','{"hp_current":10,"hp_max":20}');
 IF e.payload->'after'->'conditions' @> '[{"id":"machucado"}]' THEN RAISE EXCEPTION 'Cura manteve Machucado'; END IF;
 cast_event:=public.cast_character_ritual('9aba0000-0000-4000-8000-000000000012',e.character_id,4,1,'{"ritualId":"qa","ritualName":"QA dano"}');
 e:=public.apply_character_effect('9aba0000-0000-4000-8000-000000000013',e.character_id,'damage','11','{"hp_current":11,"hp_max":20}',cast_event.id);
 IF NOT e.payload->'after'->'conditions' @> '[{"id":"machucado"},{"id":"inconsciente"},{"id":"morrendo","dyingCounter":3}]' THEN RAISE EXCEPTION 'Ritual zerado não marcou condições'; END IF;
 IF (SELECT conditions->0 FROM public.characters WHERE id=e.character_id) IS DISTINCT FROM e.payload->'before'->'conditions'->0 THEN RAISE EXCEPTION 'Metadados da condição externa perdidos'; END IF;
 -- UUID e etapa de conjuração protegem contra nova aplicação.
 PERFORM public.apply_character_effect(e.id,e.character_id,'damage','11','{"hp_current":11,"hp_max":20}',cast_event.id);
 BEGIN
   PERFORM public.apply_character_effect('9aba0000-0000-4000-8000-000000000014',e.character_id,'damage','11','{"hp_current":0,"hp_max":20}',cast_event.id);
   RAISE EXCEPTION 'Mesma etapa aplicada duas vezes'; EXCEPTION WHEN unique_violation THEN NULL;
 END;
 e:=public.apply_character_effect('9aba0000-0000-4000-8000-000000000014',e.character_id,'heal','1','{"hp_current":0,"hp_max":20}');
 IF e.payload->'after'->'conditions' @> '[{"id":"inconsciente"}]' OR NOT e.payload->'after'->'conditions' @> '[{"id":"morrendo","dyingCounter":3}]' THEN RAISE EXCEPTION 'Cura estabilizou Morrendo ou manteve Inconsciente'; END IF;
 BEGIN
   PERFORM public.apply_character_effect('9aba0000-0000-4000-8000-000000000015',e.character_id,'damage','1','{"hp_current":0,"hp_max":20}');
   RAISE EXCEPTION 'CAS ignorado'; EXCEPTION WHEN serialization_failure THEN NULL;
 END;
 e:=public.change_character_resource('9aba0000-0000-4000-8000-000000000015',e.character_id,'san','set',0,15,15);
 IF NOT e.payload->'after'->'conditions' @> '[{"id":"enlouquecendo"}]' THEN RAISE EXCEPTION 'SAN zero sem Enlouquecendo'; END IF;
 e:=public.change_character_resource('9aba0000-0000-4000-8000-000000000016',e.character_id,'san','delta',1,0,15);
 IF e.payload->'after'->'conditions' @> '[{"id":"enlouquecendo"}]' OR NOT e.payload->'after'->'conditions' @> '[{"id":"perturbado"}]' THEN RAISE EXCEPTION 'Cura SAN sem transição'; END IF;
 e:=public.change_character_resource('9aba0000-0000-4000-8000-000000000017',e.character_id,'hp','set',0,1,20);
 SELECT conditions INTO before_conditions FROM public.characters WHERE id=e.character_id;
 e:=public.replace_character_conditions('9aba0000-0000-4000-8000-000000000018',e.character_id,
   '[{"id":"caseira","name":"Regra externa","turnsRemaining":2,"addedAt":"2026-10-06T15:00:00Z","params":{"n":7}},{"id":"machucado","name":"Machucado"}]',before_conditions);
 e:=public.change_character_resource('9aba0000-0000-4000-8000-000000000019',e.character_id,'pe','delta',-1,3,4);
 IF e.payload->'after'->'conditions' @> '[{"id":"inconsciente"}]' OR e.payload->'after'->'conditions' @> '[{"id":"morrendo"}]' THEN RAISE EXCEPTION 'PE recriou condição encerrada'; END IF;
 e:=public.apply_character_effect('9aba0000-0000-4000-8000-000000000020',e.character_id,'damage','0','{"hp_current":0,"hp_max":20}');
 IF e.payload->'after'->'conditions' @> '[{"id":"morrendo"}]' THEN RAISE EXCEPTION 'Dano zero recriou Morrendo'; END IF;
 e:=public.apply_character_effect('9aba0000-0000-4000-8000-000000000021',e.character_id,'damage','1','{"hp_current":0,"hp_max":20}');
 IF NOT e.payload->'after'->'conditions' @> '[{"id":"morrendo","dyingCounter":3},{"id":"inconsciente"}]' THEN RAISE EXCEPTION 'Nova perda em zero não iniciou condições'; END IF;
 BEGIN
   PERFORM public.reconcile_resource_conditions('[]',0,1,20,15,15,15);
   RAISE EXCEPTION 'Auxiliar interno exposto'; EXCEPTION WHEN insufficient_privilege THEN NULL;
 END;
END $$;
-- Proprietário independente da campanha; o retry deve retornar recibo antigo.
SELECT set_config('request.jwt.claim.sub',current_setting('test.resource_player'),true);
SELECT set_config('request.jwt.claims',json_build_object('sub',current_setting('test.resource_player'),'role','authenticated')::text,true);
DO $$ DECLARE e public.character_activity_events; BEGIN
 e:=public.apply_character_effect('9aba0000-0000-4000-8000-000000000022','9aba0000-0000-4000-8000-000000000001','heal','20','{"hp_current":0,"hp_max":20}');
 PERFORM public.change_character_resource('9aba0000-0000-4000-8000-000000000023',e.character_id,'hp','set',10,20,20);
 PERFORM public.apply_character_effect(e.id,e.character_id,'heal','20','{"hp_current":0,"hp_max":20}');
 IF (SELECT hp_current FROM public.characters WHERE id=e.character_id)<>10 OR NOT (SELECT conditions @> '[{"id":"machucado"}]' FROM public.characters WHERE id=e.character_id) THEN RAISE EXCEPTION 'Retry antigo recalculou ficha atual'; END IF;
 BEGIN
   PERFORM public.apply_character_effect(e.id,e.character_id,'heal','19','{"hp_current":0,"hp_max":20}');
   RAISE EXCEPTION 'UUID aceitou outro pedido'; EXCEPTION WHEN unique_violation THEN NULL;
 END;
END $$;
-- Formato inválido falha antes de gravar recursos/evento, sem apagar legado.
RESET ROLE;
UPDATE public.characters SET conditions='{"externa":true}' WHERE id='9aba0000-0000-4000-8000-000000000001';
SET LOCAL ROLE authenticated;
DO $$ BEGIN
 BEGIN
   PERFORM public.apply_character_effect('9aba0000-0000-4000-8000-000000000024','9aba0000-0000-4000-8000-000000000001','heal','1','{"hp_current":10,"hp_max":20}');
   RAISE EXCEPTION 'Legado inválido foi descartado'; EXCEPTION WHEN invalid_parameter_value THEN NULL;
 END;
 IF (SELECT hp_current FROM public.characters WHERE id='9aba0000-0000-4000-8000-000000000001')<>10
   OR EXISTS(SELECT 1 FROM public.character_activity_events WHERE operation_id='9aba0000-0000-4000-8000-000000000024') THEN RAISE EXCEPTION 'Falha deixou gravação parcial'; END IF;
END $$;
SELECT set_config('request.jwt.claim.sub','9aba0000-0000-4000-8000-000000000099',true);
SELECT set_config('request.jwt.claims','{"sub":"9aba0000-0000-4000-8000-000000000099","role":"authenticated"}',true);
DO $$ BEGIN
 BEGIN
   PERFORM public.apply_character_effect('9aba0000-0000-4000-8000-000000000025','9aba0000-0000-4000-8000-000000000001','damage','1','{"hp_current":10,"hp_max":20}');
   RAISE EXCEPTION 'Estranho aplicou dano'; EXCEPTION WHEN insufficient_privilege THEN NULL;
 END;
 BEGIN
   PERFORM public.change_character_resource('9aba0000-0000-4000-8000-000000000026','9aba0000-0000-4000-8000-000000000001','san','set',0,1,15);
   RAISE EXCEPTION 'Estranho alterou SAN'; EXCEPTION WHEN insufficient_privilege THEN NULL;
 END;
END $$;
SET LOCAL ROLE anon;
DO $$ BEGIN
 BEGIN
   PERFORM public.apply_character_effect('9aba0000-0000-4000-8000-000000000027','9aba0000-0000-4000-8000-000000000001','damage','1','{}');
   RAISE EXCEPTION 'Anônimo executou aplicação'; EXCEPTION WHEN insufficient_privilege THEN NULL;
 END;
END $$;
ROLLBACK;
