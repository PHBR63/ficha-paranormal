import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { emptyCampaignCombat } from '@/lib/campaign-combat';
import { useCampaignCombat } from '../campaign/useCampaignCombat';

const fake = vi.hoisted(() => ({ load: vi.fn(), save: vi.fn(), end: vi.fn(), notify: (() => {}) as () => void }));
vi.mock('@/services/campaign-combat-service', () => ({ loadCampaignCombat: fake.load, saveCampaignCombat: fake.save, endCampaignScene: fake.end }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {
  channel: () => { const channel = { on: (_name: string, _options: unknown, notify: () => void) => { fake.notify = notify; return channel; }, subscribe: () => channel }; return channel; },
  removeChannel: vi.fn(),
} }));

beforeEach(() => { fake.load.mockReset(); fake.save.mockReset(); fake.end.mockReset(); fake.load.mockResolvedValue({ revision: 3, sceneNumber: 1, state: { active: true, round: 2, currentTurnIndex: 0, combatants: [{ id: 'npc', name: 'NPC', initiative: 12 }] } }); });

describe('Sincronização e falhas do combate', () => {
  it('encerra combate e cena somente depois da resposta do servidor', async () => {
    let confirm: (value: unknown) => void = () => {};
    fake.end.mockImplementationOnce(() => new Promise(resolve => { confirm = resolve; }));
    const { result } = renderHook(() => useCampaignCombat('campaign', 'master', true));
    await waitFor(() => expect(result.current.loading).toBe(false));
    let pending: Promise<boolean>;
    act(() => { pending = result.current.endScene(true); });
    expect(result.current.state.active).toBe(true);
    expect(result.current.sceneNumber).toBe(1);
    expect(result.current.saving).toBe(true);
    await act(async () => { confirm({ revision: 4, sceneNumber: 2, state: emptyCampaignCombat() }); expect(await pending!).toBe(true); });
    expect(result.current.sceneNumber).toBe(2);
    expect(result.current.state.active).toBe(false);
    expect(fake.end).toHaveBeenCalledWith('campaign', 3, true, expect.any(String));
  });
  it('resposta perdida conserva UUID/revisão e bloqueia outra gravação até confirmar', async () => {
    fake.end.mockRejectedValueOnce(new Error('network'));
    const { result } = renderHook(() => useCampaignCombat('campaign', 'master', true));
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => { expect(await result.current.endScene(true)).toBe(false); });
    const firstRequest = fake.end.mock.calls[0];
    expect(result.current.sceneEndPending).toBe(true);
    await act(async () => { expect(await result.current.update(emptyCampaignCombat)).toBe(false); });
    expect(fake.save).not.toHaveBeenCalled();
    fake.end.mockResolvedValueOnce({ revision: 4, sceneNumber: 2, state: emptyCampaignCombat() });
    await act(async () => { expect(await result.current.endScene(false)).toBe(true); });
    expect(fake.end.mock.calls[1]).toEqual(firstRequest);
    expect(result.current.sceneEndPending).toBe(false);
    expect(result.current.error).toBeNull();
  });
  it('conflito não fecha uma cena nova automaticamente e jogador não encerra', async () => {
    const { result } = renderHook(() => useCampaignCombat('campaign', 'master', true));
    await waitFor(() => expect(result.current.loading).toBe(false));
    fake.end.mockRejectedValueOnce({ code: '40001' });
    fake.load.mockResolvedValueOnce({ revision: 4, sceneNumber: 2, state: emptyCampaignCombat() });
    await act(async () => { expect(await result.current.endScene(true)).toBe(false); });
    expect(result.current.sceneNumber).toBe(2);
    expect(result.current.sceneEndPending).toBe(false);
    expect(result.current.error).toContain('outra aba');
    const player = renderHook(() => useCampaignCombat('campaign', 'player', false));
    await waitFor(() => expect(player.result.current.loading).toBe(false));
    await act(async () => { expect(await player.result.current.endScene(false)).toBe(false); });
    expect(fake.end).toHaveBeenCalledTimes(1);
  });
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
  it('recupera uma leitura que falhou sem liberar escrita com estado desconhecido', async () => {
    fake.load.mockRejectedValueOnce(new Error('offline'));
    const { result } = renderHook(() => useCampaignCombat('campaign', 'master', true));
    await waitFor(() => expect(result.current.error).toContain('carregar'));
    await act(async () => { expect(await result.current.update(emptyCampaignCombat)).toBe(false); });
    expect(fake.save).not.toHaveBeenCalled();
    await act(async () => { await result.current.reload(); });
    expect(result.current.error).toBeNull();
    expect(result.current.state.round).toBe(2);
  });
  it('falha de gravação preserva o estado confirmado e permite tentar após recarregar', async () => {
    const { result } = renderHook(() => useCampaignCombat('campaign', 'master', true));
    await waitFor(() => expect(result.current.loading).toBe(false));
    fake.save.mockRejectedValueOnce(new Error('offline'));
    await act(async () => { expect(await result.current.update(emptyCampaignCombat)).toBe(false); });
    expect(result.current.state.round).toBe(2);
    expect(result.current.error).toContain('Nenhuma alteração foi confirmada');
    await act(async () => { await result.current.reload(); });
    fake.save.mockResolvedValueOnce({ revision: 4, state: emptyCampaignCombat() });
    await act(async () => { expect(await result.current.update(emptyCampaignCombat)).toBe(true); });
    expect(result.current.error).toBeNull();
    expect(result.current.state.active).toBe(false);
  });
  it('retorno da conexão busca o estado atual do servidor', async () => {
    const { result } = renderHook(() => useCampaignCombat('campaign', 'master', true));
    await waitFor(() => expect(result.current.loading).toBe(false));
    fake.load.mockResolvedValueOnce({ revision: 4, state: { ...emptyCampaignCombat(), active: true, round: 3 } });
    await act(async () => { window.dispatchEvent(new Event('online')); });
    await waitFor(() => expect(result.current.state.round).toBe(3));
  });
  it('resposta atrasada não reverte uma revisão mais recente', async () => {
    const { result } = renderHook(() => useCampaignCombat('campaign', 'master', true));
    await waitFor(() => expect(result.current.loading).toBe(false));
    fake.load.mockResolvedValueOnce({ revision: 5, state: { ...emptyCampaignCombat(), active: true, round: 4 } });
    await act(async () => { fake.notify(); });
    await waitFor(() => expect(result.current.state.round).toBe(4));
    fake.load.mockResolvedValueOnce({ revision: 4, state: { ...emptyCampaignCombat(), active: true, round: 3 } });
    await act(async () => { await result.current.reload(); });
    expect(result.current.state.round).toBe(4);
  });
});
