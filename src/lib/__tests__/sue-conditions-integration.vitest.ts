/**
 * Testes de Integração SUE - checkEffectConditions
 * Ordem Paranormal RPG v1.3
 * 
 * FASE 7: Testes avançados cobrindo a função checkEffectConditions
 * e cenários complexos de condições automáticas e manuais.
 * 
 * Este módulo testa:
 * - Condições de ataque (tipo, arma, alvo)
 * - Condições de personagem (HP%, PE%, atributos)
 * - Condições de equipamento (escudo, armadura)
 * - Condições de contexto (combate, rodada)
 * - Ativação manual de efeitos
 * - Condições automáticas do sistema
 * 
 * @module sue-conditions-integration.vitest
 */

import { describe, it, expect } from 'vitest';
import {
  UnifiedEffect,
  EffectMechanics,
  EffectCalculationContext,
  EffectConditions,
  consolidateEffects,
  checkEffectConditions,
  EffectSource,
} from '../unified-effects-engine';

// =====================================================
// Helpers de Teste
// =====================================================

/**
 * Cria um contexto padrão para testes de condições
 */
function createConditionContext(overrides: Partial<EffectCalculationContext> = {}): EffectCalculationContext {
  return {
    attributes: { strength: 2, agility: 3, vigor: 2, intellect: 3, presence: 2 },
    nex: 50,
    hpCurrent: 25,
    hpMax: 50,
    peCurrent: 15,
    peMax: 20,
    inCombat: true,
    isFirstRound: false,
    currentRound: 2,
    hasShield: false,
    activeConditions: [],
    activatedEffects: [],
    ...overrides,
  };
}

/**
 * Cria um efeito com condições específicas para teste
 */
function createConditionalEffect(
  id: string,
  mechanics: EffectMechanics,
  conditions: EffectConditions,
  overrides: Partial<UnifiedEffect> = {}
): UnifiedEffect {
  return {
    id,
    name: `Efeito ${id}`,
    source: 'class_power',
    sourceId: id,
    sourceName: `Fonte ${id}`,
    mechanics,
    conditions,
    isActive: true,
    isToggleable: false,
    ...overrides,
  };
}

// =====================================================
// GRUPO 1: Condições de Ataque
// =====================================================

describe('SUE Conditions: Tipo de Ataque', () => {
  it('deve ativar efeito de corpo a corpo apenas em ataque melee', () => {
    const effect = createConditionalEffect(
      'golpe-preciso',
      { meleeAttackBonus: 3 },
      { attackType: 'melee' }
    );

    // Contexto com ataque melee
    const contextMelee = createConditionContext({
      attackContext: { type: 'melee', targetConditions: [] }
    });
    expect(checkEffectConditions(effect, contextMelee)).toBe(true);

    // Contexto com ataque ranged
    const contextRanged = createConditionContext({
      attackContext: { type: 'ranged', targetConditions: [] }
    });
    expect(checkEffectConditions(effect, contextRanged)).toBe(false);
  });

  it('deve ativar efeito de distância apenas em ataque ranged', () => {
    const effect = createConditionalEffect(
      'mira-mortal',
      { rangedAttackBonus: 4 },
      { attackType: 'ranged' }
    );

    const contextRanged = createConditionContext({
      attackContext: { type: 'ranged', targetConditions: [] }
    });
    expect(checkEffectConditions(effect, contextRanged)).toBe(true);

    const contextMelee = createConditionContext({
      attackContext: { type: 'melee', targetConditions: [] }
    });
    expect(checkEffectConditions(effect, contextMelee)).toBe(false);
  });

  it('deve ativar efeito "any" em qualquer tipo de ataque', () => {
    const effect = createConditionalEffect(
      'ataque-geral',
      { attackBonus: 2 },
      { attackType: 'any' }
    );

    const contextMelee = createConditionContext({
      attackContext: { type: 'melee', targetConditions: [] }
    });
    const contextRanged = createConditionContext({
      attackContext: { type: 'ranged', targetConditions: [] }
    });

    expect(checkEffectConditions(effect, contextMelee)).toBe(true);
    expect(checkEffectConditions(effect, contextRanged)).toBe(true);
  });
});

// =====================================================
// GRUPO 2: Condições de HP
// =====================================================

