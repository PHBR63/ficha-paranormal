BEGIN;

-- O bucket continua público para exibir URLs já usadas nas fichas.
-- A API de listagem/leitura de metadados exige uma conta autenticada real.
-- Escrita, atualização e exclusão continuam nas políticas existentes do dono.
ALTER POLICY "Anyone can view character avatars" ON storage.objects
  TO authenticated
  USING (
    bucket_id = 'character-avatars'
    AND auth.uid() IS NOT NULL
    AND NOT coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false)
  );

COMMENT ON POLICY "Anyone can view character avatars" ON storage.objects IS
  'Nome legado preservado. Listagem restrita a contas autenticadas reais; URLs do bucket publico continuam funcionando.';

COMMIT;
