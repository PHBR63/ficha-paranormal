/**
 * useSustainedRituals - Hook reativo para gerenciar rituais sustentados com persistência
 * e atualizações em tempo real via Supabase Realtime
 * 
 * ATUALIZADO: Agora usa o sistema unificado de rituais
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { listSustainedRituals, type SustainedSnapshot } from '@/services/sustained-ritual-service';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getActiveRitualEffectUnified } from '@/lib/rituals/ritual-adapter';
import { getRitualEffect } from '@/lib/rituals/ritual-registry';
import type { RitualMechanics } from '@/lib/rituals/types';
import type { RitualEffect, SustainConfig } from '@/lib/rituals/legacy-exports';
import { Json } from '@/integrations/supabase/types';

// Interface para ritual sustentado (do banco)
interface SustainedRitualRow {
  caster_character_id?: string | null;
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
  /** Retornado pelo servidor a partir de prova privada; ausente em legados. */
  casterCharacterId?: string | null;
  snapshot?: SustainedSnapshot;
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
export interface UseSustainedRitualsReturn {
  error: string | null;
  reload: () => Promise<boolean>;
  rituals: SustainedRitual[];
  loading: boolean;

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
    casterCharacterId: row.caster_character_id ?? null,
    snapshot: { id: row.id, ritual_id: row.ritual_id, turns_active: row.turns_active,
      pe_spent_total: row.pe_spent_total, sustain_config: row.sustain_config, is_concentrating: row.is_concentrating },
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
  const userId = user?.id;
  const [rituals, setRituals] = useState<SustainedRitual[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const context = `${userId ?? ''}:${characterId ?? ''}:${enabled}`;
  const currentContext = useRef(context); currentContext.current = context;
  const sequence = useRef(0);

  // Carrega rituais do banco
  const loadRituals = useCallback(async () => {
    const request = ++sequence.current;
    const isCurrent = () => currentContext.current === context && sequence.current === request;
    if (!characterId || !userId || !enabled) {
      setRituals([]);
      setLoading(false);
      setError(null);
      return false;
    }
    setLoading(true);
    try {
      const rows = await listSustainedRituals(characterId);
      if (!isCurrent()) return currentContext.current === context;
      if (rows.some(row => !row || typeof row !== 'object' || Array.isArray(row) || (row.character_id !== characterId && row.caster_character_id !== characterId) || typeof row.id !== 'string')) {
        throw new Error('A lista recebida não corresponde à ficha atual.');
      }
      setRituals(rows.map(row => fromDB(row as unknown as SustainedRitualRow)));
      setError(null);
      return true;
    } catch (err) {
      if (isCurrent()) setError(err instanceof Error ? err.message : 'Não foi possível carregar os rituais sustentados.');
      // Falha de releitura não equivale a encerramento: mantém os últimos dados.
      return false;
    } finally {
      if (isCurrent()) setLoading(false);
    }
  }, [characterId, userId, enabled, context]);

  // Carrega inicialmente
  useEffect(() => {
    currentContext.current = context;
    setRituals([]); setError(null);
    void loadRituals();
    return () => { currentContext.current = ""; };
  }, [loadRituals, context]);

  // Após reconexão, recupera o estado confirmado em vez de presumir eventos recebidos.
  useEffect(() => {
    const refresh = () => { void loadRituals(); };
    const resume = () => { if (document.visibilityState === 'visible') refresh(); };
    window.addEventListener('online', refresh); document.addEventListener('visibilitychange', resume);
    return () => { window.removeEventListener('online', refresh); document.removeEventListener('visibilitychange', resume); };
  }, [loadRituals]);

  // Escuta atualizações em tempo real
  useEffect(() => {
    if (!characterId || !userId || !enabled) return;

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
        () => { void loadRituals(); }

      )
      // A criação em outro alvo gera um recibo com a autoria do conjurador.
      .on('postgres_changes', { event: '*', schema: 'public', table: 'character_activity_events', filter: `author_id=eq.${userId}` }, payload => {
        const event = payload.new as { category?: string; payload?: { kind?: string } };
        if (event.category === 'application' && ['sustain', 'sustain_maintenance', 'sustain_end'].includes(event.payload?.kind ?? '')) void loadRituals();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'character_activity_events', filter: `character_id=eq.${characterId}` }, () => { void loadRituals(); })
      .subscribe(status => { if (status === 'SUBSCRIBED') void loadRituals(); });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [characterId, userId, enabled, loadRituals]);

  return { error, reload: loadRituals, rituals, loading };
}
