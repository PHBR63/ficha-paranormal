-- O mestre confirma personagens vinculados à mesma campanha, em v1 ou v2.
-- Não infere área geométrica, RD nem resultado de Reflexos: declarações explícitas da mesa.
CREATE FUNCTION public.is_fragmentation_master(p_source uuid,p_target uuid DEFAULT NULL)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT auth.uid() IS NOT NULL AND (
 EXISTS(SELECT 1 FROM public.campaign_members s JOIN public.characters sc ON sc.id=s.character_id AND sc.user_id=s.user_id
 JOIN public.campaigns cp ON cp.id=s.campaign_id WHERE s.character_id=p_source AND cp.master_id=auth.uid()
 AND (p_target IS NULL OR EXISTS(SELECT 1 FROM public.campaign_members t JOIN public.characters tc ON tc.id=t.character_id AND tc.user_id=t.user_id
 WHERE t.campaign_id=cp.id AND t.character_id=p_target))) OR
 EXISTS(SELECT 1 FROM public.campaign_members_v2 s JOIN public.characters sc ON sc.id=s.character_id AND sc.user_id=s.user_id
 JOIN public.campaigns_v2 cp ON cp.id=s.campaign_id WHERE s.character_id=p_source AND cp.master_id=auth.uid()
 AND (p_target IS NULL OR EXISTS(SELECT 1 FROM public.campaign_members_v2 t JOIN public.characters tc ON tc.id=t.character_id AND tc.user_id=t.user_id
 WHERE t.campaign_id=cp.id AND t.character_id=p_target))));
$$;
REVOKE ALL ON FUNCTION public.is_fragmentation_master(uuid,uuid) FROM PUBLIC,anon,authenticated;

CREATE TABLE public.fragmentation_target_resolutions (
 explosion_id uuid NOT NULL REFERENCES public.character_activity_events(id) ON DELETE CASCADE,
 target_id uuid NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
 excluded boolean NOT NULL DEFAULT false,
 applied_event_id uuid REFERENCES public.character_activity_events(id),
 PRIMARY KEY(explosion_id,target_id)
);
ALTER TABLE public.fragmentation_target_resolutions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.fragmentation_target_resolutions FROM PUBLIC,anon,authenticated;

-- Leitura autenticada mínima; somente o mestre recebe candidatos com PV atuais.
CREATE FUNCTION public.get_character_fragmentation(p_character_id uuid,p_page integer DEFAULT 0) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE master boolean; events jsonb; targets jsonb;
BEGIN
 IF NOT public.can_manage_character_activity(p_character_id) THEN RAISE EXCEPTION 'Ficha não autorizada.' USING ERRCODE='42501'; END IF;
 IF p_page IS NULL OR p_page NOT BETWEEN 0 AND 10000 THEN RAISE EXCEPTION 'Página inválida.' USING ERRCODE='22023'; END IF;
 master:=public.is_fragmentation_master(p_character_id);
 SELECT coalesce(jsonb_agg(jsonb_build_object('id',e.id,'payload',e.payload,'createdAt',e.created_at,
 'targets',coalesce((SELECT jsonb_agg(jsonb_build_object('id',t.target_id,'name',c.name,'hp',c.hp_current,
 'excluded',t.excluded,'applied',t.applied_event_id IS NOT NULL)) FROM public.fragmentation_target_resolutions t
 JOIN public.characters c ON c.id=t.target_id WHERE t.explosion_id=e.id),'[]')) ORDER BY e.created_at DESC),'[]')
 INTO events FROM (SELECT * FROM public.character_activity_events WHERE character_id=p_character_id
 AND payload->>'kind'='fragmentation_throw' ORDER BY created_at DESC,id DESC LIMIT 30 OFFSET p_page*30) e;
 SELECT coalesce(jsonb_agg(jsonb_build_object('id',c.id,'name',c.name,'hp',c.hp_current) ORDER BY c.name),'[]') INTO targets
 FROM public.characters c WHERE master AND public.is_fragmentation_master(p_character_id,c.id);
 RETURN jsonb_build_object('master',master,'candidates',targets,'explosions',events);
END $$;

