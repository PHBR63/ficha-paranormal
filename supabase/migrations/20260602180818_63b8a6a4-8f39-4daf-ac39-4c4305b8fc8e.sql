
-- ============================================================================
-- Limpeza de policies amplas em storage.objects + RLS em realtime.messages
-- ============================================================================

-- 1) Remove policies SELECT amplas (públicas) dos buckets de campanha.
-- Já existem policies membership-scoped: "Campaign members can view maps",
-- "Campaign members can view audio". Para assets, criamos uma membership-scoped.
DROP POLICY IF EXISTS "Imagens de mapas são públicas" ON storage.objects;
DROP POLICY IF EXISTS "Membros podem ver áudios" ON storage.objects;
DROP POLICY IF EXISTS "Assets de campanha são públicos para leitura" ON storage.objects;

-- 2) Remove UPDATE/DELETE amplos em maps (que só checavam auth.uid() IS NOT NULL).
-- Já existem "Campaign masters can update maps" e "Campaign masters can delete maps".
DROP POLICY IF EXISTS "Mestre pode atualizar imagens de mapas" ON storage.objects;
DROP POLICY IF EXISTS "Mestre pode deletar imagens de mapas" ON storage.objects;
DROP POLICY IF EXISTS "Mestre pode fazer upload de imagens de mapas" ON storage.objects;

-- 3) Cria policy SELECT membership-scoped para campaign-assets.
CREATE POLICY "Membros podem ver assets do storage"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'campaign-assets'
    AND (
      is_campaign_member(auth.uid(), ((storage.foldername(name))[1])::uuid)
      OR is_campaign_master(auth.uid(), ((storage.foldername(name))[1])::uuid)
    )
  );

-- 4) Upload de imagens de mapa restrito ao mestre via path.
CREATE POLICY "Mestre pode subir mapas (path checked)"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'campaign-maps'
    AND auth.uid() IS NOT NULL
    AND is_campaign_master(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );

-- ============================================================================
-- 5) RLS em realtime.messages restringindo subscribe por membership
-- ============================================================================
-- Os tópicos usados no app sempre incluem o UUID da campanha (ex:
-- "campaign-realtime-<uuid>", "tactical-board-<uuid>", "campaign-presence-<uuid>").
-- Qualquer tópico que NÃO contenha um UUID de campanha à qual o user pertença
-- fica bloqueado para usuários autenticados (anon nunca acessa realtime).
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated members can use realtime topics" ON realtime.messages;
CREATE POLICY "Authenticated members can use realtime topics"
  ON realtime.messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.campaign_members cm
      WHERE cm.user_id = auth.uid()
        AND topic LIKE '%' || cm.campaign_id::text || '%'
    )
    OR EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.master_id = auth.uid()
        AND topic LIKE '%' || c.id::text || '%'
    )
    OR EXISTS (
      SELECT 1 FROM public.campaign_members_v2 cm
      WHERE cm.user_id = auth.uid()
        AND topic LIKE '%' || cm.campaign_id::text || '%'
    )
    OR EXISTS (
      SELECT 1 FROM public.campaigns_v2 c
      WHERE c.master_id = auth.uid()
        AND topic LIKE '%' || c.id::text || '%'
    )
  );

-- INSERT em realtime.messages (broadcast/presence) — mesmo critério
DROP POLICY IF EXISTS "Authenticated members can broadcast" ON realtime.messages;
CREATE POLICY "Authenticated members can broadcast"
  ON realtime.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.campaign_members cm
      WHERE cm.user_id = auth.uid()
        AND topic LIKE '%' || cm.campaign_id::text || '%'
    )
    OR EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.master_id = auth.uid()
        AND topic LIKE '%' || c.id::text || '%'
    )
    OR EXISTS (
      SELECT 1 FROM public.campaign_members_v2 cm
      WHERE cm.user_id = auth.uid()
        AND topic LIKE '%' || cm.campaign_id::text || '%'
    )
    OR EXISTS (
      SELECT 1 FROM public.campaigns_v2 c
      WHERE c.master_id = auth.uid()
        AND topic LIKE '%' || c.id::text || '%'
    )
  );
