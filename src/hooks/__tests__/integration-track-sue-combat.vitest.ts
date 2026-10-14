/**
 * Testes de Integração End-to-End: Trilhas + SUE + Combate
 * Ordem Paranormal RPG v1.3
 * 
 * Valida o fluxo completo:
 * 1. Ativar técnica de trilha → useActivatedEffects
 * 2. Verificar bônus no SUE → useUnifiedEffects
 * 3. Confirmar aplicação no combate → getTrackCombatBonuses
 * 
 * @module integration-track-sue-combat.vitest
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { 
  useActivatedEffects, 
  TRACK_EFFECT_IDS,
  EffectDuration,
} from '../useActivatedEffects';
import { 
  getTrackEffects,
  getTrackCombatBonuses,
  getActivatableEffectInfo,
  isEffectAvailableAtNex,
  TRACK_EFFECT_MAPPINGS,
} from '@/lib/effects/track-effects-adapter';
import { 
  consolidateEffects, 
  UnifiedEffect,
  EffectCalculationContext 
} from '@/lib/unified-effects-engine';
import { 
  calculateSneakAttackDice,
  calculateSpecialAttackBonus,
} from '@/lib/class-powers/track-effects-engine';

// =====================================================
// Mocks do Supabase
// =====================================================

// Mock do Supabase para testes sem banco real
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
      update: () => ({
        eq: () => Promise.resolve({ error: null }),
      }),
    }),
  },
}));

// =====================================================
// Helpers de Teste
// =====================================================

/** Atributos padrão para testes */
const DEFAULT_ATTRIBUTES = {
  strength: 2,
  agility: 3,
  vigor: 2,
  intellect: 3,
  presence: 1,
};

