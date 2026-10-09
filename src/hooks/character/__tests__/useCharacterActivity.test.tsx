import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { useCharacterActivity } from '../useCharacterActivity';
const fake = vi.hoisted(() => ({ record: vi.fn(), list: vi.fn(), sessions: vi.fn(), hide: vi.fn(), toast: vi.fn(), user: { id: 'owner' }, subscriptions: [] as Array<(status: string) => void> }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: fake.user }) }));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: fake.toast }) }));
vi.mock('@/services/character-activity-service', () => ({ recordCharacterRoll: fake.record, listCharacterActivity: fake.list, listCharacterActivitySessions: fake.sessions, hideCharacterActivity: fake.hide }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { channel: () => { const channel = { on: vi.fn(() => channel), subscribe: vi.fn((callback: (status: string) => void) => { fake.subscriptions.push(callback); return channel; }) }; return channel; }, removeChannel: vi.fn() } }));
const characterA = '00000000-0000-4000-8000-000000000001';
const characterB = '00000000-0000-4000-8000-000000000002';
const operationId = '00000000-0000-4000-8000-000000000003';
function wrapper({ children }: { children: ReactNode }) { return <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })}>{children}</QueryClientProvider>; }
beforeEach(() => { vi.restoreAllMocks(); localStorage.clear(); fake.user.id = 'owner'; fake.subscriptions.length = 0; vi.clearAllMocks(); fake.list.mockResolvedValue([]); fake.sessions.mockResolvedValue([]); fake.record.mockRejectedValue(new Error('Sem conexão')); });
describe('isolamento e recuperação de atividade', () => {
  it('guarda a rolagem na ficha original sem aviso tardio na ficha seguinte', async () => {
    let reject!: (error: Error) => void;
    fake.record.mockImplementationOnce(() => new Promise<void>((_resolve, fail) => { reject = fail; }));
    const { result, rerender } = renderHook(({ id }) => useCharacterActivity(id), { initialProps: { id: characterA }, wrapper });
    let operation!: Promise<boolean>;
    act(() => { operation = result.current.addRoll({ total: 12 }, operationId); });
    rerender({ id: characterB });
    await act(async () => { reject(new Error('Sem conexão na ficha anterior')); await operation; });
    expect(result.current.saveError).toBeNull();
    expect(result.current.pendingRolls).toEqual([]);
    expect(fake.toast).not.toHaveBeenCalled();
    expect(JSON.parse(localStorage.getItem(`character-activity-pending:owner:${characterA}`) ?? '[]')).toHaveLength(1);
  });

  it('não mostra erro tardio de ocultação na ficha ou conta seguinte', async () => {
    let reject!: (error: Error) => void;
    fake.hide.mockImplementationOnce(() => new Promise<void>((_resolve, fail) => { reject = fail; }));
    const { result, rerender } = renderHook(({ id }) => useCharacterActivity(id), { initialProps: { id: characterA }, wrapper });
    let operation!: Promise<unknown>;
    act(() => { operation = result.current.hideHistory().catch(error => error); });
    fake.user.id = 'visibility-next-owner';
    rerender({ id: characterB });
    await act(async () => { reject(new Error('Falha da ficha anterior')); await operation; });
    expect(result.current.saveError).toBeNull();
  });

  it('distingue ocultação confirmada de falha ao atualizar o feed', async () => {
    fake.hide.mockResolvedValueOnce(undefined);
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { result } = renderHook(() => useCharacterActivity(characterA), {
      wrapper: ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>,
    });
    vi.spyOn(client, 'invalidateQueries').mockRejectedValue(new Error('Falha de leitura'));
    await act(async () => { await result.current.hideHistory().catch(() => {}); });
    expect(result.current.saveError).toContain('confirmada');
    expect(result.current.saveError).toContain('atualizar');
    expect(fake.hide).toHaveBeenCalledTimes(1);
  });

  it('reconectar atualiza recursos/condições da ficha além do histórico', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    client.setQueryData(['character', characterA], { san_current: 15 });
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    const received: string[] = [];
    const listener = (event: Event) => { received.push((event as CustomEvent<string>).detail); };
    window.addEventListener('character-server-updated', listener);
    const { unmount } = renderHook(() => useCharacterActivity(characterA), {
      wrapper: ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>,
    });
    try {
      const subscribe = fake.subscriptions.at(-1)!;
      await act(async () => { subscribe('SUBSCRIBED'); });
      expect(invalidate).toHaveBeenCalledWith({ queryKey: ['character', characterA] });
      expect(client.getQueryState(['character', characterA])?.isInvalidated).toBe(true);
      expect(received).toEqual([characterA]);
      unmount();
      await act(async () => { subscribe('SUBSCRIBED'); window.dispatchEvent(new Event('online')); });
      expect(received).toEqual([characterA]);
    } finally { window.removeEventListener('character-server-updated', listener); }
  });
  it('retomar conexão ou aba busca apenas a ficha atualmente aberta', async () => {
    const received: string[] = [];
    const listener = (event: Event) => { received.push((event as CustomEvent<string>).detail); };
    window.addEventListener('character-server-updated', listener);
    const { rerender, unmount } = renderHook(({ id }) => useCharacterActivity(id), { initialProps: { id: characterA }, wrapper });
    try {
      await act(async () => { window.dispatchEvent(new Event('online')); });
      expect(received).toEqual([characterA]);
      rerender({ id: characterB });
      await act(async () => { document.dispatchEvent(new Event('visibilitychange')); });
      expect(received).toEqual([characterA, characterB]);
      unmount();
      await act(async () => { document.dispatchEvent(new Event('visibilitychange')); });
      expect(received).toEqual([characterA, characterB]);
    } finally { window.removeEventListener('character-server-updated', listener); }
  });
  it('mantém fila da ficha original e não mistura ao navegar para outra', async () => {
    const { result, rerender } = renderHook(({ id }) => useCharacterActivity(id), { initialProps: { id: characterA }, wrapper });
    await act(async () => { expect(await result.current.addRoll({ total: 17 }, operationId)).toBe(false); });
    expect(result.current.pendingRolls).toHaveLength(1);
    rerender({ id: characterB });
    await waitFor(() => expect(result.current.pendingRolls).toHaveLength(0));
    expect(JSON.parse(localStorage.getItem(`character-activity-pending:owner:${characterA}`) ?? '[]')[0].operationId).toBe(operationId);
    expect(localStorage.getItem(`character-activity-pending:owner:${characterB}`)).toBeNull();
  });
  it('recupera a mesma operação após reconexão sem sortear outro resultado', async () => {
    const { result } = renderHook(() => useCharacterActivity(characterA), { wrapper });
    await act(async () => { await result.current.addRoll({ total: 17, dice: [17, 4] }, operationId); });
    fake.record.mockResolvedValue({ id: operationId });
    await act(async () => { window.dispatchEvent(new Event('online')); });
    await waitFor(() => expect(result.current.pendingRolls).toHaveLength(0));
    expect(fake.record.mock.calls.map(call => call[1])).toEqual([operationId, operationId]);
    expect(fake.record.mock.calls[1][2]).toEqual({ total: 17, dice: [17, 4] });
  });
  it('não atribui histórico global legado a nenhuma ficha', async () => {
    localStorage.setItem('roll_history', JSON.stringify([{ total: 20 }]));
    const { result } = renderHook(() => useCharacterActivity(characterA), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.events).toEqual([]);
    expect(result.current.pendingRolls).toEqual([]);
    expect(fake.record).not.toHaveBeenCalled();
    expect(localStorage.getItem('roll_history')).not.toBeNull();
  });
  it('não recupera a fila de outra conta no mesmo navegador', async () => {
    const { result, rerender } = renderHook(({ id }) => useCharacterActivity(id), { initialProps: { id: characterA }, wrapper });
    await act(async () => { await result.current.addRoll({ total: 17 }, operationId); });
    fake.user.id = 'another-user';
    rerender({ id: characterA });
    await waitFor(() => expect(result.current.pendingRolls).toHaveLength(0));
    expect(fake.record).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem(`character-activity-pending:owner:${characterA}`)).not.toBeNull();
  });
  it('recupera várias rolagens em memória quando o armazenamento está cheio', async () => {
    fake.user.id = 'quota-owner';
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Quota excedida', 'QuotaExceededError'); });
    const first = renderHook(() => useCharacterActivity(characterA), { wrapper });
    const second = renderHook(() => useCharacterActivity(characterA), { wrapper });
    const secondOperation = '00000000-0000-4000-8000-000000000004';
    await act(async () => {
      await first.result.current.addRoll({ total: 17 }, operationId);
      await first.result.current.addRoll({ total: 12 }, secondOperation);
    });
    expect(first.result.current.pendingRolls).toHaveLength(2);
    expect(second.result.current.pendingRolls).toHaveLength(2);
    expect(first.result.current.saveError).toContain('memória');
    fake.record.mockResolvedValue({ id: operationId });
    await act(async () => { await second.result.current.recoverPending(); });
    expect(first.result.current.pendingRolls).toEqual([]);
    expect(second.result.current.pendingRolls).toEqual([]);
    expect(fake.record.mock.calls.map(call => call[1])).toEqual([operationId, secondOperation, operationId, secondOperation]);
  });
  it('não expõe a fila anterior nem no primeiro render da nova ficha', async () => {
    const renders: Array<{ id: string; pending: number }> = [];
    const { result, rerender } = renderHook(({ id }) => {
      const activity = useCharacterActivity(id);
      renders.push({ id, pending: activity.pendingRolls.length });
      return activity;
    }, { initialProps: { id: characterA }, wrapper });
    await act(async () => { await result.current.addRoll({ total: 17 }, operationId); });
    rerender({ id: characterB });
    expect(renders.filter(render => render.id === characterB).every(render => render.pending === 0)).toBe(true);
  });
  it('consulta filtros no servidor e conserva a lista completa de sessões', async () => {
    const session = { id: operationId, campaign_id: characterB, campaign_version: 'v2' as const, session_number: 2, title: 'Teste', campaign_name: 'Campanha QA', session_date: '2026-10-06T12:00:00Z' };
    fake.sessions.mockResolvedValue([session]);
    const { result } = renderHook(() => useCharacterActivity(characterA), { wrapper });
    await waitFor(() => expect(result.current.sessions).toHaveLength(1));
    await act(async () => { result.current.setPeriod('7d'); result.current.setSession(session); });
    await waitFor(() => expect(fake.list.mock.calls.at(-1)?.[1].session).toEqual(session));
    const filter = fake.list.mock.calls.at(-1)?.[1];
    expect(Math.abs(Date.parse(filter.afterCreatedAt) - (Date.now() - 7 * 86400000))).toBeLessThan(10000);
    expect(result.current.sessions).toEqual([session]);
  });
});
