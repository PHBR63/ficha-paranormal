import { describe, expect, it } from 'vitest';
import {
  calculateHealingPriority,
  calculateNonlethalState,
  resolveDamageMode,
} from '../nonlethal-damage';

describe('dano não letal do Livro Base v1.3', () => {
  it('converte arma corpo a corpo letal para não letal com penalidade única de -5', () => {
    expect(resolveDamageMode({ weaponType: 'Corpo a Corpo' }, 'nonlethal')).toEqual({
      mode: 'nonlethal', naturalMode: 'lethal', penalty: -5, allowed: true,
    });
  });

  it('mantém ataque desarmado não letal sem penalidade e cobra -5 para torná-lo letal', () => {
    expect(resolveDamageMode({ weaponType: 'Briga' }, 'nonlethal').penalty).toBe(0);
    expect(resolveDamageMode({ weaponType: 'Briga' }, 'lethal').penalty).toBe(-5);
  });

  it('Artista Marcial permite dano letal sem tirar o modo não letal natural do ataque desarmado', () => {
    expect(resolveDamageMode({ weaponType: 'Briga', allowsLethalWithoutPenalty: true }, 'lethal')).toMatchObject({
      naturalMode: 'nonlethal', penalty: 0, allowed: true,
    });
    expect(resolveDamageMode({ weaponType: 'Briga', allowsLethalWithoutPenalty: true }, 'nonlethal').penalty).toBe(0);
  });

  it('não permite converter ataque à distância comum em não letal', () => {
    expect(resolveDamageMode({ weaponType: 'Disparo' }, 'nonlethal')).toMatchObject({ allowed: false });
  });

  it('usa dano combinado para inconsciência sem transformar dano não letal em Morrendo', () => {
    expect(calculateNonlethalState({ hpCurrent: 8, hpMax: 20, nonlethalDamage: 8 })).toEqual({
      lethalDamage: 12, combinedDamage: 20, unconscious: true, dying: false,
    });
    expect(calculateNonlethalState({ hpCurrent: 0, hpMax: 20, nonlethalDamage: 0 }).dying).toBe(true);
  });

  it('cura primeiro o dano não letal e só depois recupera PV', () => {
    expect(calculateHealingPriority({ hpCurrent: 8, hpMax: 20, nonlethalDamage: 6, amount: 4 })).toEqual({
      hpAfter: 8, nonlethalAfter: 2, nonlethalHealed: 4, hpHealed: 0,
    });
    expect(calculateHealingPriority({ hpCurrent: 8, hpMax: 20, nonlethalDamage: 6, amount: 10 })).toEqual({
      hpAfter: 12, nonlethalAfter: 0, nonlethalHealed: 6, hpHealed: 4,
    });
  });
});
