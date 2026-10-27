import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { CampaignMemberV2 } from '@/hooks/campaign/useCampaignData';
import { CampaignBulkDamageError } from '@/services/campaign-bulk-damage-service';
import { BulkDamageModal } from '../v3/master/BulkDamageModal';

const fake = vi.hoisted(() => ({ confirm: vi.fn() }));
vi.mock('@/services/campaign-bulk-damage-service', async importOriginal => ({
  ...await importOriginal<typeof import('@/services/campaign-bulk-damage-service')>(),
  confirmCampaignBulkDamage: fake.confirm,
}));

const campaignId = '00000000-0000-4000-8000-000000000001';
const characterId = '00000000-0000-4000-8000-000000000002';
const members: CampaignMemberV2[] = [{
  id: characterId, campaign_id: campaignId, user_id: characterId,
  character_id: characterId, role: 'player', active_bonuses: null,
  bonuses_updated_at: null, joined_at: '2026-10-20',
  characters: {
    id: characterId, name: 'Agente QA', class: 'Combatente', class_track: null,
    origin: 'Vítima', patent: 'Recruta', nex: 5, hp_current: 20, hp_max: 25,
    pe_current: 5, pe_max: 5, san_current: 10, san_max: 10, defense: 10,
    movement: 9, photo_url: null, conditions: [],
  },
}];

afterEach(() => { cleanup(); sessionStorage.clear(); vi.clearAllMocks(); });

describe('dano em área sincronizado', () => {
  it('repete o mesmo UUID e payload após resposta incerta e mostra o recibo final', async () => {
    fake.confirm.mockRejectedValueOnce(new CampaignBulkDamageError('Confirmação incerta.', false));
    fake.confirm.mockImplementationOnce(async request => ({
      operationId: request.operationId, campaignId, source: 'Explosão', targets: [{
        characterId, eventId: '00000000-0000-4000-8000-000000000003',
        grossDamage: 12, declaredResistedDamage: 6, declaredDamageReduction: 2,
        immuneDamage: false, vulnerableDamage: false, damageAfterVulnerability: 6,
        finalDamage: 4, temporaryHPUsed: 0, hpBefore: 20, hpAfter: 16,
      }],
    }));
    const modal = render(<BulkDamageModal open onOpenChange={vi.fn()} members={members}
      onApplyDamage={vi.fn()} canApply={false} serverCampaignId={campaignId} />);

    fireEvent.change(screen.getByRole('textbox', { name: 'Origem do dano' }), { target: { value: 'Explosão' } });
    fireEvent.click(screen.getByRole('checkbox', { name: /Agente QA/ }));
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Dano bruto' }), { target: { value: '12' } });
    fireEvent.change(screen.getByRole('combobox', { name: 'Tipo' }), { target: { value: 'fogo' } });
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Dano resistido' }), { target: { value: '6' } });
    fireEvent.change(screen.getByRole('spinbutton', { name: 'RD' }), { target: { value: '2' } });

    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Confirmar dano/ })); });
    expect(screen.getByRole('alert')).toHaveTextContent('Confirmação incerta');
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled();
    expect(screen.getByRole('textbox', { name: 'Origem do dano' })).toBeDisabled();
    const persistedRequest = fake.confirm.mock.calls[0][0];
    modal.unmount();
    render(<BulkDamageModal open onOpenChange={vi.fn()} members={members}
      onApplyDamage={vi.fn()} canApply={false} serverCampaignId={campaignId} />);
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Recuperar confirmação' })).toBeEnabled();

    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Recuperar confirmação' })); });
    expect(fake.confirm).toHaveBeenCalledTimes(2);
    expect(fake.confirm.mock.calls[1][0]).toEqual(persistedRequest);
    expect(fake.confirm.mock.calls[0][0]).toEqual({
      operationId: expect.any(String), campaignId, source: 'Explosão', targets: [{
        characterId, damage: 12, damageType: 'fogo', resistedDamage: 6,
        damageReduction: 2, immuneDamage: false, vulnerableDamage: false, expectedHp: 20,
      }],
    });
    expect(screen.getByRole('status')).toHaveTextContent('Dano confirmado em 1 ficha(s)');
    expect(screen.getByRole('status')).toHaveTextContent('20 → 16 PV');
  });

  it('rejeição definitiva não mostra sucesso e libera revisão sem repetir o pedido inválido', async () => {
    fake.confirm.mockRejectedValueOnce(new CampaignBulkDamageError('PV mudou.', true));
    render(<BulkDamageModal open onOpenChange={vi.fn()} members={members}
      onApplyDamage={vi.fn()} canApply={false} serverCampaignId={campaignId} />);
    fireEvent.change(screen.getByRole('textbox', { name: 'Origem do dano' }), { target: { value: 'Estilhaços' } });
    fireEvent.click(screen.getByRole('checkbox', { name: /Agente QA/ }));
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Dano bruto' }), { target: { value: '8' } });
    fireEvent.change(screen.getByRole('combobox', { name: 'Tipo' }), { target: { value: 'corte' } });
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Confirmar dano/ })); });
    expect(screen.getByRole('alert')).toHaveTextContent('PV mudou');
    expect(screen.queryByText(/Dano confirmado em/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeEnabled();
    expect(screen.getByRole('spinbutton', { name: 'Dano bruto' })).toBeEnabled();
    expect(sessionStorage.getItem(`ordem-roll:bulk-damage:${campaignId}`)).toBeNull();
  });

  it('mostra a ordem oficial de vulnerabilidade e desmarca imunidade', async () => {
    render(<BulkDamageModal open onOpenChange={vi.fn()} members={members}
      onApplyDamage={vi.fn()} canApply={false} serverCampaignId={campaignId} />);
    fireEvent.click(screen.getByRole('checkbox', { name: /Agente QA/ }));
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Dano bruto' }), { target: { value: '12' } });
    fireEvent.change(screen.getByRole('combobox', { name: 'Tipo' }), { target: { value: 'fogo' } });
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Dano resistido' }), { target: { value: '6' } });
    fireEvent.change(screen.getByRole('spinbutton', { name: 'RD' }), { target: { value: '2' } });
    fireEvent.click(screen.getByRole('checkbox', { name: 'Imune ao dano' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Vulnerável ao tipo de dano' }));
    expect(screen.getByRole('checkbox', { name: 'Imune ao dano' })).not.toBeChecked();
    expect(screen.getByText(/Após resistência: 6; vulnerabilidade ×2; Dano final após RD: 10/)).toBeInTheDocument();
  });
});
