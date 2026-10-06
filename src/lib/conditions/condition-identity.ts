import { CONDITIONS, type Condition } from './condition-definitions';

/** Reconhece apenas IDs e nomes do catálogo; identidades desconhecidas ficam intactas. */
export function resolveConditionId(value: string): string {
  const key = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const requested = key(value);
  const match = Object.entries(CONDITIONS).find(([id, condition]) => key(id) === requested || key(condition.name) === requested);
  return match?.[0] ?? value;
}

/** Apresentação manual mantém condições externas visíveis, sem inventar efeitos automáticos. */
export function getConditionPresentation(id: string, name: string): Omit<Condition, 'turnsRemaining'> {
  return CONDITIONS[resolveConditionId(id)] ?? {
    id,
    name: name || id,
    icon: '⚠️',
    color: 'text-muted-foreground',
    effect: 'Condição não reconhecida. Efeitos devem ser conferidos e aplicados manualmente.',
    description: 'Condição preservada do registro original.',
  };
}
