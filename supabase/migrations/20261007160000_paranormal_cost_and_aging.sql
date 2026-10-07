-- Confirma Custo do Paranormal na mesma transação do débito de PE.
-- Valores de bônus situacionais são declarados; dados, DT, seleção e SAN são conferidos aqui.
CREATE TABLE public.character_paranormal_san_losses (
 character_id uuid PRIMARY KEY REFERENCES public.characters(id) ON DELETE CASCADE,
 loss integer NOT NULL CHECK(loss BETWEEN 0 AND 1000000),
 effective_max integer NOT NULL CHECK(effective_max BETWEEN 0 AND 1000000)
);
ALTER TABLE public.character_paranormal_san_losses ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.character_paranormal_san_losses FROM PUBLIC,anon,authenticated;
-- Edição/progressão envia o máximo de classe; a perda permanente não pode desaparecer ao recalculá-lo.
CREATE FUNCTION public.preserve_paranormal_san_loss() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE saved public.character_paranormal_san_losses;
BEGIN
 SELECT * INTO saved FROM public.character_paranormal_san_losses WHERE character_id=NEW.id;
 IF FOUND THEN
  IF NEW.san_max IS DISTINCT FROM saved.effective_max THEN
   NEW.san_max:=greatest(0,NEW.san_max-saved.loss);
   UPDATE public.character_paranormal_san_losses SET effective_max=NEW.san_max WHERE character_id=NEW.id;
  END IF;
  NEW.san_current:=least(NEW.san_current,NEW.san_max);
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.preserve_paranormal_san_loss() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER preserve_paranormal_san_loss BEFORE UPDATE OF san_max,san_current ON public.characters
FOR EACH ROW EXECUTE FUNCTION public.preserve_paranormal_san_loss();
CREATE FUNCTION public.resolve_activity_skill_test(p_test jsonb,p_dt integer)
RETURNS jsonb LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
DECLARE a integer; penalty integer; n integer; pool text; kept integer; bonus integer;
BEGIN
 IF jsonb_typeof(p_test) IS DISTINCT FROM 'object'
 OR NOT public.activity_json_integer(p_test->'attribute',-100,100)
 OR NOT public.activity_json_integer(p_test->'dicePenalty',0,100)
 OR jsonb_typeof(p_test->'dice') IS DISTINCT FROM 'array'
 OR jsonb_typeof(p_test->'bonuses') IS DISTINCT FROM 'array' THEN
  RAISE EXCEPTION 'Teste de perícia inválido.' USING ERRCODE='22023'; END IF;
 a:=(p_test->>'attribute')::integer; penalty:=(p_test->>'dicePenalty')::integer;
 n:=CASE WHEN a<=0 THEN 2+abs(a)+penalty WHEN a-penalty>=1 THEN a-penalty ELSE a+penalty END;
 pool:=CASE WHEN a<=0 OR a-penalty<1 THEN 'lowest' ELSE 'highest' END;
 IF jsonb_array_length(p_test->'dice')<>n OR jsonb_array_length(p_test->'bonuses')>32
 OR EXISTS(SELECT 1 FROM jsonb_array_elements(p_test->'dice') d WHERE NOT public.activity_json_integer(d,1,20))
 OR EXISTS(SELECT 1 FROM jsonb_array_elements(p_test->'bonuses') b
  WHERE jsonb_typeof(b) IS DISTINCT FROM 'object' OR jsonb_typeof(b->'name') IS DISTINCT FROM 'string'
  OR length(b->>'name')>150 OR NOT public.activity_json_integer(b->'value',-1000000,1000000)) THEN
  RAISE EXCEPTION 'Dados ou bônus inválidos.' USING ERRCODE='22023'; END IF;
 SELECT CASE WHEN pool='highest' THEN max(d::text::integer) ELSE min(d::text::integer) END INTO kept FROM jsonb_array_elements(p_test->'dice') d;
 SELECT coalesce(sum((b->>'value')::integer),0) INTO bonus FROM jsonb_array_elements(p_test->'bonuses') b;
 IF p_test->'bonus' IS DISTINCT FROM to_jsonb(bonus) OR p_test->'total' IS DISTINCT FROM to_jsonb(kept+bonus) THEN
  RAISE EXCEPTION 'Total divergente dos dados e bônus.' USING ERRCODE='22023'; END IF;
 RETURN p_test||jsonb_build_object('keep',pool,'kept',kept,'total',kept+bonus,'dt',p_dt,'success',kept+bonus>=p_dt);
