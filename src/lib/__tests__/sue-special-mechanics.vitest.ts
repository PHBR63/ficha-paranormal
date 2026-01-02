// =====================================================
// Testes: categoryReduction, counterSpell, sneakAttack, healing,
// leadership, allyBuff, socialEffect e contacts no SUE
// Ordem Paranormal RPG v1.3
// =====================================================
//
// Verifica que as mecânicas categoryReduction, counterSpell, sneakAttack, healing,
// leadership, allyBuff, socialEffect e contacts são corretamente mapeadas e consolidadas pelo SUE.
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

// =====================================================
// Testes de healing
// =====================================================

describe('healing no SUE', () => {
  /**
   * Cria um efeito de teste com healing
   */
  function createHealingEffect(
    id: string,
    baseDice: number,
    scaling?: Record<number, { dice: number; dieType: string }>,
    overrides: Partial<UnifiedEffect> = {}
  ): UnifiedEffect {
    return {
      id,
      name: `Cura ${id}`,
      source: 'track',
      sourceId: id,
      sourceName: `Médico de Campo: ${id}`,
      mechanics: {
        healing: {
          baseDice,
          dieType: 'd10',
          scaling,
          peCost: 2,
          extraDicePECost: 1,
          range: 'touch',
          actionType: 'standard',
        },
      },
      isActive: true,
      isToggleable: false,
      ...overrides,
    };
  }

  it('deve consolidar cura básica (Paramédico)', () => {
    const effects: UnifiedEffect[] = [
      createHealingEffect('paramedico', 2, {
        10: { dice: 2, dieType: 'd10' },
        40: { dice: 3, dieType: 'd10' },
        65: { dice: 4, dieType: 'd10' },
        99: { dice: 5, dieType: 'd10' },
      }),
    ];
    
    const context = createTestContext({ nex: 50 });
    const result = consolidateEffects(effects, context);
    
    expect(result.healing.available).toBe(true);
    expect(result.healing.baseDice).toBe(3); // NEX 50 = 3d10
    expect(result.healing.dieType).toBe('d10');
    expect(result.healing.peCost).toBe(2);
    expect(result.healing.extraDicePECost).toBe(1);
    expect(result.healing.range).toBe('touch');
  });
  
  it('deve escalar dados por NEX corretamente', () => {
    const scaling = {
      10: { dice: 2, dieType: 'd10' },
      40: { dice: 3, dieType: 'd10' },
      65: { dice: 4, dieType: 'd10' },
      99: { dice: 5, dieType: 'd10' },
    };
    
    // NEX 10%
    let context = createTestContext({ nex: 10 });
    let result = consolidateEffects([createHealingEffect('param', 2, scaling)], context);
    expect(result.healing.baseDice).toBe(2);
    
    // NEX 40%
    context = createTestContext({ nex: 40 });
    result = consolidateEffects([createHealingEffect('param', 2, scaling)], context);
    expect(result.healing.baseDice).toBe(3);
    
    // NEX 65%
    context = createTestContext({ nex: 65 });
    result = consolidateEffects([createHealingEffect('param', 2, scaling)], context);
    expect(result.healing.baseDice).toBe(4);
    
    // NEX 99%
    context = createTestContext({ nex: 99 });
    result = consolidateEffects([createHealingEffect('param', 2, scaling)], context);
    expect(result.healing.baseDice).toBe(5);
  });
  
  it('deve registrar fontes corretamente', () => {
    const effects: UnifiedEffect[] = [
      createHealingEffect('paramedico', 2, {
        10: { dice: 2, dieType: 'd10' },
      }),
    ];
    
    const context = createTestContext({ nex: 10 });
    const result = consolidateEffects(effects, context);
    
    expect(result.healing.sources).toHaveLength(1);
    expect(result.healing.sources[0].source).toBe('Médico de Campo: paramedico');
    expect(result.healing.sources[0].dice).toBe(2);
    expect(result.healing.sources[0].peCost).toBe(2);
  });
  
  it('deve ignorar healing de efeitos inativos', () => {
    const effects: UnifiedEffect[] = [
      createHealingEffect('paramedico', 2, undefined, { isActive: false }),
    ];
    
    const context = createTestContext();
    const result = consolidateEffects(effects, context);
    
    expect(result.healing.available).toBe(false);
    expect(result.healing.baseDice).toBe(0);
  });
  
  it('deve retornar estrutura vazia quando não há healing', () => {
    const effects: UnifiedEffect[] = [];
    const context = createTestContext();
    const result = consolidateEffects(effects, context);
    
    expect(result.healing.available).toBe(false);
    expect(result.healing.baseDice).toBe(0);
    expect(result.healing.sources).toEqual([]);
  });
});

// =====================================================
// Testes de Integração Completa (todas as mecânicas)
// =====================================================

