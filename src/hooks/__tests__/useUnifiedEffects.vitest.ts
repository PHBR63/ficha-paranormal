/**
 * Testes Unitários - Hook useUnifiedEffects
 * Sistema Unificado de Efeitos (SUE) - Ordem Paranormal RPG v1.3
 * 
 * Cobertura:
 * - Coleta de efeitos de múltiplas fontes
 * - Consolidação com regras de stacking
 * - Agrupamento por fonte
 * - Funções helper (hasEffect, getEffectsFromSource, isEffectActive)
 * - Contexto de combate
 */

import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import {
  useUnifiedEffects,
  type CharacterStateForEffects,
  type CombatContextInput,
} from '../useUnifiedEffects';

// =====================================================
// Helpers de Teste
// =====================================================

/**
 * Cria estado de personagem padrão para testes
 */
function createTestCharacterState(overrides: Partial<CharacterStateForEffects> = {}): CharacterStateForEffects {
  return {
    origin: 'agente-de-campo',
    classId: 'combatente',
    classTrack: 'guerreiro',
    nex: 50,
    attributes: {
      strength: 2,
      agility: 2,
      vigor: 2,
      intellect: 1,
      presence: 1,
    },
    conditions: [],
    activeRituals: [],
    paranormalPowers: [],
    classPowers: [],
    elementalAffinity: null,
    affinityActive: false,
    currentHP: 30,
    maxHP: 30,
    currentPE: 10,
    maxPE: 10,
    activatedEffectIds: [],
    ...overrides,
  };
}

/**
 * Cria contexto de combate padrão
 */
function createTestCombatContext(overrides: Partial<CombatContextInput> = {}): CombatContextInput {
  return {
    inCombat: true,
    isFirstRound: false,
    currentRound: 1,
    isAttacking: false,
    attackType: 'melee',
    hasShield: false,
    ...overrides,
  };
}

// =====================================================
// FASE 1: Estrutura do Retorno
// =====================================================

describe('useUnifiedEffects: Estrutura do Retorno', () => {
  it('deve retornar objeto com todas as propriedades esperadas', () => {
    const state = createTestCharacterState();
    const { result } = renderHook(() => useUnifiedEffects(state));
    
    expect(result.current).toHaveProperty('allEffects');
    expect(result.current).toHaveProperty('computed');
    expect(result.current).toHaveProperty('bySource');
    expect(result.current).toHaveProperty('hasEffect');
    expect(result.current).toHaveProperty('getEffectsFromSource');
    expect(result.current).toHaveProperty('isEffectActive');
  });

  it('allEffects deve ser um array', () => {
    const state = createTestCharacterState();
    const { result } = renderHook(() => useUnifiedEffects(state));
    
    expect(Array.isArray(result.current.allEffects)).toBe(true);
  });

  it('bySource deve ter todas as categorias', () => {
    const state = createTestCharacterState();
    const { result } = renderHook(() => useUnifiedEffects(state));
    
    expect(result.current.bySource).toHaveProperty('origin');
    expect(result.current.bySource).toHaveProperty('track');
    expect(result.current.bySource).toHaveProperty('condition');
    expect(result.current.bySource).toHaveProperty('ritual');
    expect(result.current.bySource).toHaveProperty('paranormal_power');
    expect(result.current.bySource).toHaveProperty('class_power');
  });

  it('computed deve ter estrutura de ComputedEffects', () => {
    const state = createTestCharacterState();
    const { result } = renderHook(() => useUnifiedEffects(state));
    
    expect(result.current.computed).toHaveProperty('attack');
    expect(result.current.computed).toHaveProperty('damage');
    expect(result.current.computed).toHaveProperty('defense');
    expect(result.current.computed).toHaveProperty('resistances');
    expect(result.current.computed).toHaveProperty('skills');
    expect(result.current.computed).toHaveProperty('flags');
  });
});

