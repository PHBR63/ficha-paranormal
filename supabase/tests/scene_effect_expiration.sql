-- Fixtures locais e rollback: nenhuma ficha real é usada.
BEGIN;
INSERT INTO auth.users(id) VALUES ('00000000-0000-4000-8000-000000000211'),('00000000-0000-4000-8000-000000000212');
INSERT INTO public.characters(id,user_id,name,conditions) VALUES
 ('00000000-0000-4000-8000-000000000201','00000000-0000-4000-8000-000000000212','QA EFEITOS',
 '[{"id":"externa","name":"Condição externa","addedAt":"","turnsRemaining":2,"params":{"n":7}},"Vulnerável",{"id":"legada","name":"Legada","duration":"cena"}]');
INSERT INTO public.campaigns_v2(id,master_id,name) VALUES
 ('00000000-0000-4000-8000-000000000202','00000000-0000-4000-8000-000000000211','QA CENA'),
 ('00000000-0000-4000-8000-000000000203','00000000-0000-4000-8000-000000000211','QA OUTRA CENA');
INSERT INTO public.campaign_members_v2(campaign_id,user_id,character_id,role) VALUES
 ('00000000-0000-4000-8000-000000000202','00000000-0000-4000-8000-000000000212','00000000-0000-4000-8000-000000000201','player'),
 ('00000000-0000-4000-8000-000000000203','00000000-0000-4000-8000-000000000212','00000000-0000-4000-8000-000000000201','player');
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000212',true);
DO $$
DECLARE char_id uuid:='00000000-0000-4000-8000-000000000201'; campaign uuid:='00000000-0000-4000-8000-000000000202';
 other_campaign uuid:='00000000-0000-4000-8000-000000000203'; cast_id uuid:='00000000-0000-4000-8000-000000000220';
 apply_id uuid:='00000000-0000-4000-8000-000000000221'; effect public.character_activity_events; cast_event public.character_activity_events;
 initial_conditions jsonb; condition_value jsonb; expected jsonb; buff_value jsonb;
BEGIN
 SELECT conditions INTO initial_conditions FROM public.characters WHERE id=char_id;
 cast_event:=public.cast_character_ritual(cast_id,char_id,10,1,'{"ritualId":"qa","ritualName":"Ritual QA"}',campaign,'v2');
 IF cast_event.payload->>'sceneNumber'<>'1' THEN RAISE EXCEPTION 'Origem de conjuração ausente'; END IF;
 condition_value:='[{"id":"lento","name":"Lento","duration":"cena","turnsRemaining":null,"addedAt":""},
 {"id":"legada","name":"Legada","duration":"cena","turnsRemaining":null,"addedAt":""},
 {"id":"ofuscado","name":"Ofuscado","duration":"rodadas","turnsRemaining":2,"addedAt":""},
 {"id":"morrendo","name":"Morrendo","duration":"cena","turnsRemaining":null,"dyingCounter":2,"addedAt":""},
 {"id":"manual","name":"Manual","turnsRemaining":null,"addedAt":""},
 {"id":"sustentado","name":"Sustentado","duration":"sustentado","turnsRemaining":null,"addedAt":""},
 {"id":"permanente","name":"Permanente","duration":"permanente","turnsRemaining":null,"addedAt":""}]';
 expected:=jsonb_build_object('conditions',initial_conditions);
 effect:=public.apply_character_effect(apply_id,char_id,'conditions',condition_value,expected,cast_id,campaign,'v2');
 IF NOT effect.payload->'after'->'conditions' @> initial_conditions THEN RAISE EXCEPTION 'Legado foi alterado'; END IF;
 IF NOT effect.payload->'after'->'conditions' @> '[{"id":"lento","effectOrigin":{"sceneNumber":1}}]' THEN RAISE EXCEPTION 'Origem não foi aplicada'; END IF;
 PERFORM public.apply_character_effect(apply_id,char_id,'conditions',condition_value,expected,cast_id,campaign,'v2');
 IF (SELECT count(*) FROM public.character_activity_events WHERE operation_id=apply_id)<>1 THEN RAISE EXCEPTION 'Retry duplicou'; END IF;
 BEGIN
   PERFORM public.apply_character_effect(gen_random_uuid(),char_id,'conditions','[{"id":"forjada","name":"Forjada","effectOrigin":{}}]',
     jsonb_build_object('conditions',effect.payload->'after'->'conditions'),NULL,campaign,'v2');
   RAISE EXCEPTION 'Origem fornecida pelo cliente foi aceita'; EXCEPTION WHEN invalid_parameter_value THEN NULL;
 END;
 BEGIN
   PERFORM public.apply_character_effect(gen_random_uuid(),char_id,'heal','1','{"hp_current":20,"hp_max":20}',cast_id,other_campaign,'v2');
   RAISE EXCEPTION 'Campanha da conjuração misturada'; EXCEPTION WHEN insufficient_privilege THEN NULL;
 END;
 cast_event:=public.cast_character_ritual(gen_random_uuid(),char_id,9,0,'{"ritualId":"arma","ritualName":"Arma QA"}',campaign,'v2');
 buff_value:='{"ritualId":"arma","ritualName":"Arma QA","element":"Sangue","duration":"cena","attackBonus":2,"enhancements":[]}';
 effect:=public.apply_character_effect(gen_random_uuid(),char_id,'weapon_buff',buff_value,'{"active_buffs":[]}',cast_event.id,campaign,'v2');
 IF NOT effect.payload->'after'->'active_buffs' @> '[{"duration":"cena","effectOrigin":{"sceneNumber":1}}]' THEN RAISE EXCEPTION 'Buff sem origem'; END IF;
 -- Outro ritual da mesma ficha pertence a outra campanha e deve sobreviver.
 cast_event:=public.cast_character_ritual(gen_random_uuid(),char_id,9,0,'{"ritualId":"outra","ritualName":"Outra campanha"}',other_campaign,'v2');
 buff_value:=buff_value||'{"ritualId":"outra","ritualName":"Outra campanha"}';
 PERFORM public.apply_character_effect(gen_random_uuid(),char_id,'weapon_buff',buff_value,jsonb_build_object('active_buffs',effect.payload->'after'->'active_buffs'),cast_event.id,other_campaign,'v2');
 -- A cena só pode ser encerrada pelo mestre.
 BEGIN
   PERFORM public.end_campaign_scene_v2(gen_random_uuid(),campaign,0,false);
   RAISE EXCEPTION 'Jogador encerrou cena'; EXCEPTION WHEN insufficient_privilege THEN NULL;
 END;
 BEGIN
   PERFORM * FROM public.character_scene_effects_v2;
   RAISE EXCEPTION 'Registro protegido exposto'; EXCEPTION WHEN insufficient_privilege THEN NULL;
 END;