-- Lista é imutável após conferência. Exclusões exigem Perito e respeitam seu Intelecto salvo.
CREATE FUNCTION public.confirm_character_fragmentation_targets(p_operation_id uuid,p_character_id uuid,p_request jsonb)
RETURNS public.character_activity_events LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE e public.character_activity_events; receipt public.character_activity_events; fingerprint text; entry jsonb; target uuid;
BEGIN
 IF NOT public.is_fragmentation_master(p_character_id) THEN RAISE EXCEPTION 'Somente o mestre confirma a área.' USING ERRCODE='42501'; END IF;
 IF p_operation_id IS NULL OR jsonb_typeof(p_request->'targets') IS DISTINCT FROM 'array'
 OR jsonb_array_length(p_request->'targets')>50 OR p_request->'requirementsConfirmed' IS DISTINCT FROM 'true'::jsonb THEN
 RAISE EXCEPTION 'Confirme alvos e exclusões da área.' USING ERRCODE='22023'; END IF;
 fingerprint:=md5(jsonb_build_array(p_character_id,p_request)::text);
 PERFORM pg_advisory_xact_lock(hashtextextended(p_operation_id::text,0));
 SELECT * INTO receipt FROM public.character_activity_events WHERE operation_id=p_operation_id;
 IF FOUND THEN IF receipt.author_id<>auth.uid() OR receipt.request_hash<>fingerprint THEN RAISE EXCEPTION 'Operação reutilizada.' USING ERRCODE='23505'; END IF; RETURN receipt; END IF;
 SELECT * INTO e FROM public.character_activity_events WHERE id=(p_request->>'explosionId')::uuid AND character_id=p_character_id AND payload->>'kind'='fragmentation_throw' FOR UPDATE;
 IF NOT FOUND OR e.payload->'areaConfirmed'='true' THEN RAISE EXCEPTION 'Explosão ausente ou área já confirmada.' USING ERRCODE='55004'; END IF;
 IF (SELECT count(*) FROM jsonb_array_elements(p_request->'targets'))<>(SELECT count(DISTINCT value->>'id') FROM jsonb_array_elements(p_request->'targets'))
 OR (SELECT count(*) FROM jsonb_array_elements(p_request->'targets') WHERE value->'excluded'='true')>(e.payload->>'maxExcludedTargets')::integer THEN
 RAISE EXCEPTION 'Alvos repetidos ou exclusões além do limite de Perito.' USING ERRCODE='22023'; END IF;
 FOR entry IN SELECT value FROM jsonb_array_elements(p_request->'targets') LOOP
 target:=(entry->>'id')::uuid;
 IF NOT public.is_fragmentation_master(p_character_id,target) OR jsonb_typeof(entry->'excluded') IS DISTINCT FROM 'boolean' THEN
 RAISE EXCEPTION 'Alvo não vinculado à campanha ou exclusão inválida.' USING ERRCODE='42501'; END IF;
 INSERT INTO public.fragmentation_target_resolutions(explosion_id,target_id,excluded) VALUES(e.id,target,(entry->>'excluded')::boolean);
 END LOOP;
 UPDATE public.character_activity_events SET payload=payload||jsonb_build_object('areaConfirmed',true) WHERE id=e.id;
 INSERT INTO public.character_activity_events(id,operation_id,character_id,author_id,category,status,payload,request_hash)
 VALUES(p_operation_id,p_operation_id,p_character_id,auth.uid(),'application','confirmed',jsonb_build_object('kind','fragmentation_area',
 'explosionId',e.id,'targetCount',jsonb_array_length(p_request->'targets'),'targets',p_request->'targets'),fingerprint) RETURNING * INTO receipt;
 RETURN receipt;
END $$;

-- Reflexos/RD declarados pelo mestre. Servidor calcula metade, temporários e PV, sem aceitar dano arbitrário.
CREATE FUNCTION public.confirm_character_fragmentation_damage(p_operation_id uuid,p_character_id uuid,p_request jsonb)
RETURNS public.character_activity_events LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE e public.character_activity_events; receipt public.character_activity_events; t public.fragmentation_target_resolutions;
 c public.characters; fingerprint text; test integer; rd integer; damage integer; temp integer; hp integer; passed boolean; target_event uuid:=gen_random_uuid(); application_payload jsonb;
