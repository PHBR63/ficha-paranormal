/**
 * Testes unitários para useActivatableClassPowers
 * 
 * Verifica:
 * - Detecção de poderes baseada em NEX e posse
 * - Cálculo de custos escalonáveis (Segurar o Gatilho)
 * - Limites por cena/rodada/turno
 * - Reset de estados por período
 * - Gasto de PE e callbacks
 * 
 * @module hooks/__tests__/useActivatableClassPowers.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useActivatableClassPowers,
  ACTIVATABLE_COMBATENTE_POWERS,
  type UseActivatableClassPowersProps,
} from '../useActivatableClassPowers';

// =====================================================
// Helpers de Teste
// =====================================================

/** Cria props padrão para o hook */
function createTestProps(overrides: Partial<UseActivatableClassPowersProps> = {}): UseActivatableClassPowersProps {
  return {
    classPowers: [],
    abilities: {},
    nex: 99,
    peCurrent: 20,
    onPEChange: vi.fn(),
    onTrackPESpent: vi.fn(),
    ...overrides,
  };
}

/** Cria um poder de classe no formato esperado */
function createClassPower(id: string, name: string) {
  return { id, name, description: `Descrição de ${name}` };
}

// =====================================================
// Testes de Detecção de Poderes
// =====================================================

describe('useActivatableClassPowers - Detecção de Poderes', () => {
  it('retorna lista vazia quando personagem não tem poderes ativáveis', () => {
    const props = createTestProps({ classPowers: [], nex: 99 });
    const { result } = renderHook(() => useActivatableClassPowers(props));

    expect(result.current.availablePowers).toHaveLength(0);
    expect(result.current.totalPowers).toBe(0);
  });

  it('detecta Incansável quando personagem possui o poder', () => {
    const props = createTestProps({
      classPowers: [createClassPower('incansavel', 'Incansável')],
      nex: 15,
    });
    const { result } = renderHook(() => useActivatableClassPowers(props));

    const incansavel = result.current.availablePowers.find(p => p.id === 'incansavel');
    expect(incansavel).toBeDefined();
    expect(incansavel?.name).toBe('Incansável');
    expect(incansavel?.basePECost).toBe(2);
    expect(incansavel?.limit).toBe('perScene');
  });

  it('detecta Segurar o Gatilho quando personagem possui o poder e NEX >= 60', () => {
    const props = createTestProps({
      classPowers: [createClassPower('segurar-gatilho', 'Segurar o Gatilho')],
      nex: 60,
    });
    const { result } = renderHook(() => useActivatableClassPowers(props));

    const segurarGatilho = result.current.availablePowers.find(p => p.id === 'segurar-gatilho');
    expect(segurarGatilho).toBeDefined();
    expect(segurarGatilho?.scalingCost).toBeDefined();
  });

  it('NÃO detecta Segurar o Gatilho quando NEX < 60', () => {
    const props = createTestProps({
      classPowers: [createClassPower('segurar-gatilho', 'Segurar o Gatilho')],
      nex: 55,
    });
    const { result } = renderHook(() => useActivatableClassPowers(props));

    const segurarGatilho = result.current.availablePowers.find(p => p.id === 'segurar-gatilho');
    expect(segurarGatilho).toBeUndefined();
  });

  it('detecta poder pelo nome quando ID não corresponde exatamente', () => {
    const props = createTestProps({
      classPowers: [{ id: 'custom-id', name: 'Incansável', description: 'teste' }],
      nex: 15,
    });
    const { result } = renderHook(() => useActivatableClassPowers(props));

    expect(result.current.availablePowers.find(p => p.id === 'incansavel')).toBeDefined();
  });

  it('detecta poderes em abilities (formato legado)', () => {
    const props = createTestProps({
      classPowers: [],
      abilities: {
        poder1: { id: 'incansavel', name: 'Incansável' },
      },
      nex: 15,
    });
    const { result } = renderHook(() => useActivatableClassPowers(props));

    expect(result.current.availablePowers.find(p => p.id === 'incansavel')).toBeDefined();
  });

  it('detecta múltiplos poderes simultaneamente', () => {
    const props = createTestProps({
      classPowers: [
        createClassPower('incansavel', 'Incansável'),
        createClassPower('combate-defensivo', 'Combate Defensivo'),
        createClassPower('ataque-de-oportunidade', 'Ataque de Oportunidade'),
      ],
      nex: 15,
    });
    const { result } = renderHook(() => useActivatableClassPowers(props));

    expect(result.current.availablePowers.length).toBeGreaterThanOrEqual(3);
    expect(result.current.totalPowers).toBeGreaterThanOrEqual(3);
  });

  it('filtra poderes por NEX mínimo corretamente', () => {
    const props = createTestProps({
      classPowers: [
        createClassPower('incansavel', 'Incansável'), // minNex: 15
        createClassPower('segurar-gatilho', 'Segurar o Gatilho'), // minNex: 60
      ],
      nex: 30,
    });
    const { result } = renderHook(() => useActivatableClassPowers(props));

    expect(result.current.availablePowers.find(p => p.id === 'incansavel')).toBeDefined();
    expect(result.current.availablePowers.find(p => p.id === 'segurar-gatilho')).toBeUndefined();
  });
});

