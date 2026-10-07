-- Identidade de turno protegida: clientes não escrevem relógio nem comprovantes diretamente.
CREATE TABLE public.character_manual_turns (
 character_id uuid PRIMARY KEY REFERENCES public.characters(id) ON DELETE CASCADE,
 turn_number integer NOT NULL DEFAULT 0 CHECK(turn_number BETWEEN 0 AND 1000000)
);
CREATE TABLE public.sustained_turn_confirmations (
 sustained_id uuid NOT NULL REFERENCES public.character_sustained_rituals(id) ON DELETE CASCADE,
 turn_key text NOT NULL,
 operation_id uuid NOT NULL REFERENCES public.character_activity_events(id),
 PRIMARY KEY(sustained_id,turn_key)
);
ALTER TABLE public.character_manual_turns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sustained_turn_confirmations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.character_manual_turns,public.sustained_turn_confirmations FROM PUBLIC,anon,authenticated;

CREATE FUNCTION public.get_character_ritual_turn(p_character_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE combat record; found_count integer:=0; result jsonb; current_id text;
BEGIN
 IF NOT public.can_manage_character_activity(p_character_id) THEN RAISE EXCEPTION 'Ficha não autorizada.' USING ERRCODE='42501'; END IF;
 FOR combat IN SELECT s.* FROM public.campaign_combat_state_v2 s
  JOIN public.campaign_members_v2 m ON m.campaign_id=s.campaign_id
  JOIN public.characters c ON c.id=m.character_id AND c.user_id=m.user_id
  WHERE c.id=p_character_id AND s.state->'active'='true'::jsonb LOOP
  found_count:=found_count+1;
  current_id:=combat.state->'combatants'->((combat.state->>'currentTurnIndex')::integer)->>'id';
  result:=jsonb_build_object('mode','combat','campaignId',combat.campaign_id,'scene',combat.scene_number,
   'round',(combat.state->>'round')::integer,'eligible',current_id=p_character_id::text,
   'key',concat('v2:',combat.campaign_id,':',combat.scene_number,':',combat.state->>'round',':',p_character_id));
 END LOOP;
 IF found_count>1 THEN RAISE EXCEPTION 'Ficha vinculada a mais de um combate ativo. Encerre o combate excedente.' USING ERRCODE='0A000'; END IF;
 IF found_count=1 THEN RETURN result; END IF;
 RETURN jsonb_build_object('mode','manual','number',coalesce((SELECT turn_number FROM public.character_manual_turns WHERE character_id=p_character_id),0),
  'eligible',coalesce((SELECT turn_number FROM public.character_manual_turns WHERE character_id=p_character_id),0)>0,
  'key',concat('manual:',p_character_id,':',coalesce((SELECT turn_number FROM public.character_manual_turns WHERE character_id=p_character_id),0)));
END $$;
REVOKE ALL ON FUNCTION public.get_character_ritual_turn(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_character_ritual_turn(uuid) TO authenticated;

CREATE FUNCTION public.begin_character_manual_turn(p_operation_id uuid,p_character_id uuid,p_expected_turn integer)
RETURNS public.character_activity_events LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE receipt public.character_activity_events; fingerprint text; actual integer;
BEGIN
 IF NOT public.can_manage_character_activity(p_character_id) THEN RAISE EXCEPTION 'Ficha não autorizada.' USING ERRCODE='42501'; END IF;
 IF p_operation_id IS NULL OR p_expected_turn IS NULL OR p_expected_turn NOT BETWEEN 0 AND 999999 THEN
  RAISE EXCEPTION 'Turno manual inválido.' USING ERRCODE='22023'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_operation_id::text,0));
 fingerprint:=md5(jsonb_build_array('manual_turn',p_character_id,p_expected_turn)::text);
 SELECT * INTO receipt FROM public.character_activity_events WHERE operation_id=p_operation_id;
 IF FOUND THEN
  IF receipt.author_id<>auth.uid() OR receipt.request_hash<>fingerprint THEN RAISE EXCEPTION 'Operação reutilizada.' USING ERRCODE='23505'; END IF;
  RETURN receipt;
 END IF;
 -- Mesma ordem: campanhas antes das fichas.
 PERFORM 1 FROM public.campaign_combat_state_v2 s WHERE s.campaign_id IN
  (SELECT campaign_id FROM public.campaign_members_v2 WHERE character_id=p_character_id) ORDER BY s.campaign_id FOR UPDATE;
 PERFORM 1 FROM public.characters WHERE id=p_character_id FOR UPDATE;
 IF public.get_character_ritual_turn(p_character_id)->>'mode'<>'manual' THEN
  RAISE EXCEPTION 'Use o turno do combate ativo; não crie um turno manual.' USING ERRCODE='22023'; END IF;
 INSERT INTO public.character_manual_turns(character_id) VALUES(p_character_id) ON CONFLICT DO NOTHING;
 SELECT turn_number INTO actual FROM public.character_manual_turns WHERE character_id=p_character_id FOR UPDATE;
 IF actual<>p_expected_turn THEN RAISE EXCEPTION 'Turno já avançado por outra tela. Recarregue.' USING ERRCODE='40001'; END IF;
 UPDATE public.character_manual_turns SET turn_number=turn_number+1 WHERE character_id=p_character_id;
 INSERT INTO public.character_activity_events(id,operation_id,character_id,author_id,category,status,payload,request_hash)
 VALUES(p_operation_id,p_operation_id,p_character_id,auth.uid(),'application','confirmed',
  jsonb_build_object('kind','manual_turn','turnBefore',actual,'turnAfter',actual+1,'peCost',0),fingerprint) RETURNING * INTO receipt;
 RETURN receipt;
