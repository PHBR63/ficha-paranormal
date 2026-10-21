-- Livro Base v1.3: o limite de PE reinicia em cada turno, inclusive quando
-- a mesma criatura recebe outro turno na mesma rodada. A identidade é gerada
-- pelo servidor e já rotaciona junto do tracker de combate v2.
--
-- Conserva o gasto e as confirmações do turno que estiver ativo na aplicação
-- desta migration. Registros de turnos encerrados permanecem intactos.
WITH active_turns AS (
 SELECT combat.campaign_id, combat.scene_number,
  combat.state->>'round' AS round_number,
  combat.state->'combatants'->((combat.state->>'currentTurnIndex')::integer)->>'id' AS actor_id,
  combat.turn_instance_id,
  member.character_id
 FROM public.campaign_combat_state_v2 combat
 JOIN public.campaign_members_v2 member ON member.campaign_id=combat.campaign_id
 JOIN public.characters ficha ON ficha.id=member.character_id AND ficha.user_id=member.user_id
 WHERE combat.state->'active'='true'::jsonb
)
UPDATE public.character_pe_turn_spending spending
SET turn_key=concat('v2:',turn.campaign_id,':',turn.scene_number,':',turn.round_number,
 ':',turn.actor_id,':',turn.turn_instance_id)
FROM active_turns turn
WHERE spending.character_id=turn.character_id
 AND spending.turn_key=concat('v2:',turn.campaign_id,':',turn.scene_number,':',turn.round_number,':',turn.actor_id);

WITH active_turns AS (
 SELECT combat.campaign_id, combat.scene_number,
  combat.state->>'round' AS round_number,
  combat.state->'combatants'->((combat.state->>'currentTurnIndex')::integer)->>'id' AS actor_id,
  combat.turn_instance_id,
  member.character_id
 FROM public.campaign_combat_state_v2 combat
 JOIN public.campaign_members_v2 member ON member.campaign_id=combat.campaign_id
 JOIN public.characters ficha ON ficha.id=member.character_id AND ficha.user_id=member.user_id
 WHERE combat.state->'active'='true'::jsonb
)
UPDATE public.character_bleeding_turn_confirmations confirmation
SET turn_key=concat('v2:',turn.campaign_id,':',turn.scene_number,':',turn.round_number,
 ':',turn.actor_id,':',turn.turn_instance_id)
FROM active_turns turn
WHERE confirmation.character_id=turn.character_id
 AND confirmation.turn_key=concat('v2:',turn.campaign_id,':',turn.scene_number,':',turn.round_number,':',turn.actor_id);

WITH active_turns AS (
 SELECT combat.campaign_id, combat.scene_number,
  combat.state->>'round' AS round_number,
  combat.state->'combatants'->((combat.state->>'currentTurnIndex')::integer)->>'id' AS actor_id,
  combat.turn_instance_id,
  member.character_id
 FROM public.campaign_combat_state_v2 combat
 JOIN public.campaign_members_v2 member ON member.campaign_id=combat.campaign_id
 JOIN public.characters ficha ON ficha.id=member.character_id AND ficha.user_id=member.user_id
 WHERE combat.state->'active'='true'::jsonb
)
UPDATE public.sustained_turn_confirmations confirmation
SET turn_key=concat('v2:',turn.campaign_id,':',turn.scene_number,':',turn.round_number,
 ':',turn.actor_id,':',turn.turn_instance_id)
FROM public.character_sustained_rituals ritual
JOIN active_turns turn ON turn.character_id=ritual.character_id
WHERE confirmation.sustained_id=ritual.id
 AND confirmation.turn_key=concat('v2:',turn.campaign_id,':',turn.scene_number,':',turn.round_number,':',turn.actor_id);

