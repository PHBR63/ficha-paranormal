-- Valida listas de melhorias novas/alteradas; dados legados intactos não são apagados.
-- Executa com os privilégios do chamador e não modifica permissões de acesso à ficha.
CREATE OR REPLACE FUNCTION public.validate_inventory_modifications()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
DECLARE
  item jsonb; previous jsonb; field text; mods jsonb; allowed text[]; ids text[];
  weapon_type text; armor_type text; base_category text; category_index integer;
BEGIN
  IF jsonb_typeof(NEW.inventory::jsonb) <> 'array' THEN RETURN NEW; END IF;
  FOR item IN SELECT value FROM jsonb_array_elements(NEW.inventory::jsonb) LOOP
    previous := NULL;
    IF TG_OP = 'UPDATE' THEN
      SELECT value INTO previous FROM jsonb_array_elements(OLD.inventory::jsonb)
      WHERE value->>'id' = item->>'id' LIMIT 1;
    END IF;
    FOREACH field IN ARRAY ARRAY['appliedModifications','appliedArmorModifications','appliedAccessoryModifications','appliedAmmoModifications'] LOOP
      mods := COALESCE(NULLIF(item->field, 'null'::jsonb), '[]'::jsonb);
      -- Não impedir alterações sem relação com melhorias legadas.
      IF mods = COALESCE(NULLIF(previous->field, 'null'::jsonb), '[]'::jsonb) THEN CONTINUE; END IF;
      IF jsonb_typeof(mods) <> 'array' THEN RAISE EXCEPTION 'A lista de modificações é inválida.' USING ERRCODE='22023'; END IF;
      SELECT array_agg(value) INTO ids FROM jsonb_array_elements_text(mods);
      ids := COALESCE(ids, ARRAY[]::text[]);
      IF cardinality(ids) <> (SELECT count(DISTINCT id) FROM unnest(ids) id) THEN
        RAISE EXCEPTION 'A mesma modificação não pode ser repetida no item.' USING ERRCODE='22023';
      END IF;
      IF cardinality(ids) = 0 THEN CONTINUE; END IF;
      IF field = 'appliedModifications' THEN
        weapon_type := item->>'weaponType';
        allowed := CASE WHEN weapon_type = 'firearm' THEN ARRAY['alongada','calibre_grosso','compensador','discreta_firearm','ferrolho_automatico','mira_laser','mira_telescopica','silenciador','tatica_firearm','visao_de_calor']
          WHEN weapon_type IN ('melee','ranged') THEN ARRAY['certeira','cruel','discreta_melee','perigosa','tatica_melee'] ELSE ARRAY[]::text[] END;
        IF 'compensador' = ANY(ids) AND NOT ('ferrolho_automatico' = ANY(ids)) AND COALESCE((item->'properties')::text,'') !~* 'autom' THEN
          RAISE EXCEPTION 'Compensador exige uma arma automática.' USING ERRCODE='22023';
        END IF;
      ELSIF field = 'appliedArmorModifications' THEN
        armor_type := item->>'armorType';
        allowed := CASE armor_type WHEN 'leve' THEN ARRAY['discreta','reforcada'] WHEN 'pesada' THEN ARRAY['antibombas','blindada','reforcada'] WHEN 'escudo' THEN ARRAY['reforcada'] ELSE ARRAY[]::text[] END;
        IF ids @> ARRAY['discreta','reforcada'] THEN RAISE EXCEPTION 'Discreta e Reforçada não podem coexistir.' USING ERRCODE='22023'; END IF;
      ELSIF field = 'appliedAmmoModifications' THEN
        allowed := ARRAY['dum_dum','explosiva'];
        IF item->>'catalogType' IS DISTINCT FROM 'municao' AND item->>'itemType' IS DISTINCT FROM 'consumable' THEN RAISE EXCEPTION 'A melhoria deve ser aplicada ao item de munição, não à arma.' USING ERRCODE='22023'; END IF;
        IF NOT (COALESCE(item->>'catalogId','') IN ('municao_curta','municao_longa') OR
          (NOT (item ? 'catalogId') AND (COALESCE(item->>'ammoType','') IN ('balas_curtas','balas_longas') OR item->>'name' IN ('Balas Curtas','Balas Longas','Munição Curta','Munição Longa')))) THEN
          RAISE EXCEPTION 'Somente balas curtas e longas recebem modificações de munição.' USING ERRCODE='22023';
        END IF;
      ELSE
        allowed := ARRAY['aprimorado','aprimorado_adicional','discreto','funcao_adicional','instrumental'];
        IF item->>'catalogType' IS DISTINCT FROM 'acessorio' THEN RAISE EXCEPTION 'Somente acessórios recebem estas modificações.' USING ERRCODE='22023'; END IF;
        IF 'aprimorado_adicional' = ANY(ids) AND NOT ('funcao_adicional' = ANY(ids)) THEN RAISE EXCEPTION 'Aprimorado adicional exige Função Adicional.' USING ERRCODE='22023'; END IF;
      END IF;
      IF NOT (ids <@ allowed) THEN RAISE EXCEPTION 'Modificação incompatível com o tipo do item.' USING ERRCODE='22023'; END IF;
      base_category := item->>CASE field WHEN 'appliedModifications' THEN 'baseCategory' WHEN 'appliedArmorModifications' THEN 'baseArmorCategory' WHEN 'appliedAccessoryModifications' THEN 'baseAccessoryCategory' ELSE 'baseAmmoCategory' END;
      -- Bases explícitas permitem conferir a categoria, sem adivinhar bases de itens legados.
      IF base_category IS NOT NULL THEN
        category_index := array_position(ARRAY['0','I','II','III','IV'], base_category);
        IF category_index IS NULL OR category_index + cardinality(ids) > 5 THEN RAISE EXCEPTION 'As melhorias ultrapassam a categoria suportada pelo inventário.' USING ERRCODE='22023'; END IF;
        IF item->>'category' IS DISTINCT FROM (ARRAY['0','I','II','III','IV'])[category_index + cardinality(ids)] THEN RAISE EXCEPTION 'A categoria não corresponde às modificações do item.' USING ERRCODE='22023'; END IF;
      END IF;
    END LOOP;
  END LOOP;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS validate_inventory_modifications ON public.characters;
CREATE TRIGGER validate_inventory_modifications BEFORE INSERT OR UPDATE OF inventory ON public.characters
FOR EACH ROW EXECUTE FUNCTION public.validate_inventory_modifications();
