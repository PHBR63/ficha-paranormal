-- Corrige vazamento de mensagens privadas (whispers)
-- Problema: Qualquer membro pode ler todas as mensagens, incluindo whispers privados

-- Remove a política antiga
DROP POLICY IF EXISTS "Members can view campaign messages" ON campaign_messages;

-- Cria nova política que protege whispers
CREATE POLICY "Members can view campaign messages"
ON public.campaign_messages FOR SELECT
USING (
  (is_campaign_member(auth.uid(), campaign_id) OR is_campaign_master(auth.uid(), campaign_id))
  AND (
    -- Mensagens públicas (chat, dice_roll, system) são visíveis para todos
    message_type != 'whisper'
    -- OU whispers são visíveis apenas para:
    OR user_id = auth.uid()           -- O remetente
    OR recipient_id = auth.uid()       -- O destinatário
    OR is_campaign_master(auth.uid(), campaign_id)  -- O mestre
  )
);