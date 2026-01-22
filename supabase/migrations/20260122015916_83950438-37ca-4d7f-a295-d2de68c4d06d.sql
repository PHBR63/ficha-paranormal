-- Adicionar coluna training_grade_choices na tabela characters
-- Armazena escolhas da habilidade Grau de Treinamento (NEX 35% e 70%)
-- Formato: { "nex35": [...escolhas], "nex70": [...escolhas] }

ALTER TABLE public.characters 
ADD COLUMN IF NOT EXISTS training_grade_choices JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.characters.training_grade_choices IS 
'Armazena escolhas da habilidade Grau de Treinamento nos NEX 35% e 70%. Formato: { "nex35": [{skillId, fromLevel, toLevel}], "nex70": [...] }';