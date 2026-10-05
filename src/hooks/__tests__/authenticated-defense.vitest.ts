import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useDefenseBonuses } from '../useDefenseBonuses';
import { useBonusSummaryFromSUE } from '../useBonusSummaryFromSUE';

describe('Defesa apresentada pela ficha', () => {
  it('Reflexos expert não aumenta a Defesa permanente', () => {
    const { result } = renderHook(() => useDefenseBonuses({ origin: 'lutador', abilities: [], skills: { reflexos: 3 } }));
    expect(result.current.totalBonus).toBe(0);
    expect(result.current.breakdown.some(entry => entry.type === 'skill_training')).toBe(false);
  });
  it('condição chega ao resumo consumido pelo cabeçalho e atualiza ao remover', () => {
    const { result, rerender } = renderHook(({ conditions }) => useBonusSummaryFromSUE({
      origin: 'lutador', abilities: [], classId: 'Combatente', nex: 5, agility: 2, skills: { reflexos: 1 }, activeConditions: conditions,
    }), { initialProps: { conditions: ['vulneravel'] } });
    expect(12 + result.current.defense.total).toBe(10);
    expect(result.current.defense.breakdown.some(entry => entry.bonus === -2)).toBe(true);
    rerender({ conditions: [] });
    expect(12 + result.current.defense.total).toBe(12);
  });
});