describe('SUE Conditions: Percentual de HP', () => {
  it('deve ativar efeito quando HP abaixo do limiar', () => {
    const effect = createConditionalEffect(
      'fanatico',
      { damageBonus: 4 },
      { hpPercentBelow: 50 }
    );

    // HP 40% (20/50) - deve ativar
    const contextLowHP = createConditionContext({ hpCurrent: 20, hpMax: 50 });
    expect(checkEffectConditions(effect, contextLowHP)).toBe(true);

    // HP exatamente 50% (25/50) - não deve ativar (precisa ser ABAIXO)
    const contextExact = createConditionContext({ hpCurrent: 25, hpMax: 50 });
    expect(checkEffectConditions(effect, contextExact)).toBe(false);

    // HP 60% (30/50) - não deve ativar
    const contextHighHP = createConditionContext({ hpCurrent: 30, hpMax: 50 });
    expect(checkEffectConditions(effect, contextHighHP)).toBe(false);
  });

  it('deve ativar efeito quando HP acima do limiar', () => {
    const effect = createConditionalEffect(
      'vigor-pleno',
      { defenseBonus: 2 },
      { hpPercentAbove: 75 }
    );

    // HP 80% (40/50) - deve ativar
    const contextHighHP = createConditionContext({ hpCurrent: 40, hpMax: 50 });
    expect(checkEffectConditions(effect, contextHighHP)).toBe(true);

    // HP 60% (30/50) - não deve ativar
    const contextLowHP = createConditionContext({ hpCurrent: 30, hpMax: 50 });
    expect(checkEffectConditions(effect, contextLowHP)).toBe(false);
  });

  it('deve verificar múltiplos limiares de HP em efeitos diferentes', () => {
    const effectLow = createConditionalEffect(
      'desespero',
      { damageBonus: 6 },
      { hpPercentBelow: 25 }
    );

    const effectMid = createConditionalEffect(
      'determinacao',
      { attackBonus: 2 },
      { hpPercentBelow: 50 }
    );

    // HP 20% (10/50)
    const contextCritical = createConditionContext({ hpCurrent: 10, hpMax: 50 });
    expect(checkEffectConditions(effectLow, contextCritical)).toBe(true);
    expect(checkEffectConditions(effectMid, contextCritical)).toBe(true);

    // HP 40% (20/50)
    const contextWounded = createConditionContext({ hpCurrent: 20, hpMax: 50 });
    expect(checkEffectConditions(effectLow, contextWounded)).toBe(false);
    expect(checkEffectConditions(effectMid, contextWounded)).toBe(true);
  });
});

// =====================================================
// GRUPO 3: Condições de Equipamento
// =====================================================

describe('SUE Conditions: Equipamento', () => {
  it('deve ativar efeito que requer escudo', () => {
    const effect = createConditionalEffect(
      'bloqueio-escudo',
      { defenseBonus: 3 },
      { requiresShield: true }
    );

    const contextWithShield = createConditionContext({ hasShield: true });
    expect(checkEffectConditions(effect, contextWithShield)).toBe(true);

    const contextNoShield = createConditionContext({ hasShield: false });
    expect(checkEffectConditions(effect, contextNoShield)).toBe(false);
  });

  it('deve ativar efeito que requer armadura', () => {
    const effect = createConditionalEffect(
      'tanque-blindado',
      { damageReduction: 2 },
      { requiresArmor: true }
    );

    const contextWithArmor = createConditionContext({ equippedArmorType: 'pesada' });
    expect(checkEffectConditions(effect, contextWithArmor)).toBe(true);

    const contextNoArmor = createConditionContext({ equippedArmorType: undefined });
    expect(checkEffectConditions(effect, contextNoArmor)).toBe(false);
  });

  it('deve ativar efeito que requer ausência de armadura', () => {
    const effect = createConditionalEffect(
      'agilidade-natural',
      { defenseBonus: 4 },
      { requiresNoArmor: true }
    );

    const contextNoArmor = createConditionContext({ equippedArmorType: undefined });
    expect(checkEffectConditions(effect, contextNoArmor)).toBe(true);

    const contextWithArmor = createConditionContext({ equippedArmorType: 'leve' });
    expect(checkEffectConditions(effect, contextWithArmor)).toBe(false);
  });
});

// =====================================================
// GRUPO 4: Condições de Contexto de Combate
// =====================================================

