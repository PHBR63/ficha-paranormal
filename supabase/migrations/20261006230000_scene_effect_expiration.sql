-- Origem comprovada pelo servidor: JSON editável da ficha nunca autoriza expiração.
CREATE TABLE public.character_scene_casts_v2 (
  cast_event_id uuid PRIMARY KEY REFERENCES public.character_activity_events(id) ON DELETE CASCADE,
  campaign_id uuid NOT NULL REFERENCES public.campaigns_v2(id) ON DELETE CASCADE,
  scene_number integer NOT NULL CHECK (scene_number > 0)
);
CREATE TABLE public.character_scene_effects_v2 (
  application_id uuid NOT NULL REFERENCES public.character_activity_events(id) ON DELETE CASCADE,
  character_id uuid NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  campaign_id uuid NOT NULL REFERENCES public.campaigns_v2(id) ON DELETE CASCADE,
  scene_number integer NOT NULL CHECK (scene_number > 0),
  field text NOT NULL CHECK (field IN ('conditions','active_buffs')),
  effect_id text NOT NULL,
  PRIMARY KEY (application_id,field,effect_id)
);
CREATE INDEX character_scene_effects_boundary ON public.character_scene_effects_v2(campaign_id,scene_number,character_id);
ALTER TABLE public.character_scene_casts_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.character_scene_effects_v2 ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.character_scene_casts_v2,public.character_scene_effects_v2 FROM PUBLIC,anon,authenticated;
-- NULL distingue recibos antigos, que não executaram esta conferência.
ALTER TABLE public.campaign_scene_events_v2 ADD COLUMN expired_effects_count integer CHECK (expired_effects_count >= 0);

ALTER FUNCTION public.cast_character_ritual(uuid,uuid,integer,integer,jsonb,uuid,text) RENAME TO cast_character_ritual_scene_core;
REVOKE ALL ON FUNCTION public.cast_character_ritual_scene_core(uuid,uuid,integer,integer,jsonb,uuid,text) FROM PUBLIC,anon,authenticated;
CREATE FUNCTION public.cast_character_ritual(p_operation_id uuid,p_character_id uuid,p_expected_pe integer,p_pe_cost integer,p_payload jsonb,
 p_campaign_id uuid DEFAULT NULL,p_campaign_version text DEFAULT NULL)
