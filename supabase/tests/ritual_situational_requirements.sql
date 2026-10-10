-- Ensaio isolado: usuários, fichas, conferências e débitos são revertidos ao final.
BEGIN;
INSERT INTO auth.users(id) VALUES ('00000000-0000-4000-8000-000000000981'),('00000000-0000-4000-8000-000000000982'),('00000000-0000-4000-8000-000000000983');
INSERT INTO public.characters(id,user_id,name,origin,class,class_track,nex,hp_current,hp_max,pe_current,pe_max,san_current,san_max,rituals,inventory,creation_data)
VALUES
 ('00000000-0000-4000-8000-000000000991','00000000-0000-4000-8000-000000000981','QA grimório','Vítima','Ocultista','graduado',40,10,20,50,50,30,30,'["arma-atroz","perturbacao"]','[{"id":"book","name":"Grimório","quantity":1,"creationSource":"grimorio"}]','{"rituals":["perturbacao"],"extraRituals":{"grimorio-inicial":["arma-atroz"]}}'),
 ('00000000-0000-4000-8000-000000000992','00000000-0000-4000-8000-000000000981','QA lâmina','Vítima','Ocultista','lamina-paranormal',10,10,20,50,50,30,30,'["amaldicoar-arma-sangue"]','[]',NULL);
