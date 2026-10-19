-- Livro Base v1.3, p. 31: Equipe de Trauma remove uma condição negativa
-- de um aliado adjacente com ação padrão e 2 PE. Resgate exige NEX 65%.
-- O servidor valida a ficha e grava custo, efeito e recibo na mesma transação.

CREATE TABLE public.character_resgate_defense_grants (
  operation_id uuid PRIMARY KEY REFERENCES public.character_activity_events(id) ON DELETE CASCADE,
  source_character_id uuid NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  target_character_id uuid NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  mode text NOT NULL CHECK (mode IN ('combat','manual')),
  campaign_id uuid,
  scene_number integer,
  round_number integer,
  source_turn_instance_id uuid,
  manual_turn_number integer,
  CONSTRAINT character_resgate_defense_context CHECK (
    (mode='combat' AND campaign_id IS NOT NULL AND scene_number IS NOT NULL
      AND round_number IS NOT NULL AND source_turn_instance_id IS NOT NULL)
    OR (mode='manual' AND manual_turn_number IS NOT NULL)
  ),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX character_resgate_defense_source ON public.character_resgate_defense_grants(source_character_id,created_at DESC);
CREATE INDEX character_resgate_defense_target ON public.character_resgate_defense_grants(target_character_id,created_at DESC);
ALTER TABLE public.character_resgate_defense_grants ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.character_resgate_defense_grants FROM PUBLIC,anon,authenticated;

-- Chamado apenas depois de uma cura efetiva ou remoção confirmada. Sem controle
-- de turnos, o recibo da ação permite à mesa controlar o bônus manualmente.
CREATE FUNCTION public.grant_character_resgate_defense(p_operation_id uuid,p_source_id uuid,p_target_id uuid,p_budget jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE source public.characters; turn_id uuid;
BEGIN
 SELECT * INTO source FROM public.characters WHERE id=p_source_id;
 IF source.nex<65 OR public.creation_identifier(source.class_track) NOT IN ('medico-de-campo','medico-campo')
   OR p_source_id=p_target_id THEN RETURN; END IF;
 -- Sem uma identidade de turno, a duração não pode ser calculada. A mesa
 -- aplica o bônus manualmente a partir do recibo, sem efeito automático eterno.
 IF p_budget->>'mode'='untracked' THEN RETURN; END IF;
 IF p_budget->>'mode'='combat' THEN
  SELECT turn_instance_id INTO turn_id FROM public.campaign_combat_state_v2
   WHERE campaign_id=(p_budget->>'campaignId')::uuid;
 END IF;
 INSERT INTO public.character_resgate_defense_grants(operation_id,source_character_id,target_character_id,
  mode,campaign_id,scene_number,round_number,source_turn_instance_id,manual_turn_number)
 VALUES(p_operation_id,p_source_id,p_target_id,p_budget->>'mode',
  CASE WHEN p_budget->>'mode'='combat' THEN (p_budget->>'campaignId')::uuid END,
  CASE WHEN p_budget->>'mode'='combat' THEN (p_budget->>'scene')::integer END,
  CASE WHEN p_budget->>'mode'='combat' THEN (p_budget->>'round')::integer END,
  turn_id,
  CASE WHEN p_budget->>'mode'='manual' THEN (p_budget->>'number')::integer END)
 ON CONFLICT(operation_id) DO NOTHING;
END $$;
REVOKE ALL ON FUNCTION public.grant_character_resgate_defense(uuid,uuid,uuid,jsonb) FROM PUBLIC,anon,authenticated;

-- A interface consulta fatos do servidor. JSON local nunca prova um bônus.
CREATE FUNCTION public.get_character_resgate_defense_status(p_character_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE grant_row record; combat public.campaign_combat_state_v2; clock public.character_manual_turns;
 current_round integer; current_index integer; source_index integer; active_bonus boolean:=false;
BEGIN
 IF NOT public.can_manage_character_activity(p_character_id) THEN
  RAISE EXCEPTION 'Ficha não autorizada.' USING ERRCODE='42501'; END IF;
 FOR grant_row IN SELECT * FROM public.character_resgate_defense_grants
  WHERE source_character_id=p_character_id OR target_character_id=p_character_id
  ORDER BY created_at DESC LOOP
  IF grant_row.mode='manual' THEN
   SELECT * INTO clock FROM public.character_manual_turns WHERE character_id=grant_row.source_character_id;
   -- Pausar o turno não inicia o próximo: a Defesa persiste até o contador avançar.
   IF clock.turn_number=grant_row.manual_turn_number THEN active_bonus:=true; END IF;
   CONTINUE;
  END IF;
  SELECT * INTO combat FROM public.campaign_combat_state_v2 WHERE campaign_id=grant_row.campaign_id;
  IF NOT FOUND OR combat.scene_number<>grant_row.scene_number OR combat.state->'active'<>'true'::jsonb THEN CONTINUE; END IF;
  current_round:=(combat.state->>'round')::integer;
  current_index:=(combat.state->>'currentTurnIndex')::integer;
  SELECT (ordinal-1)::integer INTO source_index FROM jsonb_array_elements(combat.state->'combatants')
   WITH ORDINALITY AS actor(value,ordinal) WHERE value->>'id'=grant_row.source_character_id::text LIMIT 1;
  IF source_index IS NOT NULL AND (
   (current_round=grant_row.round_number AND
    (current_index<>source_index OR combat.turn_instance_id=grant_row.source_turn_instance_id))
   OR (current_round=grant_row.round_number+1 AND current_index<source_index))
  THEN active_bonus:=true; END IF;
 END LOOP;
 RETURN jsonb_build_object('bonus',CASE WHEN active_bonus THEN 5 ELSE 0 END,
  'duration','até o início do próximo turno do Médico de Campo');
END $$;
REVOKE ALL ON FUNCTION public.get_character_resgate_defense_status(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_character_resgate_defense_status(uuid) TO authenticated;

-- A remoção automática alcança apenas condições negativas conhecidas do
-- Livro Base. Condições personalizadas continuam na ficha para revisão da mesa.
CREATE FUNCTION public.is_removable_trauma_condition(p_condition text,p_hp integer)
RETURNS boolean LANGUAGE sql STABLE SET search_path=public,pg_temp AS $$
 SELECT public.creation_identifier(p_condition)=ANY(ARRAY[
  'abalado','agarrado','apavorado','atordoado','caido','cego','confuso',
  'debilitado','desprevenido','doente','em_chamas','enjoado','enlouquecendo',
  'enredado','envenenado','esmorecido','exausto','fascinado','fatigado',
  'fragilizado','fraco','frustrado','imobilizado','indefeso','lento',
  'ofuscado','paralisado','pasmo','sangrando','surdo','surpreendido',
  'vulneravel']::text[])
  OR (public.creation_identifier(p_condition)='inconsciente' AND p_hp>0);
$$;
REVOKE ALL ON FUNCTION public.is_removable_trauma_condition(text,integer) FROM PUBLIC,anon,authenticated;

-- Usa a mesma associação v1/v2 de Paramédico e apresenta apenas condições
-- persistidas na ficha. Estados derivados de PV/SAN não são removíveis aqui.
CREATE FUNCTION public.get_character_equipe_trauma_options(p_character_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE source public.characters; base jsonb; targets jsonb;
BEGIN
 base:=public.get_character_paramedico_options(p_character_id);
 SELECT * INTO source FROM public.characters WHERE id=p_character_id;
 SELECT coalesce(jsonb_agg(jsonb_build_object('id',target.id,'name',target.name,
  'conditionsSnapshot',coalesce(target.conditions,'[]'::jsonb),'conditions',
  coalesce((SELECT jsonb_agg(jsonb_build_object('id',coalesce(item->>'id',item#>>'{}'),
   'name',coalesce(item->>'name',item->>'id',item#>>'{}')))
   FROM jsonb_array_elements(coalesce(target.conditions,'[]'::jsonb)) item
   WHERE public.is_removable_trauma_condition(coalesce(item->>'id',item#>>'{}'),target.hp_current)),'[]'::jsonb)
 ) ORDER BY target.name,target.id),'[]'::jsonb) INTO targets
 FROM public.get_character_estrategista_targets(p_character_id) linked
 JOIN public.characters target ON target.id=linked.id;
 RETURN jsonb_build_object('eligible',source.nex>=40 AND lower(source.class)='especialista'
  AND public.creation_identifier(source.class_track) IN ('medico-de-campo','medico-campo'),
  'trained',base->'trained','medicalKit',base->'medicalKit','targets',targets);
END $$;
REVOKE ALL ON FUNCTION public.get_character_equipe_trauma_options(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_character_equipe_trauma_options(uuid) TO authenticated;

CREATE FUNCTION public.confirm_character_equipe_trauma(p_operation_id uuid,p_character_id uuid,p_request jsonb)
RETURNS public.character_activity_events LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE source public.characters; target public.characters; receipt public.character_activity_events;
 options jsonb; budget jsonb; fingerprint text; target_id uuid; condition_key text; next_conditions jsonb;
 removed jsonb; temporary_before integer; temporary_used integer; target_event_id uuid;
BEGIN
 IF NOT public.can_manage_character_activity(p_character_id) THEN
  RAISE EXCEPTION 'Ficha não autorizada.' USING ERRCODE='42501'; END IF;
 IF (p_operation_id IS NULL) OR (jsonb_typeof(p_request) IS DISTINCT FROM 'object')
  OR (octet_length(p_request::text)>8192) OR (p_request->'standardActionConfirmed' IS DISTINCT FROM 'true'::jsonb)
  OR (p_request->'adjacencyConfirmed' IS DISTINCT FROM 'true'::jsonb)
  OR (coalesce((p_request->>'targetId') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',true))
  OR (length(coalesce(p_request->>'conditionId','')) NOT BETWEEN 1 AND 100)
  OR (coalesce((p_request->>'expectedPE') !~ '^[0-9]{1,6}$',true))
  OR (coalesce((p_request->>'expectedNex') !~ '^[0-9]{1,2}$',true))
  OR (jsonb_typeof(p_request->'expectedTargetConditions') IS DISTINCT FROM 'array') THEN
  RAISE EXCEPTION 'Confirme a ação, o aliado adjacente e a condição.' USING ERRCODE='22023'; END IF;
 target_id:=(p_request->>'targetId')::uuid;
 condition_key:=public.creation_identifier(p_request->>'conditionId');
 IF target_id=p_character_id THEN
  RAISE EXCEPTION 'Escolha uma condição negativa removível de um aliado.' USING ERRCODE='22023'; END IF;
 fingerprint:=md5(jsonb_build_array('equipe-trauma',p_character_id,p_request)::text);
 PERFORM pg_advisory_xact_lock(hashtextextended(p_operation_id::text,0));
 PERFORM public.lock_character_pe_turn(p_character_id);
 SELECT * INTO receipt FROM public.character_activity_events WHERE operation_id=p_operation_id;
 IF FOUND THEN
  IF receipt.author_id<>auth.uid() OR receipt.request_hash<>fingerprint THEN
   RAISE EXCEPTION 'Operação reutilizada.' USING ERRCODE='23505'; END IF;
  RETURN receipt;
 END IF;
 PERFORM id FROM public.characters WHERE id IN (p_character_id,target_id) ORDER BY id FOR UPDATE;
 SELECT * INTO source FROM public.characters WHERE id=p_character_id;
 SELECT * INTO target FROM public.characters WHERE id=target_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'Alvo indisponível.' USING ERRCODE='22023'; END IF;
 IF NOT public.is_removable_trauma_condition(condition_key,target.hp_current) THEN
  RAISE EXCEPTION 'Escolha uma condição negativa removível de um aliado.' USING ERRCODE='22023'; END IF;
 options:=public.get_character_equipe_trauma_options(p_character_id);
 IF options->'eligible' IS DISTINCT FROM 'true'::jsonb OR options->'trained' IS DISTINCT FROM 'true'::jsonb
  OR options->'medicalKit' IS DISTINCT FROM 'true'::jsonb THEN
  RAISE EXCEPTION 'Equipe de Trauma requer Médico de Campo NEX 40%%, Medicina treinada e kit.' USING ERRCODE='55004'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.get_character_estrategista_targets(p_character_id) linked WHERE linked.id=target_id) THEN
  RAISE EXCEPTION 'Alvo não está vinculado à mesma campanha.' USING ERRCODE='42501'; END IF;
 IF source.pe_current::text IS DISTINCT FROM p_request->>'expectedPE'
  OR source.nex::text IS DISTINCT FROM p_request->>'expectedNex'
  OR coalesce(target.conditions,'[]'::jsonb) IS DISTINCT FROM p_request->'expectedTargetConditions' THEN
  RAISE EXCEPTION 'Ficha mudou. Atualize antes de confirmar.' USING ERRCODE='40001'; END IF;
 SELECT value INTO removed FROM jsonb_array_elements(coalesce(target.conditions,'[]'::jsonb)) value
  WHERE public.creation_identifier(coalesce(value->>'id',value#>>'{}'))=condition_key LIMIT 1;
 IF removed IS NULL THEN RAISE EXCEPTION 'Condição não está mais no aliado.' USING ERRCODE='40001'; END IF;
 budget:=public.get_character_pe_budget(p_character_id);
 IF p_request->>'expectedTurnKey' IS DISTINCT FROM budget->>'key' THEN
  RAISE EXCEPTION 'Turno mudou. Atualize antes de confirmar.' USING ERRCODE='40001'; END IF;
 IF budget->>'mode'='combat' AND budget->>'actorId' IS DISTINCT FROM p_character_id::text THEN
  RAISE EXCEPTION 'Aguarde o turno do Médico de Campo.' USING ERRCODE='55004'; END IF;
 SELECT coalesce(sum(remaining),0)::integer INTO temporary_before FROM public.character_temporary_resources
  WHERE character_id=p_character_id AND resource='pe';
 IF source.pe_current+temporary_before<2 THEN RAISE EXCEPTION 'PE insuficiente.' USING ERRCODE='22023'; END IF;
 SELECT coalesce(jsonb_agg(item ORDER BY ordinal),'[]'::jsonb) INTO next_conditions
  FROM jsonb_array_elements(coalesce(target.conditions,'[]'::jsonb)) WITH ORDINALITY AS entries(item,ordinal)
  WHERE ordinal<>(SELECT min(position) FROM jsonb_array_elements(coalesce(target.conditions,'[]'::jsonb))
    WITH ORDINALITY AS found(value,position)
    WHERE public.creation_identifier(coalesce(value->>'id',value#>>'{}'))=condition_key);
 temporary_used:=public.consume_temporary_resource(p_character_id,'pe',2);
 UPDATE public.characters SET pe_current=pe_current-2+temporary_used WHERE id=p_character_id;
 UPDATE public.characters SET conditions=next_conditions WHERE id=target_id;
 DELETE FROM public.character_active_conditions WHERE id=(SELECT id FROM public.character_active_conditions
  WHERE character_id=target_id AND public.creation_identifier(condition_id)=condition_key ORDER BY created_at LIMIT 1);
 target_event_id:=gen_random_uuid();
 INSERT INTO public.character_activity_events(id,operation_id,character_id,author_id,category,status,payload,request_hash)
 VALUES(target_event_id,target_event_id,target_id,auth.uid(),'application','confirmed',
  jsonb_build_object('kind','equipe_trauma_received','sourceCharacterId',p_character_id,
   'sourceName',source.name,'conditionId',condition_key,
   'conditionName',coalesce(removed->>'name',removed->>'id',removed#>>'{}'),
   'conditionsAfter',next_conditions,
   'sourceOperationId',p_operation_id),fingerprint);
 INSERT INTO public.character_activity_events(id,operation_id,character_id,author_id,category,status,payload,request_hash)
 VALUES(p_operation_id,p_operation_id,p_character_id,auth.uid(),'application','confirmed',
  jsonb_build_object('kind','equipe_trauma','targetId',target_id,'targetName',target.name,
   'conditionId',condition_key,'conditionName',coalesce(removed->>'name',removed->>'id',removed#>>'{}'),
   'conditionsAfter',next_conditions,'targetEventId',target_event_id,'peCost',2,'peBefore',source.pe_current,
   'peAfter',source.pe_current-2+temporary_used,'temporaryPEUsed',temporary_used,
   'standardActionConfirmed',true,'adjacencyConfirmed',true),fingerprint)
 RETURNING * INTO receipt;
 receipt:=public.record_ritual_pe_budget(receipt.id,budget,2,'ability',false);
 PERFORM public.grant_character_resgate_defense(receipt.id,p_character_id,target_id,budget);
 RETURN receipt;
END $$;
REVOKE ALL ON FUNCTION public.confirm_character_equipe_trauma(uuid,uuid,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.confirm_character_equipe_trauma(uuid,uuid,jsonb) TO authenticated;

-- A cura de Paramédico já confirma o alvo e o débito. Este wrapper acrescenta
-- o gatilho de Resgate apenas em curas novas de PV de aliado, sem rerrolar.
ALTER FUNCTION public.confirm_character_paramedico(uuid,uuid,jsonb) RENAME TO confirm_character_paramedico_core;
REVOKE ALL ON FUNCTION public.confirm_character_paramedico_core(uuid,uuid,jsonb) FROM PUBLIC,anon,authenticated;
CREATE FUNCTION public.confirm_character_paramedico(p_operation_id uuid,p_character_id uuid,p_request jsonb)
RETURNS public.character_activity_events LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE receipt public.character_activity_events; existed boolean; budget jsonb;
BEGIN
 SELECT EXISTS(SELECT 1 FROM public.character_activity_events WHERE operation_id=p_operation_id) INTO existed;
 receipt:=public.confirm_character_paramedico_core(p_operation_id,p_character_id,p_request);
 IF NOT existed AND receipt.payload->>'kind'='paramedico'
  AND (receipt.payload->>'effectiveHealing')::integer>0
  AND receipt.payload->>'targetId'<>p_character_id::text THEN
  budget:=receipt.payload->'peBudget';
  IF budget IS NULL THEN budget:=public.get_character_pe_budget(p_character_id); END IF;
  PERFORM public.grant_character_resgate_defense(receipt.id,p_character_id,
   (receipt.payload->>'targetId')::uuid,budget);
 END IF;
 RETURN receipt;
END $$;
REVOKE ALL ON FUNCTION public.confirm_character_paramedico(uuid,uuid,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.confirm_character_paramedico(uuid,uuid,jsonb) TO authenticated;

-- Movimento livre de Resgate é uma declaração de posição da mesa. Quando há
-- turno no servidor, a chave impede um segundo uso na mesma rodada/turno.
CREATE TABLE public.character_resgate_movements (
  operation_id uuid PRIMARY KEY REFERENCES public.character_activity_events(id) ON DELETE CASCADE,
  character_id uuid NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  target_character_id uuid NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  turn_key text,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE UNIQUE INDEX character_resgate_movement_once ON public.character_resgate_movements(character_id,turn_key)
 WHERE turn_key IS NOT NULL;
ALTER TABLE public.character_resgate_movements ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.character_resgate_movements FROM PUBLIC,anon,authenticated;

CREATE FUNCTION public.get_character_resgate_movement_options(p_character_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE source public.characters; base jsonb; budget jsonb; targets jsonb;
BEGIN
 base:=public.get_character_paramedico_options(p_character_id);
 SELECT * INTO source FROM public.characters WHERE id=p_character_id;
 budget:=public.get_character_pe_budget(p_character_id);
 SELECT coalesce(jsonb_agg(jsonb_build_object('id',target.id,'name',target.name,
  'currentHp',target.hp_current,'maxHp',target.hp_max) ORDER BY target.name,target.id),'[]'::jsonb)
 INTO targets FROM public.get_character_estrategista_targets(p_character_id) linked
 JOIN public.characters target ON target.id=linked.id
 WHERE target.hp_current*2<=target.hp_max OR EXISTS(
  SELECT 1 FROM jsonb_array_elements(coalesce(target.conditions,'[]'::jsonb)) item
  WHERE public.creation_identifier(coalesce(item->>'id',item#>>'{}'))='morrendo');
 RETURN jsonb_build_object('eligible',source.nex>=65 AND lower(source.class)='especialista'
  AND public.creation_identifier(source.class_track) IN ('medico-de-campo','medico-campo'),
  'trained',base->'trained','medicalKit',base->'medicalKit','targets',targets,
  'usedInCurrentControl',budget->>'key' IS NOT NULL AND EXISTS(
   SELECT 1 FROM public.character_resgate_movements WHERE character_id=p_character_id AND turn_key=budget->>'key'));
END $$;
REVOKE ALL ON FUNCTION public.get_character_resgate_movement_options(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_character_resgate_movement_options(uuid) TO authenticated;

CREATE FUNCTION public.confirm_character_resgate_movement(p_operation_id uuid,p_character_id uuid,p_request jsonb)
RETURNS public.character_activity_events LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE source public.characters; target public.characters; receipt public.character_activity_events;
 budget jsonb; options jsonb; fingerprint text; target_id uuid; wounded boolean;
BEGIN
 IF NOT public.can_manage_character_activity(p_character_id) THEN
  RAISE EXCEPTION 'Ficha não autorizada.' USING ERRCODE='42501'; END IF;
 IF (p_operation_id IS NULL) OR (jsonb_typeof(p_request) IS DISTINCT FROM 'object')
  OR (octet_length(p_request::text)>1536) OR (p_request->'freeActionConfirmed' IS DISTINCT FROM 'true'::jsonb)
  OR (p_request->'shortRangeConfirmed' IS DISTINCT FROM 'true'::jsonb)
  OR (p_request->'normalMovementConfirmed' IS DISTINCT FROM 'true'::jsonb)
  OR (p_request->'roundConfirmed' IS DISTINCT FROM 'true'::jsonb)
  OR (coalesce((p_request->>'targetId') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',true))
  OR (coalesce((p_request->>'expectedNex') !~ '^[0-9]{1,2}$',true)) THEN
  RAISE EXCEPTION 'Confirme a ação livre, o alcance curto e o deslocamento possível.' USING ERRCODE='22023'; END IF;
 target_id:=(p_request->>'targetId')::uuid;
 fingerprint:=md5(jsonb_build_array('resgate-movement',p_character_id,p_request)::text);
 PERFORM pg_advisory_xact_lock(hashtextextended(p_operation_id::text,0));
 PERFORM public.lock_character_pe_turn(p_character_id);
 SELECT * INTO receipt FROM public.character_activity_events WHERE operation_id=p_operation_id;
 IF FOUND THEN
  IF receipt.author_id<>auth.uid() OR receipt.request_hash<>fingerprint THEN
   RAISE EXCEPTION 'Operação reutilizada.' USING ERRCODE='23505'; END IF;
  RETURN receipt;
 END IF;
 PERFORM id FROM public.characters WHERE id IN (p_character_id,target_id) ORDER BY id FOR UPDATE;
 SELECT * INTO source FROM public.characters WHERE id=p_character_id;
 SELECT * INTO target FROM public.characters WHERE id=target_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'Alvo indisponível.' USING ERRCODE='22023'; END IF;
 IF target_id=p_character_id OR lower(source.class)<>'especialista'
  OR public.creation_identifier(source.class_track) NOT IN ('medico-de-campo','medico-campo')
  OR source.nex<65 THEN RAISE EXCEPTION 'Resgate exige Médico de Campo NEX 65%% e um aliado.' USING ERRCODE='55004'; END IF;
 options:=public.get_character_paramedico_options(p_character_id);
 IF options->'trained' IS DISTINCT FROM 'true'::jsonb OR options->'medicalKit' IS DISTINCT FROM 'true'::jsonb THEN
  RAISE EXCEPTION 'Resgate exige Medicina treinada e kit de Medicina.' USING ERRCODE='55004'; END IF;
 IF source.nex::text IS DISTINCT FROM p_request->>'expectedNex' THEN
  RAISE EXCEPTION 'Ficha mudou. Atualize antes de confirmar.' USING ERRCODE='40001'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.get_character_estrategista_targets(p_character_id) linked WHERE linked.id=target_id) THEN
  RAISE EXCEPTION 'Alvo não está vinculado à mesma campanha.' USING ERRCODE='42501'; END IF;
 wounded:=target.hp_current*2<=target.hp_max OR EXISTS(
  SELECT 1 FROM jsonb_array_elements(coalesce(target.conditions,'[]'::jsonb)) item
  WHERE public.creation_identifier(coalesce(item->>'id',item#>>'{}'))='morrendo');
 IF NOT wounded THEN RAISE EXCEPTION 'Resgate exige aliado machucado ou morrendo.' USING ERRCODE='55004'; END IF;
 budget:=public.get_character_pe_budget(p_character_id);
 IF p_request->>'expectedTurnKey' IS DISTINCT FROM budget->>'key' THEN
  RAISE EXCEPTION 'Turno mudou. Atualize antes de confirmar.' USING ERRCODE='40001'; END IF;
 IF budget->>'mode'='combat' AND budget->>'actorId' IS DISTINCT FROM p_character_id::text THEN
  RAISE EXCEPTION 'Aguarde o turno do Médico de Campo.' USING ERRCODE='55004'; END IF;
 IF budget->>'key' IS NOT NULL AND EXISTS(SELECT 1 FROM public.character_resgate_movements
  WHERE character_id=p_character_id AND turn_key=budget->>'key') THEN
  RAISE EXCEPTION 'Resgate já foi registrado neste controle de rodada/turno manual.' USING ERRCODE='55004'; END IF;
 INSERT INTO public.character_activity_events(id,operation_id,character_id,author_id,category,status,payload,request_hash)
 VALUES(p_operation_id,p_operation_id,p_character_id,auth.uid(),'application','confirmed',
  jsonb_build_object('kind','resgate_movement','targetId',target_id,'targetName',target.name,
   'turnKey',budget->>'key','mode',budget->>'mode','freeActionConfirmed',true,
   'shortRangeConfirmed',true,'normalMovementConfirmed',true,'roundConfirmed',true),fingerprint)
 RETURNING * INTO receipt;
 INSERT INTO public.character_resgate_movements(operation_id,character_id,target_character_id,turn_key)
 VALUES(receipt.id,p_character_id,target_id,budget->>'key');
 RETURN receipt;
END $$;
REVOKE ALL ON FUNCTION public.confirm_character_resgate_movement(uuid,uuid,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.confirm_character_resgate_movement(uuid,uuid,jsonb) TO authenticated;
