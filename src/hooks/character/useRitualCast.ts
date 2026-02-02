/**
 * Hook de Conjuração de Rituais
 * 
 * Centraliza a lógica de conjuração de rituais, cálculo de custo de PE,
 * aplicação de aprimoramentos e gerenciamento de efeitos.
 * 
 * @module hooks/character/useRitualCast
 */

import { useState, useCallback, useMemo } from 'react';
import type { Ritual, RitualEffect, SustainConfig } from '@/lib/rituals/legacy-exports';

/** Resultado de uma conjuração */
export interface RitualCastResult {
  /** Ritual conjurado */
  ritual: Ritual;
  /** Custo de PE total */
  peCost: number;
  /** Aprimoramentos selecionados */
  enhancements: string[];
  /** PE restante após conjuração */
  peRemaining: number;
  /** Se o ritual foi sustentado */
  isSustained: boolean;
  /** Timestamp da conjuração */
  castAt: Date;
}

/** Parâmetros do hook */
interface UseRitualCastParams {
  /** PE atual do personagem */
  currentPE: number;
  /** PE máximo do personagem */
  maxPE: number;
  /** Bônus de círculo (Ocultista) */
  circleBonus?: number;
  /** Redução de custo de PE */
  peCostReduction?: number;
  /** Callback quando PE é gasto */
  onPESpent?: (amount: number) => void;
  /** Callback quando ritual é sustentado */
  onSustainRitual?: (ritual: Ritual, config: SustainConfig) => void;
}

/**
 * Hook para gerenciar conjuração de rituais
 * 
 * Calcula custos, aplica aprimoramentos e gerencia o fluxo de conjuração.
 * 
 * @example
 * ```tsx
 * const {
 *   calculateCost,
 *   canCast,
 *   cast,
 *   selectedEnhancements,
 *   toggleEnhancement,
 * } = useRitualCast({
 *   currentPE: character.pe_current,
 *   maxPE: character.pe_max,
 *   peCostReduction: bonusSummary.ritualCostReduction,
 * });
 * ```
 */
