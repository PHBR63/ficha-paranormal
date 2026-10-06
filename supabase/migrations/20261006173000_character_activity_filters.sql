-- Filtros são aplicados antes de LIMIT; preserva cursor, ocultação e autorização.
CREATE FUNCTION public.list_character_activity_filtered(
 p_character_id uuid,p_limit integer DEFAULT 50,p_category text DEFAULT NULL,
 p_before_created_at timestamptz DEFAULT NULL,p_before_id uuid DEFAULT NULL,p_include_hidden boolean DEFAULT false,
 p_after_created_at timestamptz DEFAULT NULL,p_session_id uuid DEFAULT NULL,
 p_session_campaign_id uuid DEFAULT NULL,p_session_campaign_version text DEFAULT NULL)
RETURNS SETOF public.character_activity_events LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF NOT public.can_manage_character_activity(p_character_id) THEN RAISE EXCEPTION 'Sem permissão para este histórico.' USING ERRCODE='42501'; END IF;
 IF p_limit IS NULL OR p_limit NOT BETWEEN 1 AND 100 OR (p_category IS NOT NULL AND p_category NOT IN ('roll','ritual','application'))
   OR (p_before_created_at IS NULL)<>(p_before_id IS NULL) OR p_include_hidden IS NULL
   OR (p_session_id IS NULL)<>(p_session_campaign_id IS NULL)
   OR (p_session_id IS NULL)<>(p_session_campaign_version IS NULL)
   OR (p_session_campaign_version IS NOT NULL AND p_session_campaign_version NOT IN ('v1','v2')) THEN
   RAISE EXCEPTION 'Filtro ou cursor inválido.' USING ERRCODE='22023'; END IF;
 RETURN QUERY SELECT e.* FROM public.character_activity_events e
 LEFT JOIN public.character_activity_events cast_event
   ON e.category='application' AND cast_event.category='ritual' AND cast_event.id::text=e.payload->>'castEventId'
 WHERE e.character_id=p_character_id AND (p_category IS NULL OR e.category=p_category)
   AND (p_before_created_at IS NULL OR (e.created_at,e.id)<(p_before_created_at,p_before_id))
   AND (p_after_created_at IS NULL OR e.created_at>=p_after_created_at)
   AND (p_session_id IS NULL OR (
     coalesce(e.payload->>'sessionId',cast_event.payload->>'sessionId')=p_session_id::text
     AND coalesce(e.campaign_id,cast_event.campaign_id)=p_session_campaign_id
     AND coalesce(e.campaign_version,cast_event.campaign_version)=p_session_campaign_version))
   AND (p_include_hidden OR NOT EXISTS(SELECT 1 FROM public.character_activity_visibility v
     WHERE v.user_id=auth.uid() AND v.character_id=p_character_id AND e.created_at<=v.hidden_before))
 ORDER BY e.created_at DESC,e.id DESC LIMIT p_limit;
END $$;

-- Opções completas da ficha, independentes da página/filtro atual. O vínculo de
-- campanha e versão impede consultar títulos de sessões a partir de IDs forjados.
CREATE FUNCTION public.list_character_activity_sessions(p_character_id uuid)
RETURNS TABLE(id uuid,campaign_id uuid,campaign_version text,session_number integer,title text,campaign_name text,session_date timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF NOT public.can_manage_character_activity(p_character_id) THEN RAISE EXCEPTION 'Sem permissão para este histórico.' USING ERRCODE='42501'; END IF;
 RETURN QUERY
 WITH event_context AS (
   SELECT coalesce(e.payload->>'sessionId',cast_event.payload->>'sessionId') AS session_id,
     coalesce(e.campaign_id,cast_event.campaign_id) AS campaign_id,
     coalesce(e.campaign_version,cast_event.campaign_version) AS version
   FROM public.character_activity_events e
   LEFT JOIN public.character_activity_events cast_event
     ON e.category='application' AND cast_event.category='ritual' AND cast_event.id::text=e.payload->>'castEventId'
   WHERE e.character_id=p_character_id
 ), sessions AS (
   SELECT DISTINCT s.id,s.campaign_id,'v1'::text AS campaign_version,s.session_number,s.title,c.name AS campaign_name,
     coalesce(s.started_at,s.created_at) AS session_date
   FROM event_context e JOIN public.campaign_sessions s ON s.id::text=e.session_id AND s.campaign_id=e.campaign_id
   JOIN public.campaigns c ON c.id=s.campaign_id WHERE e.version='v1'
     AND (public.is_campaign_member(auth.uid(),s.campaign_id) OR public.is_campaign_master(auth.uid(),s.campaign_id))
   UNION
   SELECT DISTINCT s.id,s.campaign_id,'v2'::text AS campaign_version,s.session_number,s.title,c.name AS campaign_name,
     coalesce(s.started_at,s.created_at) AS session_date
   FROM event_context e JOIN public.campaign_sessions_v2 s ON s.id::text=e.session_id AND s.campaign_id=e.campaign_id
   JOIN public.campaigns_v2 c ON c.id=s.campaign_id WHERE e.version='v2'
     AND (public.is_campaign_member_v2(auth.uid(),s.campaign_id) OR public.is_campaign_master_v2(auth.uid(),s.campaign_id))
 ) SELECT s.* FROM sessions s ORDER BY s.session_date DESC,s.id DESC;
END $$;
REVOKE ALL ON FUNCTION public.list_character_activity_filtered(uuid,integer,text,timestamptz,uuid,boolean,timestamptz,uuid,uuid,text),
 public.list_character_activity_sessions(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.list_character_activity_filtered(uuid,integer,text,timestamptz,uuid,boolean,timestamptz,uuid,uuid,text),
 public.list_character_activity_sessions(uuid) TO authenticated;
