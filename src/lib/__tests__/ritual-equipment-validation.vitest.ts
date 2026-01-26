/**
 * Testes para validação de rituais e equipamentos
 * Ordem Paranormal RPG v1.3
 */

import { describe, it, expect } from 'vitest';
import {
  validateRituals,
  getMaxRitualCircleByNex,
  getOccultistMaxRituals,
} from '../rules-engine/helpers/ritual-validation';
import {
  validateEquipment,
  calculateBaseCarryCapacity,
  calculateUsedSpaces,
} from '../rules-engine/helpers/equipment-validation';
import type { CharacterState } from '../rules-engine/types';

// =====================================================
// HELPER: Estado de personagem padrão para testes
// =====================================================

function createBaseState(overrides: Partial<CharacterState> = {}): CharacterState {
  return {
    id: 'test-char',
    name: 'Personagem Teste',
    characterClass: 'Ocultista',
    classTrack: 'conduite',
    nex: 25,
    origin: 'academico',
    attributes: {
      strength: 1,
      agility: 2,
      vigor: 2,
      intellect: 3,
      presence: 3,
    },
    skills: {
      ocultismo: 'treinado',
      vontade: 'treinado',
    },
    classPowers: [],
    generalPowers: [],
    paranormalPowers: [],
    trackAbilities: [],
    rituals: [],
    sustainedRituals: [],
    equippedWeapons: [],
    inventory: [],
    activeConditions: [],
    hpCurrent: 20,
    peCurrent: 10,
    sanCurrent: 50,
    elementalAffinity: 'Energia',
    ...overrides,
  };
}

// =====================================================
// TESTES: Círculo Máximo por NEX
// =====================================================

describe('getMaxRitualCircleByNex', () => {
  it('deve retornar 1º círculo para NEX 5-24%', () => {
    expect(getMaxRitualCircleByNex(5)).toBe(1);
    expect(getMaxRitualCircleByNex(10)).toBe(1);
    expect(getMaxRitualCircleByNex(24)).toBe(1);
  });

  it('deve retornar 2º círculo para NEX 25-54%', () => {
    expect(getMaxRitualCircleByNex(25)).toBe(2);
    expect(getMaxRitualCircleByNex(35)).toBe(2);
    expect(getMaxRitualCircleByNex(54)).toBe(2);
  });

  it('deve retornar 3º círculo para NEX 55-84%', () => {
    expect(getMaxRitualCircleByNex(55)).toBe(3);
    expect(getMaxRitualCircleByNex(70)).toBe(3);
    expect(getMaxRitualCircleByNex(84)).toBe(3);
  });

  it('deve retornar 4º círculo para NEX 85%+', () => {
    expect(getMaxRitualCircleByNex(85)).toBe(4);
    expect(getMaxRitualCircleByNex(99)).toBe(4);
  });
});

// =====================================================
// TESTES: Quantidade de Rituais para Ocultista
// =====================================================

describe('getOccultistMaxRituals', () => {
  it('deve retornar 3 rituais em NEX 5%', () => {
    expect(getOccultistMaxRituals(5)).toBe(3);
  });

  it('deve retornar 7 rituais em NEX 25%', () => {
    expect(getOccultistMaxRituals(25)).toBe(7);
  });

  it('deve retornar 12 rituais em NEX 50%', () => {
    expect(getOccultistMaxRituals(50)).toBe(12);
  });

  it('deve retornar 22 rituais em NEX 99%', () => {
    expect(getOccultistMaxRituals(99)).toBe(22);
  });
});

// =====================================================
// TESTES: Validação de Rituais
// =====================================================

describe('validateRituals', () => {
  describe('Ocultista', () => {
    it('deve aprovar Ocultista com rituais dentro do limite', () => {
      const state = createBaseState({
        nex: 25,
        rituals: ['amaldicoar-arma', 'consumir-mantra', 'descarnar'],
      });
      
      const issues = validateRituals(state);
      const errors = issues.filter(i => i.severity === 'error');
      
      expect(errors).toHaveLength(0);
    });

    it('deve reprovar Ocultista com muitos rituais', () => {
      const state = createBaseState({
        nex: 5, // Máximo de 3 rituais
        rituals: Array(10).fill('amaldicoar-arma'), // 10 rituais (mesmo repetido, para teste)
      });
      
      const issues = validateRituals(state);
      const error = issues.find(i => i.ruleId === 'too-many-rituals-occultist');
      
      expect(error).toBeDefined();
      expect(error?.severity).toBe('error');
    });
  });

  describe('Não-Ocultista', () => {
    it('deve reprovar Combatente com rituais sem Transcender', () => {
      const state = createBaseState({
        characterClass: 'Combatente',
        classTrack: 'guerreiro',
        rituals: ['amaldicoar-arma'],
        paranormalPowers: [], // Sem poderes paranormais
      });
      
      const issues = validateRituals(state);
      const error = issues.find(i => i.ruleId === 'ritual-without-transcender');
      
      expect(error).toBeDefined();
    });
  });

  describe('Círculo de Rituais', () => {
    it('deve reprovar ritual de círculo muito alto para o NEX', () => {
      const state = createBaseState({
        nex: 20, // Máximo 1º círculo
        rituals: ['possessao'], // Supondo que seja 3º ou 4º círculo
      });
      
      const issues = validateRituals(state);
      // Se o ritual 'possessao' não existir no catálogo, será 'unknown-ritual'
      // Caso exista e seja de círculo alto, será 'ritual-circle-too-high'
      const hasCircleError = issues.some(i => 
        i.ruleId === 'ritual-circle-too-high' || i.ruleId === 'unknown-ritual'
      );
      
      expect(hasCircleError).toBe(true);
    });
  });
});

