-- Dano confirmado em combate deve gravar PV e condições derivadas na mesma
-- transação. Os recibos existentes são alterados apenas na primeira inserção;
-- um reenvio da operação devolve o resultado salvo, sem aplicar dano outra vez.
CREATE FUNCTION public.reconcile_campaign_attack_damage_conditions()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE ficha public.characters; before_conditions jsonb; after_conditions jsonb;
 target_id uuid; hp_before integer; hp_after integer;
BEGIN
 target_id:=(NEW.result->>'targetId')::uuid;
 hp_before:=(NEW.result->>'hpBefore')::integer;
 hp_after:=(NEW.result->>'hpAfter')::integer;
 SELECT * INTO ficha FROM public.characters WHERE id=target_id FOR UPDATE;
 IF NOT FOUND OR ficha.hp_current<>hp_after THEN
  RAISE EXCEPTION 'Ficha alvo mudou durante a resolução do ataque.' USING ERRCODE='40001'; END IF;
 before_conditions:=coalesce(ficha.conditions,'[]'::jsonb);
 after_conditions:=public.reconcile_resource_conditions(before_conditions,
  hp_before,hp_after,ficha.hp_max,ficha.san_current,ficha.san_current,
  ficha.san_max,greatest(0,hp_before-hp_after));
 IF after_conditions IS DISTINCT FROM ficha.conditions THEN
  UPDATE public.characters SET conditions=after_conditions WHERE id=target_id;
 END IF;
 NEW.result:=NEW.result||jsonb_build_object(
  'conditionsBefore',before_conditions,'conditionsAfter',after_conditions);
 UPDATE public.character_activity_events SET payload=payload||jsonb_build_object(
  'conditionsBefore',before_conditions,'conditionsAfter',after_conditions)
 WHERE id IN ((NEW.result->>'targetEventId')::uuid,(NEW.result->>'attackerEventId')::uuid);
 RETURN NEW;
END $$;
CREATE TRIGGER reconcile_campaign_attack_damage_conditions
 BEFORE INSERT ON public.campaign_attack_target_resolutions_v2
 FOR EACH ROW EXECUTE FUNCTION public.reconcile_campaign_attack_damage_conditions();
REVOKE ALL ON FUNCTION public.reconcile_campaign_attack_damage_conditions() FROM PUBLIC,anon,authenticated;

-- O lote pode atingir até trinta fichas; cada uma é reconciliada antes de
-- persistir o recibo único do lote. Nenhuma condição desconhecida é descartada.
CREATE FUNCTION public.reconcile_campaign_bulk_damage_conditions()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE target_receipt jsonb; updated_targets jsonb:='[]'::jsonb;
 ficha public.characters; before_conditions jsonb; after_conditions jsonb;
 target_id uuid; hp_before integer; hp_after integer;
BEGIN
 FOR target_receipt IN SELECT value FROM jsonb_array_elements(NEW.result->'targets') LOOP
  target_id:=(target_receipt->>'characterId')::uuid;
  hp_before:=(target_receipt->>'hpBefore')::integer;
  hp_after:=(target_receipt->>'hpAfter')::integer;
  SELECT * INTO ficha FROM public.characters WHERE id=target_id FOR UPDATE;
  IF NOT FOUND OR ficha.hp_current<>hp_after THEN
   RAISE EXCEPTION 'Ficha alvo mudou durante o dano em área.' USING ERRCODE='40001'; END IF;
  before_conditions:=coalesce(ficha.conditions,'[]'::jsonb);
  after_conditions:=public.reconcile_resource_conditions(before_conditions,
   hp_before,hp_after,ficha.hp_max,ficha.san_current,ficha.san_current,
   ficha.san_max,greatest(0,hp_before-hp_after));
  IF after_conditions IS DISTINCT FROM ficha.conditions THEN
   UPDATE public.characters SET conditions=after_conditions WHERE id=target_id;
  END IF;
  UPDATE public.character_activity_events SET payload=payload||jsonb_build_object(
   'conditionsBefore',before_conditions,'conditionsAfter',after_conditions)
  WHERE id=(target_receipt->>'eventId')::uuid;
  updated_targets:=updated_targets||jsonb_build_array(target_receipt||jsonb_build_object(
   'conditionsBefore',before_conditions,'conditionsAfter',after_conditions));
 END LOOP;
 NEW.result:=jsonb_set(NEW.result,'{targets}',updated_targets);
 RETURN NEW;
END $$;
CREATE TRIGGER reconcile_campaign_bulk_damage_conditions
 BEFORE INSERT ON public.campaign_bulk_damage_operations
 FOR EACH ROW EXECUTE FUNCTION public.reconcile_campaign_bulk_damage_conditions();
REVOKE ALL ON FUNCTION public.reconcile_campaign_bulk_damage_conditions() FROM PUBLIC,anon,authenticated;

-- As funções originais montavam o retorno antes da inserção. Ler o recibo salvo
-- evita que a primeira resposta divirja do reenvio após os triggers acima.
ALTER FUNCTION public.confirm_campaign_bulk_damage(uuid,uuid,text,jsonb)
 RENAME TO confirm_campaign_bulk_damage_pre_conditions_core;
REVOKE ALL ON FUNCTION public.confirm_campaign_bulk_damage_pre_conditions_core(uuid,uuid,text,jsonb)
 FROM PUBLIC,anon,authenticated;
CREATE FUNCTION public.confirm_campaign_bulk_damage(
 p_operation_id uuid,p_campaign_id uuid,p_source text,p_targets jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE result jsonb;
BEGIN
 PERFORM public.confirm_campaign_bulk_damage_pre_conditions_core(
  p_operation_id,p_campaign_id,p_source,p_targets);
 SELECT operation.result INTO result FROM public.campaign_bulk_damage_operations operation
  WHERE operation.operation_id=p_operation_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'Recibo de dano em área ausente.' USING ERRCODE='40001'; END IF;
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.confirm_campaign_bulk_damage(uuid,uuid,text,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.confirm_campaign_bulk_damage(uuid,uuid,text,jsonb) TO authenticated;

-- A função pública de ataque da migration anterior continua exigindo intenção
-- prévia. Somente seu núcleo privado passa a devolver o recibo já reconciliado.
ALTER FUNCTION public.confirm_campaign_attack_target_pre_intent_core(uuid,uuid,uuid,uuid,integer,integer,integer,jsonb)
 RENAME TO confirm_campaign_attack_target_pre_conditions_core;
REVOKE ALL ON FUNCTION public.confirm_campaign_attack_target_pre_conditions_core(uuid,uuid,uuid,uuid,integer,integer,integer,jsonb)
 FROM PUBLIC,anon,authenticated;
CREATE FUNCTION public.confirm_campaign_attack_target_pre_intent_core(
 p_operation_id uuid,p_campaign_id uuid,p_attack_event_id uuid,p_target_character_id uuid,
 p_expected_hp integer,p_expected_scene integer,p_expected_round integer,p_resolution jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE result jsonb;
BEGIN
 PERFORM public.confirm_campaign_attack_target_pre_conditions_core(
  p_operation_id,p_campaign_id,p_attack_event_id,p_target_character_id,
  p_expected_hp,p_expected_scene,p_expected_round,p_resolution);
 SELECT operation.result INTO result FROM public.campaign_attack_target_resolutions_v2 operation
  WHERE operation.operation_id=p_operation_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'Recibo do ataque ausente.' USING ERRCODE='40001'; END IF;
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.confirm_campaign_attack_target_pre_intent_core(uuid,uuid,uuid,uuid,integer,integer,integer,jsonb)
 FROM PUBLIC,anon,authenticated;
