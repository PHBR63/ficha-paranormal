-- Livro Base v1.3 p.88: reconciliação por saldo/transição dentro da operação
-- já autorizada. Não atualiza fichas em massa nem cria uma cena de regras.
CREATE FUNCTION public.reconcile_resource_conditions(p_conditions jsonb,
 p_previous_hp integer,p_hp integer,p_hp_max integer,
 p_previous_san integer,p_san integer,p_san_max integer,p_hp_loss integer DEFAULT 0)
RETURNS jsonb LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
DECLARE next_conditions jsonb:='[]'; item jsonb; identity text; identities text[]:='{}';
 add_ids text[]:='{}'; condition_id text; condition_name text;
BEGIN
 IF p_conditions IS NULL OR jsonb_typeof(p_conditions)<>'array'
   OR p_previous_hp IS NULL OR p_hp IS NULL OR p_hp_max IS NULL
   OR p_previous_san IS NULL OR p_san IS NULL OR p_san_max IS NULL
   OR p_hp_loss IS NULL OR p_hp_loss<0 THEN
   RAISE EXCEPTION 'Recursos ou condições existentes exigem revisão manual.' USING ERRCODE='22023';
 END IF;
 -- Só reconhece as identidades dessas cinco condições. Nome aproximado de
 -- uma condição externa não autoriza remover seu objeto ou seus parâmetros.
 FOR item IN SELECT value FROM jsonb_array_elements(p_conditions) LOOP
   identity:=regexp_replace(lower(coalesce(item->>'id',item->>'name',item#>>'{}')),'[^a-z0-9]','','g');
   IF (identity='machucado' AND p_hp::numeric>p_hp_max::numeric/2)
     OR (identity='inconsciente' AND p_hp>0 AND p_hp>p_previous_hp)
     OR (identity='enlouquecendo' AND p_san>0 AND p_san>p_previous_san)
     OR (identity='perturbado' AND p_san::numeric>=p_san_max::numeric/2) THEN
     CONTINUE;
   END IF;
   next_conditions:=next_conditions||jsonb_build_array(item);
   IF identity IS NOT NULL THEN identities:=array_append(identities,identity); END IF;
 END LOOP;
 IF p_hp_max>0 AND p_hp::numeric<=p_hp_max::numeric/2 THEN add_ids:=array_append(add_ids,'machucado'); END IF;
 IF p_hp=0 AND (p_hp<p_previous_hp OR p_hp_loss>0) THEN
   add_ids:=add_ids||ARRAY['inconsciente','morrendo'];
 END IF;
 IF p_san=0 AND p_san<p_previous_san THEN add_ids:=array_append(add_ids,'enlouquecendo'); END IF;
 IF p_san>0 AND p_san::numeric<p_san_max::numeric/2 AND NOT 'enlouquecendo'=ANY(identities) THEN
   add_ids:=array_append(add_ids,'perturbado');
 END IF;
 FOREACH condition_id IN ARRAY add_ids LOOP
   IF condition_id=ANY(identities) THEN CONTINUE; END IF;
   condition_name:=CASE condition_id WHEN 'machucado' THEN 'Machucado' WHEN 'inconsciente' THEN 'Inconsciente'
     WHEN 'morrendo' THEN 'Morrendo' WHEN 'enlouquecendo' THEN 'Enlouquecendo' ELSE 'Perturbado' END;
   item:=jsonb_build_object('id',condition_id,'name',condition_name,'turnsRemaining',NULL,'addedAt',clock_timestamp());
   IF condition_id='morrendo' THEN item:=item||jsonb_build_object('dyingCounter',3); END IF;
   next_conditions:=next_conditions||jsonb_build_array(item);
   identities:=array_append(identities,condition_id);
 END LOOP;
 IF jsonb_array_length(next_conditions)>100 OR octet_length(next_conditions::text)>30000 THEN
   RAISE EXCEPTION 'Condições excedem o limite; confira a ficha antes de aplicar.' USING ERRCODE='22023';
 END IF;
 RETURN next_conditions;
END $$;
-- Auxiliar privado: o usuário continua usando apenas as RPCs autorizadas.
REVOKE ALL ON FUNCTION public.reconcile_resource_conditions(jsonb,integer,integer,integer,integer,integer,integer,integer)
 FROM PUBLIC,anon,authenticated;

-- Atualiza as implementações conservando contratos, autorização, CAS e UUIDs.
CREATE OR REPLACE FUNCTION public.apply_character_effect_core(p_operation_id uuid,p_character_id uuid,p_kind text,p_value jsonb,p_expected jsonb,
 p_cast_event_id uuid DEFAULT NULL,p_campaign_id uuid DEFAULT NULL,p_campaign_version text DEFAULT NULL)
RETURNS public.character_activity_events LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE result public.character_activity_events; ficha public.characters; cast_event public.character_activity_events;
 fingerprint text; before_state jsonb; after_state jsonb; amount integer; next_conditions jsonb; next_hp integer;
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
   before_state:=jsonb_build_object('hp_current',ficha.hp_current,'hp_max',ficha.hp_max,'conditions',ficha.conditions);
   IF p_expected->'hp_current' IS DISTINCT FROM before_state->'hp_current'
     OR p_expected->'hp_max' IS DISTINCT FROM before_state->'hp_max' THEN
     RAISE EXCEPTION 'PV atualizado por outra operação. Recarregue.' USING ERRCODE='40001'; END IF;
   next_hp:=CASE WHEN p_kind='heal' THEN least(ficha.hp_max,ficha.hp_current+amount) ELSE greatest(0,ficha.hp_current-amount) END;
   -- A linha já está bloqueada: preserva as condições atuais do alvo e grava
   -- PV/condições/recibo juntos. O retry acima retorna o recibo sem recalcular.
   next_conditions:=public.reconcile_resource_conditions(ficha.conditions,ficha.hp_current,next_hp,ficha.hp_max,
     ficha.san_current,ficha.san_current,ficha.san_max,CASE WHEN p_kind='damage' THEN amount ELSE 0 END);
   UPDATE public.characters SET hp_current=next_hp,conditions=next_conditions WHERE id=p_character_id
     RETURNING jsonb_build_object('hp_current',hp_current,'hp_max',hp_max,'conditions',conditions) INTO after_state;
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

CREATE OR REPLACE FUNCTION public.change_character_resource(p_operation_id uuid,p_character_id uuid,p_resource text,p_mode text,
 p_value integer,p_expected_current integer,p_expected_max integer)
RETURNS public.character_activity_events LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE result public.character_activity_events; ficha public.characters; current_value integer; maximum integer; next_value integer; fingerprint text; next_conditions jsonb;
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
 -- PE sozinho não representa dano/cura nem recria condições estabilizadas.
 next_conditions:=public.reconcile_resource_conditions(ficha.conditions,ficha.hp_current,
   CASE WHEN p_resource='hp' THEN next_value ELSE ficha.hp_current END,ficha.hp_max,
   ficha.san_current,CASE WHEN p_resource='san' THEN next_value ELSE ficha.san_current END,ficha.san_max,
   CASE WHEN p_resource='hp' AND p_mode='delta' AND p_value<0 THEN -p_value ELSE 0 END);
 UPDATE public.characters SET conditions=next_conditions,hp_current=CASE WHEN p_resource='hp' THEN next_value ELSE hp_current END,
 pe_current=CASE WHEN p_resource='pe' THEN next_value ELSE pe_current END,
 san_current=CASE WHEN p_resource='san' THEN next_value ELSE san_current END WHERE id=p_character_id;
 INSERT INTO public.character_activity_events(id,operation_id,character_id,author_id,category,status,payload,request_hash)
 VALUES(p_operation_id,p_operation_id,p_character_id,auth.uid(),'application','confirmed',
 jsonb_build_object('kind','resource','resource',p_resource,'mode',p_mode,'value',p_value,
 'before',jsonb_build_object('current',current_value,'max',maximum,'conditions',ficha.conditions),
 'after',jsonb_build_object('current',next_value,'max',maximum,'conditions',next_conditions)),fingerprint)
 RETURNING * INTO result; RETURN result;
END $$;
