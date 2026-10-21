-- Efeitos recorrentes não podem causar dano duplicado no turno controlado.
BEGIN;
INSERT INTO auth.users(id) VALUES('95bd0000-0000-4000-8000-000000000009');
SELECT set_config('test.condition_owner','95bd0000-0000-4000-8000-000000000009',true);
INSERT INTO public.characters(id,user_id,name,origin,class,vigor,nex,hp_current,hp_max,
 pe_current,pe_max,san_current,san_max,conditions)
VALUES
 ('95bd0000-0000-4000-8000-000000000001',current_setting('test.condition_owner')::uuid,
  'QA efeitos recorrentes com turno','Vítima','Combatente',1,5,30,30,4,4,15,15,
  '[{"id":"em-chamas","name":"Em Chamas"},
    {"id":"envenenado","name":"Veneno A","params":{"poisonDamage":"1d6"},"addedAt":"2026-10-20T10:00:00Z"},
    {"id":"envenenado","name":"Veneno B","params":{"poisonDamage":"1d8"},"addedAt":"2026-10-20T10:01:00Z"}]'),
 ('95bd0000-0000-4000-8000-000000000002',current_setting('test.condition_owner')::uuid,
  'QA efeitos recorrentes sem turno','Vítima','Combatente',1,5,30,30,4,4,15,15,
  '[{"id":"em-chamas","name":"Em Chamas"}]');
INSERT INTO public.character_manual_turns(character_id,turn_number,active)
VALUES('95bd0000-0000-4000-8000-000000000001',1,true);
CREATE FUNCTION pg_temp.qa_condition_effect_count(p_character_id uuid)
RETURNS bigint LANGUAGE sql SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT count(*) FROM public.character_condition_effect_turn_confirmations
 WHERE character_id=p_character_id
$$;
GRANT EXECUTE ON FUNCTION pg_temp.qa_condition_effect_count(uuid) TO authenticated;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub',current_setting('test.condition_owner'),true);
SELECT set_config('request.jwt.claims',json_build_object('sub',current_setting('test.condition_owner'),
 'role','authenticated')::text,true);
DO $$
DECLARE
 owner_id uuid:=current_setting('test.condition_owner')::uuid;
 char_id uuid:='95bd0000-0000-4000-8000-000000000001';
 loose_id uuid:='95bd0000-0000-4000-8000-000000000002';
 expected jsonb; values jsonb; conditions jsonb; resolution jsonb;
 receipt public.character_activity_events; retry public.character_activity_events;
 hp integer; events_before integer; events_after integer;
