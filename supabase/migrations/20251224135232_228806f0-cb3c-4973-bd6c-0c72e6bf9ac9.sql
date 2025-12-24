-- Adiciona coluna para persistir efeitos ativados manualmente (trilhas, poderes, etc.)
-- Estrutura: array de objetos JSON com id, name, duration, activatedAt, metadata
ALTER TABLE public.characters 
ADD COLUMN IF NOT EXISTS activated_effects jsonb DEFAULT '[]'::jsonb;

-- Comentário explicativo
COMMENT ON COLUMN public.characters.activated_effects IS 'Efeitos de trilha/poderes ativados manualmente. Formato: [{id, name, duration, activatedAt, metadata}]';