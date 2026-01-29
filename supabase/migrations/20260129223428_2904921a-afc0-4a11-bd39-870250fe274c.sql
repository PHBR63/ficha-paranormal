-- Corrige recursão/500 em policies v2 removendo subqueries cruzadas (campaigns_v2 <-> campaign_members_v2)
-- e padroniza checagens via funções SECURITY DEFINER (bypass de RLS).

-- 1) Funções v2 (SECURITY DEFINER) para checagem de acesso
CREATE OR REPLACE FUNCTION public.is_campaign_master_v2(_user_id uuid, _campaign_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.campaigns_v2
    WHERE id = _campaign_id
      AND master_id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_campaign_member_v2(_user_id uuid, _campaign_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.campaign_members_v2
    WHERE campaign_id = _campaign_id
      AND user_id = _user_id
  );
$$;

-- 2) campaigns_v2
DROP POLICY IF EXISTS "Campanhas visíveis para membros" ON public.campaigns_v2;

CREATE POLICY "Campanhas visíveis para membros" ON public.campaigns_v2
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND (
    auth.uid() = master_id
    OR public.is_campaign_member_v2(auth.uid(), id)
  )
);

-- 3) campaign_members_v2
DROP POLICY IF EXISTS "Membros visíveis para todos da campanha" ON public.campaign_members_v2;

CREATE POLICY "Membros visíveis para todos da campanha" ON public.campaign_members_v2
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND (
    public.is_campaign_member_v2(auth.uid(), campaign_id)
    OR public.is_campaign_master_v2(auth.uid(), campaign_id)
  )
);

-- 4) campaign_messages_v2
DROP POLICY IF EXISTS "Mensagens visíveis para membros" ON public.campaign_messages_v2;
DROP POLICY IF EXISTS "Membros podem enviar mensagens" ON public.campaign_messages_v2;

CREATE POLICY "Mensagens visíveis para membros" ON public.campaign_messages_v2
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND (
    public.is_campaign_member_v2(auth.uid(), campaign_id)
    OR public.is_campaign_master_v2(auth.uid(), campaign_id)
  )
);

CREATE POLICY "Membros podem enviar mensagens" ON public.campaign_messages_v2
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND auth.uid() = user_id
  AND (
    public.is_campaign_member_v2(auth.uid(), campaign_id)
    OR public.is_campaign_master_v2(auth.uid(), campaign_id)
  )
);

-- 5) campaign_sessions_v2
DROP POLICY IF EXISTS "Sessões visíveis para membros" ON public.campaign_sessions_v2;
DROP POLICY IF EXISTS "Mestre gerencia sessões" ON public.campaign_sessions_v2;

CREATE POLICY "Sessões visíveis para membros" ON public.campaign_sessions_v2
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND (
    public.is_campaign_member_v2(auth.uid(), campaign_id)
    OR public.is_campaign_master_v2(auth.uid(), campaign_id)
  )
);

-- Mantém a intenção original (mestre gerencia), mas sem subquery direta
CREATE POLICY "Mestre gerencia sessões" ON public.campaign_sessions_v2
FOR ALL
USING (
  auth.uid() IS NOT NULL
  AND public.is_campaign_master_v2(auth.uid(), campaign_id)
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND public.is_campaign_master_v2(auth.uid(), campaign_id)
);
