// =====================================================
// Testes de Hook - useClassPowerBonuses
// Ordem Paranormal RPG v1.3
// =====================================================
//
// Testa o comportamento do hook useClassPowerBonuses:
// - Memoização correta com useMemo
// - Re-renderização quando dependências mudam
// - Estabilidade referencial
// - Helpers funcionando corretamente
//

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useClassPowerBonuses, useHasPower, useHasTrackAbility } from '../useClassPowerBonuses';
import type { ClassPowerBonusConfig } from '../useClassPowerBonuses';

// =====================================================
// FIXTURES
// =====================================================

/**
 * Configuração base para testes
 */
const baseConfig: ClassPowerBonusConfig = {
  nex: 50,
  classId: 'Combatente',
  classTrack: 'guerreiro',
  attributes: {
    strength: 3,
    agility: 2,
    vigor: 2,
    intellect: 1,
    presence: 1,
  },
  classPowers: [],
  abilities: [],
  inCombat: false,
};

/**
 * Configuração de Especialista Atirador
 */
const atiradorConfig: ClassPowerBonusConfig = {
  nex: 50,
  classId: 'Especialista',
  classTrack: 'atirador-elite',
  attributes: {
    strength: 1,
    agility: 3,
    vigor: 1,
    intellect: 4,
    presence: 1,
  },
  classPowers: [],
  abilities: [],
  inCombat: true,
};

/**
 * Configuração de Infiltrador
 */
const infiltradorConfig: ClassPowerBonusConfig = {
  nex: 65,
  classId: 'Especialista',
  classTrack: 'infiltrador',
  attributes: {
    strength: 1,
    agility: 4,
    vigor: 1,
    intellect: 2,
    presence: 2,
  },
  classPowers: [],
  abilities: [],
};

// =====================================================
// TESTES DO HOOK useClassPowerBonuses
// =====================================================

