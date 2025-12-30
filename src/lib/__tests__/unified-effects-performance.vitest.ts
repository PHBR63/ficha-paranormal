/**
 * Testes de Performance: Sistema Unificado de Efeitos (SUE)
 * 
 * Mede o tempo de consolidação com diferentes quantidades de efeitos ativos.
 * Garante que o sistema mantém performance aceitável mesmo com muitos efeitos.
 * 
 * Ordem Paranormal RPG v1.3
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  UnifiedEffect,
  EffectMechanics,
  EffectCalculationContext,
  consolidateEffects,
  createDefaultContext
} from '@/lib/unified-effects-engine';

// =============================================================================
// HELPERS DE TESTE
// =============================================================================

/**
 * Cria um efeito de teste com mecânicas configuráveis
 */
function createTestEffect(
  id: string,
  mechanics: Partial<EffectMechanics> = {},
  source: UnifiedEffect['source'] = 'class_power'
): UnifiedEffect {
  return {
    id,
    name: `Efeito ${id}`,
    description: `Descrição do efeito ${id}`,
    source,
    sourceId: id,
    sourceName: `Fonte ${id}`,
    isActive: true,
    isToggleable: false,
    mechanics: {
      attackBonus: mechanics.attackBonus,
      damageBonus: mechanics.damageBonus,
      defenseBonus: mechanics.defenseBonus,
      meleeDamageBonus: mechanics.meleeDamageBonus,
      rangedDamageBonus: mechanics.rangedDamageBonus,
      criticalMarginBonus: mechanics.criticalMarginBonus,
      fortitudeBonus: mechanics.fortitudeBonus,
      reflexosBonus: mechanics.reflexosBonus,
      vontadeBonus: mechanics.vontadeBonus,
      skillBonus: mechanics.skillBonus,
      hpBonus: mechanics.hpBonus,
      peBonus: mechanics.peBonus,
      movementBonus: mechanics.movementBonus,
      initiativeBonus: mechanics.initiativeBonus
    }
  };
}

/**
 * Cria um contexto de teste padrão
 */
function createTestContext(): EffectCalculationContext {
  return createDefaultContext({
    attributes: {
      strength: 2,
      agility: 2,
      vigor: 2,
      intellect: 2,
      presence: 2
    },
    nex: 50,
    hpCurrent: 25,
    hpMax: 25,
    peCurrent: 15,
    peMax: 15,
    activeConditions: [],
    activatedEffects: [],
    inCombat: true,
    equippedWeaponType: 'melee'
  });
}

/**
 * Mede o tempo de execução de uma função
 */
function measureTime(fn: () => void): number {
  const start = performance.now();
  fn();
  const end = performance.now();
  return end - start;
}

/**
 * Executa múltiplas vezes e retorna a média
 */
function measureAverageTime(fn: () => void, iterations: number = 100): number {
  const times: number[] = [];
  for (let i = 0; i < iterations; i++) {
    times.push(measureTime(fn));
  }
  return times.reduce((a, b) => a + b, 0) / times.length;
}

// =============================================================================
// TESTES DE PERFORMANCE BÁSICA
// =============================================================================

