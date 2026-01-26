/**
 * Hooks do Sistema Unificado de Efeitos (SUE)
 * 
 * Hooks responsáveis pelo cálculo de efeitos, bônus e condições
 * baseados no motor unificado do sistema Ordem Paranormal RPG.
 * 
 * INTEGRAÇÃO SUE HARDENING:
 * - Ordem fixa de aplicação (10 passos)
 * - Regras de stacking explícitas
 * - Metadados de processamento para debugging
 * 
 * @module hooks/sue
 */

// Hooks de efeitos
export * from '../useUnifiedEffects';
export * from '../useActivatedEffects';
export * from '../useBonusSummaryFromSUE';
export * from '../useRitualBonusesFromSUE';
export * from '../useRitualModeConditions';
export * from '../useAutoConditions';

// Hooks de rolagem integrados com SUE (Fase 1 - Migração)
export * from './useSkillRollWithSUE';
export * from './useInitiativeRollWithSUE';
export * from './useResistanceRollWithSUE';
export * from './useRitualDamageWithSUE';

// Re-exports de tipos do SUE Hardening
export type {
  PreparedEffect,
  PreprocessResult,
  BonusCategory,
  StackingResult,
  EffectCategory,
} from '../useUnifiedEffects';
