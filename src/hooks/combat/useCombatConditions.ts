/**
 * useCombatConditions - Hook de bridge entre sistema de condições e CombatTracker
 * 
 * Gerencia condições de combatentes no CombatTracker, sincronizando com o
 * banco de dados quando os combatentes são personagens vinculados.
 * Suporta realtime sync para que mudanças na ficha reflitam no combate e vice-versa.
 * 
 * @module hooks/combat/useCombatConditions
 */

import { useCallback, useEffect, useState, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CONDITIONS, type ConditionDefinition } from '@/lib/conditions-data';
import type { CombatantState } from '@/lib/game-engine';
import type { AddConditionData, ActiveCondition } from '@/hooks/character/useConditions';

/**
 * Configuração do hook
 */
export interface UseCombatConditionsProps {
  /** ID da campanha (para sync em tempo real) */
  campaignId?: string;
  /** ID do usuário atual */
  userId?: string;
  /** Se está habilitado */
  enabled?: boolean;
  /** IDs de personagens para subscrever em tempo real */
  characterIds?: string[];
}

/**
 * Resultado de decremento de condições
 */
export interface DecrementResult {
  /** Quantas condições foram decrementadas */
  decremented: number;
  /** Quantas condições expiraram */
  expired: number;
  /** Mensagens para o log de combate */
  messages: string[];
  /** Condições que expiraram */
  expiredConditions: string[];
}

/**
 * Condição local para combatentes não vinculados a personagens
 */
export interface LocalCombatCondition {
  id: string;
  conditionId: string;
  conditionName: string;
  description?: string;
  mechanicalEffect?: string;
  durationType: 'permanent' | 'rounds' | 'scene' | 'until_rest' | 'until_end_of_turn';
  durationRemaining: number | null;
  decrementsAt: 'start_of_turn' | 'end_of_turn' | 'manual';
  stacks: number;
  sourceName?: string;
  color?: string;
  icon?: string;
}

/**
 * Evento de mudança de condição para realtime
 */
export interface ConditionChangeEvent {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  characterId: string;
  condition: ActiveCondition | null;
  conditionId: string;
}

/**
 * Retorno do hook
 */
export interface UseCombatConditionsReturn {
  /**
   * Aplica uma condição a um combatente
   * @param combatantId - ID do combatente
   * @param data - Dados da condição a aplicar
   * @param characterId - ID do personagem (se vinculado ao BD)
   */
  applyCondition: (
    combatantId: string,
    data: AddConditionData,
    characterId?: string
  ) => Promise<LocalCombatCondition>;

  /**
   * Remove uma condição de um combatente
   * @param combatantId - ID do combatente
   * @param conditionInstanceId - ID da instância da condição
   * @param characterId - ID do personagem (se vinculado ao BD)
   */
  removeCondition: (
    combatantId: string,
    conditionInstanceId: string,
    characterId?: string
  ) => Promise<boolean>;

  /**
   * Decrementa condições no início do turno
   * @param combatant - Combatente cujo turno iniciou
   * @param localConditions - Condições locais do combatente
   */
  decrementOnTurnStart: (
    combatant: CombatantState,
    localConditions: LocalCombatCondition[]
  ) => Promise<DecrementResult>;

  /**
   * Decrementa condições no fim do turno
   * @param combatant - Combatente cujo turno terminou
   * @param localConditions - Condições locais do combatente
   */
  decrementOnTurnEnd: (
    combatant: CombatantState,
    localConditions: LocalCombatCondition[]
  ) => Promise<DecrementResult>;

  /**
   * Converte condições do BD para formato local
   */
  dbConditionsToLocal: (dbConditions: ActiveCondition[]) => LocalCombatCondition[];

  /**
   * Processa efeitos de condições no início do turno (dano de sangrando, etc)
   * @param combatant - Combatente
   * @param conditions - Condições ativas
   */
  processConditionEffects: (
    combatant: CombatantState,
    conditions: LocalCombatCondition[]
  ) => { damage: number; healing: number; messages: string[] };

  /**
   * Condições sincronizadas do banco de dados por characterId
   */
  syncedConditions: Record<string, LocalCombatCondition[]>;

  /**
   * Força refresh das condições de um personagem
   */
  refreshConditions: (characterId: string) => Promise<void>;

  /**
   * Listener de mudanças em tempo real
   */
  onConditionChange?: (event: ConditionChangeEvent) => void;