describe('SUE Performance - Consolidação de Efeitos', () => {
  let context: EffectCalculationContext;

  beforeEach(() => {
    context = createTestContext();
  });

  it('deve consolidar 5 efeitos em menos de 5ms', () => {
    const effects = [
      createTestEffect('effect-1', { attackBonus: 2 }),
      createTestEffect('effect-2', { damageBonus: 3 }),
      createTestEffect('effect-3', { defenseBonus: 1 }),
      createTestEffect('effect-4', { meleeDamageBonus: 2 }),
      createTestEffect('effect-5', { criticalMarginBonus: 1 })
    ];

    const avgTime = measureAverageTime(() => {
      consolidateEffects(effects, context);
    });

    expect(avgTime).toBeLessThan(5);
    console.log(`5 efeitos: ${avgTime.toFixed(3)}ms (média de 100 execuções)`);
  });

  it('deve consolidar 10 efeitos em menos de 10ms', () => {
    const effects = Array.from({ length: 10 }, (_, i) =>
      createTestEffect(`effect-${i}`, {
        attackBonus: i % 2 === 0 ? 1 : undefined,
        damageBonus: i % 3 === 0 ? 2 : undefined,
        defenseBonus: i % 4 === 0 ? 1 : undefined
      })
    );

    const avgTime = measureAverageTime(() => {
      consolidateEffects(effects, context);
    });

    expect(avgTime).toBeLessThan(10);
    console.log(`10 efeitos: ${avgTime.toFixed(3)}ms (média de 100 execuções)`);
  });

  it('deve consolidar 20 efeitos em menos de 20ms', () => {
    const effects = Array.from({ length: 20 }, (_, i) =>
      createTestEffect(`effect-${i}`, {
        attackBonus: Math.random() > 0.5 ? Math.floor(Math.random() * 3) + 1 : undefined,
        damageBonus: Math.random() > 0.5 ? Math.floor(Math.random() * 4) + 1 : undefined,
        defenseBonus: Math.random() > 0.5 ? Math.floor(Math.random() * 2) + 1 : undefined,
        meleeDamageBonus: Math.random() > 0.7 ? 2 : undefined,
        rangedDamageBonus: Math.random() > 0.7 ? 2 : undefined
      })
    );

    const avgTime = measureAverageTime(() => {
      consolidateEffects(effects, context);
    });

    expect(avgTime).toBeLessThan(20);
    console.log(`20 efeitos: ${avgTime.toFixed(3)}ms (média de 100 execuções)`);
  });

  it('deve consolidar 50 efeitos em menos de 50ms', () => {
    const sources: UnifiedEffect['source'][] = [
      'origin', 'track', 'class_power', 'condition', 'ritual', 'paranormal_power'
    ];

    const effects = Array.from({ length: 50 }, (_, i) =>
      createTestEffect(
        `effect-${i}`,
        {
          attackBonus: Math.random() > 0.5 ? Math.floor(Math.random() * 3) + 1 : undefined,
          damageBonus: Math.random() > 0.5 ? Math.floor(Math.random() * 4) + 1 : undefined,
          defenseBonus: Math.random() > 0.5 ? Math.floor(Math.random() * 2) + 1 : undefined,
          meleeDamageBonus: Math.random() > 0.7 ? 2 : undefined,
          rangedDamageBonus: Math.random() > 0.7 ? 2 : undefined,
          criticalMarginBonus: Math.random() > 0.8 ? 1 : undefined,
          fortitudeBonus: Math.random() > 0.7 ? 2 : undefined,
          reflexosBonus: Math.random() > 0.7 ? 2 : undefined,
          vontadeBonus: Math.random() > 0.7 ? 2 : undefined,
          hpBonus: Math.random() > 0.8 ? 5 : undefined,
          peBonus: Math.random() > 0.8 ? 3 : undefined,
          movementBonus: Math.random() > 0.9 ? 3 : undefined,
          initiativeBonus: Math.random() > 0.9 ? 2 : undefined
        },
        sources[i % sources.length]
      )
    );

    const avgTime = measureAverageTime(() => {
      consolidateEffects(effects, context);
    });

    expect(avgTime).toBeLessThan(50);
    console.log(`50 efeitos: ${avgTime.toFixed(3)}ms (média de 100 execuções)`);
  });
});

// =============================================================================
// TESTES DE CENÁRIOS REALISTAS
// =============================================================================

