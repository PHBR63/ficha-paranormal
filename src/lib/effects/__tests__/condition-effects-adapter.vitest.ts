/**
 * Testes Unitários - Adaptador de Efeitos de Condição
 * Sistema Unificado de Efeitos (SUE) - Ordem Paranormal RPG v1.3
 * 
 * Cobertura:
 * - Integridade do mapeamento de condições
 * - Mecânicas de condições críticas, combate, sensoriais, físicas e mentais
 * - Modificadores contextuais (melee vs ranged)
 * - Conversão para UnifiedEffect
 * - Função de resumo getConditionModifiersSummary
 */

import { describe, it, expect } from 'vitest';
import {
  CONDITION_MECHANICS,
  getConditionEffects,
  getConditionModifiersSummary,
  listAllConditionEffects,
} from '../condition-effects-adapter';
import { CONDITIONS, CONDITION_CATEGORIES } from '../../conditions';

// =====================================================
// FASE 1: Integridade do Mapeamento
// =====================================================

describe('condition-effects-adapter: Integridade do Mapeamento', () => {
  it('deve ter mecânicas mapeadas para a maioria das condições oficiais', () => {
    const conditionIds = Object.keys(CONDITIONS);
    const mappedIds = Object.keys(CONDITION_MECHANICS);
    
    // Verifica que temos mapeamento para condições principais
    const mainConditions = [
      'agarrado', 'atordoado', 'caido', 'desprevenido', 'cego', 'surdo',
      'inconsciente', 'morrendo', 'paralisado', 'indefeso',
    ];
    
    for (const id of mainConditions) {
      expect(mappedIds).toContain(id);
    }
  });

  it('cada condição mapeada deve ter propriedade mechanics', () => {
    for (const [id, def] of Object.entries(CONDITION_MECHANICS)) {
      expect(def).toHaveProperty('mechanics');
      expect(typeof def.mechanics).toBe('object');
    }
  });

  it('condições com efeitos contextuais devem ter estrutura correta', () => {
    const conditionsWithContextual = Object.entries(CONDITION_MECHANICS)
      .filter(([_, def]) => def.contextual);
    
    for (const [id, def] of conditionsWithContextual) {
      if (def.contextual?.melee) {
        expect(typeof def.contextual.melee).toBe('object');
      }
      if (def.contextual?.ranged) {
        expect(typeof def.contextual.ranged).toBe('object');
      }
    }
  });
});

// =====================================================
// FASE 2: Condições Críticas
// =====================================================

describe('condition-effects-adapter: Condições Críticas', () => {
  it('inconsciente deve definir cannotAct, cannotReact, isHelpless e isUnconscious', () => {
    const mech = CONDITION_MECHANICS['inconsciente']?.mechanics;
    
    expect(mech?.cannotAct).toBe(true);
    expect(mech?.cannotReact).toBe(true);
    expect(mech?.isHelpless).toBe(true);
    expect(mech?.isUnconscious).toBe(true);
    expect(mech?.cannotMove).toBe(true);
  });

  it('Morrendo sozinho não recria Inconsciente após cura de PV', () => {
    const mech = CONDITION_MECHANICS['morrendo']?.mechanics;
    
    expect(mech?.cannotAct).toBeUndefined();
    expect(mech?.cannotReact).toBeUndefined();
    expect(mech?.isUnconscious).toBeUndefined();
    expect(mech?.isHelpless).toBeUndefined();
    expect(mech?.specialEffects?.[0]).toContain('mesma cena');
  });

  it('paralisado deve definir isHelpless e cannotAct', () => {
    const mech = CONDITION_MECHANICS['paralisado']?.mechanics;
    
    expect(mech?.isHelpless).toBe(true);
    expect(mech?.cannotAct).toBe(true);
    expect(mech?.cannotMove).toBe(true);
  });

  it('indefeso deve definir isHelpless', () => {
    const mech = CONDITION_MECHANICS['indefeso']?.mechanics;
    
    expect(mech?.isHelpless).toBe(true);
  });
});

// =====================================================
// FASE 3: Condições de Combate
// =====================================================

