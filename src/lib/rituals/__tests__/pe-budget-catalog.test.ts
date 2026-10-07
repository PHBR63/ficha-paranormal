import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { getAllRituals } from '../ritual-registry';

describe('catálogo de custo mínimo do orçamento', () => {
  it('mantém todos os IDs atuais e os custos básicos por círculo no servidor', () => {
    const migration = readFileSync('supabase/migrations/20261007190000_ritual_pe_turn_budget.sql', 'utf8');
    const seed = new Map([...migration.matchAll(/\('([^']+)',(\d+)\)/g)].map(match => [match[1], Number(match[2])]));
    const costs = [0, 1, 3, 6, 10];
    for (const ritual of getAllRituals()) expect(seed.get(ritual.id), ritual.id).toBe(costs[ritual.circle]);
    expect(seed.size).toBe(getAllRituals().length);
  });
});
