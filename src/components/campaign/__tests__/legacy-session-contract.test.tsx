import { fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SessionManager } from '../SessionManager';
import { useCampaignRitualSync } from '@/hooks/useCampaignRitualSync';

const fake = vi.hoisted(() => ({
  status: 'scheduled',
  writes: [] as { table: string; data: Record<string, unknown> }[],
  filters: [] as { table: string; field: string; value: unknown }[],
  toast: vi.fn(),
}));

vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: fake.toast }) }));
vi.mock('@/hooks', () => ({ sendPushNotification: vi.fn() }));
vi.mock('../SessionCard', () => ({
  SessionCard: ({ session, onStart }: { session: { id: string; status: string }; onStart: (id: string) => void }) => (
    <button onClick={() => onStart(session.id)}>Sessão {session.status}</button>
  ),
}));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {
  from: (table: string) => {
    const filters: Record<string, unknown> = {};
    let error: { message: string } | null = null;
    const query = {
      select: () => query,
      order: () => query,
      limit: () => query,
      eq: (field: string, value: unknown) => {
        filters[field] = value;
        fake.filters.push({ table, field, value });
        return query;
      },
      update: (data: Record<string, unknown>) => {
        fake.writes.push({ table, data });
        // Simula o CHECK real da tabela v1, que recusa active.
        if (data.status === 'active') error = { message: 'Status inválido em v1' };
        else if (typeof data.status === 'string') fake.status = data.status;
        return query;
      },
      maybeSingle: async () => ({
        data: table === 'campaign_members'
          ? { role: 'player', campaigns: { id: 'legacy-campaign', master_id: 'master' } }
          : filters.status === fake.status ? { id: 'legacy-session' } : null,
        error: null,
      }),
      then: (resolve: (value: unknown) => unknown) => Promise.resolve({
        data: table === 'campaign_sessions'
          ? [{ id: 'legacy-session', campaign_id: 'legacy-campaign', session_number: 1, status: fake.status }]
          : [],
        error,
      }).then(resolve),
    };
    return query;
  },
  channel: () => {
    const channel = { on: () => channel, subscribe: () => channel };
    return channel;
  },
  removeChannel: vi.fn(),
} }));

beforeEach(() => {
  fake.status = 'scheduled';
  fake.writes = [];
  fake.filters = [];
  fake.toast.mockClear();
});

describe('contrato das sessões legadas nas telas e nos rituais', () => {
  it('inicia com in_progress no banco e apresenta a sessão como ativa', async () => {
    render(<SessionManager campaignId="legacy-campaign" currentSession={1} isMaster />);
    fireEvent.click(await screen.findByRole('button', { name: 'Sessão scheduled' }));
    await waitFor(() => expect(screen.getByText('SESSÃO ATIVA')).toBeInTheDocument());
    expect(fake.writes).toEqual([{
      table: 'campaign_sessions', data: { status: 'in_progress', started_at: expect.any(String) },
    }]);
    expect(screen.getByRole('button', { name: 'Sessão active' })).toBeInTheDocument();
    expect(fake.status).toBe('in_progress');
  });

  it('recupera uma sessão em andamento sem regravar o status persistido', async () => {
    fake.status = 'in_progress';
    render(<SessionManager campaignId="legacy-campaign" currentSession={1} isMaster />);
    expect(await screen.findByText('SESSÃO ATIVA')).toBeInTheDocument();
    expect(fake.writes).toEqual([]);
    expect(fake.status).toBe('in_progress');
  });

  it.each(['in_progress', 'scheduled'])('rituais procuram somente a sessão ativa SQL quando o status é %s', async status => {
    fake.status = status;
    const { result } = renderHook(() => useCampaignRitualSync({ characterId: 'character', userId: 'player' }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.sessionId).toBe(status === 'in_progress' ? 'legacy-session' : null);
    expect(fake.filters).toContainEqual({ table: 'campaign_sessions', field: 'status', value: 'in_progress' });
    expect(fake.writes).toEqual([]);
  });
});