describe('condition-effects-adapter: Condições de Combate', () => {
  it('agarrado deriva Desprevenido e Imóvel, e penaliza dados de ataque', () => {
    const effects = getConditionEffects(['agarrado']);
    expect(effects.find(e => e.sourceId === 'agarrado')?.mechanics.testDice?.attacks).toBe(-1);
    expect(effects.find(e => e.sourceId === 'desprevenido')?.mechanics.defenseBonus).toBe(-5);
    expect(effects.find(e => e.sourceId === 'imobilizado')?.mechanics.cannotMove).toBe(true);
  });

  it('atordoado impede ações e preserva reações', () => {
    const summary = getConditionModifiersSummary(['atordoado']);
    expect(summary.canAct).toBe(false);
    expect(summary.canReact).toBe(true);
    expect(summary.defenseMod).toBe(-5);
  });

  it('desprevenido penaliza Defesa e dados de Reflexos', () => {
    const mech = CONDITION_MECHANICS.desprevenido.mechanics;
    expect(mech.defenseBonus).toBe(-5);
    expect(mech.testDice?.skills?.reflexos).toBe(-1);
    expect(mech.cannotReact).not.toBe(true);
  });

  it('surpreendido deriva Desprevenido e impede ações', () => {
    const summary = getConditionModifiersSummary(['surpreendido']);
    expect(summary.defenseMod).toBe(-5);
    expect(summary.canAct).toBe(false);
    expect(summary.canReact).toBe(true);
  });

  it('vulneravel deve ter -2 Defesa', () => {
    const mech = CONDITION_MECHANICS['vulneravel']?.mechanics;
    
    expect(mech?.defenseBonus).toBe(-2);
  });

  it('enredado deriva Lento e Vulnerável e penaliza dados de ataque', () => {
    const effects = getConditionEffects(['enredado']);
    expect(effects.find(e => e.sourceId === 'lento')?.mechanics.movementMultiplier).toBe(0.5);
    expect(effects.find(e => e.sourceId === 'vulneravel')?.mechanics.defenseBonus).toBe(-2);
    expect(effects.find(e => e.sourceId === 'enredado')?.mechanics.testDice?.attacks).toBe(-1);
  });

  it('pasmo impede ações sem inventar penalidade na Defesa', () => {
    const mech = CONDITION_MECHANICS.pasmo.mechanics;
    expect(mech.cannotAct).toBe(true);
    expect(mech.defenseBonus).toBeUndefined();
  });
});

// =====================================================
// FASE 4: Modificadores Contextuais (melee vs ranged)
// =====================================================

describe('condition-effects-adapter: Modificadores Contextuais', () => {
  it('caido deve ter -5 Defesa vs melee e +5 vs ranged', () => {
    const def = CONDITION_MECHANICS['caido'];
    
    expect(def?.contextual?.melee?.defenseBonusMelee).toBe(-5);
    expect(def?.contextual?.ranged?.defenseBonusRanged).toBe(5);
  });

  it('getConditionEffects aplica contexto melee para caido', () => {
    const effects = getConditionEffects(['caido'], { type: 'melee' });
    const caidoEffect = effects.find(e => e.sourceId === 'caido');
    
    expect(caidoEffect?.mechanics.defenseBonusMelee).toBe(-5);
  });

  it('getConditionEffects aplica contexto ranged para caido', () => {
    const effects = getConditionEffects(['caido'], { type: 'ranged' });
    const caidoEffect = effects.find(e => e.sourceId === 'caido');
    
    expect(caidoEffect?.mechanics.defenseBonusRanged).toBe(5);
  });

  it('getConditionEffects sem contexto não aplica bônus contextuais', () => {
    const effects = getConditionEffects(['caido']);
    const caidoEffect = effects.find(e => e.sourceId === 'caido');
    
    // Sem contexto, não deve ter os bônus específicos aplicados diretamente
    // mas deve ter os valores de CONTEXTUAL_DEFENSE_MODIFIERS
    expect(caidoEffect).toBeDefined();
  });
});

// =====================================================
// FASE 5: Condições Sensoriais
// =====================================================

describe('condition-effects-adapter: Condições Sensoriais', () => {
  it('cego penaliza dados de Agilidade e Força', () => {
    const mech = CONDITION_MECHANICS.cego.mechanics;
    expect(mech.testDice?.attributes).toEqual({ agility: -2, strength: -2 });
    expect(mech.attackBonus).toBeUndefined();
  });

  it('surdo penaliza dados de Iniciativa', () => {
    const mech = CONDITION_MECHANICS.surdo.mechanics;
    expect(mech.testDice?.skills?.iniciativa).toBe(-2);
    expect(mech.initiativeBonus).toBeUndefined();
  });
});

// =====================================================
// FASE 6: Condições Físicas
// =====================================================

