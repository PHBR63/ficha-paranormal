/**
 * Testes para Regras de Acúmulo de Condições
 * Ordem Paranormal RPG v1.3
 * 
 * Valida as regras de stacking, especialmente a exceção do Envenenado (PDF p.321)
 * onde dano recorrente de múltiplas fontes sempre acumula.
 */

import { describe, it, expect } from 'vitest';
import {
  getStackingConfig,
  canStack,
  applyConditionStacking,
  calculateAccumulatedDamage,
  removeConditionInstance,
  formatStackedConditionDescription,
  type ActiveConditionInstance,
} from '../conditions/condition-stacking';

// ========================================
// TESTES: CONFIGURAÇÕES DE STACKING
// ========================================

describe('Configurações de Stacking', () => {
  describe('getStackingConfig', () => {
    it('deve retornar no_stack para condições normais', () => {
      expect(getStackingConfig('agarrado').rule).toBe('no_stack');
      expect(getStackingConfig('atordoado').rule).toBe('no_stack');
      expect(getStackingConfig('cego').rule).toBe('no_stack');
    });

    it('deve retornar accumulate para envenenado', () => {
      const config = getStackingConfig('envenenado');
      expect(config.rule).toBe('accumulate');
      expect(config.stackProperty).toBe('damagePerTurn');
    });

    it('deve retornar accumulate para sangrando', () => {
      const config = getStackingConfig('sangrando');
      expect(config.rule).toBe('accumulate');
      expect(config.stackProperty).toBe('damagePerTurn');
    });

    it('deve retornar no_stack como padrão para condições desconhecidas', () => {
      const config = getStackingConfig('condicao-inexistente');
      expect(config.rule).toBe('no_stack');
    });
  });

  describe('canStack', () => {
    it('deve retornar true para condições que acumulam', () => {
      expect(canStack('envenenado')).toBe(true);
      expect(canStack('sangrando')).toBe(true);
      expect(canStack('fragilizado')).toBe(true);
      expect(canStack('machucado')).toBe(true);
    });

    it('deve retornar false para condições que não acumulam', () => {
      expect(canStack('agarrado')).toBe(false);
      expect(canStack('atordoado')).toBe(false);
      expect(canStack('cego')).toBe(false);
    });
  });
});

// ========================================
// TESTES: ENVENENADO ACUMULANDO (PDF p.321)
// ========================================

