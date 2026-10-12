import { useQuery } from '@tanstack/react-query';
import { activityClient, awaitActivityResponse } from '@/services/character-activity-service';

export interface FragmentationTarget { id: string; name: string; hp: number; excluded?: boolean; applied?: boolean }
export interface FragmentationExplosion {
  id: string; createdAt: string; targets: FragmentationTarget[];
  payload: { point: string; dt: number; maxExcludedTargets: number; areaConfirmed?: boolean; result: { total: number; dice: number[] } };
}
export interface FragmentationContext { master: boolean; candidates: FragmentationTarget[]; explosions: FragmentationExplosion[] }

/** Carrega explosões persistidas e candidatos autorizados; falhas nunca viram uma lista vazia bem-sucedida. */
export function useFragmentationContext(characterId: string, page = 0) {
  return useQuery({ queryKey: ['fragmentation', characterId, page], queryFn: async () => {
    const response = await awaitActivityResponse(activityClient.rpc('get_character_fragmentation', { p_character_id: characterId, p_page: page }));
    if (response.error) throw new Error('Não foi possível carregar as explosões. Atualize antes de continuar.');
    const value = response.data as unknown as FragmentationContext;
    if (!value || !Array.isArray(value.explosions) || !Array.isArray(value.candidates) || typeof value.master !== 'boolean') {
      throw new Error('O servidor não retornou o controle de explosões esperado.');
    }
    return value;
  } });
}
