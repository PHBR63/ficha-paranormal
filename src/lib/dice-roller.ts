import { getNexLevel } from '@/lib/rules/nex-progression';
/**
 * Ordem Paranormal RPG v1.3 - Dice Roller Engine
 * Sistema de Pool de Dados (Dice Pool)
 * 
 * @deprecated Este módulo contém funções legadas de rolagem.
 * Para rolagens COM contexto de personagem (combate, perícias, resistências),
 * use os hooks integrados ao SUE:
 * - useCombatRollWithSUE (ataques e dano)
 * - useSkillRollWithSUE (testes de perícia)
 * - useInitiativeRollWithSUE (iniciativa)
 * - useResistanceRollWithSUE (resistências)
 * - useRitualDamageWithSUE (dano de rituais)
 * 
 * Este módulo atende chat e fluxos legados de modal com bônus pré-calculados.
 * Os modais passam as penalidades de condições separadamente para o pool compartilhado.
 */

import { getAttributeDicePool } from './attribute-dice-pool';

export interface DiceRollResult {
  dice: number[];
  keptDice: number;
  skillBonus: number;
  otherBonuses: number;
  extraDice: number;           // Dados extras adicionados ao pool (ex: Discurso Motivador)
  total: number;
  isDisadvantage: boolean;
  isCritical: boolean;
  criticalThreshold?: number;
  timestamp: Date;
  type: 'skill' | 'attack' | 'damage' | 'resistance';
  label?: string;
}

export interface SkillTestParams {
  attributeValue: number;
  /** Penalidade positiva em quantidade de d20, separada dos bônus numéricos. */
  dicePenalty?: number;
  skillBonus: number;
  otherBonuses?: number;
  extraDice?: number;           // Dados extras ao pool (ex: Discurso Motivador +1d20)
  label?: string;
  criticalThreshold?: number;
}

export interface AttackParams {
  attributeValue: number;
  skillBonus: number;
  otherBonuses?: number;
  criticalThreshold?: number;
  targetDefense?: number;
  label?: string;
}

export interface DamageParams {
  diceCount: number;
  diceType: number;
  bonusDamage?: number;
  isCritical?: boolean;
  criticalMultiplier?: number;
  damageType?: string;
}

export interface DamageResult {
  dice: number[];
  bonusDamage: number;
  total: number;
  damageType?: string;
  isCritical: boolean;
}

// Roll a single d20
function rollD20(): number {
  return Math.floor(Math.random() * 20) + 1;
}

// Roll any die
function rollDie(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}

// Roll multiple dice
function rollDice(count: number, sides: number): number[] {
  return Array.from({ length: count }, () => rollDie(sides));
}

/**
 * Sistema de Pool de Dados - Ordem Paranormal
 * 
 * - Se atributo > 0: rola N d20 e pega o MAIOR
 * - Se atributo == 0: rola 2d20 e pega o MENOR (desvantagem)
 * - Se atributo < 0: rola 2 + valor absoluto do atributo e pega o MENOR
 * 
 * @deprecated Para rolagens com bônus de personagem, use useSkillRollWithSUE.
 * Esta função é mantida para rolagens simples (chat, comandos /r).
 */
export function rollSkillTest(params: SkillTestParams): DiceRollResult {
  const { 
    attributeValue, 
    dicePenalty = 0,
    skillBonus, 
    otherBonuses = 0, 
    extraDice = 0,  // Dados extras (Discurso Motivador, etc.)
    label,
    criticalThreshold = 20 
  } = params;
  
  // Conserva a política legada de dados extras para atributo não positivo.
  const pool = getAttributeDicePool(attributeValue > 0 ? attributeValue + extraDice : attributeValue, dicePenalty);
  const dice = rollDice(pool.count, 20);
  const isDisadvantage = pool.keep === 'lowest';
  const keptDice = isDisadvantage ? Math.min(...dice) : Math.max(...dice);

  const total = keptDice + skillBonus + otherBonuses;
  const isCritical = keptDice >= criticalThreshold;

  return {
    dice,
    keptDice,
    skillBonus,
    otherBonuses,
    extraDice: attributeValue <= 0 ? 0 : extraDice, // Registra 0 se ignorado pela Regra do Zero
    total,
    isDisadvantage,
    isCritical,
    criticalThreshold,
    timestamp: new Date(),
    type: 'skill',
    label,
  };
}

