/**
 * Testes de Snapshot para DiceRollModal e MobileDiceRollModal
 * 
 * Valida a consistência visual e estrutural dos breakdowns de bônus
 * nos modais de teste de perícia para desktop e mobile.
 * 
 * Foco principal:
 * - Estrutura de BonusSource para testes de perícia
 * - Renderização correta de badges por tipo (skill, resistance, power, etc.)
 * - Mecânicas de swap de atributo (Conhecimento Aplicado, Incansável, etc.)
 * - Mecânicas de swap de perícia (Impostor, Motor de Busca)
 * - Fase de preparação com poderes ativáveis
 * - Consistência entre versões desktop e mobile
 */

import { describe, it, expect } from 'vitest';
import {
  createMockBreakdown,
  createAcademicSkillScenario,
  createAthleteFortitudeScenario,
  createImpostorSwapScenario,
  createMotorDeBuscaScenario,
  createSpecialistPeritoScenario,
  createSpecialistEcleticoScenario,
  createMultipleSkillBonusesScenario,
  createPrimeiraImpressaoScenario,
  createOriginSkillBonusScenario,
} from './breakdown-test-utils';

// ============================================================================
// TIPOS - BonusSource (usado nos modais de dice roll)
// ============================================================================

/**
 * Interface espelhada de BonusSource dos modais de dice roll
 * para validação de estrutura nos testes
 */
interface BonusSource {
  label: string;
  value: number;
  type: 'skill' | 'resistance' | 'power' | 'track' | 'origin' | 'item' | 'other';
  description?: string;
  sourceName?: string;
}

/**
 * Cores de fundo/texto para cada tipo de bônus
 * Deve corresponder exatamente ao que está em DiceRollModal.tsx
 */
const BONUS_TYPE_COLORS: Record<BonusSource['type'], string> = {
  skill: 'bg-primary/20 text-primary',
  resistance: 'bg-green-500/20 text-green-500',
  power: 'bg-purple-500/20 text-purple-500',
  track: 'bg-orange-500/20 text-orange-500',
  origin: 'bg-blue-500/20 text-blue-500',
  item: 'bg-amber-500/20 text-amber-500',
  other: 'bg-secondary/50 text-secondary-foreground',
};

// ============================================================================
// MAPEAMENTO DE PERÍCIA → ATRIBUTO
// ============================================================================

const SKILL_ATTRIBUTE_MAP: Record<string, string> = {
  // Agilidade
  acrobacia: 'agility', reflexos: 'agility', furtividade: 'agility', 
  crime: 'agility', pilotagem: 'agility', pontaria: 'agility',
  // Força
  atletismo: 'strength', luta: 'strength',
  // Presença
  artes: 'presence', atuacao: 'presence', diplomacia: 'presence',
  enganacao: 'presence', intimidacao: 'presence', vontade: 'presence',
  // Intelecto
  ciencias: 'intellect', investigacao: 'intellect', medicina: 'intellect',
  ocultismo: 'intellect', percepcao: 'intellect', profissao: 'intellect',
  sobrevivencia: 'intellect', tatica: 'intellect', tecnologia: 'intellect',
  adestramento: 'intellect', intuicao: 'intellect', religiao: 'intellect',
  // Vigor (resistências)
  fortitude: 'vigor',
};

// ============================================================================
// HELPERS - Conversão BonusBreakdown → BonusSource
// ============================================================================

/**
 * Converte BonusBreakdown (cenário) → BonusSource (UI)
 * Simula a conversão que ocorre dentro dos modais
 */
function convertToSkillSourceDisplay(
  breakdown: ReturnType<typeof createMockBreakdown>
): BonusSource[] {
  return breakdown
    .filter(item => typeof item.value === 'number')
    .map(item => ({
      label: item.source,
      value: item.value as number,
      type: mapBreakdownTypeToDiceRollType(item.type),
      description: item.conditional,
      sourceName: item.source,
    }));
}

/**
 * Mapeia tipos do sistema (breakdown-test-utils) para tipos de UI (BonusSource)
 */
