-- Livro Base v1.3, pp. 84-86: Preparar consome ação padrão no próprio
-- turno. A ação declarada pode ser padrão, de movimento ou livre; o gatilho
-- precisa ocorrer antes do próximo turno do ator e a execução usa reação.
-- Este contrato registra confirmação manual da mesa, sem aplicar ataque,
-- ritual, PE ou dano automaticamente.
ALTER TABLE public.character_combat_actions
 DROP CONSTRAINT character_combat_actions_source_check;
ALTER TABLE public.character_combat_actions
 ADD CONSTRAINT character_combat_actions_source_check
 CHECK (source IN ('attack','ritual','mirar','prepare'));

CREATE TABLE public.character_prepared_actions_v2 (
 operation_id uuid PRIMARY KEY REFERENCES public.character_activity_events(id) ON DELETE CASCADE,
 campaign_id uuid NOT NULL REFERENCES public.campaigns_v2(id) ON DELETE CASCADE,
 character_id uuid NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
 scene_number integer NOT NULL CHECK (scene_number>0),
 round_number integer NOT NULL CHECK (round_number>0),
 source_turn_instance_id uuid NOT NULL,
 declared_kind text NOT NULL CHECK (declared_kind IN ('standard','movement','free')),
 action_description text NOT NULL CHECK (length(action_description) BETWEEN 1 AND 500),
 trigger_description text NOT NULL CHECK (length(trigger_description) BETWEEN 1 AND 500),
 status text NOT NULL DEFAULT 'pending'
  CHECK (status IN ('pending','triggered','expired','cancelled')),
 trigger_operation_id uuid UNIQUE REFERENCES public.character_activity_events(id),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX character_prepared_actions_campaign_idx
 ON public.character_prepared_actions_v2(campaign_id,status,scene_number,round_number);
ALTER TABLE public.character_prepared_actions_v2 ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Membros acompanham acoes preparadas" ON public.character_prepared_actions_v2
 FOR SELECT TO authenticated USING (
  public.is_campaign_member_v2(auth.uid(),campaign_id)
  OR public.is_campaign_master_v2(auth.uid(),campaign_id));
REVOKE ALL ON public.character_prepared_actions_v2 FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.character_prepared_actions_v2 TO authenticated;
ALTER PUBLICATION supabase_realtime ADD TABLE public.character_prepared_actions_v2;

-- Reordenar iniciativa sem trocar quem age não cria outro turno nem renova PE.
-- A identidade continua rotacionando em troca de ator, rodada, cena ou estado.
CREATE OR REPLACE FUNCTION public.rotate_combat_turn_instance()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE old_actor text; new_actor text;
BEGIN
 old_actor:=OLD.state->'combatants'->((OLD.state->>'currentTurnIndex')::integer)->>'id';
 new_actor:=NEW.state->'combatants'->((NEW.state->>'currentTurnIndex')::integer)->>'id';
 IF OLD.scene_number IS DISTINCT FROM NEW.scene_number
  OR OLD.state->'active' IS DISTINCT FROM NEW.state->'active'
  OR OLD.state->'round' IS DISTINCT FROM NEW.state->'round'
  OR old_actor IS DISTINCT FROM new_actor THEN
  NEW.turn_instance_id:=gen_random_uuid();
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.rotate_combat_turn_instance() FROM PUBLIC,anon,authenticated;

-- Ao entrar o próximo turno do personagem (ou encerrar cena/combate), a
-- preparação não usada expira sem reembolso: a ação padrão já foi usada.
CREATE FUNCTION public.expire_character_prepared_actions_v2()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE actor text;
BEGIN
 actor:=NEW.state->'combatants'->((NEW.state->>'currentTurnIndex')::integer)->>'id';
 UPDATE public.character_prepared_actions_v2 SET status='expired'
 WHERE campaign_id=NEW.campaign_id AND status='pending'
  AND (NEW.state->'active' IS DISTINCT FROM 'true'::jsonb
   OR scene_number<>NEW.scene_number
   OR (character_id::text=actor AND source_turn_instance_id<>NEW.turn_instance_id)
   OR NOT EXISTS(SELECT 1 FROM jsonb_array_elements(coalesce(NEW.state->'combatants','[]'::jsonb)) participant
    WHERE participant->>'id'=character_id::text));
 RETURN NEW;
END $$;
CREATE TRIGGER expire_character_prepared_actions_v2
 AFTER UPDATE OF state,scene_number ON public.campaign_combat_state_v2
 FOR EACH ROW EXECUTE FUNCTION public.expire_character_prepared_actions_v2();
REVOKE ALL ON FUNCTION public.expire_character_prepared_actions_v2() FROM PUBLIC,anon,authenticated;

-- O recibo ocupa o mesmo slot padrão compartilhado por ataque, ritual e cura.
-- Gatilho e ação declarada são descrições da mesa, não autorização para
-- executar uma segunda RPC de ataque ou ignorar custos/requisitos.
CREATE FUNCTION public.prepare_character_action_v2(
 p_operation_id uuid,p_campaign_id uuid,p_character_id uuid,p_expected_scene integer,
 p_expected_round integer,p_expected_turn_instance_id uuid,p_declared_kind text,
 p_action_description text,p_trigger_description text)
RETURNS public.character_activity_events
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE combat public.campaign_combat_state_v2; receipt public.character_activity_events;
 status jsonb; fingerprint text; action_text text; trigger_text text;
BEGIN
 action_text:=trim(coalesce(p_action_description,''));
 trigger_text:=trim(coalesce(p_trigger_description,''));
 IF p_operation_id IS NULL OR p_campaign_id IS NULL OR p_character_id IS NULL
  OR p_expected_scene IS NULL OR p_expected_scene<1 OR p_expected_round IS NULL
  OR p_expected_round<1 OR p_expected_turn_instance_id IS NULL
  OR p_declared_kind IS NULL OR p_declared_kind NOT IN ('standard','movement','free')
  OR length(action_text) NOT BETWEEN 1 AND 500
  OR length(trigger_text) NOT BETWEEN 1 AND 500 THEN
  RAISE EXCEPTION 'Ação preparada incompleta.' USING ERRCODE='22023'; END IF;
 IF NOT public.can_manage_character_activity(p_character_id) THEN
  RAISE EXCEPTION 'Ficha não autorizada.' USING ERRCODE='42501'; END IF;
 fingerprint:=md5(jsonb_build_array('prepare-action-v2',p_campaign_id,p_character_id,
  p_expected_scene,p_expected_round,p_expected_turn_instance_id,p_declared_kind,
  action_text,trigger_text)::text);
 PERFORM pg_advisory_xact_lock(hashtextextended(p_operation_id::text,0));
 SELECT * INTO receipt FROM public.character_activity_events WHERE operation_id=p_operation_id;
 IF FOUND THEN
  IF receipt.author_id<>auth.uid() OR receipt.request_hash<>fingerprint
   OR receipt.payload->>'kind'<>'prepared_action' THEN
   RAISE EXCEPTION 'Operação reutilizada.' USING ERRCODE='23505'; END IF;
  RETURN receipt; END IF;
 SELECT * INTO combat FROM public.campaign_combat_state_v2
  WHERE campaign_id=p_campaign_id FOR UPDATE;
 IF NOT FOUND OR combat.state->'active' IS DISTINCT FROM 'true'::jsonb
  OR combat.scene_number<>p_expected_scene
  OR (combat.state->>'round')::integer<>p_expected_round
  OR combat.turn_instance_id<>p_expected_turn_instance_id
  OR combat.state->'combatants'->((combat.state->>'currentTurnIndex')::integer)->>'id'
   IS DISTINCT FROM p_character_id::text THEN
  RAISE EXCEPTION 'Ação Preparar exige o próprio turno vigente.' USING ERRCODE='40001'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.campaign_members_v2 member
  JOIN public.characters ficha ON ficha.id=member.character_id AND ficha.user_id=member.user_id
  WHERE member.campaign_id=p_campaign_id AND ficha.id=p_character_id) THEN
  RAISE EXCEPTION 'Ficha não vinculada à campanha.' USING ERRCODE='42501'; END IF;
 status:=public.get_character_turn_action_status(p_character_id);
 IF status->'eligible' IS DISTINCT FROM 'true'::jsonb
  OR (status->>'available')::integer<1 THEN
  RAISE EXCEPTION 'Ação padrão indisponível. Nenhum recurso foi gasto.' USING ERRCODE='55004'; END IF;
 INSERT INTO public.character_activity_events
  (id,operation_id,character_id,author_id,category,status,payload,request_hash,
   campaign_id,campaign_version)
 VALUES(p_operation_id,p_operation_id,p_character_id,auth.uid(),'application','confirmed',
  jsonb_build_object('kind','prepared_action','declaredKind',p_declared_kind,
   'actionDescription',action_text,'triggerDescription',trigger_text,
   'scene',p_expected_scene,'round',p_expected_round,
   'sourceTurnInstanceId',p_expected_turn_instance_id,
   'resolution','pending_trigger','effectApplied',false,'peApplied',false),
  fingerprint,p_campaign_id,'v2') RETURNING * INTO receipt;
 INSERT INTO public.character_combat_actions
  (operation_id,character_id,turn_key,action_kind,source)
 VALUES(receipt.id,p_character_id,'combat:'||p_expected_turn_instance_id::text,
  'standard','prepare');
 INSERT INTO public.character_prepared_actions_v2
  (operation_id,campaign_id,character_id,scene_number,round_number,
   source_turn_instance_id,declared_kind,action_description,trigger_description)
 VALUES(receipt.id,p_campaign_id,p_character_id,p_expected_scene,p_expected_round,
  p_expected_turn_instance_id,p_declared_kind,action_text,trigger_text);
 RETURN receipt;
