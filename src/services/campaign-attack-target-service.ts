import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { awaitActivityResponse } from '@/services/character-activity-service';
import { CAMPAIGN_DAMAGE_TYPES, type CampaignDamageType } from '@/services/campaign-bulk-damage-service';
import type { CharacterActivityEvent } from '@/types/character-activity';

export interface AttackTargetResolution {
  defenseTotal: number;
  grossDamage: number;
  damageType: CampaignDamageType;
  resistedDamage: number;
  damageReduction: number;
  immuneDamage: boolean;
  vulnerableDamage: boolean;
  specialDefenseEventId?: string;
  reviewNote?: string;
}
export interface AttackTargetRequest {
  operationId: string;
  campaignId: string;
  attackEventId: string;
  targetCharacterId: string;
  expectedHp: number;
  expectedScene: number;
  expectedRound: number;
  resolution: AttackTargetResolution;
}
export interface AttackTargetReceipt {
  operationId: string; campaignId: string; attackEventId: string; targetId: string;
  attackTotal: number; defenseTotal: number; concealmentFailed: boolean; hit: boolean;
  grossDamage: number; damageType: CampaignDamageType; declaredResistedDamage: number;
  declaredDamageReduction: number; immuneDamage: boolean;
  vulnerableDamage: boolean; damageAfterVulnerability: number;
  finalDamage: number; temporaryHPUsed: number; hpBefore: number; hpAfter: number;
  targetEventId: string; attackerEventId: string; timingVerifiedByServer: boolean;
  conditionsBefore?: string[]; conditionsAfter?: string[];
}
export class AttackTargetError extends Error {
  constructor(message: string, readonly confirmedRejected: boolean) { super(message); }
}

type EventRow = { [Key in keyof CharacterActivityEvent]: CharacterActivityEvent[Key] };
type QueryDb = { public: { Tables: { character_activity_events: { Row: EventRow; Insert: never; Update: never; Relationships: [] } }; Views: Record<string, never>; Enums: Record<string, never>; CompositeTypes: Record<string, never>; Functions: Record<string, never> } };
type RpcDb = { public: { Tables: Record<string, never>; Views: Record<string, never>; Enums: Record<string, never>; CompositeTypes: Record<string, never>; Functions: { confirm_campaign_attack_target_v3: { Args: { p_operation_id: string; p_campaign_id: string; p_attack_event_id: string; p_target_character_id: string; p_expected_hp: number; p_expected_scene: number; p_expected_round: number; p_resolution: AttackTargetResolution }; Returns: AttackTargetReceipt } } } };
const query = supabase as unknown as SupabaseClient<QueryDb>;
const rpc = supabase as unknown as SupabaseClient<RpcDb>;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const key = (campaignId: string) => `ordem-roll:attack-target:${campaignId}`;
const validNumber = (value: number) => Number.isSafeInteger(value) && value >= 0 && value <= 1_000_000;
const validSignedNumber = (value: number) => Number.isSafeInteger(value) && value >= -1_000_000 && value <= 1_000_000;

/**
 * Calcula somente a prévia exibida ao mestre. O servidor repete o cálculo e
 * continua sendo a fonte autoritativa para acerto, dano e alteração de PV.
 */
export function calculateAttackResolutionPreview(
  attackTotal: number,
  concealmentFailed: boolean,
  resolution: AttackTargetResolution,
): { hit: boolean; finalDamage: number } {
  const hit = !concealmentFailed && attackTotal >= resolution.defenseTotal;
  const afterResistance = Math.max(0, resolution.grossDamage - resolution.resistedDamage);
  const afterVulnerability = resolution.vulnerableDamage ? afterResistance * 2 : afterResistance;
  const finalDamage = hit && !resolution.immuneDamage
    ? Math.max(0, afterVulnerability - resolution.damageReduction)
    : 0;
  return { hit, finalDamage };
}

/** Lê a rolagem confirmada para mostrar o total ao mestre; a RPC valida de novo. */
export async function loadAttackEvent(attackEventId: string): Promise<CharacterActivityEvent> {
  const { data, error } = await query.from('character_activity_events').select('*').eq('id', attackEventId).maybeSingle();
  if (error || !data) throw new Error('Rolagem confirmada indisponível. Atualize o combate.');
  return data as unknown as CharacterActivityEvent;
}

/** Consulta resoluções já confirmadas sem presumir sucesso após perda de conexão. */
export async function loadResolvedAttackIds(campaignId: string, attackEventIds: string[]): Promise<string[]> {
  if (!attackEventIds.length) return [];
  const { data, error } = await query.from('character_activity_events').select('*')
    .eq('campaign_id', campaignId).eq('category', 'application').eq('payload->>kind', 'attack_target_received')
    .in('payload->>attackEventId', attackEventIds);
  if (error) throw new Error('Não foi possível conferir resoluções da rodada.');
  return ((data ?? []) as unknown as CharacterActivityEvent[]).flatMap(event => {
    const payload = event.payload;
    return payload && typeof payload === 'object' && !Array.isArray(payload) && typeof payload.attackEventId === 'string'
      ? [payload.attackEventId] : [];
  });
}