/**
 * Rolagem de ataque
 * Similar ao teste de perícia, mas com verificação de acerto crítico
 * 
 * @deprecated Use useCombatRollWithSUE.executeAttackRoll() para ataques com bônus de personagem.
 */
export function rollAttack(params: AttackParams): DiceRollResult & {
  hit: boolean; 
  targetDefense?: number;
} {
  const result = rollSkillTest({
    attributeValue: params.attributeValue,
    skillBonus: params.skillBonus,
    otherBonuses: params.otherBonuses,
    criticalThreshold: params.criticalThreshold,
    label: params.label,
  });

  // REGRA PERSONALIZADA: Crítico NÃO é acerto automático
  // O ataque só acerta se o total >= Defesa, mesmo em crítico
  const hit = params.targetDefense 
    ? result.total >= params.targetDefense
    : true;

  return {
    ...result,
    type: 'attack',
    hit,
    targetDefense: params.targetDefense,
  };
}

/**
 * Rolagem de dano
 * Em crítico, multiplica a QUANTIDADE de dados, não o resultado
 * 
 * @deprecated Use useCombatRollWithSUE.executeDamageRoll() ou useRitualDamageWithSUE para dano com bônus.
 */
export function rollDamage(params: DamageParams): DamageResult {
  const { 
    diceCount, 
    diceType, 
    bonusDamage = 0, 
    isCritical = false,
    criticalMultiplier = 2,
    damageType
  } = params;

  // Em crítico, multiplica os dados
  const actualDiceCount = isCritical ? diceCount * criticalMultiplier : diceCount;
  const dice = rollDice(actualDiceCount, diceType);
  const diceSum = dice.reduce((a, b) => a + b, 0);
  const total = diceSum + bonusDamage;

  return {
    dice,
    bonusDamage,
    total,
    damageType,
    isCritical,
  };
}

/**
 * Teste de Resistência
 * Fortitude (VIG), Reflexos (AGI), Vontade (PRE)
 * 
 * @deprecated Use useResistanceRollWithSUE para testes de resistência com bônus de personagem.
 */
export function rollResistance(
  attributeValue: number,
  label: string
): DiceRollResult {
  return rollSkillTest({
    attributeValue,
    skillBonus: 0,
    label: `Teste de ${label}`,
  });
}

// Tabela de dificuldades
export const DIFFICULTY_TABLE = {
  'Fácil': 5,
  'Média': 10,
  'Difícil': 15,
  'Muito Difícil': 20,
  'Formidável': 25,
  'Heroica': 30,
} as const;

// Graus de treinamento
export const TRAINING_BONUS = {
  'Destreinado': 0,
  'Treinado': 5,
  'Veterano': 10,
  'Expert': 15,
} as const;

/** Limite por turno da tabela de progressão, Livro Base v1.3 p.23; sem bônus de origem. */
export function getPELimitByNex(nex: number): number {
  if (!Number.isFinite(nex)) return 1;
  if (nex >= 99) return 20;
  return Math.max(1, getNexLevel(nex));
}

/**
 * Limite de PE por turno com bônus de origem (Universitário: Dedicação)
 * @param nex - NEX do personagem
 * @param peLimitBonus - Bônus de limite de PE do SUE (computed.resources.peLimitBonus)
 */
export function getPELimitWithBonus(nex: number, peLimitBonus: number = 0): number {
  return getPELimitByNex(nex) + peLimitBonus;
}

// Verifica se um grau de treinamento está disponível para o NEX
export function isTrainingAvailable(training: string, nex: number): boolean {
  switch (training) {
    case 'Destreinado':
    case 'Treinado':
      return true;
    case 'Veterano':
      return nex >= 35;
    case 'Expert':
      return nex >= 70;
    default:
      return false;
  }
}
