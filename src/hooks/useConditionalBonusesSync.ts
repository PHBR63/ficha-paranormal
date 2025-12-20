/**
 * useConditionalBonusesSync - Hook para sincronizar bônus condicionais com o banco de dados
 * 
 * Gerencia a persistência dos bônus condicionais ativos entre sessões,
 * salvando na coluna dedicada `active_conditional_bonuses` da tabela characters.
 */

import { useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseConditionalBonusesSyncProps {
  /** ID do personagem */
  characterId: string;
  /** Bônus condicionais ativos localmente */
  activeBonuses: string[];
  /** Callback para atualizar o estado local */
  onBonusesChange: (bonuses: string[]) => void;
  /** Se o sync está habilitado */
  enabled?: boolean;
}

interface UseConditionalBonusesSyncReturn {
  /** Ativa/desativa um bônus condicional */
  toggleBonus: (bonusId: string, active: boolean) => Promise<void>;
  /** Carrega os bônus salvos do banco */
  loadBonuses: () => Promise<void>;
  /** Limpa todos os bônus ativos */
  clearAllBonuses: () => Promise<void>;
}

/**
 * Hook para gerenciar a persistência de bônus condicionais ativos
 * Sincroniza automaticamente com o banco de dados Supabase
 */
export function useConditionalBonusesSync({
  characterId,
  activeBonuses,
  onBonusesChange,
  enabled = true,
}: UseConditionalBonusesSyncProps): UseConditionalBonusesSyncReturn {
  // Ref para evitar loops de sincronização
  const isSyncingRef = useRef(false);
  const lastSavedRef = useRef<string[]>([]);

  /**
   * Carrega os bônus salvos do banco de dados
   */
  const loadBonuses = useCallback(async () => {
    if (!characterId || !enabled) return;

    try {
      isSyncingRef.current = true;

      const { data, error } = await supabase
        .from('characters')
        .select('active_conditional_bonuses')
        .eq('id', characterId)
        .single();

      if (error) {
        console.error('[ConditionalBonusesSync] Erro ao carregar bônus:', error);
        return;
      }

      // Trata o retorno como array de strings
      const savedBonuses = (data?.active_conditional_bonuses as string[]) || [];
      
      // Atualiza estado local apenas se diferente
      if (JSON.stringify(savedBonuses) !== JSON.stringify(activeBonuses)) {
        lastSavedRef.current = savedBonuses;
        onBonusesChange(savedBonuses);
      }
    } catch (err) {
      console.error('[ConditionalBonusesSync] Erro inesperado ao carregar:', err);
    } finally {
      isSyncingRef.current = false;
    }
  }, [characterId, enabled, onBonusesChange, activeBonuses]);

  /**
   * Ativa ou desativa um bônus condicional
   */
  const toggleBonus = useCallback(async (bonusId: string, active: boolean) => {
    if (!characterId || !enabled) return;

    // Calcula novo array de bônus
    const newBonuses = active
      ? [...activeBonuses.filter(id => id !== bonusId), bonusId] // Adiciona se não existir
      : activeBonuses.filter(id => id !== bonusId); // Remove

    // Atualiza estado local imediatamente para feedback rápido
    onBonusesChange(newBonuses);

    try {
      const { error } = await supabase
        .from('characters')
        .update({ active_conditional_bonuses: newBonuses })
        .eq('id', characterId);

      if (error) {
        console.error('[ConditionalBonusesSync] Erro ao salvar bônus:', error);
        // Reverte em caso de erro
        onBonusesChange(activeBonuses);
        return;
      }

      lastSavedRef.current = newBonuses;
      console.log(`[ConditionalBonusesSync] Bônus ${bonusId} ${active ? 'ativado' : 'desativado'}`);
    } catch (err) {
      console.error('[ConditionalBonusesSync] Erro inesperado ao salvar:', err);
      // Reverte em caso de erro
      onBonusesChange(activeBonuses);
    }
  }, [characterId, enabled, activeBonuses, onBonusesChange]);

  /**
   * Limpa todos os bônus condicionais ativos
   */
  const clearAllBonuses = useCallback(async () => {
    if (!characterId || !enabled) return;

    // Atualiza estado local imediatamente
    onBonusesChange([]);

    try {
      const { error } = await supabase
        .from('characters')
        .update({ active_conditional_bonuses: [] })
        .eq('id', characterId);

      if (error) {
        console.error('[ConditionalBonusesSync] Erro ao limpar bônus:', error);
        // Reverte em caso de erro
        onBonusesChange(activeBonuses);
        return;
      }

      lastSavedRef.current = [];
      console.log('[ConditionalBonusesSync] Todos os bônus foram limpos');
    } catch (err) {
      console.error('[ConditionalBonusesSync] Erro inesperado ao limpar:', err);
      onBonusesChange(activeBonuses);
    }
  }, [characterId, enabled, activeBonuses, onBonusesChange]);

  // Carrega bônus salvos ao montar o componente
  useEffect(() => {
    if (characterId && enabled) {
      loadBonuses();
    }
  }, [characterId, enabled]); // loadBonuses não é dependência para evitar loops

  return {
    toggleBonus,
    loadBonuses,
    clearAllBonuses,
  };
}