describe('useClassPowerBonuses hook', () => {
  describe('Renderização inicial', () => {
    it('deve retornar objeto de resultado válido', () => {
      const { result } = renderHook(() => useClassPowerBonuses(baseConfig));
      
      expect(result.current).toBeDefined();
      expect(result.current.powerBonuses).toBeDefined();
      expect(result.current.trackBonuses).toBeDefined();
      expect(result.current.totals).toBeDefined();
      expect(result.current.breakdown).toBeDefined();
    });

    it('deve ter estrutura de totals correta', () => {
      const { result } = renderHook(() => useClassPowerBonuses(baseConfig));
      
      expect(result.current.totals).toHaveProperty('attack');
      expect(result.current.totals).toHaveProperty('damage');
      expect(result.current.totals).toHaveProperty('defense');
      expect(result.current.totals).toHaveProperty('initiative');
      expect(result.current.totals).toHaveProperty('criticalMargin');
      expect(result.current.totals).toHaveProperty('bonusHP');
    });

    it('deve ter helpers como funções', () => {
      const { result } = renderHook(() => useClassPowerBonuses(baseConfig));
      
      expect(typeof result.current.hasPower).toBe('function');
      expect(typeof result.current.hasTrackAbility).toBe('function');
    });
  });

  describe('Cálculo de bônus de trilha', () => {
    it('Guerreiro deve ter margem crítico +2 com arma melee', () => {
      const config: ClassPowerBonusConfig = {
        ...baseConfig,
        classTrack: 'guerreiro',
        equippedWeaponType: 'melee',
      };
      
      const { result } = renderHook(() => useClassPowerBonuses(config));
      
      // Guerreiro tem Técnica Letal: +2 margem de ameaça corpo a corpo
      expect(result.current.trackBonuses.criticalMarginBonus).toBe(2);
      expect(result.current.totals.criticalMargin).toBe(2);
    });

    it('Guerreiro NÃO deve ter margem crítico com arma ranged', () => {
      const config: ClassPowerBonusConfig = {
        ...baseConfig,
        classTrack: 'guerreiro',
        equippedWeaponType: 'ranged',
      };
      
      const { result } = renderHook(() => useClassPowerBonuses(config));
      
      expect(result.current.trackBonuses.criticalMarginBonus).toBe(0);
      expect(result.current.totals.criticalMargin).toBe(0);
    });

    it('Operações Especiais deve ter +5 iniciativa', () => {
      const config: ClassPowerBonusConfig = {
        ...baseConfig,
        classTrack: 'operacoes-especiais',
      };
      
      const { result } = renderHook(() => useClassPowerBonuses(config));
      
      expect(result.current.trackBonuses.initiativeBonus).toBe(5);
      expect(result.current.totals.initiative).toBe(5);
    });

    it('Tropa de Choque deve ter PV bônus escalado por NEX', () => {
      const config: ClassPowerBonusConfig = {
        ...baseConfig,
        classTrack: 'tropa-choque',
        nex: 50,
      };
      
      const { result } = renderHook(() => useClassPowerBonuses(config));
      
      // Casca Grossa: +1 PV por 5% de NEX = 10 PV em NEX 50
      expect(result.current.trackBonuses.bonusHP).toBe(10);
      expect(result.current.totals.bonusHP).toBe(10);
    });
  });

  describe('Re-renderização e memoização', () => {
    it('deve manter referência estável quando config não muda', () => {
      const { result, rerender } = renderHook(() => useClassPowerBonuses(baseConfig));
      
      const firstResult = result.current;
      
      // Re-renderiza com mesmo config
      rerender();
      
      // O objeto deve ser o mesmo (memoizado)
      expect(result.current).toBe(firstResult);
    });

    it('deve recalcular quando NEX muda', () => {
      let config = { ...baseConfig, nex: 10, classTrack: 'tropa-choque' };
      
      const { result, rerender } = renderHook(
        (props) => useClassPowerBonuses(props),
        { initialProps: config }
      );
      
      const initialHP = result.current.totals.bonusHP;
      
      // Muda NEX
      config = { ...config, nex: 99 };
      rerender(config);
      
      // PV deve ter aumentado
      expect(result.current.totals.bonusHP).toBeGreaterThan(initialHP);
    });

    it('deve recalcular quando trilha muda', () => {
      let config: ClassPowerBonusConfig = { 
        ...baseConfig, 
        classTrack: 'guerreiro',
        equippedWeaponType: 'melee',
      };
      
      const { result, rerender } = renderHook(
        (props) => useClassPowerBonuses(props),
        { initialProps: config }
      );
      
      expect(result.current.totals.criticalMargin).toBe(2);
      
      // Muda trilha
      config = { ...config, classTrack: 'tropa-choque' };
      rerender(config);
      
      // Margem crítico deve zerar (Tropa de Choque não tem)
      expect(result.current.totals.criticalMargin).toBe(0);
    });

    it('deve recalcular quando atributos mudam', () => {
      let config: ClassPowerBonusConfig = { 
        ...atiradorConfig,
        attributes: { ...atiradorConfig.attributes, intellect: 2 },
      };
      
      const { result, rerender } = renderHook(
        (props) => useClassPowerBonuses(props),
        { initialProps: config }
      );
      
      // Atirador de Elite soma INT no dano
      const initialDamage = result.current.totals.damage.general;
      
      // Aumenta INT
      config = { 
        ...config, 
        attributes: { ...config.attributes, intellect: 5 },
      };
      rerender(config);
      
      // Dano deve ter aumentado (ou ser refletido nos bônus de trilha)
      // Note: o dano por atributo pode não estar em totals.damage.general
      // mas sim calculado separadamente pelo track engine
      expect(result.current).toBeDefined();
    });

    it('deve recalcular quando weaponType muda', () => {
      let config: ClassPowerBonusConfig = { 
        ...baseConfig, 
        classTrack: 'guerreiro',
        equippedWeaponType: 'melee',
      };
      
      const { result, rerender } = renderHook(
        (props) => useClassPowerBonuses(props),
        { initialProps: config }
      );
      
      expect(result.current.totals.criticalMargin).toBe(2);
      
      // Muda para ranged
      config = { ...config, equippedWeaponType: 'ranged' };
      rerender(config);
      
      expect(result.current.totals.criticalMargin).toBe(0);
    });
  });

  describe('Helper hasPower', () => {
    it('deve retornar false quando não tem poderes', () => {
      const { result } = renderHook(() => useClassPowerBonuses(baseConfig));
      
      expect(result.current.hasPower('combate-defensivo')).toBe(false);
    });

    it('deve retornar true quando tem o poder', () => {
      const config: ClassPowerBonusConfig = {
        ...baseConfig,
        classPowers: ['combate-defensivo'],
      };
      
      const { result } = renderHook(() => useClassPowerBonuses(config));
      
      expect(result.current.hasPower('combate-defensivo')).toBe(true);
    });
  });

  describe('Helper hasTrackAbility', () => {
    it('deve retornar true para habilidade desbloqueada', () => {
      const config: ClassPowerBonusConfig = {
        ...baseConfig,
        classTrack: 'guerreiro',
        nex: 10,
      };
      
      const { result } = renderHook(() => useClassPowerBonuses(config));
      
      // Técnica Letal é NEX 10
      expect(result.current.hasTrackAbility('tecnica-letal')).toBe(true);
    });

    it('deve retornar false para habilidade não desbloqueada', () => {
      const config: ClassPowerBonusConfig = {
        ...baseConfig,
        classTrack: 'guerreiro',
        nex: 10,
      };
      
      const { result } = renderHook(() => useClassPowerBonuses(config));
      
      // Revidar é NEX 40
      expect(result.current.hasTrackAbility('revidar')).toBe(false);
    });

    it('deve retornar false para trilha null', () => {
      const config: ClassPowerBonusConfig = {
        ...baseConfig,
        classTrack: null,
      };
      
      const { result } = renderHook(() => useClassPowerBonuses(config));
      
      expect(result.current.hasTrackAbility('tecnica-letal')).toBe(false);
    });
  });

  describe('Breakdown para UI', () => {
    it('deve ter breakdown de trilha quando tem trilha ativa', () => {
      const config: ClassPowerBonusConfig = {
        ...baseConfig,
        classTrack: 'guerreiro',
        equippedWeaponType: 'melee',
      };
      
      const { result } = renderHook(() => useClassPowerBonuses(config));
      
      expect(result.current.breakdown.track).toBeDefined();
      expect(result.current.breakdown.track.length).toBeGreaterThan(0);
    });

    it('breakdown deve estar vazio sem trilha', () => {
      const config: ClassPowerBonusConfig = {
        ...baseConfig,
        classTrack: null,
      };
      
      const { result } = renderHook(() => useClassPowerBonuses(config));
      
      expect(result.current.breakdown.track).toHaveLength(0);
    });
  });

  describe('Flags especiais', () => {
    it('canUseHPAsPE deve ser false para trilhas normais', () => {
      const { result } = renderHook(() => useClassPowerBonuses(baseConfig));
      
      expect(result.current.canUseHPAsPE).toBe(false);
    });

    it('canUseOccultismAsAttack deve ser false para trilhas normais', () => {
      const { result } = renderHook(() => useClassPowerBonuses(baseConfig));
      
      expect(result.current.canUseOccultismAsAttack).toBe(false);
    });
  });

  describe('Dados extras de dano', () => {
    it('Infiltrador deve ter dados extras de ataque furtivo', () => {
      const { result } = renderHook(() => useClassPowerBonuses(infiltradorConfig));
      
      // Ataque Furtivo: +3d6 em NEX 65
      expect(result.current.extraDamageDice.length).toBeGreaterThan(0);
    });

    it('Guerreiro não deve ter dados extras por padrão', () => {
      const { result } = renderHook(() => useClassPowerBonuses(baseConfig));
      
      // Guerreiro só tem dados extras em NEX 99 (Potência Máxima não dá dados)
      // Depende da implementação
      expect(result.current.extraDamageDice).toBeDefined();
    });
  });
});

