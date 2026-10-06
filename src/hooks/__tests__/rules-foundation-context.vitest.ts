import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useUnifiedEffects, type CharacterStateForEffects } from '../useUnifiedEffects';
import { useSkillRollWithSUE } from '../sue/useSkillRollWithSUE';

vi.mock('@/lib/effects/origin-effects-adapter', () => ({
  getOriginEffects: () => [{
    id: 'synthetic-hp-effect', name: 'Fixture', source: 'origin', sourceId: 'fixture', sourceName: 'Fixture',
    isActive: true, isToggleable: false, mechanics: { defenseBonus: 5 }, conditions: { hpPercentBelow: 50 },
  }],
}));

afterEach(() => vi.restoreAllMocks());

describe('Dados do contexto chegam ao resultado apresentado', () => {
  it('recalcula o bônus quando apenas os PV mudam', () => {
    const state: CharacterStateForEffects = {
      origin: 'fixture', classId: 'Combatente', classTrack: null, nex: 5,
      attributes: { strength: 2, agility: 2, vigor: 2, intellect: 2, presence: 2 },
      conditions: [], activeRituals: [], currentHP: 10, maxHP: 20,
    };
    const { result, rerender } = renderHook(({ hp }) => useUnifiedEffects({ ...state, currentHP: hp }), { initialProps: { hp: 10 } });
    expect(result.current.computed.defense.general).toBe(0);
    rerender({ hp: 9 });
    expect(result.current.computed.defense.general).toBe(5);
    rerender({ hp: 20 });
    expect(result.current.computed.defense.general).toBe(0);
  });

  it('o formato recebido pela tela identifica o pior dado mesmo com atributo positivo', () => {
    vi.spyOn(Math, 'random').mockReturnValueOnce(0.9).mockReturnValueOnce(0.05).mockReturnValue(0.5);
    const { result } = renderHook(() => useSkillRollWithSUE({
      characterClass: 'Combatente', nex: 5,
      attributes: { strength: 2, agility: 2, vigor: 2, intellect: 2, presence: 2 },
      skills: { atletismo: 5 }, activeConditions: ['debilitado'],
    }));
    const roll = result.current.executeSkillRoll('atletismo');
    expect(roll.dice).toHaveLength(4);
    expect(roll.keptDice).toBe(2);
    expect(roll.isDisadvantage).toBe(true);
    expect(roll.total).toBe(7);
  });
});
