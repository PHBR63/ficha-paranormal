import { act, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { useRitualApplication } from '../useRitualApplication';
const fake = vi.hoisted(() => ({ cast: vi.fn(), apply: vi.fn(), single: vi.fn() }));
vi.mock('@/services/ritual-application-service', () => ({ castCharacterRitual: fake.cast, applyCharacterEffect: fake.apply }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: () => ({ select: () => ({ eq: () => ({ single: fake.single }) }) }) } }));
const id = '00000000-0000-4000-8000-000000000001';
function wrapper({ children }: { children: ReactNode }) { return <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>; }
beforeEach(() => { vi.clearAllMocks(); fake.cast.mockResolvedValue({ id }); fake.apply.mockResolvedValue({ id }); fake.single.mockResolvedValue({ data: { hp_current: 20, hp_max: 30, conditions: [] }, error: null }); });
describe('pedidos de ritual idempotentes', () => {
  it('mantém saldo/custo/payload originais quando a resposta de débito se perde', async () => {
    const { result } = renderHook(() => useRitualApplication(id), { wrapper });
    fake.cast.mockRejectedValueOnce(new Error('Conexão perdida'));
    await act(async () => { await expect(result.current.cast(10, 3, { ritualName: 'Teste' })).rejects.toThrow('perdida'); });
    await act(async () => { await result.current.cast(7, 3, { ritualName: 'Outro' }); });
    expect(fake.cast.mock.calls[1][0]).toEqual(fake.cast.mock.calls[0][0]);
  });
  it('consulta alvo só na primeira tentativa e reutiliza o mesmo snapshot após perda da resposta', async () => {
    const { result } = renderHook(() => useRitualApplication(id), { wrapper });
    await act(async () => { await result.current.cast(10, 3, {}); });
    fake.apply.mockRejectedValueOnce(new Error('Conexão perdida'));
    await act(async () => { await expect(result.current.apply('damage', 5, { hp_current: 21 })).rejects.toThrow('perdida'); });
    await act(async () => { await result.current.apply('damage', 7, { hp_current: 15 }); });
    expect(fake.single).toHaveBeenCalledTimes(1);
    expect(fake.apply.mock.calls[1][0]).toEqual(fake.apply.mock.calls[0][0]);
    expect(fake.apply.mock.calls[0][0].expected).toEqual({ hp_current: 20, hp_max: 30 });
  });
  it('não apresenta confirmação já salva como fracasso quando a atualização da tela falha', async () => {
    const { result } = renderHook(() => useRitualApplication(id, async () => { throw new Error('Tela offline'); }), { wrapper });
    await act(async () => { expect(await result.current.cast(10, 3, {})).toEqual({ id }); });
    expect(result.current.castEventId).toBe(id);
    expect(result.current.error).toContain('confirmada pelo servidor');
  });
  it('preserva o JSON completo dos buffs no snapshot de aplicação e retry', async () => {
    const existingBuffs = [{ id: 'buff-original', turnsRemaining: 3, enhancements: ['Discente'] }];
    fake.single.mockResolvedValue({ data: { hp_current: 20, hp_max: 30, conditions: [], active_buffs: existingBuffs }, error: null });
    const { result } = renderHook(() => useRitualApplication(id), { wrapper });
    await act(async () => { await result.current.cast(10, 1, {}); });
    fake.apply.mockRejectedValueOnce(new Error('Conexão perdida'));
    await act(async () => { await expect(result.current.apply('weapon_buff', { ritualId: 'amaldicoar-arma-sangue' }, {})).rejects.toThrow('perdida'); });
    await act(async () => { await result.current.apply('weapon_buff', { ritualId: 'amaldicoar-arma-sangue' }, {}); });
    expect(fake.apply.mock.calls[0][0].expected).toEqual({ active_buffs: existingBuffs });
    expect(fake.apply.mock.calls[1][0]).toEqual(fake.apply.mock.calls[0][0]);
  });
});
