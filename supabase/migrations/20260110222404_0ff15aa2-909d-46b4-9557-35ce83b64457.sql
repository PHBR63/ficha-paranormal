-- =====================================================
-- FASE 1: CONTROLE NARRATIVO - Tabelas Necessárias
-- =====================================================

-- Tabela de Handouts (documentos/pistas do mestre)
CREATE TABLE public.campaign_handouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  image_url TEXT,
  handout_type TEXT NOT NULL DEFAULT 'document', -- 'document', 'image', 'clue', 'npc'
  visibility TEXT NOT NULL DEFAULT 'hidden', -- 'hidden', 'visible', 'shared_with'
  shared_with UUID[] DEFAULT '{}', -- IDs de membros específicos
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revealed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de Notas de Cena (privadas do mestre)
CREATE TABLE public.campaign_scene_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.campaign_sessions(id) ON DELETE SET NULL,
  title TEXT,
  content TEXT,
  note_type TEXT NOT NULL DEFAULT 'scene', -- 'scene', 'npc', 'location', 'plot'
  is_private BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.campaign_handouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_scene_notes ENABLE ROW LEVEL SECURITY;

-- Políticas para campaign_handouts
-- Mestre pode fazer tudo
CREATE POLICY "Master can manage handouts"
ON public.campaign_handouts
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.campaigns c
    WHERE c.id = campaign_id AND c.master_id = auth.uid()
  )
);

-- Membros podem ver handouts visíveis ou compartilhados com eles
CREATE POLICY "Members can view visible handouts"
ON public.campaign_handouts
FOR SELECT
USING (
  visibility = 'visible' AND EXISTS (
    SELECT 1 FROM public.campaign_members cm
    WHERE cm.campaign_id = campaign_handouts.campaign_id AND cm.user_id = auth.uid()
  )
  OR (
    visibility = 'shared_with' AND auth.uid() = ANY(shared_with) AND EXISTS (
      SELECT 1 FROM public.campaign_members cm
      WHERE cm.campaign_id = campaign_handouts.campaign_id AND cm.user_id = auth.uid()
    )
  )
);

-- Políticas para campaign_scene_notes
-- Apenas o mestre pode ver/editar notas de cena
CREATE POLICY "Master can manage scene notes"
ON public.campaign_scene_notes
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.campaigns c
    WHERE c.id = campaign_id AND c.master_id = auth.uid()
  )
);

-- Membros podem ver notas não privadas
CREATE POLICY "Members can view public scene notes"
ON public.campaign_scene_notes
FOR SELECT
USING (
  is_private = false AND EXISTS (
    SELECT 1 FROM public.campaign_members cm
    WHERE cm.campaign_id = campaign_scene_notes.campaign_id AND cm.user_id = auth.uid()
  )
);

-- Triggers para updated_at
CREATE TRIGGER update_campaign_handouts_updated_at
BEFORE UPDATE ON public.campaign_handouts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_campaign_scene_notes_updated_at
BEFORE UPDATE ON public.campaign_scene_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para performance
CREATE INDEX idx_campaign_handouts_campaign_id ON public.campaign_handouts(campaign_id);
CREATE INDEX idx_campaign_handouts_visibility ON public.campaign_handouts(visibility);
CREATE INDEX idx_campaign_scene_notes_campaign_id ON public.campaign_scene_notes(campaign_id);
CREATE INDEX idx_campaign_scene_notes_session_id ON public.campaign_scene_notes(session_id);

-- Habilitar realtime para sincronização
ALTER PUBLICATION supabase_realtime ADD TABLE public.campaign_handouts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.campaign_scene_notes;