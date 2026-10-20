import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const fake = vi.hoisted(() => ({ confirm: vi.fn(), manualConfirm: vi.fn(), rpc: vi.fn(), receipt: null as null | { id: string },
  budget: { mode: 'combat', actorId: 'doctor', key: 'v2:campaign:1:1:doctor' } }));
vi.mock('@/hooks/useItemSituationalAction', () => ({ useItemSituationalAction: (_: unknown, __: unknown, rpcName: string) => ({
  busy: false, uncertain: false, error: '', receipt: fake.receipt,
  confirm: rpcName === 'confirm_character_resgate_manual_review' ? fake.manualConfirm : fake.confirm,
  recover: vi.fn(),
}) }));
vi.mock('@/hooks/character/usePETurnBudget', () => ({ usePETurnBudget: () => ({ data: fake.budget }) }));
vi.mock('@/services/character-activity-service', () => ({
  activityClient: { rpc: fake.rpc }, activityFailure: (_: string, error: Error) => error,
}));

import { ResgateOtherSourceReview } from '../ResgateOtherSourceReview';

function mount() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}><ResgateOtherSourceReview characterId="doctor" /></QueryClientProvider>);
}

beforeEach(() => {
  fake.confirm.mockReset(); fake.manualConfirm.mockReset(); fake.rpc.mockReset(); fake.receipt = null;
  fake.budget.mode = 'combat'; fake.budget.actorId = 'doctor'; fake.budget.key = 'v2:campaign:1:1:doctor';
});

describe('revisão de outras fontes de Resgate', () => {
  it('exige escolha e atribuição explícita pelo mestre', async () => {
    fake.rpc.mockResolvedValue({ data: { canReview: true, events: [{ id: 'source', targetId: 'ally',
      targetName: 'Aliado', effect: 'PV 10 → 15', createdAt: '2026-10-19T12:00:00Z' }] }, error: null });
    mount();
    const button = await screen.findByRole('button', { name: 'Conceder +5 Defesa' });
    expect(button).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Efeito para Resgate'), { target: { value: 'source' } });
    expect(button).toBeDisabled();
    fireEvent.click(screen.getByText('Confirmei como mestre que o médico causou esse efeito no aliado.'));
    fireEvent.click(button);
    expect(fake.confirm).toHaveBeenCalledWith({ sourceEventId: 'source', targetId: 'ally',
      expectedTurnKey: 'v2:campaign:1:1:doctor', masterConfirmed: true });
  });

  it('não oferece a confirmação para quem não é mestre', async () => {
    fake.rpc.mockResolvedValue({ data: { canReview: false, events: [] }, error: null });
    mount();
    await waitFor(() => expect(fake.rpc).toHaveBeenCalledWith('get_character_resgate_review_options',
      { p_character_id: 'doctor' }));
    expect(screen.queryByRole('button', { name: 'Conceder +5 Defesa' })).not.toBeInTheDocument();
  });

  it('atribui no turno manual com campanha e sem acionar a revisão de combate', async () => {
    fake.budget.mode = 'manual'; fake.budget.key = 'manual:doctor:2';
    fake.rpc.mockResolvedValue({ data: { canReview: true, events: [{ id: 'source', targetId: 'ally',
      targetName: 'Aliado', effect: 'PV 10 → 15', createdAt: '2026-10-20T12:00:00Z',
      campaignId: 'campaign', campaignVersion: 'v2' }] }, error: null });
    mount();
    const button = await screen.findByRole('button', { name: 'Conceder +5 Defesa' });
    fireEvent.change(screen.getByLabelText('Efeito para Resgate'), { target: { value: 'source' } });
    fireEvent.click(screen.getByText('Confirmei como mestre que o médico causou esse efeito no aliado.'));
    fireEvent.click(button);
    expect(fake.manualConfirm).toHaveBeenCalledWith({ sourceEventId: 'source', targetId: 'ally',
      campaignId: 'campaign', campaignVersion: 'v2', expectedTurnKey: 'manual:doctor:2',
      masterConfirmed: true });
    expect(fake.confirm).not.toHaveBeenCalled();
  });
});
