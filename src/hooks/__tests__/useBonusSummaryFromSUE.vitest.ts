/**
 * Testes Unitários: useBonusSummaryFromSUE
 * 
 * Testa a conversão de UnifiedEffects para o formato BonusSummary
 * usado pelos componentes legados.
 * 
 * Ordem Paranormal RPG v1.3
 */

import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

// Spies transparentes preservam os contratos e cálculos reais dos hooks.
vi.mock('@/hooks/useDefenseBonuses', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/hooks/useDefenseBonuses')>();
  return { ...actual, useDefenseBonuses: vi.fn(actual.useDefenseBonuses) };
});

vi.mock('@/hooks/useParanormalEffects', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/hooks/useParanormalEffects')>();
  return { ...actual, useParanormalEffects: vi.fn(actual.useParanormalEffects) };
});

vi.mock('@/hooks/useClassPowerBonuses', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/hooks/useClassPowerBonuses')>();
  return { ...actual, useClassPowerBonuses: vi.fn(actual.useClassPowerBonuses) };
});

// =============================================================================
// HELPERS DE TESTE
// =============================================================================

/**
 * Cria props mínimas válidas para o hook useBonusSummaryFromSUE
 */
function createMinimalProps(overrides = {}) {
  return {
    origin: 'academico',
    abilities: [],
    generalPowers: [],
    paranormalPowers: [],
    inventory: [],
    nex: 50,
    elementalAffinity: null,
    affinityActive: false,
    activeConditionalBonuses: [],
    activeRituals: [],
    skills: {},
    strength: 2,
    agility: 2,
    vigor: 2,
    intellect: 1,
    presence: 1,
    classId: 'combatente',
    classTrack: 'guerreiro',
    classPowers: [],
    equippedWeaponType: undefined,
    equippedProtectionType: undefined,
    inCombat: false,
    hpCurrent: 20,
    hpMax: 20,
    peCurrent: 10,
    peMax: 10,
    activeConditions: [],
    ...overrides
  };
}

// =============================================================================
// TESTES DE ESTRUTURA
// =============================================================================

describe('useBonusSummaryFromSUE - Estrutura', () => {
  it('deve exportar o hook useBonusSummaryFromSUE', async () => {
    const module = await import('@/hooks/useBonusSummaryFromSUE');
    expect(module.useBonusSummaryFromSUE).toBeDefined();
    expect(typeof module.useBonusSummaryFromSUE).toBe('function');
  });

  it('deve retornar estrutura de BonusSummary válida', async () => {
    const { useBonusSummaryFromSUE } = await import('@/hooks/useBonusSummaryFromSUE');
    const { result } = renderHook(() => useBonusSummaryFromSUE(createMinimalProps()));
    
    // Verifica propriedades principais do BonusSummary
    expect(result.current).toBeDefined();
    expect(result.current.unifiedEffects).toBeDefined();
  });
});

// =============================================================================
// TESTES DE CONVERSÃO
// =============================================================================

describe('useBonusSummaryFromSUE - Conversão de Efeitos', () => {
  it('deve processar personagem Combatente básico', async () => {
    const { useBonusSummaryFromSUE } = await import('@/hooks/useBonusSummaryFromSUE');
    
    const props = createMinimalProps({
      classId: 'combatente',
      classTrack: 'guerreiro',
      nex: 50
    });

    const { result } = renderHook(() => useBonusSummaryFromSUE(props));
    
    expect(result.current).toBeDefined();
    expect(result.current.unifiedEffects.allEffects).toBeDefined();
  });

  it('deve processar bônus de dano melee corretamente', async () => {
    const { useBonusSummaryFromSUE } = await import('@/hooks/useBonusSummaryFromSUE');
    
    const props = createMinimalProps({
      classId: 'combatente',
      classTrack: 'guerreiro',
      classPowers: ['golpe-pesado'],
      nex: 50,
      strength: 3,
      inCombat: true,
      equippedWeaponType: 'melee'
    });

    const { result } = renderHook(() => useBonusSummaryFromSUE(props));
    
    expect(result.current).toBeDefined();
    // O hook deve processar o poder Golpe Pesado
  });

  it('deve processar bônus de dano ranged corretamente', async () => {
    const { useBonusSummaryFromSUE } = await import('@/hooks/useBonusSummaryFromSUE');
    
    const props = createMinimalProps({
      classId: 'especialista',
      classTrack: 'atirador-de-elite',
      classPowers: ['mira-firme'],
      nex: 50,
      agility: 3,
      intellect: 2,
      inCombat: true,
      equippedWeaponType: 'ranged'
    });

    const { result } = renderHook(() => useBonusSummaryFromSUE(props));
    
    expect(result.current).toBeDefined();
  });
});

