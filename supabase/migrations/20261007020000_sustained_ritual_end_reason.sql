-- Acrescenta motivo informado ao encerramento sem alterar os recibos antigos.
-- A RPC anterior permanece compatível com clientes ainda abertos; a interface
-- atual usa esta confirmação, sem inferir morte, alcance ou eventos de narrativa.
CREATE FUNCTION public.confirm_sustained_ritual_end(
 p_operation_id uuid,p_character_id uuid,p_action text,p_expected jsonb,p_reason jsonb
) RETURNS public.character_activity_events LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE result public.character_activity_events; fingerprint text;
BEGIN
 IF NOT public.can_manage_character_activity(p_character_id) THEN
  RAISE EXCEPTION 'Ficha não autorizada.' USING ERRCODE='42501'; END IF;
 IF p_operation_id IS NULL OR p_action IS NULL OR p_action NOT IN ('end','end_all')
 OR p_reason IS NULL OR jsonb_typeof(p_reason)<>'object' OR octet_length(p_reason::text)>3000
 OR p_reason-ARRAY['kind','note','rangeConfirmed']<>'{}'::jsonb
 OR coalesce(p_reason->>'kind','') NOT IN ('voluntario','nao_mantido','pe_indisponivel','morte_conjurador','dissipado','efeito_especifico','ajuste_manual')
 OR (p_reason ? 'note' AND (jsonb_typeof(p_reason->'note')<>'string' OR length(p_reason->>'note')>500))
 OR (p_reason ? 'rangeConfirmed' AND jsonb_typeof(p_reason->'rangeConfirmed')<>'boolean')
 OR (p_reason->>'kind' IN ('efeito_especifico','ajuste_manual') AND length(trim(coalesce(p_reason->>'note','')))=0)
 OR (p_reason->>'kind'='voluntario' AND p_reason->'rangeConfirmed' IS DISTINCT FROM 'true'::jsonb)
 OR p_expected IS NULL OR jsonb_typeof(p_expected)<>'array' OR jsonb_array_length(p_expected) NOT BETWEEN 1 AND 64
 OR octet_length(p_expected::text)>24000 THEN
  RAISE EXCEPTION 'Confirme um motivo válido.' USING ERRCODE='22023'; END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(p_expected) e WHERE jsonb_typeof(e)<>'object'
 OR coalesce(e->>'id','') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$') THEN
  RAISE EXCEPTION 'Identidade inválida.' USING ERRCODE='22023'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_operation_id::text,0));
 fingerprint:=md5(jsonb_build_array(p_character_id,p_action,p_expected,p_reason)::text);
 SELECT * INTO result FROM public.character_activity_events WHERE operation_id=p_operation_id;
 IF FOUND THEN
  IF result.author_id<>auth.uid() OR result.request_hash<>fingerprint THEN
   RAISE EXCEPTION 'Operação reutilizada com outro motivo.' USING ERRCODE='23505'; END IF;
  RETURN result;
 END IF;
 -- Mesma ordem de bloqueios da RPC base: ficha antes das sustentações.
 PERFORM 1 FROM public.characters WHERE id=p_character_id FOR UPDATE;
 PERFORM 1 FROM public.character_sustained_rituals WHERE character_id=p_character_id ORDER BY id FOR UPDATE;
 IF p_reason->>'kind'='voluntario' AND EXISTS(
  SELECT 1 FROM jsonb_array_elements(p_expected) e
  LEFT JOIN public.sustained_ritual_origins o ON o.sustained_id=(e->>'id')::uuid
  WHERE o.caster_character_id IS DISTINCT FROM p_character_id
 ) THEN
  RAISE EXCEPTION 'Conjurador requer conferência manual.' USING ERRCODE='0A000'; END IF;
 result:=public.confirm_sustained_ritual_action(p_operation_id,p_character_id,p_action,p_expected,NULL);
 UPDATE public.character_activity_events SET payload=payload||jsonb_build_object('endReason',p_reason,'reasonSource','user_confirmed'),
  request_hash=fingerprint WHERE id=result.id RETURNING * INTO result;
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.confirm_sustained_ritual_end(uuid,uuid,text,jsonb,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.confirm_sustained_ritual_end(uuid,uuid,text,jsonb,jsonb) TO authenticated;