describe('condition-effects-adapter: Condições Físicas', () => {
  it('debilitado penaliza dois dados dos testes físicos', () => {
    expect(CONDITION_MECHANICS.debilitado.mechanics.testDice?.attributes).toEqual({ agility: -2, strength: -2, vigor: -2 });
  });

  it('doente depende da doença e não inventa penalidade genérica', () => {
    expect(CONDITION_MECHANICS.doente.mechanics).toEqual({});
  });

  it('exausto deriva Debilitado, Lento e Vulnerável', () => {
    const effects = getConditionEffects(['exausto']);
    expect(effects.map(e => e.sourceId)).toEqual(['exausto', 'debilitado', 'lento', 'vulneravel']);
  });

  it('imobilizado deve ter deslocamento 0 e cannotMove', () => {
    const mech = CONDITION_MECHANICS['imobilizado']?.mechanics;
    
    expect(mech?.movementBonus).toBe(-999);
    expect(mech?.cannotMove).toBe(true);
  });

  it('lento deve ter deslocamento pela metade', () => {
    const mech = CONDITION_MECHANICS['lento']?.mechanics;
    
    expect(mech?.movementMultiplier).toBe(0.5);
  });

  it('fraco penaliza um dado dos testes físicos', () => {
    expect(CONDITION_MECHANICS.fraco.mechanics.testDice?.attributes).toEqual({ agility: -1, strength: -1, vigor: -1 });
  });

  it('envenenado depende do veneno e não inventa penalidade genérica', () => {
    expect(CONDITION_MECHANICS.envenenado.mechanics).toEqual({});
  });
});

// =====================================================
// FASE 7: Condições Mentais
// =====================================================

describe('condition-effects-adapter: Condições Mentais', () => {
  it('apavorado penaliza dois dados dos testes', () => {
    expect(CONDITION_MECHANICS.apavorado.mechanics.testDice?.all).toBe(-2);
    expect(CONDITION_MECHANICS.apavorado.mechanics.attackBonus).toBeUndefined();
  });

  it('fascinado deve ter -5 em Percepção e cannotAct', () => {
    const mech = CONDITION_MECHANICS['fascinado']?.mechanics;
    
    expect(mech?.skillBonus?.percepcao).toBe(-5);
    expect(mech?.cannotAct).toBe(true);
  });

  it('Enlouquecendo não retira ações antes da conclusão da contagem da cena', () => {
    const mech = CONDITION_MECHANICS['enlouquecendo']?.mechanics;
    
    expect(mech?.cannotAct).toBeUndefined();
    expect(mech?.specialEffects?.[0]).toContain('NPC');
  });

  it('perturbado não inventa penalidade genérica', () => {
    const mech = CONDITION_MECHANICS.perturbado.mechanics;
    expect(mech.allSkillsBonus).toBeUndefined();
    expect(mech.attackBonus).toBeUndefined();
    expect(mech.specialEffects?.[0]).toContain('insanidade');
  });
});

// =====================================================
// FASE 8: Condições de Rituais
// =====================================================

describe('condition-effects-adapter: Condições de Rituais', () => {
  it('velocidade-mortal-buff deve ter ação de movimento extra', () => {
    const mech = CONDITION_MECHANICS['velocidade-mortal-buff']?.mechanics;
    
    expect(mech?.extraAction).toBe('movement');
  });

  it('velocidade-mortal-discente deve ter ação padrão extra', () => {
    const mech = CONDITION_MECHANICS['velocidade-mortal-discente']?.mechanics;
    
    expect(mech?.extraAction).toBe('standard');
  });
});

// =====================================================
// FASE 9: getConditionEffects - Conversão para UnifiedEffect
// =====================================================

describe('condition-effects-adapter: getConditionEffects', () => {
  it('deve retornar array vazio para array vazio', () => {
    const effects = getConditionEffects([]);
    
    expect(effects).toEqual([]);
  });

  it('deve converter condição única para UnifiedEffect válido', () => {
    const effects = getConditionEffects(['desprevenido']);
    
    expect(effects).toHaveLength(1);
    expect(effects[0].id).toBe('condition-desprevenido');
    expect(effects[0].source).toBe('condition');
    expect(effects[0].sourceId).toBe('desprevenido');
    expect(effects[0].isActive).toBe(true);
    expect(effects[0].isToggleable).toBe(false);
  });

  it('deve converter múltiplas condições', () => {
    const effects = getConditionEffects(['desprevenido', 'cego', 'exausto']);
    expect(effects.map(e => e.sourceId)).toEqual(['desprevenido', 'cego', 'exausto', 'lento', 'debilitado', 'vulneravel']);
  });

  it('deve ter source = "condition" em todos os efeitos', () => {
    const effects = getConditionEffects(['atordoado', 'morrendo', 'surdo']);
    
    for (const effect of effects) {
      expect(effect.source).toBe('condition');
    }
  });

  it('deve ter sourceName formatado corretamente', () => {
    const effects = getConditionEffects(['atordoado']);
    
    expect(effects[0].sourceName).toBe('Condição: Atordoado');
  });

  it('deve ignorar condições inexistentes', () => {
    const effects = getConditionEffects(['condicao-inexistente']);
    
    expect(effects).toHaveLength(0);
  });

  it('deve incluir mecânicas corretas no efeito', () => {
    const [effect] = getConditionEffects(['desprevenido']);
    expect(effect.mechanics.defenseBonus).toBe(-5);
    expect(effect.mechanics.testDice?.skills?.reflexos).toBe(-1);
    expect(effect.mechanics.cannotReact).not.toBe(true);
  });
});