describe('Integração healing com outras mecânicas', () => {
  it('deve consolidar healing junto com bônus de defesa (Resgate)', () => {
    const effects: UnifiedEffect[] = [
      {
        id: 'medico-completo',
        name: 'Médico de Campo',
        source: 'track',
        sourceId: 'medico-campo',
        sourceName: 'Médico de Campo',
        mechanics: {
          healing: {
            baseDice: 3,
            dieType: 'd10',
            peCost: 2,
            extraDicePECost: 1,
            range: 'touch',
            actionType: 'standard',
          },
          skillBonus: {
            medicina: 5,
          },
        },
        isActive: true,
        isToggleable: false,
      },
    ];
    
    const context = createTestContext({ nex: 50 });
    const result = consolidateEffects(effects, context);
    
    // Verifica healing
    expect(result.healing.available).toBe(true);
    expect(result.healing.baseDice).toBe(3);
    
    // Verifica skill bonus
    expect(result.skills['medicina']?.bonus).toBe(5);
  });
});

// =====================================================
// Testes de leadership
// =====================================================

describe('leadership no SUE', () => {
  /**
   * Cria um efeito de teste com leadership
   */
  function createLeadershipEffect(
    id: string,
    allyEffects: {
      rerollTest?: boolean;
      extraMovementAction?: boolean;
      extraAttack?: boolean;
      extraStandardAction?: boolean;
      tempHP?: number;
      bonusToNextTest?: number;
    },
    overrides: Partial<UnifiedEffect> = {}
  ): UnifiedEffect {
    return {
      id,
      name: `Liderança ${id}`,
      source: 'track',
      sourceId: id,
      sourceName: `Comandante de Campo: ${id}`,
      mechanics: {
        leadership: {
          range: 'medio',
          maxAllies: 'intellect',
          peCost: 2,
          actionType: 'free',
          allyEffects,
        },
      },
      isActive: true,
      isToggleable: false,
      ...overrides,
    };
  }

  it('deve consolidar liderança básica (Inspirar Confiança)', () => {
    const effects: UnifiedEffect[] = [
      createLeadershipEffect('inspirar-confianca', { rerollTest: true }),
    ];
    
    const context = createTestContext({ nex: 10 });
    const result = consolidateEffects(effects, context);
    
    expect(result.leadership.available).toBe(true);
    expect(result.leadership.abilities).toHaveLength(1);
    expect(result.leadership.abilities[0].allyEffects.rerollTest).toBe(true);
    expect(result.leadership.abilities[0].range).toBe('medio');
    expect(result.leadership.abilities[0].maxAllies).toBe('intellect');
  });
  
  it('deve consolidar múltiplas habilidades de liderança', () => {
    const effects: UnifiedEffect[] = [
      createLeadershipEffect('inspirar-confianca', { rerollTest: true }),
      createLeadershipEffect('estrategista', { extraMovementAction: true }),
      createLeadershipEffect('brecha-na-guarda', { extraAttack: true }),
      createLeadershipEffect('oficial-comandante', { extraStandardAction: true }),
    ];
    
    const context = createTestContext({ nex: 99 });
    const result = consolidateEffects(effects, context);
    
    expect(result.leadership.available).toBe(true);
    expect(result.leadership.abilities).toHaveLength(4);
    
    // Verifica efeitos consolidados
    expect(result.leadership.availableEffects.rerollTest).toBe(true);
    expect(result.leadership.availableEffects.extraMovementAction).toBe(true);
    expect(result.leadership.availableEffects.extraAttack).toBe(true);
    expect(result.leadership.availableEffects.extraStandardAction).toBe(true);
  });
  
  it('deve ignorar leadership de efeitos inativos', () => {
    const effects: UnifiedEffect[] = [
      createLeadershipEffect('inspirar-confianca', { rerollTest: true }),
      createLeadershipEffect('estrategista', { extraMovementAction: true }, { isActive: false }),
    ];
    
    const context = createTestContext({ nex: 40 });
    const result = consolidateEffects(effects, context);
    
    expect(result.leadership.abilities).toHaveLength(1);
    expect(result.leadership.availableEffects.rerollTest).toBe(true);
    expect(result.leadership.availableEffects.extraMovementAction).toBe(false);
  });
  
  it('deve registrar fontes corretamente', () => {
    const effects: UnifiedEffect[] = [
      createLeadershipEffect('inspirar-confianca', { rerollTest: true }),
    ];
    
    const context = createTestContext({ nex: 10 });
    const result = consolidateEffects(effects, context);
    
    expect(result.leadership.abilities[0].source).toBe('Comandante de Campo: inspirar-confianca');
  });
  
  it('deve retornar estrutura vazia quando não há liderança', () => {
    const effects: UnifiedEffect[] = [];
    const context = createTestContext();
    const result = consolidateEffects(effects, context);
    
    expect(result.leadership.available).toBe(false);
    expect(result.leadership.abilities).toEqual([]);
    expect(result.leadership.availableEffects.rerollTest).toBe(false);
    expect(result.leadership.availableEffects.extraMovementAction).toBe(false);
    expect(result.leadership.availableEffects.extraAttack).toBe(false);
    expect(result.leadership.availableEffects.extraStandardAction).toBe(false);
  });

  it('deve aplicar escalonamento por NEX', () => {
    const effects: UnifiedEffect[] = [
      {
        id: 'comandante-completo',
        name: 'Comandante Completo',
        source: 'track',
        sourceId: 'comandante',
        sourceName: 'Comandante de Campo',
        mechanics: {
          leadership: {
            range: 'curto',
            maxAllies: 1,
            peCost: 2,
            actionType: 'free',
            allyEffects: { rerollTest: true },
            scaling: {
              40: { maxAllies: 2, allyEffects: { extraMovementAction: true } },
              65: { maxAllies: 3, allyEffects: { extraAttack: true } },
              99: { maxAllies: 'intellect', allyEffects: { extraStandardAction: true } },
            },
          },
        },
        isActive: true,
        isToggleable: false,
      },
    ];
    
    // NEX 10% - apenas efeitos base
    let context = createTestContext({ nex: 10 });
    let result = consolidateEffects(effects, context);
    expect(result.leadership.abilities[0].maxAllies).toBe(1);
    expect(result.leadership.abilities[0].allyEffects.rerollTest).toBe(true);
    expect(result.leadership.abilities[0].allyEffects.extraMovementAction).toBeFalsy();
    
    // NEX 40% - primeiro upgrade
    context = createTestContext({ nex: 40 });
    result = consolidateEffects(effects, context);
    expect(result.leadership.abilities[0].maxAllies).toBe(2);
    expect(result.leadership.abilities[0].allyEffects.extraMovementAction).toBe(true);
    
    // NEX 65% - segundo upgrade
    context = createTestContext({ nex: 65 });
    result = consolidateEffects(effects, context);
    expect(result.leadership.abilities[0].maxAllies).toBe(3);
    expect(result.leadership.abilities[0].allyEffects.extraAttack).toBe(true);
    
    // NEX 99% - upgrade completo
    context = createTestContext({ nex: 99 });
    result = consolidateEffects(effects, context);
    expect(result.leadership.abilities[0].maxAllies).toBe('intellect');
    expect(result.leadership.abilities[0].allyEffects.extraStandardAction).toBe(true);
  });
});

