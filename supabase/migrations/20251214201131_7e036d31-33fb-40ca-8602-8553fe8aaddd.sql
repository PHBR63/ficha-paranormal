-- Adicionar novos campos à tabela characters para o módulo de criação completo
ALTER TABLE public.characters
ADD COLUMN IF NOT EXISTS concept text,
ADD COLUMN IF NOT EXISTS age integer,
ADD COLUMN IF NOT EXISTS gender text,
ADD COLUMN IF NOT EXISTS appearance text,
ADD COLUMN IF NOT EXISTS personality text,
ADD COLUMN IF NOT EXISTS movement integer NOT NULL DEFAULT 9,
ADD COLUMN IF NOT EXISTS proficiencies jsonb NOT NULL DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS abilities jsonb NOT NULL DEFAULT '[]'::jsonb;