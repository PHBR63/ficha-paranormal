-- Habilita Realtime para as tabelas de campanhas v1 e v2
ALTER PUBLICATION supabase_realtime ADD TABLE public.campaigns;
ALTER PUBLICATION supabase_realtime ADD TABLE public.campaigns_v2;