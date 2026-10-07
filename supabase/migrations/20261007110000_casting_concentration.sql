-- Integra concentração ao débito existente; recibos antigos permanecem compatíveis.
ALTER FUNCTION public.cast_character_ritual(uuid,uuid,integer,integer,jsonb,uuid,text) RENAME TO cast_character_ritual_concentration_core;
REVOKE ALL ON FUNCTION public.cast_character_ritual_concentration_core(uuid,uuid,integer,integer,jsonb,uuid,text) FROM PUBLIC,anon,authenticated;
CREATE FUNCTION public.cast_character_ritual(p_operation_id uuid,p_character_id uuid,p_expected_pe integer,p_pe_cost integer,p_payload jsonb,
 p_campaign_id uuid DEFAULT NULL,p_campaign_version text DEFAULT NULL)
RETURNS public.character_activity_events LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE result public.character_activity_events; concentration jsonb; test jsonb; resolved jsonb:='[]';
 trigger text; seen text[]:='{}'; difficulty integer; attribute_value integer; penalty integer; dice_count integer;
 kept integer; bonus integer; total integer; passed boolean:=true; pool text;
BEGIN
 PERFORM public.validate_character_activity_context(p_character_id,p_campaign_id,p_campaign_version);
 IF p_payload ? 'castingOutcome' OR p_payload ? 'concentrationResolution' THEN
  RAISE EXCEPTION 'Resultado reservado ao servidor.' USING ERRCODE='22023'; END IF;
 -- Clientes antigos continuam funcionando sem concentração declarada.
 IF NOT (p_payload ? 'concentration') THEN
  RETURN public.cast_character_ritual_concentration_core(p_operation_id,p_character_id,p_expected_pe,p_pe_cost,p_payload,p_campaign_id,p_campaign_version);
 END IF;
 concentration:=p_payload->'concentration';
 IF p_pe_cost IS NULL OR p_pe_cost NOT BETWEEN 0 AND 1000000 OR jsonb_typeof(concentration)<>'object'
 OR concentration->>'source' IS DISTINCT FROM 'system_roll' OR jsonb_typeof(concentration->'tests') IS DISTINCT FROM 'array'
 OR jsonb_array_length(concentration->'tests')>2 THEN
  RAISE EXCEPTION 'Concentração inválida.' USING ERRCODE='22023'; END IF;
 FOR test IN SELECT value FROM jsonb_array_elements(concentration->'tests') LOOP
  trigger:=test->>'trigger';
  IF trigger IS NULL OR trigger NOT IN ('ruim','terrivel','dano') OR trigger=ANY(seen)
  OR (trigger IN ('ruim','terrivel') AND (seen && ARRAY['ruim','terrivel']))
  OR coalesce(test->>'attribute','') !~ '^-?[0-9]{1,3}$' OR coalesce(test->>'dicePenalty','') !~ '^[0-9]{1,3}$'
  OR coalesce(test->>'bonus','') !~ '^-?[0-9]{1,7}$' OR coalesce(test->>'total','') !~ '^-?[0-9]{1,8}$'
  OR jsonb_typeof(test->'dice') IS DISTINCT FROM 'array' OR jsonb_typeof(test->'bonuses') IS DISTINCT FROM 'array' THEN
   RAISE EXCEPTION 'Teste de Vontade inválido.' USING ERRCODE='22023'; END IF;
  seen:=array_append(seen,trigger); attribute_value:=(test->>'attribute')::integer; penalty:=(test->>'dicePenalty')::integer;
  IF abs(attribute_value)>100 OR penalty>100 OR jsonb_array_length(test->'bonuses')>32 THEN
   RAISE EXCEPTION 'Pool ou bônus fora do limite.' USING ERRCODE='22023'; END IF;
  dice_count:=CASE WHEN attribute_value<=0 THEN 2+abs(attribute_value)+penalty
   WHEN attribute_value-penalty>=1 THEN attribute_value-penalty ELSE attribute_value+penalty END;
  pool:=CASE WHEN attribute_value<=0 OR attribute_value-penalty<1 THEN 'lowest' ELSE 'highest' END;
  IF jsonb_array_length(test->'dice')<>dice_count OR EXISTS(SELECT 1 FROM jsonb_array_elements(test->'dice') d
   WHERE jsonb_typeof(d)<>'number' OR d::text !~ '^[0-9]{1,2}$' OR d::text::integer NOT BETWEEN 1 AND 20)
   OR EXISTS(SELECT 1 FROM jsonb_array_elements(test->'bonuses') b WHERE jsonb_typeof(b)<>'object'
    OR jsonb_typeof(b->'value') IS DISTINCT FROM 'number' OR coalesce(b->>'value','') !~ '^-?[0-9]{1,7}$'
    OR jsonb_typeof(b->'name') IS DISTINCT FROM 'string' OR length(b->>'name')>150) THEN
   RAISE EXCEPTION 'Dados ou bônus inválidos.' USING ERRCODE='22023'; END IF;
  SELECT CASE WHEN pool='highest' THEN max(d::text::integer) ELSE min(d::text::integer) END INTO kept
   FROM jsonb_array_elements(test->'dice') d;
  SELECT coalesce(sum((b->>'value')::integer),0) INTO bonus FROM jsonb_array_elements(test->'bonuses') b;
  total:=kept+bonus;
  IF bonus<>(test->>'bonus')::integer OR total<>(test->>'total')::integer THEN
   RAISE EXCEPTION 'Total divergente dos dados e bônus.' USING ERRCODE='22023'; END IF;
  IF trigger='dano' THEN
   IF coalesce(test->>'damage','') !~ '^[0-9]{1,7}$' OR (test->>'damage')::integer NOT BETWEEN 1 AND 1000000 THEN
    RAISE EXCEPTION 'Dano inválido.' USING ERRCODE='22023'; END IF;
   difficulty:=(test->>'damage')::integer;
  ELSE difficulty:=CASE WHEN trigger='ruim' THEN 15 ELSE 20 END+p_pe_cost; END IF;
  passed:=passed AND total>=difficulty;
  resolved:=resolved||jsonb_build_array(test||jsonb_build_object('kept',kept,'keep',pool,'dt',difficulty,'success',total>=difficulty));
 END LOOP;
 -- A função existente preserva CAS do saldo, campanha/cena e idempotência do payload original.
 result:=public.cast_character_ritual_concentration_core(p_operation_id,p_character_id,p_expected_pe,p_pe_cost,p_payload,p_campaign_id,p_campaign_version);
 IF result.payload ? 'concentrationResolution' THEN RETURN result; END IF;
 UPDATE public.character_activity_events SET payload=payload||jsonb_build_object(
  'concentration',jsonb_build_object('source','system_roll','tests',resolved,'success',passed),
  'concentrationResolution','server_checked','castingOutcome',CASE WHEN passed THEN 'passed_concentration' ELSE 'failed_concentration' END,
  'effectStatus',CASE WHEN passed THEN 'pending' ELSE 'blocked_concentration' END),
  status=CASE WHEN passed THEN status ELSE 'confirmed' END WHERE id=result.id RETURNING * INTO result;
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.cast_character_ritual(uuid,uuid,integer,integer,jsonb,uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.cast_character_ritual(uuid,uuid,integer,integer,jsonb,uuid,text) TO authenticated;

-- Bloqueio também no servidor: cliente antigo não aplica efeito de conjuração falhada.
ALTER FUNCTION public.apply_character_effect(uuid,uuid,text,jsonb,jsonb,uuid,uuid,text) RENAME TO apply_character_effect_concentration_core;
REVOKE ALL ON FUNCTION public.apply_character_effect_concentration_core(uuid,uuid,text,jsonb,jsonb,uuid,uuid,text) FROM PUBLIC,anon,authenticated;
CREATE FUNCTION public.apply_character_effect(p_operation_id uuid,p_character_id uuid,p_kind text,p_value jsonb,p_expected jsonb,
 p_cast_event_id uuid DEFAULT NULL,p_campaign_id uuid DEFAULT NULL,p_campaign_version text DEFAULT NULL)
RETURNS public.character_activity_events LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 PERFORM public.validate_character_activity_context(p_character_id,p_campaign_id,p_campaign_version);
 IF p_cast_event_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.character_activity_events
  WHERE id=p_cast_event_id AND category='ritual' AND public.can_manage_character_activity(character_id)) THEN
  RAISE EXCEPTION 'Conjuração não autorizada.' USING ERRCODE='42501'; END IF;
 IF EXISTS(SELECT 1 FROM public.character_activity_events WHERE id=p_cast_event_id AND payload->>'castingOutcome'='failed_concentration') THEN
  RAISE EXCEPTION 'Concentração falhou; efeitos bloqueados.' USING ERRCODE='55001'; END IF;
 RETURN public.apply_character_effect_concentration_core(p_operation_id,p_character_id,p_kind,p_value,p_expected,p_cast_event_id,p_campaign_id,p_campaign_version);
END $$;
REVOKE ALL ON FUNCTION public.apply_character_effect(uuid,uuid,text,jsonb,jsonb,uuid,uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.apply_character_effect(uuid,uuid,text,jsonb,jsonb,uuid,uuid,text) TO authenticated;
