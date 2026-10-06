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
