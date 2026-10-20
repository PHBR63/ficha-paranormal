-- Livro Base v1.3, p. 31: Paramédico e Equipe de Trauma usam ação padrão.
-- Registra somente ações médicas comprovadas neste lote; outras ações continuam
-- declaradas pela mesa até integrarem um livro de ações comum.
CREATE TABLE public.character_medical_standard_actions (
 operation_id uuid PRIMARY KEY REFERENCES public.character_activity_events(id) ON DELETE CASCADE,
 character_id uuid NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
 turn_key text NOT NULL,
 ability text NOT NULL CHECK (ability IN ('paramedico','equipe_trauma')),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX character_medical_standard_actions_turn_idx
 ON public.character_medical_standard_actions(character_id,turn_key);
CREATE TABLE public.character_medical_extra_actions (
 operation_id uuid PRIMARY KEY REFERENCES public.character_activity_events(id) ON DELETE CASCADE,
 character_id uuid NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
 turn_key text NOT NULL,
 source_name text NOT NULL CHECK (length(source_name) BETWEEN 3 AND 120),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX character_medical_extra_actions_turn_idx
 ON public.character_medical_extra_actions(character_id,turn_key);
ALTER TABLE public.character_medical_standard_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.character_medical_extra_actions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.character_medical_standard_actions,public.character_medical_extra_actions FROM PUBLIC,anon,authenticated;

-- A identidade do combate muda mesmo quando o mesmo personagem recebe outro
-- turno na mesma rodada. Fora do controle, não inventa um turno.
CREATE FUNCTION public.get_character_medical_action_status(p_character_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE budget jsonb; turn_id uuid; action_key text; spent integer; extra integer;
 eligible boolean:=true;
BEGIN
 IF NOT public.can_manage_character_activity(p_character_id) THEN
  RAISE EXCEPTION 'Ficha não autorizada.' USING ERRCODE='42501'; END IF;
 budget:=public.get_character_pe_budget(p_character_id);
 IF budget->'tracked' IS DISTINCT FROM 'true'::jsonb THEN
  RETURN jsonb_build_object('tracked',false,'eligible',true,'turnKey',NULL,
   'spent',0,'extra',0,'available',NULL); END IF;
 IF budget->>'mode'='combat' THEN
  eligible:=budget->>'actorId'=p_character_id::text;
  SELECT turn_instance_id INTO turn_id FROM public.campaign_combat_state_v2
   WHERE campaign_id=(budget->>'campaignId')::uuid AND state->'active'='true'::jsonb;
  IF turn_id IS NULL THEN RAISE EXCEPTION 'Turno de combate indisponível.' USING ERRCODE='40001'; END IF;
  action_key:='combat:'||turn_id::text;
 ELSE
  action_key:=budget->>'key';
 END IF;
 SELECT count(*) INTO spent FROM public.character_medical_standard_actions
  WHERE character_id=p_character_id AND turn_key=action_key;
 SELECT count(*) INTO extra FROM public.character_medical_extra_actions
  WHERE character_id=p_character_id AND turn_key=action_key;
 RETURN jsonb_build_object('tracked',true,'eligible',eligible,'turnKey',action_key,
  'spent',spent,'extra',extra,'available',CASE WHEN eligible THEN greatest(0,1+extra-spent) ELSE 0 END);
END $$;
REVOKE ALL ON FUNCTION public.get_character_medical_action_status(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_character_medical_action_status(uuid) TO authenticated;

-- Chamado depois da cura/remoção, na mesma transação. Se a ação não estiver
-- disponível, o erro desfaz dados, PE, PV, condições e todos os históricos.
CREATE FUNCTION public.record_character_medical_standard_action(p_event_id uuid,p_character_id uuid,p_ability text)
RETURNS public.character_activity_events LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE receipt public.character_activity_events; action_status jsonb;
BEGIN
 SELECT * INTO receipt FROM public.character_activity_events WHERE id=p_event_id AND character_id=p_character_id;
 IF NOT FOUND OR receipt.payload->>'kind' IS DISTINCT FROM p_ability
  OR p_ability NOT IN ('paramedico','equipe_trauma') THEN
  RAISE EXCEPTION 'Ação médica inválida.' USING ERRCODE='22023'; END IF;
 IF EXISTS(SELECT 1 FROM public.character_medical_standard_actions WHERE operation_id=p_event_id) THEN
  RETURN receipt; END IF;
 action_status:=public.get_character_medical_action_status(p_character_id);
 IF action_status->'tracked'='true'::jsonb THEN
  IF action_status->'eligible' IS DISTINCT FROM 'true'::jsonb
   OR (action_status->>'available')::integer<1 THEN
   RAISE EXCEPTION 'Ação padrão médica deste turno indisponível. Nenhum recurso foi gasto.' USING ERRCODE='55004'; END IF;
  INSERT INTO public.character_medical_standard_actions(operation_id,character_id,turn_key,ability)
   VALUES(p_event_id,p_character_id,action_status->>'turnKey',p_ability);
 END IF;
 UPDATE public.character_activity_events SET payload=payload||jsonb_build_object(
  'medicalAction',jsonb_build_object('tracked',action_status->'tracked','turnKey',action_status->>'turnKey',
   'spentAfter',CASE WHEN action_status->'tracked'='true'::jsonb THEN (action_status->>'spent')::integer+1 ELSE NULL END,
   'availableAfter',CASE WHEN action_status->'tracked'='true'::jsonb THEN (action_status->>'available')::integer-1 ELSE NULL END))
 WHERE id=p_event_id RETURNING * INTO receipt;
 RETURN receipt;
END $$;
REVOKE ALL ON FUNCTION public.record_character_medical_standard_action(uuid,uuid,text) FROM PUBLIC,anon,authenticated;

-- Preserva o recibo das operações antigas e não altera sua assinatura pública.
ALTER FUNCTION public.confirm_character_paramedico(uuid,uuid,jsonb) RENAME TO confirm_character_paramedico_action_core;
REVOKE ALL ON FUNCTION public.confirm_character_paramedico_action_core(uuid,uuid,jsonb) FROM PUBLIC,anon,authenticated;
CREATE FUNCTION public.confirm_character_paramedico(p_operation_id uuid,p_character_id uuid,p_request jsonb)
RETURNS public.character_activity_events LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE receipt public.character_activity_events; existed boolean;
BEGIN
 IF p_operation_id IS NULL THEN RAISE EXCEPTION 'Operação obrigatória.' USING ERRCODE='22023'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_operation_id::text,0));
 PERFORM public.lock_character_pe_turn(p_character_id);
 SELECT EXISTS(SELECT 1 FROM public.character_activity_events WHERE operation_id=p_operation_id) INTO existed;
 receipt:=public.confirm_character_paramedico_action_core(p_operation_id,p_character_id,p_request);
 IF existed THEN RETURN receipt; END IF;
 RETURN public.record_character_medical_standard_action(receipt.id,p_character_id,'paramedico');
END $$;
REVOKE ALL ON FUNCTION public.confirm_character_paramedico(uuid,uuid,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.confirm_character_paramedico(uuid,uuid,jsonb) TO authenticated;

ALTER FUNCTION public.confirm_character_equipe_trauma(uuid,uuid,jsonb) RENAME TO confirm_character_equipe_trauma_action_core;
REVOKE ALL ON FUNCTION public.confirm_character_equipe_trauma_action_core(uuid,uuid,jsonb) FROM PUBLIC,anon,authenticated;
CREATE FUNCTION public.confirm_character_equipe_trauma(p_operation_id uuid,p_character_id uuid,p_request jsonb)
RETURNS public.character_activity_events LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE receipt public.character_activity_events; existed boolean;
BEGIN
 IF p_operation_id IS NULL THEN RAISE EXCEPTION 'Operação obrigatória.' USING ERRCODE='22023'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_operation_id::text,0));
 PERFORM public.lock_character_pe_turn(p_character_id);
 SELECT EXISTS(SELECT 1 FROM public.character_activity_events WHERE operation_id=p_operation_id) INTO existed;
 receipt:=public.confirm_character_equipe_trauma_action_core(p_operation_id,p_character_id,p_request);
 IF existed THEN RETURN receipt; END IF;
 RETURN public.record_character_medical_standard_action(receipt.id,p_character_id,'equipe_trauma');
END $$;
REVOKE ALL ON FUNCTION public.confirm_character_equipe_trauma(uuid,uuid,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.confirm_character_equipe_trauma(uuid,uuid,jsonb) TO authenticated;

-- Uma ação adicional depende de confirmação do mestre do combate. O motivo
-- fica no histórico; este RPC não presume nem cria uma habilidade na ficha.
CREATE FUNCTION public.confirm_character_medical_extra_action(p_operation_id uuid,p_campaign_id uuid,
 p_character_id uuid,p_expected_turn_key text,p_source_name text)
RETURNS public.character_activity_events LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE receipt public.character_activity_events; status jsonb; fingerprint text; source_name text;
BEGIN
 IF p_operation_id IS NULL OR p_campaign_id IS NULL OR p_character_id IS NULL
  OR p_expected_turn_key IS NULL OR length(p_expected_turn_key)>120 THEN
  RAISE EXCEPTION 'Confirmação incompleta.' USING ERRCODE='22023'; END IF;
 source_name:=trim(p_source_name);
 IF source_name IS NULL OR length(source_name) NOT BETWEEN 3 AND 120 THEN
  RAISE EXCEPTION 'Informe a origem da ação padrão adicional.' USING ERRCODE='22023'; END IF;
 IF NOT public.is_campaign_master_v2(auth.uid(),p_campaign_id) THEN
  RAISE EXCEPTION 'Somente o mestre da campanha pode confirmar ação extra.' USING ERRCODE='42501'; END IF;
 fingerprint:=md5(jsonb_build_array('medical-extra-action',p_campaign_id,p_character_id,p_expected_turn_key,source_name)::text);
 PERFORM pg_advisory_xact_lock(hashtextextended(p_operation_id::text,0));
 PERFORM public.lock_character_pe_turn(p_character_id);
 SELECT * INTO receipt FROM public.character_activity_events WHERE operation_id=p_operation_id;
 IF FOUND THEN
  IF receipt.author_id<>auth.uid() OR receipt.request_hash<>fingerprint THEN
   RAISE EXCEPTION 'Operação reutilizada.' USING ERRCODE='23505'; END IF;
  RETURN receipt;
 END IF;
 status:=public.get_character_medical_action_status(p_character_id);
 IF status->'tracked' IS DISTINCT FROM 'true'::jsonb OR status->'eligible' IS DISTINCT FROM 'true'::jsonb
  OR status->>'turnKey' IS DISTINCT FROM p_expected_turn_key
  OR NOT EXISTS(SELECT 1 FROM public.campaign_combat_state_v2 combat
   WHERE combat.campaign_id=p_campaign_id AND combat.state->'active'='true'::jsonb
    AND combat.turn_instance_id::text=replace(p_expected_turn_key,'combat:','')) THEN
  RAISE EXCEPTION 'Turno de combate mudou. Atualize antes de confirmar.' USING ERRCODE='40001'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.campaign_members_v2 member JOIN public.characters target
  ON target.id=member.character_id AND target.user_id=member.user_id
  WHERE member.campaign_id=p_campaign_id AND target.id=p_character_id) THEN
  RAISE EXCEPTION 'Ficha não vinculada a esta campanha.' USING ERRCODE='42501'; END IF;
 INSERT INTO public.character_activity_events(id,operation_id,character_id,author_id,category,status,payload,request_hash,campaign_id,campaign_version)
 VALUES(p_operation_id,p_operation_id,p_character_id,auth.uid(),'application','confirmed',
  jsonb_build_object('kind','medical_extra_action','sourceName',source_name,'turnKey',p_expected_turn_key,
   'availableAfter',(status->>'available')::integer+1,'masterConfirmed',true),fingerprint,p_campaign_id,'v2')
 RETURNING * INTO receipt;
 INSERT INTO public.character_medical_extra_actions(operation_id,character_id,turn_key,source_name)
 VALUES(receipt.id,p_character_id,p_expected_turn_key,source_name);
 RETURN receipt;
END $$;
REVOKE ALL ON FUNCTION public.confirm_character_medical_extra_action(uuid,uuid,uuid,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.confirm_character_medical_extra_action(uuid,uuid,uuid,text,text) TO authenticated;