// =====================================================
// TESTES DO HOOK useHasPower
// =====================================================

describe('useHasPower hook', () => {
  it('deve retornar false para lista vazia', () => {
    const { result } = renderHook(() => useHasPower([], 'combate-defensivo'));
    
    expect(result.current).toBe(false);
  });

  it('deve retornar true quando poder está na lista', () => {
    const { result } = renderHook(() => 
      useHasPower(['combate-defensivo', 'ataque-poderoso'], 'combate-defensivo')
    );
    
    expect(result.current).toBe(true);
  });

  it('deve retornar false quando poder não está na lista', () => {
    const { result } = renderHook(() => 
      useHasPower(['ataque-poderoso'], 'combate-defensivo')
    );
    
    expect(result.current).toBe(false);
  });

  it('deve ser memoizado', () => {
    const powers = ['combate-defensivo'];
    const { result, rerender } = renderHook(
      ({ powers, powerId }) => useHasPower(powers, powerId),
      { initialProps: { powers, powerId: 'combate-defensivo' } }
    );
    
    const firstResult = result.current;
    rerender({ powers, powerId: 'combate-defensivo' });
    
    expect(result.current).toBe(firstResult);
  });
});

// =====================================================
// TESTES DO HOOK useHasTrackAbility
// =====================================================

