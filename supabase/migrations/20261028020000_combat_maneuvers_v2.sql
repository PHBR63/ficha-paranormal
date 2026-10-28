-- Livro Base v1.3, pp. 85-86. Manobras sincronizadas existem somente no
-- combate v2; campanhas v1 continuam no painel manual já existente.
ALTER TABLE public.character_combat_actions
 DROP CONSTRAINT character_combat_actions_source_check;
ALTER TABLE public.character_combat_actions
 ADD CONSTRAINT character_combat_actions_source_check
 CHECK (source IN ('attack','ritual','mirar','prepare','maneuver'));

CREATE TABLE public.campaign_combat_maneuvers_v2 (
 operation_id uuid PRIMARY KEY,
 campaign_id uuid NOT NULL REFERENCES public.campaigns_v2(id) ON DELETE CASCADE,
 scene_number integer NOT NULL CHECK (scene_number>0),
 round_number integer NOT NULL CHECK (round_number>0),
 turn_instance_id uuid NOT NULL,
 actor_id uuid NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
 target_id uuid NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
 maneuver_type text NOT NULL CHECK (maneuver_type IN ('grapple','trip','disarm','push','break')),
 weapon_id text CHECK (weapon_id IS NULL OR length(weapon_id) BETWEEN 1 AND 100),
 attribute text NOT NULL CHECK (attribute IN ('strength','agility')),
 status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','resolved','cancelled','expired')),
 author_id uuid NOT NULL REFERENCES auth.users(id),
 request_hash text NOT NULL,
 resolution_operation_id uuid UNIQUE,
 resolution_author_id uuid REFERENCES auth.users(id),
 resolution_hash text,
 result jsonb,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 resolved_at timestamptz,
 CHECK (actor_id<>target_id)
);
CREATE INDEX campaign_combat_maneuvers_round_idx
 ON public.campaign_combat_maneuvers_v2(campaign_id,scene_number,round_number,status);
CREATE UNIQUE INDEX campaign_combat_maneuvers_one_pending_turn_idx
 ON public.campaign_combat_maneuvers_v2(campaign_id,actor_id,turn_instance_id)
 WHERE status='pending';

CREATE TABLE public.campaign_grapples_v2 (
 maneuver_operation_id uuid PRIMARY KEY REFERENCES public.campaign_combat_maneuvers_v2(operation_id) ON DELETE CASCADE,
 campaign_id uuid NOT NULL REFERENCES public.campaigns_v2(id) ON DELETE CASCADE,
 actor_id uuid NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
 target_id uuid NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
 active boolean NOT NULL DEFAULT true,
 started_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 ended_at timestamptz,
 ended_by uuid REFERENCES auth.users(id)
);
CREATE UNIQUE INDEX campaign_grapples_one_active_target_idx
 ON public.campaign_grapples_v2(campaign_id,target_id) WHERE active;

ALTER TABLE public.campaign_combat_maneuvers_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_grapples_v2 ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Membros veem manobras v2" ON public.campaign_combat_maneuvers_v2
 FOR SELECT TO authenticated USING (
  public.is_campaign_member_v2(auth.uid(),campaign_id)
  OR public.is_campaign_master_v2(auth.uid(),campaign_id));
CREATE POLICY "Membros veem agarrões v2" ON public.campaign_grapples_v2
 FOR SELECT TO authenticated USING (
  public.is_campaign_member_v2(auth.uid(),campaign_id)
  OR public.is_campaign_master_v2(auth.uid(),campaign_id));
REVOKE ALL ON public.campaign_combat_maneuvers_v2,public.campaign_grapples_v2 FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.campaign_combat_maneuvers_v2,public.campaign_grapples_v2 TO authenticated;
ALTER PUBLICATION supabase_realtime ADD TABLE public.campaign_combat_maneuvers_v2;
ALTER PUBLICATION supabase_realtime ADD TABLE public.campaign_grapples_v2;

-- Rolagem canônica de atributo: atributo positivo mantém o maior; zero mantém
-- o menor de 2d20. O 20 natural fica registrado, mas não altera a comparação.
CREATE FUNCTION public.roll_maneuver_luta_v2(
 p_character public.characters,p_attribute text,p_modifier integer)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SET search_path=public,pg_temp AS $$
DECLARE attribute_value integer; dice_count integer; keep_low boolean;
 dice jsonb:='[]'::jsonb; die integer; kept integer; training integer; total integer;
