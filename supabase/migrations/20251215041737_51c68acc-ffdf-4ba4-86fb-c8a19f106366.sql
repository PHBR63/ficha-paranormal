
-- =====================================================
-- MIGRAÇÃO: Corrigir Recursão Infinita nas Políticas RLS
-- =====================================================

-- 1. REMOVER POLÍTICAS PROBLEMÁTICAS
-- ===================================

-- campaign_members
DROP POLICY IF EXISTS "Members can view campaign members" ON campaign_members;

-- campaign_invites  
DROP POLICY IF EXISTS "Authenticated users can view invites for their campaigns" ON campaign_invites;

-- campaign_notes
DROP POLICY IF EXISTS "Members can view shared notes and recaps" ON campaign_notes;

-- campaign_sessions
DROP POLICY IF EXISTS "Members can view sessions" ON campaign_sessions;

-- campaign_messages
DROP POLICY IF EXISTS "Members can view campaign messages" ON campaign_messages;
DROP POLICY IF EXISTS "Members can send messages" ON campaign_messages;

-- 2. RECRIAR FUNÇÕES COM SECURITY DEFINER
-- ========================================

-- Função para verificar se usuário é membro da campanha
-- SECURITY DEFINER bypassa RLS e evita recursão
CREATE OR REPLACE FUNCTION public.is_campaign_member(_user_id uuid, _campaign_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM campaign_members
    WHERE user_id = _user_id AND campaign_id = _campaign_id
  )
$$;

-- Função para verificar se usuário é mestre da campanha
CREATE OR REPLACE FUNCTION public.is_campaign_master(_user_id uuid, _campaign_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM campaigns
    WHERE id = _campaign_id AND master_id = _user_id
  )
$$;

-- 3. RECRIAR POLÍTICAS SEM RECURSÃO
-- ==================================

-- campaign_members: Usuários podem ver membros se:
-- - São o próprio membro OU
-- - São o mestre da campanha OU
-- - São membros da mesma campanha (via função SECURITY DEFINER)
CREATE POLICY "Members can view campaign members" ON campaign_members
FOR SELECT USING (
  user_id = auth.uid()
  OR is_campaign_master(auth.uid(), campaign_id)
  OR is_campaign_member(auth.uid(), campaign_id)
);

-- campaign_invites: Membros podem ver convites
CREATE POLICY "Authenticated users can view invites for their campaigns" ON campaign_invites
FOR SELECT USING (
  auth.uid() IS NOT NULL
  AND (
    is_campaign_member(auth.uid(), campaign_id)
    OR is_campaign_master(auth.uid(), campaign_id)
  )
);

-- campaign_notes: Membros podem ver notas compartilhadas e recaps
CREATE POLICY "Members can view shared notes and recaps" ON campaign_notes
FOR SELECT USING (
  (is_private = false OR note_type = 'session_recap')
  AND (
    is_campaign_member(auth.uid(), campaign_id)
    OR is_campaign_master(auth.uid(), campaign_id)
  )
);

-- campaign_sessions: Membros podem ver sessões
CREATE POLICY "Members can view sessions" ON campaign_sessions
FOR SELECT USING (
  is_campaign_member(auth.uid(), campaign_id)
  OR is_campaign_master(auth.uid(), campaign_id)
);

-- campaign_messages: Membros podem ver mensagens
CREATE POLICY "Members can view campaign messages" ON campaign_messages
FOR SELECT USING (
  is_campaign_member(auth.uid(), campaign_id)
  OR is_campaign_master(auth.uid(), campaign_id)
);

-- campaign_messages: Membros podem enviar mensagens
CREATE POLICY "Members can send messages" ON campaign_messages
FOR INSERT WITH CHECK (
  auth.uid() = user_id
  AND (
    is_campaign_member(auth.uid(), campaign_id)
    OR is_campaign_master(auth.uid(), campaign_id)
  )
);
