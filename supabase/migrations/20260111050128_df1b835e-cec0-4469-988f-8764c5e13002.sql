-- Tabela de NPCs da campanha
CREATE TABLE public.campaign_npcs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'enemy',
  hp_max INTEGER NOT NULL DEFAULT 10,
  hp_current INTEGER NOT NULL DEFAULT 10,
  pe_max INTEGER DEFAULT 0,
  pe_current INTEGER DEFAULT 0,
  defense INTEGER NOT NULL DEFAULT 10,
  movement INTEGER DEFAULT 9,
  attributes JSONB DEFAULT '{"agi": 1, "for": 1, "int": 1, "pre": 1, "vig": 1}',
  attacks JSONB DEFAULT '[]',
  abilities JSONB DEFAULT '[]',
  resistances JSONB DEFAULT '[]',
  immunities JSONB DEFAULT '[]',
  image_url TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de eventos da linha do tempo
CREATE TABLE public.campaign_timeline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.campaign_sessions(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL DEFAULT 'milestone',
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  importance INTEGER NOT NULL DEFAULT 1,
  metadata JSONB DEFAULT '{}',
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_campaign_npcs_campaign ON public.campaign_npcs(campaign_id);
CREATE INDEX idx_campaign_npcs_category ON public.campaign_npcs(category);
CREATE INDEX idx_campaign_timeline_campaign ON public.campaign_timeline_events(campaign_id);
CREATE INDEX idx_campaign_timeline_session ON public.campaign_timeline_events(session_id);
CREATE INDEX idx_campaign_timeline_date ON public.campaign_timeline_events(event_date);

-- RLS para NPCs
ALTER TABLE public.campaign_npcs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Mestre pode gerenciar NPCs"
ON public.campaign_npcs FOR ALL
USING (is_campaign_master(campaign_id, auth.uid()));

CREATE POLICY "Membros podem ver NPCs ativos"
ON public.campaign_npcs FOR SELECT
USING (
  is_active = true 
  AND is_campaign_member(campaign_id, auth.uid())
);

-- RLS para Timeline
ALTER TABLE public.campaign_timeline_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Mestre pode gerenciar eventos"
ON public.campaign_timeline_events FOR ALL
USING (is_campaign_master(campaign_id, auth.uid()));

CREATE POLICY "Membros podem ver eventos"
ON public.campaign_timeline_events FOR SELECT
USING (
  is_campaign_member(campaign_id, auth.uid()) 
  OR is_campaign_master(campaign_id, auth.uid())
);

-- Trigger para updated_at
CREATE TRIGGER update_campaign_npcs_updated_at
BEFORE UPDATE ON public.campaign_npcs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_campaign_timeline_events_updated_at
BEFORE UPDATE ON public.campaign_timeline_events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();