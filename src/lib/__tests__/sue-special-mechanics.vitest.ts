// =====================================================
// Testes: categoryReduction, counterSpell, sneakAttack, healing,
// leadership, allyBuff, socialEffect, contacts, copyAbility, technician
// e combatAdvanced no SUE
// Ordem Paranormal RPG v1.3
// =====================================================
//
// Verifica que as mecânicas categoryReduction, counterSpell, sneakAttack, healing,
// leadership, allyBuff, socialEffect, contacts, copyAbility, technician e combatAdvanced
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

// =====================================================
// Testes de copyAbility (Truque de Mestre)
// =====================================================

describe('consolidateEffects - copyAbility', () => {
  /**
   * Cria um efeito de teste com copyAbility
   */
  function createCopyAbilityEffect(
    id: string,
    source: 'ally' | 'enemy' | 'any' = 'ally',
    ignorePrerequisites: boolean = true,
    overrides: Partial<UnifiedEffect> = {}
  ): UnifiedEffect {
    return {
      id,
      name: `Cópia Habilidade ${id}`,
      source: 'track',
      sourceId: id,
      sourceName: `Trilha: ${id}`,
      mechanics: {
        copyAbility: {
          source,
          seenInScene: true,
          ignorePrerequisites,
          payOriginalCosts: true,
          peCost: 5,
          actionType: 'varies',
        },
      },
      isActive: true,
      isToggleable: false,
      ...overrides,
    };
  }

  it('deve consolidar copyAbility básico corretamente', () => {
    const effects: UnifiedEffect[] = [
      createCopyAbilityEffect('truque-mestre'),
    ];
    
    const context = createTestContext({ nex: 99 });
    const result = consolidateEffects(effects, context);
    
    expect(result.copyAbility.available).toBe(true);
    expect(result.copyAbility.abilities).toHaveLength(1);
    expect(result.copyAbility.abilities[0].source).toBe('ally');
    expect(result.copyAbility.abilities[0].seenInScene).toBe(true);
    expect(result.copyAbility.abilities[0].ignorePrerequisites).toBe(true);
    expect(result.copyAbility.abilities[0].payOriginalCosts).toBe(true);
    expect(result.copyAbility.abilities[0].peCost).toBe(5);
    expect(result.copyAbility.abilities[0].actionType).toBe('varies');
  });

  it('deve rastrear fonte corretamente', () => {
    const effects: UnifiedEffect[] = [
      createCopyAbilityEffect('truque-mestre'),
    ];
    
    const context = createTestContext({ nex: 99 });
    const result = consolidateEffects(effects, context);
    
    expect(result.copyAbility.abilities[0].sourceName).toBe('Trilha: truque-mestre');
  });

  it('deve consolidar canCopyFromEnemy quando source é enemy ou any', () => {
    const effects: UnifiedEffect[] = [
      createCopyAbilityEffect('copiar-enemy', 'enemy'),
    ];
    
    const context = createTestContext({ nex: 99 });
    const result = consolidateEffects(effects, context);
    
    expect(result.copyAbility.canCopyFromEnemy).toBe(true);
  });

  it('deve consolidar canCopyFromEnemy quando source é any', () => {
    const effects: UnifiedEffect[] = [
      createCopyAbilityEffect('copiar-any', 'any'),
    ];
    
    const context = createTestContext({ nex: 99 });
    const result = consolidateEffects(effects, context);
    
    expect(result.copyAbility.canCopyFromEnemy).toBe(true);
  });

  it('não deve marcar canCopyFromEnemy quando source é ally', () => {
    const effects: UnifiedEffect[] = [
      createCopyAbilityEffect('copiar-ally', 'ally'),
    ];
    
    const context = createTestContext({ nex: 99 });
    const result = consolidateEffects(effects, context);
    
    expect(result.copyAbility.canCopyFromEnemy).toBe(false);
  });

  it('deve consolidar ignoresPrerequisites corretamente', () => {
    const effects: UnifiedEffect[] = [
      createCopyAbilityEffect('truque-mestre', 'ally', true),
    ];
    
    const context = createTestContext({ nex: 99 });
    const result = consolidateEffects(effects, context);
    
    expect(result.copyAbility.ignoresPrerequisites).toBe(true);
  });

  it('não deve marcar ignoresPrerequisites quando false', () => {
    const effects: UnifiedEffect[] = [
      createCopyAbilityEffect('truque-limitado', 'ally', false),
    ];
    
    const context = createTestContext({ nex: 99 });
    const result = consolidateEffects(effects, context);
    
    expect(result.copyAbility.ignoresPrerequisites).toBe(false);
  });

  it('deve calcular minPECost corretamente', () => {
    const effects: UnifiedEffect[] = [
      {
        id: 'copy-1',
        name: 'Cópia Barata',
        source: 'track',
        sourceId: 'copy-1',
        sourceName: 'Trilha: Cópia Barata',
        mechanics: {
          copyAbility: {
            source: 'ally',
            seenInScene: true,
            ignorePrerequisites: true,
            payOriginalCosts: true,
            peCost: 3,
            actionType: 'varies',
          },
        },
        isActive: true,
        isToggleable: false,
      },
      {
        id: 'copy-2',
        name: 'Cópia Cara',
        source: 'track',
        sourceId: 'copy-2',
        sourceName: 'Trilha: Cópia Cara',
        mechanics: {
          copyAbility: {
            source: 'ally',
            seenInScene: true,
            ignorePrerequisites: true,
            payOriginalCosts: true,
            peCost: 8,
            actionType: 'varies',
          },
        },
        isActive: true,
        isToggleable: false,
      },
    ];
    
    const context = createTestContext({ nex: 99 });
    const result = consolidateEffects(effects, context);
    
    expect(result.copyAbility.minPECost).toBe(3);
    expect(result.copyAbility.abilities).toHaveLength(2);
  });

  it('deve ignorar copyAbility inativo', () => {
    const effects: UnifiedEffect[] = [
      createCopyAbilityEffect('truque-inativo', 'ally', true, { isActive: false }),
    ];
    
    const context = createTestContext({ nex: 99 });
    const result = consolidateEffects(effects, context);
    
    expect(result.copyAbility.available).toBe(false);
    expect(result.copyAbility.abilities).toHaveLength(0);
  });

  it('deve suportar usesPerScene e excludedAbilities', () => {
    const effects: UnifiedEffect[] = [
      {
        id: 'copy-limitado',
        name: 'Cópia Limitada',
        source: 'track',
        sourceId: 'copy-limitado',
        sourceName: 'Trilha: Cópia Limitada',
        mechanics: {
          copyAbility: {
            source: 'ally',
            seenInScene: true,
            ignorePrerequisites: false,
            payOriginalCosts: true,
            peCost: 5,
            actionType: 'standard',
            usesPerScene: 2,
            excludedAbilities: ['ritual', 'transcender'],
          },
        },
        isActive: true,
        isToggleable: false,
      },
    ];
    
    const context = createTestContext({ nex: 99 });
    const result = consolidateEffects(effects, context);
    
    expect(result.copyAbility.available).toBe(true);
    expect(result.copyAbility.abilities[0].usesPerScene).toBe(2);
    expect(result.copyAbility.abilities[0].excludedAbilities).toContain('ritual');
    expect(result.copyAbility.abilities[0].excludedAbilities).toContain('transcender');
  });
});

