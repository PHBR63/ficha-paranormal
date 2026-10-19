-- Livro Base v1.3 p. 30-31, 40 e 63. Ensaio transacional sem dados permanentes.
BEGIN;
INSERT INTO auth.users(id) VALUES
 ('a1820000-0000-4000-8000-000000000001'),
 ('a1820000-0000-4000-8000-000000000002'),
 ('a1820000-0000-4000-8000-000000000003'),
 ('a1820000-0000-4000-8000-000000000004'),
 ('a1820000-0000-4000-8000-000000000005');
INSERT INTO public.characters(id,user_id,name,origin,class,class_track,nex,intellect,
 hp_current,hp_max,pe_current,pe_max,san_current,san_max,skills,inventory)
VALUES
 ('a1820000-0000-4000-8000-000000000011','a1820000-0000-4000-8000-000000000002',
 'QA Paramédico','Agente de Saúde','Especialista','medico-campo',40,2,5,30,10,15,20,20,
 '{"medicina":0}','[{"id":"kit-qa","catalogId":"kit_pericia","name":"Kit de Perícia","quantity":1}]'),
 ('a1820000-0000-4000-8000-000000000012','a1820000-0000-4000-8000-000000000003',
 'QA Aliado','Militar','Combatente',NULL,10,1,1,25,5,5,10,10,'{}','[]'),
 ('a1820000-0000-4000-8000-000000000013','a1820000-0000-4000-8000-000000000004',
 'QA Não vinculado','Militar','Combatente',NULL,10,1,1,25,5,5,10,10,'{}','[]'),
 ('a1820000-0000-4000-8000-000000000014','a1820000-0000-4000-8000-000000000005',
 'QA Aliado v1','Militar','Combatente',NULL,10,1,2,25,5,5,10,10,'{}','[]');
INSERT INTO public.campaigns_v2(id,master_id,name)
VALUES('a1820000-0000-4000-8000-000000000020','a1820000-0000-4000-8000-000000000001','QA Paramédico');
INSERT INTO public.campaign_members_v2(campaign_id,user_id,character_id,role) VALUES
 ('a1820000-0000-4000-8000-000000000020','a1820000-0000-4000-8000-000000000002','a1820000-0000-4000-8000-000000000011','player'),
 ('a1820000-0000-4000-8000-000000000020','a1820000-0000-4000-8000-000000000003','a1820000-0000-4000-8000-000000000012','player');
INSERT INTO public.campaigns(id,master_id,name)
VALUES('a1820000-0000-4000-8000-000000000021','a1820000-0000-4000-8000-000000000001','QA Paramédico v1');
INSERT INTO public.campaign_members(campaign_id,user_id,character_id,role) VALUES
 ('a1820000-0000-4000-8000-000000000021','a1820000-0000-4000-8000-000000000002','a1820000-0000-4000-8000-000000000011','player'),
 ('a1820000-0000-4000-8000-000000000021','a1820000-0000-4000-8000-000000000005','a1820000-0000-4000-8000-000000000014','player');
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','a1820000-0000-4000-8000-000000000002',true);
DO $$
DECLARE source_id uuid:='a1820000-0000-4000-8000-000000000011';
 ally_id uuid:='a1820000-0000-4000-8000-000000000012';
 ally_v1_id uuid:='a1820000-0000-4000-8000-000000000014';
 stranger_id uuid:='a1820000-0000-4000-8000-000000000013';
 options jsonb; request jsonb; receipt public.character_activity_events; budget jsonb;
 hp_after integer;
