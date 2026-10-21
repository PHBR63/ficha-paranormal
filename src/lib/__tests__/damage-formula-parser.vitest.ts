/**
 * Testes do Parser de Fórmula de Dano
 * Ordem Paranormal RPG v1.3
 */

import { describe, it, expect } from 'vitest';
import {
  parseDamageFormula,
  rollDamageFromFormula,
  combineDamageFormulas,
  calculateAverageDamage,
  calculateMaxDamage,
  calculateMinDamage,
  toLegacyDamageParams,
} from '../rules-engine/helpers/damage-formula-parser';

// =====================================================
// TESTES DE PARSING
// =====================================================

describe('parseDamageFormula', () => {
  describe('fórmulas simples', () => {
    it('deve parsear "1d6"', () => {
      const result = parseDamageFormula('1d6');
      expect(result.isValid).toBe(true);
      expect(result.diceGroups).toHaveLength(1);
      expect(result.diceGroups[0]).toEqual({ count: 1, sides: 6, element: undefined });
      expect(result.flatBonus).toBe(0);
    });

    it('deve parsear "2d8"', () => {
      const result = parseDamageFormula('2d8');
      expect(result.isValid).toBe(true);
      expect(result.diceGroups[0]).toEqual({ count: 2, sides: 8, element: undefined });
    });

    it('deve parsear "1d12"', () => {
      const result = parseDamageFormula('1d12');
      expect(result.isValid).toBe(true);
      expect(result.diceGroups[0]).toEqual({ count: 1, sides: 12, element: undefined });
    });

    it('deve parsear "3d4"', () => {
      const result = parseDamageFormula('3d4');
      expect(result.isValid).toBe(true);
      expect(result.diceGroups[0]).toEqual({ count: 3, sides: 4, element: undefined });
    });
  });

  describe('fórmulas com bônus', () => {
    it('deve parsear "1d8+3"', () => {
      const result = parseDamageFormula('1d8+3');
      expect(result.isValid).toBe(true);
      expect(result.diceGroups[0]).toEqual({ count: 1, sides: 8, element: undefined });
      expect(result.flatBonus).toBe(3);
    });

    it('deve parsear "2d6+5"', () => {
      const result = parseDamageFormula('2d6+5');
      expect(result.isValid).toBe(true);
      expect(result.diceGroups[0]).toEqual({ count: 2, sides: 6, element: undefined });
      expect(result.flatBonus).toBe(5);
    });

    it('deve parsear "1d10-2" (penalidade)', () => {
      const result = parseDamageFormula('1d10-2');
      expect(result.isValid).toBe(true);
      expect(result.diceGroups[0]).toEqual({ count: 1, sides: 10, element: undefined });
      expect(result.flatBonus).toBe(-2);
    });
  });

  describe('fórmulas com múltiplos dados', () => {
    it('deve parsear "1d8+1d6"', () => {
      const result = parseDamageFormula('1d8+1d6');
      expect(result.isValid).toBe(true);
      expect(result.diceGroups).toHaveLength(2);
      expect(result.diceGroups[0]).toEqual({ count: 1, sides: 8, element: undefined });
      expect(result.diceGroups[1]).toEqual({ count: 1, sides: 6, element: undefined });
    });

    it('deve parsear "2d6+1d4+3"', () => {
      const result = parseDamageFormula('2d6+1d4+3');
      expect(result.isValid).toBe(true);
      expect(result.diceGroups).toHaveLength(2);
      expect(result.diceGroups[0]).toEqual({ count: 2, sides: 6, element: undefined });
      expect(result.diceGroups[1]).toEqual({ count: 1, sides: 4, element: undefined });
      expect(result.flatBonus).toBe(3);
    });

    it('deve parsear "1d12+2d6"', () => {
      const result = parseDamageFormula('1d12+2d6');
      expect(result.isValid).toBe(true);
      expect(result.diceGroups).toHaveLength(2);
    });
  });

  describe('fórmulas com tipo de dano', () => {
    it('deve parsear "1d8 fogo"', () => {
      const result = parseDamageFormula('1d8 fogo');
      expect(result.isValid).toBe(true);
      expect(result.diceGroups[0]).toEqual({ count: 1, sides: 8, element: 'fogo' });
      expect(result.damageType).toBe('fogo');
    });

    it('deve parsear "2d6+3 elétrico"', () => {
      const result = parseDamageFormula('2d6+3 elétrico');
      expect(result.isValid).toBe(true);
      expect(result.damageType).toBe('elétrico');
      expect(result.flatBonus).toBe(3);
    });

    it('deve parsear "1d6 frio"', () => {
      const result = parseDamageFormula('1d6 frio');
      expect(result.isValid).toBe(true);
      expect(result.damageType).toBe('frio');
    });

    it('deve parsear "3d8 medo"', () => {
      const result = parseDamageFormula('3d8 medo');
      expect(result.isValid).toBe(true);
      expect(result.damageType).toBe('medo');
    });
  });

  describe('casos de borda', () => {
    it('deve retornar inválido para string vazia', () => {
      const result = parseDamageFormula('');
      expect(result.isValid).toBe(false);
    });

    it('deve retornar inválido para null/undefined', () => {
      const result = parseDamageFormula(null as any);
      expect(result.isValid).toBe(false);
    });

    it('deve retornar inválido para texto sem dados', () => {
      const result = parseDamageFormula('apenas texto');
      expect(result.isValid).toBe(false);
    });

    it('deve parsear número puro como bônus fixo', () => {
      const result = parseDamageFormula('5');
      expect(result.isValid).toBe(true);
      expect(result.diceGroups).toHaveLength(0);
      expect(result.flatBonus).toBe(5);
    });

    it('deve ignorar espaços extras', () => {
      const result = parseDamageFormula('  1d8 + 3  ');
      expect(result.isValid).toBe(true);
      expect(result.diceGroups[0].count).toBe(1);
      expect(result.diceGroups[0].sides).toBe(8);
    });
  });
});

