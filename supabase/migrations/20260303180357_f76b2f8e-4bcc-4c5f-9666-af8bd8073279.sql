
-- Corrige políticas de storage do bucket campaign-assets
-- Substitui políticas que apenas checam autenticação por validação de mestre

DROP POLICY IF EXISTS "Mestre pode fazer upload de assets" ON storage.objects;
DROP POLICY IF EXISTS "Mestre pode deletar assets do storage" ON storage.objects;

-- Upload restrito ao mestre (valida campaign_id pelo primeiro nível do path)
CREATE POLICY "Mestre pode fazer upload de assets"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'campaign-assets'
    AND auth.uid() IS NOT NULL
    AND is_campaign_master(auth.uid(), (storage.foldername(name))[1]::uuid)
  );

-- Delete restrito ao mestre
CREATE POLICY "Mestre pode deletar assets do storage"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'campaign-assets'
    AND auth.uid() IS NOT NULL
    AND is_campaign_master(auth.uid(), (storage.foldername(name))[1]::uuid)
  );
