/**
 * Helpers de cálculo de resistências
 * Ordem Paranormal RPG v1.3
 * 
 * INTEGRAÇÃO SUE: Consume dados consolidados do SUE quando disponíveis
 */

import type { CharacterState, StatBreakdown, BreakdownSource, CalculationContext, ResistanceKey } from '../types';
import type { SUEComputedForRulesEngine } from '../sue-bridge';

interface ResistancesResult {
  fortitude: StatBreakdown;
  reflexos: StatBreakdown;
  vontade: StatBreakdown;
}

/**
 * Calcula todas as resistências com breakdown
 * 
 * @param state - Estado do personagem
 * @param context - Contexto de cálculo
 * @param sueComputed - Dados do SUE (opcional, para integração)
 */
export function calculateResistances(
  state: CharacterState,
  context: CalculationContext,
  sueComputed?: SUEComputedForRulesEngine
): ResistancesResult {
  return {
    fortitude: calculateSingleResistance('fortitude', state, context, sueComputed),
    reflexos: calculateSingleResistance('reflexos', state, context, sueComputed),
    vontade: calculateSingleResistance('vontade', state, context, sueComputed),
  };
}

/**
 * Calcula uma resistência específica
 */
function calculateSingleResistance(
  resistance: ResistanceKey,
  state: CharacterState,
  context: CalculationContext,
  sueComputed?: SUEComputedForRulesEngine
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
  
  // === INTEGRAÇÃO SUE ===
  if (sueComputed) {
    const sueBonus = getSUEResistanceBonus(resistance, sueComputed);
    const sueBreakdown = getSUEResistanceBreakdown(resistance, sueComputed);
    
    if (sueBonus > 0) {
      if (sueBreakdown.length > 0) {
        sources.push(...sueBreakdown);
      } else {
        sources.push({
          name: 'Bônus (Poderes)',
          sourceType: 'power',
          value: sueBonus,
        });
      }
    }
  }
  
  const total = sources.reduce((sum, s) => sum + s.value, 0);
  const base = attributeValue;
  
  return { total, base, sources };
}

/**
 * Obtém bônus de resistência do SUE
 */
function getSUEResistanceBonus(resistance: ResistanceKey, sue: SUEComputedForRulesEngine): number {
  switch (resistance) {
    case 'fortitude': return sue.fortitudeBonus;
    case 'reflexos': return sue.reflexosBonus;
    case 'vontade': return sue.vontadeBonus;
    default: return 0;
  }
}

/**
 * Obtém breakdown de resistência do SUE
 */
function getSUEResistanceBreakdown(resistance: ResistanceKey, sue: SUEComputedForRulesEngine): BreakdownSource[] {
  switch (resistance) {
    case 'fortitude': return sue.fortitudeBreakdown;
    case 'reflexos': return sue.reflexosBreakdown;
    case 'vontade': return sue.vontadeBreakdown;
    default: return [];
  }
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
