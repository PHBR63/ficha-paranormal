-- Adiciona coluna de modo desenvolvedor na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS developer_mode boolean NOT NULL DEFAULT false;