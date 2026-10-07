import { useEffect, useId } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getPETurnBudget } from '@/services/pe-turn-budget-service';
import { useAuth } from '@/contexts/AuthContext';

/** Recupera o orçamento ao reconectar, voltar à ficha ou receber mudança de turno/gasto. */
export function usePETurnBudget(characterId: string) {
  const client = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id;
  const subscriptionId = useId();
  const query = useQuery({ queryKey: ['pe-turn-budget', userId, characterId], queryFn: () => getPETurnBudget(characterId),
    enabled: !!characterId && !!userId, refetchOnReconnect: true, refetchOnWindowFocus: true });
  useEffect(() => {
    if (!characterId || !userId) return;
    const refresh = () => { void client.invalidateQueries({ queryKey: ['pe-turn-budget', userId, characterId] }); };
    const channel = supabase.channel(`pe-budget-${characterId}-${subscriptionId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'character_activity_events', filter: `character_id=eq.${characterId}` }, refresh)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'characters', filter: `id=eq.${characterId}` }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'campaign_combat_state_v2' }, refresh).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [characterId, client, subscriptionId, userId]);
  return query;
}
