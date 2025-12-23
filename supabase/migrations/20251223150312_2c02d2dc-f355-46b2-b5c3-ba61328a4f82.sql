-- Reforça a função get_push_subscriptions_for_campaign para verificar se o chamador é mestre da campanha
-- Isso garante que apenas mestres podem obter credenciais de push de membros da campanha
CREATE OR REPLACE FUNCTION public.get_push_subscriptions_for_campaign(_campaign_id uuid, _user_ids uuid[] DEFAULT NULL::uuid[])
RETURNS TABLE(id uuid, user_id uuid, endpoint text, p256dh text, auth text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Verifica se o chamador é mestre da campanha
  IF NOT is_campaign_master(auth.uid(), _campaign_id) THEN
    RAISE EXCEPTION 'Acesso negado: apenas o mestre da campanha pode obter credenciais de push';
  END IF;

  RETURN QUERY
  SELECT 
    ps.id,
    ps.user_id,
    ps.endpoint,
    ps.p256dh,
    ps.auth
  FROM push_subscriptions ps
  WHERE ps.user_id IN (
    SELECT cm.user_id 
    FROM campaign_members cm 
    WHERE cm.campaign_id = _campaign_id
  )
  AND (_user_ids IS NULL OR ps.user_id = ANY(_user_ids));
END;
$function$;