import { activityClient, activityFailure, activityJson, awaitActivityResponse, confirmActivity, validateActivityId } from './character-activity-service';
import type { Json } from '@/integrations/supabase/types';
import { validateRitualEndReason, type RitualEndReason } from '@/lib/rituals/ritual-ending';

export interface SustainedSnapshot {
  id: string; ritual_id: string; turns_active: number | null; pe_spent_total: number | null;
  sustain_config: Json; is_concentrating: boolean | null;
}
export interface SustainedActionRequest {
  operationId: string; characterId: string; action: 'maintain' | 'end' | 'end_all';
  expected: SustainedSnapshot[]; expectedPE: number | null;
  endReason?: RitualEndReason;
  turn?: RitualTurn;
  temporaryPE?: number;
}

export interface RitualTurn { mode: 'manual' | 'combat'; key: string; eligible: boolean; number?: number; round?: number; campaignId?: string; scene?: number }
/** Recupera a identidade protegida; não inventa turno a partir de contadores locais. */
export async function getRitualTurn(characterId: string): Promise<RitualTurn> {
  validateActivityId(characterId);
  const { data, error } = await awaitActivityResponse(activityClient.rpc('get_character_ritual_turn', { p_character_id: characterId }));
  if (error) throw activityFailure('Não foi possível conferir o turno.', error);
  if (!data || typeof data !== 'object' || Array.isArray(data) || !['manual', 'combat'].includes(String(data.mode))
    || typeof data.key !== 'string' || typeof data.eligible !== 'boolean') throw new Error('O servidor não confirmou o turno.');
  return data as unknown as RitualTurn;
}
/** Avança um turno manual somente após confirmação; snapshot e UUID conservados no retry. */
export async function beginManualTurn(characterId: string, operationId: string, expectedTurn: number) {
  validateActivityId(characterId); validateActivityId(operationId);
  if (!Number.isSafeInteger(expectedTurn) || expectedTurn < 0) throw new Error('Turno manual inválido.');
  const { data, error } = await awaitActivityResponse(activityClient.rpc('begin_character_manual_turn', { p_character_id: characterId, p_operation_id: operationId, p_expected_turn: expectedTurn }));
  if (error) {
    const failure = activityFailure('O novo turno não foi confirmado.', error);
    // Erros SQL explícitos desfazem a transação; falhas de conexão conservam a tentativa.
    throw Object.assign(failure, { serverRejected: ['40001', '42501', '23505', '0A000', '22023'].includes(error.code ?? '') });
  }
  const receipt = confirmActivity(data, characterId, operationId);
  const payload = receipt.payload;
  if (receipt.status !== 'confirmed' || !payload || typeof payload !== 'object' || Array.isArray(payload)
    || payload.kind !== 'manual_turn' || payload.turnAfter !== expectedTurn + 1) throw new Error('O servidor não confirmou o novo turno. Recupere a mesma operação.');
  return receipt;
}

/** Consulta autorizada e enriquecida com a origem protegida; não modifica dados. */
export async function listSustainedRituals(characterId: string): Promise<Json[]> {
  validateActivityId(characterId);
  const { data, error } = await awaitActivityResponse(activityClient.rpc('list_character_sustained_rituals', { p_character_id: characterId }));
  if (error) throw activityFailure('Não foi possível carregar os rituais sustentados.', error);
  if (!Array.isArray(data)) throw new Error('O servidor não confirmou a lista de sustentações.');
  return data;
}

/** Envia snapshot congelado e UUID; a mesma tentativa recupera o recibo sem cobrar novamente. */
export async function confirmSustainedAction(request: SustainedActionRequest) {
  validateActivityId(request.characterId); validateActivityId(request.operationId);
  if (!request.expected.length || request.expected.length > 64) throw new Error('Selecione os rituais da operação.');
  request.expected.forEach(ritual => validateActivityId(ritual.id));
  if (request.action === 'maintain' && (!Number.isSafeInteger(request.expectedPE) || request.expectedPE! < 0 || request.expectedPE! + (request.temporaryPE ?? 0) < request.expected.length)) {
    throw new Error('PE insuficiente para manter os rituais selecionados. Nenhuma cobrança foi enviada.');
  }
  if (request.action === 'maintain' && (!request.turn?.eligible || !request.turn.key)) throw new Error('Confirme o início do turno do conjurador antes da manutenção.');
  if (request.action !== 'maintain') {
    const invalid = validateRitualEndReason(request.endReason);
    if (invalid) throw new Error(invalid);
  }
  const response = request.action === 'maintain'
    ? activityClient.rpc('confirm_sustained_ritual_maintenance', {
      p_operation_id: request.operationId, p_character_id: request.characterId,
      p_expected: activityJson(request.expected), p_expected_pe: request.expectedPE, p_turn: activityJson(request.turn),
    })
    : activityClient.rpc('confirm_sustained_ritual_end', {
      p_operation_id: request.operationId, p_character_id: request.characterId, p_action: request.action,
      p_expected: activityJson(request.expected), p_reason: activityJson(request.endReason),
    });
  const { data, error } = await awaitActivityResponse(response);
  if (error) {
    const failure = activityFailure('A operação de sustentação não foi confirmada.', error);
    // Somente códigos SQL explícitos garantem rollback; falhas de transporte podem ter sido confirmadas.
    throw Object.assign(failure, { serverRejected: ['40001', '42501', '23505', '0A000', '22023'].includes(error.code ?? '') });
  }
  const receipt = confirmActivity(data, request.characterId, request.operationId);
  const payload = receipt.payload;
  const kind = request.action === 'maintain' ? 'sustain_maintenance' : 'sustain_end';
  if (receipt.status !== 'confirmed' || receipt.category !== 'application' || !payload
    || typeof payload !== 'object' || Array.isArray(payload) || payload.kind !== kind) {
    throw new Error('O servidor ainda não confirmou esta ação de sustentação. Recupere a mesma operação.');
  }
  if (request.action === 'maintain' && (!payload.turn || typeof payload.turn !== 'object' || Array.isArray(payload.turn)
    || payload.turn.key !== request.turn?.key)) throw new Error('O servidor não confirmou a identidade deste turno. Recupere a mesma operação.');
  if (request.action !== 'maintain') {
    const reason = payload.endReason;
    const expected = request.endReason!;
    if (payload.reasonSource !== 'user_confirmed' || !reason || typeof reason !== 'object'
      || Array.isArray(reason) || reason.kind !== expected.kind
      || reason.note !== expected.note || reason.rangeConfirmed !== expected.rangeConfirmed) {
      throw new Error('O servidor não confirmou o motivo informado. Recupere a mesma operação.');
    }
  }
  return receipt;
}
