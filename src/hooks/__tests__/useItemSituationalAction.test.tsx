import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
const rpc = vi.hoisted(() => vi.fn());
vi.mock('@/services/character-activity-service', () => ({ activityClient: { rpc },
  awaitActivityResponse: (value: unknown) => value,
  confirmActivity: (event: unknown) => event,
}));
import { useItemSituationalAction } from '../useItemSituationalAction';

const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>;
describe('confirmação e recuperação de ação de item', () => {
  it('invalida histórico filtrado de origem/alvo pela chave real, sem atingir outra ficha', async () => {
    const client = new QueryClient();
    const source = ['character-activity', 'user', 'ficha', 'roll'];
    const target = ['character-activity', 'user', 'alvo', 'all'];
    const other = ['character-activity', 'user', 'outra', 'all'];
    [source, target, other, ['temporary-resources', 'ficha'], ['temporary-resources', 'alvo']]
      .forEach(key => client.setQueryData(key, ['registro preservado']));
    const provider = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    rpc.mockReset().mockResolvedValue({ data: { id: 'recibo' }, error: null });
    const hook = renderHook(() => useItemSituationalAction('ficha', vi.fn()), { wrapper: provider });
    await act(async () => hook.result.current.confirm({ targetId: 'alvo' }));
    expect(client.getQueryState(source)?.isInvalidated).toBe(true);
    expect(client.getQueryState(target)?.isInvalidated).toBe(true);
    expect(client.getQueryState(other)?.isInvalidated).toBe(false);
    expect(client.getQueryState(['temporary-resources', 'alvo'])?.isInvalidated).toBe(true);
    expect(client.getQueryData(other)).toEqual(['registro preservado']);
  });
  it('recupera resposta incerta com mesmo UUID e payload, mesmo se a interface mudou', async () => {
    rpc.mockReset().mockRejectedValueOnce(new Error('Sem conexão')).mockResolvedValueOnce({ data: { id: 'recibo' }, error: null });
    const refetch = vi.fn(); const hook = renderHook(() => useItemSituationalAction('ficha', refetch), { wrapper });
    await act(async () => hook.result.current.confirm({ action: 'draw' }));
    expect(hook.result.current.uncertain).toBe(true); expect(hook.result.current.receipt).toBeNull();
    await act(async () => hook.result.current.confirm({ action: 'conceal' }));
    expect(rpc.mock.calls[0][1]).toEqual(rpc.mock.calls[1][1]);
    expect(hook.result.current.uncertain).toBe(false); expect(refetch).toHaveBeenCalledTimes(1);
  });
  it('erro determinístico permite nova tentativa sem anunciar sucesso', async () => {
    rpc.mockReset().mockResolvedValue({ data: null, error: { code: '55004', message: 'Mãos ocupadas.' } });
    const hook = renderHook(() => useItemSituationalAction('ficha', vi.fn()), { wrapper });
    await act(async () => hook.result.current.confirm({ action: 'draw' }));
    expect(hook.result.current.error).toBe('Mãos ocupadas.'); expect(hook.result.current.receipt).toBeNull();
    expect(hook.result.current.uncertain).toBe(false);
    await act(async () => hook.result.current.confirm({ action: 'draw' }));
    expect(rpc.mock.calls[0][1].p_operation_id).not.toBe(rpc.mock.calls[1][1].p_operation_id);
  });
  it('bloqueia clique duplo durante envio', async () => {
    let resolve!: (value: unknown) => void;
    rpc.mockReset().mockReturnValue(new Promise(done => { resolve = done; }));
    const hook = renderHook(() => useItemSituationalAction('ficha', vi.fn()), { wrapper });
    let promise!: Promise<void>;
    act(() => { promise = hook.result.current.confirm({ action: 'draw' }); });
    await act(async () => hook.result.current.confirm({ action: 'draw' }));
    expect(rpc).toHaveBeenCalledTimes(1);
    await act(async () => { resolve({ data: { id: 'ok' }, error: null }); await promise; });
    await waitFor(() => expect(hook.result.current.busy).toBe(false));
  });
});
