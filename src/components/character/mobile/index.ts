/**
 * Barrel exports para componentes mobile de combate e ficha
 * Fase de otimização mobile - componentes extraídos e memoizados
 */

// Utilitários compartilhados
export {
  ATTRIBUTE_ABBREV,
  getSkillAttributeAbbrev,
  getAttributeColor,
  getElementIcon,
  getElementColor,
  getItemIcon,
  getCategoryColor,
  type SkillFilter,
  type SkillSort,
} from './utils';

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

// Componentes de tabs e UX (Fase 1-2)
export { MobileOverviewTab } from './MobileOverviewTab';
export { MobileSkillsTab } from './MobileSkillsTab';
export { MobilePowersTab } from './MobilePowersTab';
export { MobileCollapsibleSection } from './MobileCollapsibleSection';
export { MobileTabNavigation, type MobileTab } from './MobileTabNavigation';
export { MobileQuickActions } from './MobileQuickActions';
export { MobileCombatDrawer } from './MobileCombatDrawer';

// Componentes virtualizados (Performance)
export { MobileVirtualizedPowersList, type PowerItem, type PowerItemType } from './MobileVirtualizedPowersList';

// Fase de paridade desktop/mobile - Componentes novos
export { MobileConditionManager, type ActiveCondition } from './MobileConditionManager';
export { MobileSustainedRitualsPanel } from './MobileSustainedRitualsPanel';
export { MobileConditionalBonusesPanel } from './MobileConditionalBonusesPanel';
export { MobileAffinitySelectorCard } from './MobileAffinitySelectorCard';
export { MobileRitualCastHistory, type RitualCastRecord } from './MobileRitualCastHistory';
export { MobileActiveEffectsPanel } from './MobileActiveEffectsPanel';
export { MobileParanormalPowerSelectModal } from './MobileParanormalPowerSelectModal';
export { MobileRitualEffectWizard, type MobileRitualEffectWizardProps } from './MobileRitualEffectWizard';
export { MobileLeadershipPanel } from './MobileLeadershipPanel';
export { MobileGuerreiroPanel } from './MobileGuerreiroPanel';
export { MobileOperacoesEspeciaisPanel } from './MobileOperacoesEspeciaisPanel';
export { MobileTropaDeChoquePanel } from './MobileTropaDeChoquePanel';
export { MobileAtiradorDeElitePanel } from './MobileAtiradorDeElitePanel';
