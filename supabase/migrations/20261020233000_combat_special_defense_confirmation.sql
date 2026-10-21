-- Livro Base v1.3 p. 88: Bloqueio, Esquiva e Contra-ataque compartilham
-- uma única reação especial defensiva por personagem a cada rodada.
-- Este registro é uma confirmação do mestre; resolução de defesa/dano
-- permanece visível como pendente para a mesa.
CREATE TABLE public.character_special_defenses_v2 (
 operation_id uuid PRIMARY KEY REFERENCES public.character_activity_events(id) ON DELETE CASCADE,
 campaign_id uuid NOT NULL REFERENCES public.campaigns_v2(id) ON DELETE CASCADE,
 scene_number integer NOT NULL CHECK (scene_number>0),
 round_number integer NOT NULL CHECK (round_number>0),
 character_id uuid NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
 attack_event_id uuid NOT NULL REFERENCES public.character_activity_events(id),
 defense_type text NOT NULL CHECK (defense_type IN ('bloqueio','esquiva','contra_ataque')),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE (campaign_id,scene_number,round_number,character_id)
);
ALTER TABLE public.character_special_defenses_v2 ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.character_special_defenses_v2 FROM PUBLIC,anon,authenticated;

CREATE FUNCTION public.confirm_character_special_defense_v2(
 p_operation_id uuid,p_campaign_id uuid,p_character_id uuid,
 p_attack_event_id uuid,p_defense_type text,p_expected_scene integer,p_expected_round integer)
RETURNS public.character_activity_events
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE receipt public.character_activity_events;
 combat public.campaign_combat_state_v2; attack public.character_activity_events;
 fingerprint text;
BEGIN
 IF p_operation_id IS NULL OR p_campaign_id IS NULL OR p_character_id IS NULL
  OR p_attack_event_id IS NULL OR p_expected_scene IS NULL OR p_expected_round IS NULL
  OR p_defense_type IS NULL
  OR p_defense_type NOT IN ('bloqueio','esquiva','contra_ataque') THEN
  RAISE EXCEPTION 'Confirmação defensiva incompleta.' USING ERRCODE='22023'; END IF;
 IF NOT public.is_campaign_master_v2(auth.uid(),p_campaign_id) THEN
  RAISE EXCEPTION 'Somente o mestre confirma a defesa especial.' USING ERRCODE='42501'; END IF;
 fingerprint:=md5(jsonb_build_array('special-defense-v2',p_campaign_id,p_character_id,
  p_attack_event_id,p_defense_type,p_expected_scene,p_expected_round)::text);
 PERFORM pg_advisory_xact_lock(hashtextextended(p_operation_id::text,0));
 SELECT * INTO receipt FROM public.character_activity_events WHERE operation_id=p_operation_id;
 IF FOUND THEN
  IF receipt.author_id<>auth.uid() OR receipt.request_hash<>fingerprint THEN
   RAISE EXCEPTION 'Operação reutilizada.' USING ERRCODE='23505'; END IF;
  RETURN receipt;
 END IF;
 SELECT * INTO combat FROM public.campaign_combat_state_v2
  WHERE campaign_id=p_campaign_id FOR UPDATE;
 IF NOT FOUND OR combat.state->'active' IS DISTINCT FROM 'true'::jsonb
  OR combat.scene_number<>p_expected_scene
  OR (combat.state->>'round')::integer<>p_expected_round THEN
  RAISE EXCEPTION 'Cena ou rodada mudou. Atualize o combate.' USING ERRCODE='40001'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.campaign_members_v2 member
  JOIN public.characters defender ON defender.id=member.character_id
   AND defender.user_id=member.user_id
  WHERE member.campaign_id=p_campaign_id AND defender.id=p_character_id) THEN
  RAISE EXCEPTION 'Defensor não vinculado à campanha.' USING ERRCODE='42501'; END IF;
 SELECT * INTO attack FROM public.character_activity_events WHERE id=p_attack_event_id;
 IF NOT FOUND OR attack.category<>'roll' OR attack.status<>'confirmed'
  OR attack.payload->>'kind'<>'combat_attack' OR attack.character_id=p_character_id
  OR attack.payload#>>'{attackTurn,campaignId}' IS DISTINCT FROM p_campaign_id::text
  OR attack.payload#>>'{peBudget,campaignId}' IS DISTINCT FROM p_campaign_id::text
  OR attack.payload#>>'{peBudget,scene}' IS DISTINCT FROM p_expected_scene::text
  OR attack.payload#>>'{peBudget,round}' IS DISTINCT FROM p_expected_round::text
  OR NOT EXISTS(SELECT 1 FROM public.character_combat_actions action
   WHERE action.operation_id=attack.id AND action.source='attack'
    AND action.turn_key='combat:'||(attack.payload#>>'{attackTurn,turnInstanceId}')) THEN
  RAISE EXCEPTION 'Ataque confirmado nesta rodada não encontrado.' USING ERRCODE='22023'; END IF;
 IF EXISTS(SELECT 1 FROM public.character_special_defenses_v2 defense
  WHERE defense.campaign_id=p_campaign_id AND defense.scene_number=p_expected_scene
   AND defense.round_number=p_expected_round AND defense.character_id=p_character_id) THEN
  RAISE EXCEPTION 'Defesa especial já usada nesta rodada.' USING ERRCODE='55004'; END IF;
 INSERT INTO public.character_activity_events
  (id,operation_id,character_id,author_id,category,status,payload,request_hash,campaign_id,campaign_version)
 VALUES(p_operation_id,p_operation_id,p_character_id,auth.uid(),'application','confirmed',
  jsonb_build_object('kind','special_defense','defenseType',p_defense_type,
   'attackEventId',p_attack_event_id,'scene',p_expected_scene,'round',p_expected_round,
   'masterConfirmed',true,'resolution','mesa_pendente','effectApplied',false),
  fingerprint,p_campaign_id,'v2') RETURNING * INTO receipt;
 INSERT INTO public.character_special_defenses_v2
  (operation_id,campaign_id,scene_number,round_number,character_id,attack_event_id,defense_type)
 VALUES(receipt.id,p_campaign_id,p_expected_scene,p_expected_round,p_character_id,p_attack_event_id,p_defense_type);
 RETURN receipt;
END $$;
REVOKE ALL ON FUNCTION public.confirm_character_special_defense_v2(uuid,uuid,uuid,uuid,text,integer,integer)
 FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.confirm_character_special_defense_v2(uuid,uuid,uuid,uuid,text,integer,integer)
 TO authenticated;
