import { beforeEach, describe, expect, it, vi } from 'vitest';
import { confirmMirar, getMirarStatus } from '../mirar-service';

const fake = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: fake.rpc } }));
const character = '00000000-0000-4000-8000-000000000001';
const operation = '00000000-0000-4000-8000-000000000002';
beforeEach(() => vi.resetAllMocks());

describe('Mirar confirmado pelo servidor', () => {
  it('recupera disponibilidade e envia identidade do turno e da arma', async () => {
    fake.rpc.mockResolvedValueOnce({ data: { controlled: true, available: true }, error: null })
      .mockResolvedValueOnce({ data: { operation_id: operation, character_id: character, status: 'confirmed', payload: { kind: 'mirar' } }, error: null });
    expect(await getMirarStatus(character)).toBe(true);
    await confirmMirar(character, operation, 'v2:camp:1:2:actor', 'rifle');
    expect(fake.rpc).toHaveBeenLastCalledWith('confirm_character_mirar', {
      p_operation_id: operation, p_character_id: character, p_expected_turn_key: 'v2:camp:1:2:actor', p_weapon_id: 'rifle',
    });
  });
  it('não considera falha ou recibo incorreto como Mirar confirmado', async () => {
    fake.rpc.mockResolvedValueOnce({ data: null, error: { code: '55004' } });
    await expect(confirmMirar(character, operation, 'v2:camp:1:2:actor', 'rifle')).rejects.toMatchObject({ serverRejected: true });
    fake.rpc.mockResolvedValueOnce({ data: { operation_id: operation, character_id: character, status: 'confirmed', payload: { kind: 'combat_attack' } }, error: null });
    await expect(confirmMirar(character, operation, 'v2:camp:1:2:actor', 'rifle')).rejects.toThrow('Mirar não confirmado');
  });
});
