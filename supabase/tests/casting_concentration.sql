BEGIN;
INSERT INTO auth.users(id) VALUES ('00000000-0000-4000-8000-000000000511');
INSERT INTO public.characters(id,user_id,name) VALUES ('00000000-0000-4000-8000-000000000501','00000000-0000-4000-8000-000000000511','QA concentração');
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000511',true);
DO $$
DECLARE c uuid:='00000000-0000-4000-8000-000000000501'; operation uuid:=gen_random_uuid(); result public.character_activity_events; saved_payload jsonb;
 input jsonb:='{"ritualId":"qa","ritualName":"QA","concentration":{"source":"system_roll","tests":[{"trigger":"ruim","attribute":1,"dicePenalty":0,"dice":[1],"bonuses":[{"name":"Treinamento","value":0}],"bonus":0,"total":1}]}}';
BEGIN
 result:=public.cast_character_ritual(operation,c,10,2,input);
 IF result.status<>'confirmed' OR result.payload->>'castingOutcome'<>'failed_concentration'
 OR result.payload->'concentration'->'tests'->0->>'dt'<>'17'
 OR (SELECT pe_current FROM public.characters WHERE id=c)<>8 THEN RAISE EXCEPTION 'Falha não consumiu PE ou DT incorreta'; END IF;
 BEGIN
  PERFORM public.apply_character_effect(gen_random_uuid(),c,'heal','5','{"hp_current":20,"hp_max":20}',result.id);
  RAISE EXCEPTION 'Falha permitiu efeito'; EXCEPTION WHEN SQLSTATE '55001' THEN NULL;
 END;
 PERFORM public.cast_character_ritual(operation,c,10,2,input);
 IF (SELECT pe_current FROM public.characters WHERE id=c)<>8 OR (SELECT count(*) FROM public.character_activity_events WHERE operation_id=operation)<>1 THEN
  RAISE EXCEPTION 'Retry repetiu custo ou recibo'; END IF;
 BEGIN
  PERFORM public.cast_character_ritual(gen_random_uuid(),c,8,1,jsonb_set(input,'{concentration,tests,0,total}','20'));
  RAISE EXCEPTION 'Total fraudado aceito'; EXCEPTION WHEN invalid_parameter_value THEN NULL;
 END;
 -- Um 20 selecionado continua dependendo do total, conforme regra personalizada aprovada.
 input:=jsonb_set(jsonb_set(input,'{concentration,tests,0,dice}','[20]'),'{concentration,tests,0,total}','20');
 input:=jsonb_set(input,'{concentration,tests,0,trigger}','"terrivel"');
 result:=public.cast_character_ritual(gen_random_uuid(),c,8,1,input);
 IF result.payload->>'castingOutcome'<>'failed_concentration' THEN RAISE EXCEPTION '20 virou sucesso automático'; END IF;
 -- Situação e dano são resolvidos separadamente; bônus somado pelo servidor.
 input:='{"ritualId":"qa","ritualName":"QA","concentration":{"source":"system_roll","tests":[{"trigger":"ruim","attribute":1,"dicePenalty":0,"dice":[20],"bonuses":[{"name":"Treinamento","value":5}],"bonus":5,"total":25},{"trigger":"dano","damage":30,"attribute":1,"dicePenalty":0,"dice":[20],"bonuses":[{"name":"Treinamento","value":5}],"bonus":5,"total":25}]}}';
 result:=public.cast_character_ritual(gen_random_uuid(),c,7,1,input);
 IF result.payload->'concentration'->'tests'->0->>'success'<>'true'
 OR result.payload->'concentration'->'tests'->1->>'dt'<>'30'
 OR result.payload->>'castingOutcome'<>'failed_concentration' THEN RAISE EXCEPTION 'Testes distintos não respeitados'; END IF;
 input:=jsonb_set(input,'{concentration,tests}','[{"trigger":"ruim","attribute":0,"dicePenalty":0,"dice":[1,20],"bonuses":[],"bonus":0,"total":1}]');
 result:=public.cast_character_ritual(gen_random_uuid(),c,6,1,input);
 IF result.payload->'concentration'->'tests'->0->>'kept'<>'1' THEN RAISE EXCEPTION 'Atributo zero não manteve pior dado'; END IF;
 input:=jsonb_set(input,'{concentration,tests}','[{"trigger":"ruim","attribute":1,"dicePenalty":0,"dice":[20],"bonuses":[],"bonus":0,"total":20}]');
 operation:=gen_random_uuid(); result:=public.cast_character_ritual(operation,c,5,1,input);
 IF result.payload->>'castingOutcome'<>'passed_concentration' OR result.status<>'pending' THEN RAISE EXCEPTION 'Sucesso bloqueou efeito'; END IF;
 PERFORM public.apply_character_effect(gen_random_uuid(),c,'heal','1','{"hp_current":20,"hp_max":20}',result.id);
 SELECT payload INTO saved_payload FROM public.character_activity_events WHERE id=result.id;
 result:=public.cast_character_ritual(operation,c,5,1,input);
 IF result.payload IS DISTINCT FROM saved_payload THEN RAISE EXCEPTION 'Retry mudou resolução salva'; END IF;
 IF (SELECT pe_current FROM public.characters WHERE id=c)<>4 THEN RAISE EXCEPTION 'Saldo final incorreto'; END IF;
END $$;
RESET ROLE;
SET LOCAL ROLE anon;
DO $$ BEGIN
 IF has_function_privilege(current_user,'public.cast_character_ritual_concentration_core(uuid,uuid,integer,integer,jsonb,uuid,text)','EXECUTE') THEN
  RAISE EXCEPTION 'Core exposto'; END IF;
END $$;
ROLLBACK;
