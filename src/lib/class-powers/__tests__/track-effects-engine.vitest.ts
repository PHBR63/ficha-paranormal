/**
 * Testes Vitest do Motor de Efeitos de Trilhas - Ordem Paranormal RPG
 * 
 * Testa o cálculo de bônus de habilidades de trilha, condições, 
 * e funções específicas como Ataque Furtivo e Paramédico.
 * 
 * @module track-effects-engine.vitest
 */

import { describe, it, expect } from 'vitest';
import {
  createEmptyTrackBonusSummary,
  calculateTrackBonuses,
  hasTrackAbility,
  calculateSneakAttackDice,
  calculateParamedicHealing,
  calculateSpecialAttackBonus,
  mapLegacyTrackAbilities,
  getDetailedTrackBreakdown,
} from '../track-effects-engine';
import { getTrackById, getUnlockedAbilities, ALL_TRACKS } from '../track-registry';
import type { TrackCalculationContext } from '../track-types';

// Helper para criar contexto válido
const createContext = (overrides: Partial<TrackCalculationContext> = {}): TrackCalculationContext => ({
  nex: 50,
  attributes: { strength: 1, agility: 1, vigor: 1, intellect: 1, presence: 1 },
  ...overrides,
});

// Função helper para obter todas as trilhas
const getAllTracks = () => ALL_TRACKS;

// ========================================
// TESTES DE SUMÁRIO VAZIO
// ========================================

describe('Motor de Trilhas - Criação de Sumário', () => {
  it('createEmptyTrackBonusSummary deve retornar objeto com valores zerados', () => {
    const summary = createEmptyTrackBonusSummary();
    
    expect(summary.attackBonus).toBe(0);
    expect(summary.damageBonus).toBe(0);
    expect(summary.defenseBonus).toBe(0);
    expect(summary.initiativeBonus).toBe(0);
    expect(summary.bonusHP).toBe(0);
    expect(summary.paranormalResistance).toBe(0);
    expect(summary.mentalDamageResistance).toBe(0);
    expect(summary.criticalMarginBonus).toBe(0);
    expect(summary.criticalMultiplierBonus).toBe(0);
    expect(summary.categoryReduction).toBe(0);
    expect(summary.ritualDTBonus).toBe(0);
    expect(summary.canUseHPAsPE).toBe(false);
    expect(summary.canUseOccultismAsAttack).toBe(false);
  });

  it('createEmptyTrackBonusSummary deve ter arrays vazios', () => {
    const summary = createEmptyTrackBonusSummary();
    
    expect(Array.isArray(summary.extraDamageDice)).toBe(true);
    expect(summary.extraDamageDice).toHaveLength(0);
    expect(Array.isArray(summary.breakdown)).toBe(true);
    expect(summary.breakdown).toHaveLength(0);
  });

  it('createEmptyTrackBonusSummary deve ter skillBonuses como objeto vazio', () => {
    const summary = createEmptyTrackBonusSummary();
    
    expect(typeof summary.skillBonuses).toBe('object');
    expect(Object.keys(summary.skillBonuses)).toHaveLength(0);
  });
});

// ========================================
// TESTES DE CÁLCULO DE BÔNUS DE TRILHA
// ========================================

describe('Motor de Trilhas - Cálculo de Bônus', () => {
  it('calculateTrackBonuses deve retornar sumário vazio para trilha inexistente', () => {
    const context: TrackCalculationContext = { nex: 50 };
    const result = calculateTrackBonuses('trilha-inexistente', context);
    
    expect(result.attackBonus).toBe(0);
    expect(result.breakdown).toHaveLength(0);
  });

  it('calculateTrackBonuses deve aplicar bônus baseado no NEX', () => {
    const tracks = getAllTracks();
    if (tracks.length === 0) {
      expect(true).toBe(true);
      return;
    }
    
    const track = tracks[0];
    const contextLow: TrackCalculationContext = { nex: 10 };
    const contextHigh: TrackCalculationContext = { nex: 99 };
    
    const resultLow = calculateTrackBonuses(track.id, contextLow);
    const resultHigh = calculateTrackBonuses(track.id, contextHigh);
    
    // NEX alto deve ter mais habilidades desbloqueadas = mais breakdown entries
    expect(resultHigh.breakdown.length).toBeGreaterThanOrEqual(resultLow.breakdown.length);
  });

  it('calculateTrackBonuses deve registrar fonte dos bônus no breakdown', () => {
    const tracks = getAllTracks();
    if (tracks.length === 0) {
      expect(true).toBe(true);
      return;
    }
    
    const track = tracks[0];
    const context: TrackCalculationContext = { nex: 50 };
    
    const result = calculateTrackBonuses(track.id, context);
    
    // Se tem breakdown, cada entry deve ter source e effects
    for (const entry of result.breakdown) {
      expect(entry.source).toBeDefined();
      expect(entry.abilityId).toBeDefined();
      expect(Array.isArray(entry.effects)).toBe(true);
    }
  });
});

