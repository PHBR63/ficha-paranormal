/**
 * Hook para alertas de auditoria em tempo real
 *
 * Escuta a tabela audit_logs via Realtime e gera alertas visuais
 * para ações críticas (exclusão de campanha, mudanças de status, etc.)
 *
 * @module Ordem Paranormal RPG v1.3
 */

import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Trash2,
  ShieldAlert,
  UserMinus,
  Archive,
  XCircle,
  Pause,
} from 'lucide-react';
import React from 'react';

// ─── Tipos de ação crítica que geram alertas ───────────────────────────────

/** Configuração visual de um alerta crítico de auditoria */
interface CriticalActionConfig {
  /** Título exibido no alerta */
  title: string;
  /** Ícone Lucide associado */
  icon: React.ElementType;
  /** Cor do alerta Sonner */
  type: 'error' | 'warning' | 'info';
}

/** Mapa de ações críticas com configuração visual */
const CRITICAL_ACTIONS: Record<string, CriticalActionConfig> = {
  // Exclusão destrutiva de campanha
  campaign_deleted: {
    title: '🗑️ Campanha Excluída',
    icon: Trash2,
    type: 'error',
  },
  // Campanha encerrada pelo admin
  campaign_status_change: {
    title: '⚠️ Status de Campanha Alterado',
    icon: ShieldAlert,
    type: 'warning',
  },
  // Usuário excluído
  user_deleted: {
    title: '👤 Usuário Excluído',
    icon: UserMinus,
    type: 'error',
  },
  // Cargo removido
  role_removed: {
    title: '🔒 Cargo Removido',
    icon: XCircle,
    type: 'warning',
  },
  // Campanha arquivada
  campaign_archived: {
    title: '📦 Campanha Arquivada',
    icon: Archive,
    type: 'info',
  },
  // Campanha pausada
  campaign_paused: {
    title: '⏸️ Campanha Pausada',
    icon: Pause,
    type: 'warning',
  },
};

/** Status que disparam alertas ao mudar em campaign_status_change */
const CRITICAL_STATUSES = ['completed', 'archived', 'paused'];

// ─── Payload Realtime do Supabase ─────────────────────────────────────────

interface AuditLogRealtimePayload {
  id: string;
  action_type: string;
  performed_by: string;
  target_user_id: string;
  old_value: string | null;
  new_value: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

// ─── Hook principal ────────────────────────────────────────────────────────

export interface UseAuditAlertsOptions {
  /** Habilitar escuta (padrão: true) */
  enabled?: boolean;
  /** Callback opcional chamado quando um alerta crítico chegar */
  onCriticalAction?: (payload: AuditLogRealtimePayload) => void;
}

/**
 * Escuta audit_logs em tempo real e dispara toasts para ações críticas.
 * Deve ser usado apenas por administradores — o RLS garante que apenas
 * admins conseguem ler a tabela.
 */
export function useAuditAlerts({
  enabled = true,
  onCriticalAction,
}: UseAuditAlertsOptions = {}) {
  /** Verificar se a ação é crítica e deve gerar alerta */
  const isCritical = useCallback((payload: AuditLogRealtimePayload): boolean => {
    const { action_type, new_value } = payload;

    // Sempre crítica
    if (action_type === 'campaign_deleted') return true;
    if (action_type === 'user_deleted') return true;
    if (action_type === 'role_removed') return true;

    // Só crítica para certos status
    if (action_type === 'campaign_status_change') {
      return CRITICAL_STATUSES.includes(new_value || '');
    }

    return false;
  }, []);

  /** Montar mensagem descritiva do alerta */
  const buildDescription = useCallback((payload: AuditLogRealtimePayload): string => {
    const details = payload.details as Record<string, unknown> | null;
    const campaignName = details?.campaign_name as string | undefined;

    switch (payload.action_type) {
      case 'campaign_deleted':
        return campaignName
          ? `A campanha "${campaignName}" foi excluída permanentemente.`
          : 'Uma campanha foi excluída permanentemente.';

      case 'campaign_status_change': {
        const statusMap: Record<string, string> = {
          paused: 'pausada',
          completed: 'encerrada',
          archived: 'arquivada',
        };
        const statusLabel = statusMap[payload.new_value || ''] || payload.new_value;
        return campaignName
          ? `A campanha "${campaignName}" foi ${statusLabel}.`
          : `Uma campanha foi ${statusLabel}.`;
      }

      case 'user_deleted':
        return 'Uma conta de usuário foi removida do sistema.';

      case 'role_removed':
        return 'Um cargo administrativo foi revogado.';

      default:
        return `Ação registrada: ${payload.action_type}`;
    }
  }, []);

  /** Disparar toast de alerta */
  const fireAlert = useCallback((payload: AuditLogRealtimePayload) => {
    const config = CRITICAL_ACTIONS[payload.action_type];
    if (!config) return;

    const description = buildDescription(payload);

    // Mapeia tipo para função Sonner
    switch (config.type) {
      case 'error':
        toast.error(config.title, {
          description,
          duration: 8000,
          // ID único para evitar duplicatas
          id: `audit-${payload.id}`,
        });
        break;
      case 'warning':
        toast.warning(config.title, {
          description,
          duration: 6000,
          id: `audit-${payload.id}`,
        });
        break;
      default:
        toast.info(config.title, {
          description,
          duration: 5000,
          id: `audit-${payload.id}`,
        });
    }
  }, [buildDescription]);

  useEffect(() => {
    if (!enabled) return;

    // Escuta INSERT na tabela audit_logs em tempo real
    const channel = supabase
      .channel('admin-audit-alerts')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'audit_logs' },
        (realtimePayload) => {
          const payload = realtimePayload.new as AuditLogRealtimePayload;

          // Só processa ações críticas
          if (!isCritical(payload)) return;

          // Disparar toast visual
          fireAlert(payload);

          // Callback externo opcional
          onCriticalAction?.(payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, isCritical, fireAlert, onCriticalAction]);
}