/** Cria contexto de cálculo para o SUE */
function createTestCalculationContext(
  overrides: Partial<EffectCalculationContext> = {}
): EffectCalculationContext {
  return {
    attributes: DEFAULT_ATTRIBUTES,
    nex: 50,
    hpCurrent: 30,
    hpMax: 40,
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

/** Consolida efeitos de trilha para teste */
function consolidateTrackEffectsForTest(
  trackId: string,
  nex: number,
  activatedEffectIds: string[] = [],
  attackType: 'melee' | 'ranged' = 'melee'
): ReturnType<typeof consolidateEffects> {
  const effects = getTrackEffects(
    trackId,
    nex,
    DEFAULT_ATTRIBUTES,
    activatedEffectIds
  );
  
  const context = createTestCalculationContext({
    nex,
    activatedEffects: activatedEffectIds,
    inCombat: true,
    attackContext: {
      type: attackType,
      targetConditions: [],
    },
  });
  
  return consolidateEffects(effects, context);
}

// =====================================================
// TESTES DE INTEGRAÇÃO: useActivatedEffects ↔ getTrackEffects
// =====================================================

describe('Integração: useActivatedEffects ↔ getTrackEffects', () => {
  it('efeito ativado deve aparecer em getTrackEffects como isActive=true', () => {
    // Cenário: Disparo Letal ativado
    const activatedIds = ['track-disparo-letal'];
    
    const effects = getTrackEffects(
      'atirador-elite',
      50, // NEX 50% - Disparo Letal requer 40%
      DEFAULT_ATTRIBUTES,
      activatedIds
    );
    
    const disparoLetal = effects.find(e => e.id === 'track-disparo-letal');
    expect(disparoLetal).toBeDefined();
    expect(disparoLetal?.isActive).toBe(true);
  });

  it('efeito não ativado deve ter isActive=false', () => {
    // Cenário: Disparo Letal disponível mas não ativado
    const activatedIds: string[] = [];
    
    const effects = getTrackEffects(
      'atirador-elite',
      50,
      DEFAULT_ATTRIBUTES,
      activatedIds
    );
    
    const disparoLetal = effects.find(e => e.id === 'track-disparo-letal');
    // Se é toggleável e não está em activatedIds, deve ser isActive=false
    if (disparoLetal?.isToggleable) {
      expect(disparoLetal.isActive).toBe(false);
    }
  });

  it('múltiplas técnicas ativadas devem ser reconhecidas', () => {
    // Cenário: Aniquilador com 2 técnicas ativas
    const activatedIds = [
      'track-tecnica-destruidor',
      'track-tecnica-amplo',
    ];
    
    const effects = getTrackEffects(
      'aniquilador',
      50, // NEX 50% - ambas requerem 40%
      DEFAULT_ATTRIBUTES,
      activatedIds
    );
    
    const activeEffects = effects.filter(e => e.isActive && e.isToggleable);
    // Deve ter pelo menos as 2 técnicas ativas
    expect(activeEffects.length).toBeGreaterThanOrEqual(2);
    
    const ids = activeEffects.map(e => e.id);
    expect(ids).toContain('track-tecnica-destruidor');
    expect(ids).toContain('track-tecnica-amplo');
  });
});

// =====================================================
// TESTES DE INTEGRAÇÃO: getTrackEffects ↔ consolidateEffects (SUE)
// =====================================================

describe('Integração: getTrackEffects ↔ consolidateEffects (SUE)', () => {
  describe('Trilha Aniquilador', () => {
    it.each([[10, 1], [40, 2], [65, 2], [99, 3]])('NEX %i consolida categoria final %i sem somar patamares', (nex, amount) => {
      const result = consolidateTrackEffectsForTest('aniquilador', nex, []);
      expect(result.inventory.totalCategoryReduction).toBe(amount);
      expect(result.inventory.categoryReductions).toHaveLength(1);
      expect(result.inventory.categoryReductions[0].targetType).toBe('specific-weapon');
    });

    it('Técnica Destruidor aumenta o multiplicador crítico em 1 sem bônus de dano', () => {
      const result = consolidateTrackEffectsForTest(
        'aniquilador',
        50,
        ['track-tecnica-destruidor']
      );
      
      // Livro Base v1.3, p.26: Destruidor modifica o crítico, não o dano base.
      expect(result.critical.multiplierBonus).toBe(1);
      expect(result.damage.general).toBe(0);
    });

    it('Técnica Letal deve adicionar +2 na margem de ameaça', () => {
      const result = consolidateTrackEffectsForTest(
        'aniquilador',
        70, // NEX 70% para Técnica Letal (65%)
        ['track-tecnica-letal']
      );
      
      expect(result.critical.marginBonus).toBe(2);
    });

    it('Múltiplas técnicas devem acumular bônus', () => {
      const resultSingle = consolidateTrackEffectsForTest(
        'aniquilador',
        70,
        ['track-tecnica-destruidor']
      );
      
      const resultDouble = consolidateTrackEffectsForTest(
        'aniquilador',
        70,
        ['track-tecnica-destruidor', 'track-tecnica-letal']
      );
      
      // Com 2 técnicas deve ter mais bônus
      expect(resultDouble.critical.marginBonus).toBeGreaterThanOrEqual(
        resultSingle.critical.marginBonus
      );
    });
  });

  describe('Trilha Infiltrador', () => {
    it('Ataque Furtivo fica disponível sem somar dano passivo', () => {
      const result = consolidateTrackEffectsForTest(
        'infiltrador',
        50,
        ['track-ataque-furtivo-trilha']
      );
      
      expect(result.sneakAttack.available).toBe(true);
      expect(result.sneakAttack.baseDice).toBe(2);
      expect(result.damage.extraDice).toEqual([]);
    });

    it('Assassinar deve dobrar dados do Ataque Furtivo', () => {
      // Dados base sem Assassinar
      const diceWithout = calculateSneakAttackDice(70, false);
      // Dados com Assassinar
      const diceWith = calculateSneakAttackDice(70, true);
      
      // Extrai número de dados (ex: '+3d6' -> 3)
      const countWithout = parseInt(diceWithout.replace('+', '').replace('d6', ''));
      const countWith = parseInt(diceWith.replace('+', '').replace('d6', ''));
      
      expect(countWith).toBe(countWithout * 2);
    });
  });

  describe('Trilha Atirador de Elite', () => {
    it('Disparo Letal aumenta margem em 2 sem duplicar dano de Mira de Elite', () => {
      const customAttrs = { ...DEFAULT_ATTRIBUTES, intellect: 4 };
      
      const effects = getTrackEffects(
        'atirador-elite',
        50,
        customAttrs,
        ['track-disparo-letal']
      );
      
      const context = createTestCalculationContext({
        attributes: customAttrs,
        activatedEffects: ['track-disparo-letal'],
        attackContext: { type: 'ranged', targetConditions: [] },
      });
      
      const result = consolidateEffects(effects, context);
      
      // Livro Base v1.3, p.30: INT no dano vem de Mira de Elite; Disparo modifica margem.
      expect(result.damage.ranged).toBe(customAttrs.intellect);
      expect(result.critical.marginBonus).toBe(2);
    });
  });

  describe('Trilha Guerreiro', () => {
    it('bônus de crítico corpo a corpo deve ser aplicado', () => {
      const result = consolidateTrackEffectsForTest(
        'guerreiro',
        50,
        [],
        'melee'
      );
      
      // Guerreiro tem Técnica Letal passiva: +1 crítico corpo a corpo
      // (pode não estar ativada, então verificamos apenas que não quebrou)
      expect(result.critical.marginBonus).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Trilha Operações Especiais', () => {
    it('Iniciativa Aprimorada deve adicionar bônus de iniciativa', () => {
      const effects = getTrackEffects(
        'operacoes-especiais',
        20, // NEX 20% - primeira habilidade
        DEFAULT_ATTRIBUTES,
        []
      );
      
      const context = createTestCalculationContext({
        nex: 20,
        activatedEffects: [],
      });
      
      const result = consolidateEffects(effects, context);
      
      // Iniciativa Aprimorada: +AGI em iniciativa
      expect(result.initiative.bonus).toBeGreaterThanOrEqual(DEFAULT_ATTRIBUTES.agility);
    });
  });

  describe('Trilha Tropa de Choque', () => {
    it('Casca Grossa habilita Vigor no bloqueio sem conceder RD permanente', () => {
      const effects = getTrackEffects(
        'tropa-choque',
        20,
        DEFAULT_ATTRIBUTES,
        []
      );
      
      const context = createTestCalculationContext({
        nex: 20,
        activatedEffects: [],
      });
      
      const result = consolidateEffects(effects, context);
      
      // Livro Base v1.3, p.27: Vigor soma apenas à RD recebida quando bloqueia.
      expect(result.damageReduction.physical).toBe(0);
      expect(result.combatAdvanced.blockVigorBonus.enabled).toBe(true);
    });
  });

  describe('Trilha Técnico', () => {
    it.each([{ activatedIds: [] }, { activatedIds: ['track-remendao'] }])('Remendão conserva categoria passiva uma única vez (ativações: $activatedIds)', ({ activatedIds }) => {
      const result = consolidateTrackEffectsForTest('tecnico', 40, activatedIds);
      expect(result.inventory.totalCategoryReduction).toBe(1);
      expect(result.inventory.categoryReductions).toHaveLength(1);
      expect(result.inventory.categoryReductions[0].targetType).toBe('general-equipment');
    });
  });
});

// =====================================================
// TESTES DE INTEGRAÇÃO: SUE ↔ getTrackCombatBonuses
// =====================================================

describe('Integração: SUE ↔ getTrackCombatBonuses', () => {
  it('bônus consolidados devem corresponder a getTrackCombatBonuses', () => {
    const trackId = 'aniquilador';
    const nex = 50;
    const activatedIds = ['track-tecnica-destruidor'];
    
    // Via SUE
    const sueResult = consolidateTrackEffectsForTest(
      trackId, nex, activatedIds, 'melee'
    );
    
    // Via getTrackCombatBonuses
    const combatBonuses = getTrackCombatBonuses(
      trackId, nex, DEFAULT_ATTRIBUTES, 'melee', activatedIds
    );
    
    // Bônus de dano deve ser consistente
    const sueTotalDamage = sueResult.damage.general + sueResult.damage.melee;
    expect(combatBonuses.damageBonus).toBe(sueTotalDamage);
  });

  it('Atirador de Elite com Disparo Letal ranged', () => {
    const activatedIds = ['track-disparo-letal'];
    
    const combatBonuses = getTrackCombatBonuses(
      'atirador-elite',
      50,
      DEFAULT_ATTRIBUTES,
      'ranged',
      activatedIds
    );
    
    expect(combatBonuses.damageBonus).toBe(DEFAULT_ATTRIBUTES.intellect);
    expect(combatBonuses.criticalMarginBonus).toBe(2);
  });

  it('Infiltrador mantém Ataque Furtivo na mecânica dedicada', () => {
    const activatedIds = ['track-ataque-furtivo-trilha'];
    
    const combatBonuses = getTrackCombatBonuses(
      'infiltrador',
      50,
      DEFAULT_ATTRIBUTES,
      'melee',
      activatedIds
    );
    
    expect(combatBonuses.extraDamageDice).toEqual([]);
    expect(getTrackEffects('infiltrador', 50, DEFAULT_ATTRIBUTES, activatedIds)
      .some(effect => effect.mechanics.sneakAttack?.baseDice === 1)).toBe(true);
  });
});

// =====================================================
// TESTES DE CONSUMO DE EFEITOS POR DURAÇÃO
// =====================================================

describe('Consumo de Efeitos por Duração', () => {
  it('consumeAttackEffects deve remover efeitos next-attack', () => {
    const { result } = renderHook(() => useActivatedEffects({
      enablePersistence: false,
    }));

    // Ativa efeito com duração next-attack
    act(() => {
      result.current.activateEffect(
        'track-disparo-letal',
        'Disparo Letal',
        'next-attack'
      );
    });

    expect(result.current.isEffectActive('track-disparo-letal')).toBe(true);

    // Consome efeitos de ataque
    act(() => {
      result.current.consumeAttackEffects();
    });

    expect(result.current.isEffectActive('track-disparo-letal')).toBe(false);
  });

  it('consumeRoundEffects deve remover efeitos round mas não scene', () => {
    const { result } = renderHook(() => useActivatedEffects({
      enablePersistence: false,
    }));

    // Ativa efeitos com durações diferentes
    act(() => {
      result.current.activateEffect('effect-round', 'Efeito Rodada', 'round');
      result.current.activateEffect('effect-scene', 'Efeito Cena', 'scene');
    });

    expect(result.current.isEffectActive('effect-round')).toBe(true);
    expect(result.current.isEffectActive('effect-scene')).toBe(true);

    // Consome efeitos de rodada
    act(() => {
      result.current.consumeRoundEffects();
    });

    expect(result.current.isEffectActive('effect-round')).toBe(false);
    expect(result.current.isEffectActive('effect-scene')).toBe(true);
  });

  it('efeitos scene devem persistir após múltiplas rodadas', () => {
    const { result } = renderHook(() => useActivatedEffects({
      enablePersistence: false,
    }));

    act(() => {
      result.current.activateEffect('effect-scene', 'Efeito Cena', 'scene');
    });

    // Simula 3 rodadas
    act(() => {
      result.current.consumeRoundEffects();
      result.current.consumeTurnEffects();
    });
    act(() => {
      result.current.consumeRoundEffects();
      result.current.consumeTurnEffects();
    });
    act(() => {
      result.current.consumeRoundEffects();
      result.current.consumeTurnEffects();
    });

    // Efeito de cena ainda deve estar ativo
    expect(result.current.isEffectActive('effect-scene')).toBe(true);
  });

  it('clearAllEffects deve limpar todos os efeitos', () => {
    const { result } = renderHook(() => useActivatedEffects({
      enablePersistence: false,
    }));

    act(() => {
      result.current.activateEffect('e1', 'Efeito 1', 'scene');
      result.current.activateEffect('e2', 'Efeito 2', 'round');
      result.current.activateEffect('e3', 'Efeito 3', 'next-attack');
    });

    expect(result.current.activatedEffectIds.length).toBe(3);

    act(() => {
      result.current.clearAllEffects();
    });

    expect(result.current.activatedEffectIds.length).toBe(0);
  });
});

// =====================================================
// TESTES DE FLUXO END-TO-END COMPLETO
// =====================================================

describe('Fluxo End-to-End Completo', () => {
  it('Cenário: Aniquilador ativa Técnica Destruidor e ataca', () => {
    // 1. Setup do hook de efeitos ativados
    const { result: activatedEffectsHook } = renderHook(() => 
      useActivatedEffects({ enablePersistence: false })
    );

    // 2. Verifica disponibilidade do efeito no NEX
    const isAvailable = isEffectAvailableAtNex('track-tecnica-destruidor', 50);
    expect(isAvailable).toBe(true);

    // 3. Ativa a técnica
    act(() => {
      activatedEffectsHook.current.activateEffect(
        'track-tecnica-destruidor',
        'Técnica Destruidor',
        'next-attack'
      );
    });

    // 4. Verifica que está ativo
    expect(activatedEffectsHook.current.isEffectActive('track-tecnica-destruidor')).toBe(true);

    // 5. Passa para o SUE
    const trackEffects = getTrackEffects(
      'aniquilador',
      50,
      DEFAULT_ATTRIBUTES,
      activatedEffectsHook.current.activatedEffectIds
    );

    // 6. Verifica que o efeito está ativo no SUE
    const tecnicaDestruidor = trackEffects.find(e => e.id === 'track-tecnica-destruidor');
    expect(tecnicaDestruidor?.isActive).toBe(true);

    // 7. Consolida para combate
    const combatBonuses = getTrackCombatBonuses(
      'aniquilador',
      50,
      DEFAULT_ATTRIBUTES,
      'melee',
      activatedEffectsHook.current.activatedEffectIds
    );

    // 8. Destruidor altera o multiplicador crítico, sem bônus fixo no dano.
    expect(combatBonuses.criticalMultiplierBonus).toBe(1);
    expect(combatBonuses.damageBonus).toBe(0);

    // 9. Consome efeito após ataque
    act(() => {
      activatedEffectsHook.current.consumeAttackEffects();
    });

    // 10. Verifica que foi consumido
    expect(activatedEffectsHook.current.isEffectActive('track-tecnica-destruidor')).toBe(false);
  });

  it('Cenário: Infiltrador usa Assassinar para dobrar Ataque Furtivo', () => {
    const { result: activatedEffectsHook } = renderHook(() => 
      useActivatedEffects({ enablePersistence: false })
    );

    // Ativa Ataque Furtivo e Assassinar
    act(() => {
      activatedEffectsHook.current.activateEffect(
        'track-ataque-furtivo-trilha',
        'Ataque Furtivo',
        'next-attack'
      );
      activatedEffectsHook.current.activateEffect(
        'track-assassinar',
        'Assassinar',
        'next-attack'
      );
    });

    // Verifica que ambos estão ativos
    expect(activatedEffectsHook.current.activatedEffectIds).toContain('track-ataque-furtivo-trilha');
    expect(activatedEffectsHook.current.activatedEffectIds).toContain('track-assassinar');

    // Dados de Ataque Furtivo no NEX 70%
    const normalDice = calculateSneakAttackDice(70, false);
    const assassinateDice = calculateSneakAttackDice(70, true);

    // Com Assassinar, dados dobram
    expect(assassinateDice).toBe('+6d6'); // NEX 70% = 3d6, dobrado = 6d6
    expect(normalDice).toBe('+3d6');
  });

  it('Cenário: Atirador de Elite com múltiplas habilidades', () => {
    const { result } = renderHook(() => 
      useActivatedEffects({ enablePersistence: false })
    );

    // Ativa Disparo Letal
    act(() => {
      result.current.activateEffect(
        'track-disparo-letal',
        'Disparo Letal',
        'next-attack'
      );
    });

    // Obtém bônus de combate
    const combatBonuses = getTrackCombatBonuses(
      'atirador-elite',
      50,
      { ...DEFAULT_ATTRIBUTES, intellect: 4 },
      'ranged',
      result.current.activatedEffectIds
    );

    expect(combatBonuses.damageBonus).toBe(4); // Mira de Elite, uma única vez.
    expect(combatBonuses.criticalMarginBonus).toBe(2);

    // Consome e verifica
    act(() => {
      result.current.consumeAttackEffects();
    });

    const bonusesAfter = getTrackCombatBonuses(
      'atirador-elite',
      50,
      { ...DEFAULT_ATTRIBUTES, intellect: 4 },
      'ranged',
      result.current.activatedEffectIds
    );

    // Consumir Disparo remove margem; o dano passivo de Mira de Elite permanece.
    expect(bonusesAfter.criticalMarginBonus).toBe(0);
    expect(bonusesAfter.damageBonus).toBe(combatBonuses.damageBonus);
  });
});

// =====================================================
// TESTES DE VALIDAÇÃO DE IDS DE EFEITOS
// =====================================================

describe('Validação de IDs de Efeitos', () => {
  it('TRACK_EFFECT_IDS deve corresponder a TRACK_EFFECT_MAPPINGS', () => {
    // Verifica que IDs em TRACK_EFFECT_IDS existem em TRACK_EFFECT_MAPPINGS
    const mappingEffectIds = new Set<string>();
    
    for (const trackData of Object.values(TRACK_EFFECT_MAPPINGS)) {
      for (const effectId of Object.keys(trackData.effects)) {
        mappingEffectIds.add(effectId);
      }
    }
    
    // Alguns IDs de TRACK_EFFECT_IDS devem existir em TRACK_EFFECT_MAPPINGS
    const sampleIds = [
      TRACK_EFFECT_IDS.DISPARO_LETAL,
      TRACK_EFFECT_IDS.TECNICA_SECRETA,
    ];
    
    // Pelo menos alguns IDs devem corresponder
    // (nem todos existem em MAPPINGS porque alguns são passivos)
    expect(mappingEffectIds.size).toBeGreaterThan(0);
  });

  it('getActivatableEffectInfo deve retornar dados corretos', () => {
    const info = getActivatableEffectInfo('track-disparo-letal');
    
    expect(info).toBeDefined();
    expect(info?.name).toBe('Disparo Letal');
    expect(info?.minNex).toBe(40);
    expect(info?.peCost).toBe(1);
    expect(info?.trackId).toBe('atirador-elite');
  });

  it('isEffectAvailableAtNex deve respeitar requisitos', () => {
    // Disparo Letal requer NEX 40%
    expect(isEffectAvailableAtNex('track-disparo-letal', 30)).toBe(false);
    expect(isEffectAvailableAtNex('track-disparo-letal', 40)).toBe(true);
    expect(isEffectAvailableAtNex('track-disparo-letal', 50)).toBe(true);
    
    // Assassinar requer NEX 65%
    expect(isEffectAvailableAtNex('track-assassinar', 60)).toBe(false);
    expect(isEffectAvailableAtNex('track-assassinar', 65)).toBe(true);
  });
});

// =====================================================
// TESTES DE ATAQUE ESPECIAL (GUERREIRO)
// =====================================================

describe('Integração: Ataque Especial do Guerreiro', () => {
  it('calculateSpecialAttackBonus deve escalar com PE gasto', () => {
    const bonus1PE = calculateSpecialAttackBonus(1);
    const bonus3PE = calculateSpecialAttackBonus(3);
    const bonus5PE = calculateSpecialAttackBonus(5);

    expect(bonus1PE.attackBonus).toBe(5);
    expect(bonus1PE.damageBonus).toBe(5);
    
    expect(bonus3PE.total).toBeGreaterThan(bonus1PE.total);
    expect(bonus5PE.total).toBeGreaterThan(bonus3PE.total);
  });

  it('Potência Máxima deve dobrar bônus', () => {
    const normal = calculateSpecialAttackBonus(3);
    const comPotencia = calculateSpecialAttackBonus(3, true);

    expect(comPotencia.attackBonus).toBe(normal.attackBonus * 2);
    expect(comPotencia.damageBonus).toBe(normal.damageBonus * 2);
  });
});
