// =====================================================
// Sistema Unificado de Efeitos - Exports
// Ordem Paranormal RPG v1.3
// =====================================================

// Motor Central
export * from '../unified-effects-engine';

// Adaptadores
export { getOriginEffects, ORIGIN_POWER_EFFECTS, listAllOriginEffects } from './origin-effects-adapter';
export { getConditionEffects, CONDITION_MECHANICS, getConditionModifiersSummary, listAllConditionEffects } from './condition-effects-adapter';
export { getTrackEffects, getTrackCombatEffects, getTrackBonusSummary, listAllTrackAbilities } from './track-effects-adapter';
export { getRitualEffects, calculateRitualBonusTotals, getRitualEffectsSummary } from './ritual-effects-adapter';

// Re-exports de tipos
export type { SustainedRitualInput } from './ritual-effects-adapter';
