/**
 * Helpers de cálculo de bônus de perícias
 * Ordem Paranormal RPG v1.3
 */

import type { CharacterState, CalculationContext } from '../types';

/**
 * Calcula bônus consolidados para todas as perícias
 */
export function calculateSkillBonuses(
  state: CharacterState,
  context: CalculationContext
): Record<string, number> {
  const bonuses: Record<string, number> = {};
  
  // Processar cada perícia treinada
  for (const [skill, level] of Object.entries(state.skills)) {
    const trainingBonus = getTrainingBonus(level);
    
    // Iniciar com bônus de treinamento
    bonuses[skill] = trainingBonus;
    
    // TODO: Adicionar bônus de origem
    // TODO: Adicionar bônus de poderes
    // TODO: Adicionar bônus de trilha
    // TODO: Adicionar bônus de condições
    // TODO: Adicionar bônus de equipamentos
  }
  
  return bonuses;
}

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
