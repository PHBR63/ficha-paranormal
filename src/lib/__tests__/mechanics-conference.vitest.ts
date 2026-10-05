import { describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { getTrackEffects, getTrackCombatBonuses } from '../effects/track-effects-adapter';
import { getTrackActivatableEffects, getVersatilityTrackEffects } from '../effects/track-effects-adapter';
import { getTrackById } from '../class-powers/track-registry';
import { getClassPowerEffects } from '../effects/class-power-effects-adapter';
import { consolidateEffects, type EffectCalculationContext } from '../unified-effects-engine';
import { getCombatPowerDicePenalty } from '../class-powers/combat-test-dice';
import { getAttributeDicePool } from '../attribute-dice-pool';
import { getPELimitByNex, getPELimitWithBonus } from '../dice-roller';
import { calculatePowerActivationEffects } from '../class-powers/activatable-powers-bridge';
import { getPowerById } from '../class-powers/power-registry';
import { useActivatableClassPowers } from '@/hooks/useActivatableClassPowers';
import { useBonusSummaryFromSUE } from '@/hooks/useBonusSummaryFromSUE';
import { useClassPowerBonuses } from '@/hooks/useClassPowerBonuses';

const attributes = { strength: 2, agility: 2, vigor: 2, intellect: 3, presence: 0 };
const context: EffectCalculationContext = {
  attributes, nex: 99, hpCurrent: 10, hpMax: 20, peCurrent: 20, peMax: 20,
  inCombat: true, isFirstRound: false, currentRound: 2, hasShield: false,
  activeConditions: [], activatedEffects: [],
};

describe('Limite de PE, Livro Base v1.3 p.23', () => {
  const progression = Array.from({ length: 19 }, (_, index) => [(index + 1) * 5, index + 1]);
  it.each([...progression, [99, 20]])('NEX %s permite %s PE por turno', (nex, limit) => {
    expect(getPELimitByNex(nex)).toBe(limit);
  });
  it('soma bônus de origem sem duplicar a progressão', () => {
    expect(getPELimitWithBonus(25, 1)).toBe(6);
  });
});

describe('Conversão de trilhas de Ocultista sem bônus incondicionais inventados', () => {
  it.each(['condutor', 'Conduíte', 'conduite'])('preserva lookup e Versatilidade para %s', alias => {
    expect(getTrackById(alias)?.id).toBe('condutor');
    expect(getTrackActivatableEffects(alias)).toEqual(getTrackActivatableEffects('condutor'));
    expect(getVersatilityTrackEffects(alias, 'ampliar-ritual', attributes)).toEqual(getVersatilityTrackEffects('condutor', 'ampliar-ritual', attributes));
  });
  it('Mente Sã não concede RD nem bônus geral de Vontade', () => {
    const computed = consolidateEffects(getTrackEffects('intuitivo', 10, attributes), { ...context, nex: 10 });
    expect(computed.occultist.paranormalResistanceTestBonus).toBe(5);
    expect(computed.resistances.vontade).toBe(0);
    expect(computed.damageReduction.paranormal).toBe(0);
  });
  it('Inabalável usa o teste original para metade e não cria DT própria', () => {
    const computed = consolidateEffects(getTrackEffects('intuitivo', 65, attributes), { ...context, nex: 65 });
    expect(computed.damageReduction.paranormal).toBe(10);
    expect(computed.damageResistance.mental).toBe(10);
    expect(computed.occultist.paranormalDamageTest.abilities[0]).toMatchObject({ dtType: 'existing-test', requiresExistingHalfDamageSave: true, onFailure: 'full' });
  });
  it('Poder do Flagelo custa dois PV por PE e Graduado só ganha DT em 65%', () => {
    const flagelo = consolidateEffects(getTrackEffects('flagelador', 10, attributes), context);
    expect(flagelo.occultist.hpCostPerPE).toBe(2);
    const before = consolidateEffects(getTrackEffects('graduado', 40, attributes), context);
    const after = consolidateEffects(getTrackEffects('graduado', 65, attributes), context);
    expect(before.rituals.dtBonus).toBe(0);
    expect(after.rituals.dtBonus).toBe(5);
    expect(before.occultist.grimoire.preparationAction).toBe('full');
  });
});

describe('Trilhas conferidas no Livro Base v1.3, pp. 26–30 e 311', () => {
  it.each([[10, 2], [40, 8], [65, 13], [99, 19]])('Casca Grossa em NEX %s concede %s PV', (nex, hp) => {
    const computed = consolidateEffects(getTrackEffects('tropa-choque', nex, attributes), { ...context, nex, hpCurrent: 20 });
    expect(computed.resources.hpBonus).toBe(hp);
    expect(computed.damageReduction.physical).toBe(0); // Vigor é apenas para o bloqueio.
    expect(computed.combatAdvanced.blockVigorBonus.enabled).toBe(true);
  });

  it.each([[10, true], [9, true], [11, false]])('Inquebrável com %s/20 PV: ativo=%s', (hpCurrent, active) => {
    const computed = consolidateEffects(getTrackEffects('tropa-choque', 99, attributes), { ...context, hpCurrent });
    expect(computed.combatAdvanced.conditionalBonuses.whenWounded.active).toBe(active);
    expect(computed.defense.general).toBe(active ? 5 : 0);
  });

  it('Técnica Sublime emite Letal e Perfurante sem exigir mecânicas do efeito pai', () => {
    const activatedEffects = ['track-tecnica-letal', 'track-tecnica-perfurante'];
    const effects = getTrackEffects('aniquilador', 65, attributes, activatedEffects);
    const computed = consolidateEffects(effects, { ...context, nex: 65, activatedEffects });
    expect(computed.critical.marginBonus).toBe(2);
    expect(effects.find(e => e.id === 'track-tecnica-perfurante')?.mechanics.specialEffects).toContain('Ignora 5 de RD');
    expect(getTrackEffects('aniquilador', 40, attributes).some(e => e.id === 'track-tecnica-letal')).toBe(false);
  });

  it('Disparo Letal aumenta a margem em +2 uma vez, sem repetir Intelecto no dano', () => {
    const activatedEffects = ['track-disparo-letal'];
    const effects = getTrackEffects('atirador-elite', 40, attributes, activatedEffects);
    const computed = consolidateEffects(effects, { ...context, nex: 40, activatedEffects });
    expect(effects.filter(e => e.id === 'track-disparo-letal')).toHaveLength(1);
    expect(computed.critical.marginBonus).toBe(2);
    expect(computed.damage.ranged).toBe(3); // Apenas Mira de Elite.
  });

  it('Técnica Letal não amplia o crítico de ataques à distância', () => {
    expect(getTrackCombatBonuses('guerreiro', 10, attributes, 'melee').criticalMarginBonus).toBe(2);
    expect(getTrackCombatBonuses('guerreiro', 10, attributes, 'ranged').criticalMarginBonus).toBe(0);
    const ranged = consolidateEffects(getTrackEffects('guerreiro', 10, attributes), {
      ...context, attackContext: { type: 'ranged', targetConditions: [] },
    });
    expect(ranged.critical.marginBonus).toBe(0);
  });

  it('o resumo da ficha não soma Casca Grossa de novo pelo hook legado', () => {
    const { result } = renderHook(() => useBonusSummaryFromSUE({
      origin: 'desconhecida', abilities: [], nex: 40, classId: 'Combatente', classTrack: 'tropa-choque',
      hpCurrent: 40, hpMax: 40,
    }));
    expect(result.current.hpBonus).toBe(8);
  });

  it('o cálculo legado conserva Intelecto zero em Mira de Elite', () => {
    const { result } = renderHook(() => useClassPowerBonuses({
      nex: 10, classId: 'Especialista', classTrack: 'atirador-elite',
      attributes: { ...attributes, intellect: 0 }, equippedWeaponType: 'firearm',
    }));
    expect(result.current.totals.damage.general).toBe(0);
  });
});

describe('Poderes oficiais: pool e dano separados de modificadores numéricos', () => {
  it.each(['combate-defensivo', 'combater-duas-armas'])('%s retira um d20 e preserva o total do ataque', id => {
    const activatedEffects = [`class-power-${id}`];
    const effects = getClassPowerEffects([{ id, name: id, classId: 'Combatente', nex: 15 }], 15, attributes, activatedEffects);
    const computed = consolidateEffects(effects, { ...context, nex: 15, activatedEffects });
    expect(computed.attack.general).toBe(0);
    expect(computed.testDice?.attacks).toBe(-1);
    expect(getAttributeDicePool(3, getCombatPowerDicePenalty([id]))).toEqual({ count: 2, keep: 'highest' });
  });

  it('painel e modal não contam o mesmo poder duas vezes; poderes diferentes acumulam', () => {
    const ids = ['combate-defensivo', 'conditional-combate-defensivo', 'class-power-combate-defensivo', 'combater-duas-armas'];
    expect(getCombatPowerDicePenalty(ids)).toBe(2);
    expect(getAttributeDicePool(3, getCombatPowerDicePenalty(ids))).toEqual({ count: 1, keep: 'highest' });
  });

  it.each(['incansavel-forca', 'incansavel-agilidade'])('%s troca o atributo sem conceder +5', id => {
    expect(calculatePowerActivationEffects(id, 15, 3).skillBonusChange).toBe(0);
    expect(calculatePowerActivationEffects(id, 15, 3).attributeSwap).toBe(id.endsWith('forca') ? 'strength' : 'agility');
    expect(getPowerById('incansavel')?.effects.base.extraActions?.[0].skillBonus).toBe(0);
  });

  it('Golpe Demolidor acrescenta dois dados da arma; Eclético mantém treinamento +5', () => {
    expect(getPowerById('golpe-demolidor')?.effects.base.damageBonus?.extraDice).toBe('2W');
    expect(calculatePowerActivationEffects('golpe-demolidor', 15, 3).extraDice).toBe('2W');
    expect(calculatePowerActivationEffects('ecletico', 15, 3).skillBonusChange).toBe(5);
  });
});

describe('Ativação repetida e saldo de PE', () => {
  const powers = [{ id: 'segurar-gatilho', name: 'Segurar o Gatilho' }, { id: 'incansavel', name: 'Incansável' }];
  it('reserva PE e escala 2/4/6 mesmo antes do próximo render', () => {
    const onPEChange = vi.fn();
    const { result } = renderHook(() => useActivatableClassPowers({
      classPowers: powers, abilities: {}, nex: 60, peCurrent: 20, onPEChange,
    }));
    act(() => {
      expect(result.current.usePower('segurar-gatilho')).toBe(true);
      expect(result.current.usePower('segurar-gatilho')).toBe(true);
      expect(result.current.usePower('segurar-gatilho')).toBe(true);
    });
    expect(onPEChange.mock.calls).toEqual([[18], [14], [8]]);
    expect(result.current.getCurrentCost('segurar-gatilho')).toBe(8);
    act(() => result.current.resetTurn());
    expect(result.current.getCurrentCost('segurar-gatilho')).toBe(2);
  });

  it('bloqueia uso sem saldo, por NEX insuficiente ou sem possuir o poder', () => {
    const onPEChange = vi.fn();
    const { result } = renderHook(() => useActivatableClassPowers({
      classPowers: powers, abilities: {}, nex: 15, peCurrent: 3, onPEChange,
    }));
    act(() => {
      expect(result.current.usePower('segurar-gatilho')).toBe(false);
      expect(result.current.usePower('ataque-de-oportunidade')).toBe(false);
      expect(result.current.usePower('incansavel')).toBe(true);
      expect(result.current.usePower('incansavel')).toBe(false);
    });
    expect(onPEChange.mock.calls).toEqual([[1]]);
  });

  it('reconcilia alterações externas de PE e reset não devolve pontos gastos', () => {
    const onPEChange = vi.fn();
    const { result, rerender } = renderHook(({ peCurrent }) => useActivatableClassPowers({
      classPowers: powers, abilities: {}, nex: 60, peCurrent, onPEChange,
    }), { initialProps: { peCurrent: 5 } });
    act(() => result.current.usePower('segurar-gatilho'));
    expect(result.current.canAfford('segurar-gatilho')).toBe(false);
    act(() => result.current.resetScene());
    expect(onPEChange.mock.calls).toEqual([[3]]);
    rerender({ peCurrent: 10 });
    act(() => result.current.usePower('segurar-gatilho'));
    expect(onPEChange).toHaveBeenLastCalledWith(8);
  });
});
