/**
 * Testes de Ordem de Aplicação de Efeitos - SUE Hardening
 * Ordem Paranormal RPG v1.3
 * 
 * Valida a ordenação determinística de efeitos de múltiplas fontes.
 */

import { describe, it, expect } from 'vitest';
import {
  EFFECT_APPLICATION_ORDER,
  EFFECT_PRIORITY_MAP,
  getEffectPriority,
  compareEffectSources,
  sortEffectsByPriority,
  groupEffectsBySource,
  getEffectCategory,
  getSourceBehavior,
  type OrderableEffect,
} from '../sue';
import type { EffectSource } from '../unified-effects-engine';

// ========================================
// HELPERS DE TESTE
// ========================================

/**
 * Cria um efeito ordenável de teste
 */
function createEffect(source: EffectSource, sourceId: string): OrderableEffect {
  return { source, sourceId };
}

// ========================================
// TESTES: ORDEM FIXA
// ========================================

describe('Ordem Fixa de Aplicação', () => {
  it('Deve ter todas as 10 fontes na ordem', () => {
    expect(EFFECT_APPLICATION_ORDER).toHaveLength(10);
  });
  
  it('Skill training deve ser processado primeiro', () => {
    expect(EFFECT_APPLICATION_ORDER[0]).toBe('skill_training');
    expect(getEffectPriority('skill_training')).toBe(1);
  });
  
  it('Condições devem ser processadas por último', () => {
    expect(EFFECT_APPLICATION_ORDER[9]).toBe('condition');
    expect(getEffectPriority('condition')).toBe(10);
  });
  
  it('Origem deve vir antes de poderes', () => {
    const originPriority = getEffectPriority('origin');
    const powerPriority = getEffectPriority('class_power');
    expect(originPriority).toBeLessThan(powerPriority);
  });
  
  it('Rituais devem vir antes de condições', () => {
    const ritualPriority = getEffectPriority('ritual');
    const conditionPriority = getEffectPriority('condition');
    expect(ritualPriority).toBeLessThan(conditionPriority);
  });
  
  it('Equipamento deve vir depois de poderes paranormais', () => {
    const equipPriority = getEffectPriority('equipment');
    const paranormalPriority = getEffectPriority('paranormal_power');
    expect(equipPriority).toBeGreaterThan(paranormalPriority);
  });
});

// ========================================
// TESTES: COMPARAÇÃO DE FONTES
// ========================================

describe('Comparação de Fontes', () => {
  it('Deve retornar negativo quando primeira fonte tem menor prioridade', () => {
    const result = compareEffectSources('origin', 'condition');
    expect(result).toBeLessThan(0);
  });
  
  it('Deve retornar positivo quando primeira fonte tem maior prioridade', () => {
    const result = compareEffectSources('ritual', 'origin');
    expect(result).toBeGreaterThan(0);
  });
  
  it('Deve retornar zero para mesma fonte', () => {
    const result = compareEffectSources('track', 'track');
    expect(result).toBe(0);
  });
});

// ========================================
// TESTES: ORDENAÇÃO DE EFEITOS
// ========================================

describe('Ordenação de Efeitos', () => {
  it('Deve ordenar efeitos pela ordem fixa', () => {
    const effects: OrderableEffect[] = [
      createEffect('condition', 'cego'),
      createEffect('origin', 'mercenario'),
      createEffect('ritual', 'forca'),
      createEffect('class_power', 'ataque-especial'),
      createEffect('skill_training', 'atletismo'),
    ];
    
    const sorted = sortEffectsByPriority(effects);
    
    expect(sorted[0].source).toBe('skill_training');
    expect(sorted[1].source).toBe('origin');
    expect(sorted[2].source).toBe('class_power');
    expect(sorted[3].source).toBe('ritual');
    expect(sorted[4].source).toBe('condition');
  });
  
  it('Deve manter ordem alfabética por sourceId para mesma fonte', () => {
    const effects: OrderableEffect[] = [
      createEffect('class_power', 'zumbificar'),
      createEffect('class_power', 'ataque-especial'),
      createEffect('class_power', 'defesa-ativa'),
    ];
    
    const sorted = sortEffectsByPriority(effects);
    
    expect(sorted[0].sourceId).toBe('ataque-especial');
    expect(sorted[1].sourceId).toBe('defesa-ativa');
    expect(sorted[2].sourceId).toBe('zumbificar');
  });
  
  it('Deve respeitar prioridade customizada dentro da mesma fonte', () => {
    const effects: OrderableEffect[] = [
      { source: 'track', sourceId: 'habilidade-2', priority: 2 },
      { source: 'track', sourceId: 'habilidade-1', priority: 1 },
      { source: 'track', sourceId: 'habilidade-3', priority: 3 },
    ];
    
    const sorted = sortEffectsByPriority(effects);
    
    expect(sorted[0].sourceId).toBe('habilidade-1');
    expect(sorted[1].sourceId).toBe('habilidade-2');
    expect(sorted[2].sourceId).toBe('habilidade-3');
  });
  
  it('Não deve modificar o array original', () => {
    const effects: OrderableEffect[] = [
      createEffect('ritual', 'forca'),
      createEffect('origin', 'mercenario'),
    ];
    
    const sorted = sortEffectsByPriority(effects);
    
    expect(effects[0].source).toBe('ritual');
    expect(sorted[0].source).toBe('origin');
  });
});

// ========================================
// TESTES: AGRUPAMENTO DE EFEITOS
// ========================================

