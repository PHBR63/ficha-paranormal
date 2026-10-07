import type { DiceRollResult } from '@/lib/dice-roller';
import { diceHistoryEntry } from '@/lib/roll-history-adapter';
import { activityClient, activityFailure, activityJson, awaitActivityResponse, confirmActivity, validateActivityId } from './character-activity-service';

/** Configuração escolhida; o servidor calcula os custos e valida classe, NEX e arma. */
export interface CombatCostSelection {
  weaponId: string;
  specialAttackIncrements: number;
  sneakAttack: boolean;
  lethalShot: boolean;
  techniques: string[];
  lethalCount: number;
  otherPaidBonuses: string[];
}
export interface CombatAttackConfirmation {
  operationId: string;
  expectedPE: number;
  expectedCost: number;
  selection: CombatCostSelection;
  result: DiceRollResult;
}
export type ConfirmCombatAttack = (request: CombatAttackConfirmation) => Promise<boolean>;

/** Confirma ataque/custo/histórico juntos. Repetições devem conservar UUID e contexto. */
export async function confirmCombatAttack(characterId: string, request: CombatAttackConfirmation, expectedTurnKey: string | null): Promise<boolean> {
  validateActivityId(characterId); validateActivityId(request.operationId);
  if (![request.expectedPE, request.expectedCost].every(value => Number.isSafeInteger(value) && value >= 0 && value <= 1000000)) {
    throw new Error('Saldo ou custo inválido. Recarregue a ficha.');
  }
  const { data, error } = await awaitActivityResponse(activityClient.rpc('confirm_character_combat_attack', {
    p_operation_id: request.operationId, p_character_id: characterId,
    p_expected_pe: request.expectedPE, p_expected_cost: request.expectedCost,
    p_expected_turn_key: expectedTurnKey, p_selection: activityJson(request.selection),
    p_payload: activityJson({ entry: { ...diceHistoryEntry(request.result), type: 'attack' }, label: request.result.label, type: 'attack' }),
  }));
  if (error) {
    const failure = activityFailure('Ataque não confirmado.', error);
    // Uma recusa explícita desfaz a transação; erro de rede conserva a intenção.
    throw Object.assign(failure, { serverRejected: ['55002', '40001', '42501', '23505', '22023', '0A000'].includes(error.code ?? '') });
  }
  const receipt = confirmActivity(data, characterId, request.operationId);
  const payload = receipt.payload;
  if (receipt.category !== 'roll' || receipt.status !== 'confirmed' || !payload || typeof payload !== 'object' || Array.isArray(payload) || payload.kind !== 'combat_attack' || payload.peCost !== request.expectedCost) {
    throw new Error('O servidor não confirmou o histórico e o custo do ataque.');
  }
  // Evita um segundo registro pelo callback legado de apresentação.
  request.result.activityOperationId = receipt.operation_id;
  window.dispatchEvent(new CustomEvent('character-server-updated', { detail: characterId }));
  return true;
}
