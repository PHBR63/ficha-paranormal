/**
 * Testes Unitários - Adaptador de Efeitos de Poderes de Classe
 * Sistema Unificado de Efeitos (SUE) - Ordem Paranormal RPG v1.3
 * 
 * Cobertura:
 * - Mapeamento de poderes de classe
 * - Poderes de Ocultista com rituais
 * - Poderes de Combatente (combate corpo a corpo)
 * - Poderes de Especialista (combate à distância)
 * - Poderes com escolhas obrigatórias
 * - getClassPowerEffects
 * - Funções auxiliares
 */

import { describe, it, expect } from 'vitest';
import {
  getClassPowerEffects,
  getPowersRequiringChoice,
  getChoiceTypeForPower,
  hasPowerEffects,
  listAllClassPowerEffects,
  getClassPowerEffectInfo,
  type ActiveClassPower,
} from '../class-power-effects-adapter';
import type { AttributeType } from '../../unified-effects-engine';

// =====================================================
// Helpers de Teste
// =====================================================

/**
 * Cria um poder de classe ativo de teste
 */
function createTestPower(overrides: Partial<ActiveClassPower> = {}): ActiveClassPower {
  return {
    id: 'test-power',
    name: 'Poder de Teste',
    classId: 'combatente',
    nex: 25,
    ...overrides,
  };
}

/**
 * Cria atributos padrão para testes
 */
function createTestAttributes(): Record<AttributeType, number> {
  return {
    strength: 2,
    agility: 2,
    vigor: 2,
    intellect: 3,
    presence: 1,
  };
}

// =====================================================
// FASE 1: Estrutura do getClassPowerEffects
// =====================================================

describe('class-power-effects-adapter: getClassPowerEffects Estrutura', () => {
  it('deve retornar array vazio para array vazio', () => {
    const effects = getClassPowerEffects([], 25, createTestAttributes());
    
    expect(effects).toEqual([]);
  });

  it('deve retornar array vazio para poder não mapeado', () => {
    const power = createTestPower({ id: 'poder-inexistente' });
    const effects = getClassPowerEffects([power], 25, createTestAttributes());
    
    expect(effects).toEqual([]);
  });

  it('efeito deve ter source = "class_power"', () => {
    const power = createTestPower({ id: 'golpe-pesado' });
    const effects = getClassPowerEffects([power], 25, createTestAttributes());
    
    if (effects.length > 0) {
      expect(effects[0].source).toBe('class_power');
    }
  });

  it('efeito deve ter id no formato correto', () => {
    const power = createTestPower({ id: 'golpe-pesado' });
    const effects = getClassPowerEffects([power], 25, createTestAttributes());
    
    if (effects.length > 0) {
      expect(effects[0].id).toBe('class-power-golpe-pesado');
    }
  });

  it('efeito deve ter sourceId igual ao id do poder', () => {
    const power = createTestPower({ id: 'golpe-brutal' });
    const effects = getClassPowerEffects([power], 25, createTestAttributes());
    
    if (effects.length > 0) {
      expect(effects[0].sourceId).toBe('golpe-brutal');
    }
  });
});

// =====================================================
// FASE 2: Poderes de Combate (Combatente)
// =====================================================

describe('class-power-effects-adapter: Poderes de Combatente', () => {
  it('golpe-pesado deve acrescentar um dado da arma, sem bônus fixo de dano', () => {
    const power = createTestPower({ id: 'golpe-pesado', classId: 'combatente' });
    const effects = getClassPowerEffects([power], 25, createTestAttributes());
    
    expect(effects).toHaveLength(1);
    expect(effects[0].mechanics.extraDamageDice).toBe('+1d');
    expect(effects[0].mechanics.meleeDamageBonus ?? 0).toBe(0);
    expect(effects[0].mechanics.conditionalNote).toContain('corpo a corpo');
  });

  it('golpe-demolidor deve oferecer dois dados da arma mediante ativação, sem dano fixo', () => {
    const power = createTestPower({ id: 'golpe-demolidor', classId: 'combatente' });
    const effects = getClassPowerEffects([power], 50, createTestAttributes());
    
    expect(effects).toHaveLength(1);
    expect(effects[0].mechanics.extraDamageDice).toBe('2W');
    expect(effects[0].mechanics.meleeDamageBonus).toBeUndefined();
    expect(effects[0].isActive).toBe(false);
    expect(effects[0].conditions?.costPE).toBe(1);
  });

  it('golpe-brutal deve ter +2 margem de ameaça', () => {
    const power = createTestPower({ id: 'golpe-brutal', classId: 'combatente' });
    const effects = getClassPowerEffects([power], 25, createTestAttributes());
    
    expect(effects).toHaveLength(1);
    expect(effects[0].mechanics.criticalMarginBonus).toBe(2);
    expect(effects[0].mechanics.conditionalNote).toContain('corpo a corpo');
  });

  it('ataque-especial deve oferecer o bônus escalonado e exigir ativação', () => {
    const power = createTestPower({ id: 'ataque-especial', classId: 'combatente' });
    const effects = getClassPowerEffects([power], 25, createTestAttributes());
    
    expect(effects).toHaveLength(1);
    expect(effects[0].mechanics.attackBonus).toBe(10);
    expect(effects[0].conditions?.costPE).toBe(3);
    expect(effects[0].isActive).toBe(false);
  });
});

