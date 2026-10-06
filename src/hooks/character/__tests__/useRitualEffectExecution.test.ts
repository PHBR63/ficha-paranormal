import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useRitualEffectExecution } from '../useRitualEffectExecution';

describe('confirmação dos efeitos do ritual', () => {
  it('não avança antes da confirmação nem duplica um clique durante o pedido', async () => {
    let confirm!: () => void;
    const apply = vi.fn(() => new Promise<void>(resolve => { confirm = resolve; }));
    const advance = vi.fn();
    const { result } = renderHook(() => useRitualEffectExecution());
    let first!: Promise<void>;
    act(() => { first = result.current.execute(apply, advance); });
    expect(result.current.pending).toBe(true);
    expect(advance).not.toHaveBeenCalled();
    await act(async () => { await result.current.execute(apply, advance); });
    expect(apply).toHaveBeenCalledTimes(1);
    await act(async () => { confirm(); await first; });
    expect(advance).toHaveBeenCalledTimes(1);
    expect(result.current.pending).toBe(false);
  });

  it('mantém a etapa aberta quando o servidor recusa e permite tentar novamente', async () => {
    const advance = vi.fn();
    const { result } = renderHook(() => useRitualEffectExecution());
    await act(async () => { await result.current.execute(() => Promise.reject(new Error('Sem permissão')), advance); });
    expect(result.current.error).toBe('Sem permissão');
    expect(advance).not.toHaveBeenCalled();
    await act(async () => { await result.current.execute(() => Promise.resolve(), advance); });
    expect(result.current.error).toBeNull();
    expect(advance).toHaveBeenCalledTimes(1);
  });

  it('um efeito sem implementação permanece pendente, sem sucesso falso', async () => {
    const advance = vi.fn();
    const { result } = renderHook(() => useRitualEffectExecution());
    await act(async () => { await result.current.execute(undefined, advance); });
    expect(result.current.error).toContain('permanece pendente');
    expect(advance).not.toHaveBeenCalled();
  });
});
