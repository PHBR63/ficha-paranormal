-- Controles explícitos: nenhuma rodada é criada por relógio, refresh ou reconexão.
CREATE FUNCTION public.confirm_character_explosive_control(p_operation_id uuid,p_character_id uuid,p_request jsonb)
RETURNS public.character_activity_events LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE e public.character_activity_events; receipt public.character_activity_events; fingerprint text; action text:=p_request->>'action';
 target uuid; c public.characters; row public.fragmentation_target_resolutions; rounds integer; dice jsonb:='[]'; die integer; total integer:=0; result_payload jsonb;
BEGIN
 IF p_operation_id IS NULL OR p_request->'requirementsConfirmed' IS DISTINCT FROM 'true'::jsonb OR action NOT IN ('detonate','advance','leave','extinguish') OR action IS NULL THEN
 RAISE EXCEPTION 'Confirme a ação e seus requisitos.' USING ERRCODE='22023'; END IF;
 IF action='extinguish' THEN
  target:=(p_request->>'targetId')::uuid;
  IF NOT ((target=p_character_id AND public.can_manage_character_activity(target)) OR public.is_fragmentation_master(p_character_id,target)) THEN
   RAISE EXCEPTION 'Alvo não autorizado.' USING ERRCODE='42501'; END IF;
  IF p_request->>'method' IS NULL OR p_request->>'method' NOT IN ('standard','water') THEN RAISE EXCEPTION 'Confirme ação padrão ou imersão em água.' USING ERRCODE='22023'; END IF;
 ELSIF action='detonate' THEN
  IF NOT public.can_manage_character_activity(p_character_id) THEN RAISE EXCEPTION 'Mina não autorizada.' USING ERRCODE='42501'; END IF;
 ELSE
  IF NOT public.is_fragmentation_master(p_character_id) THEN RAISE EXCEPTION 'Somente o mestre confirma a duração e a área.' USING ERRCODE='42501'; END IF;
 END IF;
 fingerprint:=md5(jsonb_build_array(p_character_id,p_request)::text);
 PERFORM pg_advisory_xact_lock(hashtextextended(p_operation_id::text,0));
 SELECT * INTO receipt FROM public.character_activity_events WHERE operation_id=p_operation_id;
 IF FOUND THEN IF receipt.author_id<>auth.uid() OR receipt.request_hash<>fingerprint THEN RAISE EXCEPTION 'Operação reutilizada.' USING ERRCODE='23505'; END IF; RETURN receipt; END IF;
 IF action='extinguish' THEN
  SELECT * INTO c FROM public.characters WHERE id=target FOR UPDATE;
  IF p_request->'expectedConditions' IS DISTINCT FROM c.conditions THEN RAISE EXCEPTION 'Condições mudaram. Atualize.' USING ERRCODE='40001'; END IF;
  IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(c.conditions) x WHERE lower(replace(coalesce(x->>'id',x #>> '{}'),'_','-')) IN ('em-chamas','em chamas')) THEN
   RAISE EXCEPTION 'O alvo não está em chamas.' USING ERRCODE='55004'; END IF;
  UPDATE public.characters SET conditions=public.remove_explosive_conditions(c.conditions,NULL,true) WHERE id=target;
  UPDATE public.fragmentation_target_resolutions SET active=false WHERE target_id=target AND effect_conditions @> ARRAY['em_chamas'];
  result_payload:=jsonb_build_object('kind','explosive_control','action',action,'targetName',c.name,'method',p_request->>'method','conditionsRemoved',ARRAY['em_chamas']);
 ELSE
  SELECT * INTO e FROM public.character_activity_events WHERE id=(p_request->>'explosionId')::uuid AND character_id=p_character_id
  AND payload->>'kind'='explosive_event' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Explosivo ausente.' USING ERRCODE='55004'; END IF;
  IF action='detonate' THEN
   IF e.payload->>'explosiveType'<>'mine' OR e.payload->>'stage'<>'installed' THEN RAISE EXCEPTION 'Mina falhou ou já foi detonada.' USING ERRCODE='55004'; END IF;
   FOR i IN 1..12 LOOP die:=floor(random()*6)::integer+1; dice:=dice||to_jsonb(die); total:=total+die; END LOOP;
   UPDATE public.character_activity_events SET payload=payload||jsonb_build_object('stage','active','shape','cone','detonated',true,
    'result',jsonb_build_object('label','Mina Antipessoal','dice',dice,'total',total,'damageType','Perfuração')) WHERE id=e.id;
   result_payload:=jsonb_build_object('kind','explosive_control','action',action,'explosionId',e.id,'dice',dice,'total',total,'consumed',0,'rangeDeclared','longo','actionCost','padrão');
  ELSIF action='advance' THEN
   IF e.payload->>'explosiveType' NOT IN ('smoke','stun') OR e.payload->>'stage'<>'active' OR (e.payload->>'remainingRounds')::integer<=0 THEN
    RAISE EXCEPTION 'Área já encerrada ou sem duração em rodadas.' USING ERRCODE='55004'; END IF;
   IF p_request->'expectedRounds' IS DISTINCT FROM e.payload->'remainingRounds' THEN RAISE EXCEPTION 'A duração mudou. Atualize.' USING ERRCODE='40001'; END IF;
   rounds:=(e.payload->>'remainingRounds')::integer-1;
   IF rounds=0 THEN
    FOR row IN SELECT * FROM public.fragmentation_target_resolutions WHERE explosion_id=e.id AND active ORDER BY target_id FOR UPDATE LOOP
     SELECT * INTO c FROM public.characters WHERE id=row.target_id FOR UPDATE;
     UPDATE public.characters SET conditions=public.remove_explosive_conditions(c.conditions,e.id) WHERE id=c.id;
     IF c.id<>p_character_id THEN
      INSERT INTO public.character_activity_events(id,operation_id,character_id,author_id,category,status,payload,request_hash)
      VALUES(gen_random_uuid(),gen_random_uuid(),c.id,auth.uid(),'application','confirmed',jsonb_build_object('kind','explosive_control','action','expired','explosionId',e.id,'ended',true,'targetName',c.name),fingerprint);
     END IF;
    END LOOP;
    UPDATE public.fragmentation_target_resolutions SET active=false WHERE explosion_id=e.id;
   END IF;
   UPDATE public.character_activity_events SET payload=payload||jsonb_build_object('remainingRounds',rounds,'stage',CASE WHEN rounds=0 THEN 'ended' ELSE 'active' END) WHERE id=e.id;
   result_payload:=jsonb_build_object('kind','explosive_control','action',action,'explosionId',e.id,'remainingRounds',rounds,'ended',rounds=0);
  ELSE
   target:=(p_request->>'targetId')::uuid;
   IF NOT public.is_fragmentation_master(p_character_id,target) OR e.payload->>'explosiveType'<>'smoke' THEN RAISE EXCEPTION 'Área/alvo não autorizado.' USING ERRCODE='42501'; END IF;
   SELECT * INTO row FROM public.fragmentation_target_resolutions WHERE explosion_id=e.id AND target_id=target FOR UPDATE;
   IF NOT FOUND OR NOT row.active THEN RAISE EXCEPTION 'Alvo já saiu ou não tem efeito desta área.' USING ERRCODE='55004'; END IF;
   SELECT * INTO c FROM public.characters WHERE id=target FOR UPDATE;
   IF p_request->'expectedConditions' IS DISTINCT FROM c.conditions THEN RAISE EXCEPTION 'Condições mudaram. Atualize.' USING ERRCODE='40001'; END IF;
   UPDATE public.characters SET conditions=public.remove_explosive_conditions(c.conditions,e.id) WHERE id=target;
   UPDATE public.fragmentation_target_resolutions SET active=false WHERE explosion_id=e.id AND target_id=target;
   result_payload:=jsonb_build_object('kind','explosive_control','action',action,'explosionId',e.id,'targetName',c.name,'ended',true);
  END IF;
 END IF;
 INSERT INTO public.character_activity_events(id,operation_id,character_id,author_id,category,status,payload,request_hash)
 VALUES(p_operation_id,p_operation_id,p_character_id,auth.uid(),'application','confirmed',result_payload,fingerprint) RETURNING * INTO receipt;
 -- A origem tem o recibo; alvos diferentes também recebem o encerramento em seu histórico.
 IF action IN ('leave','extinguish') AND target<>p_character_id THEN
  INSERT INTO public.character_activity_events(id,operation_id,character_id,author_id,category,status,payload,request_hash)
  VALUES(gen_random_uuid(),gen_random_uuid(),target,auth.uid(),'application','confirmed',result_payload,fingerprint);
 END IF;
 RETURN receipt;
END $$;
REVOKE ALL ON FUNCTION public.confirm_character_explosive_control(uuid,uuid,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.confirm_character_explosive_control(uuid,uuid,jsonb) TO authenticated;
