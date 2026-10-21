import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { CampaignMemberV2 } from '@/hooks/campaign/useCampaignData';
import { PreparedActionPanel } from '../v3/master/PreparedActionPanel';

const fake = vi.hoisted(() => ({ context: vi.fn(), actions: vi.fn(), prepare: vi.fn(), trigger: vi.fn() }));
vi.mock('@/services/campaign-attack-intent-service', async importOriginal => ({
  ...await importOriginal<typeof import('@/services/campaign-attack-intent-service')>(),
  loadAttackIntentContext: fake.context,
}));
vi.mock('@/services/campaign-prepared-action-service', async importOriginal => ({
  ...await importOriginal<typeof import('@/services/campaign-prepared-action-service')>(),
  loadPendingPreparedActions: fake.actions, prepareCharacterAction: fake.prepare,
  triggerPreparedAction: fake.trigger,
}));

const campaignId = '00000000-0000-4000-8000-000000000001';
const actorId = '00000000-0000-4000-8000-000000000002';
const otherId = '00000000-0000-4000-8000-000000000003';
const turnId = '00000000-0000-4000-8000-000000000004';
const nextTurnId = '00000000-0000-4000-8000-000000000005';
const preparedId = '00000000-0000-4000-8000-000000000006';
const members = [actorId, otherId].map((id, index): CampaignMemberV2 => ({
  id, campaign_id: campaignId, user_id: id, character_id: id, role: 'player',
  active_bonuses: null, bonuses_updated_at: null, joined_at: '2026-10-20',
  characters: { id, name: index ? 'Aliado' : 'Agente', class: 'Combatente', class_track: null,
    origin: 'Vítima', patent: 'Recruta', nex: 5, hp_current: 20, hp_max: 25,
    pe_current: 5, pe_max: 5, san_current: 10, san_max: 10, defense: 10,
    movement: 9, photo_url: null, conditions: [] },
}));

afterEach(() => { cleanup(); sessionStorage.clear(); vi.clearAllMocks(); });

describe('ações preparadas da campanha v2', () => {
  it('registra preparação sem dizer que dano ou PE foram executados', async () => {
    fake.context.mockResolvedValue({ active: true, scene: 1, round: 2, turnInstanceId: turnId, currentActorId: actorId });
    fake.actions.mockResolvedValue([]);
    fake.prepare.mockResolvedValue({ operation_id: preparedId, payload: { kind: 'prepared_action', effectApplied: false, peApplied: false } });
    render(<PreparedActionPanel campaignId={campaignId} members={members} onCombatChanged={vi.fn()} />);
    await screen.findByText(/Turno de/);
    fireEvent.change(screen.getByRole('textbox', { name: 'Descrição da ação' }), { target: { value: 'Atacar criatura' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'Gatilho declarado' }), { target: { value: 'Quando ela se aproximar' } });
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Preparar ação padrão' })); });
    expect(fake.prepare).toHaveBeenCalledWith(expect.objectContaining({
      campaignId, characterId: actorId, declaredKind: 'standard',
      actionDescription: 'Atacar criatura', triggerDescription: 'Quando ela se aproximar',
    }));
    expect(screen.getByRole('status')).toHaveTextContent('Gatilho e efeito ainda pendentes');
  });

  it('confirma gatilho em outro turno e mantém ataque, dano e PE manuais', async () => {
    fake.context.mockResolvedValue({ active: true, scene: 1, round: 2, turnInstanceId: nextTurnId, currentActorId: otherId });
    fake.actions.mockResolvedValue([{ operation_id: preparedId, campaign_id: campaignId, character_id: actorId,
      source_turn_instance_id: turnId, declared_kind: 'standard', action_description: 'Atacar criatura',
      trigger_description: 'Quando ela se aproximar', status: 'pending' }]);
    fake.trigger.mockResolvedValue({ operation_id: '00000000-0000-4000-8000-000000000007', payload: {
      kind: 'prepared_action_trigger', initiativeChanged: true, effectApplied: false, peApplied: false,
    } });
    const reload = vi.fn().mockResolvedValue(undefined);
    render(<PreparedActionPanel campaignId={campaignId} members={members} onCombatChanged={reload} />);
    await screen.findByText(/Atacar criatura/);
    fireEvent.change(screen.getByRole('textbox', { name: 'Confirmação do gatilho e execução manual' }),
      { target: { value: 'Gatilho ocorreu; ação resolvida pela mesa' } });
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Confirmar gatilho' })); });
    expect(fake.trigger).toHaveBeenCalledWith(expect.objectContaining({ preparedId, turnInstanceId: nextTurnId }));
    expect(reload).toHaveBeenCalledOnce();
    expect(screen.getByRole('status')).toHaveTextContent('Ataque, ritual, dano, PE e demais efeitos exigem resolução manual');
  });
});
