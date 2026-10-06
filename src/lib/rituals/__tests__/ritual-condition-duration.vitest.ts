import { describe, expect, it } from 'vitest';
import { formatRitualConditionDuration, getRitualConditionTurns } from '../ritual-condition-duration';

describe('Duração de condições do ritual', () => {
  it.each([
    { duration: 1, expected: 1, label: '1 rodada' },
    { duration: 3, expected: 3, label: '3 rodadas' },
    { duration: 'rodada' as const, expected: 1, label: '1 rodada' },
    { duration: 'rodada' as const, turnsCount: 4, expected: 4, label: '4 rodadas' },
    { duration: 'cena' as const, expected: null, label: 'cena' },
    { duration: 'sustentado' as const, expected: null, label: 'sustentado' },
    { duration: 'permanente' as const, expected: null, label: 'permanente' },
    { duration: undefined, expected: null, label: 'Duração manual' },
  ])('preserva prazo $duration/$turnsCount', ({ expected, label, ...condition }) => {
    expect(getRitualConditionTurns(condition)).toBe(expected);
    expect(formatRitualConditionDuration(condition)).toBe(label);
  });
});
