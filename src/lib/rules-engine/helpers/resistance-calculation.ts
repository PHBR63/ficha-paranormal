/**
 * Helpers de cálculo de resistências
 * Ordem Paranormal RPG v1.3
 */

import type { CharacterState, StatBreakdown, BreakdownSource, CalculationContext, ResistanceKey } from '../types';

interface ResistancesResult {
  fortitude: StatBreakdown;
  reflexos: StatBreakdown;
  vontade: StatBreakdown;
}

/**
 * Calcula todas as resistências com breakdown
 */
export function calculateResistances(
  state: CharacterState,
  context: CalculationContext
): ResistancesResult {
  return {
    fortitude: calculateSingleResistance('fortitude', state, context),
    reflexos: calculateSingleResistance('reflexos', state, context),
    vontade: calculateSingleResistance('vontade', state, context),
  };
}

/**
 * Calcula uma resistência específica
 */
function calculateSingleResistance(
  resistance: ResistanceKey,
  state: CharacterState,
  context: CalculationContext
): StatBreakdown {
  const sources: BreakdownSource[] = [];
  
  // Atributo base
  const attribute = getResistanceAttribute(resistance);
  const attributeValue = context.attributes[attribute];
  
  sources.push({
    name: getAttributeName(attribute),
    sourceType: 'attribute',
    value: attributeValue,
  });
  
  // Bônus de treinamento em perícia de resistência
  const skillLevel = state.skills[resistance];
  if (skillLevel) {
    const trainingBonus = getTrainingBonus(skillLevel);
    if (trainingBonus > 0) {
      sources.push({
        name: `Treinamento em ${capitalize(resistance)}`,
        sourceType: 'skill',
        value: trainingBonus,
      });
    }
  }
  
  // TODO: Bônus de poderes
  // TODO: Bônus de equipamentos
  // TODO: Bônus de condições
  
  const total = sources.reduce((sum, s) => sum + s.value, 0);
  const base = attributeValue;
  
  return { total, base, sources };
}

/**
 * Retorna o atributo associado a uma resistência
 */
function getResistanceAttribute(resistance: ResistanceKey): 'vigor' | 'agility' | 'presence' {
  switch (resistance) {
    case 'fortitude':
      return 'vigor';
    case 'reflexos':
      return 'agility';
    case 'vontade':
      return 'presence';
  }
}

function getAttributeName(attr: string): string {
  const names: Record<string, string> = {
    strength: 'Força',
    agility: 'Agilidade',
    vigor: 'Vigor',
    intellect: 'Intelecto',
    presence: 'Presença',
  };
  return names[attr] || attr;
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

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
