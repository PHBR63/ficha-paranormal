/**
 * Motor de Regras Padronizado
 * Ordem Paranormal RPG v1.3
 * 
 * Exporta as 4 funções principais:
 * - deriveCharacter: calcula estatísticas derivadas
 * - validateCharacter: valida personagem contra regras
 * - applyEffect: aplica efeitos ao estado
 * - rollAction: executa ações com rolagem
 */

// Tipos
export * from './types';

// Funções principais
export { deriveCharacter } from './derive-character';
export { validateCharacter } from './validate-character';
export { applyEffect, rollAction, rollDamageWithContext } from './apply-and-roll';
export type { DamageRollContext, DetailedDamageResult } from './apply-and-roll';

// Helpers (para uso interno ou extensão)
export { getClassBaseStats } from './helpers/class-stats';
export { calculateResourceBonuses } from './helpers/resource-bonuses';
export { calculateDefense } from './helpers/defense-calculation';
export { calculateResistances } from './helpers/resistance-calculation';
export { calculateAttacks } from './helpers/attack-calculation';
export { calculateSkillBonuses, calculateSkillBonusesWithBreakdown } from './helpers/skill-bonuses';
export { calculateMovement } from './helpers/movement-calculation';
export { calculatePELimit, checkPESpendLimit, getPELimitProgression } from './helpers/pe-limit-calculation';
export { 
  collectProficiencies, 
  getClassProficiencies, 
  getTrackProficiencies,
  getPowerProficiencies,
  getOriginProficiencies,
  hasProficiency,
  hasWeaponProficiency,
  hasArmorProficiency,
} from './helpers/proficiency-collection';

// Validação de rituais
export {
  validateRituals,
  getMaxRitualCircleByNex,
  getOccultistMaxRituals,
  countTranscenderSlots,
} from './helpers/ritual-validation';

// Validação de equipamentos
export {
  validateEquipment,
  calculateBaseCarryCapacity,
  calculateUsedSpaces,
  PROFICIENCY_PENALTIES,
} from './helpers/equipment-validation';

// Parser de fórmula de dano
export {
  parseDamageFormula,
  rollDamageFromFormula,
  combineDamageFormulas,
  calculateAverageDamage,
  calculateMaxDamage,
  calculateMinDamage,
  toLegacyDamageParams,
} from './helpers/damage-formula-parser';
export type {
  DiceGroup,
  ParsedDamageFormula,
  DamageRollOptions,
  DamageRollResult,
} from './helpers/damage-formula-parser';

// Bridge SUE-RulesEngine
export { getSUEBonusesForCharacter } from './sue-bridge';
export type { SUEComputedForRulesEngine } from './sue-bridge';
