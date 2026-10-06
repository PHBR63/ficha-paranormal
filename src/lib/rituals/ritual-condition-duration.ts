import type { RitualEffect } from './legacy-exports';

type ConditionDuration = NonNullable<RitualEffect['appliesConditions']>[number];

/** Converte a duração do catálogo em rodadas; cena/sustentação continuam manuais. */
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
