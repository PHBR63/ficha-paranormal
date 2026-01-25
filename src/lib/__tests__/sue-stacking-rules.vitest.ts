/**
 * Testes de Regras de Stacking - SUE Hardening
 * Ordem Paranormal RPG v1.3
 * 
 * Valida a aplicação correta das regras oficiais de acúmulo de bônus.
 */

import { describe, it, expect } from 'vitest';
import {
  applyStackingRules,
  canBonusBeApplied,
  getStackingRule,
  conditionAccumulatesDamage,
  STACKING_RULES,
  type StackableBonus,
} from '../sue';

// ========================================
// HELPERS DE TESTE
// ========================================

/**
 * Cria um bônus de teste
 */
function createBonus(
  overrides: Partial<StackableBonus>
): StackableBonus {
  return {
    id: `bonus-${Math.random().toString(36).substr(2, 9)}`,
    source: 'origin',
    sourceId: 'test-source',
    sourceName: 'Fonte de Teste',
    value: 2,
    category: 'attack',
    active: true,
    ...overrides,
  };
}

// ========================================
// TESTES: REGRAS GERAIS
// ========================================

describe('Regras Gerais de Stacking', () => {
  it('Bônus de fontes DIFERENTES devem acumular', () => {
    const bonuses: StackableBonus[] = [
      createBonus({ source: 'origin', sourceId: 'origem-1', sourceName: 'Mercenário', value: 2 }),
      createBonus({ source: 'class_power', sourceId: 'poder-1', sourceName: 'Ataque Especial', value: 3 }),
      createBonus({ source: 'track', sourceId: 'trilha-1', sourceName: 'Aniquilador', value: 2 }),
    ];
    
    const result = applyStackingRules(bonuses, 'attack');
    
    expect(result.total).toBe(7); // 2 + 3 + 2
    expect(result.applied).toHaveLength(3);
    expect(result.excluded).toHaveLength(0);
  });
  
  it('Bônus inativos não devem ser considerados', () => {
    const bonuses: StackableBonus[] = [
      createBonus({ value: 5, active: true }),
      createBonus({ value: 3, active: false }),
    ];
    
    const result = applyStackingRules(bonuses, 'attack');
    
    expect(result.total).toBe(5);
    expect(result.applied).toHaveLength(1);
  });
});

// ========================================
// TESTES: RITUAIS
// ========================================

describe('Regras de Stacking - Rituais', () => {
  it('Rituais NÃO devem acumular entre si (usa o maior)', () => {
    const bonuses: StackableBonus[] = [
      createBonus({ source: 'ritual', sourceId: 'ritual-1', sourceName: 'Arma Amaldiçoada', value: 4 }),
      createBonus({ source: 'ritual', sourceId: 'ritual-2', sourceName: 'Bênção', value: 2 }),
      createBonus({ source: 'ritual', sourceId: 'ritual-3', sourceName: 'Força Interior', value: 3 }),
    ];
    
    const result = applyStackingRules(bonuses, 'attack');
    
    // Apenas o maior (4) deve aplicar
    expect(result.total).toBe(4);
    expect(result.applied).toHaveLength(1);
    expect(result.applied[0].value).toBe(4);
    expect(result.excluded).toHaveLength(2);
  });
  
  it('Ritual + Outras fontes devem acumular', () => {
    const bonuses: StackableBonus[] = [
      createBonus({ source: 'ritual', sourceId: 'ritual-1', sourceName: 'Arma Amaldiçoada', value: 3 }),
      createBonus({ source: 'origin', sourceId: 'origem-1', sourceName: 'Mercenário', value: 2 }),
      createBonus({ source: 'class_power', sourceId: 'poder-1', sourceName: 'Ataque Especial', value: 1 }),
    ];
    
    const result = applyStackingRules(bonuses, 'attack');
    
    expect(result.total).toBe(6); // 3 + 2 + 1
    expect(result.applied).toHaveLength(3);
  });
});

// ========================================
// TESTES: EQUIPAMENTOS
// ========================================

