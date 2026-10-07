import { activityClient, activityFailure, awaitActivityResponse, confirmActivity, validateActivityId } from './character-activity-service';
import type { CharacterActivityEvent } from '@/types/character-activity';

export interface TemporaryResource { id: string; resource: 'hp' | 'pe'; remaining: number; source_name: string; campaign_id: string | null; damage_types?: string[] | null }
export interface TemporaryGrant { operationId: string; resource: 'hp' | 'pe'; amount: number; source: string; cumulative: boolean }
/** Uma resposta com identidade correta ainda precisa confirmar tipo e conclusão da operação. */
function confirmedTemporary(receipt: CharacterActivityEvent, kind: string) {
  const payload = receipt.payload;
  if (receipt.status !== 'confirmed' || receipt.category !== 'application' || !payload || typeof payload !== 'object'
    || Array.isArray(payload) || payload.kind !== kind) throw new Error('O servidor não confirmou esta alteração temporária. Recupere a mesma operação.');
  return receipt;
}
/** Lê reservatórios autorizados; saldo inválido nunca é presumido como zero. */
export async function listTemporaryResources(characterId: string): Promise<TemporaryResource[]> {
  validateActivityId(characterId);
  const { data, error } = await awaitActivityResponse(activityClient.rpc('list_character_temporary_resources', { p_character_id: characterId }));
  if (error) throw activityFailure('Não foi possível conferir recursos temporários.', error);
  if (!Array.isArray(data) || data.some(item => !item || typeof item !== 'object' || Array.isArray(item)
    || !['hp','pe'].includes(String(item.resource)) || typeof item.remaining !== 'number' || !Number.isSafeInteger(item.remaining)
    || item.remaining < 0 || typeof item.id !== 'string' || typeof item.source_name !== 'string')) throw new Error('Reservatórios não confirmados pelo servidor.');
  return data as unknown as TemporaryResource[];
}
/** Registra concessão manual explícita; fonte repetida usa o maior valor salvo, salvo acúmulo declarado. */
export async function confirmTemporaryGrant(characterId: string, request: TemporaryGrant) {
  validateActivityId(characterId); validateActivityId(request.operationId);
  if (!Number.isSafeInteger(request.amount) || request.amount < 1 || request.amount > 1000000 || !request.source.trim() || request.source.length > 150) throw new Error('Informe fonte e quantidade válidas.');
  const { data, error } = await awaitActivityResponse(activityClient.rpc('confirm_temporary_resource', {
    p_operation_id: request.operationId, p_character_id: characterId, p_resource: request.resource,
    p_source_key: request.source.trim().toLowerCase(), p_source_name: request.source.trim(), p_amount: request.amount, p_cumulative: request.cumulative,
  }));
  if (error) throw Object.assign(activityFailure('Concessão temporária não confirmada.', error), { serverRejected: ['40001', '42501', '23505', '22023'].includes(error.code ?? '') });
  return confirmedTemporary(confirmActivity(data, characterId, request.operationId), 'temporary_resource');
}
/** Encerra uma fonte com comparação do saldo; não mexe em PV/PE máximos. */
export async function endTemporaryResource(characterId: string, operationId: string, resource: TemporaryResource) {
  validateActivityId(characterId); validateActivityId(operationId); validateActivityId(resource.id);
  const { data, error } = await awaitActivityResponse(activityClient.rpc('end_temporary_resource', {
    p_operation_id: operationId, p_character_id: characterId, p_resource_id: resource.id, p_expected: resource.remaining,
  }));
  if (error) throw Object.assign(activityFailure('Encerramento temporário não confirmado.', error), { serverRejected: ['40001', '42501', '23505', '22023'].includes(error.code ?? '') });
  return confirmedTemporary(confirmActivity(data, characterId, operationId), 'temporary_end');
}
