import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

export interface RitualApplicationTarget {
  id: string;
  name: string;
  user_id: string;
  hp_current: number;
  hp_max: number;
  conditions: Json;
  vigor: number;
  agility: number;
  presence: number;
  skills: Json;
}

/** Lista a ficha atual e fichas cujos donos estão vinculados a campanhas do mestre. */
export async function loadRitualApplicationTargets(characterId: string, userId: string): Promise<RitualApplicationTarget[]> {
  const campaigns = await Promise.all([
    supabase.from('campaigns').select('id').eq('master_id', userId),
    supabase.from('campaigns_v2').select('id').eq('master_id', userId),
  ]);
  for (const campaign of campaigns) if (campaign.error) throw campaign.error;
  const v1Ids = campaigns[0].data?.map(campaign => campaign.id) ?? [];
  const v2Ids = campaigns[1].data?.map(campaign => campaign.id) ?? [];
  const memberships = await Promise.all([
    v1Ids.length ? supabase.from('campaign_members').select('character_id,user_id').in('campaign_id', v1Ids) : Promise.resolve({ data: [], error: null }),
    v2Ids.length ? supabase.from('campaign_members_v2').select('character_id,user_id').in('campaign_id', v2Ids) : Promise.resolve({ data: [], error: null }),
  ]);
  for (const membership of memberships) if (membership.error) throw membership.error;
  const linkedOwners = new Map<string, Set<string>>();
  for (const member of memberships.flatMap(result => result.data ?? [])) {
    if (!member.character_id) continue;
    const owners = linkedOwners.get(member.character_id) ?? new Set<string>();
    owners.add(member.user_id);
    linkedOwners.set(member.character_id, owners);
  }
  const ids = [...new Set([characterId, ...linkedOwners.keys()])];
  const { data, error } = await supabase.from('characters')
    .select('id,name,user_id,hp_current,hp_max,conditions,vigor,agility,presence,skills').in('id', ids);
  if (error) throw error;
  // Uma associação criada com identidade diferente do dono não libera alvo.
  return (data ?? []).filter(character =>
    (character.id === characterId && character.user_id === userId)
    || linkedOwners.get(character.id)?.has(character.user_id),
  ).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
}

/** Cache é separado por usuário e ficha; autorização definitiva permanece na RPC. */
export function useRitualApplicationTargets(characterId: string) {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: ['ritual-application-targets', user?.id, characterId],
    enabled: Boolean(user?.id && characterId),
    queryFn: () => loadRitualApplicationTargets(characterId, user!.id),
    staleTime: 0,
  });
  return { targets: query.data ?? [], isLoading: query.isLoading, error: query.error, refetch: query.refetch };
}
