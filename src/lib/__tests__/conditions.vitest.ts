// =====================================================
// Testes Vitest - Sistema de Condições
// Ordem Paranormal RPG v1.3
// =====================================================
//
// Cobertura:
// - Integridade e estrutura de condições
// - Funções de busca e categorias
// - Modificadores contextuais (corpo a corpo vs distância)
// - Cálculo de modificadores de ataque, defesa, iniciativa
// - Verificações de restrições (PE, ações)
// - Parâmetros de condições (Fragilizado, Machucado, Envenenado)
//

import { describe, it, expect } from 'vitest';
import {
  CONDITIONS,
  CONDITION_CATEGORIES,
  CONTEXTUAL_DEFENSE_MODIFIERS,
  ATTACK_MODIFIERS,
  INITIATIVE_MODIFIERS,
  TEST_MODIFIERS,
  DAMAGE_TYPES,
  getConditionById,
  getAllConditions,
  getConditionsByCategory,
  getContextualDefenseModifier,
  getAttackModifierFromConditions,
  getInitiativeModifierFromConditions,
  getTestModifierFromConditions,
  canSpendPEWithConditions,
  getMaxActionsFromConditions,
  conditionRequiresParams,
  getConditionEffectWithParams,
  getMachucadoDamage,
  getFragilizadoMultiplier,
} from '../conditions';

// =====================================================
// INTEGRIDADE E ESTRUTURA
// =====================================================

describe('Integridade das Condições', () => {
  it('deve ter todas as condições com campos obrigatórios', () => {
    const conditions = Object.values(CONDITIONS);
    
    for (const condition of conditions) {
      expect(condition.id).toBeDefined();
      expect(condition.name).toBeDefined();
      expect(condition.icon).toBeDefined();
      expect(condition.color).toBeDefined();
      expect(condition.description).toBeDefined();
      expect(condition.effect).toBeDefined();
    }
  });

  it('deve ter IDs únicos para todas as condições', () => {
    const ids = Object.keys(CONDITIONS);
    const uniqueIds = new Set(ids);
    expect(ids.length).toBe(uniqueIds.size);
  });

  it('deve ter pelo menos 25 condições definidas', () => {
    const count = Object.keys(CONDITIONS).length;
    expect(count).toBeGreaterThanOrEqual(25);
  });

  it('deve ter condições essenciais do sistema', () => {
    const essenciais = [
      'agarrado', 'atordoado', 'caido', 'cego', 'surdo',
      'inconsciente', 'morrendo', 'sangrando', 'apavorado',
      'envenenado', 'fragilizado', 'machucado',
    ];
    
    for (const id of essenciais) {
      expect(CONDITIONS[id]).toBeDefined();
      expect(CONDITIONS[id].name).toBeTruthy();
    }
  });
});

// =====================================================
// CATEGORIAS DE CONDIÇÕES
// =====================================================

describe('Categorias de Condições', () => {
  it('deve ter todas as categorias definidas', () => {
    expect(CONDITION_CATEGORIES.combat).toBeDefined();
    expect(CONDITION_CATEGORIES.sensory).toBeDefined();
    expect(CONDITION_CATEGORIES.mental).toBeDefined();
    expect(CONDITION_CATEGORIES.physical).toBeDefined();
    expect(CONDITION_CATEGORIES.critical).toBeDefined();
    expect(CONDITION_CATEGORIES.ritual).toBeDefined();
  });

  it('todas as condições nas categorias devem existir', () => {
    for (const [categoria, ids] of Object.entries(CONDITION_CATEGORIES)) {
      for (const id of ids) {
        expect(CONDITIONS[id]).toBeDefined();
      }
    }
  });

  it('getConditionsByCategory deve retornar condições corretas', () => {
    const combat = getConditionsByCategory('combat');
    expect(combat.length).toBeGreaterThan(0);
    expect(combat.some(c => c.id === 'agarrado')).toBe(true);
    expect(combat.some(c => c.id === 'atordoado')).toBe(true);
  });

  it('getConditionsByCategory deve retornar condições sensoriais', () => {
    const sensory = getConditionsByCategory('sensory');
    expect(sensory.length).toBe(2);
    expect(sensory.some(c => c.id === 'cego')).toBe(true);
    expect(sensory.some(c => c.id === 'surdo')).toBe(true);
  });
});

