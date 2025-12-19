-- Tabela para rastrear escolhas de poder (Transcender, poderes de classe, etc.)
-- Impede que Transcender seja usado infinitamente
CREATE TABLE public.character_power_choices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  nex INTEGER NOT NULL,
  choice_type TEXT NOT NULL, -- 'transcender' | 'class_power' | 'track_power'
  status TEXT NOT NULL DEFAULT 'open', -- 'open' | 'resolved'
  resolution JSONB, -- { picked: 'transcender', powerId: '...', subchoices: {...} }
  sanity_delta INTEGER DEFAULT 0, -- Custo de SAN aplicado (negativo quando perde)
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  UNIQUE(character_id, nex, choice_type)
);

-- Habilitar RLS
ALTER TABLE public.character_power_choices ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Users can view their own power choices"
ON public.character_power_choices
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own power choices"
ON public.character_power_choices
FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM characters
    WHERE characters.id = character_power_choices.character_id
    AND characters.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own power choices"
ON public.character_power_choices
FOR UPDATE
USING (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM characters
    WHERE characters.id = character_power_choices.character_id
    AND characters.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own power choices"
ON public.character_power_choices
FOR DELETE
USING (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM characters
    WHERE characters.id = character_power_choices.character_id
    AND characters.user_id = auth.uid()
  )
);

-- Índices para performance
CREATE INDEX idx_character_power_choices_character ON public.character_power_choices(character_id);
CREATE INDEX idx_character_power_choices_nex ON public.character_power_choices(character_id, nex);
CREATE INDEX idx_character_power_choices_status ON public.character_power_choices(character_id, status);