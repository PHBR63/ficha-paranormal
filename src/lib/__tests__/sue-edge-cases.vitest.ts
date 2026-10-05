/**
 * Testes de Integração SUE - Casos de Borda e Regressão
 * Ordem Paranormal RPG v1.3
 * 
 * FASE 7: Testes de casos extremos, valores limites,
 * performance e consistência do sistema.
 * 
 * Este módulo testa:
 * - NEX mínimo (5%) e máximo (99%)
 * - Atributos em extremos (0 e 5)
 * - Arrays vazios e contextos mínimos
 * - Consistência de resultados
 * - Unicidade de IDs
 * - Performance com muitos efeitos
 * - Prioridade e ordem de processamento
 * 
 * @module sue-edge-cases.vitest
 */

import { describe, it, expect } from 'vitest';
import {
  UnifiedEffect,
  EffectMechanics,
  EffectCalculationContext,
  consolidateEffects,
  checkEffectConditions,
  EffectSource,
} from '../unified-effects-engine';

// =====================================================
// Helpers de Teste
// =====================================================

/**
 * Cria um contexto mínimo com apenas campos obrigatórios
 */
function createMinimalContext(overrides: Partial<EffectCalculationContext> = {}): EffectCalculationContext {
  return {
    attributes: { strength: 1, agility: 1, vigor: 1, intellect: 1, presence: 1 },
    nex: 5,
    hpCurrent: 10,
    hpMax: 10,
    peCurrent: 5,
    peMax: 5,
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
 * Cria um efeito simples para testes
 */
function createSimpleEffect(
  id: string,
  mechanics: EffectMechanics,
  overrides: Partial<UnifiedEffect> = {}
): UnifiedEffect {
  return {
    id,
    name: `Efeito ${id}`,
    source: 'origin',
    sourceId: id,
    sourceName: `Fonte ${id}`,
    mechanics,
    isActive: true,
    isToggleable: false,
    ...overrides,
  };
}

/**
 * Gera N efeitos para testes de performance
 */
function generateManyEffects(count: number): UnifiedEffect[] {
  return Array.from({ length: count }, (_, i) => 
    createSimpleEffect(`effect-${i}`, { 
      attackBonus: 1,
      defenseBonus: 1,
      damageBonus: 1,
    })
  );
}

// =====================================================
// GRUPO 1: NEX Mínimo e Máximo
// =====================================================

describe('SUE Edge Cases: NEX Extremos', () => {
  it('deve processar personagem NEX 5% (mínimo) corretamente', () => {
    const effects: UnifiedEffect[] = [
      createSimpleEffect('origem', { attackBonus: 2 }),
      createSimpleEffect('classe', { hpBonusPerNex: 1 }), // +1 HP por 5% NEX
    ];

    // NEX 5% = 1 incremento de 5%
    const result = consolidateEffects(effects, createMinimalContext({ nex: 5 }));

    expect(result.attack.general).toBe(2);
    expect(result.resources.hpBonus).toBe(1); // 1 * 1
  });

  it('deve processar personagem NEX 99% (máximo) corretamente', () => {
    const effects: UnifiedEffect[] = [
      createSimpleEffect('poder', { hpBonusPerNex: 2 }), // +2 HP por 5% NEX
      createSimpleEffect('trilha', { peBonusPerNex: 1 }), // +1 PE por 5% NEX
    ];

    // NEX 99% = 19 incrementos de 5%
    const result = consolidateEffects(effects, createMinimalContext({ nex: 99 }));

    expect(result.resources.hpBonus).toBe(38); // 2 * 19
    expect(result.resources.peBonus).toBe(19); // 1 * 19
  });

  it('deve processar NEX 0% sem erros', () => {
    const effects: UnifiedEffect[] = [
      createSimpleEffect('base', { attackBonus: 1, hpBonusPerNex: 1 }),
    ];

    // NEX 0% - caso teórico/edge case
    const result = consolidateEffects(effects, createMinimalContext({ nex: 0 }));

    expect(result.attack.general).toBe(1);
    expect(result.resources.hpBonus).toBe(0); // 1 * 0
  });

  it('deve processar NEX 100% sem erros', () => {
    const effects: UnifiedEffect[] = [
      createSimpleEffect('lendario', { hpBonusPerNex: 3 }),
    ];

    // NEX 100% = 20 incrementos de 5%
    const result = consolidateEffects(effects, createMinimalContext({ nex: 100 }));

    expect(result.resources.hpBonus).toBe(60); // 3 * 20
  });
});

// =====================================================
// GRUPO 2: Atributos Extremos
// =====================================================

describe('SUE Edge Cases: Atributos Extremos', () => {
  it('deve processar todos os atributos em 0', () => {
    const effects: UnifiedEffect[] = [
      createSimpleEffect('poder', { attackBonus: 2 }, {
        conditions: { minAttribute: { strength: 1 } }
      }),
    ];

    const context = createMinimalContext({
      attributes: { strength: 0, agility: 0, vigor: 0, intellect: 0, presence: 0 }
    });

    // Condição de atributo mínimo não é satisfeita
    const conditionMet = checkEffectConditions(effects[0], context);
    expect(conditionMet).toBe(false);

    const result = consolidateEffects(effects, context);
    expect(result.attack.general).toBe(0);
  });

  it('deve processar todos os atributos em 5 (máximo)', () => {
    const effects: UnifiedEffect[] = [
      createSimpleEffect('poder-forca', { meleeDamageBonus: 3 }, {
        conditions: { minAttribute: { strength: 5 } }
      }),
      createSimpleEffect('poder-agilidade', { rangedAttackBonus: 3 }, {
        conditions: { minAttribute: { agility: 5 } }
      }),
    ];

    const context = createMinimalContext({
      attributes: { strength: 5, agility: 5, vigor: 5, intellect: 5, presence: 5 }
    });

    // Ambas condições satisfeitas
    expect(checkEffectConditions(effects[0], context)).toBe(true);
    expect(checkEffectConditions(effects[1], context)).toBe(true);

    const result = consolidateEffects(effects, context);
    expect(result.damage.melee).toBe(3);
    expect(result.attack.ranged).toBe(3);
  });

  it('deve processar atributos negativos sem erros', () => {
    // Caso teórico - atributos negativos por penalidades extremas
    const context = createMinimalContext({
      attributes: { strength: -1, agility: 2, vigor: 1, intellect: 1, presence: 1 }
    });

    const effects: UnifiedEffect[] = [
      createSimpleEffect('base', { attackBonus: 1 }),
    ];

    const result = consolidateEffects(effects, context);
    expect(result.attack.general).toBe(1);
  });
});

// =====================================================
// GRUPO 3: Arrays Vazios e Contextos Mínimos
// =====================================================

describe('SUE Edge Cases: Arrays Vazios', () => {
  it('deve processar array de efeitos vazio', () => {
    const effects: UnifiedEffect[] = [];
    const result = consolidateEffects(effects, createMinimalContext());

    expect(result.attack.general).toBe(0);
    expect(result.defense.general).toBe(0);
    expect(result.damage.general).toBe(0);
    expect(result.attack.breakdown).toHaveLength(0);
  });

  it('deve processar efeito com mechanics vazio', () => {
    const effects: UnifiedEffect[] = [
      createSimpleEffect('vazio', {}),
    ];

    const result = consolidateEffects(effects, createMinimalContext());

    expect(result.attack.general).toBe(0);
    expect(result.defense.general).toBe(0);
  });

  it('deve processar contexto com arrays vazios', () => {
    const context = createMinimalContext({
      activeConditions: [],
      activatedEffects: [],
    });

    const effects: UnifiedEffect[] = [
      createSimpleEffect('base', { attackBonus: 1 }),
    ];

    const result = consolidateEffects(effects, context);
    expect(result.attack.general).toBe(1);
  });
});

// =====================================================
// GRUPO 4: Consistência de Resultados
// =====================================================

describe('SUE Edge Cases: Consistência', () => {
  it('deve retornar mesma saída para mesma entrada', () => {
    const effects: UnifiedEffect[] = [
      createSimpleEffect('a', { attackBonus: 2 }),
      createSimpleEffect('b', { defenseBonus: 3 }),
      createSimpleEffect('c', { damageBonus: 1 }),
    ];

    const context = createMinimalContext({ nex: 50 });

    // Executar múltiplas vezes
    const result1 = consolidateEffects(effects, context);
    const result2 = consolidateEffects(effects, context);
    const result3 = consolidateEffects(effects, context);

    expect(result1.attack.general).toBe(result2.attack.general);
    expect(result2.attack.general).toBe(result3.attack.general);
    expect(result1.defense.general).toBe(result2.defense.general);
    expect(result1.damage.general).toBe(result2.damage.general);
  });

  it('deve manter consistência com ordem diferente de efeitos', () => {
    const effectA = createSimpleEffect('a', { attackBonus: 2 });
    const effectB = createSimpleEffect('b', { attackBonus: 3 });
    const effectC = createSimpleEffect('c', { attackBonus: 1 });

    const context = createMinimalContext();

    // Ordem 1: A, B, C
    const result1 = consolidateEffects([effectA, effectB, effectC], context);

    // Ordem 2: C, A, B
    const result2 = consolidateEffects([effectC, effectA, effectB], context);

    // Ordem 3: B, C, A
    const result3 = consolidateEffects([effectB, effectC, effectA], context);

    // Resultado deve ser igual independente da ordem
    expect(result1.attack.general).toBe(6);
    expect(result2.attack.general).toBe(6);
    expect(result3.attack.general).toBe(6);
  });
});

// =====================================================
// GRUPO 5: Unicidade e Duplicatas
// =====================================================

describe('SUE Edge Cases: Unicidade', () => {
  it('não deve duplicar proficiências no resultado', () => {
    const effects: UnifiedEffect[] = [
      createSimpleEffect('origem', { grantsProficiency: ['armas_simples', 'armas_taticas'] }),
      createSimpleEffect('classe', { grantsProficiency: ['armas_taticas', 'armas_pesadas'] }),
      createSimpleEffect('poder', { grantsProficiency: ['armas_simples'] }),
    ];

    const result = consolidateEffects(effects, createMinimalContext());

    // Cada proficiência deve aparecer apenas uma vez
    expect(result.proficiencies.filter(p => p === 'armas_simples').length).toBe(1);
    expect(result.proficiencies.filter(p => p === 'armas_taticas').length).toBe(1);
    expect(result.proficiencies.filter(p => p === 'armas_pesadas').length).toBe(1);
    expect(result.proficiencies.length).toBe(3);
  });

  it('deve processar efeitos com IDs duplicados', () => {
    const result = consolidateEffects([
      createSimpleEffect('duplicado', { attackBonus: 2 }),
      createSimpleEffect('duplicado', { attackBonus: 3 }),
    ], createMinimalContext());
    expect(result.attack.general).toBe(3); // A mesma habilidade não duplica seu bônus.
  });
});

// =====================================================
// GRUPO 6: Performance
// =====================================================

describe('SUE Edge Cases: Performance', () => {
  it('deve processar 50 efeitos em tempo aceitável', () => {
    const effects = generateManyEffects(50);
    const context = createMinimalContext({ nex: 50 });

    const startTime = performance.now();
    const result = consolidateEffects(effects, context);
    const endTime = performance.now();

    const elapsedMs = endTime - startTime;

    // Deve completar em menos de 100ms
    expect(elapsedMs).toBeLessThan(100);
    expect(result.attack.general).toBe(50);
    expect(result.defense.general).toBe(50);
  });

  it('deve processar 100 efeitos em tempo aceitável', () => {
    const effects = generateManyEffects(100);
    const context = createMinimalContext({ nex: 50 });

    const startTime = performance.now();
    const result = consolidateEffects(effects, context);
    const endTime = performance.now();

    const elapsedMs = endTime - startTime;

    // Deve completar em menos de 200ms
    expect(elapsedMs).toBeLessThan(200);
    expect(result.attack.general).toBe(100);
  });

  it('deve processar 200 efeitos em tempo aceitável', () => {
    const effects = generateManyEffects(200);
    const context = createMinimalContext({ nex: 50 });

    const startTime = performance.now();
    const result = consolidateEffects(effects, context);
    const endTime = performance.now();

    const elapsedMs = endTime - startTime;

    // Deve completar em menos de 500ms
    expect(elapsedMs).toBeLessThan(500);
    expect(result.attack.general).toBe(200);
  });
});

// =====================================================
// GRUPO 7: Valores Extremos
// =====================================================

describe('SUE Edge Cases: Valores Numéricos Extremos', () => {
  it('deve processar bônus muito altos sem overflow', () => {
    const effects: UnifiedEffect[] = [
      createSimpleEffect('extremo', { 
        attackBonus: 1000,
        defenseBonus: 1000,
        damageBonus: 1000,
      }),
    ];

    const result = consolidateEffects(effects, createMinimalContext());

    expect(result.attack.general).toBe(1000);
    expect(result.defense.general).toBe(1000);
    expect(result.damage.general).toBe(1000);
  });

  it('deve processar penalidades muito altas sem underflow', () => {
    const effects: UnifiedEffect[] = [
      createSimpleEffect('extremo-negativo', { 
        attackBonus: -500,
        defenseBonus: -500,
      }),
    ];

    const result = consolidateEffects(effects, createMinimalContext());

    expect(result.attack.general).toBe(-500);
    expect(result.defense.general).toBe(-500);
  });

  it('deve processar valores decimais corretamente', () => {
    const effects: UnifiedEffect[] = [
      createSimpleEffect('decimal', { 
        movementBonus: 1.5,
      }),
    ];

    const result = consolidateEffects(effects, createMinimalContext());

    expect(result.movement.bonus).toBe(1.5);
  });
});

// =====================================================
// GRUPO 8: Efeitos Inativos
// =====================================================

describe('SUE Edge Cases: Efeitos Inativos', () => {
  it('deve ignorar completamente efeitos com isActive = false', () => {
    const effects: UnifiedEffect[] = [
      createSimpleEffect('ativo', { attackBonus: 5 }, { isActive: true }),
      createSimpleEffect('inativo', { attackBonus: 100 }, { isActive: false }),
    ];

    const result = consolidateEffects(effects, createMinimalContext());

    expect(result.attack.general).toBe(5);
    expect(result.attack.breakdown.length).toBe(1);
  });

  it('deve processar todos efeitos inativos sem erros', () => {
    const effects: UnifiedEffect[] = [
      createSimpleEffect('inativo1', { attackBonus: 10 }, { isActive: false }),
      createSimpleEffect('inativo2', { defenseBonus: 10 }, { isActive: false }),
      createSimpleEffect('inativo3', { damageBonus: 10 }, { isActive: false }),
    ];

    const result = consolidateEffects(effects, createMinimalContext());

    expect(result.attack.general).toBe(0);
    expect(result.defense.general).toBe(0);
    expect(result.damage.general).toBe(0);
  });
});

// =====================================================
// GRUPO 9: HP e PE em Extremos
// =====================================================

describe('SUE Edge Cases: HP e PE Extremos', () => {
  it('deve processar HP atual = 0 (morrendo)', () => {
    const effects: UnifiedEffect[] = [
      createSimpleEffect('desesperado', { damageBonus: 10 }, {
        conditions: { hpPercentBelow: 10 }
      }),
    ];

    const context = createMinimalContext({ hpCurrent: 0, hpMax: 50 });
    const result = consolidateEffects(effects, context);

    // 0% HP é abaixo de 10%
    expect(result.damage.general).toBe(10);
  });

  it('deve processar HP atual > HP máximo (temporário)', () => {
    // Caso de PV temporários que excedem máximo
    const context = createMinimalContext({ hpCurrent: 60, hpMax: 50 });

    const effects: UnifiedEffect[] = [
      createSimpleEffect('base', { attackBonus: 1 }),
    ];

    const result = consolidateEffects(effects, context);
    expect(result.attack.general).toBe(1);
  });

  it('deve processar PE atual = 0', () => {
    const context = createMinimalContext({ peCurrent: 0, peMax: 20 });

    const effects: UnifiedEffect[] = [
      createSimpleEffect('base', { defenseBonus: 2 }),
    ];

    const result = consolidateEffects(effects, context);
    expect(result.defense.general).toBe(2);
  });

  it('deve processar PE atual negativo (dívida de PE)', () => {
    // Caso teórico de PE negativo por uso excessivo
    const context = createMinimalContext({ peCurrent: -5, peMax: 20 });

    const effects: UnifiedEffect[] = [
      createSimpleEffect('base', { attackBonus: 1 }),
    ];

    const result = consolidateEffects(effects, context);
    expect(result.attack.general).toBe(1);
  });
});

// =====================================================
// GRUPO 10: Breakdown Integridade
// =====================================================

describe('SUE Edge Cases: Integridade do Breakdown', () => {
  it('deve ter breakdown consistente com total calculado', () => {
    const effects: UnifiedEffect[] = [
      createSimpleEffect('a', { attackBonus: 2 }),
      createSimpleEffect('b', { attackBonus: 3 }),
      createSimpleEffect('c', { attackBonus: -1 }),
    ];

    const result = consolidateEffects(effects, createMinimalContext());

    // Soma do breakdown deve igualar total
    const breakdownSum = result.attack.breakdown.reduce((sum, item) => sum + item.value, 0);
    expect(breakdownSum).toBe(result.attack.general);
  });

  it('deve registrar fonte correta em cada item do breakdown', () => {
    const effects: UnifiedEffect[] = [
      createSimpleEffect('origem-militar', { defenseBonus: 2 }, { sourceName: 'Militar' }),
      createSimpleEffect('trilha-guardiao', { defenseBonus: 3 }, { sourceName: 'Guardião' }),
    ];

    const result = consolidateEffects(effects, createMinimalContext());

    const sources = result.defense.breakdown.map(b => b.source);
    expect(sources).toContain('Militar');
    expect(sources).toContain('Guardião');
  });

  it('deve manter ordem de breakdown consistente entre execuções', () => {
    const effects: UnifiedEffect[] = [
      createSimpleEffect('a', { damageBonus: 1 }),
      createSimpleEffect('b', { damageBonus: 2 }),
      createSimpleEffect('c', { damageBonus: 3 }),
    ];

    const context = createMinimalContext();

    const result1 = consolidateEffects(effects, context);
    const result2 = consolidateEffects(effects, context);

    // Breakdown deve ter mesma ordem
    for (let i = 0; i < result1.damage.breakdown.length; i++) {
      expect(result1.damage.breakdown[i].source).toBe(result2.damage.breakdown[i].source);
      expect(result1.damage.breakdown[i].value).toBe(result2.damage.breakdown[i].value);
    }
  });
});
