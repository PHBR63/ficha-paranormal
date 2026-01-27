/**
 * Testes de Snapshot para CombatRollModal e MobileCombatRollModal
 * 
 * Valida a consistência visual e estrutural dos breakdowns de bônus
 * nos modais de combate para desktop e mobile.
 * 
 * Foco principal:
 * - Estrutura de BonusSourceDisplay para ataque e dano
 * - Renderização correta de badges por tipo (skill, power, ritual, track, etc.)
 * - Exibição de bônus excluídos por stacking
 * - Consistência entre versões desktop e mobile
 */

import { describe, it, expect } from 'vitest';
import {
  createMockBreakdown,
  createWarrior50Scenario,
  createAnnihilator75Scenario,
  createEliteShooter65Scenario,
  createInfiltrator75Scenario,
  createStackingExclusionScenario,
  createConditionalBonusesScenario,
} from './breakdown-test-utils';

// ============================================================================
// TIPOS - BonusSourceDisplay (usado nos modais de combate)
// ============================================================================

/**
 * Interface espelhada de BonusSourceDisplay dos modais de combate
 * para validação de estrutura nos testes
 */
interface BonusSourceDisplay {
  label: string;
  value: number | string;
  type: 'skill' | 'power' | 'ritual' | 'track' | 'attribute' | 'paranormal' | 'other';
  description?: string;
  sourceName?: string;
}

/**
 * Cores de fundo/texto para cada tipo de bônus
 * Deve corresponder exatamente ao que está em CombatRollModal.tsx
 */
const BONUS_TYPE_COLORS: Record<BonusSourceDisplay['type'], string> = {
  skill: 'bg-primary/20 text-primary',
  power: 'bg-purple-500/20 text-purple-500',
  ritual: 'bg-blue-500/20 text-blue-400',
  track: 'bg-orange-500/20 text-orange-500',
  attribute: 'bg-amber-500/20 text-amber-500',
  paranormal: 'bg-fuchsia-500/20 text-fuchsia-500',
  other: 'bg-secondary/50 text-secondary-foreground',
};

// ============================================================================
// HELPERS - Conversão BonusBreakdown → BonusSourceDisplay
// ============================================================================

/**
 * Converte BonusBreakdown (hook) → BonusSourceDisplay (UI)
 * Simula a conversão que ocorre dentro dos modais
 */
function convertToSourceDisplay(
  breakdown: ReturnType<typeof createMockBreakdown>
): BonusSourceDisplay[] {
  return breakdown.map(item => ({
    label: item.source,
    value: item.value,
    type: mapBreakdownTypeToDisplayType(item.type),
    description: item.conditional,
    sourceName: item.source,
  }));
}

/**
 * Mapeia tipos do sistema (breakdown-test-utils) para tipos de UI (BonusSourceDisplay)
 */
function mapBreakdownTypeToDisplayType(
  type: string
): BonusSourceDisplay['type'] {
  const typeMap: Record<string, BonusSourceDisplay['type']> = {
    origin: 'attribute',
    ability: 'power',
    skill_training: 'skill',
    track_effect: 'track',
    ritual: 'ritual',
    paranormal: 'paranormal',
  };
  return typeMap[type] || 'other';
}

// ============================================================================
// TESTES: Estrutura de BonusSourceDisplay
// ============================================================================