// =====================================================
// FASE 3: Poderes de Combate (Especialista)
// =====================================================

describe('class-power-effects-adapter: Poderes de Especialista', () => {
  it('mira-firme deve ter +2 dano à distância', () => {
    const power = createTestPower({ id: 'mira-firme', classId: 'especialista' });
    const effects = getClassPowerEffects([power], 25, createTestAttributes());
    
    expect(effects).toHaveLength(1);
    expect(effects[0].mechanics.rangedDamageBonus).toBe(2);
  });

  it('balistica-avancada deve ter +2 dano com armas de fogo', () => {
    const power = createTestPower({ id: 'balistica-avancada', classId: 'especialista' });
    const effects = getClassPowerEffects([power], 50, createTestAttributes());
    
    expect(effects).toHaveLength(1);
    expect(effects[0].mechanics.firearmDamageBonus).toBe(2);
    expect(effects[0].mechanics.damageBonus).toBeUndefined();
    expect(effects[0].mechanics.conditionalNote).toContain('armas de fogo');
  });
});

// =====================================================
// FASE 4: Poderes de Ocultista com Rituais
// =====================================================

describe('class-power-effects-adapter: Poderes de Ocultista com Rituais', () => {
  it('especialista-em-elemento deve ter +2 DT no elemento escolhido', () => {
    const power = createTestPower({
      id: 'especialista-em-elemento',
      classId: 'ocultista',
      choices: { element: 'Sangue' },
    });
    const effects = getClassPowerEffects([power], 25, createTestAttributes());
    
    expect(effects).toHaveLength(1);
    expect(effects[0].mechanics.ritualDTBonusByElement).toEqual({ sangue: 2 });
  });

  it('especialista-em-elemento sem escolha não gera efeito', () => {
    const power = createTestPower({
      id: 'especialista-em-elemento',
      classId: 'ocultista',
      // Sem choices
    });
    const effects = getClassPowerEffects([power], 25, createTestAttributes());
    
    expect(effects).toHaveLength(0);
  });

  it('mestre-em-elemento deve ter -1 PE no elemento escolhido', () => {
    const power = createTestPower({
      id: 'mestre-em-elemento',
      classId: 'ocultista',
      choices: { element: 'Morte' },
    });
    const effects = getClassPowerEffects([power], 50, createTestAttributes());
    
    expect(effects).toHaveLength(1);
    expect(effects[0].mechanics.ritualPEReductionByElement).toEqual({ morte: 1 });
  });

  it('ritual-potente deve ter bônus de Intelecto em dano de rituais', () => {
    const power = createTestPower({ id: 'ritual-potente', classId: 'ocultista' });
    const effects = getClassPowerEffects([power], 25, createTestAttributes());
    
    expect(effects).toHaveLength(1);
    expect(effects[0].mechanics.ritualDamageAttributeBonus).toBe('intellect');
  });

  it('ritual-predileto deve ter -1 PE e nota especial', () => {
    const power = createTestPower({
      id: 'ritual-predileto',
      classId: 'ocultista',
      choices: { ritual: 'Amaldiçoar Arma' },
    });
    const effects = getClassPowerEffects([power], 25, createTestAttributes());
    
    expect(effects).toHaveLength(1);
    expect(effects[0].mechanics.ritualPEReduction).toBe(1);
    expect(effects[0].mechanics.specialEffects).toBeDefined();
    expect(effects[0].mechanics.specialEffects![0]).toContain('Amaldiçoar Arma');
  });

  it('tatuagem-ritualistica deve ter -1 PE em rituais pessoais', () => {
    const power = createTestPower({ id: 'tatuagem-ritualistica', classId: 'ocultista' });
    const effects = getClassPowerEffects([power], 25, createTestAttributes());
    
    expect(effects).toHaveLength(1);
    expect(effects[0].mechanics.ritualPEReductionByRange).toEqual({ pessoal: 1 });
  });
});

// =====================================================
// FASE 5: Poderes com Bônus de Perícia
// =====================================================

