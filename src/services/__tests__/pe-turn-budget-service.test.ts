import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getPETurnBudget, pauseManualTurn, resolveAttackCampaignId, type PETurnBudget } from '../pe-turn-budget-service';
const fake = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: fake.rpc } }));
const character = '00000000-0000-4000-8000-000000000001';
const operation = '00000000-0000-4000-8000-000000000002';
const campaign = '00000000-0000-4000-8000-000000000003';
const turnInstance = '00000000-0000-4000-8000-000000000004';
const budget: PETurnBudget = { mode: 'manual', tracked: true, key: 'manual:1', number: 1, spent: 2, limit: 4, ritualLimit: 4, remaining: 2, ritualRemaining: 2 };
beforeEach(() => vi.resetAllMocks());
describe('orçamento de PE confirmado', () => {
  it('aceita o orçamento tipado e rejeita valores ausentes ou inválidos', async () => {
    fake.rpc.mockResolvedValueOnce({ data: budget, error: null });
    expect(await getPETurnBudget(character)).toEqual(budget);
    for (const data of [null, { ...budget, spent: -1 }, { ...budget, ritualLimit: undefined }, { ...budget, key: null }]) {
      fake.rpc.mockResolvedValueOnce({ data, error: null });
      await expect(getPETurnBudget(character)).rejects.toThrow('não confirmou');
    }
  });
  it('consulta sem controle ativo e conserva erro de permissão', async () => {
    fake.rpc.mockResolvedValueOnce({ data: { ...budget, mode: 'untracked', tracked: false, key: null }, error: null });
    expect((await getPETurnBudget(character)).tracked).toBe(false);
    fake.rpc.mockResolvedValueOnce({ data: null, error: { code: '42501' } });
    await expect(getPETurnBudget(character)).rejects.toThrow('permissão');
  });
  it('usa a campanha canônica do turno quando a ficha participa de várias mesas', async () => {
    const combatBudget = { ...budget, mode: 'combat', campaignId: campaign, scene: 3, round: 2,
      actorId: character, turnInstanceId: turnInstance, key: `v2:${campaign}:3:2:${character}:${turnInstance}` } as const;
    fake.rpc.mockResolvedValueOnce({ data: combatBudget, error: null });
    const confirmed = await getPETurnBudget(character);
    expect(resolveAttackCampaignId(confirmed, operation, 'v2')).toBe(campaign);
    expect(resolveAttackCampaignId(budget, operation, 'v2')).toBe(operation);
    expect(resolveAttackCampaignId(budget, operation, 'v1')).toBeNull();
  });
  it('bloqueia combate sem identidade completa em vez de usar outra campanha', async () => {
    fake.rpc.mockResolvedValueOnce({ data: { ...budget, mode: 'combat', round: 1 }, error: null });
    await expect(getPETurnBudget(character)).rejects.toThrow('não confirmou');
    expect(resolveAttackCampaignId({ ...budget, mode: 'combat', round: 1 }, operation, 'v2')).toBeNull();
  });
  it('confirma pausa pela mesma ficha e pelo turno esperado', async () => {
    const receipt = { id: operation, operation_id: operation, character_id: character, status: 'confirmed', payload: { kind: 'manual_turn_pause', turnNumber: 1 } };
    fake.rpc.mockResolvedValueOnce({ data: receipt, error: null });
    await pauseManualTurn(character, operation, 1);
    expect(fake.rpc).toHaveBeenCalledWith('pause_character_manual_turn', { p_character_id: character, p_operation_id: operation, p_expected_turn: 1 });
    fake.rpc.mockResolvedValueOnce({ data: { ...receipt, payload: { kind: 'manual_turn_pause', turnNumber: 2 } }, error: null });
    await expect(pauseManualTurn(character, operation, 1)).rejects.toThrow('não confirmou');
  });
  it('não envia turno inválido e distingue rejeição de conexão incerta', async () => {
    await expect(pauseManualTurn(character, operation, 0)).rejects.toThrow('inválido');
    expect(fake.rpc).not.toHaveBeenCalled();
    fake.rpc.mockResolvedValueOnce({ data: null, error: { code: '40001' } });
    await expect(pauseManualTurn(character, operation, 1)).rejects.toMatchObject({ serverRejected: true });
    fake.rpc.mockResolvedValueOnce({ data: null, error: { code: '' } });
    await expect(pauseManualTurn(character, operation, 1)).rejects.toMatchObject({ serverRejected: false });
  });
});