INSERT INTO public.campaigns_v2(id,master_id,name) VALUES ('00000000-0000-4000-8000-000000000994','00000000-0000-4000-8000-000000000982','QA fonte v2');
INSERT INTO public.campaign_members_v2(campaign_id,user_id,role,character_id) VALUES ('00000000-0000-4000-8000-000000000994','00000000-0000-4000-8000-000000000981','player','00000000-0000-4000-8000-000000000991') ON CONFLICT(campaign_id,user_id) DO UPDATE SET character_id=EXCLUDED.character_id;
INSERT INTO public.campaigns(id,master_id,name) VALUES ('00000000-0000-4000-8000-000000000995','00000000-0000-4000-8000-000000000982','QA fonte v1');
INSERT INTO public.campaign_members(campaign_id,user_id,role,character_id) VALUES ('00000000-0000-4000-8000-000000000995','00000000-0000-4000-8000-000000000981','player','00000000-0000-4000-8000-000000000992');
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000981',true);
DO $$
DECLARE g uuid:='00000000-0000-4000-8000-000000000991'; l uuid:='00000000-0000-4000-8000-000000000992'; context jsonb; body jsonb; event public.character_activity_events; count_before integer;
BEGIN
 context:=public.get_character_ritual_situational(g,'arma-atroz');
 IF context->>'source'<>'grimoire' OR context->>'execution'<>'Padrão' OR context->'canReview'<>'false'::jsonb THEN RAISE EXCEPTION 'Fonte ou permissão incorreta'; END IF;
 IF public.get_character_ritual_situational(g,'perturbacao')->>'source'<>'memorized' THEN RAISE EXCEPTION 'Todos os rituais marcados grimório'; END IF;
 context:=public.get_character_ritual_situational(l,'amaldicoar-arma-sangue');
 IF context->'bladeEligible'<>'false'::jsonb OR context->>'bladeKnowledge'<>'unverified' THEN RAISE EXCEPTION 'NEX inferiu cronologia'; END IF;
 BEGIN PERFORM public.confirm_character_ritual_knowledge(gen_random_uuid(),l,'amaldicoar-arma-sangue','{"source":"memorized","knownBeforeBlade":true,"note":"Jogador declara sozinho"}'); RAISE EXCEPTION 'Jogador confirmou'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 body:='{"ritualId":"arma-atroz","ritualName":"Arma Atroz","ritualElement":"sangue","enhancements":[],"requirementsConfirmed":true,"expectedSan":30,"expectedSanMax":30,"paranormalCost":{"source":"system_roll","element":"sangue","test":{"attribute":1,"dicePenalty":0,"dice":[20],"bonuses":[{"name":"QA","value":20}],"bonus":20,"total":40}}}';
 SELECT count(*) INTO count_before FROM public.character_activity_events WHERE character_id=g;
 BEGIN PERFORM public.cast_character_ritual(gen_random_uuid(),g,50,1,body); RAISE EXCEPTION 'Ignorou consulta'; EXCEPTION WHEN SQLSTATE '55003' THEN NULL; END;
 BEGIN PERFORM public.cast_character_ritual(gen_random_uuid(),g,50,1,body||'{"situational":{"grimoireItemId":"book","grimoireHeld":true}}'); RAISE EXCEPTION 'Ignorou leitura'; EXCEPTION WHEN SQLSTATE '55003' THEN NULL; END;
 BEGIN PERFORM public.cast_character_ritual(gen_random_uuid(),g,50,1,body||'{"situational":{"grimoireItemId":"outro","grimoireHeld":true,"grimoireRead":true}}'); RAISE EXCEPTION 'Aceitou outro item'; EXCEPTION WHEN SQLSTATE '55003' THEN NULL; END;
 IF (SELECT pe_current FROM public.characters WHERE id=g)<>50 OR (SELECT san_current FROM public.characters WHERE id=g)<>30 OR (SELECT count(*) FROM public.character_activity_events WHERE character_id=g)<>count_before THEN RAISE EXCEPTION 'Falha deixou débito ou histórico parcial'; END IF;
 body:=body||'{"situational":{"grimoireItemId":"book","grimoireHeld":true,"grimoireRead":true,"costBeforeBlade":1}}';
 event:=public.cast_character_ritual(gen_random_uuid(),g,50,1,body);
 IF event.payload->>'castingSource'<>'grimoire' OR event.payload->>'execution'<>'Padrão' OR event.payload->'peCost'<>'1'::jsonb OR event.payload->'grimoirePreparation'->>'readingAction'<>'Completa' OR event.payload->>'situationalResolution'<>'server_checked' THEN RAISE EXCEPTION 'Recibo não preservou consulta separada'; END IF;
 PERFORM public.cast_character_ritual(event.operation_id,g,50,1,body);
 IF (SELECT pe_current FROM public.characters WHERE id=g)<>49 THEN RAISE EXCEPTION 'Repetição cobrou de novo'; END IF;
 UPDATE public.characters SET inventory='[{"id":"book","name":"Grimório Vivo","quantity":1}]' WHERE id=g;
 PERFORM public.cast_character_ritual(event.operation_id,g,50,1,body);
 IF (SELECT pe_current FROM public.characters WHERE id=g)<>49 THEN RAISE EXCEPTION 'Recuperação antiga cobrou após perda do item'; END IF;
 BEGIN PERFORM public.cast_character_ritual(gen_random_uuid(),g,49,1,body); RAISE EXCEPTION 'Grimório Vivo aceito'; EXCEPTION WHEN SQLSTATE '55003' THEN NULL; END;
 UPDATE public.characters SET inventory='[{"id":"book","name":"Grimório","quantity":0}]' WHERE id=g;
 BEGIN PERFORM public.cast_character_ritual(gen_random_uuid(),g,49,1,body); RAISE EXCEPTION 'Quantidade zero aceitou'; EXCEPTION WHEN SQLSTATE '55003' THEN NULL; END;
 UPDATE public.characters SET inventory='[{"id":"book","name":"Grimório Vivo","creationSource":"grimorio","quantity":1}]' WHERE id=g;
 BEGIN PERFORM public.cast_character_ritual(gen_random_uuid(),g,49,1,body); RAISE EXCEPTION 'Grimório Vivo com marcador aceito'; EXCEPTION WHEN SQLSTATE '55003' THEN NULL; END;
 BEGIN UPDATE public.characters SET creation_data=NULL WHERE id=g; RAISE EXCEPTION 'Cliente apagou proveniência'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 IF public.get_character_ritual_situational(g,'arma-atroz')->>'source'<>'grimoire' THEN RAISE EXCEPTION 'Fonte adulterada'; END IF;
 BEGIN PERFORM 1 FROM public.character_ritual_knowledge; RAISE EXCEPTION 'Tabela privada liberada'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN PERFORM public.ritual_execution_catalog(); RAISE EXCEPTION 'Helper privado liberado'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