// =====================================================
// Testes de Cálculo de Custos
// =====================================================

describe('useActivatableClassPowers - Cálculo de Custos', () => {
  it('retorna custo base para poderes sem escalonamento', () => {
    const props = createTestProps({
      classPowers: [createClassPower('incansavel', 'Incansável')],
      nex: 15,
    });
    const { result } = renderHook(() => useActivatableClassPowers(props));

    expect(result.current.getCurrentCost('incansavel')).toBe(2);
  });

  it('retorna 0 para poderes sem custo de PE (Combate Defensivo)', () => {
    const props = createTestProps({
      classPowers: [createClassPower('combate-defensivo', 'Combate Defensivo')],
      nex: 15,
    });
    const { result } = renderHook(() => useActivatableClassPowers(props));

    expect(result.current.getCurrentCost('combate-defensivo')).toBe(0);
  });

  it('calcula custo escalonável de Segurar o Gatilho corretamente', () => {
    const props = createTestProps({
      classPowers: [createClassPower('segurar-gatilho', 'Segurar o Gatilho')],
      nex: 60,
      peCurrent: 50,
    });
    const { result } = renderHook(() => useActivatableClassPowers(props));

    // Primeiro uso: 2 PE × 1 = 2 PE
    expect(result.current.getCurrentCost('segurar-gatilho')).toBe(2);

    // Usa o poder uma vez
    act(() => {
      result.current.usePower('segurar-gatilho');
    });

    // Segundo uso: 2 PE × 2 = 4 PE
    expect(result.current.getCurrentCost('segurar-gatilho')).toBe(4);

    // Usa novamente
    act(() => {
      result.current.usePower('segurar-gatilho');
    });

    // Terceiro uso: 2 PE × 3 = 6 PE
    expect(result.current.getCurrentCost('segurar-gatilho')).toBe(6);
  });

  it('retorna 0 para poder não encontrado', () => {
    const props = createTestProps({ classPowers: [] });
    const { result } = renderHook(() => useActivatableClassPowers(props));

    expect(result.current.getCurrentCost('poder-inexistente')).toBe(0);
  });
});

// =====================================================
// Testes de Verificação de PE (canAfford)
// =====================================================

