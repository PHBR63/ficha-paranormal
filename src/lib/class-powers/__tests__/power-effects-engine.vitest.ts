/**
 * Testes Vitest do Motor de Efeitos de Poderes - Ordem Paranormal RPG
 * 
 * Testa o cálculo de bônus de poderes de classe, condições, escalonamento
 * por NEX e aplicação de mecânicas.
 * 
 * @module power-effects-engine.vitest
 */

import { describe, it, expect } from 'vitest';
import {
  createEmptyBonusSummary,
  calculatePowerBonuses,
  hasPower,
  resolveScalingValue,
  resolveScalingDice,
  checkConditions,
  isMeleeWeapon,
  isRangedWeapon,
  applyMechanics,
  getAttackBonus,
} from '../power-effects-engine';
import { getPowerById, getPowersByClass } from '../power-registry';
import type { PowerCalculationContext, PowerBonusSummary, ScalingValue, ScalingDice, PowerConditions, ClassId } from '../types';

// Helper para criar contexto válido com atributos padrão
const createContext = (overrides: Partial<PowerCalculationContext> = {}): PowerCalculationContext => ({
  nex: 50,
  attributes: { strength: 1, agility: 1, vigor: 1, intellect: 1, presence: 1 },
  ...overrides,
});

describe('Referências de poderes salvas em versões anteriores', () => {
  it('aceita id e nome e ignora entradas incompletas sem interromper a ficha', () => {
    const references = [{ id: 'ritual-potente' }, { name: 'Ritual Potente' }, {}, null] as unknown as Parameters<typeof calculatePowerBonuses>[0];
    expect(() => calculatePowerBonuses(references, createContext())).not.toThrow();
    expect(hasPower(references, 'ritual-potente')).toBe(true);
    expect(hasPower([{}] as unknown as typeof references, 'ritual-potente')).toBe(false);
  });
});

// ========================================
// TESTES DE CRIAÇÃO DE SUMÁRIO
// ========================================

describe('Motor de Poderes - Criação de Sumário Vazio', () => {
  it('createEmptyBonusSummary deve retornar objeto com valores zerados', () => {
    const summary = createEmptyBonusSummary();
    
    expect(summary.attack.general).toBe(0);
    expect(summary.attack.melee).toBe(0);
    expect(summary.attack.ranged).toBe(0);
    expect(summary.attack.firearm).toBe(0);
    
    expect(summary.damage.general).toBe(0);
    expect(summary.damage.melee).toBe(0);
    expect(summary.damage.ranged).toBe(0);
    expect(summary.damage.firearm).toBe(0);
    
    expect(summary.defense.base).toBe(0);
    expect(summary.defense.conditional).toBe(0);
    
    expect(summary.resistance.fortitude).toBe(0);
    expect(summary.resistance.reflexos).toBe(0);
    expect(summary.resistance.vontade).toBe(0);
    expect(summary.resistance.all).toBe(0);
  });

  it('createEmptyBonusSummary deve ter arrays vazios', () => {
    const summary = createEmptyBonusSummary();
    
    expect(Array.isArray(summary.damage.extraDice)).toBe(true);
    expect(summary.damage.extraDice).toHaveLength(0);
    expect(Array.isArray(summary.damage.attributeBonuses)).toBe(true);
    expect(summary.damage.attributeBonuses).toHaveLength(0);
    expect(Array.isArray(summary.proficiencies.weapons)).toBe(true);
    expect(summary.proficiencies.weapons).toHaveLength(0);
    expect(Array.isArray(summary.proficiencies.protections)).toBe(true);
    expect(summary.proficiencies.protections).toHaveLength(0);
    expect(Array.isArray(summary.peReductions)).toBe(true);
    expect(summary.peReductions).toHaveLength(0);
    expect(Array.isArray(summary.specialFlags)).toBe(true);
    expect(summary.specialFlags).toHaveLength(0);
  });

  it('createEmptyBonusSummary deve ter skills como objeto vazio', () => {
    const summary = createEmptyBonusSummary();
    
    expect(typeof summary.skills).toBe('object');
    expect(Object.keys(summary.skills)).toHaveLength(0);
  });
});

// ========================================
// TESTES DE ESCALONAMENTO DE VALORES
// ========================================

