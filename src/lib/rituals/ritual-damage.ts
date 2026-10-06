import type { RitualDamage } from './types';

type DamageDiceFormula = Pick<RitualDamage, 'diceCount' | 'diceType' | 'bonus' | 'diceMultiplier'>;

/**
 * Rola a fórmula estruturada e retorna dados originais, multiplicador e total.
 * O multiplicador afeta a soma dos dados; bônus fixos/SUE são somados depois.
 * Mantém 3d10×10 distinto de 30d10 (Base v1.3 p.129), sem alterar cura/PV temp.
 */
export function rollRitualDamage(formula: DamageDiceFormula, additionalBonus = 0) {
  const diceMultiplier = formula.diceMultiplier ?? 1;
  const bonus = (formula.bonus ?? 0) + additionalBonus;
  if (!Number.isInteger(formula.diceCount) || formula.diceCount < 0 ||
      !Number.isInteger(formula.diceType) || formula.diceType < 1 ||
      !Number.isFinite(diceMultiplier) || diceMultiplier <= 0 || !Number.isFinite(bonus)) {
    throw new RangeError('Fórmula de dano de ritual inválida');
  }
  const dice = Array.from({ length: formula.diceCount }, () => Math.floor(Math.random() * formula.diceType) + 1);
  const total = dice.reduce((sum, die) => sum + die, 0) * diceMultiplier + bonus;
  return { dice, diceType: formula.diceType, diceMultiplier, bonus, total };
}