// =====================================================
// Testes de Integração Completa (leadership + outras mecânicas)
// =====================================================

describe('Integração leadership com outras mecânicas', () => {
  it('deve consolidar leadership junto com bônus de perícia', () => {
    const effects: UnifiedEffect[] = [
      {
        id: 'comandante-completo',
        name: 'Comandante de Campo',
        source: 'track',
        sourceId: 'comandante-campo',
        sourceName: 'Comandante de Campo',
        mechanics: {
          leadership: {
            range: 'medio',
            maxAllies: 'intellect',
            peCost: 2,
            actionType: 'free',
            allyEffects: { rerollTest: true, extraMovementAction: true },
          },
          skillBonus: {
            tatica: 5,
            diplomacia: 5,
          },
        },
        isActive: true,
        isToggleable: false,
      },
    ];
    
    const context = createTestContext({ nex: 50 });
    const result = consolidateEffects(effects, context);
    
    // Verifica leadership
    expect(result.leadership.available).toBe(true);
    expect(result.leadership.availableEffects.rerollTest).toBe(true);
    expect(result.leadership.availableEffects.extraMovementAction).toBe(true);
    
    // Verifica skill bonuses
    expect(result.skills['tatica']?.bonus).toBe(5);
    expect(result.skills['diplomacia']?.bonus).toBe(5);
  });
});

// =====================================================
// Testes de allyBuff (Negociador - Discurso Motivador)
// =====================================================

