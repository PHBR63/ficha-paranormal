-- ============================================================================
-- CORREÇÃO DE SEGURANÇA: Proteção explícita contra acesso não autenticado
-- ============================================================================
-- Problema: A tabela 'profiles' não tinha política explícita bloqueando
-- acesso de usuários anônimos (não autenticados).
-- 
-- Solução: Adicionar política RESTRICTIVE que exige auth.uid() IS NOT NULL
-- para TODAS as operações SELECT na tabela profiles.
-- ============================================================================

-- Política RESTRICTIVA que bloqueia explicitamente acesso não autenticado
-- Políticas RESTRICTIVAS são combinadas com AND, então esta política
-- deve ser satisfeita ALÉM das políticas PERMISSIVAS existentes
CREATE POLICY "Block unauthenticated access to profiles"
ON public.profiles
AS RESTRICTIVE
FOR SELECT
TO public
USING (auth.uid() IS NOT NULL);

-- Comentário explicativo para documentação
COMMENT ON POLICY "Block unauthenticated access to profiles" ON public.profiles IS 
'Política de segurança RESTRICTIVA que impede explicitamente que usuários não autenticados 
acessem dados de perfil. Esta política é combinada com AND com outras políticas, 
garantindo que apenas usuários autenticados possam acessar a tabela.';