END $$;
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000211',true);
DO $$
DECLARE campaign uuid:='00000000-0000-4000-8000-000000000202'; char_id uuid:='00000000-0000-4000-8000-000000000201';
 operation uuid:='00000000-0000-4000-8000-000000000230'; conditions jsonb; buffs jsonb; e public.character_activity_events;
BEGIN
 PERFORM public.end_campaign_scene_v2(operation,campaign,0,false);
 SELECT c.conditions,c.active_buffs INTO conditions,buffs FROM public.characters c WHERE id=char_id;
 IF conditions @> '[{"id":"lento"}]' THEN RAISE EXCEPTION 'Cena manteve efeito elegível'; END IF;
 IF NOT conditions @> '[{"id":"externa","params":{"n":7}},"Vulnerável",{"id":"legada"},{"id":"ofuscado"},{"id":"morrendo","dyingCounter":2},{"id":"manual"},{"id":"sustentado"},{"id":"permanente"}]' THEN RAISE EXCEPTION 'Remoção excedeu a cena'; END IF;
 IF jsonb_array_length(buffs)<>1 OR buffs->0->>'ritualId'<>'outra' THEN RAISE EXCEPTION 'Outra campanha expirou'; END IF;
 IF (SELECT expired_effects_count FROM public.campaign_scene_events_v2 WHERE operation_id=operation)<>2 THEN RAISE EXCEPTION 'Contagem de expirados incorreta'; END IF;
 IF (SELECT count(*) FROM public.character_activity_events WHERE payload->>'kind'='scene_expiry')<>1 THEN RAISE EXCEPTION 'Histórico da ficha ausente'; END IF;
 PERFORM public.end_campaign_scene_v2(operation,campaign,0,false);
 IF (SELECT count(*) FROM public.character_activity_events WHERE payload->>'kind'='scene_expiry')<>1 THEN RAISE EXCEPTION 'Retry duplicou expiração'; END IF;
 BEGIN
   PERFORM public.apply_character_effect(gen_random_uuid(),char_id,'heal','1','{"hp_current":20,"hp_max":20}',
     '00000000-0000-4000-8000-000000000220',campaign,'v2');
   RAISE EXCEPTION 'Efeito pendente atravessou cena'; EXCEPTION WHEN object_not_in_prerequisite_state THEN NULL;
 END;
 IF (SELECT pe_current FROM public.characters WHERE id=char_id)<>9 THEN RAISE EXCEPTION 'PE foi estornado'; END IF;
 -- Retry da aplicação expirada confirma o recibo antigo; não ressuscita efeito.
 SELECT * INTO e FROM public.character_activity_events WHERE operation_id='00000000-0000-4000-8000-000000000221';
 BEGIN
   PERFORM public.apply_character_effect(e.operation_id,char_id,'conditions',e.payload->'value',e.payload->'before',
     '00000000-0000-4000-8000-000000000220',campaign,'v2');
   RAISE EXCEPTION 'Outro autor repetiu operação'; EXCEPTION WHEN unique_violation THEN NULL;
 END;