UPDATE public.characters SET creation_data=NULL WHERE id='00000000-0000-4000-8000-000000000991';
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000982',true);
DO $$
DECLARE g uuid:='00000000-0000-4000-8000-000000000991'; l uuid:='00000000-0000-4000-8000-000000000992'; event public.character_activity_events; context jsonb; review jsonb;
BEGIN
 IF public.get_character_ritual_situational(g,'perturbacao')->>'source'<>'unverified' THEN RAISE EXCEPTION 'Fonte legada inventada'; END IF;
 IF public.get_character_ritual_situational(g,'arma-atroz')->'canReview'<>'true'::jsonb OR public.get_character_ritual_situational(l,'amaldicoar-arma-sangue')->'canReview'<>'true'::jsonb THEN RAISE EXCEPTION 'Mestre v1/v2 bloqueado'; END IF;
 BEGIN PERFORM public.confirm_character_ritual_knowledge(gen_random_uuid(),l,'amaldicoar-arma-sangue','{"knownBeforeBlade":true,"note":"Fonte conferida pelo mestre"}'); RAISE EXCEPTION 'Aceitou fonte ausente'; EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
 BEGIN PERFORM public.confirm_character_ritual_knowledge(gen_random_uuid(),g,'perturbacao','{"source":"memorized","knownBeforeBlade":true,"note":"Fonte conferida pelo mestre"}'); RAISE EXCEPTION 'Liberou lâmina sem trilha'; EXCEPTION WHEN SQLSTATE '55003' THEN NULL; END;
 PERFORM public.confirm_character_ritual_knowledge(gen_random_uuid(),g,'perturbacao','{"source":"memorized","knownBeforeBlade":false,"note":"Fonte histórica conferida pelo mestre"}');
 IF public.get_character_ritual_situational(g,'perturbacao')->>'source'<>'memorized' THEN RAISE EXCEPTION 'Conferência não desbloqueou fonte'; END IF;
 PERFORM public.confirm_character_ritual_knowledge(gen_random_uuid(),l,'amaldicoar-arma-sangue','{"source":"memorized","knownBeforeBlade":false,"note":"Aprendeu junto com a trilha"}');
 IF public.get_character_ritual_situational(l,'amaldicoar-arma-sangue')->'bladeEligible'<>'false'::jsonb THEN RAISE EXCEPTION 'Negativa liberou movimento'; END IF;
 review:='{"source":"memorized","knownBeforeBlade":true,"note":"Ficha anterior conferida pelo mestre"}';
 event:=public.confirm_character_ritual_knowledge(gen_random_uuid(),l,'amaldicoar-arma-sangue',review);
 PERFORM public.confirm_character_ritual_knowledge(event.operation_id,l,'amaldicoar-arma-sangue',review);
 BEGIN PERFORM public.confirm_character_ritual_knowledge(event.operation_id,l,'amaldicoar-arma-sangue',review||'{"knownBeforeBlade":false}'); RAISE EXCEPTION 'Reutilizou operação'; EXCEPTION WHEN unique_violation THEN NULL; END;
 IF public.get_character_ritual_situational(l,'amaldicoar-arma-sangue')->'bladeEligible'<>'true'::jsonb OR (SELECT pe_current FROM public.characters WHERE id=l)<>50 OR (SELECT san_current FROM public.characters WHERE id=l)<>30 THEN RAISE EXCEPTION 'Conferência cobrou ou não liberou'; END IF;
