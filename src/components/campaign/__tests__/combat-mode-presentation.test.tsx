import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { CampaignMemberV2 } from '@/hooks/campaign/useCampaignData';
import type { CampaignCombatController } from '@/hooks/campaign/useCampaignCombat';
import type { TacticalBoardReturn } from '@/hooks/campaign/useTacticalBoard';
import type { CombatState } from '@/lib/game-engine';
import { CampaignCombatTab } from '../tabs/CampaignCombatTab';
import { CombatTracker as SyncedCombatTracker } from '../v3/master/CombatTracker';

vi.mock('@/components/combat/CombatTracker', () => ({ CombatTracker: () => <div>Painel local</div> }));
vi.mock('@/components/combat/IntegratedCombatBoard', () => ({ IntegratedCombatBoard: () => null }));
vi.mock('../v3/CampaignScenePanel', () => ({ CampaignScenePanel: () => null }));
vi.mock('../v3/master/MedicalExtraActionGrant', () => ({ MedicalExtraActionGrant: () => null }));

const member: CampaignMemberV2 = {
  id: 'member', campaign_id: 'campaign', user_id: 'player', character_id: 'sheet',
  role: 'player', active_bonuses: null, bonuses_updated_at: null, joined_at: '2026-10-20',
  characters: {
    id: 'sheet', name: 'Agente', class: 'Combatente', class_track: null,
    origin: 'Vítima', patent: 'Recruta', nex: 5, hp_current: 12, hp_max: 25,
    pe_current: 5, pe_max: 5, san_current: 10, san_max: 10, defense: 10,
    movement: 9, photo_url: null, conditions: [],
  },
};

const combat = {
  state: { active: true, round: 1, currentTurnIndex: 0, combatants: [
    { id: 'sheet', name: 'Agente', initiative: 10, hpCurrent: 25, hpMax: 25 },
  ] },
  loading: false, saving: false, error: null, connected: true,
  sceneNumber: 1, lastSceneEndedAt: null, sceneEndPending: false,
  update: vi.fn(), reload: vi.fn(), endScene: vi.fn(),
} as unknown as CampaignCombatController;

afterEach(cleanup);

describe('Apresentação do combate por versão da campanha', () => {
  it('explica que o painel v1 é manual e não persiste turnos nem PV', () => {
    render(<CampaignCombatTab campaignId="campaign" isMaster board={{} as TacticalBoardReturn}
      combatState={{} as CombatState} onCombatUpdate={vi.fn()} />);
    expect(screen.getByRole('complementary', { name: 'Controle manual do combate' }))
      .toHaveTextContent('se perdem ao recarregar');
  });

  it('mostra os PV atuais da ficha v2 e acompanha mudanças recebidas dos membros', () => {
    const { rerender } = render(<SyncedCombatTracker campaignId="campaign" members={[member]} combat={combat} />);
    expect(screen.getByText('PV 12/25')).toBeInTheDocument();
    expect(screen.queryByText('PV 25/25')).not.toBeInTheDocument();

    rerender(<SyncedCombatTracker campaignId="campaign" members={[{
      ...member, characters: { ...member.characters!, hp_current: 7 },
    }]} combat={combat} />);
    expect(screen.getByText('PV 7/25')).toBeInTheDocument();

    rerender(<SyncedCombatTracker campaignId="campaign" members={[]} combat={combat} />);
    expect(screen.queryByText(/PV \d+\/25/)).not.toBeInTheDocument();
  });
});
