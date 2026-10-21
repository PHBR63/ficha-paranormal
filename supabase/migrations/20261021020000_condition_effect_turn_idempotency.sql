-- Impede que dano recorrente da mesma condição seja confirmado mais de uma
-- vez no mesmo turno controlado, mesmo com um novo UUID de operação.
CREATE TABLE public.character_condition_effect_turn_confirmations (
 character_id uuid NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
 turn_key text NOT NULL,
 effect_key text NOT NULL,
 condition_id text NOT NULL,
 condition_label text NOT NULL,
 operation_id uuid NOT NULL REFERENCES public.character_activity_events(id) ON DELETE CASCADE,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 PRIMARY KEY(character_id,turn_key,effect_key)
);
CREATE INDEX character_condition_effect_turn_operation_idx
 ON public.character_condition_effect_turn_confirmations(operation_id);
ALTER TABLE public.character_condition_effect_turn_confirmations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.character_condition_effect_turn_confirmations FROM PUBLIC,anon,authenticated;

-- Mantém o RPC antigo como núcleo; a nova camada só adiciona uma chave de
-- idempotência vinculada ao turno e à instância da condição persistida.
ALTER FUNCTION public.confirm_character_condition_turn(uuid,uuid,jsonb,jsonb,jsonb,jsonb)
 RENAME TO confirm_character_condition_turn_effect_core;
REVOKE ALL ON FUNCTION public.confirm_character_condition_turn_effect_core(uuid,uuid,jsonb,jsonb,jsonb,jsonb)
 FROM PUBLIC,anon,authenticated;

CREATE FUNCTION public.confirm_character_condition_turn(
 p_operation_id uuid,p_character_id uuid,p_values jsonb,p_expected jsonb,
 p_conditions jsonb,p_resolution jsonb
) RETURNS public.character_activity_events
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE
 receipt public.character_activity_events;
 budget jsonb;
 effect jsonb;
 condition_entry jsonb;
 condition_row record;
 condition_id text;
 condition_label text;
 effect_key text;
 active_turn_key text;
 request_hash text;
 effect_keys text[]:='{}';
 effect_ids text[]:='{}';
 effect_labels text[]:='{}';
 used_poison_indexes integer[]:='{}';
 poison_label text;
 tracked boolean:=false;
 index integer;
