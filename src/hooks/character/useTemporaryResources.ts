import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { listTemporaryResources } from '@/services/temporary-resource-service';

/** Compartilha saldo confirmado por ficha e recupera mudanças após reconexão. */
export function useTemporaryResources(characterId: string) {
  const client = useQueryClient();
  const key = ['temporary-resources', characterId];
  const query = useQuery({ queryKey: key, queryFn: () => listTemporaryResources(characterId), enabled: !!characterId, refetchOnReconnect: true });
  useEffect(() => {
    if (!characterId) return;
    const channel = supabase.channel(`temporary-resources-${characterId}`).on('postgres_changes', {
      event: 'INSERT', schema: 'public', table: 'character_activity_events', filter: `character_id=eq.${characterId}`,
    }, () => { void client.invalidateQueries({ queryKey: ['temporary-resources', characterId] }); }).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [characterId, client]);
  return { ...query, hp: (query.data ?? []).filter(item => item.resource === 'hp').reduce((sum, item) => sum + item.remaining, 0),
    pe: (query.data ?? []).filter(item => item.resource === 'pe').reduce((sum, item) => sum + item.remaining, 0) };
}
