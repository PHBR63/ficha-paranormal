/**
 * Condições - Ordem Paranormal RPG
 * 
 * Módulo consolidado para todas as condições do sistema.
 * Baseado no Livro Base v1.3.
 * 
 * @module conditions
 */

// Re-exporta tudo do arquivo de definições
export {
  // Tipos
  type ConditionParams,
  type Condition,
  type ContextualModifier,
  
  // Constantes
  CONDITIONS,
  CONTEXTUAL_DEFENSE_MODIFIERS,
  ATTACK_MODIFIERS,
  INITIATIVE_MODIFIERS,
  TEST_MODIFIERS,
  CONDITION_CATEGORIES,
  
  // Funções básicas
  getConditionById,
  getAllConditions,
  getConditionsByCategory,
  getContextualDefenseModifier,
  getAttackModifierFromConditions,
  getInitiativeModifierFromConditions,
  getTestModifierFromConditions,
  getTotalDefenseModifier,
  getActionPenalties,
  hasCondition,
  canPerformActions,
  isIncapacitated,
  getStackingDefenseModifier,
  
  // Funções de parâmetros
  conditionRequiresParams,
  getConditionEffectWithParams,
  getMachucadoDamage,
  getFragilizadoMultiplier,
  
  // Funções de restrição
  canSpendPEWithConditions,
  getMaxActionsFromConditions,
} from './condition-definitions';

// ==================== REGISTRY DE CONDIÇÕES ====================

import { CONDITIONS, type Condition } from './condition-definitions';

/**
 * Registry de condições para acesso O(1)
 * Mapeia ID -> Condição
 */
export const CONDITION_REGISTRY: Map<string, Omit<Condition, 'turnsRemaining'>> = new Map(
  Object.entries(CONDITIONS)
);

/**
 * Busca uma condição no registry
 */
export function getConditionFromRegistry(id: string): Omit<Condition, 'turnsRemaining'> | undefined {
  return CONDITION_REGISTRY.get(id);
}

/**
 * Retorna todos os IDs de condições
 */
export function getAllConditionIds(): string[] {
  return Array.from(CONDITION_REGISTRY.keys());
}

/**
 * Verifica se um ID de condição é válido
 */
export function isValidConditionId(id: string): boolean {
  return CONDITION_REGISTRY.has(id);
}

/**
 * Retorna condições por cor (para UI)
 */
export function getConditionsByColor(color: string): Array<Omit<Condition, 'turnsRemaining'>> {
  return Object.values(CONDITIONS).filter(c => c.color === color);
}

/**
 * Retorna condições que têm remoção automática
 */
export function getAutoRemoveConditions(): Array<Omit<Condition, 'turnsRemaining'>> {
  return Object.values(CONDITIONS).filter(c => c.autoRemove);
}

/**
 * Retorna condições que suportam parâmetros
 */
export function getParameterizedConditions(): Array<Omit<Condition, 'turnsRemaining'>> {
  return Object.values(CONDITIONS).filter(c => c.hasParams);
}