describe('useActivatableClassPowers - Verificação de PE', () => {
  it('retorna true quando PE é suficiente', () => {
    const props = createTestProps({
      classPowers: [createClassPower('incansavel', 'Incansável')],
      nex: 15,
      peCurrent: 10,
    });
    const { result } = renderHook(() => useActivatableClassPowers(props));

    expect(result.current.canAfford('incansavel')).toBe(true);
  });

  it('retorna false quando PE é insuficiente', () => {
    const props = createTestProps({
      classPowers: [createClassPower('incansavel', 'Incansável')],
      nex: 15,
      peCurrent: 1, // Precisa de 2 PE
    });
    const { result } = renderHook(() => useActivatableClassPowers(props));

    expect(result.current.canAfford('incansavel')).toBe(false);
  });

  it('retorna true para poderes sem custo (Combate Defensivo)', () => {
    const props = createTestProps({
      classPowers: [createClassPower('combate-defensivo', 'Combate Defensivo')],
      nex: 15,
      peCurrent: 0,
    });
    const { result } = renderHook(() => useActivatableClassPowers(props));

    expect(result.current.canAfford('combate-defensivo')).toBe(true);
  });

  it('retorna false quando poder já foi usado (limite por cena)', () => {
    const props = createTestProps({
      classPowers: [createClassPower('incansavel', 'Incansável')],
      nex: 15,
      peCurrent: 10,
    });
    const { result } = renderHook(() => useActivatableClassPowers(props));

    // Usa o poder
    act(() => {
      result.current.usePower('incansavel');
    });

    // Não pode mais usar (1x/cena)
    expect(result.current.canAfford('incansavel')).toBe(false);
  });

  it('retorna false para poder não encontrado', () => {
    const props = createTestProps({ classPowers: [] });
    const { result } = renderHook(() => useActivatableClassPowers(props));

    expect(result.current.canAfford('poder-inexistente')).toBe(false);
  });

  it('considera custo escalonado ao verificar affordability', () => {
    const props = createTestProps({
      classPowers: [createClassPower('segurar-gatilho', 'Segurar o Gatilho')],
      nex: 60,
      peCurrent: 5, // Só pode pagar primeiro (2 PE) e segundo (4 PE), não terceiro (6 PE)
    });
    const { result } = renderHook(() => useActivatableClassPowers(props));

    // Primeiro uso: pode pagar 2 PE
    expect(result.current.canAfford('segurar-gatilho')).toBe(true);

    act(() => {
      result.current.usePower('segurar-gatilho');
    });

    // PE agora é 3 (5-2), próximo custo é 4 PE - não pode pagar
    expect(result.current.canAfford('segurar-gatilho')).toBe(false);
  });
});

// =====================================================
// Testes de Uso de Poderes (usePower)
// =====================================================

describe('useActivatableClassPowers - Uso de Poderes', () => {
  it('gasta PE corretamente ao usar poder', () => {
    const onPEChange = vi.fn();
    const props = createTestProps({
      classPowers: [createClassPower('incansavel', 'Incansável')],
      nex: 15,
      peCurrent: 10,
      onPEChange,
    });
    const { result } = renderHook(() => useActivatableClassPowers(props));

    act(() => {
      result.current.usePower('incansavel');
    });

    expect(onPEChange).toHaveBeenCalledWith(8); // 10 - 2 = 8
  });

  it('chama onTrackPESpent com nome e custo do poder', () => {
    const onTrackPESpent = vi.fn();
    const props = createTestProps({
      classPowers: [createClassPower('incansavel', 'Incansável')],
      nex: 15,
      peCurrent: 10,
      onTrackPESpent,
    });
    const { result } = renderHook(() => useActivatableClassPowers(props));

    act(() => {
      result.current.usePower('incansavel');
    });

    expect(onTrackPESpent).toHaveBeenCalledWith('Incansável', 2);
  });

  it('retorna true ao usar poder com sucesso', () => {
    const props = createTestProps({
      classPowers: [createClassPower('incansavel', 'Incansável')],
      nex: 15,
      peCurrent: 10,
    });
    const { result } = renderHook(() => useActivatableClassPowers(props));

    let success = false;
    act(() => {
      success = result.current.usePower('incansavel');
    });

    expect(success).toBe(true);
  });

  it('retorna false ao tentar usar poder sem PE suficiente', () => {
    const props = createTestProps({
      classPowers: [createClassPower('incansavel', 'Incansável')],
      nex: 15,
      peCurrent: 1,
    });
    const { result } = renderHook(() => useActivatableClassPowers(props));

    let success = true;
    act(() => {
      success = result.current.usePower('incansavel');
    });

    expect(success).toBe(false);
  });

  it('retorna false ao tentar usar poder já usado na cena', () => {
    const props = createTestProps({
      classPowers: [createClassPower('incansavel', 'Incansável')],
      nex: 15,
      peCurrent: 10,
    });
    const { result } = renderHook(() => useActivatableClassPowers(props));

    act(() => {
      result.current.usePower('incansavel');
    });

    let success = true;
    act(() => {
      success = result.current.usePower('incansavel');
    });

    expect(success).toBe(false);
  });

  it('não gasta PE para poderes sem custo', () => {
    const onPEChange = vi.fn();
    const props = createTestProps({
      classPowers: [createClassPower('combate-defensivo', 'Combate Defensivo')],
      nex: 15,
      peCurrent: 0,
      onPEChange,
    });
    const { result } = renderHook(() => useActivatableClassPowers(props));

    act(() => {
      result.current.usePower('combate-defensivo');
    });

    expect(onPEChange).not.toHaveBeenCalled();
  });

  it('incrementa usageCount para poderes com escalonamento', () => {
    const props = createTestProps({
      classPowers: [createClassPower('segurar-gatilho', 'Segurar o Gatilho')],
      nex: 60,
      peCurrent: 50,
    });
    const { result } = renderHook(() => useActivatableClassPowers(props));

    expect(result.current.usageStates['segurar-gatilho']?.usageCount ?? 0).toBe(0);

    act(() => {
      result.current.usePower('segurar-gatilho');
    });

    expect(result.current.usageStates['segurar-gatilho']?.usageCount).toBe(1);

    act(() => {
      result.current.usePower('segurar-gatilho');
    });

    expect(result.current.usageStates['segurar-gatilho']?.usageCount).toBe(2);
  });

  it('incrementa usedCount ao usar poderes', () => {
    const props = createTestProps({
      classPowers: [
        createClassPower('incansavel', 'Incansável'),
        createClassPower('combate-defensivo', 'Combate Defensivo'),
      ],
      nex: 15,
      peCurrent: 10,
    });
    const { result } = renderHook(() => useActivatableClassPowers(props));

    expect(result.current.usedCount).toBe(0);

    act(() => {
      result.current.usePower('incansavel');
    });

    expect(result.current.usedCount).toBe(1);

    act(() => {
      result.current.usePower('combate-defensivo');
    });

    expect(result.current.usedCount).toBe(2);
  });
});

