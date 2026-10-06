-- Corrige os guards antigos: autenticação é requisito, não autorização por si só.
-- Preserva nomes, comandos e regras permissivas específicas de dono/membro/admin.
-- Não altera tabelas, registros ou privilégios de aplicação em outra ficha.
DO $migration$
DECLARE
  guard record;
  policy_sql text;
BEGIN
  FOR guard IN
    SELECT * FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = ANY (ARRAY[
        'profiles', 'push_subscriptions', 'campaign_invites', 'characters',
        'campaigns', 'campaign_messages', 'campaign_notes', 'user_roles',
        'audit_logs', 'campaign_sessions', 'campaign_ritual_casts',
        'character_change_history', 'character_removed_powers',
        'character_power_choices', 'character_sustained_rituals',
        'campaign_members', 'character_templates', 'template_ratings',
        'template_applications'
      ])
      AND policyname LIKE 'Block anonymous%'
      AND permissive = 'PERMISSIVE'
    ORDER BY tablename, policyname
  LOOP
    -- Aborta diante de drift; não substitui uma expressão diferente por suposição.
    IF guard.roles <> ARRAY['public']::name[]
      OR (guard.qual IS NOT NULL AND guard.qual <> '(auth.uid() IS NOT NULL)')
      OR (guard.with_check IS NOT NULL AND guard.with_check <> '(auth.uid() IS NOT NULL)')
      OR (guard.qual IS NULL AND guard.with_check IS NULL) THEN
      RAISE EXCEPTION 'Guard inesperado em %.%: %', guard.schemaname, guard.tablename, guard.policyname;
    END IF;

    EXECUTE format('DROP POLICY %I ON %I.%I', guard.policyname, guard.schemaname, guard.tablename);
    policy_sql := format('CREATE POLICY %I ON %I.%I AS RESTRICTIVE FOR %s TO PUBLIC',
      guard.policyname, guard.schemaname, guard.tablename, guard.cmd);
    IF guard.qual IS NOT NULL THEN
      policy_sql := policy_sql || ' USING (auth.uid() IS NOT NULL)';
    END IF;
    IF guard.with_check IS NOT NULL THEN
      policy_sql := policy_sql || ' WITH CHECK (auth.uid() IS NOT NULL)';
    END IF;
    EXECUTE policy_sql;
  END LOOP;
END;
$migration$;
