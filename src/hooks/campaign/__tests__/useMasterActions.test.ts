import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useMasterActions } from '../useMasterActions';
const mocks = vi.hoisted(() => ({ toast: vi.fn(), resource: vi.fn(), condition: vi.fn(), confirm: vi.fn(), from: vi.fn(), write: vi.fn(), select: vi.fn() }));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: mocks.toast }) }));
vi.mock('@/services/character-resource-service', () => ({ prepareResourceChange: mocks.resource, prepareConditionChange: mocks.condition }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: mocks.from } }));
beforeEach(() => {
  vi.clearAllMocks(); mocks.confirm.mockReset(); mocks.confirm.mockResolvedValue({ id: 'event' });
  mocks.resource.mockResolvedValue(mocks.confirm); mocks.condition.mockResolvedValue(mocks.confirm);
  mocks.select.mockReturnValue({ single: mocks.write });
  mocks.from.mockReturnValue({ update: () => ({ eq: () => ({ select: mocks.select }) }), delete: () => ({ eq: () => ({ select: mocks.select }) }) });
});
describe('confirmação das ações do mestre', () => {
  const operations = [['adjustHP', 2], ['adjustPE', -2], ['adjustSAN', -2], ['setHP', 12], ['setPE', 8], ['setSAN', 8], ['applyCondition', 'Vulnerável'], ['removeCondition', 'Machucado'], ['clearAllConditions', undefined]] as const;
  it.each(operations)('%s não confirma sucesso quando servidor rejeita', async (method, value) => {
    mocks.confirm.mockRejectedValue(new Error('Sem permissão'));
    const onUpdate = vi.fn();
    const { result } = renderHook(() => useMasterActions({ campaignId: 'campaign', isMaster: true, onUpdate }));
    await act(async () => {
      const operation = result.current[method] as (id: string, input?: number | string) => Promise<boolean>;
      expect(await operation('character', value)).toBe(false);
    });
    expect(onUpdate).not.toHaveBeenCalled();
    expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({ variant: 'destructive' }));
  });
  it('confirma PV somente após servidor e não usa UPDATE direto', async () => {
    const onUpdate = vi.fn();
    const { result } = renderHook(() => useMasterActions({ campaignId: 'campaign', isMaster: true, onUpdate }));
    await act(async () => { expect(await result.current.adjustHP('character', -3)).toBe(true); });
    expect(mocks.resource).toHaveBeenCalledWith('character', 'hp', 'delta', -3);
    expect(onUpdate).toHaveBeenCalledOnce();
    expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Dano aplicado' }));
  });
  it('conserva a requisição após timeout para evitar débito duplicado', async () => {
    mocks.confirm.mockRejectedValueOnce(new Error('Timeout')).mockResolvedValueOnce({ id: 'event' });
    const { result } = renderHook(() => useMasterActions({ campaignId: 'campaign', isMaster: true }));
    await act(async () => { expect(await result.current.adjustPE('character', -2)).toBe(false); });
    await act(async () => { expect(await result.current.adjustPE('character', -2)).toBe(true); });
    expect(mocks.resource).toHaveBeenCalledOnce(); expect(mocks.confirm).toHaveBeenCalledTimes(2);
  });
  it('relê recurso depois de conflito confirmado', async () => {
    mocks.confirm.mockRejectedValueOnce(Object.assign(new Error('Conflito'), { code: '40001' })).mockResolvedValueOnce({ id: 'event' });
    const { result } = renderHook(() => useMasterActions({ campaignId: 'campaign', isMaster: true }));
    await act(async () => { await result.current.adjustPE('character', -2); });
    await act(async () => { await result.current.adjustPE('character', -2); });
    expect(mocks.resource).toHaveBeenCalledTimes(2);
  });
  it('não prepara ações quando não é mestre', async () => {
    const { result } = renderHook(() => useMasterActions({ campaignId: 'campaign', isMaster: false }));
    await act(async () => { expect(await result.current.adjustHP('character', -3)).toBe(false); });
    expect(mocks.resource).not.toHaveBeenCalled();
  });
  it.each(['revealHandout', 'hideHandout', 'deleteHandout'] as const)('%s não confirma UPDATE/DELETE com zero linhas autorizadas', async method => {
    mocks.write.mockResolvedValue({ data: null, error: { code: 'PGRST116', message: 'Nenhuma linha autorizada' } });
    const onUpdate = vi.fn();
    const { result } = renderHook(() => useMasterActions({ campaignId: 'campaign', isMaster: true, onUpdate }));
    await act(async () => { expect(await result.current[method]('handout')).toBe(false); });
    expect(mocks.select).toHaveBeenCalledWith('id');
    expect(onUpdate).not.toHaveBeenCalled();
    expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({ variant: 'destructive' }));
  });
});
