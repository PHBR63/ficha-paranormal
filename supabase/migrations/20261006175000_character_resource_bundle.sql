-- Alteração explícita dos três recursos e suas condições como uma operação.
-- Evita que um snapshot local sobrescreva uma conjuração feita em outra aba.
CREATE FUNCTION public.change_character_resources(p_operation_id uuid,p_character_id uuid,p_values jsonb,p_expected jsonb,p_conditions jsonb)
RETURNS public.character_activity_events LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE result public.character_activity_events; ficha public.characters; before_state jsonb; after_state jsonb; fingerprint text;
BEGIN
 IF NOT public.can_manage_character_activity(p_character_id) THEN RAISE EXCEPTION 'Sem permissão para alterar esta ficha.' USING ERRCODE='42501'; END IF;
 IF p_operation_id IS NULL OR p_values IS NULL OR jsonb_typeof(p_values)<>'object' OR p_values-ARRAY['hp','pe','san']<>'{}'::jsonb
 OR p_expected IS NULL OR jsonb_typeof(p_expected)<>'object' OR p_conditions IS NULL OR jsonb_typeof(p_conditions)<>'array'
 OR octet_length(p_conditions::text)>30000 OR jsonb_array_length(p_conditions)>100
 OR NOT public.activity_json_integer(p_values->'hp',-1000000,1000000)
 OR NOT public.activity_json_integer(p_values->'pe',-1000000,1000000)
 OR NOT public.activity_json_integer(p_values->'san',-1000000,1000000)
 OR EXISTS(SELECT 1 FROM jsonb_array_elements(p_conditions) item WHERE jsonb_typeof(item) NOT IN ('string','object')
 OR (jsonb_typeof(item)='string' AND length(trim(item#>>'{}')) NOT BETWEEN 1 AND 150)
 OR (jsonb_typeof(item)='object' AND length(trim(coalesce(item->>'id',item->>'name',''))) NOT BETWEEN 1 AND 200)) THEN
   RAISE EXCEPTION 'Recursos ou condições inválidos.' USING ERRCODE='22023'; END IF;
 fingerprint:=md5(jsonb_build_array(p_character_id,p_values,p_expected,p_conditions)::text);
 PERFORM pg_advisory_xact_lock(hashtextextended(p_operation_id::text,0));
 SELECT * INTO result FROM public.character_activity_events WHERE operation_id=p_operation_id;
 IF FOUND THEN
   IF result.author_id<>auth.uid() OR result.request_hash<>fingerprint THEN RAISE EXCEPTION 'Operação já utilizada.' USING ERRCODE='23505'; END IF;
   RETURN result;
 END IF;
 SELECT * INTO ficha FROM public.characters WHERE id=p_character_id FOR UPDATE;
 before_state:=jsonb_build_object('hp_current',ficha.hp_current,'hp_max',ficha.hp_max,'pe_current',ficha.pe_current,'pe_max',ficha.pe_max,
   'san_current',ficha.san_current,'san_max',ficha.san_max,'conditions',ficha.conditions);
 -- Exige todos os valores e máximos originais, incluindo as condições. Não
 -- ignora uma alteração concorrente só porque a tela editou outro recurso.
 IF EXISTS(SELECT 1 FROM jsonb_each(before_state) field WHERE p_expected->field.key IS DISTINCT FROM field.value) THEN
   RAISE EXCEPTION 'Recursos ou condições atualizados por outra operação. Recarregue.' USING ERRCODE='40001'; END IF;
 UPDATE public.characters SET
   hp_current=greatest(0,least(hp_max,(p_values->>'hp')::integer)),
   pe_current=greatest(0,least(pe_max,(p_values->>'pe')::integer)),
   san_current=greatest(0,least(san_max,(p_values->>'san')::integer)),conditions=p_conditions
 WHERE id=p_character_id RETURNING jsonb_build_object('hp_current',hp_current,'hp_max',hp_max,'pe_current',pe_current,'pe_max',pe_max,
   'san_current',san_current,'san_max',san_max,'conditions',conditions) INTO after_state;
 INSERT INTO public.character_activity_events(id,operation_id,character_id,author_id,category,status,payload,request_hash)
 VALUES(p_operation_id,p_operation_id,p_character_id,auth.uid(),'application','confirmed',
   jsonb_build_object('kind','resources','value',p_values,'before',before_state,'after',after_state),fingerprint)
 RETURNING * INTO result;
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.change_character_resources(uuid,uuid,jsonb,jsonb,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.change_character_resources(uuid,uuid,jsonb,jsonb,jsonb) TO authenticated;
