import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MassiveDamagePanel } from '../v3/master/MassiveDamagePanel';

const fake = vi.hoisted(() => ({ load: vi.fn(), confirm: vi.fn() }));
vi.mock('@/services/campaign-massive-damage-service', async importOriginal => ({
  ...await importOriginal<typeof import('@/services/campaign-massive-damage-service')>(),
  loadPendingMassiveDamage: fake.load, confirmMassiveDamage: fake.confirm,
}));
const pending = {
  sourceEventId: '00000000-0000-4000-8000-000000000002',
  characterId: '00000000-0000-4000-8000-000000000003', characterName: 'Agente QA',
  finalDamage: 15, dt: 17, hpCurrent: 10, hpMax: 20, createdAt: '2026-10-27T10:00:00Z',
};

afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe('painel de dano massivo', () => {
  it('explica o requisito e mostra o resultado confirmado pelo servidor', async () => {
    fake.load.mockResolvedValueOnce([pending]).mockResolvedValueOnce([]);
    fake.confirm.mockResolvedValue({
      operationId: '00000000-0000-4000-8000-000000000004', sourceEventId: pending.sourceEventId,
      campaignId: '00000000-0000-4000-8000-000000000001', characterId: pending.characterId,
      dice: [8, 14], kept: 14, vigor: 2, skillBonus: 5, resistanceBonus: 0,
      total: 19, dt: 17, passed: true, hpBefore: 10, hpAfter: 10,
      conditionsBefore: [], conditionsAfter: [], eventId: '00000000-0000-4000-8000-000000000005',
    });
    render(<MassiveDamagePanel campaignId="00000000-0000-4000-8000-000000000001" />);
    expect(await screen.findByText(/sofreu 15 de dano com 20 PV máximos/)).toBeInTheDocument();
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Rolar Fortitude e aplicar resultado' })); });
    expect(screen.getByRole('status')).toHaveTextContent('total 19 contra DT 17: sucesso; PV preservados');
  });
});
