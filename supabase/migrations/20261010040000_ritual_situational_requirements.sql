-- Livro Base v1.3 p.35: fonte do grimório e conhecimento anterior de Lâmina Maldita.
-- Não modifica escolhas antigas: conferências são explícitas, autorizadas e auditáveis.
CREATE TABLE IF NOT EXISTS public.character_ritual_knowledge (
 character_id uuid NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
 ritual_id text NOT NULL,
 source text NOT NULL CHECK(source IN ('memorized','grimoire')),
 known_before_blade boolean NOT NULL DEFAULT false,
 reviewed_by uuid NOT NULL,
 review_event_id uuid NOT NULL REFERENCES public.character_activity_events(id),
 PRIMARY KEY(character_id,ritual_id)
);
ALTER TABLE public.character_ritual_knowledge ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.character_ritual_knowledge FROM PUBLIC,anon,authenticated;

-- Proveniência não pode ser reescrita pelo cliente para contornar o Grimório.
-- A criação validada é SECURITY DEFINER; conferências posteriores usam a RPC do mestre.
CREATE OR REPLACE FUNCTION public.guard_character_creation_provenance() RETURNS trigger
LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
BEGIN
 IF current_user IN ('authenticated','anon') AND
 ((TG_OP='INSERT' AND NEW.creation_data IS NOT NULL) OR
  (TG_OP='UPDATE' AND NEW.creation_data IS DISTINCT FROM OLD.creation_data)) THEN
  RAISE EXCEPTION 'Proveniência da criação protegida. Use a criação validada ou a conferência histórica do mestre.' USING ERRCODE='42501';
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.guard_character_creation_provenance() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS guard_character_creation_provenance ON public.characters;
CREATE TRIGGER guard_character_creation_provenance BEFORE INSERT OR UPDATE OF creation_data ON public.characters
FOR EACH ROW EXECUTE FUNCTION public.guard_character_creation_provenance();

CREATE OR REPLACE FUNCTION public.ritual_execution_catalog() RETURNS jsonb
LANGUAGE sql IMMUTABLE SET search_path=public AS $$ SELECT $executions${"amaldicoar-arma-conhecimento":"Padrão","compreensao-paranormal":"Padrão","enfeiticar":"Padrão","ouvir-os-sussurros":"Completa","perturbacao":"Padrão","tecer-ilusao":"Padrão","terceiro-olho":"Padrão","amaldicoar-arma-energia":"Padrão","amaldicoar-tecnologia":"Padrão","coincidencia-forcada":"Padrão","eletrocussao":"Padrão","embaralhar":"Padrão","luz":"Livre","polarizacao-caotica":"Padrão","cineraria":"Padrão","amaldicoar-arma-morte":"Padrão","cicatrizacao":"Padrão","consumir-manancial":"Padrão","decadencia":"Padrão","definhar":"Padrão","espirais-da-perdicao":"Padrão","nuvem-de-cinzas":"Padrão","amaldicoar-arma-sangue":"Padrão","arma-atroz":"Padrão","armadura-de-sangue":"Padrão","corpo-adaptado":"Padrão","distorcer-aparencia":"Padrão","fortalecimento-sensorial":"Padrão","odio-incontrolavel":"Padrão","aprimorar-fisico":"Padrão","descarnar":"Padrão","flagelo-de-sangue":"Padrão","hemofagia":"Padrão","transfusao-vital":"Padrão","aprimorar-mente":"Padrão","deteccao-de-ameacas":"Padrão","esconder-dos-olhos":"Livre","invadir-mente":"Padrão","localizacao":"Padrão","chamas-do-caos":"Padrão","contencao-fantasmagorica":"Padrão","dissonancia-acustica":"Padrão","sopro-do-caos":"Padrão","tela-de-ruido":"Padrão","protecao-contra-rituais":"Padrão","rejeitar-nevoa":"Padrão","desacelerar-impacto":"Reação","eco-espiral":"Padrão","miasma-entropico":"Padrão","paradoxo":"Padrão","velocidade-mortal":"Padrão","ferver-sangue":"Padrão","forma-monstruosa":"Padrão","purgatorio":"Padrão","vomitar-pestes":"Padrão","ancora-temporal":"Padrão","poeira-da-podridao":"Padrão","tentaculos-de-lodo":"Padrão","zerar-entropia":"Padrão","alterar-memoria":"Padrão","contato-paranormal":"Completa","mergulho-mental":"Padrão","videncia":"Completa","convocacao-instantanea":"Padrão","salto-fantasma":"Padrão","transfigurar-agua":"Padrão","transfigurar-terra":"Padrão","dissipar-ritual":"Padrão","capturar-o-coracao":"Padrão","involucro-de-carne":"Padrão","vinculo-de-sangue":"Padrão","convocar-o-algoz":"Padrão","distorcao-temporal":"Padrão","fim-inevitavel":"Completa","controle-mental":"Padrão","inexistir":"Padrão","possessao":"Padrão","alterar-destino":"Reação","deflagracao-de-energia":"Completa","teletransporte":"Padrão","canalizar-o-medo":"Padrão","conhecendo-o-medo":"Padrão","lamina-do-medo":"Padrão","medo-tangivel":"Padrão","presenca-do-medo":"Padrão"}$executions$::jsonb $$;
REVOKE ALL ON FUNCTION public.ritual_execution_catalog() FROM PUBLIC,anon,authenticated;

