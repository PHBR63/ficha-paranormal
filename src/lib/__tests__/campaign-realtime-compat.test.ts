import { describe, expect, it } from 'vitest';
import { normalizeCampaignSession } from '../campaign-realtime-compat';

describe('status de sessões legadas na interface', () => {
  it.each([
    ['in_progress', 'active'],
    ['scheduled', 'scheduled'],
    ['completed', 'completed'],
    ['cancelled', 'cancelled'],
  ])('apresenta %s como %s sem modificar o registro persistido', (status, expected) => {
    const persisted = { id: 'session', status, session_number: 3 };
    expect(normalizeCampaignSession(persisted)).toEqual({ ...persisted, status: expected });
    expect(persisted.status).toBe(status);
  });
});