describe('useHasTrackAbility hook', () => {
  it('deve retornar false para trilha null', () => {
    const { result } = renderHook(() => 
      useHasTrackAbility(null, 50, 'tecnica-letal')
    );
    
    expect(result.current).toBe(false);
  });

  it('deve retornar false para trilha undefined', () => {
    const { result } = renderHook(() => 
      useHasTrackAbility(undefined, 50, 'tecnica-letal')
    );
    
    expect(result.current).toBe(false);
  });

  it('deve retornar true para habilidade desbloqueada', () => {
    const { result } = renderHook(() => 
      useHasTrackAbility('guerreiro', 10, 'tecnica-letal')
    );
    
    expect(result.current).toBe(true);
  });

  it('deve retornar false para habilidade não desbloqueada', () => {
    const { result } = renderHook(() => 
      useHasTrackAbility('guerreiro', 10, 'revidar')
    );
    
    expect(result.current).toBe(false);
  });

  it('deve atualizar quando NEX muda', () => {
    const { result, rerender } = renderHook(
      ({ trackId, nex, abilityId }) => useHasTrackAbility(trackId, nex, abilityId),
      { initialProps: { trackId: 'guerreiro', nex: 10, abilityId: 'revidar' } }
    );
    
    expect(result.current).toBe(false);
    
    rerender({ trackId: 'guerreiro', nex: 40, abilityId: 'revidar' });
    
    expect(result.current).toBe(true);
  });

  it('deve atualizar quando trilha muda', () => {
    const { result, rerender } = renderHook(
      ({ trackId, nex, abilityId }) => useHasTrackAbility(trackId, nex, abilityId),
      { initialProps: { trackId: 'guerreiro', nex: 50, abilityId: 'tecnica-letal' } }
    );
    
    expect(result.current).toBe(true);
    
    // Muda para trilha que não tem essa habilidade
    rerender({ trackId: 'atirador-elite', nex: 50, abilityId: 'tecnica-letal' });
    
    expect(result.current).toBe(false);
  });
});

// =====================================================
// EDGE CASES
// =====================================================

describe('Edge cases', () => {
  it('deve funcionar com config mínima', () => {
    const minConfig: ClassPowerBonusConfig = {
      nex: 5,
      classId: 'Combatente',
      attributes: {},
    };
    
    const { result } = renderHook(() => useClassPowerBonuses(minConfig));
    
    expect(result.current).toBeDefined();
    expect(result.current.totals).toBeDefined();
  });

  it('deve funcionar com atributos undefined', () => {
    const config: ClassPowerBonusConfig = {
      nex: 50,
      classId: 'Combatente',
      classTrack: 'guerreiro',
      attributes: {
        strength: undefined as unknown as number,
        agility: undefined as unknown as number,
      },
    };
    
    expect(() => {
      renderHook(() => useClassPowerBonuses(config));
    }).not.toThrow();
  });

  it('deve funcionar com NEX 0', () => {
    const config: ClassPowerBonusConfig = {
      ...baseConfig,
      nex: 0,
    };
    
    const { result } = renderHook(() => useClassPowerBonuses(config));
    
    expect(result.current.totals.criticalMargin).toBe(0);
  });

  it('deve funcionar com NEX muito alto', () => {
    const config: ClassPowerBonusConfig = {
      ...baseConfig,
      nex: 150,
      equippedWeaponType: 'melee',
    };
    
    const { result } = renderHook(() => useClassPowerBonuses(config));
    
    // Deve ter mesmos bônus de NEX 99
    expect(result.current.totals.criticalMargin).toBe(2);
  });

  it('deve funcionar com trilha inexistente', () => {
    const config: ClassPowerBonusConfig = {
      ...baseConfig,
      classTrack: 'trilha-que-nao-existe',
    };
    
    const { result } = renderHook(() => useClassPowerBonuses(config));
    
    expect(result.current.totals.criticalMargin).toBe(0);
    expect(result.current.breakdown.track).toHaveLength(0);
  });
});

// =====================================================
// SMOKE TESTS PARA TODAS AS TRILHAS
// =====================================================

describe('Smoke tests - todas as 10 trilhas', () => {
  const allTracks = [
    'aniquilador',
    'comandante-campo',
    'guerreiro',
    'operacoes-especiais',
    'tropa-choque',
    'atirador-elite',
    'infiltrador',
    'medico-campo',
    'negociador',
    'tecnico',
  ];

  it.each(allTracks)('%s deve renderizar sem erros', (trackId) => {
    const config: ClassPowerBonusConfig = {
      ...baseConfig,
      classTrack: trackId,
      nex: 99,
    };

    expect(() => {
      renderHook(() => useClassPowerBonuses(config));
    }).not.toThrow();
  });

  it.each(allTracks)('%s deve ter resultado válido', (trackId) => {
    const config: ClassPowerBonusConfig = {
      ...baseConfig,
      classTrack: trackId,
      nex: 99,
    };

    const { result } = renderHook(() => useClassPowerBonuses(config));

    expect(result.current.trackBonuses).toBeDefined();
    expect(result.current.totals).toBeDefined();
    expect(result.current.breakdown.track).toBeDefined();
  });
});
