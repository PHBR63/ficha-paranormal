import { fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const fake = vi.hoisted(() => ({ confirm: vi.fn(), rpc: vi.fn(), budget: {
  mode: 'manual', tracked: true, key: 'manual:medico:1', remaining: 5, actorId: undefined as string | undefined,
} }));
vi.mock('@/hooks/useItemSituationalAction', () => ({ useItemSituationalAction: () => ({
  busy: false, uncertain: false, error: '', receipt: null, confirm: fake.confirm, recover: vi.fn(),
}) }));
vi.mock('@/hooks/character/usePETurnBudget', () => ({ usePETurnBudget: () => ({
  data: fake.budget, error: null,
}) }));
vi.mock('@/hooks/character/useTemporaryResources', () => ({ useTemporaryResources: () => ({ pe: 0 }) }));
vi.mock('@/services/character-activity-service', () => ({
  activityClient: { rpc: fake.rpc }, activityFailure: (_: string, error: Error) => error,
}));

import { EquipeTraumaAction } from '../EquipeTraumaAction';
import { ResgateAction } from '../ResgateAction';

function mount(node: React.ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{node}</QueryClientProvider>);
}

beforeEach(() => {
  fake.confirm.mockReset(); fake.rpc.mockReset();
  fake.budget.mode = 'manual'; fake.budget.key = 'manual:medico:1'; fake.budget.actorId = undefined;
});

describe('Equipe de Trauma e Resgate', () => {
  it('não oferece autoaplicação nem alvo narrativo e só envia uma condição confirmada do aliado', async () => {
    const snapshot = [{ id: 'abalado', name: 'Abalado' }, { id: 'cego', name: 'Cego' }];
    fake.rpc.mockResolvedValue({ data: { eligible: true, trained: true, medicalKit: true,
      targets: [{ id: 'ally', name: 'Aliado', conditions: snapshot, conditionsSnapshot: snapshot }] }, error: null });
    mount(<EquipeTraumaAction characterId="medico" nex={40} peCurrent={5} />);
    fireEvent.click(screen.getByRole('button', { name: 'Preparar remoção' }));
    expect(await screen.findByRole('option', { name: 'Aliado' })).toBeVisible();
    expect(screen.queryByRole('option', { name: /Você|narrativo/ })).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Alvo de Equipe de Trauma'), { target: { value: 'ally' } });
    fireEvent.change(screen.getByLabelText('Condição a remover'), { target: { value: 'cego' } });
    expect(screen.getByRole('button', { name: 'Remover condição · 2 PE' })).toBeDisabled();
    fireEvent.click(screen.getByText('Confirmei uma ação padrão disponível.'));
    fireEvent.click(screen.getByText('Confirmei com a mesa que o aliado está adjacente.'));
    fireEvent.click(screen.getByRole('button', { name: 'Remover condição · 2 PE' }));
    expect(fake.confirm).toHaveBeenCalledWith(expect.objectContaining({ targetId: 'ally', conditionId: 'cego',
      expectedTargetConditions: snapshot, expectedPE: 5, expectedTurnKey: 'manual:medico:1' }));
  });

  it('bloqueia um segundo movimento de Resgate no mesmo turno controlado', async () => {
    fake.rpc.mockResolvedValue({ data: { eligible: true, trained: true, medicalKit: true, usedInCurrentControl: true,
      targets: [{ id: 'ally', name: 'Aliado', currentHp: 4, maxHp: 20 }] }, error: null });
    mount(<ResgateAction characterId="medico" nex={65} />);
    fireEvent.click(screen.getByRole('button', { name: 'Registrar movimento' }));
    expect(await screen.findByText('Resgate já registrado nesta rodada ou turno manual.')).toBeVisible();
    fireEvent.change(screen.getByLabelText('Alvo de Resgate'), { target: { value: 'ally' } });
    fireEvent.click(screen.getByText('Tenho uma ação livre disponível.'));
    fireEvent.click(screen.getByText('A mesa confirmou alcance curto.'));
    fireEvent.click(screen.getByText('Posso chegar ao aliado com meu deslocamento normal.'));
    fireEvent.click(screen.getByText('A mesa confirmou que ainda não usei Resgate nesta rodada.'));
    expect(screen.getByRole('button', { name: 'Confirmar movimento' })).toBeDisabled();
    expect(fake.confirm).not.toHaveBeenCalled();
  });

  it('mantém Resgate indisponível fora do próprio turno em combate', async () => {
    fake.budget.mode = 'combat'; fake.budget.key = 'v2:camp:1:2:other'; fake.budget.actorId = 'other';
    fake.rpc.mockResolvedValue({ data: { eligible: true, trained: true, medicalKit: true,
      usedInCurrentControl: false, targets: [{ id: 'ally', name: 'Aliado', currentHp: 4, maxHp: 20 }] }, error: null });
    mount(<ResgateAction characterId="medico" nex={65} />);
    fireEvent.click(screen.getByRole('button', { name: 'Registrar movimento' }));
    expect(await screen.findByText('Ação livre é feita no seu turno. Aguarde sua vez na rodada.')).toBeVisible();
    fireEvent.change(screen.getByLabelText('Alvo de Resgate'), { target: { value: 'ally' } });
    fireEvent.click(screen.getByText('Tenho uma ação livre disponível.'));
    fireEvent.click(screen.getByText('A mesa confirmou alcance curto.'));
    fireEvent.click(screen.getByText('Posso chegar ao aliado com meu deslocamento normal.'));
    fireEvent.click(screen.getByText('A mesa confirmou que ainda não usei Resgate nesta rodada.'));
    expect(screen.getByRole('button', { name: 'Confirmar movimento' })).toBeDisabled();
  });
});