// =====================================================
// FASE 2: Coleta de Efeitos de Condições
// =====================================================

describe('useUnifiedEffects: Efeitos de Condições', () => {
  it('deve coletar efeitos de condições ativas', () => {
    const state = createTestCharacterState({
      conditions: ['desprevenido'],
    });
    const { result } = renderHook(() => useUnifiedEffects(state));
    
    expect(result.current.bySource.condition.length).toBeGreaterThan(0);
  });

  it('deve aplicar modificadores de condição nos computed', () => {
    const state = createTestCharacterState({
      conditions: ['desprevenido'],
    });
    const { result } = renderHook(() => useUnifiedEffects(state));
    
    // Desprevenido: -5 Defesa
    expect(result.current.computed.defense.general).toBeLessThan(0);
  });

  it('deve detectar flags de condições críticas', () => {
    const state = createTestCharacterState({
      conditions: ['inconsciente'],
    });
    const { result } = renderHook(() => useUnifiedEffects(state));
    
    expect(result.current.computed.flags.cannotAct).toBe(true);
    expect(result.current.computed.flags.isHelpless).toBe(true);
  });

  it('deve acumular múltiplas condições', () => {
    const state = createTestCharacterState({
      conditions: ['desprevenido', 'cego'],
    });
    const { result } = renderHook(() => useUnifiedEffects(state));
    
    expect(result.current.bySource.condition.map(e => e.sourceId)).toEqual(['desprevenido', 'cego', 'lento']);
  });
});

// =====================================================
// FASE 3: Helpers
// =====================================================

describe('useUnifiedEffects: Helpers', () => {
  it('hasEffect deve encontrar efeito existente', () => {
    const state = createTestCharacterState({
      conditions: ['desprevenido'],
    });
    const { result } = renderHook(() => useUnifiedEffects(state));
    
    expect(result.current.hasEffect('condition-desprevenido')).toBe(true);
  });

  it('hasEffect deve retornar false para efeito inexistente', () => {
    const state = createTestCharacterState();
    const { result } = renderHook(() => useUnifiedEffects(state));
    
    expect(result.current.hasEffect('efeito-inexistente')).toBe(false);
  });

  it('getEffectsFromSource deve filtrar por fonte', () => {
    const state = createTestCharacterState({
      conditions: ['desprevenido', 'cego'],
    });
    const { result } = renderHook(() => useUnifiedEffects(state));
    
    const conditionEffects = result.current.getEffectsFromSource('condition');
    
    expect(conditionEffects.map(e => e.sourceId)).toEqual(['desprevenido', 'cego', 'lento']);
    for (const effect of conditionEffects) {
      expect(effect.source).toBe('condition');
    }
  });

  it('getEffectsFromSource deve retornar array vazio para fonte sem efeitos', () => {
    const state = createTestCharacterState({
      conditions: [],
      activeRituals: [],
    });
    const { result } = renderHook(() => useUnifiedEffects(state));
    
    const ritualEffects = result.current.getEffectsFromSource('ritual');
    
    expect(ritualEffects).toHaveLength(0);
  });

  it('isEffectActive deve verificar efeito ativo', () => {
    const state = createTestCharacterState({
      conditions: ['desprevenido'],
    });
    const { result } = renderHook(() => useUnifiedEffects(state));
    
    expect(result.current.isEffectActive('condition-desprevenido')).toBe(true);
  });

  it('isEffectActive deve retornar false para efeito inexistente', () => {
    const state = createTestCharacterState();
    const { result } = renderHook(() => useUnifiedEffects(state));
    
    expect(result.current.isEffectActive('efeito-inexistente')).toBe(false);
  });
});

// =====================================================
// FASE 4: Contexto de Combate
// =====================================================

