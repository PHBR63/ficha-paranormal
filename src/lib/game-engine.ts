// Ordem Paranormal RPG v1.3 - Motor de Regras Automatizado
// Sistema completo de combate, PE, condições e inventário
// Atualizado com sistema de morrendo, aplicação automática e modificadores contextuais

import { 
  CONDITIONS, 
  type Condition, 
  CONTEXTUAL_DEFENSE_MODIFIERS,
  getAttackModifierFromConditions,
  getInitiativeModifierFromConditions 
} from './conditions';
import { getPELimitByNex } from './dice-roller';

// ============== INTERFACES ==============

export interface TurnState {
  peSpentThisTurn: number;
  peLimit: number;
  hasActed: boolean;
  hasMoved: boolean;
  hasReacted: boolean;
  actionsRemaining: number; // Para condição Lento (apenas 1 ação)
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
  dyingCounter?: number; // 3 = acabou de entrar em morrendo, 0 = morte
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
  type: 'initiative' | 'attack' | 'damage' | 'heal' | 'condition' | 'pe' | 'turn' | 'death' | 'system' | 'dying';
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
  canReact?: boolean; // Para desprevenido
  maxActions?: number; // Para lento (1 ação)
  startOfTurnEffect?: () => { damage?: number; sanDamage?: number; message?: string; isDamageVerdadeiro?: boolean };
}

/**
 * Interface para resultado de aplicação automática de condições
 */
export interface AutoConditionResult {
  conditionsToAdd: string[];
  conditionsToRemove: string[];
  messages: string[];
  dyingCounter?: number;
}

// ============== EFEITOS DE CONDIÇÕES ==============

