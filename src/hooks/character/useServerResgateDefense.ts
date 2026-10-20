import { useEffect, useId, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { activityClient } from '@/services/character-activity-service';

/** A Defesa de Resgate só conta após consulta ao recibo e ao turno no servidor. */
export function useServerResgateDefense(characterId?: string): number {
  const subscriptionId = useId();
  const [bonus, setBonus] = useState(0);
  useEffect(() => {
    if (!characterId) { setBonus(0); return; }
    let active = true;
    const refresh = async () => {
      const { data, error } = await activityClient.rpc('get_character_resgate_defense_status', {
        p_character_id: characterId,
      });
      if (!active) return;
      if (error || !data || typeof data !== 'object' || Array.isArray(data)) { setBonus(0); return; }
      const next = (data as Record<string, unknown>).bonus;
      setBonus(next === 5 ? 5 : 0);
    };
    void refresh();
    const onVisible = () => { if (document.visibilityState === 'visible') void refresh(); };
    const onUpdated = () => void refresh();
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('character-medico-support-updated', onUpdated);
    // O turno de combate confirmado encerra imediatamente o bônus manual.
    const channel = supabase.channel(`resgate-defense-${characterId}-${subscriptionId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'campaign_combat_state_v2' }, onUpdated)
      .subscribe();
    // Também captura aplicações e avanços de turno feitos em outro dispositivo.
    const timer = window.setInterval(() => void refresh(), 5000);
    return () => {
      active = false;
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('character-medico-support-updated', onUpdated);
      void supabase.removeChannel(channel);
      window.clearInterval(timer);
    };
  }, [characterId, subscriptionId]);
  return bonus;
}