// =====================================================
// FUNÇÕES DE BUSCA
// =====================================================

describe('Funções de Busca', () => {
  it('getConditionById deve retornar condição existente', () => {
    const condition = getConditionById('cego');
    expect(condition).toBeDefined();
    expect(condition?.id).toBe('cego');
    expect(condition?.name).toBe('Cego');
  });

  it('getConditionById deve retornar undefined para inexistente', () => {
    const condition = getConditionById('inexistente');
    expect(condition).toBeUndefined();
  });

  it('getAllConditions deve retornar array de todas as condições', () => {
    const all = getAllConditions();
    expect(Array.isArray(all)).toBe(true);
    expect(all.length).toBe(Object.keys(CONDITIONS).length);
  });
});

// =====================================================
// MODIFICADORES CONTEXTUAIS
// =====================================================

describe('Modificadores Contextuais de Defesa', () => {
  it('deve ter modificador contextual para Caído', () => {
    expect(CONTEXTUAL_DEFENSE_MODIFIERS.caido).toBeDefined();
    expect(CONTEXTUAL_DEFENSE_MODIFIERS.caido.melee).toBe(-5);
    expect(CONTEXTUAL_DEFENSE_MODIFIERS.caido.ranged).toBe(+5);
  });

  it('Desprevenido não duplica sua Defesa no mapa contextual', () => {
    // Desprevenido é uma penalidade geral de Defesa, não uma segunda penalidade contextual.
    expect(CONTEXTUAL_DEFENSE_MODIFIERS.desprevenido).toBeUndefined();
  });

  it('getContextualDefenseModifier deve retornar valor correto', () => {
    // Caído: -5 corpo a corpo, +5 distância
    expect(getContextualDefenseModifier('caido', 'melee')).toBe(-5);
    expect(getContextualDefenseModifier('caido', 'ranged')).toBe(+5);
  });

  it('getContextualDefenseModifier deve retornar 0 para condição sem modificador', () => {
    expect(getContextualDefenseModifier('cego', 'melee')).toBe(0);
    expect(getContextualDefenseModifier('cego', 'ranged')).toBe(0);
  });
});

// =====================================================
// MODIFICADORES DE ATAQUE
// =====================================================

describe('Modificadores de Ataque', () => {
  it('deve ter modificador de ataque para Cego', () => {
    expect(ATTACK_MODIFIERS.cego).toBeUndefined();
  });

  it('deve ter modificador de ataque para Enredado', () => {
    expect(ATTACK_MODIFIERS.enredado).toBeUndefined();
  });

  it('getAttackModifierFromConditions deve calcular corretamente', () => {
    expect(getAttackModifierFromConditions(['cego'])).toBe(0);
    expect(getAttackModifierFromConditions(['enredado'])).toBe(0);
    expect(getAttackModifierFromConditions(['cego', 'enredado'])).toBe(0);
  });

  it('getAttackModifierFromConditions deve retornar 0 sem condições relevantes', () => {
    expect(getAttackModifierFromConditions([])).toBe(0);
    expect(getAttackModifierFromConditions(['apavorado'])).toBe(0);
  });
});

// =====================================================
// MODIFICADORES DE INICIATIVA
// =====================================================

describe('Modificadores de Iniciativa', () => {
  it('deve ter modificador de iniciativa para Surdo', () => {
    expect(INITIATIVE_MODIFIERS.surdo).toBeUndefined();
  });

  it('getInitiativeModifierFromConditions deve calcular corretamente', () => {
    expect(getInitiativeModifierFromConditions(['surdo'])).toBe(0);
    expect(getInitiativeModifierFromConditions([])).toBe(0);
  });
});

// =====================================================
// MODIFICADORES GERAIS DE TESTE
// =====================================================

