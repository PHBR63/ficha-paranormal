import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  calculateDisparoLetalResult,
  createEmptyDisparoLetalConfig,
  DisparoLetalSelector,
} from '../DisparoLetalSelector';

describe.each(['default', 'compact'] as const)('Disparo Letal no layout %s', variant => {
  it('exige registrar Mirar antes de oferecer o bônus', () => {
    const onConfigChange = vi.fn();
    const initial = createEmptyDisparoLetalConfig();
    const { rerender } = render(<DisparoLetalSelector nex={40} currentPE={2} pontariaTrained
      config={initial} onConfigChange={onConfigChange} variant={variant} />);
    const toggle = screen.getByRole('switch');
    expect(toggle.hasAttribute('disabled')).toBe(true);
    expect(calculateDisparoLetalResult(40, { enabled: true, mirarDeclared: false })).toEqual({
      enabled: false, peCost: 0, criticalMarginBonus: 0,
    });

    expect(screen.getByRole('checkbox', { name: /Confirmo que fiz a ação Mirar/ })).toBeDisabled();
    rerender(<DisparoLetalSelector nex={40} currentPE={2} pontariaTrained mirarRegistered
      config={initial} onConfigChange={onConfigChange} variant={variant} />);
    fireEvent.click(screen.getByRole('checkbox', { name: /Confirmo que fiz a ação Mirar/ }));
    expect(onConfigChange).toHaveBeenLastCalledWith({ enabled: false, mirarDeclared: true });
    rerender(<DisparoLetalSelector nex={40} currentPE={2} pontariaTrained
      config={{ enabled: false, mirarDeclared: true }} onConfigChange={onConfigChange} mirarRegistered variant={variant} />);
    expect(screen.getByRole('switch').hasAttribute('disabled')).toBe(false);
    fireEvent.click(screen.getByRole('switch'));
    expect(onConfigChange).toHaveBeenLastCalledWith({ enabled: true, mirarDeclared: true });
    expect(calculateDisparoLetalResult(40, { enabled: true, mirarDeclared: true })).toEqual({
      enabled: true, peCost: 1, criticalMarginBonus: 2,
    });
  });
  it('sem turnos, registra o PE antes do ataque e permite encerrar sem estorno', () => {
    const onDismissMirar = vi.fn();
    render(<DisparoLetalSelector nex={40} currentPE={0} pontariaTrained
      config={createEmptyDisparoLetalConfig()} onConfigChange={vi.fn()} variant={variant}
      mirarRegistered mirarPending onDismissMirar={onDismissMirar} />);
    expect(screen.getByText(/Sem turnos ativos, a mesa confirma/)).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /Confirmo que fiz a ação Mirar/ })).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: 'Encerrar Mirar sem estornar PE' }));
    expect(onDismissMirar).toHaveBeenCalledOnce();
  });

  it('bloqueia Mirar para Pontaria destreinada e informa o requisito', () => {
    const onConfigChange = vi.fn();
    render(<DisparoLetalSelector nex={40} currentPE={2} pontariaTrained={false}
      config={createEmptyDisparoLetalConfig()} onConfigChange={onConfigChange} variant={variant} />);
    expect(screen.getByText('Mirar exige Pontaria treinada na ficha.')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /Confirmo que fiz a ação Mirar/ })).toBeDisabled();
    expect(screen.getByRole('switch')).toBeDisabled();
    expect(onConfigChange).not.toHaveBeenCalled();
  });
  it('em combate controlado exige registro do servidor antes da declaração', () => {
    const onConfigChange = vi.fn(); const onRegisterMirar = vi.fn();
    const config = createEmptyDisparoLetalConfig();
    const view = render(<DisparoLetalSelector nex={40} currentPE={2} pontariaTrained
      config={config} onConfigChange={onConfigChange} variant={variant}
      combatControlled mirarRegistered={false} onRegisterMirar={onRegisterMirar} />);
    expect(screen.getByRole('checkbox', { name: /Confirmo que fiz a ação Mirar/ })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Registrar Mirar e gastar 1 PE' }));
    expect(onRegisterMirar).toHaveBeenCalledOnce();
    view.rerender(<DisparoLetalSelector nex={40} currentPE={2} pontariaTrained
      config={config} onConfigChange={onConfigChange} variant={variant}
      combatControlled mirarRegistered onRegisterMirar={onRegisterMirar} />);
    expect(screen.getByRole('checkbox', { name: /Confirmo que fiz a ação Mirar/ })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Mirar e 1 PE registrados' })).toBeDisabled();
    // Após o débito, o bônus continua disponível mesmo com saldo zero.
    view.rerender(<DisparoLetalSelector nex={40} currentPE={0} pontariaTrained
      config={{ enabled: false, mirarDeclared: true }} onConfigChange={onConfigChange} variant={variant}
      combatControlled mirarRegistered onRegisterMirar={onRegisterMirar} />);
    expect(screen.getByRole('switch')).toBeEnabled();
  });
});
