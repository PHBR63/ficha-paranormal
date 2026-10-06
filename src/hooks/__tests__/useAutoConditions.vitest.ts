// =====================================================
// Testes Vitest - Hook useAutoConditions
// Ordem Paranormal RPG v1.3
// =====================================================
//
// Testes unitários para as funções do game-engine usadas pelo hook
// Nota: Hooks React precisam de @testing-library/react-hooks para testes completos
// Este arquivo testa as funções core importadas pelo hook
//

import { describe, it, expect } from 'vitest';
import {
  checkAutoConditions,
  processDyingCounter,
  reduceDyingCounterFromDamage,
  stabilizeDyingCharacter,
  type AutoConditionResult,
  type DyingResult,
} from '@/lib/game-engine';

// =====================================================
// APLICAÇÃO AUTOMÁTICA DE CONDIÇÕES
// =====================================================

describe('checkAutoConditions', () => {
  describe('Condições de HP', () => {
    it('deve adicionar Inconsciente quando HP = 0', () => {
      const result = checkAutoConditions(0, 20, 30, 30, []);
      
      expect(result.conditionsToAdd).toContain('inconsciente');
      expect(result.messages.some(m => m.includes('inconsciente'))).toBe(true);
    });

    it('deve adicionar Morrendo quando HP < 0', () => {
      const result = checkAutoConditions(-5, 20, 30, 30, []);
      
      expect(result.conditionsToAdd).toContain('morrendo');
      expect(result.dyingCounter).toBe(3);
      expect(result.messages.some(m => m.includes('MORRENDO'))).toBe(true);
    });

    it('deve adicionar Inconsciente junto com Morrendo se não existir', () => {
      const result = checkAutoConditions(-5, 20, 30, 30, []);
      
      expect(result.conditionsToAdd).toContain('morrendo');
      expect(result.conditionsToAdd).toContain('inconsciente');
    });

    it('não deve duplicar Inconsciente se já existir', () => {
      const result = checkAutoConditions(-5, 20, 30, 30, ['inconsciente']);
      
      expect(result.conditionsToAdd).toContain('morrendo');
      expect(result.conditionsToAdd).not.toContain('inconsciente');
    });

    it('deve remover Inconsciente quando HP > 0', () => {
      const result = checkAutoConditions(5, 20, 30, 30, ['inconsciente']);
      
      expect(result.conditionsToRemove).toContain('inconsciente');
      expect(result.messages.some(m => m.includes('consciência'))).toBe(true);
    });

    it('cura de PV não estabiliza Morrendo automaticamente', () => {
      const result = checkAutoConditions(5, 20, 30, 30, ['morrendo', 'inconsciente']);
      
      expect(result.conditionsToRemove).not.toContain('morrendo');
      expect(result.conditionsToRemove).toContain('inconsciente');
    });

    it('não deve alterar condições com HP normal', () => {
      const result = checkAutoConditions(15, 20, 30, 30, []);
      
      expect(result.conditionsToAdd).toEqual([]);
      expect(result.conditionsToRemove).toEqual([]);
    });
  });

  describe('Condições de Sanidade', () => {
    it('deve adicionar Enlouquecendo quando SAN = 0', () => {
      const result = checkAutoConditions(20, 20, 0, 30, []);
      
      expect(result.conditionsToAdd).toContain('enlouquecendo');
      expect(result.messages.some(m => m.includes('enlouquecendo'))).toBe(true);
    });

    it('deve remover Enlouquecendo quando SAN > 0', () => {
      const result = checkAutoConditions(20, 20, 5, 30, ['enlouquecendo']);
      
      expect(result.conditionsToRemove).toContain('enlouquecendo');
    });

    it('deve adicionar Perturbado quando SAN abaixo da metade', () => {
      // 30% de 30 = 9
      const result = checkAutoConditions(20, 20, 9, 30, []);
      
      expect(result.conditionsToAdd).toContain('perturbado');
      expect(result.messages.some(m => m.includes('metade'))).toBe(true);
    });

    it('não deve adicionar Perturbado se SAN = 0 (prefere Enlouquecendo)', () => {
      const result = checkAutoConditions(20, 20, 0, 30, []);
      
      expect(result.conditionsToAdd).toContain('enlouquecendo');
      expect(result.conditionsToAdd).not.toContain('perturbado');
    });

    it('cura que encerra Enlouquecendo indica Perturbado se SAN ainda está abaixo da metade', () => {
      const result = checkAutoConditions(20, 20, 5, 30, ['enlouquecendo']);
      
      expect(result.conditionsToAdd).toContain('perturbado');
    });

    it('deve remover Perturbado quando SAN >= metade', () => {
      // 30% de 30 = 9, então 10 está acima
      const result = checkAutoConditions(20, 20, 15, 30, ['perturbado']);
      
      expect(result.conditionsToRemove).toContain('perturbado');
    });
  });

  describe('Combinações de HP e SAN', () => {
    it('deve processar HP e SAN simultaneamente', () => {
      const result = checkAutoConditions(-5, 20, 0, 30, []);
      
      expect(result.conditionsToAdd).toContain('morrendo');
      expect(result.conditionsToAdd).toContain('inconsciente');
      expect(result.conditionsToAdd).toContain('enlouquecendo');
    });

    it('deve retornar array vazio quando tudo está normal', () => {
      const result = checkAutoConditions(20, 20, 30, 30, []);
      
      expect(result.conditionsToAdd).toEqual([]);
      expect(result.conditionsToRemove).toEqual([]);
      expect(result.messages).toEqual([]);
    });
  });
});

