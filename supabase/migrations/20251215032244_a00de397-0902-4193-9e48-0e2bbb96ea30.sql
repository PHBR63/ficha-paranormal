-- Remove a política pública vulnerável
DROP POLICY IF EXISTS "Anyone can view valid invite by code" ON public.campaign_invites;

-- Cria função segura para validar código de convite sem expor a tabela
CREATE OR REPLACE FUNCTION public.validate_campaign_invite(code TEXT)
RETURNS TABLE(valid BOOLEAN, campaign_id UUID, message TEXT) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invite_record RECORD;
BEGIN
  -- Busca o convite pelo código (case insensitive)
  SELECT * INTO invite_record 
  FROM campaign_invites 
  WHERE invite_code = UPPER(TRIM(code));
  
  -- Verifica se o código existe
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 'Código de convite inválido'::TEXT;
    RETURN;
  END IF;
  
  -- Verifica se expirou
  IF invite_record.expires_at IS NOT NULL AND invite_record.expires_at < NOW() THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 'Código de convite expirado'::TEXT;
    RETURN;
  END IF;
  
  -- Verifica limite de usos
  IF invite_record.max_uses IS NOT NULL AND invite_record.uses >= invite_record.max_uses THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 'Limite de usos do convite atingido'::TEXT;
    RETURN;
  END IF;
  
  -- Código válido
  RETURN QUERY SELECT TRUE, invite_record.campaign_id, 'Código válido'::TEXT;
END;
$$;

-- Política restritiva: apenas usuários autenticados podem ver convites de campanhas que participam
CREATE POLICY "Authenticated users can view invites for their campaigns"
ON public.campaign_invites FOR SELECT
USING (
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM public.campaign_members
    WHERE campaign_members.campaign_id = campaign_invites.campaign_id
    AND campaign_members.user_id = auth.uid()
  )
);