describe('SUE Performance - Cenários Realistas', () => {
  it('deve processar cenário de Combatente NEX 99% rapidamente', () => {
    const context = createDefaultContext({
      attributes: { strength: 5, agility: 3, vigor: 4, intellect: 2, presence: 2 },
      nex: 99,
      hpCurrent: 50,
      hpMax: 50,
      peCurrent: 25,
      peMax: 25,
      activeConditions: [],
      activatedEffects: ['tecnica-letal', 'ataque-especial'],
      inCombat: true,
      equippedWeaponType: 'melee',
      equippedArmorType: 'pesada',
      hasShield: true
    });

    // Efeitos típicos de um Combatente Guerreiro NEX alto
    const effects: UnifiedEffect[] = [
      // Origem Militar
      createTestEffect('origin-militar', { attackBonus: 1 }, 'origin'),
      // Trilha Guerreiro
      createTestEffect('track-guerreiro-1', { meleeDamageBonus: 2 }, 'track'),
      createTestEffect('track-guerreiro-2', { criticalMarginBonus: 2 }, 'track'),
      createTestEffect('track-guerreiro-3', { defenseBonus: 2 }, 'track'),
      // Poderes de Classe
      createTestEffect('golpe-pesado', { meleeDamageBonus: 2 }, 'class_power'),
      createTestEffect('golpe-demolidor', { meleeDamageBonus: 4 }, 'class_power'),
      createTestEffect('golpe-brutal', { criticalMarginBonus: 2 }, 'class_power'),
      createTestEffect('reflexos-defensivos', { defenseBonus: 2 }, 'class_power'),
      // Poderes Gerais
      createTestEffect('ataque-poderoso', { attackBonus: -2, damageBonus: 5 }, 'general_power'),
      createTestEffect('foco-em-arma', { attackBonus: 2, damageBonus: 2 }, 'general_power'),
      // Condições de combate
      createTestEffect('flanqueando', { attackBonus: 2 }, 'condition')
    ];

    const avgTime = measureAverageTime(() => {
      consolidateEffects(effects, context);
    });

    expect(avgTime).toBeLessThan(10);
    console.log(`Combatente NEX 99%: ${avgTime.toFixed(3)}ms (média de 100 execuções)`);
  });

  it('deve processar cenário de Ocultista com rituais sustentados rapidamente', () => {
    const context = createDefaultContext({
      attributes: { strength: 1, agility: 2, vigor: 2, intellect: 5, presence: 3 },
      nex: 75,
      hpCurrent: 22,
      hpMax: 22,
      peCurrent: 30,
      peMax: 35,
      activeConditions: ['velocidade-mortal-buff'],
      activatedEffects: ['ampliar-ritual', 'acelerar-ritual'],
      inCombat: true,
      equippedWeaponType: undefined
    });

    // Efeitos típicos de um Ocultista Conduíte
    const effects: UnifiedEffect[] = [
      // Origem Acadêmico
      createTestEffect('origin-academico', { skillBonus: { 'investigacao': 5 } }, 'origin'),
      // Trilha Conduíte
      createTestEffect('track-conduite-1', {}, 'track'),
      createTestEffect('track-conduite-2', {}, 'track'),
      // Poderes de Classe (rituais)
      createTestEffect('especialista-energia', {}, 'class_power'),
      createTestEffect('mestre-energia', {}, 'class_power'),
      createTestEffect('ritual-potente', { damageBonus: 5 }, 'class_power'),
      // Rituais sustentados
      createTestEffect('ritual-velocidade-mortal', {
        attackBonus: 2,
        defenseBonus: 2,
        movementBonus: 6
      }, 'ritual'),
      createTestEffect('ritual-armadura-mental', {
        vontadeBonus: 5
      }, 'ritual'),
      // Poderes Paranormais
      createTestEffect('precognicao', { defenseBonus: 5 }, 'paranormal_power'),
      createTestEffect('telecinesia-escudo', { defenseBonus: 2 }, 'paranormal_power')
    ];

    const avgTime = measureAverageTime(() => {
      consolidateEffects(effects, context);
    });

    expect(avgTime).toBeLessThan(10);
    console.log(`Ocultista com rituais: ${avgTime.toFixed(3)}ms (média de 100 execuções)`);
  });

  it('deve processar cenário de combate com múltiplas condições rapidamente', () => {
    const context = createDefaultContext({
      attributes: { strength: 2, agility: 2, vigor: 2, intellect: 2, presence: 2 },
      nex: 50,
      hpCurrent: 10,
      hpMax: 25,
      peCurrent: 5,
      peMax: 15,
      activeConditions: ['debilitado', 'desprevenido', 'agarrado', 'envenenado'],
      activatedEffects: [],
      inCombat: true,
      equippedWeaponType: 'melee'
    });

    // Efeitos de condições negativas
    const effects: UnifiedEffect[] = [
      createTestEffect('cond-debilitado', {
        attackBonus: -2,
        damageBonus: -2,
        defenseBonus: -2,
        fortitudeBonus: -2,
        reflexosBonus: -2,
        vontadeBonus: -2
      }, 'condition'),
      createTestEffect('cond-desprevenido', {
        defenseBonus: -5
      }, 'condition'),
      createTestEffect('cond-agarrado', {
        movementBonus: -9,
        defenseBonus: -2,
        attackBonus: -2
      }, 'condition'),
      createTestEffect('cond-envenenado', {}, 'condition'),
      // Ainda tem alguns bônus
      createTestEffect('origin-lutador', { attackBonus: 1, damageBonus: 1 }, 'origin'),
      createTestEffect('poder-resistencia', { fortitudeBonus: 2 }, 'class_power')
    ];

    const avgTime = measureAverageTime(() => {
      consolidateEffects(effects, context);
    });

    expect(avgTime).toBeLessThan(10);
    console.log(`Combate com condições: ${avgTime.toFixed(3)}ms (média de 100 execuções)`);
  });
});

