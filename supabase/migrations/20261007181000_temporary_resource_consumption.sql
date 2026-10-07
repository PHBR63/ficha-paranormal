-- Integra reservatórios às operações existentes sem alterar hashes ou snapshots normais.
-- Consume temporários antes dos recursos normais; o recibo conserva o custo total.
CREATE OR REPLACE FUNCTION public.cast_character_ritual_scene_core(p_operation_id uuid,p_character_id uuid,p_expected_pe integer,p_pe_cost integer,p_payload jsonb,
 p_campaign_id uuid DEFAULT NULL,p_campaign_version text DEFAULT NULL)
RETURNS public.character_activity_events LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE result public.character_activity_events; fingerprint text; current_pe integer; temp_used integer; temp_before integer;
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
 SELECT coalesce(sum(remaining),0) INTO temp_before FROM public.character_temporary_resources WHERE character_id=p_character_id AND resource='pe';
 IF current_pe+temp_before<p_pe_cost THEN RAISE EXCEPTION 'PE insuficiente.' USING ERRCODE='22023'; END IF;
 temp_used:=public.consume_temporary_resource(p_character_id,'pe',p_pe_cost);
 UPDATE public.characters SET pe_current=current_pe-p_pe_cost+temp_used WHERE id=p_character_id;
 INSERT INTO public.character_activity_events(id,operation_id,character_id,author_id,category,status,payload,request_hash,campaign_id,campaign_version)
 VALUES(p_operation_id,p_operation_id,p_character_id,auth.uid(),'ritual','pending',
   p_payload||jsonb_build_object('peBefore',current_pe,'peAfter',current_pe-p_pe_cost+temp_used,'temporaryPEUsed',temp_used,'temporaryPEBefore',temp_before,'temporaryPEAfter',temp_before-temp_used,'peCost',p_pe_cost,'effectStatus','pending'),
   fingerprint,p_campaign_id,p_campaign_version) RETURNING * INTO result;
 RETURN result;
END $$;

CREATE OR REPLACE FUNCTION public.confirm_sustained_ritual_action_turn_core(
 p_operation_id uuid,p_character_id uuid,p_action text,p_expected jsonb,p_expected_pe integer
) RETURNS public.character_activity_events LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE result public.character_activity_events; ficha public.characters; fingerprint text; target_operation uuid;
 temp_used integer:=0; temp_before integer:=0; ids uuid[]; actual jsonb; before_rows jsonb; after_rows jsonb; total integer; allowance integer:=1; kept_conditions jsonb; kept_buffs jsonb; target public.characters; targets jsonb:='[]'::jsonb;
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
  SELECT coalesce(sum(remaining),0) INTO temp_before FROM public.character_temporary_resources WHERE character_id=p_character_id AND resource='pe';
  IF ficha.pe_current+temp_before<total THEN RAISE EXCEPTION 'PE insuficiente. Nenhuma cobrança.' USING ERRCODE='22023'; END IF;
  temp_used:=public.consume_temporary_resource(p_character_id,'pe',total);
  UPDATE public.characters SET pe_current=pe_current-total+temp_used WHERE id=p_character_id;
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
   'targets',targets,'peCost',total,'peBefore',ficha.pe_current,'peAfter',ficha.pe_current-total+temp_used,'temporaryPEUsed',temp_used,'temporaryPEBefore',temp_before,'temporaryPEAfter',temp_before-temp_used,
   'before',jsonb_build_object('sustained_rituals',before_rows,'conditions',ficha.conditions,'active_buffs',ficha.active_buffs),
   'after',jsonb_build_object('sustained_rituals',after_rows,'conditions',(SELECT conditions FROM public.characters WHERE id=p_character_id),
    'active_buffs',(SELECT active_buffs FROM public.characters WHERE id=p_character_id))),fingerprint)
 RETURNING * INTO result;
 RETURN result;
END $$;

CREATE OR REPLACE FUNCTION public.apply_character_effect_core(p_operation_id uuid,p_character_id uuid,p_kind text,p_value jsonb,p_expected jsonb,
 p_cast_event_id uuid DEFAULT NULL,p_campaign_id uuid DEFAULT NULL,p_campaign_version text DEFAULT NULL)
