import { beforeEach, describe, expect, it, vi } from 'vitest';
import { confirmCampaignBulkDamage } from '../campaign-bulk-damage-service';

const fake = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: fake.rpc } }));

const campaignId = '00000000-0000-4000-8000-000000000001';
const characterId = '00000000-0000-4000-8000-000000000002';
const operationId = '00000000-0000-4000-8000-000000000003';
const eventId = '00000000-0000-4000-8000-000000000004';
const request = {
  operationId, campaignId, source: 'Explosão', targets: [{
    characterId, damage: 12, damageType: 'fogo' as const, resistedDamage: 6,
    damageReduction: 2, immuneDamage: false, vulnerableDamage: false, expectedHp: 20,
  }],
};
const receipt = { operationId, campaignId, source: 'Explosão', targets: [{
  characterId, eventId, grossDamage: 12, declaredResistedDamage: 6,
  declaredDamageReduction: 2, immuneDamage: false, vulnerableDamage: false,
  damageAfterVulnerability: 6, finalDamage: 4, temporaryHPUsed: 0,
  hpBefore: 20, hpAfter: 16,
}] };

beforeEach(() => { vi.clearAllMocks(); fake.rpc.mockResolvedValue({ data: receipt, error: null }); });

describe('dano em área atômico da campanha v2', () => {
  it('envia um único pedido tipado ao servidor e exige recibo por alvo', async () => {
    expect(await confirmCampaignBulkDamage(request)).toEqual(receipt);
    expect(fake.rpc).toHaveBeenCalledExactlyOnceWith('confirm_campaign_bulk_damage_v2', {
      p_operation_id: operationId, p_campaign_id: campaignId, p_source: 'Explosão',
      p_targets: request.targets,
    });
  });

  it('aceita recibo de vulnerabilidade com resistência antes do dobro e RD depois', async () => {
    const vulnerableRequest = { ...request, targets: [{ ...request.targets[0], vulnerableDamage: true }] };
    const vulnerableReceipt = { ...receipt, targets: [{ ...receipt.targets[0], vulnerableDamage: true, damageAfterVulnerability: 12, finalDamage: 10, hpAfter: 10 }] };
    fake.rpc.mockResolvedValue({ data: vulnerableReceipt, error: null });
    await expect(confirmCampaignBulkDamage(vulnerableRequest)).resolves.toEqual(vulnerableReceipt);
  });

  it('não confirma sucesso com recibo ausente', async () => {
    fake.rpc.mockResolvedValue({ data: null, error: null });
    await expect(confirmCampaignBulkDamage(request)).rejects.toMatchObject({ confirmedRejected: false });
  });

  it('classifica PV alterado como rejeição definitiva para permitir revisão', async () => {
    fake.rpc.mockResolvedValue({ data: null, error: { code: '40001' } });
    await expect(confirmCampaignBulkDamage(request)).rejects.toMatchObject({ confirmedRejected: true });
  });

  it('recusa dano mental neste fluxo de PV antes de enviar', async () => {
    await expect(confirmCampaignBulkDamage({ ...request, targets: [{
      ...request.targets[0], damageType: 'mental' as 'fogo',
    }] })).rejects.toThrow('Confira');
    expect(fake.rpc).not.toHaveBeenCalled();
  });
});
