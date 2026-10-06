-- Compatibilidade v2: nomes/avatares dos participantes eram legíveis somente
-- via campanha v1. Mantém guard RESTRICTIVE e demais políticas intactas.
CREATE POLICY "Campaign v2 members can view fellow profiles"
ON public.profiles FOR SELECT TO authenticated USING (
 auth.uid() IS NOT NULL AND EXISTS (
   SELECT 1 FROM public.campaign_members_v2 member
   WHERE member.user_id=profiles.user_id AND (
     public.is_campaign_member_v2(auth.uid(),member.campaign_id)
     OR public.is_campaign_master_v2(auth.uid(),member.campaign_id)
   )
 )
);
