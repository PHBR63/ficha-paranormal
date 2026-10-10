import { useCallback, useEffect, useRef, useState } from 'react';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { hideCharacterActivity, listCharacterActivity, listCharacterActivitySessions, recordCharacterRoll } from '@/services/character-activity-service';
import type { ActivityCategory, ActivityCursor, ActivityPayload, ActivityPeriod, ActivitySession, PendingRoll } from '@/types/character-activity';

const PAGE_SIZE = 30;
const QUEUE_EVENT = 'character-activity-pending';
// Compartilha a recuperação entre os hooks da tela/painel sem atravessar usuário/ficha.
// O snapshot em memória é autoritativo se uma gravação local falha, inclusive vazio
// após confirmação: não ressuscita registros antigos que o storage não pôde limpar.
const memoryFallback = new Map<string, PendingRoll[]>();
/** Lê apenas a fila autenticada desta ficha; registros legados globais não são atribuídos. */
function readPending(key: string): PendingRoll[] {
  const memory = memoryFallback.get(key);
  if (memory) return memory;
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) ?? '[]');
    return Array.isArray(value) ? value.filter((item): item is PendingRoll => Boolean(item && typeof item === 'object' && typeof item.operationId === 'string' && typeof item.queuedAt === 'string' && item.payload && typeof item.payload === 'object')) : [];
  } catch { return []; }
}
function queueFailureMessage(key: string, error: unknown): string {
  const failure = error instanceof Error ? error.message : 'Não foi possível salvar os registros.';
  return `${failure}${memoryFallback.has(key) && readPending(key).length ? ' Fila somente na memória; mantenha a ficha aberta para recuperar.' : ''}`;
}
/** Histórico canônico no servidor, fila de rolagens por usuário/ficha e recuperação explícita. */
export function useCharacterActivity(characterId: string) {
  const { user } = useAuth();
  const userId = user?.id;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [category, setCategory] = useState<ActivityCategory | undefined>();
  const [includeHidden, setIncludeHidden] = useState(false);
  const [period, setPeriod] = useState<ActivityPeriod>('all');
  const [session, setSession] = useState<ActivitySession | undefined>();
  const [pendingRolls, setPendingRolls] = useState<PendingRoll[]>([]);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [recovering, setRecovering] = useState(false);
  const queueKey = `character-activity-pending:${user?.id ?? 'anonymous'}:${characterId}`;
  const currentScope = useRef(queueKey);
  const loadedScope = useRef(queueKey);
  currentScope.current = queueKey;
  const scopeKey = ['character-activity', user?.id, characterId];
  const query = useInfiniteQuery({
    queryKey: [...scopeKey, category, includeHidden, period, session?.id, session?.campaign_id, session?.campaign_version], enabled: Boolean(user && characterId),
    initialPageParam: undefined as ActivityCursor | undefined,
    queryFn: ({ pageParam }) => listCharacterActivity(characterId, { category, includeHidden, cursor: pageParam, limit: PAGE_SIZE, session,
      afterCreatedAt: period === 'all' ? undefined : new Date(Date.now() - (period === '7d' ? 7 : 30) * 86400000).toISOString() }),
    getNextPageParam: page => page.length === PAGE_SIZE ? { createdAt: page[page.length - 1].created_at, id: page[page.length - 1].id } : undefined,
    refetchOnReconnect: true, staleTime: 15000,
  });
  const sessionsQuery = useQuery({
    queryKey: ['character-activity-sessions', userId, characterId], enabled: Boolean(user && characterId),
    queryFn: () => listCharacterActivitySessions(characterId), staleTime: 15000, refetchOnReconnect: true,
  });
  const refresh = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['character-activity', user?.id, characterId] }),
      queryClient.invalidateQueries({ queryKey: ['character-history', user?.id, characterId] }),
      queryClient.invalidateQueries({ queryKey: ['character-activity-sessions', user?.id, characterId] }),
      queryClient.invalidateQueries({ queryKey: ['ritual-situational', characterId] }),
    ]);
  }, [queryClient, user?.id, characterId]);
  const writePending = useCallback((items: PendingRoll[]) => {
    try { localStorage.setItem(queueKey, JSON.stringify(items)); memoryFallback.delete(queueKey); }
    catch {
      memoryFallback.set(queueKey, items);
      if (currentScope.current === queueKey) setSaveError('Fila mantida somente na memória. Mantenha esta ficha aberta e tente salvar novamente.');
    }
    if (currentScope.current === queueKey) { loadedScope.current = queueKey; setPendingRolls(items); }
    window.dispatchEvent(new CustomEvent(QUEUE_EVENT, { detail: queueKey }));
  }, [queueKey]);
  const recoveryLock = useRef(false);
  const recoverPending = useCallback(async () => {
    if (!user || !characterId || recoveryLock.current) return;
    recoveryLock.current = true; setRecovering(true);
    try {
      for (const item of readPending(queueKey)) {
        await recordCharacterRoll(characterId, item.operationId, item.payload);
        writePending(readPending(queueKey).filter(entry => entry.operationId !== item.operationId));
      }
      if (currentScope.current === queueKey) setSaveError(null);
      try { await refresh(); }
      catch { if (currentScope.current === queueKey) setSaveError('Registros confirmados pelo servidor, mas o histórico não atualizou. Tente atualizar a visualização.'); }
    } catch (error) { if (currentScope.current === queueKey) setSaveError(queueFailureMessage(queueKey, error)); }
    finally { recoveryLock.current = false; if (currentScope.current === queueKey) setRecovering(false); }
  }, [user, characterId, queueKey, writePending, refresh]);
  useEffect(() => {
    setSession(undefined);
  }, [characterId, userId]);
  useEffect(() => {
    loadedScope.current = queueKey;
    setPendingRolls(readPending(queueKey)); setSaveError(null); setRecovering(false);
    const update = (event: Event) => { if ((event as CustomEvent<string>).detail === queueKey) setPendingRolls(readPending(queueKey)); };
    window.addEventListener(QUEUE_EVENT, update);
    window.addEventListener('online', recoverPending);
    if (user && readPending(queueKey).length) void recoverPending();
    return () => { window.removeEventListener(QUEUE_EVENT, update); window.removeEventListener('online', recoverPending); };
  }, [queueKey, user, recoverPending]);
  useEffect(() => {
    if (!userId || !characterId) return;
    let active = true;
    // Recupera recursos/condições além do feed; a ficha ativa escuta este evento.
    const refreshCharacter = () => {
      if (!active) return;
      void queryClient.invalidateQueries({ queryKey: ['character', characterId] });
      window.dispatchEvent(new CustomEvent('character-server-updated', { detail: characterId }));
    };
    const onResume = () => { if (document.visibilityState === 'visible') refreshCharacter(); };
    const channel = supabase.channel(`activity:${userId}:${characterId}:${crypto.randomUUID()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'character_activity_events', filter: `character_id=eq.${characterId}` }, () => { void refresh(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'character_activity_visibility', filter: `character_id=eq.${characterId}` }, () => { void refresh(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'characters', filter: `id=eq.${characterId}` }, refreshCharacter)
      .subscribe(status => { if (active && status === 'SUBSCRIBED') { refreshCharacter(); void refresh(); void recoverPending(); } });
    document.addEventListener('visibilitychange', onResume);
    window.addEventListener('online', onResume);
    return () => {
      active = false;
      void supabase.removeChannel(channel);
      document.removeEventListener('visibilitychange', onResume);
      window.removeEventListener('online', onResume);
    };
  }, [userId, characterId, refresh, recoverPending, queryClient]);
  const addRoll = useCallback(async (payload: ActivityPayload, operationId: string = crypto.randomUUID()): Promise<boolean> => {
    if (!user || !characterId) { setSaveError('Entre na conta para salvar o histórico.'); return false; }
    const item = { operationId, payload, queuedAt: new Date().toISOString() };
    writePending([...readPending(queueKey).filter(entry => entry.operationId !== operationId), item]);
    try {
      await recordCharacterRoll(characterId, operationId, payload);
      writePending(readPending(queueKey).filter(entry => entry.operationId !== operationId));
      if (currentScope.current === queueKey) setSaveError(null);
      try { await refresh(); }
      catch { if (currentScope.current === queueKey) setSaveError('Rolagem confirmada pelo servidor, mas o histórico não atualizou. Tente atualizar a visualização.'); }
      return true;
    } catch (error) {
      const message = queueFailureMessage(queueKey, error);
      if (currentScope.current === queueKey) {
        setSaveError(message);
        toast({ title: 'Rolagem pendente de gravação', description: `${message} Tente recuperar no histórico.`, variant: 'destructive' });
      }
      return false;
    }
  }, [user, characterId, queueKey, writePending, refresh, toast]);
  const changeVisibility = useCallback(async (hidden: boolean) => {
    // A resposta pertence à ficha/conta que iniciou a ação, mesmo após navegação.
    try { await hideCharacterActivity(characterId, hidden); }
    catch (error) {
      if (currentScope.current === queueKey) setSaveError(error instanceof Error ? error.message : 'Não foi possível atualizar o histórico.');
      throw error;
    }
    // Falhar na leitura após o commit não desfaz a preferência já confirmada.
    try { await refresh(); }
    catch {
      if (currentScope.current === queueKey) setSaveError('Alteração de visibilidade confirmada pelo servidor, mas o histórico não atualizou. Tente atualizar a visualização.');
    }
  }, [characterId, queueKey, refresh]);
  const events = query.data?.pages.flat() ?? [];
  const loadedCurrentScope = loadedScope.current === queueKey;
  return { ...query, events, category, setCategory, includeHidden, setIncludeHidden, period, setPeriod, session, setSession,
    sessions: sessionsQuery.data ?? [], sessionsError: sessionsQuery.error, sessionsLoading: sessionsQuery.isLoading,
    pendingRolls: loadedCurrentScope ? pendingRolls : [], saveError: loadedCurrentScope ? saveError : null, recovering: loadedCurrentScope && recovering, addRoll, recoverPending,
    hideHistory: () => changeVisibility(true), restoreHistory: () => changeVisibility(false), refresh };
}

