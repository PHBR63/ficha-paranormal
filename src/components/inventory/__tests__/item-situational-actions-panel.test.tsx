import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { BonusSummary } from '@/hooks/useBonusSummaryFromSUE';
const state = vi.hoisted(() => ({ busy: false, uncertain: false, error: '', receipt: null, confirm: vi.fn(), recover: vi.fn() }));
vi.mock('@/hooks/useItemSituationalAction', () => ({ useItemSituationalAction: () => state }));
vi.mock('../PostAttackStealthPanel', () => ({ PostAttackStealthPanel: () => null }));
import { ItemSituationalActionsPanel } from '../ItemSituationalActionsPanel';

const props = { characterId: 'ficha', agility: 0, skills: {}, conditions: [], conditionIds: [],
  summary: { skills: {} } as BonusSummary, onRefetch: vi.fn(),
  inventory: [{ id: 'arma', name: 'Arma QA', itemType: 'weapon', isEquipped: false, appliedModifications: ['discreta_firearm', 'tatica_firearm'] }],
};
function select(label: string, option: string) {
  fireEvent.click(screen.getByRole('combobox', { name: label }));
  fireEvent.click(screen.getByRole('option', { name: option }));
}
afterEach(cleanup);
beforeEach(() => { state.busy = false; state.uncertain = false; state.error = ''; state.confirm.mockReset(); state.recover.mockReset(); });
describe('painel de ocultação e saque', () => {
  it('exige selecionar item e confirmar requisitos; explica oposição', () => {
    render(<ItemSituationalActionsPanel {...props} />);
    expect(screen.getByRole('button', { name: 'Rolar ocultação e registrar' })).toBeDisabled();
    select('Item para ocultação ou saque', 'Arma QA');
    expect(screen.getByText(/permite ocultar somente este item sem treino/)).toBeVisible();
    expect(screen.getByText(/não garante que o item foi ocultado/)).toBeVisible();
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: 'Rolar ocultação e registrar' }));
    expect(state.confirm).toHaveBeenCalledWith(expect.objectContaining({ action: 'conceal', expectedAgility: 0, requirementsConfirmed: true, otherBonuses: 0 }));
  });
  it('não libera Crime genérico sem treino', () => {
    render(<ItemSituationalActionsPanel {...props} inventory={[{ ...props.inventory[0], appliedModifications: [] }]} />);
    select('Item para ocultação ou saque', 'Arma QA'); fireEvent.click(screen.getByRole('checkbox'));
    expect(screen.getByRole('button', { name: 'Rolar ocultação e registrar' })).toBeDisabled();
  });
  it('mostra Tática livre, mas guardar movimento', () => {
    render(<ItemSituationalActionsPanel {...props} />);
    select('Item para ocultação ou saque', 'Arma QA'); select('Ação do item', 'Sacar arma');
    expect(screen.getByText(/Ação livre/)).toBeVisible();
    select('Ação do item', 'Guardar arma'); expect(screen.getByText(/Ação movimento/)).toBeVisible();
    expect(screen.getByRole('button', { name: 'Confirmar guardar no servidor' })).toBeDisabled();
  });
  it('resposta incerta congela escolhas e oferece recuperar a tentativa', () => {
    state.uncertain = true; state.error = 'Sem confirmação.';
    render(<ItemSituationalActionsPanel {...props} />);
    expect(screen.getByRole('combobox', { name: 'Ação do item' })).toBeDisabled();
    expect(screen.getByRole('alert')).toHaveTextContent('Sem confirmação.');
    expect(screen.getByRole('button', { name: 'Recuperar a mesma tentativa' })).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: 'Recuperar a mesma tentativa' }));
    expect(state.recover).toHaveBeenCalledTimes(1);
  });
  it('mantém recuperação quando o item desapareceu após resposta incerta', () => {
    state.uncertain = true; render(<ItemSituationalActionsPanel {...props} inventory={[]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Recuperar a mesma tentativa' }));
    expect(state.recover).toHaveBeenCalledTimes(1);
  });
  it('não cria controles para itens sem identidade ou sem uso suportado', () => {
    render(<ItemSituationalActionsPanel {...props} inventory={[{ name: 'Legado', itemType: 'weapon' }]} />);
    expect(screen.queryByRole('region')).toBeNull(); expect(screen.queryByText('Ocultação e saque de itens')).toBeNull();
  });
});
