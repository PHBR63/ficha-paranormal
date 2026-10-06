import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CampaignScenePanel } from '../v3/CampaignScenePanel';
import { emptyCampaignCombat } from '@/lib/campaign-combat';
import type { CampaignCombatController } from '@/hooks/campaign/useCampaignCombat';

const fake = vi.hoisted(() => ({ history: vi.fn() }));
vi.mock('@/services/campaign-combat-service', () => ({ loadCampaignSceneHistory: fake.history }));

function controller(overrides: Partial<CampaignCombatController> = {}): CampaignCombatController {
  return { state: emptyCampaignCombat(), loading: false, saving: false, error: null, connected: true,
    sceneNumber: 4, lastSceneEndedAt: null, sceneEndPending: false, endScene: vi.fn().mockResolvedValue(true),
    reload: vi.fn(), update: vi.fn(), ...overrides };
}
function mount(combat: CampaignCombatController, isMaster = true, campaignId = 'campaign') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}><CampaignScenePanel campaignId={campaignId} combat={combat} isMaster={isMaster} /></QueryClientProvider>);
}
beforeEach(() => { fake.history.mockReset(); fake.history.mockResolvedValue({ entries: [], nextCursor: undefined }); });

describe('Cena, avisos e histórico visíveis', () => {
  it('jogador acompanha cena e limites manuais sem controle de encerramento', () => {
    mount(controller(), false);
    expect(screen.getByText('Cena 4')).toBeVisible();
    expect(screen.getByText(/contadores críticos ainda exigem conferência manual/)).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Encerrar cena' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Histórico de cenas' })).toBeEnabled();
  });
  it('cancelar a confirmação não grava nada', () => {
    const combat = controller();
    mount(combat);
    fireEvent.click(screen.getByRole('button', { name: 'Encerrar cena' }));
    expect(screen.getByRole('dialog', { name: 'Encerrar a cena 4?' })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(combat.endScene).not.toHaveBeenCalled();
  });
  it('confirmação sem combate envia false e só fecha após confirmação do servidor', async () => {
    let confirm: (value: boolean) => void = () => {};
    const combat = controller({ endScene: vi.fn(() => new Promise<boolean>(resolve => { confirm = resolve; })) });
    mount(combat);
    fireEvent.click(screen.getByRole('button', { name: 'Encerrar cena' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar encerramento' }));
    expect(combat.endScene).toHaveBeenCalledWith(false, 4);
    expect(screen.getByRole('dialog')).toBeVisible();
    await act(async () => { confirm(true); });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });
  it('combate ativo confirma encerramento conjunto e mantém diálogo se rejeitado', async () => {
    const combat = controller({ state: { ...emptyCampaignCombat(), active: true }, endScene: vi.fn().mockResolvedValue(false) });
    mount(combat);
    fireEvent.click(screen.getByRole('button', { name: 'Encerrar combate e cena' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar encerramento' }));
    await waitFor(() => expect(combat.endScene).toHaveBeenCalledWith(true, 4));
    expect(screen.getByRole('dialog', { name: 'Encerrar combate e cena 4?' })).toBeVisible();
  });
  it('exibe pendência após erro e oferece conferir a mesma operação', () => {
    const combat = controller({ sceneEndPending: true, error: 'Resposta não confirmada' });
    mount(combat);
    expect(screen.queryByRole('button', { name: 'Encerrar cena' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Conferir encerramento pendente' }));
    expect(combat.endScene).toHaveBeenCalledOnce();
  });
  it('confirmação aberta não muda para outra cena quando chega realtime', () => {
    const client = new QueryClient();
    const combat = controller();
    const view = render(<QueryClientProvider client={client}><CampaignScenePanel campaignId="campaign" combat={combat} isMaster /></QueryClientProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'Encerrar cena' }));
    view.rerender(<QueryClientProvider client={client}><CampaignScenePanel campaignId="campaign" combat={{ ...combat, sceneNumber: 5 }} isMaster /></QueryClientProvider>);
    expect(screen.getByRole('dialog', { name: 'Encerrar a cena 4?' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Confirmar encerramento' })).toBeDisabled();
    expect(combat.endScene).not.toHaveBeenCalled();
  });
  it('retorno realtime da própria gravação não atribui a mudança a outra aba', () => {
    const client = new QueryClient();
    const combat = controller();
    const view = render(<QueryClientProvider client={client}><CampaignScenePanel campaignId="campaign" combat={combat} isMaster /></QueryClientProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'Encerrar cena' }));
    view.rerender(<QueryClientProvider client={client}><CampaignScenePanel campaignId="campaign" combat={{ ...combat, sceneNumber: 5, saving: true, sceneEndPending: true }} isMaster /></QueryClientProvider>);
    expect(screen.getByRole('dialog', { name: 'Encerrar a cena 4?' })).toBeVisible();
    expect(screen.queryByText(/A cena ou o combate mudou em outra aba/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirmando no servidor...' })).toBeDisabled();
  });
  it('histórico paginado mantém ordem e carrega apenas cenas anteriores', async () => {
    fake.history.mockResolvedValueOnce({ entries: [{ operation_id: 'a', scene_number: 3, ended_combat: true, created_at: '2026-10-06T20:00:00Z' }], nextCursor: 3 });
    fake.history.mockResolvedValueOnce({ entries: [{ operation_id: 'b', scene_number: 2, ended_combat: false, created_at: '2026-10-06T19:00:00Z' }], nextCursor: undefined });
    mount(controller());
    fireEvent.click(screen.getByRole('button', { name: 'Histórico de cenas' }));
    expect(await screen.findByText('Cena 3 encerrada com o combate')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Carregar cenas anteriores' }));
    expect(await screen.findByText('Cena 2 encerrada manualmente')).toBeVisible();
    expect(fake.history).toHaveBeenLastCalledWith('campaign', 3);
  });
  it('falha de histórico mostra aviso e permite recuperar sem fingir lista vazia', async () => {
    fake.history.mockRejectedValueOnce(new Error('offline'));
    mount(controller());
    fireEvent.click(screen.getByRole('button', { name: 'Histórico de cenas' }));
    expect(await screen.findByText('Não foi possível carregar o histórico de cenas.')).toBeVisible();
    expect(screen.queryByText('Nenhuma cena encerrada ainda.')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Tentar carregar histórico novamente' }));
    expect(await screen.findByText('Nenhuma cena encerrada ainda.')).toBeVisible();
  });
});
