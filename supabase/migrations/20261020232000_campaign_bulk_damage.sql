-- Dano em área v2: o mestre declara resistência/RD por alvo; o servidor aplica
-- todos os resultados de forma atômica e conserva um recibo recuperável.
CREATE TABLE public.campaign_bulk_damage_operations (
 operation_id uuid PRIMARY KEY,
 campaign_id uuid NOT NULL REFERENCES public.campaigns_v2(id) ON DELETE CASCADE,
 author_id uuid NOT NULL REFERENCES auth.users(id),
 request_hash text NOT NULL,
 result jsonb NOT NULL CHECK(jsonb_typeof(result)='object'),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
ALTER TABLE public.campaign_bulk_damage_operations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.campaign_bulk_damage_operations FROM PUBLIC,anon,authenticated;

-- Os tipos dos reservatórios antigos misturam caixa alta e baixa. Comparar
-- sem diferenciar caixa preserva a proteção já registrada para cada tipo.
CREATE OR REPLACE FUNCTION public.consume_temporary_resource(
 p_character_id uuid,p_resource text,p_amount integer,p_damage_type text DEFAULT NULL
) RETURNS integer LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
DECLARE entry record; used integer:=0; debit integer;
BEGIN
 IF p_amount IS NULL OR p_amount<0 THEN
  RAISE EXCEPTION 'Quantidade inválida para recurso temporário.' USING ERRCODE='22023';
 END IF;
 IF p_amount=0 THEN RETURN 0; END IF;
 FOR entry IN SELECT * FROM public.character_temporary_resources
  WHERE character_id=p_character_id AND resource=p_resource AND remaining>0
   AND (damage_types IS NULL OR EXISTS(
    SELECT 1 FROM unnest(damage_types) AS allowed(damage_type)
    WHERE translate(lower(allowed.damage_type),'áéíóúâêôãõç','aeiouaeoaoc')=
     translate(lower(p_damage_type),'áéíóúâêôãõç','aeiouaeoaoc')))
  ORDER BY created_at,id FOR UPDATE LOOP
  debit:=least(entry.remaining,p_amount-used);
  UPDATE public.character_temporary_resources SET remaining=remaining-debit WHERE id=entry.id;
  used:=used+debit;
  EXIT WHEN used=p_amount;
 END LOOP;
 RETURN used;
END $$;
REVOKE ALL ON FUNCTION public.consume_temporary_resource(uuid,text,integer,text) FROM PUBLIC,anon,authenticated;

-- Confirma dano em área para fichas vinculadas à campanha v2. p_targets contém
-- dano bruto, tipo, resistência declarada, RD, imunidade e PV esperado por alvo.
-- Retorna os recibos e valores aplicados para atualização da interface.
CREATE FUNCTION public.confirm_campaign_bulk_damage(
 p_operation_id uuid,p_campaign_id uuid,p_source text,p_targets jsonb
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE previous public.campaign_bulk_damage_operations; ficha public.characters;
 entry jsonb; fingerprint text; target_id uuid; gross integer; resisted integer;
 rd integer; final_damage integer; temporary_used integer; hp_after integer;
 damage_type text; immune boolean; receipts jsonb:='[]'::jsonb;
 event_id uuid; event_payload jsonb; result jsonb;
BEGIN
 IF auth.uid() IS NULL OR NOT public.is_campaign_master_v2(auth.uid(),p_campaign_id) THEN
  RAISE EXCEPTION 'Somente o mestre da campanha pode aplicar dano em área.' USING ERRCODE='42501';
 END IF;
 IF p_operation_id IS NULL OR p_source IS NULL OR length(trim(p_source)) NOT BETWEEN 1 AND 150
  OR p_targets IS NULL OR jsonb_typeof(p_targets)<>'array' THEN
  RAISE EXCEPTION 'Pedido de dano em área inválido.' USING ERRCODE='22023';
 END IF;
 IF jsonb_array_length(p_targets) NOT BETWEEN 1 AND 30 OR octet_length(p_targets::text)>30000 THEN
  RAISE EXCEPTION 'Lista de alvos inválida.' USING ERRCODE='22023';
 END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(p_targets) AS target(value)
  WHERE jsonb_typeof(target.value)<>'object'
   OR coalesce(target.value->>'characterId','') !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
   OR NOT public.activity_json_integer(target.value->'damage',1,1000000)
   OR NOT public.activity_json_integer(target.value->'resistedDamage',0,1000000)
   OR NOT public.activity_json_integer(target.value->'damageReduction',0,1000000)
   OR NOT public.activity_json_integer(target.value->'expectedHp',0,1000000)
   OR jsonb_typeof(target.value->'immuneDamage') IS DISTINCT FROM 'boolean'
   OR coalesce(lower(trim(target.value->>'damageType')),'') NOT IN
    ('balístico','corte','impacto','perfuração','fogo','frio','eletricidade',
     'químico','sangue','morte','conhecimento','energia',
     'balistico','perfuracao','elétrico','eletrico','quimico')
   OR target.value-ARRAY['characterId','damage','damageType','resistedDamage','damageReduction','immuneDamage','expectedHp']<>'{}'::jsonb
 ) OR EXISTS(SELECT 1 FROM jsonb_array_elements(p_targets) AS target(value)
  GROUP BY target.value->>'characterId' HAVING count(*)>1) THEN
  RAISE EXCEPTION 'Dados dos alvos inválidos ou repetidos.' USING ERRCODE='22023';
 END IF;
 fingerprint:=md5(jsonb_build_array(p_campaign_id,trim(p_source),p_targets)::text);
 PERFORM pg_advisory_xact_lock(hashtextextended(p_operation_id::text,0));
 SELECT * INTO previous FROM public.campaign_bulk_damage_operations WHERE operation_id=p_operation_id;
 IF FOUND THEN
  IF previous.author_id<>auth.uid() OR previous.campaign_id<>p_campaign_id OR previous.request_hash<>fingerprint THEN
   RAISE EXCEPTION 'ID de operação já utilizado para outro pedido.' USING ERRCODE='23505';
  END IF;
  RETURN previous.result;
 END IF;
 -- Ordem estável dos bloqueios evita deadlock entre duas aplicações simultâneas.
 FOR entry IN SELECT value FROM jsonb_array_elements(p_targets) AS target(value)
  ORDER BY target.value->>'characterId' LOOP
  target_id:=(entry->>'characterId')::uuid;
  SELECT c.* INTO ficha FROM public.characters c
   JOIN public.campaign_members_v2 member ON member.character_id=c.id AND member.user_id=c.user_id
   WHERE c.id=target_id AND member.campaign_id=p_campaign_id FOR UPDATE OF c;
  IF NOT FOUND THEN
   RAISE EXCEPTION 'Alvo não vinculado à campanha.' USING ERRCODE='42501';
  END IF;
  IF ficha.hp_current<>(entry->>'expectedHp')::integer THEN
   RAISE EXCEPTION 'PV de um alvo mudou. Atualize antes de aplicar.' USING ERRCODE='40001';
  END IF;
  gross:=(entry->>'damage')::integer;
  resisted:=(entry->>'resistedDamage')::integer;
  rd:=(entry->>'damageReduction')::integer;
  IF resisted>gross THEN RAISE EXCEPTION 'Resistência maior que o dano.' USING ERRCODE='22023'; END IF;
  immune:=(entry->>'immuneDamage')::boolean;
  damage_type:=trim(entry->>'damageType');
  final_damage:=CASE WHEN immune THEN 0 ELSE greatest(0,gross-resisted-rd) END;
  temporary_used:=public.consume_temporary_resource(target_id,'hp',final_damage,damage_type);
  hp_after:=greatest(0,ficha.hp_current-(final_damage-temporary_used));
  UPDATE public.characters SET hp_current=hp_after WHERE id=target_id;
  event_id:=gen_random_uuid();
  event_payload:=jsonb_build_object('kind','campaign_bulk_damage','batchOperationId',p_operation_id,
   'source',trim(p_source),'damageType',damage_type,'grossDamage',gross,
   'declaredResistedDamage',resisted,'declaredDamageReduction',rd,'immuneDamage',immune,
   'finalDamage',final_damage,'temporaryHPUsed',temporary_used,
   'hpBefore',ficha.hp_current,'hpAfter',hp_after,'masterConfirmed',true);
  INSERT INTO public.character_activity_events(id,operation_id,character_id,author_id,category,status,
   payload,request_hash,campaign_id,campaign_version)
  VALUES(event_id,event_id,target_id,auth.uid(),'application','confirmed',event_payload,
   fingerprint,p_campaign_id,'v2');
  receipts:=receipts||jsonb_build_array(jsonb_build_object('characterId',target_id,
   'eventId',event_id,'grossDamage',gross,'finalDamage',final_damage,
   'temporaryHPUsed',temporary_used,'hpBefore',ficha.hp_current,'hpAfter',hp_after));
 END LOOP;
 result:=jsonb_build_object('operationId',p_operation_id,'campaignId',p_campaign_id,
  'source',trim(p_source),'targets',receipts);
 INSERT INTO public.campaign_bulk_damage_operations(operation_id,campaign_id,author_id,request_hash,result)
 VALUES(p_operation_id,p_campaign_id,auth.uid(),fingerprint,result);
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.confirm_campaign_bulk_damage(uuid,uuid,text,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.confirm_campaign_bulk_damage(uuid,uuid,text,jsonb) TO authenticated;
