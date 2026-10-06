import { getNexLevel } from '@/lib/rules/nex-progression';
/**
 * deriveCharacter - Função principal de derivação de estatísticas
 * Ordem Paranormal RPG v1.3
 * 
 * Calcula todas as estatísticas derivadas do personagem a partir
 * do estado atual, retornando valores com breakdowns detalhados.
 * 
 * Esta é uma função PURA - não modifica estado, não tem side effects.
 */

import type {
  CharacterState,
  DerivedStats,
  DerivedAttack,
  StatBreakdown,
  BreakdownSource,
  AttributeKey,
  ResistanceKey,
  CalculationContext,
} from './types';
import { getClassBaseStats } from './helpers/class-stats';
import { calculateResourceBonuses } from './helpers/resource-bonuses';
import { calculateDefense } from './helpers/defense-calculation';
import { calculateResistances } from './helpers/resistance-calculation';
import { calculateAttacks } from './helpers/attack-calculation';
import { calculateSkillBonuses } from './helpers/skill-bonuses';
import { calculateMovement } from './helpers/movement-calculation';
import { calculatePELimit } from './helpers/pe-limit-calculation';
import { collectProficiencies } from './helpers/proficiency-collection';
import { getSUEBonusesForCharacter } from './sue-bridge';

// =====================================================
// FUNÇÃO PRINCIPAL
// =====================================================

/**
 * Deriva todas as estatísticas calculadas do personagem
 * 
 * @param state - Estado completo do personagem
 * @returns Estatísticas derivadas com breakdowns
 */
export function deriveCharacter(state: CharacterState): DerivedStats {
  // 1. Obter estatísticas base da classe
  const classStats = getClassBaseStats(state.characterClass, state.nex);
  
  // 2. Obter bônus consolidados do SUE
  const sueComputed = getSUEBonusesForCharacter(state);
  
  // 3. Criar contexto para cálculos condicionais
  const context: CalculationContext = {
    nex: state.nex,
    attributes: state.attributes,
    inCombat: state.combatState?.inCombat ?? false,
    isFirstRound: state.combatState?.currentRound === 1,
    hpPercentage: state.hpCurrent / Math.max(1, calculateMaxHP(state, classStats)),
    isDying: state.activeConditions.some(c => c.conditionId === 'morrendo'),
  };
  
  // 4. Calcular recursos (HP, PE, SAN) com bônus do SUE
  const resourceBonuses = calculateResourceBonuses(state, context, sueComputed);
  
  // 5. Calcular HP máximo
  const hpBreakdown = calculateHP(state, classStats, resourceBonuses.hp);
  
  // 6. Calcular PE máximo
  const peBreakdown = calculatePE(state, classStats, resourceBonuses.pe);
  
  // 7. Calcular SAN máximo
  const sanBreakdown = calculateSAN(state, classStats, resourceBonuses.san);
  
  // 8. Calcular Defesa com bônus do SUE
  const defenseResult = calculateDefense(state, context, sueComputed);
  
  // 9. Calcular Resistências com bônus do SUE
  const resistancesResult = calculateResistances(state, context, sueComputed);
  
  // 10. Calcular limite de PE com bônus do SUE (Universitário: +1)
  const peLimitBreakdown = calculatePELimit(state, context, sueComputed);
  
  // 11. Calcular ataques disponíveis
  const attacks = calculateAttacks(state, context);
  
  // 12. Calcular bônus de perícias com bônus do SUE
  const skillBonuses = calculateSkillBonuses(state, context, sueComputed);
  
  // 13. Calcular movimento com bônus do SUE (Ligeireza, condições)
  const movementBreakdown = calculateMovement(state, context, sueComputed);
  
  // 14. Determinar proficiências de classe/trilha/poderes/origem
  const proficiencies = collectProficiencies(state, sueComputed);
  
  // 15. Limites de rituais (Ocultista)
  const ritualLimits = calculateRitualLimits(state);
  
  return {
    hpMax: hpBreakdown.total,
    peMax: peBreakdown.total,
    sanMax: sanBreakdown.total,
    defense: defenseResult.total,
    resistances: {
      fortitude: resistancesResult.fortitude.total,
      reflexos: resistancesResult.reflexos.total,
      vontade: resistancesResult.vontade.total,
    },
    peLimitPerTurn: peLimitBreakdown.total,
    peLimitPerCast: peBreakdown.total, // Limite por conjuração = PE máximo
    ritualsMaxCount: ritualLimits.count,
    ritualsMaxCircle: ritualLimits.maxCircle,
    movement: movementBreakdown.total,
    attacks,
    skillBonuses,
    proficiencies,
    breakdowns: {
      hp: hpBreakdown,
      pe: peBreakdown,
      san: sanBreakdown,
      defense: defenseResult,
      resistances: {
        fortitude: resistancesResult.fortitude,
        reflexos: resistancesResult.reflexos,
        vontade: resistancesResult.vontade,
      },
      movement: movementBreakdown,
      peLimitPerTurn: peLimitBreakdown,
    },
  };
}

// =====================================================
// FUNÇÕES AUXILIARES
// =====================================================

interface ClassBaseStats {
  pvBase: number;
  pvPerNex: number;
  peBase: number;
  pePerNex: number;
  sanBase: number;
  sanPerNex: number;
}

/**
 * Calcula HP máximo auxiliar (usado para contexto)
 */
function calculateMaxHP(state: CharacterState, classStats: ClassBaseStats): number {
  const nexMultiplier = getNexLevel(state.nex) - 1;
  return classStats.pvBase + state.attributes.vigor + ((classStats.pvPerNex + state.attributes.vigor) * Math.max(0, nexMultiplier));
}

