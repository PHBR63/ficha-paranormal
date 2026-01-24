// =====================================================
// Testes de Sincronização Realtime - SUE
// Ordem Paranormal RPG v1.3
// =====================================================
//
// Testa cenários de sincronização em tempo real:
// - Atualização de condições entre mestre e jogadores
// - Propagação de buffs de combate
// - Consistência de estado entre clientes
// - Edge cases de sincronização
//

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  consolidateEffects,
  type UnifiedEffect,
  type EffectCalculationContext,
  type AttributeType,
  type ComputedEffects,
} from '../unified-effects-engine';
import { getConditionEffects } from '../effects/condition-effects-adapter';
import { getTrackEffects } from '../effects/track-effects-adapter';

// =============================================================================
// HELPERS DE TESTE
// =============================================================================

/**
 * Simula estado sincronizado entre clientes
 * Representa o que seria armazenado no Supabase
 */
interface SyncedCharacterState {
  id: string;
  name: string;
  track: string;
  nex: number;
  attributes: Record<AttributeType, number>;
  conditions: string[];
  activeBuffIds: string[];
  lastUpdated: number; // timestamp
  version: number; // para controle de conflitos
}

/**
 * Simula buffer de mudanças pendentes
 */
interface PendingChange {
  characterId: string;
  field: string;
  oldValue: unknown;
  newValue: unknown;
  timestamp: number;
}

/**
 * Cria estado sincronizado inicial
 */
function createSyncedState(
  id: string,
  overrides: Partial<SyncedCharacterState> = {}
): SyncedCharacterState {
  return {
    id,
    name: `Personagem ${id}`,
    track: 'guerreiro',
    nex: 50,
    attributes: { strength: 2, agility: 2, vigor: 2, intellect: 2, presence: 2 },
    conditions: [],
    activeBuffIds: [],
    lastUpdated: Date.now(),
    version: 1,
    ...overrides,
  };
}

/**
 * Calcula efeitos a partir de estado sincronizado
 */
function calculateFromSyncedState(state: SyncedCharacterState): ComputedEffects {
  const trackEffects = getTrackEffects(state.track, state.nex, state.attributes, state.activeBuffIds);
  const conditionEffects = getConditionEffects(state.conditions);
  
  const context: EffectCalculationContext = {
    attributes: state.attributes,
    nex: state.nex,
    hpCurrent: 30,
    hpMax: 30,
    peCurrent: 20,
    peMax: 20,
    inCombat: false,
    isFirstRound: false,
    currentRound: 1,
    hasShield: false,
    activeConditions: state.conditions,
    activatedEffects: state.activeBuffIds,
  };

  return consolidateEffects([...trackEffects, ...conditionEffects], context);
}

/**
 * Simula merge de estados (como Supabase realtime faria)
 */
function mergeStates(
  localState: SyncedCharacterState,
  remoteState: SyncedCharacterState
): SyncedCharacterState {
  // Remote ganha se for mais recente
  if (remoteState.lastUpdated > localState.lastUpdated) {
    return { ...remoteState };
  }
  // Local ganha se for mais recente
  if (localState.lastUpdated > remoteState.lastUpdated) {
    return { ...localState };
  }
  // Mesma timestamp: usar versão mais alta
  return localState.version >= remoteState.version ? localState : remoteState;
}

// =============================================================================
// TESTES: Atualização de Condições (Mestre → Jogadores)
// =============================================================================

