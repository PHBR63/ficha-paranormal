import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { awaitActivityResponse } from '@/services/character-activity-service';
import type { AttackIntent } from '@/services/campaign-attack-intent-service';

export interface CounterattackWeapon { id: string; name: string }
export interface PendingCounterattack {
  defenseEventId: string;
  characterId: string;
  characterName: string;
  targetId: string;
  targetName: string;
  scene: number;
  round: number;
  weapons: CounterattackWeapon[];
}

type RpcDb = { public: { Tables: Record<string, never>; Views: Record<string, never>; Enums: Record<string, never>; CompositeTypes: Record<string, never>; Functions: {
  list_campaign_counterattacks_pending_v2: { Args: { p_campaign_id: string }; Returns: PendingCounterattack[] };
  create_campaign_counterattack_intent_v2: { Args: {
    p_operation_id: string; p_campaign_id: string; p_defense_event_id: string;
    p_weapon_id: string; p_expected_scene: number; p_expected_round: number;
  }; Returns: AttackIntent };
  confirm_character_special_defense_v2: { Args: {
    p_operation_id: string; p_campaign_id: string; p_character_id: string;
    p_attack_event_id: string; p_defense_type: 'contra_ataque';
    p_expected_scene: number; p_expected_round: number;
  }; Returns: { id: string; operation_id: string; character_id: string; payload: unknown } };
} } };
const client = supabase as unknown as SupabaseClient<RpcDb>;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function loadPendingCounterattacks(campaignId: string): Promise<PendingCounterattack[]> {
  if (!UUID.test(campaignId)) throw new Error('Campanha inválida.');
  const { data, error } = await client.rpc('list_campaign_counterattacks_pending_v2', { p_campaign_id: campaignId });
  if (error || !Array.isArray(data)) throw new Error('Não foi possível conferir contra-ataques pendentes.');
  return data.filter(item => UUID.test(item.defenseEventId) && UUID.test(item.characterId)
    && UUID.test(item.targetId) && Array.isArray(item.weapons));
}

export async function createCounterattackIntent(
  campaignId: string,
  pending: PendingCounterattack,
  weaponId: string,
  operationId = crypto.randomUUID(),
): Promise<AttackIntent> {
  if (![campaignId, pending.defenseEventId, operationId].every(id => UUID.test(id))
    || !pending.weapons.some(weapon => weapon.id === weaponId)) throw new Error('Arma do contra-ataque inválida.');
  const response = await awaitActivityResponse(client.rpc('create_campaign_counterattack_intent_v2', {
    p_operation_id: operationId, p_campaign_id: campaignId,
    p_defense_event_id: pending.defenseEventId, p_weapon_id: weaponId,
    p_expected_scene: pending.scene, p_expected_round: pending.round,
  }));
  if (response.error) throw new Error('O servidor não confirmou a preparação do contra-ataque.');
  const intent = response.data;
  if (!intent || intent.operation_id !== operationId || intent.campaign_id !== campaignId
    || intent.attacker_id !== pending.characterId || intent.target_id !== pending.targetId
    || intent.weapon_id !== weaponId || intent.status !== 'pending'
    || intent.reaction_source_id !== pending.defenseEventId) throw new Error('Recibo do contra-ataque incompleto.');
  return intent;
}

/** Registra a reação somente depois de o servidor confirmar o erro corpo a corpo. */
export async function declareCounterattackReaction(request: {
  operationId: string; campaignId: string; characterId: string; attackEventId: string;
  scene: number; round: number;
}): Promise<void> {
  if (![request.operationId, request.campaignId, request.characterId, request.attackEventId].every(id => UUID.test(id))) {
    throw new Error('Reação de contra-ataque inválida.');
  }
  const response = await awaitActivityResponse(client.rpc('confirm_character_special_defense_v2', {
    p_operation_id: request.operationId, p_campaign_id: request.campaignId,
    p_character_id: request.characterId, p_attack_event_id: request.attackEventId,
    p_defense_type: 'contra_ataque', p_expected_scene: request.scene, p_expected_round: request.round,
  }));
  if (response.error) {
    if (response.error.code === '55004') throw new Error('Contra-ataque exige erro corpo a corpo e Luta treinada.');
    throw new Error('O servidor não confirmou a reação de contra-ataque.');
  }
  if (!response.data || response.data.operation_id !== request.operationId
    || response.data.character_id !== request.characterId) throw new Error('Recibo da reação incompleto.');
}
