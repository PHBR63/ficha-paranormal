-- Adiciona coluna para armazenar a trilha de classe selecionada
ALTER TABLE public.characters 
ADD COLUMN class_track text DEFAULT NULL;

-- Comentário para documentação
COMMENT ON COLUMN public.characters.class_track IS 'Trilha de classe selecionada (ex: Comandante de Campo, Atirador de Elite, etc.)';