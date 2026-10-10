import { getOcultistRituals } from '@/lib/character-data';
import { getRitualById } from './ritual-registry';

interface RitualLimitCharacter {
  class: string;
  class_track?: string | null;
  nex: number;
  intellect: number;
  rituals?: string[];
  creation_data?: unknown;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

/** Limite comum mais extras do Graduado efetivamente registrados; não inventa aquisições legadas. */
export function getKnownRitualLimit(character: RitualLimitCharacter) {
  const base = getOcultistRituals(character.nex);
  const extras = new Set<string>();
  const creation = character.creation_data;
  if (character.class === 'Ocultista' && character.class_track === 'graduado' &&
      character.nex >= 10 && isRecord(creation) && isRecord(creation.extraRituals)) {
    const ordinary = new Set(Array.isArray(creation.rituals) ? creation.rituals : []);
    const known = new Set(character.rituals || []);
    for (const [source, value] of Object.entries(creation.extraRituals)) {
      if (!Array.isArray(value)) continue;
      const saberCircle = /^saber-([1-4])$/.exec(source);
      const grimoireCircle = /^grimorio-([3-4])$/.exec(source);
      const initialGrimoire = source === 'grimorio-inicial' && character.nex >= 40;
      const circle = saberCircle ? Number(saberCircle[1]) : grimoireCircle && character.nex >= 40 ? Number(grimoireCircle[1]) : 0;
      if (!initialGrimoire && (!circle || circle > base.maxCircle)) continue;
      const capacity = initialGrimoire ? Number.isSafeInteger(character.intellect) ? Math.max(0, character.intellect) : 0 : 1;
      let accepted = 0;
      for (const id of new Set(value)) {
        if (typeof id !== 'string' || !known.has(id) || ordinary.has(id) || extras.has(id)) continue;
        const ritual = getRitualById(id);
        if (!ritual || (initialGrimoire ? ritual.circle > 2 : ritual.circle !== circle)) continue;
        if (accepted >= capacity) break;
        extras.add(id);
        accepted++;
      }
    }
  }
  return { ...base, count: base.count + extras.size, baseCount: base.count, extraCount: extras.size };
}
