import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useMasterActions } from '../useMasterActions';

const mocks = vi.hoisted(() => ({
  toast: vi.fn(), read: vi.fn(), write: vi.fn(), selectWrite: vi.fn(), update: vi.fn(),
}));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: mocks.toast }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: () => ({
  select: () => ({ eq: () => ({ single: mocks.read }) }), update: mocks.update,
}) } }));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.read.mockResolvedValue({ data: {
    hp_current: 10, hp_max: 20, pe_current: 10, pe_max: 20,
    san_current: 10, san_max: 20, conditions: ['Machucado'],
  }, error: null });
  mocks.write.mockResolvedValue({ data: { id: 'character-a' }, error: null });
  mocks.selectWrite.mockReturnValue({ single: mocks.write });
  mocks.update.mockReturnValue({ eq: () => ({ select: mocks.selectWrite }) });
});

describe('confirmação das ações do mestre', () => {
  const operations: Array<[keyof ReturnType<typeof useMasterActions>, (number | string)?]> = [
    ['adjustHP', 2], ['adjustPE', -2], ['adjustSAN', -2], ['setHP', 12], ['setPE', 8], ['setSAN', 8],
    ['applyCondition', 'Vulnerável'], ['removeCondition', 'Machucado'], ['clearAllConditions'],
  ];
  it.each(operations)('%s não confirma sucesso quando a gravação não retorna linha', async (method, value) => {
    mocks.write.mockResolvedValue({ data: null, error: { message: 'Nenhuma linha autorizada', code: 'PGRST116' } });
    const onUpdate = vi.fn();
    const { result } = renderHook(() => useMasterActions({ campaignId: 'campaign-a', isMaster: true, onUpdate }));
    let success: boolean | undefined;
    await act(async () => {
      // As operações recebem recurso numérico, condição textual ou somente ID.
      const operation = result.current[method] as (id: string, input?: number | string) => Promise<boolean>;
      success = await operation('character-a', value);
    });
    expect(success).toBe(false);
    expect(onUpdate).not.toHaveBeenCalled();
    expect(mocks.selectWrite).toHaveBeenCalledWith('id');
    expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({ variant: 'destructive' }));
    expect(result.current.lastError).toBe('Nenhuma linha autorizada');
  });
  it('confirma PV e atualiza o painel somente após retorno do servidor', async () => {
    const onUpdate = vi.fn();
    const { result } = renderHook(() => useMasterActions({ campaignId: 'campaign-a', isMaster: true, onUpdate }));
    let success: boolean | undefined;
    await act(async () => { success = await result.current.adjustHP('character-a', -3); });
    expect(success).toBe(true);
    expect(mocks.update).toHaveBeenCalledWith({ hp_current: 7 });
    expect(onUpdate).toHaveBeenCalledOnce();
    expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Dano aplicado' }));
  });
  it('não consulta nem grava quando o usuário não é mestre', async () => {
    const { result } = renderHook(() => useMasterActions({ campaignId: 'campaign-a', isMaster: false }));
    await act(async () => { expect(await result.current.adjustHP('character-a', -3)).toBe(false); });
    expect(mocks.read).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });
});
