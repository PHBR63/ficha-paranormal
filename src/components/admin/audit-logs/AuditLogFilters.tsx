/**
 * AuditLogFilters - Painel de filtros para logs de auditoria
 * 
 * Permite filtrar por:
 * - Tipo de ação
 * - Intervalo de datas
 * - Termo de busca (usuário)
 * 
 * @module Ordem Paranormal RPG v1.3
 */

import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, Filter, X, Search } from '@/components/icons/ordem-icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { ACTION_TYPE_OPTIONS } from './audit-log-constants';
import type { AuditLogFilters as Filters } from './audit-log-types';

interface AuditLogFiltersProps {
  filters: Filters;
  onFilterChange: (key: keyof Filters, value: string | undefined) => void;
  onClearFilters: () => void;
  totalResults: number;
  totalItems: number;
}

/**
 * Componente de filtros para logs de auditoria
 */
export function AuditLogFiltersComponent({
  filters,
  onFilterChange,
  onClearFilters,
  totalResults,
  totalItems
}: AuditLogFiltersProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Verificar se há filtros ativos
  const hasActiveFilters = !!(
    (filters.actionType && filters.actionType !== 'all') ||
    filters.dateFrom ||
    filters.dateTo ||
    filters.performedBy
  );

  // Formatar data para exibição
  const formatDateDisplay = (dateStr: string | undefined) => {
    if (!dateStr) return undefined;
    return format(new Date(dateStr), 'dd/MM/yyyy', { locale: ptBR });
  };

  // Handler para busca
  const handleSearch = () => {
    // Em uma implementação real, isso buscaria por ID ou nome
    // Por agora, apenas demonstra a interface
    if (searchTerm.trim()) {
      onFilterChange('performedBy', searchTerm.trim());
    }
  };

  return (
    <div className="space-y-4 mb-6">
      {/* Linha de filtros */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Ícone de filtro */}
        <div className="flex items-center gap-2 text-muted-foreground">
          <Filter className="w-4 h-4" />
          <span className="text-sm font-medium">Filtros:</span>
        </div>

        {/* Filtro por tipo de ação */}
        <Select
          value={filters.actionType || 'all'}
          onValueChange={(value) => onFilterChange('actionType', value)}
        >
          <SelectTrigger className="w-[180px] h-9">
            <SelectValue placeholder="Tipo de ação" />
          </SelectTrigger>
          <SelectContent>
            {ACTION_TYPE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Filtro de data inicial */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-9 justify-start text-left font-normal",
                !filters.dateFrom && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {filters.dateFrom ? formatDateDisplay(filters.dateFrom) : "Data inicial"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={filters.dateFrom ? new Date(filters.dateFrom) : undefined}
              onSelect={(date) => 
                onFilterChange('dateFrom', date?.toISOString())
              }
              locale={ptBR}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        {/* Filtro de data final */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-9 justify-start text-left font-normal",
                !filters.dateTo && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {filters.dateTo ? formatDateDisplay(filters.dateTo) : "Data final"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={filters.dateTo ? new Date(filters.dateTo) : undefined}
              onSelect={(date) => 
                onFilterChange('dateTo', date?.toISOString())
              }
              locale={ptBR}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        {/* Busca por usuário */}
        <div className="flex items-center gap-1">
          <Input
            placeholder="Buscar por usuário..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="h-9 w-[180px]"
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={handleSearch}
          >
            <Search className="w-4 h-4" />
          </Button>
        </div>

        {/* Botão limpar filtros */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="h-9 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4 mr-1" />
            Limpar
          </Button>
        )}
      </div>

      {/* Badges de filtros ativos e contagem */}
      <div className="flex items-center gap-2 flex-wrap">
        {hasActiveFilters && (
          <>
            {filters.actionType && filters.actionType !== 'all' && (
              <Badge variant="secondary" className="gap-1">
                Tipo: {ACTION_TYPE_OPTIONS.find(o => o.value === filters.actionType)?.label}
                <button
                  onClick={() => onFilterChange('actionType', 'all')}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
            {filters.dateFrom && (
              <Badge variant="secondary" className="gap-1">
                De: {formatDateDisplay(filters.dateFrom)}
                <button
                  onClick={() => onFilterChange('dateFrom', undefined)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
            {filters.dateTo && (
              <Badge variant="secondary" className="gap-1">
                Até: {formatDateDisplay(filters.dateTo)}
                <button
                  onClick={() => onFilterChange('dateTo', undefined)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
          </>
        )}

        {/* Contagem de resultados */}
        <span className="text-sm text-muted-foreground ml-auto">
          {totalResults === totalItems 
            ? `${totalItems} evento${totalItems !== 1 ? 's' : ''}`
            : `${totalResults} de ${totalItems} eventos`
          }
        </span>
      </div>
    </div>
  );
}
