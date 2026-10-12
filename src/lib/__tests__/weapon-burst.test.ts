import { describe, expect, it } from 'vitest';
import { burstWeaponDiceCount, getWeaponBurstCapabilities, resolveWeaponBurst } from '../weapon-burst';
import { getAttributeDicePool } from '../attribute-dice-pool';

describe('Automática, Ferrolho e Compensador', () => {
  it.each(['fuzil_assalto', 'submetralhadora', 'metralhadora'])('reconhece o catálogo %s', catalogId => {
    expect(getWeaponBurstCapabilities({ catalogId }).available).toBe(true);
  });
  it('reconhece propriedade explícita e não confunde semiautomática', () => {
    expect(getWeaponBurstCapabilities({ type: 'Disparo', properties: ['Automática'] }).available).toBe(true);
    expect(getWeaponBurstCapabilities({ type: 'Disparo', special: 'Semiautomática' }).available).toBe(false);
    expect(getWeaponBurstCapabilities({ type: 'Disparo', special: 'Não automática' }).available).toBe(false);
  });
  it('Ferrolho habilita somente arma de fogo; Compensador sozinho não habilita', () => {
    expect(getWeaponBurstCapabilities({ weaponType: 'firearm', appliedModifications: ['ferrolho_automatico'] }).available).toBe(true);
    expect(getWeaponBurstCapabilities({ weaponType: 'melee', appliedModifications: ['ferrolho_automatico'] }).available).toBe(false);
    expect(getWeaponBurstCapabilities({ weaponType: 'firearm', appliedModifications: ['compensador'] }).available).toBe(false);
  });
  it('tiro único não recebe penalidade nem dado; rajada soma penalidade de dados', () => {
    const weapon = { catalogId: 'fuzil_assalto' };
    expect(resolveWeaponBurst(weapon, false)).toEqual({ enabled: false, dicePenalty: 0, extraWeaponDice: 0, compensated: false });
    expect(resolveWeaponBurst(weapon, true).dicePenalty).toBe(1);
    expect(getAttributeDicePool(3, 1)).toEqual({ count: 2, keep: 'highest' });
  });
  it('Compensador remove somente a penalidade de rajada; preserva condições', () => {
    const burst = resolveWeaponBurst({ catalogId: 'fuzil_assalto', appliedModifications: ['compensador'] }, true);
    expect(burst).toEqual({ enabled: true, dicePenalty: 0, extraWeaponDice: 1, compensated: true });
    expect(getAttributeDicePool(3, 1 + burst.dicePenalty).count).toBe(2);
  });
  it('atributo 0 e pool mínimo mantêm o pior dado', () => {
    expect(getAttributeDicePool(0, 1)).toEqual({ count: 3, keep: 'lowest' });
    expect(getAttributeDicePool(1, 1)).toEqual({ count: 2, keep: 'lowest' });
  });
  it('rajada entra antes de multiplicar o crítico, inclusive arma já ampliada', () => {
    const burst = resolveWeaponBurst({ catalogId: 'fuzil_assalto' }, true);
    expect(burstWeaponDiceCount(2, burst, false, 3)).toBe(3);
    expect(burstWeaponDiceCount(2, burst, true, 3)).toBe(9);
    expect(burstWeaponDiceCount(3, burst, true, 3)).toBe(12);
    expect(burstWeaponDiceCount(2, undefined, true, 3)).toBe(6);
  });
});
