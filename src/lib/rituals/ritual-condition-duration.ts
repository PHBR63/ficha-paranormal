import type { RitualEffect } from './legacy-exports';
import type { EffectDuration } from '@/types/effect-duration';

type ConditionDuration = NonNullable<RitualEffect['appliesConditions']>[number];

/** Preserva a categoria: null no contador nunca significa automaticamente "cena". */
export function getRitualConditionDuration(condition: ConditionDuration): EffectDuration {
  if (typeof condition.duration === 'number' || condition.duration === 'rodada') return 'rodadas';
  return condition.duration ?? 'manual';
}

/** Converte a duração do catálogo em rodadas, sem perder sua categoria. */
export function getRitualConditionTurns(condition: ConditionDuration): number | null {
  if (typeof condition.duration === 'number') return condition.duration;
  return condition.duration === 'rodada' ? (condition.turnsCount ?? 1) : null;
}

/** Apresenta o mesmo prazo enviado ao servidor, sem confundir número com duração indefinida. */
export function formatRitualConditionDuration(condition: ConditionDuration): string {
  const turns = getRitualConditionTurns(condition);
  if (turns !== null) return `${turns} rodada${turns === 1 ? '' : 's'}`;
  return typeof condition.duration === 'string' ? condition.duration : 'Duração manual';
}
