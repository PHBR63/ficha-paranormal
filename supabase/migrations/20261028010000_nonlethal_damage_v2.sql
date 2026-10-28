-- Livro Base v1.3, p. 88: dano não letal é persistido separadamente,
-- soma com o dano letal apenas para inconsciência e é curado primeiro.
ALTER TABLE public.characters
 ADD COLUMN nonlethal_damage integer NOT NULL DEFAULT 0
 CHECK (nonlethal_damage BETWEEN 0 AND 1000000);

-- Remove e recria somente a condição cuja origem é este reservatório.
-- Condições desconhecidas e Inconsciente de outras origens são preservadas.
CREATE FUNCTION public.reconcile_nonlethal_conditions(
 p_conditions jsonb,p_hp integer,p_hp_max integer,p_nonlethal integer,
 p_source_operation_id uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
DECLARE result jsonb:='[]'::jsonb; item jsonb; combined integer;
 existing_source boolean:=false;
BEGIN
 IF p_conditions IS NULL OR jsonb_typeof(p_conditions)<>'array'
  OR p_hp IS NULL OR p_hp<0 OR p_hp_max IS NULL OR p_hp_max<1
  OR p_nonlethal IS NULL OR p_nonlethal<0 THEN
  RAISE EXCEPTION 'Estado de dano não letal inválido.' USING ERRCODE='22023';
 END IF;
 combined:=greatest(0,p_hp_max-p_hp)+p_nonlethal;
 FOR item IN SELECT value FROM jsonb_array_elements(p_conditions) LOOP
  IF public.creation_identifier(coalesce(item->>'id',item->>'name',item#>>'{}'))='inconsciente'
   AND item->>'sourceKind'='nonlethal_damage' THEN
   IF p_hp>0 AND combined>=p_hp_max THEN
    result:=result||jsonb_build_array(item); existing_source:=true;
   END IF;
   CONTINUE;
  END IF;
  result:=result||jsonb_build_array(item);
 END LOOP;
 IF p_hp>0 AND combined>=p_hp_max AND NOT existing_source THEN
  result:=result||jsonb_build_array(jsonb_strip_nulls(jsonb_build_object(
   'id','inconsciente','name','Inconsciente','turnsRemaining',NULL,
   'addedAt',clock_timestamp(),'sourceKind','nonlethal_damage',
   'sourceOperationId',p_source_operation_id)));
 END IF;
 IF jsonb_array_length(result)>100 OR octet_length(result::text)>30000 THEN
  RAISE EXCEPTION 'Condições excedem o limite.' USING ERRCODE='22023'; END IF;
 RETURN result;
END $$;

-- Aplica a quantidade de cura solicitada antes de qualquer teto de PV. Assim,
-- PV cheio também pode remover dano não letal e todos os chamadores recebem o
-- mesmo recibo para histórico, Resgate e recuperação idempotente.
CREATE FUNCTION public.apply_character_healing_priority(
 p_character_id uuid,p_requested integer,p_expected_hp integer,
 p_expected_nonlethal integer DEFAULT NULL,p_source_operation_id uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE ficha public.characters; nonlethal_healed integer; hp_healed integer;
 hp_after integer; nonlethal_after integer; next_conditions jsonb;
BEGIN
 IF p_character_id IS NULL OR p_requested IS NULL OR p_requested NOT BETWEEN 0 AND 1000000
  OR p_expected_hp IS NULL OR p_expected_hp<0 THEN
  RAISE EXCEPTION 'Quantidade de cura inválida.' USING ERRCODE='22023'; END IF;
 SELECT * INTO ficha FROM public.characters WHERE id=p_character_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Ficha de cura indisponível.' USING ERRCODE='22023'; END IF;
 IF ficha.hp_current<>p_expected_hp
  OR (p_expected_nonlethal IS NOT NULL AND ficha.nonlethal_damage<>p_expected_nonlethal) THEN
  RAISE EXCEPTION 'PV ou dano não letal mudou. Atualize a ficha.' USING ERRCODE='40001'; END IF;
 nonlethal_healed:=least(ficha.nonlethal_damage,p_requested);
 nonlethal_after:=ficha.nonlethal_damage-nonlethal_healed;
 hp_healed:=least(greatest(0,ficha.hp_max-ficha.hp_current),p_requested-nonlethal_healed);
 hp_after:=ficha.hp_current+hp_healed;
 next_conditions:=public.reconcile_resource_conditions(ficha.conditions,ficha.hp_current,hp_after,
  ficha.hp_max,ficha.san_current,ficha.san_current,ficha.san_max,0);
 next_conditions:=public.reconcile_nonlethal_conditions(next_conditions,hp_after,ficha.hp_max,
  nonlethal_after,p_source_operation_id);
 PERFORM set_config('ordem_roll.nonlethal_internal','1',true);
 UPDATE public.characters SET hp_current=hp_after,nonlethal_damage=nonlethal_after,
  conditions=next_conditions WHERE id=p_character_id;
 PERFORM set_config('ordem_roll.nonlethal_internal','0',true);
 RETURN jsonb_build_object(
  'requestedHealing',p_requested,'effectiveHealing',nonlethal_healed+hp_healed,
  'hpBefore',ficha.hp_current,'hpHealed',hp_healed,'hpAfter',hp_after,'hpMax',ficha.hp_max,
  'nonlethalBefore',ficha.nonlethal_damage,'nonlethalHealed',nonlethal_healed,
  'nonlethalAfter',nonlethal_after,'conditionsBefore',ficha.conditions,
  'conditionsAfter',next_conditions);
END $$;
REVOKE ALL ON FUNCTION public.apply_character_healing_priority(uuid,integer,integer,integer,uuid)
 FROM PUBLIC,anon,authenticated;

-- Mantém a cadeia pública de Paramédico (Resgate, ação padrão e incapacidade)
-- e corrige apenas seu núcleo base. A diferença entre o estado antes/depois do
-- núcleo legado permite completar a cura solicitada sem rerrolar ou cobrar PE.
ALTER FUNCTION public.confirm_character_paramedico_core(uuid,uuid,jsonb)
 RENAME TO confirm_character_paramedico_nonlethal_legacy_core;
REVOKE ALL ON FUNCTION public.confirm_character_paramedico_nonlethal_legacy_core(uuid,uuid,jsonb)
 FROM PUBLIC,anon,authenticated;
CREATE FUNCTION public.confirm_character_paramedico_core(
 p_operation_id uuid,p_character_id uuid,p_request jsonb)
RETURNS public.character_activity_events LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE receipt public.character_activity_events; existed boolean; target_id uuid;
 hp_before integer; nonlethal_before integer; conditions_before jsonb;
 requested integer; healing jsonb;
 hp_after integer; nonlethal_after integer; conditions_after jsonb; total_effective integer;
BEGIN
 IF NOT public.can_manage_character_activity(p_character_id) THEN
  RAISE EXCEPTION 'Ficha não autorizada.' USING ERRCODE='42501'; END IF;
 IF p_operation_id IS NULL OR jsonb_typeof(p_request) IS DISTINCT FROM 'object'
  OR coalesce((p_request->>'targetId') !~*
   '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',true) THEN
  RAISE EXCEPTION 'Alvo de Paramédico inválido.' USING ERRCODE='22023'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_operation_id::text,0));
 SELECT EXISTS(SELECT 1 FROM public.character_activity_events WHERE operation_id=p_operation_id) INTO existed;
 IF NOT existed THEN
  target_id:=(p_request->>'targetId')::uuid;
  PERFORM id FROM public.characters WHERE id IN (p_character_id,target_id) ORDER BY id FOR UPDATE;
  SELECT hp_current,nonlethal_damage,conditions INTO hp_before,nonlethal_before,conditions_before
   FROM public.characters WHERE id=target_id;
 END IF;
 PERFORM set_config('ordem_roll.nonlethal_legacy_heal','1',true);
 receipt:=public.confirm_character_paramedico_nonlethal_legacy_core(
  p_operation_id,p_character_id,p_request);
 PERFORM set_config('ordem_roll.nonlethal_legacy_heal','0',true);
 IF existed THEN RETURN receipt; END IF;
 requested:=(receipt.payload->>'totalHealing')::integer;
 PERFORM 1 FROM public.characters WHERE id=target_id FOR UPDATE;
 PERFORM set_config('ordem_roll.nonlethal_internal','1',true);
 UPDATE public.characters SET hp_current=hp_before,nonlethal_damage=nonlethal_before,
  conditions=conditions_before WHERE id=target_id;
 healing:=public.apply_character_healing_priority(
  target_id,requested,hp_before,nonlethal_before,p_operation_id);
 hp_after:=(healing->>'hpAfter')::integer;
 nonlethal_after:=(healing->>'nonlethalAfter')::integer;
 conditions_after:=healing->'conditionsAfter';
 total_effective:=(healing->>'effectiveHealing')::integer;
 UPDATE public.character_activity_events SET payload=payload||jsonb_build_object(
  'effectiveHealing',total_effective,'hpBefore',hp_before,'hpAfter',hp_after,
  'nonlethalBefore',nonlethal_before,
  'nonlethalHealed',nonlethal_before-nonlethal_after,
  'nonlethalAfter',nonlethal_after,'conditionsAfter',conditions_after)
 WHERE id=receipt.id RETURNING * INTO receipt;
 IF receipt.payload->>'targetEventId' IS NOT NULL THEN
  UPDATE public.character_activity_events SET payload=payload||jsonb_build_object(
   'healed',total_effective,'effectiveHealing',total_effective,
   'hpBefore',hp_before,'hpAfter',hp_after,'nonlethalBefore',nonlethal_before,
   'nonlethalHealed',nonlethal_before-nonlethal_after,
   'nonlethalAfter',nonlethal_after,'conditionsAfter',conditions_after)
  WHERE id=(receipt.payload->>'targetEventId')::uuid;
 END IF;
 RETURN receipt;
END $$;
REVOKE ALL ON FUNCTION public.confirm_character_paramedico_core(uuid,uuid,jsonb)
 FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.reconcile_nonlethal_conditions(jsonb,integer,integer,integer,uuid)
 FROM PUBLIC,anon,authenticated;

-- Centraliza a prioridade para todos os fluxos públicos que aumentam PV,
-- inclusive ajustes agrupados, Paramédico e efeitos de cura de rituais.
CREATE FUNCTION public.prioritize_character_nonlethal_healing()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF NEW.hp_current>OLD.hp_current AND OLD.nonlethal_damage>0
  AND coalesce(current_setting('ordem_roll.nonlethal_internal',true),'')<>'1'
  AND coalesce(current_setting('ordem_roll.nonlethal_legacy_heal',true),'')<>'1'
  AND coalesce(current_setting('ordem_roll.reanimation',true),'')<>'1' THEN
  RAISE EXCEPTION 'Cura deve remover o dano não letal antes de recuperar PV.'
   USING ERRCODE='42501';
 END IF;
 IF NEW.nonlethal_damage IS DISTINCT FROM OLD.nonlethal_damage
  AND coalesce(current_setting('ordem_roll.nonlethal_internal',true),'')<>'1' THEN
  RAISE EXCEPTION 'Dano não letal só pode ser alterado por uma regra confirmada no servidor.'
   USING ERRCODE='42501';
 END IF;
 NEW.conditions:=public.reconcile_nonlethal_conditions(
  coalesce(NEW.conditions,'[]'::jsonb),NEW.hp_current,NEW.hp_max,NEW.nonlethal_damage,NULL);
 RETURN NEW;
END $$;
CREATE TRIGGER prioritize_character_nonlethal_healing
 BEFORE UPDATE OF hp_current,nonlethal_damage,conditions ON public.characters
 FOR EACH ROW EXECUTE FUNCTION public.prioritize_character_nonlethal_healing();
REVOKE ALL ON FUNCTION public.prioritize_character_nonlethal_healing()
 FROM PUBLIC,anon,authenticated;

-- Efeitos e rituais de cura passam a registrar a cura efetiva completa,
-- incluindo a parcela usada no reservatório não letal.
CREATE OR REPLACE FUNCTION public.apply_character_effect_core(
 p_operation_id uuid,p_character_id uuid,p_kind text,p_value jsonb,p_expected jsonb,
 p_cast_event_id uuid DEFAULT NULL,p_campaign_id uuid DEFAULT NULL,p_campaign_version text DEFAULT NULL)
RETURNS public.character_activity_events LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE result public.character_activity_events; ficha public.characters; cast_event public.character_activity_events;
 fingerprint text; before_state jsonb; after_state jsonb; amount integer; next_conditions jsonb;
 next_hp integer; temp_used integer:=0; healing jsonb:=NULL;
BEGIN
 PERFORM public.validate_character_activity_context(p_character_id,p_campaign_id,p_campaign_version);
 IF p_kind IS NULL OR p_kind NOT IN ('heal','damage','conditions') THEN
  RAISE EXCEPTION 'Este efeito requer resolução manual; aplicação automática indisponível.' USING ERRCODE='0A000'; END IF;
 IF p_operation_id IS NULL OR p_expected IS NULL OR jsonb_typeof(p_expected)<>'object'
  OR p_value IS NULL OR octet_length(p_value::text)>16000 THEN
  RAISE EXCEPTION 'Aplicação inválida.' USING ERRCODE='22023'; END IF;
 fingerprint:=md5(jsonb_build_array(p_character_id,p_kind,p_value,p_expected,p_cast_event_id,p_campaign_id,p_campaign_version)::text);
 PERFORM pg_advisory_xact_lock(hashtextextended(p_operation_id::text,0));
 SELECT * INTO result FROM public.character_activity_events WHERE operation_id=p_operation_id;
 IF FOUND THEN
  IF result.author_id<>auth.uid() OR result.request_hash<>fingerprint THEN
   RAISE EXCEPTION 'ID de operação reutilizado.' USING ERRCODE='23505'; END IF;
  RETURN result; END IF;
 IF p_cast_event_id IS NOT NULL THEN
  SELECT * INTO cast_event FROM public.character_activity_events WHERE id=p_cast_event_id;
  IF NOT FOUND OR cast_event.category<>'ritual' OR NOT public.can_manage_character_activity(cast_event.character_id) THEN
   RAISE EXCEPTION 'Conjuração não autorizada.' USING ERRCODE='42501'; END IF;
 END IF;
 SELECT * INTO ficha FROM public.characters WHERE id=p_character_id FOR UPDATE;
 IF p_kind IN ('heal','damage') THEN
  IF jsonb_typeof(p_value)<>'number' OR (p_value::text)::numeric<>trunc((p_value::text)::numeric)
   OR (p_value::text)::numeric NOT BETWEEN 0 AND 1000000 THEN
   RAISE EXCEPTION 'Quantidade inválida.' USING ERRCODE='22023'; END IF;
  amount:=(p_value::text)::integer;
  before_state:=jsonb_build_object('hp_current',ficha.hp_current,'hp_max',ficha.hp_max,
   'nonlethal_damage',ficha.nonlethal_damage,'conditions',ficha.conditions);
  IF p_expected->'hp_current' IS DISTINCT FROM to_jsonb(ficha.hp_current)
   OR p_expected->'hp_max' IS DISTINCT FROM to_jsonb(ficha.hp_max) THEN
   RAISE EXCEPTION 'PV atualizado por outra operação. Recarregue.' USING ERRCODE='40001'; END IF;
  IF p_kind='heal' THEN
   healing:=public.apply_character_healing_priority(p_character_id,amount,ficha.hp_current,NULL,p_operation_id);
   after_state:=jsonb_build_object('hp_current',(healing->>'hpAfter')::integer,
    'hp_max',ficha.hp_max,'nonlethal_damage',(healing->>'nonlethalAfter')::integer,
    'conditions',healing->'conditionsAfter');
  ELSE
   temp_used:=public.consume_temporary_resource(p_character_id,'hp',amount,p_expected->>'damageType');
   next_hp:=greatest(0,ficha.hp_current-amount+temp_used);
   next_conditions:=public.reconcile_resource_conditions(ficha.conditions,ficha.hp_current,next_hp,
    ficha.hp_max,ficha.san_current,ficha.san_current,ficha.san_max,amount-temp_used);
   UPDATE public.characters SET hp_current=next_hp,conditions=next_conditions WHERE id=p_character_id
    RETURNING jsonb_build_object('hp_current',hp_current,'hp_max',hp_max,
     'nonlethal_damage',nonlethal_damage,'conditions',conditions) INTO after_state;
  END IF;
 ELSE
  IF jsonb_typeof(p_value)<>'array' OR jsonb_array_length(p_value)>100
   OR EXISTS(SELECT 1 FROM jsonb_array_elements(p_value) item WHERE
    (jsonb_typeof(item)='string' AND length(trim(item#>>'{}')) NOT BETWEEN 1 AND 150)
    OR (jsonb_typeof(item)='object' AND (length(trim(coalesce(item->>'id',''))) NOT BETWEEN 1 AND 150
     OR length(trim(coalesce(item->>'name',''))) NOT BETWEEN 1 AND 200))
    OR jsonb_typeof(item) NOT IN ('string','object')) THEN
   RAISE EXCEPTION 'Condições inválidas.' USING ERRCODE='22023'; END IF;
  before_state:=jsonb_build_object('conditions',ficha.conditions);
  IF p_expected->'conditions' IS DISTINCT FROM ficha.conditions THEN
   RAISE EXCEPTION 'Condições atualizadas por outra operação. Recarregue.' USING ERRCODE='40001'; END IF;
  IF jsonb_typeof(ficha.conditions)<>'array' THEN
   RAISE EXCEPTION 'Condições existentes exigem revisão manual.' USING ERRCODE='22023'; END IF;
  SELECT ficha.conditions||coalesce(jsonb_agg(item ORDER BY ordinal),'[]'::jsonb) INTO next_conditions
  FROM (SELECT DISTINCT ON (coalesce(value->>'id',value#>>'{}')) value AS item,ordinality AS ordinal
   FROM jsonb_array_elements(p_value) WITH ORDINALITY
   ORDER BY coalesce(value->>'id',value#>>'{}'),ordinality) additions WHERE NOT EXISTS(
    SELECT 1 FROM jsonb_array_elements(ficha.conditions) old
    WHERE coalesce(old->>'id',old#>>'{}')=coalesce(item->>'id',item#>>'{}'));
  UPDATE public.characters SET conditions=next_conditions WHERE id=p_character_id;
  after_state:=jsonb_build_object('conditions',next_conditions);
 END IF;
 INSERT INTO public.character_activity_events(id,operation_id,character_id,author_id,category,status,payload,request_hash,campaign_id,campaign_version)
 VALUES(p_operation_id,p_operation_id,p_character_id,auth.uid(),'application','confirmed',
  jsonb_build_object('kind',p_kind,'value',p_value,'before',before_state,'after',after_state,
   'castEventId',p_cast_event_id,'temporaryHPUsed',temp_used,'healing',healing,
   'effectiveHealing',coalesce((healing->>'effectiveHealing')::integer,0),
   'nonlethalHealed',coalesce((healing->>'nonlethalHealed')::integer,0)),
  fingerprint,p_campaign_id,p_campaign_version) RETURNING * INTO result;
 RETURN result;
END $$;

-- Ajuste unitário de PV conserva a assinatura antiga. Em aumentos, o valor
-- delta/absoluto vira quantidade solicitada e o recibo é corrigido com o
-- estado realmente salvo.
ALTER FUNCTION public.change_character_resource(uuid,uuid,text,text,integer,integer,integer)
 RENAME TO change_character_resource_nonlethal_legacy;
REVOKE ALL ON FUNCTION public.change_character_resource_nonlethal_legacy(uuid,uuid,text,text,integer,integer,integer)
 FROM PUBLIC,anon,authenticated;
CREATE FUNCTION public.change_character_resource(
 p_operation_id uuid,p_character_id uuid,p_resource text,p_mode text,
 p_value integer,p_expected_current integer,p_expected_max integer)
RETURNS public.character_activity_events LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE receipt public.character_activity_events; existed boolean; ficha public.characters;
 requested integer; healing jsonb;
BEGIN
 IF NOT public.can_manage_character_activity(p_character_id) THEN
  RAISE EXCEPTION 'Sem permissão para alterar esta ficha.' USING ERRCODE='42501'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_operation_id::text,0));
 SELECT EXISTS(SELECT 1 FROM public.character_activity_events WHERE operation_id=p_operation_id) INTO existed;
 IF NOT existed THEN SELECT * INTO ficha FROM public.characters WHERE id=p_character_id FOR UPDATE; END IF;
 PERFORM set_config('ordem_roll.nonlethal_legacy_heal','1',true);
 receipt:=public.change_character_resource_nonlethal_legacy(
  p_operation_id,p_character_id,p_resource,p_mode,p_value,p_expected_current,p_expected_max);
 PERFORM set_config('ordem_roll.nonlethal_legacy_heal','0',true);
 IF existed OR p_resource<>'hp' THEN RETURN receipt; END IF;
 requested:=CASE WHEN p_mode='delta' AND p_value>0 THEN p_value
  WHEN p_mode='set' AND p_value>ficha.hp_current THEN p_value-ficha.hp_current ELSE 0 END;
 IF requested=0 THEN RETURN receipt; END IF;
 PERFORM 1 FROM public.characters WHERE id=p_character_id FOR UPDATE;
 PERFORM set_config('ordem_roll.nonlethal_internal','1',true);
 UPDATE public.characters SET hp_current=ficha.hp_current,
  nonlethal_damage=ficha.nonlethal_damage,conditions=ficha.conditions WHERE id=p_character_id;
 healing:=public.apply_character_healing_priority(
  p_character_id,requested,ficha.hp_current,ficha.nonlethal_damage,p_operation_id);
 UPDATE public.character_activity_events SET payload=payload||jsonb_build_object(
  'before',jsonb_build_object('current',ficha.hp_current,'max',ficha.hp_max,
   'nonlethalDamage',ficha.nonlethal_damage,'conditions',ficha.conditions),
  'after',jsonb_build_object('current',(healing->>'hpAfter')::integer,'max',ficha.hp_max,
   'nonlethalDamage',(healing->>'nonlethalAfter')::integer,
   'conditions',healing->'conditionsAfter'),
  'effectiveHealing',(healing->>'effectiveHealing')::integer,
  'nonlethalHealed',(healing->>'nonlethalHealed')::integer)
 WHERE id=receipt.id RETURNING * INTO receipt;
 RETURN receipt;
END $$;
REVOKE ALL ON FUNCTION public.change_character_resource(uuid,uuid,text,text,integer,integer,integer)
 FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.change_character_resource(uuid,uuid,text,text,integer,integer,integer)
 TO authenticated;

-- A edição agrupada mantém PE, SAN e condições enviados, mas qualquer aumento
-- de PV respeita o mesmo reservatório antes de finalizar seu recibo.
ALTER FUNCTION public.change_character_resources(uuid,uuid,jsonb,jsonb,jsonb)
 RENAME TO change_character_resources_nonlethal_legacy;
REVOKE ALL ON FUNCTION public.change_character_resources_nonlethal_legacy(uuid,uuid,jsonb,jsonb,jsonb)
 FROM PUBLIC,anon,authenticated;
CREATE FUNCTION public.change_character_resources(
 p_operation_id uuid,p_character_id uuid,p_values jsonb,p_expected jsonb,p_conditions jsonb)
RETURNS public.character_activity_events LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE receipt public.character_activity_events; existed boolean; before_row public.characters;
 after_row public.characters; requested integer; healing jsonb;
BEGIN
 IF NOT public.can_manage_character_activity(p_character_id) THEN
  RAISE EXCEPTION 'Sem permissão para alterar esta ficha.' USING ERRCODE='42501'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_operation_id::text,0));
 SELECT EXISTS(SELECT 1 FROM public.character_activity_events WHERE operation_id=p_operation_id) INTO existed;
 IF NOT existed THEN SELECT * INTO before_row FROM public.characters WHERE id=p_character_id FOR UPDATE; END IF;
 PERFORM set_config('ordem_roll.nonlethal_legacy_heal','1',true);
 receipt:=public.change_character_resources_nonlethal_legacy(
  p_operation_id,p_character_id,p_values,p_expected,p_conditions);
 PERFORM set_config('ordem_roll.nonlethal_legacy_heal','0',true);
 IF existed THEN RETURN receipt; END IF;
 requested:=greatest(0,(p_values->>'hp')::integer-before_row.hp_current);
 IF requested=0 THEN RETURN receipt; END IF;
 SELECT * INTO after_row FROM public.characters WHERE id=p_character_id FOR UPDATE;
 PERFORM set_config('ordem_roll.nonlethal_internal','1',true);
 UPDATE public.characters SET hp_current=before_row.hp_current,
  nonlethal_damage=before_row.nonlethal_damage WHERE id=p_character_id;
 healing:=public.apply_character_healing_priority(
  p_character_id,requested,before_row.hp_current,before_row.nonlethal_damage,p_operation_id);
 SELECT * INTO after_row FROM public.characters WHERE id=p_character_id;
 UPDATE public.character_activity_events SET payload=payload||jsonb_build_object(
  'before',(payload->'before')||jsonb_build_object('nonlethal_damage',before_row.nonlethal_damage),
  'after',jsonb_build_object('hp_current',after_row.hp_current,'hp_max',after_row.hp_max,
   'nonlethal_damage',after_row.nonlethal_damage,'pe_current',after_row.pe_current,
   'pe_max',after_row.pe_max,'san_current',after_row.san_current,'san_max',after_row.san_max,
   'conditions',after_row.conditions),
  'effectiveHealing',(healing->>'effectiveHealing')::integer,
  'nonlethalHealed',(healing->>'nonlethalHealed')::integer)
 WHERE id=receipt.id RETURNING * INTO receipt;
 RETURN receipt;
END $$;
REVOKE ALL ON FUNCTION public.change_character_resources(uuid,uuid,jsonb,jsonb,jsonb)
 FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.change_character_resources(uuid,uuid,jsonb,jsonb,jsonb)
 TO authenticated;

-- Resgate considera cura efetiva total, mesmo quando todo o valor foi usado
-- em dano não letal e os PV permaneceram iguais.
CREATE OR REPLACE FUNCTION public.resgate_reviewable_effect(p_payload jsonb)
RETURNS boolean LANGUAGE plpgsql IMMUTABLE SET search_path=public,pg_temp AS $$
DECLARE effect_kind text:=p_payload->>'kind'; before_hp jsonb; after_hp jsonb;
 before_conditions jsonb; after_conditions jsonb; removed boolean:=false;
BEGIN
 IF coalesce((p_payload->>'effectiveHealing') ~ '^[0-9]+$',false)
  AND (p_payload->>'effectiveHealing')::integer>0 THEN RETURN true; END IF;
 IF effect_kind='resource' AND p_payload->>'resource'='hp' THEN
  before_hp:=p_payload#>'{before,current}'; after_hp:=p_payload#>'{after,current}';
 ELSIF effect_kind IN ('resources','heal') THEN
  before_hp:=p_payload#>'{before,hp_current}'; after_hp:=p_payload#>'{after,hp_current}';
 END IF;
 IF jsonb_typeof(before_hp)='number' AND jsonb_typeof(after_hp)='number'
  AND (after_hp::text)::numeric>(before_hp::text)::numeric THEN RETURN true; END IF;
 IF effect_kind NOT IN ('replace_conditions','resources') THEN RETURN false; END IF;
 before_conditions:=p_payload#>'{before,conditions}';
 after_conditions:=p_payload#>'{after,conditions}';
 IF jsonb_typeof(before_conditions) IS DISTINCT FROM 'array'
  OR jsonb_typeof(after_conditions) IS DISTINCT FROM 'array' THEN RETURN false; END IF;
 SELECT EXISTS(SELECT 1 FROM jsonb_array_elements(before_conditions) old_condition
  WHERE NOT EXISTS(SELECT 1 FROM jsonb_array_elements(after_conditions) new_condition
   WHERE public.creation_identifier(coalesce(new_condition->>'id',new_condition#>>'{}'))=
    public.creation_identifier(coalesce(old_condition->>'id',old_condition#>>'{}')))) INTO removed;
 RETURN removed;
END $$;

CREATE OR REPLACE FUNCTION public.resgate_review_effect_label(p_payload jsonb)
RETURNS text LANGUAGE plpgsql IMMUTABLE SET search_path=public,pg_temp AS $$
DECLARE before_hp jsonb; after_hp jsonb; healed integer;
BEGIN
 healed:=CASE WHEN coalesce((p_payload->>'effectiveHealing') ~ '^[0-9]+$',false)
  THEN (p_payload->>'effectiveHealing')::integer ELSE 0 END;
 IF healed>0 AND coalesce((p_payload->>'nonlethalHealed')::integer,0)>0 THEN
  RETURN 'Cura efetiva '||healed||' (dano não letal removido '
   ||(p_payload->>'nonlethalHealed')||')';
 END IF;
 IF p_payload->>'kind'='resource' THEN
  before_hp:=p_payload#>'{before,current}'; after_hp:=p_payload#>'{after,current}';
 ELSE
  before_hp:=p_payload#>'{before,hp_current}'; after_hp:=p_payload#>'{after,hp_current}';
 END IF;
 IF jsonb_typeof(before_hp)='number' AND jsonb_typeof(after_hp)='number'
  AND (after_hp::text)::numeric>(before_hp::text)::numeric THEN
  RETURN 'PV '||before_hp::text||' → '||after_hp::text; END IF;
 RETURN 'Condição removida';
END $$;

-- Reanimação conserva sua decisão específica: retorna a 1 PV. O dano não
-- letal remanescente é mantido e a condição é reavaliada pelo mesmo trigger.
CREATE OR REPLACE FUNCTION public.confirm_character_reanimacao(
 p_operation_id uuid,p_character_id uuid,p_request jsonb)
RETURNS public.character_activity_events
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE receipt public.character_activity_events; target_id uuid; target_event_id uuid;
 actual public.characters; existed boolean;
BEGIN
 SELECT EXISTS(SELECT 1 FROM public.character_activity_events WHERE operation_id=p_operation_id) INTO existed;
 IF NOT existed THEN
  PERFORM public.require_character_medical_action(p_character_id); END IF;
 PERFORM set_config('ordem_roll.reanimation','1',true);
 receipt:=public.confirm_character_reanimacao_action_core(p_operation_id,p_character_id,p_request);
 IF existed THEN RETURN receipt; END IF;
 PERFORM set_config('ordem_roll.reanimation','0',true);
 target_id:=(receipt.payload->>'targetId')::uuid;
 target_event_id:=(receipt.payload->>'targetEventId')::uuid;
 SELECT * INTO actual FROM public.characters WHERE id=target_id;
 UPDATE public.character_activity_events SET payload=payload||jsonb_build_object(
  'hpAfter',actual.hp_current,'nonlethalAfter',actual.nonlethal_damage,
  'conditionsAfter',actual.conditions)
 WHERE id=receipt.id RETURNING * INTO receipt;
 IF target_event_id IS NOT NULL THEN
  UPDATE public.character_activity_events SET payload=payload||jsonb_build_object(
   'hpAfter',actual.hp_current,'nonlethalAfter',actual.nonlethal_damage,
   'conditionsAfter',actual.conditions) WHERE id=target_event_id;
 END IF;
 RETURN receipt;
END $$;
REVOKE ALL ON FUNCTION public.confirm_character_reanimacao(uuid,uuid,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.confirm_character_reanimacao(uuid,uuid,jsonb) TO authenticated;

-- Validação compartilhada pelo ataque normal e pelo contra-ataque. Clientes
-- antigos, sem os novos campos, permanecem letais com penalidade zero.
CREATE FUNCTION public.validate_combat_damage_mode(p_character_id uuid,p_selection jsonb,p_payload jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE ficha public.characters; weapon jsonb; mode text; penalty integer;
 weapon_kind text; melee boolean; natural_nonlethal boolean; expected_penalty integer;
 unarmed boolean; unarmed_lethal boolean:=false; snapshot jsonb;
BEGIN
 IF NOT public.can_manage_character_activity(p_character_id) THEN
  RAISE EXCEPTION 'Ficha atacante não autorizada.' USING ERRCODE='42501'; END IF;
 IF p_selection IS NULL OR jsonb_typeof(p_selection)<>'object'
  OR jsonb_typeof(p_selection->'weaponId')<>'string'
  OR p_payload IS NULL OR jsonb_typeof(p_payload)<>'object' THEN
  RAISE EXCEPTION 'Seleção de arma inválida.' USING ERRCODE='22023'; END IF;
 SELECT * INTO ficha FROM public.characters WHERE id=p_character_id;
 unarmed:=p_selection->>'weaponId'='__unarmed__';
 IF unarmed THEN
  SELECT EXISTS(SELECT 1
   FROM jsonb_path_query(jsonb_build_array(ficha.abilities,ficha.powers,
    ficha.class_power_choices,ficha.general_powers),'$.**') found(value)
   WHERE public.creation_identifier(coalesce(value->>'id',value->>'name',value#>>'{}'))
    IN ('artista-marcial','artista-marcial-esp')) INTO unarmed_lethal;
  weapon:=jsonb_build_object('weaponType','briga');
 ELSE
  SELECT value INTO weapon FROM jsonb_array_elements(coalesce(ficha.inventory,'[]'::jsonb)) item(value)
   WHERE value->>'id'=p_selection->>'weaponId' AND value->>'itemType'='weapon';
  IF weapon IS NULL THEN RAISE EXCEPTION 'Arma do ataque não encontrada.' USING ERRCODE='22023'; END IF;
 END IF;
 mode:=coalesce(p_selection->>'damageMode','lethal');
 penalty:=coalesce((p_selection->>'damageModePenalty')::integer,0);
 weapon_kind:=lower(coalesce(weapon->>'weaponType',weapon->>'type',''));
 melee:=weapon_kind IN ('melee','corpo a corpo','briga');
 natural_nonlethal:=weapon_kind='briga'
  OR weapon->'naturallyNonlethal'='true'::jsonb OR weapon->'nonlethal'='true'::jsonb;
 IF mode NOT IN ('lethal','nonlethal') OR penalty NOT IN (0,-5) THEN
  RAISE EXCEPTION 'Modo de dano inválido.' USING ERRCODE='22023'; END IF;
 IF mode='nonlethal' AND NOT melee AND NOT natural_nonlethal THEN
  RAISE EXCEPTION 'Ataque à distância comum não pode causar dano não letal.' USING ERRCODE='22023'; END IF;
 IF p_selection ? 'damageMode' THEN
  expected_penalty:=CASE
   WHEN (mode='nonlethal')=natural_nonlethal THEN 0
   WHEN unarmed AND unarmed_lethal AND mode='lethal' THEN 0
   ELSE -5 END;
  IF penalty<>expected_penalty THEN
   RAISE EXCEPTION 'Penalidade do modo de dano divergente.' USING ERRCODE='22023'; END IF;
  snapshot:=p_payload->'damageModeSnapshot';
  IF jsonb_typeof(snapshot)<>'object' OR snapshot->>'mode' IS DISTINCT FROM mode
   OR (snapshot->>'penalty')::integer IS DISTINCT FROM penalty
   OR jsonb_typeof(snapshot->'baseOtherBonuses')<>'number'
   OR jsonb_typeof(snapshot->'finalOtherBonuses')<>'number'
   OR snapshot->'finalOtherBonuses' IS DISTINCT FROM p_payload#>'{entry,otherBonuses}'
   OR (snapshot->>'finalOtherBonuses')::numeric
      IS DISTINCT FROM (snapshot->>'baseOtherBonuses')::numeric+penalty THEN
   RAISE EXCEPTION 'Detalhamento do modo de dano divergente.' USING ERRCODE='22023'; END IF;
 END IF;
 RETURN jsonb_build_object('damageMode',mode,'damageModePenalty',penalty,
  'naturalDamageMode',CASE WHEN natural_nonlethal THEN 'nonlethal' ELSE 'lethal' END,
  'damageModeSnapshot',coalesce(snapshot,'null'::jsonb));
END $$;
REVOKE ALL ON FUNCTION public.validate_combat_damage_mode(uuid,jsonb,jsonb)
 FROM PUBLIC,anon,authenticated;

ALTER FUNCTION public.confirm_character_combat_attack(uuid,uuid,integer,integer,text,jsonb,jsonb)
 RENAME TO confirm_character_combat_attack_damage_mode_core;
REVOKE ALL ON FUNCTION public.confirm_character_combat_attack_damage_mode_core(uuid,uuid,integer,integer,text,jsonb,jsonb)
 FROM PUBLIC,anon,authenticated;
CREATE FUNCTION public.confirm_character_combat_attack(
 p_operation_id uuid,p_character_id uuid,p_expected_pe integer,p_expected_cost integer,
 p_expected_turn_key text,p_selection jsonb,p_payload jsonb)
RETURNS public.character_activity_events
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE receipt public.character_activity_events; damage_mode jsonb; existed boolean;
BEGIN
 SELECT EXISTS(SELECT 1 FROM public.character_activity_events WHERE operation_id=p_operation_id) INTO existed;
 IF existed THEN
  RETURN public.confirm_character_combat_attack_damage_mode_core(
   p_operation_id,p_character_id,p_expected_pe,p_expected_cost,p_expected_turn_key,p_selection,p_payload);
 END IF;
 damage_mode:=public.validate_combat_damage_mode(p_character_id,p_selection,p_payload);
 receipt:=public.confirm_character_combat_attack_damage_mode_core(
  p_operation_id,p_character_id,p_expected_pe,p_expected_cost,p_expected_turn_key,p_selection,p_payload);
 UPDATE public.character_activity_events SET payload=payload||damage_mode
  WHERE id=receipt.id RETURNING * INTO receipt;
 RETURN receipt;
END $$;
REVOKE ALL ON FUNCTION public.confirm_character_combat_attack(uuid,uuid,integer,integer,text,jsonb,jsonb)
 FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.confirm_character_combat_attack(uuid,uuid,integer,integer,text,jsonb,jsonb)
 TO authenticated;

ALTER FUNCTION public.confirm_character_counterattack_roll_v2(uuid,uuid,integer,integer,text,jsonb,jsonb)
 RENAME TO confirm_character_counterattack_damage_mode_core_v2;
REVOKE ALL ON FUNCTION public.confirm_character_counterattack_damage_mode_core_v2(uuid,uuid,integer,integer,text,jsonb,jsonb)
 FROM PUBLIC,anon,authenticated;
CREATE FUNCTION public.confirm_character_counterattack_roll_v2(
 p_operation_id uuid,p_character_id uuid,p_expected_pe integer,p_expected_cost integer,
 p_expected_turn_key text,p_selection jsonb,p_payload jsonb)
RETURNS public.character_activity_events
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE receipt public.character_activity_events; damage_mode jsonb; existed boolean;
BEGIN
 SELECT EXISTS(SELECT 1 FROM public.character_activity_events WHERE operation_id=p_operation_id) INTO existed;
 IF existed THEN
  RETURN public.confirm_character_counterattack_damage_mode_core_v2(
   p_operation_id,p_character_id,p_expected_pe,p_expected_cost,p_expected_turn_key,p_selection,p_payload);
 END IF;
 damage_mode:=public.validate_combat_damage_mode(p_character_id,p_selection,p_payload);
 receipt:=public.confirm_character_counterattack_damage_mode_core_v2(
  p_operation_id,p_character_id,p_expected_pe,p_expected_cost,p_expected_turn_key,p_selection,p_payload);
 UPDATE public.character_activity_events SET payload=payload||damage_mode
  WHERE id=receipt.id RETURNING * INTO receipt;
 RETURN receipt;
END $$;
REVOKE ALL ON FUNCTION public.confirm_character_counterattack_roll_v2(uuid,uuid,integer,integer,text,jsonb,jsonb)
 FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.confirm_character_counterattack_roll_v2(uuid,uuid,integer,integer,text,jsonb,jsonb)
 TO authenticated;

-- Sucessora aditiva. A v3 permanece disponível e continua tratando chamadas
-- antigas como dano letal.
CREATE FUNCTION public.confirm_campaign_attack_target_v4(
 p_operation_id uuid,p_campaign_id uuid,p_attack_event_id uuid,p_target_character_id uuid,
 p_expected_hp integer,p_expected_scene integer,p_expected_round integer,p_resolution jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE attack public.character_activity_events; receipt jsonb; ficha public.characters;
 mode text; nonlethal_before integer; nonlethal_applied integer; nonlethal_after integer;
 final_conditions jsonb; hp_maximum integer;
BEGIN
 SELECT * INTO attack FROM public.character_activity_events WHERE id=p_attack_event_id;
 mode:=coalesce(attack.payload->>'damageMode','lethal');
 IF mode NOT IN ('lethal','nonlethal') THEN
  RAISE EXCEPTION 'Modo de dano do ataque inválido.' USING ERRCODE='22023'; END IF;
 receipt:=public.confirm_campaign_attack_target_v3(
  p_operation_id,p_campaign_id,p_attack_event_id,p_target_character_id,
  p_expected_hp,p_expected_scene,p_expected_round,p_resolution);
 IF receipt->>'damageMode'=mode THEN RETURN receipt; END IF;
 IF mode='lethal' THEN
  receipt:=receipt||jsonb_build_object('damageMode','lethal','nonlethalApplied',0);
 ELSE
  SELECT * INTO ficha FROM public.characters WHERE id=p_target_character_id FOR UPDATE;
  nonlethal_before:=ficha.nonlethal_damage;
  nonlethal_applied:=greatest(0,(receipt->>'finalDamage')::integer-(receipt->>'temporaryHPUsed')::integer);
  IF nonlethal_before+nonlethal_applied>1000000 THEN
   RAISE EXCEPTION 'Dano não letal excede o limite persistível da ficha';
  END IF;
  nonlethal_after:=nonlethal_before+nonlethal_applied;
  hp_maximum:=ficha.hp_max;
  final_conditions:=public.reconcile_nonlethal_conditions(
   coalesce(receipt->'conditionsBefore',ficha.conditions),(receipt->>'hpBefore')::integer,
   hp_maximum,nonlethal_after,p_operation_id);
  PERFORM set_config('ordem_roll.nonlethal_internal','1',true);
  UPDATE public.characters SET hp_current=(receipt->>'hpBefore')::integer,
   nonlethal_damage=nonlethal_after,conditions=final_conditions
   WHERE id=p_target_character_id;
  PERFORM set_config('ordem_roll.nonlethal_internal','0',true);
  receipt:=receipt||jsonb_build_object(
   'damageMode','nonlethal','hpAfter',(receipt->>'hpBefore')::integer,
   'nonlethalBefore',nonlethal_before,'nonlethalApplied',nonlethal_applied,
   'nonlethalAfter',nonlethal_after,
   'lethalDamageTotal',greatest(0,hp_maximum-(receipt->>'hpBefore')::integer),
   'combinedDamageTotal',greatest(0,hp_maximum-(receipt->>'hpBefore')::integer)+nonlethal_after,
   'conditionsAfter',final_conditions,'massiveDamageRequired',false,'massiveDamageDt',NULL);
 END IF;
 UPDATE public.campaign_attack_target_resolutions_v2 SET result=receipt
  WHERE operation_id=p_operation_id;
 UPDATE public.character_activity_events SET payload=payload||receipt
  WHERE id IN ((receipt->>'targetEventId')::uuid,(receipt->>'attackerEventId')::uuid);
 RETURN receipt;
END $$;
REVOKE ALL ON FUNCTION public.confirm_campaign_attack_target_v4(uuid,uuid,uuid,uuid,integer,integer,integer,jsonb)
 FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.confirm_campaign_attack_target_v4(uuid,uuid,uuid,uuid,integer,integer,integer,jsonb)
 TO authenticated;