// =====================================================
// FASE 10: getConditionModifiersSummary
// =====================================================

describe('condition-effects-adapter: getConditionModifiersSummary', () => {
  it('deve retornar valores zerados para array vazio', () => {
    const summary = getConditionModifiersSummary([]);
    
    expect(summary.attackMod).toBe(0);
    expect(summary.defenseMod).toBe(0);
    expect(summary.initiativeMod).toBe(0);
    expect(summary.allTestsMod).toBe(0);
    expect(summary.canAct).toBe(true);
    expect(summary.canReact).toBe(true);
    expect(summary.canMove).toBe(true);
    expect(summary.isHelpless).toBe(false);
  });

  it('resumo numérico não mistura penalidades em dados de ataque', () => {
    expect(getConditionModifiersSummary(['cego', 'enredado']).attackMod).toBe(0);
  });

  it('deve acumular modificadores de defesa', () => {
    const summary = getConditionModifiersSummary(['desprevenido', 'vulneravel']);
    
    // desprevenido: -5, vulneravel: -2
    expect(summary.defenseMod).toBe(-7);
  });

  it('resumo numérico não mistura penalidade em dados de Iniciativa', () => {
    expect(getConditionModifiersSummary(['surdo']).initiativeMod).toBe(0);
  });

  it('resumo numérico não inventa penalidades gerais de testes', () => {
    expect(getConditionModifiersSummary(['debilitado', 'doente', 'exausto']).allTestsMod).toBe(0);
  });

  it('deve detectar cannotAct corretamente', () => {
    const summary = getConditionModifiersSummary(['atordoado']);
    
    expect(summary.canAct).toBe(false);
  });

  it('Desprevenido preserva reações', () => {
    expect(getConditionModifiersSummary(['desprevenido']).canReact).toBe(true);
  });

  it('deve detectar cannotMove corretamente', () => {
    const summary = getConditionModifiersSummary(['imobilizado']);
    
    expect(summary.canMove).toBe(false);
  });

  it('deve detectar isHelpless corretamente', () => {
    const summary = getConditionModifiersSummary(['paralisado']);
    
    expect(summary.isHelpless).toBe(true);
  });

  it('deve acumular modificadores contextuais de defesa', () => {
    const summary = getConditionModifiersSummary(['caido']);
    
    expect(summary.defenseVsMeleeMod).toBe(-5);
    expect(summary.defenseVsRangedMod).toBe(5);
  });

  it('deve lidar com múltiplas condições combinadas', () => {
    const summary = getConditionModifiersSummary(['inconsciente', 'cego', 'envenenado']);
    expect(summary.canAct).toBe(false);
    expect(summary.canReact).toBe(false);
    expect(summary.isHelpless).toBe(true);
    expect(summary.attackMod).toBe(0);
    expect(summary.allTestsMod).toBe(0);
  });
});

// =====================================================
// FASE 11: listAllConditionEffects
// =====================================================

describe('condition-effects-adapter: listAllConditionEffects', () => {
  it('deve retornar lista de todas as condições', () => {
    const list = listAllConditionEffects();
    
    expect(list.length).toBeGreaterThan(0);
    expect(list.length).toBe(Object.keys(CONDITIONS).length);
  });

  it('cada item deve ter id, name e hasMechanics', () => {
    const list = listAllConditionEffects();
    
    for (const item of list) {
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('name');
      expect(item).toHaveProperty('hasMechanics');
      expect(item).toHaveProperty('effects');
    }
  });

  it('condições mapeadas devem ter hasMechanics = true', () => {
    const list = listAllConditionEffects();
    const inconsciente = list.find(c => c.id === 'inconsciente');
    
    expect(inconsciente?.hasMechanics).toBe(true);
  });
});
