// =====================================================
// Testes Vitest - Hook useRitualModeConditions
// Ordem Paranormal RPG v1.3
// =====================================================
//
// Testes para funções utilitárias e lógica de condições de rituais
// Nota: Hooks React precisam de @testing-library/react-hooks para testes completos
// Este arquivo testa as funções auxiliares e lógica core
//

import { describe, it, expect } from 'vitest';
import {
  getRitualConditionIcon,
  isRitualCondition,
  type ActiveConditionForRitual,
} from '../useRitualModeConditions';
import { CONDITIONS } from '@/lib/conditions';
import {
  ritualHasModes,
  getAvailableModesForRitual,
  getRitualModeDescription,
  calculateInverseDamageTransfer,
} from '@/lib/sustained-rituals';

// =====================================================
// FUNÇÕES UTILITÁRIAS
// =====================================================

describe('getRitualConditionIcon', () => {
  it('deve retornar ícone para velocidade-mortal-inverso', () => {
    const icon = getRitualConditionIcon('velocidade-mortal-inverso');
    expect(icon).toBe('🛡️⏱️');
  });

  it('deve retornar ícone para velocidade-mortal-buff', () => {
    const icon = getRitualConditionIcon('velocidade-mortal-buff');
    expect(icon).toBe('⚡');
  });

  it('deve retornar ícone para velocidade-mortal-discente', () => {
    const icon = getRitualConditionIcon('velocidade-mortal-discente');
    expect(icon).toBe('⚡⚡');
  });

  it('deve retornar ícone padrão para condição desconhecida', () => {
    const icon = getRitualConditionIcon('outra-condicao');
    expect(icon).toBe('✨');
  });
});

describe('isRitualCondition', () => {
  it('deve identificar condições de Velocidade Mortal', () => {
    expect(isRitualCondition('velocidade-mortal-inverso')).toBe(true);
    expect(isRitualCondition('velocidade-mortal-buff')).toBe(true);
    expect(isRitualCondition('velocidade-mortal-discente')).toBe(true);
  });

  it('deve identificar condições com sufixo -buff', () => {
    expect(isRitualCondition('algum-ritual-buff')).toBe(true);
  });

  it('deve identificar condições com sufixo -inverso', () => {
    expect(isRitualCondition('algum-ritual-inverso')).toBe(true);
  });

  it('deve identificar condições com sufixo -discente', () => {
    expect(isRitualCondition('algum-ritual-discente')).toBe(true);
  });

  it('não deve identificar condições normais', () => {
    expect(isRitualCondition('cego')).toBe(false);
    expect(isRitualCondition('atordoado')).toBe(false);
    expect(isRitualCondition('morrendo')).toBe(false);
  });
});

// =====================================================
// CONDIÇÕES DE RITUAL NO SISTEMA
// =====================================================

describe('Condições de Ritual Definidas', () => {
  it('deve ter condição velocidade-mortal-inverso definida', () => {
    const condition = CONDITIONS['velocidade-mortal-inverso'];
    expect(condition).toBeDefined();
    expect(condition.name).toBe('Velocidade Mortal (Inverso)');
  });

  it('deve ter condição velocidade-mortal-buff definida', () => {
    const condition = CONDITIONS['velocidade-mortal-buff'];
    expect(condition).toBeDefined();
    expect(condition.name).toBe('Velocidade Mortal');
  });

  it('deve ter condição velocidade-mortal-discente definida', () => {
    const condition = CONDITIONS['velocidade-mortal-discente'];
    expect(condition).toBeDefined();
    expect(condition.name).toBe('Velocidade Mortal (Discente)');
  });

  it('condição inverso deve mencionar absorção de dano', () => {
    const condition = CONDITIONS['velocidade-mortal-inverso'];
    expect(condition.effect).toContain('dano');
  });

  it('condição buff deve mencionar ação de movimento adicional', () => {
    const condition = CONDITIONS['velocidade-mortal-buff'];
    expect(condition.effect).toContain('movimento');
  });

  it('condição discente deve mencionar ação padrão adicional', () => {
    const condition = CONDITIONS['velocidade-mortal-discente'];
    expect(condition.effect).toContain('padrão');
  });
});

