import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { awaitActivityResponse } from '@/services/character-activity-service';
import { loadCampaignCombat } from '@/services/campaign-combat-service';
import {
  COMBAT_MANEUVER_TYPES, eligibleHeldManeuverItems, eligibleManeuverTargets, type CombatManeuverType,
} from '@/lib/combat-maneuvers';

export type ManeuverAttribute = 'strength' | 'agility';
export type ManeuverStatus = 'pending' | 'resolved' | 'cancelled' | 'expired';
export interface CombatManeuver {
  operation_id: string; campaign_id: string; scene_number: number; round_number: number;
  turn_instance_id: string; actor_id: string; target_id: string; maneuver_type: CombatManeuverType;
  weapon_id: string | null; attribute: ManeuverAttribute; status: ManeuverStatus;
  result: Record<string, unknown> | null; created_at: string;
}
export interface ManeuverDeclarationRequest {
  operationId: string; campaignId: string; actorId: string; targetId: string;
  maneuverType: CombatManeuverType; weaponId: string; attribute: ManeuverAttribute;
  scene: number; round: number; turnInstanceId: string;
}
export interface ManeuverResolutionRequest {
  operationId: string; maneuverId: string; defenderAttribute: ManeuverAttribute;
  attackerModifier: number; defenderModifier: number; justification: string;
  adjacencyConfirmed: boolean; freeHandConfirmed?: boolean; targetItemId?: string;
}
export interface ManeuverContext {
  active: boolean; scene: number; round: number; turnInstanceId: string | null; currentActorId: string | null;
}
export interface GrappleLink {
  maneuver_operation_id: string; campaign_id: string; actor_id: string; target_id: string; active: boolean;
}

type Row = CombatManeuver & { author_id: string; request_hash: string; resolution_operation_id: string | null };
type ManeuverDatabase = { public: {
  Tables: {
    campaign_combat_maneuvers_v2: { Row: Row; Insert: never; Update: never; Relationships: [] };
    campaign_grapples_v2: { Row: GrappleLink; Insert: never; Update: never; Relationships: [] };
  };
  Views: Record<string, never>; Enums: Record<string, never>; CompositeTypes: Record<string, never>; Functions: Record<string, never>;
} };
type ManeuverRpcDatabase = { public: {
  Tables: Record<string, never>; Views: Record<string, never>; Enums: Record<string, never>; CompositeTypes: Record<string, never>;
  Functions: {
    declare_campaign_combat_maneuver_v2: { Args: {
      p_operation_id: string; p_campaign_id: string; p_actor_id: string; p_target_id: string;
      p_maneuver_type: CombatManeuverType; p_weapon_id: string; p_attribute: ManeuverAttribute;
      p_expected_scene: number; p_expected_round: number; p_expected_turn_instance_id: string;
    }; Returns: Row };
    cancel_campaign_combat_maneuver_v2: { Args: { p_operation_id: string }; Returns: Row };
    resolve_campaign_combat_maneuver_v2: { Args: { p_operation_id: string; p_maneuver_id: string; p_resolution: Record<string, unknown> }; Returns: Row };
    release_campaign_grapple_v2: { Args: { p_maneuver_id: string }; Returns: GrappleLink };
  };
} };
const client = supabase as unknown as SupabaseClient<ManeuverDatabase>;
const rpcClient = supabase as unknown as SupabaseClient<ManeuverRpcDatabase>;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const storageKey = (campaignId: string, actorId: string) => `ordem-roll:maneuver:${campaignId}:${actorId}`;
const resolutionKey = (maneuverId: string) => `ordem-roll:maneuver-resolution:${maneuverId}`;

function validateDeclaration(request: ManeuverDeclarationRequest): void {
  if (![request.operationId, request.campaignId, request.actorId, request.targetId, request.turnInstanceId].every(UUID.test.bind(UUID))
    || request.actorId === request.targetId || !COMBAT_MANEUVER_TYPES.includes(request.maneuverType)
    || !['strength', 'agility'].includes(request.attribute)
    || !Number.isSafeInteger(request.scene) || request.scene < 1
    || !Number.isSafeInteger(request.round) || request.round < 1
    || request.weaponId.length < 1 || request.weaponId.length > 100) {
    throw new Error('Declaração de manobra inválida. Confira alvo, arma e turno.');
  }
}