describe('Regras de Stacking - Equipamentos', () => {
  it('Múltiplos itens do mesmo tipo NÃO devem acumular (usa o maior)', () => {
    const bonuses: StackableBonus[] = [
      createBonus({ 
        source: 'equipment', 
        sourceId: 'arma-1', 
        sourceName: 'Espada Longa +2', 
        value: 2,
        subtype: 'weapon' 
      }),
      createBonus({ 
        source: 'equipment', 
        sourceId: 'arma-2', 
        sourceName: 'Machado +1', 
        value: 1,
        subtype: 'weapon' 
      }),
    ];
    
    const result = applyStackingRules(bonuses, 'attack');
    
    expect(result.total).toBe(2); // Apenas +2
    expect(result.applied).toHaveLength(1);
    expect(result.excluded).toHaveLength(1);
  });
  
  it('Defesa: Armadura + Escudo + Paranormal devem acumular', () => {
    const bonuses: StackableBonus[] = [
      createBonus({ 
        source: 'equipment', 
        sourceId: 'armor-1', 
        sourceName: 'Armadura Leve', 
        value: 3,
        category: 'defense',
        subtype: 'armor' 
      }),
      createBonus({ 
        source: 'equipment', 
        sourceId: 'shield-1', 
        sourceName: 'Escudo Médio', 
        value: 2,
        category: 'defense',
        subtype: 'shield' 
      }),
      createBonus({ 
        source: 'equipment', 
        sourceId: 'paranormal-1', 
        sourceName: 'Amuleto de Proteção', 
        value: 1,
        category: 'defense',
        subtype: 'paranormal' 
      }),
    ];
    
    const result = applyStackingRules(bonuses, 'defense');
    
    expect(result.total).toBe(6); // 3 + 2 + 1
    expect(result.applied).toHaveLength(3);
    expect(result.excluded).toHaveLength(0);
  });
  
  it('Múltiplas armaduras NÃO devem acumular (usa a maior)', () => {
    const bonuses: StackableBonus[] = [
      createBonus({ 
        source: 'equipment', 
        sourceId: 'armor-1', 
        sourceName: 'Armadura Leve', 
        value: 3,
        category: 'defense',
        subtype: 'armor' 
      }),
      createBonus({ 
        source: 'equipment', 
        sourceId: 'armor-2', 
        sourceName: 'Armadura Pesada', 
        value: 5,
        category: 'defense',
        subtype: 'armor' 
      }),
    ];
    
    const result = applyStackingRules(bonuses, 'defense');
    
    expect(result.total).toBe(5); // Apenas a maior
    expect(result.applied).toHaveLength(1);
    expect(result.applied[0].sourceName).toBe('Armadura Pesada');
  });
});

// ========================================
// TESTES: CONDIÇÕES ESPECIAIS
// ========================================

describe('Regras de Stacking - Condições Especiais', () => {
  it('Envenenado: dano recorrente deve acumular de múltiplas fontes', () => {
    expect(conditionAccumulatesDamage('envenenado')).toBe(true);
    expect(conditionAccumulatesDamage('Envenenado')).toBe(true);
  });
  
  it('Sangrando: dano recorrente deve acumular de múltiplas fontes', () => {
    expect(conditionAccumulatesDamage('sangrando')).toBe(true);
  });
  
  it('Machucado: dano ao agir deve acumular', () => {
    expect(conditionAccumulatesDamage('machucado')).toBe(true);
  });
  
  it('Outras condições não devem acumular dano', () => {
    expect(conditionAccumulatesDamage('agarrado')).toBe(false);
    expect(conditionAccumulatesDamage('atordoado')).toBe(false);
    expect(conditionAccumulatesDamage('cego')).toBe(false);
  });
  
  it('Condição com acúmulo de dano deve somar múltiplas instâncias', () => {
    const bonuses: StackableBonus[] = [
      createBonus({ 
        source: 'condition', 
        sourceId: 'veneno-aranha', 
        sourceName: 'Veneno de Aranha', 
        value: 6, // 1d6
        category: 'damage',
      }),
      createBonus({ 
        source: 'condition', 
        sourceId: 'veneno-cobra', 
        sourceName: 'Veneno de Cobra', 
        value: 6, // 1d6
        category: 'damage',
      }),
      createBonus({ 
        source: 'condition', 
        sourceId: 'veneno-escorpiao', 
        sourceName: 'Veneno de Escorpião', 
        value: 4, // 1d4
        category: 'damage',
      }),
    ];
    
    const result = applyStackingRules(bonuses, 'damage');
    
    // Todos devem acumular: 6 + 6 + 4 = 16
    expect(result.total).toBe(16);
    expect(result.applied).toHaveLength(3);
    expect(result.excluded).toHaveLength(0);
  });
  
  it('Limite de pilhas deve ser respeitado', () => {
    // Cria 12 bônus de condição (limite é 10)
    const bonuses: StackableBonus[] = Array.from({ length: 12 }, (_, i) =>
      createBonus({ 
        source: 'condition', 
        sourceId: `veneno-${i}`, 
        sourceName: `Veneno ${i}`, 
        value: 1,
        category: 'damage',
      })
    );
    
    const result = applyStackingRules(bonuses, 'damage');
    
    // Apenas 10 devem aplicar
    expect(result.total).toBe(10);
    expect(result.applied).toHaveLength(10);
    expect(result.excluded).toHaveLength(2);
    expect(result.excluded[0].source).toBe('condition');
  });
});

