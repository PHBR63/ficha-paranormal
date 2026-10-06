import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useWeaponBuffs, type WeaponBuff } from '../useWeaponBuffs';

const buff: WeaponBuff = { id: 'buff', ritualId: 'ritual', ritualName: 'Bônus legado',
  element: 'Sangue', appliedAt: '2020-01-01T00:00:00Z', duration: 'cena', enhancements: [], attackBonus: 2 };

describe('atualização de bônus recebidos do servidor', () => {
  it('preserva registros antigos e não grava ao montar ou receber uma nova referência', () => {
    const persist = vi.fn();
    const { result, rerender } = renderHook(({ buffs }) => useWeaponBuffs('ficha', buffs, persist), { initialProps: { buffs: [buff] } });
    expect(result.current.activeBuffs).toEqual([buff]);
    rerender({ buffs: [{ ...buff, attackBonus: 3 }] });
    expect(result.current.totalAttackBonus).toBe(3);
    expect(persist).not.toHaveBeenCalled();
  });
  it('continua gravando uma remoção escolhida pelo usuário', () => {
    const persist = vi.fn();
    const initialBuffs = [buff];
    const { result } = renderHook(() => useWeaponBuffs('ficha', initialBuffs, persist));
    act(() => result.current.removeBuff('buff'));
    expect(persist).toHaveBeenCalledWith([]);
  });
});
