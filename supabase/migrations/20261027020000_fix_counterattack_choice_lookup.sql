-- Corrige a resolução da defesa do contra-ataque. A versão inicial usava
-- `intent_id` ao mesmo tempo como variável PL/pgSQL e coluna da tabela, o que
-- tornava a consulta ambígua somente no caminho real de rolagem da reação.
CREATE OR REPLACE FUNCTION public.confirm_character_counterattack_roll_v2(
 p_operation_id uuid,p_character_id uuid,p_expected_pe integer,p_expected_cost integer,
 p_expected_turn_key text,p_selection jsonb,p_payload jsonb)
RETURNS public.character_activity_events
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE intent public.campaign_attack_intents_v2; choice public.campaign_attack_defense_choices_v2;
 defense public.character_activity_events; combat public.campaign_combat_state_v2;
 receipt public.character_activity_events; budget jsonb;
 intent_identifier uuid; defense_identifier uuid;
BEGIN
 IF p_selection IS NULL OR jsonb_typeof(p_selection)<>'object'
  OR jsonb_typeof(p_selection->'counterattackDefenseEventId')<>'string'
  OR jsonb_typeof(p_selection->'attackIntentId')<>'string'
  OR p_expected_cost<>0 OR p_selection->>'specialAttackIncrements'<>'0'
  OR p_selection->'sneakAttack'<>'false'::jsonb OR p_selection->'lethalShot'<>'false'::jsonb
  OR jsonb_array_length(p_selection->'techniques')<>0
  OR (p_selection->>'lethalCount')::integer<>0
  OR jsonb_array_length(p_selection->'otherPaidBonuses')<>0 THEN
  RAISE EXCEPTION 'Contra-ataque não aceita habilidades pagas.' USING ERRCODE='22023'; END IF;
 intent_identifier:=(p_selection->>'attackIntentId')::uuid;
 defense_identifier:=(p_selection->>'counterattackDefenseEventId')::uuid;
 SELECT * INTO intent FROM public.campaign_attack_intents_v2
  WHERE operation_id=intent_identifier FOR UPDATE;
 SELECT * INTO defense FROM public.character_activity_events
  WHERE id=defense_identifier FOR UPDATE;
 SELECT * INTO choice FROM public.campaign_attack_defense_choices_v2 choice_row
  WHERE choice_row.intent_id=intent_identifier FOR UPDATE;
 IF intent.operation_id IS NULL OR defense.id IS NULL OR choice.operation_id IS NULL
  OR intent.reaction_source_id<>defense_identifier OR intent.attacker_id<>p_character_id
  OR intent.target_id::text<>p_selection->>'targetCharacterId'
  OR intent.weapon_id<>p_selection->>'weaponId' THEN
  RAISE EXCEPTION 'Contra-ataque não corresponde à reação preparada.' USING ERRCODE='22023'; END IF;
 IF NOT public.can_manage_character_activity(p_character_id) THEN
  RAISE EXCEPTION 'Ficha não autorizada.' USING ERRCODE='42501'; END IF;
 SELECT * INTO combat FROM public.campaign_combat_state_v2 WHERE campaign_id=intent.campaign_id FOR UPDATE;
 IF intent.status='rolled' AND intent.attack_event_id=p_operation_id THEN
  RETURN public.confirm_character_combat_attack_action_core(
   p_operation_id,p_character_id,p_expected_pe,p_expected_cost,p_expected_turn_key,p_selection,p_payload); END IF;
 IF intent.status<>'pending' OR combat.state->'active' IS DISTINCT FROM 'true'::jsonb
  OR combat.scene_number<>intent.scene_number OR (combat.state->>'round')::integer<>intent.round_number
  OR combat.turn_instance_id<>intent.turn_instance_id THEN
  RAISE EXCEPTION 'Contra-ataque expirado.' USING ERRCODE='40001'; END IF;
 budget:=public.get_character_pe_budget(p_character_id);
 IF budget->>'key' IS DISTINCT FROM p_expected_turn_key THEN
  RAISE EXCEPTION 'Turno mudou.' USING ERRCODE='40001'; END IF;
 receipt:=public.confirm_character_combat_attack_action_core(
  p_operation_id,p_character_id,p_expected_pe,0,p_expected_turn_key,p_selection,p_payload);
 UPDATE public.character_activity_events SET payload=payload||jsonb_build_object(
  'attackIntentId',intent_identifier,'declaredTargetId',intent.target_id,
  'counterattackDefenseEventId',defense_identifier,'combatAction',jsonb_build_object(
   'tracked',true,'turnKey',budget->>'key','kind','reaction','source','counterattack'))
 WHERE id=receipt.id RETURNING * INTO receipt;
 INSERT INTO public.character_combat_actions(operation_id,character_id,turn_key,action_kind,source)
 VALUES(receipt.id,p_character_id,budget->>'key','reaction','attack');
 UPDATE public.campaign_attack_intents_v2 SET status='rolled',attack_event_id=receipt.id
  WHERE operation_id=intent_identifier;
 UPDATE public.campaign_attack_defense_choices_v2 SET attack_event_id=receipt.id
  WHERE operation_id=choice.operation_id;
 IF choice.defense_type<>'none' THEN
  INSERT INTO public.character_activity_events
   (id,operation_id,character_id,author_id,category,status,payload,request_hash,campaign_id,campaign_version)
  VALUES(choice.operation_id,choice.operation_id,intent.target_id,choice.author_id,'application','confirmed',
   jsonb_build_object('kind','special_defense','defenseType',choice.defense_type,
    'attackEventId',receipt.id,'attackIntentId',intent_identifier,'scene',intent.scene_number,
    'round',intent.round_number,'masterConfirmed',true,'declaredBeforeRoll',true,
    'resolution','mesa_pendente','effectApplied',false),choice.request_hash,intent.campaign_id,'v2');
  INSERT INTO public.character_special_defenses_v2
   (operation_id,campaign_id,scene_number,round_number,character_id,attack_event_id,defense_type)
  VALUES(choice.operation_id,intent.campaign_id,intent.scene_number,intent.round_number,
   intent.target_id,receipt.id,choice.defense_type);
 END IF;
 UPDATE public.character_activity_events SET payload=payload||jsonb_build_object(
  'resolution','contra_ataque_rolado','effectApplied',true,'counterattackEventId',receipt.id)
 WHERE id=defense_identifier;
 RETURN receipt;
END $$;

REVOKE ALL ON FUNCTION public.confirm_character_counterattack_roll_v2(uuid,uuid,integer,integer,text,jsonb,jsonb)
 FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.confirm_character_counterattack_roll_v2(uuid,uuid,integer,integer,text,jsonb,jsonb)
 TO authenticated;
