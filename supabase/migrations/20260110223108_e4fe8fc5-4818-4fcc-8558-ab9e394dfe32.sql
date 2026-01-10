-- =====================================================
-- FASE 2: TABULEIRO TÁTICO - Tabelas Necessárias
-- =====================================================

-- Tabela de Mapas táticos
CREATE TABLE public.campaign_maps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  grid_size INTEGER NOT NULL DEFAULT 40, -- pixels por célula
  grid_type TEXT NOT NULL DEFAULT 'square', -- 'square', 'hex', 'none'
  width_cells INTEGER,
  height_cells INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT false,
  fog_of_war JSONB DEFAULT '[]', -- células reveladas [{x, y}]
  grid_color TEXT DEFAULT 'rgba(255,255,255,0.2)',
  grid_visible BOOLEAN DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de Tokens no mapa
CREATE TABLE public.map_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  map_id UUID NOT NULL REFERENCES public.campaign_maps(id) ON DELETE CASCADE,
  character_id UUID REFERENCES public.characters(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  token_type TEXT NOT NULL DEFAULT 'pc', -- 'pc', 'npc', 'creature', 'object', 'marker'
  image_url TEXT,
  x INTEGER NOT NULL DEFAULT 0,
  y INTEGER NOT NULL DEFAULT 0,
  size INTEGER NOT NULL DEFAULT 1, -- tamanho em células (1 = 1x1, 2 = 2x2, etc)
  rotation INTEGER DEFAULT 0, -- rotação em graus
  layer TEXT NOT NULL DEFAULT 'token', -- 'token', 'gm', 'hidden'
  conditions JSONB DEFAULT '[]', -- condições visuais no token
  light_radius INTEGER DEFAULT 0, -- células de luz emitida
  light_color TEXT DEFAULT '#ffff00',
  visible_to UUID[] DEFAULT NULL, -- null = todos, array = específicos
  locked BOOLEAN DEFAULT false, -- impede movimento por jogadores
  notes TEXT, -- notas privadas do mestre
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.campaign_maps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.map_tokens ENABLE ROW LEVEL SECURITY;

-- Políticas para campaign_maps
-- Mestre pode fazer tudo
CREATE POLICY "Master can manage maps"
ON public.campaign_maps
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.campaigns c
    WHERE c.id = campaign_id AND c.master_id = auth.uid()
  )
);

-- Membros podem ver mapas ativos
CREATE POLICY "Members can view active maps"
ON public.campaign_maps
FOR SELECT
USING (
  is_active = true AND EXISTS (
    SELECT 1 FROM public.campaign_members cm
    WHERE cm.campaign_id = campaign_maps.campaign_id AND cm.user_id = auth.uid()
  )
);

-- Políticas para map_tokens
-- Mestre pode fazer tudo
CREATE POLICY "Master can manage tokens"
ON public.map_tokens
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.campaign_maps m
    JOIN public.campaigns c ON c.id = m.campaign_id
    WHERE m.id = map_id AND c.master_id = auth.uid()
  )
);

-- Membros podem ver tokens visíveis
CREATE POLICY "Members can view visible tokens"
ON public.map_tokens
FOR SELECT
USING (
  layer != 'hidden' AND (
    visible_to IS NULL OR auth.uid() = ANY(visible_to)
  ) AND EXISTS (
    SELECT 1 FROM public.campaign_maps m
    JOIN public.campaign_members cm ON cm.campaign_id = m.campaign_id
    WHERE m.id = map_id AND cm.user_id = auth.uid()
  )
);

-- Jogadores podem mover seus próprios tokens (se não estiverem locked)
CREATE POLICY "Players can move own tokens"
ON public.map_tokens
FOR UPDATE
USING (
  locked = false AND character_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.campaign_members cm
    WHERE cm.character_id = map_tokens.character_id AND cm.user_id = auth.uid()
  )
)
WITH CHECK (
  locked = false AND character_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.campaign_members cm
    WHERE cm.character_id = map_tokens.character_id AND cm.user_id = auth.uid()
  )
);

-- Triggers para updated_at
CREATE TRIGGER update_campaign_maps_updated_at
BEFORE UPDATE ON public.campaign_maps
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_map_tokens_updated_at
BEFORE UPDATE ON public.map_tokens
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para performance
CREATE INDEX idx_campaign_maps_campaign_id ON public.campaign_maps(campaign_id);
CREATE INDEX idx_campaign_maps_is_active ON public.campaign_maps(is_active);
CREATE INDEX idx_map_tokens_map_id ON public.map_tokens(map_id);
CREATE INDEX idx_map_tokens_character_id ON public.map_tokens(character_id);
CREATE INDEX idx_map_tokens_layer ON public.map_tokens(layer);

-- Habilitar realtime para sincronização
ALTER PUBLICATION supabase_realtime ADD TABLE public.campaign_maps;
ALTER PUBLICATION supabase_realtime ADD TABLE public.map_tokens;