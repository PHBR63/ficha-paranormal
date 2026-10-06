import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCampaignData } from '../useCampaignData';
const mocks = vi.hoisted(() => ({ from: vi.fn(), removeChannel: vi.fn(), toast: vi.fn(), listeners: [] as Array<{ table: string; callback: (payload: { new: { id: string } }) => void }>, subscribed: undefined as undefined | ((status: string) => void) }));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: mocks.toast }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {
  from: mocks.from, removeChannel: mocks.removeChannel,
  channel: () => {
    const channel = {
      on: (_kind: string, options: { table: string }, callback: (payload: { new: { id: string } }) => void) => { mocks.listeners.push({ table: options.table, callback }); return channel; },
      subscribe: (callback: (status: string) => void) => { mocks.subscribed = callback; return channel; },
    };
    return channel;
  },
} }));
beforeEach(() => {
  vi.clearAllMocks(); mocks.listeners.length = 0; mocks.subscribed = undefined;
  mocks.from.mockImplementation((table: string) => {
    const data = table === 'campaigns_v2' ? [{ id: 'campaign', master_id: 'master', name: 'Campanha' }]
      : table === 'campaign_members_v2' ? [{ id: 'member', user_id: 'player', character_id: 'linked', role: 'player', characters: { id: 'linked', conditions: [] } }]
        : [{ user_id: 'player', display_name: 'Jogador', avatar_url: null }];
    const promise = Promise.resolve({ data, error: null });
    const chain = { select: vi.fn(), eq: vi.fn(), in: vi.fn(), limit: vi.fn(), then: promise.then.bind(promise) };
    chain.select.mockReturnValue(chain); chain.eq.mockReturnValue(chain); chain.in.mockReturnValue(chain); chain.limit.mockReturnValue(chain);
    return chain;
  });
});
describe('campanha acompanha recursos confirmados', () => {
  it('retomar conexão ou aba visível recupera os membros atuais', async () => {
    const { result, unmount } = renderHook(() => useCampaignData({ campaignId: 'campaign', userId: 'master' }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    const before = mocks.from.mock.calls.length;
    await act(async () => { window.dispatchEvent(new Event('online')); });
    expect(mocks.from.mock.calls.length).toBeGreaterThan(before);
    const afterOnline = mocks.from.mock.calls.length;
    await act(async () => { document.dispatchEvent(new Event('visibilitychange')); });
    expect(mocks.from.mock.calls.length).toBeGreaterThan(afterOnline);
    unmount();
    const afterUnmount = mocks.from.mock.calls.length;
    await act(async () => { window.dispatchEvent(new Event('online')); mocks.subscribed?.('SUBSCRIBED'); });
    expect(mocks.from).toHaveBeenCalledTimes(afterUnmount);
  });
  it('mudança em ficha vinculada recarrega membros; ficha alheia não recarrega', async () => {
    const { result } = renderHook(() => useCampaignData({ campaignId: 'campaign', userId: 'master' }));
    await waitFor(() => expect(result.current.members).toHaveLength(1));
    const listener = mocks.listeners.find(item => item.table === 'characters')!;
    const before = mocks.from.mock.calls.length;
    await act(async () => { listener.callback({ new: { id: 'unrelated' } }); });
    expect(mocks.from).toHaveBeenCalledTimes(before);
    await act(async () => { listener.callback({ new: { id: 'linked' } }); });
    expect(mocks.from.mock.calls.length).toBeGreaterThan(before);
  });
  it('assinatura reconectada consulta novamente os dados para recuperar lacunas', async () => {
    const { result } = renderHook(() => useCampaignData({ campaignId: 'campaign', userId: 'master' }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    const before = mocks.from.mock.calls.length;
    await act(async () => { mocks.subscribed?.('SUBSCRIBED'); });
    expect(mocks.from.mock.calls.length).toBeGreaterThan(before);
  });
  it('desmontar remove a assinatura da campanha', async () => {
    const { result, unmount } = renderHook(() => useCampaignData({ campaignId: 'campaign', userId: 'master' }));
    await waitFor(() => expect(result.current.loading).toBe(false)); unmount();
    expect(mocks.removeChannel).toHaveBeenCalledOnce();
  });
});

type DatabaseResult = { data: unknown; error: null | { message: string } };
/** Query controlada para reproduzir respostas fora de ordem sem temporizadores. */
function query(result: Promise<DatabaseResult>) {
  const chain = { select: vi.fn(), eq: vi.fn(), in: vi.fn(), limit: vi.fn(), then: result.then.bind(result) };
  chain.select.mockReturnValue(chain); chain.eq.mockReturnValue(chain);
  chain.in.mockReturnValue(chain); chain.limit.mockReturnValue(chain);
  return chain;
}

describe.each(['v1', 'v2'] as const)('ordenação de consultas da campanha %s', version => {
  it.each(['dados', 'erro'] as const)('ignora %s de uma resposta antiga após atualização confirmada', async staleKind => {
    const normalQuery = mocks.from.getMockImplementation()!;
    mocks.from.mockImplementation((table: string) => {
      if (version === 'v1' && table === 'campaigns_v2') return query(Promise.resolve({ data: [], error: null }));
      if (table === 'campaigns') return normalQuery('campaigns_v2');
      if (table === 'campaign_members') return normalQuery('campaign_members_v2');
      return normalQuery(table);
    });
    const { result } = renderHook(() => useCampaignData({ campaignId: 'campaign', userId: 'master' }));
    await waitFor(() => expect(result.current.members).toHaveLength(1));
    const baselineQuery = mocks.from.getMockImplementation()!;
    let resolveOld!: (result: DatabaseResult) => void;
    const oldResponse = new Promise<DatabaseResult>(resolve => { resolveOld = resolve; });
    const memberTable = version === 'v1' ? 'campaign_members' : 'campaign_members_v2';
    let memberRequests = 0;
    const member = (hp: number) => [{ id: 'member', user_id: 'player', character_id: 'linked', role: 'player', characters: { id: 'linked', hp_current: hp, conditions: [] } }];
    mocks.from.mockImplementation((table: string) => {
      if (table !== memberTable) return baselineQuery(table);
      memberRequests++;
      return query(memberRequests === 1 ? oldResponse : Promise.resolve({ data: member(12), error: null }));
    });
    let oldRequest!: Promise<void>;
    await act(async () => { oldRequest = result.current.refetch(); });
    await waitFor(() => expect(memberRequests).toBe(1));
    await act(async () => { await result.current.refetch(); });
    expect(result.current.members[0].characters?.hp_current).toBe(12);
    await act(async () => {
      resolveOld(staleKind === 'dados' ? { data: member(19), error: null } : { data: null, error: { message: 'Conexão antiga encerrada' } });
      await oldRequest;
    });
    expect(result.current.members[0].characters?.hp_current).toBe(12);
    expect(result.current.error).toBeNull();
    expect(result.current.isRefreshing).toBe(false);
    expect(mocks.toast).not.toHaveBeenCalled();
  });
});
