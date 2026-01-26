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
import { getSUEBonusesForCharacter } from '../sue-bridge';

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
  
  // 3. Coletar bônus de iniciativa do SUE
  const sueBonusSources: BreakdownSource[] = [];
  let totalSUEBonus = 0;
  
  // Verificar bônus de trilha (ex: Operações Especiais tem bônus de iniciativa)
  // TODO: Expandir SUE para incluir initiativeBonus
  // Por enquanto, usamos a lógica de trilha diretamente
  if (characterState.classTrack === 'operacoes-especiais' || 
      characterState.classTrack === 'Operações Especiais') {
    // Combatente: Operações Especiais dá bônus de iniciativa por NEX
    // NEX 5%: +2, NEX 50%: +4, NEX 80%: +6 (baseado na progressão)
    const nexBonus = Math.floor(characterState.nex / 5) >= 16 ? 6 
      : Math.floor(characterState.nex / 5) >= 10 ? 4 
      : 2;
    totalSUEBonus += nexBonus;
    sueBonusSources.push({
      name: 'Operações Especiais',
      sourceType: 'track',
      value: nexBonus,
    });
  }
  
  // Verificar origem (algumas dão bônus de iniciativa)
  // Ex: Militar pode ter bônus em combate
  if (characterState.origin === 'Militar' || characterState.origin === 'militar') {
    // Militar não dá bônus de iniciativa diretamente, mas verificamos
    // outras origens que possam dar
  }
  
  // 4. Calcular total de modificadores
  const totalModifiers = agilityValue + totalSUEBonus + manualModifiers;
  
  // 5. Rolar d20
  const diceResult = rollD20();
  
  // 6. Calcular total
  const total = diceResult + totalModifiers;
  
  // 7. Construir resultado
  const roll: RollResult = {
    diceRolled: [diceResult],
    diceKept: [diceResult],
    baseValue: agilityValue,
    modifiers: totalSUEBonus + manualModifiers,
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
        { label: 'Agilidade', value: agilityValue, source: 'attribute' },
        ...sueBonusSources.map(s => ({ label: s.name, value: s.value })),
        ...(manualModifiers !== 0 ? [{ label: 'Modificador', value: manualModifiers }] : []),
      ],
      formula: 'd20 + AGI + bônus',
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

function rollD20(): number {
  return Math.floor(Math.random() * 20) + 1;
}

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
