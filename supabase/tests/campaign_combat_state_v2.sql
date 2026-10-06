-- Executar somente em banco de testes com as migrations aplicadas.
-- Todos os registros sintéticos ficam em uma transação revertida ao final.
BEGIN;
INSERT INTO public.campaigns_v2(id, master_id, name) VALUES
  ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000011', 'TESTE CODEX SQL');
INSERT INTO public.campaign_members_v2(campaign_id, user_id, role) VALUES
  ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000012', 'player');

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000011', true);
DO $$
DECLARE result public.campaign_combat_state_v2;
  initial jsonb := '{"active":true,"round":1,"currentTurnIndex":0,"combatants":[{"id":"npc-a","name":"NPC A","initiative":12}]}';
BEGIN
  SELECT * INTO result FROM public.save_campaign_combat_v2('00000000-0000-4000-8000-000000000001', 0, initial);
  IF result.revision <> 1 OR result.state <> initial THEN RAISE EXCEPTION 'Falha: gravação inicial'; END IF;
  BEGIN
    PERFORM public.save_campaign_combat_v2('00000000-0000-4000-8000-000000000001', 0, initial || '{"round":2}');
    RAISE EXCEPTION 'Falha: revisão antiga foi aceita';
  EXCEPTION WHEN serialization_failure THEN NULL; END;
  SELECT * INTO result FROM public.campaign_combat_state_v2 WHERE campaign_id = '00000000-0000-4000-8000-000000000001';
  IF result.revision <> 1 OR result.state->>'round' <> '1' THEN RAISE EXCEPTION 'Falha: conflito alterou o estado'; END IF;
  SELECT * INTO result FROM public.save_campaign_combat_v2('00000000-0000-4000-8000-000000000001', 1, initial || '{"round":2}');
  IF result.revision <> 2 OR result.state->>'round' <> '2' THEN RAISE EXCEPTION 'Falha: avanço persistido'; END IF;
  BEGIN
    PERFORM public.save_campaign_combat_v2('00000000-0000-4000-8000-000000000001', 2, initial || '{"currentTurnIndex":1}');
    RAISE EXCEPTION 'Falha: turno inválido aceito';
  EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
  BEGIN
    PERFORM public.save_campaign_combat_v2('00000000-0000-4000-8000-000000000001', 2, initial || '{"combatants":[{"id":"npc-a","name":"A","initiative":12},{"id":"npc-a","name":"B","initiative":10}]}');
    RAISE EXCEPTION 'Falha: participante duplicado aceito';
  EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
  BEGIN
    UPDATE public.campaign_combat_state_v2 SET revision = 99;
    RAISE EXCEPTION 'Falha: escrita direta permitida';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END;
$$;

-- Jogador acompanha, mas não altera turnos.
SELECT set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000012', true);
DO $$
BEGIN
  IF (SELECT count(*) FROM public.campaign_combat_state_v2) <> 1 THEN RAISE EXCEPTION 'Falha: jogador não lê'; END IF;
  BEGIN
    PERFORM public.save_campaign_combat_v2('00000000-0000-4000-8000-000000000001', 2, '{"active":false,"round":1,"currentTurnIndex":0,"combatants":[]}');
    RAISE EXCEPTION 'Falha: jogador alterou combate';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END;
$$;

-- Outro usuário não vê o registro e não pode gravar.
SELECT set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000013', true);
DO $$
BEGIN
  IF EXISTS(SELECT 1 FROM public.campaign_combat_state_v2) THEN RAISE EXCEPTION 'Falha: combate vazou entre campanhas'; END IF;
  BEGIN
    PERFORM public.save_campaign_combat_v2('00000000-0000-4000-8000-000000000001', 2, '{}');
    RAISE EXCEPTION 'Falha: estranho gravou combate';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END;
$$;

SET LOCAL ROLE anon;
DO $$ BEGIN
  BEGIN
    PERFORM * FROM public.campaign_combat_state_v2;
    RAISE EXCEPTION 'Falha: acesso anônimo ao combate';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END; $$;
ROLLBACK;
