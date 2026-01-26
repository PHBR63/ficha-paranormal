/**
 * applyEffect e rollAction - Funções de aplicação e rolagem
 * Ordem Paranormal RPG v1.3
 * 
 * Implementa rolagens determinísticas para o motor de regras:
 * - Teste de perícia com pool de dados
 * - Teste de resistência
 * - Rolagem de ataque com margem de crítico
 * - Rolagem de dano com fórmulas parseadas e buffs do SUE
 * - Rolagem de iniciativa
 * 
 * VERSÕES COM CONTEXTO SUE:
 * As funções *WithContext integram automaticamente todos os bônus
 * do Sistema Unificado de Efeitos (SUE) nas rolagens.
 */

import type {
  CharacterState,
  EffectInstance,
  GameAction,
  ActionResult,
  RollResult,
  ActionBreakdown,
  LogEvent,
  StateChange,
  BreakdownSource,
} from './types';
import { 
  parseDamageFormula, 
  rollDamageFromFormula,
  type DiceGroup,
  type DamageRollOptions,
  type DamageRollResult,
} from './helpers/damage-formula-parser';
import { getSUEBonusesForCharacter } from './sue-bridge';

// Re-exportar funções com contexto SUE
export { rollAttackWithContext, type AttackRollContext, type DetailedAttackResult } from './helpers/attack-with-sue';
export { rollSkillCheckWithContext, type SkillCheckContext, type DetailedSkillCheckResult } from './helpers/skill-check-with-sue';
export { rollInitiativeWithContext, type InitiativeRollContext, type DetailedInitiativeResult } from './helpers/initiative-with-sue';
export { rollResistanceCheckWithContext, type ResistanceCheckContext, type DetailedResistanceResult } from './helpers/resistance-check-with-sue';

// =====================================================
// TIPOS ESTENDIDOS PARA DANO
// =====================================================

/**
 * Contexto expandido para rolagem de dano
 * Inclui informações da arma e buffs ativos
 */
export interface DamageRollContext {
  /** Estado do personagem para buscar arma e buffs */
  characterState: CharacterState;
  
  /** ID da arma sendo usada */
  weaponId: string;
  
  /** Se o ataque foi crítico */
  isCritical: boolean;
  
  /** Margem de ameaça atingida (para poderes que escalam) */
  criticalMargin?: number;
  
  /** Modificadores manuais do jogador */
  manualModifiers?: number;
  
  /** Poderes ativados que afetam dano */
  activatedPowers?: string[];
}

/**
 * Resultado detalhado de rolagem de dano
 */
export interface DetailedDamageResult extends ActionResult {
  /** Breakdown detalhado da rolagem de dano */
  damageBreakdown: {
    /** Dano base da arma */
    weaponDamage: {
      formula: string;
      rolls: number[];
      subtotal: number;
    };
    
    /** Dano de buffs (rituais, poderes) */
    buffDamage: {
      source: string;
      element?: string;
      formula: string;
      rolls: number[];
      subtotal: number;
    }[];
    
    /** Bônus numéricos */
    bonuses: {
      source: string;
      value: number;
    }[];
    
    /** Total final */
    total: number;
    
    /** Tipo de dano */
    damageType?: string;
    
    /** Multiplicador de crítico usado */
    criticalMultiplier?: number;
  };
}

// =====================================================
// APPLY EFFECT
// =====================================================

/**
 * Aplica um efeito ao estado do personagem
 * Retorna novo estado imutável
 */
export function applyEffect(
  state: CharacterState,
  effect: EffectInstance
): CharacterState {
  const newState = { ...state };
  const changes: StateChange[] = [];
  
  // Aplicar modificadores de recursos
  if (effect.mechanics.tempHP && effect.mechanics.tempHP > 0) {
    // PV temporário não soma ao HP atual, é um buffer
    changes.push({
      field: 'tempHP',
      oldValue: 0,
      newValue: effect.mechanics.tempHP,
      reason: `${effect.sourceName}: +${effect.mechanics.tempHP} PV temporário`,
    });
  }
  
  // Registrar efeito como condição ativa se tiver duração
  if (effect.duration.type !== 'instant') {
    const newCondition = {
      conditionId: effect.effectId,
      conditionName: effect.sourceName,
      durationType: effect.duration.type as 'rounds' | 'scene' | 'permanent' | 'until-rest',
      durationRemaining: effect.duration.type === 'rounds' ? (effect.duration as { count: number }).count : undefined,
      sourceId: effect.sourceId,
      sourceName: effect.sourceName,
    };
    
    newState.activeConditions = [...state.activeConditions, newCondition];
  }
  
  return newState;
}

