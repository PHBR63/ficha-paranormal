-- Tabela para registrar conjurações de rituais em campanhas (compartilhado em tempo real)
CREATE TABLE public.campaign_ritual_casts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  session_id UUID REFERENCES public.campaign_sessions(id) ON DELETE SET NULL,
  ritual_id TEXT NOT NULL,
  ritual_name TEXT NOT NULL,
  ritual_element TEXT NOT NULL,
  ritual_circle INTEGER NOT NULL,
  pe_cost INTEGER NOT NULL,
  enhancements TEXT[] DEFAULT '{}',
  pe_before INTEGER NOT NULL,
  pe_after INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_campaign_ritual_casts_campaign ON public.campaign_ritual_casts(campaign_id);
CREATE INDEX idx_campaign_ritual_casts_session ON public.campaign_ritual_casts(session_id);
CREATE INDEX idx_campaign_ritual_casts_character ON public.campaign_ritual_casts(character_id);
CREATE INDEX idx_campaign_ritual_casts_created ON public.campaign_ritual_casts(created_at DESC);

-- Enable RLS
ALTER TABLE public.campaign_ritual_casts ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
-- Membros da campanha podem visualizar
CREATE POLICY "Campaign members can view ritual casts"
ON public.campaign_ritual_casts
FOR SELECT
USING (
  is_campaign_member(auth.uid(), campaign_id) OR 
  is_campaign_master(auth.uid(), campaign_id)
);

-- Usuários podem inserir suas próprias conjurações
CREATE POLICY "Users can insert their own ritual casts"
ON public.campaign_ritual_casts
FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  (is_campaign_member(auth.uid(), campaign_id) OR is_campaign_master(auth.uid(), campaign_id))
);

-- Mestres podem deletar conjurações da campanha
CREATE POLICY "Masters can delete ritual casts"
ON public.campaign_ritual_casts
FOR DELETE
USING (is_campaign_master(auth.uid(), campaign_id));

-- Habilitar Realtime para a tabela
ALTER PUBLICATION supabase_realtime ADD TABLE public.campaign_ritual_casts;