RETURNS public.character_activity_events LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE result public.character_activity_events; ficha public.characters; cast_event public.character_activity_events;
 fingerprint text; before_state jsonb; after_state jsonb; amount integer; next_conditions jsonb; next_hp integer; temp_used integer:=0;
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
   IF p_kind='damage' THEN temp_used:=public.consume_temporary_resource(p_character_id,'hp',amount,p_expected->>'damageType'); END IF;
   next_hp:=CASE WHEN p_kind='heal' THEN least(ficha.hp_max,ficha.hp_current+amount) ELSE greatest(0,ficha.hp_current-amount+temp_used) END;
   -- A linha já está bloqueada: preserva as condições atuais do alvo e grava
   -- PV/condições/recibo juntos. O retry acima retorna o recibo sem recalcular.
   next_conditions:=public.reconcile_resource_conditions(ficha.conditions,ficha.hp_current,next_hp,ficha.hp_max,
     ficha.san_current,ficha.san_current,ficha.san_max,CASE WHEN p_kind='damage' THEN amount-temp_used ELSE 0 END);
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
   jsonb_build_object('kind',p_kind,'value',p_value,'before',before_state,'after',after_state,'castEventId',p_cast_event_id,'temporaryHPUsed',temp_used),
   fingerprint,p_campaign_id,p_campaign_version) RETURNING * INTO result;
 RETURN result;
END $$;

-- Variações negativas também consomem temporários; edição absoluta preserva o reservatório.
CREATE OR REPLACE FUNCTION public.change_character_resource(p_operation_id uuid,p_character_id uuid,p_resource text,p_mode text,
 p_value integer,p_expected_current integer,p_expected_max integer)
RETURNS public.character_activity_events LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE result public.character_activity_events; ficha public.characters; current_value integer; maximum integer; next_value integer; fingerprint text; next_conditions jsonb; temp_used integer:=0;
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
 IF p_mode='delta' AND p_value<0 AND p_resource IN ('hp','pe') THEN
  temp_used:=public.consume_temporary_resource(p_character_id,p_resource,-p_value);
 END IF;
 next_value:=greatest(0,least(maximum,CASE WHEN p_mode='delta' THEN current_value+p_value+temp_used ELSE p_value END));
 -- PE sozinho não representa dano/cura nem recria condições estabilizadas.
 next_conditions:=public.reconcile_resource_conditions(ficha.conditions,ficha.hp_current,
   CASE WHEN p_resource='hp' THEN next_value ELSE ficha.hp_current END,ficha.hp_max,
   ficha.san_current,CASE WHEN p_resource='san' THEN next_value ELSE ficha.san_current END,ficha.san_max,
   CASE WHEN p_resource='hp' AND p_mode='delta' AND p_value<0 THEN -p_value-temp_used ELSE 0 END);
 UPDATE public.characters SET conditions=next_conditions,hp_current=CASE WHEN p_resource='hp' THEN next_value ELSE hp_current END,
 pe_current=CASE WHEN p_resource='pe' THEN next_value ELSE pe_current END,
 san_current=CASE WHEN p_resource='san' THEN next_value ELSE san_current END WHERE id=p_character_id;
 INSERT INTO public.character_activity_events(id,operation_id,character_id,author_id,category,status,payload,request_hash)
 VALUES(p_operation_id,p_operation_id,p_character_id,auth.uid(),'application','confirmed',
 jsonb_build_object('kind','resource','resource',p_resource,'mode',p_mode,'value',p_value,'temporaryUsed',temp_used,
 'before',jsonb_build_object('current',current_value,'max',maximum,'conditions',ficha.conditions),
 'after',jsonb_build_object('current',next_value,'max',maximum,'conditions',next_conditions)),fingerprint)
 RETURNING * INTO result; RETURN result;
END $$;

