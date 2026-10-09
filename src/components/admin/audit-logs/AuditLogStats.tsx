/**
 * AuditLogStats - Cards de estatísticas de auditoria
 * 
 * Exibe contadores de eventos: total, hoje, esta semana
 * e os tipos mais frequentes.
 * 
 * @module Ordem Paranormal RPG v1.3
 */

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Activity, 
  Calendar, 
  CalendarDays, 
  TrendingUp 
} from '@/components/icons/ordem-icons';
import type { AuditStats } from './audit-log-types';
import { getActionConfig } from './audit-log-constants';

interface AuditLogStatsProps {
  stats: AuditStats | null;
  isLoading?: boolean;
}

/**
 * Componente de estatísticas de logs de auditoria
 */
export function AuditLogStats({ stats, isLoading }: AuditLogStatsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  // Encontrar o tipo mais frequente
  const topActionType = Object.entries(stats.byActionType)
    .sort(([, a], [, b]) => b - a)[0];
  const topConfig = topActionType ? getActionConfig(topActionType[0]) : null;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Total de eventos */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <Activity className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total de Eventos</p>
              <p className="text-2xl font-bold">{stats.total.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Eventos hoje */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-emerald-500/10">
              <Calendar className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Hoje</p>
              <p className="text-2xl font-bold">{stats.today}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Eventos esta semana */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-blue-500/10">
              <CalendarDays className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Esta Semana</p>
              <p className="text-2xl font-bold">{stats.thisWeek}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tipo mais frequente */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-amber-500/10">
              <TrendingUp className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Mais Frequente</p>
              {topConfig ? (
                <p className="text-sm font-medium truncate" title={topConfig.label}>
                  {topConfig.label}
                  <span className="text-muted-foreground ml-1">
                    ({topActionType[1]})
                  </span>
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
