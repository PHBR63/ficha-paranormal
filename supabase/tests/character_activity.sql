-- Execute após a migration ou dentro de uma transação de ensaio da migration.
-- Não cria contas: usa dono QA só como identidade; fixtures sempre rollback.
BEGIN;
SELECT set_config('test.activity_owner',user_id::text,true) FROM public.characters
 WHERE id='ecde39f9-2d41-4d39-ad20-c8d013e11ee7';
DO $$ BEGIN
 IF nullif(current_setting('test.activity_owner',true),'') IS NULL THEN RAISE EXCEPTION 'Ficha QA ausente'; END IF;
END $$;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub',current_setting('test.activity_owner'),true);
SELECT set_config('request.jwt.claims',json_build_object('sub',current_setting('test.activity_owner'),'role','authenticated')::text,true);
DO $$
DECLARE event public.character_activity_events; retry public.character_activity_events; amount integer;
BEGIN
 INSERT INTO public.characters(id,user_id,name,origin,class,hp_current,hp_max,pe_current,pe_max,conditions)
 VALUES('97ba0000-0000-4000-8000-000000000001',auth.uid(),'QA ACTIVITY ROLLBACK','Vítima','Combatente',5,10,4,4,
   '[{"id":"regra-caseira","name":"Regra caseira","params":{"valor":7},"turnsRemaining":2}]');
 INSERT INTO public.characters(id,user_id,name,origin,class)
 VALUES('97ba0000-0000-4000-8000-000000000002',auth.uid(),'QA ACTIVITY FICHA B','Vítima','Combatente');
 event:=public.record_character_activity('97ba0000-0000-4000-8000-000000000010','97ba0000-0000-4000-8000-000000000001','roll','{"total":27,"dice":[17],"skillBonus":5,"otherBonuses":5}');
 retry:=public.record_character_activity('97ba0000-0000-4000-8000-000000000010','97ba0000-0000-4000-8000-000000000001','roll','{"total":27,"dice":[17],"skillBonus":5,"otherBonuses":5}');
 IF event.id<>retry.id OR (SELECT count(*) FROM public.list_character_activity('97ba0000-0000-4000-8000-000000000001'))<>1 THEN RAISE EXCEPTION 'Registro duplicado'; END IF;
 IF EXISTS(SELECT 1 FROM public.list_character_activity('97ba0000-0000-4000-8000-000000000002')) THEN RAISE EXCEPTION 'Históricos misturados'; END IF;
 BEGIN
   PERFORM public.record_character_activity(event.id,event.character_id,'roll','{"total":999}');
   RAISE EXCEPTION 'Operação reutilizada com dados diferentes';
 EXCEPTION WHEN unique_violation THEN NULL; END;
 event:=public.cast_character_ritual('97ba0000-0000-4000-8000-000000000011','97ba0000-0000-4000-8000-000000000001',4,1,'{"ritualId":"qa","ritualName":"QA ritual"}');
 retry:=public.cast_character_ritual(event.id,event.character_id,4,1,'{"ritualId":"qa","ritualName":"QA ritual"}');
 IF (SELECT pe_current FROM public.characters WHERE id=event.character_id)<>3 OR event.status<>'pending' OR retry.id<>event.id THEN RAISE EXCEPTION 'Débito duplicado ou conjuração perdida'; END IF;
 BEGIN
   PERFORM public.cast_character_ritual('97ba0000-0000-4000-8000-000000000012',event.character_id,4,1,'{"ritualId":"qa","ritualName":"QA ritual"}');
   RAISE EXCEPTION 'Débito concorrente sobrescreveu PE';
 EXCEPTION WHEN serialization_failure THEN NULL; END;
 BEGIN
   PERFORM public.cast_character_ritual('97ba0000-0000-4000-8000-000000000012',event.character_id,3,4,'{"ritualId":"qa","ritualName":"QA ritual"}');
   RAISE EXCEPTION 'PE insuficiente aceito';
 EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
 retry:=public.apply_character_effect('97ba0000-0000-4000-8000-000000000013',event.character_id,'heal','20','{"hp_current":5,"hp_max":10}',event.id);
 PERFORM public.apply_character_effect(retry.id,event.character_id,'heal','20','{"hp_current":5,"hp_max":10}',event.id);
 IF (SELECT hp_current FROM public.characters WHERE id=event.character_id)<>10 OR retry.payload->'after'->>'hp_current'<>'10' THEN RAISE EXCEPTION 'Cura/clamp incorreto'; END IF;
 BEGIN
   PERFORM public.apply_character_effect('97ba0000-0000-4000-8000-000000000014',event.character_id,'damage','2','{"hp_current":5,"hp_max":10}');
   RAISE EXCEPTION 'Concorrência de PV ignorada';
 EXCEPTION WHEN serialization_failure THEN NULL; END;
 PERFORM public.apply_character_effect('97ba0000-0000-4000-8000-000000000014',event.character_id,'damage','2','{"hp_current":10,"hp_max":10}');
 IF (SELECT hp_current FROM public.characters WHERE id=event.character_id)<>8 THEN RAISE EXCEPTION 'Dano não confirmado'; END IF;
 PERFORM public.apply_character_effect('97ba0000-0000-4000-8000-000000000015',event.character_id,'conditions','[{"id":"vulneravel","name":"Vulnerável"}]',
   '{"conditions":[{"id":"regra-caseira","name":"Regra caseira","params":{"valor":7},"turnsRemaining":2}]}');
 IF (SELECT conditions->0->'params'->>'valor' FROM public.characters WHERE id=event.character_id)<>'7'
   OR (SELECT jsonb_array_length(conditions) FROM public.characters WHERE id=event.character_id)<>2 THEN RAISE EXCEPTION 'Condição desconhecida perdida'; END IF;
 BEGIN
   PERFORM public.apply_character_effect('97ba0000-0000-4000-8000-000000000016',event.character_id,'temporary_hp','10','{}');
   RAISE EXCEPTION 'Efeito sem suporte anunciou aplicação';
 EXCEPTION WHEN feature_not_supported THEN NULL; END;
 PERFORM public.hide_character_activity(event.character_id,true);
 IF EXISTS(SELECT 1 FROM public.list_character_activity(event.character_id)) THEN RAISE EXCEPTION 'Ocultação não aplicada'; END IF;
 IF (SELECT count(*) FROM public.list_character_activity(event.character_id,50,NULL,NULL,NULL,true))<>5 THEN RAISE EXCEPTION 'Ocultação excluiu registros'; END IF;
 PERFORM public.hide_character_activity(event.character_id,false);
 SELECT count(*) INTO amount FROM public.list_character_activity(event.character_id);
 IF amount<>5 THEN RAISE EXCEPTION 'Restauração não recuperou registros'; END IF;
 -- Mesmo horário: o ID completa o cursor, sem perder a segunda página.
 SELECT * INTO retry FROM public.list_character_activity(event.character_id,1);
 IF (SELECT count(*) FROM public.list_character_activity(event.character_id,50,NULL,retry.created_at,retry.id))<>4 THEN RAISE EXCEPTION 'Cursor perdeu registros'; END IF;
 BEGIN
   INSERT INTO public.character_activity_events(id,operation_id,character_id,author_id,category,status,payload,request_hash)
   VALUES('97ba0000-0000-4000-8000-000000000016','97ba0000-0000-4000-8000-000000000016',event.character_id,auth.uid(),'roll','confirmed','{}','qa');
   RAISE EXCEPTION 'Escrita direta permitida';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 INSERT INTO public.campaigns(id,master_id,name)
 VALUES('97ba0000-0000-4000-8000-000000000030',auth.uid(),'QA ACTIVITY V1 ROLLBACK');
 INSERT INTO public.campaign_members(campaign_id,user_id,character_id,role)
 VALUES('97ba0000-0000-4000-8000-000000000030',auth.uid(),event.character_id,'master')
 ON CONFLICT(campaign_id,user_id) DO UPDATE SET character_id=EXCLUDED.character_id;
 INSERT INTO public.campaigns_v2(id,master_id,name)
 VALUES('97ba0000-0000-4000-8000-000000000031',auth.uid(),'QA ACTIVITY V2 ROLLBACK');
 INSERT INTO public.campaign_members_v2(campaign_id,user_id,character_id,role)
 VALUES('97ba0000-0000-4000-8000-000000000031',auth.uid(),event.character_id,'master')
 ON CONFLICT(campaign_id,user_id) DO UPDATE SET character_id=EXCLUDED.character_id;
 PERFORM public.record_character_activity('97ba0000-0000-4000-8000-000000000032',event.character_id,'roll','{"total":1}',
   '97ba0000-0000-4000-8000-000000000030','v1');
 PERFORM public.record_character_activity('97ba0000-0000-4000-8000-000000000033',event.character_id,'roll','{"total":2}',
   '97ba0000-0000-4000-8000-000000000031','v2');
 BEGIN
   PERFORM public.record_character_activity('97ba0000-0000-4000-8000-000000000034',event.character_id,'roll','{"total":3}',
     '97ba0000-0000-4000-8000-000000000031','v1');
   RAISE EXCEPTION 'Contexto v2 foi tratado como v1';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;