// =====================================================
// Testes de Limites por Período
// =====================================================

describe('useActivatableClassPowers - Limites por Período', () => {
  describe('Limite por Cena (perScene)', () => {
    it('Incansável só pode ser usado 1x por cena', () => {
      const props = createTestProps({
        classPowers: [createClassPower('incansavel', 'Incansável')],
        nex: 15,
        peCurrent: 20,
      });
      const { result } = renderHook(() => useActivatableClassPowers(props));

      // Primeiro uso: sucesso
      let success = false;
      act(() => {
        success = result.current.usePower('incansavel');
      });
      expect(success).toBe(true);

      // Segundo uso: falha
      act(() => {
        success = result.current.usePower('incansavel');
      });
      expect(success).toBe(false);
    });

    it('Sentido Tático só pode ser usado 1x por cena', () => {
      const props = createTestProps({
        classPowers: [createClassPower('sentido-tatico', 'Sentido Tático')],
        nex: 15,
        peCurrent: 20,
      });
      const { result } = renderHook(() => useActivatableClassPowers(props));

      act(() => {
        result.current.usePower('sentido-tatico');
      });

      expect(result.current.canAfford('sentido-tatico')).toBe(false);
    });
  });

  describe('Limite por Rodada (perRound)', () => {
    it('Combate Defensivo só pode ser usado 1x por rodada', () => {
      const props = createTestProps({
        classPowers: [createClassPower('combate-defensivo', 'Combate Defensivo')],
        nex: 15,
        peCurrent: 0,
      });
      const { result } = renderHook(() => useActivatableClassPowers(props));

      // Primeiro uso: sucesso
      act(() => {
        result.current.usePower('combate-defensivo');
      });
      expect(result.current.canAfford('combate-defensivo')).toBe(false);

      // Reset de rodada libera
      act(() => {
        result.current.resetRound();
      });
      expect(result.current.canAfford('combate-defensivo')).toBe(true);
    });
  });

  describe('Limite por Turno (perTurn)', () => {
    it('Segurar o Gatilho reseta contador ao trocar turno', () => {
      const props = createTestProps({
        classPowers: [createClassPower('segurar-gatilho', 'Segurar o Gatilho')],
        nex: 60,
        peCurrent: 50,
      });
      const { result } = renderHook(() => useActivatableClassPowers(props));

      // Usa 3 vezes
      act(() => {
        result.current.usePower('segurar-gatilho');
        result.current.usePower('segurar-gatilho');
        result.current.usePower('segurar-gatilho');
      });

      // Custo atual seria 8 PE (2 × 4)
      expect(result.current.getCurrentCost('segurar-gatilho')).toBe(8);

      // Reset de turno
      act(() => {
        result.current.resetTurn();
      });

      // Custo volta a 2 PE
      expect(result.current.getCurrentCost('segurar-gatilho')).toBe(2);
    });
  });

  describe('Sem Limite (none)', () => {
    it('Ataque de Oportunidade pode ser usado múltiplas vezes', () => {
      const props = createTestProps({
        classPowers: [createClassPower('ataque-de-oportunidade', 'Ataque de Oportunidade')],
        nex: 15,
        peCurrent: 10,
      });
      const { result } = renderHook(() => useActivatableClassPowers(props));

      // Pode usar várias vezes enquanto tiver PE
      for (let i = 0; i < 5; i++) {
        expect(result.current.canAfford('ataque-de-oportunidade')).toBe(true);
        act(() => {
          result.current.usePower('ataque-de-oportunidade');
        });
      }

      // Parou porque PE acabou (10 - 5×1 = 5), ainda pode
      expect(result.current.canAfford('ataque-de-oportunidade')).toBe(true);
    });
  });
});

