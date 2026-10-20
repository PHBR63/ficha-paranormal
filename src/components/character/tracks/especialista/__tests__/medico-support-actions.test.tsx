import { fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const fake = vi.hoisted(() => ({ confirm: vi.fn(), rpc: vi.fn(), budget: {
  mode: 'manual', tracked: true, key: 'manual:medico:1', remaining: 5, actorId: undefined as string | undefined,
}, medicalAction: { tracked: true, eligible: true, turnKey: 'manual:medico:1', spent: 0, extra: 0, available: 1 } }));
vi.mock('@/hooks/character/useMedicalStandardAction', () => ({
  useMedicalStandardAction: () => ({ data: fake.medicalAction, error: null }),
}));
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
import { ReanimacaoAction } from '../ReanimacaoAction';

function mount(node: React.ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{node}</QueryClientProvider>);
}

beforeEach(() => {
  fake.confirm.mockReset(); fake.rpc.mockReset();
  fake.budget.mode = 'manual'; fake.budget.key = 'manual:medico:1'; fake.budget.actorId = undefined;
  fake.budget.remaining = 5;
  fake.medicalAction.available = 1;
});

describe('Equipe de Trauma e Resgate', () => {
  it('não oferece autoaplicação nem alvo narrativo e só envia uma condição confirmada do aliado', async () => {
    const snapshot = [{ id: 'abalado', name: 'Abalado' }, { id: 'cego', name: 'Cego' }];
    fake.rpc.mockResolvedValue({ data: { eligible: true, trained: true, medicalKit: true,
      targets: [{ id: 'ally', name: 'Aliado', conditions: snapshot, conditionsSnapshot: snapshot }] }, error: null });
    mount(<EquipeTraumaAction characterId="medico" nex={40} peCurrent={5} />);
    fireEvent.click(screen.getByRole('button', { name: 'Escolher condição' }));
    expect(await screen.findByRole('option', { name: 'Aliado' })).toBeVisible();
    expect(screen.queryByRole('option', { name: /Você|narrativo/ })).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Alvo de Equipe de Trauma'), { target: { value: 'ally' } });
    fireEvent.change(screen.getByLabelText('Condição a remover'), { target: { value: 'cego' } });
    expect(screen.getByRole('button', { name: 'Remover condição · 2 PE' })).toBeDisabled();
    fireEvent.click(screen.getByText(/Confirmei com a mesa uma ação padrão disponível/));
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
    expect(await screen.findByText(/Resgate preparado fora do turno exige registro e gatilho no servidor/)).toBeVisible();
    fireEvent.change(screen.getByLabelText('Alvo de Resgate'), { target: { value: 'ally' } });
    fireEvent.click(screen.getByText('Tenho uma ação livre disponível.'));
    fireEvent.click(screen.getByText('A mesa confirmou alcance curto.'));
    fireEvent.click(screen.getByText('Posso chegar ao aliado com meu deslocamento normal.'));
    fireEvent.click(screen.getByText('A mesa confirmou que ainda não usei Resgate nesta rodada.'));
    expect(screen.getByRole('button', { name: 'Confirmar movimento' })).toBeDisabled();
  });

  it('não transforma uma declaração de Equipe de Trauma em ação preparada fora do turno', async () => {
    fake.budget.mode = 'combat'; fake.budget.key = 'v2:camp:1:2:other'; fake.budget.actorId = 'other';
    const snapshot = [{ id: 'abalado', name: 'Abalado' }];
    fake.rpc.mockResolvedValue({ data: { eligible: true, trained: true, medicalKit: true,
      targets: [{ id: 'ally', name: 'Aliado', conditions: snapshot, conditionsSnapshot: snapshot }] }, error: null });
    mount(<EquipeTraumaAction characterId="medico" nex={65} peCurrent={5} />);
    fireEvent.click(screen.getByRole('button', { name: 'Escolher condição' }));
    expect(await screen.findByText(/Equipe de Trauma é usada e cobrada quando declarada/)).toBeVisible();
    fireEvent.change(screen.getByLabelText('Alvo de Equipe de Trauma'), { target: { value: 'ally' } });
    fireEvent.change(screen.getByLabelText('Condição a remover'), { target: { value: 'abalado' } });
    fireEvent.click(screen.getByText(/Confirmei com a mesa uma ação padrão disponível/));
    fireEvent.click(screen.getByText('Confirmei com a mesa que o aliado está adjacente.'));
    expect(screen.getByRole('button', { name: 'Remover condição · 2 PE' })).toBeDisabled();
    expect(fake.confirm).not.toHaveBeenCalled();
  });
});

