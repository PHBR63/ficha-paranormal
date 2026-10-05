import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { emptyCampaignCombat } from '@/lib/campaign-combat';
import { useCampaignCombat } from '../campaign/useCampaignCombat';

const fake = vi.hoisted(() => ({ load: vi.fn(), save: vi.fn(), notify: (() => {}) as () => void }));
vi.mock('@/services/campaign-combat-service', () => ({ loadCampaignCombat: fake.load, saveCampaignCombat: fake.save }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {
  channel: () => { const channel = { on: (_name: string, _options: unknown, notify: () => void) => { fake.notify = notify; return channel; }, subscribe: () => channel }; return channel; },
  removeChannel: vi.fn(),
} }));

beforeEach(() => { fake.load.mockReset(); fake.save.mockReset(); fake.load.mockResolvedValue({ revision: 3, state: { active: true, round: 2, currentTurnIndex: 0, combatants: [{ id: 'npc', name: 'NPC', initiative: 12 }] } }); });

describe('Sincronização e falhas do combate', () => {
  it('recupera rodada e participante ao montar novamente', async () => {
    const first = renderHook(() => useCampaignCombat('campaign', 'master', true));
    await waitFor(() => expect(first.result.current.state.round).toBe(2));
    first.unmount();
    const second = renderHook(() => useCampaignCombat('campaign', 'master', true));
    await waitFor(() => expect(second.result.current.state.combatants[0]?.initiative).toBe(12));
  });
  it('jogador lê realtime e não chama escrita', async () => {
    const { result } = renderHook(() => useCampaignCombat('campaign', 'player', false));
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => { expect(await result.current.update(emptyCampaignCombat)).toBe(false); });
    expect(fake.save).not.toHaveBeenCalled();
    fake.load.mockResolvedValue({ revision: 4, state: { ...emptyCampaignCombat(), active: true, round: 3 } });
    await act(async () => { fake.notify(); });
    await waitFor(() => expect(result.current.state.round).toBe(3));
  });
  it('envia revisão conhecida e só apresenta estado confirmado pelo servidor', async () => {
    const { result } = renderHook(() => useCampaignCombat('campaign', 'master', true));
    await waitFor(() => expect(result.current.loading).toBe(false));
    fake.save.mockResolvedValue({ revision: 4, state: emptyCampaignCombat() });
    await act(async () => { expect(await result.current.update(emptyCampaignCombat)).toBe(true); });
    expect(fake.save).toHaveBeenCalledWith('campaign', 3, emptyCampaignCombat());
    expect(result.current.state.active).toBe(false);
  });
  it('conflito recupera estado e informa que a outra aba mudou o combate', async () => {
    const { result } = renderHook(() => useCampaignCombat('campaign', 'master', true));
    await waitFor(() => expect(result.current.loading).toBe(false));
    fake.save.mockRejectedValue({ code: '40001' });
    fake.load.mockResolvedValue({ revision: 4, state: { ...emptyCampaignCombat(), active: true, round: 3 } });
    await act(async () => { expect(await result.current.update(emptyCampaignCombat)).toBe(false); });
    expect(result.current.state.round).toBe(3);
    expect(result.current.error).toContain('outra aba');
  });
  it('resposta antiga de outra campanha não substitui o estado atual', async () => {
    let resolveFirst: (value: unknown) => void = () => {};
    fake.load.mockImplementationOnce(() => new Promise(resolve => { resolveFirst = resolve; }));
    const { result, rerender } = renderHook(({ campaign }) => useCampaignCombat(campaign, 'master', true), { initialProps: { campaign: 'a' } });
    rerender({ campaign: 'b' });
    await waitFor(() => expect(result.current.state.round).toBe(2));
    await act(async () => { resolveFirst({ revision: 100, state: { ...emptyCampaignCombat(), round: 99 } }); });
    expect(result.current.state.round).toBe(2);
  });
});