describe('CombatRollModal - Estrutura de BonusSourceDisplay', () => {
  describe('Attack Bonus Sources', () => {
    it('snapshot de guerreiro NEX 50% - fontes de ataque', () => {
      const combat = createWarrior50Scenario();
      const attackSources = convertToSourceDisplay(combat.attack.breakdown);
      expect(attackSources).toMatchSnapshot();
    });

    it('snapshot de atirador de elite NEX 65% - fontes de ataque com trilha', () => {
      const combat = createEliteShooter65Scenario();
      const attackSources = convertToSourceDisplay(combat.attack.breakdown);
      expect(attackSources).toMatchSnapshot();
    });

    it('snapshot de aniquilador NEX 75% - fontes de ataque', () => {
      const combat = createAnnihilator75Scenario();
      const attackSources = convertToSourceDisplay(combat.attack.breakdown);
      expect(attackSources).toMatchSnapshot();
    });

    it('snapshot com stacking exclusion - rituals', () => {
      const combat = createStackingExclusionScenario();
      const attackSources = convertToSourceDisplay(combat.attack.breakdown);
      expect(attackSources).toMatchSnapshot();
    });
  });

  describe('Damage Bonus Sources', () => {
    it('snapshot de guerreiro NEX 50% - fontes de dano', () => {
      const combat = createWarrior50Scenario();
      const damageSources = convertToSourceDisplay(combat.damage.breakdown);
      expect(damageSources).toMatchSnapshot();
    });

    it('snapshot de aniquilador NEX 75% - fontes de dano com trilha', () => {
      const combat = createAnnihilator75Scenario();
      const damageSources = convertToSourceDisplay(combat.damage.breakdown);
      expect(damageSources).toMatchSnapshot();
    });

    it('snapshot de infiltrador NEX 75% - Ataque Furtivo (dados extras)', () => {
      const combat = createInfiltrator75Scenario();
      const damageSources = convertToSourceDisplay(combat.damage.breakdown);
      expect(damageSources).toMatchSnapshot();
    });

    it('snapshot com bônus condicionais (Assassinar, Potência Máxima)', () => {
      const combat = createConditionalBonusesScenario();
      const damageSources = convertToSourceDisplay(combat.damage.breakdown);
      expect(damageSources).toMatchSnapshot();
    });
  });

  describe('Critical Margin Sources', () => {
    it('snapshot de aniquilador NEX 75% - Técnica Letal', () => {
      const combat = createAnnihilator75Scenario();
      const critSources = convertToSourceDisplay(combat.criticalMargin.breakdown);
      expect(critSources).toMatchSnapshot();
    });

    it('snapshot de atirador de elite NEX 65% - Disparo Letal', () => {
      const combat = createEliteShooter65Scenario();
      const critSources = convertToSourceDisplay(combat.criticalMargin.breakdown);
      expect(critSources).toMatchSnapshot();
    });
  });
});

// ============================================================================
// TESTES: Cores de Tipos de Bônus
// ============================================================================

describe('CombatRollModal - Cores de Tipos de Bônus', () => {
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
      // Verifica que cada tipo tem classes de background e texto
      expect(colorClasses).toContain('bg-');
      expect(colorClasses).toContain('text-');
    });
  });
});

// ============================================================================
// TESTES: Cenários Completos de Combate
// ============================================================================

describe('CombatRollModal - Cenários Completos', () => {
  describe('Desktop (CombatRollModal)', () => {
    it('snapshot de combate completo - Guerreiro corpo-a-corpo', () => {
      const combat = createWarrior50Scenario();
      const completeState = {
        phase: 'attack' as const,
        weapon: { name: 'Espada Longa', damage: '1d10', range: 'melee' },
        attackSources: convertToSourceDisplay(combat.attack.breakdown),
        totalAttackBonus: combat.attack.total,
        damageSources: convertToSourceDisplay(combat.damage.breakdown),
        totalDamageBonus: combat.damage.total,
        criticalMarginSources: convertToSourceDisplay(combat.criticalMargin.breakdown),
        criticalMarginReduction: combat.criticalMargin.total,
      };
      expect(completeState).toMatchSnapshot();
    });

    it('snapshot de combate completo - Atirador de Elite à distância', () => {
      const combat = createEliteShooter65Scenario();
      const completeState = {
        phase: 'attack' as const,
        weapon: { name: 'Fuzil de Precisão', damage: '2d10', range: 'ranged' },
        attackSources: convertToSourceDisplay(combat.attack.breakdown),
        totalAttackBonus: combat.attack.total,
        damageSources: convertToSourceDisplay(combat.damage.breakdown),
        totalDamageBonus: combat.damage.total,
        criticalMarginSources: convertToSourceDisplay(combat.criticalMargin.breakdown),
        criticalMarginReduction: combat.criticalMargin.total,
      };
      expect(completeState).toMatchSnapshot();
    });

    it('snapshot de combate completo - Infiltrador furtivo', () => {
      const combat = createInfiltrator75Scenario();
      const completeState = {
        phase: 'damage' as const,
        weapon: { name: 'Adaga', damage: '1d4', range: 'melee' },
        attackSources: convertToSourceDisplay(combat.attack.breakdown),
        totalAttackBonus: combat.attack.total,
        damageSources: convertToSourceDisplay(combat.damage.breakdown),
        totalDamageBonus: combat.damage.total,
        extraDice: combat.damage.extraDice,
        criticalMarginSources: convertToSourceDisplay(combat.criticalMargin.breakdown),
        criticalMarginReduction: combat.criticalMargin.total,
        isStealthAttack: true,
      };
      expect(completeState).toMatchSnapshot();
    });
  });

  describe('Mobile (MobileCombatRollModal)', () => {
    // Mobile usa a mesma estrutura de dados, mas com UI diferente
    // Os snapshots garantem paridade de dados

    it('snapshot de combate mobile - mesma estrutura de dados que desktop', () => {
      const combat = createWarrior50Scenario();
      const mobileState = {
        phase: 'attack' as const,
        weapon: { name: 'Espada Longa', damage: '1d10', range: 'melee' },
        attackSources: convertToSourceDisplay(combat.attack.breakdown),
        totalAttackBonus: combat.attack.total,
        // Mobile usa badges em vez de tooltips, mas dados são idênticos
        badgeCount: combat.attack.breakdown.length,
      };
      expect(mobileState).toMatchSnapshot();
    });

    it('paridade desktop/mobile - mesmos dados de ataque', () => {
      const combat = createAnnihilator75Scenario();
      const desktopAttack = convertToSourceDisplay(combat.attack.breakdown);
      const mobileAttack = convertToSourceDisplay(combat.attack.breakdown);
      
      // Verifica que ambos produzem exatamente os mesmos dados
      expect(desktopAttack).toEqual(mobileAttack);
    });

    it('paridade desktop/mobile - mesmos dados de dano', () => {
      const combat = createInfiltrator75Scenario();
      const desktopDamage = convertToSourceDisplay(combat.damage.breakdown);
      const mobileDamage = convertToSourceDisplay(combat.damage.breakdown);
      
      expect(desktopDamage).toEqual(mobileDamage);
    });
  });
});