END $$;
REVOKE ALL ON FUNCTION public.begin_character_manual_turn(uuid,uuid,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.begin_character_manual_turn(uuid,uuid,integer) TO authenticated;

ALTER FUNCTION public.confirm_sustained_ritual_action(uuid,uuid,text,jsonb,integer) RENAME TO confirm_sustained_ritual_action_turn_core;
REVOKE ALL ON FUNCTION public.confirm_sustained_ritual_action_turn_core(uuid,uuid,text,jsonb,integer) FROM PUBLIC,anon,authenticated;
-- Compatibilidade de encerramento; clientes antigos não podem manter sem identidade de turno.
CREATE FUNCTION public.confirm_sustained_ritual_action(p_operation_id uuid,p_character_id uuid,p_action text,p_expected jsonb,p_expected_pe integer)
RETURNS public.character_activity_events LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF p_action='maintain' THEN RAISE EXCEPTION 'Atualize a aplicação para confirmar o turno antes da manutenção.' USING ERRCODE='22023'; END IF;
 RETURN public.confirm_sustained_ritual_action_turn_core(p_operation_id,p_character_id,p_action,p_expected,p_expected_pe);
END $$;
REVOKE ALL ON FUNCTION public.confirm_sustained_ritual_action(uuid,uuid,text,jsonb,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.confirm_sustained_ritual_action(uuid,uuid,text,jsonb,integer) TO authenticated;

CREATE FUNCTION public.confirm_sustained_ritual_maintenance(p_operation_id uuid,p_character_id uuid,p_expected jsonb,p_expected_pe integer,p_turn jsonb)
RETURNS public.character_activity_events LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE receipt public.character_activity_events; actual jsonb; ids uuid[];
BEGIN
 IF NOT public.can_manage_character_activity(p_character_id) THEN RAISE EXCEPTION 'Ficha não autorizada.' USING ERRCODE='42501'; END IF;
 IF p_operation_id IS NULL OR jsonb_typeof(p_turn) IS DISTINCT FROM 'object'
 OR jsonb_typeof(p_expected) IS DISTINCT FROM 'array' OR jsonb_array_length(p_expected) NOT BETWEEN 1 AND 64 THEN
  RAISE EXCEPTION 'Pedido de manutenção inválido.' USING ERRCODE='22023'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_operation_id::text,0));
 SELECT * INTO receipt FROM public.character_activity_events WHERE operation_id=p_operation_id;
 IF FOUND THEN
  IF receipt.payload->'turn' IS DISTINCT FROM p_turn THEN RAISE EXCEPTION 'Turno alterado na repetição.' USING ERRCODE='23505'; END IF;
  RETURN public.confirm_sustained_ritual_action_turn_core(p_operation_id,p_character_id,'maintain',p_expected,p_expected_pe);
 END IF;
 PERFORM 1 FROM public.campaign_combat_state_v2 s WHERE s.campaign_id IN
  (SELECT campaign_id FROM public.campaign_members_v2 WHERE character_id=p_character_id) ORDER BY s.campaign_id FOR UPDATE;
 -- Conjurador e alvos bloqueados em ordem estável, como na operação original.
 PERFORM 1 FROM public.characters c WHERE c.id=p_character_id OR c.id IN
  (SELECT r.character_id FROM public.character_sustained_rituals r JOIN public.sustained_ritual_origins o ON o.sustained_id=r.id
   WHERE o.caster_character_id=p_character_id) ORDER BY c.id FOR UPDATE;
 actual:=public.get_character_ritual_turn(p_character_id);
 IF actual IS DISTINCT FROM p_turn THEN RAISE EXCEPTION 'Turno mudou. Reabra a manutenção.' USING ERRCODE='40001'; END IF;
 IF actual->'eligible' IS DISTINCT FROM 'true'::jsonb THEN RAISE EXCEPTION 'Confirme o início do turno do conjurador antes de manter.' USING ERRCODE='22023'; END IF;
 SELECT array_agg((e->>'id')::uuid) INTO ids FROM jsonb_array_elements(p_expected) e;
 IF EXISTS(SELECT 1 FROM public.sustained_turn_confirmations WHERE sustained_id=ANY(ids) AND turn_key=actual->>'key') THEN
  RAISE EXCEPTION 'Manutenção já confirmada neste turno. Nenhuma nova cobrança.' USING ERRCODE='23505'; END IF;
 receipt:=public.confirm_sustained_ritual_action_turn_core(p_operation_id,p_character_id,'maintain',p_expected,p_expected_pe);
 INSERT INTO public.sustained_turn_confirmations(sustained_id,turn_key,operation_id) SELECT id,actual->>'key',receipt.id FROM unnest(ids) id;
 UPDATE public.character_activity_events SET payload=payload||jsonb_build_object('turn',actual) WHERE id=receipt.id RETURNING * INTO receipt;
 RETURN receipt;
END $$;
REVOKE ALL ON FUNCTION public.confirm_sustained_ritual_maintenance(uuid,uuid,jsonb,integer,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.confirm_sustained_ritual_maintenance(uuid,uuid,jsonb,integer,jsonb) TO authenticated;
