-- ====================================================================
-- SCHEMA V2 - Sistema de Campanha Reconstruído
-- Remove instabilidades de render através de estrutura de dados limpa
-- ====================================================================

-- Tabela principal de campanhas v2
CREATE TABLE IF NOT EXISTS public.campaigns_v2 (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  master_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'archived')),
  current_session INTEGER NOT NULL DEFAULT 0,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Membros da campanha v2
CREATE TABLE IF NOT EXISTS public.campaign_members_v2 (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns_v2(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  character_id UUID REFERENCES public.characters(id) ON DELETE SET NULL,
  role TEXT NOT NULL DEFAULT 'player' CHECK (role IN ('master', 'player')),
  active_bonuses JSONB,
  bonuses_updated_at TIMESTAMP WITH TIME ZONE,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, user_id)
);

-- Mensagens de chat v2
CREATE TABLE IF NOT EXISTS public.campaign_messages_v2 (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns_v2(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  character_id UUID REFERENCES public.characters(id) ON DELETE SET NULL,
  recipient_id UUID, -- Para sussurros
  message_type TEXT NOT NULL DEFAULT 'chat' CHECK (message_type IN ('chat', 'dice_roll', 'system', 'whisper')),
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Sessões v2
CREATE TABLE IF NOT EXISTS public.campaign_sessions_v2 (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns_v2(id) ON DELETE CASCADE,
  session_number INTEGER NOT NULL,
  title TEXT,
  summary TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'completed', 'cancelled')),
  scheduled_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  notes JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Mapas táticos v2
CREATE TABLE IF NOT EXISTS public.campaign_maps_v2 (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns_v2(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  name TEXT NOT NULL,
  image_url TEXT NOT NULL DEFAULT '',
  grid_size INTEGER NOT NULL DEFAULT 40,
  grid_type TEXT NOT NULL DEFAULT 'square' CHECK (grid_type IN ('square', 'hex', 'none')),
  grid_color TEXT DEFAULT 'rgba(255,255,255,0.2)',
  grid_visible BOOLEAN DEFAULT true,
  width_cells INTEGER,
  height_cells INTEGER,
  fog_of_war JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tokens de mapa v2
CREATE TABLE IF NOT EXISTS public.map_tokens_v2 (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  map_id UUID NOT NULL REFERENCES public.campaign_maps_v2(id) ON DELETE CASCADE,
  character_id UUID REFERENCES public.characters(id) ON DELETE SET NULL,
  created_by UUID NOT NULL,
  name TEXT NOT NULL,
  token_type TEXT NOT NULL DEFAULT 'pc' CHECK (token_type IN ('pc', 'npc', 'creature', 'object', 'marker')),
  image_url TEXT,
  x NUMERIC NOT NULL DEFAULT 0,
  y NUMERIC NOT NULL DEFAULT 0,
  size INTEGER NOT NULL DEFAULT 1,
  rotation NUMERIC DEFAULT 0,
  layer TEXT NOT NULL DEFAULT 'token' CHECK (layer IN ('token', 'gm', 'hidden')),
  conditions JSONB DEFAULT '[]'::jsonb,
  light_radius NUMERIC DEFAULT 0,
  light_color TEXT DEFAULT '#ffffff',
  visible_to UUID[],
  locked BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_campaign_members_v2_campaign ON public.campaign_members_v2(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_members_v2_user ON public.campaign_members_v2(user_id);
CREATE INDEX IF NOT EXISTS idx_campaign_messages_v2_campaign ON public.campaign_messages_v2(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_messages_v2_created ON public.campaign_messages_v2(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_campaign_sessions_v2_campaign ON public.campaign_sessions_v2(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_maps_v2_campaign ON public.campaign_maps_v2(campaign_id);
CREATE INDEX IF NOT EXISTS idx_map_tokens_v2_map ON public.map_tokens_v2(map_id);

-- Habilitar RLS
ALTER TABLE public.campaigns_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_members_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_messages_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_sessions_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_maps_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.map_tokens_v2 ENABLE ROW LEVEL SECURITY;

-- RLS Policies para campaigns_v2
CREATE POLICY "Campanhas visíveis para membros" ON public.campaigns_v2
  FOR SELECT USING (
    auth.uid() = master_id OR
    EXISTS (SELECT 1 FROM public.campaign_members_v2 WHERE campaign_id = id AND user_id = auth.uid())
  );

CREATE POLICY "Mestre pode criar campanhas" ON public.campaigns_v2
  FOR INSERT WITH CHECK (auth.uid() = master_id);

CREATE POLICY "Mestre pode atualizar campanha" ON public.campaigns_v2
  FOR UPDATE USING (auth.uid() = master_id);

CREATE POLICY "Mestre pode deletar campanha" ON public.campaigns_v2
  FOR DELETE USING (auth.uid() = master_id);

-- RLS Policies para campaign_members_v2
CREATE POLICY "Membros visíveis para todos da campanha" ON public.campaign_members_v2
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.campaign_members_v2 cm WHERE cm.campaign_id = campaign_id AND cm.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.campaigns_v2 c WHERE c.id = campaign_id AND c.master_id = auth.uid())
  );

CREATE POLICY "Mestre pode adicionar membros" ON public.campaign_members_v2
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.campaigns_v2 WHERE id = campaign_id AND master_id = auth.uid())
    OR user_id = auth.uid() -- Permite auto-adesão via convite
  );

CREATE POLICY "Mestre pode atualizar membros" ON public.campaign_members_v2
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.campaigns_v2 WHERE id = campaign_id AND master_id = auth.uid())
    OR user_id = auth.uid() -- Jogador pode atualizar seu próprio registro (ex: selecionar personagem)
  );

CREATE POLICY "Mestre pode remover membros" ON public.campaign_members_v2
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.campaigns_v2 WHERE id = campaign_id AND master_id = auth.uid())
  );

