import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { CampaignMemberV2 } from '@/hooks/campaign/useCampaignData';
import { BulkDamageModal } from '../v3/master/BulkDamageModal';
import { applyDamagePerCharacter } from '@/lib/campaign-bulk-damage';

const members = ['a', 'b'].map((id): CampaignMemberV2 => ({
  id, campaign_id: 'campaign', user_id: id, character_id: id, role: 'player',
  active_bonuses: null, bonuses_updated_at: null, joined_at: '2026-10-20',
  characters: {
    id, name: `Agente ${id}`, class: 'Combatente', class_track: null,
    origin: 'Vítima', patent: 'Recruta', nex: 5, hp_current: 20, hp_max: 25,
    pe_current: 5, pe_max: 5, san_current: 10, san_max: 10, defense: 10,
    movement: 9, photo_url: null, conditions: [],
  },
}));

afterEach(cleanup);

describe('Confirmação do ajuste manual de dano em área', () => {
  it('separa sucesso, false e exceção por ficha sem repetir os alvos confirmados', async () => {
    const modifyHP = vi.fn().mockResolvedValueOnce(true).mockResolvedValueOnce(false).mockRejectedValueOnce(new Error('rede'));
    expect(await applyDamagePerCharacter(['a', 'b', 'c'], 7, modifyHP)).toEqual({
      appliedIds: ['a'], failedIds: ['b', 'c'],
    });
    expect(modifyHP.mock.calls).toEqual([['a', -7], ['b', -7], ['c', -7]]);
  });

  it('mantém somente o alvo sem confirmação para retry e fecha após confirmação final', async () => {
    const onOpenChange = vi.fn();
    const onApplyDamage = vi.fn()
      .mockResolvedValueOnce({ appliedIds: ['a'], failedIds: ['b'] })
      .mockResolvedValueOnce({ appliedIds: ['b'], failedIds: [] });
    render(<BulkDamageModal open onOpenChange={onOpenChange} members={members}
      onApplyDamage={onApplyDamage} canApply />);

    fireEvent.click(screen.getByRole('checkbox', { name: /Agente a/ }));
    fireEvent.click(screen.getByRole('checkbox', { name: /Agente b/ }));
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Dano final por alvo' }), { target: { value: '7' } });
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Aplicar Dano/ })); });

    expect(screen.getByRole('alert')).toHaveTextContent('1 ficha(s) confirmada(s); 1 sem confirmação');
    expect(screen.getByRole('checkbox', { name: /Agente a/ })).toBeDisabled();
    expect(screen.getByRole('checkbox', { name: /Agente b/ })).toBeChecked();
    expect(onOpenChange).not.toHaveBeenCalled();

    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Aplicar Dano/ })); });
    expect(onApplyDamage.mock.calls).toEqual([[['a', 'b'], 7], [['b'], 7]]);
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
  });

  it('bloqueia envio sem conexão de ajuste de PV e explica conferência manual das regras', () => {
    const onApplyDamage = vi.fn();
    render(<BulkDamageModal open onOpenChange={vi.fn()} members={members}
      onApplyDamage={onApplyDamage} canApply={false} />);
    expect(screen.getByText(/Confira RD, resistências e reações/)).toBeVisible();
    expect(screen.getByRole('alert')).toHaveTextContent('Ajuste indisponível');
    expect(screen.getByRole('button', { name: /Aplicar Dano/ })).toBeDisabled();
    expect(onApplyDamage).not.toHaveBeenCalled();
  });

  it('recusa dois envios enquanto o servidor ainda confirma os PV', async () => {
    let finish!: (result: { appliedIds: string[]; failedIds: string[] }) => void;
    const onApplyDamage = vi.fn(() => new Promise<{ appliedIds: string[]; failedIds: string[] }>(resolve => { finish = resolve; }));
    render(<BulkDamageModal open onOpenChange={vi.fn()} members={members}
      onApplyDamage={onApplyDamage} canApply />);
    fireEvent.click(screen.getByRole('checkbox', { name: /Agente a/ }));
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Dano final por alvo' }), { target: { value: '4' } });
    fireEvent.click(screen.getByRole('button', { name: /Aplicar Dano/ }));
    fireEvent.click(screen.getByRole('button', { name: /Confirmando ajustes/ }));
    expect(onApplyDamage).toHaveBeenCalledExactlyOnceWith(['a'], 4);
    expect(screen.getByRole('button', { name: /Confirmando ajustes/ })).toBeDisabled();
    await act(async () => { finish({ appliedIds: ['a'], failedIds: [] }); });
  });
});
