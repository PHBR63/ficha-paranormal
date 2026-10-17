-- Estrategista, Livro Base v1.3 p.27: a ação extra pertence ao próximo turno do aliado.
-- A revisão do mestre abaixo é uma proteção digital quando a iniciativa muda; não cria novo efeito nem PE.
ALTER TABLE public.character_estrategista_grants
 ADD COLUMN IF NOT EXISTS turn_snapshot jsonb,
 ADD COLUMN IF NOT EXISTS review_required boolean NOT NULL DEFAULT false,
 ADD COLUMN IF NOT EXISTS review_approved_at timestamptz,
 ADD COLUMN IF NOT EXISTS reviewed_by uuid,
 ADD COLUMN IF NOT EXISTS review_reason text;

-- Captura a posição do próximo turno quando ambos os personagens estão no combate v2.
CREATE OR REPLACE FUNCTION public.capture_estrategista_turn_snapshot()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE combat public.campaign_combat_state_v2; target_index integer; actor text; order_ids jsonb;
BEGIN
 SELECT s.* INTO combat FROM public.campaign_combat_state_v2 s
 JOIN public.campaign_members_v2 source ON source.campaign_id=s.campaign_id AND source.character_id=NEW.source_character_id
 JOIN public.campaign_members_v2 target ON target.campaign_id=s.campaign_id AND target.character_id=NEW.target_character_id
 WHERE s.state->'active'='true'::jsonb ORDER BY s.campaign_id LIMIT 1;
 IF NOT FOUND THEN RETURN NEW; END IF;
 actor:=combat.state->'combatants'->((combat.state->>'currentTurnIndex')::integer)->>'id';
 IF actor IS DISTINCT FROM NEW.source_character_id::text THEN
  RAISE EXCEPTION 'Estrategista exige o turno do comandante no combate ativo.' USING ERRCODE='55004'; END IF;
 SELECT ordinality::integer-1 INTO target_index FROM jsonb_array_elements(combat.state->'combatants') WITH ORDINALITY entry(value,ordinality)
 WHERE value->>'id'=NEW.target_character_id::text;
 -- Alvo presente na campanha, mas fora da iniciativa, continua sujeito à confirmação da mesa.
 IF target_index IS NULL THEN RETURN NEW; END IF;
 SELECT jsonb_agg(value->>'id' ORDER BY ordinality) INTO order_ids
 FROM jsonb_array_elements(combat.state->'combatants') WITH ORDINALITY entry(value,ordinality);
 NEW.turn_snapshot:=jsonb_build_object('campaignId',combat.campaign_id,'scene',combat.scene_number,
  'grantedRound',(combat.state->>'round')::integer,'grantedIndex',(combat.state->>'currentTurnIndex')::integer,
  'expectedRound',(combat.state->>'round')::integer + CASE WHEN target_index <= (combat.state->>'currentTurnIndex')::integer THEN 1 ELSE 0 END,
  'expectedIndex',target_index,'combatantIds',order_ids);
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS capture_estrategista_turn_snapshot ON public.character_estrategista_grants;
CREATE TRIGGER capture_estrategista_turn_snapshot BEFORE INSERT ON public.character_estrategista_grants
FOR EACH ROW EXECUTE FUNCTION public.capture_estrategista_turn_snapshot();

-- Reordenação, reinício e troca de cena invalidam a referência automática; preservam o benefício.
CREATE OR REPLACE FUNCTION public.flag_estrategista_turn_review()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE old_ids jsonb; new_ids jsonb; old_round integer; new_round integer; old_index integer; new_index integer;
BEGIN
 SELECT jsonb_agg(value->>'id' ORDER BY ordinality) INTO old_ids
 FROM jsonb_array_elements(coalesce(OLD.state->'combatants','[]'::jsonb)) WITH ORDINALITY entry(value,ordinality);
 SELECT jsonb_agg(value->>'id' ORDER BY ordinality) INTO new_ids
 FROM jsonb_array_elements(coalesce(NEW.state->'combatants','[]'::jsonb)) WITH ORDINALITY entry(value,ordinality);
 old_round:=coalesce((OLD.state->>'round')::integer,0); new_round:=coalesce((NEW.state->>'round')::integer,0);
 old_index:=coalesce((OLD.state->>'currentTurnIndex')::integer,0); new_index:=coalesce((NEW.state->>'currentTurnIndex')::integer,0);
 IF OLD.scene_number IS DISTINCT FROM NEW.scene_number OR OLD.state->'active' IS DISTINCT FROM NEW.state->'active'
  OR old_ids IS DISTINCT FROM new_ids OR new_round<old_round
  OR (new_round=old_round AND new_index<old_index) THEN
  UPDATE public.character_estrategista_grants SET review_required=true,review_approved_at=NULL,reviewed_by=NULL,
   review_reason='A iniciativa foi reiniciada, reordenada ou encerrada após a concessão.'
  WHERE status='pending' AND turn_snapshot->>'campaignId'=NEW.campaign_id::text;
 END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS flag_estrategista_turn_review ON public.campaign_combat_state_v2;