describe('Agrupamento de Efeitos', () => {
  it('Deve agrupar efeitos por fonte mantendo ordem', () => {
    const effects: OrderableEffect[] = [
      createEffect('condition', 'cego'),
      createEffect('origin', 'mercenario'),
      createEffect('condition', 'atordoado'),
      createEffect('origin', 'atleta'),
    ];
    
    const grouped = groupEffectsBySource(effects);
    
    // Verifica que grupos estão na ordem correta
    const keys = Array.from(grouped.keys());
    expect(keys[0]).toBe('origin');
    expect(keys[1]).toBe('condition');
    
    // Verifica conteúdo dos grupos
    expect(grouped.get('origin')).toHaveLength(2);
    expect(grouped.get('condition')).toHaveLength(2);
  });
  
  it('Deve remover grupos vazios', () => {
    const effects: OrderableEffect[] = [
      createEffect('origin', 'mercenario'),
      createEffect('ritual', 'forca'),
    ];
    
    const grouped = groupEffectsBySource(effects);
    
    expect(grouped.has('class_power')).toBe(false);
    expect(grouped.has('equipment')).toBe(false);
    expect(grouped.size).toBe(2);
  });
});

// ========================================
// TESTES: CATEGORIAS DE EFEITOS
// ========================================

describe('Categorias de Efeitos', () => {
  it('Origens devem ser permanentes', () => {
    expect(getEffectCategory('origin')).toBe('permanent');
  });
  
  it('Poderes devem ser ativos', () => {
    expect(getEffectCategory('class_power')).toBe('active');
    expect(getEffectCategory('general_power')).toBe('active');
    expect(getEffectCategory('paranormal_power')).toBe('active');
  });
  
  it('Rituais devem ser temporários', () => {
    expect(getEffectCategory('ritual')).toBe('temporary');
  });
  
  it('Condições devem ser debuffs', () => {
    expect(getEffectCategory('condition')).toBe('debuff');
  });
  
  it('Equipamento deve ter categoria própria', () => {
    expect(getEffectCategory('equipment')).toBe('equipment');
  });
});

// ========================================
// TESTES: FLAGS DE COMPORTAMENTO
// ========================================

describe('Flags de Comportamento', () => {
  it('Rituais não devem acumular consigo mesmos', () => {
    const behavior = getSourceBehavior('ritual');
    expect(behavior.stacksWithSelf).toBe(false);
    expect(behavior.overridesSameType).toBe(true);
  });
  
  it('Poderes de classe devem acumular consigo mesmos', () => {
    const behavior = getSourceBehavior('class_power');
    expect(behavior.stacksWithSelf).toBe(true);
    expect(behavior.overridesSameType).toBe(false);
  });
  
  it('Condições não podem ser toggladas', () => {
    const behavior = getSourceBehavior('condition');
    expect(behavior.canBeToggled).toBe(false);
  });
  
  it('Equipamento pode ter penalidades', () => {
    const behavior = getSourceBehavior('equipment');
    expect(behavior.canApplyPenalties).toBe(true);
  });
  
  it('Skill training é sempre ativo', () => {
    const behavior = getSourceBehavior('skill_training');
    expect(behavior.canBeToggled).toBe(false);
    expect(behavior.isContextual).toBe(false);
  });
});

// ========================================
// TESTES: PRIORIDADE MAP
// ========================================

describe('Mapa de Prioridade', () => {
  it('Deve ter entrada para todas as fontes', () => {
    const sources: EffectSource[] = [
      'skill_training', 'origin', 'class_ability', 'class_power',
      'track', 'general_power', 'paranormal_power', 'equipment',
      'ritual', 'condition',
    ];
    
    for (const source of sources) {
      expect(EFFECT_PRIORITY_MAP[source]).toBeDefined();
    }
  });
  
  it('Prioridades devem ser únicas', () => {
    const priorities = Object.values(EFFECT_PRIORITY_MAP);
    const uniquePriorities = new Set(priorities);
    expect(uniquePriorities.size).toBe(priorities.length);
  });
  
  it('Prioridades devem ser sequenciais de 1 a 10', () => {
    const priorities = Object.values(EFFECT_PRIORITY_MAP).sort((a, b) => a - b);
    expect(priorities).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });
});

// ========================================
// TESTES: CASOS DE BORDA
// ========================================

describe('Casos de Borda', () => {
  it('Deve lidar com lista vazia', () => {
    const sorted = sortEffectsByPriority([]);
    expect(sorted).toEqual([]);
    
    const grouped = groupEffectsBySource([]);
    expect(grouped.size).toBe(0);
  });
  
  it('Deve lidar com um único efeito', () => {
    const effects: OrderableEffect[] = [createEffect('origin', 'test')];
    
    const sorted = sortEffectsByPriority(effects);
    expect(sorted).toHaveLength(1);
    expect(sorted[0].source).toBe('origin');
  });
  
  it('Deve lidar com todos os efeitos da mesma fonte', () => {
    const effects: OrderableEffect[] = [
      createEffect('condition', 'agarrado'),
      createEffect('condition', 'cego'),
      createEffect('condition', 'atordoado'),
    ];
    
    const sorted = sortEffectsByPriority(effects);
    expect(sorted).toHaveLength(3);
    // Ordem alfabética por sourceId
    expect(sorted[0].sourceId).toBe('agarrado');
    expect(sorted[1].sourceId).toBe('atordoado');
    expect(sorted[2].sourceId).toBe('cego');
  });
});
