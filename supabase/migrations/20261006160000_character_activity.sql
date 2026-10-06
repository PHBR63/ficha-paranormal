-- Histórico canônico por ficha. Escrita somente por RPC: autoria, horário,
-- consumo e efeitos são confirmados juntos; limpar altera só uma preferência.
CREATE TABLE public.character_activity_events (
  id uuid PRIMARY KEY,
  operation_id uuid NOT NULL UNIQUE,
  character_id uuid NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id),
  category text NOT NULL CHECK (category IN ('roll','ritual','application')),
  status text NOT NULL CHECK (status IN ('pending','confirmed')),
  payload jsonb NOT NULL CHECK (jsonb_typeof(payload)='object' AND octet_length(payload::text)<=65536),
  request_hash text NOT NULL,
  campaign_id uuid,
  campaign_version text CHECK (campaign_version IN ('v1','v2')),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  CHECK ((campaign_id IS NULL)=(campaign_version IS NULL))
);
CREATE INDEX character_activity_cursor ON public.character_activity_events(character_id,created_at DESC,id DESC);
CREATE INDEX character_activity_campaign ON public.character_activity_events(campaign_version,campaign_id,created_at DESC);
CREATE TABLE public.character_activity_visibility (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  character_id uuid NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  hidden_before timestamptz,
  PRIMARY KEY(user_id,character_id)
);

