/**
 * SUE - Sistema Unificado de Efeitos
 * Módulo de Hardening
 * 
 * Exporta as funcionalidades de ordem de aplicação, regras de stacking
 * e integração com o motor de consolidação para garantir consistência
 * e determinismo no cálculo de efeitos.
 * 
 * @module sue
 */

// ========================================
// ORDEM DE APLICAÇÃO
// ========================================

export {
  EFFECT_APPLICATION_ORDER,
  EFFECT_PRIORITY_MAP,
  getEffectPriority,
  compareEffectSources,
  SOURCE_CATEGORY_MAP,
  getEffectCategory,
  SOURCE_BEHAVIOR_FLAGS,
  getSourceBehavior,
  sortEffectsByPriority,
  groupEffectsBySource,
  getEffectsByCategory,
} from './effect-application-order';

export type {
  EffectCategory,
  SourceBehaviorFlags,
  OrderableEffect,
} from './effect-application-order';

// ========================================
// REGRAS DE STACKING
// ========================================

export {
  STACKING_RULES,
  DAMAGE_ACCUMULATING_CONDITIONS,
  DEFENSE_STACKING_EQUIPMENT,
  conditionAccumulatesDamage,
  applyStackingRules,
  canBonusBeApplied,
  getStackingRule,
  formatStackingRuleDescription,
} from './stacking-rules';

export type {
  StackingRule,
  BonusCategory,
  SourceStackingConfig,
  StackableBonus,
  StackingResult,
} from './stacking-rules';

// ========================================
// INTEGRAÇÃO COM CONSOLIDAÇÃO
// ========================================

export {
  preprocessEffectsWithHardening,
  orderEffectsForConsolidation,
  shouldApplyBonus,
  createBonusTracker,
  trackAppliedBonus,
} from './consolidation-with-hardening';

export type {
  PreparedEffect,
  PreprocessResult,
} from './consolidation-with-hardening';

// ========================================
// RE-EXPORTS DO MOTOR PRINCIPAL
// ========================================

// Re-exporta tipos do motor unificado para conveniência
export type {
  EffectSource,
  AttackType,
  DamageType,
  ResistanceType,
  AttributeType,
  EffectMechanics,
  EffectConditions,
  UnifiedEffect,
  EffectCalculationContext,
  ComputedEffects,
} from '../unified-effects-engine';

// Re-exporta funções principais
export {
  consolidateEffects,
  checkEffectConditions,
} from '../unified-effects-engine';
