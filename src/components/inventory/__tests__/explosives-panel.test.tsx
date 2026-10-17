import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
const state = vi.hoisted(() => ({ mode: 'smoke', mineDetonated: false, master: true, confirm: vi.fn() }));
vi.mock('@/hooks/useItemSituationalAction', () => ({ useItemSituationalAction: () => ({ confirm: state.confirm, busy: false, uncertain: false, error: '', receipt: null }) }));
vi.mock('@/hooks/useFragmentationContext', () => ({ useFragmentationContext: () => ({ refetch: vi.fn(), data: { master: state.master, candidates: [], explosions: [{ id: 'event', payload: { point: 'QA', explosiveType: state.mode, stage: state.mode === 'mine' && !state.mineDetonated ? 'installed' : 'active', remainingRounds: state.mode === 'stun' ? 1 : 2, dt: state.mode === 'smoke' ? null : 14, maxExcludedTargets: 0, areaConfirmed: true, result: { total: 0, dice: [] }, installation: state.mode === 'mine' ? { total: 20, passed: true, dice: [15] } : null }, targets: state.mode === 'mine' ? [] : [{ id: 'target', name: 'Alvo QA', hp: 20, conditions: [], applied: false }] }] } }) }));
import { ExplosivesPanel } from '../ExplosivesPanel';
const props = { characterId: 'source', inventory: [], onRefetch: vi.fn() };
beforeEach(() => { state.mode = 'smoke'; state.mineDetonated = false; state.master = true; state.confirm.mockReset(); });
const select = () => fireEvent.change(screen.getByRole('combobox', { name: 'Explosões registradas — 30 por página' }), { target: { value: 'event' } });
describe('Explosivos: requisitos antes da confirmação', () => {
  it('fumaça não inventa resistência ou dano para aplicar as condições', () => {
    render(<ExplosivesPanel {...props} />); select();
    expect(screen.queryByRole('spinbutton', { name: /Total de/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Conferi resistência, bônus, imunidades e aplicação neste alvo.'));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar e aplicar condições' }));
    expect(state.confirm).toHaveBeenCalledWith(expect.objectContaining({ resistanceTotal: 0, damageReduction: 0, expectedConditions: [] }));
  });
  it('não avança a rodada por seleção, refresh ou sem confirmação', () => {
    state.mode = 'stun'; render(<ExplosivesPanel {...props} />); select();
    const button = screen.getByRole('button', { name: 'Confirmar passagem de uma rodada' });
    expect(button).toBeDisabled(); expect(state.confirm).not.toHaveBeenCalled();
    fireEvent.click(screen.getByLabelText('Conferi que uma rodada completa desta duração transcorreu.')); fireEvent.click(button);
    expect(state.confirm).toHaveBeenCalledWith(expect.objectContaining({ action: 'advance', expectedRounds: 1 }));
  });
  it('dono da ficha pode detonar a mina instalada somente após conferir alcance e ação', () => {
    state.mode = 'mine'; state.master = false; render(<ExplosivesPanel {...props} />); select();
    expect(screen.getByText(/a detonação exige o turno ativo do personagem/)).toBeInTheDocument();
    const button = screen.getByRole('button', { name: 'Confirmar detonação remota' });
    expect(button).toBeDisabled();
    fireEvent.click(screen.getByLabelText('Conferi a ação padrão e estar em alcance longo da mina.')); fireEvent.click(button);
    expect(state.confirm).toHaveBeenCalledWith(expect.objectContaining({ action: 'detonate', requirementsConfirmed: true }));
    expect(screen.queryByRole('button', { name: 'Confirmar alvos no servidor' })).not.toBeInTheDocument();
  });
  it('avisa que arremesso e instalação exigem o turno ativo no combate v2', () => {
    render(<ExplosivesPanel {...props} inventory={[{ id: 'grenade', name: 'Granada QA', catalogId: 'granada_fumaca', catalogType: 'explosivo', quantity: 1 }]} />);
    expect(screen.getByText(/o servidor exige o turno ativo deste personagem para arremessar ou instalar/)).toBeInTheDocument();
  });
  it('explica que detonar a mina ainda não aplica PV sem confirmação do mestre', () => {
    state.mode = 'mine'; state.mineDetonated = true; state.master = false;
    render(<ExplosivesPanel {...props} />); select();
    expect(screen.getByText(/Nenhum PV é alterado apenas pela detonação/)).toBeInTheDocument();
  });
});
