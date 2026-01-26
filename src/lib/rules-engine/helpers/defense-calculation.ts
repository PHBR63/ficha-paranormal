/**
 * Helpers de cálculo de defesa
 * Ordem Paranormal RPG v1.3
 * 
 * INTEGRAÇÃO SUE: Consume dados consolidados do SUE quando disponíveis
 */

import type { CharacterState, StatBreakdown, BreakdownSource, CalculationContext } from '../types';
import type { SUEComputedForRulesEngine } from '../sue-bridge';

/**
 * Calcula a defesa total com breakdown
 * 
 * @param state - Estado do personagem
 * @param context - Contexto de cálculo
 * @param sueComputed - Dados do SUE (opcional, para integração)
 */
export function calculateDefense(
  state: CharacterState,
  context: CalculationContext,
  sueComputed?: SUEComputedForRulesEngine
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
  
  // === INTEGRAÇÃO SUE ===
  if (sueComputed) {
    // Adicionar bônus de defesa do SUE (poderes, trilhas, etc.)
    if (sueComputed.defenseBonus > 0) {
      // Usar breakdown detalhado se disponível
      if (sueComputed.defenseBreakdown.length > 0) {
        sources.push(...sueComputed.defenseBreakdown);
      } else {
        sources.push({
          name: 'Bônus (Poderes)',
          sourceType: 'power',
          value: sueComputed.defenseBonus,
        });
      }
    }
  }
  
  // Penalidades de condições (sempre aplicar, mesmo com SUE)
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
 * NOTA: Penalidades são processadas localmente pois são subtrativas
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
