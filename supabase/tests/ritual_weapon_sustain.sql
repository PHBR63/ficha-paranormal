-- Ensaio em fixtures com rollback, incluindo autoria do mestre e dono distinto.
BEGIN;
SELECT set_config('test.buff_master',user_id::text,true) FROM public.characters WHERE id='ecde39f9-2d41-4d39-ad20-c8d013e11ee7';
SELECT set_config('test.buff_owner',id::text,true) FROM auth.users WHERE id<>current_setting('test.buff_master')::uuid ORDER BY created_at LIMIT 1;
INSERT INTO public.characters(id,user_id,name,origin,class,pe_current,pe_max,active_buffs)
VALUES('96ba0000-0000-4000-8000-000000000001',current_setting('test.buff_owner')::uuid,'QA BUFF ROLLBACK','Vítima','Ocultista',4,4,'[{"id":"custom","unrecognized":true}]');
INSERT INTO public.campaigns_v2(id,master_id,name) VALUES('96ba0000-0000-4000-8000-000000000002',current_setting('test.buff_master')::uuid,'QA BUFF V2 ROLLBACK');
INSERT INTO public.campaign_members_v2(campaign_id,user_id,character_id,role)
VALUES('96ba0000-0000-4000-8000-000000000002',current_setting('test.buff_owner')::uuid,'96ba0000-0000-4000-8000-000000000001','player');
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub',current_setting('test.buff_master'),true);
SELECT set_config('request.jwt.claims',json_build_object('sub',current_setting('test.buff_master'),'role','authenticated')::text,true);
DO $$ DECLARE cast_event public.character_activity_events; effect public.character_activity_events; value jsonb; sustain jsonb; BEGIN
 cast_event:=public.cast_character_ritual('96ba0000-0000-4000-8000-000000000010','96ba0000-0000-4000-8000-000000000001',4,1,'{"ritualId":"qa","ritualName":"QA ritual"}');
 value:='{"ritualId":"qa","ritualName":"QA arma","element":"Conhecimento","duration":"rodadas","turnsRemaining":3,"enhancements":[],"bonusDamage":{"diceCount":1,"diceType":6,"damageType":"conhecimento"},"attackBonus":2}';
 effect:=public.apply_character_effect('96ba0000-0000-4000-8000-000000000011',cast_event.character_id,'weapon_buff',value,
 '{"active_buffs":[{"id":"custom","unrecognized":true}]}',cast_event.id);
 PERFORM public.apply_character_effect(effect.id,cast_event.character_id,'weapon_buff',value,'{"active_buffs":[{"id":"custom","unrecognized":true}]}',cast_event.id);
 IF (SELECT jsonb_array_length(active_buffs) FROM public.characters WHERE id=cast_event.character_id)<>2
 OR (SELECT active_buffs->0->>'unrecognized' FROM public.characters WHERE id=cast_event.character_id)<>'true'
 OR effect.status<>'confirmed' THEN RAISE EXCEPTION 'Buff duplicado ou metadado perdido'; END IF;
 BEGIN
  PERFORM public.apply_character_effect('96ba0000-0000-4000-8000-000000000012',cast_event.character_id,'weapon_buff',value,'{}',cast_event.id);
  RAISE EXCEPTION 'Reaplicação da mesma conjuração permitida'; EXCEPTION WHEN unique_violation THEN NULL; END;
 BEGIN
  PERFORM public.apply_character_effect('96ba0000-0000-4000-8000-000000000012',cast_event.character_id,'weapon_buff',value,'{"active_buffs":[]}',NULL);
  RAISE EXCEPTION 'CAS de buff ignorado'; EXCEPTION WHEN serialization_failure THEN NULL; END;
 BEGIN
  PERFORM public.apply_character_effect('96ba0000-0000-4000-8000-000000000012',cast_event.character_id,'weapon_buff',value||'{"hp_current":999}','{}');
  RAISE EXCEPTION 'Campo arbitrário permitido'; EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
 BEGIN
  PERFORM public.apply_character_effect('96ba0000-0000-4000-8000-000000000012',cast_event.character_id,'weapon_buff',value||'{"bonusDamage":{"diceCount":1.5,"diceType":6,"damageType":"conhecimento"}}','{}');
  RAISE EXCEPTION 'Dados fracionários permitidos'; EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
 sustain:='{"ritualId":"qa-sustain","ritualName":"QA sustentação","element":"Conhecimento","circle":1,"selectedEnhancements":[],"sustainConfig":{"costPerTurn":1,"action":"free","concentration":true,"endTriggers":["Inconsciente"]}}';
 PERFORM public.apply_character_effect('96ba0000-0000-4000-8000-000000000013',cast_event.character_id,'sustain',sustain,'{}',cast_event.id);
 PERFORM public.apply_character_effect('96ba0000-0000-4000-8000-000000000013',cast_event.character_id,'sustain',sustain,'{}',cast_event.id);
 -- Outro cast/manual não duplica uma sustentação já ativa da mesma ficha.
 PERFORM public.apply_character_effect('96ba0000-0000-4000-8000-000000000014',cast_event.character_id,'sustain',sustain,'{}');
 BEGIN
  PERFORM public.apply_character_effect('96ba0000-0000-4000-8000-000000000015',cast_event.character_id,'sustain',sustain||'{"sustainConfig":{"costPerTurn":-1}}','{}');
  RAISE EXCEPTION 'Custo inválido aceito'; EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
END $$;
SELECT set_config('request.jwt.claim.sub',current_setting('test.buff_owner'),true);
SELECT set_config('request.jwt.claims',json_build_object('sub',current_setting('test.buff_owner'),'role','authenticated')::text,true);
DO $$ BEGIN
 IF (SELECT count(*) FROM public.character_sustained_rituals WHERE character_id='96ba0000-0000-4000-8000-000000000001')<>1 THEN RAISE EXCEPTION 'Dono não vê sustentação única'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.character_sustained_rituals WHERE character_id='96ba0000-0000-4000-8000-000000000001' AND user_id=auth.uid() AND is_concentrating AND turns_active=0) THEN RAISE EXCEPTION 'Autoria/dados de sustentação inválidos'; END IF;
 IF (SELECT count(*) FROM public.character_activity_events WHERE character_id='96ba0000-0000-4000-8000-000000000001')<>4 THEN RAISE EXCEPTION 'Auditoria duplicada/ausente'; END IF;
 BEGIN
  PERFORM public.apply_character_effect_core('96ba0000-0000-4000-8000-000000000016','96ba0000-0000-4000-8000-000000000001','heal','1','{}');
  RAISE EXCEPTION 'Implementação interna exposta'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
ROLLBACK;
