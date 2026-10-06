import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useResistanceRollWithSUE } from '../sue/useResistanceRollWithSUE';
import { useInitiativeRollWithSUE } from '../sue/useInitiativeRollWithSUE';

const config = {
  characterClass: 'Combatente',
  nex: 5,
  attributes: { strength: 2, agility: 2, vigor: 2, intellect: 2, presence: 2 },
  skills: { fortitude: 5, iniciativa: 5 },
};

afterEach(() => vi.restoreAllMocks());

describe('Prévia e rolagem usam os mesmos bônus', () => {
  it('Fortitude treinada mostra +5 e aplica +5, sem somar Vigor', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const { result } = renderHook(() => useResistanceRollWithSUE(config));
    expect(result.current.getResistanceBonusBreakdown('fortitude').total).toBe(5);
    const roll = result.current.executeResistanceRoll('fortitude', 15);
    expect(roll.skillBonus).toBe(5);
    expect(roll.total).toBe(16);
  });

  it('Fortitude destreinada mostra zero bônus e atributo zero usa dois dados', () => {
    const { result } = renderHook(() => useResistanceRollWithSUE({
      ...config,
      skills: {},
      attributes: { ...config.attributes, vigor: 0 },
    }));
    const preview = result.current.getResistanceBonusBreakdown('fortitude');
    expect(preview.total).toBe(0);
    expect(preview.dicePool).toEqual({ count: 2, keep: 'lowest' });
  });

  it('Iniciativa treinada com Operações Especiais mostra e aplica +10', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const { result } = renderHook(() => useInitiativeRollWithSUE({
      ...config,
      nex: 50,
      classTrack: 'Operações Especiais',
    }));
    expect(result.current.getInitiativeBonusBreakdown().total).toBe(10);
    expect(result.current.executeInitiativeRoll().total).toBe(21);
  });
});
