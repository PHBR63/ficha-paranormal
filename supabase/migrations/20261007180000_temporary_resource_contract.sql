-- Reservatórios separados dos máximos normais, com origem e encerramento próprios.
CREATE TABLE public.character_temporary_resources (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 character_id uuid NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
 resource text NOT NULL CHECK(resource IN ('hp','pe')),
 source_key text NOT NULL CHECK(length(source_key) BETWEEN 1 AND 150),
 source_name text NOT NULL CHECK(length(source_name) BETWEEN 1 AND 200),
 remaining integer NOT NULL CHECK(remaining BETWEEN 0 AND 1000000),
 damage_types text[],
 campaign_id uuid REFERENCES public.campaigns_v2(id) ON DELETE CASCADE,
 scene_number integer,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(character_id,resource,source_key),
 CHECK((campaign_id IS NULL)=(scene_number IS NULL))
);
ALTER TABLE public.character_temporary_resources ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.character_temporary_resources FROM PUBLIC,anon,authenticated;

CREATE FUNCTION public.list_character_temporary_resources(p_character_id uuid)
RETURNS SETOF jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF NOT public.can_manage_character_activity(p_character_id) THEN RAISE EXCEPTION 'Ficha não autorizada.' USING ERRCODE='42501'; END IF;
 RETURN QUERY SELECT to_jsonb(r) FROM public.character_temporary_resources r WHERE character_id=p_character_id AND remaining>0 ORDER BY created_at,id;