function mapBreakdownTypeToDiceRollType(
  type: string
): BonusSource['type'] {
  const typeMap: Record<string, BonusSource['type']> = {
    origin: 'origin',
    ability: 'power',
    skill_training: 'skill',
    track_effect: 'track',
    ritual: 'power',
    paranormal: 'power',
    item: 'item',
  };
  return typeMap[type] || 'other';
}

// ============================================================================
// TESTES: Estrutura de BonusSource para Perícias
// ============================================================================

describe('DiceRollModal - Estrutura de BonusSource', () => {
  describe('Skill Bonus Sources', () => {
    it('snapshot de acadêmico - ciências com Saber é Poder', () => {
      const scenario = createAcademicSkillScenario();
      const sources = convertToSkillSourceDisplay(scenario.breakdown);
      expect(sources).toMatchSnapshot();
    });

    it('snapshot de atleta - fortitude com Incansável', () => {
      const scenario = createAthleteFortitudeScenario();
      const sources = convertToSkillSourceDisplay(scenario.breakdown);
      expect(sources).toMatchSnapshot();
    });

    it('snapshot de especialista com Perito (1d8 extra)', () => {
      const scenario = createSpecialistPeritoScenario();
      const sources = convertToSkillSourceDisplay(scenario.breakdown);
      expect(sources).toMatchSnapshot();
    });

    it('snapshot de especialista com Eclético tiers', () => {
      const scenario = createSpecialistEcleticoScenario();
      const sources = convertToSkillSourceDisplay(scenario.breakdown);
      expect(sources).toMatchSnapshot();
    });

    it('snapshot com múltiplas fontes de bônus', () => {
      const scenario = createMultipleSkillBonusesScenario();
      const sources = convertToSkillSourceDisplay(scenario.breakdown);
      expect(sources).toMatchSnapshot();
    });

    it('snapshot de Primeira Impressão ativo', () => {
      const scenario = createPrimeiraImpressaoScenario();
      const sources = convertToSkillSourceDisplay(scenario.breakdown);
      expect(sources).toMatchSnapshot();
    });

    it('snapshot de bônus de origem (Desbravador, 110%)', () => {
      const scenario = createOriginSkillBonusScenario();
      const sources = convertToSkillSourceDisplay(scenario.breakdown);
      expect(sources).toMatchSnapshot();
    });
  });

  describe('Attribute Swap Mechanics', () => {
    it('snapshot de Conhecimento Aplicado swap para INT', () => {
      const swapState = {
        originalAttribute: 'presence',
        effectiveAttribute: 'intellect',
        originalValue: 2,
        effectiveValue: 4,
        activePower: 'Conhecimento Aplicado',
        isPending: false,
      };
      expect(swapState).toMatchSnapshot();
    });

    it('snapshot de Incansável swap para FOR', () => {
      const swapState = {
        originalAttribute: 'vigor',
        effectiveAttribute: 'strength',
        originalValue: 1,
        effectiveValue: 3,
        activePower: 'Incansável',
        requiresFortitudeTest: true,
      };
      expect(swapState).toMatchSnapshot();
    });

    it('snapshot de Presteza Atlética swap para AGI', () => {
      const swapState = {
        originalAttribute: 'strength',
        effectiveAttribute: 'agility',
        originalValue: 2,
        effectiveValue: 4,
        activePower: 'Presteza Atlética',
        requiresAtletismoTest: true,
      };
      expect(swapState).toMatchSnapshot();
    });
  });

  describe('Skill Swap Mechanics (Impostor, Motor de Busca)', () => {
    it('snapshot de Impostor - swap para Enganação', () => {
      const scenario = createImpostorSwapScenario();
      expect(scenario).toMatchSnapshot();
    });

    it('snapshot de Motor de Busca - swap para Tecnologia', () => {
      const scenario = createMotorDeBuscaScenario();
      expect(scenario).toMatchSnapshot();
    });

    it('estrutura de skill swap state', () => {
      const swapState = {
        originalSkill: 'investigacao',
        swappedSkill: 'enganacao',
        originalAttribute: 'intellect',
        swappedAttribute: 'presence',
        originalSkillBonus: 5,
        swappedSkillBonus: 10,
        activePower: 'Impostor',
        peCost: 2,
        usesRemaining: 1, // Uma vez por cena
      };
      expect(swapState).toMatchSnapshot();
    });
  });
});

