/**
 * useRoundTracking - Hook centralizado para tracking de uso de habilidades por rodada
 * 
 * Gerencia o estado de habilidades que só podem ser usadas 1x por rodada:
 * - Brecha na Guarda (Comandante de Campo)
 * - Ataque Extra (Operações Especiais)
 * - Surto de Adrenalina (Operações Especiais)
 * 
 * Fornece:
 * - Estado de habilidades usadas nesta rodada
 * - Função para marcar habilidade como usada
 * - Função para resetar ao avançar rodada
 * - Contador de rodada atual
 */

import { useState, useCallback, useMemo } from 'react';

// IDs de habilidades com limite de 1x por rodada
export const PER_ROUND_ABILITIES = {
  // Comandante de Campo
  BRECHA_NA_GUARDA: 'brecha-na-guarda',
  // Operações Especiais
  ATAQUE_EXTRA: 'ataque-extra',
  SURTO_DE_ADRENALINA: 'surto-de-adrenalina',
  // Atirador de Elite
  DISPARO_LETAL: 'disparo-letal',
} as const;

export type PerRoundAbilityId = typeof PER_ROUND_ABILITIES[keyof typeof PER_ROUND_ABILITIES];

export interface RoundTrackingState {
  /** Rodada atual (inicia em 1) */
  currentRound: number;
  /** Set de IDs de habilidades já usadas nesta rodada */
  usedAbilities: Set<string>;
  /** PE gasto nesta rodada */
  peSpentThisRound: number;
  /** Histórico de gastos de PE nesta rodada (nome da habilidade → custo) */
  peSpentBreakdown: Array<{ abilityName: string; cost: number }>;
}

export interface UseRoundTrackingReturn {
  /** Rodada atual */
  currentRound: number;
  /** Array de IDs de habilidades usadas nesta rodada */
  usedAbilitiesThisRound: string[];
  /** Verifica se uma habilidade já foi usada nesta rodada */
  isAbilityUsed: (abilityId: string) => boolean;
  /** Marca uma habilidade como usada nesta rodada */
  markAbilityUsed: (abilityId: string) => void;
  /** Avança para a próxima rodada e reseta o tracking */
  advanceRound: () => void;
  /** Reseta para a rodada 1 (início de combate) */
  resetCombat: () => void;
  /** Número de habilidades usadas nesta rodada */
  usedCount: number;
  /** PE total gasto nesta rodada */
  peSpentThisRound: number;
  /** Breakdown de PE gasto por habilidade */
  peSpentBreakdown: Array<{ abilityName: string; cost: number }>;
  /** Registra gasto de PE nesta rodada */
  trackPESpent: (abilityName: string, cost: number) => void;
}

/**
 * Hook para gerenciar tracking de uso de habilidades por rodada
 * Compartilhado entre todos os painéis de trilha que têm habilidades 1x/rodada
 */
export function useRoundTracking(): UseRoundTrackingReturn {
  const [state, setState] = useState<RoundTrackingState>({
    currentRound: 1,
    usedAbilities: new Set(),
    peSpentThisRound: 0,
    peSpentBreakdown: [],
  });

  // Verifica se uma habilidade já foi usada
  const isAbilityUsed = useCallback((abilityId: string): boolean => {
    return state.usedAbilities.has(abilityId);
  }, [state.usedAbilities]);

  // Marca uma habilidade como usada
  const markAbilityUsed = useCallback((abilityId: string): void => {
    setState(prev => ({
      ...prev,
      usedAbilities: new Set(prev.usedAbilities).add(abilityId),
    }));
  }, []);

  // Registra gasto de PE nesta rodada
  const trackPESpent = useCallback((abilityName: string, cost: number): void => {
    if (cost <= 0) return;
    setState(prev => ({
      ...prev,
      peSpentThisRound: prev.peSpentThisRound + cost,
      peSpentBreakdown: [...prev.peSpentBreakdown, { abilityName, cost }],
    }));
  }, []);

  // Avança para a próxima rodada e reseta o tracking
  const advanceRound = useCallback((): void => {
    setState(prev => ({
      currentRound: prev.currentRound + 1,
      usedAbilities: new Set(),
      peSpentThisRound: 0,
      peSpentBreakdown: [],
    }));
  }, []);

  // Reseta para a rodada 1 (início de novo combate)
  const resetCombat = useCallback((): void => {
    setState({
      currentRound: 1,
      usedAbilities: new Set(),
      peSpentThisRound: 0,
      peSpentBreakdown: [],
    });
  }, []);

  // Converte Set para array para facilitar uso em componentes
  const usedAbilitiesThisRound = useMemo(() => 
    Array.from(state.usedAbilities),
    [state.usedAbilities]
  );

  return {
    currentRound: state.currentRound,
    usedAbilitiesThisRound,
    isAbilityUsed,
    markAbilityUsed,
    advanceRound,
    resetCombat,
    usedCount: state.usedAbilities.size,
    peSpentThisRound: state.peSpentThisRound,
    peSpentBreakdown: state.peSpentBreakdown,
    trackPESpent,
  };
}

/**
 * Componente de controle de rodada para exibir na UI
 * Pode ser usado nos painéis para mostrar a rodada atual e botão de avançar
 */
export interface RoundControlProps {
  currentRound: number;
  usedCount: number;
  onAdvanceRound: () => void;
  onResetCombat?: () => void;
  className?: string;
}
