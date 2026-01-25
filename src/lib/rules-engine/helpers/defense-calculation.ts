/**
 * Helpers de cálculo de defesa
 * Ordem Paranormal RPG v1.3
 */

import type { CharacterState, StatBreakdown, BreakdownSource, CalculationContext } from '../types';

/**
 * Calcula a defesa total com breakdown
 */
export function calculateDefense(
  state: CharacterState,
  context: CalculationContext
): StatBreakdown {
  const sources: BreakdownSource[] = [];
  
  // Base: 10
  sources.push({
    name: 'Base',
    sourceType: 'class',
    value: 10,
  });
  
  // Agilidade
  sources.push({
    name: 'Agilidade',
    sourceType: 'attribute',
    value: context.attributes.agility,
  });
  
  // Armadura equipada
  if (state.equippedArmor) {
    sources.push({
      name: state.equippedArmor.name,
      sourceType: 'equipment',
      value: state.equippedArmor.defenseBonus,
    });
  }
  
  // TODO: Bônus de poderes (Reflexos Defensivos, etc.)
  // TODO: Bônus de condições
  // TODO: Penalidades de condições (Desprevenido -5, etc.)
  
  // Penalidades de condições
  for (const condition of state.activeConditions) {
    const penalty = getConditionDefensePenalty(condition.conditionId);
    if (penalty !== 0) {
      sources.push({
        name: condition.conditionName,
        sourceType: 'condition',
        value: penalty,
      });
    }
  }
  
  const total = sources.reduce((sum, s) => sum + s.value, 0);
  const base = 10 + context.attributes.agility;
  
  return { total, base, sources };
}

/**
 * Retorna a penalidade de defesa de uma condição
 */
function getConditionDefensePenalty(conditionId: string): number {
  const penalties: Record<string, number> = {
    'desprevenido': -5,
    'agarrado': -2,
    'atordoado': -2,
    'pasmo': -2,
    'cego': -5,
    'surdo': -2,
    'exausto': -5,
    'fatigado': -2,
    'inconsciente': -10,
    'indefeso': -10,
  };
  
  return penalties[conditionId] || 0;
}