/**
 * Calcula HP máximo com breakdown
 */
function calculateHP(
  state: CharacterState, 
  classStats: ClassBaseStats,
  bonuses: BreakdownSource[]
): StatBreakdown {
  const nexMultiplier = getNexLevel(state.nex) - 1;
  const sources: BreakdownSource[] = [];
  
  // Base da classe
  const classBase = classStats.pvBase;
  sources.push({
    name: `Base (${state.characterClass})`,
    sourceType: 'class',
    value: classBase,
  });
  
  // Vigor
  sources.push({
    name: `Vigor × ${Math.max(1, getNexLevel(state.nex))} patamares`,
    sourceType: 'attribute',
    value: state.attributes.vigor * Math.max(1, getNexLevel(state.nex)),
  });
  
  // Por NEX
  const nexBonus = classStats.pvPerNex * Math.max(0, nexMultiplier);
  if (nexBonus > 0) {
    sources.push({
      name: `NEX ${state.nex}% (+${classStats.pvPerNex}/5%)`,
      sourceType: 'class',
      value: nexBonus,
    });
  }
  
  // Adicionar bônus de outras fontes
  sources.push(...bonuses);
  
  const base = classBase + state.attributes.vigor * Math.max(1, getNexLevel(state.nex)) + nexBonus;
  const total = sources.reduce((sum, s) => sum + s.value, 0);
  
  return { total, base, sources };
}

/**
 * Calcula PE máximo com breakdown
 */
function calculatePE(
  state: CharacterState,
  classStats: ClassBaseStats,
  bonuses: BreakdownSource[]
): StatBreakdown {
  const nexMultiplier = getNexLevel(state.nex) - 1;
  const sources: BreakdownSource[] = [];
  
  // Base da classe
  sources.push({
    name: `Base (${state.characterClass})`,
    sourceType: 'class',
    value: classStats.peBase,
  });
  
  // Presença
  sources.push({
    name: `Presença × ${Math.max(1, getNexLevel(state.nex))} patamares`,
    sourceType: 'attribute',
    value: state.attributes.presence * Math.max(1, getNexLevel(state.nex)),
  });
  
  // Por NEX
  const nexBonus = classStats.pePerNex * Math.max(0, nexMultiplier);
  if (nexBonus > 0) {
    sources.push({
      name: `NEX ${state.nex}% (+${classStats.pePerNex}/5%)`,
      sourceType: 'class',
      value: nexBonus,
    });
  }
  
  // Adicionar bônus de outras fontes
  sources.push(...bonuses);
  
  const base = classStats.peBase + state.attributes.presence * Math.max(1, getNexLevel(state.nex)) + nexBonus;
  const total = sources.reduce((sum, s) => sum + s.value, 0);
  
  return { total, base, sources };
}

/**
 * Calcula SAN máximo com breakdown
 */
function calculateSAN(
  state: CharacterState,
  classStats: ClassBaseStats,
  bonuses: BreakdownSource[]
): StatBreakdown {
  const nexMultiplier = getNexLevel(state.nex) - 1;
  const sources: BreakdownSource[] = [];
  
  // Base da classe
  sources.push({
    name: `Base (${state.characterClass})`,
    sourceType: 'class',
    value: classStats.sanBase,
  });
  
  // Por NEX
  const nexBonus = classStats.sanPerNex * Math.max(0, nexMultiplier);
  if (nexBonus > 0) {
    sources.push({
      name: `NEX ${state.nex}% (+${classStats.sanPerNex}/5%)`,
      sourceType: 'class',
      value: nexBonus,
    });
  }
  
  // Adicionar bônus de outras fontes
  sources.push(...bonuses);
  
  const base = classStats.sanBase + nexBonus;
  const total = sources.reduce((sum, s) => sum + s.value, 0);
  
  return { total, base, sources };
}

// Funções calculatePELimit, calculateMovement e collectProficiencies
// foram movidas para arquivos separados em ./helpers/

/**
 * Calcula limites de rituais (apenas Ocultista)
 */
function calculateRitualLimits(state: CharacterState): { count: number; maxCircle: number } {
  if (state.characterClass !== 'Ocultista') {
    return { count: 0, maxCircle: 0 };
  }
  
  // Progressão do Ocultista conforme livro
  const nexToRituals: Record<number, { count: number; maxCircle: number }> = {
    5:  { count: 3, maxCircle: 1 },
    10: { count: 4, maxCircle: 1 },
    15: { count: 5, maxCircle: 1 },
    20: { count: 6, maxCircle: 1 },
    25: { count: 7, maxCircle: 2 },
    30: { count: 8, maxCircle: 2 },
    35: { count: 9, maxCircle: 2 },
    40: { count: 10, maxCircle: 2 },
    45: { count: 11, maxCircle: 2 },
    50: { count: 12, maxCircle: 2 },
    55: { count: 13, maxCircle: 3 },
    60: { count: 14, maxCircle: 3 },
    65: { count: 15, maxCircle: 3 },
    70: { count: 16, maxCircle: 3 },
    75: { count: 17, maxCircle: 3 },
    80: { count: 18, maxCircle: 3 },
    85: { count: 19, maxCircle: 4 },
    90: { count: 20, maxCircle: 4 },
    95: { count: 21, maxCircle: 4 },
    99: { count: 22, maxCircle: 4 },
  };
  
  // Encontrar o NEX mais próximo <= ao atual
  const validNexes = Object.keys(nexToRituals).map(Number).filter(n => n <= state.nex);
  const effectiveNex = Math.max(...validNexes, 5);
  
  return nexToRituals[effectiveNex] || { count: 3, maxCircle: 1 };
}

export default deriveCharacter;
