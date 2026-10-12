import { useQuery } from '@tanstack/react-query';
import { activityClient, awaitActivityResponse } from '@/services/character-activity-service';
import type { Json } from '@/integrations/supabase/types';

export interface FragmentationTarget { id: string; name: string; hp: number; excluded?: boolean; applied?: boolean; active?: boolean; conditions?: Json }
export interface FragmentationExplosion {
  id: string; createdAt: string; targets: FragmentationTarget[];
  payload: { point: string; dt: number | null; maxExcludedTargets: number; areaConfirmed?: boolean; explosiveType?: string;
    stage?: string; remainingRounds?: number; direction?: string; installation?: { total: number; passed: boolean; dice: number[] };
    result: { total: number; dice: number[] } };
}
export interface FragmentationContext { master: boolean; candidates: FragmentationTarget[]; explosions: FragmentationExplosion[] }

/** Carrega explosões persistidas e candidatos autorizados; falhas nunca viram uma lista vazia bem-sucedida. */
export function useFragmentationContext(characterId: string, page = 0) {
  return useQuery({ queryKey: ['explosives', characterId, page], queryFn: async () => {
    const response = await awaitActivityResponse(activityClient.rpc('get_character_explosives', { p_character_id: characterId, p_page: page }));
    if (response.error) throw new Error('Não foi possível carregar as explosões. Atualize antes de continuar.');
    const value = response.data as unknown as FragmentationContext;
    if (!value || !Array.isArray(value.explosions) || !Array.isArray(value.candidates) || typeof value.master !== 'boolean') {
      throw new Error('O servidor não retornou o controle de explosões esperado.');
    }
    return value;
  } });
}
