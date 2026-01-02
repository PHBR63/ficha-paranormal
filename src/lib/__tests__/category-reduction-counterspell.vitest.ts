// =====================================================
// Testes: categoryReduction e counterSpell no SUE
// Ordem Paranormal RPG v1.3
// =====================================================
//
// Verifica que as mecânicas categoryReduction e counterSpell
// são corretamente mapeadas e consolidadas pelo SUE.
//

import { describe, it, expect } from 'vitest';
import { 
  consolidateEffects, 
  type UnifiedEffect, 
  type EffectCalculationContext,
  type AttributeType,
} from '../unified-effects-engine';

// =====================================================
// Helpers de Teste
// =====================================================

/**
 * Cria um contexto de cálculo padrão para testes
 */
function createTestContext(overrides: Partial<EffectCalculationContext> = {}): EffectCalculationContext {
  return {
    attributes: { strength: 2, agility: 2, vigor: 2, intellect: 2, presence: 2 },
    nex: 50,
    hpCurrent: 30,
    hpMax: 30,
    peCurrent: 15,
    peMax: 15,
    inCombat: false,
    isFirstRound: false,
    currentRound: 0,
    hasShield: false,
    activeConditions: [],
    activatedEffects: [],
    ...overrides,
  };
}

/**
 * Cria um efeito de teste com categoryReduction
 */
function createCategoryReductionEffect(
  id: string,
  amount: number,
  targetType: 'specific-weapon' | 'any-weapon' | 'item' = 'specific-weapon',
  overrides: Partial<UnifiedEffect> = {}
): UnifiedEffect {
  return {
    id,
    name: `Teste Redução ${id}`,
    source: 'track',
    sourceId: id,
    sourceName: `Trilha: ${id}`,
    mechanics: {
      categoryReduction: {
        amount,
        targetType,
        requiresChoice: targetType === 'specific-weapon',
        appliesToAllCarried: targetType === 'item',
      },
    },
    isActive: true,
    isToggleable: false,
    ...overrides,
  };
}

/**
 * Cria um efeito de teste com counterSpell
 */
function createCounterSpellEffect(
  id: string,
  testSkill: string = 'ocultismo',
  testType: 'opposed' | 'fixed' = 'opposed',
  overrides: Partial<UnifiedEffect> = {}
): UnifiedEffect {
  return {
    id,
    name: `Contra-Mágica ${id}`,
    source: 'track',
    sourceId: id,
    sourceName: `Trilha: ${id}`,
    mechanics: {
      counterSpell: {
        costMatchesTarget: true,
        testSkill,
        testType,
      },
    },
    isActive: true,
    isToggleable: false,
    ...overrides,
  };
}

// =====================================================
// Testes de categoryReduction
// =====================================================

describe('categoryReduction no SUE', () => {
  it('deve consolidar uma única redução de categoria', () => {
    const effects: UnifiedEffect[] = [
      createCategoryReductionEffect('aniq-10', 1, 'specific-weapon'),
    ];
    
    const context = createTestContext();
    const result = consolidateEffects(effects, context);
    
    expect(result.inventory.categoryReductions).toHaveLength(1);
    expect(result.inventory.categoryReductions[0]).toEqual({
      amount: 1,
      targetType: 'specific-weapon',
      source: 'Trilha: aniq-10',
      requiresChoice: true,
      appliesToAllCarried: false,
    });
    expect(result.inventory.totalCategoryReduction).toBe(1);
  });
  
  it('deve acumular múltiplas reduções de categoria', () => {
    const effects: UnifiedEffect[] = [
      createCategoryReductionEffect('aniq-10', 1, 'specific-weapon'),
      createCategoryReductionEffect('tecnico-99', 1, 'item'),
    ];
    
    const context = createTestContext();
    const result = consolidateEffects(effects, context);
    
    expect(result.inventory.categoryReductions).toHaveLength(2);
    expect(result.inventory.totalCategoryReduction).toBe(2);
  });
  
  it('deve ignorar reduções de efeitos inativos', () => {
    const effects: UnifiedEffect[] = [
      createCategoryReductionEffect('aniq-10', 1, 'specific-weapon'),
      createCategoryReductionEffect('aniq-40', 1, 'specific-weapon', { isActive: false }),
    ];
    
    const context = createTestContext();
    const result = consolidateEffects(effects, context);
    
    expect(result.inventory.categoryReductions).toHaveLength(1);
    expect(result.inventory.totalCategoryReduction).toBe(1);
  });
  
  it('deve incluir appliesToAllCarried para tipo item', () => {
    const effects: UnifiedEffect[] = [
      createCategoryReductionEffect('tecnico-99', 1, 'item'),
    ];
    
    const context = createTestContext();
    const result = consolidateEffects(effects, context);
    
    expect(result.inventory.categoryReductions[0].appliesToAllCarried).toBe(true);
    expect(result.inventory.categoryReductions[0].targetType).toBe('item');
  });
  
  it('deve manter a fonte correta no breakdown', () => {
    const effects: UnifiedEffect[] = [
      {
        id: 'teste-custom',
        name: 'Teste Custom',
        source: 'class_power',
        sourceId: 'teste',
        sourceName: 'Combatente: Arma Favorita',
        mechanics: {
          categoryReduction: {
            amount: 2,
            targetType: 'specific-weapon',
          },
        },
        isActive: true,
        isToggleable: false,
      },
    ];
    
    const context = createTestContext();
    const result = consolidateEffects(effects, context);
    
    expect(result.inventory.categoryReductions[0].source).toBe('Combatente: Arma Favorita');
  });
});

