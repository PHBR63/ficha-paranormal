import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MobileDiceRollModal } from '../MobileDiceRollModal';

vi.mock('canvas-confetti', () => ({ default: vi.fn() }));
beforeEach(() => { vi.useFakeTimers(); vi.spyOn(Math, 'random').mockReturnValue(0.45); });
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); });
const sources = [{ label: 'Treinamento', type: 'skill' as const, value: 5 }, { label: 'Poder', type: 'power' as const, value: 5 }];
const attack = { id: 'ataque-especial', name: 'Ataque Especial', description: 'Ataque/dano', peCost: 2, effect: '+5 ataque', effectType: 'combat_bonus' as const, icon: 'sword' as const };
const ecletico = { id: 'ecletico-veterano', name: 'Eclético (Veterano)', description: 'Treinamento temporário', peCost: 4, effect: '+10 veterano', effectType: 'skill_trained' as const, icon: 'zap' as const };

describe('modal mobile realmente utilizado pela ficha', () => {
  it('Iniciativa 5+5 separa origens, exclui Ataque Especial e identifica fechar', async () => {
    const complete = vi.fn(); const pe = vi.fn(); const close = vi.fn();
    render(<MobileDiceRollModal open onClose={close} label="Iniciativa" attributeValue={1} skillBonus={10}
      bonusSources={sources} peCurrent={10} activatablePowers={[attack]} onPEChange={pe} onRollComplete={complete} />);
    expect(screen.queryByText('Ataque Especial')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /ROLAR DADOS/ }));
    await act(async () => { vi.advanceTimersByTime(800); });
    expect(complete.mock.calls[0][0]).toMatchObject({ skillBonus: 5, otherBonuses: 5, total: 20 });
    expect(pe).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Fechar rolagem' }));
    expect(close).toHaveBeenCalledTimes(1);
  });
  it('requisito e aplicação de Eclético usam treinamento real, preservando poder externo', async () => {
    const complete = vi.fn(); const pe = vi.fn().mockResolvedValue(true);
    render(<MobileDiceRollModal open onClose={() => undefined} label="Iniciativa" attributeValue={1} skillBonus={10}
      bonusSources={sources} peCurrent={10} activatablePowers={[attack, ecletico]} onPEChange={pe} onRollComplete={complete} />);
    expect(screen.getByText('Eclético (Veterano)')).toBeTruthy();
    fireEvent.click(screen.getByRole('switch'));
    fireEvent.click(screen.getByRole('button', { name: /ROLAR DADOS/ }));
    await act(async () => { vi.advanceTimersByTime(800); });
    expect(complete.mock.calls[0][0]).toMatchObject({ skillBonus: 10, otherBonuses: 5, total: 25 });
    expect(pe).toHaveBeenCalledExactlyOnceWith(6);
  });
  it('aguarda PE e permite repetir a confirmação sem sortear outra rolagem', async () => {
    let resolve!: (value: boolean) => void;
    const pe = vi.fn().mockImplementationOnce(() => new Promise<boolean>(done => { resolve = done; })).mockResolvedValueOnce(true);
    const complete = vi.fn();
    render(<MobileDiceRollModal open onClose={() => undefined} label="Iniciativa" attributeValue={1} skillBonus={10}
      bonusSources={sources} peCurrent={10} activatablePowers={[ecletico]} onPEChange={pe} onRollComplete={complete} />);
    fireEvent.click(screen.getByRole('switch'));
    fireEvent.click(screen.getByRole('button', { name: /ROLAR DADOS/ }));
    await act(async () => { vi.advanceTimersByTime(800); });
    expect(complete).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Fechar rolagem' }).hasAttribute('disabled')).toBe(true);
    await act(async () => { resolve(false); });
    expect(screen.getByRole('alert').textContent).toContain('não foi confirmado');
    expect(complete).not.toHaveBeenCalled();
    const randomCalls = vi.mocked(Math.random).mock.calls.length;
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'TENTAR CONFIRMAÇÃO' })); });
    expect(vi.mocked(Math.random).mock.calls.length).toBe(randomCalls);
    expect(pe.mock.calls).toEqual([[6], [6]]);
    expect(complete).toHaveBeenCalledTimes(1);
  });
  it('considera o custo das ativações já escolhidas antes de permitir outro poder', () => {
    render(<MobileDiceRollModal open onClose={() => undefined} label="Iniciativa" attributeValue={1} skillBonus={10}
      bonusSources={sources} peCurrent={5} activatablePowers={[ecletico,
        { id: 'outro-bonus', name: 'Outro bônus', description: 'Outro custo', peCost: 2, effect: '+1', effectType: 'skill_trained', icon: 'zap' }]} />);
    const switches = screen.getAllByRole('switch');
    fireEvent.click(switches[0]);
    expect(switches[1].hasAttribute('disabled')).toBe(true);
  });
  it.each([true, false, new Error('Conexão perdida')])('cancelamento externo não apresenta resultado antigo após reabrir (resposta PE=%s)', async accepted => {
    let resolve!: (value: boolean) => void;
    let reject!: (cause: Error) => void;
    const pe = vi.fn(() => new Promise<boolean>((done, fail) => { resolve = done; reject = fail; }));
    const complete = vi.fn();
    const modal = (open: boolean) => <MobileDiceRollModal open={open} onClose={() => undefined} label="Iniciativa"
      attributeValue={1} skillBonus={10} bonusSources={sources} peCurrent={10} activatablePowers={[ecletico]}
      onPEChange={pe} onRollComplete={complete} />;
    const view = render(modal(true));
    fireEvent.click(screen.getByRole('switch'));
    fireEvent.click(screen.getByRole('button', { name: /ROLAR DADOS/ }));
    await act(async () => { vi.advanceTimersByTime(800); });
    view.rerender(modal(false));
    await act(async () => { if (accepted instanceof Error) reject(accepted); else resolve(accepted); });
    expect(complete).not.toHaveBeenCalled();
    view.rerender(modal(true));
    expect(screen.queryByText(/Cálculo:/)).toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByRole('button', { name: /ROLAR DADOS/ })).toBeTruthy();
  });
});