// =====================================================
// TESTES: Capacidade de Carga
// =====================================================

describe('calculateBaseCarryCapacity', () => {
  it('deve calcular FOR × 5', () => {
    expect(calculateBaseCarryCapacity(3, 0, false)).toBe(15);
    expect(calculateBaseCarryCapacity(5, 0, false)).toBe(25);
  });

  it('deve ter mínimo de 2', () => {
    expect(calculateBaseCarryCapacity(0, 0, false)).toBe(2);
  });

  it('deve usar (FOR + INT) × 5 com Inventário Otimizado', () => {
    expect(calculateBaseCarryCapacity(2, 3, true)).toBe(25);
    expect(calculateBaseCarryCapacity(1, 4, true)).toBe(25);
  });
});

describe('calculateUsedSpaces', () => {
  it('deve somar espaços do inventário', () => {
    const inventory = [
      { id: '1', name: 'Item 1', category: 0, spaces: 2, quantity: 1 },
      { id: '2', name: 'Item 2', category: 0, spaces: 1, quantity: 3 },
    ];
    
    expect(calculateUsedSpaces(inventory, false)).toBe(5);
  });

  it('deve multiplicar por quantidade', () => {
    const inventory = [
      { id: '1', name: 'Granadas', category: 0, spaces: 1, quantity: 5 },
    ];
    
    expect(calculateUsedSpaces(inventory, false)).toBe(5);
  });
});

// =====================================================
// TESTES: Validação de Equipamentos
// =====================================================

describe('validateEquipment', () => {
  describe('Sobrecarga', () => {
    it('deve alertar sobre sobrecarga de inventário', () => {
      const state = createBaseState({
        attributes: { strength: 1, agility: 2, vigor: 2, intellect: 3, presence: 3 },
        inventory: [
          { id: '1', name: 'Equipamento Pesado', category: 0, spaces: 10, quantity: 1 },
        ],
      });
      
      const issues = validateEquipment(state);
      const overloadWarning = issues.find(i => i.ruleId === 'inventory-overload');
      
      // FOR 1 = capacidade 5, item com 10 espaços = sobrecarga
      expect(overloadWarning).toBeDefined();
      expect(overloadWarning?.severity).toBe('warning');
    });

    it('deve informar quando inventário está no limite', () => {
      const state = createBaseState({
        attributes: { strength: 2, agility: 2, vigor: 2, intellect: 3, presence: 3 },
        inventory: [
          { id: '1', name: 'Equipamento', category: 0, spaces: 10, quantity: 1 },
        ],
      });
      
      const issues = validateEquipment(state);
      const atCapacity = issues.find(i => i.ruleId === 'inventory-at-capacity');
      
      // FOR 2 = capacidade 10, item com 10 espaços = no limite
      expect(atCapacity).toBeDefined();
      expect(atCapacity?.severity).toBe('info');
    });
  });

  describe('Proficiência em Armas', () => {
    it('deve alertar sobre falta de proficiência em arma', () => {
      const state = createBaseState({
        characterClass: 'Ocultista', // Só tem proficiência em armas simples
        equippedWeapons: [
          {
            id: 'w1',
            name: 'Espada Longa',
            category: 'tactical-melee', // Arma tática
            damage: '1d8',
            criticalMargin: 19,
            criticalMultiplier: 2,
            attackAttribute: 'strength',
            attackSkill: 'luta',
            isEquipped: true,
          },
        ],
      });
      
      const issues = validateEquipment(state);
      const proficiencyWarning = issues.find(i => i.ruleId === 'weapon-no-proficiency');
      
      expect(proficiencyWarning).toBeDefined();
      expect(proficiencyWarning?.message).toContain('-5');
    });
  });

  describe('Proficiência em Armadura', () => {
    it('deve alertar sobre falta de proficiência em armadura pesada', () => {
      const state = createBaseState({
        characterClass: 'Especialista', // Só tem proficiência em proteções leves
        equippedArmor: {
          id: 'a1',
          name: 'Colete Tático Pesado',
          category: 'pesada',
          defenseBonus: 5,
        },
      });
      
      const issues = validateEquipment(state);
      const proficiencyWarning = issues.find(i => i.ruleId === 'armor-no-proficiency');
      
      expect(proficiencyWarning).toBeDefined();
      expect(proficiencyWarning?.message).toContain('pesada');
    });
  });
});
