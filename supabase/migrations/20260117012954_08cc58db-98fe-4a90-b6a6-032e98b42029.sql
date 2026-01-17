-- Adicionar coluna para armazenar sub-escolhas de poderes de classe
-- (Especialista em Arma, Perito, etc.)
ALTER TABLE public.characters 
ADD COLUMN IF NOT EXISTS class_power_choices JSONB DEFAULT '{}'::jsonb;

-- Comentário explicativo
COMMENT ON COLUMN public.characters.class_power_choices IS 
'Sub-escolhas de poderes de classe (ex: grupos de armas para Especialista em Arma, perícias para Perito). Formato: { "power-id": { powerId, choiceType, chosenValues } }';