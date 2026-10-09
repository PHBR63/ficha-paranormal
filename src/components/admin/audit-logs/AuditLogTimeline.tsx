/**
 * AuditLogTimeline - Componente principal de timeline de auditoria
 * 
 * Integra estatísticas, filtros e lista de eventos em uma
 * interface visual de timeline.
 * 
 * @module Ordem Paranormal RPG v1.3
 */

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { 
  RefreshCw, 
  History, 
  AlertTriangle,
  Inbox,
  Bell
} from '@/components/icons/ordem-icons';
import { useAuditLogs } from '@/hooks/useAuditLogs';
import { useAuditAlerts } from '@/hooks/useAuditAlerts';
import { AuditLogStats } from './AuditLogStats';
import { AuditLogFiltersComponent } from './AuditLogFilters';
import { AuditLogEntryComponent } from './AuditLogEntry';
import { AdminPagination } from '@/components/admin/AdminPagination';
import type { AuditLogFilters } from './audit-log-types';

/**
 * Componente principal de timeline de logs de auditoria
 */
export function AuditLogTimeline() {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(15);
  const [filters, setFilters] = useState<AuditLogFilters>({});
  // Contador de alertas críticos recebidos em tempo real nesta sessão
  const [criticalCount, setCriticalCount] = useState(0);

  const { logs, total, stats, isLoading, error, refetch } = useAuditLogs({
    page,
    pageSize,
    filters
  });

  // Escuta audit_logs em tempo real: ao receber ação crítica,
  // atualiza a lista e incrementa o contador de alertas
  useAuditAlerts({
    enabled: true,
    onCriticalAction: () => {
      setCriticalCount(prev => prev + 1);
      refetch(); // Recarrega a lista para mostrar o novo log
    },
  });

  // Handlers de filtro
  const handleFilterChange = useCallback((key: keyof AuditLogFilters, value: string | undefined) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(0); // Reset para primeira página ao filtrar
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({});
    setPage(0);
  }, []);

  // Paginação
  const totalPages = Math.ceil(total / pageSize);

  // Loading skeleton
  if (isLoading && logs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
          <Skeleton className="h-10 w-full" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-24 flex-1" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  // Estado de erro
  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertTriangle className="w-12 h-12 mx-auto text-destructive mb-4" />
          <h3 className="text-lg font-semibold mb-2">Erro ao carregar logs</h3>
          <p className="text-muted-foreground mb-4">{error.message}</p>
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <AuditLogStats stats={stats} isLoading={isLoading} />

      {/* Card principal */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Timeline de Auditoria
              {/* Badge de alertas críticos recebidos nesta sessão */}
              {criticalCount > 0 && (
                <Badge
                  variant="destructive"
                  className="ml-1 animate-pulse flex items-center gap-1 text-xs"
                  title={`${criticalCount} ação(ões) crítica(s) detectada(s) nesta sessão`}
                >
                  <Bell className="w-3 h-3" />
                  {criticalCount}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Histórico completo de ações administrativas no sistema
              {criticalCount > 0 && (
                <span className="ml-2 text-destructive font-medium text-xs">
                  — {criticalCount} alerta(s) crítico(s) recebido(s)
                </span>
              )}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            <span className="ml-2 hidden sm:inline">Atualizar</span>
          </Button>
        </CardHeader>

        <CardContent>
          {/* Filtros */}
          <AuditLogFiltersComponent
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
            totalResults={total}
            totalItems={stats?.total || total}
          />

          {/* Timeline */}
          {logs.length === 0 ? (
            <div className="text-center py-12">
              <Inbox className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum evento encontrado</h3>
              <p className="text-muted-foreground">
                {Object.keys(filters).length > 0 
                  ? 'Tente ajustar os filtros para ver mais resultados.'
                  : 'Ainda não há eventos de auditoria registrados.'
                }
              </p>
            </div>
          ) : (
            <>
              <ScrollArea className="h-[500px] pr-4">
                <div className="relative">
                  {logs.map((entry, index) => (
                    <AuditLogEntryComponent
                      key={entry.id}
                      entry={entry}
                      isLast={index === logs.length - 1}
                    />
                  ))}
                </div>
              </ScrollArea>

              {/* Paginação */}
              {totalPages > 1 && (
                <div className="mt-6 pt-4 border-t border-border">
                  <AdminPagination
                    page={page + 1}
                    totalPages={totalPages}
                    pageSize={pageSize}
                    totalItems={total}
                    onPageChange={(p) => setPage(p - 1)}
                    onPageSizeChange={(size) => {
                      setPageSize(size);
                      setPage(0);
                    }}
                    pageSizeOptions={[10, 15, 25, 50]}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
