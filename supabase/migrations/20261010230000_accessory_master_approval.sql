-- Livro Base pp.63-64: aval do mestre, utensílio empunhado, duas vestimentas e não acumulação.
-- As confirmações ficam fora do inventário editável pelo jogador.
CREATE TABLE public.character_accessory_reviews (
 character_id uuid REFERENCES public.characters(id) ON DELETE CASCADE,
 item_id text NOT NULL,
 signature text NOT NULL,
 approved boolean NOT NULL DEFAULT false,
 in_use boolean NOT NULL DEFAULT false,
 reviewed_by uuid NOT NULL,
 PRIMARY KEY(character_id,item_id)
);
ALTER TABLE public.character_accessory_reviews ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.character_accessory_reviews FROM PUBLIC,anon,authenticated;

CREATE FUNCTION public.accessory_signature(item jsonb) RETURNS text
LANGUAGE sql IMMUTABLE SET search_path='' AS $$
 SELECT md5(jsonb_build_array(item->'name',item->'catalogType',item->'catalogId',
 item->'accessoryConfiguration',item->'appliedAccessoryModifications')::text)
$$;
REVOKE ALL ON FUNCTION public.accessory_signature(jsonb) FROM PUBLIC,anon,authenticated;

-- Calcula as funções a partir das escolhas, sem confiar em accessorySkillBonuses do cliente.
CREATE FUNCTION public.accessory_bonuses(item jsonb) RETURNS jsonb
LANGUAGE plpgsql IMMUTABLE SET search_path='' AS $$
DECLARE cfg jsonb:=item->'accessoryConfiguration'; mods jsonb:=coalesce(item->'appliedAccessoryModifications','[]');
 result jsonb:='{}'; skill text; allowed text[]:=ARRAY['acrobacia','adestramento','artes','atletismo','atualidades','ciencias','crime','diplomacia','enganacao','fortitude','furtividade','iniciativa','intimidacao','intuicao','investigacao','medicina','ocultismo','percepcao','pilotagem','profissao','reflexos','religiao','sobrevivencia','tatica','tecnologia','vontade'];
BEGIN
 IF item->>'catalogType' IS DISTINCT FROM 'acessorio' THEN RETURN result; END IF;
 skill:=cfg->>'primarySkill';
 IF item->>'catalogId' IN ('utensilio','vestimenta') AND skill=ANY(allowed) THEN
  result:=jsonb_build_object(skill,CASE WHEN mods ? 'aprimorado' THEN 5 ELSE 2 END);
 END IF;
 skill:=cfg->>'additionalSkill';
 IF mods ? 'funcao_adicional' AND skill=ANY(allowed) AND skill IS DISTINCT FROM cfg->>'primarySkill' THEN
  result:=result||jsonb_build_object(skill,CASE WHEN mods ? 'aprimorado_adicional' THEN 5 ELSE 2 END);
 END IF;
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.accessory_bonuses(jsonb) FROM PUBLIC,anon,authenticated;