describe('class-power-effects-adapter: Poderes com Bônus de Perícia', () => {
  it('envolto-em-misterio deve ter +5 em Enganação e Intimidação', () => {
    const power = createTestPower({ id: 'envolto-em-misterio', classId: 'ocultista' });
    const effects = getClassPowerEffects([power], 25, createTestAttributes());
    
    expect(effects).toHaveLength(1);
    expect(effects[0].mechanics.skillBonus?.enganacao).toBe(5);
    expect(effects[0].mechanics.skillBonus?.intimidacao).toBe(5);
  });

  it('identificacao-paranormal deve ter +10 em Ocultismo', () => {
    const power = createTestPower({ id: 'identificacao-paranormal', classId: 'ocultista' });
    const effects = getClassPowerEffects([power], 25, createTestAttributes());
    
    expect(effects).toHaveLength(1);
    expect(effects[0].mechanics.skillBonus?.ocultismo).toBe(10);
  });
});

// =====================================================
// FASE 6: Poderes que Requerem Escolha
// =====================================================

describe('class-power-effects-adapter: Validação de Escolhas', () => {
  it('getPowersRequiringChoice deve retornar lista correta', () => {
    const powers = getPowersRequiringChoice();
    
    expect(powers).toContain('especialista-em-elemento');
    expect(powers).toContain('mestre-em-elemento');
    expect(powers).toContain('ritual-predileto');
  });

  it('getChoiceTypeForPower deve retornar tipo correto', () => {
    expect(getChoiceTypeForPower('especialista-em-elemento')).toBe('element');
    expect(getChoiceTypeForPower('mestre-em-elemento')).toBe('element');
    expect(getChoiceTypeForPower('ritual-predileto')).toBe('ritual');
  });

  it('getChoiceTypeForPower deve retornar undefined para poder sem escolha', () => {
    expect(getChoiceTypeForPower('golpe-pesado')).toBeUndefined();
    expect(getChoiceTypeForPower('ritual-potente')).toBeUndefined();
  });

  it('poder com escolha errada não gera efeito', () => {
    const power = createTestPower({
      id: 'especialista-em-elemento',
      classId: 'ocultista',
      choices: { ritual: 'Algum ritual' }, // Escolha errada - deveria ser element
    });
    const effects = getClassPowerEffects([power], 25, createTestAttributes());
    
    expect(effects).toHaveLength(0);
  });
});

// =====================================================
// FASE 7: hasPowerEffects
// =====================================================

describe('class-power-effects-adapter: hasPowerEffects', () => {
  it('deve retornar true para poderes mapeados', () => {
    expect(hasPowerEffects('golpe-pesado')).toBe(true);
    expect(hasPowerEffects('especialista-em-elemento')).toBe(true);
    expect(hasPowerEffects('ritual-potente')).toBe(true);
  });

  it('deve retornar false para poderes não mapeados', () => {
    expect(hasPowerEffects('poder-inexistente')).toBe(false);
    expect(hasPowerEffects('')).toBe(false);
  });
});

// =====================================================
// FASE 8: listAllClassPowerEffects
// =====================================================

describe('class-power-effects-adapter: listAllClassPowerEffects', () => {
  it('deve retornar lista não vazia', () => {
    const list = listAllClassPowerEffects();
    
    expect(list.length).toBeGreaterThan(0);
  });

  it('cada item deve ter id, name e description', () => {
    const list = listAllClassPowerEffects();
    
    for (const item of list) {
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('name');
      expect(item).toHaveProperty('description');
      expect(typeof item.id).toBe('string');
      expect(typeof item.name).toBe('string');
      expect(typeof item.description).toBe('string');
    }
  });

  it('deve incluir poderes conhecidos', () => {
    const list = listAllClassPowerEffects();
    const ids = list.map(p => p.id);
    
    expect(ids).toContain('golpe-pesado');
    expect(ids).toContain('especialista-em-elemento');
    expect(ids).toContain('ritual-potente');
  });
});

// =====================================================
// FASE 9: getClassPowerEffectInfo
// =====================================================

describe('class-power-effects-adapter: getClassPowerEffectInfo', () => {
  it('deve retornar info para poder existente', () => {
    const info = getClassPowerEffectInfo('golpe-pesado');
    
    expect(info).toBeDefined();
    expect(info?.id).toBe('golpe-pesado');
    expect(info?.name).toBe('Golpe Pesado');
  });

  it('deve retornar undefined para poder inexistente', () => {
    const info = getClassPowerEffectInfo('poder-inexistente');
    
    expect(info).toBeUndefined();
  });

  it('deve indicar se requer escolha', () => {
    const infoWithChoice = getClassPowerEffectInfo('especialista-em-elemento');
    const infoWithoutChoice = getClassPowerEffectInfo('golpe-pesado');
    
    expect(infoWithChoice?.requiresChoice).toBe(true);
    expect(infoWithChoice?.choiceType).toBe('element');
    expect(infoWithoutChoice?.requiresChoice).toBeFalsy();
  });
});