describe('allyBuff no SUE', () => {
  /**
   * Cria um efeito de teste com allyBuff
   */
  function createAllyBuffEffect(
    id: string,
    skillBonus: number,
    scaling?: Record<number, { skillBonus?: number; peCost?: number }>,
    overrides: Partial<UnifiedEffect> = {}
  ): UnifiedEffect {
    return {
      id,
      name: `Buff Aliados ${id}`,
      source: 'track',
      sourceId: id,
      sourceName: `Negociador: ${id}`,
      mechanics: {
        allyBuff: {
          range: 'curto',
          skillBonus,
          peCost: 4,
          actionType: 'standard',
          duration: 'scene',
          includeSelf: true,
          scaling,
        },
      },
      isActive: true,
      isToggleable: false,
      ...overrides,
    };
  }

  it('deve consolidar Discurso Motivador básico', () => {
    const effects: UnifiedEffect[] = [
      createAllyBuffEffect('discurso-motivador', 1),
    ];
    
    const context = createTestContext({ nex: 40 });
    const result = consolidateEffects(effects, context);
    
    expect(result.allyBuff.available).toBe(true);
    expect(result.allyBuff.abilities).toHaveLength(1);
    expect(result.allyBuff.abilities[0].skillBonus).toBe(1);
    expect(result.allyBuff.abilities[0].range).toBe('curto');
    expect(result.allyBuff.abilities[0].duration).toBe('scene');
    expect(result.allyBuff.abilities[0].includeSelf).toBe(true);
    expect(result.allyBuff.maxSkillBonus).toBe(1);
    expect(result.allyBuff.affectsSelf).toBe(true);
  });
  
  it('deve aplicar escalonamento por NEX', () => {
    const scaling = {
      65: { skillBonus: 2, peCost: 8 },
    };
    
    // NEX 40% - bônus base
    let context = createTestContext({ nex: 40 });
    let result = consolidateEffects([createAllyBuffEffect('dm', 1, scaling)], context);
    expect(result.allyBuff.abilities[0].skillBonus).toBe(1);
    
    // NEX 65% - upgrade
    context = createTestContext({ nex: 65 });
    result = consolidateEffects([createAllyBuffEffect('dm', 1, scaling)], context);
    expect(result.allyBuff.abilities[0].skillBonus).toBe(2);
    expect(result.allyBuff.abilities[0].peCost).toBe(8);
    expect(result.allyBuff.maxSkillBonus).toBe(2);
  });
  
  it('deve consolidar múltiplos buffs de aliados', () => {
    const effects: UnifiedEffect[] = [
      createAllyBuffEffect('discurso-motivador', 1),
      createAllyBuffEffect('outro-buff', 2),
    ];
    
    const context = createTestContext({ nex: 50 });
    const result = consolidateEffects(effects, context);
    
    expect(result.allyBuff.available).toBe(true);
    expect(result.allyBuff.abilities).toHaveLength(2);
    expect(result.allyBuff.maxSkillBonus).toBe(2); // Maior valor
  });
  
  it('deve ignorar allyBuff de efeitos inativos', () => {
    const effects: UnifiedEffect[] = [
      createAllyBuffEffect('discurso-motivador', 1),
      createAllyBuffEffect('outro-buff', 2, undefined, { isActive: false }),
    ];
    
    const context = createTestContext({ nex: 50 });
    const result = consolidateEffects(effects, context);
    
    expect(result.allyBuff.abilities).toHaveLength(1);
    expect(result.allyBuff.maxSkillBonus).toBe(1);
  });
  
  it('deve registrar fontes corretamente', () => {
    const effects: UnifiedEffect[] = [
      createAllyBuffEffect('discurso-motivador', 1),
    ];
    
    const context = createTestContext({ nex: 40 });
    const result = consolidateEffects(effects, context);
    
    expect(result.allyBuff.abilities[0].source).toBe('Negociador: discurso-motivador');
  });
  
  it('deve retornar estrutura vazia quando não há allyBuff', () => {
    const effects: UnifiedEffect[] = [];
    const context = createTestContext();
    const result = consolidateEffects(effects, context);
    
    expect(result.allyBuff.available).toBe(false);
    expect(result.allyBuff.abilities).toEqual([]);
    expect(result.allyBuff.maxSkillBonus).toBe(0);
    expect(result.allyBuff.affectsSelf).toBe(false);
  });
  
  it('deve rastrear se afeta o próprio conjurador', () => {
    // Buff que inclui self
    let effects: UnifiedEffect[] = [
      createAllyBuffEffect('com-self', 1),
    ];
    let result = consolidateEffects(effects, createTestContext());
    expect(result.allyBuff.affectsSelf).toBe(true);
    
    // Buff que não inclui self
    effects = [
      {
        id: 'sem-self',
        name: 'Buff sem self',
        source: 'track',
        sourceId: 'sem-self',
        sourceName: 'Negociador: sem-self',
        mechanics: {
          allyBuff: {
            range: 'curto',
            skillBonus: 1,
            peCost: 4,
            actionType: 'standard',
            duration: 'scene',
            includeSelf: false,
          },
        },
        isActive: true,
        isToggleable: false,
      },
    ];
    result = consolidateEffects(effects, createTestContext());
    expect(result.allyBuff.affectsSelf).toBe(false);
  });
});

// =====================================================
// Testes de Integração Completa (allyBuff + outras mecânicas)
// =====================================================

