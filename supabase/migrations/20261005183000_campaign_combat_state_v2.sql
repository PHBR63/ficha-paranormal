-- Um estado por campanha v2. Nenhuma ficha ou campanha existente é reescrita.
CREATE TABLE public.campaign_combat_state_v2 (
  campaign_id uuid PRIMARY KEY REFERENCES public.campaigns_v2(id) ON DELETE CASCADE,
  revision integer NOT NULL DEFAULT 0 CHECK (revision >= 0),
  state jsonb NOT NULL DEFAULT '{"active":false,"round":1,"currentTurnIndex":0,"combatants":[]}'::jsonb
    CHECK (jsonb_typeof(state) = 'object'),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.campaign_combat_state_v2 ENABLE ROW LEVEL SECURITY;
-- Membros e mestre acompanham; a única gravação exposta é a RPC abaixo.
CREATE POLICY "Membros acompanham combate" ON public.campaign_combat_state_v2
FOR SELECT TO authenticated USING (
  public.is_campaign_member_v2(auth.uid(), campaign_id)
  OR public.is_campaign_master_v2(auth.uid(), campaign_id)
);
REVOKE ALL ON public.campaign_combat_state_v2 FROM anon, authenticated;
GRANT SELECT ON public.campaign_combat_state_v2 TO authenticated;

-- Revisão esperada impede que uma aba sobrescreva a alteração feita em outra.
-- SECURITY DEFINER é necessário pois não há escrita direta para authenticated.
-- A autorização é conferida explicitamente antes de qualquer INSERT/UPDATE.
CREATE FUNCTION public.save_campaign_combat_v2(
  p_campaign_id uuid, p_expected_revision integer, p_state jsonb
) RETURNS SETOF public.campaign_combat_state_v2
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_campaign_master_v2(auth.uid(), p_campaign_id) THEN
    RAISE EXCEPTION 'Somente o mestre pode alterar o combate.' USING ERRCODE = '42501';
  END IF;
  IF p_expected_revision IS NULL OR p_expected_revision < 0
    OR p_state IS NULL OR octet_length(p_state::text) > 65536
    OR jsonb_typeof(p_state) IS DISTINCT FROM 'object'
    OR jsonb_typeof(p_state->'active') IS DISTINCT FROM 'boolean'
    OR jsonb_typeof(p_state->'round') IS DISTINCT FROM 'number'
    OR jsonb_typeof(p_state->'currentTurnIndex') IS DISTINCT FROM 'number'
    OR jsonb_typeof(p_state->'combatants') IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'Estado de combate inválido.' USING ERRCODE = '22023';
  END IF;
  IF (p_state->>'round')::numeric < 1 OR (p_state->>'round')::numeric > 1000000
    OR (p_state->>'round')::numeric <> trunc((p_state->>'round')::numeric)
    OR (p_state->>'currentTurnIndex')::numeric < 0
    OR (p_state->>'currentTurnIndex')::numeric <> trunc((p_state->>'currentTurnIndex')::numeric)
    OR (p_state->>'currentTurnIndex')::numeric >= greatest(1, jsonb_array_length(p_state->'combatants'))
    OR jsonb_array_length(p_state->'combatants') > 100 THEN
    RAISE EXCEPTION 'Rodada, turno ou quantidade de participantes inválida.' USING ERRCODE = '22023';
  END IF;
  -- Valida o formato dos participantes também em chamadas fora da interface.
  IF EXISTS (
    SELECT 1 FROM jsonb_array_elements(p_state->'combatants') participant
    WHERE jsonb_typeof(participant) IS DISTINCT FROM 'object'
      OR jsonb_typeof(participant->'id') IS DISTINCT FROM 'string'
      OR length(participant->>'id') NOT BETWEEN 1 AND 100
      OR jsonb_typeof(participant->'name') IS DISTINCT FROM 'string'
      OR length(trim(participant->>'name')) NOT BETWEEN 1 AND 100
      OR jsonb_typeof(participant->'initiative') IS DISTINCT FROM 'number'
  ) THEN
    RAISE EXCEPTION 'Participante inválido.' USING ERRCODE = '22023';
  END IF;
  IF EXISTS (
    SELECT 1 FROM jsonb_array_elements(p_state->'combatants') participant
    WHERE (participant->>'initiative')::numeric NOT BETWEEN -1000 AND 1000
      OR (participant->>'initiative')::numeric <> trunc((participant->>'initiative')::numeric)
  ) OR (
    SELECT count(*) <> count(DISTINCT participant->>'id')
    FROM jsonb_array_elements(p_state->'combatants') participant
  ) THEN
    RAISE EXCEPTION 'Iniciativa inválida ou participantes duplicados.' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.campaign_combat_state_v2(campaign_id)
  VALUES(p_campaign_id) ON CONFLICT (campaign_id) DO NOTHING;

  RETURN QUERY UPDATE public.campaign_combat_state_v2 AS combat
    SET state = p_state, revision = combat.revision + 1, updated_at = now()
    WHERE combat.campaign_id = p_campaign_id AND combat.revision = p_expected_revision
    RETURNING combat.*;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Combate atualizado por outra aba. Recarregue o estado.' USING ERRCODE = '40001';
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.save_campaign_combat_v2(uuid, integer, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_campaign_combat_v2(uuid, integer, jsonb) TO authenticated;

-- Realtime entrega o estado confirmado; RLS restringe quem pode recebê-lo.
ALTER PUBLICATION supabase_realtime ADD TABLE public.campaign_combat_state_v2;
