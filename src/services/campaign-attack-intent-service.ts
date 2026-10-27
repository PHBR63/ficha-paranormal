import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { awaitActivityResponse } from '@/services/character-activity-service';
import { loadCampaignCombat } from '@/services/campaign-combat-service';

export type PreRollDefense = 'none' | 'bloqueio' | 'esquiva';
export interface AttackIntent {
  operation_id: string;
  campaign_id: string;
  scene_number: number;
  round_number: number;
  turn_instance_id: string;
  attacker_id: string;
  target_id: string;
  weapon_id: string;
  melee: boolean;
  status: 'pending' | 'rolled' | 'cancelled' | 'expired';
  attack_event_id: string | null;
  reaction_source_id?: string | null;
  created_at: string;
}
export interface AttackDefenseChoice {
  operation_id: string;
  intent_id: string;
  defender_id: string;
  defense_type: PreRollDefense;
  attack_event_id: string | null;
  created_at: string;
}
export interface AttackIntentRequest {
  operationId: string;
  campaignId: string;
  attackerId: string;
  targetId: string;
  weaponId: string;
  scene: number;
  round: number;
  turnInstanceId: string;
}
export interface DefenseChoiceRequest { operationId: string; intentId: string; defenseType: PreRollDefense }
export interface AttackIntentContext {
  active: boolean;
  scene: number;
  round: number;
  turnInstanceId: string | null;
  currentActorId: string | null;
}

type IntentRow = AttackIntent & { author_id: string; request_hash: string };
type ChoiceRow = AttackDefenseChoice & { author_id: string; request_hash: string };
type IntentDatabase = { public: {
  Tables: {
    campaign_attack_intents_v2: { Row: IntentRow; Insert: never; Update: never; Relationships: [] };
    campaign_attack_defense_choices_v2: { Row: ChoiceRow; Insert: never; Update: never; Relationships: [] };
  };
  Views: Record<string, never>; Enums: Record<string, never>; CompositeTypes: Record<string, never>;
  Functions: Record<string, never>;
} };
type IntentRpcDatabase = { public: {
  Tables: Record<string, never>; Views: Record<string, never>; Enums: Record<string, never>; CompositeTypes: Record<string, never>;
  Functions: {
    declare_campaign_attack_intent_v2: { Args: {
      p_operation_id: string; p_campaign_id: string; p_attacker_id: string; p_target_id: string;
      p_weapon_id: string; p_expected_scene: number; p_expected_round: number;
      p_expected_turn_instance_id: string;
    }; Returns: IntentRow };
    confirm_campaign_attack_defense_choice_v2: { Args: {
      p_operation_id: string; p_intent_id: string; p_defense_type: PreRollDefense;
    }; Returns: ChoiceRow };
    cancel_campaign_attack_intent_v2: { Args: { p_intent_id: string }; Returns: IntentRow };
  };
} };
const client = supabase as unknown as SupabaseClient<IntentDatabase>;
const rpcClient = supabase as unknown as SupabaseClient<IntentRpcDatabase>;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const intentKey = (campaignId: string, attackerId: string) => `ordem-roll:attack-intent:${campaignId}:${attackerId}`;
const choiceKey = (intentId: string) => `ordem-roll:attack-defense:${intentId}`;

/** Consulta identidade atual do turno, sem inferir uma nova instância no cliente. */
export async function loadAttackIntentContext(campaignId: string): Promise<AttackIntentContext> {
  const combat = await loadCampaignCombat(campaignId);
  return {
    active: combat.state.active, scene: combat.sceneNumber ?? 1,
    round: combat.state.round, turnInstanceId: combat.turnInstanceId ?? null,
    currentActorId: combat.state.combatants[combat.state.currentTurnIndex]?.id ?? null,
  };
}

/** Lista fichas vinculadas; a RPC repetirá a autorização do atacante e do alvo. */
export async function loadAttackTargets(campaignId: string, attackerId: string): Promise<Array<{ id: string; name: string }>> {
  const { data, error } = await supabase.from('campaign_members_v2')
    .select('character_id,characters(id,name)').eq('campaign_id', campaignId);
  if (error) throw new Error('Não foi possível carregar os alvos da campanha.');
  return (data ?? []).flatMap(member => member.characters && member.characters.id !== attackerId
    ? [{ id: member.characters.id, name: member.characters.name }] : []);
}

