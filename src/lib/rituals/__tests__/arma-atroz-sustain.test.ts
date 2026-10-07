import { describe, expect, it } from 'vitest';
import { getActiveRitualEffectUnified } from '../ritual-adapter';

describe('sustentação de Arma Atroz no fluxo de aplicação', () => {
  it.each([
    { enhancements: [], attackBonus: 2, criticalBonus: 1 },
    { enhancements: ['Discente'], attackBonus: 5, criticalBonus: 1 },
    { enhancements: ['Verdadeiro'], attackBonus: 5, criticalBonus: 2 },
  ])('preserva bônus e manutenção na forma $enhancements', ({ enhancements, attackBonus, criticalBonus }) => {
    expect(getActiveRitualEffectUnified('arma-atroz', enhancements)).toMatchObject({
      weaponEffect: { attackBonus, criticalBonus }, sustain: { action: 'free' },
    });
  });
});
