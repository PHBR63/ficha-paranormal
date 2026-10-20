import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useServerResgateDefense } from '../useServerResgateDefense';

const fake = vi.hoisted(() => ({
  rpc: vi.fn(), notifyCombat: (() => {}) as () => void, removeChannel: vi.fn(),
}));
vi.mock('@/services/character-activity-service', () => ({ activityClient: { rpc: fake.rpc } }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {
  channel: () => {
    const channel = {
      on: (_event: string, _filter: unknown, notify: () => void) => {
        fake.notifyCombat = notify;
        return channel;
      },
      subscribe: () => channel,
    };
    return channel;
  },
  removeChannel: fake.removeChannel,
} }));

beforeEach(() => {
  fake.rpc.mockReset();
  fake.removeChannel.mockReset();
});

describe('Defesa de Resgate confirmada pelo servidor', () => {
  it('retira o bônus nas duas fichas quando o combate anuncia o próximo turno médico', async () => {
    fake.rpc.mockResolvedValue({ data: { bonus: 5 }, error: null });
    const doctor = renderHook(() => useServerResgateDefense('doctor'));
    const ally = renderHook(() => useServerResgateDefense('ally'));
    await waitFor(() => expect(doctor.result.current).toBe(5));
    await waitFor(() => expect(ally.result.current).toBe(5));
    fake.rpc.mockResolvedValue({ data: { bonus: 0 }, error: null });
    act(() => { fake.notifyCombat(); });
    await waitFor(() => expect(ally.result.current).toBe(0));
    // O médico também consulta o mesmo fato do servidor ao receber a mudança.
    act(() => { window.dispatchEvent(new Event('character-medico-support-updated')); });
    await waitFor(() => expect(doctor.result.current).toBe(0));
    doctor.unmount();
    ally.unmount();
    expect(fake.removeChannel).toHaveBeenCalledTimes(2);
  });
});
