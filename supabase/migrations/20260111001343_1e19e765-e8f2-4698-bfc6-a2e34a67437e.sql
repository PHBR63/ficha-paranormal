-- Corrigir políticas RLS com argumentos invertidos nas tabelas de áudio

-- =====================================================
-- CAMPAIGN_AUDIO - Corrigir ordem dos argumentos
-- =====================================================

-- Remover políticas antigas
DROP POLICY IF EXISTS "Membros podem ver áudios da campanha" ON campaign_audio;
DROP POLICY IF EXISTS "Mestre pode inserir áudios" ON campaign_audio;
DROP POLICY IF EXISTS "Mestre pode atualizar áudios" ON campaign_audio;
DROP POLICY IF EXISTS "Mestre pode deletar áudios" ON campaign_audio;

-- Recriar com ordem correta: auth.uid() primeiro, campaign_id segundo
CREATE POLICY "Membros podem ver áudios da campanha"
ON campaign_audio FOR SELECT
USING (is_campaign_member(auth.uid(), campaign_id) OR is_campaign_master(auth.uid(), campaign_id));

CREATE POLICY "Mestre pode inserir áudios"
ON campaign_audio FOR INSERT
WITH CHECK (is_campaign_master(auth.uid(), campaign_id));

CREATE POLICY "Mestre pode atualizar áudios"
ON campaign_audio FOR UPDATE
USING (is_campaign_master(auth.uid(), campaign_id));

CREATE POLICY "Mestre pode deletar áudios"
ON campaign_audio FOR DELETE
USING (is_campaign_master(auth.uid(), campaign_id));

-- =====================================================
-- CAMPAIGN_SOUND_SCENES - Corrigir ordem dos argumentos
-- =====================================================

DROP POLICY IF EXISTS "Membros podem ver cenas sonoras" ON campaign_sound_scenes;
DROP POLICY IF EXISTS "Mestre pode inserir cenas" ON campaign_sound_scenes;
DROP POLICY IF EXISTS "Mestre pode atualizar cenas" ON campaign_sound_scenes;
DROP POLICY IF EXISTS "Mestre pode deletar cenas" ON campaign_sound_scenes;

CREATE POLICY "Membros podem ver cenas sonoras"
ON campaign_sound_scenes FOR SELECT
USING (is_campaign_member(auth.uid(), campaign_id) OR is_campaign_master(auth.uid(), campaign_id));

CREATE POLICY "Mestre pode inserir cenas"
ON campaign_sound_scenes FOR INSERT
WITH CHECK (is_campaign_master(auth.uid(), campaign_id));

CREATE POLICY "Mestre pode atualizar cenas"
ON campaign_sound_scenes FOR UPDATE
USING (is_campaign_master(auth.uid(), campaign_id));

CREATE POLICY "Mestre pode deletar cenas"
ON campaign_sound_scenes FOR DELETE
USING (is_campaign_master(auth.uid(), campaign_id));

-- =====================================================
-- CAMPAIGN_AUDIO_STATE - Corrigir ordem dos argumentos
-- =====================================================

DROP POLICY IF EXISTS "Membros podem ver estado do áudio" ON campaign_audio_state;
DROP POLICY IF EXISTS "Mestre pode inserir estado" ON campaign_audio_state;
DROP POLICY IF EXISTS "Mestre pode atualizar estado" ON campaign_audio_state;

CREATE POLICY "Membros podem ver estado do áudio"
ON campaign_audio_state FOR SELECT
USING (is_campaign_member(auth.uid(), campaign_id) OR is_campaign_master(auth.uid(), campaign_id));

CREATE POLICY "Mestre pode inserir estado"
ON campaign_audio_state FOR INSERT
WITH CHECK (is_campaign_master(auth.uid(), campaign_id));

CREATE POLICY "Mestre pode atualizar estado"
ON campaign_audio_state FOR UPDATE
USING (is_campaign_master(auth.uid(), campaign_id));

-- =====================================================
-- BUCKET PARA IMAGENS DE MAPAS
-- =====================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('campaign-maps', 'campaign-maps', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage para campaign-maps
CREATE POLICY "Imagens de mapas são públicas"
ON storage.objects FOR SELECT
USING (bucket_id = 'campaign-maps');

CREATE POLICY "Mestre pode fazer upload de imagens de mapas"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'campaign-maps' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Mestre pode atualizar imagens de mapas"
ON storage.objects FOR UPDATE
USING (bucket_id = 'campaign-maps' AND auth.uid() IS NOT NULL);

CREATE POLICY "Mestre pode deletar imagens de mapas"
ON storage.objects FOR DELETE
USING (bucket_id = 'campaign-maps' AND auth.uid() IS NOT NULL);