describe('Integração allyBuff com outras mecânicas', () => {
  it('deve consolidar allyBuff junto com bônus de perícia pessoal', () => {
    const effects: UnifiedEffect[] = [
      {
        id: 'negociador-completo',
        name: 'Negociador',
        source: 'track',
        sourceId: 'negociador',
        sourceName: 'Negociador',
        mechanics: {
          allyBuff: {
            range: 'curto',
            skillBonus: 1,
            peCost: 4,
            actionType: 'standard',
            duration: 'scene',
            includeSelf: true,
          },
          skillBonus: {
            diplomacia: 5,
            enganacao: 5,
          },
        },
        isActive: true,
        isToggleable: false,
      },
    ];
    
    const context = createTestContext({ nex: 40 });
    const result = consolidateEffects(effects, context);
    
    // Verifica allyBuff
    expect(result.allyBuff.available).toBe(true);
    expect(result.allyBuff.maxSkillBonus).toBe(1);
    
    // Verifica skill bonuses pessoais
    expect(result.skills['diplomacia']?.bonus).toBe(5);
    expect(result.skills['enganacao']?.bonus).toBe(5);
  });
  
  it('deve manter allyBuff separado de leadership', () => {
    const effects: UnifiedEffect[] = [
      {
        id: 'negociador-buff',
        name: 'Discurso Motivador',
        source: 'track',
        sourceId: 'discurso',
        sourceName: 'Negociador: Discurso Motivador',
        mechanics: {
          allyBuff: {
            range: 'curto',
            skillBonus: 1,
            peCost: 4,
            actionType: 'standard',
            duration: 'scene',
            includeSelf: true,
          },
        },
        isActive: true,
        isToggleable: false,
      },
      {
        id: 'comandante-lead',
        name: 'Inspirar Confiança',
        source: 'track',
        sourceId: 'inspirar',
        sourceName: 'Comandante: Inspirar Confiança',
        mechanics: {
          leadership: {
            range: 'medio',
            maxAllies: 'intellect',
            peCost: 2,
            actionType: 'free',
            allyEffects: { rerollTest: true },
          },
        },
        isActive: true,
        isToggleable: false,
      },
    ];
    
    const context = createTestContext({ nex: 50 });
    const result = consolidateEffects(effects, context);
    
    // allyBuff e leadership devem ser independentes
    expect(result.allyBuff.available).toBe(true);
    expect(result.allyBuff.abilities).toHaveLength(1);
    expect(result.allyBuff.maxSkillBonus).toBe(1);
    
    expect(result.leadership.available).toBe(true);
    expect(result.leadership.abilities).toHaveLength(1);
    expect(result.leadership.availableEffects.rerollTest).toBe(true);
  });
});

// =====================================================
// Testes de socialEffect (Negociador - Eloquência)
// =====================================================

describe('socialEffect no SUE', () => {
  /**
   * Cria um efeito de teste com socialEffect
   */
  function createSocialEffectTest(
    id: string,
    effect: string,
    overrides: Partial<UnifiedEffect> = {}
  ): UnifiedEffect {
    return {
      id,
      name: `Efeito Social ${id}`,
      source: 'track',
      sourceId: id,
      sourceName: `Negociador: ${id}`,
      mechanics: {
        socialEffect: {
          range: 'curto',
          targetAll: true,
          skillOptions: ['diplomacia', 'enganacao', 'intimidacao'],
          resistanceSkill: 'vontade',
          effect,
          duration: 'concentration',
          peCost: 1,
          actionType: 'standard',
          immunityOnSuccess: '1-day',
          resistanceBonusOnSuccess: 5,
        },
      },
      isActive: true,
      isToggleable: false,
      ...overrides,
    };
  }
  
  it('deve consolidar socialEffect básico', () => {
    const effects: UnifiedEffect[] = [
      createSocialEffectTest('eloquencia', 'fascinated'),
    ];
    
    const context = createTestContext();
    const result = consolidateEffects(effects, context);
    
    expect(result.socialEffect.available).toBe(true);
    expect(result.socialEffect.abilities).toHaveLength(1);
    expect(result.socialEffect.abilities[0].effect).toBe('fascinated');
    expect(result.socialEffect.abilities[0].range).toBe('curto');
    expect(result.socialEffect.abilities[0].targetAll).toBe(true);
    expect(result.socialEffect.abilities[0].skillOptions).toContain('diplomacia');
    expect(result.socialEffect.abilities[0].resistanceSkill).toBe('vontade');
  });
  
  it('deve consolidar múltiplos socialEffects', () => {
    const effects: UnifiedEffect[] = [
      createSocialEffectTest('eloquencia', 'fascinated'),
      createSocialEffectTest('intimidar', 'frightened'),
    ];
    
    const context = createTestContext();
    const result = consolidateEffects(effects, context);
    
    expect(result.socialEffect.available).toBe(true);
    expect(result.socialEffect.abilities).toHaveLength(2);
    expect(result.socialEffect.availableEffects).toContain('fascinated');
    expect(result.socialEffect.availableEffects).toContain('frightened');
  });
  
  it('não deve consolidar socialEffect inativo', () => {
    const effects: UnifiedEffect[] = [
      createSocialEffectTest('eloquencia', 'fascinated', { isActive: false }),
    ];
    
    const context = createTestContext();
    const result = consolidateEffects(effects, context);
    
    expect(result.socialEffect.available).toBe(false);
    expect(result.socialEffect.abilities).toHaveLength(0);
  });
  
  it('deve rastrear source do socialEffect', () => {
    const effects: UnifiedEffect[] = [
      createSocialEffectTest('eloquencia', 'fascinated'),
    ];
    
    const context = createTestContext();
    const result = consolidateEffects(effects, context);
    
    expect(result.socialEffect.abilities[0].source).toBe('Negociador: eloquencia');
  });
  
  it('deve incluir immunityOnSuccess e resistanceBonusOnSuccess', () => {
    const effects: UnifiedEffect[] = [
      createSocialEffectTest('eloquencia', 'fascinated'),
    ];
    
    const context = createTestContext();
    const result = consolidateEffects(effects, context);
    
    expect(result.socialEffect.abilities[0].immunityOnSuccess).toBe('1-day');
    expect(result.socialEffect.abilities[0].resistanceBonusOnSuccess).toBe(5);
  });
  
  it('deve suportar duração em turnos', () => {
    const effects: UnifiedEffect[] = [
      {
        id: 'efeito-turnos',
        name: 'Efeito com Turnos',
        source: 'track',
        sourceId: 'efeito-turnos',
        sourceName: 'Negociador: efeito-turnos',
        mechanics: {
          socialEffect: {
            range: 'curto',
            targetAll: false,
            skillOptions: ['intimidacao'],
            resistanceSkill: 'vontade',
            effect: 'frightened',
            duration: 'turns',
            turns: 3,
            peCost: 2,
            actionType: 'standard',
          },
        },
        isActive: true,
        isToggleable: false,
      },
    ];
    
    const context = createTestContext();
    const result = consolidateEffects(effects, context);
    
    expect(result.socialEffect.abilities[0].duration).toBe('turns');
    expect(result.socialEffect.abilities[0].turns).toBe(3);
    expect(result.socialEffect.abilities[0].targetAll).toBe(false);
  });
});

