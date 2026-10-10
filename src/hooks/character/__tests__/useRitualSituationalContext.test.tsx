import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { useRitualSituationalContext } from '../useRitualSituationalContext';
const fake = vi.hoisted(() => ({ get: vi.fn(), confirm: vi.fn() }));
vi.mock('@/services/ritual-situational-service', () => ({ getRitualSituationalContext: fake.get, confirmRitualKnowledge: fake.confirm }));
function wrapper({ children }: { children: ReactNode }) { return <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{children}</QueryClientProvider>; }
const value = { source: 'memorized' as const, knownBeforeBlade: true, note: 'Ficha anterior conferida.' };
beforeEach(() => { vi.clearAllMocks(); fake.get.mockResolvedValue({ ritualId: 'arma-atroz' }); fake.confirm.mockResolvedValue({}); });
describe('Conferência histórica recuperável e isolada', () => {
  it('mantém operação e dados após resposta perdida sem duplicar aprovação', async () => {
    fake.confirm.mockRejectedValueOnce(new Error('Resposta perdida'));
    const { result } = renderHook(() => useRitualSituationalContext('sheet-a', 'arma-atroz', true), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => expect(await result.current.review(value)).toBe(false));
    const original = fake.confirm.mock.calls[0];
    await act(async () => expect(await result.current.review({ ...value, note: 'Texto diferente na repetição.' })).toBe(true));
    expect(fake.confirm.mock.calls[1]).toEqual(original);
  });
  it('diferencia aprovação gravada de falha de leitura posterior', async () => {
    const { result } = renderHook(() => useRitualSituationalContext('sheet-a', 'arma-atroz', true), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    fake.get.mockRejectedValue(new Error('Falha de leitura'));
    await act(async () => expect(await result.current.review(value)).toBe(false));
    expect(result.current.reviewError).toContain('Conferência registrada');
    expect(fake.confirm).toHaveBeenCalledTimes(1);
  });
  it('não mostra aprovação ou erro tardio na ficha seguinte', async () => {
    let reject!: (error: Error) => void;
    fake.confirm.mockImplementationOnce(() => new Promise((_resolve, failure) => { reject = failure; }));
    const { result, rerender } = renderHook(({ id }) => useRitualSituationalContext(id, 'arma-atroz', true), { initialProps: { id: 'sheet-a' }, wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    let pending!: Promise<boolean>; act(() => { pending = result.current.review(value); });
    rerender({ id: 'sheet-b' });
    await act(async () => { reject(new Error('Falha da ficha anterior')); await pending; });
    expect(result.current.reviewError).toBeUndefined();
  });
});