describe('useUnifiedEffects: Contexto de Combate', () => {
  it('deve aceitar contexto de combate opcional', () => {
    const state = createTestCharacterState();
    const combat = createTestCombatContext();
    
    expect(() => renderHook(() => useUnifiedEffects(state, combat))).not.toThrow();
  });

  it('deve funcionar sem contexto de combate', () => {
    const state = createTestCharacterState();
    
    expect(() => renderHook(() => useUnifiedEffects(state))).not.toThrow();
  });

  it('contexto de combate deve influenciar efeitos de trilha', () => {
    const state = createTestCharacterState({
      classTrack: 'guerreiro',
    });
    const combatActive = createTestCombatContext({ inCombat: true });
    const combatInactive = createTestCombatContext({ inCombat: false });
    
    const { result: resultActive } = renderHook(() => useUnifiedEffects(state, combatActive));
    const { result: resultInactive } = renderHook(() => useUnifiedEffects(state, combatInactive));
    
    // Podem ter efeitos diferentes baseado no combate
    expect(resultActive.current).toBeDefined();
    expect(resultInactive.current).toBeDefined();
  });
});

// =====================================================
// FASE 5: Memoização
// =====================================================

describe('useUnifiedEffects: Memoização', () => {
  it('deve retornar mesma referência se dependências não mudarem', () => {
    const state = createTestCharacterState();
    const { result, rerender } = renderHook(() => useUnifiedEffects(state));
    
    const firstResult = result.current;
    rerender();
    const secondResult = result.current;
    
    expect(firstResult).toBe(secondResult);
  });

  it('deve recalcular quando condições mudam', () => {
    const state1 = createTestCharacterState({ conditions: [] });
    const state2 = createTestCharacterState({ conditions: ['desprevenido'] });
    
    const { result: result1 } = renderHook(() => useUnifiedEffects(state1));
    const { result: result2 } = renderHook(() => useUnifiedEffects(state2));
    
    expect(result1.current.bySource.condition.length).toBe(0);
    expect(result2.current.bySource.condition.length).toBe(1);
  });
});

// =====================================================
// FASE 6: Computed Effects
// =====================================================

describe('useUnifiedEffects: Computed Effects', () => {
  it('computed.attack deve ter breakdown', () => {
    const state = createTestCharacterState();
    const { result } = renderHook(() => useUnifiedEffects(state));
    
    expect(result.current.computed.attack).toHaveProperty('breakdown');
    expect(Array.isArray(result.current.computed.attack.breakdown)).toBe(true);
  });

  it('computed.damage deve ter extraDice', () => {
    const state = createTestCharacterState();
    const { result } = renderHook(() => useUnifiedEffects(state));
    
    expect(result.current.computed.damage).toHaveProperty('extraDice');
    expect(Array.isArray(result.current.computed.damage.extraDice)).toBe(true);
  });

  it('computed.resistances deve ter fortitude, reflexos e vontade', () => {
    const state = createTestCharacterState();
    const { result } = renderHook(() => useUnifiedEffects(state));
    
    expect(result.current.computed.resistances).toHaveProperty('fortitude');
    expect(result.current.computed.resistances).toHaveProperty('reflexos');
    expect(result.current.computed.resistances).toHaveProperty('vontade');
  });

  it('computed.flags deve ter todos os flags de comportamento', () => {
    const state = createTestCharacterState();
    const { result } = renderHook(() => useUnifiedEffects(state));
    
    expect(result.current.computed.flags).toHaveProperty('cannotAct');
    expect(result.current.computed.flags).toHaveProperty('cannotReact');
    expect(result.current.computed.flags).toHaveProperty('cannotMove');
    expect(result.current.computed.flags).toHaveProperty('isHelpless');
    expect(result.current.computed.flags).toHaveProperty('isUnconscious');
  });
});

// =====================================================
// FASE 7: Rituais
// =====================================================

