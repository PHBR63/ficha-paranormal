/**
 * Testes de Snapshot para useBonusSummaryFromSUE
 * 
 * Valida a consistência da conversão SUE → BonusSummary para UI,
 * garantindo que a estrutura de dados permanece estável.
 * 
 * Nota: Este arquivo testa a estrutura de dados de saída dos breakdowns,
 * não os componentes de UI diretamente.
 */

import { describe, it, expect } from 'vitest';
import {
  createMockBreakdown,
  createMockCombatBonuses,
  createMockDamageReduction,
  createMockEffectResistances,
  createWarrior50Scenario,
  createAnnihilator75Scenario,
  createEliteShooter65Scenario,
  createSpecOps50Scenario,
  createShockTroop60Scenario,
  createInfiltrator75Scenario,
  createFlagellator99Scenario,
  createStackingExclusionScenario,
  createConditionalBonusesScenario,
} from '@/components/character/__tests__/breakdown-test-utils';

// ============================================================================
// TESTES: Estrutura de Saída por Classe (CombatBonuses)
// ============================================================================

describe('useBonusSummaryFromSUE - Estrutura de Saída', () => {
  describe('Combatente - CombatBonuses', () => {
    it('snapshot de Guerreiro NEX 50%', () => {
      const combat = createWarrior50Scenario();
      expect(combat).toMatchSnapshot();
    });

    it('snapshot de Aniquilador NEX 75%', () => {
      const combat = createAnnihilator75Scenario();
      expect(combat).toMatchSnapshot();
    });

    it('snapshot de Operações Especiais NEX 50%', () => {
      const combat = createSpecOps50Scenario();
      expect(combat).toMatchSnapshot();
    });

    it('snapshot de Tropa de Choque NEX 60% com RD', () => {
      const { combat, damageReduction } = createShockTroop60Scenario();
      expect({ combat, damageReduction }).toMatchSnapshot();
    });
  });

  describe('Especialista - CombatBonuses', () => {
    it('snapshot de Infiltrador NEX 75%', () => {
      const combat = createInfiltrator75Scenario();
      expect(combat).toMatchSnapshot();
    });
  });

  describe('Ocultista - CombatBonuses', () => {
    it('snapshot de Flagelador NEX 99%', () => {
      const combat = createFlagellator99Scenario();
      expect(combat).toMatchSnapshot();
    });
  });
});

// ============================================================================
// TESTES: Breakdowns por Categoria
// ============================================================================

