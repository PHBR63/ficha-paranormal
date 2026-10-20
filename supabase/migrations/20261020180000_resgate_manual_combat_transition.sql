-- Resgate (Livro Base v1.3, p. 31): o bônus de um turno manual termina
-- quando começa o próximo turno do médico, mesmo após entrar em combate.
-- Guarda somente o último início confirmado de combate por ficha.
CREATE TABLE public.character_combat_turn_starts (
 character_id uuid PRIMARY KEY REFERENCES public.characters(id) ON DELETE CASCADE,
 -- Preserva a expiração mesmo se a campanha de origem for excluída.
 campaign_id uuid NOT NULL,
 turn_instance_id uuid NOT NULL,
 started_at timestamptz NOT NULL
);
ALTER TABLE public.character_combat_turn_starts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.character_combat_turn_starts FROM PUBLIC,anon,authenticated;

-- A rotação da identidade do turno ocorre antes deste gatilho. Atualizações
-- de mapa/participantes sem novo turno não encerram o bônus prematuramente.
CREATE FUNCTION public.record_character_combat_turn_start()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE actor_id uuid; actor_key text;
BEGIN
 IF NEW.state->'active' IS DISTINCT FROM 'true'::jsonb
  OR (TG_OP='UPDATE' AND NEW.turn_instance_id=OLD.turn_instance_id) THEN
  RETURN NEW;
 END IF;
 actor_key:=NEW.state->'combatants'->((NEW.state->>'currentTurnIndex')::integer)->>'id';
 SELECT member.character_id INTO actor_id
 FROM public.campaign_members_v2 member
JOIN public.characters source ON source.id=member.character_id
  AND source.user_id=member.user_id
 WHERE member.campaign_id=NEW.campaign_id AND member.character_id::text=actor_key;
 IF actor_id IS NOT NULL THEN
  INSERT INTO public.character_combat_turn_starts(character_id,campaign_id,turn_instance_id,started_at)
  VALUES(actor_id,NEW.campaign_id,NEW.turn_instance_id,clock_timestamp())
  ON CONFLICT(character_id) DO UPDATE SET
   campaign_id=excluded.campaign_id,turn_instance_id=excluded.turn_instance_id,
   started_at=excluded.started_at
  WHERE public.character_combat_turn_starts.started_at<excluded.started_at;
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.record_character_combat_turn_start() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER record_character_combat_turn_start
AFTER INSERT OR UPDATE OF state,scene_number ON public.campaign_combat_state_v2
FOR EACH ROW EXECUTE FUNCTION public.record_character_combat_turn_start();

-- Sem reconstruir turnos históricos que não foram gravados: apenas o turno
-- ativo e comprovável no instante da migration pode ser recuperado.
INSERT INTO public.character_combat_turn_starts(character_id,campaign_id,turn_instance_id,started_at)
SELECT DISTINCT ON (member.character_id)
 member.character_id,combat.campaign_id,combat.turn_instance_id,combat.updated_at
FROM public.campaign_combat_state_v2 combat
JOIN public.campaign_members_v2 member ON member.campaign_id=combat.campaign_id
JOIN public.characters source ON source.id=member.character_id
 AND source.user_id=member.user_id
WHERE combat.state->'active'='true'::jsonb
 AND combat.state->'combatants'->((combat.state->>'currentTurnIndex')::integer)->>'id'=member.character_id::text
ORDER BY member.character_id,combat.updated_at DESC
ON CONFLICT(character_id) DO UPDATE SET
 campaign_id=excluded.campaign_id,turn_instance_id=excluded.turn_instance_id,
 started_at=excluded.started_at
WHERE public.character_combat_turn_starts.started_at<excluded.started_at;

CREATE OR REPLACE FUNCTION public.get_character_resgate_defense_status(p_character_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE grant_row record; combat public.campaign_combat_state_v2; manual_clock public.character_manual_turns;
 current_round integer; current_index integer; source_index integer; active_bonus boolean:=false;
BEGIN
 IF NOT public.can_manage_character_activity(p_character_id) THEN
  RAISE EXCEPTION 'Ficha não autorizada.' USING ERRCODE='42501'; END IF;
 FOR grant_row IN SELECT * FROM public.character_resgate_defense_grants
  WHERE source_character_id=p_character_id OR target_character_id=p_character_id
  ORDER BY created_at DESC LOOP
  IF grant_row.mode='manual' THEN
   SELECT * INTO manual_clock FROM public.character_manual_turns
    WHERE character_id=grant_row.source_character_id;
   -- Pausar conserva o bônus. Um novo turno manual ou o início de um turno
   -- de combate do médico o encerra para ambas as fichas.
   IF manual_clock.turn_number=grant_row.manual_turn_number
    AND NOT EXISTS(SELECT 1 FROM public.character_combat_turn_starts started
     WHERE started.character_id=grant_row.source_character_id
      AND started.started_at>grant_row.created_at) THEN
    active_bonus:=true;
   END IF;
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
