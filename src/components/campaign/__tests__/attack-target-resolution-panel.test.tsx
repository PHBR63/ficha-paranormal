import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { CampaignMemberV2 } from '@/hooks/campaign/useCampaignData';
import { AttackTargetResolutionPanel } from '../v3/master/AttackTargetResolutionPanel';

const fake = vi.hoisted(() => ({ intents: vi.fn(), choices: vi.fn(), resolved: vi.fn(), event: vi.fn(), confirm: vi.fn() }));
vi.mock('@/services/campaign-attack-intent-service', async importOriginal => ({
  ...await importOriginal<typeof import('@/services/campaign-attack-intent-service')>(),
  loadRoundAttackIntents: fake.intents, loadRoundDefenseChoices: fake.choices,
}));
vi.mock('@/services/campaign-attack-target-service', async importOriginal => ({
  ...await importOriginal<typeof import('@/services/campaign-attack-target-service')>(),
  loadResolvedAttackIds: fake.resolved, loadAttackEvent: fake.event, confirmAttackTarget: fake.confirm,
}));

const campaignId = '00000000-0000-4000-8000-000000000001';
const attackerId = '00000000-0000-4000-8000-000000000002';
const targetA = '00000000-0000-4000-8000-000000000003';
const targetB = '00000000-0000-4000-8000-000000000004';
const attackA = '00000000-0000-4000-8000-000000000005';
const attackB = '00000000-0000-4000-8000-000000000006';
const intents = [targetA, targetB].map((targetId, index) => ({
  operation_id: `00000000-0000-4000-8000-00000000001${index}`, campaign_id: campaignId,
  attacker_id: attackerId, target_id: targetId, attack_event_id: index ? attackB : attackA,
  scene_number: 1, round_number: 2, status: 'rolled', melee: true,
}));
const members = [attackerId, targetA, targetB].map((id, index): CampaignMemberV2 => ({
  id, campaign_id: campaignId, user_id: id, character_id: id, role: 'player',
  active_bonuses: null, bonuses_updated_at: null, joined_at: '2026-10-20',
  characters: { id, name: ['Atacante', 'Alvo A', 'Alvo B'][index], class: 'Combatente', class_track: null,
    origin: 'Vítima', patent: 'Recruta', nex: 5, hp_current: index ? 20 : 25, hp_max: 25,
    pe_current: 5, pe_max: 5, san_current: 10, san_max: 10, defense: 10,
    movement: 9, photo_url: null, conditions: [] },
}));

afterEach(() => { cleanup(); sessionStorage.clear(); vi.clearAllMocks(); });

describe('resolução do ataque contra alvo v2', () => {
  it('limpa Defesa, dano e reduções ao trocar de ataque e alvo', async () => {
    fake.intents.mockResolvedValue(intents);
    fake.choices.mockResolvedValue(intents.map(intent => ({ intent_id: intent.operation_id, defense_type: 'none' })));
    fake.resolved.mockResolvedValue([]);
    fake.event.mockImplementation(async id => ({ payload: { entry: { total: id === attackA ? 17 : 22 } } }));
    render(<AttackTargetResolutionPanel campaignId={campaignId} scene={1} round={2} members={members} />);
    const attackSelect = await screen.findByRole('combobox', { name: 'Ataque para resolver' });
    await screen.findByRole('option', { name: /Alvo B/ });
    fireEvent.change(attackSelect, { target: { value: attackA } });
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Defesa final' }), { target: { value: '19' } });
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Dano rolado' }), { target: { value: '12' } });
    fireEvent.change(screen.getByRole('spinbutton', { name: 'RD' }), { target: { value: '4' } });
    fireEvent.change(screen.getByRole('combobox', { name: 'Tipo de dano' }), { target: { value: 'fogo' } });
    fireEvent.change(screen.getByRole('textbox', { name: /Justificativa/ }), { target: { value: 'Armadura' } });
    fireEvent.change(attackSelect, { target: { value: attackB } });
    expect(screen.getByRole('spinbutton', { name: 'Defesa final' })).toHaveValue(10);
    expect(screen.getByRole('spinbutton', { name: 'Dano rolado' })).toHaveValue(0);
    expect(screen.getByRole('spinbutton', { name: 'RD' })).toHaveValue(0);
    expect(screen.getByRole('combobox', { name: 'Tipo de dano' })).toHaveValue('impacto');
    expect(screen.getByRole('textbox', { name: /Justificativa/ })).toHaveValue('');
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Confirmar resultado e aplicar PV' })); });
    expect(fake.confirm).toHaveBeenCalledWith(expect.objectContaining({
      targetCharacterId: targetB, attackEventId: attackB,
      resolution: expect.objectContaining({ defenseTotal: 10, grossDamage: 0, damageReduction: 0, damageType: 'impacto' }),
    }));
  });
});