CREATE TRIGGER flag_estrategista_turn_review AFTER UPDATE OF state,scene_number ON public.campaign_combat_state_v2
FOR EACH ROW EXECUTE FUNCTION public.flag_estrategista_turn_review();

-- A lista expõe o bloqueio ao jogador e o controle somente ao mestre da campanha.
DROP FUNCTION IF EXISTS public.list_character_estrategista_grants(uuid);
CREATE FUNCTION public.list_character_estrategista_grants(p_character_id uuid)
RETURNS TABLE(operation_id uuid,source_name text,status text,granted_at timestamptz,
 turn_controlled boolean,review_required boolean,reviewed boolean,can_review boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT g.operation_id,c.name,g.status,g.granted_at,g.turn_snapshot IS NOT NULL,g.review_required,
  g.review_approved_at IS NOT NULL,
  EXISTS(SELECT 1 FROM public.campaigns_v2 cp WHERE cp.id=(g.turn_snapshot->>'campaignId')::uuid AND cp.master_id=auth.uid())
 FROM public.character_estrategista_grants g JOIN public.characters c ON c.id=g.source_character_id
 WHERE g.target_character_id=p_character_id AND g.status='pending'
 AND public.can_manage_character_activity(p_character_id)
 ORDER BY g.granted_at DESC LIMIT 20;
$$;
REVOKE ALL ON FUNCTION public.list_character_estrategista_grants(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.list_character_estrategista_grants(uuid) TO authenticated;

-- Só o mestre vinculado à concessão pode revisar a mudança de iniciativa.
CREATE FUNCTION public.review_character_estrategista_grant(p_operation_id uuid,p_character_id uuid,p_grant_operation_id uuid)
RETURNS public.character_activity_events LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE grant_row public.character_estrategista_grants; receipt public.character_activity_events; fingerprint text;
BEGIN
 IF p_operation_id IS NULL OR p_grant_operation_id IS NULL OR NOT public.can_manage_character_activity(p_character_id) THEN
  RAISE EXCEPTION 'Ficha não autorizada.' USING ERRCODE='42501'; END IF;
 fingerprint:=md5(jsonb_build_array(p_character_id,p_grant_operation_id,'turn_review')::text);
 PERFORM pg_advisory_xact_lock(hashtextextended(p_operation_id::text,0));
 SELECT * INTO receipt FROM public.character_activity_events WHERE operation_id=p_operation_id;
 IF FOUND THEN
  IF receipt.author_id<>auth.uid() OR receipt.request_hash<>fingerprint THEN RAISE EXCEPTION 'Operação reutilizada.' USING ERRCODE='23505'; END IF;
  RETURN receipt;
 END IF;
 SELECT * INTO grant_row FROM public.character_estrategista_grants
 WHERE operation_id=p_grant_operation_id AND target_character_id=p_character_id FOR UPDATE;
 IF NOT FOUND OR grant_row.status<>'pending' OR NOT grant_row.review_required OR grant_row.review_approved_at IS NOT NULL THEN
  RAISE EXCEPTION 'Não há revisão pendente para esta concessão.' USING ERRCODE='55004'; END IF;
 IF grant_row.turn_snapshot IS NULL OR NOT EXISTS(
  SELECT 1 FROM public.campaigns_v2 cp
  JOIN public.campaign_members_v2 source ON source.campaign_id=cp.id AND source.character_id=grant_row.source_character_id
  JOIN public.campaign_members_v2 target ON target.campaign_id=cp.id AND target.character_id=grant_row.target_character_id
  WHERE cp.id=(grant_row.turn_snapshot->>'campaignId')::uuid AND cp.master_id=auth.uid()) THEN
  RAISE EXCEPTION 'Somente o mestre da campanha pode revisar a concessão.' USING ERRCODE='42501'; END IF;
 UPDATE public.character_estrategista_grants SET reviewed_by=auth.uid(),review_approved_at=clock_timestamp()
 WHERE operation_id=p_grant_operation_id AND target_character_id=p_character_id;
 INSERT INTO public.character_activity_events(id,operation_id,character_id,author_id,category,status,payload,request_hash)
 VALUES(p_operation_id,p_operation_id,p_character_id,auth.uid(),'application','confirmed',
  jsonb_build_object('kind','estrategista_turn_review','grantOperationId',p_grant_operation_id,
   'effect','Mestre confirmou o próximo turno após mudança da iniciativa','peCost',0),fingerprint)
 RETURNING * INTO receipt;
 RETURN receipt;
END $$;
REVOKE ALL ON FUNCTION public.review_character_estrategista_grant(uuid,uuid,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.review_character_estrategista_grant(uuid,uuid,uuid) TO authenticated;

-- Uso único: turno controlado estável é conferido no servidor; mudança exige revisão já gravada.
CREATE OR REPLACE FUNCTION public.use_character_estrategista_grant(p_operation_id uuid,p_character_id uuid,p_grant_operation_id uuid,p_next_turn_confirmed boolean)
RETURNS public.character_activity_events LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE grant_row public.character_estrategista_grants; receipt public.character_activity_events; fingerprint text;
 combat public.campaign_combat_state_v2; current_ids jsonb; snapshot jsonb;
BEGIN
 IF p_operation_id IS NULL OR p_grant_operation_id IS NULL OR NOT public.can_manage_character_activity(p_character_id) THEN
  RAISE EXCEPTION 'Ficha não autorizada.' USING ERRCODE='42501'; END IF;
 IF p_next_turn_confirmed IS DISTINCT FROM true THEN
  RAISE EXCEPTION 'Confirme que este é o próximo turno do aliado.' USING ERRCODE='22023'; END IF;
 fingerprint:=md5(jsonb_build_array(p_character_id,p_grant_operation_id,'used')::text);
 PERFORM pg_advisory_xact_lock(hashtextextended(p_operation_id::text,0));
 SELECT * INTO receipt FROM public.character_activity_events WHERE operation_id=p_operation_id;
 IF FOUND THEN
  IF receipt.author_id<>auth.uid() OR receipt.request_hash<>fingerprint THEN RAISE EXCEPTION 'Operação reutilizada.' USING ERRCODE='23505'; END IF;
  RETURN receipt;
 END IF;
 -- Mesma ordem de bloqueios do tracker: combate antes da concessão.
 SELECT turn_snapshot INTO snapshot FROM public.character_estrategista_grants
 WHERE operation_id=p_grant_operation_id AND target_character_id=p_character_id;
 IF snapshot IS NOT NULL THEN
  SELECT * INTO combat FROM public.campaign_combat_state_v2
  WHERE campaign_id=(snapshot->>'campaignId')::uuid FOR UPDATE;
 END IF;
 SELECT * INTO grant_row FROM public.character_estrategista_grants
 WHERE operation_id=p_grant_operation_id AND target_character_id=p_character_id FOR UPDATE;
 IF NOT FOUND OR grant_row.status<>'pending' THEN RAISE EXCEPTION 'Ação adicional indisponível.' USING ERRCODE='55004'; END IF;
 snapshot:=grant_row.turn_snapshot;
 IF snapshot IS NOT NULL THEN
  IF grant_row.review_required THEN
   IF grant_row.review_approved_at IS NULL THEN
    RAISE EXCEPTION 'A iniciativa mudou. Aguarde confirmação do mestre.' USING ERRCODE='55004'; END IF;
  ELSE
   SELECT jsonb_agg(value->>'id' ORDER BY ordinality) INTO current_ids
   FROM jsonb_array_elements(coalesce(combat.state->'combatants','[]'::jsonb)) WITH ORDINALITY entry(value,ordinality);
   IF NOT FOUND OR combat.state->'active' IS DISTINCT FROM 'true'::jsonb
    OR combat.scene_number IS DISTINCT FROM (snapshot->>'scene')::integer
    OR current_ids IS DISTINCT FROM snapshot->'combatantIds'
    OR (combat.state->>'round')::integer IS DISTINCT FROM (snapshot->>'expectedRound')::integer
    OR (combat.state->>'currentTurnIndex')::integer IS DISTINCT FROM (snapshot->>'expectedIndex')::integer
    OR combat.state->'combatants'->((snapshot->>'expectedIndex')::integer)->>'id' IS DISTINCT FROM p_character_id::text THEN
    RAISE EXCEPTION 'A ação adicional só pode ser usada no próximo turno controlado do aliado.' USING ERRCODE='55004'; END IF;
  END IF;
 END IF;
 UPDATE public.character_estrategista_grants SET status='used',used_at=clock_timestamp()
 WHERE operation_id=p_grant_operation_id AND target_character_id=p_character_id;
 INSERT INTO public.character_activity_events(id,operation_id,character_id,author_id,category,status,payload,request_hash)
 VALUES(p_operation_id,p_operation_id,p_character_id,auth.uid(),'application','confirmed',
 jsonb_build_object('kind','estrategista_movement','grantOperationId',p_grant_operation_id,
 'effect','ação de movimento adicional utilizada','turnValidation',CASE WHEN grant_row.review_required THEN 'master_review' WHEN snapshot IS NOT NULL THEN 'combat_tracker' ELSE 'table_confirmed' END,
 'peCost',0),fingerprint) RETURNING * INTO receipt;
 RETURN receipt;
END $$;
REVOKE ALL ON FUNCTION public.use_character_estrategista_grant(uuid,uuid,uuid,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.use_character_estrategista_grant(uuid,uuid,uuid,boolean) TO authenticated;
