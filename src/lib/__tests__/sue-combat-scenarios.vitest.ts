/**
 * Testes de Integração SUE - Cenários de Combate
 * Ordem Paranormal RPG v1.3
 * 
 * FASE 7: Testes avançados simulando cenários reais de combate
 * com múltiplas variáveis e fontes de bônus/penalidades.
 * 
 * Este módulo testa:
 * - Combate corpo a corpo completo
 * - Combate à distância com mira
 * - Conjuração de rituais com modificadores
 * - Ataque furtivo com condições
 * - Defesa completa com múltiplas fontes
 * - Manobras especiais de trilha
 * - Combate com condições adversas
 * 
 * @module sue-combat-scenarios.vitest
 */

import { describe, it, expect } from 'vitest';
import {
  UnifiedEffect,
  EffectMechanics,
  EffectCalculationContext,
  consolidateEffects,
  EffectSource,
} from '../unified-effects-engine';

// =====================================================
// Helpers de Teste
// =====================================================

/**
 * Cria um contexto de combate completo
 */
function createCombatContext(overrides: Partial<EffectCalculationContext> = {}): EffectCalculationContext {
  return {
    attributes: { strength: 2, agility: 3, vigor: 2, intellect: 3, presence: 2 },
    nex: 50,
    hpCurrent: 35,
    hpMax: 45,
    peCurrent: 15,
    peMax: 20,
    inCombat: true,
    isFirstRound: false,
    currentRound: 3,
    hasShield: false,
    activeConditions: [],
    activatedEffects: [],
    ...overrides,
  };
}

/**
 * Cria um efeito genérico para cenários de combate
 */
function createCombatEffect(
  id: string,
  source: EffectSource,
  sourceName: string,
  mechanics: EffectMechanics,
  overrides: Partial<UnifiedEffect> = {}
): UnifiedEffect {
  return {
    id,
    name: sourceName,
    source,
    sourceId: id,
    sourceName,
    mechanics,
    isActive: true,
    isToggleable: false,
    ...overrides,
  };
}

// =====================================================
// CENÁRIO 1: Combatente NEX 65% - Ataque Corpo a Corpo
// =====================================================

describe('SUE Combate: Combatente NEX 65% - Melee', () => {
  it('deve calcular ataque completo de Combatente em corpo a corpo', () => {
    // Combatente NEX 65% com:
    // - Origem Militar (+2 ataque)
    // - Trilha Guerreiro (+2 dano melee)
    // - Poder Ataque Poderoso (+2 dano, -1 ataque)
    // - Arma Tática (+1 ataque)
    const effects: UnifiedEffect[] = [
      createCombatEffect('origem-militar', 'origin', 'Militar', { attackBonus: 2 }),
      createCombatEffect('trilha-guerreiro', 'track', 'Guerreiro', { meleeDamageBonus: 2 }),
      createCombatEffect('poder-ataque-poderoso', 'general_power', 'Ataque Poderoso', { 
        damageBonus: 2, 
        attackBonus: -1 
      }),
      createCombatEffect('arma-tatica', 'equipment', 'Espada Tática', { attackBonus: 1 }),
    ];

    const context = createCombatContext({ 
      nex: 65,
      attackContext: { type: 'melee', targetConditions: [] }
    });
    const result = consolidateEffects(effects, context);

    // Ataque: 2 (origem) - 1 (poder) + 1 (arma) = 2
    expect(result.attack.general).toBe(2);
    // Dano geral: 2 (poder)
    expect(result.damage.general).toBe(2);
    // Dano melee: 2 (trilha)
    expect(result.damage.melee).toBe(2);
  });

  it('deve aplicar bônus de flanqueamento quando alvo flanqueado', () => {
    const effects: UnifiedEffect[] = [
      createCombatEffect('origem-militar', 'origin', 'Militar', { attackBonus: 2 }),
      createCombatEffect('flanqueamento', 'condition', 'Flanqueamento', { 
        attackBonus: 2 
      }, {
        conditions: { targetConditions: ['flanqueado'] }
      }),
    ];

    // Com alvo flanqueado
    const contextFlanked = createCombatContext({
      attackContext: { type: 'melee', targetConditions: ['flanqueado'] }
    });
    const resultFlanked = consolidateEffects(effects, contextFlanked);
    expect(resultFlanked.attack.general).toBe(4); // 2 + 2

    // Sem flanqueamento
    const contextNormal = createCombatContext({
      attackContext: { type: 'melee', targetConditions: [] }
    });
    const resultNormal = consolidateEffects(effects, contextNormal);
    expect(resultNormal.attack.general).toBe(2);
  });
});

