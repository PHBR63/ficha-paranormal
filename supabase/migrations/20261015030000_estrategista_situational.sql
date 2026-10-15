-- Estrategista, Livro Base v1.3 p.27: ação padrão, 1 PE por aliado,
-- até Intelecto aliados em alcance curto (médio a partir de NEX 65%).
-- Aceite: somente alvos vinculados à mesma campanha, declaração de alcance,
-- débito e recibo atômicos, repetição idempotente e concessão visível ao alvo.
CREATE TABLE IF NOT EXISTS public.character_estrategista_grants (
  operation_id uuid NOT NULL REFERENCES public.character_activity_events(id) ON DELETE CASCADE,
  source_character_id uuid NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  target_character_id uuid NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','used')),
  granted_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  used_at timestamptz,
  PRIMARY KEY (operation_id,target_character_id)
);
CREATE INDEX IF NOT EXISTS character_estrategista_target ON public.character_estrategista_grants(target_character_id,granted_at DESC);
ALTER TABLE public.character_estrategista_grants ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.character_estrategista_grants FROM PUBLIC,anon,authenticated;
DROP POLICY IF EXISTS "Estrategista target read" ON public.character_estrategista_grants;
CREATE POLICY "Estrategista target read" ON public.character_estrategista_grants FOR SELECT TO authenticated
 USING(public.can_manage_character_activity(target_character_id));
GRANT SELECT ON public.character_estrategista_grants TO authenticated;

-- O cliente usa esta lista apenas para escolha. A confirmação refaz a associação.
CREATE OR REPLACE FUNCTION public.get_character_estrategista_targets(p_character_id uuid)
RETURNS TABLE(id uuid,name text) LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 WITH linked AS (
  SELECT target.character_id FROM public.campaign_members source
  JOIN public.characters owner_source ON owner_source.id=source.character_id AND owner_source.user_id=source.user_id
  JOIN public.campaign_members target ON target.campaign_id=source.campaign_id
  JOIN public.characters owner_target ON owner_target.id=target.character_id AND owner_target.user_id=target.user_id
  WHERE source.character_id=p_character_id AND target.character_id<>p_character_id
  UNION
  SELECT target.character_id FROM public.campaign_members_v2 source
  JOIN public.characters owner_source ON owner_source.id=source.character_id AND owner_source.user_id=source.user_id
  JOIN public.campaign_members_v2 target ON target.campaign_id=source.campaign_id
  JOIN public.characters owner_target ON owner_target.id=target.character_id AND owner_target.user_id=target.user_id
  WHERE source.character_id=p_character_id AND target.character_id<>p_character_id
 )
 SELECT c.id,c.name FROM linked JOIN public.characters c ON c.id=linked.character_id
 WHERE public.can_manage_character_activity(p_character_id) ORDER BY c.name,c.id;