export function savePendingManeuver(request: ManeuverDeclarationRequest): void {
  validateDeclaration(request);
  try { sessionStorage.setItem(storageKey(request.campaignId, request.actorId), JSON.stringify(request)); }
  catch { throw new Error('Não foi possível guardar a manobra. Nenhuma declaração foi enviada.'); }
}
export function restorePendingManeuver(campaignId: string, actorId: string): ManeuverDeclarationRequest | null {
  const raw = sessionStorage.getItem(storageKey(campaignId, actorId));
  if (!raw) return null;
  try {
    const request = JSON.parse(raw) as ManeuverDeclarationRequest;
    if (request.campaignId !== campaignId || request.actorId !== actorId) throw new Error('identidade');
    validateDeclaration(request); return request;
  } catch { throw new Error('Manobra pendente inválida neste navegador. Atualize o combate.'); }
}
export function clearPendingManeuver(campaignId: string, actorId: string): void {
  sessionStorage.removeItem(storageKey(campaignId, actorId));
}

function validateResolutionRequest(request: ManeuverResolutionRequest): void {
  if (!UUID.test(request.operationId) || !UUID.test(request.maneuverId)
    || !['strength', 'agility'].includes(request.defenderAttribute)
    || !Number.isSafeInteger(request.attackerModifier) || Math.abs(request.attackerModifier) > 20
    || !Number.isSafeInteger(request.defenderModifier) || Math.abs(request.defenderModifier) > 20
    || request.justification.trim().length < 3 || request.justification.length > 500 || !request.adjacencyConfirmed
    || (request.targetItemId !== undefined && (request.targetItemId.length < 1 || request.targetItemId.length > 100))) {
    throw new Error('Confirme o contexto e justifique os modificadores da manobra.');
  }
}

/** Outbox local da decisão do mestre; removido somente após recibo confirmado. */
export function savePendingManeuverResolution(request: ManeuverResolutionRequest): void {
  validateResolutionRequest(request);
  try { sessionStorage.setItem(resolutionKey(request.maneuverId), JSON.stringify(request)); }
  catch { throw new Error('Não foi possível guardar a resolução. Nenhuma confirmação foi enviada.'); }
}
export function restorePendingManeuverResolution(maneuverId: string): ManeuverResolutionRequest | null {
  const raw = sessionStorage.getItem(resolutionKey(maneuverId));
  if (!raw) return null;
  try {
    const request = JSON.parse(raw) as ManeuverResolutionRequest;
    if (request.maneuverId !== maneuverId) throw new Error('identidade');
    validateResolutionRequest(request); return request;
  } catch { throw new Error('Resolução pendente inválida neste navegador. Confira a manobra.'); }
}
export function clearPendingManeuverResolution(maneuverId: string): void {
  sessionStorage.removeItem(resolutionKey(maneuverId));
}

export async function loadManeuverContext(campaignId: string): Promise<ManeuverContext> {
  const combat = await loadCampaignCombat(campaignId);
  return { active: combat.state.active, scene: combat.sceneNumber ?? 1, round: combat.state.round,
    turnInstanceId: combat.turnInstanceId ?? null,
    currentActorId: combat.state.combatants[combat.state.currentTurnIndex]?.id ?? null };
}
export async function loadManeuverTargets(campaignId: string, actorId: string): Promise<Array<{ id: string; name: string }>> {
  const [combat, response] = await Promise.all([
    loadCampaignCombat(campaignId),
    supabase.from('campaign_members_v2').select('character_id,characters(id,name)').eq('campaign_id', campaignId),
  ]);
  const { data, error } = response;
  if (error) throw new Error('Não foi possível carregar os alvos da manobra.');
  const members = (data ?? []).flatMap(member => member.characters
    ? [{ id: member.characters.id, name: member.characters.name }] : []);
  return combat.state.active
    ? eligibleManeuverTargets(members, combat.state.combatants.map(entry => entry.id), actorId)
    : [];
}
export async function loadManeuverTargetItems(characterId: string): Promise<Array<{ id: string; name: string }>> {
  if (!UUID.test(characterId)) throw new Error('Alvo da manobra inválido.');
  const { data, error } = await supabase.from('characters').select('inventory').eq('id', characterId).single();
  if (error || !data || !Array.isArray(data.inventory)) throw new Error('Não foi possível conferir os itens empunhados do alvo.');
  return eligibleHeldManeuverItems(data.inventory);
}
export async function loadPendingManeuver(
  campaignId: string, actorId: string, turnInstanceId?: string | null,
): Promise<CombatManeuver | null> {
  let query = client.from('campaign_combat_maneuvers_v2').select('*')
    .eq('campaign_id', campaignId).eq('actor_id', actorId).in('status', ['pending', 'resolved']);
  if (turnInstanceId) query = query.eq('turn_instance_id', turnInstanceId);
  const { data, error } = await query.order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (error) throw new Error('Não foi possível consultar a manobra deste turno.');
  return data;
}
export async function loadRoundManeuvers(campaignId: string, scene: number, round: number): Promise<CombatManeuver[]> {
  const { data, error } = await client.from('campaign_combat_maneuvers_v2').select('*')
    .eq('campaign_id', campaignId).eq('scene_number', scene).eq('round_number', round)
    .order('created_at', { ascending: false }).limit(100);
  if (error) throw new Error('Não foi possível carregar as manobras da rodada.');
  return data ?? [];
}

