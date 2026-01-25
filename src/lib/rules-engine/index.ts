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
export { applyEffect, rollAction } from './apply-and-roll';

// Helpers (para uso interno ou extensão)
export { getClassBaseStats } from './helpers/class-stats';
export { calculateResourceBonuses } from './helpers/resource-bonuses';
export { calculateDefense } from './helpers/defense-calculation';
export { calculateResistances } from './helpers/resistance-calculation';
export { calculateAttacks } from './helpers/attack-calculation';
export { calculateSkillBonuses } from './helpers/skill-bonuses';
