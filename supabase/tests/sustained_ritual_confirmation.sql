-- Fixtures isoladas; valida as funções reais com permissões e rollback.
BEGIN;
INSERT INTO auth.users(id) VALUES ('00000000-0000-4000-8000-000000000311'),('00000000-0000-4000-8000-000000000312');
INSERT INTO public.characters(id,user_id,name) VALUES
 ('00000000-0000-4000-8000-000000000301','00000000-0000-4000-8000-000000000311','QA sustentação'),
 ('00000000-0000-4000-8000-000000000302','00000000-0000-4000-8000-000000000312','QA alvo');
INSERT INTO public.campaigns_v2(id,master_id,name) VALUES
 ('00000000-0000-4000-8000-000000000303','00000000-0000-4000-8000-000000000311','QA sustentações');
INSERT INTO public.campaign_members_v2(campaign_id,user_id,character_id,role) VALUES
 ('00000000-0000-4000-8000-000000000303','00000000-0000-4000-8000-000000000311','00000000-0000-4000-8000-000000000301','player'),
 ('00000000-0000-4000-8000-000000000303','00000000-0000-4000-8000-000000000312','00000000-0000-4000-8000-000000000302','player');
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000311',true);
DO $$
DECLARE c uuid:='00000000-0000-4000-8000-000000000301'; campaign uuid:='00000000-0000-4000-8000-000000000303';
 cast_event public.character_activity_events; event public.character_activity_events; expected jsonb;
 operation uuid:=gen_random_uuid(); sustain uuid:=gen_random_uuid(); receipt uuid; old_pe integer;
BEGIN
 cast_event:=public.cast_character_ritual(gen_random_uuid(),c,10,0,'{"ritualId":"qa","ritualName":"QA"}',campaign,'v2');
 PERFORM public.apply_character_effect(gen_random_uuid(),c,'weapon_buff',
  '{"ritualId":"qa","ritualName":"QA","element":"Sangue","duration":"sustentado","attackBonus":2,"enhancements":[]}',
  '{"active_buffs":[]}',cast_event.id,campaign,'v2');
 PERFORM public.apply_character_effect(sustain,c,'sustain',
  '{"ritualId":"qa","ritualName":"QA","element":"Sangue","circle":1,"selectedEnhancements":[],"sustainConfig":{"costPerTurn":0}}',
  '{}',cast_event.id,campaign,'v2');
 IF NOT EXISTS(SELECT 1 FROM public.list_character_sustained_rituals(c) r WHERE r->>'caster_character_id'=c::text) THEN
  RAISE EXCEPTION 'Origem não retornada'; END IF;
 SELECT jsonb_agg(jsonb_build_object('id',r->'id','ritual_id',r->'ritual_id','turns_active',r->'turns_active',
  'pe_spent_total',r->'pe_spent_total','sustain_config',r->'sustain_config','is_concentrating',r->'is_concentrating') ORDER BY r->>'id')
  INTO expected FROM public.list_character_sustained_rituals(c) r;
 BEGIN
  PERFORM public.confirm_sustained_ritual_action(gen_random_uuid(),c,'maintain',expected,9);
  RAISE EXCEPTION 'Saldo obsoleto aceito'; EXCEPTION WHEN serialization_failure THEN NULL;
 END;
 event:=public.confirm_sustained_ritual_action(operation,c,'maintain',expected,10);
 receipt:=event.id;
 IF event.payload->>'peCost'<>'1' OR event.payload->>'peAfter'<>'9' THEN RAISE EXCEPTION 'Custo canônico ausente'; END IF;
 event:=public.confirm_sustained_ritual_action(operation,c,'maintain',expected,10);
 IF event.id<>receipt OR (SELECT pe_current FROM public.characters WHERE id=c)<>9 THEN RAISE EXCEPTION 'Retry cobrou novamente'; END IF;
 BEGIN
  PERFORM public.confirm_sustained_ritual_action(gen_random_uuid(),c,'maintain',expected,9);
  RAISE EXCEPTION 'Snapshot obsoleto aceito'; EXCEPTION WHEN serialization_failure THEN NULL;
 END;
 SELECT jsonb_agg(jsonb_build_object('id',r->'id','ritual_id',r->'ritual_id','turns_active',r->'turns_active',
  'pe_spent_total',r->'pe_spent_total','sustain_config',r->'sustain_config','is_concentrating',r->'is_concentrating') ORDER BY r->>'id')
  INTO expected FROM public.list_character_sustained_rituals(c) r;
 operation:=gen_random_uuid();
 event:=public.confirm_sustained_ritual_action(operation,c,'end_all',expected,NULL);
 IF (SELECT count(*) FROM public.list_character_sustained_rituals(c))<>0
 OR (SELECT active_buffs FROM public.characters WHERE id=c)<>'[]'::jsonb THEN RAISE EXCEPTION 'Encerramento deixou efeito comprovado'; END IF;
 IF jsonb_array_length(event.payload->'before'->'sustained_rituals')<>1 THEN RAISE EXCEPTION 'Histórico não conservou snapshot'; END IF;
 PERFORM public.confirm_sustained_ritual_action(operation,c,'end_all',expected,NULL);
 BEGIN
  PERFORM * FROM public.sustained_ritual_origins;
  RAISE EXCEPTION 'Prova privada exposta'; EXCEPTION WHEN insufficient_privilege THEN NULL;
 END;
