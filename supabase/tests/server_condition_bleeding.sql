-- Regressão isolada: dados oficiais de Sangrando, recibo, turno e permissão.
BEGIN;
SELECT set_config('test.bleeding_owner',user_id::text,true)
FROM public.characters WHERE id='ecde39f9-2d41-4d39-ad20-c8d013e11ee7';
INSERT INTO public.characters(id,user_id,name,origin,class,vigor,nex,hp_current,hp_max,pe_current,pe_max,san_current,san_max,conditions)
VALUES
 ('94ba0000-0000-4000-8000-000000000051',current_setting('test.bleeding_owner')::uuid,'QA Sangrando falha','Vítima','Combatente',1,5,10,10,4,4,15,15,
  '[{"id":"sangrando","name":"Sangrando","params":{"fonte":"QA"}}]'),
 ('94ba0000-0000-4000-8000-000000000052',current_setting('test.bleeding_owner')::uuid,'QA Sangrando sucesso','Vítima','Combatente',1,5,10,10,4,4,15,15,
  '[{"id":"sangrando","name":"Sangrando"}]'),
 ('94ba0000-0000-4000-8000-000000000053',current_setting('test.bleeding_owner')::uuid,'QA Sangrando temporário','Vítima','Combatente',1,5,10,10,4,4,15,15,
  '[{"id":"sangrando","name":"Sangrando"}]'),
 ('94ba0000-0000-4000-8000-000000000054',current_setting('test.bleeding_owner')::uuid,'QA Vigor zero','Vítima','Combatente',0,5,10,10,4,4,15,15,
  '[{"id":"sangrando","name":"Sangrando"},{"id":"fraco","name":"Fraco"}]');
INSERT INTO public.character_manual_turns(character_id,turn_number,active)
VALUES ('94ba0000-0000-4000-8000-000000000051',1,true),('94ba0000-0000-4000-8000-000000000052',1,true),
 ('94ba0000-0000-4000-8000-000000000053',1,true),('94ba0000-0000-4000-8000-000000000054',1,true);
INSERT INTO public.character_temporary_resources(character_id,resource,source_key,source_name,remaining)
VALUES('94ba0000-0000-4000-8000-000000000053','hp','qa-sangrando','QA Sangrando',6);
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub',current_setting('test.bleeding_owner'),true);
SELECT set_config('request.jwt.claims',json_build_object('sub',current_setting('test.bleeding_owner'),'role','authenticated')::text,true);
DO $$
DECLARE expected jsonb; request jsonb; receipt public.character_activity_events; again public.character_activity_events;
 amount integer; current_hp integer; current_conditions jsonb; kept integer;