// =====================================================
// ROLL ACTION
// =====================================================

/**
 * Executa uma ação com rolagem
 */
export function rollAction(action: GameAction): ActionResult {
  switch (action.type) {
    case 'skill-check':
      return rollSkillCheck(action);
    case 'resistance-check':
      return rollResistanceCheck(action);
    case 'attack-roll':
      return rollAttack(action);
    case 'damage-roll':
      return rollDamage(action);
    case 'initiative-roll':
      return rollInitiative(action);
    default:
      return createErrorResult(action, `Tipo de ação não implementado: ${action.type}`);
  }
}

/**
 * Executa rolagem de dano com contexto completo
 * Versão avançada que integra com SUE e armas
 */
export function rollDamageWithContext(context: DamageRollContext): DetailedDamageResult {
  const { characterState, weaponId, isCritical, manualModifiers = 0, activatedPowers = [] } = context;
  
  // 1. Buscar arma no estado
  const weapon = characterState.equippedWeapons.find(w => w.id === weaponId);
  if (!weapon) {
    return createDamageErrorResult(`Arma não encontrada: ${weaponId}`);
  }
  
  // 2. Parsear fórmula de dano da arma
  const weaponFormula = parseDamageFormula(weapon.damage);
  if (!weaponFormula.isValid) {
    return createDamageErrorResult(`Fórmula de dano inválida: ${weapon.damage}`);
  }
  
  // 3. Obter bônus do SUE
  const sueComputed = getSUEBonusesForCharacter(characterState);
  
  // 4. Calcular bônus de dano numérico
  let totalDamageBonus = manualModifiers;
  const bonusSources: { source: string; value: number }[] = [];
  
  // Bônus geral de dano do SUE
  if (sueComputed.damageBonus > 0) {
    totalDamageBonus += sueComputed.damageBonus;
    bonusSources.push({ source: 'Poderes', value: sueComputed.damageBonus });
  }
  
  // Bônus específico por tipo de ataque
  if (weapon.attackSkill === 'luta' && sueComputed.meleeDamageBonus > 0) {
    totalDamageBonus += sueComputed.meleeDamageBonus;
    bonusSources.push({ source: 'Dano Corpo a Corpo', value: sueComputed.meleeDamageBonus });
  }
  
  if (weapon.attackSkill === 'pontaria') {
    if (sueComputed.rangedDamageBonus > 0) {
      totalDamageBonus += sueComputed.rangedDamageBonus;
      bonusSources.push({ source: 'Dano à Distância', value: sueComputed.rangedDamageBonus });
    }
    if (sueComputed.firearmDamageBonus > 0) {
      totalDamageBonus += sueComputed.firearmDamageBonus;
      bonusSources.push({ source: 'Dano Arma de Fogo', value: sueComputed.firearmDamageBonus });
    }
  }
  
  // Bônus de Força para armas corpo a corpo
  if (weapon.attackSkill === 'luta') {
    const strengthBonus = characterState.attributes.strength;
    if (strengthBonus > 0) {
      totalDamageBonus += strengthBonus;
      bonusSources.push({ source: 'Força', value: strengthBonus });
    }
  }
  
  // Modificador manual
  if (manualModifiers !== 0) {
    bonusSources.push({ source: 'Modificador Manual', value: manualModifiers });
  }
  
  // 5. Coletar dados extras de buffs de arma
  const extraDice: DiceGroup[] = [];
  const buffDamageResults: DetailedDamageResult['damageBreakdown']['buffDamage'] = [];
  
  if (weapon.temporaryBuffs) {
    for (const buff of weapon.temporaryBuffs) {
      if (buff.bonusDamage) {
        const buffFormula = parseDamageFormula(buff.bonusDamage);
        if (buffFormula.isValid) {
          for (const group of buffFormula.diceGroups) {
            extraDice.push({
              ...group,
              element: buff.element || group.element,
            });
          }
          // Adicionar bônus fixo do buff
          if (buffFormula.flatBonus > 0) {
            totalDamageBonus += buffFormula.flatBonus;
            bonusSources.push({ source: buff.sourceName, value: buffFormula.flatBonus });
          }
        }
      }
      
      // Bônus de ataque numérico (para breakdown)
      if (buff.bonusDamage && typeof buff.bonusDamage === 'number') {
        totalDamageBonus += buff.bonusDamage;
        bonusSources.push({ source: buff.sourceName, value: buff.bonusDamage });
      }
    }
  }
  
  // 6. Verificar poderes ativados que afetam dano
  const maximizeDice = isCritical && activatedPowers.includes('atirar-para-matar');
  const doubleBonuses = activatedPowers.includes('potencia-maxima');
  
  // 7. Calcular multiplicador de crítico
  let criticalMultiplier = weapon.criticalMultiplier || 2;
  if (sueComputed.criticalMultiplierBonus > 0) {
    criticalMultiplier += sueComputed.criticalMultiplierBonus;
  }
  
  // 8. Executar rolagem
  const rollOptions: DamageRollOptions = {
    criticalMultiplier,
    isCritical,
    bonusDamage: totalDamageBonus,
    extraDice,
    maximizeDice,
    doubleBonuses,
  };
  
  const rollResult = rollDamageFromFormula(weaponFormula, rollOptions);
  
  // 9. Processar resultados de buffs para breakdown
  for (const extraResult of rollResult.extraDiceResults) {
    buffDamageResults.push({
      source: extraResult.source,
      element: extraResult.group.element,
      formula: `${extraResult.group.count}d${extraResult.group.sides}`,
      rolls: extraResult.rolls,
      subtotal: extraResult.subtotal,
    });
  }
  
  // 10. Construir resultado detalhado
  const weaponDamageRolls = rollResult.diceResults.flatMap(r => r.rolls);
  const weaponDamageSubtotal = rollResult.diceResults.reduce((sum, r) => sum + r.subtotal, 0);
  
  return {
    success: true,
    roll: {
      diceRolled: weaponDamageRolls,
      diceKept: weaponDamageRolls,
      baseValue: 0,
      modifiers: totalDamageBonus,
      total: rollResult.total,
      isCriticalSuccess: isCritical,
    },
    breakdown: {
      action: 'Dano',
      components: [
        { label: weapon.name, value: weaponDamageSubtotal },
        ...bonusSources.map(b => ({ label: b.source, value: b.value })),
      ],
      formula: rollResult.breakdown.formula,
      result: `${rollResult.total} dano${isCritical ? ' (CRÍTICO!)' : ''}`,
    },
    logEvent: {
      timestamp: new Date(),
      type: 'damage-roll',
      actor: characterState.id,
      message: `Dano: ${rollResult.total}${isCritical ? ' (crítico)' : ''} com ${weapon.name}`,
      details: {
        weaponId,
        weaponName: weapon.name,
        formula: weapon.damage,
        isCritical,
        criticalMultiplier,
        total: rollResult.total,
      },
    },
    damageBreakdown: {
      weaponDamage: {
        formula: weapon.damage,
        rolls: weaponDamageRolls,
        subtotal: weaponDamageSubtotal,
      },
      buffDamage: buffDamageResults,
      bonuses: bonusSources,
      total: rollResult.total,
      damageType: rollResult.damageType,
      criticalMultiplier: isCritical ? criticalMultiplier : undefined,
    },
  };
}