export const CONDITION_EFFECTS: Record<string, ConditionEffect> = {
  // === COMBATE ===
  sangrando: {
    defenseModifier: 0,
    testModifier: 0,
    movementModifier: 0,
    canAct: true,
    canMove: true,
    startOfTurnEffect: () => ({
      damage: Math.floor(Math.random() * 6) + 1, // 1d6
      isDamageVerdadeiro: true, // Ignora RD
      message: 'Sofre dano de sangramento (1d6 verdadeiro)'
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
    canReact: false,
  },
  agarrado: {
    defenseModifier: -2,
    testModifier: 0,
    movementModifier: -2, // 0 movement
    canAct: true,
    canMove: false,
  },
  // Caído usa modificadores contextuais em CONTEXTUAL_DEFENSE_MODIFIERS
  caido: {
    defenseModifier: 0, // Base 0, contextual aplica -5 melee ou +5 ranged
    testModifier: 0,
    movementModifier: 0,
    canAct: true,
    canMove: true,
  },
  desprevenido: {
    defenseModifier: -5,
    testModifier: 0,
    movementModifier: 0,
    canAct: true,
    canMove: true,
    canReact: false, // Não pode usar reações
  },
  surpreendido: {
    defenseModifier: -5,
    testModifier: 0,
    movementModifier: 0,
    canAct: false, // Não age na primeira rodada
    canMove: false,
    canReact: false,
  },

  // === SENSORIAIS ===
  cego: {
    defenseModifier: 0,
    testModifier: 0, // -5 em ataques via ATTACK_MODIFIERS
    movementModifier: 0,
    canAct: true,
    canMove: true,
  },
  surdo: {
    defenseModifier: 0,
    testModifier: 0, // -2 em iniciativa via INITIATIVE_MODIFIERS
    movementModifier: 0,
    canAct: true,
    canMove: true,
  },

  // === FÍSICAS ===
  exausto: {
    defenseModifier: 0,
    testModifier: -2,
    movementModifier: -1, // -3m (representado como -1 = metade ou penalidade fixa)
    canAct: true,
    canMove: true,
  },
  envenenado: {
    defenseModifier: 0,
    testModifier: -2,
    movementModifier: 0,
    canAct: true,
    canMove: true,
    startOfTurnEffect: () => ({
      damage: Math.floor(Math.random() * 4) + 1, // 1d4 típico
      message: 'Sofre dano de veneno (1d4)'
    })
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
    // Vulnerável a tipo de dano específico (+50%) - processado no sistema de dano
  },
  lento: {
    defenseModifier: 0,
    testModifier: 0,
    movementModifier: -1, // metade
    canAct: true,
    canMove: true,
    maxActions: 1, // Apenas 1 ação por turno
  },
  imobilizado: {
    defenseModifier: 0,
    testModifier: 0,
    movementModifier: -2,
    canAct: true,
    canMove: false,
  },

  // === MENTAIS ===
  apavorado: {
    defenseModifier: 0,
    testModifier: -2,
    movementModifier: 0,
    canAct: true, // mas deve fugir
    canMove: true,
  },
  fascinado: {
    defenseModifier: 0,
    testModifier: -5, // percepção
    movementModifier: 0,
    canAct: false, // só pode observar
    canMove: false,
  },
  confuso: {
    defenseModifier: 0,
    testModifier: 0,
    movementModifier: 0,
    canAct: true, // com restrições (1d6)
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

  // === CRÍTICAS ===
  inconsciente: {
    defenseModifier: -10, // Defesa 5 flat
    testModifier: -20,
    movementModifier: -2,
    canAct: false,
    canMove: false,
    canReact: false,
  },
  morrendo: {
    defenseModifier: -10,
    testModifier: -20,
    movementModifier: -2,
    canAct: false,
    canMove: false,
    canReact: false,
    startOfTurnEffect: () => ({
      message: 'Contador de morte avança! Faça um teste de Medicina DT 20 para estabilizar.'
    })
  },
  paralisado: {
    defenseModifier: -10,
    testModifier: -20,
    movementModifier: -2,
    canAct: false,
    canMove: false,
    canReact: false,
  },
  indefeso: {
    defenseModifier: -20, // ataques automáticos e críticos
    testModifier: 0,
    movementModifier: 0,
    canAct: false,
    canMove: false,
    canReact: false,
  },
};

// ============== APLICAÇÃO AUTOMÁTICA DE CONDIÇÕES ==============

/**
 * Verifica e aplica condições automaticamente baseado nos recursos do personagem
 * @param hp - HP atual
 * @param hpMax - HP máximo
 * @param san - Sanidade atual
 * @param sanMax - Sanidade máxima
 * @param currentConditions - Condições atuais
 * @returns Resultado com condições a adicionar/remover
 */
export function checkAutoConditions(
  hp: number,
  hpMax: number,
  san: number,
  sanMax: number,
  currentConditions: string[]
): AutoConditionResult {
  const conditionsToAdd: string[] = [];
  const conditionsToRemove: string[] = [];
  const messages: string[] = [];
  let dyingCounter: number | undefined;

  // HP = 0 → Inconsciente
  if (hp === 0 && !currentConditions.includes('inconsciente')) {
    conditionsToAdd.push('inconsciente');
    messages.push('Você caiu inconsciente (HP = 0)!');
  }

  // HP < 0 → Morrendo (além de inconsciente)
  if (hp < 0 && !currentConditions.includes('morrendo')) {
    conditionsToAdd.push('morrendo');
    if (!currentConditions.includes('inconsciente')) {
      conditionsToAdd.push('inconsciente');
    }
    dyingCounter = 3; // Inicia com 3 rodadas
    messages.push('Você está MORRENDO! 3 rodadas até a morte.');
  }

  // HP > 0 → Remover Inconsciente e Morrendo
  if (hp > 0) {
    if (currentConditions.includes('inconsciente')) {
      conditionsToRemove.push('inconsciente');
      messages.push('Você recuperou a consciência!');
    }
    if (currentConditions.includes('morrendo')) {
      conditionsToRemove.push('morrendo');
      messages.push('Você foi estabilizado!');
    }
  }

  // SAN = 0 → Enlouquecendo
  if (san === 0 && !currentConditions.includes('enlouquecendo')) {
    conditionsToAdd.push('enlouquecendo');
    messages.push('Colapso mental total! Você está enlouquecendo.');
  }

  // SAN > 0 → Remover Enlouquecendo
  if (san > 0 && currentConditions.includes('enlouquecendo')) {
    conditionsToRemove.push('enlouquecendo');
    messages.push('Você recuperou parte da sanidade.');
  }

  // SAN ≤ 30% do máximo → Perturbado
  const sanThreshold = sanMax * 0.3;
  if (san > 0 && san <= sanThreshold && !currentConditions.includes('perturbado') && !currentConditions.includes('enlouquecendo')) {
    conditionsToAdd.push('perturbado');
    messages.push('Sua mente está abalada (SAN ≤ 30%).');
  }

  // SAN > 30% → Remover Perturbado (se não tiver outra causa)
  if (san > sanThreshold && currentConditions.includes('perturbado')) {
    conditionsToRemove.push('perturbado');
    messages.push('Sua mente se acalmou.');
  }

  return {
    conditionsToAdd,
    conditionsToRemove,
    messages,
    dyingCounter,
  };
}

// ============== SISTEMA DE MORRENDO ==============

export interface DyingResult {
  isDead: boolean;
  newCounter: number;
  message: string;
}

/**
 * Processa o contador de morrendo no início do turno
 * @param currentCounter - Contador atual (3, 2, 1, 0)
 * @returns Resultado com novo contador e se morreu
 */
export function processDyingCounter(currentCounter: number): DyingResult {
  const newCounter = Math.max(0, currentCounter - 1);
  
  if (newCounter === 0) {
    return {
      isDead: true,
      newCounter: 0,
      message: '💀 MORTE! O contador chegou a 0.'
    };
  }

  return {
    isDead: false,
    newCounter,
    message: `⚠️ Morrendo: ${newCounter} rodada${newCounter > 1 ? 's' : ''} restante${newCounter > 1 ? 's' : ''}.`
  };
}

/**
 * Reduz o contador de morrendo quando recebe dano adicional
 * @param currentCounter - Contador atual
 * @param damageReceived - Dano recebido (qualquer dano reduz 1)
 * @returns Novo contador
 */
export function reduceDyingCounterFromDamage(currentCounter: number, damageReceived: number): DyingResult {
  if (damageReceived <= 0) {
    return {
      isDead: false,
      newCounter: currentCounter,
      message: ''
    };
  }

  const newCounter = Math.max(0, currentCounter - 1);
  
  if (newCounter === 0) {
    return {
      isDead: true,
      newCounter: 0,
      message: '💀 MORTE! Dano adicional enquanto morrendo.'
    };
  }

  return {
    isDead: false,
    newCounter,
    message: `⚠️ Dano enquanto morrendo! Contador: ${newCounter} rodada${newCounter > 1 ? 's' : ''}.`
  };
}

/**
 * Estabiliza um personagem morrendo (teste de Medicina DT 20 bem sucedido)
 * @param currentHP - HP atual (negativo)
 * @returns HP ajustado para 0 (estabilizado mas inconsciente)
 */
export function stabilizeDyingCharacter(): { newHP: number; message: string } {
  return {
    newHP: 0,
    message: 'Personagem estabilizado! HP = 0, ainda inconsciente.'
  };
}

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
    actionsRemaining: 2, // Padrão: 2 ações (1 padrão + 1 movimento ou 2 padrão)
  };
}

export function resetTurnState(turnState: TurnState, conditions: string[] = []): TurnState {
  // Verifica se tem condição Lento (apenas 1 ação)
  const hasLento = conditions.includes('lento');
  
  return {
    ...turnState,
    peSpentThisTurn: 0,
    hasActed: false,
    hasMoved: false,
    hasReacted: false,
    actionsRemaining: hasLento ? 1 : 2,
  };
}

// ============== FUNÇÕES DE DEFESA ==============

/**
 * Calcula defesa efetiva considerando condições
 * @param baseDefense - Defesa base
 * @param conditions - Lista de condições ativas
 * @param attackType - Tipo de ataque (para modificadores contextuais como Caído)
 */
export function getEffectiveDefense(
  baseDefense: number, 
  conditions: string[], 
  attackType?: 'melee' | 'ranged'
): number {
  let defense = baseDefense;
  
  for (const conditionId of conditions) {
    const effect = CONDITION_EFFECTS[conditionId];
    if (effect) {
      defense += effect.defenseModifier;
    }
    
    // Aplicar modificadores contextuais (ex: Caído)
    if (attackType) {
      const contextual = CONTEXTUAL_DEFENSE_MODIFIERS[conditionId];
      if (contextual) {
        defense += contextual[attackType] ?? 0;
      }
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

/**
 * Verifica se pode agir baseado nas condições
 */
export function canAct(conditions: string[]): boolean {
  for (const conditionId of conditions) {
    const effect = CONDITION_EFFECTS[conditionId];
    if (effect && !effect.canAct) {
      return false;
    }
  }
  return true;
}

/**
 * Verifica se pode se mover baseado nas condições
 */
export function canMove(conditions: string[]): boolean {
  for (const conditionId of conditions) {
    const effect = CONDITION_EFFECTS[conditionId];
    if (effect && !effect.canMove) {
      return false;
    }
  }
  return true;
}

/**
 * Verifica se pode usar reações baseado nas condições
 */
export function canReact(conditions: string[]): boolean {
  for (const conditionId of conditions) {
    const effect = CONDITION_EFFECTS[conditionId];
    if (effect && effect.canReact === false) {
      return false;
    }
  }
  return true;
}

/**
 * Obtém o número máximo de ações permitidas (considerando Lento)
 */
export function getMaxActions(conditions: string[]): number {
  let maxActions = 2; // Padrão
  
  for (const conditionId of conditions) {
    const effect = CONDITION_EFFECTS[conditionId];
    if (effect?.maxActions !== undefined) {
      maxActions = Math.min(maxActions, effect.maxActions);
    }
  }
  
  return maxActions;
}

// ============== SISTEMA DE DANO ==============

export interface DamageApplication {
  finalDamage: number;
  wasReduced: boolean;
  rdApplied: number;
  triggeredConditions: string[];
  isDying: boolean;
  isDead: boolean;
  dyingCounterChange?: number; // -1 se reduziu contador de morrendo
}

export function applyDamage(
  currentHP: number, 
  maxHP: number,
  damage: number, 
  rd: number = 0,
  isVerdadeiro: boolean = false, // Dano verdadeiro ignora RD
  wasDying: boolean = false // Se já estava morrendo
): DamageApplication {
  const rdApplied = isVerdadeiro ? 0 : Math.min(rd, damage);
  const finalDamage = Math.max(0, damage - rdApplied);
  const newHP = currentHP - finalDamage;
  
  const triggeredConditions: string[] = [];
  let isDying = false;
  let isDead = false;
  let dyingCounterChange: number | undefined;

  if (newHP <= 0) {
    isDying = true;
    
    if (!wasDying) {
      // Primeira vez entrando em morrendo
      triggeredConditions.push('morrendo');
      triggeredConditions.push('inconsciente');
    } else {
      // Já estava morrendo, reduz contador
      dyingCounterChange = -1;
    }
    
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
    dyingCounterChange,
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
  } else if (newSan === 0) {
    // SAN zerou
    triggeredCondition = 'enlouquecendo';
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
  isDamageVerdadeiro: boolean;
  sanDamage: number;
  removedConditions: string[];
  messages: string[];
  dyingCounterReduced: boolean;
  dyingResult?: DyingResult;
}

/**
 * Processa todos os efeitos de início de turno
 * Inclui: dano de condições, contador de morrendo, remoção automática
 */
export function processStartOfTurn(
  combatant: CombatantState
): StartOfTurnResult {
  let damage = 0;
  let isDamageVerdadeiro = false;
  let sanDamage = 0;
  const removedConditions: string[] = [];
  const messages: string[] = [];
  let dyingCounterReduced = false;
  let dyingResult: DyingResult | undefined;

  for (const conditionId of combatant.conditions) {
    const condition = CONDITIONS[conditionId];
    const effect = CONDITION_EFFECTS[conditionId];
    
    if (!effect) continue;

    // Efeitos de início de turno (sangrando, envenenado)
    if (effect.startOfTurnEffect) {
      const result = effect.startOfTurnEffect();
      if (result.damage) {
        damage += result.damage;
        if (result.isDamageVerdadeiro) {
          isDamageVerdadeiro = true;
        }
        messages.push(`${combatant.name}: ${result.message} (${result.damage} dano)`);
      }
      if (result.sanDamage) {
        sanDamage += result.sanDamage;
      }
      if (result.message && !result.damage) {
        messages.push(`${combatant.name}: ${result.message}`);
      }
    }

    // Condições que removem automaticamente (atordoado, surpreendido)
    if (condition?.autoRemove) {
      removedConditions.push(conditionId);
      messages.push(`${combatant.name}: ${condition.name} removido`);
    }
  }

  // Processar contador de morrendo separadamente (mais importante)
  if (combatant.conditions.includes('morrendo') && combatant.dyingCounter !== undefined) {
    dyingCounterReduced = true;
    dyingResult = processDyingCounter(combatant.dyingCounter);
    messages.unshift(dyingResult.message); // Coloca no início da lista
  }

  return {
    damage,
    isDamageVerdadeiro,
    sanDamage,
    removedConditions,
    messages,
    dyingCounterReduced,
    dyingResult,
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

export function rollInitiative(agility: number, conditions: string[] = []): { total: number; rolls: number[] } {
  const diceCount = Math.max(1, agility);
  const rolls = Array.from({ length: diceCount }, () => Math.floor(Math.random() * 20) + 1);
  let total = agility <= 0 ? Math.min(...rolls) : Math.max(...rolls);
  
  // Aplicar modificadores de iniciativa de condições (ex: Surdo -2)
  total += getInitiativeModifierFromConditions(conditions);
  
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