END $$;
RESET ROLE;
-- Um legado não pode ser convertido silenciosamente em débito autorizado.
INSERT INTO public.character_sustained_rituals(character_id,user_id,ritual_id,ritual_name,element) VALUES
 ('00000000-0000-4000-8000-000000000301','00000000-0000-4000-8000-000000000311','legado','Legado','Sangue');
SET LOCAL ROLE authenticated;
DO $$
DECLARE c uuid:='00000000-0000-4000-8000-000000000301'; expected jsonb;
BEGIN
 SELECT jsonb_agg(jsonb_build_object('id',r->'id','ritual_id',r->'ritual_id','turns_active',r->'turns_active',
  'pe_spent_total',r->'pe_spent_total','sustain_config',r->'sustain_config','is_concentrating',r->'is_concentrating') ORDER BY r->>'id')
  INTO expected FROM public.list_character_sustained_rituals(c) r;
 BEGIN
  PERFORM public.confirm_sustained_ritual_action(gen_random_uuid(),c,'maintain',expected,9);
  RAISE EXCEPTION 'Legado cobrado'; EXCEPTION WHEN feature_not_supported THEN NULL;
 END;
 PERFORM public.confirm_sustained_ritual_action(gen_random_uuid(),c,'end',expected,NULL);
END $$;
RESET ROLE;
CREATE FUNCTION pg_temp.sustain_snapshot(c uuid) RETURNS jsonb LANGUAGE sql AS $$
 SELECT jsonb_agg(jsonb_build_object('id',r->'id','ritual_id',r->'ritual_id','turns_active',r->'turns_active',
 'pe_spent_total',r->'pe_spent_total','sustain_config',r->'sustain_config','is_concentrating',r->'is_concentrating') ORDER BY r->>'id')
 FROM public.list_character_sustained_rituals(c) r
