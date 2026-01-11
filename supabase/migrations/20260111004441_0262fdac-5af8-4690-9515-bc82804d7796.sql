-- ============================================
-- FASE 8: Sistema de Condições e Efeitos Temporários
-- ============================================

-- Tabela para condições/efeitos ativos nos personagens
CREATE TABLE public.character_active_conditions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  -- Identificação da condição
  condition_id TEXT NOT NULL, -- ID da condição (ex: 'abalado', 'cego', 'custom_123')
  condition_name TEXT NOT NULL, -- Nome para exibição
  condition_type TEXT NOT NULL DEFAULT 'condition', -- 'condition', 'buff', 'debuff', 'effect'
  
  -- Descrição e efeitos
  description TEXT,
  mechanical_effect TEXT, -- Efeito mecânico (ex: "-2 em testes")
  
  -- Duração
  duration_type TEXT NOT NULL DEFAULT 'rounds', -- 'permanent', 'rounds', 'scene', 'until_rest', 'until_end_of_turn'
  duration_remaining INTEGER, -- Rodadas restantes (NULL se permanente)
  duration_total INTEGER, -- Duração total original
  
  -- Controle de turno
  applied_at_round INTEGER, -- Rodada em que foi aplicado
  applied_at_turn INTEGER, -- Turno em que foi aplicado
  decrements_at TEXT DEFAULT 'start_of_turn', -- 'start_of_turn', 'end_of_turn', 'manual'
  
  -- Visual
  icon TEXT, -- Ícone (lucide icon name)
  color TEXT, -- Cor do badge
  
  -- Origem
  source_name TEXT, -- Quem/o que aplicou (ex: "Ritual Medo", "Mestre")
  source_type TEXT, -- 'ritual', 'power', 'item', 'master', 'environment'
  
  -- Metadata
  stacks INTEGER DEFAULT 1, -- Quantidade de acúmulos
  max_stacks INTEGER DEFAULT 1, -- Máximo de acúmulos
  can_be_removed BOOLEAN DEFAULT true, -- Se pode ser removido manualmente
  
  -- Campanha (opcional - para sincronização em sessão)
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  session_id UUID REFERENCES public.campaign_sessions(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_character_conditions_character ON public.character_active_conditions(character_id);
CREATE INDEX idx_character_conditions_campaign ON public.character_active_conditions(campaign_id) WHERE campaign_id IS NOT NULL;
CREATE INDEX idx_character_conditions_type ON public.character_active_conditions(condition_type);

-- Enable RLS
ALTER TABLE public.character_active_conditions ENABLE ROW LEVEL SECURITY;

-- Policies
-- Usuários podem ver condições de seus próprios personagens
CREATE POLICY "Users can view own character conditions"
ON public.character_active_conditions
FOR SELECT
USING (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM characters c WHERE c.id = character_id AND c.user_id = auth.uid()
  )
);

-- Mestres podem ver condições de personagens em suas campanhas
CREATE POLICY "Masters can view campaign character conditions"
ON public.character_active_conditions
FOR SELECT
USING (
  campaign_id IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM campaigns c WHERE c.id = campaign_id AND c.master_id = auth.uid()
  )
);

-- Usuários podem adicionar condições aos seus personagens
CREATE POLICY "Users can insert own character conditions"
ON public.character_active_conditions
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM characters c WHERE c.id = character_id AND c.user_id = auth.uid()
  )
);

-- Mestres podem adicionar condições em campanhas
CREATE POLICY "Masters can insert campaign conditions"
ON public.character_active_conditions
FOR INSERT
WITH CHECK (
  campaign_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM campaigns c WHERE c.id = campaign_id AND c.master_id = auth.uid()
  )
);

-- Usuários podem atualizar condições de seus personagens
CREATE POLICY "Users can update own character conditions"
ON public.character_active_conditions
FOR UPDATE
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM characters c WHERE c.id = character_id AND c.user_id = auth.uid()
  )
);

-- Mestres podem atualizar condições em campanhas
CREATE POLICY "Masters can update campaign conditions"
ON public.character_active_conditions
FOR UPDATE
USING (
  campaign_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM campaigns c WHERE c.id = campaign_id AND c.master_id = auth.uid()
  )
);

-- Usuários podem remover condições de seus personagens (se permitido)
CREATE POLICY "Users can delete own character conditions"
ON public.character_active_conditions
FOR DELETE
USING (
  (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM characters c WHERE c.id = character_id AND c.user_id = auth.uid()
  ))
  AND can_be_removed = true
);

-- Mestres podem remover qualquer condição em campanhas
CREATE POLICY "Masters can delete campaign conditions"
ON public.character_active_conditions
FOR DELETE
USING (
  campaign_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM campaigns c WHERE c.id = campaign_id AND c.master_id = auth.uid()
  )
);

-- Trigger para updated_at
CREATE TRIGGER update_character_conditions_updated_at
BEFORE UPDATE ON public.character_active_conditions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Habilita realtime para sincronização em sessão
ALTER PUBLICATION supabase_realtime ADD TABLE public.character_active_conditions;