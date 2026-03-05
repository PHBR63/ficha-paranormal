
-- Tabela para áreas de efeito persistentes no mapa tático (Fase D)
CREATE TABLE public.map_area_effects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  map_id UUID NOT NULL REFERENCES public.campaign_maps(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  
  -- Tipo de forma: cone, circle, line, square
  shape_type TEXT NOT NULL DEFAULT 'circle',
  
  -- Posição central (em células do grid)
  origin_x INTEGER NOT NULL DEFAULT 0,
  origin_y INTEGER NOT NULL DEFAULT 0,
  
  -- Parâmetros de forma
  -- circle: radius (em metros/células)
  -- cone: radius + angle (graus de abertura) + rotation (direção)
  -- line: length (em metros/células) + rotation
  -- square: side_length (em metros/células) + rotation
  radius NUMERIC DEFAULT 3,
  angle NUMERIC DEFAULT 90,
  rotation NUMERIC DEFAULT 0,
  side_length NUMERIC DEFAULT 3,
  line_length NUMERIC DEFAULT 6,
  
  -- Aparência
  color TEXT NOT NULL DEFAULT '#ff000080',
  border_color TEXT DEFAULT '#ff0000',
  opacity NUMERIC NOT NULL DEFAULT 0.35,
  
  -- Metadados
  label TEXT DEFAULT NULL,
  element TEXT DEFAULT NULL, -- Elemento paranormal (Sangue, Morte, etc.)
  
  -- Visibilidade: 'all' = todos veem, 'master' = só mestre vê
  visibility TEXT NOT NULL DEFAULT 'all',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índice para busca por mapa
CREATE INDEX idx_map_area_effects_map_id ON public.map_area_effects(map_id);

-- RLS
ALTER TABLE public.map_area_effects ENABLE ROW LEVEL SECURITY;

-- Mestre pode fazer tudo
CREATE POLICY "Master can manage area effects"
ON public.map_area_effects FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM campaign_maps m
    JOIN campaigns c ON c.id = m.campaign_id
    WHERE m.id = map_area_effects.map_id AND c.master_id = auth.uid()
  )
);

-- Membros podem ver áreas visíveis
CREATE POLICY "Members can view visible area effects"
ON public.map_area_effects FOR SELECT
USING (
  visibility = 'all' AND
  EXISTS (
    SELECT 1 FROM campaign_maps m
    JOIN campaign_members cm ON cm.campaign_id = m.campaign_id
    WHERE m.id = map_area_effects.map_id AND cm.user_id = auth.uid()
  )
);

-- Membros podem criar áreas
CREATE POLICY "Members can create area effects"
ON public.map_area_effects FOR INSERT
WITH CHECK (
  auth.uid() = created_by AND
  EXISTS (
    SELECT 1 FROM campaign_maps m
    JOIN campaign_members cm ON cm.campaign_id = m.campaign_id
    WHERE m.id = map_area_effects.map_id AND cm.user_id = auth.uid()
  )
);

-- Usuários podem deletar suas próprias áreas (ou mestre deleta qualquer uma via policy ALL acima)
CREATE POLICY "Users can delete own area effects"
ON public.map_area_effects FOR DELETE
USING (auth.uid() = created_by);

-- Habilita realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.map_area_effects;
