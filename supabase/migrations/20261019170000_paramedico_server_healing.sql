-- Livro Base v1.3, p. 30-31: Paramédico requer Medicina treinada e kit
-- de medicina; ação padrão, 2 PE e 2d10, com +1d10/+1 PE em 40/65/99%.
-- Páginas 40 e 63: um kit de perícia é específico para sua perícia.
-- A mesa declara ação e adjacência; o servidor confirma os fatos persistidos.
CREATE FUNCTION public.character_has_medical_kit(p_inventory jsonb)
RETURNS boolean LANGUAGE sql IMMUTABLE SET search_path=public,pg_temp AS $$
 SELECT CASE WHEN jsonb_typeof(p_inventory)='array' THEN EXISTS (
  SELECT 1 FROM jsonb_array_elements(p_inventory) item
  WHERE jsonb_typeof(item)='object'
   AND CASE WHEN item ? 'quantity' THEN item->>'quantity' ~ '^[1-9][0-9]*$' ELSE true END
   AND (
    (item->>'catalogId'='kit_pericia' AND item->'accessoryConfiguration'->>'kitSkill'='medicina')
    OR public.creation_identifier(item->>'name') IN ('kit-de-medicina','kit-medico')
    OR (item->'appliedAccessoryModifications' ? 'instrumental'
      AND item->'accessoryConfiguration'->>'kitSkill'='medicina')
   )
 ) ELSE false END;
$$;
REVOKE ALL ON FUNCTION public.character_has_medical_kit(jsonb) FROM PUBLIC,anon,authenticated;