END $$;
REVOKE ALL ON FUNCTION public.list_character_temporary_resources(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.list_character_temporary_resources(uuid) TO authenticated;

-- Consome primeiro o temporário em ordem estável; chamadores devem bloquear a ficha.
CREATE FUNCTION public.consume_temporary_resource(p_character_id uuid,p_resource text,p_amount integer,p_damage_type text DEFAULT NULL)
RETURNS integer LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
DECLARE entry record; used integer:=0; debit integer;
BEGIN
 FOR entry IN SELECT * FROM public.character_temporary_resources WHERE character_id=p_character_id AND resource=p_resource AND remaining>0
  AND (damage_types IS NULL OR p_damage_type=ANY(damage_types)) ORDER BY created_at,id FOR UPDATE LOOP
  debit:=least(entry.remaining,p_amount-used);
  UPDATE public.character_temporary_resources SET remaining=remaining-debit WHERE id=entry.id;
  used:=used+debit;
  EXIT WHEN used=p_amount;
 END LOOP;
 RETURN used;
END $$;
REVOKE ALL ON FUNCTION public.consume_temporary_resource(uuid,text,integer,text) FROM PUBLIC,anon,authenticated;

CREATE FUNCTION public.confirm_temporary_resource(p_operation_id uuid,p_character_id uuid,p_resource text,p_source_key text,p_source_name text,p_amount integer,p_cumulative boolean DEFAULT false)
RETURNS public.character_activity_events LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE receipt public.character_activity_events; fingerprint text; old_amount integer; saved integer;
BEGIN
 IF NOT public.can_manage_character_activity(p_character_id) THEN RAISE EXCEPTION 'Ficha não autorizada.' USING ERRCODE='42501'; END IF;
 IF p_operation_id IS NULL OR p_resource IS NULL OR p_resource NOT IN ('hp','pe') OR p_source_key IS NULL OR length(trim(p_source_key)) NOT BETWEEN 1 AND 150
 OR p_source_name IS NULL OR length(trim(p_source_name)) NOT BETWEEN 1 AND 200 OR p_amount IS NULL OR p_amount NOT BETWEEN 1 AND 1000000 OR p_cumulative IS NULL THEN
  RAISE EXCEPTION 'Recurso temporário inválido.' USING ERRCODE='22023'; END IF;
 fingerprint:=md5(jsonb_build_array('temporary',p_character_id,p_resource,p_source_key,p_source_name,p_amount,p_cumulative)::text);
 PERFORM pg_advisory_xact_lock(hashtextextended(p_operation_id::text,0));
 SELECT * INTO receipt FROM public.character_activity_events WHERE operation_id=p_operation_id;
 IF FOUND THEN
  IF receipt.author_id<>auth.uid() OR receipt.request_hash<>fingerprint THEN RAISE EXCEPTION 'Operação reutilizada.' USING ERRCODE='23505'; END IF;
  RETURN receipt;
 END IF;
 PERFORM 1 FROM public.characters WHERE id=p_character_id FOR UPDATE;
 SELECT remaining INTO old_amount FROM public.character_temporary_resources WHERE character_id=p_character_id AND resource=p_resource AND source_key=p_source_key;
 old_amount:=coalesce(old_amount,0);
 saved:=CASE WHEN p_cumulative THEN old_amount+p_amount ELSE greatest(old_amount,p_amount) END;
 IF saved>1000000 THEN RAISE EXCEPTION 'Recurso temporário excede o limite.' USING ERRCODE='22023'; END IF;
 INSERT INTO public.character_temporary_resources(character_id,resource,source_key,source_name,remaining)
 VALUES(p_character_id,p_resource,p_source_key,p_source_name,saved)
 ON CONFLICT(character_id,resource,source_key) DO UPDATE SET remaining=excluded.remaining,source_name=excluded.source_name;
 INSERT INTO public.character_activity_events(id,operation_id,character_id,author_id,category,status,payload,request_hash)
 VALUES(p_operation_id,p_operation_id,p_character_id,auth.uid(),'application','confirmed',
  jsonb_build_object('kind','temporary_resource','resource',p_resource,'sourceName',p_source_name,'sourceKey',p_source_key,
   'before',jsonb_build_object('current',old_amount),'after',jsonb_build_object('current',saved),'cumulative',p_cumulative,'expiry','manual_scene_end'),fingerprint) RETURNING * INTO receipt;
 RETURN receipt;
END $$;
REVOKE ALL ON FUNCTION public.confirm_temporary_resource(uuid,uuid,text,text,text,integer,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.confirm_temporary_resource(uuid,uuid,text,text,text,integer,boolean) TO authenticated;

CREATE FUNCTION public.end_temporary_resource(p_operation_id uuid,p_character_id uuid,p_resource_id uuid,p_expected integer)
RETURNS public.character_activity_events LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE receipt public.character_activity_events; entry public.character_temporary_resources; fingerprint text;
BEGIN
 IF NOT public.can_manage_character_activity(p_character_id) THEN RAISE EXCEPTION 'Ficha não autorizada.' USING ERRCODE='42501'; END IF;
 IF p_operation_id IS NULL OR p_resource_id IS NULL OR p_expected IS NULL OR p_expected<0 THEN RAISE EXCEPTION 'Pedido inválido.' USING ERRCODE='22023'; END IF;
 fingerprint:=md5(jsonb_build_array('temporary_end',p_character_id,p_resource_id,p_expected)::text);
 PERFORM pg_advisory_xact_lock(hashtextextended(p_operation_id::text,0));
 SELECT * INTO receipt FROM public.character_activity_events WHERE operation_id=p_operation_id;
 IF FOUND THEN
  IF receipt.author_id<>auth.uid() OR receipt.request_hash<>fingerprint THEN RAISE EXCEPTION 'Operação reutilizada.' USING ERRCODE='23505'; END IF;
  RETURN receipt;
 END IF;
 PERFORM 1 FROM public.characters WHERE id=p_character_id FOR UPDATE;
 SELECT * INTO entry FROM public.character_temporary_resources WHERE id=p_resource_id AND character_id=p_character_id FOR UPDATE;
 IF NOT FOUND OR entry.remaining<>p_expected THEN RAISE EXCEPTION 'Reservatório alterado. Recarregue.' USING ERRCODE='40001'; END IF;
 UPDATE public.character_temporary_resources SET remaining=0 WHERE id=entry.id;
 INSERT INTO public.character_activity_events(id,operation_id,character_id,author_id,category,status,payload,request_hash)
 VALUES(p_operation_id,p_operation_id,p_character_id,auth.uid(),'application','confirmed',
  jsonb_build_object('kind','temporary_end','resource',entry.resource,'sourceName',entry.source_name,
   'before',jsonb_build_object('current',entry.remaining),'after',jsonb_build_object('current',0)),fingerprint) RETURNING * INTO receipt;
 RETURN receipt;
END $$;
REVOKE ALL ON FUNCTION public.end_temporary_resource(uuid,uuid,uuid,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.end_temporary_resource(uuid,uuid,uuid,integer) TO authenticated;

ALTER FUNCTION public.apply_character_effect(uuid,uuid,text,jsonb,jsonb,uuid,uuid,text) RENAME TO apply_character_effect_temporary_core;
REVOKE ALL ON FUNCTION public.apply_character_effect_temporary_core(uuid,uuid,text,jsonb,jsonb,uuid,uuid,text) FROM PUBLIC,anon,authenticated;
CREATE FUNCTION public.apply_character_effect(p_operation_id uuid,p_character_id uuid,p_kind text,p_value jsonb,p_expected jsonb,
 p_cast_event_id uuid DEFAULT NULL,p_campaign_id uuid DEFAULT NULL,p_campaign_version text DEFAULT NULL)
RETURNS public.character_activity_events LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE receipt public.character_activity_events; cast_event public.character_activity_events; scene integer;
BEGIN
 IF p_kind IS DISTINCT FROM 'temporary_hp' THEN
  RETURN public.apply_character_effect_temporary_core(p_operation_id,p_character_id,p_kind,p_value,p_expected,p_cast_event_id,p_campaign_id,p_campaign_version);
 END IF;
 PERFORM public.validate_character_activity_context(p_character_id,p_campaign_id,p_campaign_version);
 IF p_operation_id IS NULL OR NOT public.activity_json_integer(p_value,1,1000000) THEN RAISE EXCEPTION 'PV temporários inválidos.' USING ERRCODE='22023'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_operation_id::text,0));
 SELECT * INTO cast_event FROM public.character_activity_events WHERE id=p_cast_event_id AND category='ritual';
 IF NOT FOUND OR NOT public.can_manage_character_activity(cast_event.character_id)
 OR cast_event.campaign_id IS DISTINCT FROM p_campaign_id OR cast_event.campaign_version IS DISTINCT FROM p_campaign_version THEN
  RAISE EXCEPTION 'Conjuração não autorizada.' USING ERRCODE='42501'; END IF;
 IF cast_event.payload->>'castingOutcome'='failed_concentration' THEN RAISE EXCEPTION 'Concentração falhou; efeitos bloqueados.' USING ERRCODE='55001'; END IF;
 SELECT * INTO receipt FROM public.character_activity_events WHERE operation_id=p_operation_id;
 IF FOUND THEN
  IF receipt.payload->>'castEventId' IS DISTINCT FROM p_cast_event_id::text THEN RAISE EXCEPTION 'Operação reutilizada.' USING ERRCODE='23505'; END IF;
  RETURN public.confirm_temporary_resource(p_operation_id,p_character_id,'hp',concat('ritual:',cast_event.payload->>'ritualId'),cast_event.payload->>'ritualName',(p_value::text)::integer,false);
 END IF;
 IF p_campaign_version='v2' THEN
  SELECT scene_number INTO scene FROM public.campaign_combat_state_v2 WHERE campaign_id=p_campaign_id FOR UPDATE;
  IF NOT EXISTS(SELECT 1 FROM public.character_scene_casts_v2 WHERE cast_event_id=p_cast_event_id AND scene_number=scene) THEN
   RAISE EXCEPTION 'Cena da conjuração encerrada.' USING ERRCODE='55000'; END IF;
 END IF;
 receipt:=public.confirm_temporary_resource(p_operation_id,p_character_id,'hp',concat('ritual:',cast_event.payload->>'ritualId'),
  cast_event.payload->>'ritualName',(p_value::text)::integer,false);
 -- Tela de Ruído não protege contra dano elemental ou paranormal; tipo ausente não autoriza consumo.
 UPDATE public.character_temporary_resources SET damage_types=CASE WHEN cast_event.payload->>'ritualId'='tela-de-ruido'
  THEN ARRAY['corte','perfuração','impacto','balístico']::text[] ELSE NULL END
 WHERE character_id=p_character_id AND resource='hp' AND source_key=concat('ritual:',cast_event.payload->>'ritualId');
 IF receipt.payload ? 'castEventId' AND receipt.payload->>'castEventId' IS DISTINCT FROM p_cast_event_id::text THEN
  RAISE EXCEPTION 'Operação reutilizada com outra conjuração.' USING ERRCODE='23505'; END IF;
 UPDATE public.character_temporary_resources SET campaign_id=p_campaign_id,scene_number=scene
 WHERE character_id=p_character_id AND resource='hp' AND source_key=concat('ritual:',cast_event.payload->>'ritualId') AND p_campaign_version='v2';
 UPDATE public.character_activity_events SET payload=payload||jsonb_build_object('castEventId',p_cast_event_id,
  'expiry',CASE WHEN scene IS NULL THEN 'manual_scene_end' ELSE 'campaign_scene_end' END),campaign_id=p_campaign_id,campaign_version=p_campaign_version
 WHERE id=receipt.id RETURNING * INTO receipt;
 RETURN receipt;
END $$;
REVOKE ALL ON FUNCTION public.apply_character_effect(uuid,uuid,text,jsonb,jsonb,uuid,uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.apply_character_effect(uuid,uuid,text,jsonb,jsonb,uuid,uuid,text) TO authenticated;

-- Expira apenas reservatórios com vínculo de cena comprovado; os manuais exigem confirmação.
ALTER FUNCTION public.end_campaign_scene_v2(uuid,uuid,integer,boolean) RENAME TO end_campaign_scene_temporary_core;
REVOKE ALL ON FUNCTION public.end_campaign_scene_temporary_core(uuid,uuid,integer,boolean) FROM PUBLIC,anon,authenticated;
CREATE FUNCTION public.end_campaign_scene_v2(p_operation_id uuid,p_campaign_id uuid,p_expected_revision integer,p_end_combat boolean)
RETURNS SETOF public.campaign_combat_state_v2 LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE old_scene integer; already_done boolean; saved public.campaign_combat_state_v2; entry record; event_id uuid;
BEGIN
 -- A operação interna valida mestre, revisão e UUID antes de qualquer expiração.
 IF p_operation_id IS NULL THEN RAISE EXCEPTION 'ID obrigatório.' USING ERRCODE='22023'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_operation_id::text,0));
 PERFORM 1 FROM public.campaign_combat_state_v2 WHERE campaign_id=p_campaign_id FOR UPDATE;
 SELECT EXISTS(SELECT 1 FROM public.campaign_scene_events_v2 WHERE operation_id=p_operation_id) INTO already_done;
 SELECT scene_number INTO old_scene FROM public.campaign_combat_state_v2 WHERE campaign_id=p_campaign_id;
 SELECT * INTO saved FROM public.end_campaign_scene_temporary_core(p_operation_id,p_campaign_id,p_expected_revision,p_end_combat);
 IF NOT already_done THEN
  PERFORM 1 FROM public.characters c WHERE c.id IN(SELECT character_id FROM public.character_temporary_resources
   WHERE campaign_id=p_campaign_id AND scene_number<=old_scene AND remaining>0) ORDER BY c.id FOR UPDATE;
  FOR entry IN SELECT r.* FROM public.character_temporary_resources r
   WHERE r.campaign_id=p_campaign_id AND r.scene_number<=old_scene AND r.remaining>0 ORDER BY r.character_id,r.id FOR UPDATE LOOP
   PERFORM 1 FROM public.characters WHERE id=entry.character_id FOR UPDATE;
   UPDATE public.character_temporary_resources SET remaining=0 WHERE id=entry.id;
   event_id:=gen_random_uuid();
   INSERT INTO public.character_activity_events(id,operation_id,character_id,author_id,category,status,payload,request_hash,campaign_id,campaign_version)
   VALUES(event_id,event_id,entry.character_id,auth.uid(),'application','confirmed',
    jsonb_build_object('kind','temporary_end','resource',entry.resource,'sourceName',entry.source_name,'sceneNumber',old_scene,
     'before',jsonb_build_object('current',entry.remaining),'after',jsonb_build_object('current',0)),md5(event_id::text),p_campaign_id,'v2');
  END LOOP;
 END IF;
 RETURN NEXT saved;
END $$;
REVOKE ALL ON FUNCTION public.end_campaign_scene_v2(uuid,uuid,integer,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.end_campaign_scene_v2(uuid,uuid,integer,boolean) TO authenticated;
