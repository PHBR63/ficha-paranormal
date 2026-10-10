import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RitualCastModal } from '../RitualCastModal';
import { MobileRitualCastModal } from '../mobile/MobileRitualCastModal';
import { getRitualById } from '@/lib/rituals/ritual-registry';
import type { RitualSituationalContext } from '@/lib/rituals/situational-requirements';
vi.mock('@/hooks', async () => await import('@/hooks/useRitualValidation'));
vi.mock('canvas-confetti', () => ({ default: vi.fn() }));
afterEach(() => { cleanup(); vi.useRealTimers(); });
const context: RitualSituationalContext = { characterId: '00000000-0000-4000-8000-000000000001', ritualId: 'amaldicoar-arma-sangue', execution: 'Padrão', source: 'memorized', grimoireItems: [{ id: 'book', name: 'Grimório' }], bladeAvailable: true, bladeEligible: false, bladeKnowledge: 'unverified', canReview: false };
describe.each([['desktop', RitualCastModal], ['mobile', MobileRitualCastModal]] as const)('Requisitos situacionais %s', (_name, Modal) => {
  const props = { open: true, onOpenChange: vi.fn(), ritual: getRitualById(context.ritualId)!, peCurrent: 50, peMax: 50, nex: 99, onConfirm: vi.fn() };
  const confirmGeneral = () => fireEvent.click(screen.getByRole('checkbox', { name: /Conferi gestos/ }));
  const cast = () => screen.getByRole('button', { name: /conjurar/i });
  it('bloqueia fonte legada, consulta indisponível e item ausente sem enviar', () => {
    const onConfirm = vi.fn();
    const view = render(<Modal {...props} onConfirm={onConfirm} context={{ ...context, source: 'unverified' }} />);
    confirmGeneral(); expect(cast()).toBeDisabled();
    view.rerender(<Modal {...props} onConfirm={onConfirm} loading context={context} />);
    expect(cast()).toBeDisabled();
    view.rerender(<Modal {...props} onConfirm={onConfirm} error="Servidor indisponível" context={context} />);
    expect(cast()).toBeDisabled();
    view.rerender(<Modal {...props} onConfirm={onConfirm} context={{ ...context, source: 'grimoire', grimoireItems: [] }} />);
    expect(cast()).toBeDisabled(); expect(screen.getByText(/Grimório Vivo não substitui/)).toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();
  });
  it('exige seleção, empunhar e consulta separada; não cobra PE pela leitura', async () => {
    vi.useFakeTimers(); const onConfirm = vi.fn().mockResolvedValue(false);
    const view = render(<Modal {...props} onConfirm={onConfirm} context={{ ...context, source: 'grimoire' }} />);
    confirmGeneral();
    fireEvent.change(screen.getByRole('combobox', { name: 'Grimório utilizado' }), { target: { value: 'book' } });
    fireEvent.click(screen.getByRole('checkbox', { name: /Estou empunhando/ }));
    expect(cast()).toBeDisabled();
    fireEvent.click(screen.getByRole('checkbox', { name: /Já gastei uma ação completa/ }));
    expect(cast()).toBeEnabled(); fireEvent.click(cast());
    await act(async () => { await vi.advanceTimersByTimeAsync(400); });
    expect(onConfirm).toHaveBeenCalledWith(props.ritual, 1, [], [], undefined, expect.objectContaining({ situational: { grimoireItemId: 'book', grimoireHeld: true, grimoireRead: true, costBeforeBlade: 1 } }));
    expect(screen.getByText(/Depois, use a execução própria/)).toBeInTheDocument();
    view.rerender(<Modal {...props} context={{ ...context, source: 'grimoire', characterId: '00000000-0000-4000-8000-000000000002' }} />);
    expect(screen.getByRole('checkbox', { name: /Estou empunhando/ })).not.toBeChecked();
    expect(cast()).toBeDisabled();
  });
  it('não libera movimento por Lâmina Maldita sem conferência histórica', () => {
    render(<Modal {...props} context={context} />); confirmGeneral();
    expect(screen.queryByRole('checkbox', { name: /Gastar \+1 PE/ })).not.toBeInTheDocument();
    expect(cast()).toBeEnabled();
    expect(screen.getByText(/execução padrão continua/)).toBeInTheDocument();
  });
  it('oferece movimento desmarcado e inclui adicional apenas na opção confirmada', async () => {
    vi.useFakeTimers(); const onConfirm = vi.fn().mockResolvedValue(false);
    render(<Modal {...props} onConfirm={onConfirm} context={{ ...context, bladeEligible: true, bladeKnowledge: 'confirmed' }} />);
    confirmGeneral(); const movement = screen.getByRole('checkbox', { name: /Gastar \+1 PE/ });
    expect(movement).not.toBeChecked(); fireEvent.click(movement); fireEvent.click(cast());
    await act(async () => { await vi.advanceTimersByTimeAsync(400); });
    expect(onConfirm).toHaveBeenCalledWith(props.ritual, 2, [], [], undefined, expect.objectContaining({ situational: { bladeMovement: true, costBeforeBlade: 1 } }));
    expect(props.onOpenChange).not.toHaveBeenCalled();
  });
  it('permite ao mestre corrigir conferência negativa sem gasto de recursos', async () => {
    const onReview = vi.fn().mockResolvedValue(true);
    render(<Modal {...props} context={{ ...context, canReview: true, bladeKnowledge: 'absent' }} onReview={onReview} />);
    fireEvent.click(screen.getByRole('button', { name: /Conferência do mestre:/ }));
    fireEvent.click(screen.getByRole('checkbox', { name: /Confirmo que este Amaldiçoar/ }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Registro da conferência' }), { target: { value: 'Ficha anterior conferida pelo mestre.' } });
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Confirmar conferência histórica' })));
    expect(onReview).toHaveBeenCalledWith({ source: 'memorized', knownBeforeBlade: true, note: 'Ficha anterior conferida pelo mestre.' });
  });
});
