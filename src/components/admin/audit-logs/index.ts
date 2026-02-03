/**
 * Barrel exports para componentes de Logs de Auditoria
 */
export { AuditLogTimeline } from './AuditLogTimeline';
export { AuditLogEntryComponent } from './AuditLogEntry';
export { AuditLogStats } from './AuditLogStats';
export { AuditLogFiltersComponent } from './AuditLogFilters';

// Constants e tipos
export { 
  ACTION_TYPE_CONFIG, 
  ACTION_TYPE_OPTIONS,
  getActionConfig 
} from './audit-log-constants';

export type { 
  AuditLogEntry,
  EnrichedAuditLogEntry,
  AuditLogFilters,
  AuditStats,
  ActionTypeConfig
} from './audit-log-types';
