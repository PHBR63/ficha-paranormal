/** Livro Base v1.3 pp.30,64,78,310. Duração é confirmada pela mesa, nunca pelo relógio. */
export const EXPLOSIVES = {
  granada_fragmentacao: { type: 'fragmentation', name: 'Fragmentação', dice: 8, damage: 'Perfuração', resistance: 'Reflexos', rounds: 0 },
  granada_incendiaria: { type: 'incendiary', name: 'Incendiária', dice: 6, damage: 'Fogo', resistance: 'Reflexos', rounds: 0 },
  granada_atordoamento: { type: 'stun', name: 'Atordoamento', dice: 0, damage: '', resistance: 'Fortitude', rounds: 1 },
  granada_fumaca: { type: 'smoke', name: 'Fumaça', dice: 0, damage: '', resistance: '', rounds: 2 },
  mina_antipessoal: { type: 'mine', name: 'Mina Antipessoal', dice: 12, damage: 'Perfuração', resistance: 'Reflexos', rounds: 0 },
} as const;
export type ExplosiveType = typeof EXPLOSIVES[keyof typeof EXPLOSIVES]['type'];
export function getExplosive(catalogId?: string) { return catalogId ? EXPLOSIVES[catalogId as keyof typeof EXPLOSIVES] : undefined; }
export function getExplosiveByType(type?: string) { return Object.values(EXPLOSIVES).find(entry => entry.type === (type ?? 'fragmentation')); }
