import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useConditionTurnApplication } from '../useConditionTurnApplication';
import { prepareConditionTurn } from '@/lib/rules/condition-turn';
const mocks=vi.hoisted(() => ({rpc:vi.fn(),confirmed:vi.fn(),invalidate:vi.fn()}));
vi.mock('@tanstack/react-query', () => ({ useQueryClient: () => ({ invalidateQueries: mocks.invalidate }) }));
vi.mock('@/services/character-activity-service',async importOriginal => ({
  ...await importOriginal<typeof import('@/services/character-activity-service')>(),
  activityClient:{rpc:mocks.rpc},confirmActivity:mocks.confirmed,
}));
const character={id:'94ba0000-0000-4000-8000-000000000001',vigor:2,hp_current:10,hp_max:10,pe_current:4,pe_max:4,san_current:15,san_max:15,
  conditions:[{id:'sangrando',name:'Sangrando',turnsRemaining:null,addedAt:'2026-10-06'},{id:'caseira',name:'Caseira',params:{poisonDamage:'2',valor:7},turnsRemaining:null,addedAt:'2026-10-06'}]};
beforeEach(() => {vi.clearAllMocks();mocks.confirmed.mockReturnValue({id:'receipt',character_id:character.id,payload:{}});});
describe('Pedido transacional de início de turno',() => {
  it('recarrega temporários somente após recibo confirmado, sem depender do realtime',async () => {
    mocks.rpc.mockResolvedValue({data:{},error:null});
    const {result}=renderHook(() => useConditionTurnApplication(character,vi.fn()));
    const execute=result.current(prepareConditionTurn([],2));
    expect(mocks.invalidate).not.toHaveBeenCalled(); await execute();
    expect(mocks.invalidate).toHaveBeenCalledWith({queryKey:['temporary-resources',character.id]});
  });
  it('libera espera sem resposta e recupera o mesmo pedido sem trocar UUID',async () => {
    vi.useFakeTimers();
    try {
      mocks.rpc.mockReturnValueOnce(new Promise(() => {})).mockResolvedValue({data:{},error:null});
      const onConfirmed=vi.fn();
      const {result}=renderHook(() => useConditionTurnApplication(character,onConfirmed));
      const execute=result.current(prepareConditionTurn([],2));
      const pending=expect(execute()).rejects.toThrow('Repita a mesma confirmação');
      await vi.advanceTimersByTimeAsync(30000); await pending;
      expect(onConfirmed).not.toHaveBeenCalled();
      await execute();
      expect(mocks.rpc.mock.calls[1][1]).toEqual(mocks.rpc.mock.calls[0][1]);
      expect(onConfirmed).toHaveBeenCalledOnce();
    } finally { vi.useRealTimers(); }
  });
  it('resolver sem dano mantém a estabilização de uma ficha com zero PV',async () => {
    mocks.rpc.mockResolvedValue({data:{},error:null});
    const {result}=renderHook(() => useConditionTurnApplication({...character,hp_current:0,conditions:[]},vi.fn()));
    await result.current(prepareConditionTurn([],2))();
    expect(mocks.rpc.mock.calls[0][1].p_conditions.map((entry:{id:string}) => entry.id)).toEqual(['machucado']);
  });
  it('repete UUID/snapshot originais após falha, sem atualizar a ficha antes do recibo',async () => {
    mocks.rpc.mockResolvedValueOnce({data:null,error:{message:'Sem conexão'}}).mockResolvedValue({data:{},error:null});
    const onConfirmed=vi.fn(); const {result}=renderHook(() => useConditionTurnApplication(character,onConfirmed));
    const resolution=prepareConditionTurn([{id:'sangrando',name:'Sangrando',turnsRemaining:null,addedAt:'2026-10-06'}],2,0,() => 0);
    const execute=result.current(resolution);
    await expect(execute()).rejects.toThrow(); expect(onConfirmed).not.toHaveBeenCalled();
    await execute();expect(onConfirmed).toHaveBeenCalledOnce();
    const first=mocks.rpc.mock.calls[0][1],second=mocks.rpc.mock.calls[1][1];
    expect(second).toEqual(first); expect(first.p_expected.vigor).toBe(2);
    expect(first.p_values).toEqual({hp:10,pe:4,san:15});
    expect(first.p_resolution.bleedingTests).toEqual([]);
    expect(mocks.rpc.mock.calls[0][0]).toBe('confirm_character_condition_turn');
    expect(first.p_conditions.some((entry:{id:string;params?:{valor:number}}) => entry.id === 'caseira' && entry.params?.valor === 7)).toBe(true);
  });
  it('recibo de outra ficha não atualiza a ficha aberta depois',async () => {
    let resolve!:(value:unknown) => void;mocks.rpc.mockReturnValue(new Promise(r => {resolve=r;}));
    const onConfirmed=vi.fn();const {result,rerender}=renderHook(({sheet}) => useConditionTurnApplication(sheet,onConfirmed),{initialProps:{sheet:character}});
    const resolution=prepareConditionTurn([],2); const execute=result.current(resolution);const pending=execute();
    rerender({sheet:{...character,id:'another'}});
    await act(async () => {resolve({data:{},error:null});await pending;});expect(onConfirmed).not.toHaveBeenCalled();
  });
  it('erro de atualização visual após confirmação não transforma commit em falha de aplicação',async () => {
    mocks.rpc.mockResolvedValue({data:{},error:null});
    const {result}=renderHook(() => useConditionTurnApplication(character,() => {throw new Error('Tela falhou');}));
    await expect(result.current(prepareConditionTurn([],2))()).resolves.toMatchObject({id:'receipt'});
    expect(mocks.rpc).toHaveBeenCalledOnce();
  });
  it('explica quando Sangrando já foi resolvido no turno controlado', async () => {
    mocks.rpc.mockResolvedValue({data:null,error:{code:'23505',message:'Sangrando já foi resolvido neste turno.'}});
    const onConfirmed=vi.fn();const {result}=renderHook(() => useConditionTurnApplication(character,onConfirmed));
    await expect(result.current(prepareConditionTurn([],2))()).rejects.toMatchObject({
      message:expect.stringContaining('Avance o controle de turnos'),serverRejected:true,
    });
    expect(onConfirmed).not.toHaveBeenCalled();
  });
});