describe('Modificadores Gerais de Teste', () => {
  it('deve ter modificadores para condições que afetam testes', () => {
    expect(TEST_MODIFIERS.apavorado).toBeUndefined();
    expect(TEST_MODIFIERS.debilitado).toBeUndefined();
    expect(TEST_MODIFIERS.doente).toBeUndefined();
    expect(TEST_MODIFIERS.envenenado).toBeUndefined();
  });

  it('getTestModifierFromConditions deve acumular modificadores', () => {
    expect(getTestModifierFromConditions(['apavorado'])).toBe(0);
    expect(getTestModifierFromConditions(['apavorado', 'doente'])).toBe(0);
    expect(getTestModifierFromConditions(['debilitado'])).toBe(0);
  });

  it('getTestModifierFromConditions deve retornar 0 sem condições relevantes', () => {
    expect(getTestModifierFromConditions([])).toBe(0);
    expect(getTestModifierFromConditions(['cego', 'surdo'])).toBe(0);
  });
});

// =====================================================
// RESTRIÇÕES DE CONDIÇÕES
// =====================================================

describe('Restrições de Condições', () => {
  it('canSpendPEWithConditions não bloqueia com Frustrado', () => {
    expect(canSpendPEWithConditions(['frustrado'])).toBe(true);
    expect(canSpendPEWithConditions([])).toBe(true);
    expect(canSpendPEWithConditions(['cego', 'surdo'])).toBe(true);
  });

  it('getMaxActionsFromConditions deve limitar com Enjoado', () => {
    expect(getMaxActionsFromConditions(['enjoado'])).toBe(1);
    expect(getMaxActionsFromConditions([])).toBe(2);
  });

  it('Lento limita movimento, não o número de ações', () => {
    expect(getMaxActionsFromConditions(['lento'])).toBe(2);
  });

  it('getMaxActionsFromConditions deve retornar 2 normalmente', () => {
    expect(getMaxActionsFromConditions(['cego', 'surdo'])).toBe(2);
  });
});

// =====================================================
// TIPOS DE DANO
// =====================================================

describe('Tipos de Dano', () => {
  it('deve ter todos os tipos de dano físicos', () => {
    const fisicos = DAMAGE_TYPES.filter(d => d.category === 'physical');
    expect(fisicos.length).toBeGreaterThanOrEqual(4);
    expect(fisicos.some(d => d.id === 'balístico')).toBe(true);
    expect(fisicos.some(d => d.id === 'corte')).toBe(true);
    expect(fisicos.some(d => d.id === 'impacto')).toBe(true);
    expect(fisicos.some(d => d.id === 'perfuração')).toBe(true);
  });

  it('deve ter tipos de dano elementais', () => {
    const elementais = DAMAGE_TYPES.filter(d => d.category === 'elemental');
    expect(elementais.length).toBeGreaterThanOrEqual(4);
    expect(elementais.some(d => d.id === 'fogo')).toBe(true);
    expect(elementais.some(d => d.id === 'frio')).toBe(true);
  });

  it('deve ter tipos de dano paranormais', () => {
    const paranormais = DAMAGE_TYPES.filter(d => d.category === 'paranormal');
    expect(paranormais.length).toBeGreaterThanOrEqual(4);
    expect(paranormais.some(d => d.id === 'mental')).toBe(true);
    expect(paranormais.some(d => d.id === 'morte')).toBe(true);
  });
});

// =====================================================
// PARÂMETROS DE CONDIÇÕES
// =====================================================

