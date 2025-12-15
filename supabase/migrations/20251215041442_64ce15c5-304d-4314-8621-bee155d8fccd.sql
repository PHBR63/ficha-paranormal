-- Corrige recursão infinita: a política de campaign_members referencia a si mesma
-- Remove e recria com função security definer

-- Remove política problemática
DROP POLICY IF EXISTS "Members can view campaign members" ON campaign_members;

-- Cria função security definer para verificar se usuário é membro
CREATE OR REPLACE FUNCTION public.is_campaign_member(_user_id uuid, _campaign_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM campaign_members
    WHERE user_id = _user_id AND campaign_id = _campaign_id
  )
$$;

-- Cria função para verificar se é mestre
CREATE OR REPLACE FUNCTION public.is_campaign_master(_user_id uuid, _campaign_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM campaigns
    WHERE id = _campaign_id AND master_id = _user_id
  )
$$;

-- Recria política sem recursão usando as funções
CREATE POLICY "Members can view campaign members"
ON campaign_members
FOR SELECT
USING (
  user_id = auth.uid()
  OR public.is_campaign_master(auth.uid(), campaign_id)
  OR public.is_campaign_member(auth.uid(), campaign_id)
);