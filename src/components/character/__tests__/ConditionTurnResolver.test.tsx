import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ConditionTurnResolver } from '../ConditionTurnResolver';
import type { ActiveCondition } from '../ConditionManager';

const conditions: ActiveCondition[] = [{ id:'sangrando',name:'Sangrando',turnsRemaining:null,addedAt:'2026-10-06' }];
afterEach(() => vi.restoreAllMocks());
const preview = () => {
  fireEvent.click(screen.getByRole('button', { name:'Resolver início de turno' }));
  fireEvent.click(screen.getByRole('button', { name:'Preparar testes e dados' }));
};
describe('Confirmação de início de turno', () => {
  it('prévia e cancelamento não alteram recursos', () => {
    vi.spyOn(Math,'random').mockReturnValue(.5);
    const prepare = vi.fn(); render(<ConditionTurnResolver conditions={conditions} vigor={1} prepareApplication={prepare} />);
    preview(); expect(screen.getByText(/total 11 contra DT 20/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name:'Cancelar' })); expect(prepare).not.toHaveBeenCalled();
  });
  it('falha não informa sucesso; retry usa o mesmo pedido e os mesmos dados', async () => {
    const random = vi.spyOn(Math,'random').mockReturnValue(.5);
    const apply = vi.fn().mockRejectedValueOnce(new Error('Sem conexão')).mockResolvedValue(undefined);
    const prepare = vi.fn(() => apply);
    render(<ConditionTurnResolver conditions={conditions} vigor={1} prepareApplication={prepare} />);
    preview(); fireEvent.click(screen.getByRole('button', { name:'Confirmar efeitos na ficha' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Sem conexão');
    expect(screen.queryByText('Efeitos confirmados e registrados no histórico da ficha.')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name:'Repetir a mesma confirmação' }));
    await screen.findByText('Efeitos confirmados e registrados no histórico da ficha.');
    expect(prepare).toHaveBeenCalledTimes(1); expect(apply).toHaveBeenCalledTimes(2); expect(random).toHaveBeenCalledTimes(2);
  });
  it('ignora clique duplicado e impede cancelamento enquanto aguarda o servidor', async () => {
    vi.spyOn(Math,'random').mockReturnValue(.5);
    let resolve!: () => void; const apply = vi.fn(() => new Promise<void>(r => {resolve=r;}));
    render(<ConditionTurnResolver conditions={conditions} vigor={1} prepareApplication={() => apply} />);
    preview(); const button = screen.getByRole('button', { name:'Confirmar efeitos na ficha' });
    fireEvent.click(button); fireEvent.click(button);
    expect(apply).toHaveBeenCalledTimes(1); expect(screen.getByRole('button',{ name:'Cancelar' })).toBeDisabled();
    await act(async () => resolve()); await screen.findByText('Efeitos confirmados e registrados no histórico da ficha.');
  });
  it('congela a ficha e o preparador na abertura do diálogo', async () => {
    vi.spyOn(Math,'random').mockReturnValue(.5);
    const first = vi.fn(() => vi.fn().mockResolvedValue(undefined)); const other = vi.fn();
    const view = render(<ConditionTurnResolver conditions={conditions} vigor={1} prepareApplication={first} />);
    fireEvent.click(screen.getByRole('button',{ name:'Resolver início de turno' }));
    view.rerender(<ConditionTurnResolver conditions={[]} vigor={5} prepareApplication={other} />);
    fireEvent.click(screen.getByRole('button',{ name:'Preparar testes e dados' }));
    fireEvent.click(screen.getByRole('button',{ name:'Confirmar efeitos na ficha' }));
    await waitFor(() => expect(first).toHaveBeenCalledOnce()); expect(other).not.toHaveBeenCalled();
  });
});
