// =====================================================
// Testes: categoryReduction, counterSpell e sneakAttack no SUE
// Ordem Paranormal RPG v1.3
// =====================================================
//
// Verifica que as mecânicas categoryReduction, counterSpell e sneakAttack
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

/**
 * Cria um efeito de teste com sneakAttack
 */
function createSneakAttackEffect(
  id: string,
  baseDice: number,
  scaling?: Record<number, { dice: number; dieType: string }>,
  overrides: Partial<UnifiedEffect> = {}
): UnifiedEffect {
  return {
    id,
    name: `Ataque Furtivo ${id}`,
    source: 'track',
    sourceId: id,
    sourceName: `Infiltrador: ${id}`,
    mechanics: {
      sneakAttack: {
        baseDice,
        dieType: 'd6',
        scaling,
        conditions: ['target-unaware', 'target-flanked', 'melee-light-weapon'],
        peCost: 1,
        usesPerRound: 1,
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
    expect(result.sneakAttack.available).toBe(false);
  });
});

// =====================================================
// Testes de sneakAttack
// =====================================================

describe('sneakAttack no SUE', () => {
  it('deve consolidar Ataque Furtivo básico', () => {
    const effects: UnifiedEffect[] = [
      createSneakAttackEffect('ataque-furtivo-10', 1, {
        10: { dice: 1, dieType: 'd6' },
        40: { dice: 2, dieType: 'd6' },
        65: { dice: 3, dieType: 'd6' },
        99: { dice: 4, dieType: 'd6' },
      }),
    ];
    
    const context = createTestContext({ nex: 50 });
    const result = consolidateEffects(effects, context);
    
    expect(result.sneakAttack.available).toBe(true);
    expect(result.sneakAttack.baseDice).toBe(2); // NEX 50 = 2d6
    expect(result.sneakAttack.dieType).toBe('d6');
    expect(result.sneakAttack.peCost).toBe(1);
    expect(result.sneakAttack.usesPerRound).toBe(1);
    expect(result.sneakAttack.multiplier).toBe(1);
    expect(result.sneakAttack.totalDice).toBe(2);
  });
  
  it('deve escalar dados por NEX corretamente', () => {
    const scaling = {
      10: { dice: 1, dieType: 'd6' },
      40: { dice: 2, dieType: 'd6' },
      65: { dice: 3, dieType: 'd6' },
      99: { dice: 4, dieType: 'd6' },
    };
    
    // NEX 10%
    let context = createTestContext({ nex: 10 });
    let result = consolidateEffects([createSneakAttackEffect('af', 1, scaling)], context);
    expect(result.sneakAttack.baseDice).toBe(1);
    
    // NEX 40%
    context = createTestContext({ nex: 40 });
    result = consolidateEffects([createSneakAttackEffect('af', 1, scaling)], context);
    expect(result.sneakAttack.baseDice).toBe(2);
    
    // NEX 65%
    context = createTestContext({ nex: 65 });
    result = consolidateEffects([createSneakAttackEffect('af', 1, scaling)], context);
    expect(result.sneakAttack.baseDice).toBe(3);
    
    // NEX 99%
    context = createTestContext({ nex: 99 });
    result = consolidateEffects([createSneakAttackEffect('af', 1, scaling)], context);
    expect(result.sneakAttack.baseDice).toBe(4);
  });
  
  it('deve aplicar multiplicador de Assassinar', () => {
    const effects: UnifiedEffect[] = [
      createSneakAttackEffect('ataque-furtivo', 1, {
        10: { dice: 1, dieType: 'd6' },
        40: { dice: 2, dieType: 'd6' },
        65: { dice: 3, dieType: 'd6' },
        99: { dice: 4, dieType: 'd6' },
      }),
      {
        id: 'assassinar',
        name: 'Assassinar',
        source: 'track',
        sourceId: 'assassinar',
        sourceName: 'Infiltrador: Assassinar',
        mechanics: {
          sneakAttack: {
            baseDice: 0, // Herda do Ataque Furtivo
            dieType: 'd6',
            conditions: [],
            peCost: 0,
            usesPerRound: 0,
            multiplier: 2, // Dobra os dados!
          },
        },
        isActive: true,
        isToggleable: false,
      },
    ];
    
    const context = createTestContext({ nex: 65 });
    const result = consolidateEffects(effects, context);
    
    expect(result.sneakAttack.baseDice).toBe(3); // 3d6 base em NEX 65
    expect(result.sneakAttack.multiplier).toBe(2); // Assassinar x2
    expect(result.sneakAttack.totalDice).toBe(6); // 3 * 2 = 6d6 total
  });
  
  it('deve consolidar condições de aplicação', () => {
    const effects: UnifiedEffect[] = [
      createSneakAttackEffect('ataque-furtivo', 1),
    ];
    
    const context = createTestContext();
    const result = consolidateEffects(effects, context);
    
    expect(result.sneakAttack.conditions).toContain('target-unaware');
    expect(result.sneakAttack.conditions).toContain('target-flanked');
    expect(result.sneakAttack.conditions).toContain('melee-light-weapon');
  });
  
  it('deve registrar fontes corretamente', () => {
    const effects: UnifiedEffect[] = [
      createSneakAttackEffect('ataque-furtivo-trilha', 1, {
        10: { dice: 1, dieType: 'd6' },
      }),
    ];
    
    const context = createTestContext({ nex: 10 });
    const result = consolidateEffects(effects, context);
    
    expect(result.sneakAttack.sources).toHaveLength(1);
    expect(result.sneakAttack.sources[0].source).toBe('Infiltrador: ataque-furtivo-trilha');
    expect(result.sneakAttack.sources[0].dice).toBe(1);
  });
  
  it('deve ignorar sneakAttack de efeitos inativos', () => {
    const effects: UnifiedEffect[] = [
      createSneakAttackEffect('ataque-furtivo', 1, undefined, { isActive: false }),
    ];
    
    const context = createTestContext();
    const result = consolidateEffects(effects, context);
    
    expect(result.sneakAttack.available).toBe(false);
    expect(result.sneakAttack.baseDice).toBe(0);
  });
});

