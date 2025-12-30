/**
 * Testes de Integração End-to-End - Sistema Unificado de Efeitos (SUE)
 * Ordem Paranormal RPG v1.3
 * 
 * Cobertura:
 * - Fluxo completo Combatente + Trilha Guerreiro
 * - Fluxo completo Ocultista + Trilha Conduíte
 * - Fluxo completo Especialista + Trilha Atirador de Elite
 * - Condições em combate
 * - Poderes Paranormais com afinidade
 * - Integração de múltiplas fontes de efeitos
 */

import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import {
  useUnifiedEffects,
  type CharacterStateForEffects,
  type CombatContextInput,
} from '@/hooks/useUnifiedEffects';
import { getConditionEffects, getConditionModifiersSummary } from '@/lib/effects/condition-effects-adapter';
import { getClassPowerEffects, type ActiveClassPower } from '@/lib/effects/class-power-effects-adapter';
import { getRitualEffects, calculateRitualBonusTotals } from '@/lib/effects/ritual-effects-adapter';
import { consolidateEffects, checkEffectConditions } from '@/lib/unified-effects-engine';
import type { AttributeType } from '@/lib/unified-effects-engine';

// =====================================================
// Helpers de Teste
// =====================================================

/**
 * Cria personagem Combatente NEX 50% para testes
 */
function createCombatenteNex50(): CharacterStateForEffects {
  return {
    origin: 'militar',
    classId: 'combatente',
    classTrack: 'guerreiro',
    nex: 50,
    attributes: {
      strength: 3,
      agility: 2,
      vigor: 3,
      intellect: 1,
      presence: 1,
    },
    conditions: [],
    activeRituals: [],
    paranormalPowers: [],
    classPowers: [
      { id: 'golpe-pesado', name: 'Golpe Pesado', classId: 'combatente', nex: 25 },
      { id: 'golpe-brutal', name: 'Golpe Brutal', classId: 'combatente', nex: 50 },
    ],
    elementalAffinity: null,
    affinityActive: false,
    currentHP: 45,
    maxHP: 45,
    currentPE: 15,
    maxPE: 15,
    activatedEffectIds: [],
  };
}

/**
 * Cria personagem Ocultista NEX 50% para testes
 */
function createOcultistaNex50(): CharacterStateForEffects {
  return {
    origin: 'academico',
    classId: 'ocultista',
    classTrack: 'conduíte',
    nex: 50,
    attributes: {
      strength: 1,
      agility: 2,
      vigor: 1,
      intellect: 4,
      presence: 2,
    },
    conditions: [],
    activeRituals: [],
    paranormalPowers: [],
    classPowers: [
      { id: 'ritual-potente', name: 'Ritual Potente', classId: 'ocultista', nex: 25 },
      {
        id: 'especialista-em-elemento',
        name: 'Especialista em Elemento',
        classId: 'ocultista',
        nex: 50,
        choices: { element: 'Sangue' },
      },
    ],
    elementalAffinity: 'Sangue',
    affinityActive: false,
    currentHP: 25,
    maxHP: 25,
    currentPE: 25,
    maxPE: 25,
    activatedEffectIds: [],
  };
}

/**
 * Cria personagem Especialista NEX 50% para testes
 */
function createEspecialistaNex50(): CharacterStateForEffects {
  return {
    origin: 'agente-de-campo',
    classId: 'especialista',
    classTrack: 'atirador-de-elite',
    nex: 50,
    attributes: {
      strength: 1,
      agility: 4,
      vigor: 2,
      intellect: 2,
      presence: 1,
    },
    conditions: [],
    activeRituals: [],
    paranormalPowers: [],
    classPowers: [
      { id: 'mira-firme', name: 'Mira Firme', classId: 'especialista', nex: 25 },
      { id: 'balistica-avancada', name: 'Balística Avançada', classId: 'especialista', nex: 50 },
    ],
    elementalAffinity: null,
    affinityActive: false,
    currentHP: 30,
    maxHP: 30,
    currentPE: 15,
    maxPE: 15,
    activatedEffectIds: [],
  };
}

/**
 * Cria contexto de combate corpo a corpo
 */
function createMeleeCombatContext(): CombatContextInput {
  return {
    inCombat: true,
    isFirstRound: false,
    currentRound: 2,
    isAttacking: true,
    attackType: 'melee',
    hasShield: false,
  };
}

