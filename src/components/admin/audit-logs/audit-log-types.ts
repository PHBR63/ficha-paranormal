/**
 * Tipos para o sistema de Logs de Auditoria
 * 
 * Define interfaces para eventos de auditoria,
 * filtros e configurações de exibição.
 * 
 * @module Ordem Paranormal RPG v1.3
 */

import type { LucideIcon } from 'lucide-react';

/** Tipos de ação de auditoria */
export type AuditActionType = 
  | 'user_created'
  | 'user_updated'
  | 'user_deleted'
  | 'role_assigned'
  | 'role_removed'
  | 'character_created'
  | 'character_updated'
  | 'character_deleted'
  | 'campaign_created'
  | 'campaign_updated'
  | 'campaign_deleted'
  | 'session_started'
  | 'session_ended'
  | 'login'
  | 'logout'
  | 'settings_changed'
  | string; // Permite tipos customizados

/** Registro de auditoria do banco de dados */
export interface AuditLogEntry {
  id: string;
  action_type: string;
  performed_by: string;
  target_user_id: string;
  old_value: string | null;
  new_value: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

/** Registro enriquecido com dados do perfil */
export interface EnrichedAuditLogEntry extends AuditLogEntry {
  performer_profile?: {
    display_name: string | null;
    avatar_url?: string | null;
  };
  target_profile?: {
    display_name: string | null;
    avatar_url?: string | null;
  };
}

/** Filtros para busca de logs */
export interface AuditLogFilters extends Record<string, unknown> {
  actionType?: string;
  dateFrom?: string;
  dateTo?: string;
  performedBy?: string;
  targetUser?: string;
}

/** Configuração visual de um tipo de ação */
export interface ActionTypeConfig {
  label: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
}

/** Props para componentes de log */
export interface AuditLogEntryProps {
  entry: EnrichedAuditLogEntry;
  showDetails?: boolean;
}

/** Estatísticas de auditoria */
export interface AuditStats {
  total: number;
  today: number;
  thisWeek: number;
  byActionType: Record<string, number>;
}
