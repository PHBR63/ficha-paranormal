/**
 * Helpers de cálculo de bônus de perícias
 * Ordem Paranormal RPG v1.3
 * 
 * INTEGRAÇÃO SUE: Consume dados consolidados do SUE quando disponíveis
 */

import type { CharacterState, CalculationContext, BreakdownSource } from '../types';
import type { SUEComputedForRulesEngine } from '../sue-bridge';

/**
 * Resultado do cálculo de perícias com breakdown opcional
 */
export interface SkillBonusesResult {
  bonuses: Record<string, number>;
  breakdowns: Record<string, BreakdownSource[]>;
}

/**
 * Calcula bônus consolidados para todas as perícias
 * 
 * @param state - Estado do personagem
 * @param context - Contexto de cálculo
 * @param sueComputed - Dados do SUE (opcional, para integração)
 */
export function calculateSkillBonuses(
  state: CharacterState,
  context: CalculationContext,
  sueComputed?: SUEComputedForRulesEngine
): Record<string, number> {
  const bonuses: Record<string, number> = {};
  
  // Processar cada perícia treinada
  for (const [skill, level] of Object.entries(state.skills)) {
    // Bônus base de treinamento
    const trainingBonus = getTrainingBonus(level);
    
    // Iniciar com bônus de treinamento
    let totalBonus = trainingBonus;
    
    // === INTEGRAÇÃO SUE ===
    // Se temos dados do SUE, adicionar bônus consolidados
    if (sueComputed?.skillBonuses[skill]) {
      totalBonus += sueComputed.skillBonuses[skill];
    }
    
    bonuses[skill] = totalBonus;
  }
  
  // Adicionar perícias com bônus do SUE que não estão treinadas
  if (sueComputed) {
    for (const [skill, bonus] of Object.entries(sueComputed.skillBonuses)) {
      if (!(skill in bonuses) && bonus > 0) {
        bonuses[skill] = bonus;
      }
    }
  }
  
  return bonuses;
}

/**
 * Calcula bônus de perícias com breakdown detalhado
 */
export function calculateSkillBonusesWithBreakdown(
  state: CharacterState,
  context: CalculationContext,
  sueComputed?: SUEComputedForRulesEngine
): SkillBonusesResult {
  const bonuses: Record<string, number> = {};
  const breakdowns: Record<string, BreakdownSource[]> = {};
  
  // Processar cada perícia treinada
  for (const [skill, level] of Object.entries(state.skills)) {
    const sources: BreakdownSource[] = [];
    
    // Bônus base de treinamento
    const trainingBonus = getTrainingBonus(level);
    if (trainingBonus > 0) {
      sources.push({
        name: `Treinamento (${level})`,
        sourceType: 'skill',
        value: trainingBonus,
      });
    }
    
    // Bônus do SUE
    if (sueComputed?.skillBonuses[skill]) {
      // Adicionar breakdown do SUE se disponível
      if (sueComputed.skillBreakdowns[skill]) {
        sources.push(...sueComputed.skillBreakdowns[skill]);
      } else {
        sources.push({
          name: 'Bônus (SUE)',
          sourceType: 'power',
          value: sueComputed.skillBonuses[skill],
        });
      }
    }
    
    const total = sources.reduce((sum, s) => sum + s.value, 0);
    bonuses[skill] = total;
    breakdowns[skill] = sources;
  }
  
  return { bonuses, breakdowns };
}

/**
 * Retorna bônus de treinamento por nível
 */
function getTrainingBonus(level: string): number {
  switch (level) {
    case 'treinado':
      return 5;
    case 'veterano':
      return 10;
    case 'expert':
      return 15;
    default:
      return 0;
  }
}
