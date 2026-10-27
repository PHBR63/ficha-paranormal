import { beforeEach, describe, expect, it, vi } from 'vitest';
import { confirmMassiveDamage, loadPendingMassiveDamage, type PendingMassiveDamage } from '../campaign-massive-damage-service';

const fake = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: fake.rpc } }));
const campaignId = '00000000-0000-4000-8000-000000000001';
const sourceEventId = '00000000-0000-4000-8000-000000000002';
const characterId = '00000000-0000-4000-8000-000000000003';
const operationId = '00000000-0000-4000-8000-000000000004';
const eventId = '00000000-0000-4000-8000-000000000005';
const pending: PendingMassiveDamage = {
  sourceEventId, characterId, characterName: 'Agente QA', finalDamage: 15,
  dt: 17, hpCurrent: 10, hpMax: 20, createdAt: '2026-10-27T10:00:00Z',
};
const receipt = {
  operationId, sourceEventId, campaignId, characterId, dice: [8, 14], kept: 14,
  vigor: 2, skillBonus: 5, resistanceBonus: 0, total: 19, dt: 17, passed: true,
  hpBefore: 10, hpAfter: 10, conditionsBefore: [], conditionsAfter: [], eventId,
};

beforeEach(() => { vi.clearAllMocks(); });

describe('dano massivo confirmado no servidor', () => {
  it('lista apenas pendências válidas da campanha', async () => {
    fake.rpc.mockResolvedValue({ data: [pending], error: null });
    await expect(loadPendingMassiveDamage(campaignId)).resolves.toEqual([pending]);
    expect(fake.rpc).toHaveBeenCalledWith('list_campaign_massive_damage_pending_v2', { p_campaign_id: campaignId });
  });

  it('valida a rolagem, bônus, DT e PV do recibo', async () => {
    fake.rpc.mockResolvedValue({ data: receipt, error: null });
    await expect(confirmMassiveDamage(campaignId, pending, operationId)).resolves.toEqual(receipt);
    expect(fake.rpc).toHaveBeenCalledWith('confirm_campaign_massive_damage_v2', {
      p_operation_id: operationId, p_campaign_id: campaignId,
      p_source_event_id: sourceEventId, p_expected_hp: 10,
    });
  });

  it('recusa recibo que declara sucesso incompatível com o total', async () => {
    fake.rpc.mockResolvedValue({ data: { ...receipt, total: 16, passed: true }, error: null });
    await expect(confirmMassiveDamage(campaignId, pending, operationId)).rejects.toThrow('Recibo');
  });
});
