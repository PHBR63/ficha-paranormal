-- Tabela para histórico de poderes paranormais removidos
CREATE TABLE public.character_removed_powers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  power_id TEXT NOT NULL,
  power_name TEXT NOT NULL,
  power_element TEXT,
  power_description TEXT,
  power_data JSONB NOT NULL,
  removed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  removal_reason TEXT DEFAULT 'excess_limit',
  restored_at TIMESTAMP WITH TIME ZONE,
  is_restored BOOLEAN NOT NULL DEFAULT false
);

-- Habilitar RLS
ALTER TABLE public.character_removed_powers ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view their removed powers"
ON public.character_removed_powers
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert removed powers for their characters"
ON public.character_removed_powers
FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM characters 
    WHERE characters.id = character_removed_powers.character_id 
    AND characters.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their removed powers"
ON public.character_removed_powers
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their removed powers"
ON public.character_removed_powers
FOR DELETE
USING (auth.uid() = user_id);

-- Índices para performance
CREATE INDEX idx_removed_powers_character ON public.character_removed_powers(character_id);
CREATE INDEX idx_removed_powers_not_restored ON public.character_removed_powers(character_id) WHERE is_restored = false;