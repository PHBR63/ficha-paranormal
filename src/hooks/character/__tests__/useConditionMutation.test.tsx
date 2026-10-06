import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useConditionMutation } from '../useConditionMutation';

describe('gravação confirmada de condições', () => {
  it('bloqueia duas gravações concorrentes e só confirma depois da resposta', async () => {
    let finish!: () => void;
    const onChange = vi.fn(() => new Promise<void>(resolve => { finish = resolve; }));
    const { result } = renderHook(() => useConditionMutation(onChange));
    let first!: Promise<boolean>;
    let second!: Promise<boolean>;
    act(() => {
      first = result.current.saveConditions(['vulneravel']);
      second = result.current.saveConditions([]);
    });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(result.current.isSaving).toBe(true);
    expect(await second).toBe(false);
    await act(async () => { finish(); await first; });
    expect(await first).toBe(true);
    expect(result.current.isSaving).toBe(false);
  });
  it('recusa sucesso na falha e mantém erro visível, permitindo nova tentativa', async () => {
    const onChange = vi.fn().mockRejectedValueOnce(new Error('Sem permissão para salvar')).mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useConditionMutation(onChange));
    let saved = true;
    await act(async () => { saved = await result.current.saveConditions(['vulneravel']); });
    expect(saved).toBe(false);
    expect(result.current.saveError).toBe('Sem permissão para salvar');
    await act(async () => { saved = await result.current.saveConditions([]); });
    expect(saved).toBe(true);
    expect(result.current.saveError).toBeNull();
  });
});