-- Sem vínculo: nenhuma leitura e nenhuma RPC autorizada.
SELECT set_config('request.jwt.claim.sub','97ba0000-0000-4000-8000-000000000099',true);
SELECT set_config('request.jwt.claims','{"sub":"97ba0000-0000-4000-8000-000000000099","role":"authenticated"}',true);
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM public.character_activity_events WHERE character_id='97ba0000-0000-4000-8000-000000000001') THEN RAISE EXCEPTION 'Leitura vazou'; END IF;
 BEGIN
   PERFORM public.apply_character_effect('97ba0000-0000-4000-8000-000000000019','97ba0000-0000-4000-8000-000000000001','damage','10','{"hp_current":8,"hp_max":10}');
   RAISE EXCEPTION 'Estranho alterou ficha';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN
   PERFORM public.list_character_activity('97ba0000-0000-4000-8000-000000000001');
   RAISE EXCEPTION 'Estranho consultou RPC';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
-- Duas identidades reais já existentes, sem criar/alterar contas. A segunda
-- identidade só fornece a FK de uma ficha descartável; não lê seus dados.
RESET ROLE;
SELECT set_config('test.activity_second',id::text,true) FROM auth.users
 WHERE id<>current_setting('test.activity_owner')::uuid ORDER BY created_at LIMIT 1;
