-- Banco de testes com as migrations aplicadas; todos os dados são revertidos.
BEGIN;
INSERT INTO public.campaigns_v2(id,master_id,name) VALUES
 ('00000000-0000-4000-8000-000000000101','00000000-0000-4000-8000-000000000111','TESTE CENAS');
INSERT INTO public.campaign_members_v2(campaign_id,user_id,role) VALUES
 ('00000000-0000-4000-8000-000000000101','00000000-0000-4000-8000-000000000112','player');
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000111',true);
DO $$
DECLARE campaign uuid := '00000000-0000-4000-8000-000000000101';
 operation uuid := '00000000-0000-4000-8000-000000000121';
 result public.campaign_combat_state_v2;
 active_state jsonb := '{"active":true,"round":1,"currentTurnIndex":0,"combatants":[]}';
 empty_state jsonb := '{"active":false,"round":1,"currentTurnIndex":0,"combatants":[]}';
BEGIN
 SELECT * INTO result FROM public.end_campaign_scene_v2(operation,campaign,0,false);
 IF result.scene_number<>2 OR result.revision<>1 OR result.last_scene_ended_at IS NULL THEN RAISE EXCEPTION 'Manual não confirmou cena'; END IF;
 SELECT * INTO result FROM public.end_campaign_scene_v2(operation,campaign,0,false);
 IF result.scene_number<>2 OR result.revision<>1 OR (SELECT count(*) FROM public.campaign_scene_events_v2)<>1 THEN RAISE EXCEPTION 'Retry duplicou cena'; END IF;
 BEGIN
  PERFORM public.end_campaign_scene_v2(operation,campaign,1,false);
  RAISE EXCEPTION 'UUID reutilizado aceito';
 EXCEPTION WHEN unique_violation THEN NULL; END;
 BEGIN
  PERFORM public.end_campaign_scene_v2(gen_random_uuid(),campaign,0,false);
  RAISE EXCEPTION 'Revisão antiga aceita';
 EXCEPTION WHEN serialization_failure THEN NULL; END;
 SELECT * INTO result FROM public.save_campaign_combat_v2(campaign,1,active_state);
 IF result.scene_number<>2 THEN RAISE EXCEPTION 'Início de combate fechou cena'; END IF;
 BEGIN
  PERFORM public.end_campaign_scene_v2(gen_random_uuid(),campaign,2,false);
  RAISE EXCEPTION 'Manual encerrou durante combate';
 EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
 SELECT * INTO result FROM public.end_campaign_scene_v2(gen_random_uuid(),campaign,2,true);
 IF result.scene_number<>3 OR result.revision<>3 OR result.state<>empty_state THEN RAISE EXCEPTION 'Combate/cena não foram atômicos'; END IF;
 -- Retry antigo devolve a cena atual, sem reverter/avançar uma nova cena.
 SELECT * INTO result FROM public.end_campaign_scene_v2(operation,campaign,0,false);
 IF result.scene_number<>3 OR result.revision<>3 THEN RAISE EXCEPTION 'Retry antigo reverteu cena'; END IF;
 PERFORM public.save_campaign_combat_v2(campaign,3,active_state);
 SELECT * INTO result FROM public.save_campaign_combat_v2(campaign,4,empty_state);
 IF result.scene_number<>4 OR result.revision<>5 OR (SELECT count(*) FROM public.campaign_scene_events_v2)<>3 THEN RAISE EXCEPTION 'Cliente legado não encerrou cena uma vez'; END IF;
 PERFORM public.save_campaign_combat_v2(campaign,5,empty_state);
 IF (SELECT count(*) FROM public.campaign_scene_events_v2)<>3 THEN RAISE EXCEPTION 'Repetição inativa encerrou cena'; END IF;
 BEGIN
  PERFORM public.save_campaign_combat_state_core_v2(campaign,6,active_state);
  RAISE EXCEPTION 'Auxiliar privado exposto';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN
  DELETE FROM public.campaign_scene_events_v2;
  RAISE EXCEPTION 'Recibo pode ser apagado';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000112',true);
DO $$ BEGIN
 IF (SELECT count(*) FROM public.campaign_scene_events_v2)<>3 THEN RAISE EXCEPTION 'Membro não lê histórico'; END IF;
 BEGIN
  PERFORM public.end_campaign_scene_v2(gen_random_uuid(),'00000000-0000-4000-8000-000000000101',6,false);
  RAISE EXCEPTION 'Jogador encerrou cena';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000113',true);
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM public.campaign_scene_events_v2) THEN RAISE EXCEPTION 'Histórico vazou'; END IF;
 BEGIN
  PERFORM public.end_campaign_scene_v2(gen_random_uuid(),'00000000-0000-4000-8000-000000000101',6,false);
  RAISE EXCEPTION 'Estranho encerrou cena';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
SET LOCAL ROLE anon;
DO $$ BEGIN
 BEGIN
  PERFORM * FROM public.campaign_scene_events_v2;
  RAISE EXCEPTION 'Anônimo lê cenas';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
ROLLBACK;