// =====================================================
// Testes de Integração Completa (todas as mecânicas)
// =====================================================

describe('Integração sneakAttack com outras mecânicas', () => {
  it('deve consolidar sneakAttack junto com bônus de perícia', () => {
    const effects: UnifiedEffect[] = [
      {
        id: 'infiltrador-completo',
        name: 'Infiltrador',
        source: 'track',
        sourceId: 'infiltrador',
        sourceName: 'Infiltrador',
        mechanics: {
          sneakAttack: {
            baseDice: 2,
            dieType: 'd6',
            conditions: ['target-unaware'],
            peCost: 1,
            usesPerRound: 1,
          },
          skillBonus: {
            furtividade: 5,
            crime: 5,
          },
        },
        isActive: true,
        isToggleable: false,
      },
    ];
    
    const context = createTestContext({ nex: 50 });
    const result = consolidateEffects(effects, context);
    
    // Verifica sneakAttack
    expect(result.sneakAttack.available).toBe(true);
    expect(result.sneakAttack.baseDice).toBe(2);
    
    // Verifica skill bonuses
    expect(result.skills['furtividade']?.bonus).toBe(5);
    expect(result.skills['crime']?.bonus).toBe(5);
  });
  
  it('deve manter separação entre sneakAttack e extraDamageDice', () => {
    const effects: UnifiedEffect[] = [
      createSneakAttackEffect('ataque-furtivo', 2),
      {
        id: 'lama-paranormal',
        name: 'Lâmina Paranormal',
        source: 'track',
        sourceId: 'lamina',
        sourceName: 'Lâmina Paranormal',
        mechanics: {
          extraDamageDice: '2d6',
        },
        isActive: true,
        isToggleable: false,
      },
    ];
    
    const context = createTestContext();
    const result = consolidateEffects(effects, context);
    
    // SneakAttack separado
    expect(result.sneakAttack.baseDice).toBe(2);
    
    // ExtraDamageDice separado (de outra fonte)
    expect(result.damage.extraDice).toContain('2d6');
  });
});