BEGIN
 IF NOT public.is_fragmentation_master(p_character_id,(p_request->>'targetId')::uuid) THEN RAISE EXCEPTION 'Somente o mestre aplica aos alvos vinculados.' USING ERRCODE='42501'; END IF;
 IF p_operation_id IS NULL OR p_request->'requirementsConfirmed' IS DISTINCT FROM 'true'::jsonb
 OR coalesce(p_request->>'resistanceTotal','') !~ '^-?[0-9]{1,3}$' OR coalesce(p_request->>'damageReduction','') !~ '^[0-9]{1,3}$'
 OR coalesce(p_request->>'expectedHp','') !~ '^[0-9]{1,6}$' THEN RAISE EXCEPTION 'Confira Reflexos, RD e PV.' USING ERRCODE='22023'; END IF;
 fingerprint:=md5(jsonb_build_array(p_character_id,p_request)::text);
 PERFORM pg_advisory_xact_lock(hashtextextended(p_operation_id::text,0));
 SELECT * INTO receipt FROM public.character_activity_events WHERE operation_id=p_operation_id;
 IF FOUND THEN IF receipt.author_id<>auth.uid() OR receipt.request_hash<>fingerprint THEN RAISE EXCEPTION 'Operação reutilizada.' USING ERRCODE='23505'; END IF; RETURN receipt; END IF;
 SELECT * INTO e FROM public.character_activity_events WHERE id=(p_request->>'explosionId')::uuid AND character_id=p_character_id AND payload->>'kind'='fragmentation_throw';
 IF NOT FOUND OR e.payload->'areaConfirmed' IS DISTINCT FROM 'true'::jsonb THEN RAISE EXCEPTION 'Confirme primeiro a área.' USING ERRCODE='55004'; END IF;
 SELECT * INTO t FROM public.fragmentation_target_resolutions WHERE explosion_id=e.id AND target_id=(p_request->>'targetId')::uuid FOR UPDATE;
 IF NOT FOUND OR t.excluded OR t.applied_event_id IS NOT NULL THEN RAISE EXCEPTION 'Alvo excluído, ausente ou já resolvido.' USING ERRCODE='55004'; END IF;
 SELECT * INTO c FROM public.characters WHERE id=t.target_id FOR UPDATE;
 IF c.hp_current<>(p_request->>'expectedHp')::integer THEN RAISE EXCEPTION 'PV mudou. Atualize antes de aplicar.' USING ERRCODE='40001'; END IF;
 test:=(p_request->>'resistanceTotal')::integer; rd:=(p_request->>'damageReduction')::integer;
 passed:=test>=(e.payload->>'dt')::integer;
 damage:=(e.payload->'result'->>'total')::integer;
 IF passed THEN damage:=floor(damage/2.0)::integer; END IF;
 damage:=greatest(0,damage-rd);
 temp:=public.consume_temporary_resource(c.id,'hp',damage,'Perfuração');
 hp:=greatest(0,c.hp_current-damage+temp);
 UPDATE public.characters SET hp_current=hp WHERE id=c.id;
 application_payload:=jsonb_build_object('kind','fragmentation_damage','explosionId',e.id,'targetName',c.name,'targetId',c.id,
 'resistanceTotal',test,'dt',(e.payload->>'dt')::integer,'passed',passed,'declaredDamageReduction',rd,
 'damage',damage,'temporaryHPUsed',temp,'hpBefore',c.hp_current,'hpAfter',hp);
 IF c.id<>p_character_id THEN
  INSERT INTO public.character_activity_events(id,operation_id,character_id,author_id,category,status,payload,request_hash)
  VALUES(target_event,target_event,c.id,auth.uid(),'application','confirmed',application_payload,fingerprint);
 ELSE target_event:=p_operation_id; END IF;
 INSERT INTO public.character_activity_events(id,operation_id,character_id,author_id,category,status,payload,request_hash)
 VALUES(p_operation_id,p_operation_id,p_character_id,auth.uid(),'application','confirmed',application_payload,fingerprint) RETURNING * INTO receipt;
 UPDATE public.fragmentation_target_resolutions SET applied_event_id=target_event WHERE explosion_id=e.id AND target_id=c.id;
 RETURN receipt;
END $$;
REVOKE ALL ON FUNCTION public.get_character_fragmentation(uuid,integer),public.confirm_character_fragmentation_targets(uuid,uuid,jsonb),public.confirm_character_fragmentation_damage(uuid,uuid,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_character_fragmentation(uuid,integer),public.confirm_character_fragmentation_targets(uuid,uuid,jsonb),public.confirm_character_fragmentation_damage(uuid,uuid,jsonb) TO authenticated;