END $$;
REVOKE ALL ON FUNCTION public.resolve_activity_skill_test(jsonb,integer) FROM PUBLIC,anon,authenticated;

ALTER FUNCTION public.cast_character_ritual(uuid,uuid,integer,integer,jsonb,uuid,text) RENAME TO cast_character_ritual_paranormal_core;
REVOKE ALL ON FUNCTION public.cast_character_ritual_paranormal_core(uuid,uuid,integer,integer,jsonb,uuid,text) FROM PUBLIC,anon,authenticated;
CREATE FUNCTION public.cast_character_ritual(p_operation_id uuid,p_character_id uuid,p_expected_pe integer,p_pe_cost integer,p_payload jsonb,
 p_campaign_id uuid DEFAULT NULL,p_campaign_version text DEFAULT NULL)
RETURNS public.character_activity_events LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE result public.character_activity_events; ficha public.characters; resolved jsonb; cost jsonb;
 loss integer:=0; permanent integer:=0; next_san integer; next_max integer; element text;
BEGIN
 PERFORM public.validate_character_activity_context(p_character_id,p_campaign_id,p_campaign_version);
 IF p_operation_id IS NULL THEN RAISE EXCEPTION 'ID obrigatório.' USING ERRCODE='22023'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_operation_id::text,0));
 -- Recuperação de recibos antigos mantém o hash original e não repete SAN.
 IF EXISTS(SELECT 1 FROM public.character_activity_events WHERE operation_id=p_operation_id) THEN
  RETURN public.cast_character_ritual_paranormal_core(p_operation_id,p_character_id,p_expected_pe,p_pe_cost,p_payload,p_campaign_id,p_campaign_version);
 END IF;
 cost:=p_payload->'paranormalCost'; element:=lower(p_payload->>'ritualElement');
 IF p_payload->'requirementsConfirmed' IS DISTINCT FROM 'true'::jsonb
 OR p_payload ? 'paranormalCostResolution' OR jsonb_typeof(cost) IS DISTINCT FROM 'object'
 OR cost->>'source' IS DISTINCT FROM 'system_roll' OR element IS NULL
 OR element NOT IN ('sangue','morte','conhecimento','energia','medo') OR cost->>'element' IS DISTINCT FROM element
 OR NOT public.activity_json_integer(p_payload->'expectedSan',0,1000000)
 OR NOT public.activity_json_integer(p_payload->'expectedSanMax',0,1000000) THEN
  RAISE EXCEPTION 'Atualize a aplicação para confirmar o custo do Paranormal antes da conjuração.' USING ERRCODE='22023'; END IF;
 -- A campanha precede a ficha nos bloqueios, como no encerramento de cena.
 IF p_campaign_version='v2' THEN
  INSERT INTO public.campaign_combat_state_v2(campaign_id) VALUES(p_campaign_id) ON CONFLICT DO NOTHING;
  PERFORM 1 FROM public.campaign_combat_state_v2 WHERE campaign_id=p_campaign_id FOR UPDATE;
 END IF;
 SELECT * INTO ficha FROM public.characters WHERE id=p_character_id FOR UPDATE;
 IF ficha.san_current IS DISTINCT FROM (p_payload->>'expectedSan')::integer
 OR ficha.san_max IS DISTINCT FROM (p_payload->>'expectedSanMax')::integer THEN
  RAISE EXCEPTION 'SAN alterada. Recarregue antes de conjurar.' USING ERRCODE='40001'; END IF;
 result:=public.cast_character_ritual_paranormal_core(p_operation_id,p_character_id,p_expected_pe,p_pe_cost,p_payload,p_campaign_id,p_campaign_version);
 IF result.payload->>'castingOutcome'='failed_concentration' THEN
  resolved:=jsonb_build_object('skipped','failed_concentration');
 ELSIF element='medo' THEN
  loss:=p_pe_cost;
  permanent:=CASE WHEN p_payload->'enhancements' @> '["Verdadeiro"]'::jsonb THEN 3
   WHEN p_payload->'enhancements' @> '["Discente"]'::jsonb THEN 2 ELSE 1 END;
  resolved:=jsonb_build_object('element','medo','automaticLoss',true);
 ELSE
  resolved:=public.resolve_activity_skill_test(cost->'test',20+p_pe_cost);
  IF NOT (resolved->>'success')::boolean THEN
   loss:=p_pe_cost;
   IF (resolved->>'total')::integer<=15+p_pe_cost THEN permanent:=1; END IF;
  END IF;
 END IF;
 next_max:=greatest(0,ficha.san_max-permanent);
 next_san:=least(next_max,greatest(0,ficha.san_current-loss));
 IF permanent>0 THEN
  INSERT INTO public.character_paranormal_san_losses(character_id,loss,effective_max) VALUES(p_character_id,permanent,next_max)
  ON CONFLICT(character_id) DO UPDATE SET loss=character_paranormal_san_losses.loss+permanent,effective_max=excluded.effective_max;
 END IF;
 UPDATE public.characters SET san_current=next_san,san_max=next_max,
  conditions=public.reconcile_resource_conditions(conditions,hp_current,hp_current,hp_max,ficha.san_current,next_san,next_max,0)
 WHERE id=p_character_id;
 UPDATE public.character_activity_events SET payload=payload||jsonb_build_object(
  'paranormalCost',resolved||jsonb_build_object('sanLoss',loss,'permanentSanLoss',permanent),
  'paranormalCostResolution','server_checked','sanBefore',ficha.san_current,'sanAfter',next_san,
  'sanMaxBefore',ficha.san_max,'sanMaxAfter',next_max) WHERE id=result.id RETURNING * INTO result;
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.cast_character_ritual(uuid,uuid,integer,integer,jsonb,uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.cast_character_ritual(uuid,uuid,integer,integer,jsonb,uuid,text) TO authenticated;

-- Cicatrização exige idade e salva cura + envelhecimento + recibo atomicamente.
ALTER FUNCTION public.apply_character_effect(uuid,uuid,text,jsonb,jsonb,uuid,uuid,text) RENAME TO apply_character_effect_aging_core;
REVOKE ALL ON FUNCTION public.apply_character_effect_aging_core(uuid,uuid,text,jsonb,jsonb,uuid,uuid,text) FROM PUBLIC,anon,authenticated;
CREATE FUNCTION public.apply_character_effect(p_operation_id uuid,p_character_id uuid,p_kind text,p_value jsonb,p_expected jsonb,
 p_cast_event_id uuid DEFAULT NULL,p_campaign_id uuid DEFAULT NULL,p_campaign_version text DEFAULT NULL)
RETURNS public.character_activity_events LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE result public.character_activity_events; old_age integer;
BEGIN
 PERFORM public.validate_character_activity_context(p_character_id,p_campaign_id,p_campaign_version);
 IF p_operation_id IS NULL THEN RAISE EXCEPTION 'ID obrigatório.' USING ERRCODE='22023'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_operation_id::text,0));
 IF NOT EXISTS(SELECT 1 FROM public.character_activity_events WHERE operation_id=p_operation_id)
 AND p_kind='heal' AND EXISTS(SELECT 1 FROM public.character_activity_events
  WHERE id=p_cast_event_id AND category='ritual' AND payload->>'ritualId'='cicatrizacao') THEN
  IF p_campaign_version='v2' THEN
   PERFORM 1 FROM public.campaign_combat_state_v2 WHERE campaign_id=p_campaign_id FOR UPDATE;
  END IF;
  SELECT age INTO old_age FROM public.characters WHERE id=p_character_id FOR UPDATE;
  IF old_age IS NULL THEN RAISE EXCEPTION 'Cadastre a idade do alvo antes de aplicar Cicatrização.' USING ERRCODE='22023'; END IF;
  IF old_age NOT BETWEEN 0 AND 1000000 OR p_expected->'age' IS DISTINCT FROM to_jsonb(old_age) THEN
   RAISE EXCEPTION 'Idade alterada. Recarregue o alvo.' USING ERRCODE='40001'; END IF;
 END IF;
 result:=public.apply_character_effect_aging_core(p_operation_id,p_character_id,p_kind,p_value,p_expected,p_cast_event_id,p_campaign_id,p_campaign_version);
 IF old_age IS NOT NULL THEN
  UPDATE public.characters SET age=old_age+1 WHERE id=p_character_id;
  UPDATE public.character_activity_events SET payload=jsonb_set(jsonb_set(payload,'{before,age}',to_jsonb(old_age)),
   '{after,age}',to_jsonb(old_age+1))||jsonb_build_object('agingYears',1) WHERE id=result.id RETURNING * INTO result;
 END IF;
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.apply_character_effect(uuid,uuid,text,jsonb,jsonb,uuid,uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.apply_character_effect(uuid,uuid,text,jsonb,jsonb,uuid,uuid,text) TO authenticated;
