-- Corrigir políticas RLS da tabela profiles para exigir autenticação
-- Remove políticas antigas de SELECT que podem permitir acesso anônimo
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Campaign members can view fellow member profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Recria políticas com verificação explícita de autenticação
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Campaign members can view fellow member profiles"
ON public.profiles
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1
    FROM campaign_members cm1
    JOIN campaign_members cm2 ON cm1.campaign_id = cm2.campaign_id
    WHERE cm1.user_id = auth.uid() AND cm2.user_id = profiles.user_id
  )
);