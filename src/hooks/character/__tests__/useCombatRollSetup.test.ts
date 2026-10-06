/**
 * Testes de Integração - useCombatRollSetup
 * 
 * Verifica preparação de ataques, cálculo automático de atributos,
 * bônus de proficiência e integração com SUE.
 */

import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCombatRollSetup, type WeaponData } from '../useCombatRollSetup';
import type { WeaponBuff } from '@/hooks/useWeaponBuffs';

// Helper para criar WeaponBuff completo
function createMockBuff(overrides: Partial<WeaponBuff>): WeaponBuff {
  return {
    id: 'mock-buff-1',
    ritualId: 'ritual-1',
    ritualName: 'Ritual Teste',
    element: 'Energia',
    appliedAt: new Date().toISOString(),
    duration: 'cena',
    enhancements: [],
    ...overrides,
  };
}

// Arma corpo-a-corpo para testes
const mockMeleeWeapon: WeaponData = {
  id: 'espada-tatica',
  name: 'Espada Tática',
  damage: '2d6',
  damageType: 'Corte',
  weaponType: 'melee',
  critical: 19,
  criticalMultiplier: 2,
  range: 'Corpo-a-corpo',
  proficiency: 'tatica',
};

// Arma corpo-a-corpo leve
const mockLightMeleeWeapon: WeaponData = {
  id: 'adaga',
  name: 'Adaga',
  damage: '1d4',
  damageType: 'Perfuração',
  weaponType: 'melee',
  critical: 19,
  criticalMultiplier: 2,
  proficiency: 'simples',
  properties: ['leve', 'Arremesso'],
};

// Arma de fogo
const mockFirearmWeapon: WeaponData = {
  id: 'pistola-glock',
  name: 'Pistola Glock',
  damage: '2d6',
  damageType: 'Balístico',
  weaponType: 'firearm',
  critical: 20,
  criticalMultiplier: 3,
  range: 'Curto',
  proficiency: 'armas-de-fogo',
};

