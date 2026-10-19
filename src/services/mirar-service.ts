import { activityClient, activityFailure, awaitActivityResponse, confirmActivity, validateActivityId } from './character-activity-service';

export interface MirarStatus { available: boolean; operationId: string | null; weaponId: string | null; mode: string; }

/** Recupera o preparo pago e a arma vinculada após reconexão. */
export async function getMirarStatus(characterId: string): Promise<MirarStatus> {
  validateActivityId(characterId);
  const { data, error } = await activityClient.rpc('get_character_mirar_status', { p_character_id: characterId });
  if (error) throw activityFailure('Não foi possível conferir Mirar.', error);
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Estado de Mirar inválido.');
  return { available: data.available === true,
    operationId: typeof data.operationId === 'string' ? data.operationId : null,
    weaponId: typeof data.weaponId === 'string' ? data.weaponId : null,
    mode: typeof data.mode === 'string' ? data.mode : 'untracked' };
}

/** Confirma Mirar e o débito de 1 PE numa transação; conserva o UUID em caso de resposta incerta. */
export async function confirmMirar(characterId: string, operationId: string, turnKey: string | null, weaponId: string): Promise<void> {
  validateActivityId(characterId); validateActivityId(operationId);
  if (turnKey !== null && !turnKey.startsWith('v2:') && !turnKey.startsWith('manual:'))
    throw new Error('Turno inválido para Mirar.');
  if (!weaponId || weaponId.length > 120) throw new Error('Arma inválida para Mirar.');
  const { data, error } = await awaitActivityResponse(activityClient.rpc('confirm_character_mirar', {
    p_operation_id: operationId, p_character_id: characterId, p_expected_turn_key: turnKey, p_weapon_id: weaponId,
  }));
  if (error) throw Object.assign(activityFailure('Mirar não registrado.', error), {
    serverRejected: ['22023', '42501', '55004', '23505'].includes(error.code ?? ''),
  });
  const receipt = confirmActivity(data, characterId, operationId);
  const payload = receipt.payload;
  if (receipt.status !== 'confirmed' || !payload || typeof payload !== 'object' || Array.isArray(payload)
    || payload.kind !== 'mirar' || payload.lethalShotPrepaid !== true || payload.peCost !== 1) {
    throw new Error('Mirar e o gasto de PE não foram confirmados no histórico.');
  }
  window.dispatchEvent(new CustomEvent('character-server-updated', { detail: characterId }));
}

/** Encerra um preparo vencido sem estornar o PE já gasto; repetir é seguro. */
export async function dismissMirar(characterId: string, aimOperationId: string): Promise<void> {
  validateActivityId(characterId); validateActivityId(aimOperationId);
  const { data, error } = await awaitActivityResponse(activityClient.rpc('dismiss_character_mirar', {
    p_character_id: characterId, p_aim_operation_id: aimOperationId,
  }));
  if (error) throw activityFailure('Não foi possível encerrar Mirar.', error);
  const receipt = confirmActivity(data, characterId, aimOperationId);
  if (!receipt.payload || typeof receipt.payload !== 'object' || Array.isArray(receipt.payload)
    || receipt.payload.kind !== 'mirar' || !receipt.payload.dismissedAt)
    throw new Error('O encerramento de Mirar não foi confirmado pelo servidor.');
  window.dispatchEvent(new CustomEvent('character-server-updated', { detail: characterId }));
}
