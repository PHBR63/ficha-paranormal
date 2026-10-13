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
  it('recupera d10 do recibo sem incorporá-lo ao pedido e sem mudar seu hash', async () => {
    const attack=request();
    attack.selection={...attack.selection,concealment:'total',concealmentConfirmed:true,totalCover:false,attackerBlind:false,targetDefense:null};
    const concealmentResult={level:'total',attackerBlind:false,heatVisionApplied:false,chance:50,die:2,failed:true,targetDefense:null};
    fake.rpc.mockResolvedValue({data:{...receipt,payload:{...receipt.payload,concealmentResult}},error:null});
    await confirmCombatAttack(character,attack,null);
    expect(attack.result.concealmentResult).toEqual(concealmentResult);
    await confirmCombatAttack(character,attack,null);
    expect(fake.rpc.mock.calls[0]).toEqual(fake.rpc.mock.calls[1]);
    expect(fake.rpc.mock.calls[0][1].p_payload.entry).not.toHaveProperty('concealmentResult');
    expect(fake.rpc.mock.calls[0][1].p_payload.entry).not.toHaveProperty('success');
  });
  it('não libera dano com recibo de camuflagem ausente ou face inválida', async () => {
    const attack=request(); attack.selection.concealment='total';
    fake.rpc.mockResolvedValue({data:receipt,error:null});
    await expect(confirmCombatAttack(character,attack,null)).rejects.toThrow('Camuflagem não confirmada');
    expect(attack.result.activityOperationId).toBeUndefined();
    fake.rpc.mockResolvedValue({data:{...receipt,payload:{...receipt.payload,concealmentResult:{level:'total',attackerBlind:false,heatVisionApplied:false,chance:50,die:11,failed:false,targetDefense:null}}},error:null});
    await expect(confirmCombatAttack(character,attack,null)).rejects.toThrow('divergente');
  });
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
