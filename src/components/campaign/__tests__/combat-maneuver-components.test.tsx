import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CombatManeuverAction } from '@/components/character/CombatManeuverAction';
import { CombatManeuverPanel } from '../v3/master/CombatManeuverPanel';
import {
  clearPendingManeuverResolution, loadActiveGrapples, loadRoundManeuvers,
  releaseCampaignGrapple, restorePendingManeuverResolution,
} from '@/services/campaign-combat-maneuver-service';

vi.mock('@/services/campaign-combat-maneuver-service', () => ({
  loadManeuverContext: vi.fn().mockResolvedValue({ active: true, scene: 1, round: 1,
    turnInstanceId: '10000000-0000-4000-8000-000000000005', currentActorId: 'actor' }),
  loadManeuverTargets: vi.fn().mockResolvedValue([{ id: 'target', name: 'Alvo' }]),
  loadManeuverTargetItems: vi.fn().mockResolvedValue([{ id: 'knife', name: 'Faca' }]),
  loadPendingManeuver: vi.fn().mockResolvedValue(null),
  loadRoundManeuvers: vi.fn().mockResolvedValue([]),
  loadActiveGrapples: vi.fn().mockResolvedValue([]),
  savePendingManeuver: vi.fn(), restorePendingManeuver: vi.fn().mockReturnValue(null),
  clearPendingManeuver: vi.fn(), declareManeuver: vi.fn(), cancelManeuver: vi.fn(),
  savePendingManeuverResolution: vi.fn(), restorePendingManeuverResolution: vi.fn().mockReturnValue(null),
  clearPendingManeuverResolution: vi.fn(), resolveManeuver: vi.fn(), releaseCampaignGrapple: vi.fn(),
  subscribeToManeuvers: vi.fn(() => () => undefined),
}));

afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe('controles compartilhados de manobra', () => {
  it('explica ação, oposição e adjudicação manual no jogador', async () => {
    render(<CombatManeuverAction campaignId="campaign" actorId="actor" mobile />);
    expect(await screen.findByRole('region', { name: 'Manobra de combate' })).toHaveTextContent('ação padrão');
    expect(screen.getByText(/teste oposto de Luta/i)).toBeInTheDocument();
    expect(screen.getByText(/geometria.*mestre/i)).toBeInTheDocument();
  });

  it('mostra ao mestre o estado vazio sem prometer aplicação total', async () => {
    render(<CombatManeuverPanel campaignId="campaign" scene={1} round={1} members={[]} />);
    expect(await screen.findByRole('region', { name: 'Resolver manobras' })).toHaveTextContent('Nenhuma manobra pendente');
  });

  it('permite ao mestre encerrar vínculo de Agarrar resolvido sem repetir efeito', async () => {
    vi.mocked(loadActiveGrapples).mockResolvedValueOnce([{ maneuver_operation_id: 'maneuver',
      campaign_id: 'campaign', actor_id: 'actor', target_id: 'target', active: true }]);
    vi.mocked(releaseCampaignGrapple).mockResolvedValue({ maneuver_operation_id: 'maneuver',
      campaign_id: 'campaign', actor_id: 'actor', target_id: 'target', active: false });
    render(<CombatManeuverPanel campaignId="campaign" scene={1} round={1} members={[]} />);
    const button = await screen.findByRole('button', { name: /encerrar agarrar/i });
    fireEvent.click(button);
    await waitFor(() => expect(releaseCampaignGrapple).toHaveBeenCalledWith('maneuver'));
    await waitFor(() => expect(screen.queryByRole('button', { name: /encerrar agarrar/i })).not.toBeInTheDocument());
  });

  it('permite ao jogador soltar voluntariamente o próprio Agarrar', async () => {
    vi.mocked(loadActiveGrapples).mockResolvedValueOnce([{ maneuver_operation_id: 'maneuver',
      campaign_id: 'campaign', actor_id: 'actor', target_id: 'target', active: true }]);
    vi.mocked(releaseCampaignGrapple).mockResolvedValue({ maneuver_operation_id: 'maneuver',
      campaign_id: 'campaign', actor_id: 'actor', target_id: 'target', active: false });
    render(<CombatManeuverAction campaignId="campaign" actorId="actor" />);
    fireEvent.click(await screen.findByRole('button', { name: /soltar voluntariamente/i }));
    await waitFor(() => expect(releaseCampaignGrapple).toHaveBeenCalledWith('maneuver'));
    await waitFor(() => expect(screen.queryByRole('button', { name: /soltar voluntariamente/i })).not.toBeInTheDocument());
  });

  it('permite revisar e descartar o outbox determinístico antes de criar nova resolução', async () => {
    vi.mocked(loadRoundManeuvers).mockResolvedValueOnce([{ operation_id: 'maneuver', campaign_id: 'campaign',
      scene_number: 1, round_number: 1, turn_instance_id: 'turn', actor_id: 'actor', target_id: 'target',
      maneuver_type: 'trip', weapon_id: null, attribute: 'strength', status: 'pending',
      result: null, created_at: '2026-10-28' }]);
    vi.mocked(restorePendingManeuverResolution).mockReturnValue({
      operationId: '10000000-0000-4000-8000-000000000006', maneuverId: 'maneuver',
      defenderAttribute: 'strength', attackerModifier: 0, defenderModifier: 0,
      justification: 'Contexto anterior', adjacencyConfirmed: true,
    });
    render(<CombatManeuverPanel campaignId="campaign" scene={1} round={1} members={[]} />);
    fireEvent.click(await screen.findByRole('button', { name: /revisar resolução/i }));
    expect(clearPendingManeuverResolution).toHaveBeenCalledWith('maneuver');
    expect(screen.queryByRole('button', { name: /revisar resolução/i })).not.toBeInTheDocument();
  });
});
