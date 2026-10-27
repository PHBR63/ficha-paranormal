import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createCounterattackIntent, declareCounterattackReaction, loadPendingCounterattacks } from '../campaign-counterattack-service';

const fake = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: fake.rpc } }));
const campaignId = '00000000-0000-4000-8000-000000000001';
const defenseEventId = '00000000-0000-4000-8000-000000000002';
const characterId = '00000000-0000-4000-8000-000000000003';
const targetId = '00000000-0000-4000-8000-000000000004';
const operationId = '00000000-0000-4000-8000-000000000005';
const pending = { defenseEventId, characterId, characterName: 'Defensor', targetId, targetName: 'Atacante',
  scene: 1, round: 2, weapons: [{ id: 'faca-1', name: 'Faca' }] };

beforeEach(() => vi.clearAllMocks());
describe('preparação do contra-ataque', () => {
  it('lista a reação e cria uma intenção vinculada à arma', async () => {
    fake.rpc.mockResolvedValueOnce({ data: [pending], error: null });
    await expect(loadPendingCounterattacks(campaignId)).resolves.toEqual([pending]);
    fake.rpc.mockResolvedValueOnce({ data: {
      operation_id: operationId, campaign_id: campaignId, attacker_id: characterId,
      target_id: targetId, weapon_id: 'faca-1', status: 'pending', reaction_source_id: defenseEventId,
    }, error: null });
    await expect(createCounterattackIntent(campaignId, pending, 'faca-1', operationId))
      .resolves.toMatchObject({ reaction_source_id: defenseEventId });
    expect(fake.rpc).toHaveBeenLastCalledWith('create_campaign_counterattack_intent_v2', {
      p_operation_id: operationId, p_campaign_id: campaignId, p_defense_event_id: defenseEventId,
      p_weapon_id: 'faca-1', p_expected_scene: 1, p_expected_round: 2,
    });
  });

  it('registra a reação após o erro antes de preparar a nova intenção', async () => {
    fake.rpc.mockResolvedValue({ data: { id: operationId, operation_id: operationId, character_id: characterId, payload: {} }, error: null });
    await expect(declareCounterattackReaction({
      operationId, campaignId, characterId, attackEventId: targetId, scene: 1, round: 2,
    })).resolves.toBeUndefined();
    expect(fake.rpc).toHaveBeenCalledWith('confirm_character_special_defense_v2', expect.objectContaining({
      p_defense_type: 'contra_ataque', p_character_id: characterId,
    }));
  });
});
