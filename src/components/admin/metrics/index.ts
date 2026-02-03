/**
 * Barrel exports para componentes de métricas administrativas
 */
export { AdminMetricsDashboard } from './AdminMetricsDashboard';
export { MetricsStatsCards } from './MetricsStatsCards';
export { ClassDistributionChart } from './ClassDistributionChart';
export { OriginDistributionChart } from './OriginDistributionChart';
export { ActivityChart } from './ActivityChart';
export { NexDistributionChart } from './NexDistributionChart';

// Types
export type { 
  SystemStats, 
  ClassDistribution, 
  OriginDistribution, 
  MonthlyActivity,
  NexDistribution
} from './AdminMetricsDashboard';