// =====================================================
// SISTEMA DE MORRENDO
// =====================================================

describe('processDyingCounter', () => {
  it('deve reduzir contador de 3 para 2', () => {
    const result = processDyingCounter(3);
    
    expect(result.newCounter).toBe(2);
    expect(result.isDead).toBe(false);
    expect(result.message).toContain('2');
  });

  it('deve reduzir contador de 2 para 1', () => {
    const result = processDyingCounter(2);
    
    expect(result.newCounter).toBe(1);
    expect(result.isDead).toBe(false);
    expect(result.message).toContain('1');
  });

  it('deve resultar em morte quando contador chega a 0', () => {
    const result = processDyingCounter(1);
    
    expect(result.newCounter).toBe(0);
    expect(result.isDead).toBe(true);
    expect(result.message).toContain('MORTE');
  });

  it('deve manter contador em 0 se já for 0', () => {
    const result = processDyingCounter(0);
    
    expect(result.newCounter).toBe(0);
    expect(result.isDead).toBe(true);
  });
});

describe('reduceDyingCounterFromDamage', () => {
  it('dano recebido não conta como início de turno morrendo', () => {
    const result = reduceDyingCounterFromDamage(3, 5);
    
    expect(result.newCounter).toBe(3);
    expect(result.isDead).toBe(false);
    expect(result.message).toContain('Dano enquanto morrendo');
  });

  it('dano não antecipa a morte quando resta um início de turno', () => {
    const result = reduceDyingCounterFromDamage(1, 10);
    
    expect(result.newCounter).toBe(1);
    expect(result.isDead).toBe(false);
    expect(result.message).toContain('não avança');
  });

  it('não deve reduzir contador sem dano', () => {
    const result = reduceDyingCounterFromDamage(3, 0);
    
    expect(result.newCounter).toBe(3);
    expect(result.isDead).toBe(false);
    expect(result.message).toBe('');
  });

  it('não deve reduzir contador com dano negativo', () => {
    const result = reduceDyingCounterFromDamage(3, -5);
    
    expect(result.newCounter).toBe(3);
    expect(result.isDead).toBe(false);
  });
});

describe('stabilizeDyingCharacter', () => {
  it('deve estabilizar personagem com HP 0', () => {
    const result = stabilizeDyingCharacter();
    
    expect(result.newHP).toBe(0);
    expect(result.message).toContain('estabilizado');
  });

  it('deve indicar que personagem permanece inconsciente', () => {
    const result = stabilizeDyingCharacter();
    
    expect(result.message).toContain('inconsciente');
  });
});

// =====================================================
// LÓGICA DE PROCESSAMENTO (simulação do hook)
// =====================================================

describe('Lógica de Processamento de Condições', () => {
  // Simula a lógica do hook sem usar React
  function processResourceChangeMock(
    hp: number,
    hpMax: number,
    san: number,
    sanMax: number,
    currentConditions: Array<{ id: string; name: string; dyingCounter?: number }>
  ) {
    const conditionIds = currentConditions.map(c => c.id);
    const result = checkAutoConditions(hp, hpMax, san, sanMax, conditionIds);
    
    let newConditions = [...currentConditions];
    
    // Remove condições
    if (result.conditionsToRemove.length > 0) {
      newConditions = newConditions.filter(c => !result.conditionsToRemove.includes(c.id));
    }
    
    // Adiciona novas condições
    for (const conditionId of result.conditionsToAdd) {
      if (!newConditions.some(c => c.id === conditionId)) {
        const newCondition: { id: string; name: string; dyingCounter?: number } = {
          id: conditionId,
          name: conditionId.charAt(0).toUpperCase() + conditionId.slice(1),
        };
        
        if (conditionId === 'morrendo' && result.dyingCounter !== undefined) {
          newCondition.dyingCounter = result.dyingCounter;
        }
        
        newConditions.push(newCondition);
      }
    }
    
    return {
      newConditions,
      messages: result.messages,
      dyingCounter: result.dyingCounter,
    };
  }

  it('deve processar transição de saudável para morrendo', () => {
    const result = processResourceChangeMock(
      -5, 20, 30, 30,
      []
    );
    
    expect(result.newConditions.some(c => c.id === 'morrendo')).toBe(true);
    expect(result.newConditions.some(c => c.id === 'inconsciente')).toBe(true);
    
    const morrendo = result.newConditions.find(c => c.id === 'morrendo');
    expect(morrendo?.dyingCounter).toBe(3);
  });

  it('deve processar recuperação de morrendo', () => {
    const result = processResourceChangeMock(
      5, 20, 30, 30,
      [
        { id: 'morrendo', name: 'Morrendo', dyingCounter: 2 },
        { id: 'inconsciente', name: 'Inconsciente' },
      ]
    );
    
    expect(result.newConditions.some(c => c.id === 'morrendo')).toBe(true);
    expect(result.newConditions.some(c => c.id === 'inconsciente')).toBe(false);
  });

  it('deve processar transição para perturbado', () => {
    const result = processResourceChangeMock(
      20, 20, 8, 30, // SAN 8 < 30% de 30 (9)
      []
    );
    
    expect(result.newConditions.some(c => c.id === 'perturbado')).toBe(true);
  });

  it('deve manter condições existentes não afetadas', () => {
    const result = processResourceChangeMock(
      10, 20, 20, 30,
      [
        { id: 'cego', name: 'Cego' },
        { id: 'envenenado', name: 'Envenenado' },
      ]
    );
    
    expect(result.newConditions.some(c => c.id === 'cego')).toBe(true);
    expect(result.newConditions.some(c => c.id === 'envenenado')).toBe(true);
  });
});