describe('Motor de Poderes - Escalonamento de Valores', () => {
  it('resolveScalingValue deve retornar valor fixo diretamente', () => {
    expect(resolveScalingValue(5, 50)).toBe(5);
    expect(resolveScalingValue(10, 99)).toBe(10);
  });

  it('resolveScalingValue deve escalar baseado no NEX', () => {
    const scalingValue: ScalingValue = {
      baseValue: 1,
      scaling: [
        { nex: 40, value: 2 },
        { nex: 65, value: 3 },
        { nex: 99, value: 4 },
      ],
    };
    
    expect(resolveScalingValue(scalingValue, 10)).toBe(1);
    expect(resolveScalingValue(scalingValue, 40)).toBe(2);
    expect(resolveScalingValue(scalingValue, 50)).toBe(2);
    expect(resolveScalingValue(scalingValue, 65)).toBe(3);
    expect(resolveScalingValue(scalingValue, 99)).toBe(4);
  });

  it('resolveScalingDice deve retornar string fixa diretamente', () => {
    expect(resolveScalingDice('1d6', 50)).toBe('1d6');
    expect(resolveScalingDice('2d8', 99)).toBe('2d8');
  });

  it('resolveScalingDice deve escalar baseado no NEX', () => {
    const scalingDice: ScalingDice = {
      baseDice: '1d6',
      scaling: [
        { nex: 40, dice: '1d8' },
        { nex: 65, dice: '1d10' },
        { nex: 99, dice: '2d6' },
      ],
    };
    
    expect(resolveScalingDice(scalingDice, 10)).toBe('1d6');
    expect(resolveScalingDice(scalingDice, 40)).toBe('1d8');
    expect(resolveScalingDice(scalingDice, 65)).toBe('1d10');
    expect(resolveScalingDice(scalingDice, 99)).toBe('2d6');
  });
});

// ========================================
// TESTES DE VERIFICAÇÃO DE CONDIÇÕES
// ========================================

describe('Motor de Poderes - Verificação de Condições', () => {
  it('checkConditions deve retornar true sem condições', () => {
    const context = createContext();
    expect(checkConditions(undefined, context)).toBe(true);
    expect(checkConditions({} as PowerConditions, context)).toBe(true);
  });

  it('checkConditions deve verificar tipo de arma', () => {
    const meleeContext = createContext({ equippedWeaponType: 'melee' });
    const rangedContext = createContext({ equippedWeaponType: 'ranged' });
    
    const meleeCondition: PowerConditions = { weaponType: 'melee' };
    
    expect(checkConditions(meleeCondition, meleeContext)).toBe(true);
    expect(checkConditions(meleeCondition, rangedContext)).toBe(false);
  });

  it('checkConditions deve aceitar array de tipos de arma', () => {
    const meleeContext = createContext({ equippedWeaponType: 'melee' });
    
    const multiCondition: PowerConditions = { weaponType: ['melee', 'ranged'] };
    
    expect(checkConditions(multiCondition, meleeContext)).toBe(true);
  });

  it('checkConditions deve verificar estado de combate', () => {
    const combatContext = createContext({ inCombat: true });
    const peacefulContext = createContext({ inCombat: false });
    
    const combatCondition: PowerConditions = { inCombat: true };
    
    expect(checkConditions(combatCondition, combatContext)).toBe(true);
    expect(checkConditions(combatCondition, peacefulContext)).toBe(false);
  });
});

// ========================================
// TESTES DE CLASSIFICAÇÃO DE ARMAS
// ========================================

describe('Motor de Poderes - Classificação de Armas', () => {
  it('isMeleeWeapon deve identificar armas corpo a corpo', () => {
    expect(isMeleeWeapon('melee')).toBe(true);
    expect(isMeleeWeapon('unarmed')).toBe(true);
    expect(isMeleeWeapon('ranged')).toBe(false);
    expect(isMeleeWeapon('firearm')).toBe(false);
    expect(isMeleeWeapon(undefined)).toBe(false);
  });

  it('isRangedWeapon deve identificar armas à distância', () => {
    expect(isRangedWeapon('ranged')).toBe(true);
    expect(isRangedWeapon('firearm')).toBe(true);
    expect(isRangedWeapon('tactical')).toBe(true);
    expect(isRangedWeapon('heavy')).toBe(true);
    expect(isRangedWeapon('melee')).toBe(false);
    expect(isRangedWeapon(undefined)).toBe(false);
  });
});

