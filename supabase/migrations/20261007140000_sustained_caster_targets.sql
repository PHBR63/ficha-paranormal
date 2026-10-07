-- Liga a manutenção ao conjurador, preservando os efeitos e recibos no alvo.
-- Não muda tabelas, não atribui origem a legados e não altera registros existentes.
CREATE OR REPLACE FUNCTION public.list_character_sustained_rituals(p_character_id uuid)
RETURNS SETOF jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF NOT public.can_manage_character_activity(p_character_id) THEN
  RAISE EXCEPTION 'Ficha não autorizada.' USING ERRCODE='42501';
 END IF;
 RETURN QUERY SELECT to_jsonb(r)||jsonb_build_object('caster_character_id',o.caster_character_id)
 FROM public.character_sustained_rituals r JOIN public.characters c ON c.id=r.character_id AND c.user_id=r.user_id
 LEFT JOIN public.sustained_ritual_origins o ON o.sustained_id=r.id
 WHERE r.character_id=p_character_id OR o.caster_character_id=p_character_id ORDER BY r.id;
END $$;
REVOKE ALL ON FUNCTION public.list_character_sustained_rituals(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.list_character_sustained_rituals(uuid) TO authenticated;


CREATE OR REPLACE FUNCTION public.confirm_sustained_ritual_action(
 p_operation_id uuid,p_character_id uuid,p_action text,p_expected jsonb,p_expected_pe integer
) RETURNS public.character_activity_events LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE result public.character_activity_events; ficha public.characters; fingerprint text; target_operation uuid;
 ids uuid[]; actual jsonb; before_rows jsonb; after_rows jsonb; total integer; allowance integer:=1; kept_conditions jsonb; kept_buffs jsonb; target public.characters; targets jsonb:='[]'::jsonb;
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
 IF EXISTS(SELECT 1 FROM public.character_sustained_rituals r
  JOIN public.sustained_ritual_origins o ON o.sustained_id=r.id
  WHERE r.id=ANY(ids) AND o.caster_character_id=p_character_id
  AND NOT public.can_manage_character_activity(r.character_id)) THEN
  RAISE EXCEPTION 'Alvo não autorizado.' USING ERRCODE='42501'; END IF;
 -- Mesmo bloqueio da aplicação: ficha antes dos registros sustentados.
 -- Bloqueia conjurador e alvos em ordem estável antes das sustentações.
 PERFORM 1 FROM public.characters c WHERE c.id=p_character_id OR c.id IN
 (SELECT r.character_id FROM public.character_sustained_rituals r JOIN public.sustained_ritual_origins o ON o.sustained_id=r.id WHERE o.caster_character_id=p_character_id AND r.id=ANY(ids))
 ORDER BY c.id FOR UPDATE;
 SELECT * INTO ficha FROM public.characters WHERE id=p_character_id;
 PERFORM 1 FROM public.character_sustained_rituals r LEFT JOIN public.sustained_ritual_origins o ON o.sustained_id=r.id
 WHERE r.character_id=p_character_id OR o.caster_character_id=p_character_id ORDER BY r.id FOR UPDATE OF r;
 SELECT coalesce(jsonb_agg(jsonb_build_object('id',r.id,'ritual_id',r.ritual_id,
  'turns_active',r.turns_active,'pe_spent_total',r.pe_spent_total,'sustain_config',r.sustain_config,
  'is_concentrating',r.is_concentrating) ORDER BY r.id),'[]'::jsonb),jsonb_agg(to_jsonb(r) ORDER BY r.id)
 INTO actual,before_rows FROM public.character_sustained_rituals r
 LEFT JOIN public.sustained_ritual_origins o ON o.sustained_id=r.id
 WHERE (r.character_id=p_character_id OR o.caster_character_id=p_character_id) AND r.id=ANY(ids);
 IF actual IS DISTINCT FROM p_expected OR (p_action='end_all' AND
  (SELECT count(*) FROM public.character_sustained_rituals r LEFT JOIN public.sustained_ritual_origins o ON o.sustained_id=r.id WHERE r.character_id=p_character_id OR o.caster_character_id=p_character_id)<>cardinality(ids)) THEN
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
  -- Encerra somente efeitos comprovadamente vinculados, em cada alvo atingido.
  FOR target IN SELECT c.* FROM public.characters c WHERE c.id IN
   (SELECT r.character_id FROM public.character_sustained_rituals r WHERE r.id=ANY(ids)) ORDER BY c.id LOOP
   IF target.conditions IS NOT NULL AND jsonb_typeof(target.conditions)<>'array'
    OR target.active_buffs IS NOT NULL AND jsonb_typeof(target.active_buffs)<>'array' THEN
    RAISE EXCEPTION 'Efeitos antigos exigem revisão.' USING ERRCODE='0A000'; END IF;
   SELECT coalesce(jsonb_agg(item ORDER BY ordinal),'[]'::jsonb) INTO kept_conditions
    FROM jsonb_array_elements(coalesce(target.conditions,'[]'::jsonb)) WITH ORDINALITY x(item,ordinal)
    WHERE NOT coalesce(public.effect_belongs_to_sustained(item,'conditions',target.id,ids),false);
   SELECT coalesce(jsonb_agg(item ORDER BY ordinal),'[]'::jsonb) INTO kept_buffs
    FROM jsonb_array_elements(coalesce(target.active_buffs,'[]'::jsonb)) WITH ORDINALITY x(item,ordinal)
    WHERE NOT coalesce(public.effect_belongs_to_sustained(item,'active_buffs',target.id,ids),false);
   UPDATE public.characters SET conditions=CASE WHEN target.conditions IS NULL THEN NULL ELSE kept_conditions END,
    active_buffs=CASE WHEN target.active_buffs IS NULL THEN NULL ELSE kept_buffs END WHERE id=target.id;
   targets:=targets||jsonb_build_array(jsonb_build_object('characterId',target.id,
    'before',jsonb_build_object('conditions',target.conditions,'active_buffs',target.active_buffs),
    'after',jsonb_build_object('conditions',kept_conditions,'active_buffs',kept_buffs)));
   -- Cada alvo recebe seu próprio recibo; o retry externo não repete esta inserção.
   IF target.id<>p_character_id THEN
    target_operation:=gen_random_uuid();
    INSERT INTO public.character_activity_events(id,operation_id,character_id,author_id,category,status,payload,request_hash)
    VALUES(target_operation,target_operation,target.id,auth.uid(),'application','confirmed',
     jsonb_build_object('kind','sustain_end','sourceOperationId',p_operation_id,
      'peCost',0,'peBefore',target.pe_current,'peAfter',target.pe_current,
      'before',jsonb_build_object('sustained_rituals',(SELECT jsonb_agg(entry) FROM jsonb_array_elements(before_rows) entry WHERE entry->>'character_id'=target.id::text),
       'conditions',target.conditions,'active_buffs',target.active_buffs),
      'after',jsonb_build_object('sustained_rituals','[]'::jsonb,'conditions',kept_conditions,'active_buffs',kept_buffs)),
     md5(jsonb_build_array(p_operation_id,target.id)::text));
   END IF;
  END LOOP;
  DELETE FROM public.character_sustained_rituals WHERE id=ANY(ids);
  after_rows:='[]'::jsonb;
 END IF;
 INSERT INTO public.character_activity_events(id,operation_id,character_id,author_id,category,status,payload,request_hash)
 VALUES(p_operation_id,p_operation_id,p_character_id,auth.uid(),'application','confirmed',
  jsonb_build_object('kind',CASE WHEN p_action='maintain' THEN 'sustain_maintenance' ELSE 'sustain_end' END,
   'targets',targets,'peCost',total,'peBefore',ficha.pe_current,'peAfter',ficha.pe_current-total,
   'before',jsonb_build_object('sustained_rituals',before_rows,'conditions',ficha.conditions,'active_buffs',ficha.active_buffs),
   'after',jsonb_build_object('sustained_rituals',after_rows,'conditions',(SELECT conditions FROM public.characters WHERE id=p_character_id),
    'active_buffs',(SELECT active_buffs FROM public.characters WHERE id=p_character_id))),fingerprint)
 RETURNING * INTO result;
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.confirm_sustained_ritual_action(uuid,uuid,text,jsonb,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.confirm_sustained_ritual_action(uuid,uuid,text,jsonb,integer) TO authenticated;


-- Acrescenta motivo informado ao encerramento sem alterar os recibos antigos.
-- A RPC anterior permanece compatível com clientes ainda abertos; a interface
-- atual usa esta confirmação, sem inferir morte, alcance ou eventos de narrativa.
CREATE OR REPLACE FUNCTION public.confirm_sustained_ritual_end(
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

 IF p_reason->>'kind'='voluntario' AND EXISTS(
  SELECT 1 FROM jsonb_array_elements(p_expected) e
  LEFT JOIN public.sustained_ritual_origins o ON o.sustained_id=(e->>'id')::uuid
  WHERE o.caster_character_id IS DISTINCT FROM p_character_id
 ) THEN
  RAISE EXCEPTION 'Conjurador requer conferência manual.' USING ERRCODE='0A000'; END IF;
 result:=public.confirm_sustained_ritual_action(p_operation_id,p_character_id,p_action,p_expected,NULL);
 UPDATE public.character_activity_events SET payload=payload||jsonb_build_object('endReason',p_reason,'reasonSource','user_confirmed'),
  request_hash=fingerprint WHERE id=result.id RETURNING * INTO result;
 UPDATE public.character_activity_events SET payload=payload||jsonb_build_object('endReason',p_reason,'reasonSource','user_confirmed')
 WHERE category='application' AND author_id=auth.uid() AND payload->>'sourceOperationId'=p_operation_id::text;
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.confirm_sustained_ritual_end(uuid,uuid,text,jsonb,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.confirm_sustained_ritual_end(uuid,uuid,text,jsonb,jsonb) TO authenticated;


