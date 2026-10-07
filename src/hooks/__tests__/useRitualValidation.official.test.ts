/** Contratos das páginas 32, 114, 119 e 121 do Livro Base v1.3 fornecido. */
import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useRitualValidation } from '../useRitualValidation';

describe('Conjuração: capacidade e custo oficiais', () => {
  it('permite o custo mínimo como primeiro gasto acima do limite (p.23)', () => {
    const { result } = renderHook(() => useRitualValidation(5, null, 10, 10, { peSpentThisTurn: 0, turnNumber: 1 }));
    expect(result.current.validatePECost(2, [])).toMatchObject({ isValid: true, peRemaining: 8 });
  });

  it('não estende a exceção do custo mínimo a aprimoramentos ou outro gasto', () => {
    const first = renderHook(() => useRitualValidation(5, null, 10, 10, { peSpentThisTurn: 0, turnNumber: 1 }));
    expect(first.result.current.validatePECost(1, [{ name: 'Discente', cost: 2 }])).toMatchObject({ isValid: false, exceedsLimit: true });
    const next = renderHook(() => useRitualValidation(5, null, 10, 10, { peSpentThisTurn: 1, turnNumber: 1 }));
    expect(next.result.current.validatePECost(2, [])).toMatchObject({ isValid: false, exceedsLimit: true });
  });

  it('sem relógio ativo registra o custo sem presumir turno e ainda exige saldo', () => {
    const { result } = renderHook(() => useRitualValidation(5, null, 10, 10, { peSpentThisTurn: 0, turnNumber: 0, tracked: false }));
    expect(result.current.validatePECost(1, [{ name: 'Discente', cost: 2 }]).isValid).toBe(true);
    expect(result.current.validatePECost(1, [{ name: 'Discente', cost: 10 }]).isValid).toBe(false);
  });

  it('custo zero pode ser usado após a exceção e orçamento inválido é bloqueado', () => {
    const zero = renderHook(() => useRitualValidation(5, null, 10, 10, { peSpentThisTurn: 3, turnNumber: 1 }));
    expect(zero.result.current.validatePECost(0, []).isValid).toBe(true);
    const invalid = renderHook(() => useRitualValidation(5, null, 10, 10, { peSpentThisTurn: -1, turnNumber: 1 }));
    expect(invalid.result.current.validatePECost(1, []).isValid).toBe(false);
  });

  it('a exceção não fornece PE que a ficha não possui', () => {
    const { result } = renderHook(() => useRitualValidation(5, null, 1, 10));
    expect(result.current.validatePECost(2, [])).toMatchObject({ isValid: false, reason: 'PE insuficiente (1/2 PE)' });
  });

  it.each([-1, Number.NaN, Number.POSITIVE_INFINITY])('rejeita custo-base inválido %s sem débito negativo', cost => {
    const { result } = renderHook(() => useRitualValidation(99, null, 10, 10));
    expect(result.current.validatePECost(cost, [])).toMatchObject({
      isValid: false, totalCost: 0, peRemaining: 10,
    });
  });

  it.each([-1, Number.NaN, Number.POSITIVE_INFINITY])('rejeita adicional inválido %s', cost => {
    const { result } = renderHook(() => useRitualValidation(99, null, 10, 10));
    expect(result.current.validatePECost(1, [{ name: 'Discente', cost }])).toMatchObject({
      isValid: false, totalCost: 0, peRemaining: 10,
    });
  });

  it.each([-1, Number.NaN, Number.POSITIVE_INFINITY])('rejeita saldo inválido %s', currentPE => {
    const { result } = renderHook(() => useRitualValidation(99, null, currentPE, 10));
    expect(result.current.validatePECost(1, [])).toMatchObject({
      isValid: false, totalCost: 0, peRemaining: 0,
    });
  });

  it('rejeita soma de custos finitos que excede a faixa numérica', () => {
    const { result } = renderHook(() => useRitualValidation(99, null, 10, 10));
    expect(result.current.validatePECost(Number.MAX_VALUE, [{ name: 'Discente', cost: Number.MAX_VALUE }])).toMatchObject({
      isValid: false, totalCost: 0, peRemaining: 10,
    });
  });

  it.each([[20, 1], [25, 2], [50, 2], [55, 3], [80, 3], [85, 4], [99, 4]])(
    'Ocultista NEX %i pode usar até o círculo %i (p.32)', (nex, circle) => {
      const { result } = renderHook(() => useRitualValidation(nex, null, 100, 100));
      expect(result.current.maxCircle).toBe(circle);
    },
  );

  it.each([[25, 1], [40, 1], [45, 2], [70, 2], [75, 3], [99, 3]])(
    'Aprender Ritual no NEX %i permite até o círculo %i (p.114)', (nex, circle) => {
      const { result } = renderHook(() => useRitualValidation(nex, null, 100, 100, undefined, 0, true));
      expect(result.current.maxCircle).toBe(circle);
    },
  );

  it('valida o mesmo custo para Combatente/Especialista e Ocultista (p.119)', () => {
    const { result } = renderHook(() => useRitualValidation(25, null, 4, 10, undefined, 0, true));
    expect(result.current.validatePECost(1, [{ name: 'Discente', cost: 3 }], true)).toMatchObject({
      isValid: true, totalCost: 4, peRemaining: 0,
    });
  });

  it('rejeita duas formas avançadas na mesma conjuração (p.121)', () => {
    const { result } = renderHook(() => useRitualValidation(99, null, 100, 100));
    expect(result.current.validatePECost(1, [{ name: 'Discente', cost: 3 }, { name: 'Verdadeiro', cost: 5 }])).toMatchObject({
      isValid: false, reason: 'Selecione apenas um aprimoramento por conjuração',
    });
  });
});
