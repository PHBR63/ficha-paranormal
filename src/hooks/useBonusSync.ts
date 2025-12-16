/**
 * useBonusSync - Hook para sincronizar bônus ativos do personagem com a campanha
 * 
 * Permite que o mestre veja em tempo real os modificadores de cada jogador
 */

import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BonusSummary } from './useCharacterBonusSummary';

interface UseBonusSyncProps {
  characterId: string;
  bonusSummary: BonusSummary;
  enabled?: boolean;
}

/**
 * Serializa o resumo de bônus para formato compacto de armazenamento
 */
function serializeBonusSummary(summary: BonusSummary): Record<string, any> {
  return {
    defense: summary.defense.total,
    resistances: {
      fortitude: summary.resistances.fortitude.total,
      reflexos: summary.resistances.reflexos.total,
      vontade: summary.resistances.vontade.total,
    },
    combat: {
      attack: summary.combat.attack.total,
      damage: summary.combat.damage.total,
      extraDice: summary.combat.damage.extraDice,
      criticalMargin: summary.combat.criticalMargin.total,
      initiative: summary.combat.initiative.total,
    },
    damageReduction: {
      physical: summary.damageReduction.physical.total,
      paranormal: summary.damageReduction.paranormal.total,
    },
    effectResistances: {
      poison: summary.effectResistances.poison,
      disease: summary.effectResistances.disease,
      mental: summary.effectResistances.mental,
    },
    skills: Object.fromEntries(
      Object.entries(summary.skills).map(([k, v]) => [k, v.total])
    ),
    stats: {
      hp: summary.hpBonus,
      pe: summary.peBonus,
    },
    specialCount: summary.special.length,
    // Lista de fontes ativas para exibição rápida
    activeSources: [
      ...summary.defense.breakdown.filter(b => b.active).map(b => b.source),
      ...summary.resistances.fortitude.breakdown.filter(b => b.active).map(b => b.source),
      ...summary.combat.attack.breakdown.filter(b => b.active).map(b => b.source),
      ...summary.combat.initiative.breakdown.filter(b => b.active).map(b => b.source),
      ...summary.damageReduction.physical.breakdown.filter(b => b.active).map(b => b.source),
      ...Object.values(summary.skills).flatMap(s => s.breakdown.filter(b => b.active).map(b => b.source)),
    ].filter((v, i, a) => a.indexOf(v) === i), // Remove duplicatas
  };
}

/**
 * Hook que sincroniza automaticamente os bônus do personagem com a campanha
 */
export function useBonusSync({
  characterId,
  bonusSummary,
  enabled = true,
}: UseBonusSyncProps) {
  // Ref para evitar atualizações desnecessárias
  const lastSyncRef = useRef<string>('');
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Função de sincronização
  const syncBonuses = useCallback(async () => {
    if (!characterId || !enabled) return;

    try {
      // Serializa o resumo de bônus
      const serialized = serializeBonusSummary(bonusSummary);
      const serializedJson = JSON.stringify(serialized);

      // Verifica se mudou desde última sincronização
      if (serializedJson === lastSyncRef.current) {
        return;
      }

      // Busca membership do personagem na campanha
      const { data: membership, error: memberError } = await supabase
        .from('campaign_members')
        .select('id, campaign_id')
        .eq('character_id', characterId)
        .maybeSingle();

      if (memberError) {
        console.error('[BonusSync] Erro ao buscar membership:', memberError);
        return;
      }

      // Se não está em campanha, não precisa sincronizar
      if (!membership) {
        return;
      }

      // Atualiza os bônus no registro de membro
      const { error: updateError } = await supabase
        .from('campaign_members')
        .update({
          active_bonuses: serialized,
          bonuses_updated_at: new Date().toISOString(),
        })
        .eq('id', membership.id);

      if (updateError) {
        console.error('[BonusSync] Erro ao sincronizar bônus:', updateError);
        return;
      }

      // Atualiza ref de última sincronização
      lastSyncRef.current = serializedJson;
      console.log('[BonusSync] Bônus sincronizados com sucesso');
    } catch (err) {
      console.error('[BonusSync] Erro inesperado:', err);
    }
  }, [characterId, bonusSummary, enabled]);

  // Sincroniza com debounce quando os bônus mudam
  useEffect(() => {
    if (!enabled) return;

    // Limpa timeout anterior
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Aguarda 2 segundos antes de sincronizar (evita muitas requisições)
    debounceRef.current = setTimeout(() => {
      syncBonuses();
    }, 2000);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [syncBonuses, enabled]);

  // Sincroniza imediatamente ao montar
  useEffect(() => {
    if (enabled) {
      syncBonuses();
    }
  }, [enabled]); // Apenas na montagem

  return { syncBonuses };
}

/**
 * Interface para bônus recebidos da campanha
 */
export interface CampaignMemberBonuses {
  memberId: string;
  characterId: string | null;
  characterName?: string;
  bonuses: {
    defense: number;
    resistances: { fortitude: number; reflexos: number; vontade: number };
    combat: { attack: number; damage: number; extraDice: string[]; criticalMargin: number; initiative: number };
    damageReduction: { physical: number; paranormal: number };
    effectResistances: { poison: number; disease: number; mental: number };
    skills: Record<string, number>;
    stats: { hp: number; pe: number };
    specialCount: number;
    activeSources: string[];
  } | null;
  updatedAt: string | null;
}
