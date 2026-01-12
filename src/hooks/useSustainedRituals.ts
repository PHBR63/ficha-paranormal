/**
 * useSustainedRituals - Hook reativo para gerenciar rituais sustentados com persistência
 * e atualizações em tempo real via Supabase Realtime
 * 
 * ATUALIZADO: Agora usa o sistema unificado de rituais
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getActiveRitualEffectUnified } from '@/lib/rituals/ritual-adapter';
import { getRitualById, getEffectiveLevel, getRitualEffect } from '@/lib/rituals/ritual-registry';
import type { UnifiedRitual, RitualMechanics } from '@/lib/rituals/types';
import type { Ritual as LegacyRitual, RitualEffect, SustainConfig } from '@/lib/rituals/legacy-exports';
import { Json } from '@/integrations/supabase/types';

// Interface para ritual sustentado (do banco)
interface SustainedRitualRow {
  id: string;
  character_id: string;
  user_id: string;
  ritual_id: string;
  ritual_name: string;
  element: string;
  circle: number;
  selected_enhancements: string[];
  sustain_config: Json;
  turns_active: number;
  pe_spent_total: number;
  is_concentrating: boolean;
  started_at: string;
  created_at: string;
}

// Interface para uso no frontend (compatível com sistema existente)
export interface SustainedRitual {
  id: string;
  characterId: string;
  ritualId: string;
  ritualName: string;
  element: string;
  circle: number;
  selectedEnhancements: string[];
  sustainConfig: SustainConfig;
  turnsActive: number;
  peSpentTotal: number;
  isConcentrating: boolean;
  startedAt: Date;
  // Efeito calculado (não persistido) - usa sistema unificado
  effect?: RitualEffect;
  // Mecânicas do sistema unificado
  mechanics?: RitualMechanics;
}

// Props do hook
interface UseSustainedRitualsProps {
  characterId: string | undefined;
  enabled?: boolean;
}

// Retorno do hook
interface UseSustainedRitualsReturn {
  rituals: SustainedRitual[];
  loading: boolean;
  activateRitual: (
    ritual: LegacyRitual | UnifiedRitual,
    enhancements: string[],
    sustain: SustainConfig
  ) => Promise<void>;
  deactivateRitual: (ritualId: string) => Promise<void>;
  deactivateByRitualId: (ritualId: string) => Promise<void>;
  updateTurns: (id: string, turns: number) => Promise<void>;
  clearAll: () => Promise<void>;
}

// Converte do formato DB para o formato frontend
function fromDB(row: SustainedRitualRow): SustainedRitual {
  // Usa o sistema unificado para obter efeitos
  const effect = getActiveRitualEffectUnified(row.ritual_id, row.selected_enhancements || []);
  
  // Também obtém as mecânicas do sistema unificado diretamente
  const mechanics = getRitualEffect(row.ritual_id, row.selected_enhancements || []);
  
  const sustainConfig = (typeof row.sustain_config === 'object' && row.sustain_config !== null)
    ? row.sustain_config as unknown as SustainConfig
    : {};
  
  return {
    id: row.id,
    characterId: row.character_id,
    ritualId: row.ritual_id,
    ritualName: row.ritual_name,
    element: row.element,
    circle: row.circle,
    selectedEnhancements: row.selected_enhancements || [],
    sustainConfig,
    turnsActive: row.turns_active,
    peSpentTotal: row.pe_spent_total,
    isConcentrating: row.is_concentrating,
    startedAt: new Date(row.started_at),
    effect,
    mechanics,
  };
}

/**
 * Hook para gerenciar rituais sustentados com persistência e realtime
 */
