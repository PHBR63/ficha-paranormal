import { beforeEach, describe, expect, it, vi } from 'vitest';
import { confirmTemporaryGrant, endTemporaryResource, listTemporaryResources } from '../temporary-resource-service';
const fake = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: fake.rpc } }));
const character = '00000000-0000-4000-8000-000000000001';
const operation = '00000000-0000-4000-8000-000000000002';
const grant = { operationId: operation, resource: 'pe' as const, amount: 2, source: 'Potencial', cumulative: true };
const receipt = { id: operation, operation_id: operation, character_id: character, category: 'application', status: 'confirmed', payload: { kind: 'temporary_resource' } };
beforeEach(() => { vi.resetAllMocks(); fake.rpc.mockResolvedValue({ data: receipt, error: null }); });
describe('recursos temporários confirmados', () => {
  it('não aceita estado pendente nem recibo de outra ficha', async () => {
    fake.rpc.mockResolvedValueOnce({ data: { ...receipt, status: 'pending' }, error: null });
    await expect(confirmTemporaryGrant(character, grant)).rejects.toThrow('não confirmou');
    fake.rpc.mockResolvedValueOnce({ data: { ...receipt, character_id: operation }, error: null });
    await expect(confirmTemporaryGrant(character, grant)).rejects.toThrow('ficha correta');
  });
  it.each([0, -1, 1.5, 1000001])('rejeita quantidade inválida %s antes de enviar', async amount => {
    await expect(confirmTemporaryGrant(character, { ...grant, amount })).rejects.toThrow('válidas');
    expect(fake.rpc).not.toHaveBeenCalled();
  });
  it('não transforma erro ou saldo inválido em lista vazia', async () => {
    fake.rpc.mockResolvedValueOnce({ data: [], error: null });
    expect(await listTemporaryResources(character)).toEqual([]);
    fake.rpc.mockResolvedValueOnce({ data: [{ id: operation, resource: 'hp', remaining: -1, source_name: 'QA' }], error: null });
    await expect(listTemporaryResources(character)).rejects.toThrow('não confirmados');
  });
  it('distingue rejeição SQL de resposta incerta ao encerrar', async () => {
    const source = { id: operation, resource: 'pe' as const, remaining: 2, source_name: 'QA', campaign_id: null };
    fake.rpc.mockResolvedValueOnce({ data: null, error: { code: '40001' } });
    await expect(endTemporaryResource(character, operation, source)).rejects.toMatchObject({ serverRejected: true });
    fake.rpc.mockResolvedValueOnce({ data: null, error: { code: '' } });
    await expect(endTemporaryResource(character, operation, source)).rejects.toMatchObject({ serverRejected: false });
  });
});
