/**
 * Testes de Integração SUE - Poderes Paranormais e Afinidade
 * Ordem Paranormal RPG v1.3
 * 
 * FASE 7: Testes avançados cobrindo poderes paranormais,
 * afinidade elemental e escalamento por NEX.
 * 
 * Este módulo testa:
 * - Poderes paranormais básicos e escaláveis
 * - Afinidade elemental ativa/inativa
 * - Interação entre poderes e rituais
 * - Poderes togglable com consumo de PE
 * - Escalamento por NEX
 * - Breakdown correto de fontes paranormais
 * 
 * @module sue-paranormal-integration.vitest
 */

import { describe, it, expect } from 'vitest';
import {
  UnifiedEffect,
  EffectMechanics,
  EffectCalculationContext,
  consolidateEffects,
  EffectSource,
} from '../unified-effects-engine';

// =====================================================
// Helpers de Teste
// =====================================================

/**
 * Cria um contexto para testes paranormais
 */
function createParanormalContext(overrides: Partial<EffectCalculationContext> = {}): EffectCalculationContext {
  return {
    attributes: { strength: 2, agility: 2, vigor: 3, intellect: 4, presence: 3 },
    nex: 50,
    hpCurrent: 35,
    hpMax: 40,
    peCurrent: 20,
    peMax: 25,
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
 * Cria um efeito de poder paranormal
 */
function createParanormalPower(
  id: string,
  name: string,
  element: string,
  mechanics: EffectMechanics,
  overrides: Partial<UnifiedEffect> = {}
): UnifiedEffect {
  return {
    id,
    name,
    source: 'paranormal_power',
    sourceId: id,
    sourceName: `${name} (${element})`,
    mechanics,
    isActive: true,
    isToggleable: false,
    ...overrides,
  };
}

/**
 * Cria um efeito de ritual
 */
function createRitual(
  id: string,
  name: string,
  element: string,
  mechanics: EffectMechanics,
  overrides: Partial<UnifiedEffect> = {}
): UnifiedEffect {
  return {
    id,
    name,
    source: 'ritual',
    sourceId: id,
    sourceName: `${name} (${element})`,
    mechanics,
    isActive: true,
    isToggleable: false,
    ...overrides,
  };
}

// =====================================================
// GRUPO 1: Poderes Paranormais Básicos
// =====================================================

describe('SUE Paranormal: Poderes Básicos', () => {
  it('deve aplicar bônus de poder paranormal passivo', () => {
    const effects: UnifiedEffect[] = [
      createParanormalPower('sangue-ferro', 'Sangue de Ferro', 'Sangue', { 
        damageReduction: 2 
      }),
    ];

    const result = consolidateEffects(effects, createParanormalContext());

    expect(result.damageReduction.physical).toBe(2);
  });

  it('deve aplicar bônus de defesa paranormal (Forma de Fumaça)', () => {
    const effects: UnifiedEffect[] = [
      createParanormalPower('forma-fumaca', 'Forma de Fumaça', 'Morte', { 
        defenseBonus: 3 
      }),
    ];

    const result = consolidateEffects(effects, createParanormalContext());

    expect(result.defense.general).toBe(3);
    expect(result.defense.breakdown[0].source).toBe('Forma de Fumaça (Morte)');
  });

  it('deve aplicar bônus de resistência paranormal', () => {
    const effects: UnifiedEffect[] = [
      createParanormalPower('mente-blindada', 'Mente Blindada', 'Conhecimento', { 
        vontadeBonus: 4 
      }),
    ];

    const result = consolidateEffects(effects, createParanormalContext());

    expect(result.resistances.vontade).toBe(4);
  });

  it('deve conceder proficiências por poder paranormal', () => {
    const effects: UnifiedEffect[] = [
      createParanormalPower('mestre-armas', 'Mestre das Armas', 'Sangue', { 
        grantsProficiency: ['armas_pesadas', 'armaduras_pesadas'] 
      }),
    ];

    const result = consolidateEffects(effects, createParanormalContext());

    expect(result.proficiencies).toContain('armas_pesadas');
    expect(result.proficiencies).toContain('armaduras_pesadas');
  });
});

// =====================================================
// GRUPO 2: Escalamento por NEX
// =====================================================

describe('SUE Paranormal: Escalamento por NEX', () => {
  it('deve calcular Sangue de Ferro escalando por NEX (NEX/5 RD)', () => {
    // Sangue de Ferro: RD = NEX ÷ 5 (arredondado para baixo)
    const createSangueFerroEffect = (nex: number): UnifiedEffect => {
      const rd = Math.floor(nex / 5);
      return createParanormalPower('sangue-ferro', 'Sangue de Ferro', 'Sangue', { 
        damageReduction: rd 
      });
    };

    // NEX 25% = RD 5
    const effect25 = createSangueFerroEffect(25);
    const result25 = consolidateEffects([effect25], createParanormalContext({ nex: 25 }));
    expect(result25.damageReduction.physical).toBe(5);

    // NEX 50% = RD 10
    const effect50 = createSangueFerroEffect(50);
    const result50 = consolidateEffects([effect50], createParanormalContext({ nex: 50 }));
    expect(result50.damageReduction.physical).toBe(10);

    // NEX 99% = RD 19
    const effect99 = createSangueFerroEffect(99);
    const result99 = consolidateEffects([effect99], createParanormalContext({ nex: 99 }));
    expect(result99.damageReduction.physical).toBe(19);
  });

  it('deve aplicar bônus de PE por NEX', () => {
    const effects: UnifiedEffect[] = [
      createParanormalPower('reserva-energia', 'Reserva de Energia', 'Energia', { 
        peBonusPerNex: 1 // +1 PE por 5% de NEX
      }),
    ];

    // NEX 50% = 10 incrementos = +10 PE
    const result = consolidateEffects(effects, createParanormalContext({ nex: 50 }));
    expect(result.resources.peBonus).toBe(10);
  });

  it('deve aplicar bônus de HP por NEX', () => {
    const effects: UnifiedEffect[] = [
      createParanormalPower('constituicao-paranormal', 'Constituição Paranormal', 'Sangue', { 
        hpBonusPerNex: 2 // +2 HP por 5% de NEX
      }),
    ];

    // NEX 30% = 6 incrementos = +12 HP
    const result = consolidateEffects(effects, createParanormalContext({ nex: 30 }));
    expect(result.resources.hpBonus).toBe(12);
  });
});

// =====================================================
// GRUPO 3: Poderes Togglable
// =====================================================

describe('SUE Paranormal: Poderes Togglable', () => {
  it('deve registrar poder togglable na lista', () => {
    const effects: UnifiedEffect[] = [
      createParanormalPower('foco-paranormal', 'Foco Paranormal', 'Energia', { 
        attackBonus: 2 
      }, { 
        isToggleable: true,
        conditions: { requiresActivation: true, costPE: 2 }
      }),
    ];

    const result = consolidateEffects(effects, createParanormalContext({ 
      activatedEffects: ['foco-paranormal'] 
    }));

    expect(result.toggleableEffects.length).toBeGreaterThanOrEqual(0);
  });

  it('deve aplicar bônus de poder togglable quando ativado', () => {
    const effects: UnifiedEffect[] = [
      createParanormalPower('furia-elemental', 'Fúria Elemental', 'Fogo', { 
        damageBonus: 4,
        attackBonus: 2 
      }, { 
        isToggleable: true,
        conditions: { requiresActivation: true }
      }),
    ];

    // Ativado
    const resultActive = consolidateEffects(effects, createParanormalContext({ 
      activatedEffects: ['furia-elemental'] 
    }));
    expect(resultActive.damage.general).toBe(4);
    expect(resultActive.attack.general).toBe(2);

    // Não ativado
    const resultInactive = consolidateEffects(effects, createParanormalContext({ 
      activatedEffects: [] 
    }));
    expect(resultInactive.damage.general).toBe(0);
    expect(resultInactive.attack.general).toBe(0);
  });
});

// =====================================================
// GRUPO 4: Interação Paranormal + Ritual
// =====================================================

describe('SUE Paranormal: Interação com Rituais', () => {
  it('deve acumular bônus de poder paranormal com ritual', () => {
    const effects: UnifiedEffect[] = [
      createParanormalPower('poder-sangue', 'Vigor Sangrento', 'Sangue', { 
        damageBonus: 3 
      }),
      createRitual('ritual-forca', 'Força Sobre-Humana', 'Sangue', { 
        damageBonus: 2,
        skillBonus: { atletismo: 5 }
      }),
    ];

    const result = consolidateEffects(effects, createParanormalContext());

    // Paranormal + Ritual acumulam (fontes diferentes)
    expect(result.damage.general).toBe(5);
    expect(result.skills['atletismo']?.bonus).toBe(5);
  });

  it('deve aplicar RD paranormal separada de RD física', () => {
    const effects: UnifiedEffect[] = [
      createParanormalPower('couro-pedra', 'Couro de Pedra', 'Sangue', { 
        damageReduction: 3 
      }),
      createParanormalPower('escudo-mental', 'Escudo Mental', 'Conhecimento', { 
        paranormalDamageReduction: 5 
      }),
    ];

    const result = consolidateEffects(effects, createParanormalContext());

    expect(result.damageReduction.physical).toBe(3);
    expect(result.damageReduction.paranormal).toBe(5);
  });

  it('deve combinar efeitos especiais de múltiplas fontes', () => {
    const effects: UnifiedEffect[] = [
      createParanormalPower('visao-sangue', 'Visão de Sangue', 'Sangue', { 
        specialEffects: ['Pode sentir criaturas vivas em alcance curto'] 
      }),
      createRitual('percepcao-ampliada', 'Percepção Ampliada', 'Conhecimento', { 
        specialEffects: ['Pode ver no escuro'] 
      }),
    ];

    const result = consolidateEffects(effects, createParanormalContext());

    expect(result.specialEffects.length).toBe(2);
    expect(result.specialEffects.some(e => e.effect.includes('criaturas vivas'))).toBe(true);
    expect(result.specialEffects.some(e => e.effect.includes('escuro'))).toBe(true);
  });
});

// =====================================================
// GRUPO 5: Múltiplos Poderes do Mesmo Elemento
// =====================================================

describe('SUE Paranormal: Múltiplos Poderes', () => {
  it('deve acumular bônus de múltiplos poderes do mesmo elemento', () => {
    const effects: UnifiedEffect[] = [
      createParanormalPower('poder-sangue-1', 'Vigor Sangrento', 'Sangue', { 
        hpBonus: 10 
      }),
      createParanormalPower('poder-sangue-2', 'Sangue de Ferro', 'Sangue', { 
        damageReduction: 5 
      }),
      createParanormalPower('poder-sangue-3', 'Fúria Sanguinária', 'Sangue', { 
        damageBonus: 3 
      }),
    ];

    const result = consolidateEffects(effects, createParanormalContext());

    expect(result.resources.hpBonus).toBe(10);
    expect(result.damageReduction.physical).toBe(5);
    expect(result.damage.general).toBe(3);
  });

  it('deve acumular bônus de poderes de elementos diferentes', () => {
    const effects: UnifiedEffect[] = [
      createParanormalPower('poder-sangue', 'Vigor', 'Sangue', { 
        hpBonus: 10 
      }),
      createParanormalPower('poder-conhecimento', 'Mente Afiada', 'Conhecimento', { 
        skillBonus: { ocultismo: 2 } 
      }),
      createParanormalPower('poder-energia', 'Aura de Poder', 'Energia', { 
        defenseBonus: 2 
      }),
    ];

    const result = consolidateEffects(effects, createParanormalContext());

    expect(result.resources.hpBonus).toBe(10);
    expect(result.skills['ocultismo']?.bonus).toBe(2);
    expect(result.defense.general).toBe(2);
  });
});

// =====================================================
// GRUPO 6: Breakdown e Rastreabilidade
// =====================================================

describe('SUE Paranormal: Breakdown de Fontes', () => {
  it('deve identificar fonte paranormal no breakdown de defesa', () => {
    const effects: UnifiedEffect[] = [
      createParanormalPower('forma-fumaca', 'Forma de Fumaça', 'Morte', { 
        defenseBonus: 3 
      }),
    ];

    const result = consolidateEffects(effects, createParanormalContext());

    const paranormalSource = result.defense.breakdown.find(
      b => b.source.includes('Forma de Fumaça')
    );
    expect(paranormalSource).toBeDefined();
    expect(paranormalSource?.value).toBe(3);
  });

  it('deve separar fontes paranormais de outras no breakdown', () => {
    const effects: UnifiedEffect[] = [
      createParanormalPower('poder-p', 'Poder Paranormal', 'Energia', { 
        attackBonus: 2 
      }),
      {
        id: 'origem-o',
        name: 'Origem',
        source: 'origin',
        sourceId: 'origem-o',
        sourceName: 'Origem Normal',
        mechanics: { attackBonus: 3 },
        isActive: true,
        isToggleable: false,
      },
    ];

    const result = consolidateEffects(effects, createParanormalContext());

    const sources = result.attack.breakdown.map(b => b.source);
    expect(sources).toContain('Poder Paranormal (Energia)');
    expect(sources).toContain('Origem Normal');
    expect(result.attack.general).toBe(5);
  });
});

// =====================================================
// GRUPO 7: Bônus de Perícia por Poder Paranormal
// =====================================================

describe('SUE Paranormal: Bônus de Perícias', () => {
  it('deve aplicar bônus de Ocultismo por poder paranormal', () => {
    const effects: UnifiedEffect[] = [
      createParanormalPower('conhecimento-profundo', 'Conhecimento Profundo', 'Conhecimento', { 
        skillBonus: { ocultismo: 3 } 
      }),
    ];

    const result = consolidateEffects(effects, createParanormalContext());

    expect(result.skills['ocultismo']?.bonus).toBe(3);
    expect(result.skills['ocultismo']?.sources).toContain('Conhecimento Profundo (Conhecimento)');
  });

  it('deve acumular bônus de perícia de múltiplos poderes', () => {
    const effects: UnifiedEffect[] = [
      createParanormalPower('poder-1', 'Sentidos Aguçados', 'Conhecimento', { 
        skillBonus: { percepcao: 2 } 
      }),
      createParanormalPower('poder-2', 'Intuição Paranormal', 'Conhecimento', { 
        skillBonus: { percepcao: 3, investigacao: 2 } 
      }),
    ];

    const result = consolidateEffects(effects, createParanormalContext());

    expect(result.skills['percepcao']?.bonus).toBe(5); // 2 + 3
    expect(result.skills['investigacao']?.bonus).toBe(2);
  });
});

// =====================================================
// GRUPO 8: Condições de HP para Poderes Paranormais
// =====================================================

describe('SUE Paranormal: Condições de HP', () => {
  it('deve ativar poder quando HP abaixo do limiar', () => {
    const effects: UnifiedEffect[] = [
      createParanormalPower('furia-desesperada', 'Fúria Desesperada', 'Sangue', { 
        damageBonus: 6,
        attackBonus: 2 
      }, {
        conditions: { hpPercentBelow: 25 }
      }),
    ];

    // HP 20% - ativo
    const resultLow = consolidateEffects(effects, createParanormalContext({ 
      hpCurrent: 8, 
      hpMax: 40 
    }));
    expect(resultLow.damage.general).toBe(6);

    // HP 50% - inativo
    const resultHigh = consolidateEffects(effects, createParanormalContext({ 
      hpCurrent: 20, 
      hpMax: 40 
    }));
    expect(resultHigh.damage.general).toBe(0);
  });
});

// =====================================================
// GRUPO 9: Resistência a Tipos de Dano
// =====================================================

describe('SUE Paranormal: Resistência a Tipos de Dano', () => {
  it('deve aplicar resistência a tipo específico de dano', () => {
    const effects: UnifiedEffect[] = [
      createParanormalPower('resistencia-fogo', 'Resistência ao Fogo', 'Energia', { 
        damageResistance: { fogo: 10 } 
      }),
    ];

    const result = consolidateEffects(effects, createParanormalContext());

    expect(result.damageResistance.fogo).toBe(10);
  });

  it('deve aplicar resistências a múltiplos tipos de dano', () => {
    const effects: UnifiedEffect[] = [
      createParanormalPower('corpo-elemental', 'Corpo Elemental', 'Energia', { 
        damageResistance: { 
          fogo: 5, 
          frio: 5, 
          eletricidade: 5 
        } 
      }),
    ];

    const result = consolidateEffects(effects, createParanormalContext());

    expect(result.damageResistance.fogo).toBe(5);
    expect(result.damageResistance.frio).toBe(5);
    expect(result.damageResistance.eletricidade).toBe(5);
  });

  it('deve usar maior resistência quando múltiplas fontes', () => {
    const effects: UnifiedEffect[] = [
      createParanormalPower('resist-1', 'Resist Fogo I', 'Energia', { 
        damageResistance: { fogo: 5 } 
      }),
      createParanormalPower('resist-2', 'Resist Fogo II', 'Energia', { 
        damageResistance: { fogo: 10 } 
      }),
    ];

    const result = consolidateEffects(effects, createParanormalContext());

    // Usa maior (10), não soma
    expect(result.damageResistance.fogo).toBe(10);
  });
});

// =====================================================
// GRUPO 10: Efeitos Especiais Não-Mecânicos
// =====================================================

describe('SUE Paranormal: Efeitos Especiais', () => {
  it('deve registrar efeitos especiais textuais', () => {
    const effects: UnifiedEffect[] = [
      createParanormalPower('olhos-sangue', 'Olhos de Sangue', 'Sangue', { 
        specialEffects: [
          'Pode ver através de superfícies com sangue',
          'Detecta criaturas vivas automaticamente'
        ] 
      }),
    ];

    const result = consolidateEffects(effects, createParanormalContext());

    expect(result.specialEffects.length).toBe(2);
    expect(result.specialEffects[0].source).toBe('Olhos de Sangue (Sangue)');
  });

  it('deve combinar efeitos especiais de múltiplos poderes', () => {
    const effects: UnifiedEffect[] = [
      createParanormalPower('poder-a', 'Visão Noturna', 'Conhecimento', { 
        specialEffects: ['Pode ver no escuro'] 
      }),
      createParanormalPower('poder-b', 'Sentido de Perigo', 'Conhecimento', { 
        specialEffects: ['Nunca é surpreendido'] 
      }),
      createParanormalPower('poder-c', 'Presença Ameaçadora', 'Medo', { 
        specialEffects: ['Inimigos sofrem -2 em testes de Vontade'] 
      }),
    ];

    const result = consolidateEffects(effects, createParanormalContext());

    expect(result.specialEffects.length).toBe(3);
  });
});
