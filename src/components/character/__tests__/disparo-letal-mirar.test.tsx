import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  calculateDisparoLetalResult,
  createEmptyDisparoLetalConfig,
  DisparoLetalSelector,
} from '../DisparoLetalSelector';

describe.each(['default', 'compact'] as const)('Disparo Letal no layout %s', variant => {
  it('exige declarar Mirar antes de oferecer o gasto e o bônus', () => {
    const onConfigChange = vi.fn();
    const initial = createEmptyDisparoLetalConfig();
    const { rerender } = render(<DisparoLetalSelector nex={40} currentPE={2} pontariaTrained
      config={initial} onConfigChange={onConfigChange} variant={variant} />);
    const toggle = screen.getByRole('switch');
    expect(toggle.hasAttribute('disabled')).toBe(true);
    expect(calculateDisparoLetalResult(40, { enabled: true, mirarDeclared: false })).toEqual({
      enabled: false, peCost: 0, criticalMarginBonus: 0,
    });

    fireEvent.click(screen.getByRole('checkbox', { name: /Confirmo que fiz a ação Mirar/ }));
    expect(onConfigChange).toHaveBeenLastCalledWith({ enabled: false, mirarDeclared: true });
    rerender(<DisparoLetalSelector nex={40} currentPE={2} pontariaTrained
      config={{ enabled: false, mirarDeclared: true }} onConfigChange={onConfigChange} variant={variant} />);
    expect(screen.getByRole('switch').hasAttribute('disabled')).toBe(false);
    fireEvent.click(screen.getByRole('switch'));
    expect(onConfigChange).toHaveBeenLastCalledWith({ enabled: true, mirarDeclared: true });
    expect(calculateDisparoLetalResult(40, { enabled: true, mirarDeclared: true })).toEqual({
      enabled: true, peCost: 1, criticalMarginBonus: 2,
    });
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
    fireEvent.click(screen.getByRole('button', { name: 'Registrar ação Mirar' }));
    expect(onRegisterMirar).toHaveBeenCalledOnce();
    view.rerender(<DisparoLetalSelector nex={40} currentPE={2} pontariaTrained
      config={config} onConfigChange={onConfigChange} variant={variant}
      combatControlled mirarRegistered onRegisterMirar={onRegisterMirar} />);
    expect(screen.getByRole('checkbox', { name: /Confirmo que fiz a ação Mirar/ })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Mirar registrado' })).toBeDisabled();
  });
});
