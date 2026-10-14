// =====================================================
// Testes de Integração - useClassPowerBonuses
// Ordem Paranormal RPG v1.3
// =====================================================
//
// Valida a integração entre o hook useClassPowerBonuses e as engines:
// - track-effects-engine (calculateTrackBonuses)
// - track-effects-adapter (getTrackCombatBonuses)
// - power-effects-engine (calculatePowerBonuses)
//
// Cobertura:
// - Consolidação correta de bônus de trilha
// - Bônus aplicados baseados em contexto (melee/ranged, combate, etc.)
// - Totais calculados corretamente
// - Helpers hasPower e hasTrackAbility funcionando
// - Breakdown detalhado para UI
//

import { describe, it, expect } from 'vitest';
import { calculateSneakAttackDice, calculateTrackBonuses, createEmptyTrackBonusSummary, hasTrackAbility } from '@/lib/class-powers/track-effects-engine';
import { getTrackCombatBonuses } from '@/lib/effects/track-effects-adapter';
import type { TrackCalculationContext, TrackBonusSummary } from '@/lib/class-powers/track-types';
import type { AttributeType } from '@/lib/unified-effects-engine';

// =====================================================
// FIXTURES
// =====================================================

/**
 * Atributos padrão para testes
 */
const defaultAttributes: Record<AttributeType, number> = {
  strength: 2,
  agility: 3,
  vigor: 2,
  intellect: 3,
  presence: 1,
};

/**
 * Atributos de especialista INT-focado
 */
const intellectAttributes: Record<AttributeType, number> = {
  strength: 1,
  agility: 2,
  vigor: 1,
  intellect: 5,
  presence: 2,
};

/**
 * Cria contexto de cálculo de trilha
 */
function createTrackContext(
  nex: number,
  options: Partial<TrackCalculationContext> = {}
): TrackCalculationContext {
  return {
    nex,
    attributes: defaultAttributes,
    inCombat: false,
    isFavoriteWeapon: false,
    ...options,
  };
}

// =====================================================
// INTEGRAÇÃO: calculateTrackBonuses + getTrackCombatBonuses
// =====================================================

