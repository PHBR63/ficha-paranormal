/**
 * Hook para validação de rituais e aprimoramentos
 * Fase 2: Validação de requisitos de círculo, afinidade e limite de PE por turno
 * 
 * ATUALIZADO: Agora usa o sistema unificado de rituais (ritual-registry.ts)
 */

import { useState, useMemo, useCallback } from 'react';
import { getPELimitByNex } from '@/lib/dice-roller';
import { 
  getRitualById, 
  canUseEnhancement as canUseEnhancementRegistry,
  getEffectiveLevel,
} from '@/lib/rituals/ritual-registry';
import type { UnifiedRitual } from '@/lib/rituals/types';

// Tipo legado mantido para compatibilidade
import type { Ritual as LegacyRitual, RitualEnhancement } from '@/lib/rituals/legacy-exports';

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
 * Calcula o círculo máximo baseado no NEX
 * Regra oficial do Ordem Paranormal
 */
function getMaxRitualCircle(nex: number): number {
  if (nex >= 99) return 4;
  if (nex >= 50) return 3;
  if (nex >= 25) return 2;
  return 1;
}

/**
 * Hook principal para validação de rituais
 * Suporta tanto o tipo UnifiedRitual quanto o tipo legado Ritual
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
   * Suporta tanto rituais do sistema unificado quanto legado
   */
  const validateEnhancement = useCallback((
    ritual: LegacyRitual | UnifiedRitual,
    enhancement: RitualEnhancement | { name: string; cost: number; circleReq?: number; affinityReq?: boolean; description: string }
  ): EnhancementValidation => {
    // Tenta usar o sistema unificado primeiro
    const unifiedRitual = getRitualById(ritual.id);
    
    if (unifiedRitual) {
      // Usa a validação do registry unificado
      const enhName = enhancement.name as 'Discente' | 'Verdadeiro';
      const result = canUseEnhancementRegistry(
        ritual.id,
        enhName,
        maxCircle,
        elementalAffinity || undefined
      );
      
      if (!result.canUse) {
        // Extrai informações de requisitos do aprimoramento unificado
        const unifiedEnh = unifiedRitual.enhancements?.find(e => e.name === enhName);
        return {
          isValid: false,
          reason: result.reason,
          requiresCircle: unifiedEnh?.circleReq,
          requiresAffinity: unifiedEnh?.affinityReq,
        };
      }
      
      return { isValid: true };
    }
    
    // Fallback para lógica legada se ritual não encontrado no sistema unificado
    const circleReq = 'circleReq' in enhancement 
      ? enhancement.circleReq 
      : parseCircleRequirementLegacy((enhancement as RitualEnhancement).requirements);
    
    const needsAffinity = 'affinityReq' in enhancement 
      ? enhancement.affinityReq 
      : requiresAffinityLegacy((enhancement as RitualEnhancement).requirements);

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
  const canCastRitual = useCallback((ritual: LegacyRitual | UnifiedRitual): boolean => {
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
  const getAvailableEnhancements = useCallback((ritual: LegacyRitual | UnifiedRitual) => {
    // Tenta obter do sistema unificado primeiro
    const unifiedRitual = getRitualById(ritual.id);
    
    if (unifiedRitual && unifiedRitual.enhancements) {
      return unifiedRitual.enhancements.map(enh => ({
        name: enh.name,
        cost: enh.cost,
        description: enh.description,
        requirements: enh.circleReq 
          ? `Requer ${enh.circleReq}º círculo${enh.affinityReq ? ' e afinidade' : ''}` 
          : enh.affinityReq ? 'Requer afinidade' : undefined,
        validation: validateEnhancement(ritual, enh),
      }));
    }
    
    // Fallback para formato legado
    if (!('enhancements' in ritual) || !ritual.enhancements) return [];

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

// ========================================
// FUNÇÕES LEGADAS PARA COMPATIBILIDADE
// ========================================

/**
 * Extrai requisitos de círculo do texto de requisitos (formato legado)
 */
function parseCircleRequirementLegacy(requirements?: string): number | undefined {
  if (!requirements) return undefined;
  const match = requirements.match(/(\d)º?\s*círculo/i);
  if (match) {
    return parseInt(match[1], 10);
  }
  return undefined;
}

/**
 * Verifica se o aprimoramento requer afinidade (formato legado)
 */
function requiresAffinityLegacy(requirements?: string): boolean {
  if (!requirements) return false;
  return requirements.toLowerCase().includes('afinidade');
}
