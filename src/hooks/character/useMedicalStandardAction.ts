import { useEffect, useId } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { activityClient, activityFailure } from '@/services/character-activity-service';

export interface MedicalActionStatus {
  tracked: boolean;
  eligible: boolean;
  turnKey: string | null;
  spent: number;
  extra: number;
  available: number | null;
}

/** Aceita somente o contrato completo; uma resposta incompleta não libera a cura. */
function parseMedicalActionStatus(value: unknown): MedicalActionStatus {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Ações médicas indisponíveis. Atualize a ficha.');
  const data = value as Record<string, unknown>;
  if (typeof data.tracked !== 'boolean' || typeof data.eligible !== 'boolean'
    || !(data.turnKey === null || typeof data.turnKey === 'string')
    || !Number.isInteger(data.spent) || !Number.isInteger(data.extra)
    || !(data.available === null || Number.isInteger(data.available))) {
    throw new Error('Controle de ações incompleto. Atualize a ficha.');
  }
  return data as unknown as MedicalActionStatus;
}

/** Consulta o servidor, compartilhando cache entre Médico de Campo e tracker. */
export function useMedicalStandardAction(characterId: string) {
  const queries = useQueryClient();
  const subscriptionId = useId();
  const query = useQuery({
    queryKey: ['medical-action-status', characterId], enabled: !!characterId,
    queryFn: async () => {
      const { data, error } = await activityClient.rpc('get_character_medical_action_status', { p_character_id: characterId });
      if (error) throw activityFailure('Não foi possível conferir a ação padrão.', error);
      return parseMedicalActionStatus(data);
    }, refetchOnReconnect: true, refetchOnWindowFocus: true,
  });
  useEffect(() => {
    if (!characterId) return;
    const refresh = () => { void queries.invalidateQueries({ queryKey: ['medical-action-status', characterId] }); };
    const channel = supabase.channel(`medical-action-${characterId}-${subscriptionId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'character_activity_events', filter: `character_id=eq.${characterId}` }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'campaign_combat_state_v2' }, refresh)
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [characterId, queries, subscriptionId]);
  return query;
}