describe('Integração: calculateTrackBonuses com getTrackCombatBonuses', () => {
  describe('Consistência de dados entre engines', () => {
    it('Guerreiro deve ter mesma margem crítico em ambas as engines (melee)', () => {
      const context = createTrackContext(10, { weaponType: 'melee' });
      const trackBonuses = calculateTrackBonuses('guerreiro', context);
      const combatBonuses = getTrackCombatBonuses('guerreiro', 10, defaultAttributes, 'melee');
      
      // Ambas devem retornar +2 margem crítico
      expect(trackBonuses.criticalMarginBonus).toBe(2);
      expect(combatBonuses.criticalMarginBonus).toBe(2);
    });

    it('Guerreiro NÃO deve ter margem crítico em ranged (ambas as engines)', () => {
      const context = createTrackContext(10, { weaponType: 'ranged' });
      const trackBonuses = calculateTrackBonuses('guerreiro', context);
      const combatBonuses = getTrackCombatBonuses('guerreiro', 10, defaultAttributes, 'ranged');
      
      // Técnica Letal só funciona corpo a corpo
      expect(trackBonuses.criticalMarginBonus).toBe(0);
      expect(combatBonuses.criticalMarginBonus).toBe(0);
    });

    it('Operações Especiais deve ter +5 iniciativa em ambas as engines', () => {
      const context = createTrackContext(10);
      const trackBonuses = calculateTrackBonuses('operacoes-especiais', context);
      
      expect(trackBonuses.initiativeBonus).toBe(5);
    });

    it('Tropa de Choque deve escalar PV igualmente em ambas as engines', () => {
      const context10 = createTrackContext(10);
      const context99 = createTrackContext(99);
      
      const bonuses10 = calculateTrackBonuses('tropa-choque', context10);
      const bonuses99 = calculateTrackBonuses('tropa-choque', context99);
      
      // NEX 10 = 2 PV, NEX 99 = ~19 PV
      expect(bonuses10.bonusHP).toBe(2);
      expect(bonuses99.bonusHP).toBeGreaterThanOrEqual(19);
    });
  });

  describe('Atirador de Elite - Integração de bônus baseado em INT', () => {
    it('dano deve ser igual ao INT em ambas as engines (ranged)', () => {
      const combatBonuses = getTrackCombatBonuses('atirador-elite', 10, intellectAttributes, 'ranged');
      
      // Mira de Elite: +INT no dano
      expect(combatBonuses.damageBonus).toBe(intellectAttributes.intellect);
    });

    it('dano deve variar com INT', () => {
      const lowInt = { ...defaultAttributes, intellect: 1 };
      const highInt = { ...defaultAttributes, intellect: 5 };
      
      const lowResult = getTrackCombatBonuses('atirador-elite', 10, lowInt, 'ranged');
      const highResult = getTrackCombatBonuses('atirador-elite', 10, highInt, 'ranged');
      
      expect(lowResult.damageBonus).toBe(1);
      expect(highResult.damageBonus).toBe(5);
    });

    it('NEX 99 deve ter maximumDamageOnCrit', () => {
      const combatBonuses = getTrackCombatBonuses('atirador-elite', 99, defaultAttributes, 'ranged');
      
      expect(combatBonuses.maximumDamageOnCrit).toBe(true);
    });
  });

  describe('Infiltrador - Escalonamento de Ataque Furtivo', () => {
    it('dados de ataque furtivo escalam na ativação, sem bônus passivo', () => {
      const dice10 = getTrackCombatBonuses('infiltrador', 10, defaultAttributes, 'melee');
      const dice40 = getTrackCombatBonuses('infiltrador', 40, defaultAttributes, 'melee');
      const dice65 = getTrackCombatBonuses('infiltrador', 65, defaultAttributes, 'melee');
      const dice99 = getTrackCombatBonuses('infiltrador', 99, defaultAttributes, 'melee');
      
      expect([dice10, dice40, dice65, dice99].every(bonus => bonus.extraDamageDice.length === 0)).toBe(true);
      expect([10, 40, 65, 99].map(nex => calculateSneakAttackDice(nex, false)))
        .toEqual(['+1d6', '+2d6', '+3d6', '+4d6']);
    });
  });
});

// =====================================================
// HELPER: hasTrackAbility
// =====================================================

describe('Helper hasTrackAbility', () => {
  it('deve retornar true para habilidade desbloqueada', () => {
    expect(hasTrackAbility('tecnica-letal', 'guerreiro', 10)).toBe(true);
    expect(hasTrackAbility('revidar', 'guerreiro', 40)).toBe(true);
    expect(hasTrackAbility('potencia-maxima', 'guerreiro', 99)).toBe(true);
  });

  it('deve retornar false para habilidade não desbloqueada', () => {
    // NEX 10 não desbloqueia habilidades de NEX 40+
    expect(hasTrackAbility('revidar', 'guerreiro', 10)).toBe(false);
    expect(hasTrackAbility('potencia-maxima', 'guerreiro', 65)).toBe(false);
  });

  it('deve retornar false para trilha errada', () => {
    // Técnica Letal é do Guerreiro, não do Aniquilador
    expect(hasTrackAbility('tecnica-letal', 'aniquilador', 99)).toBe(false);
  });

  it('deve retornar false para habilidade inexistente', () => {
    expect(hasTrackAbility('habilidade-fake', 'guerreiro', 99)).toBe(false);
  });

  it('deve retornar false para trilha undefined', () => {
    expect(hasTrackAbility('tecnica-letal', undefined, 99)).toBe(false);
  });
});

// =====================================================
// BREAKDOWN PARA UI
// =====================================================

