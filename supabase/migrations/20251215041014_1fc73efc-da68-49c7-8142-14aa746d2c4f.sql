-- Tabela para notas persistentes da campanha
CREATE TABLE public.campaign_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  session_id UUID REFERENCES campaign_sessions(id) ON DELETE SET NULL,
  title TEXT,
  content TEXT NOT NULL,
  note_type TEXT NOT NULL DEFAULT 'personal', -- 'personal', 'shared', 'session_recap'
  is_private BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.campaign_notes ENABLE ROW LEVEL SECURITY;

-- Trigger para atualizar updated_at
CREATE TRIGGER update_campaign_notes_updated_at
BEFORE UPDATE ON public.campaign_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Políticas RLS para campaign_notes

-- Usuários podem ver suas próprias notas
CREATE POLICY "Users can view their own notes"
ON public.campaign_notes
FOR SELECT
USING (auth.uid() = user_id);

-- Mestres podem ver notas compartilhadas de sua campanha
CREATE POLICY "Masters can view shared notes"
ON public.campaign_notes
FOR SELECT
USING (
  is_private = false 
  AND EXISTS (
    SELECT 1 FROM campaigns 
    WHERE campaigns.id = campaign_notes.campaign_id 
    AND campaigns.master_id = auth.uid()
  )
);

-- Membros podem ver notas compartilhadas e recapitulações de sessão
CREATE POLICY "Members can view shared notes and recaps"
ON public.campaign_notes
FOR SELECT
USING (
  (is_private = false OR note_type = 'session_recap')
  AND EXISTS (
    SELECT 1 FROM campaign_members 
    WHERE campaign_members.campaign_id = campaign_notes.campaign_id 
    AND campaign_members.user_id = auth.uid()
  )
);

-- Usuários podem criar notas em campanhas que são membros
CREATE POLICY "Users can create notes in their campaigns"
ON public.campaign_notes
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND (
    EXISTS (
      SELECT 1 FROM campaigns 
      WHERE campaigns.id = campaign_notes.campaign_id 
      AND campaigns.master_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM campaign_members 
      WHERE campaign_members.campaign_id = campaign_notes.campaign_id 
      AND campaign_members.user_id = auth.uid()
    )
  )
);

-- Usuários podem atualizar suas próprias notas
CREATE POLICY "Users can update their own notes"
ON public.campaign_notes
FOR UPDATE
USING (auth.uid() = user_id);

-- Usuários podem deletar suas próprias notas
CREATE POLICY "Users can delete their own notes"
ON public.campaign_notes
FOR DELETE
USING (auth.uid() = user_id);

-- Mestres podem deletar recapitulações de sessão de sua campanha
CREATE POLICY "Masters can delete session recaps"
ON public.campaign_notes
FOR DELETE
USING (
  note_type = 'session_recap'
  AND EXISTS (
    SELECT 1 FROM campaigns 
    WHERE campaigns.id = campaign_notes.campaign_id 
    AND campaigns.master_id = auth.uid()
  )
);

-- Habilitar realtime para campaign_sessions e campaign_notes
ALTER PUBLICATION supabase_realtime ADD TABLE public.campaign_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.campaign_notes;