BEGIN
 attribute_value:=CASE p_attribute WHEN 'strength' THEN p_character.strength
  WHEN 'agility' THEN p_character.agility ELSE NULL END;
 IF attribute_value IS NULL OR attribute_value NOT BETWEEN 0 AND 5
  OR p_modifier NOT BETWEEN -20 AND 20 THEN
  RAISE EXCEPTION 'Atributo ou modificador de manobra inválido.' USING ERRCODE='22023'; END IF;
 dice_count:=CASE WHEN attribute_value=0 THEN 2 ELSE attribute_value END;
 keep_low:=attribute_value=0;
 FOR index IN 1..dice_count LOOP
  die:=floor(random()*20)::integer+1; dice:=dice||to_jsonb(die);
  kept:=CASE WHEN kept IS NULL THEN die WHEN keep_low THEN least(kept,die) ELSE greatest(kept,die) END;
 END LOOP;
 training:=coalesce((p_character.skills->>'luta')::integer,0);
 IF training NOT BETWEEN 0 AND 3 THEN RAISE EXCEPTION 'Grau de Luta inválido.' USING ERRCODE='22023'; END IF;
 total:=kept+training*5+p_modifier;
 RETURN jsonb_build_object('attribute',p_attribute,'attributeValue',attribute_value,
  'dice',dice,'kept',kept,'natural20',kept=20,'skillBonus',training*5,
  'situationalModifier',p_modifier,'total',total,'keptLowest',keep_low);
END $$;
REVOKE ALL ON FUNCTION public.roll_maneuver_luta_v2(public.characters,text,integer)
 FROM PUBLIC,anon,authenticated;

-- Função pura para limites de margem. Os testes exatos não dependem do RNG.
CREATE FUNCTION public.combat_maneuver_effect_v2(p_type text,p_actor_total integer,p_target_total integer)
RETURNS jsonb LANGUAGE plpgsql IMMUTABLE SET search_path=public,pg_temp AS $$
DECLARE won boolean; margin integer; distance numeric:=0;
BEGIN
 IF p_type NOT IN ('grapple','trip','disarm','push','break') OR p_actor_total=p_target_total THEN
  RAISE EXCEPTION 'Resultado final de manobra inválido.' USING ERRCODE='22023'; END IF;
 won:=p_actor_total>p_target_total; margin:=abs(p_actor_total-p_target_total);
 IF won AND p_type='push' THEN distance:=1.5*(1+floor(margin/5.0));
 ELSIF won AND p_type IN ('trip','disarm') AND margin>=5 THEN distance:=1.5; END IF;
 RETURN jsonb_build_object('attackerWon',won,'margin',margin,'distanceMeters',distance,
  'automaticEffect',CASE WHEN NOT won THEN 'none' WHEN p_type='grapple' THEN 'grappled'
   WHEN p_type='trip' THEN 'prone' WHEN p_type='disarm' THEN 'disarmed'
   WHEN p_type='push' THEN 'movement_pending' ELSE 'object_damage_pending' END,
  'manualPending',won AND (p_type IN ('push','break','disarm') OR distance>0));
END $$;
REVOKE ALL ON FUNCTION public.combat_maneuver_effect_v2(text,integer,integer) FROM PUBLIC,anon,authenticated;

-- Identidade exata impede que inventários antigos com IDs duplicados alterem
-- dois itens numa única manobra de Desarmar ou Quebrar.
CREATE FUNCTION public.get_unique_equipped_maneuver_item_v2(p_inventory jsonb,p_item_id text)
RETURNS jsonb LANGUAGE plpgsql IMMUTABLE SET search_path=public,pg_temp AS $$
DECLARE result jsonb;
BEGIN
 IF jsonb_typeof(p_inventory) IS DISTINCT FROM 'array' OR p_item_id IS NULL THEN
  RAISE EXCEPTION 'Item alvo inválido.' USING ERRCODE='22023'; END IF;
 SELECT value INTO STRICT result FROM jsonb_array_elements(p_inventory) item(value)
  WHERE value->>'id'=p_item_id AND value->'isEquipped'='true'::jsonb
   AND (value->>'itemType'='weapon' OR (value->'isHeld'='true'::jsonb
    AND lower(coalesce(value->>'itemType','')) NOT IN ('armor','protection','accessory')
    AND lower(coalesce(value->>'catalogType','')) NOT IN ('acessorio','accessory')));
 RETURN result;
