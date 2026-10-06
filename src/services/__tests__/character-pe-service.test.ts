import { beforeEach, describe, expect, it, vi } from 'vitest';
import { debitCharacterPE } from '../character-pe-service';

const fake = vi.hoisted(() => ({
  from: vi.fn(), update: vi.fn(), eq: vi.fn(), select: vi.fn(), maybeSingle: vi.fn(),
}));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: fake.from } }));

beforeEach(() => {
  vi.clearAllMocks();
  const query = { update: fake.update, eq: fake.eq, select: fake.select, maybeSingle: fake.maybeSingle };
  fake.from.mockReturnValue(query);
  fake.update.mockReturnValue(query);
  fake.eq.mockReturnValue(query);
  fake.select.mockReturnValue(query);
  fake.maybeSingle.mockResolvedValue({ data: { pe_current: 7 }, error: null });
});

describe('confirmação do gasto de PE', () => {
  it('debita somente se o saldo conhecido ainda for o mesmo e retorna o saldo salvo', async () => {
    expect(await debitCharacterPE('character', 10, 3)).toBe(7);
    expect(fake.update).toHaveBeenCalledWith({ pe_current: 7 });
    expect(fake.eq.mock.calls).toEqual([['id', 'character'], ['pe_current', 10]]);
    expect(fake.select).toHaveBeenCalledWith('pe_current');
  });
  it('recusa saldo alterado ou linha inacessível sem confirmar gasto', async () => {
    fake.maybeSingle.mockResolvedValue({ data: null, error: null });
    await expect(debitCharacterPE('character', 10, 3)).rejects.toThrow('Recarregue a ficha');
  });
  it('não expõe detalhes internos quando o servidor recusa a escrita', async () => {
    fake.maybeSingle.mockResolvedValue({ data: null, error: { message: 'Detalhe interno de autorização', code: '42501' } });
    await expect(debitCharacterPE('character', 10, 3)).rejects.toThrow('O gasto de PE não foi salvo');
  });
  it('informa falha de transporte sem afirmar que o gasto foi concluído', async () => {
    fake.maybeSingle.mockRejectedValue(new Error('Falha de rede'));
    await expect(debitCharacterPE('character', 10, 3)).rejects.toThrow('Não foi possível confirmar');
  });
  it('recusa uma resposta que não confirma o saldo esperado', async () => {
    fake.maybeSingle.mockResolvedValue({ data: { pe_current: 10 }, error: null });
    await expect(debitCharacterPE('character', 10, 3)).rejects.toThrow('saldo esperado');
  });
  it('mantém gratuidade explícita sem tornar o saldo negativo', async () => {
    fake.maybeSingle.mockResolvedValue({ data: { pe_current: 0 }, error: null });
    expect(await debitCharacterPE('character', 0, 0)).toBe(0);
  });
  it('bloqueia saldo insuficiente antes de consultar o banco', async () => {
    await expect(debitCharacterPE('character', 2, 3)).rejects.toThrow('PE insuficiente');
    expect(fake.from).not.toHaveBeenCalled();
  });
  it.each([-1, 1.5, NaN, Infinity])('bloqueia custo inválido %s antes de gravar', async cost => {
    await expect(debitCharacterPE('character', 10, cost)).rejects.toThrow('inválido');
    expect(fake.from).not.toHaveBeenCalled();
  });
});
