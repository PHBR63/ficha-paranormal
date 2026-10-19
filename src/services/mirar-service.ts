import { activityClient, activityFailure, awaitActivityResponse, confirmActivity, validateActivityId } from './character-activity-service';

/** Lê a disponibilidade do registro para reconexão; o servidor decide o prazo. */
export async function getMirarStatus(characterId: string): Promise<boolean> {
  validateActivityId(characterId);
  const { data, error } = await activityClient.rpc('get_character_mirar_status', { p_character_id: characterId });
  if (error) throw activityFailure('Não foi possível conferir Mirar.', error);
  return !!data && typeof data === 'object' && !Array.isArray(data) && data.available === true;
}

/** Confirma Mirar e o débito de 1 PE numa transação; conserva o UUID em caso de resposta incerta. */
export async function confirmMirar(characterId: string, operationId: string, turnKey: string, weaponId: string): Promise<void> {
  validateActivityId(characterId); validateActivityId(operationId);
  if (!turnKey.startsWith('v2:') || !weaponId || weaponId.length > 120) throw new Error('Turno ou arma inválidos para Mirar.');
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
