import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCampaignRitualSync } from '../useCampaignRitualSync';
const fake = vi.hoisted(() => ({ version: 'v2', error: false, sessionId: 'session', calls: [] as Array<{ table: string; field: string; value: unknown }>, list: vi.fn(), handlers: [] as Array<() => void>, writes: vi.fn() }));
vi.mock('@/services/character-activity-service', () => ({ listCampaignRitualActivity: fake.list }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {
  from: (table: string) => {
    const query = {
      select: () => query, order: () => query, limit: () => query,
      eq: (field: string, value: unknown) => { fake.calls.push({ table, field, value }); return query; },
      insert: fake.writes,
      maybeSingle: async () => ({ data: table === `campaign_members${fake.version === 'v2' ? '_v2' : ''}` ? { [fake.version === 'v2' ? 'campaigns_v2' : 'campaigns']: { id: 'campaign', master_id: 'master' } } : table.startsWith('campaign_sessions') ? { id: fake.sessionId } : null, error: fake.error ? { message: 'Erro interno' } : null }),
      then: (resolve: (value: unknown) => unknown) => Promise.resolve({ data: [], error: null }).then(resolve),
    }; return query;
  },
  channel: () => { const channel = { on: (_type: unknown, _filter: unknown, callback: () => void) => { fake.handlers.push(callback); return channel; }, subscribe: () => channel }; return channel; }, removeChannel: vi.fn(),
} }));
beforeEach(() => { vi.clearAllMocks(); fake.version = 'v2'; fake.error = false; fake.sessionId = 'session'; fake.calls = []; fake.handlers = []; fake.list.mockResolvedValue([]); });
describe('campanha de rituais v1/v2', () => {
  it.each(['v1', 'v2'])('resolve o contexto %s e usa seu contrato de sessão sem escrita duplicada', async version => {
    fake.version = version;
    const { result } = renderHook(() => useCampaignRitualSync({ characterId: 'character', userId: 'owner' }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.campaignVersion).toBe(version);
    expect(fake.calls).toContainEqual({ table: version === 'v2' ? 'campaign_sessions_v2' : 'campaign_sessions', field: 'status', value: version === 'v2' ? 'active' : 'in_progress' });
    await act(async () => { await result.current.refresh(); });
    expect(fake.list).toHaveBeenCalledWith('campaign', version);
    expect(fake.writes).not.toHaveBeenCalled();
  });
  it('mostra falha de associação sem inventar campanha', async () => {
    fake.error = true;
    const { result } = renderHook(() => useCampaignRitualSync({ characterId: 'character', userId: 'owner' }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toContain('vínculo'); expect(result.current.isInCampaign).toBe(false);
  });
  it('recarrega canônico após evento em tempo real e deduplica IDs', async () => {
    fake.list.mockResolvedValue([{ id: 'event', operation_id: 'event', character_id: 'character', author_id: 'owner', category: 'ritual', campaign_id: 'campaign', campaign_version: 'v2', payload: { ritualName: 'Teste', peCost: 1, peBefore: 10, peAfter: 9 }, created_at: '2026-10-06T12:00:00Z', status: 'pending' }]);
    const { result } = renderHook(() => useCampaignRitualSync({ characterId: 'character', userId: 'owner' }));
    await waitFor(() => expect(result.current.recentCasts).toHaveLength(1));
    await act(async () => { fake.handlers[0](); });
    await waitFor(() => expect(fake.list).toHaveBeenCalledTimes(2));
    expect(result.current.recentCasts).toHaveLength(1); expect(result.current.recentCasts[0].pe_after).toBe(9);
  });
  it('ignora a consulta antiga que chega depois de trocar a ficha', async () => {
    let finishOld!: (value: unknown[]) => void;
    fake.list.mockImplementationOnce(() => new Promise(resolve => { finishOld = resolve; })).mockResolvedValue([]);
    const { result, rerender } = renderHook(({ id }) => useCampaignRitualSync({ characterId: id, userId: 'owner' }), { initialProps: { id: 'old-character' } });
    await waitFor(() => expect(fake.list).toHaveBeenCalledTimes(1));
    rerender({ id: 'new-character' });
    await waitFor(() => expect(fake.list).toHaveBeenCalledTimes(2));
    await act(async () => { finishOld([{ id: 'old-event', character_id: 'old-character', author_id: 'owner', campaign_id: 'campaign', payload: { ritualName: 'Antigo' }, created_at: '2026-10-06T12:00:00Z' }]); });
    expect(result.current.recentCasts).toEqual([]);
  });
  it('atualiza a sessão usada nas próximas conjurações após alteração em tempo real', async () => {
    const { result } = renderHook(() => useCampaignRitualSync({ characterId: 'character', userId: 'owner' }));
    await waitFor(() => expect(result.current.sessionId).toBe('session'));
    fake.sessionId = 'next-session';
    await act(async () => { fake.handlers.at(-1)?.(); });
    await waitFor(() => expect(result.current.sessionId).toBe('next-session'));
  });
});