DO $$ BEGIN
 IF nullif(current_setting('test.activity_second',true),'') IS NULL THEN RAISE EXCEPTION 'Segunda identidade existente necessária para teste mestre'; END IF;
 INSERT INTO public.characters(id,user_id,name,origin,class,hp_current,hp_max)
 VALUES('97ba0000-0000-4000-8000-000000000040',current_setting('test.activity_second')::uuid,'QA ACTIVITY PLAYER ROLLBACK','Vítima','Combatente',10,10);
 INSERT INTO public.campaign_members(campaign_id,user_id,character_id,role)
 VALUES('97ba0000-0000-4000-8000-000000000030',current_setting('test.activity_second')::uuid,'97ba0000-0000-4000-8000-000000000040','player');
 INSERT INTO public.campaign_members_v2(campaign_id,user_id,character_id,role)
 VALUES('97ba0000-0000-4000-8000-000000000031',current_setting('test.activity_second')::uuid,'97ba0000-0000-4000-8000-000000000040','player');
END $$;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub',current_setting('test.activity_owner'),true);
SELECT set_config('request.jwt.claims',json_build_object('sub',current_setting('test.activity_owner'),'role','authenticated')::text,true);
DO $$ BEGIN
 PERFORM public.apply_character_effect('97ba0000-0000-4000-8000-000000000041','97ba0000-0000-4000-8000-000000000040','damage','1','{"hp_current":10,"hp_max":10}',NULL,
   '97ba0000-0000-4000-8000-000000000030','v1');
 PERFORM public.apply_character_effect('97ba0000-0000-4000-8000-000000000042','97ba0000-0000-4000-8000-000000000040','heal','1','{"hp_current":9,"hp_max":10}',NULL,
   '97ba0000-0000-4000-8000-000000000031','v2');
 IF (SELECT count(*) FROM public.list_character_activity('97ba0000-0000-4000-8000-000000000040'))<>2 THEN RAISE EXCEPTION 'Mestre não acompanha alvo vinculado'; END IF;
END $$;
RESET ROLE;
DELETE FROM public.campaign_members WHERE character_id='97ba0000-0000-4000-8000-000000000040';
DELETE FROM public.campaign_members_v2 WHERE character_id='97ba0000-0000-4000-8000-000000000040';
SET LOCAL ROLE authenticated;
DO $$ BEGIN
 BEGIN
   PERFORM public.apply_character_effect('97ba0000-0000-4000-8000-000000000043','97ba0000-0000-4000-8000-000000000040','damage','1','{"hp_current":10,"hp_max":10}');
   RAISE EXCEPTION 'Mestre alterou ficha sem vínculo';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
SET LOCAL ROLE anon;
SELECT set_config('request.jwt.claim.sub','',true);
SELECT set_config('request.jwt.claims','{}',true);
DO $$ BEGIN
 BEGIN
   PERFORM public.record_character_activity('97ba0000-0000-4000-8000-000000000020','97ba0000-0000-4000-8000-000000000001','roll','{}');
   RAISE EXCEPTION 'Anônimo executou RPC';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
ROLLBACK;
