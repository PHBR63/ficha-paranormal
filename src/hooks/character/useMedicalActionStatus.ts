import { useQuery } from '@tanstack/react-query';
import { activityClient, activityFailure } from '@/services/character-activity-service';

interface MedicalActionStatus {
  canAct: boolean;
  reason: string | null;
}

/** Consulta a mesma regra de incapacidade que o servidor aplica às ações médicas. */
export function useMedicalActionStatus(characterId?: string) {
  return useQuery({
    queryKey: ['medical-action-capability', characterId],
    enabled: !!characterId,
    queryFn: async (): Promise<MedicalActionStatus> => {
      const { data, error } = await activityClient.rpc('get_character_medical_capability', {
        p_character_id: characterId,
      });
      if (error) throw activityFailure('Não foi possível conferir se o personagem pode agir.', error);
      if (!data || typeof data !== 'object' || Array.isArray(data)
        || typeof (data as Record<string, unknown>).canAct !== 'boolean') {
        throw new Error('O servidor não confirmou se o personagem pode agir.');
      }
      const status = data as Record<string, unknown>;
      return { canAct: status.canAct as boolean,
        reason: typeof status.reason === 'string' ? status.reason : null };
    },
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
    refetchInterval: 5000,
  });
}
