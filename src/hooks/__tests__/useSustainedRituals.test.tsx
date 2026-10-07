import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useSustainedRituals } from '../useSustainedRituals';
const fake = vi.hoisted(() => ({ list: vi.fn(), change: undefined as undefined | (() => void) }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 'owner' } }) }));
vi.mock('@/services/sustained-ritual-service', () => ({ listSustainedRituals: fake.list }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { channel: () => { const channel = { on: vi.fn((_event, _filter, callback) => { fake.change = callback; return channel; }), subscribe: () => channel }; return channel; }, removeChannel: vi.fn() } }));
const row = { id: 'sustain', character_id: 'first', ritual_id: 'qa', ritual_name: 'QA', element: 'Sangue', circle: 1,
  selected_enhancements: [], sustain_config: {}, turns_active: 0, pe_spent_total: 0, is_concentrating: false, started_at: '2026-10-06T12:00:00Z' };
beforeEach(() => { vi.clearAllMocks(); fake.list.mockResolvedValue([row]); });
describe('leitura confiável das sustentações', () => {
  it('erro de reconexão não apaga os últimos efeitos confirmados', async () => {
    const { result } = renderHook(() => useSustainedRituals({ characterId: 'first' }));
    await waitFor(() => expect(result.current.rituals).toHaveLength(1));
    fake.list.mockRejectedValueOnce(new Error('Sem conexão'));
    await act(async () => { await result.current.reload(); });
    expect(result.current.rituals).toHaveLength(1); expect(result.current.error).toBe('Sem conexão');
  });
  it('reconexão consulta novamente a origem protegida', async () => {
    renderHook(() => useSustainedRituals({ characterId: 'first' }));
    await waitFor(() => expect(fake.list).toHaveBeenCalledOnce());
    await act(async () => { window.dispatchEvent(new Event('online')); });
    expect(fake.list).toHaveBeenCalledTimes(2);
  });
  it('resposta atrasada de outra ficha não contamina a atual', async () => {
    let resolve!: (value: unknown) => void;
    fake.list.mockImplementationOnce(() => new Promise(value => { resolve = value; })).mockResolvedValueOnce([]);
    const { result, rerender } = renderHook(({ id }) => useSustainedRituals({ characterId: id }), { initialProps: { id: 'first' } });
    rerender({ id: 'second' }); await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => { resolve([row]); }); expect(result.current.rituals).toEqual([]);
  });
});
