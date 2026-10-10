import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AccessoryReviewItem {
  id: string; name: string; signature: string; approved: boolean; inUse: boolean;
  bonuses: Record<string, number>;
}
interface AccessoryReviewState {
  canReview: boolean; items: AccessoryReviewItem[]; bonuses: Record<string, number>;
}
const EMPTY: AccessoryReviewState = { canReview: false, items: [], bonuses: {} };

/** Consulta o aval e os bônus calculados pelo servidor; confirmar só altera após resposta. */
export function useAccessoryApprovals(characterId?: string, inventory: readonly unknown[] = []) {
  const client = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  const running = useRef(false);
  const intent = useRef<{ key: string; id: string } | undefined>(undefined);
  const hasAccessories = inventory.some(item => item && typeof item === 'object' && 'catalogType' in item && item.catalogType === 'acessorio');
  const query = useQuery({
    queryKey: ['character-accessories', characterId, JSON.stringify(inventory)],
    enabled: !!characterId && hasAccessories,
    refetchInterval: 15000,
    queryFn: async (): Promise<AccessoryReviewState> => {
      const { data, error } = await (supabase.rpc as any)('get_character_accessories', { p_character_id: characterId });
      if (error) throw new Error(error.message);
      return data as AccessoryReviewState;
    },
  });
  const confirm = async (item: AccessoryReviewItem, action: 'review' | 'use', enabled: boolean, note = '') => {
    if (running.current || !characterId) return;
    running.current = true;
    const key = JSON.stringify([characterId, item.id, item.signature, action, enabled, note]);
    if (intent.current?.key !== key) intent.current = { key, id: crypto.randomUUID() };
    setBusy(true); setActionError('');
    try {
      const { error } = await (supabase.rpc as any)('confirm_character_accessory', {
        p_operation_id: intent.current.id, p_character_id: characterId, p_item_id: item.id,
        p_signature: item.signature, p_action: action, p_enabled: enabled, p_note: note,
      });
      if (error) throw new Error(error.message);
      intent.current = undefined;
      await client.invalidateQueries({ queryKey: ['character-accessories', characterId] });
      await client.invalidateQueries({ queryKey: ['character-activity', characterId] });
    } catch (error) { setActionError(error instanceof Error ? error.message : 'Não foi possível confirmar o acessório.'); }
    finally { running.current = false; setBusy(false); }
  };
  return { ...(query.isError || !hasAccessories ? EMPTY : query.data ?? EMPTY), busy, confirm,
    loading: query.isFetching, refresh: query.refetch,
    error: actionError || (query.error instanceof Error ? query.error.message : '') };
}