CREATE FUNCTION public.get_character_accessories(p_character_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE item jsonb; review public.character_accessory_reviews; approved boolean; active boolean;
 items jsonb:='[]'; bonuses jsonb:='{}'; entry record; clothes integer:=0;
BEGIN
 IF NOT public.can_manage_character_activity(p_character_id) THEN RAISE EXCEPTION 'Ficha não autorizada.' USING ERRCODE='42501'; END IF;
 FOR item IN SELECT value FROM public.characters c, jsonb_array_elements(c.inventory) WHERE c.id=p_character_id LOOP
  IF item->>'catalogType' IS DISTINCT FROM 'acessorio' THEN CONTINUE; END IF;
  SELECT * INTO review FROM public.character_accessory_reviews WHERE character_id=p_character_id AND item_id=item->>'id';
  approved:=coalesce(review.approved AND review.signature=public.accessory_signature(item),false);
  active:=approved AND coalesce(review.in_use,false);
  IF active AND item->>'catalogId'='vestimenta' THEN clothes:=clothes+1; active:=clothes<=2; END IF;
  items:=items||jsonb_build_array(jsonb_build_object('id',item->>'id','name',item->>'name',
   'signature',public.accessory_signature(item),'approved',approved,'inUse',active,'bonuses',public.accessory_bonuses(item)));
  IF active THEN
   FOR entry IN SELECT key,value FROM jsonb_each_text(public.accessory_bonuses(item)) LOOP
    bonuses:=bonuses||jsonb_build_object(entry.key,greatest(coalesce((bonuses->>entry.key)::integer,0),entry.value::integer));
   END LOOP;
  END IF;
 END LOOP;
 RETURN jsonb_build_object('canReview',public.can_review_character_ritual(p_character_id),'items',items,'bonuses',bonuses);
END $$;
REVOKE ALL ON FUNCTION public.get_character_accessories(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_character_accessories(uuid) TO authenticated;

-- Idempotência, vínculo v1/v2, bloqueio da ficha e assinatura protegem aprovação e uso.
CREATE FUNCTION public.confirm_character_accessory(p_operation_id uuid,p_character_id uuid,p_item_id text,
 p_signature text,p_action text,p_enabled boolean,p_note text DEFAULT '') RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE item jsonb; review public.character_accessory_reviews; receipt public.character_activity_events;
 fingerprint text; clothes integer;
BEGIN
 IF NOT public.can_manage_character_activity(p_character_id) OR
 (p_action='review' AND NOT public.can_review_character_ritual(p_character_id)) THEN
  RAISE EXCEPTION 'Somente o mestre vinculado pode aprovar; uso exige acesso à ficha.' USING ERRCODE='42501'; END IF;
 IF p_operation_id IS NULL OR p_enabled IS NULL OR p_action NOT IN ('review','use') OR p_action IS NULL
 OR (p_action='review' AND length(trim(coalesce(p_note,''))) NOT BETWEEN 10 AND 500) THEN
  RAISE EXCEPTION 'Confirmação inválida. Registre o motivo da conferência.' USING ERRCODE='22023'; END IF;
 fingerprint:=md5(jsonb_build_array(p_character_id,p_item_id,p_signature,p_action,p_enabled,p_note)::text);
 PERFORM pg_advisory_xact_lock(hashtextextended(p_operation_id::text,0));
 PERFORM 1 FROM public.characters WHERE id=p_character_id FOR UPDATE;
 SELECT * INTO receipt FROM public.character_activity_events WHERE operation_id=p_operation_id;
 IF FOUND THEN
  IF receipt.author_id<>auth.uid() OR receipt.request_hash<>fingerprint THEN RAISE EXCEPTION 'Operação reutilizada.' USING ERRCODE='23505'; END IF;
  RETURN public.get_character_accessories(p_character_id);
 END IF;
 SELECT value INTO item FROM public.characters c,jsonb_array_elements(c.inventory) WHERE c.id=p_character_id AND value->>'id'=p_item_id;
 IF item IS NULL OR item->>'catalogType' IS DISTINCT FROM 'acessorio' OR public.accessory_signature(item) IS DISTINCT FROM p_signature THEN
  RAISE EXCEPTION 'O item mudou. Recarregue antes de confirmar.' USING ERRCODE='40001'; END IF;
 SELECT * INTO review FROM public.character_accessory_reviews WHERE character_id=p_character_id AND item_id=p_item_id;
 IF p_action='review' THEN
  IF public.accessory_bonuses(item)='{}'::jsonb THEN RAISE EXCEPTION 'Escolha as perícias beneficiadas antes de aprovar.' USING ERRCODE='22023'; END IF;
  INSERT INTO public.character_accessory_reviews VALUES(p_character_id,p_item_id,p_signature,p_enabled,false,auth.uid())
  ON CONFLICT(character_id,item_id) DO UPDATE SET signature=EXCLUDED.signature,approved=EXCLUDED.approved,in_use=false,reviewed_by=EXCLUDED.reviewed_by;
 ELSE
  IF NOT coalesce(review.approved AND review.signature=p_signature,false) THEN RAISE EXCEPTION 'O bônus está pendente de aprovação do mestre.' USING ERRCODE='55003'; END IF;
  IF p_enabled AND item->>'catalogId'='vestimenta' THEN
   SELECT count(*) INTO clothes FROM public.characters c,jsonb_array_elements(c.inventory) i
   JOIN public.character_accessory_reviews r ON r.character_id=p_character_id AND r.item_id=i->>'id'
   WHERE c.id=p_character_id AND i->>'catalogId'='vestimenta' AND i->>'id'<>p_item_id
   AND r.in_use AND r.approved AND r.signature=public.accessory_signature(i);
   IF clothes>=2 THEN RAISE EXCEPTION 'No máximo duas vestimentas podem conceder bônus ao mesmo tempo.' USING ERRCODE='55003'; END IF;
  END IF;
  UPDATE public.character_accessory_reviews SET in_use=p_enabled WHERE character_id=p_character_id AND item_id=p_item_id;
 END IF;
 INSERT INTO public.character_activity_events(id,operation_id,character_id,author_id,category,status,payload,request_hash)
 VALUES(p_operation_id,p_operation_id,p_character_id,auth.uid(),'application','confirmed',jsonb_build_object(
 'kind','accessory_review','itemName',item->>'name','action',p_action,'enabled',p_enabled,'note',p_note,
 'bonuses',public.accessory_bonuses(item),'peCost',0),fingerprint);
 RETURN public.get_character_accessories(p_character_id);
END $$;
REVOKE ALL ON FUNCTION public.confirm_character_accessory(uuid,uuid,text,text,text,boolean,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.confirm_character_accessory(uuid,uuid,text,text,text,boolean,text) TO authenticated;
