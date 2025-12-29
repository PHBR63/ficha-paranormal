// =====================================================
// Testes do Sistema de Modificadores de Ritual via SUE
// Ordem Paranormal RPG v1.3
// =====================================================
// 
// Verifica:
// - Extração de modificadores de trilha (Ampliar/Acelerar Ritual)
// - Cálculo de custo de PE com modificadores ativos
// - Bônus de DT de Graduado via SUE
// - Integração completa do fluxo de rituais
//

import { describe, it, expect, vi } from 'vitest';
import { consolidateEffects, type UnifiedEffect, type EffectCalculationContext } from '@/lib/unified-effects-engine';
import { getTrackEffects } from '@/lib/effects/track-effects-adapter';

// =============================================================================
// HELPERS DE TESTE
// =============================================================================

/**
 * Cria contexto de cálculo para testes
 */
function createTestContext(overrides: Partial<EffectCalculationContext> = {}): EffectCalculationContext {
  return {
    attributes: {
      strength: 2,
      agility: 2,
      vigor: 2,
      intellect: 3,
      presence: 2,
    },
    nex: 50,
    hpCurrent: 30,
    hpMax: 30,
    peCurrent: 20,
    peMax: 20,
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
 * Cria um efeito de teste para rituais
 */
function createRitualModifierEffect(
  id: string,
  name: string,
  modifiers: Array<{
    id: string;
    name: string;
    type: 'range' | 'action' | 'area' | 'duration';
    effect: string;
    peCost: number;
    perRound?: boolean;
  }>
): UnifiedEffect {
  return {
    id,
    name,
    source: 'track',
    sourceId: 'conduite',
    sourceName: 'Conduíte',
    mechanics: {
      ritualModifiers: modifiers.map(m => ({
        ...m,
        isActivatable: true,
      })),
    },
    isActive: true,
    isToggleable: false,
  };
}

// =============================================================================
// TESTES DE EXTRAÇÃO DE MODIFICADORES DA TRILHA CONDUÍTE
// =============================================================================

describe('Extração de modificadores de ritual da trilha Conduíte', () => {
  const attributes = { strength: 2, agility: 2, vigor: 2, intellect: 3, presence: 2 };

  it('deve extrair Ampliar Ritual a partir de NEX 10%', () => {
    const effects = getTrackEffects('conduite', 10, attributes);
    
    // Procura efeito com ritualModifiers
    const hasAmpliar = effects.some(e => 
      e.mechanics.ritualModifiers?.some(m => m.id === 'ampliar-alcance' || m.id === 'ampliar-area')
    );
    
    expect(hasAmpliar).toBe(true);
  });

  it('deve extrair Acelerar Ritual a partir de NEX 40%', () => {
    const effects = getTrackEffects('conduite', 40, attributes);
    
    const hasAcelerar = effects.some(e => 
      e.mechanics.ritualModifiers?.some(m => m.id === 'acelerar-ritual')
    );
    
    expect(hasAcelerar).toBe(true);
  });

  it('não deve ter Acelerar Ritual abaixo de NEX 40%', () => {
    const effects = getTrackEffects('conduite', 35, attributes);
    
    const hasAcelerar = effects.some(e => 
      e.mechanics.ritualModifiers?.some(m => m.id === 'acelerar-ritual')
    );
    
    expect(hasAcelerar).toBe(false);
  });

  it('deve incluir custos de PE corretos para modificadores', () => {
    const effects = getTrackEffects('conduite', 50, attributes);
    
    let ampliarCost = 0;
    let acelerarCost = 0;
    
    for (const effect of effects) {
      if (effect.mechanics.ritualModifiers) {
        for (const mod of effect.mechanics.ritualModifiers) {
          if (mod.id === 'ampliar-alcance' || mod.id === 'ampliar-area') {
            ampliarCost = mod.peCost;
          }
          if (mod.id === 'acelerar-ritual') {
            acelerarCost = mod.peCost;
          }
        }
      }
    }
    
    expect(ampliarCost).toBe(2); // Ampliar Ritual custa +2 PE
    expect(acelerarCost).toBe(4); // Acelerar Ritual custa +4 PE
  });
});

// =============================================================================
// TESTES DE CONSOLIDAÇÃO DE EFEITOS DE RITUAIS
// =============================================================================

describe('Consolidação de modificadores de ritual no SUE', () => {
  const context = createTestContext();

  it('deve consolidar ritualModifiers de múltiplos efeitos', () => {
    const effects: UnifiedEffect[] = [
      createRitualModifierEffect('ampliar', 'Ampliar Ritual', [
        { id: 'ampliar-alcance', name: 'Aumentar Alcance', type: 'range', effect: '+1 passo de alcance', peCost: 2 },
        { id: 'ampliar-area', name: 'Dobrar Área', type: 'area', effect: 'Dobra área de efeito', peCost: 2 },
      ]),
      createRitualModifierEffect('acelerar', 'Acelerar Ritual', [
        { id: 'acelerar-ritual', name: 'Ação Livre', type: 'action', effect: 'Conjura como ação livre', peCost: 4, perRound: true },
      ]),
    ];

    const result = consolidateEffects(effects, context);

    expect(result.rituals.availableModifiers).toHaveLength(3);
    expect(result.rituals.availableModifiers.map(m => m.id)).toContain('ampliar-alcance');
    expect(result.rituals.availableModifiers.map(m => m.id)).toContain('ampliar-area');
    expect(result.rituals.availableModifiers.map(m => m.id)).toContain('acelerar-ritual');
  });

  it('deve preservar informação de custo de PE nos modificadores consolidados', () => {
    const effects: UnifiedEffect[] = [
      createRitualModifierEffect('test', 'Test', [
        { id: 'mod-1', name: 'Mod 1', type: 'range', effect: 'Efeito 1', peCost: 3 },
        { id: 'mod-2', name: 'Mod 2', type: 'action', effect: 'Efeito 2', peCost: 5 },
      ]),
    ];

    const result = consolidateEffects(effects, context);

    const mod1 = result.rituals.availableModifiers.find(m => m.id === 'mod-1');
    const mod2 = result.rituals.availableModifiers.find(m => m.id === 'mod-2');

    expect(mod1?.peCost).toBe(3);
    expect(mod2?.peCost).toBe(5);
  });

  it('deve incluir source do efeito nos modificadores', () => {
    const effects: UnifiedEffect[] = [
      createRitualModifierEffect('ampliar', 'Ampliar Ritual', [
        { id: 'ampliar-alcance', name: 'Aumentar Alcance', type: 'range', effect: '+1 passo', peCost: 2 },
      ]),
    ];

    const result = consolidateEffects(effects, context);

    expect(result.rituals.availableModifiers[0].source).toBe('Conduíte');
  });

  it('deve marcar modificadores com perRound corretamente', () => {
    const effects: UnifiedEffect[] = [
      createRitualModifierEffect('acelerar', 'Acelerar Ritual', [
        { id: 'acelerar-ritual', name: 'Ação Livre', type: 'action', effect: 'Conjura como ação livre', peCost: 4, perRound: true },
      ]),
    ];

    const result = consolidateEffects(effects, context);

    const acelerar = result.rituals.availableModifiers.find(m => m.id === 'acelerar-ritual');
    expect(acelerar?.perRound).toBe(true);
  });
});

// =============================================================================
// TESTES DE BÔNUS DE DT DE RITUAL (GRADUADO)
// =============================================================================

describe('Bônus de DT de ritual do Graduado', () => {
  it('deve aplicar +5 DT de Rituais Eficientes (NEX 65%)', () => {
    const effects: UnifiedEffect[] = [
      {
        id: 'rituais-eficientes',
        name: 'Rituais Eficientes',
        source: 'track',
        sourceId: 'graduado',
        sourceName: 'Graduado',
        mechanics: {
          ritualDTBonus: 5,
        },
        isActive: true,
        isToggleable: false,
      },
    ];

    const context = createTestContext({ nex: 65 });
    const result = consolidateEffects(effects, context);

    expect(result.rituals.dtBonus).toBe(5);
  });

  it('deve acumular múltiplos bônus de DT', () => {
    const effects: UnifiedEffect[] = [
      {
        id: 'dt-bonus-1',
        name: 'Bônus 1',
        source: 'track',
        sourceId: 'test',
        sourceName: 'Teste',
        mechanics: {
          ritualDTBonus: 5,
        },
        isActive: true,
        isToggleable: false,
      },
      {
        id: 'dt-bonus-2',
        name: 'Bônus 2',
        source: 'equipment',
        sourceId: 'item',
        sourceName: 'Item',
        mechanics: {
          ritualDTBonus: 2,
        },
        isActive: true,
        isToggleable: false,
      },
    ];

    const context = createTestContext();
    const result = consolidateEffects(effects, context);

    expect(result.rituals.dtBonus).toBe(7);
  });

  it('deve registrar breakdown de bônus de DT', () => {
    const effects: UnifiedEffect[] = [
      {
        id: 'rituais-eficientes',
        name: 'Rituais Eficientes',
        source: 'track',
        sourceId: 'graduado',
        sourceName: 'Graduado',
        mechanics: {
          ritualDTBonus: 5,
        },
        isActive: true,
        isToggleable: false,
      },
    ];

    const context = createTestContext();
    const result = consolidateEffects(effects, context);

    expect(result.rituals.breakdown).toContainEqual(
      expect.objectContaining({
        source: 'Graduado',
        effect: expect.stringContaining('DT'),
      })
    );
  });
});

// =============================================================================
// TESTES DE CÁLCULO DE CUSTO TOTAL COM MODIFICADORES
// =============================================================================

describe('Cálculo de custo de PE com modificadores ativos', () => {
  /**
   * Simula cálculo de custo total como feito no RitualCastModal
   */
  function calculateTotalPECost(
    baseCost: number,
    enhancements: Array<{ peCost: number }>,
    activeModifiers: Array<{ peCost: number }>,
    sueReduction: number = 0
  ): number {
    // Custo base com reduções do SUE
    const adjustedBaseCost = Math.max(0, baseCost - sueReduction);
    
    // Soma custos de aprimoramentos selecionados
    const enhancementsCost = enhancements.reduce((sum, e) => sum + e.peCost, 0);
    
    // Soma custos de modificadores de trilha ativos
    const modifiersCost = activeModifiers.reduce((sum, m) => sum + m.peCost, 0);
    
    return adjustedBaseCost + enhancementsCost + modifiersCost;
  }

  it('deve calcular custo correto sem modificadores', () => {
    const total = calculateTotalPECost(3, [], [], 0);
    expect(total).toBe(3);
  });

  it('deve somar custo de Ampliar Ritual (+2 PE)', () => {
    const total = calculateTotalPECost(3, [], [{ peCost: 2 }], 0);
    expect(total).toBe(5);
  });

  it('deve somar custo de Acelerar Ritual (+4 PE)', () => {
    const total = calculateTotalPECost(3, [], [{ peCost: 4 }], 0);
    expect(total).toBe(7);
  });

  it('deve somar múltiplos modificadores (Ampliar + Acelerar)', () => {
    const total = calculateTotalPECost(
      3,
      [],
      [{ peCost: 2 }, { peCost: 4 }],
      0
    );
    expect(total).toBe(9); // 3 + 2 + 4
  });

  it('deve combinar modificadores com aprimoramentos', () => {
    const total = calculateTotalPECost(
      3,
      [{ peCost: 3 }], // Discente
      [{ peCost: 2 }], // Ampliar Ritual
      0
    );
    expect(total).toBe(8); // 3 + 3 + 2
  });

  it('deve aplicar redução do SUE antes de somar modificadores', () => {
    const total = calculateTotalPECost(
      5,
      [],
      [{ peCost: 2 }],
      2 // Redução do SUE
    );
    expect(total).toBe(5); // (5 - 2) + 2 = 5
  });

  it('deve respeitar custo mínimo de 0 na base', () => {
    const total = calculateTotalPECost(
      2,
      [],
      [{ peCost: 4 }],
      5 // Redução maior que o custo base
    );
    expect(total).toBe(4); // max(0, 2 - 5) + 4 = 0 + 4 = 4
  });

  it('cenário completo: ritual círculo 2 + Discente + Ampliar + Acelerar', () => {
    const total = calculateTotalPECost(
      4,                  // Base círculo 2
      [{ peCost: 4 }],    // Discente (+4)
      [                   
        { peCost: 2 },    // Ampliar (+2)
        { peCost: 4 },    // Acelerar (+4)
      ],
      1                   // Redução SUE (-1)
    );
    // (4 - 1) + 4 + 2 + 4 = 3 + 10 = 13
    expect(total).toBe(13);
  });
});

// =============================================================================
// TESTES DE INTEGRAÇÃO COMPLETA
// =============================================================================

describe('Integração completa: Trilha Conduíte + Cálculo de PE', () => {
  const attributes = { strength: 2, agility: 2, vigor: 2, intellect: 3, presence: 2 };

  it('deve obter modificadores corretos de Conduíte NEX 50%', () => {
    const effects = getTrackEffects('conduite', 50, attributes);
    const context = createTestContext({ nex: 50 });
    const result = consolidateEffects(effects, context);

    // Deve ter Ampliar (NEX 10%) e Acelerar (NEX 40%)
    const modifierIds = result.rituals.availableModifiers.map(m => m.id);
    
    expect(modifierIds).toContain('ampliar-alcance');
    expect(modifierIds).toContain('ampliar-area');
    expect(modifierIds).toContain('acelerar-ritual');
  });

  it('deve calcular custo usando modificadores consolidados do SUE', () => {
    const effects = getTrackEffects('conduite', 50, attributes);
    const context = createTestContext({ nex: 50 });
    const result = consolidateEffects(effects, context);

    // Simula seleção de modificadores pelo usuário
    const activeModifierIds = ['ampliar-alcance', 'acelerar-ritual'];
    const activeModifiers = result.rituals.availableModifiers.filter(
      m => activeModifierIds.includes(m.id)
    );

    // Calcula custo total
    const baseCost = 3;
    const modifiersCost = activeModifiers.reduce((sum, m) => sum + m.peCost, 0);
    const totalCost = baseCost + modifiersCost;

    expect(modifiersCost).toBe(6); // 2 + 4
    expect(totalCost).toBe(9);     // 3 + 6
  });

  it('deve respeitar limite de uso por rodada do Acelerar Ritual', () => {
    const effects = getTrackEffects('conduite', 50, attributes);
    const context = createTestContext({ nex: 50 });
    const result = consolidateEffects(effects, context);

    const acelerar = result.rituals.availableModifiers.find(
      m => m.id === 'acelerar-ritual'
    );

    expect(acelerar?.perRound).toBe(true);
  });
});

// =============================================================================
// TESTES DE VALIDAÇÃO DE PE DISPONÍVEL
// =============================================================================

describe('Validação de PE disponível com modificadores', () => {
  function canAffordRitual(
    peCurrent: number,
    baseCost: number,
    modifiersCost: number,
    peLimit?: number
  ): { canCast: boolean; reason?: string } {
    const totalCost = baseCost + modifiersCost;

    if (peCurrent < totalCost) {
      return { canCast: false, reason: `PE insuficiente (${peCurrent}/${totalCost})` };
    }

    if (peLimit !== undefined && totalCost > peLimit) {
      return { canCast: false, reason: `Excede limite por turno (${totalCost}/${peLimit})` };
    }

    return { canCast: true };
  }

  it('deve permitir conjuração quando PE é suficiente', () => {
    const result = canAffordRitual(10, 3, 2);
    expect(result.canCast).toBe(true);
  });

  it('deve bloquear quando PE é insuficiente', () => {
    const result = canAffordRitual(4, 3, 4); // Precisa 7, tem 4
    expect(result.canCast).toBe(false);
    expect(result.reason).toContain('PE insuficiente');
  });

  it('deve bloquear quando excede limite por turno', () => {
    const result = canAffordRitual(20, 5, 6, 8); // Total 11, limite 8
    expect(result.canCast).toBe(false);
    expect(result.reason).toContain('limite por turno');
  });

  it('deve permitir no limite exato de PE', () => {
    const result = canAffordRitual(9, 3, 6); // Total 9, tem 9
    expect(result.canCast).toBe(true);
  });

  it('deve permitir no limite exato por turno', () => {
    const result = canAffordRitual(20, 5, 3, 8); // Total 8, limite 8
    expect(result.canCast).toBe(true);
  });
});
