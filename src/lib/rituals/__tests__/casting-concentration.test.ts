import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_CASTING_CONCENTRATION, getCastingWillConfig, rollCastingConcentration, validateCastingConcentration } from '../casting-concentration';
import type { BonusSummary } from '@/hooks/useCharacterBonusSummary';
afterEach(() => vi.restoreAllMocks());
describe('Vontade na execução de rituais', () => {
  it('não sorteia em situação normal sem dano', () => {
    const random = vi.spyOn(Math, 'random');
    expect(rollCastingConcentration({ ...DEFAULT_CASTING_CONCENTRATION, requirementsConfirmed: true }, { attribute: 3, dicePenalty: 0, bonuses: [] }).tests).toEqual([]);
    expect(random).not.toHaveBeenCalled();
  });
  it('separa teste situacional e dano e mantém dados e bônus', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.95);
    const result = rollCastingConcentration({ situation: 'terrivel', damage: 30 }, { attribute: 3, dicePenalty: 1, bonuses: [{ name: 'Treinamento', value: 5 }] });
    expect(result.tests).toHaveLength(2);
    expect(result.tests[0]).toMatchObject({ trigger: 'terrivel', dice: [20, 20], kept: 20, bonus: 5, total: 25 });
    expect(result.tests[1]).toMatchObject({ trigger: 'dano', damage: 30 });
  });
  it('usa o pior dado para atributo zero', () => {
    vi.spyOn(Math, 'random').mockReturnValueOnce(0).mockReturnValueOnce(0.95);
    expect(rollCastingConcentration({ situation: 'ruim', damage: 0 }, { attribute: 0, dicePenalty: 0, bonuses: [] }).tests[0].kept).toBe(1);
  });
  it('reutiliza treinamento, SUE e resistência sem somar treinamento duas vezes', () => {
    const summary = { skills: { vontade: { total: 2 } }, resistances: { vontade: { total: 3 } } } as unknown as BonusSummary;
    const config = getCastingWillConfig(3, { vontade: 1 }, summary, ['abalado'], 1);
    expect(config.bonuses.map(source => source.value)).toEqual([5, 2, 3]);
    expect(config.attribute).toBe(4); expect(config.dicePenalty).toBeGreaterThan(0);
  });
  it.each([NaN, -1, 1.5, 1000001])('rejeita dano inválido %s antes do sorteio', damage => {
    expect(validateCastingConcentration({ situation: 'normal', damage })).toContain('inteiro');
  });
});
