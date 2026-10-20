-- Livro Base v1.3, pp. 31 e 310-312: uma ficha incapaz de agir não pode
-- declarar as ações de Médico de Campo. O recibo de uma operação já confirmada
-- continua recuperável mesmo se a condição da ficha mudou depois.
CREATE FUNCTION public.require_character_medical_action(p_character_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE source public.characters;
BEGIN
 IF NOT public.can_manage_character_activity(p_character_id) THEN
  RAISE EXCEPTION 'Ficha não autorizada.' USING ERRCODE='42501'; END IF;
 SELECT * INTO source FROM public.characters WHERE id=p_character_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'Ficha não encontrada.' USING ERRCODE='22023'; END IF;
 IF source.hp_current<=0 OR EXISTS (
  SELECT 1 FROM jsonb_array_elements(coalesce(source.conditions,'[]'::jsonb)) condition
  WHERE public.creation_identifier(coalesce(condition->>'id',condition#>>'{}')) IN
   ('inconsciente','morrendo','paralisado','atordoado','pasmo')
 ) OR EXISTS (
  SELECT 1 FROM public.character_active_conditions active_condition
  WHERE active_condition.character_id=p_character_id
   AND public.creation_identifier(active_condition.condition_id) IN
    ('inconsciente','morrendo','paralisado','atordoado','pasmo')
 ) THEN
  RAISE EXCEPTION 'O personagem está incapaz de agir; resolva a condição antes de usar esta habilidade.'
   USING ERRCODE='55004';
 END IF;
END $$;
REVOKE ALL ON FUNCTION public.require_character_medical_action(uuid) FROM PUBLIC,anon,authenticated;

-- A interface consulta o mesmo requisito usado na confirmação; falha de
-- conexão não é interpretada como permissão para gastar PE.
CREATE FUNCTION public.get_character_medical_capability(p_character_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 PERFORM public.require_character_medical_action(p_character_id);
 RETURN jsonb_build_object('canAct',true);
EXCEPTION WHEN SQLSTATE '55004' THEN
 RETURN jsonb_build_object('canAct',false,
  'reason','O personagem está incapaz de agir. Resolva a condição antes de usar a habilidade.');
END $$;
REVOKE ALL ON FUNCTION public.get_character_medical_capability(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_character_medical_capability(uuid) TO authenticated;

-- O núcleo conserva toda a validação, a cobrança e a proteção contra reenvio.
-- Só operações novas passam pela checagem adicional de incapacidade.
ALTER FUNCTION public.confirm_character_paramedico(uuid,uuid,jsonb)
 RENAME TO confirm_character_paramedico_incapacity_core;
REVOKE ALL ON FUNCTION public.confirm_character_paramedico_incapacity_core(uuid,uuid,jsonb)
 FROM PUBLIC,anon,authenticated;
CREATE FUNCTION public.confirm_character_paramedico(p_operation_id uuid,p_character_id uuid,p_request jsonb)
RETURNS public.character_activity_events LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.character_activity_events WHERE operation_id=p_operation_id) THEN
  PERFORM public.require_character_medical_action(p_character_id); END IF;
 RETURN public.confirm_character_paramedico_incapacity_core(p_operation_id,p_character_id,p_request);
END $$;
REVOKE ALL ON FUNCTION public.confirm_character_paramedico(uuid,uuid,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.confirm_character_paramedico(uuid,uuid,jsonb) TO authenticated;

ALTER FUNCTION public.confirm_character_equipe_trauma(uuid,uuid,jsonb)
 RENAME TO confirm_character_equipe_trauma_incapacity_core;
REVOKE ALL ON FUNCTION public.confirm_character_equipe_trauma_incapacity_core(uuid,uuid,jsonb)
 FROM PUBLIC,anon,authenticated;
CREATE FUNCTION public.confirm_character_equipe_trauma(p_operation_id uuid,p_character_id uuid,p_request jsonb)
RETURNS public.character_activity_events LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.character_activity_events WHERE operation_id=p_operation_id) THEN
  PERFORM public.require_character_medical_action(p_character_id); END IF;
 RETURN public.confirm_character_equipe_trauma_incapacity_core(p_operation_id,p_character_id,p_request);
END $$;
REVOKE ALL ON FUNCTION public.confirm_character_equipe_trauma(uuid,uuid,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.confirm_character_equipe_trauma(uuid,uuid,jsonb) TO authenticated;

ALTER FUNCTION public.confirm_character_resgate_movement(uuid,uuid,jsonb)
 RENAME TO confirm_character_resgate_movement_action_core;
REVOKE ALL ON FUNCTION public.confirm_character_resgate_movement_action_core(uuid,uuid,jsonb)
 FROM PUBLIC,anon,authenticated;
CREATE FUNCTION public.confirm_character_resgate_movement(p_operation_id uuid,p_character_id uuid,p_request jsonb)
RETURNS public.character_activity_events LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.character_activity_events WHERE operation_id=p_operation_id) THEN
  PERFORM public.require_character_medical_action(p_character_id); END IF;
 RETURN public.confirm_character_resgate_movement_action_core(p_operation_id,p_character_id,p_request);
END $$;
REVOKE ALL ON FUNCTION public.confirm_character_resgate_movement(uuid,uuid,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.confirm_character_resgate_movement(uuid,uuid,jsonb) TO authenticated;

ALTER FUNCTION public.confirm_character_reanimacao(uuid,uuid,jsonb)
 RENAME TO confirm_character_reanimacao_action_core;
REVOKE ALL ON FUNCTION public.confirm_character_reanimacao_action_core(uuid,uuid,jsonb)
 FROM PUBLIC,anon,authenticated;
CREATE FUNCTION public.confirm_character_reanimacao(p_operation_id uuid,p_character_id uuid,p_request jsonb)
RETURNS public.character_activity_events LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.character_activity_events WHERE operation_id=p_operation_id) THEN
  PERFORM public.require_character_medical_action(p_character_id); END IF;
 RETURN public.confirm_character_reanimacao_action_core(p_operation_id,p_character_id,p_request);
END $$;
REVOKE ALL ON FUNCTION public.confirm_character_reanimacao(uuid,uuid,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.confirm_character_reanimacao(uuid,uuid,jsonb) TO authenticated;