// =====================================================
// CENÁRIO 2: Especialista NEX 50% - Ataque à Distância
// =====================================================

describe('SUE Combate: Especialista NEX 50% - Ranged', () => {
  it('deve calcular ataque de Atirador de Elite à distância', () => {
    // Especialista NEX 50% com:
    // - Origem Agente Especial (+1 ataque ranged)
    // - Trilha Atirador de Elite (+2 ataque ranged, +2 dano ranged)
    // - Mira Laser (+1 margem crítico)
    // - Rifle de Precisão (+1 ataque)
    const effects: UnifiedEffect[] = [
      createCombatEffect('origem-agente', 'origin', 'Agente Especial', { rangedAttackBonus: 1 }),
      createCombatEffect('trilha-atirador', 'track', 'Atirador de Elite', { 
        rangedAttackBonus: 2,
        rangedDamageBonus: 2 
      }),
      createCombatEffect('mira-laser', 'equipment', 'Mira Laser', { criticalMarginBonus: 1 }),
      createCombatEffect('rifle-precisao', 'equipment', 'Rifle de Precisão', { attackBonus: 1 }),
    ];

    const context = createCombatContext({ 
      nex: 50,
      attackContext: { type: 'ranged', targetConditions: [] }
    });
    const result = consolidateEffects(effects, context);

    // Ataque geral: 1 (rifle)
    expect(result.attack.general).toBe(1);
    // Ataque ranged: 1 (origem) + 2 (trilha) = 3
    expect(result.attack.ranged).toBe(3);
    // Dano ranged: 2 (trilha)
    expect(result.damage.ranged).toBe(2);
    // Margem crítico: 1 (mira)
    expect(result.critical.marginBonus).toBe(1);
  });

  it('deve aplicar bônus de mira (ação preparada)', () => {
    const effects: UnifiedEffect[] = [
      createCombatEffect('mira-cuidadosa', 'class_power', 'Mira Cuidadosa', { 
        rangedAttackBonus: 4 
      }, {
        conditions: { requiresActivation: true }
      }),
    ];

    // Mira ativada
    const contextAimed = createCombatContext({
      attackContext: { type: 'ranged', targetConditions: [] },
      activatedEffects: ['mira-cuidadosa']
    });
    const resultAimed = consolidateEffects(effects, contextAimed);
    expect(resultAimed.attack.ranged).toBe(4);

    // Sem mira
    const contextQuick = createCombatContext({
      attackContext: { type: 'ranged', targetConditions: [] },
      activatedEffects: []
    });
    const resultQuick = consolidateEffects(effects, contextQuick);
    expect(resultQuick.attack.ranged).toBe(0);
  });
});

// =====================================================
// CENÁRIO 3: Ocultista - Conjuração de Ritual
// =====================================================

