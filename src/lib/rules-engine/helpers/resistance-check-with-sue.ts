/**
 * Funções de teste de resistência com integração SUE
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
  ResistanceKey,
  LogEvent,
} from '../types';
import { getSUEBonusesForCharacter } from '../sue-bridge';

// =====================================================
// TIPOS
// =====================================================

/**
 * Contexto expandido para teste de resistência
 */
export interface ResistanceCheckContext {
  /** Estado completo do personagem */
  characterState: CharacterState;
  
  /** Tipo de resistência (Fortitude, Reflexos, Vontade) */
  resistance: ResistanceKey;
  
  /** Dificuldade do teste (DT) */
  dt: number;
  
  /** Modificadores manuais do jogador/mestre */
  manualModifiers?: number;
  
  /** Poderes ativados para este teste */
  activatedPowers?: string[];
}

/**
 * Resultado detalhado de teste de resistência
 */
export interface DetailedResistanceResult extends ActionResult {
  /** Breakdown detalhado do teste */
  resistanceBreakdown: {
    /** Tipo de resistência */
    resistance: ResistanceKey;
    
    /** Nome da resistência em português */
    resistanceName: string;
    
    /** Atributo base usado */
    attribute: {
      name: string;
      value: number;
    };
    
    /** Bônus base da resistência */
    baseBonus: number;
    
    /** Bônus do SUE (poderes, origem, trilha, etc.) */
    sueBonuses: BreakdownSource[];
    
    /** Modificadores manuais */
    manualModifiers: number;
    
    /** Total do teste */
    total: number;
    
    /** DT do teste */
    dt: number;
    
    /** Se passou no teste */
    passed: boolean;
    
    /** Se foi crítico natural (20) */
    isCriticalSuccess: boolean;
    
    /** Se foi falha crítica (1) */
    isCriticalFailure: boolean;
  };
}

// =====================================================
// MAPA DE RESISTÊNCIAS
// =====================================================

const RESISTANCE_ATTRIBUTE_MAP: Record<ResistanceKey, 'vigor' | 'agility' | 'presence'> = {
  'fortitude': 'vigor',
  'reflexos': 'agility',
  'vontade': 'presence',
};

const RESISTANCE_NAMES: Record<ResistanceKey, string> = {
  'fortitude': 'Fortitude',
  'reflexos': 'Reflexos',
  'vontade': 'Vontade',
};

const ATTRIBUTE_NAMES: Record<string, string> = {
  'vigor': 'Vigor',
  'agility': 'Agilidade',
  'presence': 'Presença',
};

// =====================================================
// FUNÇÃO PRINCIPAL
// =====================================================

/**
 * Executa teste de resistência com contexto completo do personagem
 * Integra automaticamente todos os bônus do SUE
 */
