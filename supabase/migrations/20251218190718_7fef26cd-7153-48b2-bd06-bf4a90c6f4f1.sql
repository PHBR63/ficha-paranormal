-- Criar políticas que explicitamente negam UPDATE e DELETE para todos
-- Isso torna a tabela audit_logs imutável (best practice para logs de auditoria)

-- Política que nega UPDATE para todos (incluindo admins)
CREATE POLICY "Audit logs are immutable - no updates allowed"
ON public.audit_logs
FOR UPDATE
USING (false);

-- Política que nega DELETE para todos (incluindo admins)  
CREATE POLICY "Audit logs are immutable - no deletes allowed"
ON public.audit_logs
FOR DELETE
USING (false);