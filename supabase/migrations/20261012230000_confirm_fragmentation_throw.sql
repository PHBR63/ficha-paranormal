-- Fragmentação, Livro Base pp.30,64,78: sorteio, consumo e recibo atômicos.
-- As aplicações nos alvos ficam pendentes; arremessar não confirma dano aplicado.
CREATE FUNCTION public.confirm_character_fragmentation_throw(p_operation_id uuid,p_character_id uuid,p_request jsonb)
RETURNS public.character_activity_events LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE c public.characters; item jsonb; receipt public.character_activity_events;
 fingerprint text; inventory_after jsonb; quantity integer; dt integer; budget jsonb;
 expert boolean; dice jsonb:='[]'; die integer; total integer:=0; point text;
BEGIN
 IF NOT public.can_manage_character_activity(p_character_id) THEN RAISE EXCEPTION 'Ficha não autorizada.' USING ERRCODE='42501'; END IF;
 point:=trim(p_request->>'point');
 IF p_operation_id IS NULL OR jsonb_typeof(p_request) IS DISTINCT FROM 'object'
 OR octet_length(p_request::text)>16000 OR p_request->'requirementsConfirmed' IS DISTINCT FROM 'true'::jsonb
 OR point IS NULL OR length(point) NOT BETWEEN 1 AND 240 THEN
  RAISE EXCEPTION 'Confirme empunhadura, ação padrão e ponto em alcance médio.' USING ERRCODE='22023'; END IF;
 fingerprint:=md5(jsonb_build_array(p_character_id,p_request)::text);
 PERFORM pg_advisory_xact_lock(hashtextextended(p_operation_id::text,0));
 SELECT * INTO receipt FROM public.character_activity_events WHERE operation_id=p_operation_id;
 IF FOUND THEN
  IF receipt.author_id<>auth.uid() OR receipt.request_hash<>fingerprint THEN RAISE EXCEPTION 'Operação reutilizada.' USING ERRCODE='23505'; END IF;
  RETURN receipt;
 END IF;
 budget:=public.get_character_pe_budget(p_character_id);
 SELECT * INTO c FROM public.characters WHERE id=p_character_id FOR UPDATE;
 IF (SELECT count(*) FROM jsonb_array_elements(c.inventory) WHERE value->>'id'=p_request->'item'->>'id')<>1 THEN
  RAISE EXCEPTION 'Granada ausente ou identidade duplicada.' USING ERRCODE='40001'; END IF;
 SELECT value INTO item FROM jsonb_array_elements(c.inventory) WHERE value->>'id'=p_request->'item'->>'id';
 IF item IS DISTINCT FROM p_request->'item' THEN RAISE EXCEPTION 'O item mudou. Atualize a ficha.' USING ERRCODE='40001'; END IF;
 IF item->>'catalogId' IS DISTINCT FROM 'granada_fragmentacao' OR item->>'catalogType' IS DISTINCT FROM 'explosivo' THEN
  RAISE EXCEPTION 'Selecione uma Granada de Fragmentação do catálogo.' USING ERRCODE='22023'; END IF;
 IF coalesce(item->>'quantity','1') !~ '^[0-9]{1,6}$' THEN RAISE EXCEPTION 'Quantidade inválida.' USING ERRCODE='22023'; END IF;
 quantity:=coalesce((item->>'quantity')::integer,1);
 IF quantity<1 OR (item ? 'uses' AND (coalesce(item->>'uses','0') !~ '^[1-9][0-9]{0,5}$')) THEN
  RAISE EXCEPTION 'A granada não está disponível.' USING ERRCODE='55004'; END IF;
 IF c.agility NOT BETWEEN 0 AND 5 OR c.intellect NOT BETWEEN 0 AND 5 THEN
  RAISE EXCEPTION 'Confira os atributos da ficha.' USING ERRCODE='22023'; END IF;
 -- IDs e nomes exatos estruturados, nunca procura texto em descrições de poderes.
 SELECT EXISTS(SELECT 1 FROM jsonb_array_elements(
  CASE WHEN jsonb_typeof(c.powers)='array' THEN c.powers ELSE '[]' END ||
  CASE WHEN jsonb_typeof(c.general_powers)='array' THEN c.general_powers ELSE '[]' END) p
  WHERE p->>'id'='perito-explosivos' OR lower(p->>'name')='perito em explosivos' OR p #>> '{}'='perito-explosivos') INTO expert;
 dt:=10+(budget->>'limit')::integer+c.agility+CASE WHEN expert THEN c.intellect ELSE 0 END;
 FOR i IN 1..8 LOOP die:=floor(random()*6)::integer+1; dice:=dice||to_jsonb(die); total:=total+die; END LOOP;
 SELECT coalesce(jsonb_agg(CASE WHEN value->>'id'=item->>'id' THEN
  jsonb_set(value,'{quantity}',to_jsonb(quantity-1)) ELSE value END ORDER BY ordinality),'[]')
 INTO inventory_after FROM jsonb_array_elements(c.inventory) WITH ORDINALITY
 WHERE value->>'id'<>item->>'id' OR quantity>1;
 UPDATE public.characters SET inventory=inventory_after WHERE id=p_character_id;
 INSERT INTO public.character_activity_events(id,operation_id,character_id,author_id,category,status,payload,request_hash)
 VALUES(p_operation_id,p_operation_id,p_character_id,auth.uid(),'roll','confirmed',jsonb_build_object(
  'kind','fragmentation_throw','itemName',item->>'name','point',point,'radius',6,'actionCost','padrão',
  'peCost',0,'consumed',1,'remainingQuantity',quantity-1,'requirementsDeclared',true,
  'dt',dt,'agility',c.agility,'peLimit',(budget->>'limit')::integer,'expertIntellect',CASE WHEN expert THEN c.intellect ELSE 0 END,
  'maxExcludedTargets',CASE WHEN expert THEN c.intellect ELSE 0 END,'targetResolution','pending',
  'result',jsonb_build_object('label','Fragmentação: '||(item->>'name'),'dice',dice,'total',total,'damageType','Perfuração')),
  fingerprint) RETURNING * INTO receipt;
 RETURN receipt;
END $$;
REVOKE ALL ON FUNCTION public.confirm_character_fragmentation_throw(uuid,uuid,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.confirm_character_fragmentation_throw(uuid,uuid,jsonb) TO authenticated;
