import { describe, expect, it, vi } from 'vitest';
import { confirmInitialCampaignSetup, getInitialSessionTime } from '../campaign-setup-service';

describe('configuração inicial de campanha', () => {
  it('aceita um horário futuro no mesmo dia e rejeita horários inválidos ou passados', () => {
    const date = new Date(2026, 10, 9);
    const now = new Date(2026, 10, 9, 12);
    expect(getInitialSessionTime(date, '20:00', now)).toBe(new Date(2026, 10, 9, 20).toISOString());
    expect(getInitialSessionTime(null, '', now)).toBeNull();
    expect(() => getInitialSessionTime(date, '24:00', now)).toThrow(/válidos/);
    expect(() => getInitialSessionTime(date, '11:00', now)).toThrow(/futuro/);
  });

  it('não afirma que a sessão foi agendada quando o banco rejeita', async () => {
    const invite = async () => ({ data: { id: 'invite' }, error: null });
    const session = async () => ({ data: null, error: new Error('write failed') });
    await expect(confirmInitialCampaignSetup(invite, session)).resolves.toEqual({ inviteConfirmed: true, sessionConfirmed: false });
  });

  it('mantém resultados independentes quando o convite não é confirmado', async () => {
    const invite = async () => { throw new Error('network'); };
    const session = vi.fn(async () => ({ data: { id: 'session' }, error: null }));
    await expect(confirmInitialCampaignSetup(invite, session)).resolves.toEqual({ inviteConfirmed: false, sessionConfirmed: true });
    expect(session).toHaveBeenCalledOnce();
  });
});