-- Somente o mestre de uma campanha legitimamente vinculada pode conferir a história da ficha.
CREATE OR REPLACE FUNCTION public.can_review_character_ritual(p_character_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT auth.uid() IS NOT NULL AND EXISTS(SELECT 1 FROM public.characters c WHERE c.id=p_character_id AND (
  EXISTS(SELECT 1 FROM public.campaign_members m JOIN public.campaigns cp ON cp.id=m.campaign_id
    WHERE m.character_id=c.id AND m.user_id=c.user_id AND cp.master_id=auth.uid())
  OR EXISTS(SELECT 1 FROM public.campaign_members_v2 m JOIN public.campaigns_v2 cp ON cp.id=m.campaign_id
    WHERE m.character_id=c.id AND m.user_id=c.user_id AND cp.master_id=auth.uid())
 ));
$$;
REVOKE ALL ON FUNCTION public.can_review_character_ritual(uuid) FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.get_character_ritual_situational(p_character_id uuid,p_ritual_id text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE c public.characters; review public.character_ritual_knowledge; source text:='memorized';
 grim boolean; blade boolean; items jsonb; extra jsonb; known boolean; execution text;
BEGIN
 IF NOT public.can_manage_character_activity(p_character_id) THEN RAISE EXCEPTION 'Ficha não autorizada.' USING ERRCODE='42501'; END IF;
 SELECT * INTO c FROM public.characters WHERE id=p_character_id;
 execution:=public.ritual_execution_catalog()->>p_ritual_id;
 -- Rituais personalizados legados preservam sua execução registrada; não ganham Lâmina Maldita.
 IF execution IS NULL THEN
  SELECT coalesce(item->>'execution','Conferir com a mesa') INTO execution FROM jsonb_array_elements(coalesce(c.rituals,'[]'::jsonb)) item WHERE jsonb_typeof(item)='object' AND item->>'id'=p_ritual_id LIMIT 1;
 END IF;
 -- Compatibilidade: a ausência no catálogo não concede benefícios deste lote.
 execution:=coalesce(execution,'Conferir com a mesa');
 grim:=public.creation_identifier(c.class)='ocultista' AND c.nex>=40 AND public.creation_identifier(c.class_track)='graduado';
 blade:=p_ritual_id IN ('amaldicoar-arma-conhecimento','amaldicoar-arma-energia','amaldicoar-arma-morte','amaldicoar-arma-sangue')
  AND public.creation_identifier(c.class)='ocultista' AND
  ((c.nex>=10 AND public.creation_identifier(c.class_track)='lamina-paranormal')
   OR (c.nex>=50 AND c.versatility_track->>'trackId'='lamina-paranormal'));
 SELECT * INTO review FROM public.character_ritual_knowledge WHERE character_id=c.id AND ritual_id=p_ritual_id;
 IF FOUND THEN source:=CASE WHEN review.source='grimoire' AND NOT grim THEN 'unverified' ELSE review.source END;
 ELSIF grim THEN
  extra:=CASE WHEN jsonb_typeof(c.creation_data->'extraRituals')='object' THEN c.creation_data->'extraRituals' ELSE '{}'::jsonb END;
  IF EXISTS(SELECT 1 FROM jsonb_each(coalesce(extra,'{}'::jsonb)) e WHERE e.key LIKE 'grimorio-%' AND e.value @> to_jsonb(ARRAY[p_ritual_id])) THEN source:='grimoire';
  ELSIF c.creation_data IS NULL OR NOT coalesce((
   coalesce(c.creation_data->'rituals','[]'::jsonb) @> to_jsonb(ARRAY[p_ritual_id])
   OR EXISTS(SELECT 1 FROM jsonb_each(extra) e WHERE e.key NOT LIKE 'grimorio-%' AND e.value @> to_jsonb(ARRAY[p_ritual_id]))
   OR (c.creation_data->>'origin'='cultista-arrependido' AND c.creation_data->>'originParanormalPower'='aprender-ritual' AND c.creation_data->'originParanormalChoices'->>'ritualId'=p_ritual_id)
   OR EXISTS(SELECT 1 FROM jsonb_each(CASE WHEN jsonb_typeof(c.creation_data->'transcenderChoices')='object' THEN c.creation_data->'transcenderChoices' ELSE '{}'::jsonb END) e
    WHERE e.value->>'powerId'='aprender-ritual' AND e.value->'subchoices'->>'ritualId'=p_ritual_id
    AND regexp_replace(e.key,'-[0-9]+$','') IN ('transcender-comb','transcender-esp','transcender-ocult')
    AND c.creation_data->'abilities' @> to_jsonb(ARRAY[regexp_replace(e.key,'-[0-9]+$','')]))
   OR (p_ritual_id='conhecendo-o-medo' AND c.creation_data->>'classTrack'='graduado' AND c.creation_data->'nex'='99'::jsonb)
  ),false) THEN source:='unverified';
  END IF;
 END IF;
 known:=coalesce(c.rituals,'[]'::jsonb) @> to_jsonb(ARRAY[p_ritual_id]);
 IF source='grimoire' AND NOT known THEN source:='unverified'; END IF;
 SELECT coalesce(jsonb_agg(jsonb_build_object('id',coalesce(nullif(item->>'id',''),'legacy:'||md5(item::text)),'name',coalesce(nullif(item->>'name',''),'Grimório Ritualístico'))),'[]'::jsonb)
 INTO items FROM jsonb_array_elements(CASE WHEN jsonb_typeof(c.inventory)='array' THEN c.inventory ELSE '[]'::jsonb END) item
 WHERE (item->>'creationSource'='grimorio' OR public.creation_identifier(item->>'name') IN ('grimorio','grimorio-ritualistico'))
 AND public.creation_identifier(item->>'name')<>'grimorio-vivo'
 AND (NOT item ? 'quantity' OR public.activity_json_integer(item->'quantity',1,1000000));
 RETURN jsonb_build_object('characterId',c.id,'bladeAvailable',coalesce(blade,false),'ritualId',p_ritual_id,'execution',execution,'source',source,'grimoireItems',items,
  'bladeEligible',blade AND known AND coalesce(review.known_before_blade,false),
  'bladeKnowledge',CASE WHEN NOT blade THEN 'absent' WHEN review.review_event_id IS NOT NULL THEN CASE WHEN review.known_before_blade THEN 'confirmed' ELSE 'absent' END ELSE 'unverified' END,
  'canReview',public.can_review_character_ritual(c.id));
END $$;
REVOKE ALL ON FUNCTION public.get_character_ritual_situational(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_character_ritual_situational(uuid,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.confirm_character_ritual_knowledge(p_operation_id uuid,p_character_id uuid,p_ritual_id text,p_review jsonb)
RETURNS public.character_activity_events LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE receipt public.character_activity_events; fingerprint text; c public.characters;
BEGIN
 IF NOT public.can_review_character_ritual(p_character_id) THEN RAISE EXCEPTION 'Só o mestre vinculado pode conferir.' USING ERRCODE='42501'; END IF;
 IF p_operation_id IS NULL OR public.ritual_execution_catalog()->>p_ritual_id IS NULL
 OR jsonb_typeof(p_review) IS DISTINCT FROM 'object' OR coalesce(p_review->>'source','') NOT IN ('memorized','grimoire')
 OR jsonb_typeof(p_review->'knownBeforeBlade') IS DISTINCT FROM 'boolean'
 OR jsonb_typeof(p_review->'note') IS DISTINCT FROM 'string' OR length(trim(p_review->>'note')) NOT BETWEEN 10 AND 500 THEN
  RAISE EXCEPTION 'Conferência inválida.' USING ERRCODE='22023'; END IF;
 fingerprint:=md5(jsonb_build_array('ritual_knowledge',p_character_id,p_ritual_id,p_review)::text);
 PERFORM pg_advisory_xact_lock(hashtextextended(p_operation_id::text,0));
 PERFORM public.lock_character_pe_turn(p_character_id);
 SELECT * INTO receipt FROM public.character_activity_events WHERE operation_id=p_operation_id;
 IF FOUND THEN
  IF receipt.author_id<>auth.uid() OR receipt.request_hash<>fingerprint THEN RAISE EXCEPTION 'Operação reutilizada.' USING ERRCODE='23505'; END IF;
  RETURN receipt;
 END IF;
 SELECT * INTO c FROM public.characters WHERE id=p_character_id;
 IF NOT coalesce(c.rituals,'[]'::jsonb) @> to_jsonb(ARRAY[p_ritual_id]) THEN RAISE EXCEPTION 'Ritual não pertence à ficha.' USING ERRCODE='55003'; END IF;
 IF p_review->>'source'='grimoire' AND NOT (public.creation_identifier(c.class)='ocultista' AND c.nex>=40 AND public.creation_identifier(c.class_track)='graduado') THEN
  RAISE EXCEPTION 'Grimório Ritualístico indisponível.' USING ERRCODE='55003'; END IF;
 IF p_review->'knownBeforeBlade'='true'::jsonb AND public.get_character_ritual_situational(c.id,p_ritual_id)->'bladeAvailable' IS DISTINCT FROM 'true'::jsonb THEN
  RAISE EXCEPTION 'Lâmina Maldita indisponível.' USING ERRCODE='55003'; END IF;
 INSERT INTO public.character_activity_events(id,operation_id,character_id,author_id,category,status,payload,request_hash)
 VALUES(p_operation_id,p_operation_id,c.id,auth.uid(),'application','confirmed',
  jsonb_build_object('kind','ritual_knowledge','ritualId',p_ritual_id,'source',p_review->>'source','knownBeforeBlade',p_review->'knownBeforeBlade','note',p_review->>'note','peCost',0),fingerprint)
 RETURNING * INTO receipt;
 INSERT INTO public.character_ritual_knowledge(character_id,ritual_id,source,known_before_blade,reviewed_by,review_event_id)
 VALUES(c.id,p_ritual_id,p_review->>'source',(p_review->>'knownBeforeBlade')::boolean,auth.uid(),receipt.id)
 ON CONFLICT(character_id,ritual_id) DO UPDATE SET source=EXCLUDED.source,known_before_blade=EXCLUDED.known_before_blade,reviewed_by=EXCLUDED.reviewed_by,review_event_id=EXCLUDED.review_event_id;
 RETURN receipt;
END $$;
REVOKE ALL ON FUNCTION public.confirm_character_ritual_knowledge(uuid,uuid,text,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.confirm_character_ritual_knowledge(uuid,uuid,text,jsonb) TO authenticated;

-- Guarda a implementação anterior uma vez; a cadeia conserva PE temporários, SAN e orçamento.
DO $$ BEGIN
 IF to_regprocedure('public.cast_character_ritual_situational_core(uuid,uuid,integer,integer,jsonb,uuid,text)') IS NULL THEN
  ALTER FUNCTION public.cast_character_ritual(uuid,uuid,integer,integer,jsonb,uuid,text) RENAME TO cast_character_ritual_situational_core;
 END IF;
END $$;
REVOKE ALL ON FUNCTION public.cast_character_ritual_situational_core(uuid,uuid,integer,integer,jsonb,uuid,text) FROM PUBLIC,anon,authenticated;
CREATE OR REPLACE FUNCTION public.cast_character_ritual(p_operation_id uuid,p_character_id uuid,p_expected_pe integer,p_pe_cost integer,p_payload jsonb,
 p_campaign_id uuid DEFAULT NULL,p_campaign_version text DEFAULT NULL)
RETURNS public.character_activity_events LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE context jsonb; declaration jsonb; receipt public.character_activity_events; movement boolean; execution text; base_cost integer; minimum integer;
BEGIN
 IF p_operation_id IS NULL THEN RAISE EXCEPTION 'ID obrigatório.' USING ERRCODE='22023'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_operation_id::text,0));
 PERFORM public.lock_character_pe_turn(p_character_id);
 -- Recibos antigos e recuperações conservam o hash original e não cobram outra vez.
 IF EXISTS(SELECT 1 FROM public.character_activity_events WHERE operation_id=p_operation_id) THEN
  RETURN public.cast_character_ritual_situational_core(p_operation_id,p_character_id,p_expected_pe,p_pe_cost,p_payload,p_campaign_id,p_campaign_version);
 END IF;
 context:=public.get_character_ritual_situational(p_character_id,p_payload->>'ritualId');
 declaration:=coalesce(p_payload->'situational','{}'::jsonb);
 IF jsonb_typeof(declaration) IS DISTINCT FROM 'object' OR p_payload ? 'situationalResolution' OR context->>'source'='unverified' THEN
  RAISE EXCEPTION 'Fonte ou declaração não conferida.' USING ERRCODE='55003'; END IF;
 IF context->>'source'='grimoire' THEN
  IF declaration->'grimoireHeld' IS DISTINCT FROM 'true'::jsonb OR declaration->'grimoireRead' IS DISTINCT FROM 'true'::jsonb
  OR NOT EXISTS(SELECT 1 FROM jsonb_array_elements(context->'grimoireItems') item WHERE item->>'id'=declaration->>'grimoireItemId') THEN
   RAISE EXCEPTION 'Empunhar e consultar o grimório é obrigatório.' USING ERRCODE='55003'; END IF;
 ELSIF declaration ? 'grimoireItemId' OR declaration->'grimoireHeld'='true'::jsonb OR declaration->'grimoireRead'='true'::jsonb THEN
  RAISE EXCEPTION 'Fonte do grimório divergente.' USING ERRCODE='55003';
 END IF;
 IF EXISTS(SELECT 1 FROM jsonb_each(declaration) e WHERE e.key IN ('grimoireHeld','grimoireRead','bladeMovement') AND jsonb_typeof(e.value)<>'boolean') THEN RAISE EXCEPTION 'Declaração inválida.' USING ERRCODE='55003'; END IF;
 movement:=declaration->'bladeMovement'='true'::jsonb;
 execution:=context->>'execution';
 IF coalesce(movement,false) THEN
  IF context->'bladeEligible' IS DISTINCT FROM 'true'::jsonb OR NOT public.activity_json_integer(declaration->'costBeforeBlade',1,1000000) THEN
   RAISE EXCEPTION 'Conhecimento anterior ou custo não confirmado.' USING ERRCODE='55003'; END IF;
  base_cost:=(declaration->>'costBeforeBlade')::integer;
  minimum:=CASE WHEN p_payload->'enhancements' @> '["Verdadeiro"]'::jsonb THEN 6 WHEN p_payload->'enhancements' @> '["Discente"]'::jsonb THEN 3 ELSE 1 END;
  IF base_cost<minimum OR p_pe_cost IS DISTINCT FROM base_cost+1 THEN RAISE EXCEPTION 'Adicional de Lâmina Maldita divergente.' USING ERRCODE='55003'; END IF;
  execution:='Movimento';
 END IF;
 receipt:=public.cast_character_ritual_situational_core(p_operation_id,p_character_id,p_expected_pe,p_pe_cost,p_payload,p_campaign_id,p_campaign_version);
 UPDATE public.character_activity_events SET payload=payload||jsonb_build_object('situationalResolution','server_checked',
  'castingSource',context->>'source','execution',execution,'bladeExtraPE',CASE WHEN coalesce(movement,false) THEN 1 ELSE 0 END,
  'grimoirePreparation',CASE WHEN context->>'source'='grimoire' THEN jsonb_build_object('itemId',declaration->>'grimoireItemId','heldConfirmed',true,'readingAction','Completa','readingConfirmed',true,'declaration',true) ELSE NULL END)
 WHERE id=receipt.id RETURNING * INTO receipt;
 RETURN receipt;
END $$;
REVOKE ALL ON FUNCTION public.cast_character_ritual(uuid,uuid,integer,integer,jsonb,uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.cast_character_ritual(uuid,uuid,integer,integer,jsonb,uuid,text) TO authenticated;
NOTIFY pgrst, 'reload schema';