END $$;
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000981',true);
DO $$
DECLARE l uuid:='00000000-0000-4000-8000-000000000992'; body jsonb; event public.character_activity_events;
BEGIN
 body:='{"ritualId":"amaldicoar-arma-sangue","ritualName":"Amaldiçoar Arma","ritualElement":"sangue","enhancements":[],"requirementsConfirmed":true,"expectedSan":30,"expectedSanMax":30,"paranormalCost":{"source":"system_roll","element":"sangue","test":{"attribute":1,"dicePenalty":0,"dice":[20],"bonuses":[{"name":"QA","value":20}],"bonus":20,"total":40}},"situational":{"bladeMovement":true,"costBeforeBlade":1}}';
 BEGIN PERFORM public.cast_character_ritual(gen_random_uuid(),l,50,1,body); RAISE EXCEPTION 'Omitiu adicional'; EXCEPTION WHEN SQLSTATE '55003' THEN NULL; END;
 BEGIN PERFORM public.cast_character_ritual(gen_random_uuid(),l,50,2,body||'{"situational":{"bladeMovement":"true","costBeforeBlade":1}}'); RAISE EXCEPTION 'Tipo adulterado'; EXCEPTION WHEN SQLSTATE '55003' THEN NULL; END;
 PERFORM public.begin_character_manual_turn(gen_random_uuid(),l,0);
 PERFORM public.confirm_temporary_resource(gen_random_uuid(),l,'pe','manual:qa-situational','QA temporário',2,false);
 event:=public.cast_character_ritual(gen_random_uuid(),l,50,2,body);
 IF event.payload->>'execution'<>'Movimento' OR event.payload->'bladeExtraPE'<>'1'::jsonb OR event.payload->'temporaryPEUsed'<>'2'::jsonb OR (public.get_character_pe_budget(l)->>'spent')::integer<>2 THEN RAISE EXCEPTION 'Custo de movimento não somou ao turno e temporários'; END IF;
 PERFORM public.cast_character_ritual(event.operation_id,l,50,2,body);
 IF (public.get_character_pe_budget(l)->>'spent')::integer<>2 THEN RAISE EXCEPTION 'Repetição duplicou orçamento'; END IF;
 BEGIN PERFORM public.cast_character_ritual(gen_random_uuid(),l,50,2,body); RAISE EXCEPTION 'Movimento ignorou limite PE'; EXCEPTION WHEN SQLSTATE '55002' THEN NULL; END;
 PERFORM public.pause_character_manual_turn(gen_random_uuid(),l,1);
 body:=body||'{"enhancements":["Discente"],"situational":{"bladeMovement":true,"costBeforeBlade":3}}';
 event:=public.cast_character_ritual(gen_random_uuid(),l,50,4,body);
 IF event.payload->'peCost'<>'4'::jsonb OR event.payload->>'execution'<>'Movimento' THEN RAISE EXCEPTION 'Adicional substituiu aprimoramento'; END IF;
 BEGIN PERFORM public.cast_character_ritual(gen_random_uuid(),l,46,2,body||'{"situational":{"bladeMovement":true,"costBeforeBlade":1}}'); RAISE EXCEPTION 'Discente ignorou custo mínimo'; EXCEPTION WHEN SQLSTATE '55003' THEN NULL; END;
 IF (SELECT pe_current FROM public.characters WHERE id=l)<>46 OR (SELECT san_current FROM public.characters WHERE id=l)<>30 THEN RAISE EXCEPTION 'Falha deixou débito'; END IF;
END $$;
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000983',true);
DO $$ BEGIN
 BEGIN PERFORM public.get_character_ritual_situational('00000000-0000-4000-8000-000000000991','arma-atroz'); RAISE EXCEPTION 'Estranho leu'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN PERFORM public.confirm_character_ritual_knowledge(gen_random_uuid(),'00000000-0000-4000-8000-000000000992','amaldicoar-arma-sangue','{"source":"memorized","knownBeforeBlade":true,"note":"Usuário sem vínculo"}'); RAISE EXCEPTION 'Estranho conferiu'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
SET LOCAL ROLE anon;
DO $$ BEGIN
 BEGIN PERFORM public.get_character_ritual_situational('00000000-0000-4000-8000-000000000991','arma-atroz'); RAISE EXCEPTION 'Anônimo leu'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
ROLLBACK;
SELECT 'passed' AS ritual_situational_contract;
