/**
 * Sistema Unificado de Poderes de Classe
 * Ordem Paranormal RPG v1.3
 * 
 * Ponto de entrada para o sistema de poderes de classe.
 * Exporta tipos, poderes e funções de registro.
 */

// ================== TIPOS ==================
export type {
  ClassId,
  PowerKind,
  ActionType,
  WeaponCategory,
  ProtectionCategory,
  Attribute,
  Skill,
  TrainingLevel,
  ScalingValue,
  ScalingDice,
  DiceFormula,
  AttackBonusConfig,
  DamageBonusConfig,
  CriticalBonusConfig,
  DamageReductionConfig,
  DefenseBonusConfig,
  ResistanceBonusConfig,
  SkillBonusConfig,
  AttributeSwapConfig,
  SkillTrainingConfig,
  ProficiencyConfig,
  ActivationConfig,
  PEModifierConfig,
  ExtraActionConfig,
  PowerPrerequisites,
  PowerConditions,
  PowerMechanics,
  PowerProgression,
  UnifiedClassPower,
  ActiveClassPower,
  PowerBonusSummary,
  PowerCalculationContext,
} from './types';

// ================== PODERES POR CLASSE ==================
export { COMBATENTE_POWERS } from './combatente-powers';
export { ESPECIALISTA_POWERS } from './especialista-powers';
export { OCULTISTA_POWERS } from './ocultista-powers';

// ================== FUNÇÕES POR CLASSE ==================
export {
  getCombatenteCorePowers,
  getCombatenteChoosablePowers,
  getCombatentePowersAtNex,
} from './combatente-powers';

export {
  getEspecialistaCorePowers,
  getEspecialistaChoosablePowers,
  getEspecialistaPowersAtNex,
} from './especialista-powers';

export {
  getOcultistaCorePowers,
  getOcultistaChoosablePowers,
  getOcultistaPowersAtNex,
  getMaxRitualCircle,
} from './ocultista-powers';

// ================== REGISTRO CENTRAL ==================
export {
  ALL_CLASS_POWERS,
  getPowerById,
  getPowersByClass,
  getCorePowers,
  getChoosablePowers,
  getAvailablePowers,
  getAvailableChoosablePowers,
  getCorePowersAtNex,
  getNewPowersAtNex,
  getPowersByTag,
  getRepeatablePowers,
  getProficiencyPowers,
  meetsPrerequisites,
  getPowerStats,
} from './power-registry';

// ================== ENGINE DE EFEITOS ==================
export {
  // Helpers de escalonamento
  resolveScalingValue,
  resolveScalingDice,
  
  // Verificação de condições
  checkConditions,
  isMeleeWeapon,
  isRangedWeapon,
  
  // Criação e aplicação
  createEmptyBonusSummary,
  applyMechanics,
  
  // Cálculo principal
  calculatePowerBonuses,
  
  // Funções de consulta
  hasPower,
  getAttackBonus,
  getDamageBonus,
  getResistanceBonus,
  getSkillBonus,
  
  // Custo de PE
  calculateModifiedPECost,
  
  // Adaptadores legado
  mapLegacyAbilitiesToPowerIds,
  calculateBonusesFromLegacyAbilities,
  
  // Debug
  getDetailedPowerBreakdown,
} from './power-effects-engine';
