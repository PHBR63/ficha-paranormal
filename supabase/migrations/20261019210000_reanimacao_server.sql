-- Reanimação: Livro Base v1.3, p. 31. O retorno com 1 PV é decisão
-- explícita desta mesa; o livro não especifica um número de PV.
-- A campanha v2 fornece uma identidade de cena verificável. Campanhas v1
-- permanecem em resolução manual até possuírem esse controle no servidor.
CREATE TABLE public.character_reanimation_deaths (
  id uuid PRIMARY KEY REFERENCES public.character_activity_events(id) ON DELETE CASCADE,
  campaign_id uuid NOT NULL REFERENCES public.campaigns_v2(id) ON DELETE CASCADE,
  scene_number integer NOT NULL CHECK (scene_number > 0),
  target_character_id uuid NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  cause text NOT NULL CHECK (cause IN ('ordinary','massive_damage')),
  confirmed_by uuid NOT NULL REFERENCES auth.users(id),
  revived_by_operation_id uuid REFERENCES public.character_activity_events(id),
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE UNIQUE INDEX character_reanimation_one_open_death
  ON public.character_reanimation_deaths(target_character_id) WHERE resolved_at IS NULL;
CREATE INDEX character_reanimation_scene
  ON public.character_reanimation_deaths(campaign_id,scene_number,target_character_id);
ALTER TABLE public.character_reanimation_deaths ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.character_reanimation_deaths FROM PUBLIC,anon,authenticated;

-- Cura posterior ou encerramento da cena invalida a confirmação de morte.
-- Isso impede reaproveitar uma morte antiga após o alvo voltar a zero PV.
CREATE FUNCTION public.expire_character_reanimation_death()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF TG_TABLE_NAME='characters' THEN
  IF OLD.hp_current=0 AND NEW.hp_current>0 THEN
   UPDATE public.character_reanimation_deaths SET resolved_at=clock_timestamp()
   WHERE target_character_id=NEW.id AND resolved_at IS NULL;
  END IF;
 ELSE
  IF OLD.scene_number IS DISTINCT FROM NEW.scene_number THEN
   UPDATE public.character_reanimation_deaths SET resolved_at=clock_timestamp()
   WHERE campaign_id=NEW.campaign_id AND resolved_at IS NULL;
  END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER close_reanimation_death_on_heal AFTER UPDATE OF hp_current ON public.characters
 FOR EACH ROW EXECUTE FUNCTION public.expire_character_reanimation_death();
CREATE TRIGGER close_reanimation_death_on_scene AFTER UPDATE OF scene_number ON public.campaign_combat_state_v2
 FOR EACH ROW EXECUTE FUNCTION public.expire_character_reanimation_death();
REVOKE ALL ON FUNCTION public.expire_character_reanimation_death() FROM PUBLIC,anon,authenticated;

CREATE TABLE public.character_reanimation_uses (
  source_character_id uuid NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  campaign_id uuid NOT NULL REFERENCES public.campaigns_v2(id) ON DELETE CASCADE,
  scene_number integer NOT NULL CHECK (scene_number > 0),
  operation_id uuid NOT NULL UNIQUE REFERENCES public.character_activity_events(id) ON DELETE CASCADE,
  PRIMARY KEY(source_character_id,campaign_id,scene_number)
);
ALTER TABLE public.character_reanimation_uses ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.character_reanimation_uses FROM PUBLIC,anon,authenticated;

-- Lista apenas campanhas com vínculo legítimo da ficha e alvos da mesma mesa.
-- A confirmação repete todas as verificações sob bloqueio de linha.
CREATE FUNCTION public.get_character_reanimacao_options(p_character_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE source public.characters; medical jsonb; campaigns jsonb;
BEGIN
 IF NOT public.can_manage_character_activity(p_character_id) THEN
  RAISE EXCEPTION 'Ficha não autorizada.' USING ERRCODE='42501'; END IF;
 SELECT * INTO source FROM public.characters WHERE id=p_character_id;
 medical:=public.get_character_paramedico_options(p_character_id);
 SELECT coalesce(jsonb_agg(jsonb_build_object(
   'id',campaign.id,'name',campaign.name,'sceneNumber',combat.scene_number,
   'canConfirmDeath',public.is_campaign_master_v2(auth.uid(),campaign.id),
   'usedInScene',EXISTS(SELECT 1 FROM public.character_reanimation_uses used
     WHERE used.source_character_id=p_character_id AND used.campaign_id=campaign.id
       AND used.scene_number=combat.scene_number),
   'targets',coalesce((SELECT jsonb_agg(jsonb_build_object(
     'id',target.id,'name',target.name,'currentHp',target.hp_current,'maxHp',target.hp_max,
     'deathId',death.id,'deathCause',death.cause) ORDER BY target.name,target.id)
     FROM public.campaign_members_v2 linked
     JOIN public.characters target ON target.id=linked.character_id AND target.user_id=linked.user_id
     LEFT JOIN public.character_reanimation_deaths death ON death.target_character_id=target.id
       AND death.campaign_id=campaign.id AND death.scene_number=combat.scene_number
       AND death.resolved_at IS NULL
     WHERE linked.campaign_id=campaign.id AND target.id<>p_character_id),'[]'::jsonb)
  ) ORDER BY campaign.name,campaign.id),'[]'::jsonb) INTO campaigns
 FROM public.campaign_members_v2 member
 JOIN public.campaigns_v2 campaign ON campaign.id=member.campaign_id
 JOIN public.characters owner ON owner.id=member.character_id AND owner.user_id=member.user_id
 LEFT JOIN public.campaign_combat_state_v2 combat ON combat.campaign_id=campaign.id
 WHERE member.character_id=p_character_id;
 RETURN jsonb_build_object('eligible',lower(source.class)='especialista' AND source.nex>=99
   AND public.creation_identifier(source.class_track) IN ('medico-de-campo','medico-campo'),
  'trained',medical->'trained','medicalKit',medical->'medicalKit','campaigns',campaigns);
END $$;
REVOKE ALL ON FUNCTION public.get_character_reanimacao_options(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_character_reanimacao_options(uuid) TO authenticated;

-- O mestre registra a morte e sua causa na cena atual. Zero PV isolado não
-- autoriza Reanimação; a confirmação fica visível nas duas fichas.
CREATE FUNCTION public.confirm_character_reanimacao_death(p_operation_id uuid,p_character_id uuid,p_request jsonb)
RETURNS public.character_activity_events LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE source public.characters; target public.characters; combat public.campaign_combat_state_v2;
 receipt public.character_activity_events; fingerprint text; campaign_id uuid; target_id uuid;
 target_event_id uuid;
BEGIN
 IF p_operation_id IS NULL OR jsonb_typeof(p_request) IS DISTINCT FROM 'object'
  OR octet_length(p_request::text)>2048 OR p_request->'deathConfirmed' IS DISTINCT FROM 'true'::jsonb
  OR coalesce((p_request->>'campaignId') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',true)
  OR coalesce((p_request->>'targetId') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',true)
  OR coalesce(p_request->>'cause','') NOT IN ('ordinary','massive_damage')
  OR coalesce((p_request->>'expectedScene') !~ '^[1-9][0-9]{0,8}$',true)
  OR p_request->'expectedTargetHp' IS DISTINCT FROM '0'::jsonb THEN
  RAISE EXCEPTION 'Confirme a morte, sua causa e a cena atual.' USING ERRCODE='22023'; END IF;
 campaign_id:=(p_request->>'campaignId')::uuid;
 target_id:=(p_request->>'targetId')::uuid;
 fingerprint:=md5(jsonb_build_array('reanimacao-death',p_character_id,p_request)::text);
 PERFORM pg_advisory_xact_lock(hashtextextended(p_operation_id::text,0));
 SELECT * INTO receipt FROM public.character_activity_events WHERE operation_id=p_operation_id;
 IF FOUND THEN
  IF receipt.author_id<>auth.uid() OR receipt.request_hash<>fingerprint THEN
   RAISE EXCEPTION 'Operação reutilizada.' USING ERRCODE='23505'; END IF;
  RETURN receipt;
 END IF;
 IF NOT public.is_campaign_master_v2(auth.uid(),campaign_id)
  OR NOT public.can_manage_character_activity(p_character_id) THEN
  RAISE EXCEPTION 'Somente o mestre da campanha confirma a morte.' USING ERRCODE='42501'; END IF;
 SELECT * INTO combat FROM public.campaign_combat_state_v2
  WHERE campaign_combat_state_v2.campaign_id=(p_request->>'campaignId')::uuid FOR UPDATE;
 IF NOT FOUND OR combat.scene_number::text IS DISTINCT FROM p_request->>'expectedScene' THEN
  RAISE EXCEPTION 'Cena mudou ou não possui controle no servidor.' USING ERRCODE='40001'; END IF;
 PERFORM id FROM public.characters WHERE id IN (p_character_id,target_id) ORDER BY id FOR UPDATE;
 SELECT * INTO source FROM public.characters WHERE id=p_character_id;
 SELECT * INTO target FROM public.characters WHERE id=target_id;
 IF NOT FOUND OR source.id=target.id OR target.hp_current<>0 OR target.hp_max<1 THEN
  RAISE EXCEPTION 'A morte exige outro aliado com zero PV.' USING ERRCODE='55004'; END IF;
 IF lower(source.class)<>'especialista' OR source.nex<99
  OR public.creation_identifier(source.class_track) NOT IN ('medico-de-campo','medico-campo') THEN
  RAISE EXCEPTION 'Confirmação exige ficha de Médico de Campo NEX 99%%.' USING ERRCODE='55004'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.campaign_members_v2 member JOIN public.characters owner
   ON owner.id=member.character_id AND owner.user_id=member.user_id
   WHERE member.campaign_id=(p_request->>'campaignId')::uuid AND member.character_id=p_character_id)
  OR NOT EXISTS(SELECT 1 FROM public.campaign_members_v2 member JOIN public.characters owner
   ON owner.id=member.character_id AND owner.user_id=member.user_id
   WHERE member.campaign_id=(p_request->>'campaignId')::uuid AND member.character_id=target_id) THEN
  RAISE EXCEPTION 'As fichas não pertencem à mesma campanha.' USING ERRCODE='42501'; END IF;
 IF EXISTS(SELECT 1 FROM public.character_reanimation_deaths death
   WHERE death.target_character_id=target_id AND death.resolved_at IS NULL) THEN
  RAISE EXCEPTION 'Este alvo já possui morte pendente; revise a cena anterior.' USING ERRCODE='55004'; END IF;
 target_event_id:=gen_random_uuid();
 INSERT INTO public.character_activity_events(id,operation_id,character_id,author_id,category,status,payload,request_hash,campaign_id,campaign_version)
 VALUES(target_event_id,target_event_id,target_id,auth.uid(),'application','confirmed',
  jsonb_build_object('kind','reanimacao_death_received','sceneNumber',combat.scene_number,
   'cause',p_request->>'cause','sourceCharacterId',p_character_id,'sourceOperationId',p_operation_id),
  fingerprint,campaign_id,'v2');
 INSERT INTO public.character_activity_events(id,operation_id,character_id,author_id,category,status,payload,request_hash,campaign_id,campaign_version)
 VALUES(p_operation_id,p_operation_id,p_character_id,auth.uid(),'application','confirmed',
  jsonb_build_object('kind','reanimacao_death','targetId',target_id,'targetName',target.name,
   'sceneNumber',combat.scene_number,'cause',p_request->>'cause','targetEventId',target_event_id,
   'peCost',0),fingerprint,campaign_id,'v2') RETURNING * INTO receipt;
 INSERT INTO public.character_reanimation_deaths(id,campaign_id,scene_number,target_character_id,cause,confirmed_by)
 VALUES(p_operation_id,campaign_id,combat.scene_number,target_id,p_request->>'cause',auth.uid());
 RETURN receipt;
END $$;
REVOKE ALL ON FUNCTION public.confirm_character_reanimacao_death(uuid,uuid,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.confirm_character_reanimacao_death(uuid,uuid,jsonb) TO authenticated;

-- Débito, 1 PV, condições derivadas, uso único e recibos formam uma operação.
CREATE FUNCTION public.confirm_character_reanimacao(p_operation_id uuid,p_character_id uuid,p_request jsonb)
RETURNS public.character_activity_events LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE source public.characters; target public.characters; combat public.campaign_combat_state_v2;
 death public.character_reanimation_deaths; receipt public.character_activity_events;
 campaign_id uuid; target_id uuid; death_id uuid; fingerprint text; medical jsonb; budget jsonb;
 temporary_before integer; temporary_used integer; next_conditions jsonb; target_event_id uuid;
BEGIN
 IF NOT public.can_manage_character_activity(p_character_id) THEN
  RAISE EXCEPTION 'Ficha não autorizada.' USING ERRCODE='42501'; END IF;
 IF p_operation_id IS NULL OR jsonb_typeof(p_request) IS DISTINCT FROM 'object'
  OR octet_length(p_request::text)>2048 OR p_request->'completeActionConfirmed' IS DISTINCT FROM 'true'::jsonb
  OR coalesce((p_request->>'campaignId') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',true)
  OR coalesce((p_request->>'targetId') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',true)
  OR coalesce((p_request->>'deathId') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',true)
  OR coalesce((p_request->>'expectedPE') !~ '^[0-9]{1,6}$',true)
  OR coalesce((p_request->>'expectedNex') !~ '^[0-9]{1,2}$',true)
  OR coalesce((p_request->>'expectedScene') !~ '^[1-9][0-9]{0,8}$',true)
  OR p_request->'expectedTargetHp' IS DISTINCT FROM '0'::jsonb THEN
  RAISE EXCEPTION 'Confirme ação completa, alvo, morte e saldos.' USING ERRCODE='22023'; END IF;
 campaign_id:=(p_request->>'campaignId')::uuid;
 target_id:=(p_request->>'targetId')::uuid;
 death_id:=(p_request->>'deathId')::uuid;
 fingerprint:=md5(jsonb_build_array('reanimacao',p_character_id,p_request)::text);
 PERFORM pg_advisory_xact_lock(hashtextextended(p_operation_id::text,0));
 PERFORM public.lock_character_pe_turn(p_character_id);
 SELECT * INTO receipt FROM public.character_activity_events WHERE operation_id=p_operation_id;
 IF FOUND THEN
  IF receipt.author_id<>auth.uid() OR receipt.request_hash<>fingerprint THEN
   RAISE EXCEPTION 'Operação reutilizada.' USING ERRCODE='23505'; END IF;
  RETURN receipt;
 END IF;
 SELECT * INTO combat FROM public.campaign_combat_state_v2
  WHERE campaign_combat_state_v2.campaign_id=(p_request->>'campaignId')::uuid FOR UPDATE;
 IF NOT FOUND OR combat.scene_number::text IS DISTINCT FROM p_request->>'expectedScene' THEN
  RAISE EXCEPTION 'Cena mudou ou não possui controle no servidor.' USING ERRCODE='40001'; END IF;
 PERFORM id FROM public.characters WHERE id IN (p_character_id,target_id) ORDER BY id FOR UPDATE;
 SELECT * INTO source FROM public.characters WHERE id=p_character_id;
 SELECT * INTO target FROM public.characters WHERE id=target_id;
 IF NOT FOUND OR target_id=p_character_id OR target.hp_current<>0 OR target.hp_max<1 THEN
  RAISE EXCEPTION 'Alvo não está morto com zero PV.' USING ERRCODE='55004'; END IF;
 IF source.nex::text IS DISTINCT FROM p_request->>'expectedNex'
  OR source.pe_current::text IS DISTINCT FROM p_request->>'expectedPE' THEN
  RAISE EXCEPTION 'Ficha mudou. Atualize antes de confirmar.' USING ERRCODE='40001'; END IF;
 medical:=public.get_character_paramedico_options(p_character_id);
 IF lower(source.class)<>'especialista' OR source.nex<99
  OR public.creation_identifier(source.class_track) NOT IN ('medico-de-campo','medico-campo')
  OR medical->'trained' IS DISTINCT FROM 'true'::jsonb
  OR medical->'medicalKit' IS DISTINCT FROM 'true'::jsonb THEN
  RAISE EXCEPTION 'Reanimação requer Médico de Campo NEX 99%%, Medicina treinada e kit.' USING ERRCODE='55004'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.campaign_members_v2 member JOIN public.characters owner
   ON owner.id=member.character_id AND owner.user_id=member.user_id
   WHERE member.campaign_id=(p_request->>'campaignId')::uuid AND member.character_id=p_character_id)
  OR NOT EXISTS(SELECT 1 FROM public.campaign_members_v2 member JOIN public.characters owner
   ON owner.id=member.character_id AND owner.user_id=member.user_id
   WHERE member.campaign_id=(p_request->>'campaignId')::uuid AND member.character_id=target_id) THEN
  RAISE EXCEPTION 'As fichas não pertencem à mesma campanha.' USING ERRCODE='42501'; END IF;
 SELECT * INTO death FROM public.character_reanimation_deaths WHERE id=death_id FOR UPDATE;
 IF NOT FOUND OR death.target_character_id<>target_id OR death.campaign_id<>campaign_id
  OR death.scene_number<>combat.scene_number OR death.cause<>'ordinary'
  OR death.resolved_at IS NOT NULL THEN
  RAISE EXCEPTION 'Morte não elegível, já resolvida ou fora desta cena.' USING ERRCODE='55004'; END IF;
 IF EXISTS(SELECT 1 FROM public.character_reanimation_uses used
   WHERE used.source_character_id=p_character_id AND used.campaign_id=(p_request->>'campaignId')::uuid
    AND used.scene_number=combat.scene_number) THEN
  RAISE EXCEPTION 'Reanimação já usada nesta cena.' USING ERRCODE='55004'; END IF;
 budget:=public.get_character_pe_budget(p_character_id);
 IF p_request->>'expectedTurnKey' IS DISTINCT FROM budget->>'key' THEN
  RAISE EXCEPTION 'Turno mudou. Atualize antes de confirmar.' USING ERRCODE='40001'; END IF;
 IF budget->>'mode'='combat' AND budget->>'actorId' IS DISTINCT FROM p_character_id::text THEN
  RAISE EXCEPTION 'Aguarde o próprio turno para a ação completa.' USING ERRCODE='55004'; END IF;
 SELECT coalesce(sum(remaining),0)::integer INTO temporary_before FROM public.character_temporary_resources
  WHERE character_id=p_character_id AND resource='pe';
 IF source.pe_current+temporary_before<10 THEN
  RAISE EXCEPTION 'PE insuficiente.' USING ERRCODE='22023'; END IF;
 next_conditions:=public.reconcile_resource_conditions(target.conditions,target.hp_current,1,target.hp_max,
  target.san_current,target.san_current,target.san_max,0);
 SELECT coalesce(jsonb_agg(item ORDER BY ordinal),'[]'::jsonb) INTO next_conditions
 FROM jsonb_array_elements(next_conditions) WITH ORDINALITY entry(item,ordinal)
 WHERE public.creation_identifier(coalesce(item->>'id',item#>>'{}'))<>'morrendo';
 temporary_used:=public.consume_temporary_resource(p_character_id,'pe',10);
 UPDATE public.characters SET pe_current=pe_current-10+temporary_used WHERE id=p_character_id;
 UPDATE public.characters SET hp_current=1,conditions=next_conditions WHERE id=target_id;
 DELETE FROM public.character_active_conditions WHERE character_id=target_id
  AND public.creation_identifier(condition_id) IN ('morrendo','inconsciente');
 target_event_id:=gen_random_uuid();
 INSERT INTO public.character_activity_events(id,operation_id,character_id,author_id,category,status,payload,request_hash,campaign_id,campaign_version)
 VALUES(target_event_id,target_event_id,target_id,auth.uid(),'application','confirmed',
  jsonb_build_object('kind','reanimacao_received','sourceCharacterId',p_character_id,
   'sourceName',source.name,'hpBefore',target.hp_current,'hpAfter',1,
   'conditionsAfter',next_conditions,'sceneNumber',combat.scene_number,
   'sourceOperationId',p_operation_id),fingerprint,campaign_id,'v2');
 INSERT INTO public.character_activity_events(id,operation_id,character_id,author_id,category,status,payload,request_hash,campaign_id,campaign_version)
 VALUES(p_operation_id,p_operation_id,p_character_id,auth.uid(),'application','confirmed',
  jsonb_build_object('kind','reanimacao','targetId',target_id,'targetName',target.name,
   'deathId',death_id,'sceneNumber',combat.scene_number,'hpBefore',target.hp_current,
   'hpAfter',1,'conditionsAfter',next_conditions,'targetEventId',target_event_id,
   'peCost',10,'peBefore',source.pe_current,'peAfter',source.pe_current-10+temporary_used,
   'temporaryPEUsed',temporary_used,'completeActionConfirmed',true),fingerprint,
   campaign_id,'v2') RETURNING * INTO receipt;
 INSERT INTO public.character_reanimation_uses(source_character_id,campaign_id,scene_number,operation_id)
 VALUES(p_character_id,campaign_id,combat.scene_number,p_operation_id);
 UPDATE public.character_reanimation_deaths SET revived_by_operation_id=p_operation_id,
  resolved_at=coalesce(resolved_at,clock_timestamp()) WHERE id=death_id;
 RETURN public.record_ritual_pe_budget(receipt.id,budget,10,'ability',false);
END $$;
REVOKE ALL ON FUNCTION public.confirm_character_reanimacao(uuid,uuid,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.confirm_character_reanimacao(uuid,uuid,jsonb) TO authenticated;