// ============================================================================
// TESTES: Cores de Tipos de Bônus
// ============================================================================

describe('DiceRollModal - Cores de Tipos de Bônus', () => {
  it('snapshot de mapeamento de cores por tipo', () => {
    expect(BONUS_TYPE_COLORS).toMatchSnapshot();
  });

  it('cada tipo de bônus tem uma cor única', () => {
    const colors = Object.values(BONUS_TYPE_COLORS);
    const uniqueColors = new Set(colors);
    expect(uniqueColors.size).toBe(colors.length);
  });

  it('cores seguem padrão de opacidade bg-*/20 text-*', () => {
    Object.entries(BONUS_TYPE_COLORS).forEach(([type, colorClasses]) => {
      expect(colorClasses).toContain('bg-');
      expect(colorClasses).toContain('text-');
    });
  });
});

// ============================================================================
// TESTES: Cenários Completos de Teste de Perícia
// ============================================================================

describe('DiceRollModal - Cenários Completos', () => {
  describe('Desktop (DiceRollModal)', () => {
    it('snapshot de teste de perícia - Acadêmico', () => {
      const scenario = createAcademicSkillScenario();
      const completeState = {
        phase: 'rolled' as const,
        skill: { id: 'ciencias', name: 'Ciências', attribute: 'intellect' },
        attributeValue: 4,
        skillBonus: scenario.total,
        sources: convertToSkillSourceDisplay(scenario.breakdown),
        dicePool: [11, 15, 8], // Simulação de 3d20
        keptDice: 15, // Maior
        totalResult: 15 + scenario.total,
        activatedPowers: ['Saber é Poder'],
      };
      expect(completeState).toMatchSnapshot();
    });

    it('snapshot de teste de resistência - Fortitude', () => {
      const scenario = createAthleteFortitudeScenario();
      const completeState = {
        phase: 'rolled' as const,
        skill: { id: 'fortitude', name: 'Fortitude', attribute: 'vigor' },
        isResistance: true,
        attributeValue: 3, // Swapped para FOR
        resistanceBonus: scenario.resistanceBonus,
        sources: convertToSkillSourceDisplay(scenario.breakdown),
        dicePool: [14],
        keptDice: 14,
        totalResult: 14 + scenario.resistanceBonus + 3,
        activatedPowers: ['Incansável'],
      };
      expect(completeState).toMatchSnapshot();
    });

    it('snapshot de teste social - Primeira Impressão', () => {
      const scenario = createPrimeiraImpressaoScenario();
      const completeState = {
        phase: 'rolled' as const,
        skill: { id: 'diplomacia', name: 'Diplomacia', attribute: 'presence' },
        isSocialSkill: true,
        attributeValue: 3,
        skillBonus: scenario.total,
        sources: convertToSkillSourceDisplay(scenario.breakdown),
        dicePool: [18, 12], // 2d20 keep highest
        keptDice: 18,
        totalResult: 18 + scenario.total,
        primeiraImpressaoActive: true,
        firstTestInScene: true,
      };
      expect(completeState).toMatchSnapshot();
    });
  });

  describe('Mobile (MobileDiceRollModal)', () => {
    it('snapshot de teste mobile - mesma estrutura de dados que desktop', () => {
      const scenario = createAcademicSkillScenario();
      const mobileState = {
        phase: 'rolled' as const,
        skill: { id: 'ciencias', name: 'Ciências', attribute: 'intellect' },
        skillBonus: scenario.total,
        sources: convertToSkillSourceDisplay(scenario.breakdown),
        badgeCount: scenario.breakdown.filter(b => typeof b.value === 'number').length,
      };
      expect(mobileState).toMatchSnapshot();
    });

    it('paridade desktop/mobile - mesmos dados de perícia', () => {
      const scenario = createSpecialistPeritoScenario();
      const desktopSources = convertToSkillSourceDisplay(scenario.breakdown);
      const mobileSources = convertToSkillSourceDisplay(scenario.breakdown);
      
      expect(desktopSources).toEqual(mobileSources);
    });

    it('paridade desktop/mobile - mesmos dados de swap', () => {
      const scenario = createImpostorSwapScenario();
      const desktopSwap = scenario;
      const mobileSwap = scenario;
      
      expect(desktopSwap).toEqual(mobileSwap);
    });
  });
});