// =====================================================
// TESTES DE ROLAGEM
// =====================================================

describe('rollDamageFromFormula', () => {
  describe('rolagem básica', () => {
    it('deve rolar dano e retornar resultado válido', () => {
      const result = rollDamageFromFormula('1d6');
      
      expect(result.diceResults).toHaveLength(1);
      expect(result.diceResults[0].rolls).toHaveLength(1);
      expect(result.diceResults[0].rolls[0]).toBeGreaterThanOrEqual(1);
      expect(result.diceResults[0].rolls[0]).toBeLessThanOrEqual(6);
      expect(result.total).toBeGreaterThanOrEqual(1);
      expect(result.isCritical).toBe(false);
    });

    it('deve rolar múltiplos dados', () => {
      const result = rollDamageFromFormula('2d6');
      
      expect(result.diceResults[0].rolls).toHaveLength(2);
      expect(result.total).toBeGreaterThanOrEqual(2);
      expect(result.total).toBeLessThanOrEqual(12);
    });

    it('deve aplicar bônus fixo', () => {
      const result = rollDamageFromFormula('1d6+5');
      
      expect(result.flatBonus).toBe(5);
      expect(result.total).toBeGreaterThanOrEqual(6); // 1 + 5
      expect(result.total).toBeLessThanOrEqual(11); // 6 + 5
    });
  });

  describe('crítico', () => {
    it('deve dobrar quantidade de dados em crítico', () => {
      const result = rollDamageFromFormula('1d6', { isCritical: true });
      
      expect(result.diceResults[0].rolls).toHaveLength(2); // 1 * 2 = 2 dados
      expect(result.isCritical).toBe(true);
    });

    it('deve aplicar multiplicador de crítico customizado', () => {
      const result = rollDamageFromFormula('1d6', { 
        isCritical: true, 
        criticalMultiplier: 3 
      });
      
      expect(result.diceResults[0].rolls).toHaveLength(3); // 1 * 3 = 3 dados
    });

    it('não multiplica dados extras em crítico', () => {
      const result = rollDamageFromFormula('1d6', {
        isCritical: true,
        extraDice: [{ count: 1, sides: 6 }],
      });

      expect(result.diceResults[0].rolls).toHaveLength(2);
      expect(result.extraDiceResults[0].rolls).toHaveLength(1);
    });

    it('multiplica apenas dado extra identificado como dado da arma', () => {
      const result = rollDamageFromFormula('1d8', {
        isCritical: true,
        criticalMultiplier: 3,
        extraDice: [
          { count: 1, sides: 8, criticalAsWeapon: true },
          { count: 2, sides: 6 },
        ],
      });

      expect(result.extraDiceResults[0].rolls).toHaveLength(3);
      expect(result.extraDiceResults[1].rolls).toHaveLength(2);
    });
  });

  describe('maximizeDice (Atirar para Matar)', () => {
    it('deve retornar valor máximo dos dados', () => {
      const result = rollDamageFromFormula('1d6', { 
        maximizeDice: true 
      });
      
      expect(result.diceResults[0].rolls[0]).toBe(6);
      expect(result.diceResults[0].subtotal).toBe(6);
    });

    it('deve maximizar múltiplos dados', () => {
      const result = rollDamageFromFormula('2d8', { 
        maximizeDice: true 
      });
      
      expect(result.diceResults[0].rolls).toEqual([8, 8]);
      expect(result.diceResults[0].subtotal).toBe(16);
    });
  });

  describe('doubleBonuses (Potência Máxima)', () => {
    it('deve dobrar bônus numéricos', () => {
      const result = rollDamageFromFormula('1d6+5', { 
        doubleBonuses: true 
      });
      
      expect(result.flatBonus).toBe(10); // 5 * 2
    });

    it('deve dobrar bônus externos também', () => {
      const result = rollDamageFromFormula('1d6', { 
        bonusDamage: 3,
        doubleBonuses: true 
      });
      
      expect(result.flatBonus).toBe(6); // 3 * 2
    });
  });

  describe('dados extras', () => {
    it('deve incluir dados extras de buffs', () => {
      const result = rollDamageFromFormula('1d8', {
        extraDice: [{ count: 1, sides: 6, element: 'fogo' }],
      });
      
      expect(result.extraDiceResults).toHaveLength(1);
      expect(result.extraDiceResults[0].group.element).toBe('fogo');
    });

    it('deve somar dados extras ao total', () => {
      // Fazer múltiplas rolagens para verificar soma
      for (let i = 0; i < 10; i++) {
        const result = rollDamageFromFormula('1d6', {
          extraDice: [{ count: 1, sides: 6 }],
        });
        
        const baseTotal = result.diceResults[0].subtotal;
        const extraTotal = result.extraDiceResults[0].subtotal;
        
        expect(result.total).toBe(baseTotal + extraTotal);
      }
    });
  });

  describe('breakdown', () => {
    it('deve incluir fórmula no breakdown', () => {
      const result = rollDamageFromFormula('2d6+3');
      
      expect(result.breakdown.formula).toBe('2d6+3');
    });

    it('deve incluir tipo de dano no resultado', () => {
      const result = rollDamageFromFormula('1d8 fogo');
      
      expect(result.damageType).toBe('fogo');
      expect(result.breakdown.result).toContain('fogo');
    });
  });
});

