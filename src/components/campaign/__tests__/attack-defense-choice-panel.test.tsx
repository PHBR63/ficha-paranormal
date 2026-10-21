import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { CampaignMemberV2 } from '@/hooks/campaign/useCampaignData';
import { AttackDefenseChoicePanel } from '../v3/master/AttackDefenseChoicePanel';

const fake = vi.hoisted(() => ({ intents: vi.fn(), choices: vi.fn(), confirm: vi.fn() }));
vi.mock('@/services/campaign-attack-intent-service', async importOriginal => ({
  ...await importOriginal<typeof import('@/services/campaign-attack-intent-service')>(),
  loadRoundAttackIntents: fake.intents, loadRoundDefenseChoices: fake.choices,
  confirmDefenseChoice: fake.confirm,
}));
const campaignId = '00000000-0000-4000-8000-000000000001';
const attackerId = '00000000-0000-4000-8000-000000000002';
const targetId = '00000000-0000-4000-8000-000000000003';
const intentId = '00000000-0000-4000-8000-000000000004';
const members = [attackerId, targetId].map((id, index): CampaignMemberV2 => ({
  id, campaign_id: campaignId, user_id: id, character_id: id, role: 'player',
  active_bonuses: null, bonuses_updated_at: null, joined_at: '2026-10-20',
  characters: { id, name: index ? 'Alvo' : 'Atacante', class: 'Combatente', class_track: null,
    origin: 'Vítima', patent: 'Recruta', nex: 5, hp_current: 20, hp_max: 25,
    pe_current: 5, pe_max: 5, san_current: 10, san_max: 10, defense: 10,
    movement: 9, photo_url: null, conditions: [] },
}));

afterEach(() => { cleanup(); sessionStorage.clear(); vi.clearAllMocks(); });

describe('escolha de defesa antes da rolagem', () => {
  it('registra nenhuma defesa e libera rolagem apenas após confirmação', async () => {
    fake.intents.mockResolvedValue([{ operation_id: intentId, attacker_id: attackerId, target_id: targetId, status: 'pending', melee: false }]);
    fake.choices.mockResolvedValueOnce([]).mockResolvedValueOnce([{ operation_id: '00000000-0000-4000-8000-000000000005', intent_id: intentId, defense_type: 'none' }]);
    fake.confirm.mockResolvedValue({ operation_id: '00000000-0000-4000-8000-000000000005', intent_id: intentId, defense_type: 'none' });
    render(<AttackDefenseChoicePanel campaignId={campaignId} scene={1} round={2} members={members} />);
    await screen.findByRole('button', { name: 'Sem defesa especial' });
    expect(screen.getByRole('button', { name: 'Bloqueio' })).toBeDisabled();
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Sem defesa especial' })); });
    expect(fake.confirm).toHaveBeenCalledWith(expect.objectContaining({ intentId, defenseType: 'none' }));
    expect(screen.getByRole('status')).toHaveTextContent('Atacante liberado para rolar');
  });
});
