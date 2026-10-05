import { afterEach, describe, expect, it, vi } from 'vitest';
import { getAttributeDicePool } from '../attribute-dice-pool';
import { getConditionEffects } from '../effects/condition-effects-adapter';
import { CONDITIONS as legacyConditions } from '../conditions-data';
import { CONDITIONS, getActionPenalties, getMachucadoDamage, canSpendPEWithConditions, getStackingDefenseModifier } from '../conditions';
import { BASE_CONDITION_TEXT } from '../conditions/base-condition-rules';
import { consolidateEffects, type EffectCalculationContext, type EffectMechanics, type UnifiedEffect } from '../unified-effects-engine';
import { getSUEBonusesForCharacter } from '../rules-engine/sue-bridge';
import { rollAttackWithContext } from '../rules-engine/helpers/attack-with-sue';
import { rollSkillCheckWithContext } from '../rules-engine/helpers/skill-check-with-sue';
import { rollResistanceCheckWithContext } from '../rules-engine/helpers/resistance-check-with-sue';
import { rollInitiativeWithContext } from '../rules-engine/helpers/initiative-with-sue';
import type { CharacterState } from '../rules-engine/types';

const context: EffectCalculationContext = {
  attributes: { strength: 2, agility: 2, vigor: 2, intellect: 2, presence: 2 },
  nex: 5, hpCurrent: 10, hpMax: 20, peCurrent: 5, peMax: 10,
  inCombat: true, isFirstRound: false, currentRound: 2, hasShield: false,
  activeConditions: [], activatedEffects: [],
};

function character(ids: string[] = []): CharacterState {
  return {
    id: 'synthetic-character', name: 'Fixture', characterClass: 'Combatente', nex: 5, origin: 'desconhecida',
    attributes: { ...context.attributes }, skills: { luta: 'treinado', atletismo: 'treinado' },
    classPowers: [], generalPowers: [], paranormalPowers: [], trackAbilities: [], rituals: [], sustainedRituals: [],
    equippedWeapons: [{ id: 'weapon', name: 'Fixture', category: 'simples', damage: '1d6', criticalMargin: 19, criticalMultiplier: 2, attackAttribute: 'strength', attackSkill: 'luta', isEquipped: true }],
    inventory: [], activeConditions: ids.map(conditionId => ({ conditionId, conditionName: conditionId, durationType: 'scene' })),
    hpCurrent: 10, peCurrent: 5, sanCurrent: 10,
  };
}

function effect(id: string, mechanics: EffectMechanics, overrides: Partial<UnifiedEffect> = {}): UnifiedEffect {
  return { id, name: id, source: 'ritual', sourceId: id, sourceName: id, mechanics, isActive: true, isToggleable: false, ...overrides };
}

afterEach(() => vi.restoreAllMocks());