// =====================================================
// TESTES DE UTILITÁRIOS
// =====================================================

describe('combineDamageFormulas', () => {
  it('deve combinar duas fórmulas simples', () => {
    const result = combineDamageFormulas('1d6', '1d8');
    
    expect(result.isValid).toBe(true);
    expect(result.diceGroups).toHaveLength(2);
    expect(result.diceGroups[0]).toEqual({ count: 1, sides: 6, element: undefined });
    expect(result.diceGroups[1]).toEqual({ count: 1, sides: 8, element: undefined });
  });

  it('deve somar bônus fixos', () => {
    const result = combineDamageFormulas('1d6+2', '1d8+3');
    
    expect(result.flatBonus).toBe(5); // 2 + 3
  });

  it('deve preservar primeiro tipo de dano', () => {
    const result = combineDamageFormulas('1d6 fogo', '1d8 frio');
    
    expect(result.damageType).toBe('fogo');
  });
});

describe('calculateAverageDamage', () => {
  it('deve calcular média de 1d6', () => {
    const avg = calculateAverageDamage('1d6');
    expect(avg).toBe(3.5); // (1+6)/2
  });

  it('deve calcular média de 2d6', () => {
    const avg = calculateAverageDamage('2d6');
    expect(avg).toBe(7); // 2 * 3.5
  });

  it('deve incluir bônus na média', () => {
    const avg = calculateAverageDamage('1d6+3');
    expect(avg).toBe(6.5); // 3.5 + 3
  });
});

describe('calculateMaxDamage', () => {
  it('deve calcular máximo de 1d6', () => {
    const max = calculateMaxDamage('1d6');
    expect(max).toBe(6);
  });

  it('deve calcular máximo de 2d8+5', () => {
    const max = calculateMaxDamage('2d8+5');
    expect(max).toBe(21); // 16 + 5
  });
});

describe('calculateMinDamage', () => {
  it('deve calcular mínimo de 1d6', () => {
    const min = calculateMinDamage('1d6');
    expect(min).toBe(1);
  });

  it('deve calcular mínimo de 2d8+5', () => {
    const min = calculateMinDamage('2d8+5');
    expect(min).toBe(7); // 2 + 5
  });

  it('deve retornar 0 para mínimo negativo', () => {
    const min = calculateMinDamage('1d4-10');
    expect(min).toBe(0); // max(0, 1 - 10)
  });
});

describe('toLegacyDamageParams', () => {
  it('deve converter para formato legado', () => {
    const parsed = parseDamageFormula('2d8+3');
    const legacy = toLegacyDamageParams(parsed);
    
    expect(legacy.diceCount).toBe(2);
    expect(legacy.diceType).toBe(8);
    expect(legacy.bonusDamage).toBe(3);
    expect(legacy.isCritical).toBe(false);
    expect(legacy.criticalMultiplier).toBe(2);
  });

  it('deve incluir opções de crítico', () => {
    const parsed = parseDamageFormula('1d6');
    const legacy = toLegacyDamageParams(parsed, { 
      isCritical: true, 
      criticalMultiplier: 3 
    });
    
    expect(legacy.isCritical).toBe(true);
    expect(legacy.criticalMultiplier).toBe(3);
  });
});