export function rollResistanceCheckWithContext(context: ResistanceCheckContext): DetailedResistanceResult {
  const { 
    characterState, 
    resistance, 
    dt, 
    manualModifiers = 0, 
    activatedPowers = [],
  } = context;
  
  // 1. Determinar atributo base
  const attributeKey = RESISTANCE_ATTRIBUTE_MAP[resistance];
  const attributeValue = characterState.attributes[attributeKey];
  const attributeName = ATTRIBUTE_NAMES[attributeKey];
  const resistanceName = RESISTANCE_NAMES[resistance];
  
  // 2. Obter bônus do SUE
  const sueComputed = getSUEBonusesForCharacter(characterState);
  
  // 3. Coletar bônus do SUE para esta resistência
  const sueBonusSources: BreakdownSource[] = [];
  let totalSUEBonus = 0;
  
  // Bônus específico de resistência do SUE
  let resistanceBonus = 0;
  let resistanceBreakdown: BreakdownSource[] = [];
  
  switch (resistance) {
    case 'fortitude':
      resistanceBonus = sueComputed.fortitudeBonus;
      resistanceBreakdown = sueComputed.fortitudeBreakdown;
      break;
    case 'reflexos':
      resistanceBonus = sueComputed.reflexosBonus;
      resistanceBreakdown = sueComputed.reflexosBreakdown;
      break;
    case 'vontade':
      resistanceBonus = sueComputed.vontadeBonus;
      resistanceBreakdown = sueComputed.vontadeBreakdown;
      break;
  }
  
  if (resistanceBonus > 0) {
    totalSUEBonus += resistanceBonus;
    // Usar breakdown detalhado se disponível
    if (resistanceBreakdown.length > 0) {
      sueBonusSources.push(...resistanceBreakdown);
    } else {
      sueBonusSources.push({
        name: `Bônus de ${resistanceName}`,
        sourceType: 'power',
        value: resistanceBonus,
      });
    }
  }
  
  // 4. Calcular bônus base da resistência
  // Bônus base vem da progressão de classe (calculado em derive-character)
  // Aqui usamos apenas o atributo como base
  const baseBonus = 0; // Já está incluído no cálculo do SUE
  
  // 5. Calcular total de modificadores
  const totalModifiers = attributeValue + baseBonus + totalSUEBonus + manualModifiers;
  
  // 6. Rolar d20
  const diceResult = rollD20();
  
  // 7. Calcular total
  const total = diceResult + totalModifiers;
  
  // 8. Determinar resultado
  const isCriticalSuccess = diceResult === 20;
  const isCriticalFailure = diceResult === 1;
  const passed = total >= dt;
  
  // 9. Construir resultado
  const roll: RollResult = {
    diceRolled: [diceResult],
    diceKept: [diceResult],
    baseValue: attributeValue,
    modifiers: baseBonus + totalSUEBonus + manualModifiers,
    total,
    naturalRoll: diceResult,
    isCriticalSuccess,
    isCriticalFailure,
  };
  
  const resultText = passed 
    ? (isCriticalSuccess ? 'Sucesso Crítico!' : 'Sucesso') 
    : (isCriticalFailure ? 'Falha Crítica!' : 'Falha');
  
  return {
    success: passed,
    roll,
    breakdown: {
      action: `Teste de ${resistanceName}`,
      components: [
        { label: 'd20', value: diceResult },
        { label: attributeName, value: attributeValue, source: 'attribute' },
        ...sueBonusSources.map(s => ({ label: s.name, value: s.value })),
        ...(manualModifiers !== 0 ? [{ label: 'Modificador', value: manualModifiers }] : []),
      ],
      formula: `d20 + ${attributeName} + bônus`,
      result: `${total} vs DT ${dt} - ${resultText}`,
    },
    logEvent: createLogEvent(characterState.id, resistanceName, total, passed, isCriticalSuccess, isCriticalFailure, dt),
    resistanceBreakdown: {
      resistance,
      resistanceName,
      attribute: {
        name: attributeName,
        value: attributeValue,
      },
      baseBonus,
      sueBonuses: sueBonusSources,
      manualModifiers,
      total,
      dt,
      passed,
      isCriticalSuccess,
      isCriticalFailure,
    },
  };
}

// =====================================================
// HELPERS
// =====================================================

function rollD20(): number {
  return Math.floor(Math.random() * 20) + 1;
}

function createLogEvent(
  actorId: string,
  resistanceName: string,
  total: number,
  passed: boolean,
  isCriticalSuccess: boolean,
  isCriticalFailure: boolean,
  dt: number
): LogEvent {
  const resultText = passed 
    ? (isCriticalSuccess ? 'Sucesso Crítico!' : 'Sucesso') 
    : (isCriticalFailure ? 'Falha Crítica!' : 'Falha');
  
  return {
    timestamp: new Date(),
    type: 'resistance-check',
    actor: actorId,
    message: `Teste de ${resistanceName}: ${total} vs DT ${dt} - ${resultText}`,
    details: {
      resistance: resistanceName,
      total,
      passed,
      isCriticalSuccess,
      isCriticalFailure,
      dt,
    },
  };
}
