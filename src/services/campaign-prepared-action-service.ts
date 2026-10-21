import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { awaitActivityResponse } from '@/services/character-activity-service';
import type { CharacterActivityEvent } from '@/types/character-activity';

export type PreparedKind = 'standard' | 'movement' | 'free';
export interface PreparedAction {
  operation_id: string; campaign_id: string; character_id: string;
  scene_number: number; round_number: number; source_turn_instance_id: string;
  declared_kind: PreparedKind; action_description: string; trigger_description: string;
  status: 'pending' | 'triggered' | 'expired' | 'cancelled';
  trigger_operation_id: string | null; created_at: string;
}
export interface PrepareRequest {
  operationId: string; campaignId: string; characterId: string; scene: number; round: number;
  turnInstanceId: string; declaredKind: PreparedKind; actionDescription: string; triggerDescription: string;
}
export interface TriggerRequest {
  operationId: string; preparedId: string; scene: number; round: number;
  turnInstanceId: string; triggerNote: string;
}
export class PreparedActionError extends Error {
  constructor(message: string, readonly confirmedRejected: boolean) { super(message); }
}
type EventRow = { [Key in keyof CharacterActivityEvent]: CharacterActivityEvent[Key] };
type QueryDb = { public: { Tables: { character_prepared_actions_v2: { Row: PreparedAction; Insert: never; Update: never; Relationships: [] } }; Views: Record<string, never>; Enums: Record<string, never>; CompositeTypes: Record<string, never>; Functions: Record<string, never> } };
type RpcDb = { public: { Tables: Record<string, never>; Views: Record<string, never>; Enums: Record<string, never>; CompositeTypes: Record<string, never>; Functions: {
  prepare_character_action_v2: { Args: {
    p_operation_id: string; p_campaign_id: string; p_character_id: string; p_expected_scene: number;
    p_expected_round: number; p_expected_turn_instance_id: string; p_declared_kind: PreparedKind;
    p_action_description: string; p_trigger_description: string;
  }; Returns: EventRow };
  trigger_character_prepared_action_v2: { Args: {
    p_operation_id: string; p_prepared_id: string; p_expected_scene: number;
    p_expected_round: number; p_expected_turn_instance_id: string; p_trigger_note: string;
  }; Returns: EventRow };
} } };
const query = supabase as unknown as SupabaseClient<QueryDb>;
const rpc = supabase as unknown as SupabaseClient<RpcDb>;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const key = (campaignId: string) => `ordem-roll:prepared-action:${campaignId}`;
export type PendingPreparedOperation = { kind: 'prepare'; request: PrepareRequest } | { kind: 'trigger'; request: TriggerRequest; campaignId: string };

/** Lista ações preparadas ainda abertas; o servidor controla janela e expiração. */
export async function loadPendingPreparedActions(campaignId: string): Promise<PreparedAction[]> {
  const { data, error } = await query.from('character_prepared_actions_v2').select('*')
    .eq('campaign_id', campaignId).eq('status', 'pending').order('created_at', { ascending: true }).limit(100);
  if (error) throw new Error('Não foi possível carregar ações preparadas.');
  return data ?? [];
}

function validate(operation: PendingPreparedOperation): void {
  if (!UUID.test(operation.request.operationId) || !UUID.test(operation.request.turnInstanceId)
    || !Number.isSafeInteger(operation.request.scene) || operation.request.scene < 1
    || !Number.isSafeInteger(operation.request.round) || operation.request.round < 1) throw new PreparedActionError('Turno ou identificador inválido.', true);
  if (operation.kind === 'prepare') {
    const request = operation.request;
    if (!UUID.test(request.campaignId) || !UUID.test(request.characterId)
      || !['standard', 'movement', 'free'].includes(request.declaredKind)
      || !request.actionDescription.trim() || request.actionDescription.length > 500
      || !request.triggerDescription.trim() || request.triggerDescription.length > 500)
      throw new PreparedActionError('Descreva a ação e o gatilho em até 500 caracteres.', true);
  } else {
    const request = operation.request;
    if (!UUID.test(operation.campaignId) || !UUID.test(request.preparedId)
      || !request.triggerNote.trim() || request.triggerNote.length > 500)
      throw new PreparedActionError('Confirme o gatilho e a execução manual.', true);
  }
}

function validateTriggerRequest(request: TriggerRequest): void {
  if (!UUID.test(request.operationId) || !UUID.test(request.preparedId)
    || !UUID.test(request.turnInstanceId) || !Number.isSafeInteger(request.scene) || request.scene < 1
    || !Number.isSafeInteger(request.round) || request.round < 1
    || !request.triggerNote.trim() || request.triggerNote.length > 500)
    throw new PreparedActionError('Confirme o gatilho e a execução manual.', true);
}

