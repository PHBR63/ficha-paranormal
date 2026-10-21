-- Resolução de um ataque confirmado contra uma ficha vinculada à campanha v2.
-- Defesa, dano e reduções situacionais são declarações explícitas do mestre.
CREATE TABLE public.campaign_attack_target_resolutions_v2 (
 operation_id uuid PRIMARY KEY,
 campaign_id uuid NOT NULL REFERENCES public.campaigns_v2(id) ON DELETE CASCADE,
 attack_event_id uuid NOT NULL REFERENCES public.character_activity_events(id),
 target_character_id uuid NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
 author_id uuid NOT NULL REFERENCES auth.users(id),
 request_hash text NOT NULL,
 result jsonb NOT NULL CHECK (jsonb_typeof(result)='object'),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE (attack_event_id,target_character_id)
);
ALTER TABLE public.campaign_attack_target_resolutions_v2 ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.campaign_attack_target_resolutions_v2 FROM PUBLIC,anon,authenticated;

-- O recibo é devolvido em reenvios idênticos antes de conferir PV/rodada atuais.
-- A transação inteira reverte se alvo, defesa ou saldo divergir.
CREATE FUNCTION public.confirm_campaign_attack_target_v2(
 p_operation_id uuid,p_campaign_id uuid,p_attack_event_id uuid,p_target_character_id uuid,
 p_expected_hp integer,p_expected_scene integer,p_expected_round integer,p_resolution jsonb
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE previous public.campaign_attack_target_resolutions_v2;
 combat public.campaign_combat_state_v2; attack public.character_activity_events;
 target public.characters; special public.character_special_defenses_v2;
 fingerprint text; attacker_id uuid; attack_total integer; defense_total integer;
 gross integer; resisted integer; rd integer; final_damage integer;
 temporary_used integer; hp_after integer; damage_type text; immune boolean;
 concealment_failed boolean; hit boolean; special_id uuid;
 target_event_id uuid; attacker_event_id uuid; receipt jsonb; review_note text;
BEGIN
 IF auth.uid() IS NULL OR NOT public.is_campaign_master_v2(auth.uid(),p_campaign_id) THEN
  RAISE EXCEPTION 'Somente o mestre resolve ataques contra alvos.' USING ERRCODE='42501'; END IF;
 IF p_operation_id IS NULL OR p_campaign_id IS NULL OR p_attack_event_id IS NULL
  OR p_target_character_id IS NULL OR p_expected_hp IS NULL OR p_expected_hp<0
  OR p_expected_scene IS NULL OR p_expected_scene<1
  OR p_expected_round IS NULL OR p_expected_round<1
  OR p_resolution IS NULL OR jsonb_typeof(p_resolution)<>'object'
  OR octet_length(p_resolution::text)>4000 THEN
  RAISE EXCEPTION 'Resolução de ataque incompleta.' USING ERRCODE='22023'; END IF;
 IF p_resolution-ARRAY['defenseTotal','grossDamage','damageType','resistedDamage',
  'damageReduction','immuneDamage','specialDefenseEventId','reviewNote']<>'{}'::jsonb
  OR public.activity_json_integer(p_resolution->'defenseTotal',0,1000000) IS DISTINCT FROM true
  OR public.activity_json_integer(p_resolution->'grossDamage',0,1000000) IS DISTINCT FROM true
  OR public.activity_json_integer(p_resolution->'resistedDamage',0,1000000) IS DISTINCT FROM true
  OR public.activity_json_integer(p_resolution->'damageReduction',0,1000000) IS DISTINCT FROM true
  OR jsonb_typeof(p_resolution->'immuneDamage') IS DISTINCT FROM 'boolean'
  OR coalesce(lower(trim(p_resolution->>'damageType')),'') NOT IN
   ('balístico','corte','impacto','perfuração','fogo','frio','eletricidade',
    'químico','sangue','morte','conhecimento','energia',
    'balistico','perfuracao','elétrico','eletrico','quimico')
  OR (p_resolution ? 'specialDefenseEventId' AND p_resolution->'specialDefenseEventId'<>'null'::jsonb
   AND (jsonb_typeof(p_resolution->'specialDefenseEventId')<>'string'
    OR (p_resolution->>'specialDefenseEventId') !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'))
  OR (p_resolution ? 'reviewNote' AND jsonb_typeof(p_resolution->'reviewNote')<>'string')
  OR length(coalesce(p_resolution->>'reviewNote',''))>500 THEN
  RAISE EXCEPTION 'Dados declarados do ataque inválidos.' USING ERRCODE='22023'; END IF;
 gross:=(p_resolution->>'grossDamage')::integer;
 resisted:=(p_resolution->>'resistedDamage')::integer;
 IF resisted>gross THEN
  RAISE EXCEPTION 'Dano resistido maior que o dano rolado.' USING ERRCODE='22023'; END IF;
 fingerprint:=md5(jsonb_build_array('attack-target-v2',p_campaign_id,p_attack_event_id,
  p_target_character_id,p_expected_hp,p_expected_scene,p_expected_round,p_resolution)::text);
 PERFORM pg_advisory_xact_lock(hashtextextended(p_operation_id::text,0));
 SELECT * INTO previous FROM public.campaign_attack_target_resolutions_v2
  WHERE operation_id=p_operation_id;
 IF FOUND THEN
  IF previous.author_id<>auth.uid() OR previous.request_hash<>fingerprint THEN
   RAISE EXCEPTION 'Operação reutilizada com dados diferentes.' USING ERRCODE='23505'; END IF;
  RETURN previous.result;
 END IF;
 SELECT * INTO combat FROM public.campaign_combat_state_v2
  WHERE campaign_id=p_campaign_id FOR UPDATE;
 IF NOT FOUND OR combat.state->'active' IS DISTINCT FROM 'true'::jsonb
  OR combat.scene_number<>p_expected_scene
  OR (combat.state->>'round')::integer<>p_expected_round THEN
  RAISE EXCEPTION 'Cena ou rodada mudou. Atualize o combate.' USING ERRCODE='40001'; END IF;
 SELECT * INTO attack FROM public.character_activity_events WHERE id=p_attack_event_id;
 IF NOT FOUND OR attack.status<>'confirmed' OR attack.category<>'roll'
  OR attack.payload->>'kind'<>'combat_attack'
  OR attack.payload#>>'{attackTurn,campaignId}' IS DISTINCT FROM p_campaign_id::text
  OR attack.payload#>>'{peBudget,campaignId}' IS DISTINCT FROM p_campaign_id::text
  OR attack.payload#>>'{peBudget,scene}' IS DISTINCT FROM p_expected_scene::text
  OR attack.payload#>>'{peBudget,round}' IS DISTINCT FROM p_expected_round::text
  OR NOT EXISTS(SELECT 1 FROM public.character_combat_actions action
   WHERE action.operation_id=attack.id AND action.source='attack'
    AND action.turn_key='combat:'||(attack.payload#>>'{attackTurn,turnInstanceId}'))
  OR public.activity_json_integer(attack.payload#>'{entry,total}',-1000000,1000000)
   IS DISTINCT FROM true THEN
  RAISE EXCEPTION 'Ataque confirmado nesta rodada não encontrado.' USING ERRCODE='22023'; END IF;
 attacker_id:=attack.character_id;
 IF attacker_id=p_target_character_id THEN
  RAISE EXCEPTION 'Atacante e defensor devem ser fichas distintas.' USING ERRCODE='22023'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.campaign_members_v2 member
  JOIN public.characters ficha ON ficha.id=member.character_id AND ficha.user_id=member.user_id
  WHERE member.campaign_id=p_campaign_id AND ficha.id=attacker_id) THEN
  RAISE EXCEPTION 'Atacante não vinculado à campanha.' USING ERRCODE='42501'; END IF;
 SELECT c.* INTO target FROM public.characters c
  JOIN public.campaign_members_v2 member ON member.character_id=c.id AND member.user_id=c.user_id
  WHERE c.id=p_target_character_id AND member.campaign_id=p_campaign_id FOR UPDATE OF c;
 IF NOT FOUND THEN RAISE EXCEPTION 'Defensor não vinculado à campanha.' USING ERRCODE='42501'; END IF;
 IF target.hp_current<>p_expected_hp THEN
  RAISE EXCEPTION 'PV mudou. Atualize a ficha antes de resolver o ataque.' USING ERRCODE='40001'; END IF;
 IF EXISTS(SELECT 1 FROM public.campaign_attack_target_resolutions_v2
  WHERE attack_event_id=p_attack_event_id AND target_character_id=p_target_character_id) THEN
  RAISE EXCEPTION 'Este ataque já foi resolvido contra o alvo.' USING ERRCODE='23505'; END IF;
 IF p_resolution ? 'specialDefenseEventId'
  AND p_resolution->'specialDefenseEventId'<>'null'::jsonb THEN
  special_id:=(p_resolution->>'specialDefenseEventId')::uuid;
  SELECT * INTO special FROM public.character_special_defenses_v2
   WHERE operation_id=special_id AND campaign_id=p_campaign_id
    AND attack_event_id=p_attack_event_id AND character_id=p_target_character_id
    AND scene_number=p_expected_scene AND round_number=p_expected_round FOR UPDATE;
  IF NOT FOUND THEN
   RAISE EXCEPTION 'Defesa especial não corresponde ao ataque e alvo.' USING ERRCODE='22023'; END IF;
 END IF;
 IF EXISTS(SELECT 1 FROM public.character_special_defenses_v2 defense
  WHERE defense.attack_event_id=p_attack_event_id AND defense.character_id=p_target_character_id)
  AND special_id IS NULL THEN
  RAISE EXCEPTION 'Inclua a defesa especial já registrada.' USING ERRCODE='22023'; END IF;
 review_note:=trim(coalesce(p_resolution->>'reviewNote',''));
 IF (special_id IS NOT NULL OR resisted>0
   OR (p_resolution->>'damageReduction')::integer>0
   OR (p_resolution->>'immuneDamage')::boolean) AND review_note='' THEN
  RAISE EXCEPTION 'Explique defesa especial, resistência, RD ou imunidade declarada.'
   USING ERRCODE='22023'; END IF;
 defense_total:=(p_resolution->>'defenseTotal')::integer;
 attack_total:=(attack.payload#>>'{entry,total}')::integer;
 concealment_failed:=coalesce((attack.payload#>>'{concealmentResult,failed}')::boolean,false);
 -- O 20 natural personalizado não substitui a comparação com a Defesa.
 hit:=NOT concealment_failed AND attack_total>=defense_total;
 IF special_id IS NOT NULL AND special.defense_type='contra_ataque' AND hit THEN
  RAISE EXCEPTION 'Contra-ataque exige que o ataque tenha errado.' USING ERRCODE='22023'; END IF;
 damage_type:=trim(p_resolution->>'damageType');
 rd:=(p_resolution->>'damageReduction')::integer;
 immune:=(p_resolution->>'immuneDamage')::boolean;
 final_damage:=CASE WHEN hit AND NOT immune THEN greatest(0,gross-resisted-rd) ELSE 0 END;
 temporary_used:=public.consume_temporary_resource(p_target_character_id,'hp',final_damage,damage_type);
 hp_after:=greatest(0,target.hp_current-final_damage+temporary_used);
 UPDATE public.characters SET hp_current=hp_after WHERE id=p_target_character_id;
 target_event_id:=gen_random_uuid(); attacker_event_id:=gen_random_uuid();
 receipt:=jsonb_build_object('operationId',p_operation_id,'campaignId',p_campaign_id,
  'attackEventId',p_attack_event_id,'attackerId',attacker_id,'targetId',p_target_character_id,
  'attackTotal',attack_total,'defenseTotal',defense_total,'concealmentFailed',concealment_failed,
  'hit',hit,'grossDamage',gross,'damageType',damage_type,'declaredResistedDamage',resisted,
  'declaredDamageReduction',rd,'immuneDamage',immune,'finalDamage',final_damage,
  'temporaryHPUsed',temporary_used,'hpBefore',target.hp_current,'hpAfter',hp_after,
  'specialDefenseEventId',special_id,'specialDefenseType',special.defense_type,
  'counterattackPending',coalesce(special.defense_type='contra_ataque' AND NOT hit,false),
  'reviewNote',review_note,'targetEventId',target_event_id,'attackerEventId',attacker_event_id,
  'resolutionMode','master_declared','timingVerifiedByServer',false,
  'specialDefenseReview',CASE WHEN special_id IS NULL THEN null ELSE 'retrospective' END);
 INSERT INTO public.character_activity_events
  (id,operation_id,character_id,author_id,category,status,payload,request_hash,campaign_id,campaign_version)
 VALUES
  (target_event_id,target_event_id,p_target_character_id,auth.uid(),'application','confirmed',
   receipt||jsonb_build_object('kind','attack_target_received'),fingerprint,p_campaign_id,'v2'),
  (attacker_event_id,attacker_event_id,attacker_id,auth.uid(),'application','confirmed',
   receipt||jsonb_build_object('kind','attack_target_resolved'),fingerprint,p_campaign_id,'v2');
 IF special_id IS NOT NULL THEN
  -- A defesa antiga é apenas revisada pelo mestre: seu horário não prova
  -- declaração prévia ao dado. Nenhum efeito automático é confirmado aqui.
  UPDATE public.character_activity_events SET payload=payload||jsonb_build_object(
   'resolution',CASE WHEN special.defense_type='contra_ataque'
     THEN 'contra_ataque_pendente' ELSE 'revisao_retrospectiva_pelo_mestre' END,
   'effectApplied',false,'timingVerifiedByServer',false,
   'applicationMode','master_retrospective_review','resolvedByOperationId',p_operation_id)
  WHERE id=special_id;
 END IF;
 INSERT INTO public.campaign_attack_target_resolutions_v2
  (operation_id,campaign_id,attack_event_id,target_character_id,author_id,request_hash,result)
 VALUES(p_operation_id,p_campaign_id,p_attack_event_id,p_target_character_id,auth.uid(),fingerprint,receipt);
 RETURN receipt;
END $$;
REVOKE ALL ON FUNCTION public.confirm_campaign_attack_target_v2(uuid,uuid,uuid,uuid,integer,integer,integer,jsonb)
 FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.confirm_campaign_attack_target_v2(uuid,uuid,uuid,uuid,integer,integer,integer,jsonb)
 TO authenticated;