// =============================================================================
// TESTES DE ESTRESSE
// =============================================================================

describe('SUE Performance - Testes de Estresse', () => {
  it('deve consolidar 100 efeitos em menos de 100ms', () => {
    const context = createTestContext();
    const sources: UnifiedEffect['source'][] = [
      'origin', 'track', 'class_power', 'condition', 'ritual', 'paranormal_power', 'general_power'
    ];

    const effects = Array.from({ length: 100 }, (_, i) =>
      createTestEffect(
        `stress-effect-${i}`,
        {
          attackBonus: Math.random() > 0.3 ? Math.floor(Math.random() * 5) - 2 : undefined,
          damageBonus: Math.random() > 0.3 ? Math.floor(Math.random() * 6) - 2 : undefined,
          defenseBonus: Math.random() > 0.3 ? Math.floor(Math.random() * 6) - 3 : undefined,
          meleeDamageBonus: Math.random() > 0.6 ? Math.floor(Math.random() * 4) : undefined,
          rangedDamageBonus: Math.random() > 0.6 ? Math.floor(Math.random() * 4) : undefined,
          criticalMarginBonus: Math.random() > 0.8 ? Math.floor(Math.random() * 3) : undefined,
          fortitudeBonus: Math.random() > 0.5 ? Math.floor(Math.random() * 5) - 2 : undefined,
          reflexosBonus: Math.random() > 0.5 ? Math.floor(Math.random() * 5) - 2 : undefined,
          vontadeBonus: Math.random() > 0.5 ? Math.floor(Math.random() * 5) - 2 : undefined,
          hpBonus: Math.random() > 0.7 ? Math.floor(Math.random() * 10) : undefined,
          peBonus: Math.random() > 0.7 ? Math.floor(Math.random() * 8) : undefined,
          movementBonus: Math.random() > 0.8 ? Math.floor(Math.random() * 6) - 3 : undefined,
          initiativeBonus: Math.random() > 0.8 ? Math.floor(Math.random() * 4) : undefined
        },
        sources[i % sources.length]
      )
    );

    const avgTime = measureAverageTime(() => {
      consolidateEffects(effects, context);
    }, 50);

    expect(avgTime).toBeLessThan(100);
    console.log(`100 efeitos: ${avgTime.toFixed(3)}ms (média de 50 execuções)`);
  });

  it('deve manter consistência de resultados em múltiplas execuções', () => {
    const context = createTestContext();
    const effects = [
      createTestEffect('effect-1', { attackBonus: 2, damageBonus: 3 }),
      createTestEffect('effect-2', { defenseBonus: 2, fortitudeBonus: 3 }),
      createTestEffect('effect-3', { meleeDamageBonus: 4, criticalMarginBonus: 1 })
    ];

    // Executa 100 vezes e verifica se resultado é sempre o mesmo
    const results = Array.from({ length: 100 }, () => consolidateEffects(effects, context));

    const firstResult = results[0];
    results.forEach((result) => {
      expect(result.attack.general).toBe(firstResult.attack.general);
      expect(result.damage.general).toBe(firstResult.damage.general);
      expect(result.defense.general).toBe(firstResult.defense.general);
      expect(result.damage.melee).toBe(firstResult.damage.melee);
    });
  });
});