// ========================================
// TESTES DE VERIFICAÇÃO DE HABILIDADE
// ========================================

describe('Motor de Trilhas - Verificação de Habilidade Ativa', () => {
  it('hasTrackAbility deve retornar false se trackId é undefined', () => {
    const result = hasTrackAbility('qualquer-habilidade', undefined, 50);
    expect(result).toBe(false);
  });

  it('hasTrackAbility deve retornar false para habilidade inexistente', () => {
    const tracks = getAllTracks();
    if (tracks.length === 0) {
      expect(true).toBe(true);
      return;
    }
    
    const result = hasTrackAbility('habilidade-inexistente-xyz', tracks[0].id, 99);
    expect(result).toBe(false);
  });

  it('hasTrackAbility deve respeitar requisito de NEX', () => {
    const tracks = getAllTracks();
    if (tracks.length === 0) {
      expect(true).toBe(true);
      return;
    }
    
    const track = tracks[0];
    if (!track.abilities || track.abilities.length === 0) {
      expect(true).toBe(true);
      return;
    }
    
    // Pega a última habilidade (NEX 99)
    const lastAbility = track.abilities[track.abilities.length - 1];
    
    // NEX muito baixo
    const resultLow = hasTrackAbility(lastAbility.id, track.id, 5);
    expect(resultLow).toBe(false);
    
    // NEX suficiente
    const resultHigh = hasTrackAbility(lastAbility.id, track.id, 99);
    expect(resultHigh).toBe(true);
  });

  it('hasTrackAbility deve verificar se habilidade pertence à trilha', () => {
    const tracks = getAllTracks();
    if (tracks.length < 2) {
      expect(true).toBe(true);
      return;
    }
    
    const track1 = tracks[0];
    const track2 = tracks[1];
    
    if (!track1.abilities?.length || !track2.abilities?.length) {
      expect(true).toBe(true);
      return;
    }
    
    const abilityFromTrack1 = track1.abilities[0];
    
    // Verifica na trilha correta
    const resultCorrect = hasTrackAbility(abilityFromTrack1.id, track1.id, 99);
    // Verifica na trilha errada
    const resultWrong = hasTrackAbility(abilityFromTrack1.id, track2.id, 99);
    
    expect(resultCorrect).toBe(true);
    expect(resultWrong).toBe(false);
  });
});

// ========================================
// TESTES DE ATAQUE FURTIVO
// ========================================

describe('Motor de Trilhas - Ataque Furtivo', () => {
  it('calculateSneakAttackDice deve escalar com NEX', () => {
    expect(calculateSneakAttackDice(10)).toBe('+1d6');
    expect(calculateSneakAttackDice(39)).toBe('+1d6');
    expect(calculateSneakAttackDice(40)).toBe('+2d6');
    expect(calculateSneakAttackDice(64)).toBe('+2d6');
    expect(calculateSneakAttackDice(65)).toBe('+3d6');
    expect(calculateSneakAttackDice(98)).toBe('+3d6');
    expect(calculateSneakAttackDice(99)).toBe('+4d6');
  });

  it('calculateSneakAttackDice com Assassinar deve dobrar dados', () => {
    expect(calculateSneakAttackDice(10, true)).toBe('+2d6');
    expect(calculateSneakAttackDice(40, true)).toBe('+4d6');
    expect(calculateSneakAttackDice(65, true)).toBe('+6d6');
    expect(calculateSneakAttackDice(99, true)).toBe('+8d6');
  });
});

// ========================================
// TESTES DE PARAMÉDICO
// ========================================

describe('Motor de Trilhas - Paramédico', () => {
  it('calculateParamedicHealing deve escalar com NEX', () => {
    expect(calculateParamedicHealing(10)).toBe('2d10');
    expect(calculateParamedicHealing(39)).toBe('2d10');
    expect(calculateParamedicHealing(40)).toBe('3d10');
    expect(calculateParamedicHealing(64)).toBe('3d10');
    expect(calculateParamedicHealing(65)).toBe('4d10');
    expect(calculateParamedicHealing(98)).toBe('4d10');
    expect(calculateParamedicHealing(99)).toBe('5d10');
  });

  it('calculateParamedicHealing deve adicionar dados extras', () => {
    expect(calculateParamedicHealing(10, 2)).toBe('4d10');
    expect(calculateParamedicHealing(40, 3)).toBe('6d10');
    expect(calculateParamedicHealing(65, 1)).toBe('5d10');
  });
});

// ========================================
// TESTES DE ATAQUE ESPECIAL
// ========================================

