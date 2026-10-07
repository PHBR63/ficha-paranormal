-- Prova privada da origem de novas sustentações. Não atribui autoria a legados.
CREATE TABLE public.sustained_ritual_origins (
 sustained_id uuid PRIMARY KEY REFERENCES public.character_sustained_rituals(id) ON DELETE CASCADE,
 cast_event_id uuid NOT NULL REFERENCES public.character_activity_events(id),
 caster_character_id uuid NOT NULL REFERENCES public.characters(id)
);
ALTER TABLE public.sustained_ritual_origins ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.sustained_ritual_origins FROM PUBLIC,anon,authenticated;
CREATE INDEX sustained_ritual_caster ON public.sustained_ritual_origins(caster_character_id);

-- Só um evento de aplicação confirmado, produzido pelas RPCs existentes,
-- pode comprovar origem. Uma ativação que reutiliza registro antigo não o renova.
CREATE FUNCTION public.capture_sustained_ritual_origin()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE cast_event public.character_activity_events;
BEGIN
 IF NEW.category='application' AND NEW.status='confirmed' AND NEW.payload->>'kind'='sustain'
 AND NEW.payload->'after'->>'sustained_ritual_id'=NEW.operation_id::text THEN
  SELECT * INTO cast_event FROM public.character_activity_events
   WHERE id::text=NEW.payload->>'castEventId' AND category='ritual';
  IF FOUND AND cast_event.payload->>'ritualId'=NEW.payload->'value'->>'ritualId' THEN
   INSERT INTO public.sustained_ritual_origins(sustained_id,cast_event_id,caster_character_id)
   VALUES(NEW.operation_id,cast_event.id,cast_event.character_id) ON CONFLICT DO NOTHING;
  END IF;
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.capture_sustained_ritual_origin() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER capture_sustained_origin AFTER INSERT ON public.character_activity_events
 FOR EACH ROW EXECUTE FUNCTION public.capture_sustained_ritual_origin();

-- Consulta autorizada: origem confiável é enriquecida no retorno, sem expor a
-- tabela privada. Mestre só lê fichas vinculadas por can_manage_character_activity.
CREATE FUNCTION public.list_character_sustained_rituals(p_character_id uuid)
RETURNS SETOF jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF NOT public.can_manage_character_activity(p_character_id) THEN
  RAISE EXCEPTION 'Ficha não autorizada.' USING ERRCODE='42501';
 END IF;
 RETURN QUERY SELECT to_jsonb(r)||jsonb_build_object('caster_character_id',o.caster_character_id)
 FROM public.character_sustained_rituals r JOIN public.characters c ON c.id=r.character_id AND c.user_id=r.user_id
 LEFT JOIN public.sustained_ritual_origins o ON o.sustained_id=r.id
 WHERE r.character_id=p_character_id ORDER BY r.id;
