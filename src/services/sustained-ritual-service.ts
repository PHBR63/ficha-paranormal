import { activityClient, activityFailure, activityJson, awaitActivityResponse, confirmActivity, validateActivityId } from './character-activity-service';
import type { Json } from '@/integrations/supabase/types';

export interface SustainedSnapshot {
  id: string; ritual_id: string; turns_active: number | null; pe_spent_total: number | null;
  sustain_config: Json; is_concentrating: boolean | null;
}
export interface SustainedActionRequest {
  operationId: string; characterId: string; action: 'maintain' | 'end' | 'end_all';
  expected: SustainedSnapshot[]; expectedPE: number | null;
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
  if (request.action === 'maintain' && (!Number.isSafeInteger(request.expectedPE) || request.expectedPE! < request.expected.length)) {
    throw new Error('PE insuficiente para manter os rituais selecionados. Nenhuma cobrança foi enviada.');
  }
  const { data, error } = await awaitActivityResponse(activityClient.rpc('confirm_sustained_ritual_action', {
    p_operation_id: request.operationId, p_character_id: request.characterId, p_action: request.action,
    p_expected: activityJson(request.expected), p_expected_pe: request.expectedPE,
  }));
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
  return receipt;
}
