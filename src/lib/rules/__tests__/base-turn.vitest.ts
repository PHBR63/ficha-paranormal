import { describe, expect, it } from 'vitest';
import { conditionsAfterTurn, parseRecurringDamage, prepareConditionTurn, validateTurnResolution } from '../condition-turn';
import { getNexLevel } from '../nex-progression';
import { calculateBaseHP, calculateBasePE, calculateBaseSAN } from '@/lib/rules-engine/helpers/class-stats';
import { checkAutoConditions } from '@/lib/game-engine';
import { BASE_RULE_COVERAGE, filterBaseRuleCoverage } from '../base-rule-coverage';
import type { ActiveCondition } from '@/components/character/ConditionManager';

const condition = (id: string, params?: ActiveCondition['params']): ActiveCondition => ({ id, name: id, turnsRemaining: null, addedAt: '2026-10-06', params });
describe('Livro Base — situações de início de turno', () => {
  it('Sangrando não recebe treinamento; conserva 20 personalizado e estabiliza apenas no sucesso', () => {
    const failed = prepareConditionTurn([condition('sangrando')], 1, -1, () => .999);
    expect(failed.bleedingTests[0]).toMatchObject({ kept: 20, total: 19, passed: false });
    expect(failed.effects[0]).toMatchObject({ rolled: 6, finalAmount: 6, ignoresResistance: true });
    expect(failed.removeIndexes).toEqual([]);
    const passed = prepareConditionTurn([condition('sangrando')], 1, 0, () => .999);
    expect(passed.removeIndexes).toEqual([0]);
    expect(passed.effects).toEqual([]);
  });
  it('Vigor zero seleciona o menor dado e penalidade de dados não vira penalidade no total', () => {
    const values = [.999, 0, .5]; let index = 0;
    const result = prepareConditionTurn([condition('sangrando')], 0, 0, () => values[index++]);
    expect(result.bleedingTests[0]).toMatchObject({ dice: [20, 1], kept: 1, total: 1 });
  });
  it('veneno 2d6+3 sorteia dois dados; desconhecidos e seus metadados permanecem', () => {
    const original = [condition('envenenado', { poisonDamage: '2d6+3' }), condition('caseira'), condition('morrendo')];
    const result = prepareConditionTurn(original, 2, 0, () => .999);
    expect(result.effects[0]).toMatchObject({ dice: [6, 6], rolled: 15 });
    expect(conditionsAfterTurn(original, result)).toEqual(original);
    expect(result.notices.join(' ')).toContain('cumulativa');
  });
  it('Em Chamas usa 1d6 e RD reduz somente dano permitido', () => {
    const result = prepareConditionTurn([condition('em-chamas')], 2, 0, () => .5);
    expect(result.effects[0].rolled).toBe(4);
    result.effects[0].finalAmount = 2;
    expect(validateTurnResolution(result)).toBe(2);
    const bleeding = prepareConditionTurn([condition('sangrando')], 1, 0, () => 0);
    bleeding.effects[0].finalAmount = 0;
    expect(() => validateTurnResolution(bleeding)).toThrow('RD');
  });
  it.each(['2d6oops', '100d6', '2d1000', '-3', 'Infinity'])('rejeita fórmula %s sem inventar resultado', formula => {
    expect(() => parseRecurringDamage(formula)).toThrow();
  });
  it('não presume dano padrão de veneno', () => {
    const result = prepareConditionTurn([condition('envenenado')], 1);
    expect(result.effects).toEqual([]); expect(result.notices).toHaveLength(1);
  });
  it('PV zero inicia Morrendo uma vez; cura não estabiliza; limite de Perturbado é estrito', () => {
    expect(checkAutoConditions(0, 20, 30, 30, []).conditionsToAdd).toEqual(['inconsciente', 'morrendo']);
    expect(checkAutoConditions(0, 20, 30, 30, ['inconsciente', 'morrendo']).conditionsToAdd).toEqual([]);
    expect(checkAutoConditions(5, 20, 30, 30, ['morrendo']).conditionsToRemove).not.toContain('morrendo');
    expect(checkAutoConditions(20, 20, 15, 30, []).conditionsToAdd).not.toContain('perturbado');
    expect(checkAutoConditions(20, 20, 14, 30, []).conditionsToAdd).toContain('perturbado');
  });
});
describe('Progressão conferida e cobertura', () => {
  it.each([[5,1],[10,2],[95,19],[99,20]])('NEX %i tem %i patamares', (nex, level) => expect(getNexLevel(nex)).toBe(level));
  it('soma atributos em todos os patamares, inclusive NEX 99', () => {
    expect(calculateBaseHP('Combatente', 10, 2)).toBe(28);
    expect(calculateBasePE('Combatente', 10, 3)).toBe(10);
    expect(calculateBaseHP('Combatente', 99, 2)).toBe(136);
    expect(calculateBasePE('Combatente', 99, 3)).toBe(100);
    expect(calculateBaseSAN('Combatente', 99)).toBe(69);
  });
  it('não apresenta famílias manuais como certificadas e permite filtros sem acento', () => {
    expect(new Set(BASE_RULE_COVERAGE.map(rule => rule.id)).size).toBe(BASE_RULE_COVERAGE.length);
    expect(filterBaseRuleCoverage('sangrando')[0].status).toBe('partial');
    expect(filterBaseRuleCoverage('investigacao', 'manual').length).toBeGreaterThan(0);
    expect(filterBaseRuleCoverage('', 'missing').some(rule => rule.id === 'temporary')).toBe(true);
  });
});