export async function loadPendingAttackIntent(campaignId: string, attackerId: string): Promise<AttackIntent | null> {
  const { data, error } = await client.from('campaign_attack_intents_v2').select('*')
    .eq('campaign_id', campaignId).eq('attacker_id', attackerId).eq('status', 'pending')
    .order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (error) throw new Error('Não foi possível consultar a intenção de ataque.');
  return data;
}

export async function loadAttackDefenseChoice(intentId: string): Promise<AttackDefenseChoice | null> {
  const { data, error } = await client.from('campaign_attack_defense_choices_v2').select('*')
    .eq('intent_id', intentId).maybeSingle();
  if (error) throw new Error('Não foi possível consultar a defesa antes da rolagem.');
  return data;
}

export async function loadRoundAttackIntents(campaignId: string, scene: number, round: number): Promise<AttackIntent[]> {
  const { data, error } = await client.from('campaign_attack_intents_v2').select('*')
    .eq('campaign_id', campaignId).eq('scene_number', scene).eq('round_number', round)
    .order('created_at', { ascending: false }).limit(100);
  if (error) throw new Error('Não foi possível carregar as intenções desta rodada.');
  return data ?? [];
}

export async function loadRoundDefenseChoices(intentIds: string[]): Promise<AttackDefenseChoice[]> {
  if (!intentIds.length) return [];
  const { data, error } = await client.from('campaign_attack_defense_choices_v2').select('*').in('intent_id', intentIds);
  if (error) throw new Error('Não foi possível carregar as escolhas defensivas.');
  return data ?? [];
}

function validateIntent(request: AttackIntentRequest): void {
  if (![request.operationId, request.campaignId, request.attackerId, request.targetId, request.turnInstanceId].every(id => UUID.test(id))
    || request.attackerId === request.targetId || request.weaponId.trim().length < 1 || request.weaponId.length > 100
    || !Number.isSafeInteger(request.scene) || request.scene < 1
    || !Number.isSafeInteger(request.round) || request.round < 1) throw new Error('Intenção de ataque inválida. Confira alvo, arma e turno.');
}

/** Persiste o pedido antes do RPC para repetir exatamente o mesmo UUID após timeout/reload. */
export function savePendingAttackIntent(request: AttackIntentRequest): void {
  validateIntent(request);
  try { sessionStorage.setItem(intentKey(request.campaignId, request.attackerId), JSON.stringify(request)); }
  catch { throw new Error('Não foi possível guardar a declaração. Nenhuma intenção foi enviada.'); }
}
export function restorePendingAttackIntent(campaignId: string, attackerId: string): AttackIntentRequest | null {
  const raw = sessionStorage.getItem(intentKey(campaignId, attackerId));
  if (!raw) return null;
  try {
    const request = JSON.parse(raw) as AttackIntentRequest;
    if (request.campaignId !== campaignId || request.attackerId !== attackerId) throw new Error('identidade');
    validateIntent(request);
    return request;
  } catch { throw new Error('Declaração pendente inválida neste navegador. Confira a campanha antes de atacar.'); }
}
export function clearPendingAttackIntent(campaignId: string, attackerId: string): void {
  sessionStorage.removeItem(intentKey(campaignId, attackerId));
}

export function savePendingDefenseChoice(request: DefenseChoiceRequest): void {
  if (!UUID.test(request.operationId) || !UUID.test(request.intentId)
    || !['none', 'bloqueio', 'esquiva'].includes(request.defenseType)) throw new Error('Escolha defensiva inválida.');
  try { sessionStorage.setItem(choiceKey(request.intentId), JSON.stringify(request)); }
  catch { throw new Error('Não foi possível guardar a escolha. Nenhuma defesa foi enviada.'); }
}
export function restorePendingDefenseChoice(intentId: string): DefenseChoiceRequest | null {
  const raw = sessionStorage.getItem(choiceKey(intentId));
  if (!raw) return null;
  try {
    const request = JSON.parse(raw) as DefenseChoiceRequest;
    if (request.intentId !== intentId || !UUID.test(request.operationId)
      || !['none', 'bloqueio', 'esquiva'].includes(request.defenseType)) throw new Error('pedido');
    return request;
  } catch { throw new Error('Escolha defensiva pendente inválida. Confira o histórico antes de prosseguir.'); }
}
export function clearPendingDefenseChoice(intentId: string): void { sessionStorage.removeItem(choiceKey(intentId)); }