END $$;
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000212',true);
DO $$ DECLARE e public.character_activity_events; BEGIN
 SELECT * INTO e FROM public.character_activity_events WHERE operation_id='00000000-0000-4000-8000-000000000221';
 PERFORM public.apply_character_effect(e.operation_id,e.character_id,'conditions',e.payload->'value',e.payload->'before',
   '00000000-0000-4000-8000-000000000220',e.campaign_id,e.campaign_version);
 IF (SELECT conditions FROM public.characters WHERE id=e.character_id) @> '[{"id":"lento"}]' THEN RAISE EXCEPTION 'Retry recriou efeito'; END IF;
END $$;
-- O salvamento legado de combate também aciona a expiração, sem novo contrato.
DO $$ DECLARE e public.character_activity_events; expected jsonb; BEGIN
 e:=public.cast_character_ritual(gen_random_uuid(),'00000000-0000-4000-8000-000000000201',9,0,
   '{"ritualId":"legado-cliente","ritualName":"Cliente legado"}','00000000-0000-4000-8000-000000000202','v2');
 SELECT jsonb_build_object('conditions',conditions) INTO expected FROM public.characters WHERE id=e.character_id;
 PERFORM public.apply_character_effect(gen_random_uuid(),e.character_id,'conditions','[{"id":"lento","name":"Lento","duration":"cena"}]',
   expected,e.id,e.campaign_id,e.campaign_version);
END $$;
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000211',true);
DO $$ BEGIN
 PERFORM public.save_campaign_combat_v2('00000000-0000-4000-8000-000000000202',1,'{"active":true,"round":1,"currentTurnIndex":0,"combatants":[]}');
 PERFORM public.save_campaign_combat_v2('00000000-0000-4000-8000-000000000202',2,'{"active":false,"round":1,"currentTurnIndex":0,"combatants":[]}');
 IF (SELECT conditions FROM public.characters WHERE id='00000000-0000-4000-8000-000000000201') @> '[{"id":"lento"}]' THEN RAISE EXCEPTION 'Cliente legado manteve efeito'; END IF;
 IF (SELECT count(*) FROM public.character_activity_events WHERE payload->>'kind'='scene_expiry')<>2 THEN RAISE EXCEPTION 'Cliente legado sem histórico'; END IF;
END $$;
-- Campos legados nulos não impedem expiração no outro campo válido.
RESET ROLE;
UPDATE public.characters SET conditions=NULL,active_buffs='[]' WHERE id='00000000-0000-4000-8000-000000000201';
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000212',true);
DO $$ DECLARE e public.character_activity_events; BEGIN
 e:=public.cast_character_ritual(gen_random_uuid(),'00000000-0000-4000-8000-000000000201',9,0,
   '{"ritualId":"nulos","ritualName":"Campos nulos"}','00000000-0000-4000-8000-000000000202','v2');
 PERFORM public.apply_character_effect(gen_random_uuid(),e.character_id,'weapon_buff',
   '{"ritualId":"nulos","ritualName":"Campos nulos","element":"conhecimento","duration":"cena","attackBonus":1,"enhancements":[]}',
   '{"active_buffs":[]}',e.id,e.campaign_id,e.campaign_version);
END $$;
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000211',true);
DO $$ BEGIN
 PERFORM public.end_campaign_scene_v2(gen_random_uuid(),'00000000-0000-4000-8000-000000000202',3,false);
 IF (SELECT active_buffs FROM public.characters WHERE id='00000000-0000-4000-8000-000000000201')<>'[]'::jsonb
   OR (SELECT conditions FROM public.characters WHERE id='00000000-0000-4000-8000-000000000201') IS NOT NULL THEN
   RAISE EXCEPTION 'Condição nula impediu expiração de bônus ou foi normalizada'; END IF;
END $$;
RESET ROLE;
UPDATE public.characters SET conditions='[]',active_buffs=NULL WHERE id='00000000-0000-4000-8000-000000000201';
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000212',true);
DO $$ DECLARE e public.character_activity_events; BEGIN
 e:=public.cast_character_ritual(gen_random_uuid(),'00000000-0000-4000-8000-000000000201',9,0,
   '{"ritualId":"nulos","ritualName":"Campos nulos"}','00000000-0000-4000-8000-000000000202','v2');
 PERFORM public.apply_character_effect(gen_random_uuid(),e.character_id,'conditions','[{"id":"lento","name":"Lento","duration":"cena"}]',
   '{"conditions":[]}',e.id,e.campaign_id,e.campaign_version);
END $$;
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000211',true);
DO $$ BEGIN
 PERFORM public.end_campaign_scene_v2(gen_random_uuid(),'00000000-0000-4000-8000-000000000202',4,false);
 IF (SELECT conditions FROM public.characters WHERE id='00000000-0000-4000-8000-000000000201')<>'[]'::jsonb
   OR (SELECT active_buffs FROM public.characters WHERE id='00000000-0000-4000-8000-000000000201') IS NOT NULL THEN
   RAISE EXCEPTION 'Buff nulo impediu expiração de condição ou foi normalizado'; END IF;
END $$;
ROLLBACK;
