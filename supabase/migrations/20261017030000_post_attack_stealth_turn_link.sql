-- Livro Base v1.3 pp. 45 e 60: esconder-se após atacar usa a arma daquele turno.
-- O identificador abaixo é uma proteção do fluxo digital; não altera a regra do livro.
ALTER TABLE public.campaign_combat_state_v2
 ADD COLUMN IF NOT EXISTS turn_instance_id uuid;
UPDATE public.campaign_combat_state_v2 SET turn_instance_id=gen_random_uuid() WHERE turn_instance_id IS NULL;
ALTER TABLE public.campaign_combat_state_v2
 ALTER COLUMN turn_instance_id SET DEFAULT gen_random_uuid(),
 ALTER COLUMN turn_instance_id SET NOT NULL;

-- Rotaciona apenas quando muda a identidade do turno; outros dados do tracker não invalidam o ataque.
CREATE OR REPLACE FUNCTION public.rotate_combat_turn_instance()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE old_ids jsonb; new_ids jsonb;
BEGIN
 SELECT jsonb_agg(value->>'id' ORDER BY ordinality) INTO old_ids
 FROM jsonb_array_elements(coalesce(OLD.state->'combatants','[]'::jsonb)) WITH ORDINALITY entry(value,ordinality);
 SELECT jsonb_agg(value->>'id' ORDER BY ordinality) INTO new_ids
 FROM jsonb_array_elements(coalesce(NEW.state->'combatants','[]'::jsonb)) WITH ORDINALITY entry(value,ordinality);
 IF OLD.scene_number IS DISTINCT FROM NEW.scene_number
  OR OLD.state->'active' IS DISTINCT FROM NEW.state->'active'
  OR OLD.state->'round' IS DISTINCT FROM NEW.state->'round'
  OR OLD.state->'currentTurnIndex' IS DISTINCT FROM NEW.state->'currentTurnIndex'
  OR old_ids IS DISTINCT FROM new_ids THEN
  NEW.turn_instance_id:=gen_random_uuid();
 END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS rotate_combat_turn_instance ON public.campaign_combat_state_v2;
CREATE TRIGGER rotate_combat_turn_instance BEFORE UPDATE OF state,scene_number ON public.campaign_combat_state_v2
FOR EACH ROW EXECUTE FUNCTION public.rotate_combat_turn_instance();
REVOKE ALL ON FUNCTION public.rotate_combat_turn_instance() FROM PUBLIC,anon,authenticated;

-- Recibo de ataque sem custo também ganha a identidade do turno e da arma validada.
CREATE OR REPLACE FUNCTION public.capture_combat_attack_turn()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE combat public.campaign_combat_state_v2; found_count integer:=0; actor text;
BEGIN
 NEW.payload:=NEW.payload-'attackTurn';
 FOR combat IN SELECT s.* FROM public.campaign_combat_state_v2 s
  JOIN public.campaign_members_v2 m ON m.campaign_id=s.campaign_id AND m.character_id=NEW.character_id
  JOIN public.characters c ON c.id=m.character_id AND c.user_id=m.user_id
  WHERE s.state->'active'='true'::jsonb LOOP
  found_count:=found_count+1;
  actor:=combat.state->'combatants'->((combat.state->>'currentTurnIndex')::integer)->>'id';
  IF actor=NEW.character_id::text AND coalesce(NEW.payload->'selection'->>'weaponId','')<>'' THEN
   NEW.payload:=jsonb_set(NEW.payload,'{attackTurn}',jsonb_build_object(
    'campaignId',combat.campaign_id,'turnInstanceId',combat.turn_instance_id,
    'weaponId',NEW.payload->'selection'->>'weaponId'));
  END IF;
 END LOOP;
 IF found_count>1 THEN RAISE EXCEPTION 'Mais de um combate ativo para a ficha.' USING ERRCODE='0A000'; END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS capture_combat_attack_turn ON public.character_activity_events;
CREATE TRIGGER capture_combat_attack_turn BEFORE INSERT ON public.character_activity_events
FOR EACH ROW WHEN (NEW.payload->>'kind'='combat_attack') EXECUTE FUNCTION public.capture_combat_attack_turn();
REVOKE ALL ON FUNCTION public.capture_combat_attack_turn() FROM PUBLIC,anon,authenticated;