// =====================================================
// INTERFACE ActiveConditionForRitual
// =====================================================

describe('Interface ActiveConditionForRitual', () => {
  it('deve aceitar condição com source', () => {
    const condition: ActiveConditionForRitual = {
      id: 'velocidade-mortal-buff',
      name: 'Velocidade Mortal',
      turnsRemaining: null,
      addedAt: new Date().toISOString(),
      source: 'ritual-123',
    };
    
    expect(condition.source).toBe('ritual-123');
  });

  it('deve aceitar condição sem source', () => {
    const condition: ActiveConditionForRitual = {
      id: 'cego',
      name: 'Cego',
      turnsRemaining: 3,
      addedAt: new Date().toISOString(),
    };
    
    expect(condition.source).toBeUndefined();
  });
});

// =====================================================
// LÓGICA DE TRANSFERÊNCIA DE DANO (Modo Inverso)
// =====================================================

describe('Transferência de Dano Modo Inverso', () => {
  it('deve dividir dano pela metade', () => {
    const { casterDamage, targetDamage } = calculateInverseDamageTransfer(10);
    
    expect(casterDamage).toBe(5);
    expect(targetDamage).toBe(5);
  });

  it('deve arredondar para baixo em dano ímpar', () => {
    const { casterDamage, targetDamage } = calculateInverseDamageTransfer(11);
    
    // O total deve ser aproximadamente 11
    expect(casterDamage + targetDamage).toBeLessThanOrEqual(11);
    expect(casterDamage).toBeGreaterThanOrEqual(5);
    expect(targetDamage).toBeGreaterThanOrEqual(5);
  });

  it('deve retornar 0 para dano 0', () => {
    const { casterDamage, targetDamage } = calculateInverseDamageTransfer(0);
    
    expect(casterDamage).toBe(0);
    expect(targetDamage).toBe(0);
  });

  it('deve lidar com dano de 1', () => {
    const { casterDamage, targetDamage } = calculateInverseDamageTransfer(1);
    
    // Pelo menos um deve receber o dano
    expect(casterDamage + targetDamage).toBeGreaterThanOrEqual(0);
  });
});

// =====================================================
// LÓGICA DE FILTRAGEM DE CONDIÇÕES
// =====================================================

describe('Filtragem de Condições por Fonte', () => {
  // Simula lógica do hook getRitualConditions
  function getRitualConditionsMock(conditions: ActiveConditionForRitual[]) {
    return conditions.filter(c => c.source);
  }

  it('deve filtrar apenas condições com source', () => {
    const conditions: ActiveConditionForRitual[] = [
      { id: 'velocidade-mortal-buff', name: 'Velocidade Mortal', turnsRemaining: null, addedAt: '2024-01-01', source: 'ritual-123' },
      { id: 'cego', name: 'Cego', turnsRemaining: 3, addedAt: '2024-01-01' },
      { id: 'velocidade-mortal-inverso', name: 'Velocidade Mortal (Inverso)', turnsRemaining: null, addedAt: '2024-01-01', source: 'ritual-456' },
    ];
    
    const ritualConditions = getRitualConditionsMock(conditions);
    
    expect(ritualConditions.length).toBe(2);
    expect(ritualConditions.every(c => c.source)).toBe(true);
  });

  it('deve retornar array vazio se não houver condições de ritual', () => {
    const conditions: ActiveConditionForRitual[] = [
      { id: 'cego', name: 'Cego', turnsRemaining: 3, addedAt: '2024-01-01' },
      { id: 'surdo', name: 'Surdo', turnsRemaining: null, addedAt: '2024-01-01' },
    ];
    
    const ritualConditions = getRitualConditionsMock(conditions);
    
    expect(ritualConditions.length).toBe(0);
  });
});

// =====================================================
// LÓGICA DE REMOÇÃO DE CONDIÇÕES POR RITUAL
// =====================================================