// =============================================================================
// TESTES DE MEMÓRIA (REFERÊNCIAS)
// =============================================================================

describe('SUE Performance - Verificação de Referências', () => {
  it('deve criar novo objeto de resultado a cada chamada', () => {
    const context = createTestContext();
    const effects = [
      createTestEffect('effect-1', { attackBonus: 2 })
    ];

    const result1 = consolidateEffects(effects, context);
    const result2 = consolidateEffects(effects, context);

    // Objetos diferentes (novas referências)
    expect(result1).not.toBe(result2);
    // Mas valores iguais
    expect(result1.attack.general).toBe(result2.attack.general);
  });

  it('não deve modificar efeitos de entrada', () => {
    const context = createTestContext();
    const effects = [
      createTestEffect('effect-1', { attackBonus: 2 }),
      createTestEffect('effect-2', { damageBonus: 3 })
    ];

    // Salva cópia dos valores originais
    const originalMechanics = effects.map(e => ({ ...e.mechanics }));

    consolidateEffects(effects, context);

    // Verifica que efeitos não foram modificados
    effects.forEach((effect, i) => {
      expect(effect.mechanics.attackBonus).toBe(originalMechanics[i].attackBonus);
      expect(effect.mechanics.damageBonus).toBe(originalMechanics[i].damageBonus);
    });
  });

  it('não deve modificar contexto de entrada', () => {
    const context = createTestContext();
    const originalHpCurrent = context.hpCurrent;
    const originalInCombat = context.inCombat;

    const effects = [
      createTestEffect('effect-1', { attackBonus: 2 })
    ];

    consolidateEffects(effects, context);

    // Verifica que contexto não foi modificado
    expect(context.hpCurrent).toBe(originalHpCurrent);
    expect(context.inCombat).toBe(originalInCombat);
  });
});

// =============================================================================
// TESTES DE CONDIÇÕES
// =============================================================================

describe('SUE Performance - Verificação de Condições', () => {
  it('deve processar efeitos condicionais eficientemente', () => {
    const context = createDefaultContext({
      attributes: { strength: 3, agility: 2, vigor: 2, intellect: 2, presence: 2 },
      nex: 50,
      hpCurrent: 10,
      hpMax: 25,
      peCurrent: 15,
      peMax: 15,
      activeConditions: [],
      activatedEffects: ['efeito-ativo-1'],
      inCombat: true,
      equippedWeaponType: 'melee',
      hasShield: true
    });

    // Efeitos simples para teste de performance
    const effects: UnifiedEffect[] = [
      createTestEffect('effect-cond-1', { attackBonus: 2 }),
      createTestEffect('effect-cond-2', { defenseBonus: 3 }),
      createTestEffect('effect-cond-3', { damageBonus: 2 }),
      createTestEffect('effect-cond-4', { meleeDamageBonus: 2 })
    ];

    const avgTime = measureAverageTime(() => {
      consolidateEffects(effects, context);
    });

    expect(avgTime).toBeLessThan(10);
    console.log(`Efeitos condicionais: ${avgTime.toFixed(3)}ms (média de 100 execuções)`);

    // Verifica que efeitos foram aplicados
    const result = consolidateEffects(effects, context);
    expect(result.attack.general).toBeGreaterThanOrEqual(2);
    expect(result.defense.general).toBeGreaterThanOrEqual(3);
  });
});
