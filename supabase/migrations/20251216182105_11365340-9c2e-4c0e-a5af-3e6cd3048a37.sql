-- Adiciona campo para armazenar bônus ativos do personagem na campanha
ALTER TABLE public.campaign_members 
ADD COLUMN IF NOT EXISTS active_bonuses jsonb DEFAULT '{}'::jsonb;

-- Adiciona campo para timestamp de última atualização dos bônus
ALTER TABLE public.campaign_members 
ADD COLUMN IF NOT EXISTS bonuses_updated_at timestamp with time zone DEFAULT now();

-- Cria índice para consultas de bônus
CREATE INDEX IF NOT EXISTS idx_campaign_members_bonuses 
ON public.campaign_members USING gin(active_bonuses);

-- Habilita realtime para campaign_members
ALTER TABLE public.campaign_members REPLICA IDENTITY FULL;

-- Adiciona à publicação realtime se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'campaign_members'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.campaign_members;
  END IF;
END $$;

-- Comentários para documentação
COMMENT ON COLUMN public.campaign_members.active_bonuses IS 'JSON com bônus ativos do personagem (defesa, resistências, combate, perícias, etc.)';
COMMENT ON COLUMN public.campaign_members.bonuses_updated_at IS 'Timestamp da última atualização dos bônus';