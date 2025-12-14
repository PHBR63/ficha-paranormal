-- Tabela para histórico de alterações do personagem
CREATE TABLE public.character_change_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  change_type TEXT NOT NULL, -- 'attribute', 'skill', 'info', 'stats'
  field_name TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_character_history_character_id ON public.character_change_history(character_id);
CREATE INDEX idx_character_history_created_at ON public.character_change_history(created_at DESC);

-- Habilita RLS
ALTER TABLE public.character_change_history ENABLE ROW LEVEL SECURITY;

-- Política: usuários podem ver histórico dos próprios personagens
CREATE POLICY "Users can view their characters history"
ON public.character_change_history
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.characters
    WHERE characters.id = character_change_history.character_id
    AND characters.user_id = auth.uid()
  )
);

-- Política: usuários podem inserir histórico dos próprios personagens
CREATE POLICY "Users can insert history for their characters"
ON public.character_change_history
FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.characters
    WHERE characters.id = character_change_history.character_id
    AND characters.user_id = auth.uid()
  )
);

-- Política: usuários podem deletar histórico dos próprios personagens
CREATE POLICY "Users can delete their characters history"
ON public.character_change_history
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.characters
    WHERE characters.id = character_change_history.character_id
    AND characters.user_id = auth.uid()
  )
);