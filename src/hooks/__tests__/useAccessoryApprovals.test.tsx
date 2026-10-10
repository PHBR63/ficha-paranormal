import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAccessoryApprovals } from '../useAccessoryApprovals';
const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc } }));
afterEach(() => { cleanup(); vi.resetAllMocks(); });
const item = { id: 'tool', name: 'Lupa', signature: 'signature', approved: false, inUse: false, bonuses: { percepcao: 2 } };
const inventory = [{ id: 'tool', catalogType: 'acessorio' }];
function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return renderHook(() => useAccessoryApprovals('character', inventory), {
    wrapper: ({ children }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>,
  });
}
describe('Acessórios confirmados pelo servidor', () => {
  it('mantém pendente sem conceder o bônus previsto', async () => {
    rpc.mockResolvedValue({ data: { canReview: false, items: [item], bonuses: {} }, error: null });
    const { result } = setup();
    await waitFor(() => expect(result.current.items).toHaveLength(1));
    expect(result.current.bonuses).toEqual({});
    expect(result.current.canReview).toBe(false);
  });
  it('uma consulta rejeitada não libera bônus', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'Ficha não autorizada' } });
    const { result } = setup();
    await waitFor(() => expect(result.current.error).toBe('Ficha não autorizada'));
    expect(result.current.bonuses).toEqual({});
  });
  it('repete a mesma operação depois de falha e não mostra sucesso antecipado', async () => {
    rpc.mockImplementation((name: string) => Promise.resolve(name === 'get_character_accessories'
      ? { data: { canReview: true, items: [item], bonuses: {} }, error: null }
      : { data: null, error: { message: 'Sem confirmação' } }));
    const { result } = setup();
    await waitFor(() => expect(result.current.items).toHaveLength(1));
    await act(() => result.current.confirm(item, 'review', true, 'Perícia adequada à lupa.'));
    expect(result.current.error).toBe('Sem confirmação');
    expect(result.current.items[0].approved).toBe(false);
    await act(() => result.current.confirm(item, 'review', true, 'Perícia adequada à lupa.'));
    const calls = rpc.mock.calls.filter(([name]) => name === 'confirm_character_accessory');
    expect(calls[0][1].p_operation_id).toBe(calls[1][1].p_operation_id);
  });
});
