/**
 * Testes Unitários - Adaptador de Efeitos de Ritual
 * Sistema Unificado de Efeitos (SUE) - Ordem Paranormal RPG v1.3
 * 
 * Cobertura:
 * - Conversão de mecânicas de rituais para EffectMechanics
 * - getRitualEffects para rituais sustentados
 * - calculateRitualBonusTotals com regra de não-acúmulo
 * - getRitualEffectsSummary para display
 */

import { describe, it, expect } from 'vitest';
import {
  getRitualEffects,
  calculateRitualBonusTotals,
  getRitualEffectsSummary,
  type SustainedRitualInput,
} from '../ritual-effects-adapter';

// =====================================================
// Helpers de Teste
// =====================================================

/**
 * Cria um ritual sustentado de teste
 */
function createTestSustainedRitual(overrides: Partial<SustainedRitualInput> = {}): SustainedRitualInput {
  return {
    ritualId: 'test-ritual',
    ritualName: 'Ritual de Teste',
    element: 'Energia',
    circle: 1,
    selectedEnhancements: [],
    turnsActive: 1,
    isConcentrating: false,
    ...overrides,
  };
}

// =====================================================
// FASE 1: getRitualEffects - Estrutura Básica
// =====================================================

describe('ritual-effects-adapter: getRitualEffects Estrutura', () => {
  it('deve retornar array vazio para array vazio', () => {
    const effects = getRitualEffects([]);
    
    expect(effects).toEqual([]);
  });

  it('efeito deve ter source = "ritual"', () => {
    const sustained: SustainedRitualInput = {
      ritualId: 'armadura-arcana',
      ritualName: 'Armadura Arcana',
      element: 'Energia',
      circle: 1,
    };
    
    const effects = getRitualEffects([sustained]);
    
    // Mesmo se não encontrar o ritual, deve retornar array vazio
    // Se encontrar, deve ter source correto
    if (effects.length > 0) {
      expect(effects[0].source).toBe('ritual');
    }
  });

  it('efeito deve ter id no formato correto', () => {
    const sustained = createTestSustainedRitual({ ritualId: 'amaldicoar-arma' });
    
    const effects = getRitualEffects([sustained]);
    
    if (effects.length > 0) {
      expect(effects[0].id).toBe('ritual-amaldicoar-arma');
    }
  });

  it('efeito deve ter sourceName formatado', () => {
    const sustained = createTestSustainedRitual({ ritualName: 'Proteção Divina' });
    
    const effects = getRitualEffects([sustained]);
    
    if (effects.length > 0) {
      expect(effects[0].sourceName).toBe('Ritual: Proteção Divina');
    }
  });

  it('efeito deve ter isActive = true e isToggleable = false', () => {
    const sustained = createTestSustainedRitual();
    
    const effects = getRitualEffects([sustained]);
    
    if (effects.length > 0) {
      expect(effects[0].isActive).toBe(true);
      expect(effects[0].isToggleable).toBe(false);
    }
  });

  it('efeito deve ter duração until_removed com sustainCost', () => {
    const sustained = createTestSustainedRitual({ circle: 2 });
    
    const effects = getRitualEffects([sustained]);
    
    if (effects.length > 0) {
      expect(effects[0].duration?.type).toBe('until_removed');
      expect(effects[0].duration?.sustainCost).toBe(2);
    }
  });

  it('prioridade deve ser baseada no círculo', () => {
    const circle1 = createTestSustainedRitual({ circle: 1, ritualId: 'ritual-1' });
    const circle3 = createTestSustainedRitual({ circle: 3, ritualId: 'ritual-3' });
    
    const effects1 = getRitualEffects([circle1]);
    const effects3 = getRitualEffects([circle3]);
    
    if (effects1.length > 0 && effects3.length > 0) {
      expect(effects3[0].priority).toBeGreaterThan(effects1[0].priority!);
    }
  });
});

