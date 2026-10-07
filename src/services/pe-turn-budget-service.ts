import { activityClient, activityFailure, awaitActivityResponse, confirmActivity, validateActivityId } from './character-activity-service';

export interface PETurnBudget {
  mode: 'manual' | 'combat' | 'untracked'; tracked: boolean; key: string | null;
  number?: number; round?: number; spent: number; limit: number; ritualLimit: number;
  remaining: number; ritualRemaining: number;
}

/** Consulta o orçamento confirmado, sem estimar gasto por navegador. */
export async function getPETurnBudget(characterId: string): Promise<PETurnBudget> {
  validateActivityId(characterId);
  const { data, error } = await awaitActivityResponse(activityClient.rpc('get_character_pe_budget', { p_character_id: characterId }));
  if (error) throw activityFailure('Não foi possível conferir o orçamento de PE.', error);
  if (!data || typeof data !== 'object' || Array.isArray(data)
    || !['manual', 'combat', 'untracked'].includes(String(data.mode)) || typeof data.tracked !== 'boolean'
    || (data.tracked ? typeof data.key !== 'string' : data.key !== null)
    || data.tracked !== (data.mode !== 'untracked')
    || (data.mode === 'manual' && (!Number.isSafeInteger(data.number) || Number(data.number) < 1))
    || (data.mode === 'combat' && (!Number.isSafeInteger(data.round) || Number(data.round) < 1))
    || ['spent', 'limit', 'ritualLimit', 'remaining', 'ritualRemaining'].some(key => !Number.isSafeInteger(data[key]) || Number(data[key]) < 0)) {
    throw new Error('O servidor não confirmou o orçamento de PE.');
  }
  return data as unknown as PETurnBudget;
}

/** Pausa somente o relógio manual; mantém saldo, efeitos e histórico. */
export async function pauseManualTurn(characterId: string, operationId: string, expectedTurn: number) {
  validateActivityId(characterId); validateActivityId(operationId);
  if (!Number.isSafeInteger(expectedTurn) || expectedTurn < 1) throw new Error('Turno manual inválido.');
  const { data, error } = await awaitActivityResponse(activityClient.rpc('pause_character_manual_turn', {
    p_character_id: characterId, p_operation_id: operationId, p_expected_turn: expectedTurn,
  }));
  if (error) throw Object.assign(activityFailure('A pausa não foi confirmada.', error), {
    serverRejected: ['40001', '42501', '23505', '22023'].includes(error.code ?? ''),
  });
  const receipt = confirmActivity(data, characterId, operationId);
  const payload = receipt.payload;
  if (receipt.status !== 'confirmed' || !payload || typeof payload !== 'object' || Array.isArray(payload)
    || payload.kind !== 'manual_turn_pause' || payload.turnNumber !== expectedTurn) {
    throw new Error('O servidor não confirmou a pausa. Recupere a mesma operação.');
  }
  return receipt;
}
