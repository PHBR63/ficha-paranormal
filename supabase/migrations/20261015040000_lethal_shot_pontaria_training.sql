-- Livro Base v1.3, p. 87: somente quem é treinado em Pontaria pode usar Mirar.
-- A função anterior permanece como núcleo; esta guarda acrescenta o requisito sem alterar
-- as validações, o débito e o recibo transacional dos ataques já existentes.
DO $migration$
BEGIN
  IF to_regprocedure('public.confirm_character_combat_attack_without_pontaria_guard(uuid,uuid,integer,integer,text,jsonb,jsonb)') IS NULL THEN
    ALTER FUNCTION public.confirm_character_combat_attack(uuid,uuid,integer,integer,text,jsonb,jsonb)
      RENAME TO confirm_character_combat_attack_without_pontaria_guard;
  END IF;
END $migration$;

REVOKE ALL ON FUNCTION public.confirm_character_combat_attack_without_pontaria_guard(uuid,uuid,integer,integer,text,jsonb,jsonb)
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.confirm_character_combat_attack(
  p_operation_id uuid, p_character_id uuid, p_expected_pe integer,
  p_expected_cost integer, p_expected_turn_key text, p_selection jsonb, p_payload jsonb
) RETURNS public.character_activity_events
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $function$
DECLARE
  training integer;
BEGIN
  -- Trava e autoriza antes de ler a ficha; o núcleo repete a checagem após a guarda.
  PERFORM public.lock_character_pe_turn(p_character_id);
  IF p_selection->'lethalShot' = 'true'::jsonb THEN
    SELECT coalesce(max(CASE WHEN value #>> '{}' ~ '^[0-3]$'
      THEN (value #>> '{}')::integer ELSE 0 END), 0)
      INTO training
      FROM public.characters c, jsonb_each(coalesce(c.skills, '{}'::jsonb)) skill
      WHERE c.id = p_character_id AND lower(trim(skill.key)) = 'pontaria';
    IF training < 1 THEN
      RAISE EXCEPTION 'Mirar exige Pontaria treinada.' USING ERRCODE = '22023';
    END IF;
  END IF;
  RETURN public.confirm_character_combat_attack_without_pontaria_guard(
    p_operation_id, p_character_id, p_expected_pe, p_expected_cost,
    p_expected_turn_key, p_selection, p_payload
  );
END $function$;

REVOKE ALL ON FUNCTION public.confirm_character_combat_attack(uuid,uuid,integer,integer,text,jsonb,jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.confirm_character_combat_attack(uuid,uuid,integer,integer,text,jsonb,jsonb) TO authenticated;