describe('Condição Envenenado (PDF p.321)', () => {
  it('dano recorrente deve acumular de múltiplas fontes', () => {
    const existing: ActiveConditionInstance[] = [
      {
        conditionId: 'envenenado',
        sourceId: 'veneno-aranha-1',
        sourceName: 'Veneno de Aranha',
        stacks: 1,
        damagePerTurn: '1d6',
        appliedAt: Date.now(),
      },
    ];

    const newInstance: ActiveConditionInstance = {
      conditionId: 'envenenado',
      sourceId: 'veneno-cobra-1',
      sourceName: 'Veneno de Cobra',
      stacks: 1,
      damagePerTurn: '1d6',
      appliedAt: Date.now(),
    };

    const result = applyConditionStacking(existing, newInstance);

    // Deve ter 2 instâncias (2 fontes diferentes)
    expect(result.filter(i => i.conditionId === 'envenenado').length).toBe(2);
  });

  it('pilha de 3 envenenados 1d6 = 3d6 por turno', () => {
    const instances: ActiveConditionInstance[] = [
      {
        conditionId: 'envenenado',
        sourceId: 'veneno-1',
        sourceName: 'Veneno 1',
        stacks: 1,
        damagePerTurn: '1d6',
        appliedAt: Date.now(),
      },
      {
        conditionId: 'envenenado',
        sourceId: 'veneno-2',
        sourceName: 'Veneno 2',
        stacks: 1,
        damagePerTurn: '1d6',
        appliedAt: Date.now(),
      },
      {
        conditionId: 'envenenado',
        sourceId: 'veneno-3',
        sourceName: 'Veneno 3',
        stacks: 1,
        damagePerTurn: '1d6',
        appliedAt: Date.now(),
      },
    ];

    const damage = calculateAccumulatedDamage('envenenado', instances);

    expect(damage.formula).toBe('3d6');
    expect(damage.diceCount).toBe(3);
    expect(damage.diceType).toBe(6);
    expect(damage.sources.length).toBe(3);
  });

  it('diferentes tipos de dado devem ser combinados', () => {
    const instances: ActiveConditionInstance[] = [
      {
        conditionId: 'envenenado',
        sourceId: 'veneno-fraco',
        sourceName: 'Veneno Fraco',
        stacks: 1,
        damagePerTurn: '1d4',
        appliedAt: Date.now(),
      },
      {
        conditionId: 'envenenado',
        sourceId: 'veneno-forte',
        sourceName: 'Veneno Forte',
        stacks: 1,
        damagePerTurn: '2d6',
        appliedAt: Date.now(),
      },
    ];

    const damage = calculateAccumulatedDamage('envenenado', instances);

    // Fórmula deve incluir ambos os tipos
    expect(damage.formula).toContain('d4');
    expect(damage.formula).toContain('d6');
  });

  it('mesma fonte não deve acumular, apenas atualizar duração', () => {
    const existing: ActiveConditionInstance[] = [
      {
        conditionId: 'envenenado',
        sourceId: 'veneno-aranha-1',
        sourceName: 'Veneno de Aranha',
        stacks: 1,
        damagePerTurn: '1d6',
        duration: 3,
        appliedAt: Date.now() - 10000,
      },
    ];

    const newInstance: ActiveConditionInstance = {
      conditionId: 'envenenado',
      sourceId: 'veneno-aranha-1', // MESMA fonte
      sourceName: 'Veneno de Aranha',
      stacks: 1,
      damagePerTurn: '1d6',
      duration: 5, // Nova duração
      appliedAt: Date.now(),
    };

    const result = applyConditionStacking(existing, newInstance);

    // Deve ter apenas 1 instância (atualizada)
    expect(result.filter(i => i.conditionId === 'envenenado').length).toBe(1);
    // Duração deve ser atualizada
    expect(result[0].duration).toBe(5);
  });

  it('deve respeitar limite máximo de pilhas', () => {
    // Cria 10 venenos (limite máximo)
    const existing: ActiveConditionInstance[] = Array.from({ length: 10 }, (_, i) => ({
      conditionId: 'envenenado',
      sourceId: `veneno-${i}`,
      sourceName: `Veneno ${i}`,
      stacks: 1,
      damagePerTurn: '1d6',
      appliedAt: Date.now(),
    }));

    const newInstance: ActiveConditionInstance = {
      conditionId: 'envenenado',
      sourceId: 'veneno-11', // 11º veneno
      sourceName: 'Veneno Extra',
      stacks: 1,
      damagePerTurn: '1d6',
      appliedAt: Date.now(),
    };

    const result = applyConditionStacking(existing, newInstance);

    // Deve manter no máximo 10
    expect(result.filter(i => i.conditionId === 'envenenado').length).toBe(10);
  });
});

// ========================================
// TESTES: CONDIÇÕES QUE NÃO ACUMULAM
// ========================================

describe('Condições que Não Acumulam', () => {
  it('no_stack deve ignorar aplicações adicionais', () => {
    const existing: ActiveConditionInstance[] = [
      {
        conditionId: 'agarrado',
        sourceId: 'zumbi-1',
        sourceName: 'Zumbi',
        stacks: 1,
        appliedAt: Date.now(),
      },
    ];

    const newInstance: ActiveConditionInstance = {
      conditionId: 'agarrado',
      sourceId: 'zumbi-2',
      sourceName: 'Outro Zumbi',
      stacks: 1,
      appliedAt: Date.now(),
    };

    const result = applyConditionStacking(existing, newInstance);

    // Deve manter apenas 1
    expect(result.filter(i => i.conditionId === 'agarrado').length).toBe(1);
    // Deve ser o original
    expect(result[0].sourceId).toBe('zumbi-1');
  });

  it('refresh deve atualizar duração sem acumular', () => {
    const existing: ActiveConditionInstance[] = [
      {
        conditionId: 'apavorado',
        sourceId: 'ritual-1',
        sourceName: 'Amedrontar',
        stacks: 1,
        duration: 2,
        appliedAt: Date.now() - 10000,
      },
    ];

    const newInstance: ActiveConditionInstance = {
      conditionId: 'apavorado',
      sourceId: 'ritual-2',
      sourceName: 'Outro Medo',
      stacks: 1,
      duration: 5,
      appliedAt: Date.now(),
    };

    const result = applyConditionStacking(existing, newInstance);

    // Deve ter apenas 1
    expect(result.filter(i => i.conditionId === 'apavorado').length).toBe(1);
    // Duração atualizada
    expect(result[0].duration).toBe(5);
  });
});

