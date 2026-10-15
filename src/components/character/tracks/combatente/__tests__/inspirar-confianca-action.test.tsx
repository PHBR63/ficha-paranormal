import { fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mock = vi.hoisted(() => ({
  confirm: vi.fn(), recover: vi.fn(),
  rpc: vi.fn(async () => ({ data: [{ target_id: 'ally', target_name: 'Aliado', event_id: 'roll',
    test_label: 'Vontade', test_type: 'skill', original_total: 12, performed_at: '2026-10-15T12:00:00Z' }], error: null })),
}));
vi.mock('@/hooks/useItemSituationalAction', () => ({ useItemSituationalAction: () => ({
  busy: false, uncertain: false, error: '', receipt: null, confirm: mock.confirm, recover: mock.recover,
}) }));
vi.mock('@/hooks/character/usePETurnBudget', () => ({ usePETurnBudget: () => ({ data: {
  tracked: true, key: 'manual:test:1', remaining: 2,
}, error: null }) }));
vi.mock('@/hooks/character/useTemporaryResources', () => ({ useTemporaryResources: () => ({ pe: 0 }) }));
vi.mock('@/services/character-activity-service', () => ({ activityClient: { rpc: mock.rpc }, activityFailure: () => new Error('Falha') }));

import { InspirarConfiancaAction } from '../InspirarConfiancaAction';

function renderAction(peCurrent = 2, nex = 10) {
  const query = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={query}>
    <InspirarConfiancaAction characterId="source" peCurrent={peCurrent} nex={nex} />
  </QueryClientProvider>);
}

beforeEach(() => { mock.confirm.mockReset(); mock.rpc.mockClear(); });

describe('Inspirar Confiança', () => {
  it('exige teste, reação, alcance e oportunidade antes de pedir confirmação ao servidor', async () => {
    renderAction();
    fireEvent.click(screen.getByRole('button', { name: 'Preparar' }));
    const button = screen.getByRole('button', { name: 'Confirmar nova rolagem · 2 PE' });
    expect(button).toBeDisabled();
    fireEvent.click(await screen.findByRole('checkbox', { name: 'Selecionar teste de Aliado' }));
    fireEvent.click(screen.getByText('Tenho uma reação disponível.'));
    fireEvent.click(screen.getByText('Confirmei alcance curto com a mesa.'));
    expect(button).toBeDisabled();
    fireEvent.click(screen.getByText('Este teste acaba de ser realizado e ainda pode ser repetido.'));
    fireEvent.click(button);
    expect(mock.confirm).toHaveBeenCalledWith({ targetId: 'ally', originalEventId: 'roll',
      reactionConfirmed: true, rangeConfirmed: true, recentConfirmed: true,
      expectedPE: 2, expectedNex: 10, expectedTurnKey: 'manual:test:1' });
  });

  it('impede custo sem saldo', async () => {
    renderAction(1);
    fireEvent.click(screen.getByRole('button', { name: 'Preparar' }));
    await screen.findByRole('checkbox', { name: 'Selecionar teste de Aliado' });
    expect(screen.getByRole('button', { name: 'Confirmar nova rolagem · 2 PE' })).toBeDisabled();
    expect(mock.confirm).not.toHaveBeenCalled();
  });
});
