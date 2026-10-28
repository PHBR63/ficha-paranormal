import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  calculateAttackResolutionPreview,
  confirmAttackTarget,
  type AttackTargetRequest,
  type AttackTargetReceipt,
} from '../campaign-attack-target-service';

const fake = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: fake.rpc, from: vi.fn() } }));

const operationId = '00000000-0000-4000-8000-000000000001';
const campaignId = '00000000-0000-4000-8000-000000000002';
const attackEventId = '00000000-0000-4000-8000-000000000003';
const targetCharacterId = '00000000-0000-4000-8000-000000000004';
const targetEventId = '00000000-0000-4000-8000-000000000005';
const attackerEventId = '00000000-0000-4000-8000-000000000006';
const request: AttackTargetRequest = {
  operationId, campaignId, attackEventId, targetCharacterId,
  expectedHp: 20, expectedScene: 1, expectedRound: 2,
  resolution: {
    defenseTotal: 15, grossDamage: 12, damageType: 'corte',
    resistedDamage: 3, damageReduction: 2, immuneDamage: false, vulnerableDamage: false,
    reviewNote: 'Resistência e RD conferidas pela mesa.',
  },
};
const receipt: AttackTargetReceipt = {
  operationId, campaignId, attackEventId, targetId: targetCharacterId,
  attackTotal: 18, defenseTotal: 15, concealmentFailed: false, hit: true,
  grossDamage: 12, damageType: 'corte', declaredResistedDamage: 3,
  declaredDamageReduction: 2, immuneDamage: false, vulnerableDamage: false,
  damageAfterVulnerability: 9, finalDamage: 7,
  temporaryHPUsed: 2, hpBefore: 20, hpAfter: 15,
  targetEventId, attackerEventId, timingVerifiedByServer: true,
};

beforeEach(() => { vi.clearAllMocks(); fake.rpc.mockResolvedValue({ data: receipt, error: null }); });

describe('resolução confirmada de ataque contra alvo', () => {
  it('confirma dano não letal no reservatório separado sem reduzir PV', async () => {
    const nonlethalReceipt = {
      ...receipt,
      damageMode: 'nonlethal' as const,
      finalDamage: 7,
      temporaryHPUsed: 2,
      hpAfter: 20,
      nonlethalBefore: 1,
      nonlethalApplied: 5,
      nonlethalAfter: 6,
      massiveDamageRequired: false,
    };
    fake.rpc.mockResolvedValue({ data: nonlethalReceipt, error: null });

    await expect(confirmAttackTarget(request)).resolves.toEqual(nonlethalReceipt);
    expect(fake.rpc).toHaveBeenCalledWith('confirm_campaign_attack_target_v4', expect.any(Object));
  });

  it('aceita somente o recibo que repete a declaração e o cálculo do mestre', async () => {
    await expect(confirmAttackTarget(request)).resolves.toEqual(receipt);
    expect(fake.rpc).toHaveBeenCalledExactlyOnceWith('confirm_campaign_attack_target_v4', {
      p_operation_id: operationId, p_campaign_id: campaignId,
      p_attack_event_id: attackEventId, p_target_character_id: targetCharacterId,
      p_expected_hp: 20, p_expected_scene: 1, p_expected_round: 2,
      p_resolution: request.resolution,
    });
  });

  it.each([
    ['tipo de dano', { damageType: 'fogo' }],
    ['resistência', { declaredResistedDamage: 4 }],
    ['RD', { declaredDamageReduction: 3 }],
    ['imunidade', { immuneDamage: true }],
    ['vulnerabilidade', { vulnerableDamage: true }],
    ['dano após vulnerabilidade', { damageAfterVulnerability: 18 }],
    ['dano final', { finalDamage: 8, hpAfter: 14 }],
  ])('não confirma recibo divergente em %s', async (_label, change) => {
    fake.rpc.mockResolvedValue({ data: { ...receipt, ...change }, error: null });
    await expect(confirmAttackTarget(request)).rejects.toMatchObject({ confirmedRejected: false });
  });

  it('aceita total de ataque negativo em um erro confirmado', async () => {
    const missedRequest = { ...request, resolution: { ...request.resolution, defenseTotal: 10 } };
    const missedReceipt = {
      ...receipt, attackTotal: -2, defenseTotal: 10, hit: false,
      finalDamage: 0, temporaryHPUsed: 0, hpAfter: 20,
    };
    fake.rpc.mockResolvedValue({ data: missedReceipt, error: null });
    await expect(confirmAttackTarget(missedRequest)).resolves.toEqual(missedReceipt);
  });

  it('calcula erro, imunidade e ordem resistência antes de RD para a prévia', () => {
    expect(calculateAttackResolutionPreview(14, false, request.resolution)).toEqual({ hit: false, finalDamage: 0 });
    expect(calculateAttackResolutionPreview(18, false, request.resolution)).toEqual({ hit: true, finalDamage: 7 });
    expect(calculateAttackResolutionPreview(18, false, { ...request.resolution, immuneDamage: true }))
      .toEqual({ hit: true, finalDamage: 0 });
    expect(calculateAttackResolutionPreview(18, true, request.resolution)).toEqual({ hit: false, finalDamage: 0 });
    expect(calculateAttackResolutionPreview(18, false, { ...request.resolution, vulnerableDamage: true }))
      .toEqual({ hit: true, finalDamage: 16 });
  });
});
