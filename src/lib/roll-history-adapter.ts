import type { DiceRollResult } from '@/lib/dice-roller';
import type { RollHistoryEntry } from '@/components/character/mobile/MobileRollHistory';
import type { CharacterActivityEvent } from '@/types/character-activity';

/** Converte o resultado sem perder os modificadores separados do motor desktop. */
export function diceHistoryEntry(roll: DiceRollResult): Omit<RollHistoryEntry, 'id' | 'timestamp'> {
  return {
    type: roll.type, label: roll.label || 'Teste', diceCount: roll.dice.length,
    results: roll.dice, bestResult: roll.keptDice, bonus: roll.skillBonus + roll.otherBonuses,
    skillBonus: roll.skillBonus, otherBonuses: roll.otherBonuses, total: roll.total,
    critical: roll.isCritical, isDisadvantage: roll.isDisadvantage,
    extraDice: roll.extraDice, criticalThreshold: roll.criticalThreshold,
  };
}

/** Só projeta eventos válidos da ficha; dados legados globais nunca são atribuídos. */
export function activityRollEntries(events: CharacterActivityEvent[], characterId?: string): RollHistoryEntry[] {
  return events.flatMap(event => {
    if ((characterId && event.character_id !== characterId) || event.category !== 'roll' || !event.payload || typeof event.payload !== 'object' || Array.isArray(event.payload)) return [];
    const entry = event.payload.entry;
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return [];
    if (typeof entry.label !== 'string' || !['skill', 'attack', 'damage', 'ritual', 'resistance', 'initiative'].includes(String(entry.type))) return [];
    if (!Array.isArray(entry.results) || !entry.results.every(value => typeof value === 'number' && Number.isFinite(value))) return [];
    if (![entry.total, entry.bonus, entry.bestResult, entry.diceCount].every(value => typeof value === 'number' && Number.isFinite(value))) return [];
    if (entry.diceCount !== entry.results.length || !Number.isInteger(entry.diceCount) || entry.diceCount < 1) return [];
    if (['skillBonus', 'otherBonuses', 'extraDice', 'criticalThreshold', 'targetDT', 'damageTotal', 'peCost', 'diceType', 'diceMultiplier'].some(key => entry[key] !== undefined && (typeof entry[key] !== 'number' || !Number.isFinite(entry[key] as number)))) return [];
    if (['diceType', 'diceMultiplier'].some(key => entry[key] !== undefined && (!Number.isInteger(entry[key]) || Number(entry[key]) < 1))) return [];
    if (['critical', 'criticalFail', 'success', 'isDisadvantage'].some(key => entry[key] !== undefined && typeof entry[key] !== 'boolean')) return [];
    const timestamp = new Date(event.created_at);
    if (!Number.isFinite(timestamp.getTime())) return [];
    return [{ ...entry, id: event.id, timestamp } as unknown as RollHistoryEntry];
  });
}

/** Modificadores sem origem conhecida permanecem agregados, sem inventar fontes. */
export function entryDiceResult(entry: RollHistoryEntry): DiceRollResult {
  return {
    dice: entry.results, keptDice: entry.bestResult, total: entry.total,
    skillBonus: entry.skillBonus ?? entry.bonus - (entry.otherBonuses ?? 0),
    otherBonuses: entry.otherBonuses ?? (entry.skillBonus === undefined ? 0 : entry.bonus - entry.skillBonus),
    extraDice: entry.extraDice ?? 0, criticalThreshold: entry.criticalThreshold,
    isDisadvantage: entry.isDisadvantage ?? false, isCritical: entry.critical ?? false,
    timestamp: entry.timestamp, type: entry.type === 'initiative' || entry.type === 'ritual' ? 'skill' : entry.type,
    label: entry.label,
  };
}