-- Dano de condições usa PV temporário; Sangrando permanece perda de PV que o ignora.
CREATE OR REPLACE FUNCTION public.resolve_character_condition_turn(
 p_operation_id uuid,p_character_id uuid,p_values jsonb,p_expected jsonb,p_conditions jsonb,p_resolution jsonb
) RETURNS public.character_activity_events LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE result public.character_activity_events; amount integer; item jsonb; saved_vigor integer; temp_used integer:=0; damage_amount integer; raw_hash text;
BEGIN
 IF NOT public.can_manage_character_activity(p_character_id) THEN RAISE EXCEPTION 'Sem permissão.' USING ERRCODE='42501'; END IF;
 IF p_operation_id IS NULL THEN RAISE EXCEPTION 'ID obrigatório.' USING ERRCODE='22023'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_operation_id::text,0));
 raw_hash:=md5(jsonb_build_array(p_character_id,p_values,p_expected,p_conditions,p_resolution)::text);
 SELECT * INTO result FROM public.character_activity_events WHERE operation_id=p_operation_id;
 IF FOUND AND result.payload ? 'originalTurnHash' THEN
  IF result.author_id<>auth.uid() OR result.payload->>'originalTurnHash'<>raw_hash THEN RAISE EXCEPTION 'Operação reutilizada.' USING ERRCODE='23505'; END IF;
  RETURN result;
 END IF;
 IF p_resolution IS NULL OR jsonb_typeof(p_resolution)<>'object' OR octet_length(p_resolution::text)>30000
 OR p_resolution->>'profile' IS DISTINCT FROM 'base-v1.3-mesa' OR p_resolution->>'revision' IS DISTINCT FROM '1'
 OR jsonb_typeof(p_resolution->'effects') IS DISTINCT FROM 'array' OR jsonb_array_length(p_resolution->'effects')>100
 OR jsonb_typeof(p_resolution->'bleedingTests') IS DISTINCT FROM 'array'
 OR jsonb_typeof(p_resolution->'removeIndexes') IS DISTINCT FROM 'array'
 OR jsonb_typeof(p_resolution->'notices') IS DISTINCT FROM 'array'
 OR NOT public.activity_json_integer(p_expected->'hp_current',0,1000000)
 OR NOT public.activity_json_integer(p_values->'hp',0,1000000)
 OR p_values->'pe' IS DISTINCT FROM p_expected->'pe_current' OR p_values->'san' IS DISTINCT FROM p_expected->'san_current' THEN
   RAISE EXCEPTION 'Resolução ou recursos inválidos.' USING ERRCODE='22023'; END IF;
 amount:=0;
 FOR item IN SELECT * FROM jsonb_array_elements(p_resolution->'effects') LOOP
   IF item->>'conditionId' NOT IN ('sangrando','em-chamas','em_chamas','envenenado') OR item->>'conditionId' IS NULL
   OR NOT public.activity_json_integer(item->'rolled',0,1000000) OR NOT public.activity_json_integer(item->'finalAmount',0,1000000)
   OR (item->>'finalAmount')::integer>(item->>'rolled')::integer
   OR (item->>'conditionId'='sangrando' AND (item->'finalAmount' IS DISTINCT FROM item->'rolled' OR item->'ignoresResistance' IS DISTINCT FROM 'true'::jsonb)) THEN
     RAISE EXCEPTION 'Dano final inválido.' USING ERRCODE='22023'; END IF;
   amount:=amount+(item->>'finalAmount')::integer;
 END LOOP;
 IF (p_values->>'hp')::integer<>greatest(0,(p_expected->>'hp_current')::integer-amount) THEN
   RAISE EXCEPTION 'PV não corresponde aos efeitos confirmados.' USING ERRCODE='22023'; END IF;
 IF NOT public.activity_json_integer(p_expected->'vigor',-100,100) THEN
   RAISE EXCEPTION 'Snapshot de Vigor inválido.' USING ERRCODE='22023'; END IF;
 -- Mesmo lock do bundle: alteração de atributo durante a prévia invalida os dados do teste.
 SELECT vigor INTO saved_vigor FROM public.characters WHERE id=p_character_id FOR UPDATE;
 IF saved_vigor IS DISTINCT FROM (p_expected->>'vigor')::integer AND NOT EXISTS (
   SELECT 1 FROM public.character_activity_events WHERE id=p_operation_id AND character_id=p_character_id AND author_id=auth.uid()
 ) THEN
   RAISE EXCEPTION 'Vigor mudou. Reabra a ficha e prepare o turno novamente.' USING ERRCODE='40001'; END IF;
 -- Inclui a resolução na impressão do pedido: mudar dados num retry é rejeitado.
 -- O servidor confirma resultados informados pelo jogador, sem alegar sorteio próprio.
 SELECT coalesce(sum((e->>'finalAmount')::integer),0) INTO damage_amount FROM jsonb_array_elements(p_resolution->'effects') e WHERE e->>'conditionId'<>'sangrando';
 IF NOT EXISTS(SELECT 1 FROM public.character_activity_events WHERE operation_id=p_operation_id) THEN
  temp_used:=public.consume_temporary_resource(p_character_id,'hp',damage_amount);
  p_values:=jsonb_set(p_values,'{hp}',to_jsonb(greatest(0,(p_expected->>'hp_current')::integer-amount+temp_used)));
 END IF;
 result:=public.change_character_resources(p_operation_id,p_character_id,p_values,
   p_expected||jsonb_build_object('condition_turn_resolution',p_resolution),p_conditions);
 UPDATE public.character_activity_events SET payload=payload||jsonb_build_object('kind','condition_turn','resolution',p_resolution,'temporaryHPUsed',temp_used,'originalTurnHash',raw_hash)
 WHERE id=result.id RETURNING * INTO result;
 RETURN result;
END $$;
