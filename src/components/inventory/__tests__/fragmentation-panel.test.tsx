import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
const mocks = vi.hoisted(() => ({ confirm: vi.fn(), master: true }));
vi.mock('@/hooks/useItemSituationalAction', () => ({ useItemSituationalAction: () => ({ confirm: mocks.confirm, busy: false, uncertain: false, error: '', receipt: null }) }));
vi.mock('@/hooks/useFragmentationContext', () => ({ useFragmentationContext: () => ({ refetch: vi.fn(), data: { master: mocks.master, candidates: [{ id: 'target', name: 'Alvo QA', hp: 20 }], explosions: [{ id: 'explosion', payload: { point: 'Centro', dt: 14, maxExcludedTargets: 0, result: { total: 25, dice: [3,3,3,3,3,3,3,4] } }, targets: [] }] } }) }));
import { FragmentationPanel } from '../FragmentationPanel';
const props = { characterId: 'source', inventory: [{ id: 'grenade', name: 'Fragmentação', catalogType: 'explosivo', catalogId: 'granada_fragmentacao', quantity: 1, uses: 1 }], onRefetch: vi.fn() };
beforeEach(() => { mocks.master = true; mocks.confirm.mockReset(); });
describe('Fragmentação: confirmação antes de efeitos', () => {
  it('não consome sem item, ponto e confirmação dos requisitos', () => {
    render(<FragmentationPanel {...props} />);
    const button = screen.getByRole('button', { name: 'Confirmar arremesso e consumir uma granada' });
    expect(button).toBeDisabled();
    fireEvent.change(screen.getByRole('combobox', { name: 'Granada de Fragmentação' }), { target: { value: 'grenade' } });
    fireEvent.change(screen.getByLabelText('Ponto de impacto'), { target: { value: 'Porta' } });
    expect(button).toBeDisabled();
    fireEvent.click(screen.getByLabelText(/Conferi empunhadura/));
    fireEvent.click(button);
    expect(mocks.confirm).toHaveBeenCalledWith(expect.objectContaining({ point: 'Porta', item: props.inventory[0], requirementsConfirmed: true }));
    expect(screen.queryByText(/dano confirmado no servidor/)).not.toBeInTheDocument();
  });
  it('jogador não recebe controles de aprovação e aplicação', () => {
    mocks.master = false; render(<FragmentationPanel {...props} />);
    fireEvent.change(screen.getByLabelText('Explosões registradas — 30 por página'), { target: { value: 'explosion' } });
    expect(screen.getByText(/O mestre confirma os alvos/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Confirmar alvos no servidor' })).not.toBeInTheDocument();
  });
  it('bloqueia excluir alvo quando não há Perito em Explosivos', () => {
    render(<FragmentationPanel {...props} />);
    fireEvent.change(screen.getByLabelText('Explosões registradas — 30 por página'), { target: { value: 'explosion' } });
    fireEvent.change(screen.getByLabelText('Área para Alvo QA'), { target: { value: 'excluded' } });
    fireEvent.click(screen.getByLabelText(/Conferi a área de 6 m/));
    expect(screen.getByRole('button', { name: 'Confirmar alvos no servidor' })).toBeDisabled();
    expect(mocks.confirm).not.toHaveBeenCalled();
  });
});
