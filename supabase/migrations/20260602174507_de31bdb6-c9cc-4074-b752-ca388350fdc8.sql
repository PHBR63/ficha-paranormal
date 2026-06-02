
-- 1) push_subscriptions: drop broad authenticated DML policies (owner-scoped policies remain)
DROP POLICY IF EXISTS "Block anonymous insert to push_subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Block anonymous update to push_subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Block anonymous delete to push_subscriptions" ON public.push_subscriptions;

-- 2) campaign_members: remove broad authenticated DML block policies (owner/master policies remain)
DROP POLICY IF EXISTS "Block anonymous insert to campaign_members" ON public.campaign_members;
DROP POLICY IF EXISTS "Block anonymous update to campaign_members" ON public.campaign_members;
DROP POLICY IF EXISTS "Block anonymous delete to campaign_members" ON public.campaign_members;

-- 3) campaign_members_v2: restrict UPDATE to master only (prevents role escalation)
DROP POLICY IF EXISTS "Mestre pode atualizar membros" ON public.campaign_members_v2;
CREATE POLICY "Mestre pode atualizar membros"
ON public.campaign_members_v2
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM campaigns_v2
    WHERE campaigns_v2.id = campaign_members_v2.campaign_id
      AND campaigns_v2.master_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM campaigns_v2
    WHERE campaigns_v2.id = campaign_members_v2.campaign_id
      AND campaigns_v2.master_id = auth.uid()
  )
);

-- 4) campaign_npcs: fix swapped argument order
DROP POLICY IF EXISTS "Membros podem ver NPCs ativos" ON public.campaign_npcs;
CREATE POLICY "Membros podem ver NPCs ativos"
ON public.campaign_npcs
FOR SELECT
USING (is_active = true AND is_campaign_member(auth.uid(), campaign_id));

DROP POLICY IF EXISTS "Mestre pode gerenciar NPCs" ON public.campaign_npcs;
CREATE POLICY "Mestre pode gerenciar NPCs"
ON public.campaign_npcs
FOR ALL
USING (is_campaign_master(auth.uid(), campaign_id))
WITH CHECK (is_campaign_master(auth.uid(), campaign_id));

-- 5) campaign_timeline_events: fix swapped argument order
DROP POLICY IF EXISTS "Membros podem ver eventos" ON public.campaign_timeline_events;
CREATE POLICY "Membros podem ver eventos"
ON public.campaign_timeline_events
FOR SELECT
USING (
  is_campaign_member(auth.uid(), campaign_id)
  OR is_campaign_master(auth.uid(), campaign_id)
);

DROP POLICY IF EXISTS "Mestre pode gerenciar eventos" ON public.campaign_timeline_events;
CREATE POLICY "Mestre pode gerenciar eventos"
ON public.campaign_timeline_events
FOR ALL
USING (is_campaign_master(auth.uid(), campaign_id))
WITH CHECK (is_campaign_master(auth.uid(), campaign_id));

-- 6) campaign_messages_v2: add whisper privacy filter
DROP POLICY IF EXISTS "Mensagens visíveis para membros" ON public.campaign_messages_v2;
CREATE POLICY "Mensagens visíveis para membros"
ON public.campaign_messages_v2
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND (
    is_campaign_member_v2(auth.uid(), campaign_id)
    OR is_campaign_master_v2(auth.uid(), campaign_id)
  )
  AND (
    message_type <> 'whisper'
    OR user_id = auth.uid()
    OR recipient_id = auth.uid()
    OR is_campaign_master_v2(auth.uid(), campaign_id)
  )
);
