import { afterEach, describe, expect, it, vi } from 'vitest';
import { rollRitualResistance } from '../ritual-resistance';

afterEach(() => vi.restoreAllMocks());

describe('resistência usa pool do atributo e bônus da perícia', () => {
  it.each([
    { attribute: 0, randoms: [0.95, 0], count: 2, kept: 1, total: 6 },
    { attribute: -1, randoms: [0.95, 0.05, 0.45], count: 3, kept: 2, total: 7 },
    { attribute: 3, randoms: [0, 0.45, 0.95], count: 3, kept: 20, total: 25 },
  ])('atributo $attribute seleciona $kept e soma apenas +5', ({ attribute, randoms, count, kept, total }) => {
    const random = vi.spyOn(Math, 'random');
    randoms.forEach(value => random.mockReturnValueOnce(value));
    const result = rollRitualResistance(attribute, 5, 26);
    expect(result.dice).toHaveLength(count);
    expect(result.kept).toBe(kept);
    expect(result.total).toBe(total);
    expect(result.passed).toBe(false);
  });
  it('20 selecionado não garante sucesso na regra personalizada', () => {
    expect(rollRitualResistance(4, 5, 26, 20).passed).toBe(false);
    expect(rollRitualResistance(4, 5, 25, 20).passed).toBe(true);
  });
  it.each([0, 21, 1.5, NaN])('rejeita dado manual inválido %s', die => {
    expect(() => rollRitualResistance(2, 5, 20, die)).toThrow();
  });
});
