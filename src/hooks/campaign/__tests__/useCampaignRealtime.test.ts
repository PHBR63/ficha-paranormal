import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CampaignMessage, CampaignSession } from '../useCampaignRealtime';
import { useCampaignRealtime } from '../useCampaignRealtime';

type QueryResult = { data: unknown; error: { code: string; message: string } | null };
type Operation = { table: string; action: string; values?: unknown; filters: Record<string, unknown> };
const mock = vi.hoisted(() => ({
  rows: {} as Record<string, QueryResult>,
  mutations: {} as Record<string, QueryResult>,
  pending: {} as Record<string, Promise<QueryResult>>,
  operations: [] as Operation[],
  events: {} as Record<string, (payload: { new: CampaignMessage }) => Promise<void>>,
  toast: vi.fn(), removeChannel: vi.fn(),
}));

vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: mock.toast }) }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from(table: string) {
      const operation: Operation = { table, action: 'select', filters: {} };
      // Cada execução registra o destino e devolve o resultado preparado pelo teste.
      const execute = () => {
        mock.operations.push(operation);
        if (operation.action === 'select' && mock.pending[table]) return mock.pending[table];
        return Promise.resolve((operation.action === 'select' ? mock.rows[table] : mock.mutations[table])
          ?? { data: [], error: null });
      };
      const query = {
        select: () => query,
        eq: (column: string, value: unknown) => { operation.filters[column] = value; return query; },
        in: () => query, order: () => query, limit: () => query,
        insert: (values: unknown) => { operation.action = 'insert'; operation.values = values; return query; },
        update: (values: unknown) => { operation.action = 'update'; operation.values = values; return query; },
        single: execute, maybeSingle: execute,
        then: (resolve: (result: QueryResult) => unknown) => execute().then(resolve),
      };
      return query;
    },
    channel() {
      const channel = {
        on: (_event: string, filter: { table: string }, callback: typeof mock.events[string]) => {
          mock.events[filter.table] = callback;
          return channel;
        },
        subscribe: (callback: (status: string) => void) => { callback('SUBSCRIBED'); return channel; },
      };
      return channel;
    },
    removeChannel: mock.removeChannel,
  },
}));

const message = (id = 'message'): CampaignMessage => ({
  id, campaign_id: 'campaign', user_id: 'other-user', character_id: null,
  recipient_id: null, message_type: 'chat', content: 'Mensagem persistida',
  metadata: null, created_at: '2026-01-01T12:00:00Z',
});
const session = (id = 'session', status = 'in_progress') => ({
  id, campaign_id: 'campaign', session_number: 1, title: 'Sessão 1', summary: null,
  status, scheduled_at: null, started_at: '2026-01-01T12:00:00Z', ended_at: null,
  notes: null, created_at: '2026-01-01T12:00:00Z',
});
const renderCampaign = () => renderHook(() => useCampaignRealtime({ campaignId: 'campaign', userId: 'user' }));