END $$;
REVOKE ALL ON FUNCTION public.list_character_sustained_rituals(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.list_character_sustained_rituals(uuid) TO authenticated;

-- Reconhece somente efeitos sustentados ainda idênticos ao recibo de aplicação.
-- Metadados editados, legados e condições críticas são preservados para conferência.
CREATE FUNCTION public.effect_belongs_to_sustained(p_item jsonb,p_field text,p_character uuid,p_ids uuid[])
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT p_item->>'duration'='sustentado'
 AND (p_field<>'conditions' OR regexp_replace(lower(p_item->>'id'),'[^a-z0-9]','','g') NOT IN ('morrendo','enlouquecendo'))
 AND EXISTS(
  SELECT 1 FROM public.sustained_ritual_origins o
  JOIN public.character_activity_events e ON e.payload->>'castEventId'=o.cast_event_id::text
  WHERE o.sustained_id=ANY(p_ids) AND e.character_id=p_character AND e.category='application' AND e.status='confirmed'
  AND e.payload->>'kind'=CASE WHEN p_field='conditions' THEN 'conditions' ELSE 'weapon_buff' END
  AND e.payload->'after'->p_field @> jsonb_build_array(p_item)
  AND (p_item->>'id'=e.operation_id::text OR p_item->'effectOrigin'->>'applicationId'=e.operation_id::text)
 )
$$;
REVOKE ALL ON FUNCTION public.effect_belongs_to_sustained(jsonb,text,uuid,uuid[]) FROM PUBLIC,anon,authenticated;

-- Confirma manutenção ou encerramento com CAS e UUID estável. O custo base é
-- 1 PE por sustentação escolhida; não é recebido do cliente nem do JSON editável.
-- Encerrar conserva snapshots completos no histórico, sem apagar a auditoria.
CREATE FUNCTION public.confirm_sustained_ritual_action(
 p_operation_id uuid,p_character_id uuid,p_action text,p_expected jsonb,p_expected_pe integer
) RETURNS public.character_activity_events LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE result public.character_activity_events; ficha public.characters; fingerprint text;
 ids uuid[]; actual jsonb; before_rows jsonb; after_rows jsonb; total integer; allowance integer:=1; kept_conditions jsonb; kept_buffs jsonb;
BEGIN
 IF NOT public.can_manage_character_activity(p_character_id) THEN
  RAISE EXCEPTION 'Ficha não autorizada.' USING ERRCODE='42501'; END IF;
 IF p_operation_id IS NULL OR p_action IS NULL OR p_action NOT IN ('maintain','end','end_all')
 OR p_expected IS NULL OR jsonb_typeof(p_expected)<>'array' OR octet_length(p_expected::text)>24000
 OR jsonb_array_length(p_expected) NOT BETWEEN 1 AND 64 THEN
  RAISE EXCEPTION 'Pedido de sustentação inválido.' USING ERRCODE='22023'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_operation_id::text,0));
 fingerprint:=md5(jsonb_build_array(p_character_id,p_action,p_expected,p_expected_pe)::text);
 SELECT * INTO result FROM public.character_activity_events WHERE operation_id=p_operation_id;
 IF FOUND THEN
  IF result.author_id<>auth.uid() OR result.request_hash<>fingerprint THEN
   RAISE EXCEPTION 'Operação reutilizada.' USING ERRCODE='23505'; END IF;
  RETURN result;
 END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(p_expected) e WHERE jsonb_typeof(e)<>'object'
 OR coalesce(e->>'id','') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$') THEN
  RAISE EXCEPTION 'Identidade inválida.' USING ERRCODE='22023'; END IF;
 SELECT array_agg((e->>'id')::uuid ORDER BY e->>'id') INTO ids FROM jsonb_array_elements(p_expected) e;
 IF (SELECT count(DISTINCT id) FROM unnest(ids) id)<>cardinality(ids) THEN
  RAISE EXCEPTION 'Seleção duplicada.' USING ERRCODE='22023'; END IF;
 -- Mesmo bloqueio da aplicação: ficha antes dos registros sustentados.
 SELECT * INTO ficha FROM public.characters WHERE id=p_character_id FOR UPDATE;
 PERFORM 1 FROM public.character_sustained_rituals WHERE character_id=p_character_id ORDER BY id FOR UPDATE;
 SELECT coalesce(jsonb_agg(jsonb_build_object('id',r.id,'ritual_id',r.ritual_id,
  'turns_active',r.turns_active,'pe_spent_total',r.pe_spent_total,'sustain_config',r.sustain_config,
  'is_concentrating',r.is_concentrating) ORDER BY r.id),'[]'::jsonb),jsonb_agg(to_jsonb(r) ORDER BY r.id)
 INTO actual,before_rows FROM public.character_sustained_rituals r
 WHERE r.character_id=p_character_id AND r.user_id=ficha.user_id AND r.id=ANY(ids);
 IF actual IS DISTINCT FROM p_expected OR (p_action='end_all' AND
  (SELECT count(*) FROM public.character_sustained_rituals WHERE character_id=p_character_id)<>cardinality(ids)) THEN
  RAISE EXCEPTION 'Sustentações alteradas. Atualize.' USING ERRCODE='40001'; END IF;
 total:=0;
 IF p_action='maintain' THEN
  -- Não debita de um alvo em lugar do conjurador, nem presume origem de legados.
  IF EXISTS(SELECT 1 FROM unnest(ids) id LEFT JOIN public.sustained_ritual_origins o ON o.sustained_id=id
    WHERE o.caster_character_id IS DISTINCT FROM p_character_id) THEN
   RAISE EXCEPTION 'Origem requer conferência manual.' USING ERRCODE='0A000'; END IF;
  -- Fluxo de Poder (Livro Base p.33): NEX 60 e escolha explícita do poder.
  IF coalesce((to_jsonb(ficha)->>'nex')::integer,0)>=60 AND EXISTS(
   SELECT 1 FROM jsonb_array_elements(
    CASE WHEN jsonb_typeof(to_jsonb(ficha)->'powers')='array' THEN to_jsonb(ficha)->'powers' ELSE '[]'::jsonb END
    || CASE WHEN jsonb_typeof(to_jsonb(ficha)->'abilities')='array' THEN to_jsonb(ficha)->'abilities' ELSE '[]'::jsonb END) choice
   WHERE choice#>>'{}' IN ('fluxo-de-poder','Fluxo de Poder') OR choice->>'id'='fluxo-de-poder' OR choice->>'name'='Fluxo de Poder'
  ) THEN allowance:=2; END IF;
  IF (SELECT count(*) FROM public.character_sustained_rituals r LEFT JOIN public.sustained_ritual_origins o ON o.sustained_id=r.id
   WHERE o.caster_character_id=p_character_id OR (r.character_id=p_character_id AND o.sustained_id IS NULL))>allowance THEN
   RAISE EXCEPTION 'Limite de sustentação exige revisão manual.' USING ERRCODE='0A000'; END IF;
  IF EXISTS(SELECT 1 FROM public.character_sustained_rituals WHERE id=ANY(ids)
   AND (turns_active IS NULL OR turns_active NOT BETWEEN 0 AND 999999
     OR pe_spent_total IS NULL OR pe_spent_total NOT BETWEEN 0 AND 999999)) THEN
   RAISE EXCEPTION 'Contadores antigos exigem revisão.' USING ERRCODE='0A000'; END IF;
  total:=cardinality(ids);
  IF p_expected_pe IS NULL OR ficha.pe_current IS DISTINCT FROM p_expected_pe THEN
   RAISE EXCEPTION 'Saldo atualizado. Recarregue.' USING ERRCODE='40001'; END IF;
  IF ficha.pe_current<total THEN RAISE EXCEPTION 'PE insuficiente. Nenhuma cobrança.' USING ERRCODE='22023'; END IF;
  UPDATE public.characters SET pe_current=pe_current-total WHERE id=p_character_id;
  UPDATE public.character_sustained_rituals SET turns_active=turns_active+1,pe_spent_total=pe_spent_total+1 WHERE id=ANY(ids);
  SELECT jsonb_agg(to_jsonb(r) ORDER BY id) INTO after_rows FROM public.character_sustained_rituals r WHERE id=ANY(ids);
 ELSE
  IF ficha.conditions IS NOT NULL AND jsonb_typeof(ficha.conditions)<>'array'
    OR ficha.active_buffs IS NOT NULL AND jsonb_typeof(ficha.active_buffs)<>'array' THEN
   RAISE EXCEPTION 'Efeitos antigos exigem revisão.' USING ERRCODE='0A000'; END IF;
  SELECT coalesce(jsonb_agg(item ORDER BY ordinal),'[]'::jsonb) INTO kept_conditions
   FROM jsonb_array_elements(coalesce(ficha.conditions,'[]'::jsonb)) WITH ORDINALITY x(item,ordinal)
   WHERE NOT coalesce(public.effect_belongs_to_sustained(item,'conditions',p_character_id,ids),false);
  SELECT coalesce(jsonb_agg(item ORDER BY ordinal),'[]'::jsonb) INTO kept_buffs
   FROM jsonb_array_elements(coalesce(ficha.active_buffs,'[]'::jsonb)) WITH ORDINALITY x(item,ordinal)
   WHERE NOT coalesce(public.effect_belongs_to_sustained(item,'active_buffs',p_character_id,ids),false);
  IF ficha.conditions IS NULL THEN kept_conditions:=NULL; END IF;
  IF ficha.active_buffs IS NULL THEN kept_buffs:=NULL; END IF;
  UPDATE public.characters SET conditions=CASE WHEN ficha.conditions IS NULL THEN NULL ELSE kept_conditions END,
   active_buffs=CASE WHEN ficha.active_buffs IS NULL THEN NULL ELSE kept_buffs END WHERE id=p_character_id;
  DELETE FROM public.character_sustained_rituals WHERE id=ANY(ids) AND character_id=p_character_id AND user_id=ficha.user_id;
  after_rows:='[]'::jsonb;
 END IF;
 INSERT INTO public.character_activity_events(id,operation_id,character_id,author_id,category,status,payload,request_hash)
 VALUES(p_operation_id,p_operation_id,p_character_id,auth.uid(),'application','confirmed',
  jsonb_build_object('kind',CASE WHEN p_action='maintain' THEN 'sustain_maintenance' ELSE 'sustain_end' END,
   'peCost',total,'peBefore',ficha.pe_current,'peAfter',ficha.pe_current-total,
   'before',jsonb_build_object('sustained_rituals',before_rows,'conditions',ficha.conditions,'active_buffs',ficha.active_buffs),
   'after',jsonb_build_object('sustained_rituals',after_rows,'conditions',CASE WHEN p_action='maintain' THEN ficha.conditions ELSE kept_conditions END,
    'active_buffs',CASE WHEN p_action='maintain' THEN ficha.active_buffs ELSE kept_buffs END)),fingerprint)
 RETURNING * INTO result;
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.confirm_sustained_ritual_action(uuid,uuid,text,jsonb,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.confirm_sustained_ritual_action(uuid,uuid,text,jsonb,integer) TO authenticated;
