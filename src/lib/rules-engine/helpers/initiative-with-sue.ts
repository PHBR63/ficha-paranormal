/**
 * Funções de rolagem de iniciativa com integração SUE
 * Ordem Paranormal RPG v1.3
 * 
 * Versões avançadas que integram automaticamente os bônus
 * do Sistema Unificado de Efeitos (SUE) nas rolagens.
 */

import type {
  CharacterState,
  ActionResult,
  RollResult,
  BreakdownSource,
  LogEvent,
} from '../types';
import { getSUEBonusesForCharacter, getTestDicePenalty } from '../sue-bridge';
import { rollAttributeDicePool } from '../../attribute-dice-pool';

// =====================================================
// TIPOS
// =====================================================

/**
 * Contexto expandido para rolagem de iniciativa
 */
export interface InitiativeRollContext {
  /** Estado completo do personagem */
  characterState: CharacterState;
  
  /** Modificadores manuais do jogador/mestre */
  manualModifiers?: number;
  
  /** Poderes ativados que afetam iniciativa */
  activatedPowers?: string[];
}

/**
 * Resultado detalhado de rolagem de iniciativa
 */
export interface DetailedInitiativeResult extends ActionResult {
  /** Breakdown detalhado da iniciativa */
  initiativeBreakdown: {
    /** Rolagem do d20 */
    naturalRoll: number;
    
    /** Bônus de Agilidade */
    agilityBonus: number;
    
    /** Bônus do SUE (poderes, origem, trilha, etc.) */
    sueBonuses: BreakdownSource[];
    
    /** Modificadores manuais */
    manualModifiers: number;
    
    /** Total da iniciativa */
    total: number;
  };
}

// =====================================================
// FUNÇÃO PRINCIPAL
// =====================================================

/**
 * Executa rolagem de iniciativa com contexto completo do personagem
 * Integra automaticamente todos os bônus do SUE
 */
export function rollInitiativeWithContext(context: InitiativeRollContext): DetailedInitiativeResult {
  const { 
    characterState, 
    manualModifiers = 0, 
    activatedPowers = [],
  } = context;
  
  // 1. Obter Agilidade
  const agilityValue = characterState.attributes.agility;
  
  // 2. Obter bônus do SUE (usando breakdown de habilidades de trilha, etc.)
  // Nota: O SUE não tem campo específico para iniciativa, então usamos movimento como proxy
  // ou expandimos para incluir bônus de iniciativa específicos
  const sueComputed = getSUEBonusesForCharacter(characterState);
  
  // O mesmo catálogo fornece a previsão e o bônus real, sem progressão inventada por NEX.
  const totalSUEBonus = sueComputed.rawSUE.initiative.bonus;
  const sueBonusSources: BreakdownSource[] = sueComputed.rawSUE.initiative.breakdown.map(entry => ({
    name: entry.source.includes('Operações Especiais') ? 'Operações Especiais' : entry.source,
    sourceType: 'track', value: entry.value,
  }));

  // 4. Calcular total de modificadores
  const trainingBonus = characterState.skills.iniciativa === 'expert' ? 15
    : characterState.skills.iniciativa === 'veterano' ? 10
    : characterState.skills.iniciativa === 'treinado' ? 5 : 0;
  const totalModifiers = trainingBonus + totalSUEBonus + manualModifiers;
  
  // 5. Rolar d20
  const pool = rollAttributeDicePool(agilityValue, getTestDicePenalty(sueComputed.rawSUE, 'iniciativa', 'agility'));
  const diceResult = pool.kept;
  
  // 6. Calcular total
  const total = diceResult + totalModifiers;
  
  // 7. Construir resultado
  const roll: RollResult = {
    diceRolled: pool.dice,
    isDisadvantage: pool.keep === 'lowest',
    diceKept: [diceResult],
    baseValue: agilityValue,
    modifiers: totalModifiers,
    total,
    naturalRoll: diceResult,
  };
  
  return {
    success: true,
    roll,
    breakdown: {
      action: 'Iniciativa',
      components: [
        { label: 'd20', value: diceResult },
        { label: 'Treinamento', value: trainingBonus },
        ...sueBonusSources.map(s => ({ label: s.name, value: s.value })),
        ...(manualModifiers !== 0 ? [{ label: 'Modificador', value: manualModifiers }] : []),
      ],
      formula: `${pool.count}d20 (${pool.keep === 'highest' ? 'maior' : 'menor'}) + treinamento + bônus`,
      result: `Iniciativa: ${total}`,
    },
    logEvent: createLogEvent(characterState.id, characterState.name, total),
    initiativeBreakdown: {
      naturalRoll: diceResult,
      agilityBonus: agilityValue,
      sueBonuses: sueBonusSources,
      manualModifiers,
      total,
    },
  };
}

// =====================================================
// HELPERS
// =====================================================

function createLogEvent(
  actorId: string,
  actorName: string,
  total: number
): LogEvent {
  return {
    timestamp: new Date(),
    type: 'initiative-roll',
    actor: actorId,
    message: `${actorName} rola iniciativa: ${total}`,
    details: {
      total,
    },
  };
}
