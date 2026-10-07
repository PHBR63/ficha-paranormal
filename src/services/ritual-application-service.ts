import { activityClient, activityContextArgs, activityFailure, activityJson, awaitActivityResponse, confirmActivity, validateActivityId } from './character-activity-service';
import type { ActivityContext, ActivityPayload, ApplyCharacterEffectInput, CharacterActivityEvent } from '@/types/character-activity';

export interface CastCharacterRitualInput extends ActivityContext {
  characterId: string; operationId: string; expectedPE: number; peCost: number; payload: ActivityPayload;
}
/** Débito e registro acontecem na mesma transação; cancelar depois não estorna PE. */
export async function castCharacterRitual(input: CastCharacterRitualInput): Promise<CharacterActivityEvent> {
  validateActivityId(input.characterId); validateActivityId(input.operationId);
  if (!Number.isSafeInteger(input.expectedPE) || !Number.isSafeInteger(input.peCost) || input.peCost < 0 || input.expectedPE < input.peCost) throw new Error('Saldo ou custo de PE inválido ou insuficiente.');
  const { data, error } = await awaitActivityResponse(activityClient.rpc('cast_character_ritual', {
    p_character_id: input.characterId, p_operation_id: input.operationId, p_expected_pe: input.expectedPE,
    p_pe_cost: input.peCost, p_payload: activityJson(input.payload), ...activityContextArgs(input),
  }));
  if (error) throw activityFailure('A conjuração não foi confirmada.', error);
  const event = confirmActivity(data, input.characterId, input.operationId);
  if (input.payload.concentration) {
    const payload = event.payload;
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)
      || payload.concentrationResolution !== 'server_checked'
      || !['passed_concentration', 'failed_concentration'].includes(String(payload.castingOutcome))
      || payload.peAfter !== input.expectedPE - input.peCost) {
      throw new Error('O servidor não confirmou a resolução da concentração. Recupere a mesma conjuração.');
    }
  }
  return event;
}
/** Só retorna após confirmação. Repetir o mesmo operationId não duplica efeitos. */
export async function applyCharacterEffect(input: ApplyCharacterEffectInput): Promise<CharacterActivityEvent> {
  validateActivityId(input.characterId); validateActivityId(input.operationId);
  if (input.castEventId) validateActivityId(input.castEventId);
  const { data, error } = await activityClient.rpc('apply_character_effect', {
    p_operation_id: input.operationId, p_character_id: input.characterId, p_kind: input.kind,
    p_value: activityJson(input.value), p_expected: activityJson(input.expected), p_cast_event_id: input.castEventId,
    ...activityContextArgs(input),
  });
  if (error) throw activityFailure('O efeito não foi aplicado.', error);
  return confirmActivity(data, input.characterId, input.operationId);
}