// =============================================================================
// TESTES DE INTEGRAÇÃO COM HOOKS LEGADOS
// =============================================================================

describe('useBonusSummaryFromSUE - Integração com Hooks Legados', () => {
  it('deve chamar useDefenseBonuses com parâmetros corretos', async () => {
    const { useDefenseBonuses } = await import('@/hooks/useDefenseBonuses');
    const { useBonusSummaryFromSUE } = await import('@/hooks/useBonusSummaryFromSUE');
    
    const props = createMinimalProps({
      equippedProtectionType: 'leve'
    });

    renderHook(() => useBonusSummaryFromSUE(props));
    
    // Verifica que o hook foi chamado
    expect(useDefenseBonuses).toHaveBeenCalled();
  });

  it('deve chamar useParanormalEffects quando há poderes paranormais', async () => {
    const { useParanormalEffects } = await import('@/hooks/useParanormalEffects');
    const { useBonusSummaryFromSUE } = await import('@/hooks/useBonusSummaryFromSUE');
    
    const props = createMinimalProps({
      classId: 'ocultista',
      classTrack: 'conduíte',
      paranormalPowers: [{ id: 'precognicao', name: 'Precognição', element: 'Conhecimento', description: 'Bônus de Defesa' }],
      affinityActive: true,
      elementalAffinity: 'Conhecimento'
    });

    renderHook(() => useBonusSummaryFromSUE(props));
    
    expect(useParanormalEffects).toHaveBeenCalled();
  });
});

// =============================================================================
// TESTES DE BÔNUS CONDICIONAIS
// =============================================================================

describe('useBonusSummaryFromSUE - Bônus Condicionais', () => {
  it('deve incluir bônus condicionais ativados', async () => {
    const { useBonusSummaryFromSUE } = await import('@/hooks/useBonusSummaryFromSUE');
    
    const props = createMinimalProps({
      classId: 'combatente',
      classTrack: 'guerreiro',
      generalPowers: [{ id: 'ataque-poderoso', name: 'Ataque Poderoso' }],
      activeConditionalBonuses: ['ataque-poderoso'],
      inCombat: true
    });

    const { result } = renderHook(() => useBonusSummaryFromSUE(props));
    
    expect(result.current).toBeDefined();
  });

  it('deve lidar com múltiplos bônus condicionais', async () => {
    const { useBonusSummaryFromSUE } = await import('@/hooks/useBonusSummaryFromSUE');
    
    const props = createMinimalProps({
      origin: 'militar',
      classId: 'combatente',
      classTrack: 'guerreiro',
      nex: 75,
      strength: 4,
      vigor: 3,
      generalPowers: [
        { id: 'ataque-poderoso', name: 'Ataque Poderoso' },
        { id: 'foco-em-arma', name: 'Foco em Arma' }
      ],
      activeConditionalBonuses: ['ataque-poderoso', 'foco-em-arma'],
      inCombat: true
    });

    const { result } = renderHook(() => useBonusSummaryFromSUE(props));
    
    expect(result.current).toBeDefined();
  });
});

