import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { loadCampaignCombat, saveCampaignCombat, type CombatSnapshot } from '@/services/campaign-combat-service';
import { emptyCampaignCombat, type CampaignCombatState } from '@/lib/campaign-combat';

export interface CampaignCombatController {
  state: CampaignCombatState;
  loading: boolean;
  saving: boolean;
  error: string | null;
  connected: boolean;
  reload: () => Promise<void>;
  update: (change: (state: CampaignCombatState) => CampaignCombatState) => Promise<boolean>;
}

/** Uma instância por campanha: servidor é a fonte de verdade; membros apenas leem. */
export function useCampaignCombat(campaignId: string, userId: string, isMaster: boolean, enabled = true): CampaignCombatController {
  const [snapshot, setSnapshot] = useState<CombatSnapshot>({ revision: 0, state: emptyCampaignCombat() });
  const current = useRef(snapshot);
  const identity = `${campaignId}:${userId}:${enabled}`;
  const identityRef = useRef(identity);
  identityRef.current = identity;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  const accept = useCallback((result: CombatSnapshot) => {
    if (result.revision < current.current.revision) return;
    current.current = result;
    setSnapshot(result);
  }, []);

  const reload = useCallback(async () => {
    if (!enabled || !campaignId || !userId) return;
    try {
      const result = await loadCampaignCombat(campaignId);
      if (identityRef.current !== identity) return;
      accept(result);
      setError(null);
      setLoading(false);
    } catch {
      if (identityRef.current !== identity) return;
      setError('Não foi possível carregar o combate. Confira sua conexão e tente novamente.');
      setLoading(false);
    }
  }, [enabled, campaignId, userId, identity, accept]);

  useEffect(() => {
    current.current = { revision: 0, state: emptyCampaignCombat() };
    setSnapshot(current.current);
    setLoading(enabled);
    setError(null);
    setConnected(false);
    if (!enabled) return;
    void reload();
    const channel = supabase.channel(`campaign-combat-${campaignId}-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'campaign_combat_state_v2', filter: `campaign_id=eq.${campaignId}` }, () => { void reload(); })
      .subscribe(status => {
        if (identityRef.current !== identity) return;
        setConnected(status === 'SUBSCRIBED');
        if (status === 'SUBSCRIBED') void reload();
      });
    const onResume = () => { if (document.visibilityState === 'visible') void reload(); };
    document.addEventListener('visibilitychange', onResume);
    window.addEventListener('online', onResume);
    return () => { void supabase.removeChannel(channel); document.removeEventListener('visibilitychange', onResume); window.removeEventListener('online', onResume); };
  }, [campaignId, userId, enabled, identity, reload]);

  const update = useCallback(async (change: (state: CampaignCombatState) => CampaignCombatState) => {
    if (!enabled || !isMaster || loading || error || savingRef.current) return false;
    savingRef.current = true;
    setSaving(true);
    try {
      const before = current.current;
      const saved = await saveCampaignCombat(campaignId, before.revision, change(before.state));
      if (identityRef.current !== identity) return false;
      accept(saved);
      return true;
    } catch (cause) {
      if (identityRef.current !== identity) return false;
      const conflict = typeof cause === 'object' && cause !== null && 'code' in cause && cause.code === '40001';
      await reload();
      setError(conflict ? 'O combate mudou em outra aba. O estado foi atualizado; confira o turno e tente novamente.' : 'Não foi possível salvar o combate. Nenhuma alteração foi confirmada. Tente recarregar.');
      return false;
    } finally {
      savingRef.current = false;
      if (identityRef.current === identity) setSaving(false);
    }
  }, [enabled, isMaster, loading, error, campaignId, identity, accept, reload]);

  return { state: snapshot.state, loading, saving, error, connected, reload, update };
}
