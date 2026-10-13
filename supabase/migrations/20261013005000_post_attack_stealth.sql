-- Base pp.45 e60: penalidades em d20, sem bônus numérico do Silenciador.
-- Somente novo recibo; não modifica fichas nem históricos existentes.
CREATE FUNCTION public.confirm_character_post_attack_stealth(p_operation_id uuid,p_character_id uuid,p_request jsonb)
RETURNS public.character_activity_events LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE c public.characters; item jsonb; receipt public.character_activity_events; fingerprint text;
 silencer boolean; gatuno boolean; movement boolean; loud boolean; training integer:=0; equipment integer:=0;
 situational integer; penalty integer; extra integer; other integer; count_dice integer; keep_low boolean;
 dice jsonb:='[]'; die integer; kept integer; approval jsonb; payload jsonb;
BEGIN
 IF NOT public.can_manage_character_activity(p_character_id) THEN RAISE EXCEPTION 'Ficha não autorizada.' USING ERRCODE='42501'; END IF;
 IF p_operation_id IS NULL OR jsonb_typeof(p_request) IS DISTINCT FROM 'object' OR octet_length(p_request::text)>64000
 OR p_request->'requirementsConfirmed' IS DISTINCT FROM 'true'::jsonb
 OR jsonb_typeof(p_request->'fullMovement') IS DISTINCT FROM 'boolean'
 OR jsonb_typeof(p_request->'otherLoudAction') IS DISTINCT FROM 'boolean' THEN
 RAISE EXCEPTION 'Confirme fim do turno, ação livre, esconderijo, ataques e movimento.' USING ERRCODE='22023'; END IF;
 fingerprint:=md5(jsonb_build_array(p_character_id,p_request)::text);
 PERFORM pg_advisory_xact_lock(hashtextextended(p_operation_id::text,0));
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
 'requirementsDeclared',true,'turnContext','table_checked','fullMovement',movement,'otherLoudAction',loud,
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
