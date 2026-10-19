-- Reanimação, Livro Base v1.3 p.31; retorno com 1 PV por decisão desta mesa.
-- Executar após as migrations em banco de testes. Tudo é revertido no fim.
BEGIN;
INSERT INTO auth.users(id) VALUES
 ('a1840000-0000-4000-8000-000000000001'), -- mestre
 ('a1840000-0000-4000-8000-000000000002'), -- médico
 ('a1840000-0000-4000-8000-000000000003'),
 ('a1840000-0000-4000-8000-000000000004'),
 ('a1840000-0000-4000-8000-000000000005');
INSERT INTO public.characters(id,user_id,name,origin,class,class_track,nex,intellect,
 hp_current,hp_max,pe_current,pe_max,san_current,san_max,skills,inventory,conditions)
VALUES
 ('a1840000-0000-4000-8000-000000000011','a1840000-0000-4000-8000-000000000002',
 'QA Médico','Militar','Especialista','medico-campo',99,2,20,30,20,20,20,20,
 '{"medicina":1}','[{"catalogId":"kit_pericia","name":"Kit de Medicina",
 "accessoryConfiguration":{"kitSkill":"medicina"}}]','[]'),
 ('a1840000-0000-4000-8000-000000000012','a1840000-0000-4000-8000-000000000003',
 'QA Morte comum','Militar','Combatente',NULL,10,1,0,20,2,2,10,10,'{}','[]',
 '[{"id":"morrendo","dyingCounter":0},{"id":"inconsciente"},{"id":"custom","name":"Condição da mesa"}]'),
 ('a1840000-0000-4000-8000-000000000013','a1840000-0000-4000-8000-000000000004',
 'QA Dano massivo','Militar','Combatente',NULL,10,1,0,20,2,2,10,10,'{}','[]','[]'),
 ('a1840000-0000-4000-8000-000000000014','a1840000-0000-4000-8000-000000000005',
 'QA Segundo alvo','Militar','Combatente',NULL,10,1,0,20,2,2,10,10,'{}','[]','[]');
INSERT INTO public.campaigns_v2(id,master_id,name)
VALUES('a1840000-0000-4000-8000-000000000020','a1840000-0000-4000-8000-000000000001','QA Reanimação');
INSERT INTO public.campaign_members_v2(campaign_id,user_id,character_id,role) VALUES
 ('a1840000-0000-4000-8000-000000000020','a1840000-0000-4000-8000-000000000002','a1840000-0000-4000-8000-000000000011','player'),
 ('a1840000-0000-4000-8000-000000000020','a1840000-0000-4000-8000-000000000003','a1840000-0000-4000-8000-000000000012','player'),
 ('a1840000-0000-4000-8000-000000000020','a1840000-0000-4000-8000-000000000004','a1840000-0000-4000-8000-000000000013','player'),
 ('a1840000-0000-4000-8000-000000000020','a1840000-0000-4000-8000-000000000005','a1840000-0000-4000-8000-000000000014','player');
INSERT INTO public.campaign_combat_state_v2(campaign_id) VALUES('a1840000-0000-4000-8000-000000000020');

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','a1840000-0000-4000-8000-000000000002',true);
DO $$
DECLARE request jsonb;
BEGIN
 request:=jsonb_build_object('campaignId','a1840000-0000-4000-8000-000000000020',
  'targetId','a1840000-0000-4000-8000-000000000012','cause','ordinary',
  'deathConfirmed',true,'expectedScene',1,'expectedTargetHp',0);
 BEGIN
  PERFORM public.confirm_character_reanimacao_death(gen_random_uuid(),
   'a1840000-0000-4000-8000-000000000011',request);
  RAISE EXCEPTION 'Jogador confirmou morte sem ser mestre';
 EXCEPTION WHEN SQLSTATE '42501' THEN NULL; END;
END $$;

SELECT set_config('request.jwt.claim.sub','a1840000-0000-4000-8000-000000000001',true);
DO $$
DECLARE medic uuid:='a1840000-0000-4000-8000-000000000011';
 campaign uuid:='a1840000-0000-4000-8000-000000000020';
 request jsonb; receipt public.character_activity_events; target_id uuid; operation_id uuid;
BEGIN
 IF (public.get_character_reanimacao_options(medic)->'campaigns'->0->>'canConfirmDeath')<>'true' THEN
  RAISE EXCEPTION 'Mestre não pode confirmar a morte'; END IF;
 FOR target_id,operation_id IN SELECT * FROM (VALUES
  ('a1840000-0000-4000-8000-000000000012'::uuid,'a1840000-0000-4000-8000-000000000031'::uuid),
  ('a1840000-0000-4000-8000-000000000013'::uuid,'a1840000-0000-4000-8000-000000000032'::uuid),
  ('a1840000-0000-4000-8000-000000000014'::uuid,'a1840000-0000-4000-8000-000000000033'::uuid)
 ) entries LOOP
  request:=jsonb_build_object('campaignId',campaign,'targetId',target_id,
   'cause',CASE WHEN target_id='a1840000-0000-4000-8000-000000000013'::uuid THEN 'massive_damage' ELSE 'ordinary' END,
   'deathConfirmed',true,'expectedScene',1,'expectedTargetHp',0);
  receipt:=public.confirm_character_reanimacao_death(operation_id,medic,request);
  IF receipt.payload->>'kind'<>'reanimacao_death' OR (SELECT pe_current FROM public.characters WHERE id=medic)<>20 THEN
   RAISE EXCEPTION 'Registro de morte cobrou PE ou não gerou recibo'; END IF;
  IF (public.confirm_character_reanimacao_death(operation_id,medic,request)).id<>receipt.id THEN
   RAISE EXCEPTION 'Reenvio da confirmação de morte não foi idempotente'; END IF;
 END LOOP;
