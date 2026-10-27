import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CounterattackPanel } from '../v3/master/CounterattackPanel';

const fake = vi.hoisted(() => ({ load: vi.fn(), create: vi.fn() }));
vi.mock('@/services/campaign-counterattack-service', async importOriginal => ({
  ...await importOriginal<typeof import('@/services/campaign-counterattack-service')>(),
  loadPendingCounterattacks: fake.load, createCounterattackIntent: fake.create,
}));
afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe('painel de contra-ataque', () => {
  it('exige arma corpo a corpo e encaminha a reação para defesa e rolagem', async () => {
    const pending = { defenseEventId: 'd', characterId: 'c', characterName: 'Defensor', targetId: 't',
      targetName: 'Atacante', scene: 1, round: 2, weapons: [{ id: 'faca-1', name: 'Faca' }] };
    fake.load.mockResolvedValueOnce([pending]).mockResolvedValueOnce([]);
    fake.create.mockResolvedValue({});
    render(<CounterattackPanel campaignId="00000000-0000-4000-8000-000000000001" />);
    const select = await screen.findByRole('combobox', { name: 'Arma do contra-ataque de Defensor' });
    expect(screen.getByRole('button', { name: 'Preparar contra-ataque' })).toBeDisabled();
    fireEvent.change(select, { target: { value: 'faca-1' } });
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Preparar contra-ataque' })); });
    expect(screen.getByRole('status')).toHaveTextContent('Confirme a defesa abaixo; depois o jogador rola');
  });
});
