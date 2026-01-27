/**
 * Utilitários de Teste para Breakdowns de Bônus
 * 
 * Helpers para criar dados mock consistentes para cenários de teste
 * de snapshot dos componentes de breakdown de bônus do sistema.
 */

import type { 
  BonusBreakdown, 
  CombatBonuses, 
  DamageReduction, 
  EffectResistances 
} from '@/hooks/useCharacterBonusSummary';

// ============================================================================
// TIPOS AUXILIARES
// ============================================================================

export type BonusType = BonusBreakdown['type'];

export interface MockBreakdownSource {
  source: string;
  value: number | string;
  type: BonusType;
  conditional?: string;
  active?: boolean;
  excluded?: boolean;
  excludedReason?: string;
  toggleable?: boolean;
  toggleId?: string;
}

// ============================================================================
// HELPERS PARA CRIAR BREAKDOWNS
// ============================================================================

/**
 * Cria um breakdown individual de bônus com valores padrão sensatos
 */
export function createMockBreakdownItem(
  overrides: Partial<MockBreakdownSource> & { source: string; value: number | string }
): BonusBreakdown {
  return {
    source: overrides.source,
    value: overrides.value,
    type: overrides.type ?? 'ability',
    active: overrides.active ?? true,
    conditional: overrides.conditional,
    excluded: overrides.excluded,
    excludedReason: overrides.excludedReason,
    toggleable: overrides.toggleable,
    toggleId: overrides.toggleId,
  };
}

/**
 * Cria um array de breakdowns a partir de fontes simplificadas
 */
export function createMockBreakdown(sources: MockBreakdownSource[]): BonusBreakdown[] {
  return sources.map(s => createMockBreakdownItem({
    ...s,
    active: s.active ?? true,
  }));
}

// ============================================================================
// HELPERS PARA COMBATE
// ============================================================================

/**
 * Cria um objeto CombatBonuses completo para testes
 */
export function createMockCombatBonuses(overrides?: Partial<{
  attack: Partial<CombatBonuses['attack']>;
  damage: Partial<CombatBonuses['damage']>;
  criticalMargin: Partial<CombatBonuses['criticalMargin']>;
  initiative: Partial<CombatBonuses['initiative']>;
}>): CombatBonuses {
  return {
    attack: {
      total: overrides?.attack?.total ?? 0,
      breakdown: overrides?.attack?.breakdown ?? [],
    },
    damage: {
      total: overrides?.damage?.total ?? 0,
      extraDice: overrides?.damage?.extraDice ?? [],
      breakdown: overrides?.damage?.breakdown ?? [],
    },
    criticalMargin: {
      total: overrides?.criticalMargin?.total ?? 0,
      breakdown: overrides?.criticalMargin?.breakdown ?? [],
    },
    initiative: {
      total: overrides?.initiative?.total ?? 0,
      breakdown: overrides?.initiative?.breakdown ?? [],
    },
  };
}

/**
 * Cria breakdown de iniciativa para cenários específicos
 */
export function createMockInitiativeBreakdown(sources: MockBreakdownSource[]): {
  total: number;
  breakdown: BonusBreakdown[];
} {
  const breakdown = createMockBreakdown(sources);
  const total = breakdown
    .filter(b => b.active && !b.excluded && typeof b.value === 'number')
    .reduce((sum, b) => sum + (b.value as number), 0);
  
  return { total, breakdown };
}

// ============================================================================
// HELPERS PARA REDUÇÃO DE DANO E RESISTÊNCIAS
// ============================================================================

/**
 * Cria objeto DamageReduction para testes
 */
export function createMockDamageReduction(overrides?: Partial<{
  physical: { total?: number; breakdown?: BonusBreakdown[] };
  paranormal: { total?: number; breakdown?: BonusBreakdown[] };
}>): DamageReduction {
  return {
    physical: {
      total: overrides?.physical?.total ?? 0,
      breakdown: overrides?.physical?.breakdown ?? [],
    },
    paranormal: {
      total: overrides?.paranormal?.total ?? 0,
      breakdown: overrides?.paranormal?.breakdown ?? [],
    },
  };
}

/**
 * Cria objeto EffectResistances para testes
 */
export function createMockEffectResistances(overrides?: Partial<EffectResistances>): EffectResistances {
  return {
    poison: overrides?.poison ?? 0,
    disease: overrides?.disease ?? 0,
    mental: overrides?.mental ?? 0,
    breakdown: overrides?.breakdown ?? [],
  };
}

// ============================================================================
// CENÁRIOS PRÉ-DEFINIDOS
// ============================================================================