-- Não basta um vínculo arbitrário: a identidade do participante deve ser dona
-- da ficha. O mestre recebe acesso somente às fichas realmente vinculadas.
CREATE FUNCTION public.can_manage_character_activity(p_character_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT auth.uid() IS NOT NULL AND EXISTS (
   SELECT 1 FROM public.characters c WHERE c.id=p_character_id AND (
     c.user_id=auth.uid()
     OR EXISTS(SELECT 1 FROM public.campaign_members m JOIN public.campaigns cp ON cp.id=m.campaign_id
       WHERE m.character_id=c.id AND m.user_id=c.user_id AND cp.master_id=auth.uid())
     OR EXISTS(SELECT 1 FROM public.campaign_members_v2 m JOIN public.campaigns_v2 cp ON cp.id=m.campaign_id
       WHERE m.character_id=c.id AND m.user_id=c.user_id AND cp.master_id=auth.uid())
   )
 );
$$;
REVOKE ALL ON FUNCTION public.can_manage_character_activity(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.can_manage_character_activity(uuid) TO authenticated;
ALTER TABLE public.character_activity_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.character_activity_visibility ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Activity scoped read" ON public.character_activity_events FOR SELECT TO authenticated
 USING(public.can_manage_character_activity(character_id));
CREATE POLICY "Activity authentication guard" ON public.character_activity_events AS RESTRICTIVE FOR ALL TO PUBLIC
 USING(auth.uid() IS NOT NULL) WITH CHECK(auth.uid() IS NOT NULL);
CREATE POLICY "Own activity visibility" ON public.character_activity_visibility FOR SELECT TO authenticated
 USING(user_id=auth.uid() AND public.can_manage_character_activity(character_id));
REVOKE ALL ON public.character_activity_events,public.character_activity_visibility FROM anon,authenticated;
GRANT SELECT ON public.character_activity_events,public.character_activity_visibility TO authenticated;

-- Compartilhamento v2 equivalente ao fluxo v1; nenhuma nova permissão UPDATE.
CREATE POLICY "Campaign v2 linked characters read" ON public.characters FOR SELECT TO authenticated USING (
 EXISTS(SELECT 1 FROM public.campaign_members_v2 linked
   WHERE linked.character_id=characters.id AND linked.user_id=characters.user_id
   AND (public.is_campaign_master_v2(auth.uid(),linked.campaign_id)
     OR public.is_campaign_member_v2(auth.uid(),linked.campaign_id)))
);

-- Valida o contexto opcional no servidor, sem aceitar misturar v1 e v2.
CREATE FUNCTION public.validate_character_activity_context(p_character_id uuid,p_campaign_id uuid,p_campaign_version text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF NOT public.can_manage_character_activity(p_character_id) THEN
   RAISE EXCEPTION 'Sem permissão para esta ficha.' USING ERRCODE='42501';
 END IF;
 IF (p_campaign_id IS NULL)<>(p_campaign_version IS NULL) OR (p_campaign_version IS NOT NULL AND p_campaign_version NOT IN ('v1','v2')) THEN
   RAISE EXCEPTION 'Contexto de campanha inválido.' USING ERRCODE='22023';
 END IF;
 IF p_campaign_id IS NOT NULL AND NOT (
   (p_campaign_version='v1' AND EXISTS(SELECT 1 FROM public.campaign_members m JOIN public.characters c ON c.id=m.character_id
      WHERE m.campaign_id=p_campaign_id AND c.id=p_character_id AND m.user_id=c.user_id
      AND (c.user_id=auth.uid() OR public.is_campaign_master(auth.uid(),p_campaign_id))))
   OR (p_campaign_version='v2' AND EXISTS(SELECT 1 FROM public.campaign_members_v2 m JOIN public.characters c ON c.id=m.character_id
      WHERE m.campaign_id=p_campaign_id AND c.id=p_character_id AND m.user_id=c.user_id
      AND (c.user_id=auth.uid() OR public.is_campaign_master_v2(auth.uid(),p_campaign_id))))
 ) THEN RAISE EXCEPTION 'Ficha não vinculada à campanha informada.' USING ERRCODE='42501'; END IF;
END $$;
REVOKE ALL ON FUNCTION public.validate_character_activity_context(uuid,uuid,text) FROM PUBLIC,anon,authenticated;

CREATE FUNCTION public.record_character_activity(p_operation_id uuid,p_character_id uuid,p_category text,p_payload jsonb,
 p_campaign_id uuid DEFAULT NULL,p_campaign_version text DEFAULT NULL)
RETURNS public.character_activity_events LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE result public.character_activity_events; fingerprint text;
BEGIN
 PERFORM public.validate_character_activity_context(p_character_id,p_campaign_id,p_campaign_version);
 IF p_operation_id IS NULL OR p_category IS DISTINCT FROM 'roll' OR p_payload IS NULL
   OR jsonb_typeof(p_payload)<>'object' OR octet_length(p_payload::text)>65536 THEN
   RAISE EXCEPTION 'Registro de rolagem inválido.' USING ERRCODE='22023'; END IF;
 fingerprint:=md5(jsonb_build_array(p_character_id,p_category,p_payload,p_campaign_id,p_campaign_version)::text);
 PERFORM pg_advisory_xact_lock(hashtextextended(p_operation_id::text,0));
 SELECT * INTO result FROM public.character_activity_events WHERE operation_id=p_operation_id;
 IF FOUND THEN
   IF result.author_id<>auth.uid() OR result.request_hash<>fingerprint THEN
     RAISE EXCEPTION 'ID de operação já utilizado para outro registro.' USING ERRCODE='23505'; END IF;
   RETURN result;
 END IF;
 INSERT INTO public.character_activity_events(id,operation_id,character_id,author_id,category,status,payload,request_hash,campaign_id,campaign_version)
 VALUES(p_operation_id,p_operation_id,p_character_id,auth.uid(),'roll','confirmed',p_payload,fingerprint,p_campaign_id,p_campaign_version)
 RETURNING * INTO result;
 RETURN result;
END $$;

CREATE FUNCTION public.cast_character_ritual(p_operation_id uuid,p_character_id uuid,p_expected_pe integer,p_pe_cost integer,p_payload jsonb,
 p_campaign_id uuid DEFAULT NULL,p_campaign_version text DEFAULT NULL)
RETURNS public.character_activity_events LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE result public.character_activity_events; fingerprint text; current_pe integer;
BEGIN
 PERFORM public.validate_character_activity_context(p_character_id,p_campaign_id,p_campaign_version);
 IF p_operation_id IS NULL OR p_expected_pe IS NULL OR p_expected_pe<0 OR p_pe_cost IS NULL OR p_pe_cost NOT BETWEEN 0 AND 1000000
   OR p_payload IS NULL OR jsonb_typeof(p_payload)<>'object' OR octet_length(p_payload::text)>60000
   OR length(trim(coalesce(p_payload->>'ritualId',''))) NOT BETWEEN 1 AND 150
   OR length(trim(coalesce(p_payload->>'ritualName',''))) NOT BETWEEN 1 AND 200 THEN
   RAISE EXCEPTION 'Conjuração inválida.' USING ERRCODE='22023'; END IF;
 fingerprint:=md5(jsonb_build_array(p_character_id,p_expected_pe,p_pe_cost,p_payload,p_campaign_id,p_campaign_version)::text);
 PERFORM pg_advisory_xact_lock(hashtextextended(p_operation_id::text,0));
 SELECT * INTO result FROM public.character_activity_events WHERE operation_id=p_operation_id;
 IF FOUND THEN
   IF result.author_id<>auth.uid() OR result.request_hash<>fingerprint THEN
     RAISE EXCEPTION 'ID de operação reutilizado.' USING ERRCODE='23505'; END IF;
   RETURN result;
 END IF;
 SELECT pe_current INTO current_pe FROM public.characters WHERE id=p_character_id FOR UPDATE;
 IF current_pe IS DISTINCT FROM p_expected_pe THEN RAISE EXCEPTION 'PE atualizado por outra operação. Recarregue.' USING ERRCODE='40001'; END IF;
 IF current_pe<p_pe_cost THEN RAISE EXCEPTION 'PE insuficiente.' USING ERRCODE='22023'; END IF;
 UPDATE public.characters SET pe_current=current_pe-p_pe_cost WHERE id=p_character_id;
 INSERT INTO public.character_activity_events(id,operation_id,character_id,author_id,category,status,payload,request_hash,campaign_id,campaign_version)
 VALUES(p_operation_id,p_operation_id,p_character_id,auth.uid(),'ritual','pending',
   p_payload||jsonb_build_object('peBefore',current_pe,'peAfter',current_pe-p_pe_cost,'peCost',p_pe_cost,'effectStatus','pending'),
   fingerprint,p_campaign_id,p_campaign_version) RETURNING * INTO result;
 RETURN result;
END $$;

-- A RPC só altera campos explicitamente suportados. Não recebe um UPDATE
-- arbitrário. Cancelar o assistente não chama esta função nem devolve PE.
CREATE FUNCTION public.apply_character_effect(p_operation_id uuid,p_character_id uuid,p_kind text,p_value jsonb,p_expected jsonb,
 p_cast_event_id uuid DEFAULT NULL,p_campaign_id uuid DEFAULT NULL,p_campaign_version text DEFAULT NULL)
RETURNS public.character_activity_events LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE result public.character_activity_events; ficha public.characters; cast_event public.character_activity_events;
 fingerprint text; before_state jsonb; after_state jsonb; amount integer; next_conditions jsonb;
BEGIN
 PERFORM public.validate_character_activity_context(p_character_id,p_campaign_id,p_campaign_version);
 IF p_kind IS NULL OR p_kind NOT IN ('heal','damage','conditions') THEN
   RAISE EXCEPTION 'Este efeito requer resolução manual; aplicação automática indisponível.' USING ERRCODE='0A000'; END IF;
 IF p_operation_id IS NULL OR p_expected IS NULL OR jsonb_typeof(p_expected)<>'object'
   OR p_value IS NULL OR octet_length(p_value::text)>16000 THEN
   RAISE EXCEPTION 'Aplicação inválida.' USING ERRCODE='22023'; END IF;
 fingerprint:=md5(jsonb_build_array(p_character_id,p_kind,p_value,p_expected,p_cast_event_id,p_campaign_id,p_campaign_version)::text);
 PERFORM pg_advisory_xact_lock(hashtextextended(p_operation_id::text,0));
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
 IF p_kind IN ('heal','damage') THEN
   IF jsonb_typeof(p_value)<>'number' OR (p_value::text)::numeric<>trunc((p_value::text)::numeric)
     OR (p_value::text)::numeric NOT BETWEEN 0 AND 1000000 THEN RAISE EXCEPTION 'Quantidade inválida.' USING ERRCODE='22023'; END IF;
   amount:=(p_value::text)::integer;
   before_state:=jsonb_build_object('hp_current',ficha.hp_current,'hp_max',ficha.hp_max);
   IF p_expected->'hp_current' IS DISTINCT FROM before_state->'hp_current'
     OR p_expected->'hp_max' IS DISTINCT FROM before_state->'hp_max' THEN
     RAISE EXCEPTION 'PV atualizado por outra operação. Recarregue.' USING ERRCODE='40001'; END IF;
   UPDATE public.characters SET hp_current=CASE WHEN p_kind='heal' THEN least(hp_max,hp_current+amount) ELSE greatest(0,hp_current-amount) END
     WHERE id=p_character_id RETURNING jsonb_build_object('hp_current',hp_current,'hp_max',hp_max) INTO after_state;
 ELSE
   IF jsonb_typeof(p_value)<>'array' OR jsonb_array_length(p_value)>100
     OR EXISTS(SELECT 1 FROM jsonb_array_elements(p_value) item WHERE
       (jsonb_typeof(item)='string' AND length(trim(item#>>'{}')) NOT BETWEEN 1 AND 150)
       OR (jsonb_typeof(item)='object' AND (length(trim(coalesce(item->>'id',''))) NOT BETWEEN 1 AND 150
         OR length(trim(coalesce(item->>'name',''))) NOT BETWEEN 1 AND 200))
       OR jsonb_typeof(item) NOT IN ('string','object')) THEN
     RAISE EXCEPTION 'Condições inválidas.' USING ERRCODE='22023'; END IF;
   before_state:=jsonb_build_object('conditions',ficha.conditions);
   IF p_expected->'conditions' IS DISTINCT FROM ficha.conditions THEN
     RAISE EXCEPTION 'Condições atualizadas por outra operação. Recarregue.' USING ERRCODE='40001'; END IF;
   IF jsonb_typeof(ficha.conditions)<>'array' THEN RAISE EXCEPTION 'Condições existentes exigem revisão manual.' USING ERRCODE='22023'; END IF;
   -- Mantém entradas existentes intactas, inclusive desconhecidas/metadados.
   SELECT ficha.conditions||coalesce(jsonb_agg(item ORDER BY ordinal),'[]'::jsonb) INTO next_conditions
   FROM (SELECT DISTINCT ON (coalesce(value->>'id',value#>>'{}')) value AS item,ordinality AS ordinal
     FROM jsonb_array_elements(p_value) WITH ORDINALITY
     ORDER BY coalesce(value->>'id',value#>>'{}'),ordinality) additions WHERE NOT EXISTS(
     SELECT 1 FROM jsonb_array_elements(ficha.conditions) old
     WHERE coalesce(old->>'id',old#>>'{}')=coalesce(item->>'id',item#>>'{}'));
   UPDATE public.characters SET conditions=next_conditions WHERE id=p_character_id;
   after_state:=jsonb_build_object('conditions',next_conditions);
 END IF;
 INSERT INTO public.character_activity_events(id,operation_id,character_id,author_id,category,status,payload,request_hash,campaign_id,campaign_version)
 VALUES(p_operation_id,p_operation_id,p_character_id,auth.uid(),'application','confirmed',
   jsonb_build_object('kind',p_kind,'value',p_value,'before',before_state,'after',after_state,'castEventId',p_cast_event_id),
   fingerprint,p_campaign_id,p_campaign_version) RETURNING * INTO result;
 RETURN result;
END $$;

CREATE FUNCTION public.hide_character_activity(p_character_id uuid,p_hidden boolean DEFAULT true)
RETURNS public.character_activity_visibility LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE result public.character_activity_visibility;
BEGIN
 IF NOT public.can_manage_character_activity(p_character_id) OR p_hidden IS NULL THEN RAISE EXCEPTION 'Sem permissão para ocultar este histórico.' USING ERRCODE='42501'; END IF;
 INSERT INTO public.character_activity_visibility(user_id,character_id,hidden_before)
 VALUES(auth.uid(),p_character_id,CASE WHEN p_hidden THEN clock_timestamp() ELSE NULL END)
 ON CONFLICT(user_id,character_id) DO UPDATE SET hidden_before=EXCLUDED.hidden_before RETURNING * INTO result;
 RETURN result;
END $$;

CREATE FUNCTION public.list_character_activity(p_character_id uuid,p_limit integer DEFAULT 50,p_category text DEFAULT NULL,
 p_before_created_at timestamptz DEFAULT NULL,p_before_id uuid DEFAULT NULL,p_include_hidden boolean DEFAULT false)
RETURNS SETOF public.character_activity_events LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF NOT public.can_manage_character_activity(p_character_id) THEN RAISE EXCEPTION 'Sem permissão para este histórico.' USING ERRCODE='42501'; END IF;
 IF p_limit IS NULL OR p_limit NOT BETWEEN 1 AND 100 OR (p_category IS NOT NULL AND p_category NOT IN ('roll','ritual','application'))
   OR (p_before_created_at IS NULL)<>(p_before_id IS NULL) OR p_include_hidden IS NULL THEN
   RAISE EXCEPTION 'Filtro ou cursor inválido.' USING ERRCODE='22023'; END IF;
 RETURN QUERY SELECT e.* FROM public.character_activity_events e
 WHERE e.character_id=p_character_id AND (p_category IS NULL OR e.category=p_category)
   AND (p_before_created_at IS NULL OR (e.created_at,e.id)<(p_before_created_at,p_before_id))
   AND (p_include_hidden OR NOT EXISTS(SELECT 1 FROM public.character_activity_visibility v
     WHERE v.user_id=auth.uid() AND v.character_id=p_character_id AND e.created_at<=v.hidden_before))
 ORDER BY e.created_at DESC,e.id DESC LIMIT p_limit;
END $$;

REVOKE ALL ON FUNCTION public.record_character_activity(uuid,uuid,text,jsonb,uuid,text),
 public.cast_character_ritual(uuid,uuid,integer,integer,jsonb,uuid,text),
 public.apply_character_effect(uuid,uuid,text,jsonb,jsonb,uuid,uuid,text),
 public.hide_character_activity(uuid,boolean),public.list_character_activity(uuid,integer,text,timestamptz,uuid,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.record_character_activity(uuid,uuid,text,jsonb,uuid,text),
 public.cast_character_ritual(uuid,uuid,integer,integer,jsonb,uuid,text),
 public.apply_character_effect(uuid,uuid,text,jsonb,jsonb,uuid,uuid,text),
 public.hide_character_activity(uuid,boolean),public.list_character_activity(uuid,integer,text,timestamptz,uuid,boolean) TO authenticated;

-- Apenas leitura confirmada; receber evento não reaplica recurso.
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='character_activity_events') THEN
   ALTER PUBLICATION supabase_realtime ADD TABLE public.character_activity_events;
 END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='characters') THEN
   ALTER PUBLICATION supabase_realtime ADD TABLE public.characters;
 END IF;
END $$;
