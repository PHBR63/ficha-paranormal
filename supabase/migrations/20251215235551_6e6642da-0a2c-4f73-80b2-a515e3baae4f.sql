-- Adiciona política para mestres e membros de campanha visualizarem personagens da campanha
-- Isso é essencial para o funcionamento de um RPG de mesa onde o mestre precisa ver as fichas

-- Política: Mestres podem ver personagens atribuídos às suas campanhas
CREATE POLICY "Campaign masters can view campaign characters"
ON public.characters
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM campaign_members cm
    JOIN campaigns c ON c.id = cm.campaign_id
    WHERE cm.character_id = characters.id
    AND c.master_id = auth.uid()
  )
);

-- Política: Membros podem ver personagens de outros membros na mesma campanha
CREATE POLICY "Campaign members can view fellow members characters"
ON public.characters
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM campaign_members cm1
    JOIN campaign_members cm2 ON cm1.campaign_id = cm2.campaign_id
    WHERE cm1.character_id = characters.id
    AND cm2.user_id = auth.uid()
  )
);