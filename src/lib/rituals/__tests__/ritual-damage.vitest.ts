/** Livro Base v1.3 p.129/PDF139: Deflagração rola três d10 e multiplica a soma. */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getRitualById } from '../ritual-registry';
import { getActiveRitualEffect, formatDamageFormula } from '../legacy-exports';
import { applyRitual } from '../ritual-effects-engine';
import { rollRitualDamage } from '../ritual-damage';

afterEach(() => vi.restoreAllMocks());

describe('Deflagração de Energia — fórmula da fonte', () => {
  it.each([
    { label: 'básica', enhancements: [] },
    { label: 'Verdadeiro', enhancements: ['Verdadeiro'] },
  ])('preserva 3d10×10 na forma $label', ({ enhancements }) => {
    const effect = getActiveRitualEffect('deflagracao-de-energia', enhancements)!;
    expect(effect.damage).toMatchObject({ diceCount: 3, diceType: 10, diceMultiplier: 10 });
    expect(formatDamageFormula(effect.damage!)).toBe('3d10×10');
  });

  it('rola três dados distintos, em vez de trinta dados independentes', () => {
    const random = vi.spyOn(Math, 'random').mockReturnValue(0);
    random.mockReturnValueOnce(0).mockReturnValueOnce(0.4).mockReturnValueOnce(0.9);
    const result = applyRitual('deflagracao-de-energia', [], { rollDice: true });
    expect(result.effects.damage?.rolled).toBe(160); // (1+5+10)×10
    expect(random).toHaveBeenCalledTimes(3);
    expect(getRitualById('deflagracao-de-energia')?.cost).toBe(10);
  });
});

describe('Rolagem compartilhada de dano', () => {
  it('multiplica só dados e soma bônus depois', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.4);
    expect(rollRitualDamage({ diceCount: 3, diceType: 10, diceMultiplier: 10, bonus: 2 }, 4))
      .toMatchObject({ dice: [5, 5, 5], diceMultiplier: 10, bonus: 6, total: 156 });
  });

  it('preserva a fórmula comum sem multiplicador', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.4);
    expect(rollRitualDamage({ diceCount: 2, diceType: 6, bonus: 3 }, 2).total).toBe(11);
  });

  it.each([0, -1, NaN, Infinity])('recusa multiplicador inválido %s', diceMultiplier => {
    expect(() => rollRitualDamage({ diceCount: 3, diceType: 10, diceMultiplier }))
      .toThrow('Fórmula de dano de ritual inválida');
  });
});
