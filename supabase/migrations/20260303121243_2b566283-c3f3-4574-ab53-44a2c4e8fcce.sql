
-- =============================================
-- Tabela: map_drawings — Desenhos no mapa tático
-- =============================================
CREATE TABLE public.map_drawings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  map_id uuid NOT NULL REFERENCES public.campaign_maps(id) ON DELETE CASCADE,
  created_by uuid NOT NULL,
  tool text NOT NULL DEFAULT 'pen',
  points jsonb NOT NULL DEFAULT '[]'::jsonb,
  color text NOT NULL DEFAULT '#ffffff',
  stroke_width integer NOT NULL DEFAULT 3,
  opacity numeric NOT NULL DEFAULT 1.0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- RLS para map_drawings
ALTER TABLE public.map_drawings ENABLE ROW LEVEL SECURITY;

-- Mestre pode gerenciar todos os desenhos do mapa
CREATE POLICY "Master can manage drawings"
ON public.map_drawings
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM campaign_maps m
    JOIN campaigns c ON c.id = m.campaign_id
    WHERE m.id = map_drawings.map_id AND c.master_id = auth.uid()
  )
);

-- Membros podem ver desenhos
CREATE POLICY "Members can view drawings"
ON public.map_drawings
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM campaign_maps m
    JOIN campaign_members cm ON cm.campaign_id = m.campaign_id
    WHERE m.id = map_drawings.map_id AND cm.user_id = auth.uid()
  )
);

-- Membros podem criar desenhos
CREATE POLICY "Members can create drawings"
ON public.map_drawings
FOR INSERT
WITH CHECK (
  auth.uid() = created_by AND
  EXISTS (
    SELECT 1 FROM campaign_maps m
    JOIN campaign_members cm ON cm.campaign_id = m.campaign_id
    WHERE m.id = map_drawings.map_id AND cm.user_id = auth.uid()
  )
);

-- Usuários podem deletar seus próprios desenhos
CREATE POLICY "Users can delete own drawings"
ON public.map_drawings
FOR DELETE
USING (auth.uid() = created_by);

-- =============================================
-- Tabela: map_texts — Textos/anotações no mapa
-- =============================================
CREATE TABLE public.map_texts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  map_id uuid NOT NULL REFERENCES public.campaign_maps(id) ON DELETE CASCADE,
  created_by uuid NOT NULL,
  text text NOT NULL DEFAULT '',
  x integer NOT NULL DEFAULT 0,
  y integer NOT NULL DEFAULT 0,
  font_size integer NOT NULL DEFAULT 16,
  color text NOT NULL DEFAULT '#ffffff',
  rotation integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- RLS para map_texts
ALTER TABLE public.map_texts ENABLE ROW LEVEL SECURITY;

-- Mestre pode gerenciar todos os textos do mapa
CREATE POLICY "Master can manage texts"
ON public.map_texts
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM campaign_maps m
    JOIN campaigns c ON c.id = m.campaign_id
    WHERE m.id = map_texts.map_id AND c.master_id = auth.uid()
  )
);

-- Membros podem ver textos
CREATE POLICY "Members can view texts"
ON public.map_texts
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM campaign_maps m
    JOIN campaign_members cm ON cm.campaign_id = m.campaign_id
    WHERE m.id = map_texts.map_id AND cm.user_id = auth.uid()
  )
);

-- Membros podem criar textos
CREATE POLICY "Members can create texts"
ON public.map_texts
FOR INSERT
WITH CHECK (
  auth.uid() = created_by AND
  EXISTS (
    SELECT 1 FROM campaign_maps m
    JOIN campaign_members cm ON cm.campaign_id = m.campaign_id
    WHERE m.id = map_texts.map_id AND cm.user_id = auth.uid()
  )
);

-- Usuários podem atualizar seus próprios textos
CREATE POLICY "Users can update own texts"
ON public.map_texts
FOR UPDATE
USING (auth.uid() = created_by);

-- Usuários podem deletar seus próprios textos
CREATE POLICY "Users can delete own texts"
ON public.map_texts
FOR DELETE
USING (auth.uid() = created_by);

-- =============================================
-- Habilitar Realtime para ambas tabelas
-- =============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.map_drawings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.map_texts;