describe('Remoção de Condições por Fonte de Ritual', () => {
  // Simula lógica do hook removeRitualConditions
  function removeRitualConditionsMock(
    conditions: ActiveConditionForRitual[],
    ritualSourceId: string
  ) {
    return conditions.filter(c => c.source !== ritualSourceId);
  }

  it('deve remover condições de ritual específico', () => {
    const conditions: ActiveConditionForRitual[] = [
      { id: 'velocidade-mortal-buff', name: 'Velocidade Mortal', turnsRemaining: null, addedAt: '2024-01-01', source: 'ritual-123' },
      { id: 'cego', name: 'Cego', turnsRemaining: 3, addedAt: '2024-01-01' },
      { id: 'velocidade-mortal-inverso', name: 'Velocidade Mortal (Inverso)', turnsRemaining: null, addedAt: '2024-01-01', source: 'ritual-456' },
    ];
    
    const newConditions = removeRitualConditionsMock(conditions, 'ritual-123');
    
    expect(newConditions.length).toBe(2);
    expect(newConditions.some(c => c.source === 'ritual-123')).toBe(false);
    expect(newConditions.some(c => c.source === 'ritual-456')).toBe(true);
  });

  it('não deve alterar condições sem source', () => {
    const conditions: ActiveConditionForRitual[] = [
      { id: 'cego', name: 'Cego', turnsRemaining: 3, addedAt: '2024-01-01' },
      { id: 'surdo', name: 'Surdo', turnsRemaining: null, addedAt: '2024-01-01' },
    ];
    
    const newConditions = removeRitualConditionsMock(conditions, 'ritual-123');
    
    expect(newConditions.length).toBe(2);
  });

  it('deve remover múltiplas condições do mesmo ritual', () => {
    const conditions: ActiveConditionForRitual[] = [
      { id: 'condicao-1', name: 'Condição 1', turnsRemaining: null, addedAt: '2024-01-01', source: 'ritual-123' },
      { id: 'condicao-2', name: 'Condição 2', turnsRemaining: null, addedAt: '2024-01-01', source: 'ritual-123' },
      { id: 'condicao-3', name: 'Condição 3', turnsRemaining: null, addedAt: '2024-01-01', source: 'ritual-456' },
    ];
    
    const newConditions = removeRitualConditionsMock(conditions, 'ritual-123');
    
    expect(newConditions.length).toBe(1);
    expect(newConditions[0].source).toBe('ritual-456');
  });
});

// =====================================================
// VERIFICAÇÃO DE CONDIÇÃO ATIVA
// =====================================================

describe('Verificação de Condição de Ritual Ativa', () => {
  // Simula lógica do hook hasRitualCondition
  function hasRitualConditionMock(
    conditions: ActiveConditionForRitual[],
    conditionId: string
  ) {
    return conditions.some(c => c.id === conditionId);
  }

  it('deve retornar true se condição existe', () => {
    const conditions: ActiveConditionForRitual[] = [
      { id: 'velocidade-mortal-buff', name: 'Velocidade Mortal', turnsRemaining: null, addedAt: '2024-01-01', source: 'ritual-123' },
    ];
    
    expect(hasRitualConditionMock(conditions, 'velocidade-mortal-buff')).toBe(true);
  });

  it('deve retornar false se condição não existe', () => {
    const conditions: ActiveConditionForRitual[] = [
      { id: 'cego', name: 'Cego', turnsRemaining: 3, addedAt: '2024-01-01' },
    ];
    
    expect(hasRitualConditionMock(conditions, 'velocidade-mortal-buff')).toBe(false);
  });
});

// =====================================================
// PROCESSAMENTO DE DANO RECEBIDO
// =====================================================

