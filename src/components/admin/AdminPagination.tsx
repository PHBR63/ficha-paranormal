/**
 * AdminPagination - Componente de paginação para listas administrativas
 * Exibe controles de navegação entre páginas e seletor de itens por página
 */
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AdminPaginationProps {
  /** Página atual (1-indexed) */
  page: number;
  /** Total de páginas */
  totalPages: number;
  /** Total de itens */
  totalItems: number;
  /** Itens por página atual */
  pageSize: number;
  /** Callback para mudar de página */
  onPageChange: (page: number) => void;
  /** Callback para mudar tamanho da página */
  onPageSizeChange?: (size: number) => void;
  /** Opções de tamanho de página */
  pageSizeOptions?: number[];
  /** Classes CSS adicionais */
  className?: string;
  /** Se deve mostrar seletor de itens por página */
  showPageSize?: boolean;
}

/**
 * Componente de paginação para listas administrativas
 */
export function AdminPagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  className,
  showPageSize = true
}: AdminPaginationProps) {
  const startItem = (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalItems);

  // Não mostrar paginação se há apenas 1 página e poucos itens
  if (totalPages <= 1 && totalItems <= pageSizeOptions[0]) {
    return null;
  }

  return (
    <div className={cn('flex flex-col sm:flex-row items-center justify-between gap-4 py-4', className)}>
      {/* Info de itens */}
      <div className="text-sm text-muted-foreground order-2 sm:order-1">
        {totalItems > 0 ? (
          <>Mostrando {startItem}-{endItem} de {totalItems} itens</>
        ) : (
          <>Nenhum item encontrado</>
        )}
      </div>

      <div className="flex items-center gap-4 order-1 sm:order-2">
        {/* Seletor de itens por página */}
        {showPageSize && onPageSizeChange && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden sm:inline">Por página:</span>
            <Select
              value={pageSize.toString()}
              onValueChange={(v) => onPageSizeChange(parseInt(v))}
            >
              <SelectTrigger className="w-[70px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Controles de página */}
        <div className="flex items-center gap-1">
          {/* Primeira página */}
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(1)}
            disabled={page <= 1}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>

          {/* Página anterior */}
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* Indicador de página */}
          <div className="flex items-center gap-1 px-2 text-sm">
            <span className="font-medium">{page}</span>
            <span className="text-muted-foreground">/</span>
            <span className="text-muted-foreground">{totalPages}</span>
          </div>

          {/* Próxima página */}
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          {/* Última página */}
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(totalPages)}
            disabled={page >= totalPages}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default AdminPagination;
