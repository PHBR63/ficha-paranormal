/**
 * Sistema Unificado de Poderes de Classe
 * Ordem Paranormal RPG v1.3
 * 
 * Ponto de entrada para o sistema de poderes de classe e trilhas.
 * Exporta tipos, poderes, trilhas e funções de registro.
 */

// ================== TIPOS DE PODERES ==================
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

// ================== TIPOS DE TRILHAS ==================
export type {
  TrackAbilityNex,
  TrackAbilityKind,
  TrackAbilityMechanics,
  TrackAbilityProgression,
  UnifiedTrackAbility,
  UnifiedTrack,
  ActiveTrack,
  TrackCalculationContext,
  TrackBonusSummary,
} from './track-types';

// ================== PODERES POR CLASSE ==================
export { COMBATENTE_POWERS } from './combatente-powers';
export { ESPECIALISTA_POWERS } from './especialista-powers';
export { OCULTISTA_POWERS } from './ocultista-powers';

// ================== TRILHAS POR CLASSE ==================
export { COMBATENTE_TRACKS } from './track-combatente';
export { ESPECIALISTA_TRACKS } from './track-especialista';
export { OCULTISTA_TRACKS } from './track-ocultista';

// ================== FUNÇÕES DE PODERES POR CLASSE ==================
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

// ================== REGISTRO CENTRAL DE PODERES ==================
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

// ================== REGISTRO CENTRAL DE TRILHAS ==================
export {
  ALL_TRACKS,
  getTrackById,
  getTracksByClass,
  getTrackIdsByClass,
  searchTracks,
  getTracksByTag,
  getTrackAbilityById,
  getAbilitiesByTrack,
  getInitialAbility,
  getUnlockedAbilities,
  getNextAbility,
  getNextAbilityNex,
  isAbilityUnlocked,
  getAbilitiesByTag,
  canChooseTrack,
  getAvailableTracks,
  getTrackStats,
  getGrantedRituals,
} from './track-registry';

// ================== ENGINE DE EFEITOS DE PODERES ==================
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

// ================== ENGINE DE EFEITOS DE TRILHAS ==================
export {
  // Criação
  createEmptyTrackBonusSummary,
  
  // Cálculo principal
  calculateTrackBonuses,
  calculateActiveTackBonuses,
  
  // Funções de consulta
  hasTrackAbility,
  calculateSneakAttackDice,
  calculateParamedicHealing,
  calculateSpecialAttackBonus,
  
  // Adaptadores legado
  mapLegacyTrackAbilities,
  
  // Debug
  getDetailedTrackBreakdown,
} from './track-effects-engine';