function validate(request: AttackTargetRequest): void {
  const value = request.resolution;
  if (![request.operationId, request.campaignId, request.attackEventId, request.targetCharacterId].every(id => UUID.test(id))
    || !validNumber(request.expectedHp) || !validNumber(request.expectedScene) || request.expectedScene < 1
    || !validNumber(request.expectedRound) || request.expectedRound < 1
    || !validNumber(value.defenseTotal) || !validNumber(value.grossDamage)
    || !validNumber(value.resistedDamage) || value.resistedDamage > value.grossDamage
    || !validNumber(value.damageReduction) || !CAMPAIGN_DAMAGE_TYPES.includes(value.damageType)
    || typeof value.immuneDamage !== 'boolean' || typeof value.vulnerableDamage !== 'boolean'
    || (value.immuneDamage && value.vulnerableDamage)
    || (value.specialDefenseEventId && !UUID.test(value.specialDefenseEventId))
    || (value.reviewNote?.length ?? 0) > 500
    || ((!!value.specialDefenseEventId || value.resistedDamage > 0 || value.damageReduction > 0
      || value.immuneDamage || value.vulnerableDamage)
      && !value.reviewNote?.trim())) throw new AttackTargetError('Confira Defesa, dano, reduções e justificativa da mesa.', true);
}

/** Preserva UUID e payload exatos para uma eventual repetição idempotente. */
export function savePendingAttackTarget(request: AttackTargetRequest): void {
  validate(request);
  try { sessionStorage.setItem(key(request.campaignId), JSON.stringify(request)); }
  catch { throw new AttackTargetError('Não foi possível guardar a operação; nenhum dano foi enviado.', true); }
}
export function restorePendingAttackTarget(campaignId: string): AttackTargetRequest | null {
  const raw = sessionStorage.getItem(key(campaignId));
  if (!raw) return null;
  try {
    const request = JSON.parse(raw) as AttackTargetRequest;
    if (request.campaignId !== campaignId) throw new Error('Campanha incorreta.');
    validate(request); return request;
  } catch { throw new AttackTargetError('Resolução pendente inválida. Confira o histórico antes de prosseguir.', false); }
}
export function clearPendingAttackTarget(campaignId: string): void { sessionStorage.removeItem(key(campaignId)); }

/** Só devolve sucesso quando o recibo do servidor corresponde à resolução enviada. */
export async function confirmAttackTarget(request: AttackTargetRequest): Promise<AttackTargetReceipt> {
  validate(request);
  let response: Awaited<ReturnType<typeof rpc.rpc<'confirm_campaign_attack_target_v3'>>>;
  try { response = await awaitActivityResponse(rpc.rpc('confirm_campaign_attack_target_v3', {
    p_operation_id: request.operationId, p_campaign_id: request.campaignId,
    p_attack_event_id: request.attackEventId, p_target_character_id: request.targetCharacterId,
    p_expected_hp: request.expectedHp, p_expected_scene: request.expectedScene,
    p_expected_round: request.expectedRound, p_resolution: request.resolution,
  })); } catch { throw new AttackTargetError('Resposta incerta. Recupere a mesma resolução antes de tentar outra.', false); }
  if (response.error) {
    const code = response.error.code;
    if (code === '40001') throw new AttackTargetError('Cena, rodada ou PV mudou. Atualize os valores.', true);
    if (code === '42501') throw new AttackTargetError('Somente o mestre pode resolver este alvo.', true);
    if (code === '22023' || code === '55004') throw new AttackTargetError('Ataque, alvo ou defesa inválidos. Confira a declaração e a rolagem.', true);
    if (code === '23505') throw new AttackTargetError('Este ataque já foi resolvido ou a operação foi reutilizada.', true);
    throw new AttackTargetError('Resposta incerta. Recupere a mesma resolução antes de tentar outra.', false);
  }
  const receipt = response.data;
  const expected = calculateAttackResolutionPreview(
    receipt?.attackTotal ?? Number.NaN,
    receipt?.concealmentFailed ?? false,
    request.resolution,
  );
  if (!receipt || receipt.operationId !== request.operationId || receipt.campaignId !== request.campaignId
    || receipt.attackEventId !== request.attackEventId || receipt.targetId !== request.targetCharacterId
    || receipt.defenseTotal !== request.resolution.defenseTotal || receipt.grossDamage !== request.resolution.grossDamage
    || receipt.damageType !== request.resolution.damageType
    || receipt.declaredResistedDamage !== request.resolution.resistedDamage
    || receipt.declaredDamageReduction !== request.resolution.damageReduction
    || receipt.immuneDamage !== request.resolution.immuneDamage
    || receipt.vulnerableDamage !== request.resolution.vulnerableDamage
    || receipt.damageAfterVulnerability !== (request.resolution.vulnerableDamage
      ? Math.max(0, request.resolution.grossDamage - request.resolution.resistedDamage) * 2
      : Math.max(0, request.resolution.grossDamage - request.resolution.resistedDamage))
    || receipt.hpBefore !== request.expectedHp || typeof receipt.concealmentFailed !== 'boolean'
    || receipt.hit !== expected.hit || receipt.finalDamage !== expected.finalDamage
    || receipt.temporaryHPUsed > receipt.finalDamage
    || receipt.hpAfter !== Math.max(0, receipt.hpBefore - receipt.finalDamage + receipt.temporaryHPUsed)
    || !UUID.test(receipt.targetEventId) || !UUID.test(receipt.attackerEventId)
    || !validSignedNumber(receipt.attackTotal)
    || ![receipt.finalDamage, receipt.temporaryHPUsed, receipt.hpAfter].every(validNumber))
    throw new AttackTargetError('Recibo incompleto. Recupere a mesma resolução.', false);
  return receipt;
}
