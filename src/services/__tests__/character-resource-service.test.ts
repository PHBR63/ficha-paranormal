import { beforeEach, describe, expect, it, vi } from 'vitest';
import { confirmConditionReplacement, confirmResourceBundle, prepareConditionChange, prepareResourceChange } from '../character-resource-service';
const mocks = vi.hoisted(() => ({ read: vi.fn(), rpc: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {
  from: () => ({ select: () => ({ eq: () => ({ single: mocks.read }) }) }), rpc: mocks.rpc,
} }));
const id = '98ba0000-0000-4000-8000-000000000001';
beforeEach(() => {
  vi.clearAllMocks();
  mocks.read.mockResolvedValue({ data: { hp_current: 8, hp_max: 10, conditions: [{ id: 'custom', name: 'Caseira', params: { n: 7 } }, 'Machucado'] }, error: null });
  mocks.rpc.mockImplementation(async (_name, args) => ({ data: { character_id: args.p_character_id, operation_id: args.p_operation_id }, error: null }));
});
describe('operações confirmadas de recursos', () => {
  it('repetir usa UUID e expectativas originais sem reler e sem somar novamente no cliente', async () => {
    const confirm = await prepareResourceChange(id, 'hp', 'delta', -2);
    await confirm(); await confirm();
    expect(mocks.read).toHaveBeenCalledOnce();
    expect(mocks.rpc.mock.calls[0]).toEqual(mocks.rpc.mock.calls[1]);
    expect(mocks.rpc.mock.calls[0]).toEqual(['change_character_resource', expect.objectContaining({ p_resource: 'hp', p_value: -2, p_expected_current: 8, p_expected_max: 10 })]);
  });
  it('remover condição preserva entradas desconhecidas e seus parâmetros', async () => {
    const confirm = await prepareConditionChange(id, 'remove', 'Machucado');
    await confirm();
    expect(mocks.rpc.mock.calls[0][1].p_conditions).toEqual([{ id: 'custom', name: 'Caseira', params: { n: 7 } }]);
  });
  it('rejeita quantidade fracionária antes de acessar o banco', async () => {
    await expect(prepareResourceChange(id, 'hp', 'delta', 1.5)).rejects.toThrow('Quantidade inválida');
    expect(mocks.read).not.toHaveBeenCalled();
  });
  it('ausência de confirmação do servidor não vira sucesso', async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: null });
    const confirm = await prepareResourceChange(id, 'hp', 'set', 9);
    await expect(confirm()).rejects.toThrow('não confirmou');
  });
  it('não substitui silenciosamente condições armazenadas em formato inesperado', async () => {
    mocks.read.mockResolvedValue({ data: { conditions: { custom: true } }, error: null });
    await expect(prepareConditionChange(id, 'clear')).rejects.toThrow('revisão manual');
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it('edição explícita envia o estado original e os metadados sem descartá-los', async () => {
    const operationId = '98ba0000-0000-4000-8000-000000000020';
    const conditions = [{ id: 'custom', name: 'Caseira', params: { n: 7 }, turnsRemaining: 2 }];
    await confirmConditionReplacement(id, conditions, ['Machucado'], operationId);
    expect(mocks.rpc).toHaveBeenCalledWith('replace_character_conditions', {
      p_operation_id: operationId, p_character_id: id, p_conditions: conditions, p_expected: ['Machucado'],
    });
  });
  it('conflito de edição explícita retorna erro identificável, sem confirmação falsa', async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: { code: '40001' } });
    await expect(confirmConditionReplacement(id, [], [], '98ba0000-0000-4000-8000-000000000020'))
      .rejects.toMatchObject({ code: '40001' });
  });
  it('resultado de outra ficha não confirma a edição atual', async () => {
    mocks.rpc.mockImplementation(async (_name, args) => ({ data: { character_id: 'other', operation_id: args.p_operation_id }, error: null }));
    await expect(confirmConditionReplacement(id, [], [], '98ba0000-0000-4000-8000-000000000020')).rejects.toThrow('ficha correta');
  });
  it('confirma pacote único de recursos/condições com snapshot e UUID originais', async () => {
    const input = { characterId: id, operationId: '98ba0000-0000-4000-8000-000000000021', values: { hp: 7, pe: 2, san: 14 },
      expected: { hp_current: 8, hp_max: 10, pe_current: 4, pe_max: 4, san_current: 15, san_max: 15, conditions: ['Machucado'] }, conditions: ['Machucado'] };
    await confirmResourceBundle(input); await confirmResourceBundle(input);
    expect(mocks.rpc.mock.calls[0]).toEqual(mocks.rpc.mock.calls[1]);
    expect(mocks.rpc.mock.calls[0]).toEqual(['change_character_resources', {
      p_operation_id: input.operationId, p_character_id: id, p_values: input.values, p_expected: input.expected, p_conditions: input.conditions,
    }]);
  });
  it('pacote concorrente não confirma sucesso e mantém código para recuperação', async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: { code: '40001' } });
    await expect(confirmResourceBundle({ characterId: id, operationId: '98ba0000-0000-4000-8000-000000000021', values: { hp: 7, pe: 2, san: 14 }, expected: {}, conditions: [] }))
      .rejects.toMatchObject({ code: '40001' });
  });
});