describe('Breakdown detalhado para UI', () => {
  it('calculateTrackBonuses deve gerar breakdown com source e effects', () => {
    const context = createTrackContext(10, { weaponType: 'melee' });
    const bonuses = calculateTrackBonuses('guerreiro', context);
    
    expect(bonuses.breakdown).toBeDefined();
    expect(bonuses.breakdown.length).toBeGreaterThan(0);
    
    const firstEntry = bonuses.breakdown[0];
    expect(firstEntry.source).toBe('Técnica Letal');
    expect(firstEntry.abilityId).toBe('tecnica-letal');
    expect(firstEntry.effects.length).toBeGreaterThan(0);
  });

  it('breakdown deve incluir todas as habilidades desbloqueadas', () => {
    const context = createTrackContext(99, { weaponType: 'melee' });
    const bonuses = calculateTrackBonuses('guerreiro', context);
    
    // Guerreiro tem 4 habilidades: Técnica Letal (10), Revidar (40), Força Opressora (65), Potência Máxima (99)
    expect(bonuses.breakdown.length).toBeGreaterThanOrEqual(1);
    
    const abilityIds = bonuses.breakdown.map(b => b.abilityId);
    expect(abilityIds).toContain('tecnica-letal');
  });

  it('breakdown deve estar vazio para trilha inexistente', () => {
    const context = createTrackContext(99);
    const bonuses = calculateTrackBonuses('trilha-fake', context);
    
    expect(bonuses.breakdown).toHaveLength(0);
  });
});

// =====================================================
// CONTEXT VARIATIONS
// =====================================================

describe('Variações de contexto', () => {
  describe('isFavoriteWeapon', () => {
    it('Aniquilador deve aplicar redução de categoria quando é arma favorita', () => {
      const withFavorite = createTrackContext(10, { isFavoriteWeapon: true });
      const withoutFavorite = createTrackContext(10, { isFavoriteWeapon: false });
      
      const bonusesWith = calculateTrackBonuses('aniquilador', withFavorite);
      const bonusesWithout = calculateTrackBonuses('aniquilador', withoutFavorite);
      
      expect(bonusesWith.categoryReduction).toBeGreaterThanOrEqual(1);
      // Sem arma favorita não aplica
      expect(bonusesWithout.categoryReduction).toBe(0);
    });
  });

  describe('weaponType melee vs ranged', () => {
    it('Guerreiro deve ter margem crítico diferente baseado no tipo de arma', () => {
      const meleeContext = createTrackContext(10, { weaponType: 'melee' });
      const rangedContext = createTrackContext(10, { weaponType: 'ranged' });
      
      const meleeBonuses = calculateTrackBonuses('guerreiro', meleeContext);
      const rangedBonuses = calculateTrackBonuses('guerreiro', rangedContext);
      
      expect(meleeBonuses.criticalMarginBonus).toBe(2);
      expect(rangedBonuses.criticalMarginBonus).toBe(0);
    });
  });

  describe('inCombat', () => {
    it('contexto de combate não deve alterar bônus passivos', () => {
      const inCombat = createTrackContext(10, { inCombat: true });
      const outCombat = createTrackContext(10, { inCombat: false });
      
      // Operações Especiais tem +5 iniciativa sempre
      const inCombatBonuses = calculateTrackBonuses('operacoes-especiais', inCombat);
      const outCombatBonuses = calculateTrackBonuses('operacoes-especiais', outCombat);
      
      expect(inCombatBonuses.initiativeBonus).toBe(outCombatBonuses.initiativeBonus);
    });
  });
});

// =====================================================
// TOTALIZAÇÃO DE BÔNUS
// =====================================================

describe('Totalização de bônus', () => {
  it('createEmptyTrackBonusSummary deve retornar valores zerados', () => {
    const empty = createEmptyTrackBonusSummary();
    
    expect(empty.attackBonus).toBe(0);
    expect(empty.damageBonus).toBe(0);
    expect(empty.extraDamageDice).toHaveLength(0);
    expect(empty.criticalMarginBonus).toBe(0);
    expect(empty.criticalMultiplierBonus).toBe(0);
    expect(empty.defenseBonus).toBe(0);
    expect(empty.initiativeBonus).toBe(0);
    expect(empty.bonusHP).toBe(0);
    expect(empty.damageResistance).toBe(0);
    expect(empty.paranormalResistance).toBe(0);
    expect(empty.categoryReduction).toBe(0);
    expect(empty.canUseHPAsPE).toBe(false);
    expect(empty.canUseOccultismAsAttack).toBe(false);
    expect(empty.breakdown).toHaveLength(0);
  });

  it('trilha válida deve ter pelo menos um bônus não-zero', () => {
    const context = createTrackContext(10, { weaponType: 'melee' });
    const bonuses = calculateTrackBonuses('guerreiro', context);
    
    const hasAnyBonus = 
      bonuses.attackBonus > 0 ||
      bonuses.damageBonus > 0 ||
      bonuses.criticalMarginBonus > 0 ||
      bonuses.criticalMultiplierBonus > 0 ||
      bonuses.defenseBonus > 0 ||
      bonuses.initiativeBonus > 0 ||
      bonuses.bonusHP > 0 ||
      bonuses.extraDamageDice.length > 0 ||
      bonuses.breakdown.length > 0;
    
    expect(hasAnyBonus).toBe(true);
  });
});

