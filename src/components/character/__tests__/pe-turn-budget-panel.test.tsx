import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PETurnBudgetPanel } from '../PETurnBudgetPanel';
const fake = vi.hoisted(() => ({ mode: 'manual', pause: vi.fn(), begin: vi.fn(), turn: vi.fn(), refetch: vi.fn() }));
vi.mock('@/hooks/character/usePETurnBudget', () => ({ usePETurnBudget: () => ({
  data: { mode: fake.mode, tracked: fake.mode !== 'untracked', number: 2, round: 1, spent: 1, limit: 4, ritualLimit: 4 },
  error: null, isLoading: false, refetch: fake.refetch,
}) }));
vi.mock('@/services/pe-turn-budget-service', () => ({ pauseManualTurn: fake.pause }));
vi.mock('@/services/sustained-ritual-service', () => ({ beginManualTurn: fake.begin, getRitualTurn: fake.turn }));
afterEach(cleanup);
beforeEach(() => {
  vi.resetAllMocks(); fake.mode = 'manual'; fake.turn.mockResolvedValue({ mode: 'manual', number: 2 });
  fake.refetch.mockResolvedValue({ error: null }); fake.pause.mockResolvedValue({}); fake.begin.mockResolvedValue({});
});
describe('controle manual do orçamento', () => {
  it('cancelar pausa preserva controle e não envia operação', async () => {
    render(<PETurnBudgetPanel characterId="sheet" />);
    fireEvent.click(screen.getByText('Pausar controle manual'));
    await screen.findByText('Pausar controle manual?');
    expect(fake.pause).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('Cancelar'));
    expect(fake.pause).not.toHaveBeenCalled();
  });
  it('recupera pausa incerta com o mesmo UUID e turno', async () => {
    fake.pause.mockRejectedValueOnce(new Error('Resposta incerta')).mockResolvedValueOnce({});
    render(<PETurnBudgetPanel characterId="sheet" />);
    fireEvent.click(screen.getByText('Pausar controle manual'));
    fireEvent.click(await screen.findByText('Confirmar'));
    fireEvent.click(await screen.findByText('Recuperar mesma operação'));
    await waitFor(() => expect(fake.pause).toHaveBeenCalledTimes(2));
    expect(fake.pause.mock.calls[0]).toEqual(fake.pause.mock.calls[1]);
    expect(fake.pause.mock.calls[0]).toEqual(['sheet', expect.any(String), 2]);
  });
  it('início exige confirmação e combate ativo não oferece controles manuais', async () => {
    fake.mode = 'untracked';
    const view = render(<PETurnBudgetPanel characterId="sheet" />);
    fireEvent.click(screen.getByText('Iniciar ou avançar turno manual'));
    await screen.findByText('Confirmar novo turno manual?');
    expect(fake.begin).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('Confirmar'));
    await waitFor(() => expect(fake.begin).toHaveBeenCalledWith('sheet', expect.any(String), 2));
    view.unmount(); fake.mode = 'combat'; render(<PETurnBudgetPanel characterId="sheet" />);
    expect(screen.queryByText('Iniciar ou avançar turno manual')).not.toBeInTheDocument();
    expect(screen.queryByText('Pausar controle manual')).not.toBeInTheDocument();
  });
});
