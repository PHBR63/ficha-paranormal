import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MobileConditionManager } from '../MobileConditionManager';
import { toast } from 'sonner';

vi.mock('sonner', () => ({ toast: { info: vi.fn(), success: vi.fn(), warning: vi.fn(), error: vi.fn() } }));

afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe('condições externas na interface mobile', () => {
  it('mostra e permite remover uma condição desconhecida sem descartar as demais', async () => {
    const known = { id: 'vulneravel', name: 'Vulnerável', turnsRemaining: null, addedAt: new Date() };
    const unknown = { id: 'mesa-42', name: 'Marca da mesa', turnsRemaining: 4, addedAt: new Date(), params: { customEffect: 'Conferir' } };
    const onChange = vi.fn();
    render(<MobileConditionManager conditions={[known, unknown]} onConditionsChange={onChange} />);
    expect(screen.getByText('Marca da mesa')).toBeTruthy();
    expect(screen.getByText(/Condição não reconhecida/)).toBeTruthy();
    expect(screen.getByText('Conferir')).toBeTruthy();
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Remover condição Marca da mesa' })); });
    expect(onChange).toHaveBeenCalledWith([known]);
  });

  it('encerra duração ao reduzir o último turno e conserva as condições permanentes', async () => {
    const permanent = { id: 'vulneravel', name: 'Vulnerável', turnsRemaining: null, addedAt: new Date() };
    const temporary = { id: 'mesa-42', name: 'Marca da mesa', turnsRemaining: 1, addedAt: new Date() };
    const onChange = vi.fn();
    render(<MobileConditionManager conditions={[permanent, temporary]} onConditionsChange={onChange} />);
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Reduzir duração de Marca da mesa' })); });
    expect(onChange).toHaveBeenCalledWith([permanent]);
  });
  it('aguarda servidor, bloqueia concorrência e mostra falha sem afirmar remoção', async () => {
    let reject!: (error: Error) => void;
    const onChange = vi.fn(() => new Promise<void>((_resolve, fail) => { reject = fail; }));
    render(<MobileConditionManager conditions={[{ id: 'mesa-42', name: 'Marca da mesa', turnsRemaining: 4, addedAt: new Date() }]}
      onConditionsChange={onChange} />);
    const remove = screen.getByRole('button', { name: 'Remover condição Marca da mesa' });
    fireEvent.click(remove);
    expect(remove).toBeDisabled();
    fireEvent.click(remove);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(toast.info).not.toHaveBeenCalled();
    await act(async () => { reject(new Error('Servidor indisponível')); });
    expect(screen.getByRole('alert')).toHaveTextContent('Servidor indisponível');
    expect(screen.getByText('Marca da mesa')).toBeInTheDocument();
    expect(toast.info).not.toHaveBeenCalled();
    expect(remove).toBeEnabled();
  });
});