// ========================================
// TESTES: REMOÇÃO DE CONDIÇÕES
// ========================================

describe('Remoção de Condições', () => {
  it('deve remover instância específica por sourceId', () => {
    const instances: ActiveConditionInstance[] = [
      {
        conditionId: 'envenenado',
        sourceId: 'veneno-1',
        sourceName: 'Veneno 1',
        stacks: 1,
        damagePerTurn: '1d6',
        appliedAt: Date.now(),
      },
      {
        conditionId: 'envenenado',
        sourceId: 'veneno-2',
        sourceName: 'Veneno 2',
        stacks: 1,
        damagePerTurn: '1d6',
        appliedAt: Date.now(),
      },
    ];

    const result = removeConditionInstance(instances, 'envenenado', 'veneno-1');

    expect(result.length).toBe(1);
    expect(result[0].sourceId).toBe('veneno-2');
  });

  it('deve remover todas as instâncias se sourceId não fornecido', () => {
    const instances: ActiveConditionInstance[] = [
      {
        conditionId: 'envenenado',
        sourceId: 'veneno-1',
        sourceName: 'Veneno 1',
        stacks: 1,
        damagePerTurn: '1d6',
        appliedAt: Date.now(),
      },
      {
        conditionId: 'envenenado',
        sourceId: 'veneno-2',
        sourceName: 'Veneno 2',
        stacks: 1,
        damagePerTurn: '1d6',
        appliedAt: Date.now(),
      },
      {
        conditionId: 'agarrado',
        sourceId: 'zumbi-1',
        sourceName: 'Zumbi',
        stacks: 1,
        appliedAt: Date.now(),
      },
    ];

    const result = removeConditionInstance(instances, 'envenenado');

    expect(result.length).toBe(1);
    expect(result[0].conditionId).toBe('agarrado');
  });
});

// ========================================
// TESTES: FORMATAÇÃO
// ========================================

describe('Formatação de Descrição', () => {
  it('deve formatar única instância', () => {
    const instances: ActiveConditionInstance[] = [
      {
        conditionId: 'envenenado',
        sourceId: 'veneno-aranha',
        sourceName: 'Veneno de Aranha',
        stacks: 1,
        damagePerTurn: '1d6',
        appliedAt: Date.now(),
      },
    ];

    const desc = formatStackedConditionDescription('envenenado', instances);

    expect(desc).toContain('1d6');
    expect(desc).toContain('Veneno de Aranha');
  });

  it('deve formatar múltiplas fontes', () => {
    const instances: ActiveConditionInstance[] = [
      {
        conditionId: 'envenenado',
        sourceId: 'veneno-1',
        sourceName: 'Veneno 1',
        stacks: 1,
        damagePerTurn: '1d6',
        appliedAt: Date.now(),
      },
      {
        conditionId: 'envenenado',
        sourceId: 'veneno-2',
        sourceName: 'Veneno 2',
        stacks: 1,
        damagePerTurn: '1d6',
        appliedAt: Date.now(),
      },
    ];

    const desc = formatStackedConditionDescription('envenenado', instances);

    expect(desc).toContain('2d6');
    expect(desc).toContain('2 fontes');
  });

  it('deve retornar string vazia para condição ausente', () => {
    const desc = formatStackedConditionDescription('envenenado', []);
    expect(desc).toBe('');
  });
});
