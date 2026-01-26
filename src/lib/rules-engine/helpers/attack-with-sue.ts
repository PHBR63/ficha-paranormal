/**
 * Funções de rolagem de ataque com integração SUE
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
  AttackRollAction,
  LogEvent,
} from '../types';
import { getSUEBonusesForCharacter, type SUEComputedForRulesEngine } from '../sue-bridge';

// =====================================================
// TIPOS
// =====================================================

/**
 * Contexto expandido para rolagem de ataque
 */
export interface AttackRollContext {
  /** Estado completo do personagem */
  characterState: CharacterState;
  
  /** ID da arma sendo usada */
  weaponId: string;
  
  /** Defesa do alvo (opcional) */
  targetDefense?: number;
  
  /** Modificadores manuais do jogador/mestre */
  manualModifiers?: number;
  
  /** Poderes ativados para este ataque */
  activatedPowers?: string[];
  
  /** Bônus condicional ativo (ex: flanqueando, vantagem) */
  conditionalBonuses?: string[];
}

/**
 * Resultado detalhado de rolagem de ataque
 */
export interface DetailedAttackResult extends ActionResult {
  /** Breakdown detalhado do ataque */
  attackBreakdown: {
    /** Rolagem do d20 */
    naturalRoll: number;
    
    /** Atributo usado */
    attribute: {
      name: string;
      value: number;
    };
    
    /** Bônus de perícia */
    skillBonus: number;
    
    /** Bônus do SUE (poderes, origem, trilha, etc.) */
    sueBonuses: BreakdownSource[];
    
    /** Modificadores manuais */
    manualModifiers: number;
    
    /** Total do ataque */
    total: number;
    
    /** Margem de ameaça efetiva */
    criticalThreshold: number;
    
    /** Se foi crítico */
    isCritical: boolean;
    
    /** Se acertou */
    hit: boolean;
    
    /** Defesa do alvo (se informada) */
    targetDefense?: number;
  };
}

// =====================================================
// FUNÇÃO PRINCIPAL
// =====================================================

/**
 * Executa rolagem de ataque com contexto completo do personagem
 * Integra automaticamente todos os bônus do SUE
 */