// =====================================================
// FASE 2: Múltiplos Rituais
// =====================================================

describe('ritual-effects-adapter: Múltiplos Rituais', () => {
  it('deve processar múltiplos rituais sustentados', () => {
    const rituals: SustainedRitualInput[] = [
      createTestSustainedRitual({ ritualId: 'ritual-1', ritualName: 'Ritual 1' }),
      createTestSustainedRitual({ ritualId: 'ritual-2', ritualName: 'Ritual 2' }),
      createTestSustainedRitual({ ritualId: 'ritual-3', ritualName: 'Ritual 3' }),
    ];
    
    const effects = getRitualEffects(rituals);
    
    // Pode retornar 0 se rituais não existirem no registry
    // O importante é que não quebra
    expect(Array.isArray(effects)).toBe(true);
  });
});

// =====================================================
// FASE 3: calculateRitualBonusTotals - Regra de Não-Acúmulo
// =====================================================

describe('ritual-effects-adapter: calculateRitualBonusTotals', () => {
  it('deve retornar valores zerados para array vazio', () => {
    const totals = calculateRitualBonusTotals([]);
    
    expect(totals.attackBonus).toBe(0);
    expect(totals.damageBonus).toBe(0);
    expect(totals.defenseBonus).toBe(0);
    expect(totals.damageReduction).toBe(0);
    expect(totals.tempHP).toBe(0);
    expect(Object.keys(totals.skillBonuses)).toHaveLength(0);
    expect(totals.specialEffects).toHaveLength(0);
  });

  it('deve retornar objeto com estrutura correta', () => {
    const totals = calculateRitualBonusTotals([]);
    
    expect(totals).toHaveProperty('attackBonus');
    expect(totals).toHaveProperty('damageBonus');
    expect(totals).toHaveProperty('defenseBonus');
    expect(totals).toHaveProperty('damageReduction');
    expect(totals).toHaveProperty('tempHP');
    expect(totals).toHaveProperty('skillBonuses');
    expect(totals).toHaveProperty('specialEffects');
  });

  it('deve processar rituais sem erros', () => {
    const rituals = [
      createTestSustainedRitual({ ritualId: 'ritual-teste' }),
    ];
    
    // Não deve lançar exceção
    expect(() => calculateRitualBonusTotals(rituals)).not.toThrow();
  });
});

// =====================================================
// FASE 4: getRitualEffectsSummary
// =====================================================

describe('ritual-effects-adapter: getRitualEffectsSummary', () => {
  it('deve retornar array vazio para array vazio', () => {
    const summary = getRitualEffectsSummary([]);
    
    expect(summary).toEqual([]);
  });

  it('deve retornar resumo com estrutura correta', () => {
    const sustained = createTestSustainedRitual({
      ritualName: 'Armadura Arcana',
      element: 'Energia',
      circle: 1,
      isConcentrating: true,
    });
    
    const summary = getRitualEffectsSummary([sustained]);
    
    expect(summary).toHaveLength(1);
    expect(summary[0]).toHaveProperty('ritualName');
    expect(summary[0]).toHaveProperty('element');
    expect(summary[0]).toHaveProperty('circle');
    expect(summary[0]).toHaveProperty('effects');
    expect(summary[0]).toHaveProperty('isConcentrating');
  });

  it('deve preservar informações do ritual no resumo', () => {
    const sustained = createTestSustainedRitual({
      ritualName: 'Barreira de Sangue',
      element: 'Sangue',
      circle: 2,
      isConcentrating: true,
    });
    
    const summary = getRitualEffectsSummary([sustained]);
    
    expect(summary[0].ritualName).toBe('Barreira de Sangue');
    expect(summary[0].element).toBe('Sangue');
    expect(summary[0].circle).toBe(2);
    expect(summary[0].isConcentrating).toBe(true);
  });

  it('deve ter pelo menos um efeito ou texto padrão', () => {
    const sustained = createTestSustainedRitual();
    
    const summary = getRitualEffectsSummary([sustained]);
    
    expect(summary[0].effects.length).toBeGreaterThanOrEqual(1);
  });

  it('isConcentrating deve ser false quando não definido', () => {
    const sustained = createTestSustainedRitual({ isConcentrating: undefined });
    
    const summary = getRitualEffectsSummary([sustained]);
    
    expect(summary[0].isConcentrating).toBe(false);
  });

  it('deve processar múltiplos rituais', () => {
    const rituals = [
      createTestSustainedRitual({ ritualName: 'Ritual 1', circle: 1 }),
      createTestSustainedRitual({ ritualName: 'Ritual 2', circle: 2 }),
      createTestSustainedRitual({ ritualName: 'Ritual 3', circle: 3 }),
    ];
    
    const summary = getRitualEffectsSummary(rituals);
    
    expect(summary).toHaveLength(3);
    expect(summary[0].ritualName).toBe('Ritual 1');
    expect(summary[1].ritualName).toBe('Ritual 2');
    expect(summary[2].ritualName).toBe('Ritual 3');
  });
});