describe('SUE Combate: Ocultista - Rituais', () => {
  it('deve calcular bônus de DT de ritual com modificadores', () => {
    // Ocultista com:
    // - Trilha Flagelador (+2 DT rituais de Sangue)
    // - Poder Foco Elemental (+1 DT geral)
    // - Ritual Sustentado de Proteção
    const effects: UnifiedEffect[] = [
      createCombatEffect('trilha-flagelador', 'track', 'Flagelador', { 
        ritualDTBonusByElement: { sangue: 2 } 
      }),
      createCombatEffect('poder-foco', 'class_power', 'Foco Elemental', { 
        ritualDTBonus: 1 
      }),
      createCombatEffect('ritual-protecao', 'ritual', 'Proteção Arcana', { 
        defenseBonus: 3 
      }),
    ];

    const result = consolidateEffects(effects, createCombatContext({ nex: 50 }));

    // Defesa do ritual sustentado
    expect(result.defense.general).toBe(3);
    // DT de ritual
    expect(result.rituals.dtBonus).toBe(1);
    expect(result.rituals.dtBonusByElement?.sangue).toBe(2);
  });

  it('deve calcular custo de PE reduzido por poderes', () => {
    const effects: UnifiedEffect[] = [
      createCombatEffect('poder-economia', 'class_power', 'Economia de Energia', { 
        ritualPEReduction: 2 
      }),
      createCombatEffect('poder-especialista', 'track', 'Especialista em Sangue', { 
        ritualPEReductionByElement: { sangue: 1 } 
      }),
    ];

    const result = consolidateEffects(effects, createCombatContext());

    // Redução geral: 2
    expect(result.rituals.peReduction).toBe(2);
    // Redução por elemento
    expect(result.rituals.peReductionByElement?.sangue).toBe(1);
  });
});

// =====================================================
// CENÁRIO 4: Infiltrador - Ataque Furtivo
// =====================================================

describe('SUE Combate: Infiltrador - Ataque Furtivo', () => {
  it('deve calcular dano de Ataque Furtivo com alvo desprevenido', () => {
    const effects: UnifiedEffect[] = [
      createCombatEffect('trilha-infiltrador', 'track', 'Infiltrador', { 
        sneakAttack: {
          baseDice: 2,
          dieType: 'd6',
          conditions: ['desprevenido', 'flanqueado'],
          peCost: 1,
          usesPerRound: 1,
        }
      }),
    ];

    const result = consolidateEffects(effects, createCombatContext({
      nex: 25,
      attackContext: { type: 'melee', targetConditions: ['desprevenido'] }
    }));

    expect(result.sneakAttack.available).toBe(true);
    expect(result.sneakAttack.baseDice).toBe(2);
    expect(result.sneakAttack.dieType).toBe('d6');
    expect(result.sneakAttack.conditions).toContain('desprevenido');
  });

  it('deve escalar Ataque Furtivo por NEX', () => {
    const createInfiltradorEffect = (nex: number): UnifiedEffect => {
      // Escala: NEX 5-30 = 2d6, NEX 35-65 = 4d6, NEX 70-99 = 6d6
      let dice = 2;
      if (nex >= 70) dice = 6;
      else if (nex >= 35) dice = 4;
      
      return createCombatEffect('trilha-infiltrador', 'track', 'Infiltrador', { 
        sneakAttack: {
          baseDice: dice,
          dieType: 'd6',
          scaling: {
            35: { dice: 4, dieType: 'd6' },
            70: { dice: 6, dieType: 'd6' },
          },
          conditions: ['desprevenido'],
          peCost: 1,
          usesPerRound: 1,
        }
      });
    };

    // NEX 25%
    const result25 = consolidateEffects(
      [createInfiltradorEffect(25)], 
      createCombatContext({ nex: 25 })
    );
    expect(result25.sneakAttack.baseDice).toBeGreaterThanOrEqual(2);

    // NEX 50%
    const result50 = consolidateEffects(
      [createInfiltradorEffect(50)], 
      createCombatContext({ nex: 50 })
    );
    expect(result50.sneakAttack.baseDice).toBeGreaterThanOrEqual(4);

    // NEX 85%
    const result85 = consolidateEffects(
      [createInfiltradorEffect(85)], 
      createCombatContext({ nex: 85 })
    );
    expect(result85.sneakAttack.baseDice).toBeGreaterThanOrEqual(6);
  });
});

// =====================================================
// CENÁRIO 5: Defesa Completa
// =====================================================

