import { beforeEach, describe, expect, it, vi } from 'vitest';
import { confirmSustainedAction, listSustainedRituals, type SustainedActionRequest } from '../sustained-ritual-service';
const fake = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: fake.rpc } }));
const character = '00000000-0000-4000-8000-000000000001';
const operation = '00000000-0000-4000-8000-000000000002';
const request: SustainedActionRequest = { characterId: character, operationId: operation, action: 'maintain', expectedPE: 10,
  expected: [{ id: '00000000-0000-4000-8000-000000000003', ritual_id: 'qa', turns_active: 0, pe_spent_total: 0, sustain_config: {}, is_concentrating: false }] };
const receipt = { id: operation, operation_id: operation, character_id: character, category: 'application', status: 'confirmed', payload: { kind: 'sustain_maintenance' } };
beforeEach(() => { vi.clearAllMocks(); fake.rpc.mockResolvedValue({ data: receipt, error: null }); });
describe('contrato servidor de sustentação', () => {
  it('encaminha motivo e exige sua confirmação no recibo', async () => {
    const endReason = { kind: 'nao_mantido' as const, note: 'Turno confirmado', rangeConfirmed: false };
    const ending = { ...request, action: 'end' as const, expectedPE: null, endReason };
    fake.rpc.mockResolvedValueOnce({ data: { ...receipt, payload: { kind: 'sustain_end', endReason, reasonSource: 'user_confirmed' } }, error: null });
    await confirmSustainedAction(ending);
    expect(fake.rpc).toHaveBeenCalledWith('confirm_sustained_ritual_end', {
      p_operation_id: operation, p_character_id: character, p_action: 'end', p_expected: request.expected, p_reason: endReason,
    });
    fake.rpc.mockResolvedValueOnce({ data: { ...receipt, payload: { kind: 'sustain_end', endReason: { kind: 'dissipado' }, reasonSource: 'user_confirmed' } }, error: null });
    await expect(confirmSustainedAction(ending)).rejects.toThrow('motivo informado');
  });
  it('não encerra sem motivo válido', async () => {
    await expect(confirmSustainedAction({ ...request, action: 'end', expectedPE: null })).rejects.toThrow('Selecione');
    expect(fake.rpc).not.toHaveBeenCalled();
  });
  it('envia identidade e snapshot sem receber custo editável do cliente', async () => {
    await confirmSustainedAction(request);
    expect(fake.rpc).toHaveBeenCalledWith('confirm_sustained_ritual_action', {
      p_operation_id: operation, p_character_id: character, p_action: 'maintain', p_expected: request.expected, p_expected_pe: 10,
    });
  });
  it('não envia cobrança impossível', async () => {
    await expect(confirmSustainedAction({ ...request, expectedPE: 0 })).rejects.toThrow('PE insuficiente');
    expect(fake.rpc).not.toHaveBeenCalled();
  });
  it('rejeita recibo de outra ficha e estado pendente', async () => {
    fake.rpc.mockResolvedValueOnce({ data: { ...receipt, character_id: operation }, error: null });
    await expect(confirmSustainedAction(request)).rejects.toThrow('ficha correta');
    fake.rpc.mockResolvedValueOnce({ data: { ...receipt, status: 'pending' }, error: null });
    await expect(confirmSustainedAction(request)).rejects.toThrow('ainda não confirmou');
  });
  it('distingue rollback SQL explícito de resposta incerta', async () => {
    fake.rpc.mockResolvedValueOnce({ data: null, error: { code: '40001' } });
    await expect(confirmSustainedAction(request)).rejects.toMatchObject({ serverRejected: true });
    fake.rpc.mockResolvedValueOnce({ data: null, error: { code: '' } });
    await expect(confirmSustainedAction(request)).rejects.toMatchObject({ serverRejected: false });
  });
  it('leitura vazia confirmada é diferente de falha', async () => {
    fake.rpc.mockResolvedValueOnce({ data: [], error: null }); expect(await listSustainedRituals(character)).toEqual([]);
    fake.rpc.mockResolvedValueOnce({ data: null, error: { code: '' } });
    await expect(listSustainedRituals(character)).rejects.toThrow('carregar');
  });
});
