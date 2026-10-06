-- Conferência independente por campo: NULL/legado em um não impede expiração
-- de uma instância comprovada no outro. O campo não reconhecido fica intacto.
CREATE OR REPLACE FUNCTION public.expire_campaign_scene_effects_v2() RETURNS trigger
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
   kept_conditions:=ficha.conditions; kept_buffs:=ficha.active_buffs; removed:=0;
   IF jsonb_typeof(ficha.conditions)='array' THEN
   SELECT coalesce(jsonb_agg(item ORDER BY ordinal),'[]'::jsonb) INTO kept_conditions
   FROM jsonb_array_elements(ficha.conditions) WITH ORDINALITY x(item,ordinal) WHERE NOT EXISTS(
     SELECT 1 FROM public.character_scene_effects_v2 e WHERE e.character_id=ficha.id AND e.campaign_id=NEW.campaign_id AND e.scene_number=NEW.scene_number
     AND e.field='conditions' AND e.effect_id=item->>'id' AND e.application_id::text=item->'effectOrigin'->>'applicationId'
     AND item->>'duration'='cena' AND regexp_replace(lower(item->>'id'),'[^a-z0-9]','','g') NOT IN ('morrendo','enlouquecendo')
   );
   removed:=removed+jsonb_array_length(ficha.conditions)-jsonb_array_length(kept_conditions);
   END IF;
   IF jsonb_typeof(ficha.active_buffs)='array' THEN
   SELECT coalesce(jsonb_agg(item ORDER BY ordinal),'[]'::jsonb) INTO kept_buffs
   FROM jsonb_array_elements(ficha.active_buffs) WITH ORDINALITY x(item,ordinal) WHERE NOT EXISTS(
     SELECT 1 FROM public.character_scene_effects_v2 e WHERE e.character_id=ficha.id AND e.campaign_id=NEW.campaign_id AND e.scene_number=NEW.scene_number
     AND e.field='active_buffs' AND e.effect_id=item->>'id' AND e.application_id::text=item->'effectOrigin'->>'applicationId' AND item->>'duration'='cena'
   );
   removed:=removed+jsonb_array_length(ficha.active_buffs)-jsonb_array_length(kept_buffs);
   END IF;
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