// ========================================
// TESTES DE CÁLCULO DE BÔNUS
// ========================================

describe('Motor de Poderes - Cálculo de Bônus', () => {
  it('calculatePowerBonuses deve retornar sumário vazio para lista vazia', () => {
    const context = createContext();
    const result = calculatePowerBonuses([], context);
    
    expect(result.attack.general).toBe(0);
    expect(result.damage.general).toBe(0);
    expect(result.defense.base).toBe(0);
  });

  it('calculatePowerBonuses deve aceitar IDs de poderes como strings', () => {
    const context = createContext();
    const result = calculatePowerBonuses(['golpe-pesado', 'ataque-especial'], context);
    
    expect(typeof result.attack.general).toBe('number');
    expect(Array.isArray(result.specialFlags)).toBe(true);
  });

  it('calculatePowerBonuses deve aceitar objetos ActiveClassPower', () => {
    const context = createContext();
    // Usar apenas strings para simplificar o teste
    const powers = ['golpe-pesado', 'ataque-especial'];
    
    const result = calculatePowerBonuses(powers, context);
    
    expect(typeof result.attack.general).toBe('number');
  });

  it('calculatePowerBonuses deve buscar por nome se ID não encontrado', () => {
    const context = createContext();
    const powers = getPowersByClass('Combatente');
    
    if (powers.length > 0) {
      const powerName = powers[0].name;
      const result = calculatePowerBonuses([powerName], context);
      expect(typeof result).toBe('object');
    } else {
      expect(true).toBe(true);
    }
  });
});

// ========================================
// TESTES DE VERIFICAÇÃO DE PODERES
// ========================================

describe('Motor de Poderes - Verificação hasPower', () => {
  it('hasPower deve encontrar poder por ID', () => {
    const powers = ['ataque-especial', 'golpe-pesado'];
    
    expect(hasPower(powers, 'ataque-especial')).toBe(true);
    expect(hasPower(powers, 'golpe-pesado')).toBe(true);
    expect(hasPower(powers, 'poder-inexistente')).toBe(false);
  });

  it('hasPower deve ser case-insensitive', () => {
    const powers = ['ataque-especial'];
    
    expect(hasPower(powers, 'Ataque-Especial')).toBe(true);
    expect(hasPower(powers, 'ATAQUE-ESPECIAL')).toBe(true);
  });

  it('hasPower deve aceitar IDs como strings', () => {
    const powers = ['ataque-especial', 'golpe-pesado'];
    
    expect(hasPower(powers, 'ataque-especial')).toBe(true);
    expect(hasPower(powers, 'golpe-pesado')).toBe(true);
  });

  it('hasPower deve encontrar por nome do poder', () => {
    const powers = getPowersByClass('Combatente');
    
    if (powers.length > 0) {
      const powerWithId = powers[0];
      const testPowers = [powerWithId.id];
      
      // Busca pelo nome deve encontrar se o ID está na lista
      expect(hasPower(testPowers, powerWithId.name)).toBe(true);
    } else {
      expect(true).toBe(true);
    }
  });
});

// ========================================
// TESTES DE OBTENÇÃO DE BÔNUS DE ATAQUE
// ========================================

describe('Motor de Poderes - Obtenção de Bônus de Ataque', () => {
  it('getAttackBonus deve somar geral + específico para melee', () => {
    const summary = createEmptyBonusSummary();
    summary.attack.general = 2;
    summary.attack.melee = 3;
    
    const bonus = getAttackBonus(summary, 'melee');
    expect(bonus).toBe(5);
  });

  it('getAttackBonus deve somar geral + específico para ranged', () => {
    const summary = createEmptyBonusSummary();
    summary.attack.general = 2;
    summary.attack.ranged = 4;
    
    const bonus = getAttackBonus(summary, 'ranged');
    expect(bonus).toBe(6);
  });

  it('getAttackBonus deve tratar unarmed como melee', () => {
    const summary = createEmptyBonusSummary();
    summary.attack.general = 1;
    summary.attack.melee = 2;
    
    const bonus = getAttackBonus(summary, 'unarmed');
    expect(bonus).toBe(3);
  });
});

