// Ordem Paranormal RPG v1.3 - Dice Roller Engine
// Sistema de Pool de Dados (Dice Pool)

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
 */
export function rollSkillTest(params: SkillTestParams): DiceRollResult {
  const { 
    attributeValue, 
    skillBonus, 
    otherBonuses = 0, 
    extraDice = 0,  // Dados extras (Discurso Motivador, etc.)
    label,
    criticalThreshold = 20 
  } = params;
  
  let dice: number[];
  let keptDice: number;
  let isDisadvantage = false;

  if (attributeValue <= 0) {
    // Regra do Zero: rola 2d20 e pega o MENOR
    // IMPORTANTE: Dados extras são IGNORADOS na Regra do Zero (conforme regras oficiais)
    dice = [rollD20(), rollD20()];
    keptDice = Math.min(...dice);
    isDisadvantage = true;
  } else {
    // Pool normal: rola (atributo + dados extras) d20 e pega o MAIOR
    const totalDice = attributeValue + extraDice;
    dice = Array.from({ length: totalDice }, () => rollD20());
    keptDice = Math.max(...dice);
  }

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

// Limite de PE por turno baseado no NEX
export function getPELimitByNex(nex: number): number {
  if (nex <= 5) return 1;
  if (nex <= 15) return 2;
  if (nex <= 25) return 3;
  if (nex <= 35) return 4;
  if (nex <= 45) return 5;
  if (nex <= 55) return 6;
  if (nex <= 65) return 8;
  if (nex <= 75) return 10;
  if (nex <= 85) return 12;
  if (nex <= 95) return 15;
  return 20;
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