// =====================================================
// Testes de Reset
// =====================================================

describe('useActivatableClassPowers - Reset de Estados', () => {
  it('resetTurn limpa apenas poderes perTurn', () => {
    const props = createTestProps({
      classPowers: [
        createClassPower('segurar-gatilho', 'Segurar o Gatilho'), // perTurn
        createClassPower('combate-defensivo', 'Combate Defensivo'), // perRound
        createClassPower('incansavel', 'Incansável'), // perScene
      ],
      nex: 60,
      peCurrent: 50,
    });
    const { result } = renderHook(() => useActivatableClassPowers(props));

    // Usa todos
    act(() => {
      result.current.usePower('segurar-gatilho');
      result.current.usePower('combate-defensivo');
      result.current.usePower('incansavel');
    });

    // Reset turno
    act(() => {
      result.current.resetTurn();
    });

    // Segurar Gatilho liberado
    expect(result.current.getCurrentCost('segurar-gatilho')).toBe(2);
    
    // Combate Defensivo ainda bloqueado (perRound)
    expect(result.current.canAfford('combate-defensivo')).toBe(false);
    
    // Incansável ainda bloqueado (perScene)
    expect(result.current.canAfford('incansavel')).toBe(false);
  });

  it('resetRound limpa poderes perTurn e perRound', () => {
    const props = createTestProps({
      classPowers: [
        createClassPower('segurar-gatilho', 'Segurar o Gatilho'), // perTurn
        createClassPower('combate-defensivo', 'Combate Defensivo'), // perRound
        createClassPower('incansavel', 'Incansável'), // perScene
      ],
      nex: 60,
      peCurrent: 50,
    });
    const { result } = renderHook(() => useActivatableClassPowers(props));

    // Usa todos
    act(() => {
      result.current.usePower('segurar-gatilho');
      result.current.usePower('combate-defensivo');
      result.current.usePower('incansavel');
    });

    // Reset rodada
    act(() => {
      result.current.resetRound();
    });

    // Segurar Gatilho liberado
    expect(result.current.getCurrentCost('segurar-gatilho')).toBe(2);
    
    // Combate Defensivo liberado
    expect(result.current.canAfford('combate-defensivo')).toBe(true);
    
    // Incansável ainda bloqueado (perScene)
    expect(result.current.canAfford('incansavel')).toBe(false);
  });

  it('resetScene limpa todos os estados', () => {
    const props = createTestProps({
      classPowers: [
        createClassPower('segurar-gatilho', 'Segurar o Gatilho'),
        createClassPower('combate-defensivo', 'Combate Defensivo'),
        createClassPower('incansavel', 'Incansável'),
      ],
      nex: 60,
      peCurrent: 50,
    });
    const { result } = renderHook(() => useActivatableClassPowers(props));

    // Usa todos
    act(() => {
      result.current.usePower('segurar-gatilho');
      result.current.usePower('combate-defensivo');
      result.current.usePower('incansavel');
    });

    expect(result.current.usedCount).toBeGreaterThan(0);

    // Reset cena
    act(() => {
      result.current.resetScene();
    });

    // Todos liberados
    expect(result.current.usedCount).toBe(0);
    expect(result.current.canAfford('incansavel')).toBe(true);
    expect(result.current.canAfford('combate-defensivo')).toBe(true);
    expect(result.current.getCurrentCost('segurar-gatilho')).toBe(2);
  });
});