// =====================================================
// IMPLEMENTAÇÕES DE ROLAGEM
// =====================================================

function rollSkillCheck(action: GameAction): ActionResult {
  const data = action.skillCheck!;
  const diceResult = rollD20();
  
  const breakdown: ActionBreakdown = {
    action: `Teste de ${data.skill}`,
    components: [
      { label: 'd20', value: diceResult },
      { label: 'Modificadores', value: data.modifiers || 0 },
    ],
    formula: `d20 + modificadores`,
    result: `${diceResult + (data.modifiers || 0)}`,
  };
  
  const roll: RollResult = {
    diceRolled: [diceResult],
    diceKept: [diceResult],
    baseValue: 0,
    modifiers: data.modifiers || 0,
    total: diceResult + (data.modifiers || 0),
    naturalRoll: diceResult,
    isCriticalSuccess: diceResult === 20,
    isCriticalFailure: diceResult === 1,
  };
  
  const success = data.dt ? roll.total >= data.dt : true;
  
  return {
    success,
    roll,
    breakdown,
    logEvent: createLogEvent(action, `Teste de ${data.skill}: ${roll.total}${data.dt ? ` vs DT ${data.dt}` : ''}`),
  };
}

function rollResistanceCheck(action: GameAction): ActionResult {
  const data = action.resistanceCheck!;
  const diceResult = rollD20();
  
  const roll: RollResult = {
    diceRolled: [diceResult],
    diceKept: [diceResult],
    baseValue: 0,
    modifiers: data.modifiers || 0,
    total: diceResult + (data.modifiers || 0),
    naturalRoll: diceResult,
  };
  
  return {
    success: roll.total >= data.dt,
    roll,
    breakdown: {
      action: `Teste de ${data.resistance}`,
      components: [{ label: 'd20', value: diceResult }],
      formula: `d20 + ${data.resistance}`,
      result: `${roll.total} vs DT ${data.dt}`,
    },
    logEvent: createLogEvent(action, `Teste de ${data.resistance}: ${roll.total} vs DT ${data.dt}`),
  };
}

