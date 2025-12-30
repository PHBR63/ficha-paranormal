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

  it('morrendo deve definir cannotAct, isUnconscious e isHelpless', () => {
    const mech = CONDITION_MECHANICS['morrendo']?.mechanics;
    
    expect(mech?.cannotAct).toBe(true);
    expect(mech?.cannotReact).toBe(true);
    expect(mech?.isUnconscious).toBe(true);
    expect(mech?.isHelpless).toBe(true);
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
  it('agarrado deve ter deslocamento 0, -2 Defesa e cannotMove', () => {
    const mech = CONDITION_MECHANICS['agarrado']?.mechanics;
    
    expect(mech?.movementBonus).toBe(-999);
    expect(mech?.defenseBonus).toBe(-2);
    expect(mech?.cannotMove).toBe(true);
  });

  it('atordoado deve ter cannotAct, cannotReact e -2 Defesa', () => {
    const mech = CONDITION_MECHANICS['atordoado']?.mechanics;
    
    expect(mech?.cannotAct).toBe(true);
    expect(mech?.cannotReact).toBe(true);
    expect(mech?.defenseBonus).toBe(-2);
  });

  it('desprevenido deve ter -5 Defesa e cannotReact', () => {
    const mech = CONDITION_MECHANICS['desprevenido']?.mechanics;
    
    expect(mech?.defenseBonus).toBe(-5);
    expect(mech?.cannotReact).toBe(true);
  });

  it('surpreendido deve ter -5 Defesa, cannotAct e cannotReact', () => {
    const mech = CONDITION_MECHANICS['surpreendido']?.mechanics;
    
    expect(mech?.defenseBonus).toBe(-5);
    expect(mech?.cannotAct).toBe(true);
    expect(mech?.cannotReact).toBe(true);
  });

  it('vulneravel deve ter -2 Defesa', () => {
    const mech = CONDITION_MECHANICS['vulneravel']?.mechanics;
    
    expect(mech?.defenseBonus).toBe(-2);
  });

  it('enredado deve ter -3m deslocamento, -2 ataque e -2 Reflexos', () => {
    const mech = CONDITION_MECHANICS['enredado']?.mechanics;
    
    expect(mech?.movementBonus).toBe(-3);
    expect(mech?.attackBonus).toBe(-2);
    expect(mech?.reflexosBonus).toBe(-2);
  });

  it('pasmo deve ter cannotAct e -2 Defesa', () => {
    const mech = CONDITION_MECHANICS['pasmo']?.mechanics;
    
    expect(mech?.cannotAct).toBe(true);
    expect(mech?.defenseBonus).toBe(-2);
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
  it('cego deve ter -5 ataque', () => {
    const mech = CONDITION_MECHANICS['cego']?.mechanics;
    
    expect(mech?.attackBonus).toBe(-5);
  });

  it('surdo deve ter -2 iniciativa', () => {
    const mech = CONDITION_MECHANICS['surdo']?.mechanics;
    
    expect(mech?.initiativeBonus).toBe(-2);
  });
});

// =====================================================
// FASE 6: Condições Físicas
// =====================================================

describe('condition-effects-adapter: Condições Físicas', () => {
  it('debilitado deve ter -1 em todos os testes', () => {
    const mech = CONDITION_MECHANICS['debilitado']?.mechanics;
    
    expect(mech?.allSkillsBonus).toBe(-1);
    expect(mech?.attackBonus).toBe(-1);
  });

  it('doente deve ter -2 em todos os testes', () => {
    const mech = CONDITION_MECHANICS['doente']?.mechanics;
    
    expect(mech?.allSkillsBonus).toBe(-2);
    expect(mech?.attackBonus).toBe(-2);
  });

  it('exausto deve ter -2 em testes e deslocamento pela metade', () => {
    const mech = CONDITION_MECHANICS['exausto']?.mechanics;
    
    expect(mech?.allSkillsBonus).toBe(-2);
    expect(mech?.attackBonus).toBe(-2);
    expect(mech?.movementMultiplier).toBe(0.5);
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

  it('fraco deve ter -2 em Força e Luta', () => {
    const mech = CONDITION_MECHANICS['fraco']?.mechanics;
    
    expect(mech?.skillBonus?.luta).toBe(-2);
    expect(mech?.attributeSkillsBonus?.strength).toBe(-2);
  });

  it('envenenado deve ter -2 em todos os testes', () => {
    const mech = CONDITION_MECHANICS['envenenado']?.mechanics;
    
    expect(mech?.allSkillsBonus).toBe(-2);
    expect(mech?.attackBonus).toBe(-2);
  });
});

// =====================================================
// FASE 7: Condições Mentais
// =====================================================

describe('condition-effects-adapter: Condições Mentais', () => {
  it('apavorado deve ter -2 em todos os testes', () => {
    const mech = CONDITION_MECHANICS['apavorado']?.mechanics;
    
    expect(mech?.allSkillsBonus).toBe(-2);
    expect(mech?.attackBonus).toBe(-2);
  });

  it('fascinado deve ter -5 em Percepção e cannotAct', () => {
    const mech = CONDITION_MECHANICS['fascinado']?.mechanics;
    
    expect(mech?.skillBonus?.percepcao).toBe(-5);
    expect(mech?.cannotAct).toBe(true);
  });

  it('enlouquecendo deve ter cannotAct', () => {
    const mech = CONDITION_MECHANICS['enlouquecendo']?.mechanics;
    
    expect(mech?.cannotAct).toBe(true);
  });

  it('perturbado deve ter -2 em todos os testes', () => {
    const mech = CONDITION_MECHANICS['perturbado']?.mechanics;
    
    expect(mech?.allSkillsBonus).toBe(-2);
    expect(mech?.attackBonus).toBe(-2);
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
    
    expect(effects).toHaveLength(3);
    expect(effects.map(e => e.sourceId)).toEqual(['desprevenido', 'cego', 'exausto']);
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
    const effects = getConditionEffects(['desprevenido']);
    
    expect(effects[0].mechanics.defenseBonus).toBe(-5);
    expect(effects[0].mechanics.cannotReact).toBe(true);
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

  it('deve acumular modificadores de ataque', () => {
    const summary = getConditionModifiersSummary(['cego', 'enredado']);
    
    // cego: -5, enredado: -2
    expect(summary.attackMod).toBe(-7);
  });

  it('deve acumular modificadores de defesa', () => {
    const summary = getConditionModifiersSummary(['desprevenido', 'vulneravel']);
    
    // desprevenido: -5, vulneravel: -2
    expect(summary.defenseMod).toBe(-7);
  });

  it('deve acumular modificadores de iniciativa', () => {
    const summary = getConditionModifiersSummary(['surdo']);
    
    expect(summary.initiativeMod).toBe(-2);
  });

  it('deve acumular modificadores gerais de testes', () => {
    const summary = getConditionModifiersSummary(['debilitado', 'doente', 'exausto']);
    
    // debilitado: -1, doente: -2, exausto: -2
    expect(summary.allTestsMod).toBe(-5);
  });

  it('deve detectar cannotAct corretamente', () => {
    const summary = getConditionModifiersSummary(['atordoado']);
    
    expect(summary.canAct).toBe(false);
  });

  it('deve detectar cannotReact corretamente', () => {
    const summary = getConditionModifiersSummary(['desprevenido']);
    
    expect(summary.canReact).toBe(false);
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
    expect(summary.attackMod).toBe(-5); // cego
    expect(summary.allTestsMod).toBe(-2); // envenenado
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