export function rollAttackWithContext(context: AttackRollContext): DetailedAttackResult {
  const { 
    characterState, 
    weaponId, 
    targetDefense, 
    manualModifiers = 0, 
    activatedPowers = [],
    conditionalBonuses = [],
  } = context;
  
  // 1. Buscar arma no estado
  const weapon = characterState.equippedWeapons.find(w => w.id === weaponId);
  if (!weapon) {
    return createAttackErrorResult(`Arma não encontrada: ${weaponId}`);
  }
  
  // 2. Obter bônus do SUE
  const sueComputed = getSUEBonusesForCharacter(characterState);
  
  // 3. Determinar atributo de ataque
  const attackAttribute = weapon.attackAttribute;
  const attributeValue = characterState.attributes[attackAttribute];
  const attributeName = attackAttribute === 'strength' ? 'Força' : 'Agilidade';
  
  // 4. Calcular bônus de perícia (treinamento)
  const skillName = weapon.attackSkill;
  const skillLevel = characterState.skills[skillName];
  const skillBonus = getTrainingBonus(skillLevel);
  
  // 5. Coletar bônus do SUE
  const sueBonusSources: BreakdownSource[] = [];
  let totalSUEBonus = 0;
  
  // Bônus geral de ataque
  if (sueComputed.attackBonus > 0) {
    totalSUEBonus += sueComputed.attackBonus;
    sueBonusSources.push({
      name: 'Poderes',
      sourceType: 'power',
      value: sueComputed.attackBonus,
    });
  }
  
  // Bônus específico por tipo de arma
  if (weapon.attackSkill === 'luta' && sueComputed.meleeAttackBonus > 0) {
    totalSUEBonus += sueComputed.meleeAttackBonus;
    sueBonusSources.push({
      name: 'Ataque Corpo a Corpo',
      sourceType: 'power',
      value: sueComputed.meleeAttackBonus,
    });
  }
  
  if (weapon.attackSkill === 'pontaria' && sueComputed.rangedAttackBonus > 0) {
    totalSUEBonus += sueComputed.rangedAttackBonus;
    sueBonusSources.push({
      name: 'Ataque à Distância',
      sourceType: 'power',
      value: sueComputed.rangedAttackBonus,
    });
  }
  
  // Bônus de buffs temporários da arma
  if (weapon.temporaryBuffs) {
    for (const buff of weapon.temporaryBuffs) {
      if (buff.bonusAttack && buff.bonusAttack > 0) {
        totalSUEBonus += buff.bonusAttack;
        sueBonusSources.push({
          name: buff.sourceName,
          sourceType: 'ritual',
          value: buff.bonusAttack,
        });
      }
    }
  }
  
  // 6. Calcular total de modificadores
  const totalModifiers = attributeValue + skillBonus + totalSUEBonus + manualModifiers;
  
  // 7. Rolar d20 (considerando pool de dados por atributo positivo/negativo)
  const dicePool = Math.abs(attributeValue) + 1;
  const useHighest = attributeValue >= 0;
  const diceResults: number[] = [];
  
  for (let i = 0; i < dicePool; i++) {
    diceResults.push(rollD20());
  }
  
  const keptDice = useHighest 
    ? Math.max(...diceResults) 
    : Math.min(...diceResults);
  
  // 8. Calcular margem de ameaça (crítico)
  let criticalThreshold = weapon.criticalMargin;
  if (sueComputed.criticalMarginBonus > 0) {
    criticalThreshold -= sueComputed.criticalMarginBonus;
  }
  criticalThreshold = Math.max(1, criticalThreshold);
  
  // 9. Determinar se é crítico
  const isCritical = keptDice >= criticalThreshold;
  
  // 10. Calcular total
  const total = keptDice + skillBonus + totalSUEBonus + manualModifiers;
  
  // 11. Determinar se acertou (REGRA PERSONALIZADA: crítico NÃO é acerto automático)
  const hit = targetDefense !== undefined ? total >= targetDefense : true;
  
  // 12. Construir resultado
  const roll: RollResult = {
    diceRolled: diceResults,
    diceKept: [keptDice],
    baseValue: attributeValue,
    modifiers: skillBonus + totalSUEBonus + manualModifiers,
    total,
    naturalRoll: keptDice,
    isCriticalSuccess: isCritical && hit,
    isCriticalFailure: keptDice === 1,
  };
  
  const hitText = hit ? 'Acerto!' : 'Erro';
  const critText = isCritical ? (hit ? ' (CRÍTICO!)' : ' (Crítico, mas errou)') : '';
  
  return {
    success: hit,
    roll,
    breakdown: {
      action: `Ataque com ${weapon.name}`,
      components: [
        { label: 'd20', value: keptDice },
        { label: skillName === 'luta' ? 'Luta' : 'Pontaria', value: skillBonus },
        ...sueBonusSources.map(s => ({ label: s.name, value: s.value })),
        ...(manualModifiers !== 0 ? [{ label: 'Modificador', value: manualModifiers }] : []),
      ],
      formula: `d20 + ${skillName === 'luta' ? 'Luta' : 'Pontaria'} + bônus`,
      result: `${total}${targetDefense !== undefined ? ` vs Defesa ${targetDefense}` : ''} - ${hitText}${critText}`,
    },
    logEvent: createLogEvent(characterState.id, weaponId, weapon.name, total, hit, isCritical, targetDefense),
    attackBreakdown: {
      naturalRoll: keptDice,
      attribute: {
        name: attributeName,
        value: attributeValue,
      },
      skillBonus,
      sueBonuses: sueBonusSources,
      manualModifiers,
      total,
      criticalThreshold,
      isCritical,
      hit,
      targetDefense,
    },
  };
}

// =====================================================
// HELPERS
// =====================================================

function rollD20(): number {
  return Math.floor(Math.random() * 20) + 1;
}

function getTrainingBonus(level: string | undefined): number {
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

function createLogEvent(
  actorId: string,
  weaponId: string,
  weaponName: string,
  total: number,
  hit: boolean,
  isCritical: boolean,
  targetDefense?: number
): LogEvent {
  const hitText = hit ? 'Acerto' : 'Erro';
  const critText = isCritical ? (hit ? ' Crítico!' : ' (Crítico que errou)') : '';
  
  return {
    timestamp: new Date(),
    type: 'attack-roll',
    actor: actorId,
    message: `Ataque com ${weaponName}: ${total}${targetDefense !== undefined ? ` vs ${targetDefense}` : ''} - ${hitText}${critText}`,
    details: {
      weaponId,
      weaponName,
      total,
      hit,
      isCritical,
      targetDefense,
    },
  };
}

function createAttackErrorResult(error: string): DetailedAttackResult {
  return {
    success: false,
    breakdown: {
      action: 'Erro de Ataque',
      components: [],
      formula: '',
      result: error,
    },
    logEvent: {
      timestamp: new Date(),
      type: 'attack-roll',
      actor: 'system',
      message: error,
      details: {},
    },
    errors: [error],
    attackBreakdown: {
      naturalRoll: 0,
      attribute: { name: '', value: 0 },
      skillBonus: 0,
      sueBonuses: [],
      manualModifiers: 0,
      total: 0,
      criticalThreshold: 20,
      isCritical: false,
      hit: false,
    },
  };
}
