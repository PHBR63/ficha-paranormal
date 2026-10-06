import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCharacterServerRead } from '../useCharacterServerRead';

const fake = vi.hoisted(() => ({ read: vi.fn(), from: vi.fn(), eq: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: fake.from } }));
type Result = { data: { id: string; san_current: number } | null; error: null | { message: string } };
function deferred() {
  let resolve!: (result: Result) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<Result>((accept, fail) => { resolve = accept; reject = fail; });
  return { promise, resolve, reject };
}
beforeEach(() => {
  vi.clearAllMocks();
  fake.read.mockResolvedValue({ data: { id: 'a', san_current: 7 }, error: null });
  fake.from.mockImplementation(() => {
    const chain = { select: () => chain, eq: fake.eq, single: fake.read };
    fake.eq.mockReturnValue(chain);
    return chain;
  });
});

describe('leitura confirmada da ficha atual', () => {
  it.each(['dados', 'erro'] as const)('descarta %s antigo quando uma leitura nova terminou primeiro', async kind => {
    const first = deferred();
    fake.read.mockReturnValueOnce(first.promise);
    const { result } = renderHook(() => useCharacterServerRead('a', 'owner'));
    const old = result.current();
    const recent = await result.current();
    expect(recent?.data?.san_current).toBe(7);
    if (kind === 'dados') first.resolve({ data: { id: 'a', san_current: 15 }, error: null });
    else first.reject(new Error('Falha da conexão antiga'));
    expect(await old).toBeNull();
    expect(recent?.isCurrent()).toBe(true);
  });
  it('retornar A → B → A não revalida uma resposta da primeira visita', async () => {
    const first = deferred(); fake.read.mockReturnValueOnce(first.promise);
    const { result, rerender } = renderHook(({ id }) => useCharacterServerRead(id, 'owner'), { initialProps: { id: 'a' } });
    const old = result.current();
    rerender({ id: 'b' }); rerender({ id: 'a' });
    first.resolve({ data: { id: 'a', san_current: 15 }, error: null });
    expect(await old).toBeNull();
    expect((await result.current())?.data?.san_current).toBe(7);
  });
  it('trocar conta durante a leitura descarta o retorno anterior', async () => {
    const first = deferred(); fake.read.mockReturnValueOnce(first.promise);
    const { result, rerender } = renderHook(({ user }) => useCharacterServerRead('a', user), { initialProps: { user: 'owner' } });
    const old = result.current(); rerender({ user: 'other' });
    first.resolve({ data: { id: 'a', san_current: 15 }, error: null });
    expect(await old).toBeNull();
    await result.current();
    expect(fake.eq).toHaveBeenLastCalledWith('user_id', 'other');
  });
  it('preparação assíncrona não aplica um snapshot superado por nova leitura', async () => {
    const { result, unmount } = renderHook(() => useCharacterServerRead('a', 'owner'));
    const preparing = await result.current();
    expect(preparing?.isCurrent()).toBe(true);
    const current = await result.current();
    expect(preparing?.isCurrent()).toBe(false);
    expect(current?.isCurrent()).toBe(true);
    unmount();
    expect(current?.isCurrent()).toBe(false);
  });
  it('desmontar descarta a consulta pendente', async () => {
    const first = deferred(); fake.read.mockReturnValueOnce(first.promise);
    const { result, unmount } = renderHook(() => useCharacterServerRead('a', 'owner'));
    const old = result.current(); unmount();
    first.resolve({ data: { id: 'a', san_current: 15 }, error: null });
    expect(await old).toBeNull();
  });
  it('mantém filtros de ficha e dono, sem consultar quando falta identidade', async () => {
    const { result, rerender } = renderHook(({ id, owner }) => useCharacterServerRead(id, owner), { initialProps: { id: '', owner: 'owner' } });
    expect(await result.current()).toBeNull(); expect(fake.from).not.toHaveBeenCalled();
    rerender({ id: 'a', owner: 'owner' }); await result.current();
    expect(fake.from).toHaveBeenCalledWith('characters');
    expect(fake.eq.mock.calls).toEqual([['id', 'a'], ['user_id', 'owner']]);
  });
  it('falha de rede atual retorna erro claro, sem expor detalhes internos', async () => {
    fake.read.mockRejectedValueOnce(new Error('Detalhe interno de conexão'));
    const { result } = renderHook(() => useCharacterServerRead('a', 'owner'));
    let read;
    await act(async () => { read = await result.current(); });
    expect(read).toMatchObject({ data: null, error: { message: 'Não foi possível carregar a ficha. Verifique a conexão e o acesso.' } });
  });
});