export function useRitualCast({
  currentPE,
  maxPE,
  circleBonus = 0,
  peCostReduction = 0,
  onPESpent,
  onSustainRitual,
}: UseRitualCastParams) {
  // Estado de aprimoramentos selecionados
  const [selectedEnhancements, setSelectedEnhancements] = useState<string[]>([]);
  
  // Estado do ritual em preparação
  const [preparingRitual, setPreparingRitual] = useState<Ritual | null>(null);

  /**
   * Calcula o custo base de PE de um ritual
   */
  const getBaseCost = useCallback((ritual: Ritual): number => {
    // Custo base por círculo
    const circleCosts: Record<number, number> = {
      1: 1,
      2: 3,
      3: 6,
      4: 10,
    };
    return circleCosts[ritual.circle] || ritual.circle;
  }, []);

  /**
   * Calcula o custo de um aprimoramento
   * Nota: RitualEnhancement usa 'name' (Discente/Verdadeiro), não 'id'
   */
  const getEnhancementCost = useCallback((
    ritual: Ritual,
    enhancementName: string
  ): number => {
    const enhancement = ritual.enhancements?.find(e => e.name === enhancementName);
    if (!enhancement) return 0;
    
    // Custo definido no aprimoramento
    return enhancement.cost || 1;
  }, []);

  /**
   * Calcula o custo total de PE para conjurar um ritual
   */
  const calculateCost = useCallback((
    ritual: Ritual,
    enhancements: string[] = []
  ): number => {
    // Custo base
    let cost = getBaseCost(ritual);
    
    // Adiciona custo de aprimoramentos
    for (const enhId of enhancements) {
      cost += getEnhancementCost(ritual, enhId);
    }
    
    // Aplica redução de custo (mínimo 1)
    cost = Math.max(1, cost - peCostReduction);
    
    return cost;
  }, [getBaseCost, getEnhancementCost, peCostReduction]);

  /**
   * Verifica se o personagem pode conjurar um ritual
   */
  const canCast = useCallback((
    ritual: Ritual,
    enhancements: string[] = []
  ): { canCast: boolean; reason?: string } => {
    const cost = calculateCost(ritual, enhancements);
    
    if (cost > currentPE) {
      return {
        canCast: false,
        reason: `PE insuficiente (necessário: ${cost}, disponível: ${currentPE})`,
      };
    }
    
    // Verifica círculo máximo acessível
    const maxCircle = Math.min(4, 1 + circleBonus);
    if (ritual.circle > maxCircle) {
      return {
        canCast: false,
        reason: `Círculo ${ritual.circle} não acessível (máximo: ${maxCircle})`,
      };
    }
    
    return { canCast: true };
  }, [calculateCost, currentPE, circleBonus]);

  /**
   * Toggle de aprimoramento
   */
  const toggleEnhancement = useCallback((enhancementId: string) => {
    setSelectedEnhancements(prev => {
      if (prev.includes(enhancementId)) {
        return prev.filter(id => id !== enhancementId);
      }
      return [...prev, enhancementId];
    });
  }, []);

  /**
   * Limpa aprimoramentos selecionados
   */
  const clearEnhancements = useCallback(() => {
    setSelectedEnhancements([]);
  }, []);

  /**
   * Prepara um ritual para conjuração
   */
  const prepareRitual = useCallback((ritual: Ritual) => {
    setPreparingRitual(ritual);
    setSelectedEnhancements([]);
  }, []);

  /**
   * Cancela a preparação de ritual
   */
  const cancelPreparation = useCallback(() => {
    setPreparingRitual(null);
    setSelectedEnhancements([]);
  }, []);

  /**
   * Executa a conjuração do ritual
   */
  const cast = useCallback((
    ritual: Ritual,
    enhancements: string[] = [],
    options?: { sustain?: boolean; sustainConfig?: SustainConfig }
  ): RitualCastResult | null => {
    const cost = calculateCost(ritual, enhancements);
    const check = canCast(ritual, enhancements);
    
    if (!check.canCast) {
      console.warn('[useRitualCast] Não pode conjurar:', check.reason);
      return null;
    }
    
    // Gasta PE
    if (onPESpent) {
      onPESpent(cost);
    }
    
    // Se for sustentado, registra
    if (options?.sustain && options.sustainConfig && onSustainRitual) {
      onSustainRitual(ritual, options.sustainConfig);
    }
    
    const result: RitualCastResult = {
      ritual,
      peCost: cost,
      enhancements,
      peRemaining: currentPE - cost,
      isSustained: options?.sustain || false,
      castAt: new Date(),
    };
    
    // Limpa estado de preparação
    setPreparingRitual(null);
    setSelectedEnhancements([]);
    
    return result;
  }, [calculateCost, canCast, currentPE, onPESpent, onSustainRitual]);

  /**
   * Custo calculado do ritual em preparação
   */
  const preparingCost = useMemo(() => {
    if (!preparingRitual) return 0;
    return calculateCost(preparingRitual, selectedEnhancements);
  }, [preparingRitual, selectedEnhancements, calculateCost]);

  /**
   * Verifica se pode conjurar o ritual em preparação
   */
  const canCastPreparing = useMemo(() => {
    if (!preparingRitual) return { canCast: false, reason: 'Nenhum ritual preparado' };
    return canCast(preparingRitual, selectedEnhancements);
  }, [preparingRitual, selectedEnhancements, canCast]);

  return {
    // Estado
    preparingRitual,
    selectedEnhancements,
    preparingCost,
    canCastPreparing,
    
    // Ações
    calculateCost,
    canCast,
    cast,
    prepareRitual,
    cancelPreparation,
    toggleEnhancement,
    clearEnhancements,
    getBaseCost,
    getEnhancementCost,
  };
}