/**
 * Cria contexto de combate à distância
 */
function createRangedCombatContext(): CombatContextInput {
  return {
    inCombat: true,
    isFirstRound: false,
    currentRound: 2,
    isAttacking: true,
    attackType: 'ranged',
    hasShield: false,
  };
}

// =====================================================
// FASE 1: Fluxo Combatente + Trilha Guerreiro
// =====================================================

describe('SUE Integration: Combatente + Guerreiro', () => {
  it('deve calcular bônus de poderes de combate corpo a corpo', () => {
    const character = createCombatenteNex50();
    const combat = createMeleeCombatContext();
    
    const { result } = renderHook(() => useUnifiedEffects(character, combat));
    
    // Golpe Pesado: +2 dano melee, Golpe Brutal: +2 margem crítico
    const classPowerEffects = result.current.bySource.class_power;
    expect(classPowerEffects.length).toBeGreaterThan(0);
  });

  it('poderes de classe devem estar em computed', () => {
    const character = createCombatenteNex50();
    const combat = createMeleeCombatContext();
    
    const { result } = renderHook(() => useUnifiedEffects(character, combat));
    
    // Verifica que computed foi preenchido
    expect(result.current.computed).toBeDefined();
    expect(result.current.computed.damage).toBeDefined();
  });

  it('deve consolidar efeitos de múltiplas fontes', () => {
    const character: CharacterStateForEffects = {
      ...createCombatenteNex50(),
      conditions: ['desprevenido'], // Adiciona condição
    };
    const combat = createMeleeCombatContext();
    
    const { result } = renderHook(() => useUnifiedEffects(character, combat));
    
    // Deve ter efeitos de condição e de poderes
    expect(result.current.bySource.condition.length).toBeGreaterThan(0);
    expect(result.current.bySource.class_power.length).toBeGreaterThan(0);
  });
});

// =====================================================
// FASE 2: Fluxo Ocultista + Conduíte
// =====================================================

describe('SUE Integration: Ocultista + Conduíte', () => {
  it('deve aplicar bônus de DT para elemento especializado', () => {
    const character = createOcultistaNex50();
    const attrs: Record<AttributeType, number> = character.attributes;
    
    const classPowerEffects = getClassPowerEffects(
      character.classPowers as ActiveClassPower[],
      character.nex,
      attrs
    );
    
    // Especialista em Elemento (Sangue): +2 DT
    const especialista = classPowerEffects.find(e => e.sourceId === 'especialista-em-elemento');
    expect(especialista).toBeDefined();
    expect(especialista?.mechanics.ritualDTBonusByElement?.['Sangue']).toBe(2);
  });

  it('ritual-potente deve adicionar INT em dano/cura de rituais', () => {
    const character = createOcultistaNex50();
    const attrs: Record<AttributeType, number> = character.attributes;
    
    const classPowerEffects = getClassPowerEffects(
      character.classPowers as ActiveClassPower[],
      character.nex,
      attrs
    );
    
    const ritualPotente = classPowerEffects.find(e => e.sourceId === 'ritual-potente');
    expect(ritualPotente).toBeDefined();
    expect(ritualPotente?.mechanics.ritualDamageAttributeBonus).toBe('intellect');
  });
});

// =====================================================
// FASE 3: Fluxo Especialista + Atirador de Elite
// =====================================================

describe('SUE Integration: Especialista + Atirador de Elite', () => {
  it('deve calcular bônus de dano à distância', () => {
    const character = createEspecialistaNex50();
    const combat = createRangedCombatContext();
    
    const { result } = renderHook(() => useUnifiedEffects(character, combat));
    
    const classPowerEffects = result.current.bySource.class_power;
    
    // Mira Firme: +2 dano ranged
    const miraFirme = classPowerEffects.find(e => e.sourceId === 'mira-firme');
    expect(miraFirme).toBeDefined();
    expect(miraFirme?.mechanics.rangedDamageBonus).toBe(2);
  });

  it('balistica-avancada deve ter nota sobre armas de fogo', () => {
    const character = createEspecialistaNex50();
    const attrs: Record<AttributeType, number> = character.attributes;
    
    const classPowerEffects = getClassPowerEffects(
      character.classPowers as ActiveClassPower[],
      character.nex,
      attrs
    );
    
    const balistica = classPowerEffects.find(e => e.sourceId === 'balistica-avancada');
    expect(balistica).toBeDefined();
    expect(balistica?.mechanics.conditionalNote).toContain('armas de fogo');
  });
});

