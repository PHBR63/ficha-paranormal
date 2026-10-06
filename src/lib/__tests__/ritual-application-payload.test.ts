import { describe, expect, it } from 'vitest';
import { buildSustainPayload, buildWeaponBuff } from '../ritual-application-payload';
import { getRitualById } from '@/lib/rituals/legacy-exports';
import type { SustainConfig } from '@/lib/rituals/legacy-exports';
const curse = getRitualById('amaldicoar-arma-sangue')!;
describe('payload transacional de bônus de arma', () => {
  it.each([{ enhancements: [], dice: 1 }, { enhancements: ['Discente'], dice: 2 }, { enhancements: ['Verdadeiro'], dice: 4 }])('normaliza o dano para o nível $enhancements', ({ enhancements, dice }) => {
    const payload = buildWeaponBuff(curse, enhancements);
    expect(payload.bonusDamage).toEqual({ diceCount: dice, diceType: 6, damageType: 'sangue' });
    expect(payload.ritualId).toBe(curse.id); expect(payload.duration).toBe('cena');
    expect(payload).not.toHaveProperty('id'); expect(payload).not.toHaveProperty('appliedAt');
  });
  it('preserva bônus de ataque, crítico e duração de Arma Atroz verdadeiro', () => {
    const payload = buildWeaponBuff(getRitualById('arma-atroz')!, ['Verdadeiro']);
    expect(payload).toMatchObject({ attackBonus: 5, criticalBonus: 2, criticalMultiplierBonus: 1, duration: 'sustentado' });
  });
  it('não altera as opções recebidas nem cria efeito de arma para outro ritual', () => {
    const enhancements = ['Discente']; const payload = buildWeaponBuff(curse, enhancements);
    payload.enhancements.push('Verdadeiro'); expect(enhancements).toEqual(['Discente']);
    expect(() => buildWeaponBuff(getRitualById('cicatrizacao')!, [])).toThrow('não possui bônus de arma');
  });
});
describe('payload transacional de sustentação', () => {
  it('preserva configuração e cria somente metadados para sustentação discente', () => {
    const config = { action: 'free' as const, costPerTurn: 0, concentration: true, maxDuration: 3, endTriggers: ['concentrationBreak'] };
    const payload = buildSustainPayload(getRitualById('tecer-ilusao')!, ['Discente'], config);
    expect(payload).toMatchObject({ ritualId: 'tecer-ilusao', circle: 1, selectedEnhancements: ['Discente'], sustainConfig: config });
    payload.sustainConfig.endTriggers?.push('outro'); expect(config.endTriggers).toEqual(['concentrationBreak']);
    expect(payload).not.toHaveProperty('id'); expect(payload).not.toHaveProperty('user_id');
  });
  it('recusa sustentação ausente e custo negativo sem persistir nada', () => {
    expect(() => buildSustainPayload(getRitualById('tecer-ilusao')!, [], { action: 'free' })).toThrow('não possui sustentação');
    expect(() => buildSustainPayload(getRitualById('tecer-ilusao')!, ['Discente'], { costPerTurn: -1 })).toThrow('inválido');
  });
  it('normaliza movement do catálogo unificado para move do painel existente', () => {
    const payload = buildSustainPayload(getRitualById('tecer-ilusao')!, ['Discente'], { action: 'movement' } as unknown as SustainConfig);
    expect(payload.sustainConfig.action).toBe('move');
  });
});