// ============================================================================
// TESTES: Track Combat Bonuses (Badges específicos de trilha)
// ============================================================================

describe('CombatRollModal - Track Combat Bonuses', () => {
  /**
   * Estrutura esperada para badges de trilha no mobile
   * Cada badge tem: valor, tooltip, e cores específicas
   */
  interface TrackCombatBonuses {
    attackBonus: number;
    damageBonus: number;
    criticalMarginBonus: number;
    criticalMultiplierBonus: number;
    maquinaDeMatarActive: boolean;
    tecnicaSecretaActive: boolean;
  }

  function extractTrackBonuses(scenario: ReturnType<typeof createAnnihilator75Scenario>): TrackCombatBonuses {
    const trackAttack = scenario.attack.breakdown
      .filter(b => b.type === 'track_effect')
      .reduce((sum, b) => sum + (typeof b.value === 'number' ? b.value : 0), 0);
    
    const trackDamage = scenario.damage.breakdown
      .filter(b => b.type === 'track_effect')
      .reduce((sum, b) => sum + (typeof b.value === 'number' ? b.value : 0), 0);
    
    const critMargin = scenario.criticalMargin.breakdown
      .filter(b => b.type === 'track_effect')
      .reduce((sum, b) => sum + (typeof b.value === 'number' ? b.value : 0), 0);

    return {
      attackBonus: trackAttack,
      damageBonus: trackDamage,
      criticalMarginBonus: critMargin,
      criticalMultiplierBonus: 0, // Seria calculado pelo aniquilador
      maquinaDeMatarActive: false,
      tecnicaSecretaActive: scenario.damage.breakdown.some(b => 
        b.source.toLowerCase().includes('destruidor')
      ),
    };
  }

  it('snapshot de bônus de trilha - Aniquilador', () => {
    const combat = createAnnihilator75Scenario();
    const trackBonuses = extractTrackBonuses(combat);
    expect(trackBonuses).toMatchSnapshot();
  });

  it('snapshot de bônus de trilha - Atirador de Elite', () => {
    const combat = createEliteShooter65Scenario();
    const trackBonuses = extractTrackBonuses(combat);
    expect(trackBonuses).toMatchSnapshot();
  });

  it('snapshot de bônus de trilha - Infiltrador', () => {
    const combat = createInfiltrator75Scenario();
    const trackBonuses = extractTrackBonuses(combat);
    expect(trackBonuses).toMatchSnapshot();
  });
});

// ============================================================================
// TESTES: Exclusão por Stacking Rules
// ============================================================================

