/**
 * applyEffect e rollAction - Funções de aplicação e rolagem
 * Ordem Paranormal RPG v1.3
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
} from './types';

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
  // Simplificado: rola 1d6 como exemplo
  const diceResult = Math.floor(Math.random() * 6) + 1;
  
  return {
    success: true,
    roll: {
      diceRolled: [diceResult],
      diceKept: [diceResult],
      baseValue: 0,
      modifiers: action.damageRoll?.modifiers || 0,
      total: diceResult + (action.damageRoll?.modifiers || 0),
    },
    breakdown: {
      action: 'Dano',
      components: [{ label: 'Dado', value: diceResult }],
      formula: 'dado + bônus',
      result: `${diceResult + (action.damageRoll?.modifiers || 0)} dano`,
    },
    logEvent: createLogEvent(action, `Dano: ${diceResult + (action.damageRoll?.modifiers || 0)}`),
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