BEGIN
 IF has_function_privilege('authenticated','public.resolve_character_condition_turn(uuid,uuid,jsonb,jsonb,jsonb,jsonb)','EXECUTE')
 OR NOT has_function_privilege('authenticated','public.confirm_character_condition_turn(uuid,uuid,jsonb,jsonb,jsonb,jsonb)','EXECUTE') THEN
  RAISE EXCEPTION 'Permissões de RPC incoerentes'; END IF;
 SELECT jsonb_build_object('vigor',vigor,'hp_current',hp_current,'hp_max',hp_max,
  'pe_current',pe_current,'pe_max',pe_max,'san_current',san_current,'san_max',san_max,'conditions',conditions)
 INTO expected FROM public.characters WHERE id='94ba0000-0000-4000-8000-000000000051';
 request:='{"profile":"base-v1.3-mesa","revision":1,"bleedingModifier":-1000,"effects":[],"bleedingTests":[],"removeIndexes":[],"notices":[]}';
 receipt:=public.confirm_character_condition_turn('94ba0000-0000-4000-8000-000000000061',
  '94ba0000-0000-4000-8000-000000000051','{"hp":10,"pe":4,"san":15}',expected,expected->'conditions',request);
 amount:=(receipt.payload->'resolution'->'effects'->0->>'finalAmount')::integer;
 SELECT hp_current,conditions INTO current_hp,current_conditions FROM public.characters WHERE id=receipt.character_id;
 IF receipt.payload->>'diceSource'<>'server' OR amount NOT BETWEEN 1 AND 6 OR current_hp<>10-amount
 OR current_conditions->0->'params'->>'fonte'<>'QA' THEN RAISE EXCEPTION 'Falha não confirmou perda direta e metadados'; END IF;
 again:=public.confirm_character_condition_turn('94ba0000-0000-4000-8000-000000000061',
  '94ba0000-0000-4000-8000-000000000051','{"hp":10,"pe":4,"san":15}',expected,expected->'conditions',request);
 IF again.id<>receipt.id OR again.payload->'resolution' IS DISTINCT FROM receipt.payload->'resolution' THEN
  RAISE EXCEPTION 'Retry sorteou novamente'; END IF;
 BEGIN
  PERFORM public.confirm_character_condition_turn('94ba0000-0000-4000-8000-000000000064',
   '94ba0000-0000-4000-8000-000000000051','{"hp":10,"pe":4,"san":15}',expected,expected->'conditions',
   jsonb_set(request,'{bleedingTests}','[{"dice":[20]}]'::jsonb));
  RAISE EXCEPTION 'Cliente injetou o próprio resultado';
 EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
 SELECT jsonb_build_object('vigor',vigor,'hp_current',hp_current,'hp_max',hp_max,
  'pe_current',pe_current,'pe_max',pe_max,'san_current',san_current,'san_max',san_max,'conditions',conditions)
 INTO expected FROM public.characters WHERE id='94ba0000-0000-4000-8000-000000000051';
 BEGIN
  PERFORM public.confirm_character_condition_turn('94ba0000-0000-4000-8000-000000000062',
   '94ba0000-0000-4000-8000-000000000051',jsonb_build_object('hp',current_hp,'pe',4,'san',15),expected,expected->'conditions',request);
  RAISE EXCEPTION 'Permitiu resolver Sangrando duas vezes no turno';
 EXCEPTION WHEN unique_violation THEN NULL; END;
 SELECT jsonb_build_object('vigor',vigor,'hp_current',hp_current,'hp_max',hp_max,
  'pe_current',pe_current,'pe_max',pe_max,'san_current',san_current,'san_max',san_max,'conditions',conditions)
 INTO expected FROM public.characters WHERE id='94ba0000-0000-4000-8000-000000000052';
 request:=jsonb_set(request,'{bleedingModifier}','1000'::jsonb);
 receipt:=public.confirm_character_condition_turn('94ba0000-0000-4000-8000-000000000063',
  '94ba0000-0000-4000-8000-000000000052','{"hp":10,"pe":4,"san":15}',expected,expected->'conditions',request);
 SELECT hp_current,conditions INTO current_hp,current_conditions FROM public.characters WHERE id=receipt.character_id;
 IF receipt.payload->'resolution'->'bleedingTests'->0->'passed'<>'true'::jsonb OR current_hp<>10
 OR current_conditions<>'[]'::jsonb THEN RAISE EXCEPTION 'Sucesso não estabilizou'; END IF;
 SELECT jsonb_build_object('vigor',vigor,'hp_current',hp_current,'hp_max',hp_max,
  'pe_current',pe_current,'pe_max',pe_max,'san_current',san_current,'san_max',san_max,'conditions',conditions)
 INTO expected FROM public.characters WHERE id='94ba0000-0000-4000-8000-000000000053';
 request:=jsonb_set(request,'{bleedingModifier}','-1000'::jsonb);
 receipt:=public.confirm_character_condition_turn('94ba0000-0000-4000-8000-000000000065',
  '94ba0000-0000-4000-8000-000000000053','{"hp":10,"pe":4,"san":15}',expected,expected->'conditions',request);
 amount:=(receipt.payload->'resolution'->'effects'->0->>'finalAmount')::integer;
 SELECT hp_current INTO current_hp FROM public.characters WHERE id=receipt.character_id;
 IF current_hp<>10 OR (receipt.payload->>'temporaryHPUsed')::integer<>amount
 OR (SELECT remaining FROM public.character_temporary_resources WHERE character_id=receipt.character_id AND source_key='qa-sangrando')<>6-amount THEN
  RAISE EXCEPTION 'PV temporários não absorveram perda de Sangrando'; END IF;
 SELECT jsonb_build_object('vigor',vigor,'hp_current',hp_current,'hp_max',hp_max,
  'pe_current',pe_current,'pe_max',pe_max,'san_current',san_current,'san_max',san_max,'conditions',conditions)
 INTO expected FROM public.characters WHERE id='94ba0000-0000-4000-8000-000000000054';
 receipt:=public.confirm_character_condition_turn('94ba0000-0000-4000-8000-000000000067',
  '94ba0000-0000-4000-8000-000000000054','{"hp":10,"pe":4,"san":15}',expected,expected->'conditions',request);
 SELECT min(value::integer) INTO kept
 FROM jsonb_array_elements_text(receipt.payload->'resolution'->'bleedingTests'->0->'dice');
 IF jsonb_array_length(receipt.payload->'resolution'->'bleedingTests'->0->'dice')<>3
 OR (receipt.payload->'resolution'->'bleedingTests'->0->>'kept')::integer<>kept THEN
  RAISE EXCEPTION 'Vigor zero com Fraco não selecionou o menor de 3d20'; END IF;
END $$;
SELECT set_config('request.jwt.claim.sub','94ba0000-0000-4000-8000-000000000098',true);
DO $$ BEGIN
 BEGIN
  PERFORM public.confirm_character_condition_turn('94ba0000-0000-4000-8000-000000000066',
   '94ba0000-0000-4000-8000-000000000051','{}','{}','[]','{}');
  RAISE EXCEPTION 'Conta estranha alterou Sangrando';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
ROLLBACK;
SELECT 'PASS: sorteio servidor, perda, sucesso, repetição, temporários, metadados e permissão; rollback' AS result;