describe('Motor de Trilhas - Ataque Especial', () => {
  it('calculateSpecialAttackBonus deve calcular bônus baseado em PE', () => {
    const result1 = calculateSpecialAttackBonus(1);
    expect(result1.total).toBe(5);
    expect(result1.attackBonus).toBe(5);
    expect(result1.damageBonus).toBe(5);
    
    const result3 = calculateSpecialAttackBonus(3);
    expect(result3.total).toBe(10);
    
    const result4 = calculateSpecialAttackBonus(4);
    expect(result4.total).toBe(15);
    
    const result5 = calculateSpecialAttackBonus(5);
    expect(result5.total).toBe(20);
  });

  it('calculateSpecialAttackBonus com Potência Máxima deve dobrar bônus', () => {
    const normal = calculateSpecialAttackBonus(3);
    const potencia = calculateSpecialAttackBonus(3, true);
    
    expect(potencia.total).toBe(normal.total * 2);
    expect(potencia.attackBonus).toBe(normal.attackBonus * 2);
    expect(potencia.damageBonus).toBe(normal.damageBonus * 2);
  });
});

// ========================================
// TESTES DE MAPEAMENTO LEGADO
// ========================================

describe('Motor de Trilhas - Mapeamento Legado', () => {
  it('mapLegacyTrackAbilities deve mapear nomes para IDs', () => {
    const legacyNames = ['a favorita', 'técnica secreta'];
    const result = mapLegacyTrackAbilities(legacyNames);
    
    expect(result).toContain('a-favorita');
    expect(result).toContain('tecnica-secreta');
  });

  it('mapLegacyTrackAbilities deve ser case-insensitive', () => {
    const result1 = mapLegacyTrackAbilities(['A Favorita']);
    const result2 = mapLegacyTrackAbilities(['a favorita']);
    
    expect(result1).toEqual(result2);
  });

  it('mapLegacyTrackAbilities deve manter nomes não mapeados', () => {
    const result = mapLegacyTrackAbilities(['nome-customizado']);
    expect(result).toContain('nome-customizado');
  });

  it('mapLegacyTrackAbilities deve mapear trilhas de todas as classes', () => {
    // Testa algumas habilidades de cada classe
    const legacyNames = [
      // Combatente
      'casca grossa',
      'potência máxima',
      // Especialista
      'ataque furtivo',
      'paramédico',
      // Ocultista
      'ampliar ritual',
      'lâmina maldita',
    ];
    
    const result = mapLegacyTrackAbilities(legacyNames);
    
    expect(result).toContain('casca-grossa');
    expect(result).toContain('potencia-maxima');
    expect(result).toContain('ataque-furtivo-trilha');
    expect(result).toContain('paramedico');
    expect(result).toContain('ampliar-ritual');
    expect(result).toContain('lamina-maldita');
  });
});

// ========================================
// TESTES DE BREAKDOWN DETALHADO
// ========================================

describe('Motor de Trilhas - Breakdown Detalhado', () => {
  it('getDetailedTrackBreakdown deve retornar mensagem de erro para trilha inexistente', () => {
    const result = getDetailedTrackBreakdown('trilha-inexistente', { nex: 50 });
    expect(result).toContain('não encontrada');
  });

  it('getDetailedTrackBreakdown deve incluir NEX no output', () => {
    const tracks = getAllTracks();
    if (tracks.length === 0) {
      expect(true).toBe(true);
      return;
    }
    
    const result = getDetailedTrackBreakdown(tracks[0].id, { nex: 75 });
    expect(result).toContain('75');
    expect(result).toContain('NEX');
  });

  it('getDetailedTrackBreakdown deve incluir nome da trilha', () => {
    const tracks = getAllTracks();
    if (tracks.length === 0) {
      expect(true).toBe(true);
      return;
    }
    
    const track = tracks[0];
    const result = getDetailedTrackBreakdown(track.id, { nex: 50 });
    expect(result).toContain(track.name);
  });
});

// ========================================
// TESTES DE DESBLOQUEIO DE HABILIDADES
// ========================================

describe('Motor de Trilhas - Desbloqueio por NEX', () => {
  it('getUnlockedAbilities deve retornar 1 habilidade para NEX 10', () => {
    const tracks = getAllTracks();
    if (tracks.length === 0) {
      expect(true).toBe(true);
      return;
    }
    
    const abilities = getUnlockedAbilities(tracks[0].id, 10);
    expect(abilities.length).toBe(1);
  });

  it('getUnlockedAbilities deve retornar 2 habilidades para NEX 40', () => {
    const tracks = getAllTracks();
    if (tracks.length === 0) {
      expect(true).toBe(true);
      return;
    }
    
    const abilities = getUnlockedAbilities(tracks[0].id, 40);
    expect(abilities.length).toBe(2);
  });

  it('getUnlockedAbilities deve retornar 3 habilidades para NEX 65', () => {
    const tracks = getAllTracks();
    if (tracks.length === 0) {
      expect(true).toBe(true);
      return;
    }
    
    const abilities = getUnlockedAbilities(tracks[0].id, 65);
    expect(abilities.length).toBe(3);
  });

  it('getUnlockedAbilities deve retornar 4 habilidades para NEX 99', () => {
    const tracks = getAllTracks();
    if (tracks.length === 0) {
      expect(true).toBe(true);
      return;
    }
    
    const abilities = getUnlockedAbilities(tracks[0].id, 99);
    expect(abilities.length).toBe(4);
  });
});