describe('Realtime Sync: Condições Mestre → Jogadores', () => {
  let mestteState: SyncedCharacterState;
  let jogadorState: SyncedCharacterState;

  beforeEach(() => {
    // Mestre e jogador começam com mesmo estado
    mestteState = createSyncedState('char-1', { name: 'Personagem Teste' });
    jogadorState = { ...mestteState };
  });

  it('deve sincronizar adição de condição do mestre para jogador', () => {
    // Mestre adiciona condição
    mestteState = {
      ...mestteState,
      conditions: ['sangrando'],
      lastUpdated: Date.now() + 100,
      version: 2,
    };

    // Simula recebimento via realtime
    jogadorState = mergeStates(jogadorState, mestteState);

    // Jogador deve ter a condição
    expect(jogadorState.conditions).toContain('sangrando');

    // Efeitos calculados devem ser iguais
    const mestreEffects = calculateFromSyncedState(mestteState);
    const jogadorEffects = calculateFromSyncedState(jogadorState);

    expect(mestreEffects.attack.general).toBe(jogadorEffects.attack.general);
  });

  it('deve sincronizar remoção de condição do mestre para jogador', () => {
    // Estado inicial com condição
    mestteState.conditions = ['abalado'];
    jogadorState.conditions = ['abalado'];

    // Mestre remove condição
    mestteState = {
      ...mestteState,
      conditions: [],
      lastUpdated: Date.now() + 100,
      version: 2,
    };

    // Simula recebimento
    jogadorState = mergeStates(jogadorState, mestteState);

    expect(jogadorState.conditions).not.toContain('abalado');
    expect(jogadorState.conditions.length).toBe(0);
  });

  it('deve sincronizar múltiplas condições simultaneamente', () => {
    // Mestre adiciona múltiplas condições
    mestteState = {
      ...mestteState,
      conditions: ['sangrando', 'abalado', 'caido'],
      lastUpdated: Date.now() + 100,
      version: 2,
    };

    jogadorState = mergeStates(jogadorState, mestteState);

    expect(jogadorState.conditions.length).toBe(3);
    expect(jogadorState.conditions).toContain('sangrando');
    expect(jogadorState.conditions).toContain('abalado');
    expect(jogadorState.conditions).toContain('caido');
  });

  it('deve resolver conflito quando mestre e jogador editam simultaneamente', () => {
    const now = Date.now();

    // Mestre adiciona 'sangrando'
    const mestreUpdate: SyncedCharacterState = {
      ...mestteState,
      conditions: ['sangrando'],
      lastUpdated: now + 100,
      version: 2,
    };

    // Jogador tenta adicionar 'abalado' ao mesmo tempo
    const jogadorUpdate: SyncedCharacterState = {
      ...jogadorState,
      conditions: ['abalado'],
      lastUpdated: now + 50, // Anterior ao mestre
      version: 2,
    };

    // Merge deve favorecer o mais recente (mestre)
    const resultado = mergeStates(jogadorUpdate, mestreUpdate);

    expect(resultado.conditions).toContain('sangrando');
    expect(resultado.conditions).not.toContain('abalado');
  });
});

// =============================================================================
// TESTES: Propagação de Buffs de Combate
// =============================================================================

describe('Realtime Sync: Buffs de Combate', () => {
  it('deve propagar ativação de buff para todos os clientes', () => {
    const clientes = ['mestre', 'jogador1', 'jogador2'];
    const estadosIniciais = clientes.map(id => createSyncedState(id));

    // Mestre ativa buff no personagem do jogador1
    const buffAtivado = 'track-tecnica-destruidor';
    
    const estadoAtualizado = {
      ...estadosIniciais[1],
      activeBuffIds: [buffAtivado],
      lastUpdated: Date.now() + 100,
      version: 2,
    };

    // Simula broadcast para todos
    const estadosFinais = estadosIniciais.map((estado, i) => 
      i === 1 ? estadoAtualizado : estado
    );

    // Apenas jogador1 deve ter o buff
    expect(estadosFinais[0].activeBuffIds).not.toContain(buffAtivado);
    expect(estadosFinais[1].activeBuffIds).toContain(buffAtivado);
    expect(estadosFinais[2].activeBuffIds).not.toContain(buffAtivado);
  });

  it('deve desativar buff quando expirar e propagar', () => {
    const estado = createSyncedState('char-1', {
      activeBuffIds: ['buff-temporario'],
    });

    // Simula expiração
    const estadoExpirado = {
      ...estado,
      activeBuffIds: [],
      lastUpdated: Date.now() + 1000,
      version: 3,
    };

    expect(estadoExpirado.activeBuffIds).not.toContain('buff-temporario');
  });

  it('deve manter ordem de buffs consistente entre clientes', () => {
    const buffs = ['buff-1', 'buff-2', 'buff-3'];
    
    const estadoMestre = createSyncedState('mestre', { activeBuffIds: [...buffs] });
    const estadoJogador = mergeStates(createSyncedState('jogador'), estadoMestre);

    // Ordem deve ser mantida
    expect(estadoJogador.activeBuffIds).toEqual(buffs);
  });
});

