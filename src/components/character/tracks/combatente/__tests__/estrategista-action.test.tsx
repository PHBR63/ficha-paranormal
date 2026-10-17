import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mock = vi.hoisted(() => ({
  confirm: vi.fn(), recover: vi.fn(),
  rpc: vi.fn(async (_name: string): Promise<{ data: unknown; error: null }> => ({ data: [{ id: 'ally-1', name: 'Aliado A' }, { id: 'ally-2', name: 'Aliado B' }], error: null })),
}));
vi.mock('@/hooks/useItemSituationalAction', () => ({ useItemSituationalAction: () => ({
  busy: false, uncertain: false, error: '', receipt: null, confirm: mock.confirm, recover: mock.recover,
}) }));
vi.mock('@/hooks/character/usePETurnBudget', () => ({ usePETurnBudget: () => ({ data: {
  mode: 'manual', tracked: true, key: 'manual:test:1', remaining: 2,
}, error: null }) }));
vi.mock('@/hooks/character/useTemporaryResources', () => ({ useTemporaryResources: () => ({ pe: 0 }) }));
vi.mock('@/services/character-activity-service', () => ({ activityClient: { rpc: mock.rpc }, activityFailure: () => new Error('Falha') }));

import { EstrategistaAction, EstrategistaGrantedActions } from '../EstrategistaAction';

function renderAction(intellect = 2, peCurrent = 2) {
  const query = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={query}>
    <EstrategistaAction characterId="source" nex={40} intellect={intellect} peCurrent={peCurrent} />
  </QueryClientProvider>);
}

beforeEach(() => { mock.confirm.mockReset(); mock.rpc.mockClear(); });

describe('Estrategista', () => {
  it('mostra custo por alvo e exige seleção, ação e alcance antes de cobrar', async () => {
    renderAction();
    fireEvent.click(screen.getByRole('button', { name: 'Preparar' }));
    const button = screen.getByRole('button', { name: 'Confirmar Estrategista · 0 PE' });
    expect(button).toBeDisabled();
    fireEvent.click(await screen.findByRole('checkbox', { name: 'Direcionar Aliado A' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Direcionar Aliado B' }));
    expect(screen.getByText(/2 aliado\(s\) · custo total 2 PE/)).toBeInTheDocument();
    fireEvent.click(screen.getByText(/Confirmei que há uma ação padrão disponível/));
    fireEvent.click(screen.getByText(/Confirmei com a mesa que cada aliado está em alcance curto/));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar Estrategista · 2 PE' }));
    expect(mock.confirm).toHaveBeenCalledWith(expect.objectContaining({
      targets: ['ally-1', 'ally-2'], expectedPE: 2, expectedIntellect: 2, expectedTurnKey: 'manual:test:1',
      standardActionConfirmed: true, rangeConfirmed: true,
    }));
  });

  it('bloqueia Intelecto zero e evita confirmação sem aliados', async () => {
    renderAction(0, 2);
    fireEvent.click(screen.getByRole('button', { name: 'Preparar' }));
    expect(await screen.findByRole('checkbox', { name: 'Direcionar Aliado A' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Confirmar Estrategista · 0 PE' })).toBeDisabled();
    expect(mock.confirm).not.toHaveBeenCalled();
  });
});

describe('concessão de Estrategista após mudança da iniciativa', () => {
  it('jogador vê o bloqueio sem receber o botão reservado ao mestre', async () => {
    mock.rpc.mockResolvedValue({ data: [{ operation_id: 'grant', source_name: 'Comandante', status: 'pending', granted_at: '2026-10-17',
      turn_controlled: true, review_required: true, reviewed: false, can_review: false }], error: null });
    const query = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={query}><EstrategistaGrantedActions characterId="target" /></QueryClientProvider>);
    expect(await screen.findByText(/Aguarde a confirmação do mestre/)).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Confirmar próximo turno como mestre' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Registrar uso' })).toBeDisabled();
  });
  it('bloqueia uso sem revisão e oferece confirmação só ao mestre', async () => {
    mock.rpc.mockImplementation(async (name: string) => name === 'list_character_estrategista_grants'
      ? { data: [{ operation_id: 'grant', source_name: 'Comandante', status: 'pending', granted_at: '2026-10-17',
        turn_controlled: true, review_required: true, reviewed: false, can_review: true }], error: null }
      : { data: { operation_id: 'review', character_id: 'target' }, error: null });
    const query = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={query}><EstrategistaGrantedActions characterId="target" /></QueryClientProvider>);
    expect(await screen.findByText(/Aguarde a confirmação do mestre/)).toBeVisible();
    fireEvent.click(screen.getByText('Este é meu próximo turno após a concessão.'));
    expect(screen.getByRole('button', { name: 'Registrar uso' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar próximo turno como mestre' }));
    await waitFor(() => expect(mock.rpc).toHaveBeenCalledWith('review_character_estrategista_grant',
      expect.objectContaining({ p_character_id: 'target', p_grant_operation_id: 'grant' })));
  });
});