// =====================================================
// FASE 10: Múltiplos Poderes
// =====================================================

describe('class-power-effects-adapter: Múltiplos Poderes', () => {
  it('deve processar múltiplos poderes', () => {
    const powers: ActiveClassPower[] = [
      createTestPower({ id: 'golpe-pesado', classId: 'combatente' }),
      createTestPower({ id: 'golpe-brutal', classId: 'combatente' }),
    ];
    const effects = getClassPowerEffects(powers, 50, createTestAttributes());
    
    expect(effects).toHaveLength(2);
  });

  it('deve filtrar poderes sem escolha válida', () => {
    const powers: ActiveClassPower[] = [
      createTestPower({ id: 'golpe-pesado' }),
      createTestPower({ id: 'especialista-em-elemento' }), // Sem escolha
    ];
    const effects = getClassPowerEffects(powers, 25, createTestAttributes());
    
    expect(effects).toHaveLength(1);
    expect(effects[0].sourceId).toBe('golpe-pesado');
  });

  it('deve processar poderes de classes diferentes', () => {
    const powers: ActiveClassPower[] = [
      createTestPower({ id: 'golpe-pesado', classId: 'combatente' }),
      createTestPower({ id: 'mira-firme', classId: 'especialista' }),
      createTestPower({ id: 'ritual-potente', classId: 'ocultista' }),
    ];
    const effects = getClassPowerEffects(powers, 50, createTestAttributes());
    
    expect(effects).toHaveLength(3);
  });
});

// =====================================================
// FASE 11: Ativação Manual
// =====================================================

describe('class-power-effects-adapter: Ativação Manual', () => {
  it('poderes com custo de PE devem requerer ativação', () => {
    const power = createTestPower({ id: 'ataque-especial' });
    const effects = getClassPowerEffects([power], 25, createTestAttributes());
    
    expect(effects).toHaveLength(1);
    expect(effects[0].conditions?.requiresActivation).toBe(true);
  });

  it('poderes passivos devem estar sempre ativos', () => {
    const power = createTestPower({ id: 'golpe-pesado' });
    const effects = getClassPowerEffects([power], 25, createTestAttributes());
    
    expect(effects).toHaveLength(1);
    expect(effects[0].isActive).toBe(true);
    expect(effects[0].isToggleable).toBe(false);
  });

  it('deve respeitar lista de efeitos ativados', () => {
    const power = createTestPower({ id: 'ataque-especial' });
    const effectsInactive = getClassPowerEffects([power], 25, createTestAttributes(), []);
    const effectsActive = getClassPowerEffects(
      [power],
      25,
      createTestAttributes(),
      ['class-power-ataque-especial']
    );
    
    // O estado de ativação deve mudar baseado na lista
    expect(effectsInactive).toHaveLength(1);
    expect(effectsActive).toHaveLength(1);
    expect(effectsInactive[0].isActive).toBe(false);
    expect(effectsActive[0].isActive).toBe(true);
  });
});

// =====================================================
// FASE 12: Edge Cases
// =====================================================

describe('class-power-effects-adapter: Edge Cases', () => {
  it('deve lidar com NEX 5%', () => {
    const power = createTestPower({ id: 'golpe-pesado' });
    
    expect(() => getClassPowerEffects([power], 5, createTestAttributes())).not.toThrow();
  });

  it('deve lidar com NEX 99%', () => {
    const power = createTestPower({ id: 'golpe-pesado' });
    
    expect(() => getClassPowerEffects([power], 99, createTestAttributes())).not.toThrow();
  });

  it('deve lidar com atributos zerados', () => {
    const power = createTestPower({ id: 'ritual-potente' });
    const zeroAttrs: Record<AttributeType, number> = {
      strength: 0,
      agility: 0,
      vigor: 0,
      intellect: 0,
      presence: 0,
    };
    
    expect(() => getClassPowerEffects([power], 25, zeroAttrs)).not.toThrow();
  });

  it('deve lidar com atributos negativos', () => {
    const power = createTestPower({ id: 'ritual-potente' });
    const negAttrs: Record<AttributeType, number> = {
      strength: -1,
      agility: -1,
      vigor: -1,
      intellect: -1,
      presence: -1,
    };
    
    expect(() => getClassPowerEffects([power], 25, negAttrs)).not.toThrow();
  });
});
