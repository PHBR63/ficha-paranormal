-- =====================================================
-- CORREÇÃO DE SEGURANÇA: Tabela profiles
-- =====================================================

-- Remover políticas antigas problemáticas (RESTRICTIVE)
DROP POLICY IF EXISTS "Block unauthenticated access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Campaign members can view fellow members profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can update own profile" ON public.profiles;

-- Criar políticas PERMISSIVE corretas
-- Política 1: Usuários autenticados podem ver seu próprio perfil
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Política 2: Admins podem ver todos os perfis
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Política 3: Membros de campanha podem ver perfis de outros membros da mesma campanha
CREATE POLICY "Campaign members can view fellow member profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM campaign_members cm1
    JOIN campaign_members cm2 ON cm1.campaign_id = cm2.campaign_id
    WHERE cm1.user_id = auth.uid()
      AND cm2.user_id = profiles.user_id
  )
);

-- Política 4: Usuários podem inserir seu próprio perfil
CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Política 5: Usuários podem atualizar seu próprio perfil
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- CORREÇÃO DE SEGURANÇA: Tabela push_subscriptions
-- =====================================================

-- Remover política antiga
DROP POLICY IF EXISTS "Users can manage their own subscriptions" ON public.push_subscriptions;

-- Criar políticas granulares para push_subscriptions
-- Política 1: Usuários autenticados podem ver suas próprias subscrições
CREATE POLICY "Users can view own push subscriptions"
ON public.push_subscriptions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Política 2: Usuários autenticados podem inserir suas próprias subscrições
CREATE POLICY "Users can insert own push subscriptions"
ON public.push_subscriptions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Política 3: Usuários autenticados podem atualizar suas próprias subscrições
CREATE POLICY "Users can update own push subscriptions"
ON public.push_subscriptions
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Política 4: Usuários autenticados podem deletar suas próprias subscrições
CREATE POLICY "Users can delete own push subscriptions"
ON public.push_subscriptions
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- =====================================================
-- FUNÇÃO AUXILIAR PARA VALIDAÇÃO DE NOTIFICAÇÕES PUSH
-- =====================================================

-- Função para buscar subscrições de forma segura (para uso em edge functions)
CREATE OR REPLACE FUNCTION public.get_push_subscriptions_for_campaign(
  _campaign_id uuid,
  _user_ids uuid[] DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  endpoint text,
  p256dh text,
  auth text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ps.id,
    ps.user_id,
    ps.endpoint,
    ps.p256dh,
    ps.auth
  FROM push_subscriptions ps
  WHERE ps.user_id IN (
    SELECT cm.user_id 
    FROM campaign_members cm 
    WHERE cm.campaign_id = _campaign_id
  )
  AND (_user_ids IS NULL OR ps.user_id = ANY(_user_ids));
END;
$$;

-- Revogar acesso direto à função para usuários anônimos
REVOKE ALL ON FUNCTION public.get_push_subscriptions_for_campaign FROM anon;
GRANT EXECUTE ON FUNCTION public.get_push_subscriptions_for_campaign TO authenticated;