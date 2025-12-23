/**
 * Testes Vitest do Sistema Unificado de Efeitos (SUE)
 * Ordem Paranormal RPG v1.3
 * 
 * Adapta os testes do SUE para o formato Vitest.
 * 
 * @module unified-effects-engine.vitest
 */

import { describe, it, expect } from 'vitest';
import {
  UnifiedEffect,
  EffectMechanics,
  EffectCalculationContext,
  consolidateEffects,
  checkEffectConditions,
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
    nex: 25,
    hpCurrent: 20,
    hpMax: 30,
    peCurrent: 10,
    peMax: 15,
    inCombat: false,
    isFirstRound: false,
    currentRound: 1,
    hasShield: false,
    activeConditions: [],
    activatedEffects: [],
    ...overrides,
  };
}

/**
 * Cria um efeito unificado para testes
 */
function createTestEffect(
  id: string,
  mechanics: EffectMechanics,
  overrides: Partial<UnifiedEffect> = {}
): UnifiedEffect {
  return {
    id,
    name: `Teste ${id}`,
    source: 'origin',
    sourceId: id,
    sourceName: `Fonte ${id}`,
    mechanics,
    isActive: true,
    isToggleable: false,
    ...overrides,
  };
}

// =====================================================
// Testes de Consolidação de Efeitos
// =====================================================