/**
 * Cenário: Combatente Guerreiro NEX 50% com Ataque Especial I e Golpe Pesado
 */
export function createWarrior50Scenario(): CombatBonuses {
  return createMockCombatBonuses({
    attack: {
      total: 3,
      breakdown: createMockBreakdown([
        { source: 'Ataque Especial I', value: 2, type: 'ability' },
        { source: 'Luta (Treinado)', value: 1, type: 'skill_training' },
      ]),
    },
    damage: {
      total: 4,
      extraDice: [],
      breakdown: createMockBreakdown([
        { source: 'Ataque Especial I', value: 2, type: 'ability' },
        { source: 'Força', value: 2, type: 'origin' },
      ]),
    },
    criticalMargin: {
      total: 0,
      breakdown: [],
    },
    initiative: {
      total: 2,
      breakdown: createMockBreakdown([
        { source: 'Agilidade', value: 2, type: 'origin' },
      ]),
    },
  });
}

/**
 * Cenário: Combatente Aniquilador NEX 75% com Técnica Destruidor
 */
export function createAnnihilator75Scenario(): CombatBonuses {
  return createMockCombatBonuses({
    attack: {
      total: 4,
      breakdown: createMockBreakdown([
        { source: 'Ataque Especial II', value: 3, type: 'ability' },
        { source: 'Luta (Veterano)', value: 1, type: 'skill_training' },
      ]),
    },
    damage: {
      total: 6,
      extraDice: [],
      breakdown: createMockBreakdown([
        { source: 'Ataque Especial II', value: 3, type: 'ability' },
        { source: 'Técnica Destruidor', value: 2, type: 'track_effect' },
        { source: 'Força', value: 3, type: 'origin' },
      ]),
    },
    criticalMargin: {
      total: 2,
      breakdown: createMockBreakdown([
        { source: 'Técnica Letal', value: 2, type: 'track_effect' },
      ]),
    },
    initiative: {
      total: 3,
      breakdown: createMockBreakdown([
        { source: 'Agilidade', value: 3, type: 'origin' },
      ]),
    },
  });
}

/**
 * Cenário: Combatente Atirador de Elite NEX 65% com Mira de Elite
 */
export function createEliteShooter65Scenario(): CombatBonuses {
  return createMockCombatBonuses({
    attack: {
      total: 5,
      breakdown: createMockBreakdown([
        { source: 'Ataque Especial I', value: 2, type: 'ability' },
        { source: 'Mira de Elite', value: 2, type: 'track_effect' },
        { source: 'Pontaria (Veterano)', value: 1, type: 'skill_training' },
      ]),
    },
    damage: {
      total: 4,
      extraDice: [],
      breakdown: createMockBreakdown([
        { source: 'Ataque Especial I', value: 2, type: 'ability' },
        { source: 'Agilidade', value: 3, type: 'origin' },
      ]),
    },
    criticalMargin: {
      total: 2,
      breakdown: createMockBreakdown([
        { source: 'Disparo Letal', value: 2, type: 'track_effect' },
      ]),
    },
    initiative: {
      total: 3,
      breakdown: createMockBreakdown([
        { source: 'Agilidade', value: 3, type: 'origin' },
      ]),
    },
  });
}

/**
 * Cenário: Combatente Operações Especiais NEX 50% com bônus de iniciativa
 */
export function createSpecOps50Scenario(): CombatBonuses {
  return createMockCombatBonuses({
    attack: {
      total: 3,
      breakdown: createMockBreakdown([
        { source: 'Ataque Especial I', value: 2, type: 'ability' },
        { source: 'Pontaria (Treinado)', value: 1, type: 'skill_training' },
      ]),
    },
    damage: {
      total: 2,
      extraDice: [],
      breakdown: createMockBreakdown([
        { source: 'Ataque Especial I', value: 2, type: 'ability' },
      ]),
    },
    criticalMargin: {
      total: 0,
      breakdown: [],
    },
    initiative: {
      total: 7,
      breakdown: createMockBreakdown([
        { source: 'Operações Especiais', value: 5, type: 'track_effect' },
        { source: 'Agilidade', value: 2, type: 'origin' },
      ]),
    },
  });
}

/**
 * Cenário: Combatente Tropa de Choque NEX 60% com Casca Grossa
 */
