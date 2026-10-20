import { fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ComputedEffects } from '@/hooks';

const mock = vi.hoisted(() => ({
  confirm: vi.fn(), recover: vi.fn(),
  status: { eligible: true, trained: true, medicalKit: true, maxExtraDice: 1,
    originBonus: 2, targets: [{ id: 'ally', name: 'Aliado', currentHp: 4, maxHp: 20 }] },
  rpc: vi.fn(),
  medicalAction: { tracked: true, eligible: true, turnKey: 'manual:test:1', spent: 0, extra: 0, available: 1 },
}));
vi.mock('@/hooks/character/useMedicalStandardAction', () => ({
  useMedicalStandardAction: () => ({ data: mock.medicalAction, error: null }),
}));
vi.mock('@/hooks/useItemSituationalAction', () => ({ useItemSituationalAction: () => ({
  busy: false, uncertain: false, error: '', receipt: null, confirm: mock.confirm, recover: mock.recover,
}) }));
vi.mock('@/hooks/character/usePETurnBudget', () => ({ usePETurnBudget: () => ({ data: {
  mode: 'manual', tracked: true, key: 'manual:test:1', remaining: 4,
}, error: null }) }));
vi.mock('@/hooks/character/useTemporaryResources', () => ({ useTemporaryResources: () => ({ pe: 0 }) }));
vi.mock('@/services/character-activity-service', () => ({ activityClient: { rpc: mock.rpc }, activityFailure: () => new Error('Falha') }));

import { ParamedicoAction } from '../ParamedicoAction';
import { MedicoDeCampoPanel } from '../MedicoDeCampoPanel';

function renderAction(peCurrent = 4) {
  const query = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={query}>
    <ParamedicoAction characterId="source" characterName="Médica" currentHp={8} maxHp={20}
      nex={40} peCurrent={peCurrent} />
  </QueryClientProvider>);
}

beforeEach(() => {
  mock.confirm.mockReset();
  mock.rpc.mockImplementation(async () => ({ data: mock.status, error: null }));
  mock.status.trained = true; mock.status.medicalKit = true;
  mock.medicalAction.available = 1;
});

describe('Paramédico confirmado no servidor', () => {
  it('não oferece cura sem Medicina treinada ou kit específico', async () => {
    mock.status.trained = false; mock.status.medicalKit = false;
    renderAction();
    fireEvent.click(screen.getByRole('button', { name: 'Preparar cura' }));
    expect(await screen.findByText(/necessário ser treinado em Medicina/)).toBeVisible();
    expect(screen.getByText(/kit identificado como de Medicina/)).toBeVisible();
    expect(screen.getByRole('button', { name: 'Confirmar cura · 2 PE' })).toBeDisabled();
  });

  it('cobra dados extras só na confirmação e exige adjacência do aliado', async () => {
    renderAction();
    fireEvent.click(screen.getByRole('button', { name: 'Preparar cura' }));
    await screen.findByRole('option', { name: /Aliado/ });
    fireEvent.change(screen.getByLabelText('Alvo do Paramédico'), { target: { value: 'ally' } });
    fireEvent.change(screen.getByLabelText('Dados extras de Paramédico'), { target: { value: '1' } });
    fireEvent.click(screen.getByText(/Confirmei com a mesa uma ação padrão disponível/));
    expect(screen.getByRole('button', { name: 'Confirmar cura · 3 PE' })).toBeDisabled();
    fireEvent.click(screen.getByText('Confirmei com a mesa que o aliado está adjacente.'));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar cura · 3 PE' }));
    expect(mock.confirm).toHaveBeenCalledWith(expect.objectContaining({ targetId: 'ally', extraDice: 1,
      expectedPE: 4, expectedNex: 40, expectedTargetHP: 4, expectedTurnKey: 'manual:test:1',
      standardActionConfirmed: true, adjacencyConfirmed: true }));
  });

  it('respeita o saldo atualizado antes de confirmar', async () => {
    renderAction(1);
    fireEvent.click(screen.getByRole('button', { name: 'Preparar cura' }));
    expect(await screen.findByText(/PE insuficiente para esta cura/)).toBeVisible();
    expect(screen.getByRole('button', { name: 'Confirmar cura · 2 PE' })).toBeDisabled();
    expect(mock.confirm).not.toHaveBeenCalled();
  });

  it('não confirma segunda cura médica sem ação padrão extra registrada', async () => {
    mock.medicalAction.available = 0;
    renderAction();
    fireEvent.click(screen.getByRole('button', { name: 'Preparar cura' }));
    expect(await screen.findByText(/ação padrão médica deste turno já foi usada/)).toBeVisible();
    fireEvent.click(screen.getByText(/Confirmei com a mesa uma ação padrão disponível/));
    expect(screen.getByRole('button', { name: 'Confirmar cura · 2 PE' })).toBeDisabled();
    expect(mock.confirm).not.toHaveBeenCalled();
  });

  it('preserva a preparação aberta quando o painel da ficha atualiza', async () => {
    const query = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const props = { characterId: 'source', characterName: 'Médica', classTrack: 'medico-campo',
      nex: 10, peCurrent: 4, pvCurrent: 8, pvMax: 20, onPEChange: vi.fn() };
    const view = render(<QueryClientProvider client={query}><MedicoDeCampoPanel {...props} /></QueryClientProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'Preparar cura' }));
    expect(await screen.findByLabelText('Alvo do Paramédico')).toBeVisible();
    view.rerender(<QueryClientProvider client={query}><MedicoDeCampoPanel {...props} peCurrent={3} /></QueryClientProvider>);
    expect(screen.getByLabelText('Alvo do Paramédico')).toBeVisible();
  });

  it('só anuncia a Defesa de Resgate quando o NEX libera Resgate', () => {
    const query = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const props = { characterId: 'source', classTrack: 'medico-campo', nex: 40, peCurrent: 4,
      onPEChange: vi.fn(), computedEffects: { support: { onHealEffects: [] } } as unknown as ComputedEffects };
    const view = render(<QueryClientProvider client={query}><MedicoDeCampoPanel {...props} /></QueryClientProvider>);
    expect(screen.queryByText('Bônus de Suporte (SUE)')).not.toBeInTheDocument();
    view.rerender(<QueryClientProvider client={query}><MedicoDeCampoPanel {...props} nex={65} /></QueryClientProvider>);
    expect(screen.getByText('Bônus de Suporte (SUE)')).toBeVisible();
  });
});
