/**
 * movement-calculation.ts
 * Ordem Paranormal RPG v1.3
 * 
 * Calcula movimento do personagem integrando:
 * - Base: 9m (padrão para humanoides)
 * - Bônus de poderes (Ligeireza: +3m) via SUE
 * - Penalidades de condições (Agarrado, Enredado, Exausto, Lento)
 * - Penalidades de armadura pesada
 * - Penalidades de sobrecarga
 */

import type { CharacterState, StatBreakdown, BreakdownSource, CalculationContext } from '../types';
import type { SUEComputedForRulesEngine } from '../sue-bridge';

// =====================================================
// CONSTANTES
// =====================================================

/** Movimento base padrão para humanoides (metros) */
const BASE_MOVEMENT = 9;

/** Penalidade de movimento por sobrecarga de inventário */
const OVERLOAD_PENALTY = -3;

// =====================================================
// FUNÇÃO PRINCIPAL
// =====================================================

/**
 * Calcula o movimento total do personagem com breakdown detalhado
 * 
 * @param state - Estado do personagem
 * @param context - Contexto de cálculo (NEX, atributos, etc.)
 * @param sueComputed - Efeitos consolidados do SUE (opcional)
 * @returns StatBreakdown com total e fontes detalhadas
 */
export function calculateMovement(
  state: CharacterState,
  context: CalculationContext,
  sueComputed?: SUEComputedForRulesEngine
): StatBreakdown {
  const sources: BreakdownSource[] = [];
  let multiplier = 1.0;
  
  // 1. Base: 9m padrão
  sources.push({
    name: 'Base',
    sourceType: 'class',
    value: BASE_MOVEMENT,
    description: 'Deslocamento padrão para humanoides',
  });
  
  // 2. Bônus de poderes via SUE (ex: Ligeireza +3m)
  if (sueComputed && sueComputed.movementBonus !== 0) {
    // Se o SUE tem breakdown, usar individualmente
    if (sueComputed.movementBreakdown.length > 0) {
      for (const bonus of sueComputed.movementBreakdown) {
        sources.push({
          name: bonus.name,
          sourceType: bonus.sourceType,
          value: bonus.value,
          description: bonus.description,
        });
      }
    } else if (sueComputed.movementBonus > 0) {
      // Fallback para valor total
      sources.push({
        name: 'Bônus de Poderes',
        sourceType: 'power',
        value: sueComputed.movementBonus,
      });
    }
  }
  
  // 3. Processar multiplicadores do SUE (Exausto: 0.5, Lento: 0.5)
  if (sueComputed?.rawSUE?.movement?.multiplier && sueComputed.rawSUE.movement.multiplier < 1) {
    multiplier = sueComputed.rawSUE.movement.multiplier;
  }
  
  // 4. Aplicar penalidades de condições específicas (fallback se não veio do SUE)
  if (!sueComputed) {
    const conditionPenalties = getConditionMovementPenalties(state);
    for (const penalty of conditionPenalties) {
      if (penalty.type === 'flat') {
        sources.push({
          name: penalty.name,
          sourceType: 'condition',
          value: penalty.value,
          description: penalty.description,
        });
      } else if (penalty.type === 'multiplier') {
        multiplier *= penalty.value;
      }
    }
  }
  
  // 5. Penalidade de armadura pesada (se aplicável)
  if (state.equippedArmor?.category === 'pesada') {
    sources.push({
      name: 'Armadura Pesada',
      sourceType: 'equipment',
      value: -3,
      description: 'Penalidade de armadura pesada',
    });
  }
  
  // 6. Penalidade de sobrecarga de inventário
  const isOverloaded = checkInventoryOverload(state);
  if (isOverloaded) {
    sources.push({
      name: 'Sobrecarga',
      sourceType: 'equipment',
      value: OVERLOAD_PENALTY,
      description: 'Inventário acima da capacidade',
    });
  }
  
  // 7. Calcular total antes do multiplicador
  const baseTotal = sources.reduce((sum, s) => sum + s.value, 0);
  
  // 8. Aplicar multiplicador (arredondar para baixo em múltiplos de 1.5m)
  let finalTotal = Math.floor(baseTotal * multiplier);
  
  // 9. Se há multiplicador diferente de 1, adicionar fonte explicativa
  if (multiplier < 1) {
    const reduction = baseTotal - finalTotal;
    if (reduction > 0) {
      sources.push({
        name: 'Movimento Reduzido',
        sourceType: 'condition',
        value: -reduction,
        description: `Multiplicador ${multiplier}x aplicado`,
      });
    }
  }
  
  // 10. Movimento mínimo é 0 (Agarrado/Imobilizado)
  if (finalTotal < 0) {
    finalTotal = 0;
  }
  
  return {
    total: finalTotal,
    base: BASE_MOVEMENT,
    sources,
  };
}

// =====================================================
// HELPERS
// =====================================================

interface ConditionPenalty {
  name: string;
  type: 'flat' | 'multiplier';
  value: number;
  description?: string;
}

/**
 * Obtém penalidades de movimento de condições ativas
 * Usado como fallback quando SUE não está disponível
 */
function getConditionMovementPenalties(state: CharacterState): ConditionPenalty[] {
  const penalties: ConditionPenalty[] = [];
  
  for (const condition of state.activeConditions) {
    const conditionId = condition.conditionId.toLowerCase();
    
    switch (conditionId) {
      case 'agarrado':
      case 'imobilizado':
        penalties.push({
          name: condition.conditionName,
          type: 'flat',
          value: -999, // Movimento = 0
          description: 'Não pode se mover',
        });
        break;
        
      case 'enredado':
        penalties.push({
          name: condition.conditionName,
          type: 'flat',
          value: -3,
          description: '-3m de deslocamento',
        });
        break;
        
      case 'exausto':
        penalties.push({
          name: condition.conditionName,
          type: 'multiplier',
          value: 0.5,
          description: 'Deslocamento pela metade',
        });
        break;
        
      case 'lento':
        penalties.push({
          name: condition.conditionName,
          type: 'multiplier',
          value: 0.5,
          description: 'Deslocamento pela metade',
        });
        break;
    }
  }
  
  return penalties;
}

/**
 * Verifica se o inventário está sobrecarregado
 * Capacidade base = 5 espaços por categoria (I-IV)
 * Inventário Otimizado adiciona INT espaços
 */
function checkInventoryOverload(state: CharacterState): boolean {
  // Calcular capacidade por categoria
  const baseCapacityPerCategory = 5;
  const intellect = state.attributes.intellect;
  
  // TODO: Verificar se tem poder "Inventário Otimizado" para adicionar INT
  // Por enquanto, apenas contabiliza espaços básicos
  
  let totalSpaces = 0;
  let usedSpaces = 0;
  
  for (let category = 0; category <= 4; category++) {
    totalSpaces += baseCapacityPerCategory;
  }
  
  for (const item of state.inventory) {
    usedSpaces += item.spaces * item.quantity;
  }
  
  return usedSpaces > totalSpaces;
}