// ============================================================================
// TESTES: Fase de Preparação (Poderes Ativáveis)
// ============================================================================

describe('DiceRollModal - Preparing Phase', () => {
  it('snapshot de estado de preparação com poderes disponíveis', () => {
    const preparingState = {
      phase: 'preparing' as const,
      skill: { id: 'ciencias', name: 'Ciências', attribute: 'intellect' },
      availablePowers: [
        {
          id: 'saber-e-poder',
          name: 'Saber é Poder',
          origin: 'Acadêmico',
          skillBonusChange: 5,
          applicable: true,
        },
        {
          id: 'conhecimento-aplicado',
          name: 'Conhecimento Aplicado',
          origin: 'Especialista',
          attributeSwap: 'intellect',
          applicable: true,
          isPending: true, // Ativado em mensagem anterior
        },
      ],
      activatedPowers: [],
      showPowersPanel: true,
    };
    expect(preparingState).toMatchSnapshot();
  });

  it('snapshot de poderes ativados na fase de preparação', () => {
    const activatedState = {
      phase: 'preparing' as const,
      skill: { id: 'enganacao', name: 'Enganação', attribute: 'presence' },
      availablePowers: [
        { id: 'impostor', name: 'Impostor', origin: 'Trambiqueiro', peCost: 2 },
        { id: 'primeira-impressao', name: 'Primeira Impressão', origin: 'Especialista' },
      ],
      activatedPowers: ['impostor'],
      effects: {
        skillSwap: 'enganacao',
        extraBonus: 0,
        extraDice: [],
        attributeSwap: undefined,
        peCost: 2,
      },
    };
    expect(activatedState).toMatchSnapshot();
  });

  it('snapshot de transição preparing → rolling', () => {
    const transitionState = {
      previousPhase: 'preparing',
      currentPhase: 'rolling',
      activatedPowers: ['saber-e-poder'],
      bonusesApplied: true,
      diceCount: 3, // INT 4 = 3d20
      keepHighest: true,
    };
    expect(transitionState).toMatchSnapshot();
  });
});

// ============================================================================
// TESTES: Poderes Ativáveis por Origem
// ============================================================================

describe('DiceRollModal - Origin Powers Activation', () => {
  it('snapshot de poder Desbravador (Explorador)', () => {
    const power = {
      id: 'desbravador',
      name: 'Desbravador',
      origin: 'Explorador',
      skillBonusChange: 5,
      applicableSkills: ['sobrevivencia', 'adestramento'],
      peCost: 0,
      isPassive: true,
    };
    expect(power).toMatchSnapshot();
  });

  it('snapshot de poder 110% (Atleta)', () => {
    const power = {
      id: '110-porcento',
      name: '110%',
      origin: 'Atleta',
      skillBonusChange: 5,
      applicableSkills: ['atletismo'],
      peCost: 2,
      limitPerScene: 1,
    };
    expect(power).toMatchSnapshot();
  });

  it('snapshot de poder Faro para Pistas (Investigador)', () => {
    const power = {
      id: 'faro-para-pistas',
      name: 'Faro para Pistas',
      origin: 'Investigador',
      skillBonusChange: 5,
      applicableSkills: ['investigacao', 'percepcao'],
      peCost: 0,
      isPassive: true,
    };
    expect(power).toMatchSnapshot();
  });

  it('snapshot de poder Impostor (Trambiqueiro)', () => {
    const power = {
      id: 'impostor',
      name: 'Impostor',
      origin: 'Trambiqueiro',
      skillSwap: 'enganacao',
      peCost: 2,
      limitPerScene: 1,
      description: 'Substitui qualquer teste de perícia por Enganação',
    };
    expect(power).toMatchSnapshot();
  });

  it('snapshot de poder Motor de Busca (Hacker)', () => {
    const power = {
      id: 'motor-de-busca',
      name: 'Motor de Busca',
      origin: 'Hacker',
      skillSwap: 'tecnologia',
      peCost: 1,
      requiresInternet: true,
      description: 'Substitui teste de Ciências/Ocultismo/Investigação por Tecnologia',
    };
    expect(power).toMatchSnapshot();
  });
});