// =====================================================
// Testes de Integração Completa (copyAbility + outras mecânicas)
// =====================================================

describe('Integração copyAbility com outras mecânicas do Negociador', () => {
  it('deve consolidar copyAbility junto com socialEffect e contacts', () => {
    const effects: UnifiedEffect[] = [
      {
        id: 'negociador-copy',
        name: 'Truque de Mestre',
        source: 'track',
        sourceId: 'truque-mestre',
        sourceName: 'Negociador: Truque de Mestre',
        mechanics: {
          copyAbility: {
            source: 'ally',
            seenInScene: true,
            ignorePrerequisites: true,
            payOriginalCosts: true,
            peCost: 5,
            actionType: 'varies',
          },
        },
        isActive: true,
        isToggleable: false,
      },
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
    
    const context = createTestContext({ nex: 99 });
    const result = consolidateEffects(effects, context);
    
    // Verifica copyAbility
    expect(result.copyAbility.available).toBe(true);
    expect(result.copyAbility.abilities).toHaveLength(1);
    expect(result.copyAbility.abilities[0].source).toBe('ally');
    expect(result.copyAbility.ignoresPrerequisites).toBe(true);
    expect(result.copyAbility.minPECost).toBe(5);
    
    // Verifica contacts
    expect(result.contacts.available).toBe(true);
    expect(result.contacts.abilities).toHaveLength(1);
    expect(result.contacts.allAvailableEffects).toContain('equipment-trade');
    
    // Verifica socialEffect
    expect(result.socialEffect.available).toBe(true);
    expect(result.socialEffect.abilities).toHaveLength(1);
    expect(result.socialEffect.availableEffects).toContain('fascinated');
  });

  it('deve consolidar todas as 4 mecânicas do Negociador juntas', () => {
    const effects: UnifiedEffect[] = [
      {
        id: 'negociador-completo',
        name: 'Negociador Completo',
        source: 'track',
        sourceId: 'negociador',
        sourceName: 'Negociador',
        mechanics: {
          copyAbility: {
            source: 'ally',
            seenInScene: true,
            ignorePrerequisites: true,
            payOriginalCosts: true,
            peCost: 5,
            actionType: 'varies',
          },
          contacts: {
            usesPerMission: 1,
            availableEffects: ['equipment-trade'],
            gmDiscretion: true,
            peCost: 0,
            actionType: 'varies',
          },
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
          allyBuff: {
            range: 'curto',
            skillBonus: 2,
            peCost: 8,
            actionType: 'standard',
            duration: 'scene',
            includeSelf: true,
          },
          skillBonus: {
            diplomacia: 5,
          },
        },
        isActive: true,
        isToggleable: false,
      },
    ];
    
    const context = createTestContext({ nex: 99 });
    const result = consolidateEffects(effects, context);
    
    // Todas as mecânicas devem estar disponíveis
    expect(result.copyAbility.available).toBe(true);
    expect(result.contacts.available).toBe(true);
    expect(result.socialEffect.available).toBe(true);
    expect(result.allyBuff.available).toBe(true);
    expect(result.skills['diplomacia']?.bonus).toBe(5);
    
    // Verificações específicas
    expect(result.copyAbility.ignoresPrerequisites).toBe(true);
    expect(result.contacts.totalUsesPerMission).toBe(1);
    expect(result.socialEffect.availableEffects).toContain('fascinated');
    expect(result.allyBuff.maxSkillBonus).toBe(2);
  });
});

// =====================================================
// Testes de technician (Técnico)
// =====================================================

describe('consolidateEffects - technician', () => {
  it('deve consolidar carryCapacity corretamente', () => {
    const effects: UnifiedEffect[] = [
      {
        id: 'inventario-otimizado',
        name: 'Inventário Otimizado',
        source: 'track',
        sourceId: 'inventario-otimizado',
        sourceName: 'Técnico: Inventário Otimizado',
        mechanics: {
          carryCapacity: {
            addAttribute: 'intellect',
          },
        },
        isActive: true,
        isToggleable: false,
      },
    ];
    
    const context = createTestContext({ nex: 10 });
    const result = consolidateEffects(effects, context);
    
    expect(result.technician.available).toBe(true);
    expect(result.technician.carryCapacity.additionalAttributes).toContain('intellect');
    expect(result.technician.carryCapacity.sources).toHaveLength(1);
    expect(result.technician.carryCapacity.sources[0].attribute).toBe('intellect');
  });

  it('deve consolidar itemSpaceReduction corretamente', () => {
    const effects: UnifiedEffect[] = [
      {
        id: 'inventario-otimizado',
        name: 'Inventário Otimizado',
        source: 'track',
        sourceId: 'inventario-otimizado',
        sourceName: 'Técnico: Inventário Otimizado',
        mechanics: {
          itemSpaceReduction: 1,
        },
        isActive: true,
        isToggleable: false,
      },
    ];
    
    const context = createTestContext({ nex: 10 });
    const result = consolidateEffects(effects, context);
    
    expect(result.technician.available).toBe(true);
    expect(result.technician.itemSpaceReduction.total).toBe(1);
    expect(result.technician.itemSpaceReduction.sources).toHaveLength(1);
    expect(result.technician.itemSpaceReduction.sources[0].amount).toBe(1);
  });

  it('deve consolidar repairEquipment corretamente', () => {
    const effects: UnifiedEffect[] = [
      {
        id: 'remendo',
        name: 'Remendo',
        source: 'track',
        sourceId: 'remendo',
        sourceName: 'Técnico: Remendo',
        mechanics: {
          repairEquipment: {
            range: 'touch',
            removeCondition: 'quebrado',
            peCost: 1,
            actionType: 'complete',
          },
        },
        isActive: true,
        isToggleable: false,
      },
    ];
    
    const context = createTestContext({ nex: 40 });
    const result = consolidateEffects(effects, context);
    
    expect(result.technician.available).toBe(true);
    expect(result.technician.repairAbilities).toHaveLength(1);
    expect(result.technician.repairAbilities[0].range).toBe('touch');
    expect(result.technician.repairAbilities[0].removeCondition).toBe('quebrado');
    expect(result.technician.repairAbilities[0].peCost).toBe(1);
    expect(result.technician.repairAbilities[0].actionType).toBe('complete');
  });

  it('deve consolidar createEquipment corretamente', () => {
    const effects: UnifiedEffect[] = [
      {
        id: 'improvisar',
        name: 'Improvisar',
        source: 'track',
        sourceId: 'improvisar',
        sourceName: 'Técnico: Improvisar',
        mechanics: {
          createEquipment: {
            type: 'general',
            duration: 'scene',
            destroyedAfter: true,
            peCost: 2,
            actionType: 'complete',
          },
        },
        isActive: true,
        isToggleable: false,
      },
    ];
    
    const context = createTestContext({ nex: 65 });
    const result = consolidateEffects(effects, context);
    
    expect(result.technician.available).toBe(true);
    expect(result.technician.createEquipmentAbilities).toHaveLength(1);
    expect(result.technician.createEquipmentAbilities[0].type).toBe('general');
    expect(result.technician.createEquipmentAbilities[0].duration).toBe('scene');
    expect(result.technician.createEquipmentAbilities[0].destroyedAfter).toBe(true);
    expect(result.technician.createEquipmentAbilities[0].peCost).toBe(2);
  });

  it('deve consolidar retrieveItem corretamente', () => {
    const effects: UnifiedEffect[] = [
      {
        id: 'preparado-para-tudo',
        name: 'Preparado para Tudo',
        source: 'track',
        sourceId: 'preparado-para-tudo',
        sourceName: 'Técnico: Preparado para Tudo',
        mechanics: {
          retrieveItem: {
            excludeWeapons: true,
            retroactive: true,
            peCostPerCategory: 3,
            actionType: 'movement',
          },
        },
        isActive: true,
        isToggleable: false,
      },
    ];
    
    const context = createTestContext({ nex: 99 });
    const result = consolidateEffects(effects, context);
    
    expect(result.technician.available).toBe(true);
    expect(result.technician.retrieveItemAbilities).toHaveLength(1);
    expect(result.technician.retrieveItemAbilities[0].excludeWeapons).toBe(true);
    expect(result.technician.retrieveItemAbilities[0].retroactive).toBe(true);
    expect(result.technician.retrieveItemAbilities[0].peCostPerCategory).toBe(3);
    expect(result.technician.retrieveItemAbilities[0].actionType).toBe('movement');
  });

  it('deve somar itemSpaceReduction de múltiplas fontes', () => {
    const effects: UnifiedEffect[] = [
      {
        id: 'reducao-1',
        name: 'Redução 1',
        source: 'track',
        sourceId: 'reducao-1',
        sourceName: 'Fonte 1',
        mechanics: {
          itemSpaceReduction: 1,
        },
        isActive: true,
        isToggleable: false,
      },
      {
        id: 'reducao-2',
        name: 'Redução 2',
        source: 'general_power',
        sourceId: 'reducao-2',
        sourceName: 'Fonte 2',
        mechanics: {
          itemSpaceReduction: 1,
        },
        isActive: true,
        isToggleable: false,
      },
    ];
    
    const context = createTestContext({ nex: 50 });
    const result = consolidateEffects(effects, context);
    
    expect(result.technician.itemSpaceReduction.total).toBe(2);
    expect(result.technician.itemSpaceReduction.sources).toHaveLength(2);
  });

  it('deve ignorar mecânicas do técnico inativas', () => {
    const effects: UnifiedEffect[] = [
      {
        id: 'tecnico-inativo',
        name: 'Técnico Inativo',
        source: 'track',
        sourceId: 'tecnico-inativo',
        sourceName: 'Técnico',
        mechanics: {
          carryCapacity: {
            addAttribute: 'intellect',
          },
          itemSpaceReduction: 1,
        },
        isActive: false,
        isToggleable: false,
      },
    ];
    
    const context = createTestContext({ nex: 10 });
    const result = consolidateEffects(effects, context);
    
    expect(result.technician.available).toBe(false);
    expect(result.technician.carryCapacity.additionalAttributes).toHaveLength(0);
    expect(result.technician.itemSpaceReduction.total).toBe(0);
  });

  it('deve rastrear fontes corretamente', () => {
    const effects: UnifiedEffect[] = [
      {
        id: 'tecnico-completo',
        name: 'Técnico Completo',
        source: 'track',
        sourceId: 'tecnico',
        sourceName: 'Técnico: Completo',
        mechanics: {
          carryCapacity: {
            addAttribute: 'intellect',
          },
          itemSpaceReduction: 1,
          repairEquipment: {
            range: 'touch',
            removeCondition: 'quebrado',
            peCost: 1,
            actionType: 'complete',
          },
        },
        isActive: true,
        isToggleable: false,
      },
    ];
    
    const context = createTestContext({ nex: 40 });
    const result = consolidateEffects(effects, context);
    
    expect(result.technician.carryCapacity.sources[0].source).toBe('Técnico: Completo');
    expect(result.technician.itemSpaceReduction.sources[0].source).toBe('Técnico: Completo');
    expect(result.technician.repairAbilities[0].source).toBe('Técnico: Completo');
  });
});

// =====================================================
// Testes de Integração Completa (technician + outras mecânicas)
// =====================================================

describe('Integração technician com outras mecânicas', () => {
  it('deve consolidar todas as 4 habilidades do Técnico juntas', () => {
    const effects: UnifiedEffect[] = [
      {
        id: 'tecnico-inventario',
        name: 'Inventário Otimizado',
        source: 'track',
        sourceId: 'inventario-otimizado',
        sourceName: 'Técnico: Inventário Otimizado',
        mechanics: {
          carryCapacity: {
            addAttribute: 'intellect',
          },
          itemSpaceReduction: 1,
        },
        isActive: true,
        isToggleable: false,
      },
      {
        id: 'tecnico-remendo',
        name: 'Remendo',
        source: 'track',
        sourceId: 'remendo',
        sourceName: 'Técnico: Remendo',
        mechanics: {
          repairEquipment: {
            range: 'touch',
            removeCondition: 'quebrado',
            peCost: 1,
            actionType: 'complete',
          },
          categoryReduction: {
            amount: 1,
            targetType: 'any-weapon',
            appliesToAllCarried: true,
          },
        },
        isActive: true,
        isToggleable: false,
      },
      {
        id: 'tecnico-improvisar',
        name: 'Improvisar',
        source: 'track',
        sourceId: 'improvisar',
        sourceName: 'Técnico: Improvisar',
        mechanics: {
          createEquipment: {
            type: 'general',
            duration: 'scene',
            destroyedAfter: true,
            peCost: 2,
            actionType: 'complete',
          },
        },
        isActive: true,
        isToggleable: false,
      },
      {
        id: 'tecnico-preparado',
        name: 'Preparado para Tudo',
        source: 'track',
        sourceId: 'preparado-para-tudo',
        sourceName: 'Técnico: Preparado para Tudo',
        mechanics: {
          retrieveItem: {
            excludeWeapons: true,
            retroactive: true,
            peCostPerCategory: 3,
            actionType: 'movement',
          },
        },
        isActive: true,
        isToggleable: false,
      },
    ];
    
    const context = createTestContext({ nex: 99 });
    const result = consolidateEffects(effects, context);
    
    // Todas as mecânicas do técnico devem estar disponíveis
    expect(result.technician.available).toBe(true);
    expect(result.technician.carryCapacity.additionalAttributes).toContain('intellect');
    expect(result.technician.itemSpaceReduction.total).toBe(1);
    expect(result.technician.repairAbilities).toHaveLength(1);
    expect(result.technician.createEquipmentAbilities).toHaveLength(1);
    expect(result.technician.retrieveItemAbilities).toHaveLength(1);
    
    // categoryReduction também deve ser consolidado
    expect(result.inventory.categoryReductions).toHaveLength(1);
    expect(result.inventory.totalCategoryReduction).toBe(1);
  });

  it('deve consolidar technician com skillBonus', () => {
    const effects: UnifiedEffect[] = [
      {
        id: 'tecnico-completo',
        name: 'Técnico Completo',
        source: 'track',
        sourceId: 'tecnico',
        sourceName: 'Técnico',
        mechanics: {
          carryCapacity: {
            addAttribute: 'intellect',
          },
          itemSpaceReduction: 1,
          skillBonus: {
            oficio: 5,
            investigacao: 3,
          },
        },
        isActive: true,
        isToggleable: false,
      },
    ];
    
    const context = createTestContext({ nex: 50 });
    const result = consolidateEffects(effects, context);
    
    // Verifica technician
    expect(result.technician.available).toBe(true);
    expect(result.technician.carryCapacity.additionalAttributes).toContain('intellect');
    
    // Verifica skill bonuses
    expect(result.skills['oficio']?.bonus).toBe(5);
    expect(result.skills['investigacao']?.bonus).toBe(3);
  });
});

// =====================================================
// Testes: combatAdvanced - Mecânicas de Combate Avançado
// =====================================================

describe('combatAdvanced - Multiplicador de Ataque Especial', () => {
  it('deve consolidar specialAttackMultiplier básico (Potência Máxima)', () => {
    const effects: UnifiedEffect[] = [
      {
        id: 'potencia-maxima',
        name: 'Potência Máxima',
        source: 'track',
        sourceId: 'guerreiro',
        sourceName: 'Guerreiro',
        mechanics: {
          specialAttackMultiplier: {
            value: 2,
            weaponRestriction: 'melee',
          },
        },
        isActive: true,
        isToggleable: false,
      },
    ];
    
    const context = createTestContext({ nex: 99 });
    const result = consolidateEffects(effects, context);
    
    expect(result.combatAdvanced.specialAttackMultiplier.value).toBe(2);
    expect(result.combatAdvanced.specialAttackMultiplier.weaponRestriction).toBe('melee');
    expect(result.combatAdvanced.specialAttackMultiplier.sources).toContain('Guerreiro');
  });

  it('deve usar maior multiplicador quando múltiplas fontes', () => {
    const effects: UnifiedEffect[] = [
      {
        id: 'mult-1',
        name: 'Multiplicador 1',
        source: 'track',
        sourceId: 'fonte1',
        sourceName: 'Fonte 1',
        mechanics: {
          specialAttackMultiplier: { value: 1.5, weaponRestriction: 'any' },
        },
        isActive: true,
        isToggleable: false,
      },
      {
        id: 'mult-2',
        name: 'Multiplicador 2',
        source: 'class_power',
        sourceId: 'fonte2',
        sourceName: 'Fonte 2',
        mechanics: {
          specialAttackMultiplier: { value: 2, weaponRestriction: 'melee' },
        },
        isActive: true,
        isToggleable: false,
      },
    ];
    
    const context = createTestContext();
    const result = consolidateEffects(effects, context);
    
    expect(result.combatAdvanced.specialAttackMultiplier.value).toBe(2);
    expect(result.combatAdvanced.specialAttackMultiplier.sources).toHaveLength(2);
  });

  it('não deve aplicar specialAttackMultiplier se efeito inativo', () => {
    const effects: UnifiedEffect[] = [
      {
        id: 'potencia-inativa',
        name: 'Potência Inativa',
        source: 'track',
        sourceId: 'guerreiro',
        sourceName: 'Guerreiro',
        mechanics: {
          specialAttackMultiplier: { value: 2 },
        },
        isActive: false,
        isToggleable: false,
      },
    ];
    
    const context = createTestContext();
    const result = consolidateEffects(effects, context);
    
    expect(result.combatAdvanced.specialAttackMultiplier.value).toBe(1); // Valor default
    expect(result.combatAdvanced.specialAttackMultiplier.sources).toHaveLength(0);
  });
});

describe('combatAdvanced - Ações Extras de Trilha', () => {
  it('deve consolidar extraActionsTrack (Ataque Extra)', () => {
    const effects: UnifiedEffect[] = [
      {
        id: 'ataque-extra',
        name: 'Ataque Extra',
        source: 'track',
        sourceId: 'operacoes-especiais',
        sourceName: 'Operações Especiais',
        mechanics: {
          extraActionsTrack: {
            type: 'attack',
            trigger: 'on-attack',
            peCost: 2,
            actionType: 'free',
            perRound: true,
          },
        },
        isActive: true,
        isToggleable: false,
      },
    ];
    
    const context = createTestContext({ nex: 40 });
    const result = consolidateEffects(effects, context);
    
    expect(result.combatAdvanced.extraActions).toHaveLength(1);
    expect(result.combatAdvanced.extraActions[0].type).toBe('attack');
    expect(result.combatAdvanced.extraActions[0].trigger).toBe('on-attack');
    expect(result.combatAdvanced.extraActions[0].peCost).toBe(2);
    expect(result.combatAdvanced.extraActions[0].perRound).toBe(true);
  });

  it('deve consolidar múltiplas extraActionsTrack', () => {
    const effects: UnifiedEffect[] = [
      {
        id: 'iniciativa-aprimorada',
        name: 'Iniciativa Aprimorada',
        source: 'track',
        sourceId: 'op-esp',
        sourceName: 'Operações Especiais',
        mechanics: {
          extraActionsTrack: {
            type: 'movement',
            trigger: 'first-round',
            peCost: 0,
            actionType: 'free',
          },
        },
        isActive: true,
        isToggleable: false,
      },
      {
        id: 'revidar',
        name: 'Revidar',
        source: 'track',
        sourceId: 'guerreiro',
        sourceName: 'Guerreiro',
        mechanics: {
          extraActionsTrack: {
            type: 'attack',
            trigger: 'on-block',
            peCost: 2,
            actionType: 'reaction',
            weaponRestriction: 'melee',
          },
        },
        isActive: true,
        isToggleable: false,
      },
    ];
    
    const context = createTestContext({ nex: 40 });
    const result = consolidateEffects(effects, context);
    
    expect(result.combatAdvanced.extraActions).toHaveLength(2);
    expect(result.combatAdvanced.extraActions.find(a => a.trigger === 'first-round')).toBeDefined();
    expect(result.combatAdvanced.extraActions.find(a => a.trigger === 'on-block')).toBeDefined();
  });

  it('deve consolidar manobras de Força Opressora', () => {
    const effects: UnifiedEffect[] = [
      {
        id: 'forca-opressora',
        name: 'Força Opressora',
        source: 'track',
        sourceId: 'guerreiro',
        sourceName: 'Guerreiro',
        mechanics: {
          extraActionsTrack: {
            type: 'maneuver',
            trigger: 'on-melee-hit',
            peCost: 1,
            actionType: 'free',
            maneuverOptions: ['derrubar', 'empurrar'],
          },
        },
        isActive: true,
        isToggleable: false,
      },
    ];
    
    const context = createTestContext({ nex: 65 });
    const result = consolidateEffects(effects, context);
    
    expect(result.combatAdvanced.extraActions).toHaveLength(1);
    expect(result.combatAdvanced.extraActions[0].maneuverOptions).toEqual(['derrubar', 'empurrar']);
  });
});

describe('combatAdvanced - Dano Máximo em Crítico', () => {
  it('deve consolidar maximumDamageOnCritical (Atirar para Matar)', () => {
    const effects: UnifiedEffect[] = [
      {
        id: 'atirar-matar',
        name: 'Atirar para Matar',
        source: 'track',
        sourceId: 'atirador-elite',
        sourceName: 'Atirador de Elite',
        mechanics: {
          maximumDamageOnCritical: {
            weaponType: 'firearm',
          },
        },
        isActive: true,
        isToggleable: false,
      },
    ];
    
    const context = createTestContext({ nex: 99 });
    const result = consolidateEffects(effects, context);
    
    expect(result.combatAdvanced.maximumDamageOnCrit.enabled).toBe(true);
    expect(result.combatAdvanced.maximumDamageOnCrit.weaponTypes).toContain('firearm');
    expect(result.combatAdvanced.maximumDamageOnCrit.sources).toContain('Atirador de Elite');
  });

  it('deve consolidar múltiplos tipos de arma para dano máximo', () => {
    const effects: UnifiedEffect[] = [
      {
        id: 'crit-firearm',
        name: 'Crítico Arma de Fogo',
        source: 'track',
        sourceId: 'atirador',
        sourceName: 'Atirador',
        mechanics: {
          maximumDamageOnCritical: { weaponType: 'firearm' },
        },
        isActive: true,
        isToggleable: false,
      },
      {
        id: 'crit-melee',
        name: 'Crítico Corpo a Corpo',
        source: 'class_power',
        sourceId: 'poder',
        sourceName: 'Poder',
        mechanics: {
          maximumDamageOnCritical: { weaponType: 'melee' },
        },
        isActive: true,
        isToggleable: false,
      },
    ];
    
    const context = createTestContext();
    const result = consolidateEffects(effects, context);
    
    expect(result.combatAdvanced.maximumDamageOnCrit.enabled).toBe(true);
    expect(result.combatAdvanced.maximumDamageOnCrit.weaponTypes).toContain('firearm');
    expect(result.combatAdvanced.maximumDamageOnCrit.weaponTypes).toContain('melee');
    expect(result.combatAdvanced.maximumDamageOnCrit.sources).toHaveLength(2);
  });
});

describe('combatAdvanced - Bônus de Bloqueio com Vigor', () => {
  it('deve consolidar blockVigorBonus (Casca Grossa)', () => {
    const effects: UnifiedEffect[] = [
      {
        id: 'casca-grossa',
        name: 'Casca Grossa',
        source: 'track',
        sourceId: 'tropa-choque',
        sourceName: 'Tropa de Choque',
        mechanics: {
          blockVigorBonus: true,
        },
        isActive: true,
        isToggleable: false,
      },
    ];
    
    const context = createTestContext();
    const result = consolidateEffects(effects, context);
    
    expect(result.combatAdvanced.blockVigorBonus.enabled).toBe(true);
    expect(result.combatAdvanced.blockVigorBonus.sources).toContain('Tropa de Choque');
  });
});

describe('combatAdvanced - Ocultismo como Ataque', () => {
  it('deve consolidar occultismAsAttack (Lâmina Paranormal)', () => {
    const effects: UnifiedEffect[] = [
      {
        id: 'lamina-maldita',
        name: 'Lâmina Maldita',
        source: 'track',
        sourceId: 'lamina-paranormal',
        sourceName: 'Lâmina Paranormal',
        mechanics: {
          occultismAsAttack: true,
        },
        isActive: true,
        isToggleable: false,
      },
    ];
    
    const context = createTestContext();
    const result = consolidateEffects(effects, context);
    
    expect(result.combatAdvanced.occultismAsAttack.enabled).toBe(true);
    expect(result.combatAdvanced.occultismAsAttack.sources).toContain('Lâmina Paranormal');
  });
});

describe('combatAdvanced - Provocar (Taunt)', () => {
  it('deve consolidar taunt (Cai Dentro)', () => {
    const effects: UnifiedEffect[] = [
      {
        id: 'cai-dentro',
        name: 'Cai Dentro',
        source: 'track',
        sourceId: 'tropa-choque',
        sourceName: 'Tropa de Choque',
        mechanics: {
          taunt: {
            range: 'curto',
            resistanceTest: 'vontade',
            dtAttribute: 'vigor',
            peCost: 1,
            actionType: 'reaction',
          },
        },
        isActive: true,
        isToggleable: false,
      },
    ];
    
    const context = createTestContext({ nex: 40 });
    const result = consolidateEffects(effects, context);
    
    expect(result.combatAdvanced.taunt.available).toBe(true);
    expect(result.combatAdvanced.taunt.abilities).toHaveLength(1);
    expect(result.combatAdvanced.taunt.abilities[0].range).toBe('curto');
    expect(result.combatAdvanced.taunt.abilities[0].resistanceTest).toBe('vontade');
    expect(result.combatAdvanced.taunt.abilities[0].dtAttribute).toBe('vigor');
    expect(result.combatAdvanced.taunt.abilities[0].peCost).toBe(1);
  });
});

describe('combatAdvanced - Controle de Estado do Alvo', () => {
  it('deve consolidar targetStateControl (Assassinar)', () => {
    const effects: UnifiedEffect[] = [
      {
        id: 'assassinar',
        name: 'Assassinar',
        source: 'track',
        sourceId: 'infiltrador',
        sourceName: 'Infiltrador',
        mechanics: {
          targetStateControl: {
            options: ['unconscious', 'dying'],
            resistanceTest: 'fortitude',
            dtAttribute: 'agility',
          },
        },
        isActive: true,
        isToggleable: false,
      },
    ];
    
    const context = createTestContext({ nex: 65 });
    const result = consolidateEffects(effects, context);
    
    expect(result.combatAdvanced.targetStateControl.available).toBe(true);
    expect(result.combatAdvanced.targetStateControl.options).toContain('unconscious');
    expect(result.combatAdvanced.targetStateControl.options).toContain('dying');
    expect(result.combatAdvanced.targetStateControl.abilities).toHaveLength(1);
    expect(result.combatAdvanced.targetStateControl.abilities[0].resistanceTest).toBe('fortitude');
  });

  it('deve consolidar opções de múltiplas fontes', () => {
    const effects: UnifiedEffect[] = [
      {
        id: 'controle-1',
        name: 'Controle 1',
        source: 'track',
        sourceId: 'fonte1',
        sourceName: 'Fonte 1',
        mechanics: {
          targetStateControl: {
            options: ['unconscious'],
            resistanceTest: 'fortitude',
            dtAttribute: 'agility',
          },
        },
        isActive: true,
        isToggleable: false,
      },
      {
        id: 'controle-2',
        name: 'Controle 2',
        source: 'class_power',
        sourceId: 'fonte2',
        sourceName: 'Fonte 2',
        mechanics: {
          targetStateControl: {
            options: ['dying', 'stunned'],
            resistanceTest: 'vontade',
            dtAttribute: 'presence',
          },
        },
        isActive: true,
        isToggleable: false,
      },
    ];
    
    const context = createTestContext();
    const result = consolidateEffects(effects, context);
    
    expect(result.combatAdvanced.targetStateControl.options).toContain('unconscious');
    expect(result.combatAdvanced.targetStateControl.options).toContain('dying');
    expect(result.combatAdvanced.targetStateControl.options).toContain('stunned');
    expect(result.combatAdvanced.targetStateControl.abilities).toHaveLength(2);
  });
});

describe('combatAdvanced - Bônus quando Machucado', () => {
  it('deve aplicar whenWounded quando PV abaixo do limiar', () => {
    const effects: UnifiedEffect[] = [
      {
        id: 'inquebravel',
        name: 'Inquebrável',
        source: 'track',
        sourceId: 'tropa-choque',
        sourceName: 'Tropa de Choque',
        mechanics: {
          whenWounded: {
            hpThreshold: 50,
            defenseBonus: 5,
            damageReduction: 5,
          },
        },
        isActive: true,
        isToggleable: false,
      },
    ];
    
    // PV atual = 10, máximo = 30 = 33% (abaixo de 50%)
    const context = createTestContext({ hpCurrent: 10, hpMax: 30 });
    const result = consolidateEffects(effects, context);
    
    expect(result.combatAdvanced.conditionalBonuses.whenWounded.active).toBe(true);
    expect(result.combatAdvanced.conditionalBonuses.whenWounded.defenseBonus).toBe(5);
    expect(result.combatAdvanced.conditionalBonuses.whenWounded.damageReduction).toBe(5);
    
    // Deve aplicar bônus de defesa automaticamente
    expect(result.defense.general).toBe(5);
    expect(result.damageReduction.physical).toBe(5);
  });

  it('não deve aplicar whenWounded quando PV acima do limiar', () => {
    const effects: UnifiedEffect[] = [
      {
        id: 'inquebravel',
        name: 'Inquebrável',
        source: 'track',
        sourceId: 'tropa-choque',
        sourceName: 'Tropa de Choque',
        mechanics: {
          whenWounded: {
            hpThreshold: 50,
            defenseBonus: 5,
            damageReduction: 5,
          },
        },
        isActive: true,
        isToggleable: false,
      },
    ];
    
    // PV atual = 20, máximo = 30 = 66% (acima de 50%)
    const context = createTestContext({ hpCurrent: 20, hpMax: 30 });
    const result = consolidateEffects(effects, context);
    
    expect(result.combatAdvanced.conditionalBonuses.whenWounded.active).toBe(false);
    expect(result.defense.general).toBe(0);
    expect(result.damageReduction.physical).toBe(0);
  });

  it('deve somar bônus de múltiplas fontes quando machucado', () => {
    const effects: UnifiedEffect[] = [
      {
        id: 'wounded-1',
        name: 'Wounded 1',
        source: 'track',
        sourceId: 'fonte1',
        sourceName: 'Fonte 1',
        mechanics: {
          whenWounded: {
            hpThreshold: 50,
            defenseBonus: 3,
          },
        },
        isActive: true,
        isToggleable: false,
      },
      {
        id: 'wounded-2',
        name: 'Wounded 2',
        source: 'class_power',
        sourceId: 'fonte2',
        sourceName: 'Fonte 2',
        mechanics: {
          whenWounded: {
            hpThreshold: 50,
            defenseBonus: 2,
            damageReduction: 3,
          },
        },
        isActive: true,
        isToggleable: false,
      },
    ];
    
    const context = createTestContext({ hpCurrent: 10, hpMax: 30 });
    const result = consolidateEffects(effects, context);
    
    expect(result.combatAdvanced.conditionalBonuses.whenWounded.defenseBonus).toBe(5);
    expect(result.combatAdvanced.conditionalBonuses.whenWounded.damageReduction).toBe(3);
    expect(result.defense.general).toBe(5);
  });
});

describe('combatAdvanced - Bônus quando Morrendo', () => {
  it('deve consolidar whenDying (Inquebrável)', () => {
    const effects: UnifiedEffect[] = [
      {
        id: 'inquebravel-dying',
        name: 'Inquebrável (Morrendo)',
        source: 'track',
        sourceId: 'tropa-choque',
        sourceName: 'Tropa de Choque',
        mechanics: {
          whenDying: {
            canAct: true,
            notHelpless: true,
          },
        },
        isActive: true,
        isToggleable: false,
      },
    ];
    
    const context = createTestContext({ nex: 99 });
    const result = consolidateEffects(effects, context);
    
    expect(result.combatAdvanced.conditionalBonuses.whenDying.canAct).toBe(true);
    expect(result.combatAdvanced.conditionalBonuses.whenDying.notHelpless).toBe(true);
    expect(result.combatAdvanced.conditionalBonuses.whenDying.sources).toContain('Tropa de Choque');
  });
});

describe('combatAdvanced - Integração com outras mecânicas', () => {
  it('deve consolidar combatAdvanced junto com combat stats básicos', () => {
    const effects: UnifiedEffect[] = [
      {
        id: 'guerreiro-completo',
        name: 'Guerreiro Completo',
        source: 'track',
        sourceId: 'guerreiro',
        sourceName: 'Guerreiro',
        mechanics: {
          specialAttackMultiplier: { value: 2, weaponRestriction: 'melee' },
          criticalMarginBonus: 2,
          meleeDamageBonus: 3,
        },
        isActive: true,
        isToggleable: false,
      },
    ];
    
    const context = createTestContext({ nex: 99 });
    const result = consolidateEffects(effects, context);
    
    // Combate básico
    expect(result.critical.marginBonus).toBe(2);
    expect(result.damage.melee).toBe(3);
    
    // Combate avançado
    expect(result.combatAdvanced.specialAttackMultiplier.value).toBe(2);
  });

  it('deve consolidar múltiplas mecânicas de combate avançado', () => {
    const effects: UnifiedEffect[] = [
      {
        id: 'tropa-choque-completo',
        name: 'Tropa de Choque Completo',
        source: 'track',
        sourceId: 'tropa-choque',
        sourceName: 'Tropa de Choque',
        mechanics: {
          blockVigorBonus: true,
          hpBonusPerNex: 1, // Casca Grossa
          taunt: {
            range: 'curto',
            resistanceTest: 'vontade',
            dtAttribute: 'vigor',
            peCost: 1,
            actionType: 'reaction',
          },
          whenWounded: {
            hpThreshold: 50,
            defenseBonus: 5,
            damageReduction: 5,
          },
          whenDying: {
            canAct: true,
            notHelpless: true,
          },
        },
        isActive: true,
        isToggleable: false,
      },
    ];
    
    // Machucado (30% HP)
    const context = createTestContext({ nex: 99, hpCurrent: 10, hpMax: 30 });
    const result = consolidateEffects(effects, context);
    
    // HP bonus per NEX (99/5 = 19)
    expect(result.resources.hpBonus).toBe(19);
    
    // Block Vigor
    expect(result.combatAdvanced.blockVigorBonus.enabled).toBe(true);
    
    // Taunt
    expect(result.combatAdvanced.taunt.available).toBe(true);
    
    // When Wounded (ativo pois está machucado)
    expect(result.combatAdvanced.conditionalBonuses.whenWounded.active).toBe(true);
    expect(result.defense.general).toBe(5);
    expect(result.damageReduction.physical).toBe(5);
    
    // When Dying
    expect(result.combatAdvanced.conditionalBonuses.whenDying.canAct).toBe(true);
  });
});

// =====================================================
// TESTES: FASE 3 - SUPORTE (Médico de Campo, Resgate)
// =====================================================

describe('SUE - Fase 3: Suporte', () => {
  it('deve consolidar freeMovementTo corretamente', () => {
    const effects: UnifiedEffect[] = [
      {
        id: 'resgate',
        name: 'Resgate',
        source: 'track',
        sourceId: 'medico-campo',
        sourceName: 'Trilha: Médico de Campo',
        mechanics: {
          freeMovementTo: {
            condition: 'ally-at-0-hp',
            perRound: true,
          },
        },
        isActive: true,
        isToggleable: false,
      },
    ];
    
    const result = consolidateEffects(effects, createTestContext());
    
    expect(result.support.available).toBe(true);
    expect(result.support.freeMovement.available).toBe(true);
    expect(result.support.hasFreeMovementToAlly).toBe(true);
    expect(result.support.freeMovement.abilities).toHaveLength(1);
    expect(result.support.freeMovement.abilities[0].condition).toBe('ally-at-0-hp');
  });
  
  it('deve consolidar onHeal corretamente', () => {
    const effects: UnifiedEffect[] = [
      {
        id: 'resgate-bonus',
        name: 'Resgate',
        source: 'track',
        sourceId: 'medico-campo',
        sourceName: 'Trilha: Médico de Campo',
        mechanics: {
          onHeal: {
            targetDefenseBonus: 5,
            duration: 'next-attack',
          },
        },
        isActive: true,
        isToggleable: false,
      },
    ];
    
    const result = consolidateEffects(effects, createTestContext());
    
    expect(result.support.available).toBe(true);
    expect(result.support.onHealEffects).toHaveLength(1);
    expect(result.support.onHealEffects[0].targetDefenseBonus).toBe(5);
    expect(result.support.maxDefenseBonusOnHeal).toBe(5);
  });
  
  it('deve consolidar removeCondition corretamente', () => {
    const effects: UnifiedEffect[] = [
      {
        id: 'equipe-trauma',
        name: 'Equipe de Trauma',
        source: 'track',
        sourceId: 'medico-campo',
        sourceName: 'Trilha: Médico de Campo',
        mechanics: {
          removeCondition: {
            range: 'touch',
            excludedConditions: ['morto', 'morrendo'],
            peCost: 2,
            actionType: 'standard',
          },
        },
        isActive: true,
        isToggleable: false,
      },
    ];
    
    const result = consolidateEffects(effects, createTestContext());
    
    expect(result.support.available).toBe(true);
    expect(result.support.canRemoveConditions).toBe(true);
    expect(result.support.removeConditionAbilities).toHaveLength(1);
    expect(result.support.removeConditionAbilities[0].excludedConditions).toContain('morto');
  });
  
  it('deve consolidar resurrect corretamente', () => {
    const effects: UnifiedEffect[] = [
      {
        id: 'reanimacao',
        name: 'Reanimação',
        source: 'track',
        sourceId: 'medico-campo',
        sourceName: 'Trilha: Médico de Campo',
        mechanics: {
          resurrect: {
            excludedDeathTypes: ['paranormal'],
            sameSceneOnly: true,
            usesPerScene: 1,
            peCost: 10,
            actionType: 'complete',
            hpRestored: 'roll',
          },
        },
        isActive: true,
        isToggleable: false,
      },
    ];
    
    const result = consolidateEffects(effects, createTestContext());
    
    expect(result.support.available).toBe(true);
    expect(result.support.canResurrect).toBe(true);
    expect(result.support.resurrectAbilities).toHaveLength(1);
    expect(result.support.resurrectAbilities[0].peCost).toBe(10);
  });
});

// =====================================================
// TESTES: FASE 4 - INFILTRADOR AVANÇADO
// =====================================================

describe('SUE - Fase 4: Infiltrador Avançado', () => {
  it('deve consolidar stealthMovementPenalty corretamente', () => {
    const effects: UnifiedEffect[] = [
      {
        id: 'sombra-fugaz',
        name: 'Sombra Fugaz',
        source: 'track',
        sourceId: 'infiltrador',
        sourceName: 'Trilha: Infiltrador',
        mechanics: {
          stealthMovementPenalty: {
            removes: true,
          },
        },
        isActive: true,
        isToggleable: false,
      },
    ];
    
    const result = consolidateEffects(effects, createTestContext());
    
    expect(result.sneakAttack.stealthBonuses.removesMovementPenalty).toBe(true);
    expect(result.sneakAttack.stealthBonuses.sources).toContain('Trilha: Infiltrador');
  });
  
  it('deve consolidar sneakAttackMultiplier corretamente', () => {
    const effects: UnifiedEffect[] = [
      {
        id: 'assassinar',
        name: 'Assassinar',
        source: 'track',
        sourceId: 'infiltrador',
        sourceName: 'Trilha: Infiltrador',
        mechanics: {
          sneakAttack: {
            baseDice: 3,
            dieType: 'd6',
            conditions: ['alvo desprevenido'],
            peCost: 1,
            usesPerRound: 1,
          },
          sneakAttackMultiplier: 2,
        },
        isActive: true,
        isToggleable: false,
      },
    ];
    
    const result = consolidateEffects(effects, createTestContext());
    
    expect(result.sneakAttack.available).toBe(true);
    expect(result.sneakAttack.multiplier).toBe(2);
    expect(result.sneakAttack.totalDice).toBe(6); // 3 dados x2
  });
  
  it('deve consolidar ignoreStealthPenalty corretamente', () => {
    const effects: UnifiedEffect[] = [
      {
        id: 'gatuno',
        name: 'Gatuno',
        source: 'track',
        sourceId: 'infiltrador',
        sourceName: 'Trilha: Infiltrador',
        mechanics: {
          ignoreStealthPenalty: {
            armorPenalty: true,
            movementPenalty: false,
            allPenalties: false,
          },
        },
        isActive: true,
        isToggleable: false,
      },
    ];
    
    const result = consolidateEffects(effects, createTestContext());
    
    expect(result.sneakAttack.stealthBonuses.ignoresArmorPenalty).toBe(true);
    expect(result.sneakAttack.stealthBonuses.ignoresAllPenalties).toBe(false);
  });
  
  it('deve consolidar ignoreStealthPenalty.allPenalties corretamente', () => {
    const effects: UnifiedEffect[] = [
      {
        id: 'mestre-sombras',
        name: 'Mestre das Sombras',
        source: 'track',
        sourceId: 'infiltrador',
        sourceName: 'Trilha: Infiltrador',
        mechanics: {
          ignoreStealthPenalty: {
            allPenalties: true,
            movementPenalty: false,
            armorPenalty: false,
          },
        },
        isActive: true,
        isToggleable: false,
      },
    ];
    
    const result = consolidateEffects(effects, createTestContext());
    
    expect(result.sneakAttack.stealthBonuses.ignoresAllPenalties).toBe(true);
    expect(result.sneakAttack.stealthBonuses.removesMovementPenalty).toBe(true);
    expect(result.sneakAttack.stealthBonuses.ignoresArmorPenalty).toBe(true);
  });
});

// =====================================================
// TESTES: FASE 5 - OCULTISTA AVANÇADO
// =====================================================

describe('SUE - Fase 5: Ocultista Avançado', () => {
  it('deve consolidar bonusRituals corretamente', () => {
    const effects: UnifiedEffect[] = [
      {
        id: 'saber-ampliado',
        name: 'Saber Ampliado',
        source: 'track',
        sourceId: 'graduado',
        sourceName: 'Trilha: Graduado',
        mechanics: {
          bonusRituals: {
            perCircle: 1,
            ignoresLimit: true,
          },
        },
        isActive: true,
        isToggleable: false,
      },
    ];
    
    const result = consolidateEffects(effects, createTestContext());
    
    expect(result.occultist.available).toBe(true);
    expect(result.occultist.bonusRituals.perCircle).toBe(1);
    expect(result.occultist.bonusRituals.ignoresLimit).toBe(true);
  });
  
  it('deve consolidar grimoire corretamente', () => {
    const effects: UnifiedEffect[] = [
      {
        id: 'grimorio',
        name: 'Grimório',
        source: 'track',
        sourceId: 'graduado',
        sourceName: 'Trilha: Graduado',
        mechanics: {
          grimoire: {
            maxRituals: 'intellect',
            allowedCircles: [1, 2],
            bonusPerNewCircle: 1,
            castingAction: 'complete',
            requiresWielding: true,
            inventorySlots: 1,
          },
        },
        isActive: true,
        isToggleable: false,
      },
    ];
    
    const result = consolidateEffects(effects, createTestContext());
    
    expect(result.occultist.available).toBe(true);
    expect(result.occultist.grimoire.available).toBe(true);
    expect(result.occultist.grimoire.maxRituals).toBe('intellect');
    expect(result.occultist.grimoire.allowedCircles).toContain(1);
    expect(result.occultist.grimoire.allowedCircles).toContain(2);
  });
  
  it('deve consolidar ritualPowerBonus corretamente', () => {
    const effects: UnifiedEffect[] = [
      {
        id: 'conduíte-aprimorado',
        name: 'Conduíte Aprimorado',
        source: 'track',
        sourceId: 'conduíte',
        sourceName: 'Trilha: Conduíte',
        mechanics: {
          ritualPowerBonus: {
            addPELimit: true,
            affectsDT: true,
            affectsDamage: true,
          },
        },
        isActive: true,
        isToggleable: false,
      },
    ];
    
    const result = consolidateEffects(effects, createTestContext());
    
    expect(result.occultist.available).toBe(true);
    expect(result.occultist.ritualPowerBonus.addPELimit).toBe(true);
    expect(result.occultist.ritualPowerBonus.affectsDT).toBe(true);
    expect(result.occultist.ritualPowerBonus.affectsDamage).toBe(true);
  });
  
  it('deve consolidar addAttributeToPELimit corretamente', () => {
    const effects: UnifiedEffect[] = [
      {
        id: 'presenca-poderosa',
        name: 'Presença Poderosa',
        source: 'track',
        sourceId: 'intuitivo',
        sourceName: 'Trilha: Intuitivo',
        mechanics: {
          addAttributeToPELimit: 'presence',
        },
        isActive: true,
        isToggleable: false,
      },
    ];
    
    const result = consolidateEffects(effects, createTestContext());
    
    expect(result.occultist.available).toBe(true);
    expect(result.occultist.additionalPELimitAttributes).toContain('presence');
  });
  
  it('deve consolidar hpRecoveryRestriction corretamente', () => {
    const effects: UnifiedEffect[] = [
      {
        id: 'flagelador-restricao',
        name: 'Flagelação',
        source: 'track',
        sourceId: 'flagelador',
        sourceName: 'Trilha: Flagelador',
        mechanics: {
          hpRecoveryRestriction: 'magic-only',
        },
        isActive: true,
        isToggleable: false,
      },
    ];
    
    const result = consolidateEffects(effects, createTestContext());
    
    expect(result.occultist.available).toBe(true);
    expect(result.occultist.hpRecoveryRestriction).toBe('magic-only');
  });
  
  it('deve consolidar paranormalDamageTest corretamente', () => {
    const effects: UnifiedEffect[] = [
      {
        id: 'resistencia-paranormal',
        name: 'Resistência Paranormal',
        source: 'track',
        sourceId: 'intuitivo',
        sourceName: 'Trilha: Intuitivo',
        mechanics: {
          paranormalDamageTest: {
            testSkill: 'vontade',
            onSuccess: 'half',
            onFailure: 'full',
            dtType: 'ritual-dt',
          },
        },
        isActive: true,
        isToggleable: false,
      },
    ];
    
    const result = consolidateEffects(effects, createTestContext());
    
    expect(result.occultist.available).toBe(true);
    expect(result.occultist.paranormalDamageTest.available).toBe(true);
    expect(result.occultist.paranormalDamageTest.abilities).toHaveLength(1);
    expect(result.occultist.paranormalDamageTest.abilities[0].onSuccess).toBe('half');
  });
  
  it('deve manter a restrição mais severa de hpRecoveryRestriction', () => {
    const effects: UnifiedEffect[] = [
      {
        id: 'restricao-1',
        name: 'Restrição 1',
        source: 'track',
        sourceId: 'flagelador',
        sourceName: 'Trilha: Flagelador',
        mechanics: {
          hpRecoveryRestriction: 'rest-only',
        },
        isActive: true,
        isToggleable: false,
      },
      {
        id: 'restricao-2',
        name: 'Restrição 2',
        source: 'track',
        sourceId: 'flagelador-2',
        sourceName: 'Trilha: Flagelador Avançado',
        mechanics: {
          hpRecoveryRestriction: 'magic-only',
        },
        isActive: true,
        isToggleable: false,
      },
    ];
    
    const result = consolidateEffects(effects, createTestContext());
    
    // magic-only é mais severo que rest-only
    expect(result.occultist.hpRecoveryRestriction).toBe('magic-only');
  });
});