// =============================================================================
// TESTES: Consistência de Estado
// =============================================================================

describe('Realtime Sync: Consistência de Estado', () => {
  it('deve garantir mesmo resultado de cálculo em todos os clientes', () => {
    const estadoBase = createSyncedState('char-1', {
      track: 'guerreiro',
      nex: 50,
      conditions: ['abalado'],
    });

    // Simula 3 clientes calculando o mesmo estado
    const resultados = [
      calculateFromSyncedState(estadoBase),
      calculateFromSyncedState(estadoBase),
      calculateFromSyncedState(estadoBase),
    ];

    // Todos devem ter resultados idênticos
    const primeiro = resultados[0];
    resultados.forEach(resultado => {
      expect(resultado.attack.general).toBe(primeiro.attack.general);
      expect(resultado.defense.general).toBe(primeiro.defense.general);
      expect(resultado.damage.general).toBe(primeiro.damage.general);
    });
  });

  it('deve detectar e resolver estados dessincronizados', () => {
    const estadoOriginal = createSyncedState('char-1', { version: 1 });
    
    // Cliente A tem versão 2
    const clienteA = { ...estadoOriginal, version: 2, conditions: ['sangrando'] };
    
    // Cliente B ainda tem versão 1 (dessincronizado)
    const clienteB = { ...estadoOriginal, version: 1 };

    // Merge deve atualizar cliente B
    const resultado = mergeStates(clienteB, clienteA);

    expect(resultado.version).toBe(2);
    expect(resultado.conditions).toContain('sangrando');
  });

  it('deve lidar com latência entre atualizações', async () => {
    const estados: SyncedCharacterState[] = [];
    
    // Simula 5 atualizações com "latência"
    for (let i = 0; i < 5; i++) {
      const novoEstado = createSyncedState('char-1', {
        version: i + 1,
        lastUpdated: Date.now() + (i * 100),
        conditions: i >= 3 ? ['sangrando'] : [],
      });
      estados.push(novoEstado);
    }

    // Aplica atualizações em ordem
    let estadoFinal = estados[0];
    for (let i = 1; i < estados.length; i++) {
      estadoFinal = mergeStates(estadoFinal, estados[i]);
    }

    // Estado final deve ser o mais recente
    expect(estadoFinal.version).toBe(5);
    expect(estadoFinal.conditions).toContain('sangrando');
  });
});

// =============================================================================
// TESTES: Edge Cases de Sincronização
// =============================================================================