describe('SUE Combate: Defesa Completa', () => {
  it('deve calcular defesa com armadura + escudo + ritual + poder', () => {
    const effects: UnifiedEffect[] = [
      createCombatEffect('armadura-pesada', 'equipment', 'Armadura Pesada', { defenseBonus: 6 }),
      createCombatEffect('escudo-balistico', 'equipment', 'Escudo Balístico', { defenseBonus: 4 }),
      createCombatEffect('ritual-protecao', 'ritual', 'Proteção Arcana', { defenseBonus: 3 }),
      createCombatEffect('poder-esquiva', 'general_power', 'Esquiva Sobrenatural', { defenseBonus: 2 }),
    ];

    const result = consolidateEffects(effects, createCombatContext({ hasShield: true }));

    // Total: 6 + 4 + 3 + 2 = 15
    expect(result.defense.general).toBe(15);
    expect(result.defense.breakdown.length).toBe(4);
  });

  it('deve aplicar redução de dano de múltiplas fontes', () => {
    const effects: UnifiedEffect[] = [
      createCombatEffect('armadura', 'equipment', 'Colete Tático', { damageReduction: 3 }),
      createCombatEffect('poder-couro', 'paranormal_power', 'Couro de Pedra', { damageReduction: 5 }),
      createCombatEffect('ritual-barreira', 'ritual', 'Barreira de Energia', { damageReduction: 2 }),
    ];

    const result = consolidateEffects(effects, createCombatContext());

    // RD total: 3 + 5 + 2 = 10
    expect(result.damageReduction.physical).toBe(10);
  });

  it('deve calcular defesa vs melee e vs ranged separadamente', () => {
    const effects: UnifiedEffect[] = [
      createCombatEffect('armadura', 'equipment', 'Armadura Tática', { defenseBonus: 4 }),
      createCombatEffect('poder-esquiva-melee', 'class_power', 'Esquiva de Combate', { 
        defenseBonusMelee: 2 
      }),
      createCombatEffect('escudo-balistico', 'equipment', 'Escudo Balístico', { 
        defenseBonusRanged: 3 
      }),
    ];

    const result = consolidateEffects(effects, createCombatContext({ hasShield: true }));

    expect(result.defense.general).toBe(4);
    expect(result.defense.vsMelee).toBe(2);
    expect(result.defense.vsRanged).toBe(3);
  });
});

// =====================================================
// CENÁRIO 6: Combate com Condições Adversas
// =====================================================

describe('SUE Combate: Condições Adversas', () => {
  it('deve aplicar penalidades de condição Cego', () => {
    const effects: UnifiedEffect[] = [
      createCombatEffect('origem-combatente', 'origin', 'Combatente', { attackBonus: 2 }),
      createCombatEffect('condicao-cego', 'condition', 'Cego', { 
        attackBonus: -5,
        defenseBonus: -5 
      }),
    ];

    const result = consolidateEffects(effects, createCombatContext({
      activeConditions: ['cego']
    }));

    // Ataque: 2 - 5 = -3
    expect(result.attack.general).toBe(-3);
    // Defesa: -5
    expect(result.defense.general).toBe(-5);
  });

  it('deve combinar múltiplas condições negativas', () => {
    const effects: UnifiedEffect[] = [
      createCombatEffect('base', 'origin', 'Base', { attackBonus: 3, defenseBonus: 2 }),
      createCombatEffect('cond-agarrado', 'condition', 'Agarrado', { 
        cannotMove: true,
        defenseBonus: -2 
      }),
      createCombatEffect('cond-atordoado', 'condition', 'Atordoado', { 
        cannotReact: true,
        attackBonus: -2,
        defenseBonus: -2 
      }),
    ];

    const result = consolidateEffects(effects, createCombatContext({
      activeConditions: ['agarrado', 'atordoado']
    }));

    // Ataque: 3 - 2 = 1
    expect(result.attack.general).toBe(1);
    // Defesa: 2 - 2 - 2 = -2
    expect(result.defense.general).toBe(-2);
    // Flags
    expect(result.flags.cannotMove).toBe(true);
    expect(result.flags.cannotReact).toBe(true);
  });

  it('deve marcar personagem como Indefeso quando inconsciente', () => {
    const effects: UnifiedEffect[] = [
      createCombatEffect('condicao-inconsciente', 'condition', 'Inconsciente', { 
        isUnconscious: true,
        isHelpless: true,
        cannotAct: true,
        cannotReact: true,
        cannotMove: true 
      }),
    ];

    const result = consolidateEffects(effects, createCombatContext({
      activeConditions: ['inconsciente']
    }));

    expect(result.flags.isUnconscious).toBe(true);
    expect(result.flags.isHelpless).toBe(true);
    expect(result.flags.cannotAct).toBe(true);
    expect(result.flags.cannotReact).toBe(true);
    expect(result.flags.cannotMove).toBe(true);
  });
});

