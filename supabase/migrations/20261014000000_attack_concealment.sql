-- Base v1.3 pp.60 e89: chance separada do teste, sem acumular camuflagens.
CREATE OR REPLACE FUNCTION public.resolve_weapon_concealment(p_weapon jsonb,p_level text,p_blind boolean,p_defense integer,p_die integer DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SET search_path=public,pg_temp AS $$
DECLARE heat boolean; chance integer; die integer;
BEGIN
 IF p_level NOT IN ('none','light','total') OR p_level IS NULL OR p_blind IS NULL OR (p_defense IS NOT NULL AND (p_defense<0 OR p_defense>1000)) THEN
 RAISE EXCEPTION 'Contexto de camuflagem inválido.' USING ERRCODE='22023'; END IF;
 heat:=coalesce((p_weapon->>'weaponType'='firearm' OR p_weapon->>'catalogId' IN
 ('pistola','revolver','fuzil_caca','submetralhadora','espingarda','fuzil_assalto','fuzil_precisao','metralhadora'))
 AND coalesce(p_weapon->'appliedModifications','[]') ? 'visao_de_calor',false);
 chance:=CASE WHEN heat THEN 0 WHEN p_blind OR p_level='total' THEN 50 WHEN p_level='light' THEN 20 ELSE 0 END;
 IF chance>0 THEN
 die:=coalesce(p_die,floor(random()*10)::integer+1);
 IF die NOT BETWEEN 1 AND 10 THEN RAISE EXCEPTION 'D10 inválido.' USING ERRCODE='22023'; END IF;
 END IF;
 RETURN jsonb_build_object('level',p_level,'attackerBlind',p_blind,'heatVisionApplied',heat,
 'chance',chance,'die',die,'failed',coalesce(die<=chance/10,false),'targetDefense',p_defense);
END $$;
REVOKE ALL ON FUNCTION public.resolve_weapon_concealment(jsonb,text,boolean,integer,integer) FROM PUBLIC,anon,authenticated;

-- Preserva assinatura, orçamento, validações e hash do fluxo existente.
CREATE OR REPLACE FUNCTION public.confirm_character_combat_attack(p_operation_id uuid, p_character_id uuid, p_expected_pe integer, p_expected_cost integer, p_expected_turn_key text, p_selection jsonb, p_payload jsonb)
 RETURNS character_activity_events
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE ficha public.characters; receipt public.character_activity_events; fingerprint text; budget jsonb;
 weapon jsonb; increments integer; maximum_increments integer; techniques jsonb; lethal integer;
 technique_count integer; cost integer:=0; components integer:=0; minimum boolean:=false;
 temporary_before integer; temporary_used integer; track text;
 burst_caps jsonb; burst_active boolean:=false; burst_penalty integer:=0; base_penalty integer;
 pool_count integer; keep_low boolean; actual_kept integer; burst_snapshot jsonb;
 concealment jsonb; source_blind boolean; declared_defense integer;
BEGIN
 IF p_operation_id IS NULL OR p_expected_pe IS NULL OR p_expected_pe<0 OR p_expected_cost IS NULL OR p_expected_cost<0
 OR p_selection IS NULL OR jsonb_typeof(p_selection)<>'object' OR octet_length(p_selection::text)>8000
 OR p_payload IS NULL OR jsonb_typeof(p_payload)<>'object' OR octet_length(p_payload::text)>48000 THEN
  RAISE EXCEPTION 'Ataque inválido.' USING ERRCODE='22023'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_operation_id::text,0));
 PERFORM public.lock_character_pe_turn(p_character_id);
 fingerprint:=md5(jsonb_build_array('combat_attack',p_character_id,p_expected_pe,p_expected_cost,p_expected_turn_key,p_selection,p_payload)::text);
 SELECT * INTO receipt FROM public.character_activity_events WHERE operation_id=p_operation_id;
 IF FOUND THEN
  IF receipt.author_id<>auth.uid() OR receipt.request_hash<>fingerprint THEN RAISE EXCEPTION 'Operação reutilizada.' USING ERRCODE='23505'; END IF;
  RETURN receipt;
 END IF;
 SELECT * INTO ficha FROM public.characters WHERE id=p_character_id;
 budget:=public.get_character_pe_budget(p_character_id);
 IF budget->>'key' IS DISTINCT FROM p_expected_turn_key OR ficha.pe_current IS DISTINCT FROM p_expected_pe THEN
  RAISE EXCEPTION 'Turno ou recurso mudou. Recarregue.' USING ERRCODE='40001'; END IF;
 IF coalesce(p_selection->>'specialAttackIncrements','') !~ '^[0-4]$'
 OR coalesce(p_selection->>'lethalCount','') !~ '^[0-2]$'
 OR jsonb_typeof(p_selection->'sneakAttack') IS DISTINCT FROM 'boolean'
 OR jsonb_typeof(p_selection->'lethalShot') IS DISTINCT FROM 'boolean'
 OR jsonb_typeof(p_selection->'techniques') IS DISTINCT FROM 'array'
 OR jsonb_typeof(p_selection->'otherPaidBonuses') IS DISTINCT FROM 'array' THEN
  RAISE EXCEPTION 'Seleção inválida.' USING ERRCODE='22023'; END IF;
 IF jsonb_array_length(p_selection->'otherPaidBonuses')>0 THEN
  RAISE EXCEPTION 'Custo fora do catálogo do Livro Base exige conferência manual.' USING ERRCODE='0A000'; END IF;
 IF ficha.inventory IS NULL OR jsonb_typeof(ficha.inventory)<>'array' THEN
  RAISE EXCEPTION 'Inventário exige revisão.' USING ERRCODE='0A000'; END IF;
 SELECT item INTO weapon FROM jsonb_array_elements(ficha.inventory) item
  WHERE item->>'id'=p_selection->>'weaponId' AND item->>'itemType'='weapon' AND item->'isEquipped'='true'::jsonb;
 IF weapon IS NULL THEN RAISE EXCEPTION 'Arma não equipada.' USING ERRCODE='22023'; END IF;
 -- Cobertura total é independente de Visão de Calor.
 IF p_selection->'totalCover'='true'::jsonb THEN RAISE EXCEPTION 'Cobertura total impede atacar este alvo, mesmo com Visão de Calor.' USING ERRCODE='55004'; END IF;
 IF p_selection ? 'concealment' THEN
 IF p_selection->>'concealment' NOT IN ('none','light','total')
 OR jsonb_typeof(p_selection->'concealment') IS DISTINCT FROM 'string'
 OR jsonb_typeof(p_selection->'concealmentConfirmed') IS DISTINCT FROM 'boolean'
 OR jsonb_typeof(p_selection->'totalCover') IS DISTINCT FROM 'boolean'
 OR jsonb_typeof(p_selection->'attackerBlind') IS DISTINCT FROM 'boolean' THEN
 RAISE EXCEPTION 'Confira a camuflagem e a possibilidade de atacar.' USING ERRCODE='22023'; END IF;
 SELECT EXISTS(SELECT 1 FROM jsonb_array_elements(coalesce(ficha.conditions,'[]')) cond
 WHERE lower(replace(coalesce(cond->>'id',cond->>'name',cond #>> '{}'),'_','-'))='cego') INTO source_blind;
 IF p_selection->'attackerBlind' IS DISTINCT FROM to_jsonb(source_blind) THEN
 RAISE EXCEPTION 'A situação de visão mudou. Atualize antes de atacar.' USING ERRCODE='40001'; END IF;
 IF (p_selection->>'concealment'<>'none' OR source_blind) AND p_selection->'concealmentConfirmed' IS DISTINCT FROM 'true'::jsonb THEN
 RAISE EXCEPTION 'Confirme camuflagem e situação de visão com a mesa.' USING ERRCODE='22023'; END IF;
 IF p_selection->'targetDefense' IS DISTINCT FROM 'null'::jsonb THEN
 IF coalesce(p_selection->>'targetDefense','') !~ '^[0-9]{1,4}$' OR (p_selection->>'targetDefense')::integer>1000 THEN
 RAISE EXCEPTION 'Defesa declarada inválida.' USING ERRCODE='22023'; END IF;
 declared_defense:=(p_selection->>'targetDefense')::integer;
 END IF;
 END IF;

 -- Clientes anteriores continuam podendo enviar tiro único sem novos campos.
 IF p_selection ? 'burst' AND jsonb_typeof(p_selection->'burst') IS DISTINCT FROM 'boolean' THEN
  RAISE EXCEPTION 'Modo de disparo inválido.' USING ERRCODE='22023'; END IF;
 burst_active:=coalesce((p_selection->>'burst')::boolean,false);
 burst_caps:=public.weapon_burst_capabilities(weapon);
 IF burst_active AND burst_caps->'available' IS DISTINCT FROM 'true'::jsonb THEN
  RAISE EXCEPTION 'Rajada exige uma arma automática equipada.' USING ERRCODE='22023'; END IF;
 burst_penalty:=CASE WHEN burst_active AND burst_caps->'compensated' IS DISTINCT FROM 'true'::jsonb THEN 1 ELSE 0 END;
 burst_snapshot:=jsonb_build_object('enabled',burst_active,'dicePenalty',burst_penalty,
  'extraWeaponDice',CASE WHEN burst_active THEN 1 ELSE 0 END,'compensated',burst_active AND burst_caps->'compensated'='true'::jsonb);
 increments:=(p_selection->>'specialAttackIncrements')::integer;
 maximum_increments:=CASE WHEN ficha.nex>=85 THEN 4 WHEN ficha.nex>=55 THEN 3 WHEN ficha.nex>=25 THEN 2 ELSE 1 END;
 IF increments>0 THEN
  IF ficha.class<>'Combatente' OR ficha.nex<5 OR increments>maximum_increments THEN
   RAISE EXCEPTION 'Ataque Especial não disponível.' USING ERRCODE='22023'; END IF;
  cost:=increments+1; components:=1; minimum:=increments=1;
 END IF;
 track:=regexp_replace(lower(coalesce(ficha.class_track,'')),'[ _]+','-','g');
 IF p_selection->'sneakAttack'='true'::jsonb THEN
  IF ficha.class<>'Especialista' OR track<>'infiltrador' OR ficha.nex<10 THEN
   RAISE EXCEPTION 'Ataque Furtivo não disponível.' USING ERRCODE='22023'; END IF;
  cost:=cost+1; components:=components+1; minimum:=true;
 END IF;
 IF p_selection->'lethalShot'='true'::jsonb THEN
  IF ficha.class<>'Especialista' OR track NOT IN ('atirador-elite','atirador-de-elite') OR ficha.nex<40 THEN
   RAISE EXCEPTION 'Disparo Letal não disponível.' USING ERRCODE='22023'; END IF;
  cost:=cost+1; components:=components+1; minimum:=true;
 END IF;
 techniques:=p_selection->'techniques'; lethal:=(p_selection->>'lethalCount')::integer;
 IF jsonb_array_length(techniques)>4 OR EXISTS(SELECT 1 FROM jsonb_array_elements(techniques) t WHERE jsonb_typeof(t)<>'string')
 OR (SELECT count(DISTINCT t) FROM jsonb_array_elements_text(techniques) t)<>jsonb_array_length(techniques)
 OR EXISTS(SELECT 1 FROM jsonb_array_elements_text(techniques) t WHERE t NOT IN ('amplo','destruidor','letal','perfurante'))
 OR (techniques ? 'letal' AND lethal NOT IN (1,2)) OR (NOT (techniques ? 'letal') AND lethal<>0) THEN
  RAISE EXCEPTION 'Técnicas inválidas.' USING ERRCODE='22023'; END IF;
 technique_count:=jsonb_array_length(techniques)+greatest(0,lethal-1);
 IF technique_count>0 THEN
  IF ficha.class<>'Combatente' OR track<>'aniquilador' OR ficha.nex<40
  OR coalesce(weapon->>'favoriteAbilityId','') NOT IN ('a-favorita','tecnica-secreta','maquina-de-matar')
  OR (ficha.nex<65 AND (techniques ? 'letal' OR techniques ? 'perfurante')) THEN
   RAISE EXCEPTION 'Técnicas não disponíveis para esta arma ou NEX.' USING ERRCODE='22023'; END IF;
  cost:=cost+2*technique_count; components:=components+1; minimum:=technique_count=1;
 END IF;
 -- Uma combinação não recebe a exceção reservada a uma habilidade no custo mínimo.
 minimum:=minimum AND components=1;
 IF cost<>p_expected_cost THEN RAISE EXCEPTION 'Custo mostrado diverge da regra.' USING ERRCODE='22023'; END IF;
 IF jsonb_typeof(p_payload->'entry') IS DISTINCT FROM 'object'
 OR jsonb_typeof(p_payload->'entry'->'results') IS DISTINCT FROM 'array'
 OR jsonb_typeof(p_payload->'entry'->'label') IS DISTINCT FROM 'string'
 OR length(coalesce(p_payload->'entry'->>'label','')) NOT BETWEEN 1 AND 200
 OR p_payload->'entry'->>'type' IS DISTINCT FROM 'attack' THEN
  RAISE EXCEPTION 'Histórico inválido.' USING ERRCODE='22023'; END IF;
 IF jsonb_array_length(p_payload->'entry'->'results') NOT BETWEEN 1 AND 100 THEN
  RAISE EXCEPTION 'Pool inválido.' USING ERRCODE='22023'; END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(p_payload->'entry'->'results') d WHERE d::text !~ '^([1-9]|1[0-9]|20)$') THEN
  RAISE EXCEPTION 'Dados de ataque inválidos.' USING ERRCODE='22023'; END IF;
 IF EXISTS(SELECT 1 FROM unnest(ARRAY['diceCount','bestResult','skillBonus','otherBonuses','bonus','total']) field
  WHERE coalesce(p_payload->'entry'->>field,'') !~ '^-?[0-9]{1,6}$') THEN
  RAISE EXCEPTION 'Resultado inválido.' USING ERRCODE='22023'; END IF;
 IF (p_payload->'entry'->>'diceCount')::integer<>jsonb_array_length(p_payload->'entry'->'results')
 OR NOT (p_payload->'entry'->'results' @> jsonb_build_array((p_payload->'entry'->>'bestResult')::integer))
 OR (p_payload->'entry'->>'bonus')::integer<>(p_payload->'entry'->>'skillBonus')::integer+(p_payload->'entry'->>'otherBonuses')::integer
 OR (p_payload->'entry'->>'total')::integer<>(p_payload->'entry'->>'bestResult')::integer+(p_payload->'entry'->>'bonus')::integer THEN
  RAISE EXCEPTION 'Resultado e parcelas divergentes.' USING ERRCODE='22023'; END IF;
 IF burst_active THEN
  IF p_payload->'weaponBurst' IS DISTINCT FROM burst_snapshot OR jsonb_typeof(p_payload->'attackContext') IS DISTINCT FROM 'object'
   OR coalesce(p_payload->'attackContext'->>'attribute','') !~ '^-?[0-9]{1,2}$'
   OR coalesce(p_payload->'attackContext'->>'baseDicePenalty','') !~ '^[0-9]{1,2}$' THEN
   RAISE EXCEPTION 'A prévia da rajada diverge da arma atual.' USING ERRCODE='22023'; END IF;
  IF (p_payload->'attackContext'->>'attribute')::integer IS DISTINCT FROM ficha.agility THEN
   RAISE EXCEPTION 'O atributo mudou antes da confirmação.' USING ERRCODE='40001'; END IF;
  -- Outras penalidades continuam declaradas pelo motor de condições/poderes da ficha.
  base_penalty:=(p_payload->'attackContext'->>'baseDicePenalty')::integer;
  IF base_penalty>20 THEN RAISE EXCEPTION 'Penalidade de dados inválida.' USING ERRCODE='22023'; END IF;
  keep_low:=ficha.agility<=0 OR ficha.agility-base_penalty-burst_penalty<1;
  pool_count:=CASE WHEN ficha.agility<=0 THEN 2+abs(ficha.agility)+base_penalty+burst_penalty
   WHEN keep_low THEN ficha.agility+base_penalty+burst_penalty ELSE ficha.agility-base_penalty-burst_penalty END;
  IF jsonb_array_length(p_payload->'entry'->'results') IS DISTINCT FROM pool_count
   OR p_payload->'entry'->'isDisadvantage' IS DISTINCT FROM to_jsonb(keep_low) THEN
   RAISE EXCEPTION 'O pool não corresponde à penalidade da rajada.' USING ERRCODE='22023'; END IF;
  SELECT CASE WHEN keep_low THEN min((d #>> '{}')::integer) ELSE max((d #>> '{}')::integer) END
   INTO actual_kept FROM jsonb_array_elements(p_payload->'entry'->'results') d;
  IF coalesce(p_payload->'entry'->>'bestResult','') !~ '^[0-9]{1,2}$'
   OR (p_payload->'entry'->>'bestResult')::integer IS DISTINCT FROM actual_kept THEN
   RAISE EXCEPTION 'Dado selecionado diverge do pool da rajada.' USING ERRCODE='22023'; END IF;
 END IF;
 -- Sorteio após as validações; fingerprint usa o pedido original, jamais o d10 calculado.
 IF p_selection ? 'concealment' THEN
 concealment:=public.resolve_weapon_concealment(weapon,p_selection->>'concealment',source_blind,declared_defense);
 p_payload:=jsonb_set(p_payload,'{concealmentResult}',concealment);
 p_payload:=jsonb_set(p_payload,'{entry}',((p_payload->'entry')-'success'-'targetDT'-'concealmentResult')||jsonb_build_object('concealmentResult',concealment));
 IF declared_defense IS NOT NULL THEN p_payload:=jsonb_set(p_payload,'{entry,targetDT}',to_jsonb(declared_defense)); END IF;
 IF (concealment->>'failed')::boolean OR declared_defense IS NOT NULL THEN
 p_payload:=jsonb_set(p_payload,'{entry,success}',to_jsonb(NOT (concealment->>'failed')::boolean AND (declared_defense IS NULL OR (p_payload->'entry'->>'total')::integer>=declared_defense)));
 END IF;
 ELSE
 p_payload:=p_payload-'concealmentResult';
 p_payload:=jsonb_set(p_payload,'{entry}',(p_payload->'entry')-'concealmentResult');
 END IF;
 SELECT coalesce(sum(remaining),0) INTO temporary_before FROM public.character_temporary_resources WHERE character_id=p_character_id AND resource='pe';
 IF ficha.pe_current+temporary_before<cost THEN RAISE EXCEPTION 'PE insuficiente.' USING ERRCODE='22023'; END IF;
 temporary_used:=public.consume_temporary_resource(p_character_id,'pe',cost);
 UPDATE public.characters SET pe_current=pe_current-cost+temporary_used WHERE id=p_character_id;
 INSERT INTO public.character_activity_events(id,operation_id,character_id,author_id,category,status,payload,request_hash)
 VALUES(p_operation_id,p_operation_id,p_character_id,auth.uid(),'roll','confirmed',p_payload||jsonb_build_object(
  'kind','combat_attack','weaponBurst',burst_snapshot,'selection',p_selection,'peCost',cost,'peBefore',ficha.pe_current,
  'peAfter',ficha.pe_current-cost+temporary_used,'temporaryPEUsed',temporary_used,
  'temporaryPEBefore',temporary_before,'temporaryPEAfter',temporary_before-temporary_used),fingerprint) RETURNING * INTO receipt;
 RETURN public.record_ritual_pe_budget(receipt.id,budget,cost,'ability',minimum);
END $function$
;