// =====================================================
// PROCESSAMENTO DE TURNO MORRENDO
// =====================================================

describe('Processamento de Turno Morrendo', () => {
  // Simula lógica do hook processDyingTurn
  function processDyingTurnMock(
    currentConditions: Array<{ id: string; name: string; dyingCounter?: number }>
  ) {
    const morrendoCondition = currentConditions.find(c => c.id === 'morrendo');
    
    if (!morrendoCondition || morrendoCondition.dyingCounter === undefined) {
      return {
        newConditions: currentConditions,
        messages: [],
        isDead: false,
      };
    }
    
    const result = processDyingCounter(morrendoCondition.dyingCounter);
    
    if (result.isDead) {
      return {
        newConditions: currentConditions,
        messages: [result.message],
        isDead: true,
      };
    }
    
    const newConditions = currentConditions.map(c => {
      if (c.id === 'morrendo') {
        return { ...c, dyingCounter: result.newCounter };
      }
      return c;
    });
    
    return {
      newConditions,
      messages: [result.message],
      isDead: false,
    };
  }

  it('deve reduzir contador de morrendo a cada turno', () => {
    const result = processDyingTurnMock([
      { id: 'morrendo', name: 'Morrendo', dyingCounter: 3 },
      { id: 'inconsciente', name: 'Inconsciente' },
    ]);
    
    const morrendo = result.newConditions.find(c => c.id === 'morrendo');
    expect(morrendo?.dyingCounter).toBe(2);
    expect(result.isDead).toBe(false);
  });

  it('deve indicar morte quando contador chega a 0', () => {
    const result = processDyingTurnMock([
      { id: 'morrendo', name: 'Morrendo', dyingCounter: 1 },
    ]);
    
    expect(result.isDead).toBe(true);
    expect(result.messages.some(m => m.includes('MORTE'))).toBe(true);
  });

  it('não deve fazer nada sem condição morrendo', () => {
    const result = processDyingTurnMock([
      { id: 'inconsciente', name: 'Inconsciente' },
    ]);
    
    expect(result.messages).toEqual([]);
    expect(result.isDead).toBe(false);
  });
});

// =====================================================
// ESTABILIZAÇÃO
// =====================================================

describe('Estabilização de Personagem', () => {
  // Simula lógica do hook stabilizeCharacter
  function stabilizeCharacterMock(
    currentConditions: Array<{ id: string; name: string; dyingCounter?: number }>
  ) {
    const result = stabilizeDyingCharacter();
    
    // Remove morrendo, mantém inconsciente
    let newConditions = currentConditions.filter(c => c.id !== 'morrendo');
    
    // Garante que inconsciente está presente
    if (!newConditions.some(c => c.id === 'inconsciente')) {
      newConditions.push({
        id: 'inconsciente',
        name: 'Inconsciente',
      });
    }
    
    return {
      newConditions,
      newHP: result.newHP,
      message: result.message,
    };
  }

  it('deve remover condição morrendo', () => {
    const result = stabilizeCharacterMock([
      { id: 'morrendo', name: 'Morrendo', dyingCounter: 2 },
      { id: 'inconsciente', name: 'Inconsciente' },
    ]);
    
    expect(result.newConditions.some(c => c.id === 'morrendo')).toBe(false);
  });

  it('deve manter condição inconsciente', () => {
    const result = stabilizeCharacterMock([
      { id: 'morrendo', name: 'Morrendo', dyingCounter: 2 },
      { id: 'inconsciente', name: 'Inconsciente' },
    ]);
    
    expect(result.newConditions.some(c => c.id === 'inconsciente')).toBe(true);
  });

  it('deve adicionar inconsciente se não existir', () => {
    const result = stabilizeCharacterMock([
      { id: 'morrendo', name: 'Morrendo', dyingCounter: 2 },
    ]);
    
    expect(result.newConditions.some(c => c.id === 'inconsciente')).toBe(true);
  });

  it('deve definir HP como 0', () => {
    const result = stabilizeCharacterMock([
      { id: 'morrendo', name: 'Morrendo', dyingCounter: 2 },
    ]);
    
    expect(result.newHP).toBe(0);
  });
});