describe('useCombatRollSetup', () => {
  describe('getAttackAttribute', () => {
    it('deve retornar Força para arma corpo-a-corpo padrão', () => {
      const { result } = renderHook(() => 
        useCombatRollSetup({
          attributes: { strength: 3, agility: 2 },
          nex: 50,
        })
      );
      
      const attr = result.current.getAttackAttribute('melee');
      
      expect(attr.name).toBe('Força');
      expect(attr.value).toBe(3);
    });

    it('deve retornar Agilidade para arma leve quando AGI > FOR', () => {
      const { result } = renderHook(() => 
        useCombatRollSetup({
          attributes: { strength: 1, agility: 3 },
          nex: 50,
        })
      );
      
      const attr = result.current.getAttackAttribute('melee', ['leve']);
      
      expect(attr.name).toBe('Agilidade');
      expect(attr.value).toBe(3);
    });

    it('deve retornar Força para arma leve quando FOR >= AGI', () => {
      const { result } = renderHook(() => 
        useCombatRollSetup({
          attributes: { strength: 3, agility: 2 },
          nex: 50,
        })
      );
      
      const attr = result.current.getAttackAttribute('melee', ['leve']);
      
      expect(attr.name).toBe('Força');
      expect(attr.value).toBe(3);
    });

    it('deve retornar Agilidade para arma de fogo', () => {
      const { result } = renderHook(() => 
        useCombatRollSetup({
          attributes: { strength: 3, agility: 2 },
          nex: 50,
        })
      );
      
      const attr = result.current.getAttackAttribute('firearm');
      
      expect(attr.name).toBe('Agilidade');
      expect(attr.value).toBe(2);
    });

    it('deve retornar Agilidade para arma de arremesso', () => {
      const { result } = renderHook(() => 
        useCombatRollSetup({
          attributes: { strength: 3, agility: 4 },
          nex: 50,
        })
      );
      
      const attr = result.current.getAttackAttribute('thrown');
      
      expect(attr.name).toBe('Agilidade');
      expect(attr.value).toBe(4);
    });

    it('deve retornar Agilidade para arma ranged', () => {
      const { result } = renderHook(() => 
        useCombatRollSetup({
          attributes: { strength: 2, agility: 3 },
          nex: 50,
        })
      );
      
      const attr = result.current.getAttackAttribute('ranged');
      
      expect(attr.name).toBe('Agilidade');
      expect(attr.value).toBe(3);
    });
  });

  describe('getProficiencyBonus', () => {
    it('deve calcular meia-proficiência para armas simples (NEX 50%)', () => {
      const { result } = renderHook(() => 
        useCombatRollSetup({
          attributes: { strength: 2, agility: 2 },
          nex: 50,
        })
      );
      
      // NEX 50% = meia-prof = floor(50/10) = 5
      expect(result.current.getProficiencyBonus('simples')).toBe(5);
    });

    it('deve calcular proficiência completa para armas marciais (NEX 50%)', () => {
      const { result } = renderHook(() => 
        useCombatRollSetup({
          attributes: { strength: 2, agility: 2 },
          nex: 50,
        })
      );
      
      // NEX 50% = prof completa = floor(50/5) = 10
      expect(result.current.getProficiencyBonus('marcial')).toBe(10);
    });

    it('deve calcular corretamente para NEX 20%', () => {
      const { result } = renderHook(() => 
        useCombatRollSetup({
          attributes: { strength: 2, agility: 2 },
          nex: 20,
        })
      );
      
      expect(result.current.getProficiencyBonus('simples')).toBe(2); // 20/10
      expect(result.current.getProficiencyBonus('marcial')).toBe(4); // 20/5
    });

    it('deve calcular corretamente para NEX 99%', () => {
      const { result } = renderHook(() => 
        useCombatRollSetup({
          attributes: { strength: 2, agility: 2 },
          nex: 99,
        })
      );
      
      expect(result.current.getProficiencyBonus('simples')).toBe(9); // 99/10 = 9
      expect(result.current.getProficiencyBonus('marcial')).toBe(20); // NEX 99: vigésimo patamar
    });
  });

  describe('prepareAttack', () => {
    it('deve preparar ataque corpo-a-corpo corretamente', () => {
      const { result } = renderHook(() => 
        useCombatRollSetup({
          attributes: { strength: 3, agility: 2 },
          nex: 50,
        })
      );
      
      const setup = result.current.prepareAttack(mockMeleeWeapon);
      
      expect(setup.weaponName).toBe('Espada Tática');
      expect(setup.attributeName).toBe('Força');
      expect(setup.attributeValue).toBe(3);
      expect(setup.criticalRange).toBe(19);
      expect(setup.criticalMultiplier).toBe(2);
    });

    it('deve preparar ataque com arma de fogo corretamente', () => {
      const { result } = renderHook(() => 
        useCombatRollSetup({
          attributes: { strength: 2, agility: 4 },
          nex: 50,
        })
      );
      
      const setup = result.current.prepareAttack(mockFirearmWeapon);
      
      expect(setup.weaponName).toBe('Pistola Glock');
      expect(setup.attributeName).toBe('Agilidade');
      expect(setup.attributeValue).toBe(4);
      expect(setup.criticalRange).toBe(20);
      expect(setup.criticalMultiplier).toBe(3);
    });

    it('deve incluir bônus do SUE no total de ataque', () => {
      const { result } = renderHook(() => 
        useCombatRollSetup({
          attributes: { strength: 2, agility: 2 },
          nex: 50,
          attackBonus: 5, // Bônus do SUE
        })
      );
      
      const setup = result.current.prepareAttack(mockMeleeWeapon);
      
      // Total = FOR(2) + Prof(10) + SUE(5) = 17
      expect(setup.totalAttackBonus).toBe(17);
    });

    it('deve incluir bônus de dano do SUE', () => {
      const { result } = renderHook(() => 
        useCombatRollSetup({
          attributes: { strength: 3, agility: 2 },
          nex: 50,
          damageBonus: 3, // Bônus de dano do SUE
        })
      );
      
      const setup = result.current.prepareAttack(mockMeleeWeapon);
      
      expect(setup.damageBonus).toBe(3);
    });

    it('deve incluir bonusSources no breakdown', () => {
      const { result } = renderHook(() => 
        useCombatRollSetup({
          attributes: { strength: 3, agility: 2 },
          nex: 50,
          bonusSources: [
            { label: 'Fúria', value: 2, type: 'other' },
          ],
        })
      );
      
      const setup = result.current.prepareAttack(mockMeleeWeapon);
      
      // Deve incluir Força + Proficiência + Fúria
      expect(setup.bonusSources.length).toBeGreaterThanOrEqual(3);
      expect(setup.bonusSources.some(b => b.label === 'Fúria')).toBe(true);
    });

    it('deve usar arma leve com Agilidade se maior que Força', () => {
      const { result } = renderHook(() => 
        useCombatRollSetup({
          attributes: { strength: 1, agility: 4 },
          nex: 50,
        })
      );
      
      const setup = result.current.prepareAttack(mockLightMeleeWeapon);
      
      expect(setup.attributeName).toBe('Agilidade');
      expect(setup.attributeValue).toBe(4);
    });

    it('deve aplicar meia-proficiência para armas simples', () => {
      const { result } = renderHook(() => 
        useCombatRollSetup({
          attributes: { strength: 2, agility: 2 },
          nex: 50,
        })
      );
      
      const setup = result.current.prepareAttack(mockLightMeleeWeapon);
      
      // Proficiência simples = 50/10 = 5
      expect(setup.proficiencyBonus).toBe(5);
    });
  });

  describe('Helpers', () => {
    it('isMeleeWeapon deve retornar true para melee', () => {
      const { result } = renderHook(() => 
        useCombatRollSetup({
          attributes: { strength: 2, agility: 2 },
          nex: 50,
        })
      );
      
      expect(result.current.isMeleeWeapon('melee')).toBe(true);
      expect(result.current.isMeleeWeapon('ranged')).toBe(false);
      expect(result.current.isMeleeWeapon('firearm')).toBe(false);
      expect(result.current.isMeleeWeapon('thrown')).toBe(false);
    });

    it('isThrownWeapon deve retornar true para thrown', () => {
      const { result } = renderHook(() => 
        useCombatRollSetup({
          attributes: { strength: 2, agility: 2 },
          nex: 50,
        })
      );
      
      expect(result.current.isThrownWeapon('thrown')).toBe(true);
      expect(result.current.isThrownWeapon('melee')).toBe(false);
      expect(result.current.isThrownWeapon('ranged')).toBe(false);
    });

    it('getActiveBuffs deve retornar buffs configurados', () => {
      const mockBuffs = [
        createMockBuff({ ritualName: 'Amaldiçoar Arma', attackBonus: 2 }),
      ];
      
      const { result } = renderHook(() => 
        useCombatRollSetup({
          attributes: { strength: 2, agility: 2 },
          nex: 50,
          weaponBuffs: mockBuffs,
        })
      );
      
      const buffs = result.current.getActiveBuffs();
      
      expect(buffs.length).toBe(1);
      expect(buffs[0].ritualName).toBe('Amaldiçoar Arma');
    });
  });

  describe('Buffs de Ritual', () => {
    it('deve incluir bônus de ataque de buffs no total', () => {
      const mockBuffs = [
        createMockBuff({ ritualName: 'Amaldiçoar Arma', attackBonus: 3 }),
      ];
      
      const { result } = renderHook(() => 
        useCombatRollSetup({
          attributes: { strength: 2, agility: 2 },
          nex: 50,
          weaponBuffs: mockBuffs,
        })
      );
      
      const setup = result.current.prepareAttack(mockMeleeWeapon);
      
      // Total = FOR(2) + Prof(10) + BuffAttack(3) = 15
      expect(setup.totalAttackBonus).toBe(15);
    });

    it('deve incluir buffs no breakdown de bônus', () => {
      const mockBuffs = [
        createMockBuff({ ritualName: 'Sopro da Salvação', attackBonus: 2 }),
      ];
      
      const { result } = renderHook(() => 
        useCombatRollSetup({
          attributes: { strength: 2, agility: 2 },
          nex: 50,
          weaponBuffs: mockBuffs,
        })
      );
      
      const setup = result.current.prepareAttack(mockMeleeWeapon);
      
      expect(setup.bonusSources.some(b => b.label.includes('Sopro da Salvação'))).toBe(true);
    });
  });

  describe('Estabilidade de Referência', () => {
    it('deve manter referência estável das funções entre renders', () => {
      const { result, rerender } = renderHook(() => 
        useCombatRollSetup({
          attributes: { strength: 2, agility: 2 },
          nex: 50,
        })
      );
      
      const firstPrepareAttack = result.current.prepareAttack;
      const firstGetAttackAttribute = result.current.getAttackAttribute;
      
      rerender();
      
      // Funções devem ser memoizadas
      expect(result.current.prepareAttack).toBe(firstPrepareAttack);
      expect(result.current.getAttackAttribute).toBe(firstGetAttackAttribute);
    });
  });
});
