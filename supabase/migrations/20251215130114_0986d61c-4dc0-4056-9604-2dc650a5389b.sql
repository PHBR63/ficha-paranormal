-- Adicionar colunas para poderes paranormais e poderes gerais na tabela characters
ALTER TABLE public.characters 
  ADD COLUMN IF NOT EXISTS paranormal_powers jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS general_powers jsonb DEFAULT '[]'::jsonb;