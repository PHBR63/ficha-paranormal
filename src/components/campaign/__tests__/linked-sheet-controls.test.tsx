import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MasterTab } from '../v3/tabs/MasterTab';
import { PlayerControlCard } from '../v3/master/PlayerControlCard';
import type { CampaignMemberV2 } from '@/hooks/campaign/useCampaignData';
import type { CampaignCombatController } from '@/hooks/campaign/useCampaignCombat';

// Ferramentas de outras abas e histórico não participam deste fluxo de ajuste.
vi.mock('@/components/character/CharacterActivityPanel', () => ({ CharacterActivityPanel: () => null }));
vi.mock('../v3/master/MasterQuickActions', () => ({ MasterQuickActions: () => null }));
vi.mock('../v3/master/CombatTracker', () => ({ CombatTracker: () => null }));
vi.mock('../v3/master/BulkDamageModal', () => ({ BulkDamageModal: () => null }));
vi.mock('../v3/master/AudioControlPanel', () => ({ AudioControlPanel: () => null }));
vi.mock('@/components/campaign/master', () => ({ NPCManager: () => null }));
vi.mock('@/components/campaign/chat', () => ({ MacrosPanel: () => null }));
vi.mock('@/components/campaign/master/HandoutsManager', () => ({ HandoutsManager: () => null }));
vi.mock('@/components/campaign/MemberBonusesPanel', () => ({ MemberBonusesPanel: () => null }));

const member: CampaignMemberV2 = {
  id: 'member', campaign_id: 'campaign', user_id: 'owner', character_id: 'sheet',
  role: 'master', active_bonuses: null, bonuses_updated_at: null, joined_at: '2026-10-06',
  characters: {
    id: 'sheet', name: 'Ficha vinculada', class: 'Combatente', class_track: null,
    origin: 'Vítima', patent: 'Recruta', nex: 5, hp_current: 20, hp_max: 20,
    pe_current: 10, pe_max: 10, san_current: 15, san_max: 15, defense: 10,
    movement: 9, photo_url: null, conditions: [],
  },
};
afterEach(cleanup);

describe('Controles individuais das fichas vinculadas', () => {
  it.each(['master', 'player'] as const)('inclui ficha de %s e encaminha ajuste de SAN para seu ID', async role => {
    const onModifySAN = vi.fn().mockResolvedValue(true);
    render(<MasterTab members={[{ ...member, role }, { ...member, id: 'empty', characters: null }]}
      campaignId="campaign" combat={{} as CampaignCombatController} combatAvailable={false} onModifySAN={onModifySAN} />);
    expect(screen.getByRole('tab', { name: 'Fichas' })).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { name: 'Ficha vinculada' })).toHaveLength(1);
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'SAN: reduzir 1' })); });
    expect(onModifySAN).toHaveBeenCalledExactlyOnceWith('sheet', -1);
  });

  it('apresenta ausência de fichas sem inventar controles', () => {
    render(<MasterTab members={[{ ...member, characters: null }]} campaignId="campaign"
      combat={{} as CampaignCombatController} combatAvailable={false} />);
    expect(screen.getByText('Nenhuma ficha vinculada à campanha')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'SAN: ajustar quantidade' })).not.toBeInTheDocument();
  });

  it('bloqueia duplicação enquanto aguarda e mantém a entrada após recusa', async () => {
    let finish!: (confirmed: boolean) => void;
    const onModifySAN = vi.fn(() => new Promise<boolean>(resolve => { finish = resolve; }));
    render(<PlayerControlCard member={member} onModifySAN={onModifySAN} />);
    fireEvent.click(screen.getByRole('button', { name: 'SAN: ajustar quantidade' }));
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Ajuste de SAN' }), { target: { value: '-7' } });
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar ajuste de SAN' }));
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar ajuste de SAN' }));
    expect(onModifySAN).toHaveBeenCalledExactlyOnceWith('sheet', -7);
    expect(screen.getByRole('spinbutton', { name: 'Ajuste de SAN' })).toBeDisabled();
    await act(async () => { finish(false); });
    expect(screen.getByRole('alert')).toHaveTextContent('Alteração não confirmada');
    expect(screen.getByRole('spinbutton', { name: 'Ajuste de SAN' })).toHaveValue(-7);
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Aplicar ajuste de SAN' })); });
    await act(async () => { finish(true); });
    expect(screen.queryByRole('spinbutton', { name: 'Ajuste de SAN' })).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it.each(['-1.5', '0', '', '1000001'])('recusa entrada %s sem truncar ou chamar o servidor', async value => {
    const onModifySAN = vi.fn();
    render(<PlayerControlCard member={member} onModifySAN={onModifySAN} />);
    fireEvent.click(screen.getByRole('button', { name: 'SAN: ajustar quantidade' }));
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Ajuste de SAN' }), { target: { value } });
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Aplicar ajuste de SAN' })); });
    expect(onModifySAN).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('ajuste inteiro');
    expect(screen.getByRole('spinbutton', { name: 'Ajuste de SAN' })).toBeInTheDocument();
  });

  it('mostra falha de conexão e libera controles para conferência/retry', async () => {
    render(<PlayerControlCard member={member} onModifySAN={vi.fn().mockRejectedValue(new Error('connection failed'))} />);
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'SAN: reduzir 1' })); });
    expect(screen.getByRole('alert')).toHaveTextContent('Alteração não confirmada');
    expect(screen.getByRole('button', { name: 'SAN: reduzir 1' })).toBeEnabled();
  });
});
