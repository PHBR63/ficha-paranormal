import type { DiceRollResult } from '@/lib/dice-roller';
import { attackCanRollDamage, parseConcealmentResult, type ConcealmentLevel } from '@/lib/attack-concealment';
import { diceHistoryEntry } from '@/lib/roll-history-adapter';
import { parseSneakAttackResult, type SneakAttackDeclaration } from '@/lib/sneak-attack-context';
import { activityClient, activityFailure, activityJson, awaitActivityResponse, confirmActivity, validateActivityId } from './character-activity-service';

/** Configuração escolhida; o servidor calcula os custos e valida classe, NEX e arma. */
export interface CombatCostSelection {
  weaponId: string;
  targetCharacterId?: string;
  attackIntentId?: string;
  burst?: boolean;
  concealment?: ConcealmentLevel;
  concealmentConfirmed?: boolean;
  totalCover?: boolean;
  attackerBlind?: boolean;
  targetDefense?: number | null;
  specialAttackIncrements: number;
  sneakAttack: boolean;
  sneakAttackContext?: SneakAttackDeclaration;
  lethalShot: boolean;
  mirarDeclared?: boolean;
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
  // O d10 retornado não entra no pedido de recuperação: seu hash conserva a intenção original.
  const entry = diceHistoryEntry(request.result);
  delete entry.concealmentResult; delete entry.sneakAttackResult; delete entry.success; delete entry.targetDT;
  const { data, error } = await awaitActivityResponse(activityClient.rpc('confirm_character_combat_attack', {
    p_operation_id: request.operationId, p_character_id: characterId,
    p_expected_pe: request.expectedPE, p_expected_cost: request.expectedCost,
    p_expected_turn_key: expectedTurnKey, p_selection: activityJson(request.selection),
    p_payload: activityJson({ entry: { ...entry, type: 'attack' }, label: request.result.label, type: 'attack', weaponBurst: request.result.weaponBurst, attackContext: request.result.attackContext }),
  }));
  if (error) {
    // Traduz somente esta recusa conhecida; outras mensagens do banco permanecem ocultas.
    const failure = error.code === '22023' && error.message === 'Ataque Furtivo já aplicado nesta rodada ou turno.'
      ? new Error('Ataque não confirmado. Ataque Furtivo já foi usado nesta rodada ou turno. Nenhum PE foi cobrado; aguarde o próximo turno para ativá-lo novamente.')
      : error.code === '22023' && error.message === 'Mirar exige Pontaria treinada.'
        ? new Error('Ataque não confirmado. Mirar exige Pontaria treinada na ficha. Nenhum PE foi cobrado.')
        : activityFailure('Ataque não confirmado.', error);
    // Uma recusa explícita desfaz a transação; erro de rede conserva a intenção.
    throw Object.assign(failure, { serverRejected: ['55002', '55004', '40001', '42501', '23505', '22023', '0A000'].includes(error.code ?? '') });
  }
  const receipt = confirmActivity(data, characterId, request.operationId);
  const payload = receipt.payload;
  if (receipt.category !== 'roll' || receipt.status !== 'confirmed' || !payload || typeof payload !== 'object' || Array.isArray(payload) || payload.kind !== 'combat_attack') {
    throw new Error('O servidor não confirmou o histórico e o custo do ataque.');
  }
  // Evita um segundo registro pelo callback legado de apresentação.
  if (request.selection.concealment !== undefined) request.result.concealmentResult = parseConcealmentResult(payload.concealmentResult);
  const sneak = request.selection.sneakAttack
    ? parseSneakAttackResult(payload.sneakAttackResult, request.selection.sneakAttackContext) : null;
  const expectedActualCost = request.expectedCost - (sneak && !sneak.applied ? 1 : 0);
  if (payload.peCost !== expectedActualCost || (sneak &&
    (request.selection.targetDefense === null || request.selection.targetDefense === undefined
      || sneak.roundLimitChecked !== (expectedTurnKey !== null)
      || sneak.applied !== attackCanRollDamage(request.result, request.selection.targetDefense)))) {
    throw new Error('O servidor não confirmou o acerto e o custo do Ataque Furtivo.');
  }
  if (sneak) request.result.sneakAttackResult = sneak;
  request.result.activityOperationId = receipt.operation_id;
  window.dispatchEvent(new CustomEvent('character-server-updated', { detail: characterId }));
  return true;
}