describe('Pool conferido nos livros, sem somar atributo ao total', () => {
  it.each([
    [1, 0, 1, 'highest'], [2, 0, 2, 'highest'], [5, 0, 5, 'highest'],
    [0, 0, 2, 'lowest'], [-1, 0, 3, 'lowest'], [-2, 0, 4, 'lowest'],
    [3, 1, 2, 'highest'], [2, 2, 4, 'lowest'], [1, 2, 3, 'lowest'],
  ])('atributo %s, penalidade %s: %s dados, %s', (attribute, penalty, count, keep) => {
    expect(getAttributeDicePool(Number(attribute), Number(penalty))).toEqual({ count, keep });
  });

  it.each([NaN, Infinity, 1.5])('rejeita atributo inválido %s', attribute => {
    expect(() => getAttributeDicePool(attribute)).toThrow();
  });

  it('ataque usa dois dados com Força 2 e conserva modificador negativo da arma', () => {
    vi.spyOn(Math, 'random').mockReturnValueOnce(0.2).mockReturnValueOnce(0.7);
    const state = character();
    state.equippedWeapons[0].temporaryBuffs = [{ sourceId: 'curse', sourceName: 'Penalidade', bonusAttack: -3 }];
    const result = rollAttackWithContext({ characterState: state, weaponId: 'weapon', targetDefense: 17 });
    expect(result.roll?.diceRolled).toEqual([5, 15]);
    expect(result.roll?.total).toBe(17); // 15 + treino 5 - penalidade 3, sem somar Força.
    expect(result.success).toBe(true);
    expect(result.attackBreakdown.sueBonuses).toContainEqual(expect.objectContaining({ value: -3 }));
  });

  it('mantém a regra da casa: 20 selecionado pode errar uma Defesa alta', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const result = rollAttackWithContext({ characterState: character(), weaponId: 'weapon', targetDefense: 100 });
    expect(result.attackBreakdown.isCritical).toBe(true);
    expect(result.success).toBe(false);
  });

  it('Caído aplica penalidade em dados ao ataque corpo a corpo, sem subtrair dois do total', () => {
    vi.spyOn(Math, 'random').mockReturnValueOnce(0.9).mockReturnValueOnce(0.05).mockReturnValue(0.5);
    const result = rollAttackWithContext({ characterState: character(['caido']), weaponId: 'weapon' });
    expect(result.roll?.diceRolled).toHaveLength(4);
    expect(result.roll?.diceKept).toEqual([2]);
    expect(result.roll?.total).toBe(7);
    expect(result.roll?.isDisadvantage).toBe(true);
  });

  it('Fraco modifica apenas dados de testes físicos, e a fórmula não soma o atributo', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const state = character(['fraco']);
    const physical = rollSkillCheckWithContext({ characterState: state, skill: 'atletismo' });
    const mental = rollSkillCheckWithContext({ characterState: state, skill: 'investigacao' });
    expect(physical.roll?.diceRolled).toHaveLength(1);
    expect(mental.roll?.diceRolled).toHaveLength(2);
    expect(physical.roll?.total).toBe(16);
    expect(physical.breakdown.components.reduce((sum, part) => sum + Number(part.value), 0)).toBe(16);
  });

  it('Reflexos usa treinamento e a penalidade em dados de Desprevenido', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const state = character(['desprevenido']);
    state.skills.reflexos = 'veterano';
    const result = rollResistanceCheckWithContext({ characterState: state, resistance: 'reflexos', dt: 20 });
    expect(result.roll?.diceRolled).toHaveLength(1);
    expect(result.roll?.total).toBe(21);
    expect(result.resistanceBreakdown.baseBonus).toBe(10);
    expect(result.success).toBe(true);
  });

  it('Surdo altera dados da iniciativa e Agilidade não é somada ao total', () => {
    vi.spyOn(Math, 'random').mockReturnValueOnce(0.9).mockReturnValueOnce(0.05).mockReturnValue(0.5);
    const state = character(['surdo']);
    state.skills.iniciativa = 'treinado';
    const result = rollInitiativeWithContext({ characterState: state });
    expect(result.roll?.diceRolled).toHaveLength(4);
    expect(result.roll?.diceKept).toEqual([2]);
    expect(result.roll?.total).toBe(7);
  });
});

