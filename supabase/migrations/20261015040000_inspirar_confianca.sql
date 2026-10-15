-- Livro Base v1.3 p.27: reação e 2 PE para um aliado em alcance curto
-- (médio no NEX 65%) repetir um teste recém realizado.
-- A mesa confirma a reação, o alcance e a oportunidade; o banco confirma
-- vínculo, último teste elegível, cobrança, dado e dois históricos juntos.
CREATE TABLE IF NOT EXISTS public.character_inspirar_rerolls (
  original_event_id uuid PRIMARY KEY REFERENCES public.character_activity_events(id) ON DELETE CASCADE,
  source_event_id uuid NOT NULL UNIQUE REFERENCES public.character_activity_events(id) ON DELETE CASCADE,
  reroll_event_id uuid NOT NULL UNIQUE REFERENCES public.character_activity_events(id) ON DELETE CASCADE
);
ALTER TABLE public.character_inspirar_rerolls ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.character_inspirar_rerolls FROM PUBLIC,anon,authenticated;

-- Lista apenas o último teste elegível de cada aliado da mesma campanha.
-- O cliente nunca recebe autorização para ler o histórico inteiro do aliado.
CREATE OR REPLACE FUNCTION public.get_character_inspirar_tests(p_character_id uuid)
RETURNS TABLE(target_id uuid,target_name text,event_id uuid,test_label text,test_type text,
 original_total integer,performed_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT target.id,target.name,roll.id,roll.payload->'entry'->>'label',
  roll.payload->'entry'->>'type',(roll.payload->'entry'->>'total')::integer,roll.created_at
 FROM public.get_character_estrategista_targets(p_character_id) target
 JOIN LATERAL (
  SELECT e.id,e.payload,e.created_at FROM public.character_activity_events e
  WHERE e.character_id=target.id AND e.category='roll' AND e.status='confirmed'
   AND e.payload->'entry'->>'type' IN ('skill','attack','resistance','initiative')
   AND jsonb_typeof(e.payload->'entry'->'results')='array'
   AND jsonb_array_length(e.payload->'entry'->'results') BETWEEN 1 AND 20
   AND (e.payload->'entry'->>'diceCount') ~ '^[0-9]{1,2}$'
   AND (e.payload->'entry'->>'bonus') ~ '^-?[0-9]{1,4}$'
   AND (e.payload->'entry'->>'total') ~ '^-?[0-9]{1,4}$'
   AND length(e.payload->'entry'->>'label') BETWEEN 1 AND 200
   AND NOT EXISTS(SELECT 1 FROM public.character_inspirar_rerolls r WHERE r.original_event_id=e.id)
  ORDER BY e.created_at DESC,e.id DESC LIMIT 1
 ) roll ON true
 WHERE public.can_manage_character_activity(p_character_id)
 ORDER BY target.name,target.id;
$$;
REVOKE ALL ON FUNCTION public.get_character_inspirar_tests(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_character_inspirar_tests(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.confirm_character_inspirar_confianca(p_operation_id uuid,p_character_id uuid,p_request jsonb)
RETURNS public.character_activity_events LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE ficha public.characters; original public.character_activity_events; receipt public.character_activity_events;
 budget jsonb; fingerprint text; v_target_id uuid; v_original_id uuid; reroll_id uuid:=gen_random_uuid();
 original_entry jsonb; new_entry jsonb; dice integer[]:=ARRAY[]::integer[]; count_dice integer;
 bonus integer; kept integer; total integer; threshold integer; target_dt integer;
 temporary_before integer; temporary_used integer; target_name text; die integer; situational_review boolean;
BEGIN
 IF p_operation_id IS NULL OR jsonb_typeof(p_request) IS DISTINCT FROM 'object'
  OR octet_length(p_request::text)>2048 OR p_request->'reactionConfirmed' IS DISTINCT FROM 'true'::jsonb
  OR p_request->'rangeConfirmed' IS DISTINCT FROM 'true'::jsonb
  OR p_request->'recentConfirmed' IS DISTINCT FROM 'true'::jsonb
  OR coalesce((p_request->>'targetId') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',true)
  OR coalesce((p_request->>'originalEventId') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',true) THEN
  RAISE EXCEPTION 'Confirme reação, alcance, teste recente e aliado.' USING ERRCODE='22023'; END IF;
 v_target_id:=(p_request->>'targetId')::uuid;
 v_original_id:=(p_request->>'originalEventId')::uuid;
 fingerprint:=md5(jsonb_build_array(p_character_id,p_request)::text);
 PERFORM pg_advisory_xact_lock(hashtextextended(p_operation_id::text,0));
 PERFORM public.lock_character_pe_turn(p_character_id);
 SELECT * INTO receipt FROM public.character_activity_events WHERE operation_id=p_operation_id;
 IF FOUND THEN
  IF receipt.author_id<>auth.uid() OR receipt.request_hash<>fingerprint THEN
   RAISE EXCEPTION 'Operação reutilizada.' USING ERRCODE='23505'; END IF;
  RETURN receipt;
 END IF;
 SELECT * INTO ficha FROM public.characters WHERE id=p_character_id FOR UPDATE;
 IF NOT FOUND OR lower(ficha.class) IS DISTINCT FROM 'combatente'
  OR public.creation_identifier(ficha.class_track) NOT IN ('comandante-campo','comandante-de-campo') OR ficha.nex<10 THEN
  RAISE EXCEPTION 'Inspirar Confiança indisponível nesta ficha.' USING ERRCODE='55004'; END IF;
 IF p_request->>'expectedPE' IS DISTINCT FROM ficha.pe_current::text
  OR p_request->>'expectedNex' IS DISTINCT FROM ficha.nex::text THEN
  RAISE EXCEPTION 'Ficha mudou. Atualize antes de confirmar.' USING ERRCODE='40001'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.get_character_estrategista_targets(p_character_id) t WHERE t.id=v_target_id) THEN
  RAISE EXCEPTION 'Aliado não está vinculado à mesma campanha.' USING ERRCODE='42501'; END IF;
 SELECT t.target_name INTO target_name FROM public.get_character_inspirar_tests(p_character_id) t
  WHERE t.target_id=v_target_id AND t.event_id=v_original_id;
 IF target_name IS NULL THEN
  RAISE EXCEPTION 'O teste do aliado mudou ou não é elegível. Atualize a seleção.' USING ERRCODE='40001'; END IF;
 SELECT * INTO original FROM public.character_activity_events WHERE id=v_original_id AND character_id=v_target_id FOR UPDATE;
 IF EXISTS(SELECT 1 FROM public.character_inspirar_rerolls WHERE original_event_id=v_original_id) THEN
  RAISE EXCEPTION 'Este teste já foi repetido com Inspirar Confiança.' USING ERRCODE='55004'; END IF;
 original_entry:=original.payload->'entry';
 count_dice:=(original_entry->>'diceCount')::integer;
 IF count_dice NOT BETWEEN 1 AND 20 OR count_dice<>jsonb_array_length(original_entry->'results')
  OR (original_entry->>'bonus') !~ '^-?[0-9]{1,4}$' THEN
  RAISE EXCEPTION 'Dados do teste original inválidos.' USING ERRCODE='22023'; END IF;
 bonus:=(original_entry->>'bonus')::integer;
 IF original_entry ? 'targetDT' AND (original_entry->>'targetDT') ~ '^[0-9]{1,4}$' THEN
  target_dt:=(original_entry->>'targetDT')::integer;
 END IF;
 threshold:=CASE WHEN (original_entry->>'criticalThreshold') ~ '^[0-9]{1,2}$'
  THEN (original_entry->>'criticalThreshold')::integer ELSE 20 END;
 IF threshold NOT BETWEEN 1 AND 20 THEN RAISE EXCEPTION 'Margem do teste inválida.' USING ERRCODE='22023'; END IF;
 budget:=public.get_character_pe_budget(p_character_id);
 IF p_request->>'expectedTurnKey' IS DISTINCT FROM budget->>'key' THEN
  RAISE EXCEPTION 'Turno mudou. Atualize antes de confirmar.' USING ERRCODE='40001'; END IF;
 SELECT coalesce(sum(remaining),0)::integer INTO temporary_before FROM public.character_temporary_resources
  WHERE character_id=p_character_id AND resource='pe';
 IF ficha.pe_current+temporary_before<2 THEN RAISE EXCEPTION 'PE insuficiente.' USING ERRCODE='22023'; END IF;
 -- A função de orçamento valida o limite do turno; qualquer erro desfaz débito e rolagem.
 FOR die IN 1..count_dice LOOP dice:=array_append(dice, floor(random()*20)::integer+1); END LOOP;
 SELECT CASE WHEN original_entry->>'isDisadvantage'='true' THEN min(value) ELSE max(value) END INTO kept
  FROM unnest(dice) value;
 total:=kept+bonus;
 situational_review:=original_entry->>'type'='attack' AND
  (original_entry ? 'concealmentResult' OR original_entry ? 'sneakAttackResult');
 new_entry:=jsonb_build_object('type',original_entry->>'type','label','Repetição: '||(original_entry->>'label'),
  'results',to_jsonb(dice),'diceCount',count_dice,'bestResult',kept,'bonus',bonus,'total',total,
  'criticalThreshold',threshold,'critical',kept>=threshold AND
    (target_dt IS NULL OR total>=target_dt),'criticalFail',kept=1,
  'isDisadvantage',coalesce((original_entry->>'isDisadvantage')::boolean,false),
  'skillBonus',coalesce((original_entry->>'skillBonus')::integer,bonus),
  'otherBonuses',coalesce((original_entry->>'otherBonuses')::integer,0))
  || CASE WHEN target_dt IS NOT NULL THEN jsonb_build_object('targetDT',target_dt) ELSE '{}'::jsonb END
  || CASE WHEN target_dt IS NOT NULL AND NOT situational_review
    THEN jsonb_build_object('success',total>=target_dt) ELSE '{}'::jsonb END;
 temporary_used:=public.consume_temporary_resource(p_character_id,'pe',2);
 UPDATE public.characters SET pe_current=pe_current-2+temporary_used WHERE id=p_character_id;
 INSERT INTO public.character_activity_events(id,operation_id,character_id,author_id,category,status,payload,request_hash,
   campaign_id,campaign_version)
 VALUES(reroll_id,reroll_id,v_target_id,auth.uid(),'roll','confirmed',
  jsonb_build_object('kind','inspirar_confianca_reroll','entry',new_entry,'originalEventId',v_original_id,
   'sourceCharacterId',p_character_id,'sourceName',ficha.name,'originalTotal',(original_entry->>'total')::integer,
   'requiresReview',situational_review,'peCost',0),fingerprint,
  original.campaign_id,original.campaign_version);
 INSERT INTO public.character_activity_events(id,operation_id,character_id,author_id,category,status,payload,request_hash)
 VALUES(p_operation_id,p_operation_id,p_character_id,auth.uid(),'application','confirmed',
  jsonb_build_object('kind','inspirar_confianca','targetId',v_target_id,'targetName',target_name,
   'originalEventId',v_original_id,'rerollEventId',reroll_id,'testLabel',original_entry->>'label',
   'originalTotal',(original_entry->>'total')::integer,'rerollTotal',total,'dice',to_jsonb(dice),
   'range',CASE WHEN ficha.nex>=65 THEN 'médio' ELSE 'curto' END,'reactionConfirmed',true,
   'peCost',2,'peBefore',ficha.pe_current,'peAfter',ficha.pe_current-2+temporary_used,
   'temporaryPEUsed',temporary_used,'requiresReview',situational_review),fingerprint)
 RETURNING * INTO receipt;
 INSERT INTO public.character_inspirar_rerolls(original_event_id,source_event_id,reroll_event_id)
 VALUES(v_original_id,receipt.id,reroll_id);
 RETURN public.record_ritual_pe_budget(receipt.id,budget,2,'ability',false);
END $$;
REVOKE ALL ON FUNCTION public.confirm_character_inspirar_confianca(uuid,uuid,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.confirm_character_inspirar_confianca(uuid,uuid,jsonb) TO authenticated;