-- RLS Policies para campaign_messages_v2
CREATE POLICY "Mensagens visíveis para membros" ON public.campaign_messages_v2
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.campaign_members_v2 WHERE campaign_id = campaign_messages_v2.campaign_id AND user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.campaigns_v2 WHERE id = campaign_id AND master_id = auth.uid())
  );

CREATE POLICY "Membros podem enviar mensagens" ON public.campaign_messages_v2
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND (
      EXISTS (SELECT 1 FROM public.campaign_members_v2 WHERE campaign_id = campaign_messages_v2.campaign_id AND user_id = auth.uid())
      OR EXISTS (SELECT 1 FROM public.campaigns_v2 WHERE id = campaign_id AND master_id = auth.uid())
    )
  );

-- RLS Policies para campaign_sessions_v2
CREATE POLICY "Sessões visíveis para membros" ON public.campaign_sessions_v2
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.campaign_members_v2 WHERE campaign_id = campaign_sessions_v2.campaign_id AND user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.campaigns_v2 WHERE id = campaign_id AND master_id = auth.uid())
  );

CREATE POLICY "Mestre gerencia sessões" ON public.campaign_sessions_v2
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.campaigns_v2 WHERE id = campaign_id AND master_id = auth.uid())
  );

-- RLS Policies para campaign_maps_v2
CREATE POLICY "Mapas visíveis para membros" ON public.campaign_maps_v2
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.campaign_members_v2 WHERE campaign_id = campaign_maps_v2.campaign_id AND user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.campaigns_v2 WHERE id = campaign_id AND master_id = auth.uid())
  );

CREATE POLICY "Mestre gerencia mapas" ON public.campaign_maps_v2
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.campaigns_v2 WHERE id = campaign_id AND master_id = auth.uid())
  );

-- RLS Policies para map_tokens_v2
CREATE POLICY "Tokens visíveis para membros" ON public.map_tokens_v2
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.campaign_maps_v2 m
      JOIN public.campaign_members_v2 cm ON cm.campaign_id = m.campaign_id
      WHERE m.id = map_tokens_v2.map_id AND cm.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.campaign_maps_v2 m
      JOIN public.campaigns_v2 c ON c.id = m.campaign_id
      WHERE m.id = map_tokens_v2.map_id AND c.master_id = auth.uid()
    )
  );

CREATE POLICY "Mestre gerencia tokens" ON public.map_tokens_v2
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.campaign_maps_v2 m
      JOIN public.campaigns_v2 c ON c.id = m.campaign_id
      WHERE m.id = map_tokens_v2.map_id AND c.master_id = auth.uid()
    )
  );

-- Trigger para auto-adicionar mestre como membro
CREATE OR REPLACE FUNCTION public.add_master_as_member_v2()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.campaign_members_v2 (campaign_id, user_id, role)
  VALUES (NEW.id, NEW.master_id, 'master');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_campaign_v2_created
  AFTER INSERT ON public.campaigns_v2
  FOR EACH ROW
  EXECUTE FUNCTION public.add_master_as_member_v2();

-- Trigger para updated_at automático
CREATE TRIGGER update_campaigns_v2_updated_at
  BEFORE UPDATE ON public.campaigns_v2
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_campaign_maps_v2_updated_at
  BEFORE UPDATE ON public.campaign_maps_v2
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_map_tokens_v2_updated_at
  BEFORE UPDATE ON public.map_tokens_v2
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar Realtime para tabelas que precisam de sincronização
ALTER PUBLICATION supabase_realtime ADD TABLE public.campaign_members_v2;
ALTER PUBLICATION supabase_realtime ADD TABLE public.campaign_messages_v2;
ALTER PUBLICATION supabase_realtime ADD TABLE public.campaign_sessions_v2;
ALTER PUBLICATION supabase_realtime ADD TABLE public.campaign_maps_v2;
ALTER PUBLICATION supabase_realtime ADD TABLE public.map_tokens_v2;