describe('Condições compartilhadas entre os cadastros e o SUE', () => {
  it.each(Object.keys(BASE_CONDITION_TEXT))('%s usa o mesmo texto nos cadastros que a contêm', id => {
    expect(CONDITIONS[id].effect).toBe(BASE_CONDITION_TEXT[id]);
    if (legacyConditions[id]) expect(legacyConditions[id].mechanicalEffect).toBe(BASE_CONDITION_TEXT[id]);
  });

  it('Machucado ignora os antigos parâmetros de dano ao agir, sem apagar dados persistidos', () => {
    const params = { weaponMaxDamage: 99, weaponName: 'Legado' };
    const [condition] = getConditionEffects([{ id: 'machucado', params }]);
    expect(condition.mechanics).toEqual({});
    expect(getMachucadoDamage(params)).toBe(0);
    expect(params.weaponMaxDamage).toBe(99);
  });

  it('Vulnerável reduz Defesa e não aumenta dano nem ganha penalidades repetidas', () => {
    const result = getSUEBonusesForCharacter(character(['vulneravel', 'vulneravel']));
    expect(result.defenseBonus).toBe(-2);
    expect(result.rawSUE.damage.general).toBe(0);
  });

  it('Atordoado deriva Desprevenido uma vez e conserva reações', () => {
    const result = getSUEBonusesForCharacter(character(['atordoado', 'desprevenido']));
    expect(result.defenseBonus).toBe(-5);
    expect(result.rawSUE.testDice?.skills?.reflexos).toBe(-1);
    expect(result.rawSUE.flags.cannotAct).toBe(true);
    expect(result.rawSUE.flags.cannotReact).toBe(false);
    expect(getActionPenalties(['atordoado']).canReact).toBe(true);
    expect(getStackingDefenseModifier(['atordoado', 'desprevenido'])).toBe(-5);
  });

  it('Exausto substitui os graus menores e não duplica Vulnerável', () => {
    const result = getSUEBonusesForCharacter(character(['exausto', 'fatigado', 'fraco', 'vulneravel']));
    expect(result.rawSUE.testDice?.attributes?.strength).toBe(-2);
    expect(result.defenseBonus).toBe(-2);
    expect(result.rawSUE.movement.multiplier).toBe(0.5);
  });

  it('Frustrado não impede PE; doença e veneno não inventam penalidade genérica', () => {
    expect(canSpendPEWithConditions(['frustrado'])).toBe(true);
    expect(getSUEBonusesForCharacter(character(['doente', 'envenenado'])).attackBonus).toBe(0);
  });
});

describe('Acúmulo efetivamente aplicado ao resultado', () => {
  it('dois rituais da mesma perícia usam o maior; outras perícias e flags são preservadas', () => {
    const weak = effect('weak', { skillBonus: { percepcao: 3, investigacao: 2 }, cannotMove: true });
    const strong = effect('strong', { skillBonus: { percepcao: 5 } });
    const result = consolidateEffects([weak, strong], context);
    expect(result.skills.percepcao.bonus).toBe(5);
    expect(result.skills.investigacao.bonus).toBe(2);
    expect(result.flags.cannotMove).toBe(true);
    expect(weak.mechanics.skillBonus?.percepcao).toBe(3); // Entrada não é mutada.
  });

  it('resistências, recursos e crítico diferentes não competem entre si', () => {
    const result = consolidateEffects([
      effect('a', { fortitudeBonus: 2, peBonus: 3, criticalMarginBonus: 1 }),
      effect('b', { reflexosBonus: 5, hpBonus: 10, criticalMultiplierBonus: 2 }),
    ], context);
    expect(result.resistances.fortitude).toBe(2);
    expect(result.resistances.reflexos).toBe(5);
    expect(result.resources.peBonus).toBe(3);
    expect(result.resources.hpBonus).toBe(10);
    expect(result.critical.marginBonus).toBe(1);
    expect(result.critical.multiplierBonus).toBe(2);
  });

  it('bônus e penalidade de rituais coexistem, usando a penalidade mais forte', () => {
    const result = consolidateEffects([
      effect('plus', { attackBonus: 2 }), effect('minus', { attackBonus: -5 }), effect('small-minus', { attackBonus: -1 }),
    ], context);
    expect(result.attack.general).toBe(-3);
    expect(result.attack.breakdown.reduce((sum, entry) => sum + entry.value, 0)).toBe(-3);
  });

  it('um efeito inelegível não suprime outro elegível', () => {
    const result = consolidateEffects([
      effect('always', { defenseBonus: 3 }),
      effect('inactive-context', { defenseBonus: 8 }, { conditions: { hpPercentBelow: 25 } }),
    ], context);
    expect(result.defense.general).toBe(3);
  });

  it('a mesma habilidade não duplica bônus, mas habilidades diferentes acumulam', () => {
    const result = consolidateEffects([
      effect('first', { attackBonus: 2 }, { source: 'class_power', sourceId: 'power-a' }),
      effect('duplicate', { attackBonus: 2 }, { source: 'class_power', sourceId: 'power-a' }),
      effect('different', { attackBonus: 3 }, { source: 'class_power', sourceId: 'power-b' }),
    ], context);
    expect(result.attack.general).toBe(5);
  });
});
