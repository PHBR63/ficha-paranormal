import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { awaitActivityResponse } from '@/services/character-activity-service';

export interface PendingMassiveDamage {
  sourceEventId: string;
  characterId: string;
  characterName: string;
  finalDamage: number;
  dt: number;
  hpCurrent: number;
  hpMax: number;
  createdAt: string;
}

export interface MassiveDamageReceipt {
  operationId: string;
  sourceEventId: string;
  campaignId: string;
  characterId: string;
  dice: number[];
  kept: number;
  vigor: number;
  skillBonus: number;
  resistanceBonus: number;
  total: number;
  dt: number;
  passed: boolean;
  hpBefore: number;
  hpAfter: number;
  conditionsBefore: unknown[];
  conditionsAfter: unknown[];
  eventId: string;
}

type RpcDb = { public: { Tables: Record<string, never>; Views: Record<string, never>; Enums: Record<string, never>; CompositeTypes: Record<string, never>; Functions: {
  list_campaign_massive_damage_pending_v2: { Args: { p_campaign_id: string }; Returns: PendingMassiveDamage[] };
  confirm_campaign_massive_damage_v2: { Args: { p_operation_id: string; p_campaign_id: string; p_source_event_id: string; p_expected_hp: number }; Returns: MassiveDamageReceipt };
} } };
const client = supabase as unknown as SupabaseClient<RpcDb>;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function loadPendingMassiveDamage(campaignId: string): Promise<PendingMassiveDamage[]> {
  if (!UUID.test(campaignId)) throw new Error('Campanha inválida.');
  const { data, error } = await client.rpc('list_campaign_massive_damage_pending_v2', { p_campaign_id: campaignId });
  if (error || !Array.isArray(data)) throw new Error('Não foi possível conferir danos massivos pendentes.');
  return data.filter(item => UUID.test(item.sourceEventId) && UUID.test(item.characterId)
    && Number.isSafeInteger(item.dt) && item.dt >= 15
    && Number.isSafeInteger(item.hpCurrent) && item.hpCurrent > 0);
}

export async function confirmMassiveDamage(
  campaignId: string,
  pending: PendingMassiveDamage,
  operationId = crypto.randomUUID(),
): Promise<MassiveDamageReceipt> {
  if (![campaignId, pending.sourceEventId, pending.characterId, operationId].every(id => UUID.test(id))
    || !Number.isSafeInteger(pending.hpCurrent) || pending.hpCurrent < 1) throw new Error('Dano massivo inválido.');
  const response = await awaitActivityResponse(client.rpc('confirm_campaign_massive_damage_v2', {
    p_operation_id: operationId,
    p_campaign_id: campaignId,
    p_source_event_id: pending.sourceEventId,
    p_expected_hp: pending.hpCurrent,
  }));
  if (response.error) {
    if (response.error.code === '40001') throw new Error('A ficha mudou. Atualize as pendências antes de resolver.');
    if (response.error.code === '23505') throw new Error('Este dano massivo já foi resolvido.');
    throw new Error('O servidor não confirmou o teste de dano massivo.');
  }
  const receipt = response.data;
  if (!receipt || receipt.operationId !== operationId || receipt.campaignId !== campaignId
    || receipt.sourceEventId !== pending.sourceEventId || receipt.characterId !== pending.characterId
    || !UUID.test(receipt.eventId) || receipt.hpBefore !== pending.hpCurrent
    || receipt.hpAfter !== (receipt.passed ? receipt.hpBefore : 0)
    || receipt.total !== receipt.kept + receipt.skillBonus + receipt.resistanceBonus
    || receipt.passed !== (receipt.total >= receipt.dt)
    || !Array.isArray(receipt.dice) || !receipt.dice.includes(receipt.kept)) {
    throw new Error('Recibo de dano massivo incompleto. Atualize antes de tentar novamente.');
  }
  return receipt;
}
