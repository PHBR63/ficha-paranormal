/**
 * AdminSkeletons - Componentes de loading skeleton para páginas administrativas
 * Fornece placeholders visuais consistentes durante o carregamento de dados
 */
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

/**
 * Skeleton para tabelas administrativas
 * Simula uma tabela com cabeçalho e linhas de dados
 */
export function TableSkeleton({ 
  rows = 5, 
  columns = 4,
  className 
}: SkeletonProps & { rows?: number; columns?: number }) {
  return (
    <div className={cn('w-full', className)}>
      {/* Cabeçalho da tabela */}
      <div className="flex gap-4 p-3 border-b border-border">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton 
            key={`header-${i}`} 
            className={cn(
              'h-4',
              i === 0 ? 'w-[200px]' : 'w-[100px]'
            )} 
          />
        ))}
      </div>
      
      {/* Linhas da tabela */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div 
          key={`row-${rowIndex}`} 
          className="flex gap-4 p-3 border-b border-border/50"
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton 
              key={`cell-${rowIndex}-${colIndex}`} 
              className={cn(
                'h-4',
                colIndex === 0 ? 'w-[180px]' : 'w-[80px]'
              )} 
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton para cards de estatísticas
 * Usado em dashboards e resumos
 */
export function StatCardSkeleton({ className }: SkeletonProps) {
  return (
    <Card className={cn('', className)}>
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          {/* Ícone */}
          <Skeleton className="h-12 w-12 rounded-full" />
          
          <div className="space-y-2">
            {/* Label */}
            <Skeleton className="h-3 w-20" />
            {/* Valor */}
            <Skeleton className="h-8 w-16" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Grid de cards de estatísticas em loading
 */
export function StatsGridSkeleton({ 
  count = 4,
  className 
}: SkeletonProps & { count?: number }) {
  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Skeleton para cards de conteúdo geral
 */
export function CardSkeleton({ className }: SkeletonProps) {
  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-5 w-32" />
        </div>
        <Skeleton className="h-3 w-48 mt-1.5" />
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton para gráficos/charts
 */
export function ChartSkeleton({ 
  height = 200,
  className 
}: SkeletonProps & { height?: number }) {
  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-3 w-56 mt-1" />
      </CardHeader>
      <CardContent>
        <Skeleton 
          className="w-full rounded-lg" 
          style={{ height: `${height}px` }} 
        />
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton para lista de usuários
 */
export function UserListSkeleton({ 
  rows = 5,
  className 
}: SkeletonProps & { rows?: number }) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div 
          key={i} 
          className="flex items-center gap-4 p-3 rounded-lg border border-border/50"
        >
          {/* Avatar */}
          <Skeleton className="h-10 w-10 rounded-full" />
          
          <div className="flex-1 space-y-2">
            {/* Nome */}
            <Skeleton className="h-4 w-32" />
            {/* Email/info */}
            <Skeleton className="h-3 w-48" />
          </div>
          
          {/* Badge de role */}
          <Skeleton className="h-6 w-20 rounded-full" />
          
          {/* Ações */}
          <Skeleton className="h-8 w-24" />
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton para página admin completa
 * Combina navegação, stats e tabela
 */
export function AdminPageSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('space-y-6 p-6', className)}>
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-20" />
      </div>
      
      {/* Navegação */}
      <div className="flex gap-2">
        <Skeleton className="h-9 w-28" />
        <Skeleton className="h-9 w-28" />
        <Skeleton className="h-9 w-28" />
      </div>
      
      {/* Stats */}
      <StatsGridSkeleton />
      
      {/* Tabela */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent>
          <TableSkeleton rows={8} columns={5} />
        </CardContent>
      </Card>
    </div>
  );
}

// Aliases para compatibilidade
export const AdminTableSkeleton = TableSkeleton;
export const AdminStatCardSkeleton = StatCardSkeleton;
export const AdminStatsGridSkeleton = StatsGridSkeleton;
export const AdminCardSkeleton = CardSkeleton;
export const AdminChartSkeleton = ChartSkeleton;
export const AdminUserListSkeleton = UserListSkeleton;
