import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { BonusSummary } from '@/hooks/useBonusSummaryFromSUE';
const state = vi.hoisted(() => ({ busy: false, uncertain: false, error: '', receipt: null, confirm: vi.fn(), recover: vi.fn() }));
vi.mock('@/hooks/useItemSituationalAction', () => ({ useItemSituationalAction: () => state }));
import { PostAttackStealthPanel } from '../PostAttackStealthPanel';
const props = { characterId: 'sheet', inventory: [{ id: 'gun', name: 'Pistola QA', itemType: 'weapon', catalogId: 'pistola', appliedModifications: ['silenciador'] }],
  agility: 2, skills: {}, conditions: [], conditionIds: [], summary: { skills: {} } as BonusSummary, onRefetch: vi.fn() };
const choose = () => fireEvent.change(screen.getByRole('combobox', { name: 'Arma usada neste turno' }), { target: { value: 'gun' } });
const confirm = () => fireEvent.click(screen.getByLabelText('Conferi fim do turno, ação livre, esconderijo possível e os ataques e movimentos declarados com a mesa.'));
beforeEach(() => { state.confirm.mockReset(); state.recover.mockReset(); state.busy = false; state.uncertain = false; });
describe('Furtividade após ataque', () => {
  it('exige arma e confirmação e separa movimento dos bônus', () => {
    render(<PostAttackStealthPanel {...props} />);
    expect(screen.getByRole('button', { name: 'Rolar Furtividade após atacar' })).toBeDisabled();
    choose(); confirm();
    fireEvent.click(screen.getByRole('button', { name: 'Rolar Furtividade após atacar' }));
    expect(state.confirm).toHaveBeenCalledWith(expect.objectContaining({ fullMovement: false, otherLoudAction: false, otherBonuses: 0, dicePenalty: 0, requirementsConfirmed: true }));
    expect(screen.getByText(/Penalidade situacional: −1d20/)).toBeInTheDocument();
  });
  it('mudar contexto exige nova confirmação e não concede ocultação automática', () => {
    render(<PostAttackStealthPanel {...props} />); choose(); confirm();
    fireEvent.click(screen.getByLabelText('Também fiz outra ação chamativa ou ataque com outra arma.'));
    expect(screen.getByRole('button', { name: 'Rolar Furtividade após atacar' })).toBeDisabled();
    expect(screen.getByText(/Penalidade situacional: −3d20/)).toBeInTheDocument();
    expect(screen.getByText(/Outra ação chamativa impede aplicar a redução do Silenciador/)).toBeInTheDocument();
    expect(screen.getByText(/Em combate v2, o servidor exige um ataque registrado neste turno/)).toBeInTheDocument();
    expect(screen.getByText(/Percepção oposta de cada observador fica pendente/)).toBeInTheDocument();
  });
  it('resposta incerta congela contexto e recupera a mesma tentativa', () => {
    state.uncertain = true; render(<PostAttackStealthPanel {...props} />);
    expect(screen.getByRole('combobox')).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Recuperar o mesmo teste' }));
    expect(state.recover).toHaveBeenCalledOnce(); expect(state.confirm).not.toHaveBeenCalled();
  });
});