// =====================================================
// Testes de counterSpell
// =====================================================

describe('counterSpell no SUE', () => {
  it('deve consolidar uma habilidade de contra-mágica', () => {
    const effects: UnifiedEffect[] = [
      createCounterSpellEffect('conduite-65', 'ocultismo', 'opposed'),
    ];
    
    const context = createTestContext();
    const result = consolidateEffects(effects, context);
    
    expect(result.counterSpellAbilities).toHaveLength(1);
    expect(result.counterSpellAbilities[0]).toEqual({
      source: 'Trilha: conduite-65',
      costMatchesTarget: true,
      testSkill: 'ocultismo',
      testType: 'opposed',
    });
  });
  
  it('deve consolidar múltiplas habilidades de contra-mágica', () => {
    const effects: UnifiedEffect[] = [
      createCounterSpellEffect('conduite-65', 'ocultismo', 'opposed'),
      createCounterSpellEffect('outro-99', 'vontade', 'fixed'),
    ];
    
    const context = createTestContext();
    const result = consolidateEffects(effects, context);
    
    expect(result.counterSpellAbilities).toHaveLength(2);
  });
  
  it('deve ignorar contra-mágica de efeitos inativos', () => {
    const effects: UnifiedEffect[] = [
      createCounterSpellEffect('conduite-65', 'ocultismo', 'opposed'),
      createCounterSpellEffect('outro-99', 'vontade', 'fixed', { isActive: false }),
    ];
    
    const context = createTestContext();
    const result = consolidateEffects(effects, context);
    
    expect(result.counterSpellAbilities).toHaveLength(1);
    expect(result.counterSpellAbilities[0].testSkill).toBe('ocultismo');
  });
  
  it('deve preservar todas as propriedades de contra-mágica', () => {
    const effects: UnifiedEffect[] = [
      {
        id: 'anular-ritual',
        name: 'Anular Ritual',
        source: 'track',
        sourceId: 'conduite-anular',
        sourceName: 'Conduíte: Anular Ritual',
        mechanics: {
          counterSpell: {
            costMatchesTarget: true,
            testSkill: 'ocultismo',
            testType: 'opposed',
          },
        },
        isActive: true,
        isToggleable: false,
      },
    ];
    
    const context = createTestContext();
    const result = consolidateEffects(effects, context);
    
    expect(result.counterSpellAbilities[0]).toMatchObject({
      costMatchesTarget: true,
      testSkill: 'ocultismo',
      testType: 'opposed',
      source: 'Conduíte: Anular Ritual',
    });
  });
});

// =====================================================
// Testes de Integração (categoryReduction + counterSpell + outros)
// =====================================================

describe('Integração de mecânicas no SUE', () => {
  it('deve consolidar categoryReduction junto com outros bônus', () => {
    const effects: UnifiedEffect[] = [
      {
        id: 'aniquilador-completo',
        name: 'Aniquilador',
        source: 'track',
        sourceId: 'aniquilador',
        sourceName: 'Aniquilador',
        mechanics: {
          categoryReduction: {
            amount: 1,
            targetType: 'specific-weapon',
          },
          meleeDamageBonus: 2,
          criticalMarginBonus: 1,
        },
        isActive: true,
        isToggleable: false,
      },
    ];
    
    const context = createTestContext();
    const result = consolidateEffects(effects, context);
    
    // Verifica categoryReduction
    expect(result.inventory.totalCategoryReduction).toBe(1);
    
    // Verifica outros bônus
    expect(result.damage.melee).toBe(2);
    expect(result.critical.marginBonus).toBe(1);
  });
  
  it('deve consolidar counterSpell junto com ritualModifiers', () => {
    const effects: UnifiedEffect[] = [
      {
        id: 'conduite-completo',
        name: 'Conduíte',
        source: 'track',
        sourceId: 'conduite',
        sourceName: 'Conduíte',
        mechanics: {
          counterSpell: {
            costMatchesTarget: true,
            testSkill: 'ocultismo',
            testType: 'opposed',
          },
          ritualModifiers: [
            {
              id: 'ampliar-ritual',
              name: 'Ampliar Ritual',
              type: 'range',
              effect: 'Aumenta alcance em um passo',
              peCost: 2,
              isActivatable: true,
            },
          ],
        },
        isActive: true,
        isToggleable: false,
      },
    ];
    
    const context = createTestContext();
    const result = consolidateEffects(effects, context);
    
    // Verifica counterSpell
    expect(result.counterSpellAbilities).toHaveLength(1);
    
    // Verifica ritualModifiers
    expect(result.rituals.availableModifiers).toHaveLength(1);
    expect(result.rituals.availableModifiers[0].name).toBe('Ampliar Ritual');
  });
  
  it('deve retornar estrutura vazia quando não há efeitos', () => {
    const effects: UnifiedEffect[] = [];
    const context = createTestContext();
    const result = consolidateEffects(effects, context);
    
    expect(result.inventory.categoryReductions).toEqual([]);
    expect(result.inventory.totalCategoryReduction).toBe(0);
    expect(result.counterSpellAbilities).toEqual([]);
  });
});
