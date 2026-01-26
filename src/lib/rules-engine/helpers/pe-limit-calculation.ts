/**
 * pe-limit-calculation.ts
 * Ordem Paranormal RPG v1.3
 * 
 * Calcula o limite de PE por turno do personagem:
 * - Base por NEX (1-2-3-4-5... conforme progressão)
 * - Bônus de Universitário (Dedicação): +1
 * - Bônus de poderes futuros
 */

import type { CharacterState, StatBreakdown, BreakdownSource, CalculationContext } from '../types';
import type { SUEComputedForRulesEngine } from '../sue-bridge';
import { getPELimitByNex } from '../../dice-roller';

// =====================================================
// FUNÇÃO PRINCIPAL
// =====================================================

/**
 * Calcula o limite de PE por turno com breakdown detalhado
 * 
 * @param state - Estado do personagem
 * @param context - Contexto de cálculo
 * @param sueComputed - Efeitos consolidados do SUE (opcional)
 * @returns StatBreakdown com total e fontes detalhadas
 */
export function calculatePELimit(
  state: CharacterState,
  context: CalculationContext,
  sueComputed?: SUEComputedForRulesEngine
): StatBreakdown {
  const sources: BreakdownSource[] = [];
  
  // 1. Base por NEX
  const baseLimit = getPELimitByNex(state.nex);
  sources.push({
    name: `Base (NEX ${state.nex}%)`,
    sourceType: 'class',
    value: baseLimit,
    description: 'Limite de PE por turno baseado no NEX',
  });
  
  // 2. Bônus do SUE (Universitário: Dedicação +1)
  if (sueComputed && sueComputed.peLimitBonus > 0) {
    // Se o SUE tem breakdown, usar individualmente
    if (sueComputed.peLimitBreakdown.length > 0) {
      for (const bonus of sueComputed.peLimitBreakdown) {
        sources.push({
          name: bonus.name,
          sourceType: bonus.sourceType,
          value: bonus.value,
          description: bonus.description,
        });
      }
    } else {
      // Fallback para valor total
      sources.push({
        name: 'Bônus de Origem/Poder',
        sourceType: 'origin',
        value: sueComputed.peLimitBonus,
        description: 'Aumento no limite de PE por turno',
      });
    }
  } else if (!sueComputed) {
    // Fallback manual: verificar origem Universitário
    const universitarioBonus = getUniversitarioPELimitBonus(state.origin);
    if (universitarioBonus > 0) {
      sources.push({
        name: 'Dedicação (Universitário)',
        sourceType: 'origin',
        value: universitarioBonus,
        description: 'Limite de PE por turno +1',
      });
    }
  }
  
  // 3. Calcular total
  const total = sources.reduce((sum, s) => sum + s.value, 0);
  
  return {
    total,
    base: baseLimit,
    sources,
  };
}

// =====================================================
// HELPERS
// =====================================================

/**
 * Obtém bônus de limite de PE do Universitário
 * REGRA OFICIAL (Livro Base v1.3): "...seu limite de PE por turno aumenta em 1"
 */
function getUniversitarioPELimitBonus(origin: string): number {
  const normalizedOrigin = origin.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  
  if (normalizedOrigin === 'universitario') {
    return 1;
  }
  
  return 0;
}

/**
 * Verifica se o personagem pode gastar uma quantidade de PE neste turno
 * 
 * @param state - Estado do personagem
 * @param peToSpend - PE a ser gasto
 * @param context - Contexto de cálculo
 * @param sueComputed - Efeitos consolidados do SUE (opcional)
 * @returns { canSpend: boolean, remaining: number, limit: number }
 */
export function checkPESpendLimit(
  state: CharacterState,
  peToSpend: number,
  context: CalculationContext,
  sueComputed?: SUEComputedForRulesEngine
): { canSpend: boolean; remaining: number; limit: number } {
  const peLimitBreakdown = calculatePELimit(state, context, sueComputed);
  const limit = peLimitBreakdown.total;
  
  const peSpentThisTurn = state.combatState?.peSpentThisTurn ?? 0;
  const remaining = limit - peSpentThisTurn;
  
  return {
    canSpend: remaining >= peToSpend,
    remaining,
    limit,
  };
}

/**
 * Retorna a progressão de limite de PE por NEX
 * Útil para exibição na ficha de personagem
 */
export function getPELimitProgression(): Record<number, number> {
  return {
    5: 1,
    10: 2,
    15: 2,
    20: 3,
    25: 3,
    30: 4,
    35: 4,
    40: 5,
    45: 5,
    50: 6,
    55: 6,
    60: 7,
    65: 7,
    70: 8,
    75: 8,
    80: 9,
    85: 9,
    90: 10,
    95: 10,
    99: 10,
  };
}