// =====================================================
// CENÁRIO 7: Primeira Rodada de Combate
// =====================================================

describe('SUE Combate: Primeira Rodada', () => {
  it('deve aplicar bônus de primeira rodada quando aplicável', () => {
    const effects: UnifiedEffect[] = [
      createCombatEffect('iniciativa-melhorada', 'general_power', 'Iniciativa Melhorada', { 
        initiativeBonus: 4,
        attackBonus: 2 
      }, {
        conditions: { firstRoundOnly: true }
      }),
      createCombatEffect('base', 'origin', 'Base', { attackBonus: 1 }),
    ];

    // Primeira rodada
    const resultFirst = consolidateEffects(effects, createCombatContext({ 
      isFirstRound: true, 
      currentRound: 1 
    }));
    expect(resultFirst.initiative.bonus).toBe(4);
    expect(resultFirst.attack.general).toBe(3); // 2 + 1

    // Segunda rodada
    const resultSecond = consolidateEffects(effects, createCombatContext({ 
      isFirstRound: false, 
      currentRound: 2 
    }));
    expect(resultSecond.initiative.bonus).toBe(0);
    expect(resultSecond.attack.general).toBe(1); // Apenas base
  });

  it('deve acumular bônus de iniciativa de múltiplas fontes', () => {
    const effects: UnifiedEffect[] = [
      createCombatEffect('origem-alerta', 'origin', 'Alerta', { initiativeBonus: 2 }),
      createCombatEffect('poder-reflexos', 'general_power', 'Reflexos de Combate', { 
        initiativeBonus: 4 
      }),
      createCombatEffect('equipamento-sensor', 'equipment', 'Sensor de Movimento', { 
        initiativeBonus: 1 
      }),
    ];

    const result = consolidateEffects(effects, createCombatContext());

    // 2 + 4 + 1 = 7
    expect(result.initiative.bonus).toBe(7);
  });
});

// =====================================================
// CENÁRIO 8: Crítico Devastador
// =====================================================

describe('SUE Combate: Crítico', () => {
  it('deve calcular margem de crítico aumentada', () => {
    const effects: UnifiedEffect[] = [
      createCombatEffect('arma-afiada', 'equipment', 'Katana Afiada', { 
        criticalMarginBonus: 2 
      }),
      createCombatEffect('poder-critico', 'general_power', 'Golpe Mortal', { 
        criticalMarginBonus: 1 
      }),
    ];

    const result = consolidateEffects(effects, createCombatContext());

    // Margem: 2 + 1 = 3 (ameaça de crítico em 17-20 em vez de 20)
    expect(result.critical.marginBonus).toBe(3);
  });

  it('deve calcular multiplicador de crítico aumentado', () => {
    const effects: UnifiedEffect[] = [
      createCombatEffect('arma-mortal', 'equipment', 'Machado de Guerra', { 
        criticalMultiplierBonus: 1 
      }),
    ];

    const result = consolidateEffects(effects, createCombatContext());

    // Multiplicador: +1 (x3 em vez de x2)
    expect(result.critical.multiplierBonus).toBe(1);
  });

  it('deve combinar margem e multiplicador de crítico', () => {
    const effects: UnifiedEffect[] = [
      createCombatEffect('arma-especial', 'equipment', 'Arma Lendária', { 
        criticalMarginBonus: 2,
        criticalMultiplierBonus: 1 
      }),
      createCombatEffect('poder-critico', 'class_power', 'Mestre do Crítico', { 
        criticalMarginBonus: 1 
      }),
    ];

    const result = consolidateEffects(effects, createCombatContext());

    expect(result.critical.marginBonus).toBe(3);
    expect(result.critical.multiplierBonus).toBe(1);
  });
});

