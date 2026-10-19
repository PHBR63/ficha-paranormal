-- Livro Base v1.3, p. 30: o PE é gasto ao fazer Mirar em qualquer modo.
-- Sem controle de turnos, a mesa confirma o prazo; o servidor não inventa turnos.
CREATE OR REPLACE FUNCTION public.get_character_mirar_status(p_character_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE budget jsonb; aim public.character_activity_events; turn_id uuid;
BEGIN
 IF NOT public.can_manage_character_activity(p_character_id) THEN
  RAISE EXCEPTION 'Ficha não autorizada.' USING ERRCODE='42501'; END IF;
 budget:=public.get_character_pe_budget(p_character_id);
 IF budget->>'mode'='combat' THEN
  IF budget->>'actorId' IS DISTINCT FROM p_character_id::text THEN
   RETURN jsonb_build_object('mode','combat','available',false); END IF;
  SELECT turn_instance_id INTO turn_id FROM public.campaign_combat_state_v2
  WHERE campaign_id=(budget->>'campaignId')::uuid;
 END IF;
 SELECT e.* INTO aim FROM public.character_activity_events e
 WHERE e.character_id=p_character_id AND e.status='confirmed' AND e.payload->>'kind'='mirar'
  AND e.payload->'lethalShotPrepaid'='true'::jsonb
  AND NOT (e.payload ? 'consumedByAttackId' OR e.payload ? 'dismissedAt')
  AND (CASE budget->>'mode'
   WHEN 'combat' THEN coalesce(e.payload->>'mode','combat')='combat'
    AND e.payload->>'campaignId'=budget->>'campaignId'
    AND e.payload->>'scene'=budget->>'scene'
    AND (e.payload->>'round')::integer BETWEEN (budget->>'round')::integer-1 AND (budget->>'round')::integer
    AND ((e.payload->>'round')::integer<(budget->>'round')::integer
      OR e.payload->>'turnInstanceId'=turn_id::text)
   WHEN 'manual' THEN e.payload->>'mode'='manual'
    AND (e.payload->>'turnNumber')::integer BETWEEN (budget->>'number')::integer-1 AND (budget->>'number')::integer
   ELSE e.payload->>'mode'='untracked' END)
 ORDER BY e.created_at DESC LIMIT 1;
 RETURN jsonb_build_object('mode',budget->>'mode','available',aim.id IS NOT NULL,
  'operationId',aim.operation_id,'round',aim.payload->>'round','weaponId',aim.payload->>'weaponId',
  'peCost',coalesce((aim.payload->>'peCost')::integer,0));
END $$;

CREATE OR REPLACE FUNCTION public.confirm_character_mirar(
 p_operation_id uuid,p_character_id uuid,p_expected_turn_key text,p_weapon_id text)
RETURNS public.character_activity_events LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE budget jsonb; ficha public.characters; weapon jsonb; receipt public.character_activity_events;
 training integer:=0; fingerprint text; turn_id uuid; track text;
 temporary_before integer; temporary_used integer; status jsonb;
BEGIN
 IF NOT public.can_manage_character_activity(p_character_id) THEN
  RAISE EXCEPTION 'Ficha não autorizada.' USING ERRCODE='42501'; END IF;
 IF p_operation_id IS NULL OR coalesce(length(p_weapon_id),0) NOT BETWEEN 1 AND 120 THEN
  RAISE EXCEPTION 'Arma inválida para Mirar.' USING ERRCODE='22023'; END IF;
 fingerprint:=md5(jsonb_build_array(p_character_id,p_expected_turn_key,p_weapon_id)::text);
 PERFORM pg_advisory_xact_lock(hashtextextended(p_operation_id::text,0));
 PERFORM public.lock_character_pe_turn(p_character_id);
 SELECT * INTO receipt FROM public.character_activity_events WHERE operation_id=p_operation_id;
 IF FOUND THEN
  IF receipt.author_id<>auth.uid() OR receipt.request_hash<>fingerprint THEN
   RAISE EXCEPTION 'Operação reutilizada.' USING ERRCODE='23505'; END IF;
  RETURN receipt;
 END IF;
 SELECT * INTO ficha FROM public.characters WHERE id=p_character_id FOR UPDATE;
 track:=regexp_replace(lower(coalesce(ficha.class_track,'')),'[ _]+','-','g');
 IF ficha.class<>'Especialista' OR track NOT IN ('atirador-elite','atirador-de-elite') OR ficha.nex<40 THEN
  RAISE EXCEPTION 'Disparo Letal não disponível.' USING ERRCODE='22023'; END IF;
 SELECT coalesce(max(CASE WHEN value #>> '{}' ~ '^[0-3]$' THEN (value #>> '{}')::integer ELSE 0 END),0)
 INTO training FROM jsonb_each(coalesce(ficha.skills,'{}'::jsonb)) skill
 WHERE lower(trim(skill.key))='pontaria';
 IF training<1 THEN RAISE EXCEPTION 'Mirar exige Pontaria treinada.' USING ERRCODE='22023'; END IF;
 budget:=public.get_character_pe_budget(p_character_id);
 IF budget->>'key' IS DISTINCT FROM p_expected_turn_key
  OR (budget->>'mode'='combat' AND budget->>'actorId' IS DISTINCT FROM p_character_id::text) THEN
  RAISE EXCEPTION 'O controle de turnos mudou; atualize antes de Mirar.' USING ERRCODE='55004'; END IF;
 status:=public.get_character_mirar_status(p_character_id);
 IF status->'available'='true'::jsonb THEN
  RAISE EXCEPTION 'Disparo Letal já foi preparado. Use ou aguarde expirar antes de pagar novamente.' USING ERRCODE='55004'; END IF;
 SELECT value INTO weapon FROM jsonb_array_elements(coalesce(ficha.inventory,'[]'::jsonb))
 WHERE value->>'id'=p_weapon_id AND value->>'itemType'='weapon' AND value->'isEquipped'='true'::jsonb;
 IF NOT FOUND THEN RAISE EXCEPTION 'Equipe a arma antes de Mirar.' USING ERRCODE='22023'; END IF;
 IF (SELECT count(*) FROM jsonb_array_elements(coalesce(ficha.inventory,'[]'::jsonb))
     WHERE value->>'id'=p_weapon_id)<>1 THEN
  RAISE EXCEPTION 'Identidade da arma duplicada.' USING ERRCODE='40001'; END IF;
 SELECT coalesce(sum(remaining),0) INTO temporary_before FROM public.character_temporary_resources
 WHERE character_id=p_character_id AND resource='pe';
 IF ficha.pe_current+temporary_before<1 THEN RAISE EXCEPTION 'PE insuficiente para Disparo Letal.' USING ERRCODE='22023'; END IF;
 IF budget->>'mode'='combat' THEN
  SELECT turn_instance_id INTO turn_id FROM public.campaign_combat_state_v2
  WHERE campaign_id=(budget->>'campaignId')::uuid;
 END IF;
 temporary_used:=public.consume_temporary_resource(p_character_id,'pe',1);
 UPDATE public.characters SET pe_current=pe_current-1+temporary_used WHERE id=p_character_id;
 INSERT INTO public.character_activity_events(id,operation_id,character_id,author_id,category,status,payload,request_hash)
 VALUES(p_operation_id,p_operation_id,p_character_id,auth.uid(),'application','confirmed',
  jsonb_build_object('kind','mirar','mode',budget->>'mode','campaignId',budget->>'campaignId',
   'scene',budget->>'scene','round',budget->>'round','turnNumber',budget->>'number',
   'turnInstanceId',turn_id,'weaponId',p_weapon_id,
   'weaponName',weapon->>'name','actionCost','movimento','peCost',1,'lethalShotPrepaid',true,
   'peBefore',ficha.pe_current,'peAfter',ficha.pe_current-1+temporary_used,
   'temporaryPEUsed',temporary_used,'temporaryPEBefore',temporary_before,
   'temporaryPEAfter',temporary_before-temporary_used,
   'targetContext','mesa confirma alvo visível e alcance'),fingerprint)
 RETURNING * INTO receipt;
 -- Débito, orçamento e histórico pertencem à mesma transação: falha reverte todos.
 RETURN public.record_ritual_pe_budget(receipt.id,budget,1,'ability',true);
END $$;

-- Quando a mesa declara que o prazo acabou sem ataque, o gasto continua no histórico.
-- Repetir a dispensa é seguro e nunca devolve PE.
CREATE OR REPLACE FUNCTION public.dismiss_character_mirar(p_character_id uuid,p_aim_operation_id uuid)
RETURNS public.character_activity_events LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE aim public.character_activity_events;
BEGIN
 PERFORM public.lock_character_pe_turn(p_character_id);
 SELECT * INTO aim FROM public.character_activity_events
 WHERE operation_id=p_aim_operation_id AND character_id=p_character_id FOR UPDATE;
 IF NOT FOUND OR aim.payload->>'kind'<>'mirar' OR aim.payload->'lethalShotPrepaid' IS DISTINCT FROM 'true'::jsonb THEN
  RAISE EXCEPTION 'Mirar não encontrado nesta ficha.' USING ERRCODE='22023'; END IF;
 IF aim.payload ? 'consumedByAttackId' THEN
  RAISE EXCEPTION 'Este Mirar já foi consumido.' USING ERRCODE='55004'; END IF;
 IF NOT (aim.payload ? 'dismissedAt') THEN
  UPDATE public.character_activity_events SET payload=payload||jsonb_build_object('dismissedAt',now())
  WHERE id=aim.id RETURNING * INTO aim;
 END IF;
 RETURN aim;
END $$;
REVOKE ALL ON FUNCTION public.dismiss_character_mirar(uuid,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.dismiss_character_mirar(uuid,uuid) TO authenticated;

-- O núcleo continua validando a arma, a rolagem, os demais custos e o histórico.
-- Apenas o componente já pago de Disparo Letal sai da cobrança do ataque.
CREATE OR REPLACE FUNCTION public.confirm_character_combat_attack(
 p_operation_id uuid,p_character_id uuid,p_expected_pe integer,p_expected_cost integer,
 p_expected_turn_key text,p_selection jsonb,p_payload jsonb)
RETURNS public.character_activity_events LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE budget jsonb; mirar_status jsonb; receipt public.character_activity_events;
 existing public.character_activity_events; core_selection jsonb; ficha public.characters; track text;
 prepaid boolean:=false;
BEGIN
 PERFORM public.lock_character_pe_turn(p_character_id);
 SELECT * INTO existing FROM public.character_activity_events WHERE operation_id=p_operation_id;
 IF FOUND THEN
  -- Reenvios de ataques anteriores à migração mantêm seu hash original.
  core_selection:=CASE WHEN existing.payload->'lethalShotPrepaid'='true'::jsonb
    THEN p_selection||'{"lethalShot":false,"mirarDeclared":false}'::jsonb ELSE p_selection END;
  RETURN public.confirm_character_combat_attack_without_mirar_guard(
   p_operation_id,p_character_id,p_expected_pe,p_expected_cost,p_expected_turn_key,core_selection,p_payload);
 END IF;
 budget:=public.get_character_pe_budget(p_character_id);
 prepaid:=p_selection->'lethalShot'='true'::jsonb;
 IF prepaid THEN
  mirar_status:=public.get_character_mirar_status(p_character_id);
  IF mirar_status->'available' IS DISTINCT FROM 'true'::jsonb
   OR mirar_status->>'weaponId' IS DISTINCT FROM p_selection->>'weaponId' THEN
   RAISE EXCEPTION 'Registre Mirar com esta arma antes do próximo ataque no prazo.' USING ERRCODE='55004'; END IF;
  IF p_selection->'mirarDeclared' IS DISTINCT FROM 'true'::jsonb THEN
   RAISE EXCEPTION 'Confirme Mirar antes de usar Disparo Letal.' USING ERRCODE='22023'; END IF;
  SELECT * INTO ficha FROM public.characters WHERE id=p_character_id;
  track:=regexp_replace(lower(coalesce(ficha.class_track,'')),'[ _]+','-','g');
  IF ficha.class<>'Especialista' OR track NOT IN ('atirador-elite','atirador-de-elite') OR ficha.nex<40 THEN
   RAISE EXCEPTION 'Disparo Letal não disponível.' USING ERRCODE='22023'; END IF;
 END IF;
 core_selection:=CASE WHEN prepaid THEN p_selection||'{"lethalShot":false,"mirarDeclared":false}'::jsonb
  ELSE p_selection END;
 receipt:=public.confirm_character_combat_attack_without_mirar_guard(
  p_operation_id,p_character_id,p_expected_pe,p_expected_cost,p_expected_turn_key,core_selection,p_payload);
 -- Qualquer próximo ataque consome a oportunidade, mesmo que dispense o bônus.
 UPDATE public.character_activity_events e
 SET payload=jsonb_set(e.payload,'{consumedByAttackId}',to_jsonb(receipt.id::text))
 WHERE e.character_id=p_character_id AND e.status='confirmed' AND e.payload->>'kind'='mirar'
  AND e.payload->'lethalShotPrepaid'='true'::jsonb
  AND NOT (e.payload ? 'consumedByAttackId' OR e.payload ? 'dismissedAt')
  AND e.created_at<=receipt.created_at;
 IF prepaid THEN
  UPDATE public.character_activity_events SET payload=payload||jsonb_build_object(
   'selection',p_selection,'mirarOperationId',mirar_status->>'operationId','lethalShotPrepaid',true)
  WHERE id=receipt.id RETURNING * INTO receipt;
 END IF;
 RETURN receipt;
END $$;
