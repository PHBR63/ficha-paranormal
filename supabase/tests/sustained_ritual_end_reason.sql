-- Exercita as RPCs reais em fixtures locais, sem conservar dados de teste.
BEGIN;
INSERT INTO auth.users(id) VALUES ('00000000-0000-4000-8000-000000000411');
INSERT INTO public.characters(id,user_id,name) VALUES
 ('00000000-0000-4000-8000-000000000401','00000000-0000-4000-8000-000000000411','QA motivos');
CREATE FUNCTION pg_temp.ending_snapshot(c uuid) RETURNS jsonb LANGUAGE sql AS $$
 SELECT jsonb_agg(jsonb_build_object('id',r->'id','ritual_id',r->'ritual_id','turns_active',r->'turns_active',
 'pe_spent_total',r->'pe_spent_total','sustain_config',r->'sustain_config','is_concentrating',r->'is_concentrating') ORDER BY r->>'id')
 FROM public.list_character_sustained_rituals(c) r
$$;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000411',true);
DO $$
DECLARE c uuid:='00000000-0000-4000-8000-000000000401'; cast_event public.character_activity_events;
 result public.character_activity_events; expected jsonb; operation uuid:=gen_random_uuid(); receipt uuid;
BEGIN
 cast_event:=public.cast_character_ritual(gen_random_uuid(),c,10,0,'{"ritualId":"qa","ritualName":"QA"}');
 PERFORM public.apply_character_effect(gen_random_uuid(),c,'sustain',
  '{"ritualId":"qa","ritualName":"QA","element":"Sangue","circle":1,"selectedEnhancements":[],"sustainConfig":{}}','{}',cast_event.id);
 expected:=pg_temp.ending_snapshot(c);
 BEGIN
  PERFORM public.confirm_sustained_ritual_end(gen_random_uuid(),c,'end',expected,'{"kind":"voluntario"}');
  RAISE EXCEPTION 'Alcance não confirmado aceito'; EXCEPTION WHEN invalid_parameter_value THEN NULL;
 END;
 BEGIN
  PERFORM public.confirm_sustained_ritual_end(gen_random_uuid(),c,'end',expected,'{"kind":"ajuste_manual","note":"  "}');
  RAISE EXCEPTION 'Motivo vazio aceito'; EXCEPTION WHEN invalid_parameter_value THEN NULL;
 END;
 result:=public.confirm_sustained_ritual_end(operation,c,'end',expected,'{"kind":"voluntario","rangeConfirmed":true}');
 receipt:=result.id;
 IF result.payload->'endReason'->>'kind'<>'voluntario' OR result.payload->>'reasonSource'<>'user_confirmed'
 OR (SELECT pe_current FROM public.characters WHERE id=c)<>10 THEN RAISE EXCEPTION 'Recibo ou PE incorreto'; END IF;
 result:=public.confirm_sustained_ritual_end(operation,c,'end',expected,'{"rangeConfirmed":true,"kind":"voluntario"}');
 IF result.id<>receipt THEN RAISE EXCEPTION 'Retry criou novo recibo'; END IF;
 BEGIN
  PERFORM public.confirm_sustained_ritual_end(operation,c,'end',expected,'{"kind":"dissipado"}');
  RAISE EXCEPTION 'Motivo diferente aceito no mesmo UUID'; EXCEPTION WHEN unique_violation THEN NULL;
 END;
 IF (SELECT count(*) FROM public.character_activity_events WHERE operation_id=operation)<>1 THEN
  RAISE EXCEPTION 'Recibo duplicado'; END IF;
END $$;
RESET ROLE;
-- Legados continuam disponíveis para conferência, sem inventar conjurador.
INSERT INTO public.character_sustained_rituals(character_id,user_id,ritual_id,ritual_name,element) VALUES
 ('00000000-0000-4000-8000-000000000401','00000000-0000-4000-8000-000000000411','legado','Legado','Sangue');
SET LOCAL ROLE authenticated;
DO $$
DECLARE c uuid:='00000000-0000-4000-8000-000000000401'; expected jsonb:=pg_temp.ending_snapshot(c);
BEGIN
 BEGIN
  PERFORM public.confirm_sustained_ritual_end(gen_random_uuid(),c,'end',expected,'{"kind":"voluntario","rangeConfirmed":true}');
  RAISE EXCEPTION 'Origem de legado inventada'; EXCEPTION WHEN feature_not_supported THEN NULL;
 END;
 PERFORM public.confirm_sustained_ritual_end(gen_random_uuid(),c,'end',expected,'{"kind":"ajuste_manual","note":"Legado conferido na mesa"}');
 IF EXISTS(SELECT 1 FROM public.list_character_sustained_rituals(c)) THEN RAISE EXCEPTION 'Legado permaneceu'; END IF;
END $$;
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000499',true);
DO $$ BEGIN
 BEGIN
  PERFORM public.confirm_sustained_ritual_end(gen_random_uuid(),'00000000-0000-4000-8000-000000000401','end','[]','{"kind":"dissipado"}');
  RAISE EXCEPTION 'Estranho autorizado'; EXCEPTION WHEN insufficient_privilege THEN NULL;
 END;
END $$;
RESET ROLE;
SET LOCAL ROLE anon;
DO $$ BEGIN
 IF has_function_privilege(current_user,'public.confirm_sustained_ritual_end(uuid,uuid,text,jsonb,jsonb)','EXECUTE') THEN
  RAISE EXCEPTION 'Anônimo pode executar'; END IF;
END $$;
ROLLBACK;
