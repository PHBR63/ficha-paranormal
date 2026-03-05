
-- Tabela de pins (notas/handouts) ancorados no mapa tático (Fase F)
CREATE TABLE public.map_pins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  map_id UUID NOT NULL REFERENCES public.campaign_maps(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  x INTEGER NOT NULL DEFAULT 0,
  y INTEGER NOT NULL DEFAULT 0,
  pin_type TEXT NOT NULL DEFAULT 'note',
  title TEXT NOT NULL DEFAULT '',
  content TEXT,
  handout_id UUID REFERENCES public.campaign_handouts(id) ON DELETE SET NULL,
  icon TEXT NOT NULL DEFAULT '📌',
  color TEXT NOT NULL DEFAULT '#fbbf24',
  visibility TEXT NOT NULL DEFAULT 'all',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índice para busca por mapa
CREATE INDEX idx_map_pins_map_id ON public.map_pins(map_id);

-- RLS
ALTER TABLE public.map_pins ENABLE ROW LEVEL SECURITY;

-- Mestre pode tudo
CREATE POLICY "Master can manage pins"
ON public.map_pins FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM campaign_maps m
    JOIN campaigns c ON c.id = m.campaign_id
    WHERE m.id = map_pins.map_id AND c.master_id = auth.uid()
  )
);

-- Membros podem ver pins visíveis
CREATE POLICY "Members can view visible pins"
ON public.map_pins FOR SELECT
USING (
  (visibility = 'all') AND
  EXISTS (
    SELECT 1 FROM campaign_maps m
    JOIN campaign_members cm ON cm.campaign_id = m.campaign_id
    WHERE m.id = map_pins.map_id AND cm.user_id = auth.uid()
  )
);

-- Membros podem criar pins
CREATE POLICY "Members can create pins"
ON public.map_pins FOR INSERT
WITH CHECK (
  auth.uid() = created_by AND
  EXISTS (
    SELECT 1 FROM campaign_maps m
    JOIN campaign_members cm ON cm.campaign_id = m.campaign_id
    WHERE m.id = map_pins.map_id AND cm.user_id = auth.uid()
  )
);

-- Usuários podem deletar seus próprios pins
CREATE POLICY "Users can delete own pins"
ON public.map_pins FOR DELETE
USING (auth.uid() = created_by);

-- Usuários podem atualizar seus próprios pins
CREATE POLICY "Users can update own pins"
ON public.map_pins FOR UPDATE
USING (auth.uid() = created_by);

-- Habilita realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.map_pins;
