/**
 * Barrel export para componentes administrativos
 * Centraliza todos os exports para facilitar imports
 */

// Navegação e layout
export { AdminNav } from './AdminNav';
export { 
  TableSkeleton,
  StatCardSkeleton,
  StatsGridSkeleton,
  CardSkeleton,
  ChartSkeleton,
  UserListSkeleton,
  AdminPageSkeleton,
  AdminTableSkeleton,
  AdminStatCardSkeleton,
  AdminStatsGridSkeleton,
  AdminCardSkeleton,
  AdminChartSkeleton,
  AdminUserListSkeleton
} from './AdminSkeletons';
export { AdminSearchBar } from './AdminSearchBar';
export { AdminPagination } from './AdminPagination';

// Painéis de validação e debug
export { RulesValidationPanel } from './RulesValidationPanel';
export { SUEDebugPanel } from './SUEDebugPanel';
export { SUETestCoverageDashboard } from './SUETestCoverageDashboard';
export { ValidationHistoryDashboard } from './ValidationHistoryDashboard';
export { ClassPowerBonusTests } from './ClassPowerBonusTests';

// Componentes de importação
export { JsonExamples, TYPE_LABELS } from './JsonExamples';
export type { ImportType } from './JsonExamples';
export { ImportPreview } from './ImportPreview';