export function createShockTroop60Scenario(): {
  combat: CombatBonuses;
  damageReduction: DamageReduction;
} {
  return {
    combat: createMockCombatBonuses({
      attack: {
        total: 3,
        breakdown: createMockBreakdown([
          { source: 'Ataque Especial I', value: 2, type: 'ability' },
          { source: 'Luta (Treinado)', value: 1, type: 'skill_training' },
        ]),
      },
      damage: {
        total: 5,
        extraDice: [],
        breakdown: createMockBreakdown([
          { source: 'Ataque Especial I', value: 2, type: 'ability' },
          { source: 'Força', value: 3, type: 'origin' },
        ]),
      },
      criticalMargin: {
        total: 0,
        breakdown: [],
      },
      initiative: {
        total: 1,
        breakdown: createMockBreakdown([
          { source: 'Agilidade', value: 1, type: 'origin' },
        ]),
      },
    }),
    damageReduction: createMockDamageReduction({
      physical: {
        total: 3,
        breakdown: createMockBreakdown([
          { source: 'Casca Grossa', value: 3, type: 'track_effect', conditional: 'Ao bloquear' },
        ]),
      },
    }),
  };
}

/**
 * Cenário: Bônus com regras de stacking (um excluído)
 */
export function createStackingExclusionScenario(): CombatBonuses {
  return createMockCombatBonuses({
    attack: {
      total: 3,
      breakdown: createMockBreakdown([
        { source: 'Ritual Arma Mental', value: 3, type: 'ritual' },
        { 
          source: 'Ritual Proteção Divina', 
          value: 2, 
          type: 'ritual', 
          active: true,
          excluded: true,
          excludedReason: 'Ritual maior ativo',
        },
      ]),
    },
    damage: {
      total: 0,
      extraDice: [],
      breakdown: [],
    },
    criticalMargin: {
      total: 0,
      breakdown: [],
    },
    initiative: {
      total: 0,
      breakdown: [],
    },
  });
}

/**
 * Cenário: Bônus condicionais (Assassinar, Potência Máxima)
 */
export function createConditionalBonusesScenario(): CombatBonuses {
  return createMockCombatBonuses({
    attack: {
      total: 0,
      breakdown: [],
    },
    damage: {
      total: 6,
      extraDice: ['2d6'],
      breakdown: createMockBreakdown([
        { 
          source: 'Assassinar', 
          value: '2d6', 
          type: 'track_effect',
          conditional: 'Alvo desprevenido',
          toggleable: true,
          toggleId: 'assassinar',
        },
        { 
          source: 'Potência Máxima', 
          value: 4, 
          type: 'track_effect',
          conditional: 'Ataque corpo-a-corpo',
          toggleable: true,
          toggleId: 'potencia-maxima',
        },
      ]),
    },
    criticalMargin: {
      total: 0,
      breakdown: [],
    },
    initiative: {
      total: 0,
      breakdown: [],
    },
  });
}

// ============================================================================
// CENÁRIOS DE ESPECIALISTA
// ============================================================================

/**
 * Cenário: Especialista Infiltrador NEX 75% com Ataque Furtivo
 */
export function createInfiltrator75Scenario(): CombatBonuses {
  return createMockCombatBonuses({
    attack: {
      total: 2,
      breakdown: createMockBreakdown([
        { source: 'Pontaria (Veterano)', value: 1, type: 'skill_training' },
        { source: 'Agilidade', value: 1, type: 'origin' },
      ]),
    },
    damage: {
      total: 0,
      extraDice: ['4d6'],
      breakdown: createMockBreakdown([
        { 
          source: 'Ataque Furtivo', 
          value: '4d6', 
          type: 'track_effect',
          conditional: 'Alvo desprevenido ou flanqueado',
        },
      ]),
    },
    criticalMargin: {
      total: 2,
      breakdown: createMockBreakdown([
        { source: 'Assassinar', value: 2, type: 'track_effect' },
      ]),
    },
    initiative: {
      total: 4,
      breakdown: createMockBreakdown([
        { source: 'Agilidade', value: 4, type: 'origin' },
      ]),
    },
  });
}

// ============================================================================
// CENÁRIOS DE OCULTISTA
// ============================================================================

/**
 * Cenário: Ocultista Flagelador NEX 99% com poder paranormal
 */
export function createFlagellator99Scenario(): CombatBonuses {
  return createMockCombatBonuses({
    attack: {
      total: 2,
      breakdown: createMockBreakdown([
        { source: 'Ocultismo (Expert)', value: 2, type: 'skill_training' },
      ]),
    },
    damage: {
      total: 0,
      extraDice: ['2d8'],
      breakdown: createMockBreakdown([
        { source: 'Poder Paranormal (Sangue)', value: '2d8', type: 'paranormal' },
      ]),
    },
    criticalMargin: {
      total: 0,
      breakdown: [],
    },
    initiative: {
      total: 2,
      breakdown: createMockBreakdown([
        { source: 'Agilidade', value: 2, type: 'origin' },
      ]),
    },
  });
}
