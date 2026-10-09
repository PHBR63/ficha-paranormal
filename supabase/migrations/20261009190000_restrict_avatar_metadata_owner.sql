BEGIN;

-- Exibir avatares por URL pública não exige enumerar os arquivos de outras contas.
-- A pasta do dono também é usada pelas políticas existentes de escrita.
ALTER POLICY "Anyone can view character avatars" ON storage.objects
  TO authenticated
  USING (
    bucket_id = 'character-avatars'
    AND auth.uid() IS NOT NULL
    AND NOT coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false)
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

COMMENT ON POLICY "Anyone can view character avatars" ON storage.objects IS
  'Nome legado preservado. Somente o dono real pode ler/listar metadados da sua pasta. URLs do bucket publico continuam funcionando.';

COMMIT;