// =====================================================
// Testes do Catálogo de Poderes
// =====================================================

describe('ACTIVATABLE_COMBATENTE_POWERS - Catálogo', () => {
  it('contém todos os poderes ativáveis oficiais', () => {
    const powerIds = ACTIVATABLE_COMBATENTE_POWERS.map(p => p.id);

    expect(powerIds).toContain('incansavel');
    expect(powerIds).toContain('segurar-gatilho');
    expect(powerIds).toContain('combate-defensivo');
    expect(powerIds).toContain('ataque-de-oportunidade');
    expect(powerIds).toContain('golpe-demolidor');
    expect(powerIds).toContain('presteza-atletica');
    expect(powerIds).toContain('sentido-tatico');
    expect(powerIds).toContain('tiro-de-cobertura');
  });

  it('NÃO contém Golpe Pesado (é passivo, não ativável)', () => {
    const powerIds = ACTIVATABLE_COMBATENTE_POWERS.map(p => p.id);
    expect(powerIds).not.toContain('golpe-pesado');
  });

  it('todos os poderes têm campos obrigatórios', () => {
    ACTIVATABLE_COMBATENTE_POWERS.forEach(power => {
      expect(power.id).toBeDefined();
      expect(power.name).toBeDefined();
      expect(power.shortEffect).toBeDefined();
      expect(power.description).toBeDefined();
      expect(typeof power.basePECost).toBe('number');
      expect(power.limit).toBeDefined();
      expect(typeof power.minNex).toBe('number');
      expect(power.icon).toBeDefined();
      expect(power.pageRef).toBeDefined();
    });
  });

  it('Segurar o Gatilho é o único com scalingCost', () => {
    const powersWithScaling = ACTIVATABLE_COMBATENTE_POWERS.filter(p => p.scalingCost);
    expect(powersWithScaling).toHaveLength(1);
    expect(powersWithScaling[0].id).toBe('segurar-gatilho');
  });

  it('valores de minNex estão corretos conforme Livro Base', () => {
    const incansavel = ACTIVATABLE_COMBATENTE_POWERS.find(p => p.id === 'incansavel');
    expect(incansavel?.minNex).toBe(15);

    const segurarGatilho = ACTIVATABLE_COMBATENTE_POWERS.find(p => p.id === 'segurar-gatilho');
    expect(segurarGatilho?.minNex).toBe(60);

    const combateDefensivo = ACTIVATABLE_COMBATENTE_POWERS.find(p => p.id === 'combate-defensivo');
    expect(combateDefensivo?.minNex).toBe(15);
  });

  it('custos de PE estão corretos conforme Livro Base', () => {
    expect(ACTIVATABLE_COMBATENTE_POWERS.find(p => p.id === 'incansavel')?.basePECost).toBe(2);
    expect(ACTIVATABLE_COMBATENTE_POWERS.find(p => p.id === 'segurar-gatilho')?.basePECost).toBe(2);
    expect(ACTIVATABLE_COMBATENTE_POWERS.find(p => p.id === 'combate-defensivo')?.basePECost).toBe(0);
    expect(ACTIVATABLE_COMBATENTE_POWERS.find(p => p.id === 'ataque-de-oportunidade')?.basePECost).toBe(1);
    expect(ACTIVATABLE_COMBATENTE_POWERS.find(p => p.id === 'golpe-demolidor')?.basePECost).toBe(1);
    expect(ACTIVATABLE_COMBATENTE_POWERS.find(p => p.id === 'presteza-atletica')?.basePECost).toBe(1);
    expect(ACTIVATABLE_COMBATENTE_POWERS.find(p => p.id === 'sentido-tatico')?.basePECost).toBe(2);
    expect(ACTIVATABLE_COMBATENTE_POWERS.find(p => p.id === 'tiro-de-cobertura')?.basePECost).toBe(1);
  });

  it('limites de uso estão corretos', () => {
    expect(ACTIVATABLE_COMBATENTE_POWERS.find(p => p.id === 'incansavel')?.limit).toBe('perScene');
    expect(ACTIVATABLE_COMBATENTE_POWERS.find(p => p.id === 'segurar-gatilho')?.limit).toBe('perTurn');
    expect(ACTIVATABLE_COMBATENTE_POWERS.find(p => p.id === 'combate-defensivo')?.limit).toBe('perRound');
    expect(ACTIVATABLE_COMBATENTE_POWERS.find(p => p.id === 'ataque-de-oportunidade')?.limit).toBe('none');
    expect(ACTIVATABLE_COMBATENTE_POWERS.find(p => p.id === 'golpe-demolidor')?.limit).toBe('none');
    expect(ACTIVATABLE_COMBATENTE_POWERS.find(p => p.id === 'presteza-atletica')?.limit).toBe('none');
    expect(ACTIVATABLE_COMBATENTE_POWERS.find(p => p.id === 'sentido-tatico')?.limit).toBe('perScene');
    expect(ACTIVATABLE_COMBATENTE_POWERS.find(p => p.id === 'tiro-de-cobertura')?.limit).toBe('none');
  });
});