BEGIN
 options:=public.get_character_paramedico_options(source_id);
 IF options->>'trained'<>'false' OR options->>'medicalKit'<>'false' OR options->>'maxExtraDice'<>'1' THEN
  RAISE EXCEPTION 'Kit genérico ou treino ausente foram aceitos'; END IF;
 UPDATE public.characters SET skills='{"medicina":1}',
  inventory='[{"id":"kit-qa","catalogId":"kit_pericia","name":"Kit de Medicina","quantity":1,
    "accessoryConfiguration":{"kitSkill":"medicina"}}]' WHERE id=source_id;
 options:=public.get_character_paramedico_options(source_id);
 IF options->>'trained'<>'true' OR options->>'medicalKit'<>'true' OR options->>'originBonus'<>'2' THEN
  RAISE EXCEPTION 'Treino, kit ou bônus de origem incorretos'; END IF;
 budget:=public.get_character_pe_budget(source_id);
 BEGIN
  PERFORM public.confirm_character_paramedico(gen_random_uuid(),source_id,
   jsonb_build_object('targetId',source_id,'extraDice',2,'standardActionConfirmed',true,
    'expectedPE',10,'expectedNex',40,'expectedTargetHP',5,'expectedTurnKey',budget->>'key'));
  RAISE EXCEPTION 'Dado extra acima do NEX foi aceito';
 EXCEPTION WHEN SQLSTATE '55004' THEN NULL; END;
 IF (SELECT pe_current FROM public.characters WHERE id=source_id)<>10 THEN
  RAISE EXCEPTION 'Rejeição de dado extra consumiu PE'; END IF;
 request:=jsonb_build_object('targetId',source_id,'extraDice',1,'standardActionConfirmed',true,
  'adjacencyConfirmed',false,'expectedPE',10,'expectedNex',40,'expectedTargetHP',5,
  'expectedTurnKey',budget->>'key');
 receipt:=public.confirm_character_paramedico('a1820000-0000-4000-8000-000000000031',source_id,request);
 hp_after:=(SELECT hp_current FROM public.characters WHERE id=source_id);
 IF receipt.payload->>'diceCount'<>'3' OR receipt.payload->>'peCost'<>'3'
  OR receipt.payload->>'originBonus'<>'2'
  OR jsonb_array_length(receipt.payload->'dice')<>3
  OR (SELECT pe_current FROM public.characters WHERE id=source_id)<>7
  OR hp_after<>least(30,5+(receipt.payload->>'totalHealing')::integer) THEN
  RAISE EXCEPTION 'Cura própria, dados, bônus ou PE incorretos'; END IF;
 IF (public.confirm_character_paramedico(receipt.id,source_id,request)).id<>receipt.id
  OR (SELECT pe_current FROM public.characters WHERE id=source_id)<>7
  OR (SELECT count(*) FROM public.character_activity_events WHERE operation_id=receipt.id)<>1 THEN
  RAISE EXCEPTION 'Reenvio duplicou gasto ou recibo'; END IF;
 request:=jsonb_build_object('targetId',ally_id,'extraDice',0,'standardActionConfirmed',true,
  'adjacencyConfirmed',true,'expectedPE',7,'expectedNex',40,'expectedTargetHP',1,
  'expectedTurnKey',budget->>'key');
 receipt:=public.confirm_character_paramedico('a1820000-0000-4000-8000-000000000032',source_id,request);
 IF (SELECT pe_current FROM public.characters WHERE id=source_id)<>5
  OR (SELECT hp_current FROM public.characters WHERE id=ally_id)<>least(25,1+(receipt.payload->>'totalHealing')::integer)
  OR receipt.payload->>'targetEventId' IS NULL THEN
  RAISE EXCEPTION 'Cura do aliado, PE ou recibo incorretos'; END IF;
 -- O dono do aliado enxerga o próprio histórico; o jogador fonte não ganha
 -- permissão para consultar o histórico completo de outra pessoa.
 PERFORM set_config('request.jwt.claim.sub','a1820000-0000-4000-8000-000000000003',true);
 IF (SELECT count(*) FROM public.character_activity_events WHERE character_id=ally_id
   AND payload->>'kind'='paramedico_healing_received')<>1 THEN
  RAISE EXCEPTION 'Histórico do aliado não foi persistido'; END IF;
 PERFORM set_config('request.jwt.claim.sub','a1820000-0000-4000-8000-000000000002',true);
 BEGIN
  PERFORM public.confirm_character_paramedico(gen_random_uuid(),source_id,
   jsonb_build_object('targetId',stranger_id,'extraDice',0,'standardActionConfirmed',true,
    'adjacencyConfirmed',true,'expectedPE',5,'expectedNex',40,'expectedTargetHP',1,
    'expectedTurnKey',budget->>'key'));
  RAISE EXCEPTION 'Alvo não vinculado foi curado';
 EXCEPTION WHEN SQLSTATE '42501' THEN NULL; END;
 UPDATE public.characters SET inventory='[]' WHERE id=source_id;
 BEGIN
  PERFORM public.confirm_character_paramedico(gen_random_uuid(),source_id,
   jsonb_build_object('targetId',source_id,'extraDice',0,'standardActionConfirmed',true,
    'adjacencyConfirmed',true,'expectedPE',5,'expectedNex',40,'expectedTargetHP',hp_after,
    'expectedTurnKey',budget->>'key'));
  RAISE EXCEPTION 'Kit ausente foi aceito';
 EXCEPTION WHEN SQLSTATE '55004' THEN NULL; END;
 UPDATE public.characters SET inventory='[{"id":"kit-qa","catalogId":"kit_pericia","name":"Kit de Medicina",
   "accessoryConfiguration":{"kitSkill":"medicina"}}]' WHERE id=source_id;
 request:=jsonb_build_object('targetId',ally_v1_id,'extraDice',0,'standardActionConfirmed',true,
  'adjacencyConfirmed',true,'expectedPE',5,'expectedNex',40,'expectedTargetHP',2,
  'expectedTurnKey',budget->>'key');
 receipt:=public.confirm_character_paramedico('a1820000-0000-4000-8000-000000000033',source_id,request);
 IF receipt.payload->>'targetName'<>'QA Aliado v1' OR (SELECT pe_current FROM public.characters WHERE id=source_id)<>3
  OR (SELECT hp_current FROM public.characters WHERE id=ally_v1_id)<=2 THEN
  RAISE EXCEPTION 'Vínculo ou cura em campanha v1 falhou'; END IF;
 -- Com controle manual, o gasto precisa entrar no mesmo orçamento do turno.
 PERFORM public.begin_character_manual_turn(gen_random_uuid(),source_id,0);
 budget:=public.get_character_pe_budget(source_id);
 request:=jsonb_build_object('targetId',source_id,'extraDice',0,'standardActionConfirmed',true,
  'adjacencyConfirmed',false,'expectedPE',3,'expectedNex',40,'expectedTargetHP',hp_after,
  'expectedTurnKey',budget->>'key');
 receipt:=public.confirm_character_paramedico('a1820000-0000-4000-8000-000000000034',source_id,request);
 IF receipt.payload->'peBudget'->>'tracked'<>'true'
  OR (public.get_character_pe_budget(source_id)->>'spent')::integer<>2
  OR (SELECT pe_current FROM public.characters WHERE id=source_id)<>1 THEN
  RAISE EXCEPTION 'Cobrança ou orçamento do turno manual incorreto'; END IF;
 PERFORM public.confirm_character_paramedico(receipt.id,source_id,request);
 IF (public.get_character_pe_budget(source_id)->>'spent')::integer<>2 THEN
  RAISE EXCEPTION 'Reenvio duplicou o orçamento do turno'; END IF;
 -- Versatilidade concede só Paramédico e somente após NEX 50%.
 UPDATE public.characters SET class_track=NULL,nex=50,
  versatility_track='{"trackId":"medico-campo","abilityId":"paramedico"}' WHERE id=source_id;
 IF public.get_character_paramedico_options(source_id)->>'eligible'<>'true' THEN
  RAISE EXCEPTION 'Paramédico por Versatilidade foi negado'; END IF;
 UPDATE public.characters SET nex=40 WHERE id=source_id;
 IF public.get_character_paramedico_options(source_id)->>'eligible'<>'false' THEN
  RAISE EXCEPTION 'Versatilidade liberada antes do NEX 50 por cento'; END IF;
END $$;
ROLLBACK;
SELECT 'PASS: requisitos, Versatilidade, kit, bônus, cura própria/aliado, v1/v2, PE, turno manual, histórico, permissão e reenvio' AS result;