RETURNS public.character_activity_events LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE result public.character_activity_events; scene integer;
BEGIN
 PERFORM public.validate_character_activity_context(p_character_id,p_campaign_id,p_campaign_version);
 IF p_operation_id IS NULL THEN RAISE EXCEPTION 'ID obrigatório.' USING ERRCODE='22023'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_operation_id::text,0));
 -- Retry conserva a origem original mesmo depois de encerrada a cena.
 IF EXISTS(SELECT 1 FROM public.character_activity_events WHERE operation_id=p_operation_id) THEN
   RETURN public.cast_character_ritual_scene_core(p_operation_id,p_character_id,p_expected_pe,p_pe_cost,p_payload,p_campaign_id,p_campaign_version);
 END IF;
 IF p_campaign_version='v2' THEN
   INSERT INTO public.campaign_combat_state_v2(campaign_id) VALUES(p_campaign_id) ON CONFLICT DO NOTHING;
   SELECT scene_number INTO scene FROM public.campaign_combat_state_v2 WHERE campaign_id=p_campaign_id FOR UPDATE;
 END IF;
 result:=public.cast_character_ritual_scene_core(p_operation_id,p_character_id,p_expected_pe,p_pe_cost,p_payload,p_campaign_id,p_campaign_version);
 IF scene IS NOT NULL THEN
   INSERT INTO public.character_scene_casts_v2 VALUES(result.id,p_campaign_id,scene);
   UPDATE public.character_activity_events SET payload=payload||jsonb_build_object('sceneNumber',scene)
     WHERE id=result.id RETURNING * INTO result;
 END IF;
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.cast_character_ritual(uuid,uuid,integer,integer,jsonb,uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.cast_character_ritual(uuid,uuid,integer,integer,jsonb,uuid,text) TO authenticated;

ALTER FUNCTION public.apply_character_effect(uuid,uuid,text,jsonb,jsonb,uuid,uuid,text) RENAME TO apply_character_effect_scene_core;
REVOKE ALL ON FUNCTION public.apply_character_effect_scene_core(uuid,uuid,text,jsonb,jsonb,uuid,uuid,text) FROM PUBLIC,anon,authenticated;
CREATE FUNCTION public.apply_character_effect(p_operation_id uuid,p_character_id uuid,p_kind text,p_value jsonb,p_expected jsonb,
 p_cast_event_id uuid DEFAULT NULL,p_campaign_id uuid DEFAULT NULL,p_campaign_version text DEFAULT NULL)
RETURNS public.character_activity_events LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE result public.character_activity_events; cast_event public.character_activity_events;
 cast_scene public.character_scene_casts_v2; scene integer; field_name text;
 item jsonb; items jsonb:='[]'; origin jsonb; before_items jsonb; effect_key text;
BEGIN
 PERFORM public.validate_character_activity_context(p_character_id,p_campaign_id,p_campaign_version);
 IF p_operation_id IS NULL THEN RAISE EXCEPTION 'ID obrigatório.' USING ERRCODE='22023'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_operation_id::text,0));
 IF EXISTS(SELECT 1 FROM public.character_activity_events WHERE operation_id=p_operation_id) THEN
   RETURN public.apply_character_effect_scene_core(p_operation_id,p_character_id,p_kind,p_value,p_expected,p_cast_event_id,p_campaign_id,p_campaign_version);
 END IF;
 IF p_kind='conditions' AND jsonb_typeof(p_value)='array' AND EXISTS(
   SELECT 1 FROM jsonb_array_elements(p_value) c WHERE c ? 'effectOrigin'
   OR (c ? 'duration' AND coalesce(c->>'duration','') NOT IN ('cena','rodadas','sustentado','permanente','manual'))
 ) THEN RAISE EXCEPTION 'Duração ou origem de condição inválida.' USING ERRCODE='22023'; END IF;
 IF p_cast_event_id IS NOT NULL THEN
   SELECT * INTO cast_event FROM public.character_activity_events WHERE id=p_cast_event_id;
   IF NOT FOUND OR cast_event.category<>'ritual' OR NOT public.can_manage_character_activity(cast_event.character_id)
     OR cast_event.campaign_id IS DISTINCT FROM p_campaign_id OR cast_event.campaign_version IS DISTINCT FROM p_campaign_version THEN
     RAISE EXCEPTION 'Confira a campanha da conjuração e do alvo.' USING ERRCODE='42501'; END IF;
   SELECT * INTO cast_scene FROM public.character_scene_casts_v2 WHERE cast_event_id=p_cast_event_id;
 END IF;
 -- Ordem única de bloqueio: campanha antes da ficha, também no encerramento.
 IF p_campaign_version='v2' THEN
   INSERT INTO public.campaign_combat_state_v2(campaign_id) VALUES(p_campaign_id) ON CONFLICT DO NOTHING;
   SELECT scene_number INTO scene FROM public.campaign_combat_state_v2 WHERE campaign_id=p_campaign_id FOR UPDATE;
   IF cast_scene.cast_event_id IS NOT NULL AND cast_scene.scene_number<>scene THEN
     RAISE EXCEPTION 'A cena da conjuração foi encerrada. Efeito pendente exige conferência do mestre; PE não foi estornado.' USING ERRCODE='55000';
   END IF;
 END IF;
 result:=public.apply_character_effect_scene_core(p_operation_id,p_character_id,p_kind,p_value,p_expected,p_cast_event_id,p_campaign_id,p_campaign_version);
 -- Não atribui origem a conjurações legadas ou aplicações fora da campanha v2.
 IF cast_scene.cast_event_id IS NULL OR p_kind NOT IN ('conditions','weapon_buff') THEN RETURN result; END IF;
 field_name:=CASE WHEN p_kind='conditions' THEN 'conditions' ELSE 'active_buffs' END;
 before_items:=coalesce(result.payload->'before'->field_name,'[]'::jsonb);
 origin:=jsonb_build_object('applicationId',result.id,'castEventId',p_cast_event_id,'ritualId',cast_event.payload->>'ritualId',
   'ritualName',cast_event.payload->>'ritualName','campaignId',p_campaign_id,'campaignVersion','v2','sceneNumber',scene);
 FOR item IN SELECT value FROM jsonb_array_elements(result.payload->'after'->field_name) LOOP
   effect_key:=coalesce(item->>'id',item#>>'{}');
   -- Condição já existente não é renovada nem vinculada à cena por engano.
   IF jsonb_typeof(item)='object' AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements(before_items) old
     WHERE coalesce(old->>'id',old#>>'{}')=effect_key) THEN
     item:=item||jsonb_build_object('effectOrigin',origin||jsonb_build_object('expiresAtSceneEnd',
       item->>'duration'='cena' AND regexp_replace(lower(effect_key),'[^a-z0-9]','','g') NOT IN ('morrendo','enlouquecendo')));
     IF item->>'duration'='cena' AND regexp_replace(lower(effect_key),'[^a-z0-9]','','g') NOT IN ('morrendo','enlouquecendo') THEN
       INSERT INTO public.character_scene_effects_v2 VALUES(result.id,p_character_id,p_campaign_id,scene,field_name,effect_key);
     END IF;
   END IF;
   items:=items||jsonb_build_array(item);
 END LOOP;
 IF p_kind='conditions' THEN UPDATE public.characters SET conditions=items WHERE id=p_character_id;
 ELSE UPDATE public.characters SET active_buffs=items WHERE id=p_character_id; END IF;
 UPDATE public.character_activity_events SET payload=jsonb_set(payload,ARRAY['after',field_name],items)||jsonb_build_object('effectOrigin',origin)
   WHERE id=result.id RETURNING * INTO result;
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.apply_character_effect(uuid,uuid,text,jsonb,jsonb,uuid,uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.apply_character_effect(uuid,uuid,text,jsonb,jsonb,uuid,uuid,text) TO authenticated;

-- Cada novo recibo de encerramento expira somente instâncias registradas nesta
-- campanha/cena. O trigger cobre RPC atual e cliente legado na mesma transação.
CREATE FUNCTION public.expire_campaign_scene_effects_v2() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE ficha public.characters; kept_conditions jsonb; kept_buffs jsonb;
 removed integer; total_removed integer:=0; event_id uuid;
BEGIN
 IF auth.uid() IS NULL OR NOT public.is_campaign_master_v2(auth.uid(),NEW.campaign_id) THEN
   RAISE EXCEPTION 'Encerramento não autorizado.' USING ERRCODE='42501'; END IF;
 FOR ficha IN SELECT c.* FROM public.characters c WHERE EXISTS(
   SELECT 1 FROM public.character_scene_effects_v2 e WHERE e.character_id=c.id AND e.campaign_id=NEW.campaign_id AND e.scene_number=NEW.scene_number
 ) AND EXISTS(SELECT 1 FROM public.campaign_members_v2 m WHERE m.campaign_id=NEW.campaign_id AND m.character_id=c.id AND m.user_id=c.user_id)
 ORDER BY c.id FOR UPDATE LOOP
   -- Dados inválidos ou alterados manualmente ficam preservados para conferência.
   IF jsonb_typeof(ficha.conditions) IS DISTINCT FROM 'array' OR jsonb_typeof(ficha.active_buffs) IS DISTINCT FROM 'array' THEN CONTINUE; END IF;
   SELECT coalesce(jsonb_agg(item ORDER BY ordinal),'[]'::jsonb) INTO kept_conditions
   FROM jsonb_array_elements(ficha.conditions) WITH ORDINALITY x(item,ordinal) WHERE NOT EXISTS(
     SELECT 1 FROM public.character_scene_effects_v2 e WHERE e.character_id=ficha.id AND e.campaign_id=NEW.campaign_id AND e.scene_number=NEW.scene_number
     AND e.field='conditions' AND e.effect_id=item->>'id' AND e.application_id::text=item->'effectOrigin'->>'applicationId'
     AND item->>'duration'='cena' AND regexp_replace(lower(item->>'id'),'[^a-z0-9]','','g') NOT IN ('morrendo','enlouquecendo')
   );
   SELECT coalesce(jsonb_agg(item ORDER BY ordinal),'[]'::jsonb) INTO kept_buffs
   FROM jsonb_array_elements(ficha.active_buffs) WITH ORDINALITY x(item,ordinal) WHERE NOT EXISTS(
     SELECT 1 FROM public.character_scene_effects_v2 e WHERE e.character_id=ficha.id AND e.campaign_id=NEW.campaign_id AND e.scene_number=NEW.scene_number
     AND e.field='active_buffs' AND e.effect_id=item->>'id' AND e.application_id::text=item->'effectOrigin'->>'applicationId' AND item->>'duration'='cena'
   );
   removed:=jsonb_array_length(ficha.conditions)+jsonb_array_length(ficha.active_buffs)-jsonb_array_length(kept_conditions)-jsonb_array_length(kept_buffs);
   IF removed=0 THEN CONTINUE; END IF;
   UPDATE public.characters SET conditions=kept_conditions,active_buffs=kept_buffs WHERE id=ficha.id;
   event_id:=gen_random_uuid();
   INSERT INTO public.character_activity_events(id,operation_id,character_id,author_id,category,status,payload,request_hash,campaign_id,campaign_version)
   VALUES(event_id,event_id,ficha.id,auth.uid(),'application','confirmed',jsonb_build_object('kind','scene_expiry','sceneNumber',NEW.scene_number,
     'sceneOperationId',NEW.operation_id,'expiredEffectsCount',removed,'before',jsonb_build_object('conditions',ficha.conditions,'active_buffs',ficha.active_buffs),
     'after',jsonb_build_object('conditions',kept_conditions,'active_buffs',kept_buffs)),md5(NEW.operation_id::text||ficha.id::text),NEW.campaign_id,'v2');
   total_removed:=total_removed+removed;
 END LOOP;
 NEW.expired_effects_count:=total_removed;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.expire_campaign_scene_effects_v2() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER campaign_scene_effect_expiration BEFORE INSERT ON public.campaign_scene_events_v2
 FOR EACH ROW EXECUTE FUNCTION public.expire_campaign_scene_effects_v2();