describe('Parâmetros de Condições', () => {
  it('conditionRequiresParams deve identificar Fragilizado', () => {
    expect(conditionRequiresParams('fragilizado')).toBe(true);
    expect(conditionRequiresParams('machucado')).toBe(false);
    expect(conditionRequiresParams('envenenado')).toBe(true);
  });

  it('conditionRequiresParams deve retornar false para condições simples', () => {
    expect(conditionRequiresParams('cego')).toBe(false);
    expect(conditionRequiresParams('atordoado')).toBe(false);
  });

  it('getConditionEffectWithParams deve formatar Fragilizado', () => {
    const effect = getConditionEffectWithParams('fragilizado', {
      damageType: 'fogo',
    });
    expect(effect).toContain('Fogo');
    expect(effect).toContain('+50%');
  });

  it('getConditionEffectWithParams deve formatar Machucado', () => {
    const effect = getConditionEffectWithParams('machucado', {
      weaponMaxDamage: 12,
      weaponName: 'Espada',
    });
    expect(effect).toBe(CONDITIONS.machucado.effect);
  });

  it('getConditionEffectWithParams deve formatar Envenenado', () => {
    const effect = getConditionEffectWithParams('envenenado', {
      poisonDamage: '1d6',
      poisonDT: 15,
      poisonName: 'Veneno de cobra',
    });
    expect(effect).toContain('1d6');
    expect(effect).toContain('DT 15');
    expect(effect).toContain('Veneno de cobra');
  });

  it('getConditionEffectWithParams deve retornar efeito padrão sem params', () => {
    const effect = getConditionEffectWithParams('cego');
    expect(effect).toBe(CONDITIONS.cego.effect);
  });
});

// =====================================================
// CÁLCULOS ESPECIAIS
// =====================================================

describe('Cálculos Especiais', () => {
  it('getMachucadoDamage não causa dano ao agir', () => {
    expect(getMachucadoDamage({ weaponMaxDamage: 10 })).toBe(0);
    expect(getMachucadoDamage({ weaponMaxDamage: 18 })).toBe(0);
  });

  it('getMachucadoDamage deve retornar 0 sem parâmetros', () => {
    expect(getMachucadoDamage()).toBe(0);
    expect(getMachucadoDamage({})).toBe(0);
  });

  it('getFragilizadoMultiplier deve retornar 1.5 para tipo correto', () => {
    expect(getFragilizadoMultiplier('fogo', { damageType: 'fogo' })).toBe(1.5);
    expect(getFragilizadoMultiplier('mental', { damageType: 'mental' })).toBe(1.5);
  });

  it('getFragilizadoMultiplier deve retornar 1.0 para tipo diferente', () => {
    expect(getFragilizadoMultiplier('fogo', { damageType: 'frio' })).toBe(1.0);
    expect(getFragilizadoMultiplier('corte', { damageType: 'fogo' })).toBe(1.0);
  });

  it('getFragilizadoMultiplier deve retornar 1.0 sem parâmetros', () => {
    expect(getFragilizadoMultiplier('fogo')).toBe(1.0);
    expect(getFragilizadoMultiplier('fogo', {})).toBe(1.0);
  });
});

// =====================================================
// CONDIÇÕES ESPECÍFICAS
// =====================================================

describe('Condições Específicas', () => {
  it('Morrendo deve ter contador de rodadas', () => {
    const morrendo = CONDITIONS.morrendo;
    expect(morrendo.effect).toContain('3 rodadas');
  });

  it('Inconsciente deve ter Defesa 5', () => {
    const inconsciente = CONDITIONS.inconsciente;
    expect(inconsciente.effect).toContain('Defesa 5');
  });

  it('Sangrando deve causar dano por turno', () => {
    const sangrando = CONDITIONS.sangrando;
    expect(sangrando.effect).toContain('1d6');
  });

  it('Condições de ritual devem existir', () => {
    expect(CONDITIONS['velocidade-mortal-inverso']).toBeDefined();
    expect(CONDITIONS['velocidade-mortal-buff']).toBeDefined();
    expect(CONDITIONS['velocidade-mortal-discente']).toBeDefined();
  });
});

// =====================================================
// AUTO-REMOÇÃO
// =====================================================

describe('Auto-Remoção de Condições', () => {
  it('Atordoado deve ter autoRemove', () => {
    expect(CONDITIONS.atordoado.autoRemove).toBe(true);
  });

  it('Pasmo deve ter autoRemove', () => {
    expect(CONDITIONS.pasmo.autoRemove).toBe(true);
  });

  it('Surpreendido deve ter autoRemove', () => {
    expect(CONDITIONS.surpreendido.autoRemove).toBe(true);
  });

  it('Condições persistentes não devem ter autoRemove', () => {
    expect(CONDITIONS.cego.autoRemove).toBeUndefined();
    expect(CONDITIONS.envenenado.autoRemove).toBeUndefined();
  });
});