// =====================================================
// FASE 4: Condições em Combate
// =====================================================

describe('SUE Integration: Condições em Combate', () => {
  it('desprevenido deve aplicar -5 Defesa no SUE', () => {
    const effects = getConditionEffects(['desprevenido']);
    
    expect(effects).toHaveLength(1);
    expect(effects[0].mechanics.defenseBonus).toBe(-5);
  });

  it('desprevenido deve definir cannotReact', () => {
    const effects = getConditionEffects(['desprevenido']);
    
    expect(effects[0].mechanics.cannotReact).toBe(true);
  });

  it('múltiplas condições devem ser consolidadas', () => {
    const summary = getConditionModifiersSummary(['desprevenido', 'cego', 'atordoado']);
    
    // desprevenido: -5 defesa, cego: -5 ataque, atordoado: -2 defesa + cannotAct
    expect(summary.defenseMod).toBe(-7); // -5 + -2
    expect(summary.attackMod).toBe(-5);
    expect(summary.canAct).toBe(false);
    expect(summary.canReact).toBe(false);
  });

  it('caido deve ter bônus contextuais diferentes', () => {
    const effectsMelee = getConditionEffects(['caido'], { type: 'melee' });
    const effectsRanged = getConditionEffects(['caido'], { type: 'ranged' });
    
    expect(effectsMelee[0].mechanics.defenseBonusMelee).toBe(-5);
    expect(effectsRanged[0].mechanics.defenseBonusRanged).toBe(5);
  });

  it('paralisado deve tornar personagem indefeso', () => {
    const character: CharacterStateForEffects = {
      ...createCombatenteNex50(),
      conditions: ['paralisado'],
    };
    
    const { result } = renderHook(() => useUnifiedEffects(character));
    
    expect(result.current.computed.flags.isHelpless).toBe(true);
    expect(result.current.computed.flags.cannotAct).toBe(true);
  });
});

// =====================================================
// FASE 5: Integração Completa com useUnifiedEffects
// =====================================================

describe('SUE Integration: useUnifiedEffects Completo', () => {
  it('deve combinar poderes de classe e condições', () => {
    const character: CharacterStateForEffects = {
      ...createCombatenteNex50(),
      conditions: ['vulneravel'], // -2 Defesa
    };
    const combat = createMeleeCombatContext();
    
    const { result } = renderHook(() => useUnifiedEffects(character, combat));
    
    // Deve ter efeitos de ambas as fontes
    expect(result.current.bySource.condition.length).toBeGreaterThan(0);
    expect(result.current.bySource.class_power.length).toBeGreaterThan(0);
    
    // Defesa deve ter o modificador de vulnerável
    expect(result.current.computed.defense.general).toBeLessThan(0);
  });

  it('hasEffect deve encontrar efeitos de qualquer fonte', () => {
    const character: CharacterStateForEffects = {
      ...createCombatenteNex50(),
      conditions: ['desprevenido'],
    };
    
    const { result } = renderHook(() => useUnifiedEffects(character));
    
    expect(result.current.hasEffect('condition-desprevenido')).toBe(true);
    expect(result.current.hasEffect('class-power-golpe-pesado')).toBe(true);
  });

  it('getEffectsFromSource deve retornar efeitos corretos', () => {
    const character: CharacterStateForEffects = {
      ...createCombatenteNex50(),
      conditions: ['cego', 'surdo'],
    };
    
    const { result } = renderHook(() => useUnifiedEffects(character));
    
    const conditionEffects = result.current.getEffectsFromSource('condition');
    expect(conditionEffects.length).toBe(2);
    
    for (const effect of conditionEffects) {
      expect(effect.source).toBe('condition');
    }
  });
});

// =====================================================
// FASE 6: Rituais Sustentados
// =====================================================

