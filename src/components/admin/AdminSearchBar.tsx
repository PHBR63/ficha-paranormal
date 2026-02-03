/**
 * AdminSearchBar - Barra de busca e filtros para páginas administrativas
 * Componente reutilizável com input de busca, filtros e indicador de resultados
 */
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, X, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FilterOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

export interface AdminSearchBarProps {
  /** Valor atual da busca */
  searchTerm: string;
  /** Callback quando a busca muda */
  onSearchChange: (value: string) => void;
  /** Placeholder do input de busca */
  searchPlaceholder?: string;
  /** Filtros disponíveis */
  filters?: {
    id: string;
    label: string;
    value: string;
    options: FilterOption[];
    onChange: (value: string) => void;
  }[];
  /** Se há filtros ativos */
  hasActiveFilters?: boolean;
  /** Callback para limpar todos os filtros */
  onClearFilters?: () => void;
  /** Total de resultados */
  totalResults?: number;
  /** Total de itens (antes do filtro) */
  totalItems?: number;
  /** Classes CSS adicionais */
  className?: string;
}

/**
 * Barra de busca e filtros para listas administrativas
 */
export function AdminSearchBar({
  searchTerm,
  onSearchChange,
  searchPlaceholder = 'Buscar...',
  filters,
  hasActiveFilters,
  onClearFilters,
  totalResults,
  totalItems,
  className
}: AdminSearchBarProps) {
  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Campo de busca */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 pr-9"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => onSearchChange('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Filtros */}
        {filters && filters.length > 0 && (
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground hidden sm:block" />
            {filters.map((filter) => (
              <Select
                key={filter.id}
                value={filter.value}
                onValueChange={filter.onChange}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder={filter.label} />
                </SelectTrigger>
                <SelectContent>
                  {filter.options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        {option.icon}
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ))}
          </div>
        )}

        {/* Botão limpar filtros */}
        {hasActiveFilters && onClearFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4 mr-1" />
            Limpar
          </Button>
        )}
      </div>

      {/* Indicador de resultados */}
      {totalResults !== undefined && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {hasActiveFilters ? (
            <>
              <Badge variant="secondary" className="font-normal">
                {totalResults} de {totalItems} resultados
              </Badge>
              {searchTerm && (
                <span>para "{searchTerm}"</span>
              )}
            </>
          ) : (
            <span>{totalItems} itens</span>
          )}
        </div>
      )}
    </div>
  );
}

export default AdminSearchBar;
