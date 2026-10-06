import { describe, expect, it } from 'vitest';
import { calculateRitualResistanceDT } from '../ritual-resistance';
import { mechanicsToLegacyEffect } from '../ritual-adapter';

describe('DT de rituais do conjurador (Base v1.3 p.121)', () => {
  it.each([
    { nex: 5, presence: 3, limitBonus: 0, dtBonus: 0, expected: 14 },
    { nex: 99, presence: 5, limitBonus: 0, dtBonus: 0, expected: 35 },
    { nex: 20, presence: 0, limitBonus: 0, dtBonus: 0, expected: 14 },
    { nex: 20, presence: 3, limitBonus: 1, dtBonus: 4, expected: 22 },
  ])('NEX $nex/PRE $presence e bônus → $expected', ({ nex, presence, limitBonus, dtBonus, expected }) => {
    expect(calculateRitualResistanceDT(nex, presence, limitBonus, dtBonus)).toBe(expected);
  });
  it.each([NaN, Infinity])('rejeita presença inválida %s', presence => {
    expect(() => calculateRitualResistanceDT(5, presence)).toThrow('Dificuldade de resistência do ritual inválida');
  });
  it('transporta a DT explícita de um efeito sem substituí-la pela DT do conjurador', () => {
    expect(mechanicsToLegacyEffect({ resistance: { type: 'fortitude', effect: 'parcial', dt: 18 } }).resistance?.dt).toBe(18);
  });
});