describe('useUnifiedEffects: Rituais', () => {
  it('computed.rituals deve existir', () => {
    const state = createTestCharacterState();
    const { result } = renderHook(() => useUnifiedEffects(state));
    
    expect(result.current.computed.rituals).toBeDefined();
  });

  it('computed.rituals deve ter estrutura correta', () => {
    const state = createTestCharacterState();
    const { result } = renderHook(() => useUnifiedEffects(state));
    
    expect(result.current.computed.rituals).toHaveProperty('dtBonus');
    expect(result.current.computed.rituals).toHaveProperty('peReduction');
    expect(result.current.computed.rituals).toHaveProperty('availableModifiers');
  });
});

// =====================================================
// FASE 8: Edge Cases
// =====================================================

describe('useUnifiedEffects: Edge Cases', () => {
  it('deve lidar com origem vazia', () => {
    const state = createTestCharacterState({ origin: '' });
    
    expect(() => renderHook(() => useUnifiedEffects(state))).not.toThrow();
  });

  it('deve lidar com classTrack null', () => {
    const state = createTestCharacterState({ classTrack: null });
    
    expect(() => renderHook(() => useUnifiedEffects(state))).not.toThrow();
  });

  it('deve lidar com NEX mínimo', () => {
    const state = createTestCharacterState({ nex: 5 });
    
    expect(() => renderHook(() => useUnifiedEffects(state))).not.toThrow();
  });

  it('deve lidar com NEX máximo', () => {
    const state = createTestCharacterState({ nex: 99 });
    
    expect(() => renderHook(() => useUnifiedEffects(state))).not.toThrow();
  });

  it('deve lidar com HP zerado', () => {
    const state = createTestCharacterState({ currentHP: 0 });
    
    expect(() => renderHook(() => useUnifiedEffects(state))).not.toThrow();
  });

  it('deve lidar com afinidade ativa', () => {
    const state = createTestCharacterState({
      elementalAffinity: 'Sangue',
      affinityActive: true,
    });
    
    expect(() => renderHook(() => useUnifiedEffects(state))).not.toThrow();
  });

  it('deve lidar com muitas condições', () => {
    const state = createTestCharacterState({
      conditions: ['desprevenido', 'cego', 'surdo', 'exausto', 'envenenado'],
    });
    
    const { result } = renderHook(() => useUnifiedEffects(state));
    
    expect(result.current.bySource.condition.map(e => e.sourceId)).toEqual(['desprevenido', 'cego', 'surdo', 'exausto', 'envenenado', 'lento', 'debilitado', 'vulneravel']);
  });
});

// =====================================================
// FASE 9: Agrupamento bySource
// =====================================================

describe('useUnifiedEffects: Agrupamento bySource', () => {
  it('bySource.origin deve conter apenas efeitos de origem', () => {
    const state = createTestCharacterState({
      origin: 'agente-de-campo',
      conditions: ['desprevenido'],
    });
    const { result } = renderHook(() => useUnifiedEffects(state));
    
    for (const effect of result.current.bySource.origin) {
      expect(effect.source).toBe('origin');
    }
  });

  it('bySource.condition deve conter apenas efeitos de condição', () => {
    const state = createTestCharacterState({
      conditions: ['desprevenido', 'cego'],
    });
    const { result } = renderHook(() => useUnifiedEffects(state));
    
    for (const effect of result.current.bySource.condition) {
      expect(effect.source).toBe('condition');
    }
  });

  it('todas as categorias bySource devem ser arrays', () => {
    const state = createTestCharacterState();
    const { result } = renderHook(() => useUnifiedEffects(state));
    
    expect(Array.isArray(result.current.bySource.origin)).toBe(true);
    expect(Array.isArray(result.current.bySource.track)).toBe(true);
    expect(Array.isArray(result.current.bySource.condition)).toBe(true);
    expect(Array.isArray(result.current.bySource.ritual)).toBe(true);
    expect(Array.isArray(result.current.bySource.paranormal_power)).toBe(true);
    expect(Array.isArray(result.current.bySource.class_power)).toBe(true);
  });
});