/** Consulta vínculos vigentes sem depender do turno ou rodada em que foram criados. */
export async function loadActiveGrapples(campaignId: string, actorId?: string): Promise<GrappleLink[]> {
  let query = client.from('campaign_grapples_v2').select('*')
    .eq('campaign_id', campaignId).eq('active', true);
  if (actorId) query = query.eq('actor_id', actorId);
  const { data, error } = await query.order('started_at', { ascending: true }).limit(100);
  if (error) throw new Error('Não foi possível consultar os vínculos ativos de Agarrar.');
  return data ?? [];
}

function maneuverError(code?: string): Error {
  if (code === '42501') return new Error('Sem permissão para esta manobra.');
  if (code === '40001') return new Error('Cena, turno ou ficha mudou. Atualize antes de prosseguir.');
  if (code === '55004') return new Error('Ação padrão indisponível neste turno.');
  if (code === '22023') return new Error('Dados ou requisitos da manobra são inválidos.');
  if (code === '23505') return new Error('A manobra já existe ou o identificador foi reutilizado.');
  return new Error('Resposta incerta. Recupere a mesma manobra antes de criar outra.');
}
export async function declareManeuver(request: ManeuverDeclarationRequest): Promise<CombatManeuver> {
  validateDeclaration(request);
  let response: Awaited<ReturnType<typeof rpcClient.rpc<'declare_campaign_combat_maneuver_v2'>>>;
  try { response = await awaitActivityResponse(rpcClient.rpc('declare_campaign_combat_maneuver_v2', {
    p_operation_id: request.operationId, p_campaign_id: request.campaignId,
    p_actor_id: request.actorId, p_target_id: request.targetId, p_maneuver_type: request.maneuverType,
    p_weapon_id: request.weaponId, p_attribute: request.attribute, p_expected_scene: request.scene,
    p_expected_round: request.round, p_expected_turn_instance_id: request.turnInstanceId,
  })); } catch { throw maneuverError(); }
  if (response.error) throw maneuverError(response.error.code);
  if (!response.data || response.data.operation_id !== request.operationId || response.data.status !== 'pending') throw maneuverError();
  return response.data;
}
export async function cancelManeuver(operationId: string): Promise<CombatManeuver> {
  if (!UUID.test(operationId)) throw new Error('Manobra inválida.');
  const { data, error } = await rpcClient.rpc('cancel_campaign_combat_maneuver_v2', { p_operation_id: operationId });
  if (error || !data) throw maneuverError(error?.code);
  return data;
}
export async function resolveManeuver(request: ManeuverResolutionRequest): Promise<CombatManeuver> {
  validateResolutionRequest(request);
  const { data, error } = await rpcClient.rpc('resolve_campaign_combat_maneuver_v2', {
    p_operation_id: request.operationId, p_maneuver_id: request.maneuverId,
    p_resolution: { defenderAttribute: request.defenderAttribute,
      attackerModifier: request.attackerModifier, defenderModifier: request.defenderModifier,
      justification: request.justification.trim(), adjacencyConfirmed: true,
      freeHandConfirmed: request.freeHandConfirmed ?? false, targetItemId: request.targetItemId ?? null },
  });
  if (error || !data) throw maneuverError(error?.code);
  return data;
}

/** Soltar voluntariamente é livre; reenvio retorna o mesmo vínculo encerrado. */
export async function releaseCampaignGrapple(maneuverId: string): Promise<GrappleLink> {
  if (!UUID.test(maneuverId)) throw new Error('Vínculo de Agarrar inválido.');
  const { data, error } = await rpcClient.rpc('release_campaign_grapple_v2', { p_maneuver_id: maneuverId });
  if (error || !data || data.maneuver_operation_id !== maneuverId || data.active !== false) {
    throw maneuverError(error?.code);
  }
  return data;
}

/** Assinatura compartilhada; o retorno encerra somente este canal. */
export function subscribeToManeuvers(campaignId: string, onChange: () => void): () => void {
  const channel = supabase.channel(`maneuvers:${campaignId}`).on('postgres_changes', {
    event: '*', schema: 'public', table: 'campaign_combat_maneuvers_v2', filter: `campaign_id=eq.${campaignId}`,
  }, onChange).on('postgres_changes', {
    event: '*', schema: 'public', table: 'campaign_grapples_v2', filter: `campaign_id=eq.${campaignId}`,
  }, onChange).subscribe();
  return () => { void supabase.removeChannel(channel); };
}