END $$;
REVOKE ALL ON FUNCTION public.prepare_character_action_v2(uuid,uuid,uuid,integer,integer,uuid,text,text,text)
 FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.prepare_character_action_v2(uuid,uuid,uuid,integer,integer,uuid,text,text,text)
 TO authenticated;

-- O mestre confirma que a ação foi executada manualmente como reação.
-- A RPC altera apenas iniciativa e histórico: PE, dano e efeitos exigem
-- suas confirmações próprias; não cria ataque ou ritual fora do turno.
CREATE FUNCTION public.trigger_character_prepared_action_v2(
 p_operation_id uuid,p_prepared_id uuid,p_expected_scene integer,p_expected_round integer,
 p_expected_turn_instance_id uuid,p_trigger_note text)
RETURNS public.character_activity_events
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE prepared public.character_prepared_actions_v2;
 combat public.campaign_combat_state_v2; receipt public.character_activity_events;
 fingerprint text; note text; current_actor text; actor_entry jsonb;
 current_initiative integer; new_entries jsonb:='[]'::jsonb;
 entry jsonb; new_current_index integer:=0; counter integer:=0; new_state jsonb;
BEGIN
 note:=trim(coalesce(p_trigger_note,''));
 IF p_operation_id IS NULL OR p_prepared_id IS NULL OR p_expected_scene IS NULL
  OR p_expected_round IS NULL OR p_expected_turn_instance_id IS NULL
  OR length(note) NOT BETWEEN 1 AND 500 THEN
  RAISE EXCEPTION 'Confirme o gatilho e a execução manual.' USING ERRCODE='22023'; END IF;
 SELECT * INTO prepared FROM public.character_prepared_actions_v2
  WHERE operation_id=p_prepared_id;
 IF NOT FOUND OR NOT public.is_campaign_master_v2(auth.uid(),prepared.campaign_id) THEN
  RAISE EXCEPTION 'Somente o mestre confirma a ação preparada.' USING ERRCODE='42501'; END IF;
 fingerprint:=md5(jsonb_build_array('trigger-prepared-action-v2',p_prepared_id,
  p_expected_scene,p_expected_round,p_expected_turn_instance_id,note)::text);
 PERFORM pg_advisory_xact_lock(hashtextextended(p_operation_id::text,0));
 SELECT * INTO receipt FROM public.character_activity_events WHERE operation_id=p_operation_id;
 IF FOUND THEN
  IF receipt.author_id<>auth.uid() OR receipt.request_hash<>fingerprint
   OR receipt.payload->>'kind'<>'prepared_action_trigger' THEN
   RAISE EXCEPTION 'Operação reutilizada.' USING ERRCODE='23505'; END IF;
  RETURN receipt; END IF;
 SELECT * INTO combat FROM public.campaign_combat_state_v2
  WHERE campaign_id=prepared.campaign_id FOR UPDATE;
 SELECT * INTO prepared FROM public.character_prepared_actions_v2
  WHERE operation_id=p_prepared_id FOR UPDATE;
 current_actor:=combat.state->'combatants'->((combat.state->>'currentTurnIndex')::integer)->>'id';
 IF prepared.status<>'pending' OR combat.state->'active' IS DISTINCT FROM 'true'::jsonb
  OR combat.scene_number<>p_expected_scene OR combat.scene_number<>prepared.scene_number
  OR (combat.state->>'round')::integer<>p_expected_round
  OR combat.turn_instance_id<>p_expected_turn_instance_id
  OR combat.turn_instance_id=prepared.source_turn_instance_id
  OR current_actor IS NULL OR current_actor=prepared.character_id::text THEN
  RAISE EXCEPTION 'Gatilho fora da janela da ação preparada.' USING ERRCODE='40001'; END IF;
 SELECT participant INTO actor_entry FROM jsonb_array_elements(combat.state->'combatants') participant
  WHERE participant->>'id'=prepared.character_id::text;
 IF actor_entry IS NULL THEN
  RAISE EXCEPTION 'Ator preparado saiu do combate.' USING ERRCODE='55004'; END IF;
 current_initiative:=(combat.state->'combatants'->
  ((combat.state->>'currentTurnIndex')::integer)->>'initiative')::integer;
 -- O empate numérico preserva a ordem do array: ator imediatamente antes
 -- do turno onde reagiu. Não desloca o ator que está agindo agora.
 FOR entry IN SELECT value FROM jsonb_array_elements(combat.state->'combatants') LOOP
  IF entry->>'id'=prepared.character_id::text THEN CONTINUE; END IF;
  IF entry->>'id'=current_actor THEN
   new_entries:=new_entries||jsonb_build_array(
    jsonb_set(actor_entry,'{initiative}',to_jsonb(current_initiative)));
   counter:=counter+1;
   new_current_index:=counter;
  END IF;
  new_entries:=new_entries||jsonb_build_array(entry);
  counter:=counter+1;
 END LOOP;
 new_state:=jsonb_set(jsonb_set(combat.state,'{combatants}',new_entries),
  '{currentTurnIndex}',to_jsonb(new_current_index));
 UPDATE public.campaign_combat_state_v2
  SET state=new_state,revision=revision+1,updated_at=clock_timestamp()
  WHERE campaign_id=prepared.campaign_id;
 INSERT INTO public.character_activity_events
  (id,operation_id,character_id,author_id,category,status,payload,request_hash,
   campaign_id,campaign_version)
 VALUES(p_operation_id,p_operation_id,prepared.character_id,auth.uid(),
  'application','confirmed',jsonb_build_object('kind','prepared_action_trigger',
   'preparedActionId',p_prepared_id,'declaredKind',prepared.declared_kind,
   'actionDescription',prepared.action_description,
   'triggerDescription',prepared.trigger_description,'triggerNote',note,
   'scene',p_expected_scene,'round',p_expected_round,
   'reactionConfirmedByMaster',true,'executionMode','manual',
   'effectApplied',false,'peApplied',false,'manualEffectReviewRequired',true,
   'initiativeChanged',true,'currentActorId',current_actor),
  fingerprint,prepared.campaign_id,'v2') RETURNING * INTO receipt;
 UPDATE public.character_prepared_actions_v2
  SET status='triggered',trigger_operation_id=receipt.id
  WHERE operation_id=p_prepared_id;
 UPDATE public.character_activity_events
  SET payload=payload||jsonb_build_object('resolution','master_confirmed_manual_trigger',
   'triggerOperationId',receipt.id)
  WHERE id=p_prepared_id;
 RETURN receipt;
END $$;
REVOKE ALL ON FUNCTION public.trigger_character_prepared_action_v2(uuid,uuid,integer,integer,uuid,text)
 FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.trigger_character_prepared_action_v2(uuid,uuid,integer,integer,uuid,text)
 TO authenticated;