describe('SUE Conditions: Contexto de Combate', () => {
  it('deve ativar efeito apenas em combate', () => {
    const effect = createConditionalEffect(
      'instinto-combate',
      { attackBonus: 2, defenseBonus: 1 },
      { inCombat: true }
    );

    const contextInCombat = createConditionContext({ inCombat: true });
    expect(checkEffectConditions(effect, contextInCombat)).toBe(true);

    const contextOutOfCombat = createConditionContext({ inCombat: false });
    expect(checkEffectConditions(effect, contextOutOfCombat)).toBe(false);
  });

  it('deve ativar efeito apenas na primeira rodada', () => {
    const effect = createConditionalEffect(
      'iniciativa-melhorada',
      { initiativeBonus: 5, attackBonus: 2 },
      { firstRoundOnly: true }
    );

    const contextFirstRound = createConditionContext({ isFirstRound: true, currentRound: 1 });
    expect(checkEffectConditions(effect, contextFirstRound)).toBe(true);

    const contextSecondRound = createConditionContext({ isFirstRound: false, currentRound: 2 });
    expect(checkEffectConditions(effect, contextSecondRound)).toBe(false);
  });

  it('deve combinar condição de combate com primeira rodada', () => {
    const effect = createConditionalEffect(
      'assalto-surpresa',
      { attackBonus: 4, damageBonus: 4 },
      { inCombat: true, firstRoundOnly: true }
    );

    // Primeira rodada em combate - ativo
    const contextActive = createConditionContext({ inCombat: true, isFirstRound: true });
    expect(checkEffectConditions(effect, contextActive)).toBe(true);

    // Segunda rodada em combate - inativo
    const contextLater = createConditionContext({ inCombat: true, isFirstRound: false });
    expect(checkEffectConditions(effect, contextLater)).toBe(false);

    // Primeira rodada fora de combate - inativo
    const contextNoFight = createConditionContext({ inCombat: false, isFirstRound: true });
    expect(checkEffectConditions(effect, contextNoFight)).toBe(false);
  });
});

// =====================================================
// GRUPO 5: Ativação Manual
// =====================================================

describe('SUE Conditions: Ativação Manual', () => {
  it('deve ativar efeito que requer ativação quando ativado', () => {
    const effect = createConditionalEffect(
      'combate-defensivo',
      { defenseBonus: 5, attackBonus: -4 },
      { requiresActivation: true }
    );

    const contextActivated = createConditionContext({ 
      activatedEffects: ['combate-defensivo'] 
    });
    expect(checkEffectConditions(effect, contextActivated)).toBe(true);

    const contextNotActivated = createConditionContext({ activatedEffects: [] });
    expect(checkEffectConditions(effect, contextNotActivated)).toBe(false);
  });

  it('deve verificar ativação por ID do efeito', () => {
    const effect = createConditionalEffect(
      'furia-berserker',
      { damageBonus: 6, defenseBonus: -2 },
      { requiresActivation: true }
    );

    // Ativação com ID correto
    const contextCorrect = createConditionContext({ 
      activatedEffects: ['furia-berserker'] 
    });
    expect(checkEffectConditions(effect, contextCorrect)).toBe(true);

    // Ativação com ID diferente
    const contextWrong = createConditionContext({ 
      activatedEffects: ['outro-efeito'] 
    });
    expect(checkEffectConditions(effect, contextWrong)).toBe(false);
  });

  it('deve suportar múltiplos efeitos ativados simultaneamente', () => {
    const effect1 = createConditionalEffect(
      'ataque-poderoso',
      { damageBonus: 4, attackBonus: -2 },
      { requiresActivation: true }
    );

    const effect2 = createConditionalEffect(
      'precisao',
      { attackBonus: 2 },
      { requiresActivation: true }
    );

    const context = createConditionContext({ 
      activatedEffects: ['ataque-poderoso', 'precisao'] 
    });

    expect(checkEffectConditions(effect1, context)).toBe(true);
    expect(checkEffectConditions(effect2, context)).toBe(true);
  });
});

// =====================================================
// GRUPO 6: Condições de Atributo Mínimo
// =====================================================