EXCEPTION WHEN no_data_found OR too_many_rows THEN
 RAISE EXCEPTION 'Item empunhado ausente ou duplicado.' USING ERRCODE='40001';
END $$;
REVOKE ALL ON FUNCTION public.get_unique_equipped_maneuver_item_v2(jsonb,text) FROM PUBLIC,anon,authenticated;

CREATE FUNCTION public.maneuver_item_is_agile_v2(p_item jsonb)
RETURNS boolean LANGUAGE sql IMMUTABLE SET search_path=public,pg_temp AS $$
 SELECT coalesce(jsonb_typeof(p_item->'properties')='array' AND EXISTS(
  SELECT 1 FROM jsonb_array_elements_text(p_item->'properties') property
  WHERE public.creation_identifier(property) IN ('agil','agile')),false)
$$;
REVOKE ALL ON FUNCTION public.maneuver_item_is_agile_v2(jsonb) FROM PUBLIC,anon,authenticated;

CREATE FUNCTION public.character_has_martial_artist_v2(p_character public.characters)
RETURNS boolean LANGUAGE sql STABLE SET search_path=public,pg_temp AS $$
 SELECT EXISTS(SELECT 1 FROM jsonb_path_query(jsonb_build_array(
  p_character.abilities,p_character.powers,p_character.class_power_choices,p_character.general_powers),'$.**') found(value)
  WHERE public.creation_identifier(coalesce(value->>'id',value->>'powerId',value->>'name',value#>>'{}'))
   IN ('artista-marcial','artista-marcial-esp'))
$$;
REVOKE ALL ON FUNCTION public.character_has_martial_artist_v2(public.characters)
 FROM PUBLIC,anon,authenticated;

CREATE FUNCTION public.character_maneuver_agility_allowed_v2(p_character public.characters,p_weapon_id text DEFAULT NULL)
RETURNS boolean LANGUAGE plpgsql STABLE SET search_path=public,pg_temp AS $$
DECLARE item jsonb; martial boolean;
BEGIN
 martial:=public.character_has_martial_artist_v2(p_character);
 IF p_weapon_id IS NULL THEN
  RETURN martial OR EXISTS(SELECT 1 FROM jsonb_array_elements(coalesce(p_character.inventory,'[]'::jsonb)) equipped(value)
   WHERE value->>'itemType'='weapon' AND value->'isEquipped'='true'::jsonb
    AND lower(coalesce(value->>'weaponType',value->>'type','')) IN ('melee','corpo a corpo','briga')
    AND public.maneuver_item_is_agile_v2(value));
 END IF;
 SELECT value INTO STRICT item FROM jsonb_array_elements(coalesce(p_character.inventory,'[]'::jsonb)) equipped(value)
  WHERE value->>'id'=p_weapon_id AND value->>'itemType'='weapon' AND value->'isEquipped'='true'::jsonb
   AND lower(coalesce(value->>'weaponType',value->>'type','')) IN ('melee','corpo a corpo','briga');
 RETURN public.maneuver_item_is_agile_v2(item);
EXCEPTION WHEN no_data_found OR too_many_rows THEN
 RAISE EXCEPTION 'Arma da manobra ausente ou duplicada.' USING ERRCODE='40001';
END $$;
REVOKE ALL ON FUNCTION public.character_maneuver_agility_allowed_v2(public.characters,text)
 FROM PUBLIC,anon,authenticated;

CREATE FUNCTION public.append_unique_maneuver_condition_v2(
 p_conditions jsonb,p_id text,p_name text,p_operation_id uuid)
RETURNS jsonb LANGUAGE plpgsql IMMUTABLE SET search_path=public,pg_temp AS $$
BEGIN
 IF jsonb_typeof(p_conditions) IS DISTINCT FROM 'array' THEN
  RAISE EXCEPTION 'Condições da ficha exigem revisão.' USING ERRCODE='22023'; END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(p_conditions) item
  WHERE public.creation_identifier(coalesce(item->>'id',item->>'name',item#>>'{}'))=p_id) THEN
  RETURN p_conditions;
 END IF;
 RETURN p_conditions||jsonb_build_array(jsonb_build_object('id',p_id,'name',p_name,
  'sourceKind','combat_maneuver','sourceOperationId',p_operation_id));
END $$;
REVOKE ALL ON FUNCTION public.append_unique_maneuver_condition_v2(jsonb,text,text,uuid)
 FROM PUBLIC,anon,authenticated;

CREATE FUNCTION public.expire_campaign_combat_maneuvers_v2()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 UPDATE public.campaign_combat_maneuvers_v2 SET status='expired'
 WHERE campaign_id=NEW.campaign_id AND status='pending'
  AND (NEW.state->'active' IS DISTINCT FROM 'true'::jsonb
   OR scene_number<>NEW.scene_number
   OR round_number<>(NEW.state->>'round')::integer
   OR turn_instance_id<>NEW.turn_instance_id);
 RETURN NEW;
END $$;
CREATE TRIGGER expire_campaign_combat_maneuvers_v2
 AFTER UPDATE OF state,scene_number ON public.campaign_combat_state_v2
 FOR EACH ROW EXECUTE FUNCTION public.expire_campaign_combat_maneuvers_v2();
REVOKE ALL ON FUNCTION public.expire_campaign_combat_maneuvers_v2() FROM PUBLIC,anon,authenticated;

CREATE FUNCTION public.declare_campaign_combat_maneuver_v2(
 p_operation_id uuid,p_campaign_id uuid,p_actor_id uuid,p_target_id uuid,
 p_maneuver_type text,p_weapon_id text,p_attribute text,p_expected_scene integer,
 p_expected_round integer,p_expected_turn_instance_id uuid)
RETURNS public.campaign_combat_maneuvers_v2
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE existing public.campaign_combat_maneuvers_v2; combat public.campaign_combat_state_v2;
 actor public.characters; weapon jsonb; fingerprint text; agile boolean:=false;
BEGIN
 IF auth.uid() IS NULL OR NOT public.can_manage_character_activity(p_actor_id) THEN
  RAISE EXCEPTION 'Ficha atacante não autorizada.' USING ERRCODE='42501'; END IF;
 IF p_operation_id IS NULL OR p_campaign_id IS NULL OR p_target_id IS NULL OR p_actor_id=p_target_id
  OR p_maneuver_type NOT IN ('grapple','trip','disarm','push','break')
  OR p_attribute NOT IN ('strength','agility') OR p_weapon_id IS NULL OR length(p_weapon_id) NOT BETWEEN 1 AND 100 THEN
  RAISE EXCEPTION 'Declaração de manobra inválida.' USING ERRCODE='22023'; END IF;
 fingerprint:=md5(jsonb_build_array(p_campaign_id,p_actor_id,p_target_id,p_maneuver_type,
  p_weapon_id,p_attribute,p_expected_scene,p_expected_round,p_expected_turn_instance_id)::text);
 PERFORM pg_advisory_xact_lock(hashtextextended(p_operation_id::text,0));
 SELECT * INTO existing FROM public.campaign_combat_maneuvers_v2 WHERE operation_id=p_operation_id;
 IF FOUND THEN
  IF existing.author_id<>auth.uid() OR existing.request_hash<>fingerprint THEN
   RAISE EXCEPTION 'ID de operação reutilizado.' USING ERRCODE='23505'; END IF;
  RETURN existing;
 END IF;
 SELECT * INTO combat FROM public.campaign_combat_state_v2 WHERE campaign_id=p_campaign_id FOR UPDATE;
 IF NOT FOUND OR combat.state->'active' IS DISTINCT FROM 'true'::jsonb
  OR combat.scene_number<>p_expected_scene OR (combat.state->>'round')::integer<>p_expected_round
  OR combat.turn_instance_id<>p_expected_turn_instance_id
  OR combat.state->'combatants'->((combat.state->>'currentTurnIndex')::integer)->>'id'<>p_actor_id::text THEN
  RAISE EXCEPTION 'Cena ou turno da manobra mudou.' USING ERRCODE='40001'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.campaign_members_v2 member JOIN public.characters c ON c.id=member.character_id
   WHERE member.campaign_id=p_campaign_id AND member.character_id=p_actor_id AND member.user_id=c.user_id)
  OR NOT EXISTS(SELECT 1 FROM public.campaign_members_v2 member WHERE member.campaign_id=p_campaign_id AND member.character_id=p_target_id) THEN
  RAISE EXCEPTION 'Atacante ou alvo não pertence à campanha.' USING ERRCODE='42501'; END IF;
 IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(combat.state->'combatants') participant
  WHERE participant->>'id'=p_target_id::text) THEN
  RAISE EXCEPTION 'Alvo não participa do combate ativo.' USING ERRCODE='55004'; END IF;
 SELECT * INTO actor FROM public.characters WHERE id=p_actor_id FOR UPDATE;
 IF p_weapon_id='__unarmed__' THEN
  agile:=public.character_has_martial_artist_v2(actor);
 ELSE
  SELECT value INTO weapon FROM jsonb_array_elements(coalesce(actor.inventory,'[]'::jsonb)) item(value)
   WHERE value->>'id'=p_weapon_id AND value->>'itemType'='weapon'
    AND value->'isEquipped'='true'::jsonb
    AND lower(coalesce(value->>'weaponType',value->>'type','')) IN ('melee','corpo a corpo','briga');
  IF weapon IS NULL THEN RAISE EXCEPTION 'A manobra exige arma corpo a corpo equipada.' USING ERRCODE='22023'; END IF;
  agile:=public.maneuver_item_is_agile_v2(weapon);
 END IF;
 IF p_maneuver_type='grapple' AND p_weapon_id<>'__unarmed__' THEN
  RAISE EXCEPTION 'Agarrar exige ataque desarmado.' USING ERRCODE='22023'; END IF;
 IF p_attribute='agility' AND NOT agile THEN
  RAISE EXCEPTION 'Agilidade exige arma corpo a corpo Ágil.' USING ERRCODE='22023'; END IF;
 IF (public.get_character_turn_action_status(p_actor_id)->>'available')::integer<1 THEN
  RAISE EXCEPTION 'Ação padrão indisponível neste turno.' USING ERRCODE='55004'; END IF;
 INSERT INTO public.campaign_combat_maneuvers_v2(operation_id,campaign_id,scene_number,round_number,
  turn_instance_id,actor_id,target_id,maneuver_type,weapon_id,attribute,author_id,request_hash)
 VALUES(p_operation_id,p_campaign_id,p_expected_scene,p_expected_round,p_expected_turn_instance_id,
  p_actor_id,p_target_id,p_maneuver_type,NULLIF(p_weapon_id,'__unarmed__'),p_attribute,auth.uid(),fingerprint)
 RETURNING * INTO existing;
 RETURN existing;
END $$;
REVOKE ALL ON FUNCTION public.declare_campaign_combat_maneuver_v2(uuid,uuid,uuid,uuid,text,text,text,integer,integer,uuid)
 FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.declare_campaign_combat_maneuver_v2(uuid,uuid,uuid,uuid,text,text,text,integer,integer,uuid)
 TO authenticated;

CREATE FUNCTION public.cancel_campaign_combat_maneuver_v2(p_operation_id uuid)
RETURNS public.campaign_combat_maneuvers_v2
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE result public.campaign_combat_maneuvers_v2;
BEGIN
 SELECT * INTO result FROM public.campaign_combat_maneuvers_v2 WHERE operation_id=p_operation_id FOR UPDATE;
 IF NOT FOUND OR (result.author_id<>auth.uid() AND NOT public.is_campaign_master_v2(auth.uid(),result.campaign_id)) THEN
  RAISE EXCEPTION 'Manobra não autorizada.' USING ERRCODE='42501'; END IF;
 IF result.status='pending' THEN UPDATE public.campaign_combat_maneuvers_v2 SET status='cancelled'
  WHERE operation_id=p_operation_id RETURNING * INTO result; END IF;
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.cancel_campaign_combat_maneuver_v2(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.cancel_campaign_combat_maneuver_v2(uuid) TO authenticated;

CREATE FUNCTION public.resolve_campaign_combat_maneuver_v2(
 p_operation_id uuid,p_maneuver_id uuid,p_resolution jsonb)
RETURNS public.campaign_combat_maneuvers_v2
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE maneuver public.campaign_combat_maneuvers_v2; combat public.campaign_combat_state_v2;
 actor public.characters; target public.characters; actor_roll jsonb; target_roll jsonb; effect jsonb;
 attempts jsonb:='[]'::jsonb; attempt integer:=0; actor_total integer; target_total integer;
 attacker_won boolean; margin integer; distance numeric:=0; target_conditions jsonb;
 target_item_id text; target_item jsonb; target_inventory jsonb; actor_event public.character_activity_events;
 target_event_id uuid:=gen_random_uuid(); fingerprint text; action_status jsonb; final_result jsonb;
 attacker_modifier integer; defender_modifier integer; defender_attribute text; justification text;
BEGIN
 SELECT * INTO maneuver FROM public.campaign_combat_maneuvers_v2 WHERE operation_id=p_maneuver_id;
 IF NOT FOUND OR auth.uid() IS NULL OR NOT public.is_campaign_master_v2(auth.uid(),maneuver.campaign_id) THEN
  RAISE EXCEPTION 'Somente o mestre resolve manobras.' USING ERRCODE='42501'; END IF;
 IF p_operation_id IS NULL OR jsonb_typeof(p_resolution) IS DISTINCT FROM 'object' THEN
  RAISE EXCEPTION 'Resolução de manobra inválida.' USING ERRCODE='22023'; END IF;
 fingerprint:=md5(jsonb_build_array(p_maneuver_id,p_resolution)::text);
 PERFORM pg_advisory_xact_lock(hashtextextended(p_operation_id::text,0));
 IF maneuver.resolution_operation_id IS NOT NULL THEN
  IF maneuver.resolution_operation_id<>p_operation_id OR maneuver.resolution_hash<>fingerprint THEN
   RAISE EXCEPTION 'ID de resolução reutilizado.' USING ERRCODE='23505'; END IF;
  RETURN maneuver;
 END IF;
 attacker_modifier:=coalesce((p_resolution->>'attackerModifier')::integer,0);
 defender_modifier:=coalesce((p_resolution->>'defenderModifier')::integer,0);
 defender_attribute:=coalesce(p_resolution->>'defenderAttribute','strength');
 justification:=trim(coalesce(p_resolution->>'justification',''));
 IF attacker_modifier NOT BETWEEN -20 AND 20 OR defender_modifier NOT BETWEEN -20 AND 20
  OR defender_attribute NOT IN ('strength','agility') OR length(justification) NOT BETWEEN 3 AND 500
  OR p_resolution->'adjacencyConfirmed' IS DISTINCT FROM 'true'::jsonb THEN
  RAISE EXCEPTION 'Confirme adjacência e justifique os modificadores.' USING ERRCODE='22023'; END IF;
 IF maneuver.maneuver_type='grapple' AND p_resolution->'freeHandConfirmed' IS DISTINCT FROM 'true'::jsonb THEN
  RAISE EXCEPTION 'Agarrar exige mão livre confirmada.' USING ERRCODE='22023'; END IF;
 -- Ordem única de bloqueio: combate, manobra e fichas por ID.
 SELECT * INTO combat FROM public.campaign_combat_state_v2 WHERE campaign_id=maneuver.campaign_id FOR UPDATE;
 SELECT * INTO maneuver FROM public.campaign_combat_maneuvers_v2 WHERE operation_id=p_maneuver_id FOR UPDATE;
 IF maneuver.resolution_operation_id IS NOT NULL THEN
  IF maneuver.resolution_operation_id<>p_operation_id OR maneuver.resolution_hash<>fingerprint THEN
   RAISE EXCEPTION 'ID de resolução reutilizado.' USING ERRCODE='23505'; END IF;
  RETURN maneuver;
 END IF;
 IF maneuver.status<>'pending' THEN RAISE EXCEPTION 'Manobra não está pendente.' USING ERRCODE='55004'; END IF;
 IF NOT FOUND OR combat.state->'active' IS DISTINCT FROM 'true'::jsonb OR combat.scene_number<>maneuver.scene_number
  OR (combat.state->>'round')::integer<>maneuver.round_number OR combat.turn_instance_id<>maneuver.turn_instance_id
  OR combat.state->'combatants'->((combat.state->>'currentTurnIndex')::integer)->>'id'<>maneuver.actor_id::text THEN
  RAISE EXCEPTION 'A cena ou turno da manobra mudou.' USING ERRCODE='40001'; END IF;
 PERFORM id FROM public.characters WHERE id IN (maneuver.actor_id,maneuver.target_id) ORDER BY id FOR UPDATE;
 SELECT * INTO actor FROM public.characters WHERE id=maneuver.actor_id;
 SELECT * INTO target FROM public.characters WHERE id=maneuver.target_id;
 IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(combat.state->'combatants') participant
  WHERE participant->>'id'=maneuver.target_id::text) THEN
  RAISE EXCEPTION 'Alvo não participa mais do combate.' USING ERRCODE='40001'; END IF;
 IF maneuver.weapon_id IS NOT NULL THEN
  PERFORM public.character_maneuver_agility_allowed_v2(actor,maneuver.weapon_id);
  IF maneuver.attribute='agility' AND NOT public.character_maneuver_agility_allowed_v2(actor,maneuver.weapon_id) THEN
   RAISE EXCEPTION 'A arma da manobra deixou de ser Ágil.' USING ERRCODE='40001'; END IF;
 ELSIF maneuver.attribute='agility' AND NOT public.character_has_martial_artist_v2(actor) THEN
  RAISE EXCEPTION 'O ataque desarmado deixou de ser Ágil.' USING ERRCODE='40001';
 END IF;
 IF defender_attribute='agility' AND NOT public.character_maneuver_agility_allowed_v2(target,NULL) THEN
  RAISE EXCEPTION 'Agilidade defensiva exige arma Ágil ou Artista Marcial.' USING ERRCODE='22023'; END IF;
 action_status:=public.get_character_turn_action_status(maneuver.actor_id);
 IF (action_status->>'available')::integer<1 THEN RAISE EXCEPTION 'Ação padrão indisponível.' USING ERRCODE='55004'; END IF;
 LOOP
  attempt:=attempt+1;
  actor_roll:=public.roll_maneuver_luta_v2(actor,maneuver.attribute,attacker_modifier);
  target_roll:=public.roll_maneuver_luta_v2(target,defender_attribute,defender_modifier);
  attempts:=attempts||jsonb_build_array(jsonb_build_object('attempt',attempt,'actor',actor_roll,'target',target_roll));
  actor_total:=(actor_roll->>'total')::integer; target_total:=(target_roll->>'total')::integer;
  EXIT WHEN actor_total<>target_total;
  IF attempt>=50 THEN RAISE EXCEPTION 'Limite de desempates atingido; nenhuma ação foi consumida.' USING ERRCODE='40001'; END IF;
 END LOOP;
 effect:=public.combat_maneuver_effect_v2(maneuver.maneuver_type,actor_total,target_total);
 attacker_won:=(effect->>'attackerWon')::boolean; margin:=(effect->>'margin')::integer;
 distance:=(effect->>'distanceMeters')::numeric;
 IF attacker_won THEN
  IF maneuver.maneuver_type IN ('grapple','trip') THEN
   target_conditions:=public.append_unique_maneuver_condition_v2(coalesce(target.conditions,'[]'::jsonb),
    CASE maneuver.maneuver_type WHEN 'grapple' THEN 'agarrado' ELSE 'caido' END,
    CASE maneuver.maneuver_type WHEN 'grapple' THEN 'Agarrado' ELSE 'Caído' END,maneuver.operation_id);
   UPDATE public.characters SET conditions=target_conditions WHERE id=target.id;
  END IF;
  IF maneuver.maneuver_type='grapple' THEN
   INSERT INTO public.campaign_grapples_v2(maneuver_operation_id,campaign_id,actor_id,target_id)
   VALUES(maneuver.operation_id,maneuver.campaign_id,maneuver.actor_id,maneuver.target_id);
  END IF;
  IF maneuver.maneuver_type IN ('disarm','break') THEN
   target_item_id:=p_resolution->>'targetItemId';
   IF target_item_id IS NULL THEN RAISE EXCEPTION 'Selecione o item empunhado.' USING ERRCODE='22023'; END IF;
   target_item:=public.get_unique_equipped_maneuver_item_v2(target.inventory,target_item_id);
   IF maneuver.maneuver_type='disarm' THEN
    SELECT jsonb_agg(CASE WHEN item->>'id'=target_item_id THEN item||'{"isEquipped":false}'::jsonb ELSE item END ORDER BY ordinal)
    INTO target_inventory FROM jsonb_array_elements(target.inventory) WITH ORDINALITY entry(item,ordinal);
    UPDATE public.characters SET inventory=target_inventory WHERE id=target.id;
   END IF;
  END IF;
 END IF;
 final_result:=jsonb_build_object('kind','combat_maneuver_resolved','maneuverType',maneuver.maneuver_type,
  'actorId',maneuver.actor_id,'targetId',maneuver.target_id,'attempts',attempts,
  'attackerWon',attacker_won,'margin',margin,'actionConsumed',true,
  'natural20Automatic',false,'distanceMeters',distance,
  'automaticEffect',effect->>'automaticEffect','manualPending',(effect->>'manualPending')::boolean,
  'justification',justification,'targetItemId',target_item_id,'targetItemName',target_item->>'name',
  'grappleActive',attacker_won AND maneuver.maneuver_type='grapple');
 INSERT INTO public.character_activity_events(id,operation_id,character_id,author_id,category,status,payload,request_hash,campaign_id,campaign_version)
 VALUES(p_operation_id,p_operation_id,maneuver.actor_id,auth.uid(),'application','confirmed',final_result,fingerprint,maneuver.campaign_id,'v2')
 RETURNING * INTO actor_event;
 INSERT INTO public.character_activity_events(id,operation_id,character_id,author_id,category,status,payload,request_hash,campaign_id,campaign_version)
 VALUES(target_event_id,target_event_id,maneuver.target_id,auth.uid(),'application','confirmed',
  final_result||jsonb_build_object('kind','combat_maneuver_received','sourceEventId',actor_event.id),
  md5(jsonb_build_array(p_operation_id,maneuver.target_id)::text),maneuver.campaign_id,'v2');
 UPDATE public.character_activity_events SET payload=payload||jsonb_build_object('targetEventId',target_event_id)
  WHERE id=actor_event.id;
 INSERT INTO public.character_combat_actions(operation_id,character_id,turn_key,action_kind,source)
 VALUES(actor_event.id,maneuver.actor_id,action_status->>'turnKey','standard','maneuver');
 final_result:=final_result||jsonb_build_object('actorEventId',actor_event.id,'targetEventId',target_event_id,
  'combatAction',jsonb_build_object('tracked',true,'turnKey',action_status->>'turnKey','kind','standard','source','maneuver'));
 UPDATE public.campaign_combat_maneuvers_v2 SET status='resolved',resolution_operation_id=p_operation_id,
  resolution_author_id=auth.uid(),resolution_hash=fingerprint,result=final_result,resolved_at=clock_timestamp()
 WHERE operation_id=maneuver.operation_id RETURNING * INTO maneuver;
 RETURN maneuver;
END $$;
REVOKE ALL ON FUNCTION public.resolve_campaign_combat_maneuver_v2(uuid,uuid,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.resolve_campaign_combat_maneuver_v2(uuid,uuid,jsonb) TO authenticated;

-- Soltar é livre e idempotente; remove apenas a condição originada pelo vínculo.
CREATE FUNCTION public.release_campaign_grapple_v2(p_maneuver_id uuid)
RETURNS public.campaign_grapples_v2 LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE link public.campaign_grapples_v2; next_conditions jsonb;
BEGIN
 SELECT * INTO link FROM public.campaign_grapples_v2 WHERE maneuver_operation_id=p_maneuver_id;
 IF NOT FOUND OR NOT (public.can_manage_character_activity(link.actor_id)
  OR public.is_campaign_master_v2(auth.uid(),link.campaign_id)) THEN
  RAISE EXCEPTION 'Vínculo de Agarrar não autorizado.' USING ERRCODE='42501'; END IF;
 -- Mesma ordem da resolução: combate, manobra e vínculo.
 PERFORM 1 FROM public.campaign_combat_state_v2 WHERE campaign_id=link.campaign_id FOR UPDATE;
 PERFORM 1 FROM public.campaign_combat_maneuvers_v2 WHERE operation_id=p_maneuver_id FOR UPDATE;
 SELECT * INTO link FROM public.campaign_grapples_v2 WHERE maneuver_operation_id=p_maneuver_id FOR UPDATE;
 IF link.active THEN
  SELECT coalesce(jsonb_agg(item),'[]'::jsonb) INTO next_conditions
  FROM jsonb_array_elements(coalesce((SELECT conditions FROM public.characters WHERE id=link.target_id),'[]'::jsonb)) item
  WHERE NOT (item->>'sourceKind'='combat_maneuver' AND item->>'sourceOperationId'=p_maneuver_id::text);
  UPDATE public.characters SET conditions=next_conditions WHERE id=link.target_id;
  UPDATE public.campaign_grapples_v2 SET active=false,ended_at=clock_timestamp(),ended_by=auth.uid()
   WHERE maneuver_operation_id=p_maneuver_id RETURNING * INTO link;
  UPDATE public.campaign_combat_maneuvers_v2 SET result=result||'{"grappleActive":false}'::jsonb
   WHERE operation_id=p_maneuver_id;
 END IF;
 RETURN link;
END $$;
REVOKE ALL ON FUNCTION public.release_campaign_grapple_v2(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.release_campaign_grapple_v2(uuid) TO authenticated;