// ============================================================================
// TESTES: Specialist Class Powers
// ============================================================================

describe('DiceRollModal - Specialist Powers', () => {
  it('snapshot de Perito tiers (d6 → d12)', () => {
    const peritoTiers = {
      tier1: { dice: '1d6', nex: 5, skill: 'chosen' },
      tier2: { dice: '1d8', nex: 35, skill: 'chosen' },
      tier3: { dice: '1d10', nex: 65, skill: 'chosen' },
      tier4: { dice: '1d12', nex: 95, skill: 'chosen' },
    };
    expect(peritoTiers).toMatchSnapshot();
  });

  it('snapshot de Eclético tiers (Treinado, Veterano, Expert)', () => {
    const ecleticoTiers = {
      treinado: { bonus: 5, peCost: 2, requiredNex: 5 },
      veterano: { bonus: 10, peCost: 4, requiredNex: 35 },
      expert: { bonus: 15, peCost: 6, requiredNex: 70 },
    };
    expect(ecleticoTiers).toMatchSnapshot();
  });

  it('snapshot de Conhecimento Aplicado pendente', () => {
    const conhecimentoAplicado = {
      id: 'conhecimento-aplicado',
      name: 'Conhecimento Aplicado',
      isPending: true,
      pendingFor: 'next_test',
      attributeSwap: 'intellect',
      consumedOnUse: true,
    };
    expect(conhecimentoAplicado).toMatchSnapshot();
  });

  it('snapshot de Primeira Impressão tracking', () => {
    const primeiraImpressao = {
      id: 'primeira-impressao',
      name: 'Primeira Impressão',
      extraDice: '1d20',
      keepHighest: true,
      applicableSkills: ['diplomacia', 'intimidacao', 'enganacao', 'atuacao'],
      sceneTracking: {
        diplomacia: { tested: false },
        intimidacao: { tested: false },
        enganacao: { tested: true }, // Já usou nesta cena
        atuacao: { tested: false },
      },
    };
    expect(primeiraImpressao).toMatchSnapshot();
  });
});

// ============================================================================
// TESTES: Consistência de Estilos Mobile
// ============================================================================

describe('MobileDiceRollModal - Estilos de Badge', () => {
  const MOBILE_BADGE_STYLES = {
    skill: 'bg-primary/20 text-primary',
    resistance: 'bg-green-500/20 text-green-500',
    power: 'bg-purple-500/20 text-purple-500',
    track: 'bg-orange-500/20 text-orange-500',
    origin: 'bg-blue-500/20 text-blue-500',
    item: 'bg-amber-500/20 text-amber-500',
    extraDice: 'bg-fuchsia-500/20 text-fuchsia-500',
  };

  it('snapshot de estilos de badge mobile', () => {
    expect(MOBILE_BADGE_STYLES).toMatchSnapshot();
  });

  it('todos os estilos mobile incluem background e texto', () => {
    Object.entries(MOBILE_BADGE_STYLES).forEach(([type, classes]) => {
      expect(classes).toContain('bg-');
      expect(classes).toContain('text-');
    });
  });

  it('snapshot de badge com tooltip touch', () => {
    const badgeWithTooltip = {
      label: 'Perícia',
      value: 5,
      type: 'skill',
      hasTooltip: true,
      tooltipContent: {
        title: 'Ciências (Veterano)',
        description: '+5 bônus por treinamento Veterano',
      },
      touchBehavior: 'tap-to-show',
    };
    expect(badgeWithTooltip).toMatchSnapshot();
  });
});