describe('Reanimação com morte confirmada pelo mestre', () => {
  const options = (deathId: string | null, deathCause: string | null, canConfirmDeath = false) => ({
    eligible: true, trained: true, medicalKit: true,
    campaigns: [{ id: 'camp', name: 'Campanha', sceneNumber: 3,
      canConfirmDeath, usedInScene: false,
      targets: [{ id: 'ally', name: 'Aliado', currentHp: 0, maxHp: 20, deathId, deathCause }] }],
  });

  it('mestre registra morte e causa sem cobrar PE na interface', async () => {
    fake.rpc.mockResolvedValue({ data: options(null, null, true), error: null });
    mount(<ReanimacaoAction characterId="medico" nex={99} peCurrent={12} />);
    fireEvent.click(screen.getByRole('button', { name: 'Conferir alvo' }));
    await screen.findByRole('option', { name: /Aliado/ });
    fireEvent.change(screen.getByLabelText('Alvo de Reanimação'), { target: { value: 'ally' } });
    expect(screen.getByRole('button', { name: 'Registrar morte' })).toBeDisabled();
    fireEvent.click(screen.getByText('Confirmei como mestre a morte e a causa nesta cena.'));
    fireEvent.click(screen.getByRole('button', { name: 'Registrar morte' }));
    expect(fake.confirm).toHaveBeenCalledWith(expect.objectContaining({ campaignId: 'camp', targetId: 'ally',
      cause: 'ordinary', deathConfirmed: true, expectedScene: 3, expectedTargetHp: 0 }));
    expect(screen.queryByRole('button', { name: /Reanimar · 10 PE/ })).not.toBeInTheDocument();
  });

  it('só confirma a ação completa com morte elegível, PE e orçamento do turno', async () => {
    fake.budget.remaining = 10;
    fake.rpc.mockResolvedValue({ data: options('death-op', 'ordinary'), error: null });
    mount(<ReanimacaoAction characterId="medico" nex={99} peCurrent={12} />);
    fireEvent.click(screen.getByRole('button', { name: 'Conferir alvo' }));
    await screen.findByRole('option', { name: /Aliado/ });
    fireEvent.change(screen.getByLabelText('Alvo de Reanimação'), { target: { value: 'ally' } });
    expect(screen.getByRole('button', { name: 'Reanimar · 10 PE · 1 PV' })).toBeDisabled();
    fireEvent.click(screen.getByText('Confirmei uma ação completa disponível.'));
    fireEvent.click(screen.getByRole('button', { name: 'Reanimar · 10 PE · 1 PV' }));
    expect(fake.confirm).toHaveBeenCalledWith(expect.objectContaining({ campaignId: 'camp', targetId: 'ally',
      deathId: 'death-op', expectedTargetHp: 0, expectedScene: 3, expectedPE: 12,
      expectedTurnKey: 'manual:medico:1', completeActionConfirmed: true }));
  });

  it('bloqueia dano massivo antes de enviar qualquer cobrança', async () => {
    fake.budget.remaining = 10;
    fake.rpc.mockResolvedValue({ data: options('death-op', 'massive_damage'), error: null });
    mount(<ReanimacaoAction characterId="medico" nex={99} peCurrent={12} />);
    fireEvent.click(screen.getByRole('button', { name: 'Conferir alvo' }));
    await screen.findByRole('option', { name: /Aliado/ });
    fireEvent.change(screen.getByLabelText('Alvo de Reanimação'), { target: { value: 'ally' } });
    expect(screen.getByText('Morte por dano massivo não pode receber Reanimação.')).toBeVisible();
    expect(screen.queryByRole('button', { name: /Reanimar · 10 PE/ })).not.toBeInTheDocument();
    expect(fake.confirm).not.toHaveBeenCalled();
  });
});
