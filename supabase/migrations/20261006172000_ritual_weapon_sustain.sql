-- Estende a aplicação sem alterar o contrato existente de PV/condições.
-- A implementação original fica privada, acessível somente pelo wrapper.
ALTER FUNCTION public.apply_character_effect(uuid,uuid,text,jsonb,jsonb,uuid,uuid,text) RENAME TO apply_character_effect_core;
REVOKE ALL ON FUNCTION public.apply_character_effect_core(uuid,uuid,text,jsonb,jsonb,uuid,uuid,text) FROM PUBLIC,anon,authenticated;
CREATE UNIQUE INDEX character_cast_effect_once ON public.character_activity_events
 (character_id,(payload->>'castEventId'),(payload->>'kind'))
 WHERE category='application' AND payload->>'castEventId' IS NOT NULL;

CREATE FUNCTION public.activity_json_integer(p_value jsonb,p_min numeric,p_max numeric)
RETURNS boolean LANGUAGE sql IMMUTABLE SET search_path=public,pg_temp AS $$
 SELECT CASE WHEN jsonb_typeof(p_value)='number' THEN
 (p_value::text)::numeric BETWEEN p_min AND p_max AND (p_value::text)::numeric=trunc((p_value::text)::numeric)
 ELSE false END;
$$;
REVOKE ALL ON FUNCTION public.activity_json_integer(jsonb,numeric,numeric) FROM PUBLIC,anon,authenticated;

CREATE FUNCTION public.apply_character_effect(p_operation_id uuid,p_character_id uuid,p_kind text,p_value jsonb,p_expected jsonb,
 p_cast_event_id uuid DEFAULT NULL,p_campaign_id uuid DEFAULT NULL,p_campaign_version text DEFAULT NULL)
RETURNS public.character_activity_events LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE result public.character_activity_events; cast_event public.character_activity_events; ficha public.characters;
 fingerprint text; before_state jsonb; after_state jsonb; buff jsonb; buffs jsonb; sustained_id uuid; config jsonb;