CREATE OR REPLACE FUNCTION public.get_character_pe_budget(p_character_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE ficha public.characters; combat record; matches integer:=0; context jsonb; clock public.character_manual_turns;
 base_limit integer; ritual_limit integer; spent integer; actor text; key text;
BEGIN
 PERFORM public.lock_character_pe_turn(p_character_id);
 SELECT * INTO ficha FROM public.characters WHERE id=p_character_id;
 IF ficha.nex NOT BETWEEN 0 AND 99 THEN RAISE EXCEPTION 'NEX exige revisão.' USING ERRCODE='0A000'; END IF;
 base_limit:=CASE WHEN ficha.nex=99 THEN 20 ELSE greatest(1,floor(ficha.nex/5.0)::integer) END;
 IF lower(ficha.origin) IN ('universitário','universitario') THEN base_limit:=base_limit+1; END IF;
 ritual_limit:=base_limit;
 IF lower(ficha.class)='ocultista' AND lower(ficha.class_track)='intuitivo' AND ficha.nex>=40 THEN
  ritual_limit:=ritual_limit+greatest(0,ficha.presence);
 END IF;
 FOR combat IN SELECT s.* FROM public.campaign_combat_state_v2 s JOIN public.campaign_members_v2 m ON m.campaign_id=s.campaign_id
  JOIN public.characters c ON c.id=m.character_id AND c.user_id=m.user_id
  WHERE c.id=p_character_id AND s.state->'active'='true'::jsonb LOOP
  matches:=matches+1;
  actor:=combat.state->'combatants'->((combat.state->>'currentTurnIndex')::integer)->>'id';
  IF actor IS NULL THEN RAISE EXCEPTION 'Combate sem turno válido.' USING ERRCODE='0A000'; END IF;
  key:=concat('v2:',combat.campaign_id,':',combat.scene_number,':',combat.state->>'round',':',actor,
   ':',combat.turn_instance_id);
  context:=jsonb_build_object('mode','combat','tracked',true,'key',key,'campaignId',combat.campaign_id,
   'scene',combat.scene_number,'round',(combat.state->>'round')::integer,'actorId',actor,
   'turnInstanceId',combat.turn_instance_id);
 END LOOP;
 IF matches>1 THEN RAISE EXCEPTION 'Mais de um combate ativo.' USING ERRCODE='0A000'; END IF;
 IF matches=0 THEN
  SELECT * INTO clock FROM public.character_manual_turns WHERE character_id=p_character_id;
  IF coalesce(clock.active,false) THEN
   key:=concat('manual:',p_character_id,':',clock.turn_number);
   context:=jsonb_build_object('mode','manual','tracked',true,'key',key,'number',clock.turn_number);
  ELSE context:=jsonb_build_object('mode','untracked','tracked',false,'key',NULL); END IF;
 END IF;
 SELECT coalesce(sum(cost),0)::integer INTO spent FROM public.character_pe_turn_spending
  WHERE character_id=p_character_id AND turn_key=key;
 RETURN context||jsonb_build_object('spent',spent,'limit',base_limit,'ritualLimit',ritual_limit,
  'remaining',greatest(0,base_limit-spent),'ritualRemaining',greatest(0,ritual_limit-spent));
END $$;
REVOKE ALL ON FUNCTION public.get_character_pe_budget(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_character_pe_budget(uuid) TO authenticated;

-- A manutenção sustentada e o orçamento de PE devem usar a mesma identidade.
CREATE OR REPLACE FUNCTION public.get_character_ritual_turn(p_character_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE result jsonb; budget jsonb;
BEGIN
 result:=public.get_character_ritual_turn_budget_core(p_character_id);
 IF result->>'mode'='combat' THEN
  budget:=public.get_character_pe_budget(p_character_id);
  result:=result||jsonb_build_object('key',budget->>'key');
 ELSIF result->>'mode'='manual' THEN
  result:=result||jsonb_build_object('eligible',coalesce((SELECT active FROM public.character_manual_turns WHERE character_id=p_character_id),false));
 END IF;
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.get_character_ritual_turn(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_character_ritual_turn(uuid) TO authenticated;
