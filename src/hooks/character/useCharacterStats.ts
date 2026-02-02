/**
 * useCharacterStats - Hook para edição de HP/PE/SAN com persistência
 * 
 * Gerencia os stats editáveis do personagem (HP, PE, SAN) com:
 * - Estado local otimista
 * - Debounce de salvamento
 * - Sincronização com campanha em tempo real
 * 
 * NOTA: A aplicação de condições automáticas (HP=0 → Inconsciente) deve ser
 * feita no componente pai usando useAutoConditions, pois requer contexto
 * adicional (vigor, presence, lista completa de condições).
 * 
 * @module hooks/character/useCharacterStats
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CharacterStatsInput {
  characterId: string;
  initialHp: number;
  initialPe: number;
  initialSan: number;
  maxHp: number;
  maxPe: number;
  maxSan: number;
  /** Callback quando stats são salvos */
  onSave?: () => void;
  /** Callback quando stats locais mudam (para condições automáticas) */
  onStatsChange?: (hp: number, pe: number, san: number) => void;
  /** Debounce em ms para auto-save (default: 1000) */
  debounceMs?: number;
  /** Desabilitar auto-save */
  disableAutoSave?: boolean;
}

interface CharacterStatsReturn {
  /** HP atual (local) */
  hp: number;
  /** PE atual (local) */
  pe: number;
  /** SAN atual (local) */
  san: number;
  /** Define HP */
  setHp: (value: number) => void;
  /** Define PE */
  setPe: (value: number) => void;
  /** Define SAN */
  setSan: (value: number) => void;
  /** Ajusta HP com delta (+/-) */
  adjustHp: (delta: number) => void;
  /** Ajusta PE com delta (+/-) */
  adjustPe: (delta: number) => void;
  /** Ajusta SAN com delta (+/-) */
  adjustSan: (delta: number) => void;
  /** Salva stats imediatamente */
  saveNow: () => Promise<void>;
  /** Flag indicando se está salvando */
  isSaving: boolean;
  /** Erro de salvamento, se houver */
  error: string | null;
  /** Limpa todos os stats para máximo (descanso completo) */
  restoreAll: () => void;
  /** Sincroniza stats locais com banco */
  syncFromDatabase: () => Promise<void>;
}

export function useCharacterStats({
  characterId,
  initialHp,
  initialPe,
  initialSan,
  maxHp,
  maxPe,
  maxSan,
  onSave,
  onStatsChange,
  debounceMs = 1000,
  disableAutoSave = false,
}: CharacterStatsInput): CharacterStatsReturn {
  // Estado local
  const [hp, setHpInternal] = useState(initialHp);
  const [pe, setPeInternal] = useState(initialPe);
  const [san, setSanInternal] = useState(initialSan);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Refs para debounce
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingChangesRef = useRef(false);
  
  // Sincroniza com valores iniciais quando mudam
  useEffect(() => {
    setHpInternal(initialHp);
  }, [initialHp]);
  
  useEffect(() => {
    setPeInternal(initialPe);
  }, [initialPe]);
  
  useEffect(() => {
    setSanInternal(initialSan);
  }, [initialSan]);
  
  // Função de salvamento
  const saveStats = useCallback(async () => {
    if (!characterId || !pendingChangesRef.current) return;
    
    setIsSaving(true);
    setError(null);
    
    try {
      const { error: saveError } = await supabase
        .from('characters')
        .update({
          hp_current: hp,
          pe_current: pe,
          san_current: san,
        })
        .eq('id', characterId);
      
      if (saveError) throw saveError;
      
      pendingChangesRef.current = false;
      onSave?.();
    } catch (err) {
      console.error('Erro ao salvar stats:', err);
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setIsSaving(false);
    }
  }, [characterId, hp, pe, san, onSave]);
  
  // Debounce de salvamento
  const scheduleSave = useCallback(() => {
    if (disableAutoSave) return;
    
    pendingChangesRef.current = true;
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      saveStats();
    }, debounceMs);
  }, [saveStats, debounceMs, disableAutoSave]);
  
  // Limpa timeout ao desmontar
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);
  
  // Setters com validação
  const setHp = useCallback((value: number) => {
    const newValue = Math.max(0, Math.min(value, maxHp));
    setHpInternal(newValue);
    scheduleSave();
    onStatsChange?.(newValue, pe, san);
  }, [maxHp, pe, san, scheduleSave, onStatsChange]);
  
  const setPe = useCallback((value: number) => {
    const newValue = Math.max(0, Math.min(value, maxPe));
    setPeInternal(newValue);
    scheduleSave();
    onStatsChange?.(hp, newValue, san);
  }, [hp, maxPe, san, scheduleSave, onStatsChange]);
  
  const setSan = useCallback((value: number) => {
    const newValue = Math.max(0, Math.min(value, maxSan));
    setSanInternal(newValue);
    scheduleSave();
    onStatsChange?.(hp, pe, newValue);
  }, [hp, pe, maxSan, scheduleSave, onStatsChange]);
  
  // Ajustadores com delta
  const adjustHp = useCallback((delta: number) => {
    setHp(hp + delta);
  }, [hp, setHp]);
  
  const adjustPe = useCallback((delta: number) => {
    setPe(pe + delta);
  }, [pe, setPe]);
  
  const adjustSan = useCallback((delta: number) => {
    setSan(san + delta);
  }, [san, setSan]);
  
  // Restaurar todos os stats
  const restoreAll = useCallback(() => {
    setHpInternal(maxHp);
    setPeInternal(maxPe);
    setSanInternal(maxSan);
    scheduleSave();
    onStatsChange?.(maxHp, maxPe, maxSan);
  }, [maxHp, maxPe, maxSan, scheduleSave, onStatsChange]);
  
  // Sincroniza do banco
  const syncFromDatabase = useCallback(async () => {
    if (!characterId) return;
    
    try {
      const { data, error: fetchError } = await supabase
        .from('characters')
        .select('hp_current, pe_current, san_current')
        .eq('id', characterId)
        .single();
      
      if (fetchError) throw fetchError;
      if (data) {
        setHpInternal(data.hp_current);
        setPeInternal(data.pe_current);
        setSanInternal(data.san_current);
      }
    } catch (err) {
      console.error('Erro ao sincronizar stats:', err);
    }
  }, [characterId]);
  
  // Salva imediatamente
  const saveNow = useCallback(async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    pendingChangesRef.current = true;
    await saveStats();
  }, [saveStats]);
  
  return {
    hp,
    pe,
    san,
    setHp,
    setPe,
    setSan,
    adjustHp,
    adjustPe,
    adjustSan,
    saveNow,
    isSaving,
    error,
    restoreAll,
    syncFromDatabase,
  };
}
