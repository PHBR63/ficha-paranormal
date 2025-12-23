/**
 * Barrel exports para componentes mobile de combate e ficha
 * Fase de otimização mobile - componentes extraídos e memoizados
 */

// Componentes de rolagem e combate
export { MobileDiceRollModal } from './MobileDiceRollModal';
export type { BonusSource } from './MobileDiceRollModal';

export { MobileCombatPanel } from './MobileCombatPanel';
export type { WeaponEntry } from './MobileCombatPanel';

export { MobileCombatRollModal } from './MobileCombatRollModal';

export { MobileRitualCastModal } from './MobileRitualCastModal';

export { MobileResistanceCheckModal } from './MobileResistanceCheckModal';
export type { ResistanceCheckResult } from './MobileResistanceCheckModal';

export { 
  MobileRollHistory, 
  RollHistoryPreview,
  useRollHistory,
} from './MobileRollHistory';
export type { RollHistoryEntry, RollType } from './MobileRollHistory';

// Novos componentes de tabs e UX (Fase 1-2)
export { MobileOverviewTab } from './MobileOverviewTab';
export { MobileSkillsTab } from './MobileSkillsTab';
export { MobileCollapsibleSection } from './MobileCollapsibleSection';
export { MobileTabNavigation, type MobileTab } from './MobileTabNavigation';
export { MobileQuickActions } from './MobileQuickActions';
export { MobileCombatDrawer } from './MobileCombatDrawer';