describe('SUE Integration: Rituais Sustentados', () => {
  it('calculateRitualBonusTotals deve calcular corretamente', () => {
    const rituals = [
      {
        ritualId: 'ritual-teste-1',
        ritualName: 'Ritual Teste 1',
        element: 'Sangue',
        circle: 1,
      },
      {
        ritualId: 'ritual-teste-2',
        ritualName: 'Ritual Teste 2',
        element: 'Morte',
        circle: 2,
      },
    ];
    
    const totals = calculateRitualBonusTotals(rituals);
    
    expect(totals).toBeDefined();
    expect(typeof totals.attackBonus).toBe('number');
    expect(typeof totals.defenseBonus).toBe('number');
  });
});

// =====================================================
// FASE 7: Cenários de Borda
// =====================================================

describe('SUE Integration: Cenários de Borda', () => {
  it('deve lidar com personagem sem poderes', () => {
    const character: CharacterStateForEffects = {
      ...createCombatenteNex50(),
      classPowers: [],
    };
    
    const { result } = renderHook(() => useUnifiedEffects(character));
    
    expect(result.current.bySource.class_power).toHaveLength(0);
  });

  it('deve lidar com personagem sem trilha', () => {
    const character: CharacterStateForEffects = {
      ...createCombatenteNex50(),
      classTrack: null,
    };
    
    expect(() => renderHook(() => useUnifiedEffects(character))).not.toThrow();
  });

  it('deve lidar com todas as condições críticas', () => {
    const character: CharacterStateForEffects = {
      ...createCombatenteNex50(),
      conditions: ['inconsciente', 'morrendo'],
    };
    
    const { result } = renderHook(() => useUnifiedEffects(character));
    
    expect(result.current.computed.flags.isUnconscious).toBe(true);
    expect(result.current.computed.flags.isHelpless).toBe(true);
    expect(result.current.computed.flags.cannotAct).toBe(true);
  });

  it('deve consolidar corretamente com consolidateEffects', () => {
    const effects = getConditionEffects(['desprevenido', 'vulneravel']);
    
    const context = {
      attributes: { strength: 2, agility: 2, vigor: 2, intellect: 2, presence: 2 },
      nex: 50,
      hpCurrent: 30,
      hpMax: 30,
      peCurrent: 10,
      peMax: 10,
      inCombat: true,
      isFirstRound: false,
      currentRound: 1,
      hasShield: false,
      activeConditions: ['desprevenido', 'vulneravel'],
      activatedEffects: [],
    };
    
    const computed = consolidateEffects(effects, context);
    
    // desprevenido: -5, vulneravel: -2 = -7
    expect(computed.defense.general).toBe(-7);
  });
});

// =====================================================
// FASE 8: Performance e Robustez
// =====================================================

describe('SUE Integration: Performance', () => {
  it('deve processar personagem completo em tempo razoável', () => {
    const character: CharacterStateForEffects = {
      ...createCombatenteNex50(),
      conditions: ['desprevenido', 'cego', 'exausto'],
      classPowers: [
        { id: 'golpe-pesado', name: 'Golpe Pesado', classId: 'combatente', nex: 25 },
        { id: 'golpe-brutal', name: 'Golpe Brutal', classId: 'combatente', nex: 50 },
        { id: 'golpe-demolidor', name: 'Golpe Demolidor', classId: 'combatente', nex: 75 },
      ],
    };
    const combat = createMeleeCombatContext();
    
    const start = performance.now();
    const { result } = renderHook(() => useUnifiedEffects(character, combat));
    const end = performance.now();
    
    // Deve processar em menos de 100ms
    expect(end - start).toBeLessThan(100);
    expect(result.current).toBeDefined();
  });

  it('não deve lançar exceção com dados inválidos', () => {
    const character: CharacterStateForEffects = {
      origin: '',
      classId: '',
      classTrack: null,
      nex: 0,
      attributes: {
        strength: -1,
        agility: -1,
        vigor: -1,
        intellect: -1,
        presence: -1,
      },
      conditions: ['condição-inexistente'],
      activeRituals: [],
      paranormalPowers: [],
      classPowers: [{ id: 'poder-inexistente', name: '', classId: '', nex: 0 }],
      elementalAffinity: null,
      affinityActive: false,
      currentHP: -5,
      maxHP: 0,
      currentPE: -5,
      maxPE: 0,
      activatedEffectIds: [],
    };
    
    expect(() => renderHook(() => useUnifiedEffects(character))).not.toThrow();
  });
});
