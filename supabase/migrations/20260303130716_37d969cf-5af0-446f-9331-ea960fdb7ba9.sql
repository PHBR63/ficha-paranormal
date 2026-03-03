
-- ==========================================
-- Tabela: campaign_asset_folders (pastas recursivas)
-- ==========================================
CREATE TABLE public.campaign_asset_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.campaign_asset_folders(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_asset_folders_campaign ON public.campaign_asset_folders(campaign_id);
CREATE INDEX idx_asset_folders_parent ON public.campaign_asset_folders(parent_id);

-- RLS
ALTER TABLE public.campaign_asset_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Mestre pode gerenciar pastas de assets"
  ON public.campaign_asset_folders FOR ALL
  USING (is_campaign_master(auth.uid(), campaign_id))
  WITH CHECK (is_campaign_master(auth.uid(), campaign_id));

CREATE POLICY "Membros podem ver pastas de assets"
  ON public.campaign_asset_folders FOR SELECT
  USING (is_campaign_member(auth.uid(), campaign_id));

-- ==========================================
-- Tabela: campaign_assets (arquivos dentro das pastas)
-- ==========================================
CREATE TABLE public.campaign_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  folder_id uuid REFERENCES public.campaign_asset_folders(id) ON DELETE SET NULL,
  name text NOT NULL,
  file_url text NOT NULL,
  file_type text NOT NULL DEFAULT 'image/png',
  file_size integer NOT NULL DEFAULT 0,
  category text NOT NULL DEFAULT 'general',
  tags text[] NOT NULL DEFAULT '{}',
  uploaded_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_assets_campaign ON public.campaign_assets(campaign_id);
CREATE INDEX idx_assets_folder ON public.campaign_assets(folder_id);
CREATE INDEX idx_assets_category ON public.campaign_assets(category);

-- RLS
ALTER TABLE public.campaign_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Mestre pode gerenciar assets"
  ON public.campaign_assets FOR ALL
  USING (is_campaign_master(auth.uid(), campaign_id))
  WITH CHECK (is_campaign_master(auth.uid(), campaign_id));

CREATE POLICY "Membros podem ver assets"
  ON public.campaign_assets FOR SELECT
  USING (is_campaign_member(auth.uid(), campaign_id));

-- ==========================================
-- Bucket: campaign-assets (público)
-- ==========================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('campaign-assets', 'campaign-assets', true);

-- Storage RLS: leitura pública
CREATE POLICY "Assets de campanha são públicos para leitura"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'campaign-assets');

-- Storage RLS: upload restrito ao mestre (pasta = campaign_id)
CREATE POLICY "Mestre pode fazer upload de assets"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'campaign-assets'
    AND auth.uid() IS NOT NULL
  );

-- Storage RLS: mestre pode deletar
CREATE POLICY "Mestre pode deletar assets do storage"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'campaign-assets'
    AND auth.uid() IS NOT NULL
  );

-- ==========================================
-- Realtime
-- ==========================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.campaign_asset_folders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.campaign_assets;
