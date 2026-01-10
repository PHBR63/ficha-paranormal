-- Tabela para arquivos de áudio da campanha
CREATE TABLE public.campaign_audio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  audio_url TEXT NOT NULL,
  audio_type TEXT NOT NULL DEFAULT 'ambient', -- 'ambient', 'music', 'sfx'
  duration_seconds INTEGER,
  tags TEXT[] DEFAULT '{}',
  is_looping BOOLEAN DEFAULT true,
  volume DECIMAL DEFAULT 1.0,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela para cenas sonoras predefinidas
CREATE TABLE public.campaign_sound_scenes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '🎵',
  tracks JSONB NOT NULL DEFAULT '[]', -- [{audio_id, volume, fade_in_seconds}]
  master_volume DECIMAL DEFAULT 1.0,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela para estado atual do áudio (o que está tocando)
CREATE TABLE public.campaign_audio_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE UNIQUE,
  current_scene_id UUID REFERENCES public.campaign_sound_scenes(id) ON DELETE SET NULL,
  playing_tracks JSONB DEFAULT '[]', -- [{audio_id, volume, position, is_playing}]
  master_volume DECIMAL DEFAULT 1.0,
  is_muted BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID NOT NULL
);

-- Índices
CREATE INDEX idx_campaign_audio_campaign ON public.campaign_audio(campaign_id);
CREATE INDEX idx_campaign_audio_type ON public.campaign_audio(audio_type);
CREATE INDEX idx_campaign_sound_scenes_campaign ON public.campaign_sound_scenes(campaign_id);

-- RLS
ALTER TABLE public.campaign_audio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_sound_scenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_audio_state ENABLE ROW LEVEL SECURITY;

-- Políticas para campaign_audio
CREATE POLICY "Membros podem ver áudios da campanha"
ON public.campaign_audio FOR SELECT
USING (is_campaign_member(campaign_id, auth.uid()));

CREATE POLICY "Mestre pode inserir áudios"
ON public.campaign_audio FOR INSERT
WITH CHECK (is_campaign_master(campaign_id, auth.uid()));

CREATE POLICY "Mestre pode atualizar áudios"
ON public.campaign_audio FOR UPDATE
USING (is_campaign_master(campaign_id, auth.uid()));

CREATE POLICY "Mestre pode deletar áudios"
ON public.campaign_audio FOR DELETE
USING (is_campaign_master(campaign_id, auth.uid()));

-- Políticas para campaign_sound_scenes
CREATE POLICY "Membros podem ver cenas sonoras"
ON public.campaign_sound_scenes FOR SELECT
USING (is_campaign_member(campaign_id, auth.uid()));

CREATE POLICY "Mestre pode inserir cenas"
ON public.campaign_sound_scenes FOR INSERT
WITH CHECK (is_campaign_master(campaign_id, auth.uid()));

CREATE POLICY "Mestre pode atualizar cenas"
ON public.campaign_sound_scenes FOR UPDATE
USING (is_campaign_master(campaign_id, auth.uid()));

CREATE POLICY "Mestre pode deletar cenas"
ON public.campaign_sound_scenes FOR DELETE
USING (is_campaign_master(campaign_id, auth.uid()));

-- Políticas para campaign_audio_state
CREATE POLICY "Membros podem ver estado do áudio"
ON public.campaign_audio_state FOR SELECT
USING (is_campaign_member(campaign_id, auth.uid()));

CREATE POLICY "Mestre pode inserir estado"
ON public.campaign_audio_state FOR INSERT
WITH CHECK (is_campaign_master(campaign_id, auth.uid()));

CREATE POLICY "Mestre pode atualizar estado"
ON public.campaign_audio_state FOR UPDATE
USING (is_campaign_master(campaign_id, auth.uid()));

-- Habilitar realtime para sincronização
ALTER PUBLICATION supabase_realtime ADD TABLE public.campaign_audio_state;

-- Trigger para updated_at
CREATE TRIGGER update_campaign_audio_updated_at
BEFORE UPDATE ON public.campaign_audio
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_campaign_sound_scenes_updated_at
BEFORE UPDATE ON public.campaign_sound_scenes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket para áudios
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'campaign-audio',
  'campaign-audio',
  true,
  52428800, -- 50MB
  ARRAY['audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/mp3', 'audio/webm']
) ON CONFLICT (id) DO NOTHING;

-- Políticas de storage
CREATE POLICY "Membros podem ver áudios"
ON storage.objects FOR SELECT
USING (bucket_id = 'campaign-audio');

CREATE POLICY "Mestre pode fazer upload de áudios"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'campaign-audio');

CREATE POLICY "Mestre pode deletar áudios"
ON storage.objects FOR DELETE
USING (bucket_id = 'campaign-audio');