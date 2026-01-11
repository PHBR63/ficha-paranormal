-- ============================================
-- CORREÇÃO DE SEGURANÇA: Políticas de Storage
-- ============================================

-- 1. Remover políticas existentes do bucket campaign-audio
DROP POLICY IF EXISTS "Mestre pode fazer upload de áudios" ON storage.objects;
DROP POLICY IF EXISTS "Mestre pode deletar áudios" ON storage.objects;
DROP POLICY IF EXISTS "Membros podem visualizar áudios" ON storage.objects;
DROP POLICY IF EXISTS "Audio is publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload audio" ON storage.objects;
DROP POLICY IF EXISTS "Campaign masters can upload audio" ON storage.objects;
DROP POLICY IF EXISTS "Campaign masters can delete audio" ON storage.objects;

-- 2. Remover políticas existentes do bucket campaign-maps
DROP POLICY IF EXISTS "Mestre pode fazer upload de mapas" ON storage.objects;
DROP POLICY IF EXISTS "Mestre pode deletar mapas" ON storage.objects;
DROP POLICY IF EXISTS "Membros podem visualizar mapas" ON storage.objects;
DROP POLICY IF EXISTS "Maps are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload maps" ON storage.objects;
DROP POLICY IF EXISTS "Campaign masters can upload maps" ON storage.objects;
DROP POLICY IF EXISTS "Campaign masters can delete maps" ON storage.objects;

-- 3. Criar políticas seguras para campaign-audio
-- O path segue o formato: {campaign_id}/{audio_type}/{filename}
CREATE POLICY "Campaign masters can upload audio"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'campaign-audio'
  AND auth.uid() IS NOT NULL
  AND is_campaign_master(auth.uid(), (storage.foldername(name))[1]::uuid)
);

CREATE POLICY "Campaign masters can update audio"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'campaign-audio'
  AND is_campaign_master(auth.uid(), (storage.foldername(name))[1]::uuid)
);

CREATE POLICY "Campaign masters can delete audio"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'campaign-audio'
  AND is_campaign_master(auth.uid(), (storage.foldername(name))[1]::uuid)
);

CREATE POLICY "Campaign members can view audio"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'campaign-audio'
  AND (
    is_campaign_member(auth.uid(), (storage.foldername(name))[1]::uuid)
    OR is_campaign_master(auth.uid(), (storage.foldername(name))[1]::uuid)
  )
);

-- 4. Criar políticas seguras para campaign-maps
-- O path segue o formato: {campaign_id}/{filename}
CREATE POLICY "Campaign masters can upload maps"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'campaign-maps'
  AND auth.uid() IS NOT NULL
  AND is_campaign_master(auth.uid(), (storage.foldername(name))[1]::uuid)
);

CREATE POLICY "Campaign masters can update maps"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'campaign-maps'
  AND is_campaign_master(auth.uid(), (storage.foldername(name))[1]::uuid)
);

CREATE POLICY "Campaign masters can delete maps"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'campaign-maps'
  AND is_campaign_master(auth.uid(), (storage.foldername(name))[1]::uuid)
);

CREATE POLICY "Campaign members can view maps"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'campaign-maps'
  AND (
    is_campaign_member(auth.uid(), (storage.foldername(name))[1]::uuid)
    OR is_campaign_master(auth.uid(), (storage.foldername(name))[1]::uuid)
  )
);