export class AttackFlowError extends Error {
  constructor(message: string, readonly confirmedRejected: boolean) { super(message); }
}
function flowError(code: string | undefined, action: 'intenção' | 'defesa'): AttackFlowError {
  if (code === '40001') return new AttackFlowError(`Turno ou cena mudou. Atualize a ${action}.`, true);
  if (code === '42501') return new AttackFlowError(`Sem permissão para confirmar esta ${action}.`, true);
  if (code === '22023') return new AttackFlowError(`Dados da ${action} inválidos. Confira a ficha e a arma.`, true);
  if (code === '55004') return new AttackFlowError(`Ação ou reação indisponível nesta rodada. Confira as perícias e usos.`, true);
  if (code === '23505') return new AttackFlowError(`Esta ${action} já existe ou o identificador foi reutilizado.`, true);
  return new AttackFlowError(`Resposta incerta. Recupere a mesma ${action} antes de uma nova.`, false);
}

/** Declara alvo/arma antes dos dados, sem consumir PE nem ação padrão. */
export async function declareAttackIntent(request: AttackIntentRequest): Promise<AttackIntent> {
  validateIntent(request);
  let response: Awaited<ReturnType<typeof rpcClient.rpc<'declare_campaign_attack_intent_v2'>>>;
  try { response = await awaitActivityResponse(rpcClient.rpc('declare_campaign_attack_intent_v2', {
    p_operation_id: request.operationId, p_campaign_id: request.campaignId,
    p_attacker_id: request.attackerId, p_target_id: request.targetId,
    p_weapon_id: request.weaponId, p_expected_scene: request.scene,
    p_expected_round: request.round, p_expected_turn_instance_id: request.turnInstanceId,
  })); } catch { throw flowError(undefined, 'intenção'); }
  if (response.error) throw flowError(response.error.code, 'intenção');
  const intent = response.data;
  if (!intent || intent.operation_id !== request.operationId || intent.campaign_id !== request.campaignId
    || intent.attacker_id !== request.attackerId || intent.target_id !== request.targetId
    || intent.weapon_id !== request.weaponId || intent.scene_number !== request.scene
    || intent.round_number !== request.round || intent.turn_instance_id !== request.turnInstanceId
    || intent.status !== 'pending') throw new AttackFlowError('Recibo da intenção incompleto. Recupere a mesma declaração.', false);
  return intent;
}

/** Confirma a escolha do mestre antes da rolagem; `none` também é explícito. */
export async function confirmDefenseChoice(request: DefenseChoiceRequest): Promise<AttackDefenseChoice> {
  let response: Awaited<ReturnType<typeof rpcClient.rpc<'confirm_campaign_attack_defense_choice_v2'>>>;
  try { response = await awaitActivityResponse(rpcClient.rpc('confirm_campaign_attack_defense_choice_v2', {
    p_operation_id: request.operationId, p_intent_id: request.intentId,
    p_defense_type: request.defenseType,
  })); } catch { throw flowError(undefined, 'defesa'); }
  if (response.error) throw flowError(response.error.code, 'defesa');
  const choice = response.data;
  if (!choice || choice.operation_id !== request.operationId || choice.intent_id !== request.intentId
    || choice.defense_type !== request.defenseType) throw new AttackFlowError('Recibo defensivo incompleto. Recupere a mesma escolha.', false);
  return choice;
}

/** Cancela intenção não rolada; o servidor preserva o registro de proveniência. */
export async function cancelAttackIntent(intentId: string): Promise<void> {
  const { data, error } = await rpcClient.rpc('cancel_campaign_attack_intent_v2', { p_intent_id: intentId });
  if (error || !data || data.operation_id !== intentId || !['cancelled', 'expired'].includes(data.status)) {
    throw new Error('Cancelamento não confirmado. Atualize a campanha antes de declarar outro ataque.');
  }
}