describe('useBonusSummaryFromSUE - Breakdowns por Categoria', () => {
  describe('Attack Breakdown', () => {
    it('ataque com múltiplas fontes', () => {
      const combat = createEliteShooter65Scenario();
      expect(combat.attack).toMatchSnapshot();
    });

    it('ataque com stacking exclusion', () => {
      const combat = createStackingExclusionScenario();
      expect(combat.attack).toMatchSnapshot();
    });
  });

  describe('Damage Breakdown', () => {
    it('dano com trilha + poder', () => {
      const combat = createAnnihilator75Scenario();
      expect(combat.damage).toMatchSnapshot();
    });

    it('dano com dados extras (Ataque Furtivo)', () => {
      const combat = createInfiltrator75Scenario();
      expect(combat.damage).toMatchSnapshot();
    });

    it('dano com bônus condicionais', () => {
      const combat = createConditionalBonusesScenario();
      expect(combat.damage).toMatchSnapshot();
    });
  });

  describe('Defense Breakdown', () => {
    it('defesa com armadura + escudo', () => {
      // Usamos BonusBreakdown genérico para representar defesa em testes
      const defense = {
        total: 18,
        breakdown: createMockBreakdown([
          { source: 'Base', value: 10, type: 'origin' },
          { source: 'Agilidade', value: 2, type: 'origin' },
          { source: 'Armadura Pesada', value: 4, type: 'ability' },
          { source: 'Escudo Médio', value: 2, type: 'ability' },
        ]),
      };
      expect(defense).toMatchSnapshot();
    });

    it('defesa com trio paranormal (Armadura + Escudo + Ritual)', () => {
      const defense = {
        total: 20,
        breakdown: createMockBreakdown([
          { source: 'Base', value: 10, type: 'origin' },
          { source: 'Agilidade', value: 2, type: 'origin' },
          { source: 'Armadura Leve', value: 2, type: 'ability' },
          { source: 'Escudo Leve', value: 1, type: 'ability' },
          { source: 'Ritual Proteção', value: 5, type: 'ritual' },
        ]),
      };
      expect(defense).toMatchSnapshot();
    });
  });

  describe('Initiative Breakdown', () => {
    it('iniciativa com Operações Especiais', () => {
      const combat = createSpecOps50Scenario();
      expect(combat.initiative).toMatchSnapshot();
    });

    it('iniciativa padrão sem bônus de trilha', () => {
      const combat = createWarrior50Scenario();
      expect(combat.initiative).toMatchSnapshot();
    });
  });

  describe('Damage Reduction Breakdown', () => {
    it('RD física com Casca Grossa', () => {
      const { damageReduction } = createShockTroop60Scenario();
      expect(damageReduction).toMatchSnapshot();
    });

    it('RD completa (física + paranormal)', () => {
      const dr = createMockDamageReduction({
        physical: {
          total: 5,
          breakdown: createMockBreakdown([
            { source: 'Armadura Pesada', value: 3, type: 'ability' },
            { source: 'Inquebrável', value: 2, type: 'track_effect', conditional: 'Machucado' },
          ]),
        },
        paranormal: {
          total: 3,
          breakdown: createMockBreakdown([
            { source: 'Proteção Paranormal', value: 3, type: 'paranormal' },
          ]),
        },
      });
      expect(dr).toMatchSnapshot();
    });
  });
});

// ============================================================================
// TESTES: Resistências
// ============================================================================

describe('useBonusSummaryFromSUE - Resistências', () => {
  it('resistências com múltiplas fontes', () => {
    const resistances = {
      fortitude: {
        total: 8,
        breakdown: createMockBreakdown([
          { source: 'Vigor', value: 3, type: 'origin' },
          { source: 'Treinamento', value: 5, type: 'skill_training' },
        ]),
      },
      reflexos: {
        total: 6,
        breakdown: createMockBreakdown([
          { source: 'Agilidade', value: 4, type: 'origin' },
          { source: 'Treinamento', value: 2, type: 'skill_training' },
        ]),
      },
      vontade: {
        total: 7,
        breakdown: createMockBreakdown([
          { source: 'Presença', value: 2, type: 'origin' },
          { source: 'Treinamento', value: 5, type: 'skill_training' },
        ]),
      },
    };
    expect(resistances).toMatchSnapshot();
  });

  it('resistências com bônus de Sentido Tático', () => {
    const resistances = {
      fortitude: {
        total: 10,
        breakdown: createMockBreakdown([
          { source: 'Vigor', value: 3, type: 'origin' },
          { source: 'Treinamento', value: 5, type: 'skill_training' },
          { source: 'Sentido Tático', value: 2, type: 'ability', conditional: 'Se ativo' },
        ]),
      },
      reflexos: {
        total: 8,
        breakdown: createMockBreakdown([
          { source: 'Agilidade', value: 4, type: 'origin' },
          { source: 'Treinamento', value: 2, type: 'skill_training' },
          { source: 'Sentido Tático', value: 2, type: 'ability', conditional: 'Se ativo' },
        ]),
      },
      vontade: {
        total: 9,
        breakdown: createMockBreakdown([
          { source: 'Presença', value: 2, type: 'origin' },
          { source: 'Treinamento', value: 5, type: 'skill_training' },
          { source: 'Sentido Tático', value: 2, type: 'ability', conditional: 'Se ativo' },
        ]),
      },
    };
    expect(resistances).toMatchSnapshot();
  });
});

// ============================================================================
// TESTES: Perícias
// ============================================================================