function rollAttack(action: GameAction): ActionResult {
  const diceResult = rollD20();
  
  const roll: RollResult = {
    diceRolled: [diceResult],
    diceKept: [diceResult],
    baseValue: 0,
    modifiers: action.attackRoll?.modifiers || 0,
    total: diceResult + (action.attackRoll?.modifiers || 0),
    naturalRoll: diceResult,
    isCriticalSuccess: diceResult === 20,
    isCriticalFailure: diceResult === 1,
  };
  
  const targetDef = action.attackRoll?.targetDefense;
  const hit = targetDef ? roll.total >= targetDef : true;
  
  return {
    success: hit,
    roll,
    breakdown: {
      action: 'Ataque',
      components: [{ label: 'd20', value: diceResult }],
      formula: 'd20 + bônus',
      result: `${roll.total}${targetDef ? ` vs Defesa ${targetDef}` : ''}`,
    },
    logEvent: createLogEvent(action, `Ataque: ${roll.total}${hit ? ' - Acerto!' : ' - Erro'}`),
  };
}

function rollDamage(action: GameAction): ActionResult {
  const data = action.damageRoll!;
  
  // Se não temos contexto completo, usar fórmula simplificada
  // A função rollDamageWithContext deve ser usada para rolagens completas
  const defaultFormula = '1d6';
  const parsed = parseDamageFormula(defaultFormula);
  
  const result = rollDamageFromFormula(parsed, {
    isCritical: data.isCritical,
    bonusDamage: data.modifiers || 0,
  });
  
  return {
    success: true,
    roll: {
      diceRolled: result.diceResults.flatMap(r => r.rolls),
      diceKept: result.diceResults.flatMap(r => r.rolls),
      baseValue: 0,
      modifiers: result.flatBonus,
      total: result.total,
      isCriticalSuccess: result.isCritical,
    },
    breakdown: {
      action: 'Dano',
      components: result.diceResults.map(r => ({ 
        label: `${r.group.count}d${r.group.sides}`, 
        value: r.subtotal 
      })),
      formula: result.breakdown.formula,
      result: `${result.total} dano${result.isCritical ? ' (crítico)' : ''}`,
    },
    logEvent: createLogEvent(action, `Dano: ${result.total}${result.isCritical ? ' (crítico)' : ''}`),
  };
}

function rollInitiative(action: GameAction): ActionResult {
  const diceResult = rollD20();
  
  return {
    success: true,
    roll: {
      diceRolled: [diceResult],
      diceKept: [diceResult],
      baseValue: 0,
      modifiers: action.initiativeRoll?.modifiers || 0,
      total: diceResult + (action.initiativeRoll?.modifiers || 0),
    },
    breakdown: {
      action: 'Iniciativa',
      components: [{ label: 'd20', value: diceResult }],
      formula: 'd20 + AGI',
      result: `${diceResult + (action.initiativeRoll?.modifiers || 0)}`,
    },
    logEvent: createLogEvent(action, `Iniciativa: ${diceResult + (action.initiativeRoll?.modifiers || 0)}`),
  };
}

// =====================================================
// HELPERS
// =====================================================

function rollD20(): number {
  return Math.floor(Math.random() * 20) + 1;
}

function createLogEvent(action: GameAction, message: string): LogEvent {
  return {
    timestamp: new Date(),
    type: action.type,
    actor: action.actorId,
    target: action.targetId,
    message,
    details: {},
  };
}

function createErrorResult(action: GameAction, error: string): ActionResult {
  return {
    success: false,
    breakdown: {
      action: 'Erro',
      components: [],
      formula: '',
      result: error,
    },
    logEvent: createLogEvent(action, error),
    errors: [error],
  };
}

function createDamageErrorResult(error: string): DetailedDamageResult {
  return {
    success: false,
    breakdown: {
      action: 'Erro de Dano',
      components: [],
      formula: '',
      result: error,
    },
    logEvent: {
      timestamp: new Date(),
      type: 'damage-roll',
      actor: 'system',
      message: error,
      details: {},
    },
    errors: [error],
    damageBreakdown: {
      weaponDamage: { formula: '', rolls: [], subtotal: 0 },
      buffDamage: [],
      bonuses: [],
      total: 0,
    },
  };
}
