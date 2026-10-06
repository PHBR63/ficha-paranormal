-- Decisão da mesa: encerrar combate encerra a cena; fora de combate o mestre
-- encerra manualmente. Não expira efeitos antigos sem origem/duração segura.
ALTER TABLE public.campaign_combat_state_v2
  ADD COLUMN scene_number integer NOT NULL DEFAULT 1 CHECK (scene_number > 0),
  ADD COLUMN last_scene_ended_at timestamptz;

-- Recibos imutáveis permitem repetir uma requisição cuja resposta se perdeu.
CREATE TABLE public.campaign_scene_events_v2 (
  operation_id uuid PRIMARY KEY,
  campaign_id uuid NOT NULL REFERENCES public.campaigns_v2(id) ON DELETE CASCADE,
  author_id uuid NOT NULL,
  scene_number integer NOT NULL CHECK (scene_number > 0),
  ended_combat boolean NOT NULL,
  expected_revision integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  UNIQUE (campaign_id, scene_number)
);
ALTER TABLE public.campaign_scene_events_v2 ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Membros acompanham encerramentos de cena"
  ON public.campaign_scene_events_v2 FOR SELECT TO authenticated USING (
    public.is_campaign_member_v2(auth.uid(), campaign_id)
    OR public.is_campaign_master_v2(auth.uid(), campaign_id)
  );
REVOKE ALL ON public.campaign_scene_events_v2 FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.campaign_scene_events_v2 TO authenticated;

-- Mantém as validações/revisões do salvamento existente em auxiliar privado.
ALTER FUNCTION public.save_campaign_combat_v2(uuid, integer, jsonb)
  RENAME TO save_campaign_combat_state_core_v2;
REVOKE ALL ON FUNCTION public.save_campaign_combat_state_core_v2(uuid, integer, jsonb)
  FROM PUBLIC, anon, authenticated;

CREATE FUNCTION public.end_campaign_scene_v2(
  p_operation_id uuid, p_campaign_id uuid, p_expected_revision integer,
  p_end_combat boolean
) RETURNS SETOF public.campaign_combat_state_v2
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE combat public.campaign_combat_state_v2; receipt public.campaign_scene_events_v2;
  ended_at timestamptz := clock_timestamp();
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_campaign_master_v2(auth.uid(), p_campaign_id) THEN
    RAISE EXCEPTION 'Somente o mestre pode encerrar a cena.' USING ERRCODE = '42501';
  END IF;
  IF p_operation_id IS NULL OR p_expected_revision IS NULL OR p_expected_revision < 0 OR p_end_combat IS NULL THEN
    RAISE EXCEPTION 'Encerramento inválido.' USING ERRCODE = '22023';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(p_operation_id::text, 0));
  SELECT * INTO receipt FROM public.campaign_scene_events_v2 WHERE operation_id = p_operation_id;
  IF FOUND THEN
    IF receipt.campaign_id <> p_campaign_id OR receipt.author_id <> auth.uid()
      OR receipt.expected_revision <> p_expected_revision OR receipt.ended_combat <> p_end_combat THEN
      RAISE EXCEPTION 'ID de operação reutilizado.' USING ERRCODE = '23505';
    END IF;
    -- O retry confirma o recibo e devolve o estado atual, nunca reverte outra aba.
    RETURN QUERY SELECT * FROM public.campaign_combat_state_v2 WHERE campaign_id = p_campaign_id;
    RETURN;
  END IF;
  INSERT INTO public.campaign_combat_state_v2(campaign_id)
    VALUES (p_campaign_id) ON CONFLICT (campaign_id) DO NOTHING;
  SELECT * INTO combat FROM public.campaign_combat_state_v2 WHERE campaign_id = p_campaign_id FOR UPDATE;
  IF combat.revision <> p_expected_revision THEN
    RAISE EXCEPTION 'Cena atualizada por outra aba. Recarregue.' USING ERRCODE = '40001';
  END IF;
  IF (combat.state->>'active')::boolean IS DISTINCT FROM p_end_combat THEN
    RAISE EXCEPTION 'Confira se há combate ativo antes de encerrar a cena.' USING ERRCODE = '22023';
  END IF;
  INSERT INTO public.campaign_scene_events_v2(operation_id,campaign_id,author_id,scene_number,ended_combat,expected_revision,created_at)
    VALUES (p_operation_id,p_campaign_id,auth.uid(),combat.scene_number,p_end_combat,p_expected_revision,ended_at);
  -- Combate e limite da cena são confirmados na mesma transação. Nenhuma ficha,
  -- recurso, condição, contador crítico ou efeito sustentado é removido aqui.
  RETURN QUERY UPDATE public.campaign_combat_state_v2 AS current_combat
    SET state = CASE WHEN p_end_combat THEN '{"active":false,"round":1,"currentTurnIndex":0,"combatants":[]}'::jsonb ELSE current_combat.state END,
      revision = current_combat.revision + 1, scene_number = current_combat.scene_number + 1,
      last_scene_ended_at = ended_at, updated_at = ended_at
    WHERE campaign_id = p_campaign_id RETURNING current_combat.*;
END $$;
REVOKE ALL ON FUNCTION public.end_campaign_scene_v2(uuid,uuid,integer,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.end_campaign_scene_v2(uuid,uuid,integer,boolean) TO authenticated;

-- Clientes anteriores continuam compatíveis: a transição ativo -> inativo
-- também fecha uma cena. Reiniciar rodada/iniciativa não encerra a cena.
CREATE FUNCTION public.save_campaign_combat_v2(
  p_campaign_id uuid, p_expected_revision integer, p_state jsonb
) RETURNS SETOF public.campaign_combat_state_v2
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE previous public.campaign_combat_state_v2; saved public.campaign_combat_state_v2;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_campaign_master_v2(auth.uid(), p_campaign_id) THEN
    RAISE EXCEPTION 'Somente o mestre pode alterar o combate.' USING ERRCODE = '42501';
  END IF;
  INSERT INTO public.campaign_combat_state_v2(campaign_id)
    VALUES (p_campaign_id) ON CONFLICT (campaign_id) DO NOTHING;
  SELECT * INTO previous FROM public.campaign_combat_state_v2 WHERE campaign_id = p_campaign_id FOR UPDATE;
  -- Valida toda a entrada usando o contrato existente antes de tratar transições.
  SELECT * INTO saved FROM public.save_campaign_combat_state_core_v2(p_campaign_id,p_expected_revision,p_state);
  IF (previous.state->>'active')::boolean AND NOT (saved.state->>'active')::boolean THEN
    -- Reutiliza a revisão já confirmada; a segunda atualização é interna à mesma
    -- transação. O recibo registra o encerramento também nos clientes antigos.
    INSERT INTO public.campaign_scene_events_v2(operation_id,campaign_id,author_id,scene_number,ended_combat,expected_revision)
      VALUES (gen_random_uuid(),p_campaign_id,auth.uid(),previous.scene_number,true,p_expected_revision);
    UPDATE public.campaign_combat_state_v2 SET scene_number = scene_number + 1,
      last_scene_ended_at = clock_timestamp() WHERE campaign_id = p_campaign_id RETURNING * INTO saved;
  END IF;
  RETURN NEXT saved;
END $$;
REVOKE ALL ON FUNCTION public.save_campaign_combat_v2(uuid,integer,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.save_campaign_combat_v2(uuid,integer,jsonb) TO authenticated;