// =====================================================
// Testes de Integração Completa (socialEffect + outras mecânicas)
// =====================================================

describe('Integração socialEffect com outras mecânicas', () => {
  it('deve consolidar socialEffect junto com skillBonus', () => {
    const effects: UnifiedEffect[] = [
      {
        id: 'negociador-completo',
        name: 'Negociador',
        source: 'track',
        sourceId: 'negociador',
        sourceName: 'Negociador',
        mechanics: {
          socialEffect: {
            range: 'curto',
            targetAll: true,
            skillOptions: ['diplomacia', 'enganacao', 'intimidacao'],
            resistanceSkill: 'vontade',
            effect: 'fascinated',
            duration: 'concentration',
            peCost: 1,
            actionType: 'standard',
          },
          skillBonus: {
            diplomacia: 5,
            enganacao: 5,
          },
        },
        isActive: true,
        isToggleable: false,
      },
    ];
    
    const context = createTestContext({ nex: 40 });
    const result = consolidateEffects(effects, context);
    
    // Verifica socialEffect
    expect(result.socialEffect.available).toBe(true);
    expect(result.socialEffect.abilities).toHaveLength(1);
    
    // Verifica skill bonuses pessoais
    expect(result.skills['diplomacia']?.bonus).toBe(5);
    expect(result.skills['enganacao']?.bonus).toBe(5);
  });
  
  it('deve manter socialEffect separado de allyBuff', () => {
    const effects: UnifiedEffect[] = [
      {
        id: 'negociador-social',
        name: 'Eloquência',
        source: 'track',
        sourceId: 'eloquencia',
        sourceName: 'Negociador: Eloquência',
        mechanics: {
          socialEffect: {
            range: 'curto',
            targetAll: true,
            skillOptions: ['diplomacia', 'enganacao', 'intimidacao'],
            resistanceSkill: 'vontade',
            effect: 'fascinated',
            duration: 'concentration',
            peCost: 1,
            actionType: 'standard',
          },
        },
        isActive: true,
        isToggleable: false,
      },
      {
        id: 'negociador-buff',
        name: 'Discurso Motivador',
        source: 'track',
        sourceId: 'discurso',
        sourceName: 'Negociador: Discurso Motivador',
        mechanics: {
          allyBuff: {
            range: 'curto',
            skillBonus: 1,
            peCost: 4,
            actionType: 'standard',
            duration: 'scene',
            includeSelf: true,
          },
        },
        isActive: true,
        isToggleable: false,
      },
    ];
    
    const context = createTestContext({ nex: 50 });
    const result = consolidateEffects(effects, context);
    
    // socialEffect e allyBuff devem ser independentes
    expect(result.socialEffect.available).toBe(true);
    expect(result.socialEffect.abilities).toHaveLength(1);
    expect(result.socialEffect.abilities[0].effect).toBe('fascinated');
    
    expect(result.allyBuff.available).toBe(true);
    expect(result.allyBuff.abilities).toHaveLength(1);
    expect(result.allyBuff.maxSkillBonus).toBe(1);
  });
  
  it('deve consolidar socialEffect junto com leadership', () => {
    const effects: UnifiedEffect[] = [
      {
        id: 'negociador-social',
        name: 'Eloquência',
        source: 'track',
        sourceId: 'eloquencia',
        sourceName: 'Negociador: Eloquência',
        mechanics: {
          socialEffect: {
            range: 'curto',
            targetAll: true,
            skillOptions: ['diplomacia'],
            resistanceSkill: 'vontade',
            effect: 'fascinated',
            duration: 'concentration',
            peCost: 1,
            actionType: 'standard',
          },
        },
        isActive: true,
        isToggleable: false,
      },
      {
        id: 'comandante-lead',
        name: 'Inspirar Confiança',
        source: 'track',
        sourceId: 'inspirar',
        sourceName: 'Comandante: Inspirar Confiança',
        mechanics: {
          leadership: {
            range: 'medio',
            maxAllies: 'intellect',
            peCost: 2,
            actionType: 'free',
            allyEffects: { rerollTest: true },
          },
        },
        isActive: true,
        isToggleable: false,
      },
    ];
    
    const context = createTestContext({ nex: 50 });
    const result = consolidateEffects(effects, context);
    
    // Verifica que ambos estão consolidados
    expect(result.socialEffect.available).toBe(true);
    expect(result.socialEffect.availableEffects).toContain('fascinated');
    
    expect(result.leadership.available).toBe(true);
    expect(result.leadership.availableEffects.rerollTest).toBe(true);
  });
});