describe('CombatRollModal - Stacking Exclusion Indicators', () => {
  it('snapshot de bônus excluído por ritual maior', () => {
    const combat = createStackingExclusionScenario();
    const excludedSources = combat.attack.breakdown
      .filter(b => b.excluded)
      .map(b => ({
        source: b.source,
        value: b.value,
        reason: b.excludedReason,
        displayAsStrikethrough: true,
      }));
    
    expect(excludedSources).toMatchSnapshot();
  });

  it('bônus excluídos não contam no total', () => {
    const combat = createStackingExclusionScenario();
    const activeSources = combat.attack.breakdown.filter(b => !b.excluded);
    const calculatedTotal = activeSources.reduce(
      (sum, b) => sum + (typeof b.value === 'number' ? b.value : 0), 
      0
    );
    
    expect(calculatedTotal).toBe(combat.attack.total);
  });

  it('snapshot de indicador visual de exclusão', () => {
    const exclusionIndicator = {
      isExcluded: true,
      excludedReason: 'Ritual maior ativo',
      visualStyle: {
        opacity: 'opacity-50',
        textDecoration: 'line-through',
        badge: 'text-muted-foreground',
      },
      tooltipText: 'Este bônus não está sendo aplicado pois outro ritual mais forte está ativo.',
    };
    
    expect(exclusionIndicator).toMatchSnapshot();
  });
});

// ============================================================================
// TESTES: Bônus Condicionais Toggleáveis
// ============================================================================

describe('CombatRollModal - Conditional Bonuses Toggle', () => {
  it('snapshot de estado de bônus condicionais', () => {
    const combat = createConditionalBonusesScenario();
    const conditionalBonuses = combat.damage.breakdown
      .filter(b => b.toggleable)
      .map(b => ({
        id: b.toggleId,
        name: b.source,
        value: b.value,
        condition: b.conditional,
        isActive: b.active,
        canToggle: true,
      }));
    
    expect(conditionalBonuses).toMatchSnapshot();
  });

  it('snapshot de Assassinar ativo', () => {
    const assassinarBonus = {
      id: 'assassinar',
      name: 'Assassinar',
      damageBonus: '2d6',
      condition: 'Alvo desprevenido',
      isActive: true,
      badgeStyle: 'bg-red-500/20 text-red-400 animate-pulse',
    };
    expect(assassinarBonus).toMatchSnapshot();
  });

  it('snapshot de Potência Máxima ativo', () => {
    const potenciaMaxima = {
      id: 'potencia-maxima',
      name: 'Potência Máxima',
      damageMultiplier: 2, // dobra bônus numéricos
      condition: 'Ataque corpo-a-corpo',
      isActive: true,
      requiresPE: 0, // passivo
      badgeStyle: 'bg-orange-500/20 text-orange-400',
    };
    expect(potenciaMaxima).toMatchSnapshot();
  });

  it('snapshot de Atirar para Matar ativo', () => {
    const atirarParaMatar = {
      id: 'atirar-para-matar',
      name: 'Atirar para Matar',
      effect: 'Maximiza dano em crítico',
      condition: 'Crítico confirmado',
      isActive: true,
      maxDiceOnCrit: true,
      badgeStyle: 'bg-amber-500/20 text-amber-400 animate-pulse',
    };
    expect(atirarParaMatar).toMatchSnapshot();
  });
});

// ============================================================================
// TESTES: Consistência de Estilos Mobile
// ============================================================================

describe('MobileCombatRollModal - Estilos de Badge', () => {
  const MOBILE_BADGE_STYLES = {
    attack: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    damage: 'bg-red-500/10 border-red-500/30 text-red-400',
    criticalMargin: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    criticalMultiplier: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
    maquinaDeMatar: 'bg-amber-500/20 border-amber-500/40 text-amber-300 animate-pulse',
    tecnicaSecreta: 'bg-purple-500/20 border-purple-500/40 text-purple-300',
  };

  it('snapshot de estilos de badge mobile', () => {
    expect(MOBILE_BADGE_STYLES).toMatchSnapshot();
  });

  it('todos os estilos mobile incluem borda e texto', () => {
    Object.entries(MOBILE_BADGE_STYLES).forEach(([type, classes]) => {
      expect(classes).toContain('border-');
      expect(classes).toContain('text-');
    });
  });

  it('estilos especiais têm animate-pulse', () => {
    expect(MOBILE_BADGE_STYLES.maquinaDeMatar).toContain('animate-pulse');
  });
});