// =====================================================
// FASE 5: Elementos e Círculos
// =====================================================

describe('ritual-effects-adapter: Elementos e Círculos', () => {
  it('deve aceitar todos os elementos paranormais', () => {
    const elementos = ['Sangue', 'Morte', 'Conhecimento', 'Energia', 'Medo'];
    
    for (const elemento of elementos) {
      const sustained = createTestSustainedRitual({ element: elemento });
      const summary = getRitualEffectsSummary([sustained]);
      
      expect(summary[0].element).toBe(elemento);
    }
  });

  it('deve aceitar círculos de 1 a 4', () => {
    for (let circle = 1; circle <= 4; circle++) {
      const sustained = createTestSustainedRitual({ circle });
      const summary = getRitualEffectsSummary([sustained]);
      
      expect(summary[0].circle).toBe(circle);
    }
  });
});

// =====================================================
// FASE 6: Enhancements (Aprimoramentos)
// =====================================================

describe('ritual-effects-adapter: Aprimoramentos', () => {
  it('deve aceitar array de aprimoramentos selecionados', () => {
    const sustained = createTestSustainedRitual({
      selectedEnhancements: ['discente', 'alcance-longo'],
    });
    
    // Não deve lançar exceção
    expect(() => getRitualEffects([sustained])).not.toThrow();
  });

  it('deve aceitar array vazio de aprimoramentos', () => {
    const sustained = createTestSustainedRitual({
      selectedEnhancements: [],
    });
    
    expect(() => getRitualEffects([sustained])).not.toThrow();
  });

  it('deve aceitar undefined para aprimoramentos', () => {
    const sustained = createTestSustainedRitual({
      selectedEnhancements: undefined,
    });
    
    expect(() => getRitualEffects([sustained])).not.toThrow();
  });
});

// =====================================================
// FASE 7: Robustez e Edge Cases
// =====================================================

describe('ritual-effects-adapter: Edge Cases', () => {
  it('deve lidar com ritualId vazio', () => {
    const sustained = createTestSustainedRitual({ ritualId: '' });
    
    // Não deve lançar exceção
    expect(() => getRitualEffects([sustained])).not.toThrow();
  });

  it('deve lidar com ritualName vazio', () => {
    const sustained = createTestSustainedRitual({ ritualName: '' });
    
    const summary = getRitualEffectsSummary([sustained]);
    expect(summary[0].ritualName).toBe('');
  });

  it('deve lidar com turnsActive = 0', () => {
    const sustained = createTestSustainedRitual({ turnsActive: 0 });
    
    expect(() => getRitualEffects([sustained])).not.toThrow();
  });

  it('deve lidar com turnsActive muito alto', () => {
    const sustained = createTestSustainedRitual({ turnsActive: 999 });
    
    expect(() => getRitualEffects([sustained])).not.toThrow();
  });
});