BEGIN
 IF NOT has_function_privilege('authenticated',
  'public.confirm_character_condition_turn(uuid,uuid,jsonb,jsonb,jsonb,jsonb)','EXECUTE')
 OR has_function_privilege('authenticated',
  'public.confirm_character_condition_turn_effect_core(uuid,uuid,jsonb,jsonb,jsonb,jsonb)','EXECUTE') THEN
  RAISE EXCEPTION 'Permissões da confirmação de condições estão incoerentes'; END IF;

 SELECT jsonb_build_object('vigor',vigor,'hp_current',hp_current,'hp_max',hp_max,
  'pe_current',pe_current,'pe_max',pe_max,'san_current',san_current,'san_max',san_max,
  'conditions',public.characters.conditions) INTO expected FROM public.characters WHERE id=char_id;
 conditions:=expected->'conditions';
 resolution:='{"profile":"base-v1.3-mesa","revision":1,"bleedingModifier":0,
  "effects":[{"conditionId":"em-chamas","label":"Em Chamas","dice":[4],"rolled":4,"finalAmount":4},
   {"conditionId":"envenenado","label":"Veneno A","dice":[3],"rolled":3,"finalAmount":3}],
  "bleedingTests":[],"removeIndexes":[],"notices":[]}';
 values:=jsonb_build_object('hp',23,'pe',4,'san',15);
 receipt:=public.confirm_character_condition_turn(
  '95bd0000-0000-4000-8000-000000000011',char_id,values,expected,conditions,resolution);
 SELECT hp_current INTO hp FROM public.characters WHERE id=char_id;
 IF hp<>23 OR pg_temp.qa_condition_effect_count(char_id)<>2 THEN
  RAISE EXCEPTION 'Em Chamas e o primeiro veneno não foram registrados no turno'; END IF;

 retry:=public.confirm_character_condition_turn(
  '95bd0000-0000-4000-8000-000000000011',char_id,values,expected,conditions,resolution);
 SELECT count(*) INTO events_after FROM public.character_activity_events WHERE character_id=char_id;
 IF retry.id<>receipt.id OR events_after<>1 OR (SELECT hp_current FROM public.characters WHERE id=char_id)<>23 THEN
  RAISE EXCEPTION 'Retry com mesmo UUID duplicou dano ou histórico'; END IF;

 -- Incêndio continua uma única instância por turno mesmo com novo UUID.
 resolution:=jsonb_set(resolution,'{effects}',
  '[{"conditionId":"em-chamas","label":"Em Chamas","dice":[4],"rolled":4,"finalAmount":4}]');
 values:=jsonb_build_object('hp',19,'pe',4,'san',15);
 BEGIN
  PERFORM public.confirm_character_condition_turn(
   '95bd0000-0000-4000-8000-000000000014',char_id,values,expected,conditions,resolution);
  RAISE EXCEPTION 'Em Chamas foi aplicado duas vezes no mesmo turno';
 EXCEPTION WHEN unique_violation THEN NULL; END;
 IF (SELECT hp_current FROM public.characters WHERE id=char_id)<>23 OR
  (SELECT count(*) FROM public.character_activity_events WHERE character_id=char_id)<>1 THEN
  RAISE EXCEPTION 'Rejeição de Em Chamas duplicado alterou PV ou histórico'; END IF;

 -- Outra fonte de veneno tem uma chave própria e pode ser resolvida uma vez.
 SELECT jsonb_build_object('vigor',vigor,'hp_current',hp_current,'hp_max',hp_max,
  'pe_current',pe_current,'pe_max',pe_max,'san_current',san_current,'san_max',san_max,
  'conditions',public.characters.conditions) INTO expected FROM public.characters WHERE id=char_id;
 resolution:='{"profile":"base-v1.3-mesa","revision":1,"bleedingModifier":0,
  "effects":[],"bleedingTests":[],"removeIndexes":[],"notices":[]}';
 resolution:=jsonb_set(resolution,'{effects}',
  '[{"conditionId":"envenenado","label":"Veneno B","dice":[2],"rolled":2,"finalAmount":2}]');
 values:=jsonb_build_object('hp',21,'pe',4,'san',15);
 PERFORM public.confirm_character_condition_turn(
  '95bd0000-0000-4000-8000-000000000012',char_id,values,expected,conditions,resolution);
 IF pg_temp.qa_condition_effect_count(char_id)<>3 OR
   (SELECT hp_current FROM public.characters WHERE id=char_id)<>21 THEN
  RAISE EXCEPTION 'Fonte diferente de veneno não foi resolvida uma vez'; END IF;

 -- Uma nova operação não pode confirmar a mesma fonte no mesmo turno.
 SELECT count(*) INTO events_before FROM public.character_activity_events WHERE character_id=char_id;
 BEGIN
  PERFORM public.confirm_character_condition_turn(
   '95bd0000-0000-4000-8000-000000000013',char_id,values,expected,conditions,resolution);
  RAISE EXCEPTION 'Mesmo efeito recorrente foi aplicado duas vezes no turno';
 EXCEPTION WHEN unique_violation THEN NULL; END;
 SELECT count(*) INTO events_after FROM public.character_activity_events WHERE character_id=char_id;
 IF events_after<>events_before OR (SELECT hp_current FROM public.characters WHERE id=char_id)<>21 THEN
  RAISE EXCEPTION 'Rejeição do duplicado alterou PV ou histórico'; END IF;

 -- Sem combate/turno manual ativo, não se inventa identidade nem bloqueio de turno.
 SELECT jsonb_build_object('vigor',vigor,'hp_current',hp_current,'hp_max',hp_max,
  'pe_current',pe_current,'pe_max',pe_max,'san_current',san_current,'san_max',san_max,
  'conditions',public.characters.conditions) INTO expected FROM public.characters WHERE id=loose_id;
 conditions:=expected->'conditions';
 resolution:='{"profile":"base-v1.3-mesa","revision":1,"bleedingModifier":0,
  "effects":[{"conditionId":"em-chamas","label":"Em Chamas","dice":[1],"rolled":1,"finalAmount":1}],
  "bleedingTests":[],"removeIndexes":[],"notices":[]}';
 values:=jsonb_build_object('hp',29,'pe',4,'san',15);
 PERFORM public.confirm_character_condition_turn(
  '95bd0000-0000-4000-8000-000000000021',loose_id,values,expected,conditions,resolution);
 SELECT jsonb_build_object('vigor',vigor,'hp_current',hp_current,'hp_max',hp_max,
  'pe_current',pe_current,'pe_max',pe_max,'san_current',san_current,'san_max',san_max,
  'conditions',public.characters.conditions) INTO expected FROM public.characters WHERE id=loose_id;
 values:=jsonb_build_object('hp',28,'pe',4,'san',15);
 PERFORM public.confirm_character_condition_turn(
  '95bd0000-0000-4000-8000-000000000022',loose_id,values,expected,conditions,resolution);
 IF (SELECT hp_current FROM public.characters WHERE id=loose_id)<>28 OR
  pg_temp.qa_condition_effect_count(loose_id)<>0 THEN
  RAISE EXCEPTION 'Modo sem turno inventou bloqueio ou chave de turno'; END IF;
END $$;
ROLLBACK;
SELECT 'PASS: chave por turno/fonte, retry, duplicado e modo sem turno; rollback' AS result;