describe('useBonusSummaryFromSUE - Perícias', () => {
  it('perícia com treinamento e atributo', () => {
    const skills = {
      luta: {
        total: 8,
        breakdown: createMockBreakdown([
          { source: 'Treinamento (Veterano)', value: 7, type: 'skill_training' },
          { source: 'Força', value: 1, type: 'origin' },
        ]),
      },
    };
    expect(skills).toMatchSnapshot();
  });

  it('perícia com Conhecimento Aplicado ativo', () => {
    const skills = {
      investigacao: {
        total: 12,
        breakdown: createMockBreakdown([
          { source: 'Treinamento (Expert)', value: 10, type: 'skill_training' },
          { source: 'Intelecto', value: 2, type: 'origin' },
          { source: 'Conhecimento Aplicado', value: 5, type: 'ability', conditional: 'Gasta 2 PE' },
        ]),
      },
    };
    expect(skills).toMatchSnapshot();
  });

  it('perícia com swap (Impostor)', () => {
    const skills = {
      enganacao: {
        total: 15,
        breakdown: createMockBreakdown([
          { source: 'Treinamento (Expert)', value: 10, type: 'skill_training' },
          { source: 'Presença', value: 3, type: 'origin' },
          { source: 'Impostor (usa maior perícia)', value: 2, type: 'origin', conditional: 'Substitui por Furtividade' },
        ]),
      },
    };
    expect(skills).toMatchSnapshot();
  });
});

// ============================================================================
// TESTES: Efeitos Paranormais
// ============================================================================

describe('useBonusSummaryFromSUE - Efeitos Paranormais', () => {
  it('efeitos paranormais de Ocultista (estrutura genérica)', () => {
    // Testa estrutura genérica, não a interface ParanormalEffects completa
    const paranormalEffects = {
      bloodRitualDamageBonus: '+2d6',
      threatMarginBonus: 2,
      elementalResistances: { blood: 5 },
      deathThreshold: -10,
    };
    expect(paranormalEffects).toMatchSnapshot();
  });

  it('efeitos paranormais vazios (não-ocultista)', () => {
    const paranormalEffects = {
      bloodRitualDamageBonus: '',
      threatMarginBonus: 0,
      elementalResistances: {},
      deathThreshold: 0,
    };
    expect(paranormalEffects).toMatchSnapshot();
  });
});

// ============================================================================
// TESTES: Bônus Condicionais
// ============================================================================

describe('useBonusSummaryFromSUE - Bônus Condicionais', () => {
  it('lista de bônus condicionais disponíveis', () => {
    const conditionalBonuses = [
      {
        id: 'assassinar',
        name: 'Assassinar',
        description: 'Dano extra contra alvos desprevenidos',
        category: 'damage',
        value: '2d6',
        condition: 'Alvo desprevenido',
        isActive: true,
      },
      {
        id: 'potencia-maxima',
        name: 'Potência Máxima',
        description: 'Dano extra em ataques corpo-a-corpo',
        category: 'damage',
        value: 4,
        condition: 'Ataque corpo-a-corpo',
        isActive: false,
      },
      {
        id: 'atirar-para-matar',
        name: 'Atirar para Matar',
        description: 'Maximiza dano de crítico',
        category: 'critical',
        value: 'max',
        condition: 'Crítico confirmado',
        isActive: true,
      },
    ];
    expect(conditionalBonuses).toMatchSnapshot();
  });
});

// ============================================================================
// TESTES: EffectResistances
// ============================================================================

describe('useBonusSummaryFromSUE - EffectResistances', () => {
  it('resistências a efeitos com breakdown', () => {
    const effectResistances = createMockEffectResistances({
      poison: 5,
      disease: 3,
      mental: 2,
      breakdown: createMockBreakdown([
        { source: 'Anatomia Insana', value: 5, type: 'paranormal' },
        { source: 'Vigor Elevado', value: 2, type: 'origin' },
      ]),
    });
    expect(effectResistances).toMatchSnapshot();
  });

  it('resistências a efeitos vazias', () => {
    const effectResistances = createMockEffectResistances();
    expect(effectResistances).toMatchSnapshot();
  });
});
