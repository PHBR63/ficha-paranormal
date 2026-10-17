-- Livro Base v1.3, p.25: Saque Rápido altera sacar e guardar para ação livre.
-- Substitui somente a função de confirmação; não altera fichas ou recibos anteriores.
CREATE OR REPLACE FUNCTION public.confirm_character_item_action(p_operation_id uuid,p_character_id uuid,p_request jsonb)
RETURNS public.character_activity_events LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE c public.characters; item jsonb; mods jsonb; receipt public.character_activity_events;
 action text:=p_request->>'action'; slot text:=p_request->>'slot'; fingerprint text;
 cost text; conceal integer:=0; equipment integer:=0; training integer:=0; other integer:=0;
 attribute integer; penalty integer:=0; extra integer:=0; count_dice integer; keep_low boolean; dice jsonb:='[]'; kept integer; die integer;
 two_hands boolean; quick_draw boolean:=false; initiative_level integer:=0;
 next_inventory jsonb; result jsonb; payload jsonb; approval jsonb;
BEGIN
 IF NOT public.can_manage_character_activity(p_character_id) THEN RAISE EXCEPTION 'Ficha não autorizada.' USING ERRCODE='42501'; END IF;
 IF p_operation_id IS NULL OR jsonb_typeof(p_request) IS DISTINCT FROM 'object' OR octet_length(p_request::text)>64000
 OR action IS NULL OR action NOT IN ('conceal','draw','stow') OR p_request->'requirementsConfirmed' IS DISTINCT FROM 'true'::jsonb THEN
  RAISE EXCEPTION 'Confirme a ação disponível e os requisitos físicos.' USING ERRCODE='22023'; END IF;
 fingerprint:=md5(jsonb_build_array(p_character_id,p_request)::text);
 PERFORM pg_advisory_xact_lock(hashtextextended(p_operation_id::text,0));
 SELECT * INTO c FROM public.characters WHERE id=p_character_id FOR UPDATE;
 SELECT * INTO receipt FROM public.character_activity_events WHERE operation_id=p_operation_id;
 IF FOUND THEN
  IF receipt.author_id<>auth.uid() OR receipt.request_hash<>fingerprint THEN RAISE EXCEPTION 'Operação reutilizada.' USING ERRCODE='23505'; END IF;
  RETURN receipt;
 END IF;
 -- A identidade deve ser única, e a comparação integral preserva modificações concorrentes.
 IF (SELECT count(*) FROM jsonb_array_elements(c.inventory) WHERE value->>'id'=p_request->'item'->>'id')<>1 THEN
  RAISE EXCEPTION 'Item ausente ou identidade duplicada. Confira o inventário.' USING ERRCODE='40001'; END IF;
 SELECT value INTO item FROM jsonb_array_elements(c.inventory) WHERE value->>'id'=p_request->'item'->>'id';
 IF item IS DISTINCT FROM p_request->'item' THEN RAISE EXCEPTION 'O item mudou. Atualize a ficha.' USING ERRCODE='40001'; END IF;
 IF coalesce((item->>'quantity')::integer,1)<=0 THEN RAISE EXCEPTION 'O item não tem quantidade disponível.' USING ERRCODE='55004'; END IF;
 mods:=coalesce(item->'appliedModifications','[]')||coalesce(item->'appliedArmorModifications','[]')||coalesce(item->'appliedAccessoryModifications','[]');
 -- A posse e o pré-requisito são lidos da ficha bloqueada, nunca da declaração do cliente.
 SELECT EXISTS(SELECT 1 FROM jsonb_array_elements(
  CASE WHEN jsonb_typeof(c.powers)='array' THEN c.powers ELSE '[]'::jsonb END ||
  CASE WHEN jsonb_typeof(c.abilities)='array' THEN c.abilities ELSE '[]'::jsonb END) p
  WHERE lower(trim(coalesce(p->>'id',''))) IN ('saque-rapido','saque-rapido-esp','saque_rapido')
   OR lower(trim(coalesce(p->>'name',''))) IN ('saque rápido','saque rapido')
   OR lower(trim(p #>> '{}')) IN ('saque-rapido','saque-rapido-esp','saque rápido','saque rapido')) INTO quick_draw;
 SELECT coalesce((value #>> '{}')::integer,0) INTO initiative_level FROM jsonb_each(c.skills)
 WHERE lower(trim(key)) IN ('iniciativa','initiative') LIMIT 1;
 initiative_level:=coalesce(initiative_level,0);
 -- Poderes legados sem o pré-requisito não concedem uma ação gratuita.
 quick_draw:=quick_draw AND initiative_level BETWEEN 1 AND 3;
 cost:=CASE WHEN action='conceal' THEN 'padrão' WHEN quick_draw THEN 'livre'
  WHEN action='draw' AND (mods ? 'tatica_melee' OR mods ? 'tatica_firearm') THEN 'livre' ELSE 'movimento' END;
 IF action='conceal' THEN
  IF (item->>'itemType'='weapon' AND (mods ? 'discreta_melee' OR mods ? 'discreta_firearm'))
   OR (item->>'itemType'='armor' AND item->>'armorType'='leve' AND mods ? 'discreta' AND NOT mods ? 'reforcada')
   OR (item->>'catalogType'='acessorio' AND mods ? 'discreto') THEN conceal:=5; END IF;
  SELECT coalesce((value #>> '{}')::integer,0) INTO training FROM jsonb_each(c.skills) WHERE lower(trim(key))='crime';
  training:=coalesce(training,0);
  IF training NOT BETWEEN 0 AND 3 OR (training=0 AND conceal=0) THEN RAISE EXCEPTION 'Crime exige treino ou uma modificação que permita ocultar este item sem treino.' USING ERRCODE='55004'; END IF;
  IF p_request->'expectedAgility' IS DISTINCT FROM to_jsonb(c.agility) OR p_request->'expectedSkills' IS DISTINCT FROM c.skills
   OR p_request->'expectedConditions' IS DISTINCT FROM c.conditions THEN RAISE EXCEPTION 'A ficha mudou. Atualize os bônus antes de rolar.' USING ERRCODE='40001'; END IF;
  -- Demais efeitos do SUE são declarados pela ficha e ficam explicitados no recibo.
  IF coalesce(p_request->>'otherBonuses','') !~ '^-?[0-9]{1,3}$' OR coalesce(p_request->>'dicePenalty','') !~ '^[0-9]{1,2}$'
   OR coalesce(p_request->>'extraDice','') !~ '^[0-9]{1,2}$' THEN RAISE EXCEPTION 'Bônus e dados inválidos.' USING ERRCODE='22023'; END IF;
  other:=(p_request->>'otherBonuses')::integer; penalty:=(p_request->>'dicePenalty')::integer; extra:=(p_request->>'extraDice')::integer;
  IF abs(other)>100 OR penalty>10 OR extra>10 OR c.agility NOT BETWEEN 0 AND 5 THEN RAISE EXCEPTION 'Confira atributo e modificadores antes do teste.' USING ERRCODE='22023'; END IF;
  approval:=public.get_character_accessories(p_character_id);
  equipment:=greatest(conceal,coalesce((approval->'bonuses'->>'crime')::integer,0));
  attribute:=c.agility;
  IF attribute=0 THEN count_dice:=2+penalty; keep_low:=true;
  ELSIF attribute+extra-penalty>=1 THEN count_dice:=attribute+extra-penalty; keep_low:=false;
  ELSE count_dice:=attribute+extra+penalty; keep_low:=true; END IF;
  FOR i IN 1..count_dice LOOP
   die:=floor(random()*20)::integer+1; dice:=dice||to_jsonb(die);
   kept:=CASE WHEN kept IS NULL THEN die WHEN keep_low THEN least(kept,die) ELSE greatest(kept,die) END;
  END LOOP;
  result:=jsonb_build_object('label','Ocultar: '||(item->>'name'),'dice',dice,'keptDice',kept,
   'skillBonus',training*5,'otherBonuses',equipment+other,'total',kept+training*5+equipment+other,
   'isDisadvantage',keep_low,'equipmentBonus',equipment,'modificationBonus',conceal,'declaredOtherBonuses',other,
   'dicePenalty',penalty,'extraDice',extra,'opposedResolution','pending','observerSearchBonus',10);
 ELSE
  IF item->>'itemType' IS DISTINCT FROM 'weapon' THEN RAISE EXCEPTION 'Este controle de saque é para armas.' USING ERRCODE='22023'; END IF;
  IF action='draw' THEN
   IF item->'isEquipped'='true'::jsonb THEN RAISE EXCEPTION 'A arma já está sacada/equipada.' USING ERRCODE='55004'; END IF;
   IF slot IS NULL OR slot NOT IN ('primary_weapon','secondary_weapon') THEN RAISE EXCEPTION 'Escolha o slot da arma.' USING ERRCODE='22023'; END IF;
   SELECT coalesce(bool_or(lower(value #>> '{}') LIKE '%duas mãos%' OR lower(value #>> '{}') LIKE '%duas maos%'),false)
    INTO two_hands FROM jsonb_array_elements(coalesce(item->'properties','[]'));
   IF two_hands AND slot<>'primary_weapon' THEN RAISE EXCEPTION 'Arma de duas mãos exige o slot principal.' USING ERRCODE='55004'; END IF;
   IF (SELECT count(*) FROM jsonb_array_elements(c.inventory) i WHERE i->'isEquipped'='true'::jsonb AND i->>'equipSlot' IN ('primary_weapon','secondary_weapon','shield')) + (CASE WHEN two_hands THEN 2 ELSE 1 END) > 2 THEN
    RAISE EXCEPTION 'Não há mãos livres. Guarde primeiro o item conflitante.' USING ERRCODE='55004'; END IF;
   IF EXISTS(SELECT 1 FROM jsonb_array_elements(c.inventory) i WHERE i->'isEquipped'='true'::jsonb AND
    (i->>'equipSlot'=slot OR (two_hands AND i->>'equipSlot' IN ('secondary_weapon','shield'))
     OR (slot='secondary_weapon' AND i->>'equipSlot'='shield')
     OR (i->>'equipSlot'='primary_weapon' AND EXISTS(SELECT 1 FROM jsonb_array_elements(coalesce(i->'properties','[]')) p WHERE lower(p #>> '{}') LIKE '%duas mãos%' OR lower(p #>> '{}') LIKE '%duas maos%')))) THEN
    RAISE EXCEPTION 'Mãos ou slot ocupados. Guarde primeiro o item conflitante.' USING ERRCODE='55004'; END IF;
   item:=item||jsonb_build_object('isEquipped',true,'equipSlot',slot);
  ELSE
   IF item->'isEquipped' IS DISTINCT FROM 'true'::jsonb THEN RAISE EXCEPTION 'A arma já está guardada.' USING ERRCODE='55004'; END IF;
   item:=(item-'equipSlot')||jsonb_build_object('isEquipped',false);
  END IF;
  SELECT jsonb_agg(CASE WHEN value->>'id'=item->>'id' THEN item ELSE value END ORDER BY ordinality)
   INTO next_inventory FROM jsonb_array_elements(c.inventory) WITH ORDINALITY;
  UPDATE public.characters SET inventory=next_inventory WHERE id=p_character_id;
 END IF;
 payload:=jsonb_build_object('kind','item_action','itemName',item->>'name','action',action,'actionCost',cost,
  'requirementsDeclared',true,'actionAvailability','table_checked','peCost',0,'result',result,
  'equipmentState',CASE WHEN action='conceal' THEN null ELSE item->'isEquipped' END);
 INSERT INTO public.character_activity_events(id,operation_id,character_id,author_id,category,status,payload,request_hash)
 VALUES(p_operation_id,p_operation_id,p_character_id,auth.uid(),CASE WHEN action='conceal' THEN 'roll' ELSE 'application' END,'confirmed',payload,fingerprint)
 RETURNING * INTO receipt;
 RETURN receipt;
END $$;
REVOKE ALL ON FUNCTION public.confirm_character_item_action(uuid,uuid,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.confirm_character_item_action(uuid,uuid,jsonb) TO authenticated;