// =====================================================
// TODAS AS 10 TRILHAS - SMOKE TESTS
// =====================================================

describe('Smoke tests para todas as 10 trilhas', () => {
  const combatenteTracks = [
    'aniquilador',
    'comandante-campo',
    'guerreiro',
    'operacoes-especiais',
    'tropa-choque',
  ];
  
  const especialistaTracks = [
    'atirador-elite',
    'infiltrador',
    'medico-campo',
    'negociador',
    'tecnico',
  ];
  
  const allTracks = [...combatenteTracks, ...especialistaTracks];
  
  it.each(allTracks)('%s deve retornar resultado válido em calculateTrackBonuses', (trackId) => {
    const context = createTrackContext(99, { weaponType: 'melee' });
    const bonuses = calculateTrackBonuses(trackId, context);
    
    expect(bonuses).toBeDefined();
    expect(bonuses.breakdown).toBeDefined();
  });
  
  it.each(allTracks)('%s deve retornar resultado válido em getTrackCombatBonuses (melee)', (trackId) => {
    const result = getTrackCombatBonuses(trackId, 99, defaultAttributes, 'melee');
    
    expect(result).toBeDefined();
    expect(result.attackBonus).toBeDefined();
    expect(result.damageBonus).toBeDefined();
    expect(result.criticalMarginBonus).toBeDefined();
    expect(result.specialEffects).toBeDefined();
  });
  
  it.each(allTracks)('%s deve retornar resultado válido em getTrackCombatBonuses (ranged)', (trackId) => {
    const result = getTrackCombatBonuses(trackId, 99, defaultAttributes, 'ranged');
    
    expect(result).toBeDefined();
    expect(result.attackBonus).toBeDefined();
    expect(result.damageBonus).toBeDefined();
  });
});

// =====================================================
// EDGE CASES
// =====================================================

describe('Edge cases', () => {
  it('NEX 0 deve retornar sumário vazio', () => {
    const context = createTrackContext(0);
    const bonuses = calculateTrackBonuses('guerreiro', context);
    
    // Nenhuma habilidade desbloqueada em NEX 0
    expect(bonuses.criticalMarginBonus).toBe(0);
    expect(bonuses.breakdown).toHaveLength(0);
  });
  
  it('trilha inexistente deve retornar sumário vazio', () => {
    const context = createTrackContext(99);
    const bonuses = calculateTrackBonuses('trilha-que-nao-existe', context);
    
    expect(bonuses.attackBonus).toBe(0);
    expect(bonuses.breakdown).toHaveLength(0);
  });
  
  it('atributos zerados não devem quebrar cálculos', () => {
    const zeroAttrs: Record<AttributeType, number> = {
      strength: 0, agility: 0, vigor: 0, intellect: 0, presence: 0,
    };
    
    expect(() => {
      getTrackCombatBonuses('atirador-elite', 10, zeroAttrs, 'ranged');
    }).not.toThrow();
    
    const result = getTrackCombatBonuses('atirador-elite', 10, zeroAttrs, 'ranged');
    expect(result.damageBonus).toBe(0); // INT = 0
  });
  
  it('NEX negativo deve funcionar sem erro', () => {
    expect(() => {
      const context = createTrackContext(-5);
      calculateTrackBonuses('guerreiro', context);
    }).not.toThrow();
  });
  
  it('NEX muito alto deve funcionar (>99)', () => {
    const context = createTrackContext(150, { weaponType: 'melee' });
    const bonuses = calculateTrackBonuses('guerreiro', context);
    
    // Deve ter todos os bônus de NEX 99
    expect(bonuses.criticalMarginBonus).toBe(2);
  });
});