-- A mesma avaliação orienta a interface; a confirmação refaz todos os testes.
CREATE FUNCTION public.get_character_paramedico_options(p_character_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE source public.characters; trained boolean; kit boolean; eligible boolean;
 targets jsonb;
BEGIN
 IF NOT public.can_manage_character_activity(p_character_id) THEN
  RAISE EXCEPTION 'Ficha não autorizada.' USING ERRCODE='42501'; END IF;
 SELECT * INTO source FROM public.characters WHERE id=p_character_id;
 SELECT coalesce(bool_or(key='medicina' AND value ~ '^[1-3]$'),false) INTO trained
  FROM jsonb_each_text(CASE WHEN jsonb_typeof(source.skills)='object' THEN source.skills ELSE '{}'::jsonb END);
 kit:=public.character_has_medical_kit(source.inventory);
 eligible:=lower(source.class)='especialista' AND source.nex>=10 AND (
  public.creation_identifier(source.class_track) IN ('medico-de-campo','medico-campo')
  OR (source.nex>=50 AND public.creation_identifier(source.versatility_track->>'trackId') IN ('medico-de-campo','medico-campo')
   AND source.versatility_track->>'abilityId'='paramedico'));
 SELECT coalesce(jsonb_agg(jsonb_build_object('id',target.id,'name',target.name,
  'currentHp',target.hp_current,'maxHp',target.hp_max) ORDER BY target.name,target.id),'[]'::jsonb)
 INTO targets FROM public.get_character_estrategista_targets(p_character_id) linked
 JOIN public.characters target ON target.id=linked.id;
 RETURN jsonb_build_object('eligible',eligible,'trained',trained,'medicalKit',kit,
  'maxExtraDice',(source.nex>=40)::integer+(source.nex>=65)::integer+(source.nex>=99)::integer,
  'originBonus',CASE WHEN public.creation_identifier(source.origin)='agente-de-saude' THEN source.intellect ELSE 0 END,
  'targets',targets);
END $$;
REVOKE ALL ON FUNCTION public.get_character_paramedico_options(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_character_paramedico_options(uuid) TO authenticated;

-- Um único recibo controla reenvios. Falha em qualquer validação ou no teto de
-- PE reverte simultaneamente rolagem, PV, condições, PE e ambos os históricos.
CREATE FUNCTION public.confirm_character_paramedico(p_operation_id uuid,p_character_id uuid,p_request jsonb)
RETURNS public.character_activity_events LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE source public.characters; target public.characters; receipt public.character_activity_events;
 options jsonb; budget jsonb; fingerprint text; target_id uuid; extra integer; cost integer;
 dice integer[]:=ARRAY[]::integer[]; die integer; bonus integer; total integer; healed integer;
 next_hp integer; next_conditions jsonb; temporary_before integer; temporary_used integer;
 target_event_id uuid;
BEGIN
 IF NOT public.can_manage_character_activity(p_character_id) THEN
  RAISE EXCEPTION 'Ficha não autorizada.' USING ERRCODE='42501'; END IF;
 IF p_operation_id IS NULL OR jsonb_typeof(p_request) IS DISTINCT FROM 'object'
  OR octet_length(p_request::text)>2048
  OR p_request->'standardActionConfirmed' IS DISTINCT FROM 'true'::jsonb
  OR coalesce((p_request->>'targetId') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',true)
  OR coalesce((p_request->>'extraDice') !~ '^[0-3]$',true)
  OR coalesce((p_request->>'expectedPE') !~ '^[0-9]{1,6}$',true)
  OR coalesce((p_request->>'expectedNex') !~ '^[0-9]{1,2}$',true)
  OR coalesce((p_request->>'expectedTargetHP') !~ '^[0-9]{1,6}$',true) THEN
  RAISE EXCEPTION 'Confirme a ação, a adjacência e os valores atuais.' USING ERRCODE='22023'; END IF;
 target_id:=(p_request->>'targetId')::uuid;
 IF target_id<>p_character_id AND p_request->'adjacencyConfirmed' IS DISTINCT FROM 'true'::jsonb THEN
  RAISE EXCEPTION 'Confirme com a mesa que o aliado está adjacente.' USING ERRCODE='22023'; END IF;
 extra:=(p_request->>'extraDice')::integer;
 cost:=2+extra;
 fingerprint:=md5(jsonb_build_array('paramedico',p_character_id,p_request)::text);
 PERFORM pg_advisory_xact_lock(hashtextextended(p_operation_id::text,0));
 PERFORM public.lock_character_pe_turn(p_character_id);
 SELECT * INTO receipt FROM public.character_activity_events WHERE operation_id=p_operation_id;
 IF FOUND THEN
  IF receipt.author_id<>auth.uid() OR receipt.request_hash<>fingerprint THEN
   RAISE EXCEPTION 'Operação reutilizada.' USING ERRCODE='23505'; END IF;
  RETURN receipt;
 END IF;
 -- Ordem estável dos locks evita conflito entre duas curas simultâneas.
 PERFORM id FROM public.characters WHERE id IN (p_character_id,target_id) ORDER BY id FOR UPDATE;
 SELECT * INTO source FROM public.characters WHERE id=p_character_id;
 SELECT * INTO target FROM public.characters WHERE id=target_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'Alvo indisponível.' USING ERRCODE='22023'; END IF;
 options:=public.get_character_paramedico_options(p_character_id);
 IF options->'eligible' IS DISTINCT FROM 'true'::jsonb
  OR options->'trained' IS DISTINCT FROM 'true'::jsonb
  OR options->'medicalKit' IS DISTINCT FROM 'true'::jsonb THEN
  RAISE EXCEPTION 'Paramédico requer a trilha, Medicina treinada e kit de medicina identificado.' USING ERRCODE='55004'; END IF;
 IF extra>(options->>'maxExtraDice')::integer THEN
  RAISE EXCEPTION 'Dados extras indisponíveis para este NEX.' USING ERRCODE='55004'; END IF;
 IF target_id<>p_character_id AND NOT EXISTS(
  SELECT 1 FROM public.get_character_estrategista_targets(p_character_id) linked WHERE linked.id=target_id
 ) THEN RAISE EXCEPTION 'Alvo não está vinculado à mesma campanha.' USING ERRCODE='42501'; END IF;
 IF source.pe_current::text IS DISTINCT FROM p_request->>'expectedPE'
  OR source.nex::text IS DISTINCT FROM p_request->>'expectedNex'
  OR target.hp_current::text IS DISTINCT FROM p_request->>'expectedTargetHP' THEN
  RAISE EXCEPTION 'Ficha mudou. Atualize antes de confirmar.' USING ERRCODE='40001'; END IF;
 budget:=public.get_character_pe_budget(p_character_id);
 IF p_request->>'expectedTurnKey' IS DISTINCT FROM budget->>'key' THEN
  RAISE EXCEPTION 'Turno mudou. Atualize antes de confirmar.' USING ERRCODE='40001'; END IF;
 IF budget->>'mode'='combat' AND budget->>'actorId' IS DISTINCT FROM p_character_id::text THEN
  RAISE EXCEPTION 'Aguarde o turno do personagem para usar Paramédico.' USING ERRCODE='55004'; END IF;
 SELECT coalesce(sum(remaining),0)::integer INTO temporary_before FROM public.character_temporary_resources
  WHERE character_id=p_character_id AND resource='pe';
 IF source.pe_current+temporary_before<cost THEN
  RAISE EXCEPTION 'PE insuficiente.' USING ERRCODE='22023'; END IF;
 FOR die IN 1..(2+extra) LOOP dice:=array_append(dice,floor(random()*10)::integer+1); END LOOP;
 bonus:=(options->>'originBonus')::integer;
 SELECT coalesce(sum(value),0)::integer+bonus INTO total FROM unnest(dice) value;
 next_hp:=least(target.hp_max,target.hp_current+total);
 healed:=next_hp-target.hp_current;
 next_conditions:=public.reconcile_resource_conditions(target.conditions,target.hp_current,next_hp,
  target.hp_max,target.san_current,target.san_current,target.san_max,0);
 temporary_used:=public.consume_temporary_resource(p_character_id,'pe',cost);
 UPDATE public.characters SET pe_current=pe_current-cost+temporary_used WHERE id=p_character_id;
 UPDATE public.characters SET hp_current=next_hp,conditions=next_conditions WHERE id=target_id;
 IF target_id<>p_character_id THEN
  target_event_id:=gen_random_uuid();
  INSERT INTO public.character_activity_events(id,operation_id,character_id,author_id,category,status,payload,request_hash)
  VALUES(target_event_id,target_event_id,target_id,auth.uid(),'application','confirmed',
   jsonb_build_object('kind','paramedico_healing_received','sourceCharacterId',p_character_id,
    'sourceName',source.name,'hpBefore',target.hp_current,'hpAfter',next_hp,
    'healed',healed,'conditionsAfter',next_conditions,'sourceOperationId',p_operation_id),fingerprint);
 END IF;
 INSERT INTO public.character_activity_events(id,operation_id,character_id,author_id,category,status,payload,request_hash)
 VALUES(p_operation_id,p_operation_id,p_character_id,auth.uid(),'application','confirmed',
  jsonb_build_object('kind','paramedico','targetId',target_id,'targetName',target.name,
   'dice',to_jsonb(dice),'diceCount',2+extra,'originBonus',bonus,'totalHealing',total,
   'effectiveHealing',healed,'hpBefore',target.hp_current,'hpAfter',next_hp,
   'peCost',cost,'peBefore',source.pe_current,'peAfter',source.pe_current-cost+temporary_used,
   'temporaryPEUsed',temporary_used,'standardActionConfirmed',true,'adjacencyConfirmed',target_id<>p_character_id,
   'targetEventId',target_event_id,'conditionsAfter',next_conditions),fingerprint)
 RETURNING * INTO receipt;
 RETURN public.record_ritual_pe_budget(receipt.id,budget,cost,'ability',false);
END $$;
REVOKE ALL ON FUNCTION public.confirm_character_paramedico(uuid,uuid,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.confirm_character_paramedico(uuid,uuid,jsonb) TO authenticated;
