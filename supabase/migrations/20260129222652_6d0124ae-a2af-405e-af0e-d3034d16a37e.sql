-- =============================================================
-- Correção: RLS recursiva em campaign_members_v2
-- Problema: Policy fazia auto-referência causando loop infinito
-- Solução: Usar campaigns_v2 como tabela de verificação
-- =============================================================

-- Remover policy problemática
DROP POLICY IF EXISTS "Membros visíveis para todos da campanha" ON public.campaign_members_v2;

-- Recriar policy SEM auto-referência (evita recursão infinita)
CREATE POLICY "Membros visíveis para todos da campanha" ON public.campaign_members_v2
  FOR SELECT USING (
    -- Usa campaigns_v2 como tabela de verificação (sem recursão)
    EXISTS (
      SELECT 1 FROM public.campaigns_v2 c
      WHERE c.id = campaign_members_v2.campaign_id
        AND (
          c.master_id = auth.uid()  -- É o mestre da campanha
          OR campaign_members_v2.user_id = auth.uid()  -- É o próprio registro do usuário
        )
    )
  );