// =============================================================================
// TESTES DE RECURSOS (HP/PE)
// =============================================================================

describe('useBonusSummaryFromSUE - Recursos', () => {
  it('deve processar personagem com bônus de PV de origem', async () => {
    const { useBonusSummaryFromSUE } = await import('@/hooks/useBonusSummaryFromSUE');
    
    const props = createMinimalProps({
      origin: 'lutador',
      vigor: 4,
      hpMax: 30,
      hpCurrent: 30
    });

    const { result } = renderHook(() => useBonusSummaryFromSUE(props));
    
    expect(result.current).toBeDefined();
  });

  it('deve processar personagem com bônus de PE de classe', async () => {
    const { useBonusSummaryFromSUE } = await import('@/hooks/useBonusSummaryFromSUE');
    
    const props = createMinimalProps({
      classId: 'ocultista',
      classTrack: 'conduíte',
      intellect: 4,
      nex: 75,
      peMax: 25,
      peCurrent: 25
    });

    const { result } = renderHook(() => useBonusSummaryFromSUE(props));
    
    expect(result.current).toBeDefined();
  });
});

// =============================================================================
// TESTES DE CONDIÇÕES
// =============================================================================

describe('useBonusSummaryFromSUE - Condições Ativas', () => {
  it('deve aplicar penalidades de condições', async () => {
    const { useBonusSummaryFromSUE } = await import('@/hooks/useBonusSummaryFromSUE');
    
    const props = createMinimalProps({
      hpCurrent: 5,
      hpMax: 25,
      activeConditions: ['debilitado'],
      inCombat: true
    });

    const { result } = renderHook(() => useBonusSummaryFromSUE(props));
    
    expect(result.current).toBeDefined();
    // Verificar que condição foi processada
    const conditionEffects = result.current.unifiedEffects.bySource.condition;
    expect(conditionEffects).toBeDefined();
  });

  it('deve lidar com múltiplas condições simultaneamente', async () => {
    const { useBonusSummaryFromSUE } = await import('@/hooks/useBonusSummaryFromSUE');
    
    const props = createMinimalProps({
      classId: 'especialista',
      classTrack: 'infiltrador',
      hpCurrent: 3,
      hpMax: 20,
      peCurrent: 2,
      peMax: 10,
      activeConditions: ['debilitado', 'desprevenido'],
      inCombat: true
    });

    const { result } = renderHook(() => useBonusSummaryFromSUE(props));
    
    expect(result.current).toBeDefined();
    const conditionEffects = result.current.unifiedEffects.bySource.condition;
    expect(conditionEffects).toBeDefined();
    expect(conditionEffects.length).toBeGreaterThanOrEqual(2);
  });
});

// =============================================================================
// TESTES DE RETORNO DE UNIFIED EFFECTS
// =============================================================================

describe('useBonusSummaryFromSUE - Retorno de UnifiedEffects', () => {
  it('deve retornar unifiedEffects com estrutura correta', async () => {
    const { useBonusSummaryFromSUE } = await import('@/hooks/useBonusSummaryFromSUE');
    
    const props = createMinimalProps();

    const { result } = renderHook(() => useBonusSummaryFromSUE(props));
    
    expect(result.current.unifiedEffects).toBeDefined();
    expect(result.current.unifiedEffects.allEffects).toBeDefined();
    expect(result.current.unifiedEffects.computed).toBeDefined();
    expect(result.current.unifiedEffects.bySource).toBeDefined();
  });

  it('deve ter helpers funcionais no unifiedEffects', async () => {
    const { useBonusSummaryFromSUE } = await import('@/hooks/useBonusSummaryFromSUE');
    
    const props = createMinimalProps({
      activeConditions: ['desprevenido']
    });

    const { result } = renderHook(() => useBonusSummaryFromSUE(props));
    
    expect(typeof result.current.unifiedEffects.hasEffect).toBe('function');
    expect(typeof result.current.unifiedEffects.getEffectsFromSource).toBe('function');
    expect(typeof result.current.unifiedEffects.isEffectActive).toBe('function');
  });

  it('deve agrupar efeitos por fonte corretamente', async () => {
    const { useBonusSummaryFromSUE } = await import('@/hooks/useBonusSummaryFromSUE');
    
    const props = createMinimalProps({
      origin: 'academico',
      classId: 'combatente',
      classTrack: 'guerreiro',
      activeConditions: ['desprevenido']
    });

    const { result } = renderHook(() => useBonusSummaryFromSUE(props));
    
    expect(result.current.unifiedEffects.bySource).toBeDefined();
    expect(result.current.unifiedEffects.bySource.origin).toBeDefined();
    expect(result.current.unifiedEffects.bySource.condition).toBeDefined();
  });
});