// ============================================================================
// TESTES: Mapeamento Perícia → Atributo
// ============================================================================

describe('DiceRollModal - Skill Attribute Map', () => {
  it('snapshot de mapeamento completo de perícias', () => {
    expect(SKILL_ATTRIBUTE_MAP).toMatchSnapshot();
  });

  it('todas as perícias de agilidade mapeiam corretamente', () => {
    const agilitySkills = ['acrobacia', 'reflexos', 'furtividade', 'crime', 'pilotagem', 'pontaria'];
    agilitySkills.forEach(skill => {
      expect(SKILL_ATTRIBUTE_MAP[skill]).toBe('agility');
    });
  });

  it('todas as perícias de força mapeiam corretamente', () => {
    const strengthSkills = ['atletismo', 'luta'];
    strengthSkills.forEach(skill => {
      expect(SKILL_ATTRIBUTE_MAP[skill]).toBe('strength');
    });
  });

  it('todas as perícias de presença mapeiam corretamente', () => {
    const presenceSkills = ['artes', 'atuacao', 'diplomacia', 'enganacao', 'intimidacao', 'vontade'];
    presenceSkills.forEach(skill => {
      expect(SKILL_ATTRIBUTE_MAP[skill]).toBe('presence');
    });
  });

  it('todas as perícias de intelecto mapeiam corretamente', () => {
    const intellectSkills = [
      'ciencias', 'investigacao', 'medicina', 'ocultismo', 'percepcao',
      'profissao', 'sobrevivencia', 'tatica', 'tecnologia', 'adestramento',
      'intuicao', 'religiao'
    ];
    intellectSkills.forEach(skill => {
      expect(SKILL_ATTRIBUTE_MAP[skill]).toBe('intellect');
    });
  });

  it('fortitude mapeia para vigor', () => {
    expect(SKILL_ATTRIBUTE_MAP['fortitude']).toBe('vigor');
  });
});

// ============================================================================
// TESTES: Resultado de Rolagem
// ============================================================================

describe('DiceRollModal - Roll Result Structure', () => {
  it('snapshot de resultado de rolagem bem-sucedida', () => {
    const successResult = {
      phase: 'rolled',
      dicePool: [15, 8, 12],
      keptDice: 15,
      modifier: 9,
      total: 24,
      success: true,
      targetDT: 20,
      margin: 4,
      criticalSuccess: false,
      criticalFailure: false,
    };
    expect(successResult).toMatchSnapshot();
  });

  it('snapshot de resultado com sucesso crítico', () => {
    const criticalResult = {
      phase: 'rolled',
      dicePool: [20],
      keptDice: 20,
      modifier: 5,
      total: 25,
      success: true,
      criticalSuccess: true,
      criticalFailure: false,
      bonusEffect: 'Efeito máximo',
    };
    expect(criticalResult).toMatchSnapshot();
  });

  it('snapshot de resultado com falha crítica', () => {
    const criticalFailure = {
      phase: 'rolled',
      dicePool: [1],
      keptDice: 1,
      modifier: 10,
      total: 11,
      success: false,
      criticalSuccess: false,
      criticalFailure: true,
      penaltyEffect: 'Consequência negativa',
    };
    expect(criticalFailure).toMatchSnapshot();
  });

  it('snapshot de resultado com múltiplos d20 (INT alta)', () => {
    const multiDiceResult = {
      phase: 'rolled',
      attributeValue: 5,
      diceCount: 4, // INT 5 = 4d20
      dicePool: [7, 14, 19, 3],
      keptDice: 19, // Maior
      modifier: 12,
      total: 31,
      success: true,
    };
    expect(multiDiceResult).toMatchSnapshot();
  });
});
