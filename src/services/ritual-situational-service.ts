import { z } from 'zod';
import { activityClient, activityFailure, activityJson, awaitActivityResponse, confirmActivity, validateActivityId } from './character-activity-service';
import type { RitualSituationalContext } from '@/lib/rituals/situational-requirements';

const contextSchema = z.object({
  characterId: z.string().uuid(),
  ritualId: z.string().min(1), execution: z.string().min(1), source: z.enum(['memorized', 'grimoire', 'unverified']),
  grimoireItems: z.array(z.object({ id: z.string().min(1), name: z.string().min(1) })),
  bladeEligible: z.boolean(), bladeAvailable: z.boolean(), bladeKnowledge: z.enum(['confirmed', 'absent', 'unverified']), canReview: z.boolean(),
});
export interface RitualKnowledgeReview { source: 'memorized' | 'grimoire'; knownBeforeBlade: boolean; note: string }
const reviewSchema = z.object({ source: z.enum(['memorized', 'grimoire']), knownBeforeBlade: z.boolean(), note: z.string().trim().min(10).max(500) });

/** Consulta somente o contexto autorizado; rejeita resposta de outro ritual ou contrato incompleto. */
export async function getRitualSituationalContext(characterId: string, ritualId: string): Promise<RitualSituationalContext> {
  validateActivityId(characterId);
  if (!ritualId || ritualId.length > 150) throw new Error('Ritual inválido. Reabra sua seleção.');
  const { data, error } = await awaitActivityResponse(activityClient.rpc('get_character_ritual_situational', { p_character_id: characterId, p_ritual_id: ritualId }));
  if (error) throw activityFailure('Não foi possível conferir os requisitos do ritual.', error);
  const result = contextSchema.safeParse(data);
  if (!result.success || result.data.ritualId !== ritualId || result.data.characterId !== characterId) throw new Error('O servidor não confirmou os requisitos deste ritual e desta ficha.');
  return result.data as RitualSituationalContext;
}

/** Registra a conferência histórica sem consumir recursos. A autorização é conferida no servidor. */
export async function confirmRitualKnowledge(characterId: string, ritualId: string, operationId: string, review: RitualKnowledgeReview) {
  validateActivityId(characterId); validateActivityId(operationId);
  const checked = reviewSchema.safeParse(review);
  if (!checked.success || !ritualId || ritualId.length > 150) throw new Error('Confira o ritual, a fonte e a justificativa em 10 a 500 caracteres.');
  const { data, error } = await awaitActivityResponse(activityClient.rpc('confirm_character_ritual_knowledge', {
    p_character_id: characterId, p_ritual_id: ritualId, p_operation_id: operationId, p_review: activityJson(checked.data),
  }));
  if (error) throw activityFailure('A conferência histórica não foi confirmada.', error);
  const receipt = confirmActivity(data, characterId, operationId);
  const payload = receipt.payload;
  if (receipt.category !== 'application' || !payload || typeof payload !== 'object' || Array.isArray(payload)
    || payload.kind !== 'ritual_knowledge' || payload.ritualId !== ritualId
    || payload.source !== checked.data.source || payload.knownBeforeBlade !== checked.data.knownBeforeBlade) {
    throw new Error('O servidor não confirmou esta conferência histórica. Recupere a mesma operação.');
  }
  return receipt;
}
