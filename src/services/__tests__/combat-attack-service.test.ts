import { beforeEach, describe, expect, it, vi } from 'vitest';
import { confirmCombatAttack, type CombatAttackConfirmation } from '../combat-attack-service';

const fake = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: fake.rpc } }));
const character = '00000000-0000-4000-8000-000000000001';
const operation = '00000000-0000-4000-8000-000000000002';
const request = (): CombatAttackConfirmation => ({
  operationId: operation, expectedPE: 4, expectedCost: 2,
  selection: { weaponId: 'faca', specialAttackIncrements: 1, sneakAttack: false, lethalShot: false, techniques: [], lethalCount: 0, otherPaidBonuses: [] },
  result: { dice: [12], keptDice: 12, skillBonus: 5, otherBonuses: 0, extraDice: 0, total: 17, isDisadvantage: false, isCritical: false, timestamp: new Date(), type: 'attack', label: 'Ataque: Faca' },
});
const receipt = { id: operation, operation_id: operation, character_id: character, category: 'roll', status: 'confirmed', payload: { kind: 'combat_attack', peCost: 2 } };
beforeEach(() => vi.resetAllMocks());

describe('ataque confirmado pelo servidor', () => {
  it('conserva UUID, custo e dados sorteados na recuperação após falha', async () => {
    const attack = request();
    fake.rpc.mockResolvedValueOnce({ data: null, error: { code: '' } });
    await expect(confirmCombatAttack(character, attack, 'manual:1')).rejects.toThrow('conexão');
    expect(attack.result.activityOperationId).toBeUndefined();
    fake.rpc.mockResolvedValue({ data: receipt, error: null });
    expect(await confirmCombatAttack(character, attack, 'manual:1')).toBe(true);
    expect(attack.result.activityOperationId).toBe(operation);
    await confirmCombatAttack(character, attack, 'manual:1');
    expect(fake.rpc.mock.calls[0]).toEqual(fake.rpc.mock.calls[1]);
    expect(fake.rpc.mock.calls[1]).toEqual(fake.rpc.mock.calls[2]);
    expect(fake.rpc.mock.calls[0][1]).toMatchObject({ p_expected_cost: 2, p_expected_turn_key: 'manual:1', p_payload: { entry: { results: [12], total: 17 } } });
  });
  it('rejeita recibo de outra ficha, estado ou custo sem liberar o resultado', async () => {
    for (const invalid of [null, { ...receipt, character_id: operation }, { ...receipt, status: 'pending' }, { ...receipt, payload: { kind: 'combat_attack', peCost: 1 } }, { ...receipt, payload: { kind: 'ritual', peCost: 2 } }]) {
      const attack = request();
      fake.rpc.mockResolvedValueOnce({ data: invalid, error: null });
      await expect(confirmCombatAttack(character, attack, null)).rejects.toThrow('não confirmou');
      expect(attack.result.activityOperationId).toBeUndefined();
    }
  });
  it('não envia custo inválido e mostra rejeição de orçamento', async () => {
    await expect(confirmCombatAttack(character, { ...request(), expectedCost: -1 }, null)).rejects.toThrow('inválido');
    expect(fake.rpc).not.toHaveBeenCalled();
    fake.rpc.mockResolvedValueOnce({ data: null, error: { code: '55002' } });
    await expect(confirmCombatAttack(character, request(), 'manual:1')).rejects.toMatchObject({ serverRejected: true, message: expect.stringContaining('limite de PE') });
  });
});
