// =====================================================
// Sistema Unificado de Efeitos (SUE) - Exports
// Ordem Paranormal RPG v1.3
// =====================================================
//
// Mapeamento Completo:
// - 48 Origens (26 base + 22 suplemento)
// - 15 Trilhas (5 por classe)
// - 30+ Condições
// - 22 Poderes Paranormais (5 por elemento + 2 genéricos)
// - Rituais sustentados
//

// Motor Central
export * from '../unified-effects-engine';

// Adaptadores
export { 
  getOriginEffects, 
  ORIGIN_POWER_EFFECTS, 
  listAllOriginEffects 
} from './origin-effects-adapter';

export { 
  getConditionEffects, 
  CONDITION_MECHANICS, 
  getConditionModifiersSummary, 
  listAllConditionEffects 
} from './condition-effects-adapter';

export { 
  getTrackEffects, 
  getTrackCombatEffects, 
  getTrackBonusSummary, 
  listAllTrackAbilities 
} from './track-effects-adapter';

export { 
  getRitualEffects, 
  calculateRitualBonusTotals, 
  getRitualEffectsSummary 
} from './ritual-effects-adapter';

export {
  getParanormalPowerEffects,
  PARANORMAL_POWER_EFFECTS,
  getParanormalPowersSummary,
  listAllParanormalPowerEffects,
} from './paranormal-powers-effects-adapter';

export {
  getClassPowerEffects,
  getPowersRequiringChoice,
  getChoiceTypeForPower,
  hasPowerEffects,
  listAllClassPowerEffects,
  getClassPowerEffectInfo,
} from './class-power-effects-adapter';

export type { ActiveClassPower } from './class-power-effects-adapter';

// Re-exports de tipos
export type { SustainedRitualInput } from './ritual-effects-adapter';
