-- Tabela para rituais sustentados ativos
CREATE TABLE public.character_sustained_rituals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  ritual_id TEXT NOT NULL,
  ritual_name TEXT NOT NULL,
  element TEXT NOT NULL,
  circle INTEGER NOT NULL DEFAULT 1,
  selected_enhancements TEXT[] DEFAULT '{}',
  sustain_config JSONB DEFAULT '{}',
  turns_active INTEGER DEFAULT 0,
  pe_spent_total INTEGER DEFAULT 0,
  is_concentrating BOOLEAN DEFAULT false,
  started_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.character_sustained_rituals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their sustained rituals"
ON public.character_sustained_rituals
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their sustained rituals"
ON public.character_sustained_rituals
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their sustained rituals"
ON public.character_sustained_rituals
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their sustained rituals"
ON public.character_sustained_rituals
FOR DELETE
USING (auth.uid() = user_id);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.character_sustained_rituals;