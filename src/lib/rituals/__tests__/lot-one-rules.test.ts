import { describe, expect, it, vi } from 'vitest';
import { getRitualById, getRitualEffect, calculateRitualCost } from '../ritual-registry';
import { getActiveRitualEffect } from '../legacy-exports';
import { prepareConditionTurn, conditionsAfterTurn } from '@/lib/rules/condition-turn';
import { getConditionById } from '@/lib/conditions/condition-definitions';
import { rollParanormalCost } from '../paranormal-cost';
import type { BonusSummary } from '@/hooks/useCharacterBonusSummary';

describe('Livro Base — correções do inventário, pp.137 e 310', () => {
  it('Manancial Verdadeiro não herda uma rolagem adicional de PV temporários', () => {
    expect(getActiveRitualEffect('consumir-manancial', ['Verdadeiro'])?.tempHP).toBeUndefined();
    expect(getActiveRitualEffect('consumir-manancial', ['Verdadeiro'])?.summary).toContain('soma do dano efetivamente causado');
  });
  it.each([['base',6,6,3],['discente',4,.75,6],['verdadeiro',13,6,10]] as const)('Paradoxo %s preserva dano, raio, resistência e custo oficiais', (form,count,radius,cost) => {
    const ritual = getRitualById('paradoxo')!;
    const effect = getRitualEffect(ritual,form)!;
    expect(effect.damage).toEqual({ diceCount: count, diceType: 6, damageType: 'morte' });
    expect(effect.areaEffect?.radius).toBe(radius);
    expect(effect.resistance).toEqual({ type: 'fortitude', effect: 'reduz_metade' });
    expect(calculateRitualCost(ritual, form === 'base' ? [] : [form === 'discente' ? 'Discente' : 'Verdadeiro'])).toBe(cost);
    expect(ritual.description).not.toMatch(/dissipa/i);
  });
  it('a ficha legada recebe a resistência e os avisos de movimento/exposição e PV zero', () => {
    expect(getActiveRitualEffect('paradoxo', ['Discente'])?.summary).toContain('uma vez por rodada');
    expect(getActiveRitualEffect('paradoxo', ['Verdadeiro'])?.summary).toContain('0 PV');
    expect(getActiveRitualEffect('paradoxo', [])?.resistance?.type).toBe('fortitude');
    expect(getRitualById('paradoxo')?.enhancements?.find(form => form.name === 'Verdadeiro')?.circleReq).toBe(4);
  });
  it.each([1,2,3,4,5,6])('Confuso resolve resultado %i e conserva condições personalizadas', die => {
    const original = [{ id: 'confuso', name: 'Confuso', turnsRemaining: null, addedAt: '2026-10-07' },
      { id: 'personalizada', name: 'Minha condição', turnsRemaining: null, addedAt: '2026-10-07' }];
    const result = prepareConditionTurn(original,1,0,() => (die-.5)/6);
    expect(result.effects).toHaveLength(0);
    expect(result.notices[0]).toContain(`d6 = ${die}`);
    expect(result.removeIndexes).toEqual(die === 6 ? [0] : []);
    expect(conditionsAfterTurn(original,result)).toEqual(die === 6 ? [original[1]] : original);
    if (die === 1) expect(result.notices[0]).toContain('direção d8');
    if (die === 2 || die === 3) expect(result.notices[0]).toContain('Não pode fazer ações');
    if (die === 4 || die === 5) expect(result.notices[0]).toContain('mais próximo');
    expect(getConditionById('confuso')?.removal).not.toContain('DT 15');
  });
  it('Ocultismo usa Intelecto, treinamento e bônus SUE uma única vez; Medo não rola', () => {
    const random = vi.spyOn(Math, 'random').mockReturnValue(.5);
    const summary = { skills: { ocultismo: { total: 2 } } } as unknown as BonusSummary;
    const result = rollParanormalCost('morte',2,{ ocultismo: 1 },summary,[]);
    expect(result.test?.dice).toEqual([11,11]);
    expect(result.test?.total).toBe(18);
    random.mockClear();
    expect(rollParanormalCost('medo',2,{},summary,[])).toEqual({ source: 'system_roll', element: 'medo' });
    expect(random).not.toHaveBeenCalled(); random.mockRestore();
  });
});