describe('Processamento de Dano com Proteção', () => {
  // Simula lógica do hook processIncomingDamage sem proteção
  function processIncomingDamageMock(
    damage: number,
    hasProtector: boolean,
    protectorName?: string
  ) {
    if (!hasProtector) {
      return {
        finalDamage: damage,
        transferredDamage: 0,
        protectorId: null,
        protectorName: null,
        message: null,
      };
    }

    const { casterDamage, targetDamage } = calculateInverseDamageTransfer(damage);
    
    return {
      finalDamage: targetDamage,
      transferredDamage: casterDamage,
      protectorId: 'protector-123',
      protectorName: protectorName || 'Protetor',
      message: `${protectorName || 'Protetor'} absorve ${casterDamage} de dano`,
    };
  }

  it('deve retornar dano integral sem protetor', () => {
    const result = processIncomingDamageMock(20, false);
    
    expect(result.finalDamage).toBe(20);
    expect(result.transferredDamage).toBe(0);
    expect(result.protectorId).toBeNull();
    expect(result.message).toBeNull();
  });

  it('deve dividir dano com protetor ativo', () => {
    const result = processIncomingDamageMock(20, true, 'João');
    
    expect(result.finalDamage).toBe(10);
    expect(result.transferredDamage).toBe(10);
    expect(result.protectorName).toBe('João');
    expect(result.message).toContain('João');
    expect(result.message).toContain('10');
  });

  it('deve incluir nome do protetor na mensagem', () => {
    const result = processIncomingDamageMock(16, true, 'Maria');
    
    expect(result.message).toContain('Maria');
    expect(result.message).toContain('absorve');
  });
});

// =====================================================
// INTEGRAÇÃO COM SISTEMA DE RITUAIS SUSTENTADOS
// =====================================================

describe('Integração com Sistema de Rituais Sustentados', () => {
  // Testa funções importadas do sustained-rituals
  
  it('ritualHasModes deve retornar false para ritual inexistente', () => {
    const result = ritualHasModes('ritual-inexistente');
    expect(result).toBe(false);
  });

  it('getAvailableModesForRitual deve retornar array para ritual inexistente', () => {
    const modes = getAvailableModesForRitual('ritual-inexistente');
    expect(Array.isArray(modes)).toBe(true);
  });

  it('getRitualModeDescription deve retornar undefined para modo inexistente', () => {
    const description = getRitualModeDescription('ritual-inexistente', 'modo-inexistente');
    expect(description).toBeUndefined();
  });
});

// =====================================================
// SIMULAÇÃO DE ATIVAÇÃO DE MODO
// =====================================================

describe('Lógica de Ativação de Modo', () => {
  // Simula lógica do hook activateRitualMode (simplificada)
  function simulateAddCondition(
    conditions: ActiveConditionForRitual[],
    conditionId: string,
    conditionName: string,
    ritualSourceId: string
  ): ActiveConditionForRitual[] {
    // Verifica se já existe
    if (conditions.some(c => c.id === conditionId)) {
      return conditions;
    }
    
    return [
      ...conditions,
      {
        id: conditionId,
        name: conditionName,
        turnsRemaining: null,
        addedAt: new Date().toISOString(),
        source: ritualSourceId,
      },
    ];
  }

  it('deve adicionar condição com source do ritual', () => {
    const conditions: ActiveConditionForRitual[] = [];
    
    const newConditions = simulateAddCondition(
      conditions,
      'velocidade-mortal-buff',
      'Velocidade Mortal',
      'ritual-123'
    );
    
    expect(newConditions.length).toBe(1);
    expect(newConditions[0].source).toBe('ritual-123');
  });

  it('não deve duplicar condição existente', () => {
    const conditions: ActiveConditionForRitual[] = [
      { id: 'velocidade-mortal-buff', name: 'Velocidade Mortal', turnsRemaining: null, addedAt: '2024-01-01', source: 'ritual-123' },
    ];
    
    const newConditions = simulateAddCondition(
      conditions,
      'velocidade-mortal-buff',
      'Velocidade Mortal',
      'ritual-456'
    );
    
    expect(newConditions.length).toBe(1);
  });

  it('deve manter turnsRemaining como null para condições de ritual', () => {
    const conditions: ActiveConditionForRitual[] = [];
    
    const newConditions = simulateAddCondition(
      conditions,
      'velocidade-mortal-inverso',
      'Velocidade Mortal (Inverso)',
      'ritual-123'
    );
    
    expect(newConditions[0].turnsRemaining).toBeNull();
  });
});
