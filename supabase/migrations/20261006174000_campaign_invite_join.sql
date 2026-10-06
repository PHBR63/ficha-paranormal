-- Entrada por convite deve ser verificada no servidor, não apenas na tela.
-- Convites v1 e vínculos existentes continuam intactos; v2 ganha armazenamento
-- próprio, pois o FK de campaign_invites aponta exclusivamente para campaigns.
CREATE TABLE public.campaign_invites_v2 (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 campaign_id uuid NOT NULL REFERENCES public.campaigns_v2(id) ON DELETE CASCADE,
 invite_code text NOT NULL UNIQUE,
 created_by uuid NOT NULL REFERENCES auth.users(id),
 created_at timestamptz NOT NULL DEFAULT now(),
 expires_at timestamptz,
 max_uses integer CHECK(max_uses IS NULL OR max_uses>0),
 uses integer NOT NULL DEFAULT 0 CHECK(uses>=0)
);
ALTER TABLE public.campaign_invites_v2 ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Master reads own v2 invites" ON public.campaign_invites_v2 FOR SELECT TO authenticated
 USING(auth.uid() IS NOT NULL AND public.is_campaign_master_v2(auth.uid(),campaign_id));
REVOKE ALL ON public.campaign_invites_v2 FROM anon,authenticated;
GRANT SELECT ON public.campaign_invites_v2 TO authenticated;

-- A adição direta pelo mestre continua. Autoentrada exige a RPC com convite.
ALTER POLICY "Mestre pode adicionar membros" ON public.campaign_members_v2
 TO authenticated WITH CHECK(auth.uid() IS NOT NULL AND public.is_campaign_master_v2(auth.uid(),campaign_id));
ALTER POLICY "Masters can manage members" ON public.campaign_members
 TO authenticated WITH CHECK(auth.uid() IS NOT NULL AND public.is_campaign_master(auth.uid(),campaign_id));

CREATE FUNCTION public.create_campaign_invite_v2(p_campaign_id uuid,p_max_uses integer DEFAULT 10,p_expires_at timestamptz DEFAULT NULL)
RETURNS public.campaign_invites_v2 LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE result public.campaign_invites_v2;
BEGIN
 IF auth.uid() IS NULL OR NOT public.is_campaign_master_v2(auth.uid(),p_campaign_id) THEN RAISE EXCEPTION 'Somente o mestre pode criar convites.' USING ERRCODE='42501'; END IF;
 IF (p_max_uses IS NOT NULL AND p_max_uses NOT BETWEEN 1 AND 1000000) OR (p_expires_at IS NOT NULL AND p_expires_at<=now()) THEN
   RAISE EXCEPTION 'Limite ou validade do convite inválido.' USING ERRCODE='22023'; END IF;
 INSERT INTO public.campaign_invites_v2(campaign_id,invite_code,created_by,max_uses,expires_at)
 VALUES(p_campaign_id,'V2-'||upper(replace(gen_random_uuid()::text,'-','')),auth.uid(),p_max_uses,p_expires_at) RETURNING * INTO result;
 RETURN result;
END $$;

CREATE FUNCTION public.join_campaign_with_invite(p_code text,p_character_id uuid DEFAULT NULL)
RETURNS TABLE(campaign_id uuid,campaign_version text,campaign_name text,already_member boolean)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE invitation record; version text; name text; existing boolean;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Faça login para entrar na campanha.' USING ERRCODE='42501'; END IF;
 IF p_code IS NULL OR length(trim(p_code)) NOT BETWEEN 1 AND 100 THEN RAISE EXCEPTION 'Código de convite inválido.' USING ERRCODE='22023'; END IF;
 IF p_character_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.characters c WHERE c.id=p_character_id AND c.user_id=auth.uid()) THEN
   RAISE EXCEPTION 'Selecione uma ficha própria.' USING ERRCODE='42501'; END IF;
 -- O bloqueio serializa entradas concorrentes no último uso disponível.
 SELECT * INTO invitation FROM public.campaign_invites_v2 i WHERE i.invite_code=upper(trim(p_code)) FOR UPDATE;
 IF FOUND THEN version:='v2'; ELSE
   SELECT * INTO invitation FROM public.campaign_invites i WHERE i.invite_code=upper(trim(p_code)) FOR UPDATE;
   IF NOT FOUND THEN RAISE EXCEPTION 'Código de convite inválido.' USING ERRCODE='22023'; END IF;
   version:='v1';
 END IF;
 IF version='v2' THEN
   SELECT EXISTS(SELECT 1 FROM public.campaign_members_v2 m WHERE m.campaign_id=invitation.campaign_id AND m.user_id=auth.uid()) INTO existing;
   SELECT c.name INTO name FROM public.campaigns_v2 c WHERE c.id=invitation.campaign_id;
 ELSE
   SELECT EXISTS(SELECT 1 FROM public.campaign_members m WHERE m.campaign_id=invitation.campaign_id AND m.user_id=auth.uid()) INTO existing;
   SELECT c.name INTO name FROM public.campaigns c WHERE c.id=invitation.campaign_id;
 END IF;
 -- Retry após timeout retorna o vínculo existente e nunca consome outro uso.
 IF existing THEN RETURN QUERY SELECT invitation.campaign_id,version,name,true; RETURN; END IF;
 IF invitation.expires_at IS NOT NULL AND invitation.expires_at<=now() THEN RAISE EXCEPTION 'Código de convite expirado.' USING ERRCODE='22023'; END IF;
 IF invitation.max_uses IS NOT NULL AND invitation.uses>=invitation.max_uses THEN RAISE EXCEPTION 'Limite de usos do convite atingido.' USING ERRCODE='22023'; END IF;
 IF version='v2' THEN
   INSERT INTO public.campaign_members_v2(campaign_id,user_id,character_id,role) VALUES(invitation.campaign_id,auth.uid(),p_character_id,'player');
   UPDATE public.campaign_invites_v2 i SET uses=i.uses+1 WHERE i.id=invitation.id;
 ELSE
   INSERT INTO public.campaign_members(campaign_id,user_id,character_id,role) VALUES(invitation.campaign_id,auth.uid(),p_character_id,'player');
   UPDATE public.campaign_invites i SET uses=i.uses+1 WHERE i.id=invitation.id;
 END IF;
 RETURN QUERY SELECT invitation.campaign_id,version,name,false;
END $$;
REVOKE ALL ON FUNCTION public.create_campaign_invite_v2(uuid,integer,timestamptz),public.join_campaign_with_invite(text,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.create_campaign_invite_v2(uuid,integer,timestamptz),public.join_campaign_with_invite(text,uuid) TO authenticated;
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='character_activity_visibility') THEN
   ALTER PUBLICATION supabase_realtime ADD TABLE public.character_activity_visibility;
 END IF;
END $$;
