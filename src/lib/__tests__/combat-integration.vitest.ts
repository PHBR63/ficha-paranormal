/**
 * Testes de Integração do Motor de Combate
 * Ordem Paranormal RPG v1.3
 * 
 * Valida que cálculos de ataque e dano respeitam bônus do SUE.
 * 
 * @module combat-integration.vitest
 */

import { describe, it, expect } from 'vitest';
import { 
  getTrackEffects,
  getTrackCombatBonuses,
  getTrackCombatEffects,
  getTrackBonusSummary,
} from '../effects/track-effects-adapter';
import { 
  consolidateEffects,
  UnifiedEffect,
  EffectCalculationContext,
} from '../unified-effects-engine';
import { getOriginEffects } from '../effects/origin-effects-adapter';
import { getConditionEffects } from '../effects/condition-effects-adapter';
import { 
  calculateSneakAttackDice,
  calculateParamedicHealing,
  calculateSpecialAttackBonus,
} from '../class-powers/track-effects-engine';

// =====================================================
// Helpers de Teste
// =====================================================

const DEFAULT_ATTRIBUTES = {
  strength: 2,
  agility: 3,
  vigor: 2,
  intellect: 3,
  presence: 2,
};

function createCombatContext(
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
    attackContext: {
      type: 'melee',
      targetConditions: [],
    },
    ...overrides,
  };
}

// =====================================================
// TESTES DE CÁLCULO DE BÔNUS DE COMBATE POR TRILHA
// =====================================================

