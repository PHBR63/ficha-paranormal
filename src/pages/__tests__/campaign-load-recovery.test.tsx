import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CampaignShell from '../CampaignShell';

const fake = vi.hoisted(() => ({
  refetch: vi.fn(),
  error: null as string | null,
  isRefreshing: false,
  hasCampaign: true,
}));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 'master' } }) }));
vi.mock('@/hooks/campaign/useCampaignData', () => ({ useCampaignData: () => ({
  campaign: fake.hasCampaign ? { id: 'campaign', master_id: 'master', name: 'Campanha QA' } : null,
  members: [], isMaster: true, loading: false, schemaVersion: 'v2',
  error: fake.error, isRefreshing: fake.isRefreshing, refetch: fake.refetch,
}) }));
vi.mock('@/hooks/campaign/useCampaignRealtime', () => ({ useCampaignRealtime: () => ({ messages: [], activeSession: null, markAsRead: vi.fn() }) }));
vi.mock('@/hooks/campaign/useCampaignCombat', () => ({ useCampaignCombat: () => ({}) }));
vi.mock('@/hooks/campaign/useCampaignPresence', () => ({ useCampaignPresence: () => ({ presenceMap: {}, onlineUsers: [] }) }));
vi.mock('@/hooks/campaign/useTacticalBoard', () => ({ useTacticalBoard: () => ({ maps: [] }) }));
vi.mock('@/hooks/campaign/useMasterActions', () => ({ useMasterActions: () => ({}) }));
vi.mock('@/hooks/campaign/useCampaignAudio', () => ({ useCampaignAudio: () => ({}) }));
vi.mock('@/components/campaign/v3', () => ({
  ...Object.fromEntries(['CampaignHeader', 'CampaignNavigation', 'CampaignStatusBar', 'ChatTab', 'MapTab', 'MapListTab', 'ResourcesTab', 'MasterTab'].map(name => [name, () => null])),
  PanelTab: () => <p>Fichas confirmadas</p>,
}));
vi.mock('@/components/campaign/v3/modals', () => ({ DiceRollModal: () => null, CampaignSettingsModal: () => null, QuickNotesModal: () => null }));

function campaignPage() {
  return <MemoryRouter initialEntries={['/campaigns/campaign']}><Routes><Route path="/campaigns/:id" element={<CampaignShell />} /></Routes></MemoryRouter>;
}
beforeEach(() => {
  vi.clearAllMocks(); fake.refetch.mockResolvedValue(undefined);
  fake.error = null; fake.isRefreshing = false; fake.hasCampaign = true;
});

describe('recuperação visual da campanha', () => {
  it('mostra falha de atualização e impede controles sobre dados desatualizados', () => {
    const page = render(campaignPage());
    expect(screen.getByText('Fichas confirmadas')).toBeInTheDocument();
    fake.error = 'Não foi possível carregar a campanha. Verifique a conexão e o acesso.';
    page.rerender(campaignPage());
    expect(screen.getByRole('alert')).toHaveTextContent(fake.error);
    expect(screen.queryByText('Fichas confirmadas')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Tentar carregar novamente' }));
    expect(fake.refetch).toHaveBeenCalledOnce();
    fake.isRefreshing = true;
    page.rerender(campaignPage());
    expect(screen.getByRole('button', { name: 'Atualizando campanha…' })).toBeDisabled();
    fake.error = null; fake.isRefreshing = false;
    page.rerender(campaignPage());
    expect(screen.getByText('Fichas confirmadas')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
  it('distingue falha inicial de ausência de campanha e oferece recuperação', () => {
    fake.hasCampaign = false; fake.error = 'Não foi possível carregar os membros da campanha.';
    render(campaignPage());
    expect(screen.getByRole('alert')).toHaveTextContent(fake.error);
    expect(screen.getByRole('button', { name: 'Tentar carregar novamente' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Voltar para campanhas' })).toBeInTheDocument();
  });
});
