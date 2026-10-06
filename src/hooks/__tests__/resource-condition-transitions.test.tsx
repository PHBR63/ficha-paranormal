import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { checkAutoConditions } from '@/lib/game-engine';
import { useAutoConditions } from '@/hooks/useAutoConditions';

const notices = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn(), warning: vi.fn() }));
vi.mock('sonner', () => ({ toast: notices }));

describe('Condições por saldo e transição — Livro Base p.88', () => {
  it.each([0, 9, 10])('marca Machucado em %i/20 PV, sem duplicar nem penalizar', hp => {
    expect(checkAutoConditions(hp, 20, 15, 15, [], { hp, san: 15 }).conditionsToAdd).toEqual(['machucado']);
    expect(checkAutoConditions(hp, 20, 15, 15, ['machucado'], { hp, san: 15 }).conditionsToAdd).toEqual([]);
  });

  it('respeita metade de máximo ímpar e remove Machucado acima da metade', () => {
    expect(checkAutoConditions(10, 21, 15, 15, [], { hp: 11, san: 15 }).conditionsToAdd).toContain('machucado');
    expect(checkAutoConditions(11, 21, 15, 15, ['machucado'], { hp: 10, san: 15 }).conditionsToRemove).toEqual(['machucado']);
    expect(checkAutoConditions(0, 0, 15, 15, [], { hp: 0, san: 15 }).conditionsToAdd).not.toContain('machucado');
  });

  it('uma edição de PE preserva estabilização e acalmamento com PV/SAN zero', () => {
    const result = checkAutoConditions(0, 20, 0, 15, ['inconsciente'], { hp: 0, san: 0 });
    expect(result.conditionsToAdd).toEqual(['machucado']);
    expect(result.conditionsToRemove).toEqual([]);
    expect(result.dyingCounter).toBeUndefined();
  });

  it('perder PV/SAN até zero aplica as condições críticas uma única vez', () => {
    const result = checkAutoConditions(0, 20, 0, 15, [], { hp: 1, san: 1 });
    expect(result.conditionsToAdd).toEqual(['machucado', 'inconsciente', 'morrendo', 'enlouquecendo']);
    expect(checkAutoConditions(0, 20, 0, 15, result.conditionsToAdd, { hp: 0, san: 0 }).conditionsToAdd).toEqual([]);
  });

  it('perda recorrente efetiva com zero PV pode recolocar Morrendo, sem recriar Enlouquecendo', () => {
    const result = checkAutoConditions(0, 20, 0, 15, ['machucado', 'inconsciente'], { hp: 0, san: 0, hpLoss: 2 });
    expect(result.conditionsToAdd).toEqual(['morrendo']);
    expect(result.dyingCounter).toBe(3);
  });

  it('cura remove Inconsciente e Enlouquecendo, conserva Morrendo e indica Perturbado', () => {
    const result = checkAutoConditions(1, 20, 1, 15,
      ['machucado', 'inconsciente', 'morrendo', 'enlouquecendo'], { hp: 0, san: 0 });
    expect(result.conditionsToRemove).toEqual(['inconsciente', 'enlouquecendo']);
    expect(result.conditionsToAdd).toEqual(['perturbado']);
  });

  it('sem cura efetiva, não remove condições críticas de outra fonte ao editar PE', () => {
    const result = checkAutoConditions(20, 20, 15, 15, ['inconsciente', 'enlouquecendo'], { hp: 20, san: 15 });
    expect(result.conditionsToRemove).toEqual([]);
  });

  it('hook preserva metadados, duração, contador e condição desconhecida sem avisar antes do recibo', () => {
    vi.clearAllMocks();
    const original = [
      { id: 'caseira', name: 'Caseira', turnsRemaining: 2, addedAt: '2026-10-06', params: { valor: 7 } },
      { id: 'morrendo', name: 'Morrendo', turnsRemaining: null, addedAt: '2026-10-05', dyingCounter: 1 },
    ];
    const { result } = renderHook(() => useAutoConditions());
    const outcome = result.current.processResourceChange(10, 20, 15, 15, original, false, { hp: 11, san: 15 });
    expect(outcome.newConditions.slice(0, 2)).toEqual(original);
    expect(outcome.newConditions[2]).toMatchObject({ id: 'machucado', name: 'Machucado', turnsRemaining: null });
    expect(original).toHaveLength(2);
    expect(notices.warning).not.toHaveBeenCalled();
    expect(notices.error).not.toHaveBeenCalled();
    expect(notices.success).not.toHaveBeenCalled();
  });
});