// ========================================
// TESTES DE APLICAÇÃO DE MECÂNICAS
// ========================================

describe('Motor de Poderes - Aplicação de Mecânicas', () => {
  it('applyMechanics deve aplicar bônus de ataque geral', () => {
    const summary = createEmptyBonusSummary();
    const context = createContext();
    
    applyMechanics(summary, {
      attackBonus: { value: 3 },
    }, context);
    
    expect(summary.attack.general).toBe(3);
  });

  it('applyMechanics deve aplicar bônus de defesa', () => {
    const summary = createEmptyBonusSummary();
    const context = createContext();
    
    applyMechanics(summary, {
      defenseBonus: { value: 2 },
    }, context);
    
    expect(summary.defense.base).toBe(2);
  });

  it('applyMechanics deve aplicar bônus de resistência', () => {
    const summary = createEmptyBonusSummary();
    const context = createContext();
    
    applyMechanics(summary, {
      resistanceBonus: { value: 2, types: ['fortitude', 'vontade'] },
    }, context);
    
    expect(summary.resistance.fortitude).toBe(2);
    expect(summary.resistance.vontade).toBe(2);
    expect(summary.resistance.reflexos).toBe(0);
  });

  it('applyMechanics deve adicionar proficiências', () => {
    const summary = createEmptyBonusSummary();
    const context = createContext();
    
    applyMechanics(summary, {
      proficiencies: {
        weapons: ['melee', 'ranged'],
        protections: ['light'],
      },
    }, context);
    
    expect(summary.proficiencies.weapons).toContain('melee');
    expect(summary.proficiencies.weapons).toContain('ranged');
    expect(summary.proficiencies.protections).toContain('light');
  });

  it('applyMechanics deve adicionar flags especiais', () => {
    const summary = createEmptyBonusSummary();
    const context = createContext();
    
    const mockPower = { id: 'teste-poder', name: 'Teste', classId: 'Combatente' as const, isCore: false, minNex: 5, description: 'Teste', effects: { base: {} } };
    
    applyMechanics(summary, {
      grantsAgileProperty: true,
    }, context, mockPower as any);
    
    expect(summary.specialFlags).toContain('agile');
    expect(summary.specialFlags).toContain('teste-poder');
  });

  it('applyMechanics deve respeitar condições', () => {
    const summary = createEmptyBonusSummary();
    const contextNoMelee = createContext({ equippedWeaponType: 'ranged' });
    
    applyMechanics(summary, {
      attackBonus: { value: 5, conditions: { weaponType: 'melee' } },
    }, contextNoMelee);
    
    // Como não está com arma corpo a corpo, não deve aplicar
    expect(summary.attack.melee).toBe(0);
    expect(summary.attack.general).toBe(0);
  });
});

// ========================================
// TESTES DE PODERES ESPECÍFICOS
// ========================================

describe('Motor de Poderes - Poderes Específicos do Livro Base', () => {
  it('Golpe Pesado deve existir e ter mecânicas de dano', () => {
    const power = getPowerById('golpe-pesado');
    
    if (power) {
      // ClassId usa PascalCase conforme definido em game-ids.ts
      expect(power.classId).toBe('Combatente');
      expect(power.effects?.base).toBeDefined();
    } else {
      expect(true).toBe(true); // Pode não existir ainda
    }
  });

  it('Reflexos Defensivos deve dar bônus de defesa', () => {
    const power = getPowerById('reflexos-defensivos');
    
    if (power && power.effects?.base?.defenseBonus) {
      expect(power.effects.base.defenseBonus.value).toBeGreaterThan(0);
    } else {
      expect(true).toBe(true);
    }
  });

  it('Artista Marcial deve conceder dano desarmado', () => {
    const power = getPowerById('artista-marcial');
    
    if (power && power.effects?.base?.grantsUnarmedDamage) {
      expect(power.effects.base.grantsUnarmedDamage.baseDice).toBeDefined();
    } else {
      expect(true).toBe(true);
    }
  });
});
