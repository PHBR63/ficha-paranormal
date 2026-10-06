import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCharacterResourceUpdate } from '../useCharacterResourceUpdate';

const fake = vi.hoisted(() => ({ confirm: vi.fn() }));
vi.mock('@/services/character-resource-service', () => ({ confirmResourceBundle: fake.confirm }));
vi.mock('@/services/character-activity-service', () => ({ activityJson: (value: unknown) => JSON.parse(JSON.stringify(value)) }));
const id = '00000000-0000-4000-8000-000000000001';
const values = { hp: 20, pe: 10, san: 30 };
beforeEach(() => { vi.clearAllMocks(); fake.confirm.mockResolvedValue({ id }); });

describe('edição de recursos confirmada pelo servidor', () => {
  it('bloqueia clique duplicado enquanto a confirmação está pendente', async () => {
    let resolve!: (value: { id: string }) => void;
    fake.confirm.mockReturnValue(new Promise(done => { resolve = done; }));
    const { result } = renderHook(() => useCharacterResourceUpdate(id));
    let first!: ReturnType<typeof result.current.execute>;
    act(() => { first = result.current.execute(values, [], { hp_current: 19 }); });
    await act(async () => { expect(await result.current.execute(values, [], { hp_current: 19 })).toBe(false); });
    expect(fake.confirm).toHaveBeenCalledTimes(1);
    expect(result.current.error).toContain('Aguarde');
    await act(async () => { resolve({ id }); expect(await first).toEqual({ id }); });
    expect(result.current.busy).toBe(false);
  });
  it('repete exatamente UUID, condições e snapshot quando a resposta se perde', async () => {
    fake.confirm.mockRejectedValueOnce(new Error('Conexão perdida'));
    const { result } = renderHook(() => useCharacterResourceUpdate(id));
    await act(async () => { expect(await result.current.execute(values, [{ name: 'Externa', duration: 3 }], { hp_current: 19 })).toBe(false); });
    await act(async () => { await result.current.execute(values, [{ name: 'Externa', duration: 2, addedAt: 'novo' }], { hp_current: 20 }); });
    expect(fake.confirm.mock.calls[1][0]).toEqual(fake.confirm.mock.calls[0][0]);
    expect(fake.confirm.mock.calls[1][0].expected.hp_current).toBe(19);
  });
  it('nega atualização local e libera novo pedido após conflito definitivo', async () => {
    fake.confirm.mockRejectedValueOnce(Object.assign(new Error('Estado mudou. Recarregue a ficha.'), { code: '40001' }));
    const { result } = renderHook(() => useCharacterResourceUpdate(id));
    await act(async () => { expect(await result.current.execute(values, [], { hp_current: 19 })).toBe(false); });
    expect(result.current.error).toContain('Estado mudou');
    await act(async () => { await result.current.execute(values, [], { hp_current: 18 }); });
    expect(fake.confirm.mock.calls[1][0].operationId).not.toBe(fake.confirm.mock.calls[0][0].operationId);
    expect(fake.confirm.mock.calls[1][0].expected.hp_current).toBe(18);
  });
});