beforeEach(() => {
  mock.rows = {
    campaign_messages: { data: [message()], error: null },
    campaign_messages_v2: { data: [], error: null },
    campaign_sessions: { data: [session()], error: null },
    campaign_sessions_v2: { data: [], error: null },
    profiles: { data: [], error: null },
  };
  mock.mutations = {};
  mock.pending = {};
  mock.operations = [];
  mock.events = {};
  vi.clearAllMocks();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());

describe('useCampaignRealtime: regressões de persistência', () => {
  it('mantém mensagens e sessão v1 após recarregar, mesmo com v2 vazio', async () => {
    const first = renderCampaign();
    await waitFor(() => expect(first.result.current.messages).toHaveLength(1));
    await waitFor(() => expect(first.result.current.activeSession?.status).toBe('active'));
    first.unmount();
    const reloaded = renderCampaign();
    await waitFor(() => expect(reloaded.result.current.messages[0].id).toBe('message'));
    await waitFor(() => expect(reloaded.result.current.activeSession?.id).toBe('session'));
  });

  it('inicia sessão com status aceito por v1 e devolve active para a interface', async () => {
    const { result } = renderCampaign();
    await waitFor(() => expect(result.current.sessions).toHaveLength(1));
    mock.mutations.campaign_sessions = { data: { ...session('new'), session_number: 2 }, error: null };
    let started: CampaignSession | null = null;
    await act(async () => { started = await result.current.startSession('Nova sessão'); });
    expect(started).toMatchObject({ id: 'new', status: 'active' });
    expect(mock.operations.find(operation => operation.action === 'insert')).toMatchObject({
      table: 'campaign_sessions', values: [{ status: 'in_progress', session_number: 2, campaign_id: 'campaign' }],
    });
  });

  it('encerra a cópia v1 em vez de exibir a cópia v2 antiga', async () => {
    mock.rows.campaign_sessions_v2 = { data: [session('session', 'active')], error: null };
    const { result } = renderCampaign();
    await waitFor(() => expect(result.current.activeSession?.id).toBe('session'));
    mock.mutations.campaign_sessions = { data: { id: 'session' }, error: null };
    await act(async () => { expect(await result.current.endSession('session')).toBe(true); });
    expect(result.current.activeSession).toBeNull();
    expect(mock.operations.find(operation => operation.action === 'update')).toMatchObject({
      table: 'campaign_sessions', filters: { id: 'session', campaign_id: 'campaign' },
    });
  });

  it('encerra na origem correta quando a sessão existe apenas em v2', async () => {
    mock.rows.campaign_sessions = { data: [], error: null };
    mock.rows.campaign_sessions_v2 = { data: [session('v2', 'active')], error: null };
    mock.mutations.campaign_sessions_v2 = { data: { id: 'v2' }, error: null };
    const { result } = renderCampaign();
    await waitFor(() => expect(result.current.activeSession?.id).toBe('v2'));
    await act(async () => { expect(await result.current.endSession('v2')).toBe(true); });
    expect(mock.operations.find(operation => operation.action === 'update')?.table).toBe('campaign_sessions_v2');
  });

  it('não informa sucesso quando o banco não atualiza nenhuma sessão', async () => {
    mock.mutations.campaign_sessions = { data: null, error: null };
    const { result } = renderCampaign();
    await waitFor(() => expect(result.current.activeSession?.id).toBe('session'));
    await act(async () => { expect(await result.current.endSession('session')).toBe(false); });
    expect(result.current.activeSession?.id).toBe('session');
    expect(mock.toast).toHaveBeenCalledWith(expect.objectContaining({ variant: 'destructive' }));
  });

  it('deduplica eventos migrados e preserva o destinatário de um sussurro v1', async () => {
    const { result } = renderCampaign();
    await waitFor(() => expect(result.current.messages).toHaveLength(1));
    const whisper = { ...message('whisper'), recipient_id: 'user', message_type: 'whisper' as const };
    await act(async () => {
      await mock.events.campaign_messages({ new: whisper });
      await mock.events.campaign_messages_v2({ new: whisper });
    });
    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages.find(item => item.id === 'whisper')?.recipient_id).toBe('user');
    expect(result.current.unreadCount).toBe(1);
  });

  it('exibe falha de leitura sem mascarar erro de autorização com o outro schema', async () => {
    mock.rows.campaign_messages_v2 = { data: null, error: { code: '42501', message: 'permission denied' } };
    const { result } = renderCampaign();
    await waitFor(() => expect(mock.toast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Erro ao carregar mensagens' })));
    expect(result.current.messages).toEqual([]);
  });

  it('rejeita conteúdo vazio e não grava com o hook desabilitado', async () => {
    const { result } = renderHook(() => useCampaignRealtime({ campaignId: 'campaign', userId: 'user', enabled: false }));
    await act(async () => {
      expect(await result.current.sendMessage('   ')).toBe(false);
      expect(await result.current.sendMessage('Conteúdo')).toBe(false);
      expect(await result.current.startSession()).toBeNull();
      expect(await result.current.endSession('session')).toBe(false);
    });
    expect(mock.operations).toEqual([]);
  });

  it('preserva evento recebido enquanto o histórico ainda está carregando', async () => {
    let release: (value: QueryResult) => void = () => {};
    mock.pending.campaign_messages = new Promise(resolve => { release = resolve; });
    const { result } = renderCampaign();
    await act(async () => { await mock.events.campaign_messages({ new: message('live') }); });
    expect(result.current.messages[0].id).toBe('live');
    await act(async () => { release({ data: [message('history')], error: null }); });
    await waitFor(() => expect(result.current.messages).toHaveLength(2));
    expect(result.current.unreadCount).toBe(1);
  });

  it('ignora resposta atrasada de uma campanha anterior', async () => {
    let release: (value: QueryResult) => void = () => {};
    mock.pending.campaign_messages = new Promise(resolve => { release = resolve; });
    const { result, rerender } = renderHook(({ campaignId }) => useCampaignRealtime({ campaignId, userId: 'user' }), {
      initialProps: { campaignId: 'campaign' },
    });
    delete mock.pending.campaign_messages;
    mock.rows.campaign_messages = { data: [{ ...message('current'), campaign_id: 'next' }], error: null };
    rerender({ campaignId: 'next' });
    await waitFor(() => expect(result.current.messages[0]?.id).toBe('current'));
    await act(async () => { release({ data: [message('old')], error: null }); });
    expect(result.current.messages.map(item => item.id)).toEqual(['current']);
  });
});