BEGIN
 IF p_operation_id IS NULL OR p_character_id IS NULL THEN
  RAISE EXCEPTION 'Operação de condição inválida.' USING ERRCODE='22023'; END IF;
 IF NOT public.can_manage_character_activity(p_character_id) THEN
  RAISE EXCEPTION 'Sem permissão para esta ficha.' USING ERRCODE='42501'; END IF;

 -- Reutilizar o recibo original é seguro; sua própria request hash protege
 -- alterações no conteúdo e evita reprovar retries já confirmados.
 request_hash:=md5(jsonb_build_array('server_condition_turn',p_character_id,
  p_values,p_expected,p_conditions,p_resolution)::text);
 PERFORM pg_advisory_xact_lock(hashtextextended(p_operation_id::text,0));
 SELECT * INTO receipt FROM public.character_activity_events
  WHERE operation_id=p_operation_id;
 IF FOUND THEN
  IF receipt.author_id<>auth.uid()
   OR receipt.payload->>'conditionTurnRequestHash' IS DISTINCT FROM request_hash THEN
   RAISE EXCEPTION 'Operação reutilizada.' USING ERRCODE='23505'; END IF;
  RETURN receipt;
 END IF;

 -- A mesma trava serializa avanço do combate/manual com duas confirmações
 -- simultâneas para efeitos recorrentes desta ficha.
 PERFORM public.lock_character_pe_turn(p_character_id);
 budget:=public.get_character_pe_budget(p_character_id);
 tracked:=coalesce((budget->>'tracked')::boolean,false);
 active_turn_key:=budget->>'key';
 IF tracked AND active_turn_key IS NOT NULL THEN
  IF jsonb_typeof(p_expected->'conditions') IS DISTINCT FROM 'array'
   OR jsonb_typeof(p_resolution->'effects') IS DISTINCT FROM 'array' THEN
   RAISE EXCEPTION 'Condições recorrentes inválidas.' USING ERRCODE='22023'; END IF;

  FOR effect IN SELECT value FROM jsonb_array_elements(p_resolution->'effects') AS entries(value) LOOP
   condition_id:=lower(replace(coalesce(effect->>'conditionId',''),'_','-'));
   condition_label:=coalesce(nullif(effect->>'label',''),
    CASE condition_id WHEN 'em-chamas' THEN 'Em Chamas' ELSE 'Envenenado' END);
   effect_key:=NULL;
   condition_entry:=NULL;

   IF condition_id='em-chamas' THEN
    SELECT candidate.value INTO condition_entry
    FROM jsonb_array_elements(p_expected->'conditions') AS candidate(value)
    WHERE lower(replace(coalesce(candidate.value->>'id',candidate.value #>> '{}'),
     '_','-'))='em-chamas'
    LIMIT 1;
    IF condition_entry IS NULL THEN
     RAISE EXCEPTION 'Em Chamas não consta nas condições atuais da ficha.' USING ERRCODE='22023'; END IF;
    -- O efeito da condição é único por turno mesmo quando há várias fontes de fogo.
    effect_key:='em-chamas';
   ELSIF condition_id='envenenado' THEN
    poison_label:=effect->>'label';
    SELECT candidate.value,candidate.ordinality::integer AS condition_index
     INTO condition_row
    FROM jsonb_array_elements(p_expected->'conditions') WITH ORDINALITY AS candidate(value,ordinality)
    WHERE lower(replace(coalesce(candidate.value->>'id',candidate.value #>> '{}'),
      '_','-'))='envenenado'
     AND coalesce(candidate.value->'params'->>'poisonDamage','')<>''
     AND (poison_label IS NULL OR coalesce(candidate.value->>'name','Envenenado')=poison_label)
     AND candidate.ordinality::integer<>ALL(used_poison_indexes)
    ORDER BY candidate.ordinality LIMIT 1;
    IF condition_row.value IS NULL THEN
     RAISE EXCEPTION 'Dano de veneno não corresponde a uma condição atual com fórmula.' USING ERRCODE='22023'; END IF;
    condition_entry:=condition_row.value;
    used_poison_indexes:=array_append(used_poison_indexes,condition_row.condition_index);
    -- Condições de veneno distintas podem acumular; cada linha do snapshot é
    -- uma fonte. O ordinal estabiliza instâncias duplicadas idênticas no retry.
    effect_key:='envenenado:'||md5(jsonb_build_object(
     'condition',condition_entry,'index',condition_row.condition_index)::text);
   ELSIF condition_id='sangrando' THEN
    -- Sangrando já tem tabela e teste de Vigor próprios por turno.
    CONTINUE;
   ELSE
    -- O núcleo valida a lista de condições permitidas.
    CONTINUE;
   END IF;

   IF effect_key=ANY(effect_keys) THEN
    RAISE EXCEPTION 'A mesma condição recorrente aparece mais de uma vez na resolução.' USING ERRCODE='22023'; END IF;
   effect_keys:=array_append(effect_keys,effect_key);
   effect_ids:=array_append(effect_ids,condition_id);
   effect_labels:=array_append(effect_labels,condition_label);
  END LOOP;

  IF cardinality(effect_keys)>0 AND EXISTS (
   SELECT 1 FROM public.character_condition_effect_turn_confirmations confirmation
   WHERE confirmation.character_id=p_character_id AND confirmation.turn_key=active_turn_key
    AND confirmation.effect_key=ANY(effect_keys)
  ) THEN
   RAISE EXCEPTION 'Efeito recorrente já foi confirmado neste turno.' USING ERRCODE='23505';
  END IF;
 END IF;

 receipt:=public.confirm_character_condition_turn_effect_core(
  p_operation_id,p_character_id,p_values,p_expected,p_conditions,p_resolution);

 -- Se a ficha está em modo manual ou combate ativo, registra a chave somente
 -- depois do sucesso do núcleo. Qualquer erro reverte dano e recibo na transação.
 IF tracked AND active_turn_key IS NOT NULL THEN
  IF cardinality(effect_keys)>0 THEN
   FOR index IN 1..cardinality(effect_keys) LOOP
    INSERT INTO public.character_condition_effect_turn_confirmations
    (character_id,turn_key,effect_key,condition_id,condition_label,operation_id)
    VALUES(p_character_id,active_turn_key,effect_keys[index],effect_ids[index],
     effect_labels[index],receipt.id);
   END LOOP;
  END IF;
 END IF;
 RETURN receipt;
END $$;

REVOKE ALL ON FUNCTION public.confirm_character_condition_turn(uuid,uuid,jsonb,jsonb,jsonb,jsonb)
 FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.confirm_character_condition_turn(uuid,uuid,jsonb,jsonb,jsonb,jsonb)
 TO authenticated;
