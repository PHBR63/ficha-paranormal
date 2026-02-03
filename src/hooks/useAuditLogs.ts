/**
 * Hook para gerenciamento de Logs de Auditoria
 * 
 * Fornece:
 * - Busca paginada de logs
 * - Enriquecimento com dados de perfil
 * - Filtros por tipo, data e usuário
 * - Estatísticas de auditoria
 * 
 * @module Ordem Paranormal RPG v1.3
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfDay, startOfWeek, subDays } from 'date-fns';
import type { Json } from '@/integrations/supabase/types';
import type { 
  AuditLogEntry, 
  EnrichedAuditLogEntry, 
  AuditLogFilters,
  AuditStats 
} from '@/components/admin/audit-logs/audit-log-types';

interface UseAuditLogsOptions {
  /** Número de registros por página */
  pageSize?: number;
  /** Página atual (0-indexed) */
  page?: number;
  /** Filtros ativos */
  filters?: AuditLogFilters;
  /** Habilitar busca */
  enabled?: boolean;
}

interface UseAuditLogsResult {
  /** Logs enriquecidos */
  logs: EnrichedAuditLogEntry[];
  /** Total de registros */
  total: number;
  /** Estatísticas */
  stats: AuditStats | null;
  /** Estado de carregamento */
  isLoading: boolean;
  /** Erro da query */
  error: Error | null;
  /** Recarregar dados */
  refetch: () => void;
}

/**
 * Hook para buscar e gerenciar logs de auditoria
 */
export function useAuditLogs({
  pageSize = 20,
  page = 0,
  filters = {},
  enabled = true
}: UseAuditLogsOptions = {}): UseAuditLogsResult {
  
  // Query principal para logs
  const logsQuery = useQuery({
    queryKey: ['audit-logs', page, pageSize, filters],
    queryFn: async () => {
      // Construir query base
      let query = supabase
        .from('audit_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      // Aplicar filtros
      if (filters.actionType && filters.actionType !== 'all') {
        query = query.eq('action_type', filters.actionType);
      }
      
      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }
      
      if (filters.dateTo) {
        // Adicionar 1 dia para incluir o dia final completo
        const endDate = new Date(filters.dateTo);
        endDate.setDate(endDate.getDate() + 1);
        query = query.lt('created_at', endDate.toISOString());
      }
      
      if (filters.performedBy) {
        query = query.eq('performed_by', filters.performedBy);
      }
      
      if (filters.targetUser) {
        query = query.eq('target_user_id', filters.targetUser);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      // Enriquecer com dados de perfil
      const logs = data as AuditLogEntry[];
      const enrichedLogs: EnrichedAuditLogEntry[] = [];

      // Coletar IDs únicos de usuários
      const userIds = new Set<string>();
      logs.forEach(log => {
        userIds.add(log.performed_by);
        if (log.target_user_id) userIds.add(log.target_user_id);
      });

      // Buscar perfis em batch
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', Array.from(userIds));

      const profileMap = new Map(
        profiles?.map(p => [p.user_id, p]) || []
      );

      // Enriquecer logs
      for (const log of logs) {
        enrichedLogs.push({
          ...log,
          details: log.details as Record<string, unknown> | null,
          performer_profile: profileMap.get(log.performed_by) || undefined,
          target_profile: profileMap.get(log.target_user_id) || undefined
        });
      }

      return {
        logs: enrichedLogs,
        total: count || 0
      };
    },
    enabled
  });

  // Query para estatísticas
  const statsQuery = useQuery({
    queryKey: ['audit-logs-stats'],
    queryFn: async () => {
      const now = new Date();
      const todayStart = startOfDay(now).toISOString();
      const weekStart = startOfWeek(now, { weekStartsOn: 0 }).toISOString();

      // Buscar total
      const { count: total } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact', head: true });

      // Buscar hoje
      const { count: today } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', todayStart);

      // Buscar esta semana
      const { count: thisWeek } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', weekStart);

      // Buscar contagem por tipo (últimos 30 dias)
      const thirtyDaysAgo = subDays(now, 30).toISOString();
      const { data: recentLogs } = await supabase
        .from('audit_logs')
        .select('action_type')
        .gte('created_at', thirtyDaysAgo);

      const byActionType: Record<string, number> = {};
      recentLogs?.forEach(log => {
        byActionType[log.action_type] = (byActionType[log.action_type] || 0) + 1;
      });

      return {
        total: total || 0,
        today: today || 0,
        thisWeek: thisWeek || 0,
        byActionType
      } as AuditStats;
    },
    enabled,
    staleTime: 60000 // Cache por 1 minuto
  });

  return {
    logs: logsQuery.data?.logs || [],
    total: logsQuery.data?.total || 0,
    stats: statsQuery.data || null,
    isLoading: logsQuery.isLoading,
    error: logsQuery.error as Error | null,
    refetch: logsQuery.refetch
  };
}

/**
 * Hook para adicionar um novo log de auditoria
 */
export function useAddAuditLog() {
  const addLog = async (entry: {
    action_type: string;
    performed_by: string;
    target_user_id: string;
    old_value?: string | null;
    new_value?: string | null;
    details?: Json;
  }) => {
    const { error } = await supabase
      .from('audit_logs')
      .insert([entry]);

    if (error) throw error;
  };

  return { addLog };
}
