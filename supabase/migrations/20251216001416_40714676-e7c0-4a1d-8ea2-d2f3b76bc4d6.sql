-- Adicionar política para usuários editarem apenas suas próprias mensagens
CREATE POLICY "Users can update their own messages"
ON public.campaign_messages
FOR UPDATE
USING (auth.uid() = user_id);

-- Adicionar política para usuários deletarem apenas suas próprias mensagens
-- Ou masters podem deletar qualquer mensagem da campanha
CREATE POLICY "Users can delete their own messages or masters can delete any"
ON public.campaign_messages
FOR DELETE
USING (
  auth.uid() = user_id 
  OR is_campaign_master(auth.uid(), campaign_id)
);