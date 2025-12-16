-- Tabela de log de auditoria para alterações de permissões
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  action_type TEXT NOT NULL,
  target_user_id UUID NOT NULL,
  performed_by UUID NOT NULL,
  old_value TEXT,
  new_value TEXT,
  details JSONB DEFAULT '{}'::jsonb
);

-- Habilitar RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem ver os logs
CREATE POLICY "Admins can view audit logs"
ON public.audit_logs
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Apenas admins podem inserir logs
CREATE POLICY "Admins can insert audit logs"
ON public.audit_logs
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Criar índices para consultas comuns
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_target_user ON public.audit_logs(target_user_id);
CREATE INDEX idx_audit_logs_action_type ON public.audit_logs(action_type);