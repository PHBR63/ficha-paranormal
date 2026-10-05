import { afterEach, describe, expect, it, vi } from 'vitest';
import { rollSkillTest } from '../dice-roller';
import { getConditionTestDicePenalty, resolveConditionTestAttribute } from '../conditions/condition-test-penalty';

afterEach(() => vi.restoreAllMocks());
describe('Rolagem usada pelos modais, com condições do personagem', () => {
  it.each([
    { attribute: 2, conditions: ['Fraco'], count: 1, disadvantage: false },
    { attribute: -1, conditions: [], count: 3, disadvantage: true },
    { attribute: 0, conditions: [], count: 2, disadvantage: true },
    { attribute: 2, conditions: ['Machucado'], count: 2, disadvantage: false },
    { attribute: 3, conditions: ['exausto', 'fraco'], count: 1, disadvantage: false },
  ])('atributo $attribute e condições $conditions: $count dados', ({ attribute, conditions, count, disadvantage }) => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const result = rollSkillTest({
      attributeValue: attribute,
      skillBonus: 5,
      dicePenalty: getConditionTestDicePenalty(conditions, 'strength', 'atletismo'),
    });
    expect(result.dice).toHaveLength(count);
    expect(result.isDisadvantage).toBe(disadvantage);
    expect(result.total).toBe(16); // 11 no dado + treinamento 5, sem subtrair penalidade numérica.
  });
  it('Caído usa o pior dado no ataque corpo a corpo e preserva treinamento', () => {
    vi.spyOn(Math, 'random').mockReturnValueOnce(0.8).mockReturnValueOnce(0.2).mockReturnValueOnce(0.5).mockReturnValueOnce(0.9);
    const result = rollSkillTest({
      attributeValue: 2,
      skillBonus: 5,
      dicePenalty: getConditionTestDicePenalty(['Caído'], 'strength', 'luta', 'melee'),
    });
    expect(result.dice).toEqual([17, 5, 11, 19]);
    expect(result.keptDice).toBe(5);
    expect(result.total).toBe(10);
    expect(result.isDisadvantage).toBe(true);
    expect(getConditionTestDicePenalty(['Caído'], 'agility', 'pontaria', 'ranged')).toBe(0);
  });
  it('Surdo modifica dados de Iniciativa, sem modificar outras perícias', () => {
    expect(getConditionTestDicePenalty(['Surdo'], 'agility', 'Iniciativa')).toBe(2);
    expect(getConditionTestDicePenalty(['Surdo'], 'agility', 'Acrobacia')).toBe(0);
  });
  it('resolve teste direto de atributo e preserva troca explícita', () => {
    expect(resolveConditionTestAttribute('Força', {})).toBe('strength');
    expect(resolveConditionTestAttribute('strength', {})).toBe('strength');
    expect(resolveConditionTestAttribute('Atletismo', { atletismo: 'strength' }, 'intellect')).toBe('intellect');
  });
});
