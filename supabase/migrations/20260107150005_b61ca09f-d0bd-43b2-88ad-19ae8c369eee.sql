-- Adiciona coluna para armazenar a trilha escolhida via Versatilidade (NEX 50%)
-- Estrutura: { trackId, trackName, abilityId, abilityName }
ALTER TABLE public.characters 
ADD COLUMN versatility_track jsonb DEFAULT NULL;