-- Adicionar coluna skill_training_choices na tabela characters
-- Armazena escolhas de perícias do poder Treinamento em Perícia
-- Formato: { "powerId-instanceIndex": [{ skillId, fromLevel, toLevel }] }

ALTER TABLE public.characters 
ADD COLUMN IF NOT EXISTS skill_training_choices JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.characters.skill_training_choices IS 
'Armazena escolhas de perícias do poder Treinamento em Perícia. Formato: { "powerId-instanceIndex": [{ skillId, fromLevel, toLevel }] }';