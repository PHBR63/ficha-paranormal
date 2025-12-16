/**
 * Hook para validação de rituais e aprimoramentos
 * Fase 2: Validação de requisitos de círculo, afinidade e limite de PE por turno
 */

import { useMemo, useCallback } from 'react';
import { Ritual, RitualEnhancement, getMaxRitualCircle } from '@/lib/rituals-data';
import { getPELimitByNex } from '@/lib/dice-roller';

// Interface para resultado da validação de aprimoramento
export interface EnhancementValidation {
  isValid: boolean;
  reason?: string;
  requiresCircle?: number;
  requiresAffinity?: boolean;
}

// Interface para resultado da validação de PE
export interface PEValidation {
  isValid: boolean;
  reason?: string;
  totalCost: number;
  peLimitPerTurn: number;
  peRemaining: number;
  exceedsLimit: boolean;
  exceededBy?: number;
}

// Interface para o estado de PE do turno
export interface TurnPEState {
  peSpentThisTurn: number;
  turnNumber: number;
}

/**
 * Extrai requisitos de círculo do texto de requisitos do aprimoramento
 * Ex: "Requer 2º círculo" -> 2
 */
function parseCircleRequirement(requirements?: string): number | undefined {
  if (!requirements) return undefined;
  
  // Padrões possíveis: "Requer 2º círculo", "Requer 3º círculo", etc.
  const match = requirements.match(/(\d)º?\s*círculo/i);
  if (match) {
    return parseInt(match[1], 10);
  }
  return undefined;
}

/**
 * Verifica se o aprimoramento requer afinidade elemental
 */
function requiresAffinity(requirements?: string): boolean {
  if (!requirements) return false;
  return requirements.toLowerCase().includes('afinidade');
}

/**
 * Hook principal para validação de rituais
 */
export function useRitualValidation(
  nex: number,
  elementalAffinity?: string | null,
  peCurrent: number = 0,
  peMax: number = 0,
  turnPEState?: TurnPEState
) {
  // Calcula o círculo máximo do personagem
  const maxCircle = useMemo(() => getMaxRitualCircle(nex), [nex]);

  // Calcula o limite de PE por turno
  const peLimitPerTurn = useMemo(() => getPELimitByNex(nex), [nex]);

  // PE já gasto neste turno (padrão 0 se não rastreado)
  const peSpentThisTurn = turnPEState?.peSpentThisTurn ?? 0;

  /**
   * Valida se um aprimoramento pode ser selecionado
   */
  const validateEnhancement = useCallback((
    ritual: Ritual,
    enhancement: RitualEnhancement
  ): EnhancementValidation => {
    const circleReq = parseCircleRequirement(enhancement.requirements);
    const needsAffinity = requiresAffinity(enhancement.requirements);

    // Verifica requisito de círculo
    if (circleReq && maxCircle < circleReq) {
      return {
        isValid: false,
        reason: `Requer ${circleReq}º círculo (você tem ${maxCircle}º)`,
        requiresCircle: circleReq,
        requiresAffinity: needsAffinity,
      };
    }

    // Verifica requisito de afinidade
    if (needsAffinity) {
      // Afinidade precisa corresponder ao elemento do ritual
      const hasCorrectAffinity = elementalAffinity?.toLowerCase() === ritual.element.toLowerCase();
      
      if (!elementalAffinity) {
        return {
          isValid: false,
          reason: 'Requer afinidade elemental (você não possui)',
          requiresCircle: circleReq,
          requiresAffinity: true,
        };
      }

      if (!hasCorrectAffinity) {
        return {
          isValid: false,
          reason: `Requer afinidade com ${ritual.element} (sua afinidade: ${elementalAffinity})`,
          requiresCircle: circleReq,
          requiresAffinity: true,
        };
      }
    }

    return { isValid: true, requiresCircle: circleReq, requiresAffinity: needsAffinity };
  }, [maxCircle, elementalAffinity]);

  /**
   * Valida se o personagem pode pagar o custo de PE
   */
  const validatePECost = useCallback((
    baseCost: number,
    selectedEnhancements: { name: string; cost: number }[],
    isNonOccultist: boolean = false
  ): PEValidation => {
    const costMultiplier = isNonOccultist ? 2 : 1;

    // Custo base + aprimoramentos
    const enhancementCost = selectedEnhancements.reduce((sum, e) => sum + e.cost, 0);
    const totalCost = (baseCost + enhancementCost) * costMultiplier;

    // Verifica PE disponível
    if (peCurrent < totalCost) {
      return {
        isValid: false,
        reason: `PE insuficiente (${peCurrent}/${totalCost} PE)`,
        totalCost,
        peLimitPerTurn,
        peRemaining: peCurrent,
        exceedsLimit: false,
      };
    }

    // Verifica limite de PE por turno
    const totalPEThisTurn = peSpentThisTurn + totalCost;
    if (totalPEThisTurn > peLimitPerTurn) {
      const exceededBy = totalPEThisTurn - peLimitPerTurn;
      return {
        isValid: false,
        reason: `Excede limite de PE por turno (${totalPEThisTurn}/${peLimitPerTurn} PE)`,
        totalCost,
        peLimitPerTurn,
        peRemaining: peCurrent,
        exceedsLimit: true,
        exceededBy,
      };
    }

    return {
      isValid: true,
      totalCost,
      peLimitPerTurn,
      peRemaining: peCurrent - totalCost,
      exceedsLimit: false,
    };
  }, [peCurrent, peLimitPerTurn, peSpentThisTurn]);

  /**
   * Verifica se o personagem pode conjurar um ritual específico
   */
  const canCastRitual = useCallback((ritual: Ritual): boolean => {
    // Verifica círculo do ritual
    if (ritual.circle > maxCircle) {
      return false;
    }

    // Verifica PE mínimo (custo base)
    if (peCurrent < ritual.cost) {
      return false;
    }

    return true;
  }, [maxCircle, peCurrent]);

  /**
   * Filtra aprimoramentos disponíveis para um ritual
   */
  const getAvailableEnhancements = useCallback((ritual: Ritual) => {
    if (!ritual.enhancements) return [];

    return ritual.enhancements.map(enh => ({
      ...enh,
      validation: validateEnhancement(ritual, enh),
    }));
  }, [validateEnhancement]);

  return {
    // Valores calculados
    maxCircle,
    peLimitPerTurn,
    peSpentThisTurn,
    
    // Funções de validação
    validateEnhancement,
    validatePECost,
    canCastRitual,
    getAvailableEnhancements,
  };
}

/**
 * Hook auxiliar para rastrear PE gasto por turno
 */
export function useTurnPETracker(initialTurn: number = 1) {
  const [state, setState] = useState<TurnPEState>({
    peSpentThisTurn: 0,
    turnNumber: initialTurn,
  });

  const spendPE = useCallback((amount: number) => {
    setState(prev => ({
      ...prev,
      peSpentThisTurn: prev.peSpentThisTurn + amount,
    }));
  }, []);

  const nextTurn = useCallback(() => {
    setState(prev => ({
      peSpentThisTurn: 0,
      turnNumber: prev.turnNumber + 1,
    }));
  }, []);

  const resetTurn = useCallback(() => {
    setState(prev => ({
      ...prev,
      peSpentThisTurn: 0,
    }));
  }, []);

  return {
    ...state,
    spendPE,
    nextTurn,
    resetTurn,
  };
}

// Importação necessária para useState
import { useState } from 'react';
