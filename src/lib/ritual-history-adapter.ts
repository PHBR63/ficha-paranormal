import { ALL_RITUALS, type Ritual } from '@/lib/rituals/legacy-exports';
import type { RitualCastRecord } from '@/components/character/RitualCastHistory';
import type { CharacterActivityEvent } from '@/types/character-activity';
import { describeCharacterActivity } from '@/lib/character-activity-presentation';

/** Reconstrói os cartões a partir do registro confirmado, sem recalcular custos históricos. */
export function activityRitualEntries(events: CharacterActivityEvent[], characterId?: string): RitualCastRecord[] {
  return events.flatMap(event => {
    if ((characterId && event.character_id !== characterId) || event.category !== 'ritual' || !event.payload || typeof event.payload !== 'object' || Array.isArray(event.payload)) return [];
    const payload = event.payload;
    if (typeof payload.ritualId !== 'string' || !payload.ritualId.trim()) return [];
    if (![payload.peCost, payload.peBefore, payload.peAfter].every(value => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0)) return [];
    const timestamp = new Date(event.created_at);
    if (!Number.isFinite(timestamp.getTime())) return [];
    const catalog = ALL_RITUALS.find(item => item.id === payload.ritualId);
    // O catálogo pode mudar; o registro continua exibindo nome e PE confirmados naquela conjuração.
    const name = typeof payload.ritualName === 'string' && payload.ritualName.trim() ? payload.ritualName : catalog?.name ?? payload.ritualId;
    const element = typeof payload.ritualElement === 'string' && ['sangue', 'morte', 'conhecimento', 'energia', 'medo'].includes(payload.ritualElement)
      ? payload.ritualElement as Ritual['element'] : catalog?.element ?? null;
    const circle = typeof payload.ritualCircle === 'number' && Number.isInteger(payload.ritualCircle) && payload.ritualCircle >= 1 && payload.ritualCircle <= 4
      ? payload.ritualCircle : catalog?.circle ?? null;
    const ritual: RitualCastRecord['ritual'] = { ...catalog, id: payload.ritualId, name, element, circle, cost: payload.peCost as number };
    return [{
      id: event.id, ritual, unknownRitual: !catalog, peCost: payload.peCost as number,
      enhancements: Array.isArray(payload.enhancements) ? payload.enhancements.filter((value): value is string => typeof value === 'string') : [],
      timestamp, peBeforeCast: payload.peBefore as number, peAfterCast: payload.peAfter as number,
      // Registros antigos sem resultado continuam sem uma conclusão inventada.
      resolutionDescription: typeof payload.castingOutcome === 'string' ? describeCharacterActivity(event) : undefined,
    }];
  });
}
