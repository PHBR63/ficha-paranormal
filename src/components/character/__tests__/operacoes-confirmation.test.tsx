import { act, renderHook, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useOperacoesEspeciaisTrack, OPERACOES_ABILITIES } from '../tracks/combatente/useOperacoesEspeciaisTrack';
import { OperacoesEspeciaisPanel } from '../tracks/combatente/OperacoesEspeciaisPanel';

const mocks = vi.hoisted(() => ({ toast: vi.fn() }));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => mocks }));
vi.mock('@/hooks/use-mobile', () => ({ useIsMobile: () => false }));
const extra = OPERACOES_ABILITIES[0];
const surto = OPERACOES_ABILITIES[1];
const base = { classTrack: 'operacoes-especiais', nex: 65, peCurrent: 10 };
beforeEach(() => vi.clearAllMocks());

describe('Confirmação de Operações Especiais', () => {
  it('recusa não ativa efeito nem registra uso', async () => {
    const onActivateEffect = vi.fn(); const onAbilityUsed = vi.fn();
    const { result } = renderHook(() => useOperacoesEspeciaisTrack({ ...base,
      onPEChange: vi.fn().mockResolvedValue(false), onActivateEffect, onAbilityUsed }));
    await act(async () => { await result.current.handleUseAbility(extra); });
    expect(onActivateEffect).not.toHaveBeenCalled();
    expect(onAbilityUsed).not.toHaveBeenCalled();
    expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({ variant: 'destructive' }));
  });

  it('aguarda confirmação e bloqueia segundo clique antes de renderizar', async () => {
    let resolve!: (confirmed: boolean) => void;
    const onPEChange = vi.fn(() => new Promise<boolean>(r => { resolve = r; }));
    const onActivateEffect = vi.fn();
    const { result } = renderHook(() => useOperacoesEspeciaisTrack({ ...base, onPEChange, onActivateEffect }));
    let pending: unknown;
    act(() => { pending = result.current.handleUseAbility(extra); result.current.handleUseAbility(extra); });
    expect(onPEChange).toHaveBeenCalledOnce();
    expect(onActivateEffect).not.toHaveBeenCalled();
    await act(async () => { resolve(true); await pending; });
    expect(onActivateEffect).toHaveBeenCalledOnce();
    expect(result.current.isAbilityUsed(extra.id)).toBe(true);
  });

  it('Surto recusado conserva escolha aberta e não concede ação', async () => {
    const onActivateEffect = vi.fn();
    const { result } = renderHook(() => useOperacoesEspeciaisTrack({ ...base,
      onPEChange: vi.fn().mockResolvedValue(false), onActivateEffect }));
    act(() => { result.current.handleUseAbility(surto); });
    await act(async () => { await result.current.handleSurtoChoice('standard'); });
    expect(result.current.showSurtoModal).toBe(true);
    expect(onActivateEffect).not.toHaveBeenCalled();
    expect(result.current.isAbilityUsed(surto.id)).toBe(false);
  });

  it('escolha revalida saldo após alteração da ficha', async () => {
    const onPEChange = vi.fn().mockResolvedValue(true);
    const { result, rerender } = renderHook(({ peCurrent }) => useOperacoesEspeciaisTrack({ ...base, peCurrent, onPEChange }),
      { initialProps: { peCurrent: 10 } });
    act(() => { result.current.handleUseAbility(surto); });
    rerender({ peCurrent: 2 });
    await act(async () => { await result.current.handleSurtoChoice('movement'); });
    expect(onPEChange).not.toHaveBeenCalled();
    expect(result.current.showSurtoModal).toBe(true);
  });

  it('painel atualiza disponibilidade com saldo novo e uso externo', () => {
    const onPEChange = vi.fn();
    const { rerender } = render(<OperacoesEspeciaisPanel {...base} onPEChange={onPEChange} />);
    expect(screen.getAllByRole('button', { name: 'Usar' })[0]).toBeEnabled();
    rerender(<OperacoesEspeciaisPanel {...base} peCurrent={0} onPEChange={onPEChange} />);
    expect(screen.getAllByRole('button', { name: 'Usar' })[0]).toBeDisabled();
    rerender(<OperacoesEspeciaisPanel {...base} onPEChange={onPEChange} usedAbilitiesThisRound={['ataque-extra']} />);
    expect(screen.getByRole('button', { name: 'Usada' })).toBeDisabled();
  });

  it('exceção de gravação mostra falha e libera controles', async () => {
    const onActivateEffect = vi.fn();
    const { result } = renderHook(() => useOperacoesEspeciaisTrack({ ...base,
      onPEChange: vi.fn().mockRejectedValue(new Error('Transporte indisponível')), onActivateEffect }));
    await act(async () => { await result.current.handleUseAbility(extra); });
    expect(onActivateEffect).not.toHaveBeenCalled();
    expect(result.current.isConfirming).toBe(false);
    expect(result.current.isAbilityUsed(extra.id)).toBe(false);
  });

  it('Surto bloqueia segunda escolha e fechamento durante confirmação', async () => {
    let resolve!: (confirmed: boolean) => void;
    const onPEChange = vi.fn(() => new Promise<boolean>(r => { resolve = r; }));
    const onActivateEffect = vi.fn(); const onTrackPESpent = vi.fn();
    const { result } = renderHook(() => useOperacoesEspeciaisTrack({ ...base, onPEChange, onActivateEffect, onTrackPESpent }));
    act(() => { result.current.handleUseAbility(surto); });
    let pending: unknown;
    act(() => {
      pending = result.current.handleSurtoChoice('movement');
      result.current.handleSurtoChoice('standard'); result.current.setShowSurtoModal(false);
    });
    expect(result.current.showSurtoModal).toBe(true);
    expect(result.current.isConfirming).toBe(true);
    expect(onPEChange).toHaveBeenCalledOnce();
    await act(async () => { resolve(true); await pending; });
    expect(result.current.showSurtoModal).toBe(false);
    expect(onActivateEffect).toHaveBeenCalledWith('track-surto-de-adrenalina', surto.name, 'round', { choice: 'movement' });
    expect(onTrackPESpent).toHaveBeenCalledWith(surto.name, 5);
  });

  it('habilidade bloqueada por NEX não envia gasto', async () => {
    const onPEChange = vi.fn();
    const { result } = renderHook(() => useOperacoesEspeciaisTrack({ ...base, nex: 10, onPEChange }));
    await act(async () => { await result.current.handleUseAbility(extra); });
    expect(onPEChange).not.toHaveBeenCalled();
  });
});
