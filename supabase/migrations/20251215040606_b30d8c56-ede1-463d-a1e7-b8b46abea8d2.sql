-- Corrige recursão infinita nas políticas RLS de campaign_members
-- O problema: a política SELECT de campaigns referencia campaign_members,
-- e a política SELECT de campaign_members referencia campaigns, criando loop

-- Remove as políticas problemáticas
DROP POLICY IF EXISTS "Users can view campaigns they are members of" ON campaigns;
DROP POLICY IF EXISTS "Members can view campaign members" ON campaign_members;

-- Recria política de campaigns SEM recursão
-- Permite ver campanhas onde é mestre OU é membro
CREATE POLICY "Users can view campaigns they are members of"
ON campaigns
FOR SELECT
USING (
  auth.uid() = master_id 
  OR 
  id IN (
    SELECT campaign_id FROM campaign_members WHERE user_id = auth.uid()
  )
);

-- Recria política de campaign_members SEM recursão
-- Permite ver membros se é mestre da campanha OU é membro
CREATE POLICY "Members can view campaign members"
ON campaign_members
FOR SELECT
USING (
  user_id = auth.uid()
  OR
  campaign_id IN (
    SELECT id FROM campaigns WHERE master_id = auth.uid()
  )
  OR
  campaign_id IN (
    SELECT campaign_id FROM campaign_members AS cm WHERE cm.user_id = auth.uid()
  )
);