// ========================================
// TESTES: VALIDAÇÃO DE APLICAÇÃO
// ========================================

describe('Validação de Aplicação de Bônus', () => {
  it('Deve permitir aplicar bônus de fonte diferente', () => {
    const existing: StackableBonus[] = [
      createBonus({ source: 'origin', sourceId: 'origem-1' }),
    ];
    
    const newBonus = createBonus({ source: 'class_power', sourceId: 'poder-1' });
    
    const result = canBonusBeApplied(newBonus, existing);
    
    expect(result.canApply).toBe(true);
  });
  
  it('Deve bloquear bônus duplicado de mesma fonte específica (ritual)', () => {
    const existing: StackableBonus[] = [
      createBonus({ source: 'ritual', sourceId: 'ritual-forca' }),
    ];
    
    const newBonus = createBonus({ source: 'ritual', sourceId: 'ritual-forca' });
    
    const result = canBonusBeApplied(newBonus, existing);
    
    expect(result.canApply).toBe(false);
    expect(result.reason).toContain('já aplicado');
  });
  
  it('Deve permitir múltiplos poderes de classe diferentes', () => {
    const existing: StackableBonus[] = [
      createBonus({ source: 'class_power', sourceId: 'poder-1' }),
    ];
    
    const newBonus = createBonus({ source: 'class_power', sourceId: 'poder-2' });
    
    const result = canBonusBeApplied(newBonus, existing);
    
    expect(result.canApply).toBe(true);
  });
});

// ========================================
// TESTES: OBTENÇÃO DE REGRAS
// ========================================

describe('Obtenção de Regras de Stacking', () => {
  it('Deve retornar regra correta para rituais', () => {
    const rule = getStackingRule('ritual', 'attack');
    expect(rule).toBe('highest_same_type');
  });
  
  it('Deve retornar regra correta para defesa de equipamento', () => {
    const rule = getStackingRule('equipment', 'defense');
    expect(rule).toBe('defense_special');
  });
  
  it('Deve retornar regra padrão para categoria não especificada', () => {
    const rule = getStackingRule('origin', 'initiative');
    expect(rule).toBe('sum_all');
  });
  
  it('Condições devem ter regra de acúmulo de dano', () => {
    const rule = getStackingRule('condition', 'damage');
    expect(rule).toBe('accumulate_damage');
  });
});

// ========================================
// TESTES: CONFIGURAÇÃO DE FONTES
// ========================================

describe('Configuração de Fontes', () => {
  it('Rituais devem estar configurados para não acumular', () => {
    const config = STACKING_RULES.ritual;
    expect(config.sameInstanceStacks).toBe(false);
    expect(config.defaultRule).toBe('highest_same_type');
  });
  
  it('Poderes paranormais devem acumular defesa', () => {
    const config = STACKING_RULES.paranormal_power;
    expect(config.categoryOverrides?.defense).toBe('sum_all');
  });
  
  it('Condições devem ter limite de pilhas', () => {
    const config = STACKING_RULES.condition;
    expect(config.maxStacks).toBe(10);
  });
  
  it('Equipamento deve ter regra especial de defesa', () => {
    const config = STACKING_RULES.equipment;
    expect(config.categoryOverrides?.defense).toBe('defense_special');
  });
});