// =====================================================
// Testes de contacts (Negociador - Eu Conheço um Cara)
// =====================================================

describe('contacts no SUE', () => {
  /**
   * Cria um efeito de teste com contacts
   */
  function createContactsEffect(
    id: string,
    availableEffects: string[],
    overrides: Partial<UnifiedEffect> = {}
  ): UnifiedEffect {
    return {
      id,
      name: `Contatos ${id}`,
      source: 'track',
      sourceId: id,
      sourceName: `Negociador: ${id}`,
      mechanics: {
        contacts: {
          usesPerMission: 1,
          availableEffects,
          gmDiscretion: true,
          peCost: 0,
          actionType: 'varies',
        },
      },
      isActive: true,
      isToggleable: false,
      ...overrides,
    };
  }
  
  it('deve consolidar contacts básico', () => {
    const effects: UnifiedEffect[] = [
      createContactsEffect('eu-conheco-um-cara', ['equipment-trade', 'information', 'rescue', 'problem-solving']),
    ];
    
    const context = createTestContext();
    const result = consolidateEffects(effects, context);
    
    expect(result.contacts.available).toBe(true);
    expect(result.contacts.abilities).toHaveLength(1);
    expect(result.contacts.abilities[0].usesPerMission).toBe(1);
    expect(result.contacts.abilities[0].gmDiscretion).toBe(true);
    expect(result.contacts.abilities[0].availableEffects).toContain('equipment-trade');
    expect(result.contacts.abilities[0].availableEffects).toContain('information');
    expect(result.contacts.abilities[0].availableEffects).toContain('rescue');
    expect(result.contacts.abilities[0].availableEffects).toContain('problem-solving');
  });
  
  it('deve consolidar allAvailableEffects de múltiplos contacts', () => {
    const effects: UnifiedEffect[] = [
      createContactsEffect('contatos-1', ['equipment-trade', 'information']),
      createContactsEffect('contatos-2', ['rescue', 'favors']),
    ];
    
    const context = createTestContext();
    const result = consolidateEffects(effects, context);
    
    expect(result.contacts.available).toBe(true);
    expect(result.contacts.abilities).toHaveLength(2);
    expect(result.contacts.allAvailableEffects).toContain('equipment-trade');
    expect(result.contacts.allAvailableEffects).toContain('information');
    expect(result.contacts.allAvailableEffects).toContain('rescue');
    expect(result.contacts.allAvailableEffects).toContain('favors');
  });
  
  it('deve somar totalUsesPerMission', () => {
    const effects: UnifiedEffect[] = [
      createContactsEffect('contatos-1', ['equipment-trade']),
      createContactsEffect('contatos-2', ['information']),
    ];
    
    const context = createTestContext();
    const result = consolidateEffects(effects, context);
    
    expect(result.contacts.totalUsesPerMission).toBe(2);
  });
  
  it('não deve consolidar contacts inativo', () => {
    const effects: UnifiedEffect[] = [
      createContactsEffect('eu-conheco-um-cara', ['equipment-trade'], { isActive: false }),
    ];
    
    const context = createTestContext();
    const result = consolidateEffects(effects, context);
    
    expect(result.contacts.available).toBe(false);
    expect(result.contacts.abilities).toHaveLength(0);
    expect(result.contacts.totalUsesPerMission).toBe(0);
  });
  
  it('deve rastrear source do contacts', () => {
    const effects: UnifiedEffect[] = [
      createContactsEffect('eu-conheco-um-cara', ['equipment-trade']),
    ];
    
    const context = createTestContext();
    const result = consolidateEffects(effects, context);
    
    expect(result.contacts.abilities[0].source).toBe('Negociador: eu-conheco-um-cara');
  });
  
  it('deve suportar peCost diferente de zero', () => {
    const effects: UnifiedEffect[] = [
      {
        id: 'contatos-com-custo',
        name: 'Contatos com Custo',
        source: 'track',
        sourceId: 'contatos-com-custo',
        sourceName: 'Negociador: contatos-com-custo',
        mechanics: {
          contacts: {
            usesPerMission: 2,
            availableEffects: ['special-favor'],
            gmDiscretion: false,
            peCost: 3,
            actionType: 'standard',
          },
        },
        isActive: true,
        isToggleable: false,
      },
    ];
    
    const context = createTestContext();
    const result = consolidateEffects(effects, context);
    
    expect(result.contacts.abilities[0].peCost).toBe(3);
    expect(result.contacts.abilities[0].actionType).toBe('standard');
    expect(result.contacts.abilities[0].gmDiscretion).toBe(false);
    expect(result.contacts.totalUsesPerMission).toBe(2);
  });
});