$$;
REVOKE ALL ON FUNCTION public.get_character_estrategista_targets(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_character_estrategista_targets(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.confirm_character_estrategista(p_operation_id uuid,p_character_id uuid,p_request jsonb)
RETURNS public.character_activity_events LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE ficha public.characters; receipt public.character_activity_events; budget jsonb;
 fingerprint text; targets uuid[]; target_id uuid; cost integer; temporary_before integer; temporary_used integer;
BEGIN
 IF p_operation_id IS NULL OR jsonb_typeof(p_request) IS DISTINCT FROM 'object'
 OR octet_length(p_request::text)>8192 OR p_request->'standardActionConfirmed' IS DISTINCT FROM 'true'::jsonb
 OR p_request->'rangeConfirmed' IS DISTINCT FROM 'true'::jsonb
 OR jsonb_typeof(p_request->'targets') IS DISTINCT FROM 'array' THEN
  RAISE EXCEPTION 'Confirme ação padrão, alcance e aliados.' USING ERRCODE='22023'; END IF;
 fingerprint:=md5(jsonb_build_array(p_character_id,p_request)::text);
 PERFORM pg_advisory_xact_lock(hashtextextended(p_operation_id::text,0));
 PERFORM public.lock_character_pe_turn(p_character_id);
 SELECT * INTO receipt FROM public.character_activity_events WHERE operation_id=p_operation_id;
 IF FOUND THEN
  IF receipt.author_id<>auth.uid() OR receipt.request_hash<>fingerprint THEN
   RAISE EXCEPTION 'Operação reutilizada.' USING ERRCODE='23505'; END IF;
  RETURN receipt;
 END IF;
 SELECT * INTO ficha FROM public.characters WHERE id=p_character_id FOR UPDATE;
 IF NOT FOUND OR lower(ficha.class) IS DISTINCT FROM 'combatente'
 OR public.creation_identifier(ficha.class_track) IS DISTINCT FROM 'comandante-campo' OR ficha.nex<40 THEN
  RAISE EXCEPTION 'Estrategista indisponível nesta ficha.' USING ERRCODE='55004'; END IF;
 IF ficha.intellect NOT BETWEEN 0 AND 5 OR p_request->>'expectedPE' IS DISTINCT FROM ficha.pe_current::text
 OR p_request->>'expectedIntellect' IS DISTINCT FROM ficha.intellect::text
 OR p_request->>'expectedNex' IS DISTINCT FROM ficha.nex::text THEN
  RAISE EXCEPTION 'Ficha mudou. Atualize antes de confirmar.' USING ERRCODE='40001'; END IF;
 SELECT array_agg(value::uuid) INTO targets FROM jsonb_array_elements_text(p_request->'targets') value
 WHERE value ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
 cost:=coalesce(array_length(targets,1),0);
 IF cost<1 OR cost>ficha.intellect OR cost<>jsonb_array_length(p_request->'targets')
 OR (SELECT count(DISTINCT value) FROM unnest(targets) value)<>cost
 OR p_character_id=ANY(targets) THEN
  RAISE EXCEPTION 'Escolha aliados distintos até o limite de Intelecto.' USING ERRCODE='22023'; END IF;
 FOREACH target_id IN ARRAY targets LOOP
  IF NOT EXISTS(SELECT 1 FROM public.get_character_estrategista_targets(p_character_id) eligible WHERE eligible.id=target_id) THEN
   RAISE EXCEPTION 'Aliado não está vinculado à mesma campanha.' USING ERRCODE='42501'; END IF;
 END LOOP;
 budget:=public.get_character_pe_budget(p_character_id);
 IF p_request->>'expectedTurnKey' IS DISTINCT FROM budget->>'key' THEN
  RAISE EXCEPTION 'Turno mudou. Atualize antes de confirmar.' USING ERRCODE='40001'; END IF;
 SELECT coalesce(sum(remaining),0)::integer INTO temporary_before FROM public.character_temporary_resources
 WHERE character_id=p_character_id AND resource='pe';
 IF ficha.pe_current+temporary_before<cost THEN RAISE EXCEPTION 'PE insuficiente.' USING ERRCODE='22023'; END IF;
 temporary_used:=public.consume_temporary_resource(p_character_id,'pe',cost);
 UPDATE public.characters SET pe_current=pe_current-cost+temporary_used WHERE id=p_character_id;
 INSERT INTO public.character_activity_events(id,operation_id,character_id,author_id,category,status,payload,request_hash)
 VALUES(p_operation_id,p_operation_id,p_character_id,auth.uid(),'application','confirmed',
  jsonb_build_object('kind','estrategista','targetIds',to_jsonb(targets),
   'targetNames',(SELECT jsonb_agg(c.name ORDER BY c.name) FROM public.characters c WHERE c.id=ANY(targets)),
   'targetCount',cost,
   'range',CASE WHEN ficha.nex>=65 THEN 'medio' ELSE 'curto' END,'actionCost','padrão',
   'effect','uma ação de movimento adicional no próximo turno de cada aliado',
   'peCost',cost,'peBefore',ficha.pe_current,'peAfter',ficha.pe_current-cost+temporary_used,
   'temporaryPEUsed',temporary_used,'targetStatus','pending_next_turn'),fingerprint)
 RETURNING * INTO receipt;
 INSERT INTO public.character_estrategista_grants(operation_id,source_character_id,target_character_id)
 SELECT receipt.id,p_character_id,value FROM unnest(targets) value;
 RETURN public.record_ritual_pe_budget(receipt.id,budget,cost,'ability',false);
END $$;
REVOKE ALL ON FUNCTION public.confirm_character_estrategista(uuid,uuid,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.confirm_character_estrategista(uuid,uuid,jsonb) TO authenticated;

-- Alvo consulta sua concessão sem obter acesso ao histórico completo do emissor.
CREATE OR REPLACE FUNCTION public.list_character_estrategista_grants(p_character_id uuid)
RETURNS TABLE(operation_id uuid,source_name text,status text,granted_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT g.operation_id,c.name,g.status,g.granted_at FROM public.character_estrategista_grants g
 JOIN public.characters c ON c.id=g.source_character_id
 WHERE g.target_character_id=p_character_id AND g.status='pending'
 AND public.can_manage_character_activity(p_character_id)
 ORDER BY g.granted_at DESC LIMIT 20;
$$;
REVOKE ALL ON FUNCTION public.list_character_estrategista_grants(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.list_character_estrategista_grants(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.use_character_estrategista_grant(p_operation_id uuid,p_character_id uuid,p_grant_operation_id uuid,p_next_turn_confirmed boolean)
RETURNS public.character_activity_events LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE grant_row public.character_estrategista_grants; receipt public.character_activity_events; fingerprint text;
BEGIN
 IF p_operation_id IS NULL OR p_grant_operation_id IS NULL OR NOT public.can_manage_character_activity(p_character_id) THEN
  RAISE EXCEPTION 'Ficha não autorizada.' USING ERRCODE='42501'; END IF;
 IF p_next_turn_confirmed IS DISTINCT FROM true THEN
  RAISE EXCEPTION 'Confirme que este é o próximo turno do aliado.' USING ERRCODE='22023'; END IF;
 fingerprint:=md5(jsonb_build_array(p_character_id,p_grant_operation_id,'used')::text);
 PERFORM pg_advisory_xact_lock(hashtextextended(p_operation_id::text,0));
 SELECT * INTO receipt FROM public.character_activity_events WHERE operation_id=p_operation_id;
 IF FOUND THEN
  IF receipt.author_id<>auth.uid() OR receipt.request_hash<>fingerprint THEN RAISE EXCEPTION 'Operação reutilizada.' USING ERRCODE='23505'; END IF;
  RETURN receipt;
 END IF;
 SELECT * INTO grant_row FROM public.character_estrategista_grants
 WHERE operation_id=p_grant_operation_id AND target_character_id=p_character_id FOR UPDATE;
 IF NOT FOUND OR grant_row.status<>'pending' THEN RAISE EXCEPTION 'Ação adicional indisponível.' USING ERRCODE='55004'; END IF;
 UPDATE public.character_estrategista_grants SET status='used',used_at=clock_timestamp()
 WHERE operation_id=p_grant_operation_id AND target_character_id=p_character_id;
 INSERT INTO public.character_activity_events(id,operation_id,character_id,author_id,category,status,payload,request_hash)
 VALUES(p_operation_id,p_operation_id,p_character_id,auth.uid(),'application','confirmed',
 jsonb_build_object('kind','estrategista_movement','grantOperationId',p_grant_operation_id,
 'effect','ação de movimento adicional utilizada','peCost',0),fingerprint) RETURNING * INTO receipt;
 RETURN receipt;
END $$;
REVOKE ALL ON FUNCTION public.use_character_estrategista_grant(uuid,uuid,uuid,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.use_character_estrategista_grant(uuid,uuid,uuid,boolean) TO authenticated;
