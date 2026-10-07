import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useRitualConfirmation } from '../useRitualConfirmation';

describe('Confirmação de conjuração', () => {
  it('recupera a tentativa original após resposta perdida, sem executar um pedido alterado', async () => {
    const original = vi.fn().mockRejectedValueOnce(new Error('resposta perdida')).mockResolvedValue({ effectsAllowed: false });
    const changed = vi.fn();
    const originalSuccess = vi.fn();
    const changedSuccess = vi.fn();
    const { result } = renderHook(() => useRitualConfirmation(true));
    await act(() => result.current.confirm(original, originalSuccess));
    expect(result.current.error).toBeTruthy();
    await act(() => result.current.confirm(changed, changedSuccess));
    expect(original).toHaveBeenCalledTimes(2);
    expect(changed).not.toHaveBeenCalled();
    expect(originalSuccess).toHaveBeenCalledWith({ effectsAllowed: false });
    expect(changedSuccess).not.toHaveBeenCalled();
    expect(result.current.error).toBeNull();
  });

  it('impede pedidos duplicados enquanto aguarda o servidor', async () => {
    let finish!: (value: boolean) => void;
    const persist = vi.fn(() => new Promise<boolean>(resolve => { finish = resolve; }));
    const success = vi.fn();
    const { result } = renderHook(() => useRitualConfirmation(true));
    let request!: Promise<void>;
    act(() => { request = result.current.confirm(persist, success); });
    await act(() => result.current.confirm(persist, success));
    expect(persist).toHaveBeenCalledTimes(1);
    await act(async () => { finish(true); await request; });
    expect(success).toHaveBeenCalledTimes(1);
  });
});
