import type { RollHistoryEntry } from '@/components/character/mobile/MobileRollHistory';

export interface RitualResolutionRoll {
  dice: number[]; diceType: number; bonus: number; diceMultiplier?: number;
  total: number; damageType: string; ignoresRD: boolean;
}
/** Registra o sorteio original; multiplicador afeta os dados antes dos bônus fixos. */
export function ritualRollHistory(ritualName: string, result: RitualResolutionRoll): Omit<RollHistoryEntry, 'id' | 'timestamp'> {
  return { type: 'ritual', label: ritualName, diceCount: result.dice.length, results: result.dice,
    bestResult: result.dice.reduce((sum, die) => sum + die, 0) * (result.diceMultiplier ?? 1),
    skillBonus: 0, otherBonuses: result.bonus, bonus: result.bonus, total: result.total,
    diceType: result.diceType, diceMultiplier: result.diceMultiplier ?? 1 };
}
