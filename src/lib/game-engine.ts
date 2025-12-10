// Ordem Paranormal RPG v1.3 - Motor de Regras Automatizado
// Sistema completo de combate, PE, condições e inventário

import { CONDITIONS, type Condition } from './conditions';
import { getPELimitByNex } from './dice-roller';

// ============== INTERFACES ==============

export interface TurnState {
  peSpentThisTurn: number;
  peLimit: number;
  hasActed: boolean;
  hasMoved: boolean;
  hasReacted: boolean;
}

export interface CombatantState {
  id: string;
  name: string;
  initiative: number;
  initiativeRoll: number[];
  hp: number;
  hpMax: number;
  pe: number;
  peMax: number;
  san: number;
  sanMax: number;
  defense: number;
  baseDefense: number;
  conditions: string[];
  turnState: TurnState;
  isNPC?: boolean;
  dyingCounter?: number; // 0-3, quando chega a 0 = morte
}

export interface CombatState {
  isActive: boolean;
  round: number;
  currentTurnIndex: number;
  combatants: CombatantState[];
  log: CombatLogEntry[];
}

export interface CombatLogEntry {
  timestamp: Date;
  type: 'initiative' | 'attack' | 'damage' | 'heal' | 'condition' | 'pe' | 'turn' | 'death' | 'system';
  actor?: string;
  target?: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ConditionEffect {
  defenseModifier: number;
  testModifier: number;
  movementModifier: number; // -1 = metade, -2 = zero
  canAct: boolean;
  canMove: boolean;
  startOfTurnEffect?: () => { damage?: number; sanDamage?: number; message?: string };
}

// ============== EFEITOS DE CONDIÇÕES ==============

export const CONDITION_EFFECTS: Record<string, ConditionEffect> = {
  sangrando: {
    defenseModifier: 0,
    testModifier: 0,
    movementModifier: 0,
    canAct: true,
    canMove: true,
    startOfTurnEffect: () => ({
      damage: Math.floor(Math.random() * 6) + 1, // 1d6
      message: 'Sofre dano de sangramento'
    })
  },
  vulneravel: {
    defenseModifier: -2,
    testModifier: 0,
    movementModifier: 0,
    canAct: true,
    canMove: true,
  },
  atordoado: {
    defenseModifier: -2,
    testModifier: 0,
    movementModifier: 0,
    canAct: false,
    canMove: false,
  },
  agarrado: {
    defenseModifier: -2,
    testModifier: 0,
    movementModifier: -2, // 0 movement
    canAct: true,
    canMove: false,
  },
  caido: {
    defenseModifier: -5, // corpo a corpo
    testModifier: 0,
    movementModifier: 0,
    canAct: true,
    canMove: true,
  },
  cego: {
    defenseModifier: 0,
    testModifier: -5, // ataques
    movementModifier: 0,
    canAct: true,
    canMove: true,
  },
  surdo: {
    defenseModifier: 0,
    testModifier: 0,
    movementModifier: 0,
    canAct: true,
    canMove: true,
  },
  exausto: {
    defenseModifier: 0,
    testModifier: -2,
    movementModifier: -1, // -3m
    canAct: true,
    canMove: true,
  },
  apavorado: {
    defenseModifier: 0,
    testModifier: -2,
    movementModifier: 0,
    canAct: true,
    canMove: true, // mas deve fugir
  },
  fascinado: {
    defenseModifier: 0,
    testModifier: -5, // percepção
    movementModifier: 0,
    canAct: false,
    canMove: false,
  },
  inconsciente: {
    defenseModifier: -10, // Defesa 5 flat
    testModifier: -20,
    movementModifier: -2,
    canAct: false,
    canMove: false,
  },
  morrendo: {
    defenseModifier: -10,
    testModifier: -20,
    movementModifier: -2,
    canAct: false,
    canMove: false,
    startOfTurnEffect: () => ({
      message: 'Contador de morte avança'
    })
  },
  envenenado: {
    defenseModifier: 0,
    testModifier: -2,
    movementModifier: 0,
    canAct: true,
    canMove: true,
    startOfTurnEffect: () => ({
      damage: Math.floor(Math.random() * 4) + 1, // 1d4 típico
      message: 'Sofre dano de veneno'
    })
  },
  paralisado: {
    defenseModifier: -10,
    testModifier: -20,
    movementModifier: -2,
    canAct: false,
    canMove: false,
  },
  debilitado: {
    defenseModifier: 0,
    testModifier: -1, // em atributo específico
    movementModifier: 0,
    canAct: true,
    canMove: true,
  },
  fragilizado: {
    defenseModifier: 0,
    testModifier: 0,
    movementModifier: 0,
    canAct: true,
    canMove: true,
  },
  lento: {
    defenseModifier: 0,
    testModifier: 0,
    movementModifier: -1, // metade
    canAct: true, // apenas 1 ação
    canMove: true,
  },
  imobilizado: {
    defenseModifier: 0,
    testModifier: 0,
    movementModifier: -2,
    canAct: true,
    canMove: false,
  },
  indefeso: {
    defenseModifier: -20, // ataques automáticos
    testModifier: 0,
    movementModifier: 0,
    canAct: false,
    canMove: false,
  },
  confuso: {
    defenseModifier: 0,
    testModifier: 0,
    movementModifier: 0,
    canAct: true, // mas com restrições
    canMove: true,
  },
  perturbado: {
    defenseModifier: 0,
    testModifier: -2,
    movementModifier: 0,
    canAct: true,
    canMove: true,
  },
  enlouquecendo: {
    defenseModifier: 0,
    testModifier: 0,
    movementModifier: 0,
    canAct: false, // Mestre decide
    canMove: true,
  },
};

// ============== FUNÇÕES DE PE ==============

export function canSpendPE(cost: number, turnState: TurnState): boolean {
  return (turnState.peSpentThisTurn + cost) <= turnState.peLimit;
}

export function spendPE(
  cost: number, 
  currentPE: number, 
  turnState: TurnState
): { success: boolean; newPE: number; newTurnState: TurnState; error?: string } {
  if (!canSpendPE(cost, turnState)) {
    return { 
      success: false, 
      newPE: currentPE, 
      newTurnState: turnState,
      error: `Limite de PE por turno excedido! (${turnState.peSpentThisTurn}/${turnState.peLimit})`
    };
  }
  
  if (currentPE < cost) {
    return { 
      success: false, 
      newPE: currentPE, 
      newTurnState: turnState,
      error: `PE insuficiente! (${currentPE} disponível, ${cost} necessário)`
    };
  }

  return {
    success: true,
    newPE: currentPE - cost,
    newTurnState: {
      ...turnState,
      peSpentThisTurn: turnState.peSpentThisTurn + cost
    }
  };
}

export function createTurnState(nex: number): TurnState {
  return {
    peSpentThisTurn: 0,
    peLimit: getPELimitByNex(nex),
    hasActed: false,
    hasMoved: false,
    hasReacted: false,
  };
}

export function resetTurnState(turnState: TurnState): TurnState {
  return {
    ...turnState,
    peSpentThisTurn: 0,
    hasActed: false,
    hasMoved: false,
    hasReacted: false,
  };
}

// ============== FUNÇÕES DE DEFESA ==============

export function getEffectiveDefense(baseDefense: number, conditions: string[]): number {
  let defense = baseDefense;
  
  for (const conditionId of conditions) {
    const effect = CONDITION_EFFECTS[conditionId];
    if (effect) {
      defense += effect.defenseModifier;
    }
  }
  
  // Defesa mínima é 5 (inconsciente, paralisado, etc.)
  return Math.max(5, defense);
}

export function getTestModifier(conditions: string[]): number {
  let modifier = 0;
  
  for (const conditionId of conditions) {
    const effect = CONDITION_EFFECTS[conditionId];
    if (effect && effect.testModifier) {
      modifier += effect.testModifier;
    }
  }
  
  return modifier;
}

export function canAct(conditions: string[]): boolean {
  for (const conditionId of conditions) {
    const effect = CONDITION_EFFECTS[conditionId];
    if (effect && !effect.canAct) {
      return false;
    }
  }
  return true;
}

export function canMove(conditions: string[]): boolean {
  for (const conditionId of conditions) {
    const effect = CONDITION_EFFECTS[conditionId];
    if (effect && !effect.canMove) {
      return false;
    }
  }
  return true;
}

// ============== SISTEMA DE DANO ==============

export interface DamageApplication {
  finalDamage: number;
  wasReduced: boolean;
  rdApplied: number;
  triggeredConditions: string[];
  isDying: boolean;
  isDead: boolean;
}

export function applyDamage(
  currentHP: number, 
  maxHP: number,
  damage: number, 
  rd: number = 0,
  isVerdadeiro: boolean = false // Dano verdadeiro ignora RD
): DamageApplication {
  const rdApplied = isVerdadeiro ? 0 : Math.min(rd, damage);
  const finalDamage = Math.max(0, damage - rdApplied);
  const newHP = currentHP - finalDamage;
  
  const triggeredConditions: string[] = [];
  let isDying = false;
  let isDead = false;

  if (newHP <= 0) {
    isDying = true;
    triggeredConditions.push('morrendo');
    triggeredConditions.push('inconsciente');
    
    // Se já estava morrendo e recebeu mais dano
    if (newHP <= -maxHP) {
      isDead = true;
    }
  }

  return {
    finalDamage,
    wasReduced: rdApplied > 0,
    rdApplied,
    triggeredConditions,
    isDying,
    isDead,
  };
}

// ============== SISTEMA DE SANIDADE ==============

export interface SanityCheck {
  sanLost: number;
  newSan: number;
  triggeredCondition?: string;
  isTemporary: boolean;
}

export function applySanityDamage(
  currentSan: number,
  maxSan: number,
  sanLoss: number
): SanityCheck {
  const newSan = Math.max(0, currentSan - sanLoss);
  let triggeredCondition: string | undefined;
  let isTemporary = false;

  // Perda massiva (mais da metade do máximo de uma vez)
  if (sanLoss >= maxSan / 2) {
    triggeredCondition = 'enlouquecendo';
    isTemporary = true;
  } else if (newSan <= maxSan * 0.3) {
    // Abaixo de 30%
    triggeredCondition = 'perturbado';
  }

  return {
    sanLost: sanLoss,
    newSan,
    triggeredCondition,
    isTemporary,
  };
}

// ============== INÍCIO DE TURNO ==============

export interface StartOfTurnResult {
  damage: number;
  sanDamage: number;
  removedConditions: string[];
  messages: string[];
  dyingCounterReduced: boolean;
}

export function processStartOfTurn(
  combatant: CombatantState
): StartOfTurnResult {
  let damage = 0;
  let sanDamage = 0;
  const removedConditions: string[] = [];
  const messages: string[] = [];
  let dyingCounterReduced = false;

  for (const conditionId of combatant.conditions) {
    const condition = CONDITIONS[conditionId];
    const effect = CONDITION_EFFECTS[conditionId];
    
    if (!effect) continue;

    // Efeitos de início de turno
    if (effect.startOfTurnEffect) {
      const result = effect.startOfTurnEffect();
      if (result.damage) {
        damage += result.damage;
        messages.push(`${combatant.name}: ${result.message} (${result.damage} dano)`);
      }
      if (result.sanDamage) {
        sanDamage += result.sanDamage;
      }
    }

    // Condições que removem automaticamente
    if (condition?.autoRemove) {
      removedConditions.push(conditionId);
      messages.push(`${combatant.name}: ${condition.name} removido`);
    }

    // Contador de morrendo
    if (conditionId === 'morrendo' && combatant.dyingCounter !== undefined) {
      dyingCounterReduced = true;
      messages.push(`${combatant.name}: Contador de morte: ${combatant.dyingCounter - 1} rodadas restantes`);
    }
  }

  return {
    damage,
    sanDamage,
    removedConditions,
    messages,
    dyingCounterReduced,
  };
}

// ============== COMBAT TRACKER ==============

export function createCombatState(): CombatState {
  return {
    isActive: false,
    round: 0,
    currentTurnIndex: 0,
    combatants: [],
    log: [],
  };
}

export function rollInitiative(agility: number): { total: number; rolls: number[] } {
  const diceCount = Math.max(1, agility);
  const rolls = Array.from({ length: diceCount }, () => Math.floor(Math.random() * 20) + 1);
  const total = agility <= 0 ? Math.min(...rolls) : Math.max(...rolls);
  return { total, rolls };
}

export function sortByInitiative(combatants: CombatantState[]): CombatantState[] {
  return [...combatants].sort((a, b) => b.initiative - a.initiative);
}

export function nextTurn(state: CombatState): CombatState {
  let nextIndex = state.currentTurnIndex + 1;
  let newRound = state.round;

  if (nextIndex >= state.combatants.length) {
    nextIndex = 0;
    newRound += 1;
  }

  // Reset do turno do próximo combatente
  const updatedCombatants = state.combatants.map((c, i) => 
    i === nextIndex 
      ? { ...c, turnState: resetTurnState(c.turnState) }
      : c
  );

  return {
    ...state,
    round: newRound,
    currentTurnIndex: nextIndex,
    combatants: updatedCombatants,
    log: [
      ...state.log,
      {
        timestamp: new Date(),
        type: 'turn',
        actor: updatedCombatants[nextIndex].name,
        message: `Turno de ${updatedCombatants[nextIndex].name} (Rodada ${newRound})`,
      }
    ]
  };
}

export function addCombatLogEntry(
  state: CombatState, 
  entry: Omit<CombatLogEntry, 'timestamp'>
): CombatState {
  return {
    ...state,
    log: [...state.log, { ...entry, timestamp: new Date() }]
  };
}