// =====================================================
// Testes de Integração Completa (contacts + outras mecânicas)
// =====================================================

describe('Integração contacts com outras mecânicas', () => {
  it('deve consolidar contacts junto com socialEffect', () => {
    const effects: UnifiedEffect[] = [
      {
        id: 'negociador-contacts',
        name: 'Eu Conheço um Cara',
        source: 'track',
        sourceId: 'eu-conheco-um-cara',
        sourceName: 'Negociador: Eu Conheço um Cara',
        mechanics: {
          contacts: {
            usesPerMission: 1,
            availableEffects: ['equipment-trade', 'information'],
            gmDiscretion: true,
            peCost: 0,
            actionType: 'varies',
          },
        },
        isActive: true,
        isToggleable: false,
      },
      {
        id: 'negociador-social',
        name: 'Eloquência',
        source: 'track',
        sourceId: 'eloquencia',
        sourceName: 'Negociador: Eloquência',
        mechanics: {
          socialEffect: {
            range: 'curto',
            targetAll: true,
            skillOptions: ['diplomacia', 'enganacao', 'intimidacao'],
            resistanceSkill: 'vontade',
            effect: 'fascinated',
            duration: 'concentration',
            peCost: 1,
            actionType: 'standard',
          },
        },
        isActive: true,
        isToggleable: false,
      },
    ];
    
    const context = createTestContext({ nex: 65 });
    const result = consolidateEffects(effects, context);
    
    // contacts e socialEffect devem ser independentes
    expect(result.contacts.available).toBe(true);
    expect(result.contacts.abilities).toHaveLength(1);
    expect(result.contacts.allAvailableEffects).toContain('equipment-trade');
    
    expect(result.socialEffect.available).toBe(true);
    expect(result.socialEffect.abilities).toHaveLength(1);
    expect(result.socialEffect.availableEffects).toContain('fascinated');
  });
  
  it('deve consolidar contacts com allyBuff e skillBonus', () => {
    const effects: UnifiedEffect[] = [
      {
        id: 'negociador-completo',
        name: 'Negociador Completo',
        source: 'track',
        sourceId: 'negociador',
        sourceName: 'Negociador',
        mechanics: {
          contacts: {
            usesPerMission: 1,
            availableEffects: ['equipment-trade'],
            gmDiscretion: true,
            peCost: 0,
            actionType: 'varies',
          },
          allyBuff: {
            range: 'curto',
            skillBonus: 1,
            peCost: 4,
            actionType: 'standard',
            duration: 'scene',
            includeSelf: true,
          },
          skillBonus: {
            diplomacia: 5,
            enganacao: 5,
          },
        },
        isActive: true,
        isToggleable: false,
      },
    ];
    
    const context = createTestContext({ nex: 65 });
    const result = consolidateEffects(effects, context);
    
    // Verifica contacts
    expect(result.contacts.available).toBe(true);
    expect(result.contacts.totalUsesPerMission).toBe(1);
    
    // Verifica allyBuff
    expect(result.allyBuff.available).toBe(true);
    expect(result.allyBuff.maxSkillBonus).toBe(1);
    
    // Verifica skill bonuses
    expect(result.skills['diplomacia']?.bonus).toBe(5);
    expect(result.skills['enganacao']?.bonus).toBe(5);
  });
});
