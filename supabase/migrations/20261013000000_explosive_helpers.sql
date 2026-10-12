-- Reutiliza a autorização v1/v2 e a tabela privada de Fragmentação, sem ampliar acesso direto.
ALTER TABLE public.fragmentation_target_resolutions ADD COLUMN effect_conditions text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.fragmentation_target_resolutions ADD COLUMN active boolean NOT NULL DEFAULT false;

CREATE FUNCTION public.explosive_type(p_id text) RETURNS text LANGUAGE sql IMMUTABLE AS $$
 SELECT CASE p_id WHEN 'granada_fragmentacao' THEN 'fragmentation' WHEN 'granada_incendiaria' THEN 'incendiary'
 WHEN 'granada_atordoamento' THEN 'stun' WHEN 'granada_fumaca' THEN 'smoke' WHEN 'mina_antipessoal' THEN 'mine' END;
$$;
REVOKE ALL ON FUNCTION public.explosive_type(text) FROM PUBLIC,anon,authenticated;

-- Condições trazem uma identidade de fonte para remoção seletiva. Não altera fontes alheias.
CREATE FUNCTION public.explosive_conditions(p_original jsonb,p_source uuid,p_ids text[]) RETURNS jsonb
LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
DECLARE result jsonb:=coalesce(p_original,'[]'); id text;
BEGIN
 IF jsonb_typeof(result)<>'array' THEN RAISE EXCEPTION 'Condições exigem revisão.' USING ERRCODE='22023'; END IF;
 FOR id IN SELECT unnest(p_ids) LOOP
 result:=result||jsonb_build_array(jsonb_build_object('id',id,'name',CASE id WHEN 'em_chamas' THEN 'Em Chamas'
 WHEN 'atordoado' THEN 'Atordoado' WHEN 'ofuscado' THEN 'Ofuscado' WHEN 'surdo' THEN 'Surdo' WHEN 'cego' THEN 'Cego' ELSE 'Camuflagem Total' END,
 'addedAt',clock_timestamp(),'turnsRemaining',NULL,'duration','manual','explosiveSource',p_source,
 'params',jsonb_build_object('customEffect','Efeito de explosivo: duração controlada no painel de explosivos.')));
 END LOOP;
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.explosive_conditions(jsonb,uuid,text[]) FROM PUBLIC,anon,authenticated;

-- Apagar fogo remove todas as instâncias Em Chamas; sair/expirar remove apenas a fonte informada.
CREATE FUNCTION public.remove_explosive_conditions(p_original jsonb,p_source uuid,p_all_fire boolean DEFAULT false) RETURNS jsonb
LANGUAGE sql SET search_path=public,pg_temp AS $$
 SELECT coalesce(jsonb_agg(value ORDER BY ordinality),'[]') FROM jsonb_array_elements(p_original) WITH ORDINALITY
 WHERE CASE WHEN p_all_fire THEN lower(replace(coalesce(value->>'id',value #>> '{}'),'_','-')) NOT IN ('em-chamas','em chamas')
 ELSE coalesce(value->>'explosiveSource','')<>p_source::text END;
$$;
REVOKE ALL ON FUNCTION public.remove_explosive_conditions(jsonb,uuid,boolean) FROM PUBLIC,anon,authenticated;