describe('SUE Conditions: Atributo Mínimo', () => {
  it('deve ativar efeito quando atributo atinge mínimo', () => {
    const effect = createConditionalEffect(
      'golpe-esmagador',
      { meleeDamageBonus: 4 },
      { minAttribute: { strength: 3 } }
    );

    const contextHighStr = createConditionContext({
      attributes: { strength: 4, agility: 2, vigor: 2, intellect: 2, presence: 2 }
    });
    expect(checkEffectConditions(effect, contextHighStr)).toBe(true);

    const contextExact = createConditionContext({
      attributes: { strength: 3, agility: 2, vigor: 2, intellect: 2, presence: 2 }
    });
    expect(checkEffectConditions(effect, contextExact)).toBe(true);

    const contextLowStr = createConditionContext({
      attributes: { strength: 2, agility: 2, vigor: 2, intellect: 2, presence: 2 }
    });
    expect(checkEffectConditions(effect, contextLowStr)).toBe(false);
  });

  it('deve verificar múltiplos atributos mínimos', () => {
    const effect = createConditionalEffect(
      'guerreiro-completo',
      { attackBonus: 2, defenseBonus: 2 },
      { minAttribute: { strength: 2, agility: 2 } }
    );

    // Ambos atingem mínimo
    const contextBoth = createConditionContext({
      attributes: { strength: 3, agility: 3, vigor: 2, intellect: 2, presence: 2 }
    });
    expect(checkEffectConditions(effect, contextBoth)).toBe(true);

    // Apenas força atinge
    const contextOnlyStr = createConditionContext({
      attributes: { strength: 3, agility: 1, vigor: 2, intellect: 2, presence: 2 }
    });
    expect(checkEffectConditions(effect, contextOnlyStr)).toBe(false);
  });
});

// =====================================================
// GRUPO 7: Condições de Alvo
// =====================================================

describe('SUE Conditions: Condições do Alvo', () => {
  it('deve ativar efeito quando alvo tem condição específica', () => {
    const effect = createConditionalEffect(
      'ataque-furtivo',
      { extraDamageDice: '3d6' },
      { targetConditions: ['desprevenido'] }
    );

    const contextTarget = createConditionContext({
      attackContext: { type: 'melee', targetConditions: ['desprevenido'] }
    });
    expect(checkEffectConditions(effect, contextTarget)).toBe(true);

    const contextNoCondition = createConditionContext({
      attackContext: { type: 'melee', targetConditions: [] }
    });
    expect(checkEffectConditions(effect, contextNoCondition)).toBe(false);
  });

  it('deve verificar múltiplas condições do alvo (qualquer uma)', () => {
    const effect = createConditionalEffect(
      'oportunista',
      { attackBonus: 2 },
      { targetConditions: ['desprevenido', 'flanqueado', 'caido'] }
    );

    // Alvo desprevenido - ativa
    const context1 = createConditionContext({
      attackContext: { type: 'melee', targetConditions: ['desprevenido'] }
    });
    expect(checkEffectConditions(effect, context1)).toBe(true);

    // Alvo flanqueado - ativa
    const context2 = createConditionContext({
      attackContext: { type: 'melee', targetConditions: ['flanqueado'] }
    });
    expect(checkEffectConditions(effect, context2)).toBe(true);

    // Alvo sem condições - não ativa
    const context3 = createConditionContext({
      attackContext: { type: 'melee', targetConditions: [] }
    });
    expect(checkEffectConditions(effect, context3)).toBe(false);
  });
});

// =====================================================
// GRUPO 8: Condições Combinadas (Múltiplas)
// =====================================================

describe('SUE Conditions: Condições Combinadas', () => {
  it('deve verificar todas as condições (AND lógico)', () => {
    const effect = createConditionalEffect(
      'golpe-mortal',
      { damageBonus: 10, criticalMarginBonus: 2 },
      { 
        inCombat: true,
        hpPercentBelow: 50,
        minAttribute: { strength: 3 }
      }
    );

    // Todas as condições satisfeitas
    const contextAll = createConditionContext({
      inCombat: true,
      hpCurrent: 20,
      hpMax: 50, // 40%
      attributes: { strength: 4, agility: 2, vigor: 2, intellect: 2, presence: 2 }
    });
    expect(checkEffectConditions(effect, contextAll)).toBe(true);

    // Faltando combate
    const contextNoCombat = createConditionContext({
      inCombat: false,
      hpCurrent: 20,
      hpMax: 50,
      attributes: { strength: 4, agility: 2, vigor: 2, intellect: 2, presence: 2 }
    });
    expect(checkEffectConditions(effect, contextNoCombat)).toBe(false);

    // Faltando HP baixo
    const contextHighHP = createConditionContext({
      inCombat: true,
      hpCurrent: 40,
      hpMax: 50, // 80%
      attributes: { strength: 4, agility: 2, vigor: 2, intellect: 2, presence: 2 }
    });
    expect(checkEffectConditions(effect, contextHighHP)).toBe(false);
  });

  it('deve combinar condição de equipamento com atributo', () => {
    const effect = createConditionalEffect(
      'escudeiro-mestre',
      { defenseBonus: 4, damageReduction: 2 },
      { 
        requiresShield: true,
        minAttribute: { vigor: 3 }
      }
    );

    // Escudo + Vigor alto
    const contextBoth = createConditionContext({
      hasShield: true,
      attributes: { strength: 2, agility: 2, vigor: 4, intellect: 2, presence: 2 }
    });
    expect(checkEffectConditions(effect, contextBoth)).toBe(true);

    // Sem escudo
    const contextNoShield = createConditionContext({
      hasShield: false,
      attributes: { strength: 2, agility: 2, vigor: 4, intellect: 2, presence: 2 }
    });
    expect(checkEffectConditions(effect, contextNoShield)).toBe(false);
  });
});