  /**
   * Registra um callback para mudanças de condições
   */
  registerChangeListener: (callback: (event: ConditionChangeEvent) => void) => () => void;
}

/**
 * Hook para gerenciar condições no CombatTracker com suporte a realtime
 */
export function useCombatConditions({
  campaignId,
  userId,
  enabled = true,
  characterIds = [],
}: UseCombatConditionsProps = {}): UseCombatConditionsReturn {
  const queryClient = useQueryClient();
  
  // Estado para condições sincronizadas do banco
  const [syncedConditions, setSyncedConditions] = useState<Record<string, LocalCombatCondition[]>>({});
  
  // Ref para listeners de mudanças
  const changeListenersRef = useRef<Set<(event: ConditionChangeEvent) => void>>(new Set());

  /**
   * Converte condições do BD para formato local
   */
  const dbConditionsToLocal = useCallback((dbConditions: ActiveCondition[]): LocalCombatCondition[] => {
    return dbConditions.map(c => ({
      id: c.id,
      conditionId: c.condition_id,
      conditionName: c.condition_name,
      description: c.description || undefined,
      mechanicalEffect: c.mechanical_effect || undefined,
      durationType: c.duration_type as LocalCombatCondition['durationType'],
      durationRemaining: c.duration_remaining,
      decrementsAt: (c.decrements_at || 'end_of_turn') as LocalCombatCondition['decrementsAt'],
      stacks: c.stacks || 1,
      sourceName: c.source_name || undefined,
      color: c.color || undefined,
      icon: c.icon || undefined,
    }));
  }, []);

  /**
   * Busca condições de um personagem do banco
   */
  const fetchConditions = useCallback(async (characterId: string): Promise<LocalCombatCondition[]> => {
    try {
      const { data, error } = await supabase
        .from('character_active_conditions')
        .select('*')
        .eq('character_id', characterId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[useCombatConditions] Erro ao buscar condições:', error);
        return [];
      }

      return dbConditionsToLocal(data as ActiveCondition[]);
    } catch (err) {
      console.error('[useCombatConditions] Exceção ao buscar condições:', err);
      return [];
    }
  }, [dbConditionsToLocal]);

  /**
   * Força refresh das condições de um personagem
   */
  const refreshConditions = useCallback(async (characterId: string): Promise<void> => {
    const conditions = await fetchConditions(characterId);
    setSyncedConditions(prev => ({
      ...prev,
      [characterId]: conditions,
    }));
    // Invalida cache do react-query também
    queryClient.invalidateQueries({ queryKey: ['character-conditions', characterId] });
  }, [fetchConditions, queryClient]);

  /**
   * Notifica listeners sobre mudanças
   */
  const notifyListeners = useCallback((event: ConditionChangeEvent) => {
    changeListenersRef.current.forEach(listener => {
      try {
        listener(event);
      } catch (err) {
        console.error('[useCombatConditions] Erro em listener:', err);
      }
    });
  }, []);

  /**
   * Registra um callback para mudanças de condições
   */
  const registerChangeListener = useCallback((callback: (event: ConditionChangeEvent) => void) => {
    changeListenersRef.current.add(callback);
    return () => {
      changeListenersRef.current.delete(callback);
    };
  }, []);

  // ===== REALTIME SUBSCRIPTION =====
  // Subscreve para mudanças em condições de todos os personagens vinculados
  useEffect(() => {
    if (!enabled || characterIds.length === 0) return;

    // Carrega condições iniciais de todos os personagens
    const loadInitialConditions = async () => {
      const allConditions: Record<string, LocalCombatCondition[]> = {};
      
      for (const charId of characterIds) {
        const conditions = await fetchConditions(charId);
        allConditions[charId] = conditions;
      }
      
      setSyncedConditions(allConditions);
    };

    loadInitialConditions();

    // Cria channels para cada personagem (ou um channel com filtro por campanha)
    const channelName = campaignId 
      ? `combat-conditions-campaign-${campaignId}` 
      : `combat-conditions-${characterIds.join('-').slice(0, 50)}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'character_active_conditions',
          // Filtra por campanha se disponível, senão por character_id
          ...(campaignId 
            ? { filter: `campaign_id=eq.${campaignId}` }
            : characterIds.length === 1 
              ? { filter: `character_id=eq.${characterIds[0]}` }
              : {}),
        },
        async (payload) => {
          const { eventType, new: newRecord, old: oldRecord } = payload;
          
          // Determina o characterId afetado
          const characterId = (newRecord as any)?.character_id || (oldRecord as any)?.character_id;
          
          // Se não for um personagem que estamos rastreando, ignora
          if (!characterId || !characterIds.includes(characterId)) {
            return;
          }

          console.log(`[useCombatConditions] Realtime ${eventType} para ${characterId}`);

          // Atualiza condições locais
          const updatedConditions = await fetchConditions(characterId);
          setSyncedConditions(prev => ({
            ...prev,
            [characterId]: updatedConditions,
          }));

          // Invalida cache do react-query
          queryClient.invalidateQueries({ queryKey: ['character-conditions', characterId] });

          // Notifica listeners
          const event: ConditionChangeEvent = {
            type: eventType as 'INSERT' | 'UPDATE' | 'DELETE',
            characterId,
            condition: newRecord as ActiveCondition | null,
            conditionId: (newRecord as any)?.id || (oldRecord as any)?.id,
          };
          notifyListeners(event);
        }
      )
      .subscribe((status) => {
        console.log(`[useCombatConditions] Subscription status: ${status}`);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, characterIds, campaignId, fetchConditions, queryClient, notifyListeners]);

  /**
   * Aplica uma condição a um combatente
   */
  const applyCondition = useCallback(async (
    combatantId: string,
    data: AddConditionData,
    characterId?: string
  ): Promise<LocalCombatCondition> => {
    const conditionDef = CONDITIONS[data.conditionId];
    
    // Cria condição local
    const localCondition: LocalCombatCondition = {
      id: crypto.randomUUID(),
      conditionId: data.conditionId === 'custom' ? `custom_${Date.now()}` : data.conditionId,
      conditionName: data.customName || conditionDef?.name || 'Condição',
      description: conditionDef?.description,
      mechanicalEffect: data.customEffect || conditionDef?.mechanicalEffect,
      durationType: data.durationType,
      durationRemaining: data.durationType === 'rounds' ? (data.durationRounds || 1) : null,
      decrementsAt: data.decrementsAt || 'end_of_turn',
      stacks: 1,
      sourceName: data.sourceName,
      color: conditionDef?.color,
      icon: conditionDef?.icon,
    };

    // Se tiver characterId, persiste no banco
    if (characterId && userId && enabled) {
      try {
        const { data: inserted, error } = await supabase
          .from('character_active_conditions')
          .insert({
            character_id: characterId,
            user_id: userId,
            campaign_id: campaignId || null,
            condition_id: localCondition.conditionId,
            condition_name: localCondition.conditionName,
            condition_type: data.conditionType || 'condition',
            description: localCondition.description,
            mechanical_effect: localCondition.mechanicalEffect,
            duration_type: localCondition.durationType,
            duration_total: localCondition.durationRemaining,
            duration_remaining: localCondition.durationRemaining,
            decrements_at: localCondition.decrementsAt,
            stacks: localCondition.stacks,
            source_name: localCondition.sourceName,
            color: localCondition.color,
            icon: localCondition.icon,
          })
          .select()
          .single();

        if (error) {
          console.error('[useCombatConditions] Erro ao persistir condição:', error);
        } else if (inserted) {
          // Atualiza ID local com o ID do banco
          localCondition.id = inserted.id;
          
          // Invalida cache (realtime também atualizará, mas garantimos)
          queryClient.invalidateQueries({ queryKey: ['character-conditions', characterId] });
        }
      } catch (err) {
        console.error('[useCombatConditions] Exceção ao persistir condição:', err);
      }
    }

    return localCondition;
  }, [campaignId, userId, enabled, queryClient]);

  /**
   * Remove uma condição de um combatente
   */
  const removeCondition = useCallback(async (
    combatantId: string,
    conditionInstanceId: string,
    characterId?: string
  ): Promise<boolean> => {
    // Se tiver characterId, remove do banco
    if (characterId && enabled) {
      try {
        const { error } = await supabase
          .from('character_active_conditions')
          .delete()
          .eq('id', conditionInstanceId)
          .eq('character_id', characterId);

        if (error) {
          console.error('[useCombatConditions] Erro ao remover condição:', error);
          return false;
        }

        // Invalida cache (realtime também atualizará, mas garantimos)
        queryClient.invalidateQueries({ queryKey: ['character-conditions', characterId] });
      } catch (err) {
        console.error('[useCombatConditions] Exceção ao remover condição:', err);
        return false;
      }
    }

    return true;
  }, [enabled, queryClient]);

  /**
   * Decrementa condições no início do turno
   */
  const decrementOnTurnStart = useCallback(async (
    combatant: CombatantState,
    localConditions: LocalCombatCondition[]
  ): Promise<DecrementResult> => {
    const result: DecrementResult = {
      decremented: 0,
      expired: 0,
      messages: [],
      expiredConditions: [],
    };

    // Filtra condições que decrementam no início do turno
    const toDecrement = localConditions.filter(
      c => c.decrementsAt === 'start_of_turn' && c.durationType === 'rounds' && c.durationRemaining !== null
    );

    for (const condition of toDecrement) {
      const newDuration = (condition.durationRemaining || 0) - 1;
      
      if (newDuration <= 0) {
        result.expired++;
        result.expiredConditions.push(condition.id);
        result.messages.push(`⏱️ ${condition.conditionName} expirou para ${combatant.name}`);
      } else {
        result.decremented++;
        result.messages.push(`⏳ ${condition.conditionName} (${newDuration} rodada${newDuration > 1 ? 's' : ''} restante${newDuration > 1 ? 's' : ''})`);
      }
    }

    return result;
  }, []);

  /**
   * Decrementa condições no fim do turno
   */
  const decrementOnTurnEnd = useCallback(async (
    combatant: CombatantState,
    localConditions: LocalCombatCondition[]
  ): Promise<DecrementResult> => {
    const result: DecrementResult = {
      decremented: 0,
      expired: 0,
      messages: [],
      expiredConditions: [],
    };

    // Filtra condições que decrementam no fim do turno
    const toDecrement = localConditions.filter(
      c => c.decrementsAt === 'end_of_turn' && c.durationType === 'rounds' && c.durationRemaining !== null
    );

    for (const condition of toDecrement) {
      const newDuration = (condition.durationRemaining || 0) - 1;
      
      if (newDuration <= 0) {
        result.expired++;
        result.expiredConditions.push(condition.id);
        result.messages.push(`⏱️ ${condition.conditionName} expirou para ${combatant.name}`);
      } else {
        result.decremented++;
      }
    }

    // Condições "until_end_of_turn" expiram automaticamente
    const endOfTurnConditions = localConditions.filter(c => c.durationType === 'until_end_of_turn');
    for (const condition of endOfTurnConditions) {
      result.expired++;
      result.expiredConditions.push(condition.id);
      result.messages.push(`⏱️ ${condition.conditionName} expirou para ${combatant.name}`);
    }

    return result;
  }, []);

  /**
   * Processa efeitos de condições no início do turno
   */
  const processConditionEffects = useCallback((
    combatant: CombatantState,
    conditions: LocalCombatCondition[]
  ): { damage: number; healing: number; messages: string[] } => {
    let damage = 0;
    let healing = 0;
    const messages: string[] = [];

    for (const condition of conditions) {
      switch (condition.conditionId) {
        case 'sangrando': {
          // Sangrando: 1d6 por stack
          const bleedDamage = Math.floor(Math.random() * 6) + 1;
          const totalBleed = bleedDamage * condition.stacks;
          damage += totalBleed;
          messages.push(`🩸 ${combatant.name} sofre ${totalBleed} de dano (Sangrando${condition.stacks > 1 ? ` x${condition.stacks}` : ''})`);
          break;
        }
        
        case 'em_chamas': {
          // Em Chamas: 1d6 de dano de fogo
          const fireDamage = Math.floor(Math.random() * 6) + 1;
          damage += fireDamage;
          messages.push(`🔥 ${combatant.name} sofre ${fireDamage} de dano de fogo (Em Chamas)`);
          break;
        }
        
        case 'envenenado': {
          // Envenenado: depende do veneno, assume 1d4 por stack
          const poisonDamage = Math.floor(Math.random() * 4) + 1;
          const totalPoison = poisonDamage * condition.stacks;
          damage += totalPoison;
          messages.push(`☠️ ${combatant.name} sofre ${totalPoison} de dano (Envenenado${condition.stacks > 1 ? ` x${condition.stacks}` : ''})`);
          break;
        }
      }
    }

    return { damage, healing, messages };
  }, []);

  return {
    applyCondition,
    removeCondition,
    decrementOnTurnStart,
    decrementOnTurnEnd,
    dbConditionsToLocal,
    processConditionEffects,
    syncedConditions,
    refreshConditions,
    registerChangeListener,
  };
}

// Tipos importados de useConditions para uso interno - não re-exportar para evitar conflito
// Use: import { ActiveCondition, AddConditionData } from '@/hooks/character/useConditions'
