-- Livro Base v1.3, p. 88: Bloqueio/Esquiva antecedem a rolagem;
-- Contra-ataque só é possível depois de um ataque corpo a corpo errado.
-- Intenções sem alvo seguem manuais; nenhum registro legado é reescrito.
CREATE TABLE public.campaign_attack_intents_v2 (
 operation_id uuid PRIMARY KEY,
 campaign_id uuid NOT NULL REFERENCES public.campaigns_v2(id) ON DELETE CASCADE,
 scene_number integer NOT NULL CHECK (scene_number>0),
 round_number integer NOT NULL CHECK (round_number>0),
 turn_instance_id uuid NOT NULL,
 attacker_id uuid NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
 target_id uuid NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
 weapon_id text NOT NULL CHECK (length(weapon_id) BETWEEN 1 AND 100),
 melee boolean NOT NULL,
 author_id uuid NOT NULL REFERENCES auth.users(id),
 request_hash text NOT NULL,
 status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','rolled','cancelled','expired')),
 attack_event_id uuid UNIQUE REFERENCES public.character_activity_events(id),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX campaign_attack_intents_round_idx
 ON public.campaign_attack_intents_v2(campaign_id,scene_number,round_number,status);
CREATE UNIQUE INDEX campaign_attack_intents_one_pending_turn_idx
 ON public.campaign_attack_intents_v2(campaign_id,attacker_id,turn_instance_id)
 WHERE status='pending';
ALTER TABLE public.campaign_attack_intents_v2 ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Membros veem intencoes de ataque" ON public.campaign_attack_intents_v2
 FOR SELECT TO authenticated USING (
  public.is_campaign_member_v2(auth.uid(),campaign_id)
  OR public.is_campaign_master_v2(auth.uid(),campaign_id));
REVOKE ALL ON public.campaign_attack_intents_v2 FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.campaign_attack_intents_v2 TO authenticated;

-- Uma escolha explícita da mesa também pode ser "nenhuma". A reserva não
-- gasta a defesa especial; ela só se torna um evento ao confirmar o ataque.
CREATE TABLE public.campaign_attack_defense_choices_v2 (
 operation_id uuid PRIMARY KEY,
 intent_id uuid NOT NULL UNIQUE REFERENCES public.campaign_attack_intents_v2(operation_id) ON DELETE CASCADE,
 defender_id uuid NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
 defense_type text NOT NULL CHECK (defense_type IN ('none','bloqueio','esquiva')),
 author_id uuid NOT NULL REFERENCES auth.users(id),
 request_hash text NOT NULL,
 attack_event_id uuid UNIQUE REFERENCES public.character_activity_events(id),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
ALTER TABLE public.campaign_attack_defense_choices_v2 ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Membros veem defesa declarada" ON public.campaign_attack_defense_choices_v2
 FOR SELECT TO authenticated USING (EXISTS (
  SELECT 1 FROM public.campaign_attack_intents_v2 intent
  WHERE intent.operation_id=intent_id AND (
   public.is_campaign_member_v2(auth.uid(),intent.campaign_id)
   OR public.is_campaign_master_v2(auth.uid(),intent.campaign_id))));
REVOKE ALL ON public.campaign_attack_defense_choices_v2 FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.campaign_attack_defense_choices_v2 TO authenticated;
-- Mestre e jogadores recebem a escolha confirmada no painel compartilhado.
ALTER PUBLICATION supabase_realtime ADD TABLE public.campaign_attack_intents_v2;
ALTER PUBLICATION supabase_realtime ADD TABLE public.campaign_attack_defense_choices_v2;

-- Um turno alterado no servidor encerra intenções pendentes e libera reservas.
-- O trigger de identidade de turno já executou antes deste AFTER UPDATE.
CREATE FUNCTION public.expire_campaign_attack_intents_v2()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 UPDATE public.campaign_attack_intents_v2 SET status='expired'
 WHERE campaign_id=NEW.campaign_id AND status='pending'
  AND (NEW.state->'active' IS DISTINCT FROM 'true'::jsonb
   OR scene_number<>NEW.scene_number
   OR round_number<>(NEW.state->>'round')::integer
   OR turn_instance_id<>NEW.turn_instance_id);
 RETURN NEW;
END $$;
CREATE TRIGGER expire_campaign_attack_intents_v2
 AFTER UPDATE OF state,scene_number ON public.campaign_combat_state_v2
 FOR EACH ROW EXECUTE FUNCTION public.expire_campaign_attack_intents_v2();
REVOKE ALL ON FUNCTION public.expire_campaign_attack_intents_v2() FROM PUBLIC,anon,authenticated;

-- Cancelamento de uma intenção ainda não rolada não apaga sua proveniência.
CREATE FUNCTION public.cancel_campaign_attack_intent_v2(p_intent_id uuid)
RETURNS public.campaign_attack_intents_v2
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE intent public.campaign_attack_intents_v2;
BEGIN
 IF p_intent_id IS NULL THEN RAISE EXCEPTION 'Intenção obrigatória.' USING ERRCODE='22023'; END IF;
 SELECT * INTO intent FROM public.campaign_attack_intents_v2 WHERE operation_id=p_intent_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'Intenção não encontrada.' USING ERRCODE='22023'; END IF;
 IF NOT public.can_manage_character_activity(intent.attacker_id)
  OR (auth.uid()<>intent.author_id
   AND NOT public.is_campaign_master_v2(auth.uid(),intent.campaign_id)) THEN
  RAISE EXCEPTION 'Intenção não autorizada.' USING ERRCODE='42501'; END IF;
 PERFORM 1 FROM public.campaign_combat_state_v2
  WHERE campaign_id=intent.campaign_id FOR UPDATE;
 SELECT * INTO intent FROM public.campaign_attack_intents_v2
  WHERE operation_id=p_intent_id FOR UPDATE;
 IF intent.status='rolled' THEN
  RAISE EXCEPTION 'Ataque já rolado não pode ser cancelado.' USING ERRCODE='55004'; END IF;
 IF intent.status='pending' THEN
  UPDATE public.campaign_attack_intents_v2 SET status='cancelled'
   WHERE operation_id=p_intent_id RETURNING * INTO intent;
 END IF;
 RETURN intent;
END $$;
REVOKE ALL ON FUNCTION public.cancel_campaign_attack_intent_v2(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.cancel_campaign_attack_intent_v2(uuid) TO authenticated;

-- Declaração prévia, sem rolar, gastar PE ou ocupar a ação padrão.
CREATE FUNCTION public.declare_campaign_attack_intent_v2(
 p_operation_id uuid,p_campaign_id uuid,p_attacker_id uuid,p_target_id uuid,
 p_weapon_id text,p_expected_scene integer,p_expected_round integer,p_expected_turn_instance_id uuid)
RETURNS public.campaign_attack_intents_v2
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE intent public.campaign_attack_intents_v2; combat public.campaign_combat_state_v2;
 attacker public.characters; weapon jsonb; fingerprint text; action_status jsonb;
 melee boolean;
BEGIN
 IF p_operation_id IS NULL OR p_campaign_id IS NULL OR p_attacker_id IS NULL
  OR p_target_id IS NULL OR p_attacker_id=p_target_id OR p_weapon_id IS NULL
  OR length(p_weapon_id) NOT BETWEEN 1 AND 100 OR p_expected_scene IS NULL
  OR p_expected_round IS NULL OR p_expected_turn_instance_id IS NULL THEN
  RAISE EXCEPTION 'Intenção de ataque incompleta.' USING ERRCODE='22023'; END IF;
 IF NOT public.can_manage_character_activity(p_attacker_id) THEN
  RAISE EXCEPTION 'Ficha atacante não autorizada.' USING ERRCODE='42501'; END IF;
 fingerprint:=md5(jsonb_build_array('attack-intent-v2',p_campaign_id,p_attacker_id,
  p_target_id,p_weapon_id,p_expected_scene,p_expected_round,p_expected_turn_instance_id)::text);
 PERFORM pg_advisory_xact_lock(hashtextextended(p_operation_id::text,0));
 SELECT * INTO intent FROM public.campaign_attack_intents_v2 WHERE operation_id=p_operation_id;
 IF FOUND THEN
  IF intent.author_id<>auth.uid() OR intent.request_hash<>fingerprint THEN
   RAISE EXCEPTION 'Operação reutilizada.' USING ERRCODE='23505'; END IF;
  RETURN intent; END IF;
 SELECT * INTO combat FROM public.campaign_combat_state_v2
  WHERE campaign_id=p_campaign_id FOR UPDATE;
 IF NOT FOUND OR combat.state->'active' IS DISTINCT FROM 'true'::jsonb
  OR combat.scene_number<>p_expected_scene
  OR (combat.state->>'round')::integer<>p_expected_round
  OR combat.turn_instance_id<>p_expected_turn_instance_id
  OR combat.state->'combatants'->((combat.state->>'currentTurnIndex')::integer)->>'id'
    IS DISTINCT FROM p_attacker_id::text THEN
  RAISE EXCEPTION 'Turno do atacante mudou. Atualize o combate.' USING ERRCODE='40001'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.campaign_members_v2 member
  JOIN public.characters ficha ON ficha.id=member.character_id AND ficha.user_id=member.user_id
  WHERE member.campaign_id=p_campaign_id AND ficha.id=p_attacker_id)
  OR NOT EXISTS(SELECT 1 FROM public.campaign_members_v2 member
  JOIN public.characters ficha ON ficha.id=member.character_id AND ficha.user_id=member.user_id
  WHERE member.campaign_id=p_campaign_id AND ficha.id=p_target_id) THEN
  RAISE EXCEPTION 'Atacante ou alvo fora desta campanha.' USING ERRCODE='42501'; END IF;
 SELECT * INTO attacker FROM public.characters WHERE id=p_attacker_id;
 SELECT item INTO weapon FROM jsonb_array_elements(coalesce(attacker.inventory,'[]'::jsonb)) item
  WHERE item->>'id'=p_weapon_id AND item->>'itemType'='weapon'
   AND item->'isEquipped'='true'::jsonb;
 IF weapon IS NULL THEN RAISE EXCEPTION 'Arma não equipada.' USING ERRCODE='22023'; END IF;
 melee:=lower(coalesce(weapon->>'weaponType',weapon->>'type',''))
  IN ('melee','corpo a corpo');
 action_status:=public.get_character_turn_action_status(p_attacker_id);
 IF action_status->'eligible' IS DISTINCT FROM 'true'::jsonb
  OR (action_status->>'available')::integer<1 THEN
  RAISE EXCEPTION 'Ação padrão indisponível neste turno.' USING ERRCODE='55004'; END IF;
 INSERT INTO public.campaign_attack_intents_v2
  (operation_id,campaign_id,scene_number,round_number,turn_instance_id,
   attacker_id,target_id,weapon_id,melee,author_id,request_hash)
 VALUES(p_operation_id,p_campaign_id,p_expected_scene,p_expected_round,
  p_expected_turn_instance_id,p_attacker_id,p_target_id,p_weapon_id,melee,auth.uid(),fingerprint)
 RETURNING * INTO intent;
 RETURN intent;
END $$;
REVOKE ALL ON FUNCTION public.declare_campaign_attack_intent_v2(uuid,uuid,uuid,uuid,text,integer,integer,uuid)
 FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.declare_campaign_attack_intent_v2(uuid,uuid,uuid,uuid,text,integer,integer,uuid)
 TO authenticated;

-- A escolha do mestre antecede os dados. Bloqueio exige Fortitude treinada;
-- Esquiva exige Reflexos treinados. Apenas Bloqueio exige ataque corpo a corpo.
CREATE FUNCTION public.confirm_campaign_attack_defense_choice_v2(
 p_operation_id uuid,p_intent_id uuid,p_defense_type text)
RETURNS public.campaign_attack_defense_choices_v2
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE choice public.campaign_attack_defense_choices_v2;
 intent public.campaign_attack_intents_v2; combat public.campaign_combat_state_v2;
 defender public.characters; trained text; fingerprint text;
BEGIN
 IF p_operation_id IS NULL OR p_intent_id IS NULL OR p_defense_type IS NULL
  OR p_defense_type NOT IN ('none','bloqueio','esquiva') THEN
  RAISE EXCEPTION 'Escolha defensiva inválida.' USING ERRCODE='22023'; END IF;
 SELECT * INTO intent FROM public.campaign_attack_intents_v2 WHERE operation_id=p_intent_id;
 IF NOT FOUND OR NOT public.is_campaign_master_v2(auth.uid(),intent.campaign_id) THEN
  RAISE EXCEPTION 'Somente o mestre confirma a defesa.' USING ERRCODE='42501'; END IF;
 fingerprint:=md5(jsonb_build_array('pre-defense-v2',p_intent_id,p_defense_type)::text);
 PERFORM pg_advisory_xact_lock(hashtextextended(p_operation_id::text,0));
 SELECT * INTO choice FROM public.campaign_attack_defense_choices_v2 WHERE operation_id=p_operation_id;
 IF FOUND THEN
  IF choice.author_id<>auth.uid() OR choice.request_hash<>fingerprint THEN
   RAISE EXCEPTION 'Operação reutilizada.' USING ERRCODE='23505'; END IF;
  RETURN choice; END IF;
 SELECT * INTO combat FROM public.campaign_combat_state_v2
  WHERE campaign_id=intent.campaign_id FOR UPDATE;
 SELECT * INTO intent FROM public.campaign_attack_intents_v2
  WHERE operation_id=p_intent_id FOR UPDATE;
 IF intent.status<>'pending' OR combat.state->'active' IS DISTINCT FROM 'true'::jsonb
  OR combat.scene_number<>intent.scene_number
  OR (combat.state->>'round')::integer<>intent.round_number
  OR combat.turn_instance_id<>intent.turn_instance_id THEN
  RAISE EXCEPTION 'A intenção de ataque expirou.' USING ERRCODE='40001'; END IF;
 IF EXISTS(SELECT 1 FROM public.campaign_attack_defense_choices_v2
  WHERE intent_id=p_intent_id) THEN
  RAISE EXCEPTION 'A defesa desta intenção já foi escolhida.' USING ERRCODE='55004'; END IF;
 IF p_defense_type<>'none' THEN
  IF p_defense_type='bloqueio' AND NOT intent.melee THEN
   RAISE EXCEPTION 'Bloqueio exige ataque corpo a corpo.' USING ERRCODE='55004'; END IF;
  SELECT * INTO defender FROM public.characters WHERE id=intent.target_id;
  trained:=CASE p_defense_type WHEN 'bloqueio' THEN defender.skills->>'fortitude'
   ELSE defender.skills->>'reflexos' END;
  IF trained IS NULL OR trained !~ '^[0-9]+$' OR trained::integer<1 THEN
   RAISE EXCEPTION 'Defensor não treinado para esta defesa.' USING ERRCODE='55004'; END IF;
  IF EXISTS(SELECT 1 FROM public.character_special_defenses_v2 used
   WHERE used.campaign_id=intent.campaign_id AND used.scene_number=intent.scene_number
    AND used.round_number=intent.round_number AND used.character_id=intent.target_id)
   OR EXISTS(SELECT 1 FROM public.campaign_attack_defense_choices_v2 reserved
    JOIN public.campaign_attack_intents_v2 other ON other.operation_id=reserved.intent_id
    WHERE other.campaign_id=intent.campaign_id
     AND other.scene_number=intent.scene_number AND other.round_number=intent.round_number
     AND reserved.defender_id=intent.target_id AND reserved.defense_type<>'none'
     AND other.status='pending') THEN
   RAISE EXCEPTION 'Defesa especial já usada ou reservada nesta rodada.' USING ERRCODE='55004'; END IF;
 END IF;
 INSERT INTO public.campaign_attack_defense_choices_v2
  (operation_id,intent_id,defender_id,defense_type,author_id,request_hash)
 VALUES(p_operation_id,p_intent_id,intent.target_id,p_defense_type,auth.uid(),fingerprint)
 RETURNING * INTO choice;
 RETURN choice;
END $$;
REVOKE ALL ON FUNCTION public.confirm_campaign_attack_defense_choice_v2(uuid,uuid,text)
 FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.confirm_campaign_attack_defense_choice_v2(uuid,uuid,text)
 TO authenticated;

-- O ataque com alvo declarado só pode ser confirmado após a escolha defensiva.
-- A chamada existente continua a aceitar rolagens sem alvo para resolução manual.
ALTER FUNCTION public.confirm_character_combat_attack(uuid,uuid,integer,integer,text,jsonb,jsonb)
 RENAME TO confirm_character_combat_attack_pre_defense_core;
REVOKE ALL ON FUNCTION public.confirm_character_combat_attack_pre_defense_core(uuid,uuid,integer,integer,text,jsonb,jsonb)
 FROM PUBLIC,anon,authenticated;
CREATE FUNCTION public.confirm_character_combat_attack(
 p_operation_id uuid,p_character_id uuid,p_expected_pe integer,p_expected_cost integer,
 p_expected_turn_key text,p_selection jsonb,p_payload jsonb)
RETURNS public.character_activity_events
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE intent public.campaign_attack_intents_v2;
 choice public.campaign_attack_defense_choices_v2;
 combat public.campaign_combat_state_v2; receipt public.character_activity_events;
 intent_id uuid;
BEGIN
 IF p_selection ? 'targetCharacterId' OR p_selection ? 'attackIntentId' THEN
  IF jsonb_typeof(p_selection->'targetCharacterId')<>'string'
   OR jsonb_typeof(p_selection->'attackIntentId')<>'string'
   OR (p_selection->>'targetCharacterId') !~
    '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
   OR (p_selection->>'attackIntentId') !~
    '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN
   RAISE EXCEPTION 'Alvo declarado exige uma intenção de ataque válida.' USING ERRCODE='22023'; END IF;
  intent_id:=(p_selection->>'attackIntentId')::uuid;
  SELECT * INTO intent FROM public.campaign_attack_intents_v2
   WHERE operation_id=intent_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Intenção de ataque ausente.' USING ERRCODE='22023'; END IF;
  SELECT * INTO combat FROM public.campaign_combat_state_v2
   WHERE campaign_id=intent.campaign_id FOR UPDATE;
  SELECT * INTO intent FROM public.campaign_attack_intents_v2
   WHERE operation_id=intent_id FOR UPDATE;
  IF intent.attacker_id<>p_character_id OR intent.target_id::text<>p_selection->>'targetCharacterId'
   OR intent.weapon_id<>p_selection->>'weaponId' THEN
   RAISE EXCEPTION 'Intenção não corresponde ao ataque.' USING ERRCODE='22023'; END IF;
  IF intent.status='rolled' AND intent.attack_event_id=p_operation_id THEN
   RETURN public.confirm_character_combat_attack_pre_defense_core(
    p_operation_id,p_character_id,p_expected_pe,p_expected_cost,p_expected_turn_key,p_selection,p_payload);
  END IF;
  IF intent.status<>'pending' OR combat.state->'active' IS DISTINCT FROM 'true'::jsonb
   OR combat.scene_number<>intent.scene_number
   OR (combat.state->>'round')::integer<>intent.round_number
   OR combat.turn_instance_id<>intent.turn_instance_id THEN
   RAISE EXCEPTION 'Intenção expirada ou já utilizada.' USING ERRCODE='40001'; END IF;
  SELECT * INTO choice FROM public.campaign_attack_defense_choices_v2 choice_row
   WHERE choice_row.intent_id=intent.operation_id FOR UPDATE;
  IF NOT FOUND THEN
   RAISE EXCEPTION 'Aguarde escolha defensiva do mestre antes de rolar.' USING ERRCODE='55004'; END IF;
 END IF;
 receipt:=public.confirm_character_combat_attack_pre_defense_core(
  p_operation_id,p_character_id,p_expected_pe,p_expected_cost,p_expected_turn_key,p_selection,p_payload);
 IF intent_id IS NULL THEN RETURN receipt; END IF;
 UPDATE public.character_activity_events SET payload=payload||jsonb_build_object(
  'attackIntentId',intent_id,'declaredTargetId',intent.target_id)
 WHERE id=receipt.id RETURNING * INTO receipt;
 UPDATE public.campaign_attack_intents_v2 SET status='rolled',attack_event_id=receipt.id
  WHERE operation_id=intent_id;
 UPDATE public.campaign_attack_defense_choices_v2 SET attack_event_id=receipt.id
  WHERE operation_id=choice.operation_id;
 IF choice.defense_type<>'none' THEN
  INSERT INTO public.character_activity_events
   (id,operation_id,character_id,author_id,category,status,payload,request_hash,
    campaign_id,campaign_version)
  VALUES(choice.operation_id,choice.operation_id,intent.target_id,choice.author_id,
   'application','confirmed',jsonb_build_object('kind','special_defense',
    'defenseType',choice.defense_type,'attackEventId',receipt.id,
    'attackIntentId',intent_id,'scene',intent.scene_number,'round',intent.round_number,
    'masterConfirmed',true,'declaredBeforeRoll',true,'resolution','mesa_pendente',
    'effectApplied',false),choice.request_hash,intent.campaign_id,'v2');
  INSERT INTO public.character_special_defenses_v2
   (operation_id,campaign_id,scene_number,round_number,character_id,
    attack_event_id,defense_type)
  VALUES(choice.operation_id,intent.campaign_id,intent.scene_number,
   intent.round_number,intent.target_id,receipt.id,choice.defense_type);
 END IF;
 RETURN receipt;
END $$;
REVOKE ALL ON FUNCTION public.confirm_character_combat_attack(uuid,uuid,integer,integer,text,jsonb,jsonb)
 FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.confirm_character_combat_attack(uuid,uuid,integer,integer,text,jsonb,jsonb)
 TO authenticated;

-- A função antiga não pode mais aceitar defesas declaradas após o dado.
-- Contra-ataque aguarda a resolução do alvo com resultado de erro.
ALTER FUNCTION public.confirm_character_special_defense_v2(uuid,uuid,uuid,uuid,text,integer,integer)
 RENAME TO confirm_character_special_defense_pre_intent_core;
REVOKE ALL ON FUNCTION public.confirm_character_special_defense_pre_intent_core(uuid,uuid,uuid,uuid,text,integer,integer)
 FROM PUBLIC,anon,authenticated;
CREATE FUNCTION public.confirm_character_special_defense_v2(
 p_operation_id uuid,p_campaign_id uuid,p_character_id uuid,p_attack_event_id uuid,
 p_defense_type text,p_expected_scene integer,p_expected_round integer)
RETURNS public.character_activity_events
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE intent public.campaign_attack_intents_v2;
 resolution public.campaign_attack_target_resolutions_v2;
 defender public.characters; trained text; receipt public.character_activity_events;
BEGIN
 IF p_operation_id IS NULL OR p_campaign_id IS NULL OR p_character_id IS NULL
  OR p_attack_event_id IS NULL OR p_defense_type IS NULL THEN
  RAISE EXCEPTION 'Confirmação defensiva incompleta.' USING ERRCODE='22023'; END IF;
 IF p_defense_type<>'contra_ataque' THEN
  RAISE EXCEPTION 'Bloqueio e Esquiva devem ser declarados antes da rolagem.' USING ERRCODE='55004'; END IF;
 SELECT * INTO receipt FROM public.character_activity_events WHERE operation_id=p_operation_id;
 IF FOUND THEN
  RETURN public.confirm_character_special_defense_pre_intent_core(
   p_operation_id,p_campaign_id,p_character_id,p_attack_event_id,
   p_defense_type,p_expected_scene,p_expected_round); END IF;
 SELECT * INTO intent FROM public.campaign_attack_intents_v2
  WHERE attack_event_id=p_attack_event_id AND campaign_id=p_campaign_id
   AND target_id=p_character_id;
 SELECT * INTO resolution FROM public.campaign_attack_target_resolutions_v2
  WHERE attack_event_id=p_attack_event_id AND target_character_id=p_character_id
   AND campaign_id=p_campaign_id;
 IF NOT FOUND OR intent.operation_id IS NULL
  OR resolution.result->'hit' IS DISTINCT FROM 'false'::jsonb
  OR NOT intent.melee THEN
  RAISE EXCEPTION 'Contra-ataque exige ataque corpo a corpo errado e resolvido.' USING ERRCODE='55004'; END IF;
 SELECT * INTO defender FROM public.characters WHERE id=p_character_id;
 trained:=defender.skills->>'luta';
 IF trained IS NULL OR trained !~ '^[0-9]+$' OR trained::integer<1 THEN
  RAISE EXCEPTION 'Contra-ataque exige Luta treinada.' USING ERRCODE='55004'; END IF;
 receipt:=public.confirm_character_special_defense_pre_intent_core(
  p_operation_id,p_campaign_id,p_character_id,p_attack_event_id,
  p_defense_type,p_expected_scene,p_expected_round);
 UPDATE public.character_activity_events SET payload=payload||jsonb_build_object(
  'resolution','contra_ataque_pendente','effectApplied',false,
  'declaredAfterMiss',true)
 WHERE id=receipt.id RETURNING * INTO receipt;
 RETURN receipt;
END $$;
REVOKE ALL ON FUNCTION public.confirm_character_special_defense_v2(uuid,uuid,uuid,uuid,text,integer,integer)
 FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.confirm_character_special_defense_v2(uuid,uuid,uuid,uuid,text,integer,integer)
 TO authenticated;

-- A resolução automática de PV exige vínculo com a declaração prévia do alvo.
ALTER FUNCTION public.confirm_campaign_attack_target_v2(uuid,uuid,uuid,uuid,integer,integer,integer,jsonb)
 RENAME TO confirm_campaign_attack_target_pre_intent_core;
REVOKE ALL ON FUNCTION public.confirm_campaign_attack_target_pre_intent_core(uuid,uuid,uuid,uuid,integer,integer,integer,jsonb)
 FROM PUBLIC,anon,authenticated;
CREATE FUNCTION public.confirm_campaign_attack_target_v2(
 p_operation_id uuid,p_campaign_id uuid,p_attack_event_id uuid,p_target_character_id uuid,
 p_expected_hp integer,p_expected_scene integer,p_expected_round integer,p_resolution jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE intent public.campaign_attack_intents_v2;
 choice public.campaign_attack_defense_choices_v2;
 verified_result jsonb; special_id uuid;
BEGIN
 IF auth.uid() IS NULL OR NOT public.is_campaign_master_v2(auth.uid(),p_campaign_id) THEN
  RAISE EXCEPTION 'Somente o mestre resolve ataques contra alvos.' USING ERRCODE='42501'; END IF;
 SELECT * INTO intent FROM public.campaign_attack_intents_v2
  WHERE campaign_id=p_campaign_id AND attack_event_id=p_attack_event_id
   AND target_id=p_target_character_id AND status='rolled';
 IF NOT FOUND THEN
  RAISE EXCEPTION 'Aplicação em ficha exige alvo declarado antes da rolagem.' USING ERRCODE='55004'; END IF;
 verified_result:=public.confirm_campaign_attack_target_pre_intent_core(
  p_operation_id,p_campaign_id,p_attack_event_id,p_target_character_id,
  p_expected_hp,p_expected_scene,p_expected_round,p_resolution);
 -- A 34000 é conservadora e marca toda defesa como revisão retrospectiva.
 -- Aqui só corrigimos a proveniência quando há reserva pré-rolagem comprovada.
 IF p_resolution ? 'specialDefenseEventId'
  AND p_resolution->'specialDefenseEventId'<>'null'::jsonb THEN
  special_id:=(p_resolution->>'specialDefenseEventId')::uuid;
  SELECT * INTO choice FROM public.campaign_attack_defense_choices_v2
   WHERE operation_id=special_id AND intent_id=intent.operation_id
    AND attack_event_id=p_attack_event_id AND defense_type IN ('bloqueio','esquiva');
  IF FOUND AND choice.created_at<(
   SELECT created_at FROM public.character_activity_events WHERE id=p_attack_event_id) THEN
   verified_result:=verified_result||jsonb_build_object('timingVerifiedByServer',true,
    'specialDefenseReview','declared_before_roll');
   UPDATE public.campaign_attack_target_resolutions_v2
    SET result=verified_result WHERE operation_id=p_operation_id;
   UPDATE public.character_activity_events SET payload=payload||jsonb_build_object(
    'timingVerifiedByServer',true,'specialDefenseReview','declared_before_roll')
    WHERE id IN ((verified_result->>'targetEventId')::uuid,(verified_result->>'attackerEventId')::uuid);
   UPDATE public.character_activity_events SET payload=payload||jsonb_build_object(
    'timingVerifiedByServer',true,'applicationMode','pre_roll_defense',
    'resolution','mestre_confirmou_resultado') WHERE id=special_id;
  END IF;
 END IF;
 RETURN verified_result;
END $$;
REVOKE ALL ON FUNCTION public.confirm_campaign_attack_target_v2(uuid,uuid,uuid,uuid,integer,integer,integer,jsonb)
 FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.confirm_campaign_attack_target_v2(uuid,uuid,uuid,uuid,integer,integer,integer,jsonb)
 TO authenticated;
