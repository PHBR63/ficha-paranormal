-- Dados de ensaio descartáveis: todo o fluxo, inclusive recibos, é revertido.
BEGIN;
INSERT INTO auth.users(id) VALUES
 ('00000000-0000-4000-8000-000000000f01'),
 ('00000000-0000-4000-8000-000000000f02'),
 ('00000000-0000-4000-8000-000000000f03');
INSERT INTO public.characters(id,user_id,name,origin,class,nex,hp_current,hp_max,pe_current,pe_max,san_current,san_max,conditions)
VALUES
 ('00000000-0000-4000-8000-000000000f11','00000000-0000-4000-8000-000000000f02','QA alvo A','Vítima','Combatente',10,20,20,10,10,10,10,'[]'),
 ('00000000-0000-4000-8000-000000000f12','00000000-0000-4000-8000-000000000f03','QA alvo B','Vítima','Combatente',10,12,12,10,10,10,10,'[]');
INSERT INTO public.campaigns_v2(id,master_id,name) VALUES
 ('00000000-0000-4000-8000-000000000f20','00000000-0000-4000-8000-000000000f01','QA dano em área');
INSERT INTO public.campaign_members_v2(campaign_id,user_id,role,character_id) VALUES
 ('00000000-0000-4000-8000-000000000f20','00000000-0000-4000-8000-000000000f02','player','00000000-0000-4000-8000-000000000f11'),
 ('00000000-0000-4000-8000-000000000f20','00000000-0000-4000-8000-000000000f03','player','00000000-0000-4000-8000-000000000f12');
INSERT INTO public.character_temporary_resources(character_id,resource,source_key,source_name,remaining,damage_types)
VALUES
 ('00000000-0000-4000-8000-000000000f11','hp','qa-corte','QA proteção Corte',5,ARRAY['Corte']),
 ('00000000-0000-4000-8000-000000000f11','hp','qa-energia','QA proteção Energia',4,ARRAY['Energia']);

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000f02',true);
DO $$
BEGIN
 BEGIN
  PERFORM public.confirm_campaign_bulk_damage('00000000-0000-4000-8000-000000000f40',
   '00000000-0000-4000-8000-000000000f20','QA',
   '[{"characterId":"00000000-0000-4000-8000-000000000f11","damage":1,"damageType":"corte","resistedDamage":0,"damageReduction":0,"immuneDamage":false,"expectedHp":20}]');
  RAISE EXCEPTION 'Jogador aplicou dano como mestre';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;

SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000f01',true);
DO $$
DECLARE campaign uuid:='00000000-0000-4000-8000-000000000f20';
 operation uuid:='00000000-0000-4000-8000-000000000f41';
 request jsonb:='[{"characterId":"00000000-0000-4000-8000-000000000f11","damage":12,"damageType":"corte","resistedDamage":3,"damageReduction":2,"immuneDamage":false,"expectedHp":20},{"characterId":"00000000-0000-4000-8000-000000000f12","damage":10,"damageType":"energia","resistedDamage":0,"damageReduction":0,"immuneDamage":true,"expectedHp":12}]';
 receipt jsonb; retry jsonb; before_events integer; non_hp_type text;
BEGIN
 receipt:=public.confirm_campaign_bulk_damage(operation,campaign,'Explosão QA',request);
 IF receipt->'targets'->0->>'finalDamage'<>'7'
  OR receipt->'targets'->0->>'temporaryHPUsed'<>'5'
  OR receipt->'targets'->0->>'hpAfter'<>'18'
  OR receipt->'targets'->1->>'hpAfter'<>'12' THEN
  RAISE EXCEPTION 'Cálculo, imunidade ou PV temporários incorretos: %',receipt;
 END IF;
 IF (SELECT hp_current FROM public.characters WHERE id='00000000-0000-4000-8000-000000000f11')<>18 THEN
  RAISE EXCEPTION 'Dano não chegou à ficha'; END IF;
 SELECT count(*) INTO before_events FROM public.character_activity_events
  WHERE payload->>'batchOperationId'=operation::text;
 IF before_events<>2 THEN RAISE EXCEPTION 'Histórico por alvo não registrado'; END IF;
 retry:=public.confirm_campaign_bulk_damage(operation,campaign,'Explosão QA',request);
 IF retry IS DISTINCT FROM receipt OR (SELECT count(*) FROM public.character_activity_events
  WHERE payload->>'batchOperationId'=operation::text)<>2 THEN
  RAISE EXCEPTION 'Replay duplicou dano ou histórico'; END IF;
 BEGIN
  PERFORM public.confirm_campaign_bulk_damage(operation,campaign,'Outro efeito',request);
  RAISE EXCEPTION 'Operação reutilizada com outra fonte';
 EXCEPTION WHEN unique_violation THEN NULL; END;
 BEGIN
  PERFORM public.confirm_campaign_bulk_damage(gen_random_uuid(),campaign,'QA',request);
  RAISE EXCEPTION 'PV antigo passou após alteração';
 EXCEPTION WHEN serialization_failure THEN NULL; END;
 BEGIN
  PERFORM public.confirm_campaign_bulk_damage(gen_random_uuid(),campaign,'QA',
   jsonb_build_array(request->0,request->0));
  RAISE EXCEPTION 'Alvo duplicado aceito';
 EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
 BEGIN
  PERFORM public.confirm_campaign_bulk_damage(gen_random_uuid(),campaign,'QA',
   jsonb_build_array(jsonb_set(request->0,'{damageType}','"tipo-inexistente"')));
  RAISE EXCEPTION 'Tipo de dano inexistente aceito';
 EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
 FOREACH non_hp_type IN ARRAY ARRAY['mental','medo'] LOOP
  BEGIN
   PERFORM public.confirm_campaign_bulk_damage(gen_random_uuid(),campaign,'QA',
    jsonb_build_array(jsonb_set(request->0,'{damageType}',to_jsonb(non_hp_type))));
   RAISE EXCEPTION 'Dano de SAN aceito como perda de PV: %',non_hp_type;
  EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
 END LOOP;
 BEGIN
  PERFORM public.confirm_campaign_bulk_damage('00000000-0000-4000-8000-000000000f42',campaign,'QA',
   jsonb_build_array(
    jsonb_build_object('characterId','00000000-0000-4000-8000-000000000f11',
     'damage',1,'damageType','corte','resistedDamage',0,'damageReduction',0,
     'immuneDamage',false,'expectedHp',18),
    jsonb_build_object('characterId','00000000-0000-4000-8000-000000000f99',
     'damage',1,'damageType','corte','resistedDamage',0,'damageReduction',0,
     'immuneDamage',false,'expectedHp',10)));
  RAISE EXCEPTION 'Alvo fora da campanha aceito';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 IF (SELECT hp_current FROM public.characters WHERE id='00000000-0000-4000-8000-000000000f11')<>18 THEN
  RAISE EXCEPTION 'Lote inválido aplicou dano parcial'; END IF;
