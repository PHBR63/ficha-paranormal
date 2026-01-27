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

// ============================================================================
// CENÁRIOS ADICIONAIS PARA MODAIS DE COMBATE
// ============================================================================

/**
 * Cenário: Arma com buff de ritual ativo (Amaldiçoar Arma)
 */
export function createWeaponBuffScenario(): CombatBonuses {
  return createMockCombatBonuses({
    attack: {
      total: 3,
      breakdown: createMockBreakdown([
        { source: 'Luta (Treinado)', value: 1, type: 'skill_training' },
        { source: 'Força', value: 2, type: 'origin' },
      ]),
    },
    damage: {
      total: 2,
      extraDice: ['1d6 Sangue'],
      breakdown: createMockBreakdown([
        { source: 'Força', value: 2, type: 'origin' },
        { source: 'Amaldiçoar Arma (Sangue)', value: '1d6', type: 'ritual' },
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
 * Cenário: Máquina de Matar ativa (NEX 99% Combatente)
 */
export function createMaquinaDeMatarScenario(): CombatBonuses {
  return createMockCombatBonuses({
    attack: {
      total: 6,
      breakdown: createMockBreakdown([
        { source: 'Ataque Especial III', value: 5, type: 'ability' },
        { source: 'Luta (Expert)', value: 2, type: 'skill_training' },
      ]),
    },
    damage: {
      total: 8,
      extraDice: ['1d10'], // dado extra do nex 99
      breakdown: createMockBreakdown([
        { source: 'Ataque Especial III', value: 5, type: 'ability' },
        { source: 'Força', value: 4, type: 'origin' },
        { source: 'Máquina de Matar', value: '1d10', type: 'ability', conditional: 'NEX 99%' },
      ]),
    },
    criticalMargin: {
      total: 2,
      breakdown: createMockBreakdown([
        { source: 'Máquina de Matar', value: 2, type: 'ability', conditional: 'NEX 99%' },
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
 * Cenário: Técnica Secreta ativa (Aniquilador com Destruidor)
 */
export function createTecnicaSecretaScenario(): CombatBonuses {
  return createMockCombatBonuses({
    attack: {
      total: 5,
      breakdown: createMockBreakdown([
        { source: 'Ataque Especial II', value: 3, type: 'ability' },
        { source: 'Luta (Veterano)', value: 1, type: 'skill_training' },
        { source: 'Força', value: 1, type: 'origin' },
      ]),
    },
    damage: {
      total: 10,
      extraDice: [],
      breakdown: createMockBreakdown([
        { source: 'Ataque Especial II', value: 3, type: 'ability' },
        { source: 'Técnica Destruidor', value: 4, type: 'track_effect', conditional: 'Ativada' },
        { source: 'Força', value: 3, type: 'origin' },
      ]),
    },
    criticalMargin: {
      total: 2,
      breakdown: createMockBreakdown([
        { source: 'Técnica Destruidor', value: 2, type: 'track_effect' },
      ]),
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
 * Cenário: Combate com múltiplos rituais (apenas o maior aplica)
 */
export function createMultipleRitualsScenario(): CombatBonuses {
  return createMockCombatBonuses({
    attack: {
      total: 3,
      breakdown: createMockBreakdown([
        { source: 'Luta (Treinado)', value: 1, type: 'skill_training' },
        { source: 'Ritual Arma Atroz', value: 2, type: 'ritual' },
        { 
          source: 'Ritual Proteção do Combatente', 
          value: 1, 
          type: 'ritual', 
          excluded: true,
          excludedReason: 'Ritual maior ativo (Arma Atroz)'
        },
      ]),
    },
    damage: {
      total: 4,
      extraDice: ['2d6 Morte'],
      breakdown: createMockBreakdown([
        { source: 'Força', value: 2, type: 'origin' },
        { source: 'Ritual Arma Atroz', value: '2d6', type: 'ritual' },
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

// ============================================================================
// CENÁRIOS DE TESTES DE PERÍCIA (para DiceRollModal)
// ============================================================================

/**
 * Interface para cenários de teste de perícia
 */
export interface SkillTestScenario {
  skillId: string;
  skillName: string;
  attribute: string;
  total: number;
  resistanceBonus?: number;
  extraDice?: string[];
  breakdown: BonusBreakdown[];
  swapInfo?: {
    originalSkill?: string;
    swappedSkill?: string;
    originalAttribute?: string;
    swappedAttribute?: string;
    activePower?: string;
    peCost?: number;
  };
}

/**
 * Cenário: Acadêmico testando Ciências com Saber é Poder
 */
export function createAcademicSkillScenario(): SkillTestScenario {
  return {
    skillId: 'ciencias',
    skillName: 'Ciências',
    attribute: 'intellect',
    total: 10,
    breakdown: createMockBreakdown([
      { source: 'Ciências (Treinado)', value: 5, type: 'skill_training' },
      { source: 'Saber é Poder', value: 5, type: 'origin', conditional: 'Teste de Intelecto' },
    ]),
  };
}

/**
 * Cenário: Atleta testando Fortitude com Incansável (swap FOR)
 */
export function createAthleteFortitudeScenario(): SkillTestScenario {
  return {
    skillId: 'fortitude',
    skillName: 'Fortitude',
    attribute: 'strength', // Swapped de vigor para força
    total: 5,
    resistanceBonus: 5,
    breakdown: createMockBreakdown([
      { source: 'Fortitude (Treinado)', value: 5, type: 'skill_training' },
    ]),
    swapInfo: {
      originalAttribute: 'vigor',
      swappedAttribute: 'strength',
      activePower: 'Incansável',
      peCost: 0,
    },
  };
}

/**
 * Cenário: Trambiqueiro usando Impostor (swap para Enganação)
 */
export function createImpostorSwapScenario(): SkillTestScenario {
  return {
    skillId: 'investigacao',
    skillName: 'Investigação',
    attribute: 'presence', // Swapped para Presença (Enganação)
    total: 10,
    breakdown: createMockBreakdown([
      { source: 'Enganação (Veterano)', value: 10, type: 'skill_training' },
    ]),
    swapInfo: {
      originalSkill: 'investigacao',
      swappedSkill: 'enganacao',
      originalAttribute: 'intellect',
      swappedAttribute: 'presence',
      activePower: 'Impostor',
      peCost: 2,
    },
  };
}

/**
 * Cenário: Hacker usando Motor de Busca (swap para Tecnologia)
 */
export function createMotorDeBuscaScenario(): SkillTestScenario {
  return {
    skillId: 'ocultismo',
    skillName: 'Ocultismo',
    attribute: 'intellect',
    total: 8,
    breakdown: createMockBreakdown([
      { source: 'Tecnologia (Veterano)', value: 10, type: 'skill_training' },
    ]),
    swapInfo: {
      originalSkill: 'ocultismo',
      swappedSkill: 'tecnologia',
      originalAttribute: 'intellect',
      swappedAttribute: 'intellect', // Mesmo atributo
      activePower: 'Motor de Busca',
      peCost: 1,
    },
  };
}

/**
 * Cenário: Especialista com Perito em Tecnologia
 */
export function createSpecialistPeritoScenario(): SkillTestScenario {
  return {
    skillId: 'tecnologia',
    skillName: 'Tecnologia',
    attribute: 'intellect',
    total: 10,
    extraDice: ['1d8'],
    breakdown: createMockBreakdown([
      { source: 'Tecnologia (Veterano)', value: 10, type: 'skill_training' },
      { source: 'Perito (Tecnologia)', value: '1d8', type: 'ability' },
    ]),
  };
}

/**
 * Cenário: Especialista usando Eclético em perícia não treinada
 */
export function createSpecialistEcleticoScenario(): SkillTestScenario {
  return {
    skillId: 'medicina',
    skillName: 'Medicina',
    attribute: 'intellect',
    total: 10,
    breakdown: createMockBreakdown([
      { source: 'Eclético (Veterano)', value: 10, type: 'ability', conditional: '4 PE' },
    ]),
  };
}

/**
 * Cenário: Teste com múltiplas fontes de bônus
 */
export function createMultipleSkillBonusesScenario(): SkillTestScenario {
  return {
    skillId: 'percepcao',
    skillName: 'Percepção',
    attribute: 'intellect',
    total: 13,
    breakdown: createMockBreakdown([
      { source: 'Percepção (Veterano)', value: 10, type: 'skill_training' },
      { source: 'Faro para Pistas', value: 5, type: 'origin' },
      { 
        source: 'Ritual Visão da Verdade', 
        value: 2, 
        type: 'ritual',
        excluded: true,
        excludedReason: 'Bônus de origem maior ativo',
      },
    ]),
  };
}

/**
 * Cenário: Especialista usando Primeira Impressão
 */
export function createPrimeiraImpressaoScenario(): SkillTestScenario {
  return {
    skillId: 'diplomacia',
    skillName: 'Diplomacia',
    attribute: 'presence',
    total: 5,
    extraDice: ['1d20'], // Dado extra, keep highest
    breakdown: createMockBreakdown([
      { source: 'Diplomacia (Treinado)', value: 5, type: 'skill_training' },
      { source: 'Primeira Impressão', value: '1d20', type: 'ability', conditional: 'Primeiro teste da cena' },
    ]),
  };
}

/**
 * Cenário: Origem com bônus de perícia (Desbravador, 110%)
 */
export function createOriginSkillBonusScenario(): SkillTestScenario {
  return {
    skillId: 'sobrevivencia',
    skillName: 'Sobrevivência',
    attribute: 'intellect',
    total: 10,
    breakdown: createMockBreakdown([
      { source: 'Sobrevivência (Treinado)', value: 5, type: 'skill_training' },
      { source: 'Desbravador', value: 5, type: 'origin', conditional: 'Ambiente selvagem' },
    ]),
  };
}
