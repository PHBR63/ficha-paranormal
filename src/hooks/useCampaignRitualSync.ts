/** Campanha associada à ficha: histórico canônico e compatibilidade de leitura v1. */
import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Ritual } from '@/lib/rituals/legacy-exports';
import type { CharacterActivityEvent } from '@/types/character-activity';
import { listCampaignRitualActivity } from '@/services/character-activity-service';

export interface CampaignRitualCast {
  id: string; campaign_id: string; character_id: string; user_id: string; session_id: string | null;
  ritual_id: string; ritual_name: string; ritual_element: string; ritual_circle: number;
  pe_cost: number; enhancements: string[]; pe_before: number; pe_after: number; created_at: string; character_name?: string;
}
interface Props { characterId: string; userId: string; enabled?: boolean }
interface CampaignContext { id: string; master_id: string; version: 'v1' | 'v2' }
interface MemberResult { campaigns?: { id: string; master_id: string }; campaigns_v2?: { id: string; master_id: string } }
/** Adapta somente campos explícitos dos eventos; o PE permanece o confirmado no cast. */
export function activityToCampaignCast(event: CharacterActivityEvent): CampaignRitualCast | null {
  const payload = event.payload;
  if (!payload || typeof payload !== 'object' || Array.isArray(payload) || !event.campaign_id) return null;
  return {
    id: event.id, campaign_id: event.campaign_id, character_id: event.character_id, user_id: event.author_id, session_id: null,
    ritual_id: typeof payload.ritualId === 'string' ? payload.ritualId : '', ritual_name: typeof payload.ritualName === 'string' ? payload.ritualName : 'Ritual registrado',
    ritual_element: typeof payload.ritualElement === 'string' ? payload.ritualElement : '', ritual_circle: typeof payload.ritualCircle === 'number' ? payload.ritualCircle : 0,
    pe_cost: typeof payload.peCost === 'number' ? payload.peCost : 0,
    enhancements: Array.isArray(payload.enhancements) ? payload.enhancements.filter((value): value is string => typeof value === 'string') : [],
    pe_before: typeof payload.peBefore === 'number' ? payload.peBefore : 0, pe_after: typeof payload.peAfter === 'number' ? payload.peAfter : 0,
    created_at: event.created_at,
  };
}
export function useCampaignRitualSync({ characterId, userId, enabled = true }: Props) {
  const [context, setContext] = useState<CampaignContext | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [recentCasts, setRecentCasts] = useState<CampaignRitualCast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const scope = `${userId}:${characterId}:${context?.version}:${context?.id}`;
  const currentScope = useRef(scope);
  currentScope.current = scope;
  useEffect(() => {
    let cancelled = false;
    setContext(null); setSessionId(null); setRecentCasts([]); setError(null); setConnected(false); setLoading(true);
    if (!enabled || !characterId || !userId) { setLoading(false); return; }
    void (async () => {
      try {
        for (const version of ['v2', 'v1'] as const) {
          const table = version === 'v2' ? 'campaign_members_v2' : 'campaign_members';
          const relation = version === 'v2' ? 'campaigns_v2' : 'campaigns';
          const { data, error: memberError } = await supabase.from(table).select(`campaign_id,${relation}!inner(id,master_id)`).eq('character_id', characterId).eq('user_id', userId).limit(1).maybeSingle();
          if (memberError) throw new Error('Não foi possível confirmar o vínculo da ficha à campanha.');
          const member = data as unknown as MemberResult | null;
          const campaign = version === 'v2' ? member?.campaigns_v2 : member?.campaigns;
          if (!campaign) continue;
          const { data: session, error: sessionError } = await supabase.from(version === 'v2' ? 'campaign_sessions_v2' : 'campaign_sessions').select('id').eq('campaign_id', campaign.id).eq('status', version === 'v2' ? 'active' : 'in_progress').limit(1).maybeSingle();
          if (sessionError) throw new Error('Não foi possível consultar a sessão da campanha.');
          if (!cancelled) { setContext({ id: campaign.id, master_id: campaign.master_id, version }); setSessionId(session?.id ?? null); }
          break;
        }
      } catch (cause) { if (!cancelled) setError(cause instanceof Error ? cause.message : 'Não foi possível carregar a campanha.'); }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [characterId, userId, enabled]);
  const refresh = useCallback(async () => {
    if (!context) return;
    const canonical = await listCampaignRitualActivity(context.id, context.version);
    let legacy: CampaignRitualCast[] = [];
    if (context.version === 'v1') {
      const { data, error: legacyError } = await supabase.from('campaign_ritual_casts').select('*').eq('campaign_id', context.id).order('created_at', { ascending: false }).limit(50);
      if (legacyError) throw new Error('Não foi possível recuperar as conjurações antigas da campanha.');
      legacy = (data ?? []) as CampaignRitualCast[];
    }
    const mapped = canonical.map(activityToCampaignCast).filter((cast): cast is CampaignRitualCast => cast !== null);
    if (currentScope.current === scope) {
      setRecentCasts([...new Map([...mapped, ...legacy].map(cast => [cast.id, cast])).values()].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 50));
      setError(null);
    }
  }, [context, scope]);
  const refreshSession = useCallback(async () => {
    if (!context) return;
    const { data, error: sessionError } = await supabase.from(context.version === 'v2' ? 'campaign_sessions_v2' : 'campaign_sessions').select('id').eq('campaign_id', context.id).eq('status', context.version === 'v2' ? 'active' : 'in_progress').limit(1).maybeSingle();
    if (sessionError) throw new Error('Não foi possível recuperar a sessão atual da campanha.');
    if (currentScope.current === scope) setSessionId(data?.id ?? null);
  }, [context, scope]);
  useEffect(() => {
    if (!context || !enabled) return;
    let mounted = true;
    const recover = () => { void Promise.all([refresh(), refreshSession()]).catch(() => { if (mounted) setError('As conjurações ou a sessão não foram carregadas. Verifique a conexão e tente novamente.'); }); };
    recover(); window.addEventListener('online', recover);
    const channel = supabase.channel(`campaign-activity:${context.version}:${context.id}:${characterId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'character_activity_events', filter: `campaign_id=eq.${context.id}` }, recover);
    if (context.version === 'v1') channel.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'campaign_ritual_casts', filter: `campaign_id=eq.${context.id}` }, recover);
    channel.on('postgres_changes', { event: '*', schema: 'public', table: context.version === 'v2' ? 'campaign_sessions_v2' : 'campaign_sessions', filter: `campaign_id=eq.${context.id}` }, recover);
    channel.subscribe(status => { if (mounted) { setConnected(status === 'SUBSCRIBED'); if (status === 'SUBSCRIBED') recover(); } });
    return () => { mounted = false; window.removeEventListener('online', recover); void supabase.removeChannel(channel); };
  }, [context, characterId, enabled, refresh, refreshSession]);
  /** Compatibilidade de assinatura: apenas recarrega; o cast RPC já persistiu o evento. */
  const syncRitualCast = useCallback(async (_ritual: Ritual, _peCost: number, _enhancements: string[], _peBefore: number, _peAfter: number) => { await refresh(); }, [refresh]);
  return { campaignId: context?.id ?? null, campaignVersion: context?.version ?? null, sessionId, isInCampaign: Boolean(context), isMaster: context?.master_id === userId, recentCasts, loading, error, connected, refresh, syncRitualCast };
}
