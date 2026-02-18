-- ============================================================
-- Políticas RLS para acesso administrativo às campanhas
-- Usa a função is_admin() já existente (SECURITY DEFINER)
-- ============================================================

-- campaigns: SELECT, UPDATE, DELETE para admins
CREATE POLICY "Admins can view all campaigns"
ON public.campaigns FOR SELECT
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update all campaigns"
ON public.campaigns FOR UPDATE
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete all campaigns"
ON public.campaigns FOR DELETE
USING (is_admin(auth.uid()));

-- campaigns_v2: SELECT, UPDATE, DELETE para admins
CREATE POLICY "Admins can view all campaigns_v2"
ON public.campaigns_v2 FOR SELECT
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update all campaigns_v2"
ON public.campaigns_v2 FOR UPDATE
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete all campaigns_v2"
ON public.campaigns_v2 FOR DELETE
USING (is_admin(auth.uid()));

-- campaign_members: SELECT para admins (leitura para contar membros)
CREATE POLICY "Admins can view all campaign_members"
ON public.campaign_members FOR SELECT
USING (is_admin(auth.uid()));

-- campaign_members_v2: SELECT para admins
CREATE POLICY "Admins can view all campaign_members_v2"
ON public.campaign_members_v2 FOR SELECT
USING (is_admin(auth.uid()));