-- =====================================================
-- CORREÇÃO DE SEGURANÇA: Tabela profiles
-- Problema: Dados de perfil expostos a usuários não autenticados
-- Solução: Garantir que todas as operações exijam autenticação
-- =====================================================

-- 1. Remover políticas de SELECT antigas
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- 2. Criar políticas PERMISSIVE seguras que exigem autenticação

-- Usuários autenticados podem ver seu próprio perfil
CREATE POLICY "Authenticated users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admins autenticados podem ver todos os perfis
CREATE POLICY "Authenticated admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Membros de campanha podem ver perfis de outros membros (necessário para exibir nomes)
CREATE POLICY "Campaign members can view fellow members profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM campaign_members cm1
    JOIN campaign_members cm2 ON cm1.campaign_id = cm2.campaign_id
    WHERE cm1.user_id = auth.uid() 
    AND cm2.user_id = profiles.user_id
  )
);

-- 3. Garantir que INSERT e UPDATE também exijam autenticação
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Authenticated users can insert own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. Adicionar comentário de documentação
COMMENT ON TABLE public.profiles IS 'Perfis de usuários - Acesso restrito apenas a usuários autenticados. Políticas RLS aplicadas.';