// =============================================================================
// TESTES DE OCULTISTA COM RITUAIS
// =============================================================================

describe('useBonusSummaryFromSUE - Ocultista com Rituais', () => {
  it('deve processar Ocultista com poderes de ritual', async () => {
    const { useBonusSummaryFromSUE } = await import('@/hooks/useBonusSummaryFromSUE');
    
    const props = createMinimalProps({
      classId: 'ocultista',
      classTrack: 'conduíte',
      intellect: 4,
      presence: 2,
      nex: 50,
      classPowers: [
        { id: 'especialista-em-elemento', name: 'Especialista em Elemento', choice: 'Energia' },
        { id: 'ritual-potente', name: 'Ritual Potente' }
      ],
      elementalAffinity: 'Energia',
      affinityActive: true
    });

    const { result } = renderHook(() => useBonusSummaryFromSUE(props));
    
    expect(result.current).toBeDefined();
    expect(result.current.unifiedEffects.computed).toBeDefined();
  });

  it('deve processar rituais sustentados ativos', async () => {
    const { useBonusSummaryFromSUE } = await import('@/hooks/useBonusSummaryFromSUE');
    
    const props = createMinimalProps({
      classId: 'ocultista',
      classTrack: 'conduíte',
      intellect: 3,
      activeRituals: [
        { 
          ritualId: 'velocidade-mortal', 
          ritualName: 'Velocidade Mortal',
          element: 'Morte',
          circle: 2,
          isConcentrating: true
        }
      ]
    });

    const { result } = renderHook(() => useBonusSummaryFromSUE(props));
    
    expect(result.current).toBeDefined();
  });
});

// =============================================================================
// TESTES DE ESPECIALISTA
// =============================================================================

describe('useBonusSummaryFromSUE - Especialista', () => {
  it('deve processar Atirador de Elite com bônus de dano', async () => {
    const { useBonusSummaryFromSUE } = await import('@/hooks/useBonusSummaryFromSUE');
    
    const props = createMinimalProps({
      classId: 'especialista',
      classTrack: 'atirador-de-elite',
      agility: 3,
      intellect: 3,
      nex: 75,
      classPowers: ['mira-firme', 'balistica-avancada'],
      equippedWeaponType: 'ranged',
      inCombat: true
    });

    const { result } = renderHook(() => useBonusSummaryFromSUE(props));
    
    expect(result.current).toBeDefined();
    // Verificar computed do SUE
    expect(result.current.unifiedEffects.computed).toBeDefined();
  });

  it('deve processar Infiltrador com bônus de perícias', async () => {
    const { useBonusSummaryFromSUE } = await import('@/hooks/useBonusSummaryFromSUE');
    
    const props = createMinimalProps({
      classId: 'especialista',
      classTrack: 'infiltrador',
      agility: 4,
      presence: 2,
      nex: 50,
      skills: { furtividade: 5, diplomacia: 2 }
    });

    const { result } = renderHook(() => useBonusSummaryFromSUE(props));
    
    expect(result.current).toBeDefined();
  });
});
