-- Adiciona colunas para sistema de Afinidade Elemental na tabela characters
ALTER TABLE public.characters 
ADD COLUMN IF NOT EXISTS elemental_affinity TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS affinity_active BOOLEAN DEFAULT FALSE;

-- Comentários explicativos
COMMENT ON COLUMN public.characters.elemental_affinity IS 'Elemento de afinidade escolhido no NEX 50% (sangue, morte, conhecimento, energia)';
COMMENT ON COLUMN public.characters.affinity_active IS 'Se a afinidade elemental está ativa (após primeira transcendência pós NEX 50%)';