BEGIN
 PERFORM public.validate_character_activity_context(p_character_id,p_campaign_id,p_campaign_version);
 IF p_operation_id IS NULL THEN RAISE EXCEPTION 'ID de aplicação obrigatório.' USING ERRCODE='22023'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_operation_id::text,0));
 -- Além do UUID, uma etapa da mesma conjuração só pode atingir o alvo uma vez.
 IF p_cast_event_id IS NOT NULL AND EXISTS(SELECT 1 FROM public.character_activity_events
   WHERE category='application' AND character_id=p_character_id AND payload->>'castEventId'=p_cast_event_id::text
   AND payload->>'kind'=p_kind AND operation_id<>p_operation_id) THEN
   RAISE EXCEPTION 'Este efeito já foi aplicado ao alvo. Confira o histórico.' USING ERRCODE='23505'; END IF;
 IF p_kind IS NULL OR p_kind NOT IN ('weapon_buff','sustain') THEN
   RETURN public.apply_character_effect_core(p_operation_id,p_character_id,p_kind,p_value,p_expected,p_cast_event_id,p_campaign_id,p_campaign_version);
 END IF;
 IF p_value IS NULL OR jsonb_typeof(p_value)<>'object' OR octet_length(p_value::text)>16000
   OR p_expected IS NULL OR jsonb_typeof(p_expected)<>'object'
   OR length(trim(coalesce(p_value->>'ritualId',''))) NOT BETWEEN 1 AND 150
   OR length(trim(coalesce(p_value->>'ritualName',''))) NOT BETWEEN 1 AND 200
   OR length(trim(coalesce(p_value->>'element',''))) NOT BETWEEN 1 AND 100 THEN
   RAISE EXCEPTION 'Dados do efeito inválidos.' USING ERRCODE='22023'; END IF;
 fingerprint:=md5(jsonb_build_array(p_character_id,p_kind,p_value,p_expected,p_cast_event_id,p_campaign_id,p_campaign_version)::text);
 SELECT * INTO result FROM public.character_activity_events WHERE operation_id=p_operation_id;
 IF FOUND THEN
   IF result.author_id<>auth.uid() OR result.request_hash<>fingerprint THEN RAISE EXCEPTION 'ID de operação reutilizado.' USING ERRCODE='23505'; END IF;
   RETURN result;
 END IF;
 IF p_cast_event_id IS NOT NULL THEN
   SELECT * INTO cast_event FROM public.character_activity_events WHERE id=p_cast_event_id;
   IF NOT FOUND OR cast_event.category<>'ritual' OR NOT public.can_manage_character_activity(cast_event.character_id) THEN
     RAISE EXCEPTION 'Conjuração não autorizada.' USING ERRCODE='42501'; END IF;
 END IF;
 SELECT * INTO ficha FROM public.characters WHERE id=p_character_id FOR UPDATE;
 IF p_kind='weapon_buff' THEN
   IF p_value-ARRAY['ritualId','ritualName','element','bonusDamage','attackBonus','criticalBonus','criticalMultiplierBonus','duration','turnsRemaining','enhancements']<>'{}'::jsonb
     OR coalesce(p_value->>'duration','') NOT IN ('cena','sustentado','rodadas')
     OR jsonb_typeof(p_value->'enhancements') IS DISTINCT FROM 'array'
     OR jsonb_array_length(p_value->'enhancements')>32
     OR EXISTS(SELECT 1 FROM jsonb_array_elements(p_value->'enhancements') e WHERE jsonb_typeof(e)<>'string' OR length(e#>>'{}')>150)
     OR EXISTS(SELECT 1 FROM unnest(ARRAY['attackBonus','criticalBonus','criticalMultiplierBonus']) field
       WHERE p_value ? field AND NOT public.activity_json_integer(p_value->field,-1000000,1000000))
     OR (p_value ? 'turnsRemaining' AND NOT public.activity_json_integer(p_value->'turnsRemaining',1,1000000))
     OR (p_value->>'duration'='rodadas' AND NOT p_value ? 'turnsRemaining') THEN
     RAISE EXCEPTION 'Buff de arma inválido.' USING ERRCODE='22023'; END IF;
   IF p_value ? 'bonusDamage' AND (
     jsonb_typeof(p_value->'bonusDamage') IS DISTINCT FROM 'object'
     OR (p_value->'bonusDamage')-ARRAY['diceCount','diceType','damageType','bonus','diceMultiplier','ignoresResistance','ignoresRD','isAbsolute']<>'{}'::jsonb
     OR NOT public.activity_json_integer(p_value->'bonusDamage'->'diceCount',1,1000)
     OR NOT public.activity_json_integer(p_value->'bonusDamage'->'diceType',2,1000)
     OR length(trim(coalesce(p_value->'bonusDamage'->>'damageType',''))) NOT BETWEEN 1 AND 100
     OR ((p_value->'bonusDamage') ? 'bonus' AND NOT public.activity_json_integer(p_value->'bonusDamage'->'bonus',-1000000,1000000))
     OR ((p_value->'bonusDamage') ? 'diceMultiplier' AND NOT public.activity_json_integer(p_value->'bonusDamage'->'diceMultiplier',1,1000000))
     OR EXISTS(SELECT 1 FROM unnest(ARRAY['ignoresResistance','ignoresRD','isAbsolute']) field
       WHERE (p_value->'bonusDamage') ? field AND jsonb_typeof(p_value->'bonusDamage'->field)<>'boolean')
   ) THEN RAISE EXCEPTION 'Fórmula de dano do buff inválida.' USING ERRCODE='22023'; END IF;
   IF p_expected->'active_buffs' IS DISTINCT FROM coalesce(ficha.active_buffs,'null'::jsonb) THEN
     RAISE EXCEPTION 'Buffs atualizados por outra operação. Recarregue.' USING ERRCODE='40001'; END IF;
   IF ficha.active_buffs IS NOT NULL AND jsonb_typeof(ficha.active_buffs)<>'array' THEN
     RAISE EXCEPTION 'Buffs existentes exigem revisão manual.' USING ERRCODE='22023'; END IF;
   before_state:=jsonb_build_object('active_buffs',ficha.active_buffs);
   buff:=p_value||jsonb_build_object('id',p_operation_id::text,'appliedAt',clock_timestamp());
   -- O mesmo ritual renova seu buff; outros rituais e metadados permanecem.
   SELECT coalesce(jsonb_agg(existing),'[]'::jsonb)||jsonb_build_array(buff) INTO buffs
   FROM jsonb_array_elements(coalesce(ficha.active_buffs,'[]'::jsonb)) existing
   WHERE existing->>'ritualId' IS DISTINCT FROM p_value->>'ritualId';
   UPDATE public.characters SET active_buffs=buffs WHERE id=p_character_id;
   after_state:=jsonb_build_object('active_buffs',buffs);
 ELSE
   config:=p_value->'sustainConfig';
   IF p_value-ARRAY['ritualId','ritualName','element','circle','selectedEnhancements','sustainConfig']<>'{}'::jsonb
     OR NOT public.activity_json_integer(p_value->'circle',1,4)
     OR jsonb_typeof(p_value->'selectedEnhancements') IS DISTINCT FROM 'array'
     OR jsonb_array_length(p_value->'selectedEnhancements')>32
     OR EXISTS(SELECT 1 FROM jsonb_array_elements(p_value->'selectedEnhancements') e WHERE jsonb_typeof(e)<>'string' OR length(e#>>'{}')>150)
     OR jsonb_typeof(config) IS DISTINCT FROM 'object'
     OR config-ARRAY['costPerTurn','action','concentration','maxDuration','endTriggers']<>'{}'::jsonb
     OR (config ? 'costPerTurn' AND NOT public.activity_json_integer(config->'costPerTurn',0,1000000))
     OR (config ? 'maxDuration' AND NOT public.activity_json_integer(config->'maxDuration',0,1000000))
     OR (config ? 'action' AND coalesce(config->>'action','') NOT IN ('free','move','standard','full'))
     OR (config ? 'concentration' AND jsonb_typeof(config->'concentration')<>'boolean')
   THEN RAISE EXCEPTION 'Sustentação inválida.' USING ERRCODE='22023'; END IF;
   IF config ? 'endTriggers' AND (jsonb_typeof(config->'endTriggers')<>'array' OR jsonb_array_length(config->'endTriggers')>32
     OR EXISTS(SELECT 1 FROM jsonb_array_elements(config->'endTriggers') e WHERE jsonb_typeof(e)<>'string' OR length(e#>>'{}')>200)) THEN
     RAISE EXCEPTION 'Gatilhos de sustentação inválidos.' USING ERRCODE='22023'; END IF;
   SELECT id INTO sustained_id FROM public.character_sustained_rituals WHERE character_id=p_character_id AND ritual_id=p_value->>'ritualId' LIMIT 1;
   before_state:=jsonb_build_object('sustained_ritual_id',sustained_id);
   IF sustained_id IS NULL THEN
     sustained_id:=p_operation_id;
     INSERT INTO public.character_sustained_rituals(id,character_id,user_id,ritual_id,ritual_name,element,circle,selected_enhancements,sustain_config,
       turns_active,pe_spent_total,is_concentrating)
     VALUES(sustained_id,p_character_id,ficha.user_id,p_value->>'ritualId',p_value->>'ritualName',p_value->>'element',(p_value->>'circle')::integer,
       ARRAY(SELECT jsonb_array_elements_text(p_value->'selectedEnhancements')),config,0,0,coalesce((config->>'concentration')::boolean,false));
   END IF;
   after_state:=jsonb_build_object('sustained_ritual_id',sustained_id);
 END IF;
 INSERT INTO public.character_activity_events(id,operation_id,character_id,author_id,category,status,payload,request_hash,campaign_id,campaign_version)
 VALUES(p_operation_id,p_operation_id,p_character_id,auth.uid(),'application','confirmed',
   jsonb_build_object('kind',p_kind,'value',p_value,'before',before_state,'after',after_state,'castEventId',p_cast_event_id),
   fingerprint,p_campaign_id,p_campaign_version) RETURNING * INTO result;
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.apply_character_effect(uuid,uuid,text,jsonb,jsonb,uuid,uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.apply_character_effect(uuid,uuid,text,jsonb,jsonb,uuid,uuid,text) TO authenticated;
