import { describe, expect, it } from 'vitest';
import { activityRollEntries, diceHistoryEntry, entryDiceResult } from '../roll-history-adapter';
import { ritualTargetSkillBonuses } from '../ritual-target-skills';
import { activityRitualEntries } from '../ritual-history-adapter';
import type { CharacterActivityEvent } from '@/types/character-activity';
import type { DiceRollResult } from '../dice-roller';
import { ritualRollHistory } from '../ritual-roll-history';

const characterId = 'ficha-a';
const event = (payload: CharacterActivityEvent['payload'], category: CharacterActivityEvent['category'] = 'roll'): CharacterActivityEvent => ({
  id: 'evento-a', operation_id: 'operacao-a', character_id: characterId, author_id: 'usuario-a', category, payload,
  status: 'confirmed', created_at: '2026-10-06T12:00:00.000Z', campaign_id: null, campaign_version: null,
});
const entry = { type: 'attack', label: 'Ataque', results: [20, 10], diceCount: 2, bestResult: 20,
  skillBonus: 5, otherBonuses: -10, bonus: -5, total: 15, critical: false, extraDice: 1, criticalThreshold: 19 };

describe('projeção conservadora de históricos', () => {
  it('recupera d10 e falha sem atribuir registros de outra ficha', () => {
    const concealmentResult={level:'total' as const,attackerBlind:false,heatVisionApplied:false,chance:50,die:3,failed:true,targetDefense:10};
    const [record]=activityRollEntries([event({entry:{...entry,concealmentResult,success:false}})],characterId);
    expect(entryDiceResult(record).concealmentResult).toEqual(concealmentResult);
    expect(diceHistoryEntry(entryDiceResult(record)).success).toBe(false);
    expect(activityRollEntries([event({entry:{...entry,concealmentResult}})],'outra')).toEqual([]);
  });
  it('mostra a falha e os dados confirmados da concentração no histórico resumido', () => {
    const payload = { ritualId: 'eletrocussao', peCost: 1, peBefore: 10, peAfter: 9,
      castingOutcome: 'failed_concentration', concentration: { tests: [{ trigger: 'dano', dice: [11, 5, 12],
        kept: 12, bonus: 5, total: 17, dt: 100, success: false, bonuses: [{ name: 'Treinamento', value: 5 }] }] } };
    const [record] = activityRitualEntries([event(payload, 'ritual')]);
    expect(record.resolutionDescription).toContain('17 vs DT 100');
    expect(record.resolutionDescription).toContain('Treinamento: 5');
    expect(record.resolutionDescription).toContain('efeitos bloqueados, sem estorno de PE');
    expect(activityRitualEntries([event({ ritualId: 'mesa', peCost: 0, peBefore: 5, peAfter: 5 }, 'ritual')])[0].resolutionDescription).toBeUndefined();
  });
  it('preserva dados originais e multiplicador de Deflagração antes do bônus', () => {
    const snapshot = ritualRollHistory('Deflagração de Energia', { dice: [10, 10, 10], diceType: 10, diceMultiplier: 10, bonus: 5, total: 305, damageType: 'energia', ignoresRD: false });
    expect(snapshot).toMatchObject({ results: [10, 10, 10], diceCount: 3, diceType: 10, diceMultiplier: 10, bestResult: 300, bonus: 5, total: 305 });
    expect(activityRollEntries([event({ entry: snapshot })])[0]).toMatchObject(snapshot);
    expect(activityRollEntries([event({ entry: { ...snapshot, diceMultiplier: -10 } }), event({ entry: { ...snapshot, diceType: '10' } })])).toEqual([]);
  });
  it('isola a ficha e rejeita payloads inválidos sem interpretar o 20 como sucesso', () => {
    const entries = activityRollEntries([event({ entry }), { ...event({ entry }), character_id: 'ficha-b' },
      event({ entry: { ...entry, otherBonuses: '10' } }), event({ entry: { ...entry, critical: 'false' } }),
      event({ entry: { ...entry, diceCount: 3 } }), { ...event({ entry }), created_at: 'data-invalida' }, event(null)], characterId);
    expect(entries).toHaveLength(1);
    expect(entries[0].critical).toBe(false);
    expect(entries[0].success).toBeUndefined();
    expect(entryDiceResult(entries[0])).toMatchObject({ skillBonus: 5, otherBonuses: -10, total: 15,
      extraDice: 1, criticalThreshold: 19, isCritical: false });
  });
  it('conserva parcelas negativas e pool ao converter resultado do motor', () => {
    const roll: DiceRollResult = { dice: [20, 10], keptDice: 20, skillBonus: 5, otherBonuses: -10,
      total: 15, extraDice: 1, criticalThreshold: 19, isCritical: false, isDisadvantage: false,
      timestamp: new Date(), type: 'attack', label: 'Ataque' };
    expect(diceHistoryEntry(roll)).toMatchObject(entry);
  });
  it('não conta duas vezes o bônus agregado quando só uma parcela foi registrada', () => {
    const [record] = activityRollEntries([event({ entry: { ...entry, skillBonus: undefined, otherBonuses: 2, bonus: 7 } })]);
    expect(entryDiceResult(record)).toMatchObject({ skillBonus: 5, otherBonuses: 2 });
  });
  it('preserva ritual fora do catálogo, custos históricos e snapshot de nome', () => {
    const payload = { ritualId: 'ritual-da-mesa', ritualName: 'Marca da mesa', ritualElement: 'energia', ritualCircle: 2,
      peCost: 3, peBefore: 21, peAfter: 18, enhancements: ['Discente', 123] };
    const records = activityRitualEntries([event(payload, 'ritual'), { ...event(payload, 'ritual'), character_id: 'ficha-b' }], characterId);
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({ unknownRitual: true, peCost: 3, peBeforeCast: 21, peAfterCast: 18,
      enhancements: ['Discente'], ritual: { id: 'ritual-da-mesa', name: 'Marca da mesa', circle: 2, element: 'energia', cost: 3 } });
  });
  it('não inventa círculo/elemento para ritual desconhecido sem snapshot e conserva PE zero', () => {
    expect(activityRitualEntries([event({ ritualId: 'mesa', peCost: 0, peBefore: 5, peAfter: 5 }, 'ritual')])[0])
      .toMatchObject({ peCost: 0, ritual: { id: 'mesa', name: 'mesa', circle: null, element: null } });
  });
  it('rejeita PE inválido e data impossível sem recalcular registros históricos', () => {
    const payload = { ritualId: 'cicatrizacao', peCost: 3, peBefore: 21, peAfter: 18 };
    expect(activityRitualEntries([event({ ...payload, peCost: -1 }, 'ritual'), event({ ...payload, peAfter: Infinity }, 'ritual'),
      { ...event(payload, 'ritual'), created_at: 'data-invalida' }])).toEqual([]);
  });
});

describe('treinamento do alvo da resistência', () => {
  it('transforma graduação 0–3 em bônus e aceita nomes legados em minúsculas', () => {
    expect(ritualTargetSkillBonuses({ Fortitude: 1, reflexos: 2, Vontade: 3 })).toEqual({ fortitude: 5, reflexos: 10, vontade: 15 });
    expect(ritualTargetSkillBonuses({ Fortitude: 0 })).toEqual({ fortitude: 0, reflexos: 0, vontade: 0 });
  });
  it('não interpreta números de bônus nem strings como graduação', () => {
    expect(ritualTargetSkillBonuses({ Fortitude: 5, Reflexos: '2', Vontade: -1 })).toEqual({ fortitude: 0, reflexos: 0, vontade: 0 });
    expect(ritualTargetSkillBonuses(null)).toEqual({ fortitude: 0, reflexos: 0, vontade: 0 });
    expect(ritualTargetSkillBonuses([1, 2, 3])).toEqual({ fortitude: 0, reflexos: 0, vontade: 0 });
  });
});