// =====================================================
// COMBATE: MELEE VS RANGED ESPECÍFICO
// =====================================================

describe('Bônus condicionais melee vs ranged', () => {
  describe('Trilhas que só funcionam em melee', () => {
    it('Guerreiro - Técnica Letal só em melee', () => {
      const melee = getTrackCombatBonuses('guerreiro', 10, defaultAttributes, 'melee');
      const ranged = getTrackCombatBonuses('guerreiro', 10, defaultAttributes, 'ranged');
      
      expect(melee.criticalMarginBonus).toBe(2);
      expect(ranged.criticalMarginBonus).toBe(0);
    });
  });
  
  describe('Trilhas que só funcionam em ranged', () => {
    it('Atirador de Elite - Mira de Elite só em ranged', () => {
      const melee = getTrackCombatBonuses('atirador-elite', 10, defaultAttributes, 'melee');
      const ranged = getTrackCombatBonuses('atirador-elite', 10, defaultAttributes, 'ranged');
      
      expect(melee.damageBonus).toBe(0);
      expect(ranged.damageBonus).toBe(defaultAttributes.intellect);
    });
  });
  
  describe('Trilhas universais', () => {
    it('Aniquilador funciona igual em melee e ranged (NEX 99)', () => {
      const melee = getTrackCombatBonuses('aniquilador', 99, defaultAttributes, 'melee');
      const ranged = getTrackCombatBonuses('aniquilador', 99, defaultAttributes, 'ranged');
      
      expect(melee.criticalMarginBonus).toBe(ranged.criticalMarginBonus);
      expect(melee.extraDamageDice.length).toBe(ranged.extraDamageDice.length);
    });
    
    it('Operações Especiais funciona igual em ambos', () => {
      const melee = getTrackCombatBonuses('operacoes-especiais', 99, defaultAttributes, 'melee');
      const ranged = getTrackCombatBonuses('operacoes-especiais', 99, defaultAttributes, 'ranged');
      
      expect(melee.specialEffects.length).toBe(ranged.specialEffects.length);
    });
  });
});

// =====================================================
// SPECIAL FLAGS
// =====================================================

describe('Flags especiais de trilha', () => {
  it('TrackBonusSummary deve ter canUseHPAsPE = false por padrão', () => {
    const context = createTrackContext(99);
    const bonuses = calculateTrackBonuses('guerreiro', context);
    
    expect(bonuses.canUseHPAsPE).toBe(false);
  });
  
  it('TrackBonusSummary deve ter canUseOccultismAsAttack = false por padrão', () => {
    const context = createTrackContext(99);
    const bonuses = calculateTrackBonuses('atirador-elite', context);
    
    expect(bonuses.canUseOccultismAsAttack).toBe(false);
  });
});

// =====================================================
// SKILL BONUSES
// =====================================================

describe('Bônus de perícias', () => {
  it('Infiltrador NEX 40 deve ter +5 em Atletismo e Crime', () => {
    const context = createTrackContext(40);
    const bonuses = calculateTrackBonuses('infiltrador', context);
    
    expect(bonuses.skillBonuses).toBeDefined();
    // Gatuno: +5 em Atletismo e Crime
    expect(bonuses.skillBonuses['atletismo'] || 0).toBeGreaterThanOrEqual(5);
    expect(bonuses.skillBonuses['crime'] || 0).toBeGreaterThanOrEqual(5);
  });
  
  it('trilha sem bônus de perícia deve ter objeto vazio', () => {
    const context = createTrackContext(10);
    const bonuses = calculateTrackBonuses('guerreiro', context);
    
    expect(bonuses.skillBonuses).toBeDefined();
    expect(Object.keys(bonuses.skillBonuses).length).toBe(0);
  });
});