-- A função de Furtividade abaixo preserva os demais cálculos e acrescenta o vínculo do ataque.
CREATE OR REPLACE FUNCTION public.confirm_character_post_attack_stealth(p_operation_id uuid,p_character_id uuid,p_request jsonb)
RETURNS public.character_activity_events LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE c public.characters; item jsonb; receipt public.character_activity_events; fingerprint text;
 silencer boolean; gatuno boolean; movement boolean; loud boolean; training integer:=0; equipment integer:=0;
 situational integer; penalty integer; extra integer; other integer; count_dice integer; keep_low boolean;
 dice jsonb:='[]'; die integer; kept integer; approval jsonb; payload jsonb;
 budget jsonb; turn_id uuid; attack_receipt public.character_activity_events;
BEGIN
 IF NOT public.can_manage_character_activity(p_character_id) THEN RAISE EXCEPTION 'Ficha não autorizada.' USING ERRCODE='42501'; END IF;
 IF p_operation_id IS NULL OR jsonb_typeof(p_request) IS DISTINCT FROM 'object' OR octet_length(p_request::text)>64000
 OR p_request->'requirementsConfirmed' IS DISTINCT FROM 'true'::jsonb
 OR jsonb_typeof(p_request->'fullMovement') IS DISTINCT FROM 'boolean'
 OR jsonb_typeof(p_request->'otherLoudAction') IS DISTINCT FROM 'boolean' THEN
 RAISE EXCEPTION 'Confirme fim do turno, ação livre, esconderijo, ataques e movimento.' USING ERRCODE='22023'; END IF;
 fingerprint:=md5(jsonb_build_array(p_character_id,p_request)::text);
 PERFORM pg_advisory_xact_lock(hashtextextended(p_operation_id::text,0));
 PERFORM public.lock_character_pe_turn(p_character_id);
 SELECT * INTO c FROM public.characters WHERE id=p_character_id FOR UPDATE;
 SELECT * INTO receipt FROM public.character_activity_events WHERE operation_id=p_operation_id;
 IF FOUND THEN
 IF receipt.author_id<>auth.uid() OR receipt.request_hash<>fingerprint THEN RAISE EXCEPTION 'Operação reutilizada.' USING ERRCODE='23505'; END IF;
 RETURN receipt; END IF;
 IF NOT public.physical_explosive_action_allowed(c.conditions) THEN RAISE EXCEPTION 'Uma condição impede esta ação física.' USING ERRCODE='55004'; END IF;
 IF (SELECT count(*) FROM jsonb_array_elements(c.inventory) WHERE value->>'id'=p_request->'item'->>'id')<>1 THEN
 RAISE EXCEPTION 'Arma ausente ou identidade duplicada.' USING ERRCODE='40001'; END IF;
 SELECT value INTO item FROM jsonb_array_elements(c.inventory) WHERE value->>'id'=p_request->'item'->>'id';
 IF item IS DISTINCT FROM p_request->'item' OR p_request->'expectedAgility' IS DISTINCT FROM to_jsonb(c.agility)
 OR p_request->'expectedSkills' IS DISTINCT FROM c.skills OR p_request->'expectedConditions' IS DISTINCT FROM c.conditions THEN
 RAISE EXCEPTION 'A ficha ou a arma mudou. Atualize antes de rolar.' USING ERRCODE='40001'; END IF;
 IF item->>'itemType' IS DISTINCT FROM 'weapon' OR coalesce((item->>'quantity')::integer,1)<=0 THEN
 RAISE EXCEPTION 'Escolha a arma usada no ataque deste turno.' USING ERRCODE='22023'; END IF;
 -- Com iniciativa v2 ativa, só o ataque confirmado com esta arma no turno atual habilita a rolagem.
 budget:=public.get_character_pe_budget(p_character_id);
 IF budget->>'mode'='combat' THEN
  IF budget->>'actorId' IS DISTINCT FROM p_character_id::text THEN
   RAISE EXCEPTION 'Esconder-se após atacar exige o turno atual do personagem.' USING ERRCODE='55004'; END IF;
  SELECT turn_instance_id INTO turn_id FROM public.campaign_combat_state_v2
   WHERE campaign_id=(budget->>'campaignId')::uuid;
  SELECT * INTO attack_receipt FROM public.character_activity_events e
   WHERE e.character_id=p_character_id AND e.status='confirmed'
    AND e.payload->>'kind'='combat_attack'
    AND e.payload->'attackTurn'->>'turnInstanceId'=turn_id::text
    AND e.payload->'attackTurn'->>'weaponId'=item->>'id'
   ORDER BY e.created_at DESC LIMIT 1;
  IF NOT FOUND THEN
   RAISE EXCEPTION 'Registre primeiro um ataque com esta arma no turno atual.' USING ERRCODE='55004'; END IF;
 END IF;
 IF coalesce(p_request->>'otherBonuses','') !~ '^-?[0-9]{1,3}$' OR coalesce(p_request->>'dicePenalty','') !~ '^[0-9]{1,2}$'
 OR coalesce(p_request->>'extraDice','') !~ '^[0-9]{1,2}$' THEN RAISE EXCEPTION 'Bônus e dados inválidos.' USING ERRCODE='22023'; END IF;
 other:=(p_request->>'otherBonuses')::integer; penalty:=(p_request->>'dicePenalty')::integer; extra:=(p_request->>'extraDice')::integer;
 IF abs(other)>100 OR penalty>10 OR extra>10 OR c.agility NOT BETWEEN 0 AND 5 THEN
 RAISE EXCEPTION 'Confira atributo e modificadores.' USING ERRCODE='22023'; END IF;
 SELECT coalesce((value #>> '{}')::integer,0) INTO training FROM jsonb_each(c.skills) WHERE lower(trim(key))='furtividade';
 training:=coalesce(training,0);
 IF training NOT BETWEEN 0 AND 3 THEN RAISE EXCEPTION 'Grau de treino inválido.' USING ERRCODE='22023'; END IF;
 silencer:=coalesce((item->>'weaponType'='firearm' OR item->>'catalogId' IN
 ('pistola','revolver','fuzil_caca','submetralhadora','espingarda','fuzil_assalto','fuzil_precisao','metralhadora'))
 AND coalesce(item->'appliedModifications','[]') ? 'silenciador',false);
 gatuno:=coalesce(c.class='Especialista' AND regexp_replace(lower(c.class_track),'[ _]+','-','g')='infiltrador' AND c.nex>=40,false);
 movement:=(p_request->>'fullMovement')::boolean; loud:=(p_request->>'otherLoudAction')::boolean;
 situational:=(CASE WHEN silencer AND NOT loud THEN 1 ELSE 3 END)+(CASE WHEN movement AND NOT gatuno THEN 1 ELSE 0 END);
 -- Mesma política do pool canônico: inversão para pior dado quando o pool positivo fica insuficiente.
 penalty:=penalty+situational;
 IF c.agility=0 THEN count_dice:=2+penalty; keep_low:=true;
 ELSIF c.agility+extra-penalty>=1 THEN count_dice:=c.agility+extra-penalty; keep_low:=false;
 ELSE count_dice:=c.agility+extra+penalty; keep_low:=true; END IF;
 approval:=public.get_character_accessories(p_character_id);
 equipment:=coalesce((approval->'bonuses'->>'furtividade')::integer,0);
 FOR i IN 1..count_dice LOOP
 die:=floor(random()*20)::integer+1; dice:=dice||to_jsonb(die);
 kept:=CASE WHEN kept IS NULL THEN die WHEN keep_low THEN least(kept,die) ELSE greatest(kept,die) END;
 END LOOP;
 payload:=jsonb_build_object('kind','post_attack_stealth','itemName',item->>'name','actionCost','livre','peCost',0,
 'requirementsDeclared',true,'turnContext',CASE WHEN budget->>'mode'='combat' THEN 'attack_receipt' ELSE 'table_checked' END,
 'attackOperationId',attack_receipt.id,'fullMovement',movement,'otherLoudAction',loud,
 'silencerApplied',silencer AND NOT loud,'gatunoApplied',gatuno AND movement,'situationalDicePenalty',situational,
 'result',jsonb_build_object('label','Esconder-se após atacar','dice',dice,'keptDice',kept,
 'skillBonus',training*5,'equipmentBonus',equipment,'declaredOtherBonuses',other,'otherBonuses',equipment+other,
 'total',kept+training*5+equipment+other,'isDisadvantage',keep_low,'dicePenalty',penalty,'extraDice',extra,'opposedResolution','pending'));
 INSERT INTO public.character_activity_events(id,operation_id,character_id,author_id,category,status,payload,request_hash)
 VALUES(p_operation_id,p_operation_id,p_character_id,auth.uid(),'roll','confirmed',payload,fingerprint) RETURNING * INTO receipt;
 RETURN receipt;
END $$;
REVOKE ALL ON FUNCTION public.confirm_character_post_attack_stealth(uuid,uuid,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.confirm_character_post_attack_stealth(uuid,uuid,jsonb) TO authenticated;
