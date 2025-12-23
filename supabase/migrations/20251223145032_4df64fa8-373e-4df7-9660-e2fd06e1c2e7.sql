-- ============================================================
-- Políticas RLS para bloquear acesso anônimo explicitamente
-- Todas as tabelas devem negar acesso quando auth.uid() IS NULL
-- ============================================================

-- 1. profiles - Bloquear acesso anônimo
CREATE POLICY "Block anonymous access to profiles"
ON public.profiles
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- 2. push_subscriptions - Bloquear acesso anônimo
CREATE POLICY "Block anonymous access to push_subscriptions"
ON public.push_subscriptions
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- 3. campaign_invites - Bloquear acesso anônimo
CREATE POLICY "Block anonymous access to campaign_invites"
ON public.campaign_invites
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- 4. characters - Bloquear acesso anônimo
CREATE POLICY "Block anonymous access to characters"
ON public.characters
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- 5. campaigns - Bloquear acesso anônimo
CREATE POLICY "Block anonymous access to campaigns"
ON public.campaigns
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- 6. campaign_messages - Bloquear acesso anônimo
CREATE POLICY "Block anonymous access to campaign_messages"
ON public.campaign_messages
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- 7. campaign_notes - Bloquear acesso anônimo
CREATE POLICY "Block anonymous access to campaign_notes"
ON public.campaign_notes
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- 8. user_roles - Bloquear acesso anônimo
CREATE POLICY "Block anonymous access to user_roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- 9. audit_logs - Bloquear acesso anônimo
CREATE POLICY "Block anonymous access to audit_logs"
ON public.audit_logs
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- 10. campaign_sessions - Bloquear acesso anônimo
CREATE POLICY "Block anonymous access to campaign_sessions"
ON public.campaign_sessions
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- 11. campaign_ritual_casts - Bloquear acesso anônimo
CREATE POLICY "Block anonymous access to campaign_ritual_casts"
ON public.campaign_ritual_casts
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- 12. character_change_history - Bloquear acesso anônimo
CREATE POLICY "Block anonymous access to character_change_history"
ON public.character_change_history
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- 13. character_removed_powers - Bloquear acesso anônimo
CREATE POLICY "Block anonymous access to character_removed_powers"
ON public.character_removed_powers
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- 14. character_power_choices - Bloquear acesso anônimo
CREATE POLICY "Block anonymous access to character_power_choices"
ON public.character_power_choices
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- 15. character_sustained_rituals - Bloquear acesso anônimo
CREATE POLICY "Block anonymous access to character_sustained_rituals"
ON public.character_sustained_rituals
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- 16. campaign_members - Bloquear acesso anônimo
CREATE POLICY "Block anonymous access to campaign_members"
ON public.campaign_members
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Também bloquear INSERT/UPDATE/DELETE anônimo em tabelas críticas

-- push_subscriptions - INSERT anônimo
CREATE POLICY "Block anonymous insert to push_subscriptions"
ON public.push_subscriptions
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- push_subscriptions - UPDATE anônimo
CREATE POLICY "Block anonymous update to push_subscriptions"
ON public.push_subscriptions
FOR UPDATE
USING (auth.uid() IS NOT NULL);

-- push_subscriptions - DELETE anônimo
CREATE POLICY "Block anonymous delete to push_subscriptions"
ON public.push_subscriptions
FOR DELETE
USING (auth.uid() IS NOT NULL);

-- characters - INSERT anônimo
CREATE POLICY "Block anonymous insert to characters"
ON public.characters
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- characters - UPDATE anônimo
CREATE POLICY "Block anonymous update to characters"
ON public.characters
FOR UPDATE
USING (auth.uid() IS NOT NULL);

-- characters - DELETE anônimo
CREATE POLICY "Block anonymous delete to characters"
ON public.characters
FOR DELETE
USING (auth.uid() IS NOT NULL);

-- campaign_members - INSERT anônimo
CREATE POLICY "Block anonymous insert to campaign_members"
ON public.campaign_members
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- campaign_members - UPDATE anônimo
CREATE POLICY "Block anonymous update to campaign_members"
ON public.campaign_members
FOR UPDATE
USING (auth.uid() IS NOT NULL);

-- campaign_members - DELETE anônimo
CREATE POLICY "Block anonymous delete to campaign_members"
ON public.campaign_members
FOR DELETE
USING (auth.uid() IS NOT NULL);