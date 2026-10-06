import { getPELimitWithBonus } from '@/lib/dice-roller';

/**
 * DT dos rituais do conjurador: 10 + limite de PE + PRE (Base v1.3 p.121).
 * Recebe NEX, Presença e bônus já calculados pelo SUE; retorna a DT, sem gravar.
 * Usa o limite total, independentemente do PE gasto ou do círculo do ritual.
 */
export function calculateRitualResistanceDT(
  nex: number,
  presence: number,
  peLimitBonus = 0,
  ritualDTBonus = 0,
): number {
  const dt = 10 + getPELimitWithBonus(nex, peLimitBonus) + presence + ritualDTBonus;
  if (!Number.isFinite(dt) || dt < 1) {
    throw new RangeError('Dificuldade de resistência do ritual inválida');
  }
  return dt;
}