END $$;
RESET ROLE;
INSERT INTO public.character_temporary_resources(character_id,resource,source_key,source_name,remaining,damage_types)
VALUES('00000000-0000-4000-8000-000000000f12','hp','qa-balistico','QA Balístico',3,ARRAY['Balístico']);
DO $$
BEGIN
 IF (SELECT remaining FROM public.character_temporary_resources WHERE source_key='qa-corte')<>0
  OR (SELECT remaining FROM public.character_temporary_resources WHERE source_key='qa-energia')<>4 THEN
  RAISE EXCEPTION 'Reservatórios de tipos distintos foram consumidos incorretamente'; END IF;
 IF (SELECT count(*) FROM public.campaign_bulk_damage_operations WHERE campaign_id='00000000-0000-4000-8000-000000000f20')<>1 THEN
  RAISE EXCEPTION 'Operação inválida persistiu'; END IF;
 IF public.consume_temporary_resource('00000000-0000-4000-8000-000000000f12','hp',2,'balistico')<>2 THEN
  RAISE EXCEPTION 'Tipo sem acento não consumiu reservatório legado'; END IF;
END $$;
-- A condição externa permanece, enquanto os estados derivados acompanham PV.
UPDATE public.characters SET conditions='[{"id":"marca-da-mesa","name":"Marca da mesa","params":{"valor":7}}]'
WHERE id='00000000-0000-4000-8000-000000000f11';
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000f01',true);
DO $$
DECLARE campaign uuid:='00000000-0000-4000-8000-000000000f20';
 target_id uuid:='00000000-0000-4000-8000-000000000f11';
 first_operation uuid:='00000000-0000-4000-8000-000000000f43';
 first_request jsonb; first_receipt jsonb; conditions jsonb;
BEGIN
 first_request:=jsonb_build_array(jsonb_build_object('characterId',target_id,
  'damage',12,'damageType','corte','resistedDamage',0,
  'damageReduction',0,'immuneDamage',false,'expectedHp',18));
 first_receipt:=public.confirm_campaign_bulk_damage(first_operation,campaign,'QA metade',first_request);
 SELECT c.conditions INTO conditions FROM public.characters c WHERE c.id=target_id;
 IF (SELECT c.hp_current FROM public.characters c WHERE c.id=target_id)<>6
  OR NOT EXISTS(SELECT 1 FROM jsonb_array_elements(conditions) c WHERE c->>'id'='machucado')
  OR NOT EXISTS(SELECT 1 FROM jsonb_array_elements(conditions) c
    WHERE c->>'id'='marca-da-mesa' AND c#>>'{params,valor}'='7')
  OR first_receipt#>>'{targets,0,conditionsAfter,1,id}'<>'machucado' THEN
  RAISE EXCEPTION 'Dano em área não reconciliou metade dos PV preservando condição manual'; END IF;
 IF public.confirm_campaign_bulk_damage(first_operation,campaign,'QA metade',first_request)
   IS DISTINCT FROM first_receipt THEN
  RAISE EXCEPTION 'Reenvio alterou recibo de condições'; END IF;
 PERFORM public.confirm_campaign_bulk_damage(gen_random_uuid(),campaign,'QA zero',
  jsonb_build_array(jsonb_build_object('characterId',target_id,
   'damage',6,'damageType','corte','resistedDamage',0,
   'damageReduction',0,'immuneDamage',false,'expectedHp',6)));
 SELECT c.conditions INTO conditions FROM public.characters c WHERE c.id=target_id;
 IF (SELECT c.hp_current FROM public.characters c WHERE c.id=target_id)<>0
  OR NOT EXISTS(SELECT 1 FROM jsonb_array_elements(conditions) c WHERE c->>'id'='inconsciente')
  OR NOT EXISTS(SELECT 1 FROM jsonb_array_elements(conditions) c WHERE c->>'id'='morrendo')
  OR (SELECT count(*) FROM jsonb_array_elements(conditions) c WHERE c->>'id'='marca-da-mesa')<>1 THEN
  RAISE EXCEPTION 'Queda a zero perdeu condições derivadas ou manuais'; END IF;
END $$;
ROLLBACK;