END $$;

SELECT set_config('request.jwt.claim.sub','a1840000-0000-4000-8000-000000000002',true);
DO $$
DECLARE medic uuid:='a1840000-0000-4000-8000-000000000011';
 campaign uuid:='a1840000-0000-4000-8000-000000000020';
 request jsonb; receipt public.character_activity_events; budget jsonb;
BEGIN
 budget:=public.get_character_pe_budget(medic);
 request:=jsonb_build_object('campaignId',campaign,
  'targetId','a1840000-0000-4000-8000-000000000013',
  'deathId','a1840000-0000-4000-8000-000000000032','completeActionConfirmed',true,
  'expectedScene',1,'expectedTargetHp',0,'expectedPE',20,'expectedNex',99,
  'expectedTurnKey',budget->>'key');
 BEGIN
  PERFORM public.confirm_character_reanimacao(gen_random_uuid(),medic,request);
  RAISE EXCEPTION 'Dano massivo foi reanimado';
 EXCEPTION WHEN SQLSTATE '55004' THEN NULL; END;
 IF (SELECT pe_current FROM public.characters WHERE id=medic)<>20 THEN
  RAISE EXCEPTION 'Falha por dano massivo consumiu PE'; END IF;
 request:=request||jsonb_build_object('targetId','a1840000-0000-4000-8000-000000000012',
  'deathId','a1840000-0000-4000-8000-000000000031');
 receipt:=public.confirm_character_reanimacao('a1840000-0000-4000-8000-000000000041',medic,request);
 IF receipt.payload->>'kind'<>'reanimacao' OR (SELECT pe_current FROM public.characters WHERE id=medic)<>10
  OR (SELECT hp_current FROM public.characters WHERE id='a1840000-0000-4000-8000-000000000012')<>1
  OR (SELECT conditions FROM public.characters WHERE id='a1840000-0000-4000-8000-000000000012')
    @> '[{"id":"morrendo"}]'::jsonb THEN
  RAISE EXCEPTION 'Reanimação não confirmou 1 PV, 10 PE ou encerrou Morrendo'; END IF;
 IF (public.confirm_character_reanimacao(receipt.id,medic,request)).id<>receipt.id
  OR (SELECT pe_current FROM public.characters WHERE id=medic)<>10 THEN
  RAISE EXCEPTION 'Reenvio duplicou gasto ou histórico'; END IF;
 request:=request||jsonb_build_object('targetId','a1840000-0000-4000-8000-000000000014',
  'deathId','a1840000-0000-4000-8000-000000000033','expectedPE',10);
 BEGIN
  PERFORM public.confirm_character_reanimacao(gen_random_uuid(),medic,request);
  RAISE EXCEPTION 'Segundo uso na cena foi permitido';
 EXCEPTION WHEN SQLSTATE '55004' THEN NULL; END;
 IF (SELECT count(*) FROM public.character_activity_events
   WHERE payload->>'kind'='reanimacao' AND character_id=medic)<>1 THEN
  RAISE EXCEPTION 'Histórico de Reanimação duplicado'; END IF;
END $$;

-- Cura posterior invalida a morte: uma nova redução a zero não reutiliza o recibo.
RESET ROLE;
UPDATE public.characters SET hp_current=1
 WHERE id='a1840000-0000-4000-8000-000000000014';
DO $$
BEGIN
 IF (SELECT resolved_at IS NULL FROM public.character_reanimation_deaths
   WHERE id='a1840000-0000-4000-8000-000000000033') THEN
  RAISE EXCEPTION 'Morte antiga continuou elegível após cura'; END IF;
END $$;
-- A cena seguinte invalida os demais registros não usados, inclusive dano massivo.
UPDATE public.campaign_combat_state_v2 SET scene_number=2
 WHERE campaign_id='a1840000-0000-4000-8000-000000000020';
DO $$
BEGIN
 IF EXISTS(SELECT 1 FROM public.character_reanimation_deaths
   WHERE campaign_id='a1840000-0000-4000-8000-000000000020' AND resolved_at IS NULL) THEN
  RAISE EXCEPTION 'Morte da cena anterior continuou elegível'; END IF;
END $$;
SELECT 'PASS: mestre, dano massivo, 1 PV, 10 PE, uso/cena, reenvio, cura e encerramento' AS result;
ROLLBACK;