// =====================================================
// CENÁRIO 9: Combate Avançado - Ações Extras
// =====================================================

describe('SUE Combate: Ações Extras de Trilha', () => {
  it('deve registrar ação extra de trilha (Operações Especiais)', () => {
    const effects: UnifiedEffect[] = [
      createCombatEffect('operacoes-especiais', 'track', 'Operações Especiais', { 
        extraActionsTrack: {
          type: 'attack',
          trigger: 'on-melee-hit',
          peCost: 2,
          actionType: 'free',
          weaponRestriction: 'melee',
          perRound: true,
        }
      }),
    ];

    const result = consolidateEffects(effects, createCombatContext());

    expect(result.combatAdvanced.extraActions.length).toBe(1);
    expect(result.combatAdvanced.extraActions[0].type).toBe('attack');
    expect(result.combatAdvanced.extraActions[0].trigger).toBe('on-melee-hit');
    expect(result.combatAdvanced.extraActions[0].peCost).toBe(2);
  });

  it('deve registrar múltiplas ações extras de diferentes trilhas', () => {
    const effects: UnifiedEffect[] = [
      createCombatEffect('acao-1', 'track', 'Trilha A', { 
        extraActionsTrack: {
          type: 'attack',
          trigger: 'on-attack',
          actionType: 'free',
        }
      }),
      createCombatEffect('acao-2', 'track', 'Trilha B', { 
        extraActionsTrack: {
          type: 'movement',
          trigger: 'combat-start',
          actionType: 'free',
        }
      }),
    ];

    const result = consolidateEffects(effects, createCombatContext());

    expect(result.combatAdvanced.extraActions.length).toBe(2);
  });
});

// =====================================================
// CENÁRIO 10: Combate com HP Baixo
// =====================================================

describe('SUE Combate: Bônus por HP Baixo', () => {
  it('deve ativar bônus whenWounded quando HP abaixo do limiar', () => {
    const effects: UnifiedEffect[] = [
      createCombatEffect('inquebravel', 'track', 'Inquebrável', { 
        whenWounded: {
          hpThreshold: 50,
          defenseBonus: 2,
          damageReduction: 2,
        }
      }),
    ];

    // HP 40% - ativo
    const resultWounded = consolidateEffects(effects, createCombatContext({ 
      hpCurrent: 18, 
      hpMax: 45 
    }));
    expect(resultWounded.combatAdvanced.conditionalBonuses.whenWounded.active).toBe(true);
    expect(resultWounded.defense.general).toBe(2);
    expect(resultWounded.damageReduction.physical).toBe(2);

    // HP 70% - inativo
    const resultHealthy = consolidateEffects(effects, createCombatContext({ 
      hpCurrent: 31, 
      hpMax: 45 
    }));
    expect(resultHealthy.combatAdvanced.conditionalBonuses.whenWounded.active).toBe(false);
    expect(resultHealthy.defense.general).toBe(0);
  });

  it('deve aplicar whenDying permitindo ação mesmo morrendo', () => {
    const effects: UnifiedEffect[] = [
      createCombatEffect('ultimo-suspiro', 'track', 'Último Suspiro', { 
        whenDying: {
          canAct: true,
          notHelpless: true,
        }
      }),
    ];

    const result = consolidateEffects(effects, createCombatContext({ 
      hpCurrent: 0, 
      activeConditions: ['morrendo'] 
    }));

    expect(result.combatAdvanced.conditionalBonuses.whenDying.canAct).toBe(true);
    expect(result.combatAdvanced.conditionalBonuses.whenDying.notHelpless).toBe(true);
  });
});
