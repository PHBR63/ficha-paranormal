-- Livro Base v1.3, pp. 84-85: durante combate v2 cada turno dispõe de
-- uma ação padrão e uma de movimento. A padrão pode virar movimento;
-- uma ação completa consome ambas. Fora do combate v2, o controle da mesa
-- permanece como estava, inclusive campanhas legadas.
CREATE TABLE public.character_combat_actions (
 operation_id uuid PRIMARY KEY REFERENCES public.character_activity_events(id) ON DELETE CASCADE,
 character_id uuid NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
 turn_key text NOT NULL,
 action_kind text NOT NULL CHECK (action_kind IN ('standard','movement','full')),
 source text NOT NULL CHECK (source IN ('attack','ritual','mirar')),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX character_combat_actions_turn_idx
 ON public.character_combat_actions(character_id,turn_key);
ALTER TABLE public.character_combat_actions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.character_combat_actions FROM PUBLIC,anon,authenticated;

-- Na publicação durante uma cena, ataques e Mirar já confirmados no turno
-- atual continuam ocupando seus slots. Rituais antigos só entram quando o
-- horário de início desse turno foi registrado pelo servidor.
WITH active_turns AS (
 SELECT combat.campaign_id,combat.scene_number,combat.state->>'round' AS round_number,
  combat.turn_instance_id,member.character_id,
  starts.started_at AS started_at
 FROM public.campaign_combat_state_v2 combat
 JOIN public.campaign_members_v2 member ON member.campaign_id=combat.campaign_id
 JOIN public.characters ficha ON ficha.id=member.character_id AND ficha.user_id=member.user_id
 LEFT JOIN public.character_combat_turn_starts starts
  ON starts.character_id=member.character_id AND starts.turn_instance_id=combat.turn_instance_id
 WHERE combat.state->'active'='true'::jsonb
  AND combat.state->'combatants'->((combat.state->>'currentTurnIndex')::integer)->>'id'=member.character_id::text
), prior_actions AS (
 SELECT event.id AS operation_id,event.character_id,
  'combat:'||turn.turn_instance_id::text AS turn_key,
  CASE WHEN event.payload->>'kind'='combat_attack' THEN 'standard'
   WHEN event.payload->>'kind'='mirar' THEN 'movement'
   WHEN event.payload->>'execution'='Completa' THEN 'full'
   WHEN event.payload->>'execution'='Movimento' THEN 'movement'
   ELSE 'standard' END AS action_kind,
  CASE WHEN event.payload->>'kind'='combat_attack' THEN 'attack'
   WHEN event.payload->>'kind'='mirar' THEN 'mirar' ELSE 'ritual' END AS source,
  event.created_at
 FROM active_turns turn
 JOIN public.character_activity_events event ON event.character_id=turn.character_id
 WHERE (event.payload->>'kind'='combat_attack'
   AND event.payload#>>'{attackTurn,turnInstanceId}'=turn.turn_instance_id::text)
  OR (event.payload->>'kind'='mirar'
   AND event.payload->>'turnInstanceId'=turn.turn_instance_id::text)
  OR (event.category='ritual' AND turn.started_at IS NOT NULL
   AND event.created_at>=turn.started_at
   AND event.payload#>>'{peBudget,campaignId}'=turn.campaign_id::text
   AND event.payload#>>'{peBudget,scene}'=turn.scene_number::text
   AND event.payload#>>'{peBudget,round}'=turn.round_number
   AND event.payload->>'execution' IN ('Padrão','Movimento','Completa'))
)
INSERT INTO public.character_combat_actions(operation_id,character_id,turn_key,action_kind,source,created_at)
SELECT operation_id,character_id,turn_key,action_kind,source,created_at FROM prior_actions
ON CONFLICT (operation_id) DO NOTHING;

-- Estado único para ataques, rituais e habilidades médicas. Conserva o
-- contrato público já usado pelo painel médico e as ações extras do mestre.
CREATE FUNCTION public.get_character_turn_action_status(p_character_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE budget jsonb; action_key text; standard_spent integer; movement_spent integer;
 medical_spent integer; extra integer; eligible boolean:=true;
BEGIN
 IF NOT public.can_manage_character_activity(p_character_id) THEN
  RAISE EXCEPTION 'Ficha não autorizada.' USING ERRCODE='42501'; END IF;
 budget:=public.get_character_pe_budget(p_character_id);
 IF budget->'tracked' IS DISTINCT FROM 'true'::jsonb THEN
  RETURN jsonb_build_object('tracked',false,'eligible',true,'turnKey',NULL,
   'spent',0,'extra',0,'available',NULL,'movementSpent',0); END IF;
 IF budget->>'mode'='combat' THEN
  eligible:=budget->>'actorId'=p_character_id::text;
  IF budget->>'turnInstanceId' IS NULL THEN
   RAISE EXCEPTION 'Turno de combate indisponível.' USING ERRCODE='40001'; END IF;
  action_key:='combat:'||(budget->>'turnInstanceId');
 ELSE action_key:=budget->>'key'; END IF;
 SELECT count(*) INTO medical_spent FROM public.character_medical_standard_actions
  WHERE character_id=p_character_id AND turn_key=action_key;
 SELECT count(*) INTO extra FROM public.character_medical_extra_actions
  WHERE character_id=p_character_id AND turn_key=action_key;
 SELECT count(*) FILTER (WHERE action_kind IN ('standard','full')),
  count(*) FILTER (WHERE action_kind IN ('movement','full'))
 INTO standard_spent,movement_spent FROM public.character_combat_actions
 WHERE character_id=p_character_id AND turn_key=action_key;
 standard_spent:=standard_spent+medical_spent;
 RETURN jsonb_build_object('tracked',true,'eligible',eligible,'turnKey',action_key,
  'spent',standard_spent,'extra',extra,'movementSpent',movement_spent,
  'available',CASE WHEN eligible THEN greatest(0,1+extra-standard_spent-greatest(0,movement_spent-1)) ELSE 0 END);
END $$;
REVOKE ALL ON FUNCTION public.get_character_turn_action_status(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_character_turn_action_status(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_character_medical_action_status(p_character_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 RETURN public.get_character_turn_action_status(p_character_id);
END $$;
REVOKE ALL ON FUNCTION public.get_character_medical_action_status(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_character_medical_action_status(uuid) TO authenticated;

-- O erro no mesmo transaction desfaz PE, PV, SAN, histórico e demais efeitos.
CREATE FUNCTION public.record_character_combat_action(p_event_id uuid,p_character_id uuid,
 p_source text,p_action_kind text)
RETURNS public.character_activity_events LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE receipt public.character_activity_events; budget jsonb; action_status jsonb;
 standard_available integer; movement_spent integer;
BEGIN
 SELECT * INTO receipt FROM public.character_activity_events
  WHERE id=p_event_id AND character_id=p_character_id;
 IF NOT FOUND OR p_source NOT IN ('attack','ritual','mirar')
  OR p_action_kind NOT IN ('standard','movement','full','free','reaction')
  OR (p_source='attack' AND receipt.payload->>'kind' IS DISTINCT FROM 'combat_attack')
  OR (p_source='mirar' AND receipt.payload->>'kind' IS DISTINCT FROM 'mirar')
  OR (p_source='ritual' AND receipt.category<>'ritual') THEN
  RAISE EXCEPTION 'Ação de combate inválida.' USING ERRCODE='22023'; END IF;
 IF EXISTS(SELECT 1 FROM public.character_combat_actions WHERE operation_id=p_event_id) THEN
  RETURN receipt; END IF;
 budget:=public.get_character_pe_budget(p_character_id);
 IF budget->>'mode'<>'combat' THEN RETURN receipt; END IF;
 IF p_action_kind='reaction' THEN RETURN receipt; END IF;
 action_status:=public.get_character_turn_action_status(p_character_id);
 IF action_status->'eligible' IS DISTINCT FROM 'true'::jsonb THEN
  RAISE EXCEPTION 'Ação disponível apenas no próprio turno.' USING ERRCODE='55004'; END IF;
 standard_available:=(action_status->>'available')::integer;
 movement_spent:=(action_status->>'movementSpent')::integer;
 IF (p_action_kind='standard' AND standard_available<1)
  OR (p_action_kind='movement' AND movement_spent>=1 AND standard_available<1)
  OR (p_action_kind='full' AND (movement_spent<>0 OR standard_available<1)) THEN
  RAISE EXCEPTION 'Ações deste turno insuficientes. Nenhum recurso foi gasto.' USING ERRCODE='55004'; END IF;
 IF p_action_kind<>'free' THEN
  INSERT INTO public.character_combat_actions(operation_id,character_id,turn_key,action_kind,source)
  VALUES(p_event_id,p_character_id,action_status->>'turnKey',p_action_kind,p_source);
 END IF;
 UPDATE public.character_activity_events SET payload=payload||jsonb_build_object(
  'combatAction',jsonb_build_object('tracked',true,'turnKey',action_status->>'turnKey',
   'kind',p_action_kind,'source',p_source))
 WHERE id=p_event_id RETURNING * INTO receipt;
 RETURN receipt;
END $$;
REVOKE ALL ON FUNCTION public.record_character_combat_action(uuid,uuid,text,text) FROM PUBLIC,anon,authenticated;

-- O wrapper externo mantém idempotência e todas as validações já existentes.
ALTER FUNCTION public.confirm_character_combat_attack(uuid,uuid,integer,integer,text,jsonb,jsonb)
 RENAME TO confirm_character_combat_attack_action_core;
REVOKE ALL ON FUNCTION public.confirm_character_combat_attack_action_core(uuid,uuid,integer,integer,text,jsonb,jsonb)
 FROM PUBLIC,anon,authenticated;
CREATE FUNCTION public.confirm_character_combat_attack(
 p_operation_id uuid,p_character_id uuid,p_expected_pe integer,p_expected_cost integer,
 p_expected_turn_key text,p_selection jsonb,p_payload jsonb)
RETURNS public.character_activity_events LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE receipt public.character_activity_events; budget jsonb;
BEGIN
 IF p_operation_id IS NULL THEN RAISE EXCEPTION 'Operação obrigatória.' USING ERRCODE='22023'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_operation_id::text,0));
 PERFORM public.lock_character_pe_turn(p_character_id);
 SELECT * INTO receipt FROM public.character_activity_events WHERE operation_id=p_operation_id;
 IF FOUND THEN RETURN public.confirm_character_combat_attack_action_core(
  p_operation_id,p_character_id,p_expected_pe,p_expected_cost,p_expected_turn_key,p_selection,p_payload); END IF;
 budget:=public.get_character_pe_budget(p_character_id);
 IF budget->>'mode'='combat' AND budget->>'actorId' IS DISTINCT FROM p_character_id::text THEN
  RAISE EXCEPTION 'Ataque comum exige o turno do personagem. Reações exigem confirmação do mestre.' USING ERRCODE='55004'; END IF;
 receipt:=public.confirm_character_combat_attack_action_core(
  p_operation_id,p_character_id,p_expected_pe,p_expected_cost,p_expected_turn_key,p_selection,p_payload);
 RETURN public.record_character_combat_action(receipt.id,p_character_id,'attack','standard');
END $$;
REVOKE ALL ON FUNCTION public.confirm_character_combat_attack(uuid,uuid,integer,integer,text,jsonb,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.confirm_character_combat_attack(uuid,uuid,integer,integer,text,jsonb,jsonb) TO authenticated;

ALTER FUNCTION public.cast_character_ritual(uuid,uuid,integer,integer,jsonb,uuid,text)
 RENAME TO cast_character_ritual_action_core;
REVOKE ALL ON FUNCTION public.cast_character_ritual_action_core(uuid,uuid,integer,integer,jsonb,uuid,text)
 FROM PUBLIC,anon,authenticated;
CREATE FUNCTION public.cast_character_ritual(
 p_operation_id uuid,p_character_id uuid,p_expected_pe integer,p_pe_cost integer,p_payload jsonb,
 p_campaign_id uuid DEFAULT NULL,p_campaign_version text DEFAULT NULL)
RETURNS public.character_activity_events LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE receipt public.character_activity_events; budget jsonb; execution text; action_kind text;
BEGIN
 IF p_operation_id IS NULL THEN RAISE EXCEPTION 'Operação obrigatória.' USING ERRCODE='22023'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_operation_id::text,0));
 PERFORM public.lock_character_pe_turn(p_character_id);
 SELECT * INTO receipt FROM public.character_activity_events WHERE operation_id=p_operation_id;
 IF FOUND THEN RETURN public.cast_character_ritual_action_core(
  p_operation_id,p_character_id,p_expected_pe,p_pe_cost,p_payload,p_campaign_id,p_campaign_version); END IF;
 budget:=public.get_character_pe_budget(p_character_id);
 IF budget->>'mode'='combat' THEN
  execution:=public.ritual_execution_catalog()->>(p_payload->>'ritualId');
  IF execution IS NULL THEN
   RAISE EXCEPTION 'Execução do ritual não catalogada; resolva manualmente com a mesa.' USING ERRCODE='0A000'; END IF;
  IF execution<>'Reação' AND budget->>'actorId' IS DISTINCT FROM p_character_id::text THEN
   RAISE EXCEPTION 'Conjuração comum exige o turno do personagem.' USING ERRCODE='55004'; END IF;
 END IF;
 receipt:=public.cast_character_ritual_action_core(
  p_operation_id,p_character_id,p_expected_pe,p_pe_cost,p_payload,p_campaign_id,p_campaign_version);
 IF budget->>'mode'<>'combat' THEN RETURN receipt; END IF;
 action_kind:=CASE WHEN receipt.payload->>'execution'='Reação' THEN 'reaction'
  WHEN receipt.payload->>'execution'='Movimento' THEN 'movement'
  WHEN receipt.payload->>'execution'='Completa' THEN 'full'
  WHEN receipt.payload->>'execution'='Livre' THEN 'free'
  WHEN receipt.payload->>'execution'='Padrão' THEN 'standard' ELSE NULL END;
 IF action_kind IS NULL OR (action_kind='reaction' AND execution<>'Reação') THEN
  RAISE EXCEPTION 'Execução do ritual exige revisão.' USING ERRCODE='0A000'; END IF;
 RETURN public.record_character_combat_action(receipt.id,p_character_id,'ritual',action_kind);
END $$;
REVOKE ALL ON FUNCTION public.cast_character_ritual(uuid,uuid,integer,integer,jsonb,uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.cast_character_ritual(uuid,uuid,integer,integer,jsonb,uuid,text) TO authenticated;

-- Mirar já exige o turno do personagem e já cobra 1 PE. Integra somente
-- sua ação de movimento no mesmo comprovante, sem novo gasto.
ALTER FUNCTION public.confirm_character_mirar(uuid,uuid,text,text)
 RENAME TO confirm_character_mirar_action_core;
REVOKE ALL ON FUNCTION public.confirm_character_mirar_action_core(uuid,uuid,text,text)
 FROM PUBLIC,anon,authenticated;
CREATE FUNCTION public.confirm_character_mirar(
 p_operation_id uuid,p_character_id uuid,p_expected_turn_key text,p_weapon_id text)
RETURNS public.character_activity_events LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE receipt public.character_activity_events;
BEGIN
 IF p_operation_id IS NULL THEN RAISE EXCEPTION 'Operação obrigatória.' USING ERRCODE='22023'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_operation_id::text,0));
 PERFORM public.lock_character_pe_turn(p_character_id);
 SELECT * INTO receipt FROM public.character_activity_events WHERE operation_id=p_operation_id;
 IF FOUND THEN RETURN public.confirm_character_mirar_action_core(
  p_operation_id,p_character_id,p_expected_turn_key,p_weapon_id); END IF;
 receipt:=public.confirm_character_mirar_action_core(
  p_operation_id,p_character_id,p_expected_turn_key,p_weapon_id);
 RETURN public.record_character_combat_action(receipt.id,p_character_id,'mirar','movement');
END $$;
REVOKE ALL ON FUNCTION public.confirm_character_mirar(uuid,uuid,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.confirm_character_mirar(uuid,uuid,text,text) TO authenticated;