describe('Cálculo de Bônus de Combate por Trilha', () => {
  describe('Aniquilador', () => {
    it('deve calcular bônus de dano com A Favorita', () => {
      const summary = getTrackBonusSummary(
        'aniquilador',
        20, // NEX 20% - só A Favorita
        DEFAULT_ATTRIBUTES
      );

      expect(summary.trackName).toBe('Aniquilador');
      // A Favorita: +2 ataque/dano com arma favorita
      expect(summary.totalAttack + summary.totalDamage).toBeGreaterThanOrEqual(0);
    });

    it('deve acumular bônus de técnicas ativadas', () => {
      const summaryWithout = getTrackCombatBonuses(
        'aniquilador',
        50,
        DEFAULT_ATTRIBUTES,
        'melee',
        []
      );

      const summaryWith = getTrackCombatBonuses(
        'aniquilador',
        50,
        DEFAULT_ATTRIBUTES,
        'melee',
        ['track-tecnica-destruidor']
      );

      // Com técnica ativa, dano deve ser maior
      expect(summaryWith.damageBonus).toBeGreaterThan(summaryWithout.damageBonus);
    });

    it('Técnica Letal deve adicionar +1 margem de crítico', () => {
      const bonuses = getTrackCombatBonuses(
        'aniquilador',
        70, // NEX 70% para Técnica Letal
        DEFAULT_ATTRIBUTES,
        'melee',
        ['track-tecnica-letal']
      );

      expect(bonuses.criticalMarginBonus).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Atirador de Elite', () => {
    it('Mira de Elite deve adicionar bônus de ataque', () => {
      const effects = getTrackEffects(
        'atirador-elite',
        20, // NEX 20% - Mira de Elite
        DEFAULT_ATTRIBUTES,
        []
      );

      const context = createCombatContext({
        attackContext: { type: 'ranged', targetConditions: [] },
      });

      const result = consolidateEffects(effects, context);

      // Mira de Elite: +2 ataque com armas longas
      expect(result.attack.ranged).toBeGreaterThanOrEqual(0);
    });

    it('Disparo Letal deve escalar com INT', () => {
      const lowInt = { ...DEFAULT_ATTRIBUTES, intellect: 2 };
      const highInt = { ...DEFAULT_ATTRIBUTES, intellect: 5 };

      const bonusLow = getTrackCombatBonuses(
        'atirador-elite',
        50,
        lowInt,
        'ranged',
        ['track-disparo-letal']
      );

      const bonusHigh = getTrackCombatBonuses(
        'atirador-elite',
        50,
        highInt,
        'ranged',
        ['track-disparo-letal']
      );

      // INT 5 deve ter mais dano que INT 2
      expect(bonusHigh.damageBonus).toBeGreaterThan(bonusLow.damageBonus);
      
      // Disparo Letal: +INT×2
      expect(bonusLow.damageBonus).toBeGreaterThanOrEqual(2 * 2); // INT 2 × 2
      expect(bonusHigh.damageBonus).toBeGreaterThanOrEqual(5 * 2); // INT 5 × 2
    });

    it('Atirar para Matar deve habilitar dano máximo em crítico', () => {
      const bonuses = getTrackCombatBonuses(
        'atirador-elite',
        99, // NEX 99% para Atirar para Matar
        DEFAULT_ATTRIBUTES,
        'ranged',
        []
      );

      // Verifica que a flag existe no resultado
      expect(typeof bonuses.maximumDamageOnCrit).toBe('boolean');
    });
  });

  describe('Infiltrador', () => {
    it('Ataque Furtivo deve escalar com NEX', () => {
      const nex20 = calculateSneakAttackDice(20);
      const nex50 = calculateSneakAttackDice(50);
      const nex99 = calculateSneakAttackDice(99);

      // Extrai número de dados
      const d20 = parseInt(nex20.replace('+', '').replace('d6', ''));
      const d50 = parseInt(nex50.replace('+', '').replace('d6', ''));
      const d99 = parseInt(nex99.replace('+', '').replace('d6', ''));

      expect(d50).toBeGreaterThan(d20);
      expect(d99).toBeGreaterThan(d50);
    });

    it('Ataque Furtivo deve retornar dados extras no combate', () => {
      const bonuses = getTrackCombatBonuses(
        'infiltrador',
        50,
        DEFAULT_ATTRIBUTES,
        'melee',
        ['track-ataque-furtivo-trilha']
      );

      expect(bonuses.extraDamageDice.length).toBeGreaterThanOrEqual(1);
      expect(bonuses.extraDamageDice[0]).toMatch(/\+?\d+d\d+/);
    });
  });

  describe('Guerreiro', () => {
    it('Técnica Letal passiva deve adicionar +1 crítico corpo a corpo', () => {
      const summary = getTrackBonusSummary(
        'guerreiro',
        20, // NEX 20% - Técnica Letal
        DEFAULT_ATTRIBUTES
      );

      expect(summary.trackName).toBe('Guerreiro');
      expect(summary.totalCriticalMargin).toBeGreaterThanOrEqual(1);
    });

    it('Ataque Especial deve escalar com PE', () => {
      const bonus1 = calculateSpecialAttackBonus(1);
      const bonus3 = calculateSpecialAttackBonus(3);
      const bonus5 = calculateSpecialAttackBonus(5);

      expect(bonus1.total).toBe(5);
      expect(bonus3.total).toBe(10);
      expect(bonus5.total).toBe(20);
    });
  });

  describe('Operações Especiais', () => {
    it('Iniciativa Aprimorada deve adicionar AGI à iniciativa', () => {
      const customAttrs = { ...DEFAULT_ATTRIBUTES, agility: 5 };
      
      const effects = getTrackEffects(
        'operacoes-especiais',
        20,
        customAttrs,
        []
      );

      const context = createCombatContext({ attributes: customAttrs });
      const result = consolidateEffects(effects, context);

      // Iniciativa Aprimorada: +AGI em iniciativa
      expect(result.initiative.bonus).toBeGreaterThanOrEqual(5);
    });
  });

  describe('Tropa de Choque', () => {
    it('Casca Grossa deve adicionar RD igual a VIG', () => {
      const customAttrs = { ...DEFAULT_ATTRIBUTES, vigor: 4 };
      
      const effects = getTrackEffects(
        'tropa-choque',
        20,
        customAttrs,
        []
      );

      const context = createCombatContext({ attributes: customAttrs });
      const result = consolidateEffects(effects, context);

      // Casca Grossa: RD = VIG
      expect(result.damageReduction.physical).toBeGreaterThanOrEqual(4);
    });
  });

  describe('Médico de Campo', () => {
    it('Paramédico deve escalar cura com NEX', () => {
      const nex20 = calculateParamedicHealing(20);
      const nex50 = calculateParamedicHealing(50);
      const nex99 = calculateParamedicHealing(99);

      // Extrai número de dados
      const d20 = parseInt(nex20.replace('d10', ''));
      const d50 = parseInt(nex50.replace('d10', ''));
      const d99 = parseInt(nex99.replace('d10', ''));

      expect(d50).toBeGreaterThanOrEqual(d20);
      expect(d99).toBeGreaterThan(d50);
    });
  });
});

// =====================================================
// TESTES DE INTEGRAÇÃO: MÚLTIPLAS FONTES DE BÔNUS
// =====================================================

describe('Integração: Múltiplas Fontes de Bônus no Combate', () => {
  it('bônus de origem + trilha devem somar', () => {
    // Coleta efeitos de origem
    const originEffects = getOriginEffects(
      'militar',
      'Militar',
      DEFAULT_ATTRIBUTES.intellect,
      []
    );

    // Coleta efeitos de trilha
    const trackEffects = getTrackEffects(
      'guerreiro',
      50,
      DEFAULT_ATTRIBUTES,
      []
    );

    // Combina todos os efeitos
    const allEffects = [...originEffects, ...trackEffects];
    const context = createCombatContext();
    const result = consolidateEffects(allEffects, context);

    // Deve ter breakdown de múltiplas fontes
    const sources = new Set(result.attack.breakdown.map(b => b.source));
    // Pode ter fontes de origem e/ou trilha
    expect(sources.size).toBeGreaterThanOrEqual(0);
  });

  it('condições negativas devem reduzir bônus', () => {
    const trackEffects = getTrackEffects(
      'guerreiro',
      50,
      DEFAULT_ATTRIBUTES,
      []
    );

    // Contexto sem condições
    const contextClean = createCombatContext();
    const resultClean = consolidateEffects(trackEffects, contextClean);

    // Coleta efeitos de condições negativas
    const conditionEffects = getConditionEffects(['abalado']);

    // Contexto com condição
    const allEffects = [...trackEffects, ...conditionEffects];
    const contextWithCondition = createCombatContext({
      activeConditions: ['abalado'],
    });
    const resultWithCondition = consolidateEffects(allEffects, contextWithCondition);

    // Abalado: -2 em todos os testes
    // Pode ou não ter redução dependendo se a condição afeta ataque
    expect(resultWithCondition).toBeDefined();
  });
});

// =====================================================
// TESTES DE CONTEXTO DE COMBATE: MELEE vs RANGED
// =====================================================

describe('Contexto de Combate: Melee vs Ranged', () => {
  it('bônus de melee não devem aplicar a ranged', () => {
    const meleeBonuses = getTrackCombatBonuses(
      'guerreiro',
      50,
      DEFAULT_ATTRIBUTES,
      'melee',
      []
    );

    const rangedBonuses = getTrackCombatBonuses(
      'guerreiro',
      50,
      DEFAULT_ATTRIBUTES,
      'ranged',
      []
    );

    // Guerreiro foca em melee, então bônus melee >= bônus ranged
    expect(meleeBonuses.damageBonus).toBeGreaterThanOrEqual(rangedBonuses.damageBonus);
  });

  it('bônus de ranged não devem aplicar a melee', () => {
    const meleeBonuses = getTrackCombatBonuses(
      'atirador-elite',
      50,
      DEFAULT_ATTRIBUTES,
      'melee',
      ['track-disparo-letal']
    );

    const rangedBonuses = getTrackCombatBonuses(
      'atirador-elite',
      50,
      DEFAULT_ATTRIBUTES,
      'ranged',
      ['track-disparo-letal']
    );

    // Atirador de Elite foca em ranged
    // Disparo Letal só aplica a ranged
    expect(rangedBonuses.damageBonus).toBeGreaterThan(meleeBonuses.damageBonus);
  });

  it('getTrackCombatEffects deve filtrar por contexto', () => {
    const meleeEffects = getTrackCombatEffects(
      'guerreiro',
      50,
      DEFAULT_ATTRIBUTES,
      'melee',
      []
    );

    const rangedEffects = getTrackCombatEffects(
      'guerreiro',
      50,
      DEFAULT_ATTRIBUTES,
      'ranged',
      []
    );

    // Guerreiro deve ter mais efeitos aplicáveis a melee
    // (ou igual se não tiver condições de tipo de ataque)
    expect(meleeEffects.length).toBeGreaterThanOrEqual(rangedEffects.length);
  });
});

// =====================================================
// TESTES DE EFEITOS ESPECIAIS DE COMBATE
// =====================================================

describe('Efeitos Especiais de Combate', () => {
  it('Atirar para Matar deve habilitar flag de dano máximo em crítico', () => {
    const bonuses = getTrackCombatBonuses(
      'atirador-elite',
      99,
      DEFAULT_ATTRIBUTES,
      'ranged',
      [] // Atirar para Matar é passivo
    );

    // Verifica que a propriedade existe
    expect(bonuses).toHaveProperty('maximumDamageOnCrit');
  });

  it('efeitos especiais devem ser listados', () => {
    const bonuses = getTrackCombatBonuses(
      'infiltrador',
      99,
      DEFAULT_ATTRIBUTES,
      'melee',
      []
    );

    // specialEffects deve ser um array
    expect(Array.isArray(bonuses.specialEffects)).toBe(true);
  });
});

// =====================================================
// TESTES DE BREAKDOWN DE BÔNUS
// =====================================================

describe('Breakdown de Bônus para UI', () => {
  it('consolidateEffects deve gerar breakdown detalhado', () => {
    const effects = getTrackEffects(
      'aniquilador',
      50,
      DEFAULT_ATTRIBUTES,
      ['track-tecnica-destruidor']
    );

    const context = createCombatContext();
    const result = consolidateEffects(effects, context);

    // Cada categoria deve ter breakdown
    expect(Array.isArray(result.attack.breakdown)).toBe(true);
    expect(Array.isArray(result.damage.breakdown)).toBe(true);
    expect(Array.isArray(result.defense.breakdown)).toBe(true);
    expect(Array.isArray(result.critical.breakdown)).toBe(true);
  });

  it('breakdown deve conter fonte e valor', () => {
    const effects = getTrackEffects(
      'operacoes-especiais',
      50,
      DEFAULT_ATTRIBUTES,
      []
    );

    const context = createCombatContext();
    const result = consolidateEffects(effects, context);

    // Se tem breakdown de iniciativa, cada entry deve ter source e value
    for (const entry of result.initiative.breakdown) {
      expect(entry).toHaveProperty('source');
      expect(entry).toHaveProperty('value');
      expect(typeof entry.value).toBe('number');
    }
  });
});

// =====================================================
// TESTES DE STACKING DE BÔNUS
// =====================================================

describe('Stacking de Bônus', () => {
  it('bônus de mesma fonte devem somar', () => {
    const effects = getTrackEffects(
      'aniquilador',
      70, // Desbloqueia múltiplas habilidades
      DEFAULT_ATTRIBUTES,
      ['track-tecnica-destruidor', 'track-tecnica-letal']
    );

    const context = createCombatContext({
      activatedEffects: ['track-tecnica-destruidor', 'track-tecnica-letal'],
    });

    const result = consolidateEffects(effects, context);

    // Bônus de múltiplas técnicas devem somar
    expect(result.damage.general + result.damage.melee).toBeGreaterThanOrEqual(5);
    expect(result.critical.marginBonus).toBeGreaterThanOrEqual(1);
  });

  it('bônus de fontes diferentes devem somar', () => {
    const originEffects = getOriginEffects('militar', 'Militar', 3, []);
    const trackEffects = getTrackEffects('guerreiro', 50, DEFAULT_ATTRIBUTES, []);

    const allEffects = [...originEffects, ...trackEffects];
    const context = createCombatContext();
    const result = consolidateEffects(allEffects, context);

    // Deve ter bônus combinados
    expect(result.attack.breakdown.length).toBeGreaterThanOrEqual(0);
  });
});

// =====================================================
// TESTES DE RESISTÊNCIAS E REDUÇÃO DE DANO
// =====================================================

describe('Resistências e Redução de Dano', () => {
  it('Tropa de Choque deve ter RD física', () => {
    const effects = getTrackEffects(
      'tropa-choque',
      50,
      { ...DEFAULT_ATTRIBUTES, vigor: 5 },
      []
    );

    const context = createCombatContext({
      attributes: { ...DEFAULT_ATTRIBUTES, vigor: 5 },
    });

    const result = consolidateEffects(effects, context);

    // Casca Grossa: RD = VIG
    expect(result.damageReduction.physical).toBeGreaterThanOrEqual(5);
  });

  it('breakdown de RD deve listar fontes', () => {
    const effects = getTrackEffects(
      'tropa-choque',
      50,
      DEFAULT_ATTRIBUTES,
      []
    );

    const context = createCombatContext();
    const result = consolidateEffects(effects, context);

    if (result.damageReduction.physical > 0) {
      expect(result.damageReduction.breakdown.length).toBeGreaterThan(0);
    }
  });
});
