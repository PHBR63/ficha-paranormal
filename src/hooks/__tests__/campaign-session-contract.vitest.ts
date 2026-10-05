import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCampaignRealtime } from '../campaign/useCampaignRealtime';

const fake = vi.hoisted(() => ({
  rows: [] as Record<string, unknown>[], writes: [] as { table: string; data: Record<string, unknown> }[],
  reads: [] as string[], subscriptions: [] as string[], fail: false, toast: vi.fn(),
  sessionsRead: null as Promise<unknown> | null,
}));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: fake.toast }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {
  from: (table: string) => {
    let data: Record<string, unknown> | null = null;
    const query = {
      select: () => query, eq: () => query, order: () => query, in: () => query,
      insert: (values: Record<string, unknown>[]) => { data = values[0]; fake.writes.push({ table, data }); return query; },
      update: (value: Record<string, unknown>) => { data = value; fake.writes.push({ table, data }); return query; },
      single: async () => ({ data: { id: 'saved', ...data }, error: fake.fail ? { message: 'Contrato recusado' } : null }),
      limit: async () => ({ data: [], error: null }),
      then: (resolve: (result: unknown) => unknown) => {
        fake.reads.push(table);
        if (table.startsWith('campaign_sessions') && fake.sessionsRead) return fake.sessionsRead.then(resolve);
        return Promise.resolve({ data: table.startsWith('campaign_sessions') ? fake.rows : [], error: null }).then(resolve);
      },
    };
    return query;
  },
  channel: () => {
    const channel = { on: (_event: string, options: { table: string }) => { fake.subscriptions.push(options.table); return channel; }, subscribe: () => channel };
    return channel;
  },
  removeChannel: vi.fn(),
} }));

beforeEach(() => { fake.rows = []; fake.writes = []; fake.reads = []; fake.subscriptions = []; fake.fail = false; fake.sessionsRead = null; fake.toast.mockClear(); });

describe('Contrato de campanha é consistente entre leitura, escrita e realtime', () => {
  it.each(['v1', 'v2'] as const)('%s usa sua própria tabela e status SQL', async schemaVersion => {
    const { result } = renderHook(() => useCampaignRealtime({ campaignId: 'campaign', userId: 'master', schemaVersion }));
    await act(async () => { await result.current.startSession(); });
    const table = schemaVersion === 'v2' ? 'campaign_sessions_v2' : 'campaign_sessions';
    expect(fake.writes[0]).toMatchObject({ table, data: { status: schemaVersion === 'v2' ? 'active' : 'in_progress' } });
    expect(fake.reads).toContain(table);
    expect(fake.subscriptions).toContain(table);
    expect(fake.subscriptions).not.toContain(schemaVersion === 'v2' ? 'campaign_sessions' : 'campaign_sessions_v2');
    expect(result.current.activeSession?.id).toBe('saved');
    await act(async () => { await result.current.endSession('saved'); });
    expect(fake.writes[1]).toMatchObject({ table, data: { status: 'completed' } });
    expect(result.current.activeSession).toBeNull();
  });
  it('normaliza sessão legada ativa sem criar outra', async () => {
    fake.rows = [{ id: 'legacy', status: 'in_progress', session_number: 3 }];
    const { result } = renderHook(() => useCampaignRealtime({ campaignId: 'campaign', userId: 'master', schemaVersion: 'v1' }));
    await waitFor(() => expect(result.current.activeSession?.id).toBe('legacy'));
    await act(async () => { await result.current.startSession(); });
    expect(fake.writes).toHaveLength(0);
  });
  it('mensagem enviada não descarta uma leitura pendente de sessões', async () => {
    let resolveSessions: (value: unknown) => void = () => {};
    fake.sessionsRead = new Promise(resolve => { resolveSessions = resolve; });
    const { result } = renderHook(() => useCampaignRealtime({ campaignId: 'campaign', userId: 'master' }));
    await act(async () => { await result.current.sendMessage('Mensagem durante carregamento'); });
    await act(async () => { resolveSessions({ data: [{ id: 'active-session', status: 'active', session_number: 1 }], error: null }); });
    expect(result.current.activeSession?.id).toBe('active-session');
    expect(result.current.messages).toHaveLength(1);
  });
  it('evento grava system no SQL e preserva subtipo usado pela interface', async () => {
    const { result } = renderHook(() => useCampaignRealtime({ campaignId: 'campaign', userId: 'master' }));
    await act(async () => { expect(await result.current.sendMessage('Dano sintético', 'event_damage', { amount: 3 })).toBe(true); });
    expect(fake.writes[0]).toMatchObject({ table: 'campaign_messages_v2', data: { message_type: 'system', metadata: { eventType: 'event_damage', amount: 3 } } });
    expect(result.current.messages[0].message_type).toBe('event_damage');
  });
  it('falha não cria sessão local nem tenta tabela de outra versão', async () => {
    fake.fail = true;
    const { result } = renderHook(() => useCampaignRealtime({ campaignId: 'campaign', userId: 'master' }));
    await act(async () => { expect(await result.current.startSession()).toBeNull(); });
    expect(result.current.activeSession).toBeNull();
    expect(fake.writes).toHaveLength(1);
    expect(fake.toast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Erro ao iniciar sessão', variant: 'destructive' }));
  });
});