describe('consolidateEffects - Consolidação de Efeitos do SUE', () => {
  it('deve somar bônus de ataque de múltiplas fontes', () => {
    const effects: UnifiedEffect[] = [
      createTestEffect('origin-1', { attackBonus: 2 }, { source: 'origin', sourceName: 'Origem A' }),
      createTestEffect('track-1', { attackBonus: 3 }, { source: 'track', sourceName: 'Trilha B' }),
      createTestEffect('power-1', { attackBonus: 1 }, { source: 'general_power', sourceName: 'Poder C' }),
    ];
    
    const context = createTestContext();
    const result = consolidateEffects(effects, context);
    
    expect(result.attack.general).toBe(6); // 2 + 3 + 1
    expect(result.attack.breakdown.length).toBe(3);
  });

  it('deve separar bônus corpo a corpo e distância', () => {
    const effects: UnifiedEffect[] = [
      createTestEffect('e1', { meleeAttackBonus: 4 }),
      createTestEffect('e2', { rangedAttackBonus: 2 }),
      createTestEffect('e3', { attackBonus: 1 }),
    ];
    
    const result = consolidateEffects(effects, createTestContext());
    
    expect(result.attack.general).toBe(1);
    expect(result.attack.melee).toBe(4);
    expect(result.attack.ranged).toBe(2);
  });

  it('deve calcular bônus de dano de origem e trilha', () => {
    const effects: UnifiedEffect[] = [
      createTestEffect('militar', { damageBonus: 2 }, { source: 'origin', sourceName: 'Militar' }),
      createTestEffect('trilha-op', { meleeDamageBonus: 3 }, { source: 'track', sourceName: 'Trilha Op' }),
    ];
    
    const result = consolidateEffects(effects, createTestContext());
    
    expect(result.damage.general).toBe(2);
    expect(result.damage.melee).toBe(3);
  });

  it('deve acumular dados extras de dano de múltiplas fontes', () => {
    const effects: UnifiedEffect[] = [
      createTestEffect('e1', { extraDamageDice: '1d6' }),
      createTestEffect('e2', { extraDamageDice: '2d4' }),
    ];
    
    const result = consolidateEffects(effects, createTestContext());
    
    expect(result.damage.extraDice).toContain('1d6');
    expect(result.damage.extraDice).toContain('2d4');
    expect(result.damage.extraDice.length).toBe(2);
  });

  it('deve calcular bônus de margem de crítico', () => {
    const effects: UnifiedEffect[] = [
      createTestEffect('e1', { criticalMarginBonus: 2 }),
      createTestEffect('e2', { criticalMarginBonus: 1 }),
    ];
    
    const result = consolidateEffects(effects, createTestContext());
    
    expect(result.critical.marginBonus).toBe(3);
  });

  it('deve consolidar bônus de defesa de origens e trilhas', () => {
    const effects: UnifiedEffect[] = [
      createTestEffect('academico', { defenseBonus: 2 }, { source: 'origin' }),
      createTestEffect('guardiao', { defenseBonus: 3 }, { source: 'track' }),
    ];
    
    const result = consolidateEffects(effects, createTestContext());
    
    expect(result.defense.general).toBe(5);
  });

  it('deve calcular resistências de múltiplas fontes', () => {
    const effects: UnifiedEffect[] = [
      createTestEffect('e1', { fortitudeBonus: 2 }),
      createTestEffect('e2', { reflexosBonus: 3 }),
      createTestEffect('e3', { vontadeBonus: 4 }),
      createTestEffect('e4', { allResistancesBonus: 1 }),
    ];
    
    const result = consolidateEffects(effects, createTestContext());
    
    // allResistancesBonus adiciona a todas
    expect(result.resistances.fortitude).toBe(3); // 2 + 1
    expect(result.resistances.reflexos).toBe(4); // 3 + 1
    expect(result.resistances.vontade).toBe(5); // 4 + 1
  });

  it('deve calcular redução de dano física e paranormal', () => {
    const effects: UnifiedEffect[] = [
      createTestEffect('e1', { damageReduction: 5 }),
      createTestEffect('e2', { paranormalDamageReduction: 3 }),
    ];
    
    const result = consolidateEffects(effects, createTestContext());
    
    expect(result.damageReduction.physical).toBe(5);
    expect(result.damageReduction.paranormal).toBe(3);
  });

  it('deve acumular bônus de perícias corretamente', () => {
    const effects: UnifiedEffect[] = [
      createTestEffect('e1', { skillBonus: { investigacao: 2, ocultismo: 3 } }),
      createTestEffect('e2', { skillBonus: { investigacao: 1 } }),
    ];
    
    const result = consolidateEffects(effects, createTestContext());
    
    expect(result.skills['investigacao']?.bonus).toBe(3); // 2 + 1
    expect(result.skills['ocultismo']?.bonus).toBe(3);
  });

  it('deve calcular bônus de HP e PE', () => {
    const effects: UnifiedEffect[] = [
      createTestEffect('e1', { hpBonus: 10 }),
      createTestEffect('e2', { peBonus: 5 }),
      createTestEffect('e3', { hpBonus: 5, peBonus: 3 }),
    ];
    
    const result = consolidateEffects(effects, createTestContext());
    
    expect(result.resources.hpBonus).toBe(15); // 10 + 5
    expect(result.resources.peBonus).toBe(8); // 5 + 3
  });

  it('deve aplicar flags de comportamento de condições', () => {
    const effects: UnifiedEffect[] = [
      createTestEffect('inconsciente', { cannotAct: true, cannotReact: true }),
    ];
    
    const result = consolidateEffects(effects, createTestContext());
    
    expect(result.flags.cannotAct).toBe(true);
    expect(result.flags.cannotReact).toBe(true);
    expect(result.flags.cannotMove).toBe(false);
  });
});

// =====================================================
// Testes de Verificação de Condições
// =====================================================

