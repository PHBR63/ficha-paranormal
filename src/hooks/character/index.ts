/**
 * Hooks de Personagem
 * 
 * Hooks responsáveis pelo gerenciamento de dados do personagem,
 * validação de atributos, poderes de classe, efeitos paranormais e condições.
 * 
 * @module hooks/character
 */

// Hook consolidado de estado da ficha
export * from './useCharacterSheetState';

// Hooks de edição e rolagem
export * from './useCharacterStats';
export * from './useSkillRoll';
export * from './useCombatRollSetup';
export * from './useRitualCast';
export * from './useTrackPanel';

// Hooks de dados e validação
export * from '../useCharacterAutoSave';
export * from '../useCharacterAudit';
export * from '../useCharacterBonusSummary';
export * from '../useAttributeValidation';
export * from '../useClassPowerBonuses';
export * from '../useParanormalEffects';
export * from './useConditions';
