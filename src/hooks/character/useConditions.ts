/**
 * useConditions - Hook para gerenciar condições ativas do personagem
 * 
 * Gerencia adicionar, remover e decrementar condições com duração.
 * Sincroniza com o banco de dados e suporta realtime em campanha.
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CONDITIONS, getConditionById, type ConditionDefinition } from '@/lib/conditions-data';

// Interface para condição ativa (do banco)
export interface ActiveCondition {
  id: string;
  character_id: string;
  user_id: string;
  condition_id: string;
  condition_name: string;
  condition_type: 'condition' | 'buff' | 'debuff' | 'effect';
  description: string | null;
  mechanical_effect: string | null;
  duration_type: 'permanent' | 'rounds' | 'scene' | 'until_rest' | 'until_end_of_turn';
  duration_remaining: number | null;
  duration_total: number | null;
  applied_at_round: number | null;
  applied_at_turn: number | null;
  decrements_at: 'start_of_turn' | 'end_of_turn' | 'manual';
  icon: string | null;
  color: string | null;
  source_name: string | null;
  source_type: string | null;
  stacks: number;
  max_stacks: number;
  can_be_removed: boolean;
  campaign_id: string | null;
  session_id: string | null;
  created_at: string;
  updated_at: string;
  // Dados enriquecidos da definição
  definition?: ConditionDefinition;
}

// Props do hook
export interface UseConditionsProps {
  characterId: string;
  userId: string;
  campaignId?: string;
  sessionId?: string;
  enabled?: boolean;
}

// Dados para adicionar condição
export interface AddConditionData {
  conditionId: string; // ID da condição predefinida OU 'custom'
  customName?: string; // Nome se for customizada
  customDescription?: string;
  customEffect?: string;
  durationType: 'permanent' | 'rounds' | 'scene' | 'until_rest' | 'until_end_of_turn';
  durationRounds?: number;
  decrementsAt?: 'start_of_turn' | 'end_of_turn' | 'manual';
  sourceName?: string;
  sourceType?: 'ritual' | 'power' | 'item' | 'master' | 'environment';
  conditionType?: 'condition' | 'buff' | 'debuff' | 'effect';
  currentRound?: number;
  currentTurn?: number;
}

// Retorno do hook
export interface UseConditionsReturn {
  // Estado
  conditions: ActiveCondition[];
  isLoading: boolean;
  error: Error | null;
  
  // Ações
  addCondition: (data: AddConditionData) => Promise<ActiveCondition | null>;
  removeCondition: (conditionId: string) => Promise<boolean>;
  updateCondition: (conditionId: string, updates: Partial<ActiveCondition>) => Promise<boolean>;
  
  // Gerenciamento de duração
  decrementDuration: (conditionId: string) => Promise<boolean>;
  decrementAllByTiming: (timing: 'start_of_turn' | 'end_of_turn') => Promise<number>;
  
  // Stacks
  addStack: (conditionId: string) => Promise<boolean>;
  removeStack: (conditionId: string) => Promise<boolean>;
  
  // Utilitários
  hasCondition: (conditionId: string) => boolean;
  getCondition: (conditionId: string) => ActiveCondition | undefined;
  getConditionsByType: (type: ActiveCondition['condition_type']) => ActiveCondition[];
  
  // Limpar
  clearAllConditions: () => Promise<boolean>;
  clearExpiredConditions: () => Promise<number>;
}

export function useConditions({
  characterId,
  userId,
  campaignId,
  sessionId,
  enabled = true,
}: UseConditionsProps): UseConditionsReturn {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const queryKey = ['character-conditions', characterId];

  // Query para buscar condições
  const { data: conditions = [], isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('character_active_conditions')
        .select('*')
        .eq('character_id', characterId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Enriquecer com definições
      return (data || []).map((c: any) => ({
        ...c,
        definition: getConditionById(c.condition_id),
      })) as ActiveCondition[];
    },
    enabled: enabled && !!characterId,
  });

  // Realtime subscription para campanha
  useEffect(() => {
    if (!campaignId || !enabled) return;

    const channel = supabase
      .channel(`conditions-${characterId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'character_active_conditions',
          filter: `character_id=eq.${characterId}`,
        },
        () => {
          // Revalidar dados
          queryClient.invalidateQueries({ queryKey });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [campaignId, characterId, enabled, queryClient, queryKey]);

  // Mutation para adicionar
  const addMutation = useMutation({
    mutationFn: async (data: AddConditionData): Promise<ActiveCondition> => {
      // Busca definição se não for custom
      const definition = data.conditionId !== 'custom' 
        ? getConditionById(data.conditionId) 
        : null;

      const newCondition = {
        character_id: characterId,
        user_id: userId,
        campaign_id: campaignId || null,
        session_id: sessionId || null,
        condition_id: data.conditionId,
        condition_name: definition?.name || data.customName || 'Condição',
        condition_type: data.conditionType || 'condition',
        description: definition?.description || data.customDescription || null,
        mechanical_effect: definition?.mechanicalEffect || data.customEffect || null,
        duration_type: data.durationType,
        duration_remaining: data.durationType === 'rounds' ? data.durationRounds : null,
        duration_total: data.durationType === 'rounds' ? data.durationRounds : null,
        applied_at_round: data.currentRound || null,
        applied_at_turn: data.currentTurn || null,
        decrements_at: data.decrementsAt || 'start_of_turn',
        icon: definition?.icon || null,
        color: definition?.color || null,
        source_name: data.sourceName || null,
        source_type: data.sourceType || null,
        stacks: 1,
        max_stacks: definition?.stackable ? 99 : 1,
        can_be_removed: true,
      };

      const { data: inserted, error } = await supabase
        .from('character_active_conditions')
        .insert(newCondition)
        .select()
        .single();

      if (error) throw error;
      return { ...inserted, definition } as ActiveCondition;
    },
    onSuccess: (newCondition) => {
      queryClient.invalidateQueries({ queryKey });
      toast({
        title: 'Condição aplicada',
        description: `${newCondition.condition_name} adicionada`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao aplicar condição',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutation para remover
  const removeMutation = useMutation({
    mutationFn: async (conditionId: string): Promise<boolean> => {
      const { error } = await supabase
        .from('character_active_conditions')
        .delete()
        .eq('id', conditionId);

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao remover condição',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutation para atualizar
  const updateMutation = useMutation({
    mutationFn: async ({ conditionId, updates }: { conditionId: string; updates: Partial<ActiveCondition> }): Promise<boolean> => {
      const { error } = await supabase
        .from('character_active_conditions')
        .update(updates)
        .eq('id', conditionId);

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // === Funções públicas ===

  const addCondition = useCallback(async (data: AddConditionData): Promise<ActiveCondition | null> => {
    try {
      // Verifica se já existe (se não for acumulável)
      const existing = conditions.find(c => c.condition_id === data.conditionId);
      const definition = getConditionById(data.conditionId);
      
      if (existing && definition && !definition.stackable) {
        toast({
          title: 'Condição já ativa',
          description: `${existing.condition_name} já está afetando este personagem`,
          variant: 'default',
        });
        return null;
      }

      // Se acumulável e já existe, adiciona stack
      if (existing && definition?.stackable) {
        await addStack(existing.id);
        return existing;
      }

      return await addMutation.mutateAsync(data);
    } catch {
      return null;
    }
  }, [conditions, addMutation, toast]);

  const removeCondition = useCallback(async (conditionId: string): Promise<boolean> => {
    try {
      return await removeMutation.mutateAsync(conditionId);
    } catch {
      return false;
    }
  }, [removeMutation]);

  const updateCondition = useCallback(async (
    conditionId: string, 
    updates: Partial<ActiveCondition>
  ): Promise<boolean> => {
    try {
      return await updateMutation.mutateAsync({ conditionId, updates });
    } catch {
      return false;
    }
  }, [updateMutation]);

  const decrementDuration = useCallback(async (conditionId: string): Promise<boolean> => {
    const condition = conditions.find(c => c.id === conditionId);
    if (!condition) return false;
    
    if (condition.duration_type !== 'rounds' || condition.duration_remaining === null) {
      return false;
    }

    const newDuration = condition.duration_remaining - 1;
    
    if (newDuration <= 0) {
      // Remove a condição
      toast({
        title: 'Condição expirou',
        description: `${condition.condition_name} terminou`,
      });
      return await removeCondition(conditionId);
    }

    return await updateCondition(conditionId, { duration_remaining: newDuration });
  }, [conditions, removeCondition, updateCondition, toast]);

  const decrementAllByTiming = useCallback(async (
    timing: 'start_of_turn' | 'end_of_turn'
  ): Promise<number> => {
    const toDecrement = conditions.filter(
      c => c.duration_type === 'rounds' && c.decrements_at === timing
    );

    let decremented = 0;
    for (const condition of toDecrement) {
      const success = await decrementDuration(condition.id);
      if (success) decremented++;
    }

    return decremented;
  }, [conditions, decrementDuration]);

  const addStack = useCallback(async (conditionId: string): Promise<boolean> => {
    const condition = conditions.find(c => c.id === conditionId);
    if (!condition) return false;
    
    if (condition.stacks >= condition.max_stacks) {
      toast({
        title: 'Limite de acúmulos',
        description: `${condition.condition_name} atingiu o máximo de ${condition.max_stacks} acúmulos`,
      });
      return false;
    }

    return await updateCondition(conditionId, { stacks: condition.stacks + 1 });
  }, [conditions, updateCondition, toast]);

  const removeStack = useCallback(async (conditionId: string): Promise<boolean> => {
    const condition = conditions.find(c => c.id === conditionId);
    if (!condition) return false;
    
    if (condition.stacks <= 1) {
      return await removeCondition(conditionId);
    }

    return await updateCondition(conditionId, { stacks: condition.stacks - 1 });
  }, [conditions, updateCondition, removeCondition]);

  const hasCondition = useCallback((conditionId: string): boolean => {
    return conditions.some(c => c.condition_id === conditionId);
  }, [conditions]);

  const getCondition = useCallback((conditionId: string): ActiveCondition | undefined => {
    return conditions.find(c => c.condition_id === conditionId);
  }, [conditions]);

  const getConditionsByType = useCallback((
    type: ActiveCondition['condition_type']
  ): ActiveCondition[] => {
    return conditions.filter(c => c.condition_type === type);
  }, [conditions]);

  const clearAllConditions = useCallback(async (): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('character_active_conditions')
        .delete()
        .eq('character_id', characterId)
        .eq('can_be_removed', true);

      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey });
      toast({
        title: 'Condições removidas',
        description: 'Todas as condições removíveis foram limpas',
      });
      return true;
    } catch {
      return false;
    }
  }, [characterId, queryClient, queryKey, toast]);

  const clearExpiredConditions = useCallback(async (): Promise<number> => {
    const expired = conditions.filter(
      c => c.duration_type === 'rounds' && 
           c.duration_remaining !== null && 
           c.duration_remaining <= 0
    );

    for (const condition of expired) {
      await removeCondition(condition.id);
    }

    return expired.length;
  }, [conditions, removeCondition]);

  return {
    // Estado
    conditions,
    isLoading,
    error: error as Error | null,
    
    // Ações
    addCondition,
    removeCondition,
    updateCondition,
    
    // Gerenciamento de duração
    decrementDuration,
    decrementAllByTiming,
    
    // Stacks
    addStack,
    removeStack,
    
    // Utilitários
    hasCondition,
    getCondition,
    getConditionsByType,
    
    // Limpar
    clearAllConditions,
    clearExpiredConditions,
  };
}
