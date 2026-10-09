-- Metadado sintético sem arquivo físico; toda a fixture é revertida.
BEGIN;
SELECT set_config('test.avatar_owner', user_id::text, true)
FROM public.characters WHERE id = 'ecde39f9-2d41-4d39-ad20-c8d013e11ee7';
DO $$ BEGIN
  IF nullif(current_setting('test.avatar_owner', true), '') IS NULL THEN
    RAISE EXCEPTION 'Identidade QA ausente';
  END IF;
  IF NOT (SELECT public FROM storage.buckets WHERE id = 'character-avatars') THEN
    RAISE EXCEPTION 'A migration alterou a exibição por URL pública';
  END IF;
END $$;
INSERT INTO storage.objects(id, bucket_id, name)
VALUES ('93aa0000-0000-4000-8000-000000000001', 'character-avatars',
  current_setting('test.avatar_owner') || '/qa-avatar-listing-20261009.png');

SET LOCAL ROLE anon;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM storage.objects WHERE id = '93aa0000-0000-4000-8000-000000000001') THEN
    RAISE EXCEPTION 'Visitante sem login conseguiu listar avatar';
  END IF;
END $$;

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', current_setting('test.avatar_owner'), true);
SELECT set_config('request.jwt.claims', json_build_object('sub', current_setting('test.avatar_owner'),
  'role', 'authenticated', 'is_anonymous', true)::text, true);
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM storage.objects WHERE id = '93aa0000-0000-4000-8000-000000000001') THEN
    RAISE EXCEPTION 'Conta anônima conseguiu listar avatar';
  END IF;
END $$;

SELECT set_config('request.jwt.claims', json_build_object('sub', current_setting('test.avatar_owner'),
  'role', 'authenticated', 'is_anonymous', false)::text, true);
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.objects WHERE id = '93aa0000-0000-4000-8000-000000000001') THEN
    RAISE EXCEPTION 'Conta autenticada perdeu leitura de avatar';
  END IF;
END $$;
ROLLBACK;