export function useSustainedRituals({
  characterId,
  enabled = true,
}: UseSustainedRitualsProps): UseSustainedRitualsReturn {
  const { user } = useAuth();
  const [rituals, setRituals] = useState<SustainedRitual[]>([]);
  const [loading, setLoading] = useState(true);

  // Carrega rituais do banco
  const loadRituals = useCallback(async () => {
    if (!characterId || !user || !enabled) {
      setRituals([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('character_sustained_rituals')
        .select('*')
        .eq('character_id', characterId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Erro ao carregar rituais sustentados:', error);
        setRituals([]);
      } else {
        setRituals((data || []).map(row => fromDB(row as SustainedRitualRow)));
      }
    } catch (err) {
      console.error('Erro inesperado ao carregar rituais:', err);
      setRituals([]);
    } finally {
      setLoading(false);
    }
  }, [characterId, user, enabled]);

  // Carrega inicialmente
  useEffect(() => {
    loadRituals();
  }, [loadRituals]);

  // Escuta atualizações em tempo real
  useEffect(() => {
    if (!characterId || !user || !enabled) return;

    const channel = supabase
      .channel(`sustained-rituals-${characterId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'character_sustained_rituals',
          filter: `character_id=eq.${characterId}`,
        },
        (payload) => {
          console.log('[Realtime] Sustained ritual change:', payload.eventType);
          
          if (payload.eventType === 'INSERT') {
            const newRitual = fromDB(payload.new as SustainedRitualRow);
            setRituals(prev => {
              // Evita duplicatas
              if (prev.some(r => r.id === newRitual.id)) return prev;
              return [...prev, newRitual];
            });
          } else if (payload.eventType === 'UPDATE') {
            const updated = fromDB(payload.new as SustainedRitualRow);
            setRituals(prev => 
              prev.map(r => r.id === updated.id ? updated : r)
            );
          } else if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as { id: string }).id;
            setRituals(prev => prev.filter(r => r.id !== deletedId));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [characterId, user, enabled]);

  // Ativa um ritual sustentado
  const activateRitual = useCallback(async (
    ritual: LegacyRitual | UnifiedRitual,
    enhancements: string[],
    sustain: SustainConfig
  ) => {
    if (!characterId || !user) {
      console.error('Não é possível ativar ritual: characterId ou user ausente');
      return;
    }

    // Verifica se já existe um ritual igual ativo
    const existing = rituals.find(r => r.ritualId === ritual.id);
    if (existing) {
      console.log('Ritual já está ativo, ignorando:', ritual.id);
      return;
    }

    try {
      const insertData = {
        character_id: characterId,
        user_id: user.id,
        ritual_id: ritual.id,
        ritual_name: ritual.name,
        element: ritual.element,
        circle: ritual.circle,
        selected_enhancements: enhancements,
        sustain_config: sustain as unknown as Json,
        turns_active: 0,
        pe_spent_total: 0,
        is_concentrating: sustain.concentration || false,
      };

      const { error } = await supabase
        .from('character_sustained_rituals')
        .insert(insertData);

      if (error) {
        console.error('Erro ao ativar ritual sustentado:', error);
      } else {
        console.log('Ritual sustentado ativado:', ritual.name);
      }
    } catch (err) {
      console.error('Erro inesperado ao ativar ritual:', err);
    }
  }, [characterId, user, rituals]);

  // Desativa um ritual por ID do registro
  const deactivateRitual = useCallback(async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('character_sustained_rituals')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Erro ao desativar ritual:', error);
      } else {
        console.log('Ritual sustentado desativado:', id);
      }
    } catch (err) {
      console.error('Erro inesperado ao desativar ritual:', err);
    }
  }, [user]);

  // Desativa por ritual_id (para quando não temos o ID do registro)
  const deactivateByRitualId = useCallback(async (ritualId: string) => {
    if (!user || !characterId) return;

    try {
      const { error } = await supabase
        .from('character_sustained_rituals')
        .delete()
        .eq('ritual_id', ritualId)
        .eq('character_id', characterId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Erro ao desativar ritual por ID:', error);
      }
    } catch (err) {
      console.error('Erro inesperado ao desativar ritual por ID:', err);
    }
  }, [user, characterId]);

  // Atualiza contagem de turnos
  const updateTurns = useCallback(async (id: string, turns: number) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('character_sustained_rituals')
        .update({ turns_active: turns })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Erro ao atualizar turnos:', error);
      }
    } catch (err) {
      console.error('Erro inesperado ao atualizar turnos:', err);
    }
  }, [user]);

  // Limpa todos os rituais do personagem
  const clearAll = useCallback(async () => {
    if (!user || !characterId) return;

    try {
      const { error } = await supabase
        .from('character_sustained_rituals')
        .delete()
        .eq('character_id', characterId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Erro ao limpar rituais:', error);
      } else {
        console.log('Todos rituais sustentados removidos');
      }
    } catch (err) {
      console.error('Erro inesperado ao limpar rituais:', err);
    }
  }, [user, characterId]);

  return {
    rituals,
    loading,
    activateRitual,
    deactivateRitual,
    deactivateByRitualId,
    updateTurns,
    clearAll,
  };
}
