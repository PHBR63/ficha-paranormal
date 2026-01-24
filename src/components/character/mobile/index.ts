/**
 * Barrel exports para componentes mobile de combate e ficha
 * 
 * FASE 5: Trilhas refatoradas para usar componentes unificados responsivos
 * Os painéis de trilha agora vêm de @/components/character/tracks com detecção automática mobile
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

// Fase de paridade desktop/mobile - Componentes de UI (não trilhas)
export { MobileConditionManager, type ActiveCondition } from './MobileConditionManager';
export { MobileOriginCard } from './MobileOriginCard';
export { MobileSustainedRitualsPanel } from './MobileSustainedRitualsPanel';
export { MobileConditionalBonusesPanel } from './MobileConditionalBonusesPanel';
export { MobileAffinitySelectorCard } from './MobileAffinitySelectorCard';
export { MobileRitualCastHistory, type RitualCastRecord } from './MobileRitualCastHistory';
export { MobileActiveEffectsPanel } from './MobileActiveEffectsPanel';
export { MobileParanormalPowerSelectModal } from './MobileParanormalPowerSelectModal';
export { MobileRitualEffectWizard, type MobileRitualEffectWizardProps } from './MobileRitualEffectWizard';
export { MobileTrackPassiveEffectsWidget } from './MobileTrackPassiveEffectsWidget';
export { MobileSUEDebugPanel } from './MobileSUEDebugPanel';
export { MobileClassPowersPanel } from './MobileClassPowersPanel';

// ============================================================================
// TRILHAS - Re-exports dos componentes unificados responsivos (FASE 5)
// Os painéis agora detectam automaticamente mobile via useIsMobile()
// ============================================================================

// Combatente
export { 
  ComandanteCampoPanel as MobileLeadershipPanel,
  GuerreiroPanel as MobileGuerreiroPanel,
  OperacoesEspeciaisPanel as MobileOperacoesEspeciaisPanel,
  TropaDeChoquePanel as MobileTropaDeChoquePanel,
  AniquiladorPanel as MobileAniquiladorPanel,
} from '@/components/character/tracks/combatente';

// Especialista
export {
  AtiradorDeElitePanel as MobileAtiradorDeElitePanel,
  InfiltradorPanel as MobileInfiltradorPanel,
  MedicoDeCampoPanel as MobileMedicoDeCampoPanel,
  NegociadorPanel as MobileNegociadorPanel,
  TecnicoPanel as MobileTecnicoPanel,
} from '@/components/character/tracks/especialista';

// Ocultista
export {
  ConduitePanel as MobileConduitePanel,
  FlageladorPanel as MobileFlageladorPanel,
  GraduadoPanel as MobileGraduadoPanel,
  IntuitivoPanel as MobileIntuitivoPanel,
  LaminaParanormalPanel as MobileLaminaParanormalPanel,
} from '@/components/character/tracks/ocultista';