/** A operação fica no navegador até recibo válido ou rejeição definitiva. */
export function savePendingPreparedOperation(campaignId: string, operation: PendingPreparedOperation): void {
  validate(operation);
  try { sessionStorage.setItem(key(campaignId), JSON.stringify(operation)); }
  catch { throw new PreparedActionError('Não foi possível guardar a operação; ela não foi enviada.', true); }
}
export function restorePendingPreparedOperation(campaignId: string): PendingPreparedOperation | null {
  const raw = sessionStorage.getItem(key(campaignId));
  if (!raw) return null;
  try {
    const operation = JSON.parse(raw) as PendingPreparedOperation;
    if (operation.kind !== 'prepare' && operation.kind !== 'trigger') throw new Error('tipo');
    if ((operation.kind === 'prepare' ? operation.request.campaignId : operation.campaignId) !== campaignId) throw new Error('campanha');
    validate(operation); return operation;
  } catch { throw new PreparedActionError('Ação pendente inválida. Confira histórico e turno antes de prosseguir.', false); }
}
export function clearPendingPreparedOperation(campaignId: string): void { sessionStorage.removeItem(key(campaignId)); }

function requestError(code: string | undefined): PreparedActionError {
  if (code === '40001') return new PreparedActionError('A janela do turno ou gatilho terminou. Atualize o combate.', true);
  if (code === '42501') return new PreparedActionError('Sem permissão para esta ficha ou campanha.', true);
  if (code === '55004') return new PreparedActionError('Ação padrão indisponível ou ator saiu do combate.', true);
  if (code === '22023' || code === '23505') return new PreparedActionError('Dados inválidos ou operação reutilizada. Confira o histórico.', true);
  return new PreparedActionError('Resposta incerta. Recupere a mesma operação antes de outra.', false);
}

/** Consome apenas o slot padrão e registra intenção; não executa efeito nem cobra PE. */
export async function prepareCharacterAction(request: PrepareRequest): Promise<CharacterActivityEvent> {
  validate({ kind: 'prepare', request });
  let response: Awaited<ReturnType<typeof rpc.rpc<'prepare_character_action_v2'>>>;
  try { response = await awaitActivityResponse(rpc.rpc('prepare_character_action_v2', {
    p_operation_id: request.operationId, p_campaign_id: request.campaignId,
    p_character_id: request.characterId, p_expected_scene: request.scene,
    p_expected_round: request.round, p_expected_turn_instance_id: request.turnInstanceId,
    p_declared_kind: request.declaredKind, p_action_description: request.actionDescription.trim(),
    p_trigger_description: request.triggerDescription.trim(),
  })); } catch { throw requestError(undefined); }
  if (response.error) throw requestError(response.error.code);
  const receipt = response.data as unknown as CharacterActivityEvent | null;
  const payload = receipt?.payload;
  if (!receipt || receipt.operation_id !== request.operationId || receipt.character_id !== request.characterId
    || receipt.campaign_id !== request.campaignId || receipt.status !== 'confirmed'
    || !payload || typeof payload !== 'object' || Array.isArray(payload)
    || payload.kind !== 'prepared_action' || payload.effectApplied !== false || payload.peApplied !== false)
    throw new PreparedActionError('Recibo incompleto. Recupere a mesma preparação.', false);
  return receipt;
}

/** Mestre confirma gatilho manual; RPC registra a reação e ajusta iniciativa. */
export async function triggerPreparedAction(request: TriggerRequest): Promise<CharacterActivityEvent> {
  validateTriggerRequest(request);
  let response: Awaited<ReturnType<typeof rpc.rpc<'trigger_character_prepared_action_v2'>>>;
  try { response = await awaitActivityResponse(rpc.rpc('trigger_character_prepared_action_v2', {
    p_operation_id: request.operationId, p_prepared_id: request.preparedId,
    p_expected_scene: request.scene, p_expected_round: request.round,
    p_expected_turn_instance_id: request.turnInstanceId, p_trigger_note: request.triggerNote.trim(),
  })); } catch { throw requestError(undefined); }
  if (response.error) throw requestError(response.error.code);
  const receipt = response.data as unknown as CharacterActivityEvent | null;
  const payload = receipt?.payload;
  if (!receipt || receipt.operation_id !== request.operationId || receipt.status !== 'confirmed'
    || !payload || typeof payload !== 'object' || Array.isArray(payload)
    || payload.kind !== 'prepared_action_trigger' || payload.preparedActionId !== request.preparedId
    || payload.reactionConfirmedByMaster !== true || payload.initiativeChanged !== true
    || payload.effectApplied !== false || payload.peApplied !== false)
    throw new PreparedActionError('Recibo incompleto. Recupere o mesmo gatilho.', false);
  return receipt;
}