describe('checkEffectConditions - Verificação de Condições do SUE', () => {
  it('deve retornar true para efeitos sem condições', () => {
    const effect = createTestEffect('e1', { attackBonus: 2 });
    const context = createTestContext();
    
    expect(checkEffectConditions(effect, context)).toBe(true);
  });

  it('deve verificar condição de HP abaixo de 50%', () => {
    const effect = createTestEffect('fanatico', { damageBonus: 2 }, {
      conditions: { hpPercentBelow: 50 }
    });
    
    // HP 40% - deve ativar
    const contextLowHP = createTestContext({ hpCurrent: 12, hpMax: 30 });
    expect(checkEffectConditions(effect, contextLowHP)).toBe(true);
    
    // HP 60% - não deve ativar
    const contextHighHP = createTestContext({ hpCurrent: 18, hpMax: 30 });
    expect(checkEffectConditions(effect, contextHighHP)).toBe(false);
  });

  it('deve verificar condição de primeira rodada de combate', () => {
    const effect = createTestEffect('iniciativa-melhorada', { initiativeBonus: 5 }, {
      conditions: { firstRoundOnly: true }
    });
    
    const contextFirstRound = createTestContext({ isFirstRound: true });
    expect(checkEffectConditions(effect, contextFirstRound)).toBe(true);
    
    const contextLaterRound = createTestContext({ isFirstRound: false });
    expect(checkEffectConditions(effect, contextLaterRound)).toBe(false);
  });

  it('deve verificar condição de estar em combate', () => {
    const effect = createTestEffect('furia', { damageBonus: 4 }, {
      conditions: { inCombat: true }
    });
    
    const contextInCombat = createTestContext({ inCombat: true });
    expect(checkEffectConditions(effect, contextInCombat)).toBe(true);
    
    const contextOutOfCombat = createTestContext({ inCombat: false });
    expect(checkEffectConditions(effect, contextOutOfCombat)).toBe(false);
  });

  it('deve verificar condição de escudo equipado', () => {
    const effect = createTestEffect('bloqueio', { defenseBonus: 3 }, {
      conditions: { requiresShield: true }
    });
    
    const contextWithShield = createTestContext({ hasShield: true });
    expect(checkEffectConditions(effect, contextWithShield)).toBe(true);
    
    const contextNoShield = createTestContext({ hasShield: false });
    expect(checkEffectConditions(effect, contextNoShield)).toBe(false);
  });

  it('deve verificar condição de ativação manual', () => {
    const effect = createTestEffect('combate-defensivo', { defenseBonus: 5 }, {
      conditions: { requiresActivation: true }
    });
    
    const contextActivated = createTestContext({ activatedEffects: ['combate-defensivo'] });
    expect(checkEffectConditions(effect, contextActivated)).toBe(true);
    
    const contextNotActivated = createTestContext({ activatedEffects: [] });
    expect(checkEffectConditions(effect, contextNotActivated)).toBe(false);
  });

  it('deve verificar condição de atributo mínimo', () => {
    const effect = createTestEffect('punho-de-ferro', { meleeDamageBonus: 3 }, {
      conditions: { minAttribute: { strength: 3 } }
    });
    
    const contextHighStr = createTestContext({
      attributes: { strength: 4, agility: 2, vigor: 2, intellect: 2, presence: 2 }
    });
    expect(checkEffectConditions(effect, contextHighStr)).toBe(true);
    
    const contextLowStr = createTestContext({
      attributes: { strength: 2, agility: 2, vigor: 2, intellect: 2, presence: 2 }
    });
    expect(checkEffectConditions(effect, contextLowStr)).toBe(false);
  });
});

// =====================================================
// Testes de Efeitos Inativos
// =====================================================

describe('Efeitos Inativos - SUE', () => {
  it('não deve aplicar bônus de efeitos inativos', () => {
    const effects: UnifiedEffect[] = [
      createTestEffect('ativo', { attackBonus: 5 }, { isActive: true }),
      createTestEffect('inativo', { attackBonus: 10 }, { isActive: false }),
    ];
    
    const result = consolidateEffects(effects, createTestContext());
    
    expect(result.attack.general).toBe(5); // Apenas o efeito ativo
  });

  it('deve aplicar bônus apenas quando condição é satisfeita', () => {
    const effects: UnifiedEffect[] = [
      createTestEffect('combate-only', { damageBonus: 5 }, {
        conditions: { inCombat: true }
      }),
    ];
    
    // Fora de combate
    const outOfCombat = consolidateEffects(effects, createTestContext({ inCombat: false }));
    expect(outOfCombat.damage.general).toBe(0);
    
    // Em combate
    const inCombat = consolidateEffects(effects, createTestContext({ inCombat: true }));
    expect(inCombat.damage.general).toBe(5);
  });
});