// =====================================================
// GRUPO 9: Efeitos Sem Condições
// =====================================================

describe('SUE Conditions: Efeitos Incondicionais', () => {
  it('deve sempre ativar efeito sem condições', () => {
    const effect: UnifiedEffect = {
      id: 'bonus-permanente',
      name: 'Bônus Permanente',
      source: 'origin',
      sourceId: 'origem-a',
      sourceName: 'Origem A',
      mechanics: { attackBonus: 2, defenseBonus: 1 },
      isActive: true,
      isToggleable: false,
    };

    // Qualquer contexto deve ativar
    expect(checkEffectConditions(effect, createConditionContext())).toBe(true);
    expect(checkEffectConditions(effect, createConditionContext({ inCombat: false }))).toBe(true);
    expect(checkEffectConditions(effect, createConditionContext({ hpCurrent: 1 }))).toBe(true);
  });

  it('deve ativar efeito com conditions undefined', () => {
    const effect: UnifiedEffect = {
      id: 'teste',
      name: 'Teste',
      source: 'track',
      sourceId: 'trilha-x',
      sourceName: 'Trilha X',
      mechanics: { damageBonus: 3 },
      conditions: undefined,
      isActive: true,
      isToggleable: false,
    };

    expect(checkEffectConditions(effect, createConditionContext())).toBe(true);
  });

  it('deve ativar efeito com conditions vazio', () => {
    const effect: UnifiedEffect = {
      id: 'teste',
      name: 'Teste',
      source: 'general_power',
      sourceId: 'poder-y',
      sourceName: 'Poder Y',
      mechanics: { skillBonus: { atletismo: 2 } },
      conditions: {},
      isActive: true,
      isToggleable: false,
    };

    expect(checkEffectConditions(effect, createConditionContext())).toBe(true);
  });
});

// =====================================================
// GRUPO 10: Integração com consolidateEffects
// =====================================================

describe('SUE Conditions: Integração com consolidateEffects', () => {
  it('deve aplicar apenas efeitos com condições satisfeitas', () => {
    const effects: UnifiedEffect[] = [
      // Sempre ativo
      createConditionalEffect('base', { attackBonus: 2 }, {}),
      // Ativo apenas em combate
      createConditionalEffect('combate', { attackBonus: 3 }, { inCombat: true }),
      // Ativo apenas com HP baixo
      createConditionalEffect('ferido', { damageBonus: 4 }, { hpPercentBelow: 30 }),
    ];

    // Em combate, HP normal
    const contextCombat = createConditionContext({ 
      inCombat: true, 
      hpCurrent: 40, 
      hpMax: 50 // 80%
    });
    const result1 = consolidateEffects(effects, contextCombat);
    expect(result1.attack.general).toBe(5); // 2 + 3
    expect(result1.damage.general).toBe(0); // HP não está baixo

    // Em combate, HP baixo
    const contextWounded = createConditionContext({ 
      inCombat: true, 
      hpCurrent: 10, 
      hpMax: 50 // 20%
    });
    const result2 = consolidateEffects(effects, contextWounded);
    expect(result2.attack.general).toBe(5); // 2 + 3
    expect(result2.damage.general).toBe(4); // HP baixo ativa bônus

    // Fora de combate
    const contextNoCombat = createConditionContext({ 
      inCombat: false, 
      hpCurrent: 40, 
      hpMax: 50 
    });
    const result3 = consolidateEffects(effects, contextNoCombat);
    expect(result3.attack.general).toBe(2); // Apenas base
  });

  it('deve ignorar efeitos inativos independente das condições', () => {
    const effects: UnifiedEffect[] = [
      // Ativo
      createConditionalEffect('ativo', { attackBonus: 5 }, {}, { isActive: true }),
      // Inativo (condições seriam satisfeitas, mas isActive = false)
      createConditionalEffect('inativo', { attackBonus: 10 }, {}, { isActive: false }),
    ];

    const result = consolidateEffects(effects, createConditionContext());
    expect(result.attack.general).toBe(5);
  });
});
