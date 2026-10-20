-- Ensaio transacional: o bônus manual dura até o turno seguinte do médico,
-- mesmo quando a mesa muda para o tracker de combate. Nada fica salvo.
BEGIN;
INSERT INTO auth.users(id) VALUES
 ('a2200000-0000-4000-8000-000000000001'),
 ('a2200000-0000-4000-8000-000000000002'),
 ('a2200000-0000-4000-8000-000000000003');
INSERT INTO public.characters(id,user_id,name,origin,class,class_track,nex,intellect,
 hp_current,hp_max,pe_current,pe_max,san_current,san_max,skills,inventory,conditions)
VALUES
 ('a2200000-0000-4000-8000-000000000011','a2200000-0000-4000-8000-000000000002',
 'QA Médico','Agente de Saúde','Especialista','medico-campo',65,2,20,30,10,15,20,20,'{}','[]','[]'),
 ('a2200000-0000-4000-8000-000000000012','a2200000-0000-4000-8000-000000000003',
 'QA Aliado','Militar','Combatente',NULL,10,1,20,20,5,5,10,10,'{}','[]','[]');
INSERT INTO public.campaigns_v2(id,master_id,name)
VALUES('a2200000-0000-4000-8000-000000000020','a2200000-0000-4000-8000-000000000001','QA transição de turno');
INSERT INTO public.campaign_members_v2(campaign_id,user_id,character_id,role) VALUES
 ('a2200000-0000-4000-8000-000000000020','a2200000-0000-4000-8000-000000000002',
 'a2200000-0000-4000-8000-000000000011','player'),
 ('a2200000-0000-4000-8000-000000000020','a2200000-0000-4000-8000-000000000003',
 'a2200000-0000-4000-8000-000000000012','player');
INSERT INTO public.character_manual_turns(character_id,turn_number,active)
VALUES('a2200000-0000-4000-8000-000000000011',1,false);
INSERT INTO public.character_activity_events(id,operation_id,character_id,author_id,
 category,status,payload,request_hash)
VALUES('a2200000-0000-4000-8000-000000000030','a2200000-0000-4000-8000-000000000030',
 'a2200000-0000-4000-8000-000000000011','a2200000-0000-4000-8000-000000000002',
 'application','confirmed','{"kind":"paramedico"}'::jsonb,'qa-resgate-transition');
INSERT INTO public.character_resgate_defense_grants(operation_id,source_character_id,
 target_character_id,mode,manual_turn_number)
VALUES('a2200000-0000-4000-8000-000000000030',
 'a2200000-0000-4000-8000-000000000011',
 'a2200000-0000-4000-8000-000000000012','manual',1);

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','a2200000-0000-4000-8000-000000000001',true);
DO $$
DECLARE campaign uuid:='a2200000-0000-4000-8000-000000000020';
 doctor uuid:='a2200000-0000-4000-8000-000000000011';
 ally uuid:='a2200000-0000-4000-8000-000000000012';
 combat jsonb;
BEGIN
 IF (public.get_character_resgate_defense_status(doctor)->>'bonus')::integer<>5
  OR (public.get_character_resgate_defense_status(ally)->>'bonus')::integer<>5 THEN
  RAISE EXCEPTION 'Bônus manual inicial ausente.'; END IF;
 combat:=jsonb_build_object('active',true,'round',1,'currentTurnIndex',0,'combatants',
  jsonb_build_array(jsonb_build_object('id',ally,'name','Aliado','initiative',20),
   jsonb_build_object('id',doctor,'name','Médico','initiative',10)));
 PERFORM public.save_campaign_combat_v2(campaign,0,combat);
 IF (public.get_character_resgate_defense_status(ally)->>'bonus')::integer<>5 THEN
  RAISE EXCEPTION 'Bônus expirou ao iniciar combate antes do turno médico.'; END IF;
 PERFORM public.save_campaign_combat_v2(campaign,1,combat||'{"currentTurnIndex":1}'::jsonb);
 IF (public.get_character_resgate_defense_status(doctor)->>'bonus')::integer<>0
  OR (public.get_character_resgate_defense_status(ally)->>'bonus')::integer<>0 THEN
  RAISE EXCEPTION 'Bônus manual permaneceu após início do turno médico.'; END IF;
 -- Uma atualização cosmética não cria novo turno nem recibo.
 PERFORM public.save_campaign_combat_v2(campaign,2,combat||'{"currentTurnIndex":1}'::jsonb);
 IF (public.get_character_resgate_defense_status(ally)->>'bonus')::integer<>0 THEN
  RAISE EXCEPTION 'Atualização sem troca de turno ressuscitou o bônus.'; END IF;
 PERFORM public.save_campaign_combat_v2(campaign,3,combat||'{"active":false}'::jsonb);
 IF (public.get_character_resgate_defense_status(ally)->>'bonus')::integer<>0 THEN
  RAISE EXCEPTION 'Encerrar combate ressuscitou bônus expirado.'; END IF;
 RAISE NOTICE 'PASS: transição manual/combat, próximo turno, identidade, encerramento e sem duplicação';
END $$;
RESET ROLE;
DO $$
BEGIN
 IF (SELECT count(*) FROM public.character_resgate_defense_grants
  WHERE source_character_id='a2200000-0000-4000-8000-000000000011')<>1
  OR (SELECT count(*) FROM public.character_combat_turn_starts
   WHERE character_id='a2200000-0000-4000-8000-000000000011')<>1 THEN
  RAISE EXCEPTION 'Troca de turno duplicou concessão ou marcador.'; END IF;
END $$;
ROLLBACK;
