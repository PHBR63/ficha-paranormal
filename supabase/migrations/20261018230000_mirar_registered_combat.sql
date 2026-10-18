-- Livro Base v1.3 pp. 30 e 87: Mirar precede Disparo Letal, que vale para o
-- próximo ataque até o fim do próximo turno. O registro é prova do fluxo digital.

CREATE OR REPLACE FUNCTION public.get_character_mirar_status(p_character_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE budget jsonb; aim public.character_activity_events; turn_id uuid;
BEGIN
 IF NOT public.can_manage_character_activity(p_character_id) THEN
  RAISE EXCEPTION 'Ficha não autorizada.' USING ERRCODE='42501'; END IF;
 budget:=public.get_character_pe_budget(p_character_id);
 IF budget->>'mode'<>'combat' OR budget->>'actorId' IS DISTINCT FROM p_character_id::text THEN
  RETURN jsonb_build_object('controlled',budget->>'mode'='combat','available',false); END IF;
 SELECT turn_instance_id INTO turn_id FROM public.campaign_combat_state_v2
 WHERE campaign_id=(budget->>'campaignId')::uuid;
 SELECT e.* INTO aim FROM public.character_activity_events e
 WHERE e.character_id=p_character_id AND e.status='confirmed' AND e.payload->>'kind'='mirar'
  AND e.payload->>'campaignId'=budget->>'campaignId'
  AND e.payload->>'scene'=budget->>'scene'
  AND (e.payload->>'round')::integer BETWEEN (budget->>'round')::integer-1 AND (budget->>'round')::integer
  AND ((e.payload->>'round')::integer<(budget->>'round')::integer
    OR e.payload->>'turnInstanceId'=turn_id::text)
  AND NOT (e.payload ? 'consumedByAttackId')
 ORDER BY e.created_at DESC LIMIT 1;
 RETURN jsonb_build_object('controlled',true,'available',aim.id IS NOT NULL,
  'operationId',aim.operation_id,'round',aim.payload->>'round');
END $$;
REVOKE ALL ON FUNCTION public.get_character_mirar_status(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_character_mirar_status(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.confirm_character_mirar(
 p_operation_id uuid,p_character_id uuid,p_expected_turn_key text,p_weapon_id text)
RETURNS public.character_activity_events LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE budget jsonb; ficha public.characters; weapon jsonb; receipt public.character_activity_events;
 training integer:=0; fingerprint text; turn_id uuid;
BEGIN
 IF NOT public.can_manage_character_activity(p_character_id) THEN
  RAISE EXCEPTION 'Ficha não autorizada.' USING ERRCODE='42501'; END IF;
 IF p_operation_id IS NULL OR coalesce(length(p_weapon_id),0) NOT BETWEEN 1 AND 120 THEN
  RAISE EXCEPTION 'Arma inválida para Mirar.' USING ERRCODE='22023'; END IF;
 fingerprint:=md5(jsonb_build_array(p_character_id,p_expected_turn_key,p_weapon_id)::text);
 PERFORM pg_advisory_xact_lock(hashtextextended(p_operation_id::text,0));
 PERFORM public.lock_character_pe_turn(p_character_id);
 SELECT * INTO receipt FROM public.character_activity_events WHERE operation_id=p_operation_id;
 IF FOUND THEN
  IF receipt.author_id<>auth.uid() OR receipt.request_hash<>fingerprint THEN
   RAISE EXCEPTION 'Operação reutilizada.' USING ERRCODE='23505'; END IF;
  RETURN receipt;
 END IF;
 SELECT * INTO ficha FROM public.characters WHERE id=p_character_id FOR UPDATE;
 SELECT coalesce(max(CASE WHEN value #>> '{}' ~ '^[0-3]$' THEN (value #>> '{}')::integer ELSE 0 END),0)
 INTO training FROM jsonb_each(coalesce(ficha.skills,'{}'::jsonb)) skill
 WHERE lower(trim(skill.key))='pontaria';
 IF training<1 THEN RAISE EXCEPTION 'Mirar exige Pontaria treinada.' USING ERRCODE='22023'; END IF;
 budget:=public.get_character_pe_budget(p_character_id);
 IF budget->>'mode'<>'combat' OR budget->>'actorId' IS DISTINCT FROM p_character_id::text
  OR budget->>'key' IS DISTINCT FROM p_expected_turn_key THEN
  RAISE EXCEPTION 'Mirar exige seu turno atual no combate controlado.' USING ERRCODE='55004'; END IF;
 SELECT value INTO weapon FROM jsonb_array_elements(coalesce(ficha.inventory,'[]'::jsonb))
 WHERE value->>'id'=p_weapon_id AND value->>'itemType'='weapon' AND value->'isEquipped'='true'::jsonb;
 IF NOT FOUND THEN RAISE EXCEPTION 'Equipe a arma antes de Mirar.' USING ERRCODE='22023'; END IF;
 IF (SELECT count(*) FROM jsonb_array_elements(coalesce(ficha.inventory,'[]'::jsonb))
     WHERE value->>'id'=p_weapon_id)<>1 THEN
  RAISE EXCEPTION 'Identidade da arma duplicada.' USING ERRCODE='40001'; END IF;
 SELECT turn_instance_id INTO turn_id FROM public.campaign_combat_state_v2
 WHERE campaign_id=(budget->>'campaignId')::uuid;
 INSERT INTO public.character_activity_events(id,operation_id,character_id,author_id,category,status,payload,request_hash)
 VALUES(p_operation_id,p_operation_id,p_character_id,auth.uid(),'application','confirmed',
  jsonb_build_object('kind','mirar','campaignId',budget->>'campaignId','scene',budget->>'scene',
   'round',budget->>'round','turnInstanceId',turn_id,'weaponId',p_weapon_id,
   'weaponName',weapon->>'name','actionCost','movimento','peCost',0,
   'targetContext','mesa confirma alvo visível e alcance'),fingerprint)
 RETURNING * INTO receipt;
 RETURN receipt;
END $$;
REVOKE ALL ON FUNCTION public.confirm_character_mirar(uuid,uuid,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.confirm_character_mirar(uuid,uuid,text,text) TO authenticated;

-- Guarda adicional ao núcleo transacional: uma declaração sozinha não basta
-- durante a iniciativa v2. Sem controle ativo, a conferência da mesa permanece.
DO $migration$ BEGIN
 IF to_regprocedure('public.confirm_character_combat_attack_without_mirar_guard(uuid,uuid,integer,integer,text,jsonb,jsonb)') IS NULL THEN
  ALTER FUNCTION public.confirm_character_combat_attack(uuid,uuid,integer,integer,text,jsonb,jsonb)
   RENAME TO confirm_character_combat_attack_without_mirar_guard;
 END IF;
END $migration$;
REVOKE ALL ON FUNCTION public.confirm_character_combat_attack_without_mirar_guard(uuid,uuid,integer,integer,text,jsonb,jsonb)
 FROM PUBLIC,anon,authenticated;
CREATE OR REPLACE FUNCTION public.confirm_character_combat_attack(
 p_operation_id uuid,p_character_id uuid,p_expected_pe integer,p_expected_cost integer,
 p_expected_turn_key text,p_selection jsonb,p_payload jsonb)
RETURNS public.character_activity_events LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE budget jsonb; mirar_status jsonb; receipt public.character_activity_events;
BEGIN
 PERFORM public.lock_character_pe_turn(p_character_id);
 -- O núcleo verifica o hash e recupera a resposta original em reenvios.
 IF EXISTS(SELECT 1 FROM public.character_activity_events WHERE operation_id=p_operation_id) THEN
  RETURN public.confirm_character_combat_attack_without_mirar_guard(
   p_operation_id,p_character_id,p_expected_pe,p_expected_cost,p_expected_turn_key,p_selection,p_payload); END IF;
 budget:=public.get_character_pe_budget(p_character_id);
 IF p_selection->'lethalShot'='true'::jsonb THEN
  IF budget->>'mode'='combat' THEN
   mirar_status:=public.get_character_mirar_status(p_character_id);
   IF mirar_status->'available' IS DISTINCT FROM 'true'::jsonb THEN
    RAISE EXCEPTION 'Registre Mirar antes do próximo ataque no prazo.' USING ERRCODE='55004'; END IF;
  END IF;
 END IF;
 receipt:=public.confirm_character_combat_attack_without_mirar_guard(
  p_operation_id,p_character_id,p_expected_pe,p_expected_cost,p_expected_turn_key,p_selection,p_payload);
 -- O próximo ataque, mesmo sem Disparo Letal, consome a oportunidade de Mirar.
 IF budget->>'mode'='combat' THEN
  UPDATE public.character_activity_events e
  SET payload=jsonb_set(e.payload,'{consumedByAttackId}',to_jsonb(receipt.id::text))
  WHERE e.character_id=p_character_id AND e.status='confirmed' AND e.payload->>'kind'='mirar'
   AND e.payload->>'campaignId'=budget->>'campaignId' AND e.payload->>'scene'=budget->>'scene'
   AND (e.payload->>'round')::integer BETWEEN (budget->>'round')::integer-1 AND (budget->>'round')::integer
   AND NOT (e.payload ? 'consumedByAttackId');
 END IF;
 IF budget->>'mode'='combat' AND p_selection->'lethalShot'='true'::jsonb THEN
  UPDATE public.character_activity_events SET payload=jsonb_set(payload,'{mirarOperationId}',mirar_status->'operationId')
  WHERE id=receipt.id RETURNING * INTO receipt;
 END IF;
 RETURN receipt;
END $$;
REVOKE ALL ON FUNCTION public.confirm_character_combat_attack(uuid,uuid,integer,integer,text,jsonb,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.confirm_character_combat_attack(uuid,uuid,integer,integer,text,jsonb,jsonb) TO authenticated;