$$;
-- Duas novas sustentações comprovadas; sem Fluxo, nenhuma cobrança é permitida.
SET LOCAL ROLE authenticated;
DO $$
DECLARE c uuid:='00000000-0000-4000-8000-000000000301'; cast_event public.character_activity_events; i integer;
BEGIN
 FOR i IN 1..2 LOOP
  cast_event:=public.cast_character_ritual(gen_random_uuid(),c,9,0,jsonb_build_object('ritualId','qa'||i,'ritualName','QA '||i));
  PERFORM public.apply_character_effect(gen_random_uuid(),c,'sustain',
   jsonb_build_object('ritualId','qa'||i,'ritualName','QA '||i,'element','Sangue','circle',1,'selectedEnhancements','[]'::jsonb,'sustainConfig','{}'::jsonb),
   '{}',cast_event.id);
 END LOOP;
 BEGIN
  PERFORM public.confirm_sustained_ritual_action(gen_random_uuid(),c,'maintain',pg_temp.sustain_snapshot(c),9);
  RAISE EXCEPTION 'Dois rituais sem Fluxo cobrados'; EXCEPTION WHEN feature_not_supported THEN NULL;
 END;
END $$;
RESET ROLE;
UPDATE public.characters SET nex=60,powers='["fluxo-de-poder"]' WHERE id='00000000-0000-4000-8000-000000000301';
SET LOCAL ROLE authenticated;
DO $$
DECLARE c uuid:='00000000-0000-4000-8000-000000000301'; e public.character_activity_events;
BEGIN
 e:=public.confirm_sustained_ritual_action(gen_random_uuid(),c,'maintain',pg_temp.sustain_snapshot(c),9);
 IF e.payload->>'peCost'<>'2' OR e.payload->>'peAfter'<>'7' THEN RAISE EXCEPTION 'Fluxo não cobrou separadamente'; END IF;
END $$;
RESET ROLE;
UPDATE public.characters SET pe_current=1 WHERE id='00000000-0000-4000-8000-000000000301';
SET LOCAL ROLE authenticated;
DO $$
DECLARE c uuid:='00000000-0000-4000-8000-000000000301'; target uuid:='00000000-0000-4000-8000-000000000302'; cast_event public.character_activity_events;
BEGIN
 BEGIN
  PERFORM public.confirm_sustained_ritual_action(gen_random_uuid(),c,'maintain',pg_temp.sustain_snapshot(c),1);
  RAISE EXCEPTION 'PE insuficiente cobrado'; EXCEPTION WHEN invalid_parameter_value THEN NULL;
 END;
 IF (SELECT pe_current FROM public.characters WHERE id=c)<>1 THEN RAISE EXCEPTION 'PE alterado após rejeição'; END IF;
 PERFORM public.confirm_sustained_ritual_action(gen_random_uuid(),c,'end_all',pg_temp.sustain_snapshot(c),NULL);
 cast_event:=public.cast_character_ritual(gen_random_uuid(),c,1,0,'{"ritualId":"alvo","ritualName":"Alvo"}');
 PERFORM public.apply_character_effect(gen_random_uuid(),target,'sustain',
  '{"ritualId":"alvo","ritualName":"Alvo","element":"Sangue","circle":1,"selectedEnhancements":[],"sustainConfig":{}}','{}',cast_event.id);
 BEGIN
  PERFORM public.confirm_sustained_ritual_action(gen_random_uuid(),target,'maintain',pg_temp.sustain_snapshot(target),10);
  RAISE EXCEPTION 'PE do alvo cobrado'; EXCEPTION WHEN feature_not_supported THEN NULL;
 END;
 PERFORM public.confirm_sustained_ritual_action(gen_random_uuid(),target,'end_all',pg_temp.sustain_snapshot(target),NULL);
END $$;
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000312',true);
DO $$ BEGIN
 BEGIN
  PERFORM * FROM public.list_character_sustained_rituals('00000000-0000-4000-8000-000000000301');
  RAISE EXCEPTION 'Jogador leu outra ficha'; EXCEPTION WHEN insufficient_privilege THEN NULL;
 END;
END $$;
SET LOCAL ROLE anon;
DO $$ BEGIN
 BEGIN
  PERFORM * FROM public.list_character_sustained_rituals('00000000-0000-4000-8000-000000000301');
  RAISE EXCEPTION 'Anônimo autorizado'; EXCEPTION WHEN insufficient_privilege THEN NULL;
 END;
END $$;
ROLLBACK;
