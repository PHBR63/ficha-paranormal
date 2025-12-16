-- Adiciona coluna para buffs ativos de rituais na tabela characters
ALTER TABLE public.characters 
ADD COLUMN IF NOT EXISTS active_buffs jsonb DEFAULT '[]'::jsonb;

-- Comentário explicativo
COMMENT ON COLUMN public.characters.active_buffs IS 'Buffs temporários de armas aplicados por rituais (Amaldiçoar Arma, etc.)';