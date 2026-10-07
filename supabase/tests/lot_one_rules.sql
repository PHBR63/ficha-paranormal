-- Rodar apenas após as migrations do lote. Dados sintéticos são revertidos.
BEGIN;
INSERT INTO auth.users(id) VALUES('00000000-0000-4000-8000-000000000711');
-- Orçamento amplo para isolar as regras do lote 1 do limite cumulativo do lote 2.
INSERT INTO public.characters(id,user_id,name,origin,class,nex,hp_current,hp_max,pe_current,pe_max,san_current,san_max,age,conditions)
VALUES('00000000-0000-4000-8000-000000000701','00000000-0000-4000-8000-000000000711','QA lote 1','Vítima','Ocultista',70,10,20,20,20,30,30,20,'[]');
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000711',true);
DO $$
DECLARE c uuid:='00000000-0000-4000-8000-000000000701'; op uuid:=gen_random_uuid(); cast_event public.character_activity_events;
 receipt public.character_activity_events; body jsonb; turn jsonb; expected jsonb; hp integer; pe integer; san integer; maximum integer; sustain uuid; form integer;
BEGIN
 body:='{"ritualId":"cicatrizacao","ritualName":"Cicatrização","ritualElement":"morte","requirementsConfirmed":true,"expectedSan":30,"expectedSanMax":30,
 "paranormalCost":{"source":"system_roll","element":"morte","test":{"attribute":1,"dicePenalty":0,"dice":[1],"bonuses":[],"bonus":0,"total":1}}}';
 cast_event:=public.cast_character_ritual(op,c,20,2,body);
 IF cast_event.payload->>'sanAfter'<>'28' OR cast_event.payload->>'sanMaxAfter'<>'29' THEN RAISE EXCEPTION 'Custo de SAN incorreto'; END IF;
 PERFORM public.cast_character_ritual(op,c,20,2,body);
 IF (SELECT san_current FROM public.characters WHERE id=c)<>28 THEN RAISE EXCEPTION 'SAN duplicada no retry'; END IF;
 receipt:=public.apply_character_effect(gen_random_uuid(),c,'heal','5','{"hp_current":10,"hp_max":20,"age":20}',cast_event.id);
 IF (SELECT age FROM public.characters WHERE id=c)<>21 OR receipt.payload->'after'->>'age'<>'21' THEN RAISE EXCEPTION 'Cura não envelheceu'; END IF;
 PERFORM public.apply_character_effect(receipt.operation_id,c,'heal','5','{"hp_current":10,"hp_max":20,"age":20}',cast_event.id);
 IF (SELECT age FROM public.characters WHERE id=c)<>21 THEN RAISE EXCEPTION 'Idade duplicada no retry'; END IF;
 UPDATE public.characters SET san_max=30 WHERE id=c;
 IF (SELECT san_max FROM public.characters WHERE id=c)<>29 THEN RAISE EXCEPTION 'Recalcular removeu perda permanente'; END IF;
 UPDATE public.characters SET age=NULL WHERE id=c;
 BEGIN
  PERFORM public.apply_character_effect(gen_random_uuid(),c,'heal','5','{"hp_current":15,"hp_max":20,"age":null}',cast_event.id);
  RAISE EXCEPTION 'Idade ausente aceita'; EXCEPTION WHEN invalid_parameter_value THEN NULL;
 END;
 PERFORM public.confirm_temporary_resource(gen_random_uuid(),c,'pe','potencial','Potencial Reaproveitado',5,true);
 PERFORM public.confirm_temporary_resource(gen_random_uuid(),c,'hp','manancial','Consumir Manancial',5,false);
 PERFORM public.confirm_temporary_resource(gen_random_uuid(),c,'hp','manancial','Consumir Manancial',3,false);
 body:=jsonb_set(jsonb_set(body,'{expectedSan}','28'),'{expectedSanMax}','29');
 body:=jsonb_set(body,'{paranormalCost,test}', '{"attribute":1,"dicePenalty":0,"dice":[20],"bonuses":[{"name":"QA","value":100}],"bonus":100,"total":120}');
 SELECT pe_current INTO pe FROM public.characters WHERE id=c;
 cast_event:=public.cast_character_ritual(gen_random_uuid(),c,pe,3,body);
 IF cast_event.payload->>'temporaryPEUsed'<>'3' OR (SELECT pe_current FROM public.characters WHERE id=c)<>pe THEN RAISE EXCEPTION 'PE temporário não usado primeiro'; END IF;
 receipt:=public.apply_character_effect(gen_random_uuid(),c,'damage','3','{"hp_current":15,"hp_max":20}',cast_event.id);
 IF (SELECT hp_current FROM public.characters WHERE id=c)<>15 OR receipt.payload->>'temporaryHPUsed'<>'3' THEN RAISE EXCEPTION 'PV temporário não usado primeiro'; END IF;
 body:=body||'{"ritualId":"arma-atroz","ritualName":"Arma Atroz","ritualElement":"sangue"}'::jsonb;
 body:=jsonb_set(body,'{paranormalCost,element}','"sangue"');
 cast_event:=public.cast_character_ritual(gen_random_uuid(),c,pe,1,body);
 -- Sustentação e turno manual: dois UUIDs no mesmo turno não debitam duas vezes.
 PERFORM public.apply_character_effect(gen_random_uuid(),c,'sustain',
  '{"ritualId":"arma-atroz","ritualName":"Arma Atroz","element":"Sangue","circle":1,"selectedEnhancements":[],"sustainConfig":{"action":"free"}}','{}',cast_event.id);
 turn:=public.get_character_ritual_turn(c);
 receipt:=public.begin_character_manual_turn(gen_random_uuid(),c,(turn->>'number')::integer);
 PERFORM public.begin_character_manual_turn(receipt.operation_id,c,(turn->>'number')::integer);
 IF (public.get_character_ritual_turn(c)->>'number')::integer<>(turn->>'number')::integer+1 THEN RAISE EXCEPTION 'Retry avançou turno duas vezes'; END IF;
 BEGIN
  PERFORM public.begin_character_manual_turn(gen_random_uuid(),c,(turn->>'number')::integer);
  RAISE EXCEPTION 'Snapshot antigo aceito'; EXCEPTION WHEN serialization_failure THEN NULL;
 END;
 IF (SELECT pe_current FROM public.characters WHERE id=c)<>pe THEN RAISE EXCEPTION 'Início do turno cobrou PE'; END IF;
 turn:=public.get_character_ritual_turn(c);
 SELECT jsonb_agg(jsonb_build_object('id',r->'id','ritual_id',r->'ritual_id','turns_active',r->'turns_active','pe_spent_total',r->'pe_spent_total','sustain_config',r->'sustain_config','is_concentrating',r->'is_concentrating') ORDER BY r->>'id')
 INTO expected FROM public.list_character_sustained_rituals(c) r;
 BEGIN
  PERFORM public.confirm_sustained_ritual_maintenance(gen_random_uuid(),c,expected,pe,turn||'{"number":999}'::jsonb);
  RAISE EXCEPTION 'Turno adulterado aceito'; EXCEPTION WHEN serialization_failure THEN NULL;
 END;
 receipt:=public.confirm_sustained_ritual_maintenance(gen_random_uuid(),c,expected,pe,turn);
 PERFORM public.confirm_sustained_ritual_maintenance(receipt.operation_id,c,expected,pe,turn);
 SELECT jsonb_agg(jsonb_build_object('id',r->'id','ritual_id',r->'ritual_id','turns_active',r->'turns_active','pe_spent_total',r->'pe_spent_total','sustain_config',r->'sustain_config','is_concentrating',r->'is_concentrating') ORDER BY r->>'id')
 INTO expected FROM public.list_character_sustained_rituals(c) r;
 BEGIN
  PERFORM public.confirm_sustained_ritual_maintenance(gen_random_uuid(),c,expected,pe,turn);
  RAISE EXCEPTION 'Cobrança duplicada no turno'; EXCEPTION WHEN unique_violation THEN NULL;
 END;
 IF (SELECT pe_current FROM public.characters WHERE id=c)<>pe THEN RAISE EXCEPTION 'Manutenção não consumiu PE temporário'; END IF;
 PERFORM public.begin_character_manual_turn(gen_random_uuid(),c,(turn->>'number')::integer);
 turn:=public.get_character_ritual_turn(c);
 PERFORM public.confirm_sustained_ritual_maintenance(gen_random_uuid(),c,expected,pe,turn);
 IF (SELECT pe_current FROM public.characters WHERE id=c)<>pe-1 THEN RAISE EXCEPTION 'Novo turno não cobrou'; END IF;
 -- Tela de Ruído: dano de Morte não pode consumir a fonte restrita a dano físico.
 SELECT hp_current,pe_current INTO hp,pe FROM public.characters WHERE id=c;
 SELECT (r->>'id')::uuid INTO sustain FROM public.list_character_temporary_resources(c) r WHERE r->>'source_name'='Consumir Manancial';
 PERFORM public.end_temporary_resource(gen_random_uuid(),c,sustain,2);
 body:=body||'{"ritualId":"tela-de-ruido","ritualName":"Tela de Ruído","ritualElement":"energia"}'::jsonb;
 body:=jsonb_set(body,'{paranormalCost,element}','"energia"');
 cast_event:=public.cast_character_ritual(gen_random_uuid(),c,pe,3,body);
 PERFORM public.apply_character_effect(gen_random_uuid(),c,'temporary_hp','30','{}',cast_event.id);
 receipt:=public.apply_character_effect(gen_random_uuid(),c,'damage','1',jsonb_build_object('hp_current',hp,'hp_max',20,'damageType','morte'),cast_event.id);
 IF receipt.payload->>'temporaryHPUsed'<>'0' OR (SELECT hp_current FROM public.characters WHERE id=c)<>hp-1 THEN RAISE EXCEPTION 'Tela absorveu dano paranormal'; END IF;
 SELECT pe_current INTO pe FROM public.characters WHERE id=c;
 cast_event:=public.cast_character_ritual(gen_random_uuid(),c,pe,3,body);
 receipt:=public.apply_character_effect(gen_random_uuid(),c,'damage','3',jsonb_build_object('hp_current',hp-1,'hp_max',20,'damageType','impacto'),cast_event.id);
 IF receipt.payload->>'temporaryHPUsed'<>'3' OR (SELECT hp_current FROM public.characters WHERE id=c)<>hp-1 THEN RAISE EXCEPTION 'Tela não absorveu dano físico'; END IF;
 -- Medo não rola Ocultismo: todas as formas registram custo e perda permanente correspondente.
 FOR form IN 1..3 LOOP
  SELECT pe_current,san_current,san_max INTO pe,san,maximum FROM public.characters WHERE id=c;
  body:=body||jsonb_build_object('ritualId','qa-medo','ritualElement','medo','expectedSan',san,'expectedSanMax',maximum,
   'paranormalCost',jsonb_build_object('source','system_roll','element','medo'),
   'enhancements',CASE form WHEN 1 THEN '[]'::jsonb WHEN 2 THEN '["Discente"]'::jsonb ELSE '["Verdadeiro"]'::jsonb END);
  receipt:=public.cast_character_ritual(gen_random_uuid(),c,pe,1,body);
  IF receipt.payload->'paranormalCost'->>'permanentSanLoss'<>form::text
   OR (SELECT san_max FROM public.characters WHERE id=c)<>maximum-form THEN RAISE EXCEPTION 'Medo não preservou perda da forma %',form; END IF;
 END LOOP;
END $$;
-- Conta sem vínculo não pode consultar nem avançar o relógio desta ficha.
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000712',true);
DO $$
BEGIN
 BEGIN
  PERFORM public.get_character_ritual_turn('00000000-0000-4000-8000-000000000701');
  RAISE EXCEPTION 'Leitura de turno não autorizada aceita'; EXCEPTION WHEN insufficient_privilege THEN NULL;
 END;
 BEGIN
  PERFORM public.begin_character_manual_turn(gen_random_uuid(),'00000000-0000-4000-8000-000000000701',2);
  RAISE EXCEPTION 'Avanço de turno não autorizado aceito'; EXCEPTION WHEN insufficient_privilege THEN NULL;
 END;
END $$;
RESET ROLE;
ROLLBACK;