// =====================================================
// Testes de Cenários Completos
// =====================================================

describe('useActivatableClassPowers - Cenários Completos', () => {
  it('simula combate completo com múltiplos poderes', () => {
    const onPEChange = vi.fn();
    const onTrackPESpent = vi.fn();
    
    const props = createTestProps({
      classPowers: [
        createClassPower('incansavel', 'Incansável'),
        createClassPower('combate-defensivo', 'Combate Defensivo'),
        createClassPower('ataque-de-oportunidade', 'Ataque de Oportunidade'),
        createClassPower('segurar-gatilho', 'Segurar o Gatilho'),
      ],
      nex: 60,
      peCurrent: 20,
      onPEChange,
      onTrackPESpent,
    });
    const { result } = renderHook(() => useActivatableClassPowers(props));

    // Turno 1: usa Combate Defensivo e Segurar o Gatilho 2x
    act(() => {
      result.current.usePower('combate-defensivo'); // 0 PE
      result.current.usePower('segurar-gatilho'); // 2 PE
      result.current.usePower('segurar-gatilho'); // 4 PE
    });

    expect(onPEChange).toHaveBeenCalledWith(18); // 20-2
    expect(onPEChange).toHaveBeenCalledWith(14); // 18-4 (mas recebeu 18 como peCurrent)

    // Novo turno
    act(() => {
      result.current.resetTurn();
    });

    // Segurar o Gatilho resetou, Combate Defensivo ainda bloqueado
    expect(result.current.getCurrentCost('segurar-gatilho')).toBe(2);
    expect(result.current.canAfford('combate-defensivo')).toBe(false);

    // Nova rodada
    act(() => {
      result.current.resetRound();
    });

    // Agora Combate Defensivo está disponível
    expect(result.current.canAfford('combate-defensivo')).toBe(true);

    // Incansável ainda não foi usado
    expect(result.current.canAfford('incansavel')).toBe(true);

    // Usa Incansável
    act(() => {
      result.current.usePower('incansavel');
    });

    // Incansável bloqueado para a cena
    expect(result.current.canAfford('incansavel')).toBe(false);

    // Nova cena
    act(() => {
      result.current.resetScene();
    });

    // Tudo disponível novamente
    expect(result.current.canAfford('incansavel')).toBe(true);
    expect(result.current.canAfford('combate-defensivo')).toBe(true);
    expect(result.current.usedCount).toBe(0);
  });

  it('personagem NEX 15 tem acesso limitado a poderes de alto NEX', () => {
    const props = createTestProps({
      classPowers: [
        createClassPower('incansavel', 'Incansável'), // NEX 15
        createClassPower('segurar-gatilho', 'Segurar o Gatilho'), // NEX 60
      ],
      nex: 15,
      peCurrent: 20,
    });
    const { result } = renderHook(() => useActivatableClassPowers(props));

    expect(result.current.availablePowers.length).toBe(1);
    expect(result.current.availablePowers[0].id).toBe('incansavel');
  });
});
