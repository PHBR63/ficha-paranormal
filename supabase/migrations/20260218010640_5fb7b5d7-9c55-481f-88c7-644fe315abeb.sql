-- Habilita Realtime para a tabela de logs de auditoria
ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_logs;