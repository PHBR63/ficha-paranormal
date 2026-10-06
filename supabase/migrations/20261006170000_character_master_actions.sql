-- Ações explícitas de dono/mestre vinculado. Nenhum UPDATE geral é liberado.
CREATE FUNCTION public.change_character_resource(p_operation_id uuid,p_character_id uuid,p_resource text,p_mode text,
 p_value integer,p_expected_current integer,p_expected_max integer)
RETURNS public.character_activity_events LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE result public.character_activity_events; ficha public.characters; current_value integer; maximum integer; next_value integer; fingerprint text;
BEGIN
 IF NOT public.can_manage_character_activity(p_character_id) THEN RAISE EXCEPTION 'Sem permissão para alterar esta ficha.' USING ERRCODE='42501'; END IF;
 IF p_operation_id IS NULL OR p_resource IS NULL OR p_resource NOT IN ('hp','pe','san') OR p_mode IS NULL OR p_mode NOT IN ('delta','set')
 OR p_value IS NULL OR abs(p_value::bigint)>1000000 OR p_expected_current IS NULL OR p_expected_max IS NULL THEN
 RAISE EXCEPTION 'Recurso ou quantidade inválida.' USING ERRCODE='22023'; END IF;
 fingerprint:=md5(jsonb_build_array(p_character_id,p_resource,p_mode,p_value,p_expected_current,p_expected_max)::text);
 PERFORM pg_advisory_xact_lock(hashtextextended(p_operation_id::text,0));
 SELECT * INTO result FROM public.character_activity_events WHERE operation_id=p_operation_id;
 IF FOUND THEN
 IF result.author_id<>auth.uid() OR result.request_hash<>fingerprint THEN RAISE EXCEPTION 'Operação já utilizada.' USING ERRCODE='23505'; END IF;
 RETURN result; END IF;
 SELECT * INTO ficha FROM public.characters WHERE id=p_character_id FOR UPDATE;
 current_value:=CASE p_resource WHEN 'hp' THEN ficha.hp_current WHEN 'pe' THEN ficha.pe_current ELSE ficha.san_current END;
 maximum:=CASE p_resource WHEN 'hp' THEN ficha.hp_max WHEN 'pe' THEN ficha.pe_max ELSE ficha.san_max END;
 IF current_value IS DISTINCT FROM p_expected_current OR maximum IS DISTINCT FROM p_expected_max THEN
 RAISE EXCEPTION 'Recurso atualizado por outra operação. Recarregue.' USING ERRCODE='40001'; END IF;
 next_value:=greatest(0,least(maximum,CASE WHEN p_mode='delta' THEN current_value+p_value ELSE p_value END));
 UPDATE public.characters SET hp_current=CASE WHEN p_resource='hp' THEN next_value ELSE hp_current END,
 pe_current=CASE WHEN p_resource='pe' THEN next_value ELSE pe_current END,
 san_current=CASE WHEN p_resource='san' THEN next_value ELSE san_current END WHERE id=p_character_id;
 INSERT INTO public.character_activity_events(id,operation_id,character_id,author_id,category,status,payload,request_hash)
 VALUES(p_operation_id,p_operation_id,p_character_id,auth.uid(),'application','confirmed',
 jsonb_build_object('kind','resource','resource',p_resource,'mode',p_mode,'value',p_value,
 'before',jsonb_build_object('current',current_value,'max',maximum),'after',jsonb_build_object('current',next_value,'max',maximum)),fingerprint)
 RETURNING * INTO result; RETURN result;
END $$;

-- Substituição é usada somente por ações explícitas remover/limpar/adicionar.
-- JSON de condições não reconhecidas continua intacto quando não foi removido.
CREATE FUNCTION public.replace_character_conditions(p_operation_id uuid,p_character_id uuid,p_conditions jsonb,p_expected jsonb)
RETURNS public.character_activity_events LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE result public.character_activity_events; current_conditions jsonb; fingerprint text;
BEGIN
 IF NOT public.can_manage_character_activity(p_character_id) THEN RAISE EXCEPTION 'Sem permissão para alterar esta ficha.' USING ERRCODE='42501'; END IF;
 IF p_operation_id IS NULL OR p_conditions IS NULL OR p_expected IS NULL OR jsonb_typeof(p_conditions)<>'array'
 OR jsonb_typeof(p_expected)<>'array' OR octet_length(p_conditions::text)>30000 OR jsonb_array_length(p_conditions)>100
 OR EXISTS(SELECT 1 FROM jsonb_array_elements(p_conditions) item WHERE jsonb_typeof(item) NOT IN ('string','object')
 OR (jsonb_typeof(item)='string' AND length(trim(item#>>'{}')) NOT BETWEEN 1 AND 150)
 OR (jsonb_typeof(item)='object' AND length(trim(coalesce(item->>'id',item->>'name',''))) NOT BETWEEN 1 AND 200)) THEN
 RAISE EXCEPTION 'Condições inválidas.' USING ERRCODE='22023'; END IF;
 fingerprint:=md5(jsonb_build_array(p_character_id,p_conditions,p_expected)::text);
 PERFORM pg_advisory_xact_lock(hashtextextended(p_operation_id::text,0));
 SELECT * INTO result FROM public.character_activity_events WHERE operation_id=p_operation_id;
 IF FOUND THEN
 IF result.author_id<>auth.uid() OR result.request_hash<>fingerprint THEN RAISE EXCEPTION 'Operação já utilizada.' USING ERRCODE='23505'; END IF;
 RETURN result; END IF;
 SELECT conditions INTO current_conditions FROM public.characters WHERE id=p_character_id FOR UPDATE;
 IF current_conditions IS DISTINCT FROM p_expected THEN RAISE EXCEPTION 'Condições atualizadas por outra operação. Recarregue.' USING ERRCODE='40001'; END IF;
 UPDATE public.characters SET conditions=p_conditions WHERE id=p_character_id;
 INSERT INTO public.character_activity_events(id,operation_id,character_id,author_id,category,status,payload,request_hash)
 VALUES(p_operation_id,p_operation_id,p_character_id,auth.uid(),'application','confirmed',
 jsonb_build_object('kind','replace_conditions','before',jsonb_build_object('conditions',current_conditions),
 'after',jsonb_build_object('conditions',p_conditions)),fingerprint) RETURNING * INTO result;
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.change_character_resource(uuid,uuid,text,text,integer,integer,integer),
 public.replace_character_conditions(uuid,uuid,jsonb,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.change_character_resource(uuid,uuid,text,text,integer,integer,integer),
 public.replace_character_conditions(uuid,uuid,jsonb,jsonb) TO authenticated;