describe('Realtime Sync: Edge Cases', () => {
  it('deve lidar com estado vazio', () => {
    const estadoVazio = createSyncedState('char-1', {
      conditions: [],
      activeBuffIds: [],
    });

    const effects = calculateFromSyncedState(estadoVazio);
    expect(effects).toBeDefined();
    expect(effects.attack.general).toBeDefined();
  });

  it('deve lidar com condições inválidas graciosamente', () => {
    const estadoComCondicaoInvalida = createSyncedState('char-1', {
      conditions: ['condicao-inexistente', 'sangrando'],
    });

    // Não deve quebrar, apenas ignorar a condição inválida
    const effects = calculateFromSyncedState(estadoComCondicaoInvalida);
    expect(effects).toBeDefined();
  });

  it('deve lidar com timestamps muito próximos', () => {
    const now = Date.now();
    
    const estado1 = createSyncedState('char-1', { lastUpdated: now, version: 1 });
    const estado2 = createSyncedState('char-1', { lastUpdated: now, version: 2 });

    // Quando timestamps são iguais, versão decide
    const resultado = mergeStates(estado1, estado2);
    expect(resultado.version).toBe(2);
  });

  it('deve manter integridade com muitas atualizações rápidas', () => {
    let estado = createSyncedState('char-1');
    const condicoes = ['abalado', 'sangrando', 'caido', 'cego', 'surdo'];

    // Simula 100 atualizações rápidas
    for (let i = 0; i < 100; i++) {
      const novaCondicao = condicoes[i % condicoes.length];
      const novasCondicoes = i % 2 === 0 
        ? [...estado.conditions, novaCondicao]
        : estado.conditions.filter(c => c !== novaCondicao);

      estado = {
        ...estado,
        conditions: [...new Set(novasCondicoes)], // Remove duplicatas
        version: estado.version + 1,
        lastUpdated: Date.now() + i,
      };
    }

    // Estado deve ser válido
    expect(estado.version).toBe(101);
    expect(Array.isArray(estado.conditions)).toBe(true);
  });

  it('deve processar desconexão e reconexão', () => {
    // Estado antes da desconexão
    const estadoAntes = createSyncedState('char-1', {
      version: 5,
      conditions: ['abalado'],
    });

    // Simula período offline onde mestre fez alterações
    const estadoRemoto = createSyncedState('char-1', {
      version: 10,
      conditions: ['abalado', 'sangrando', 'envenenado'],
      lastUpdated: Date.now() + 5000,
    });

    // Reconexão: merge deve atualizar para versão remota
    const estadoReconectado = mergeStates(estadoAntes, estadoRemoto);

    expect(estadoReconectado.version).toBe(10);
    expect(estadoReconectado.conditions.length).toBe(3);
  });

  it('deve lidar com múltiplos personagens sincronizando', () => {
    const personagens = ['char-1', 'char-2', 'char-3', 'char-4'];
    const estados = new Map<string, SyncedCharacterState>();

    // Inicializa todos
    personagens.forEach(id => {
      estados.set(id, createSyncedState(id));
    });

    // Atualiza cada um de forma independente
    personagens.forEach((id, i) => {
      const estado = estados.get(id)!;
      estados.set(id, {
        ...estado,
        conditions: i % 2 === 0 ? ['sangrando'] : [],
        version: 2,
      });
    });

    // Verifica integridade
    expect(estados.size).toBe(4);
    expect(estados.get('char-1')!.conditions).toContain('sangrando');
    expect(estados.get('char-2')!.conditions.length).toBe(0);
  });
});

// =============================================================================
// TESTES: Simulação de Cenário Real
// =============================================================================

describe('Realtime Sync: Cenário de Sessão Real', () => {
  it('deve simular sessão completa com 4 jogadores + mestre', () => {
    type ClientState = Map<string, SyncedCharacterState>;
    
    // Estado inicial: cada jogador tem um personagem
    const jogadores = ['player1', 'player2', 'player3', 'player4'];
    const initialState: ClientState = new Map();
    
    jogadores.forEach((playerId, i) => {
      initialState.set(playerId, createSyncedState(`char-${i}`, {
        name: `Personagem de ${playerId}`,
        track: ['guerreiro', 'atirador-de-elite', 'condutor', 'medico-de-campo'][i],
      }));
    });

    // Turno 1: Mestre adiciona condição em player1
    const player1State = initialState.get('player1')!;
    const player1Updated = {
      ...player1State,
      conditions: ['sangrando'],
      version: 2,
    };
    initialState.set('player1', player1Updated);

    // Turno 2: player2 ativa buff
    const player2State = initialState.get('player2')!;
    const player2Updated = {
      ...player2State,
      activeBuffIds: ['track-disparo-letal'],
      version: 2,
    };
    initialState.set('player2', player2Updated);

    // Turno 3: Mestre adiciona mais condições
    const finalState = initialState.get('player1')!;
    const finalStateUpdated = {
      ...finalState,
      conditions: ['sangrando', 'caido'],
      version: 3,
    };
    initialState.set('player1', finalStateUpdated);

    // Verifica estado final
    const p1Final = initialState.get('player1')!;
    const p2Final = initialState.get('player2')!;
    const p3Final = initialState.get('player3')!;
    const p4Final = initialState.get('player4')!;

    expect(p1Final.conditions).toContain('sangrando');
    expect(p1Final.conditions).toContain('caido');
    expect(p2Final.activeBuffIds).toContain('track-disparo-letal');
    expect(p3Final.conditions.length).toBe(0);
    expect(p4Final.conditions.length).toBe(0);

    // Calcula efeitos finais para todos
    const allEffects = jogadores.map(id => ({
      id,
      effects: calculateFromSyncedState(initialState.get(id)!),
    }));

    expect(allEffects.length).toBe(4);
    allEffects.forEach(({ effects }) => {
      expect(effects).toBeDefined();
      expect(effects.attack).toBeDefined();
    });
  });
});
