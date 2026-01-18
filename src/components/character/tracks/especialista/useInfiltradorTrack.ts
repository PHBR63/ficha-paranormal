/**
 * useInfiltradorTrack - Hook de lógica para a trilha Infiltrador
 * 
 * Encapsula toda a lógica de habilidades da trilha:
 * - NEX 10%: Ataque Furtivo (+1d6/+2d6/+3d6/+4d6 dano extra, corpo a corpo ou alcance curto)
 * - NEX 40%: Gatuno (+5 Atletismo/Crime, esconder sem penalidade de movimento)
 * - NEX 65%: Assassinar (dobra dados do Ataque Furtivo, até final do próximo turno)
 * - NEX 99%: Sombra Fugaz (ignora penalidade de -3d20 Furtividade após ação chamativa)
 * 
 * ATUALIZAÇÃO: Ataque Furtivo agora suporta PE extra para dados adicionais
 * - Custo base: 1 PE
 * - Pode gastar PE adicional para +1d6 cada (até limite por rodada)
 * 
 * @module tracks/especialista/useInfiltradorTrack
 */

import { useState, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import { TRACK_EFFECT_IDS, type EffectDuration, type ComputedEffects } from '@/hooks';
import { getPELimitByNex } from '@/lib/dice-roller';

// =====================================================
// Funções Auxiliares
// =====================================================

/**
 * Calcula a quantidade de dados base do Ataque Furtivo baseado no NEX
 */
export function getAtaqueFurtivoBaseDice(nex: number): number {
  if (nex >= 99) return 4;
  if (nex >= 65) return 3;
  if (nex >= 40) return 2;
  return 1;
}

/**
 * Retorna string formatada dos dados de dano do Ataque Furtivo
 */
export function getAtaqueFurtivoDice(nex: number): string {
  return `+${getAtaqueFurtivoBaseDice(nex)}d6`;
}

/**
 * Calcula a DT do teste de Fortitude para Assassinar
 */
export function getAssassinarDT(agility: number): number {
  return agility;
}

// =====================================================
// Props do Hook
// =====================================================

export interface UseInfiltradorTrackProps {
  classTrack: string | null | undefined;
  nex: number;
  peCurrent: number;
  agility: number;
  onPEChange: (delta: number) => void;
  usedAbilitiesThisRound?: string[];
  onAbilityUsed?: (abilityId: string) => void;
  onActivateEffect?: (id: string, name: string, duration: EffectDuration, metadata?: Record<string, unknown>) => void;
  isEffectActive?: (id: string) => boolean;
  computedEffects?: ComputedEffects;
  /** Callback para alternar bônus condicional (Assassinar) */
  onToggleConditionalBonus?: (bonusId: string) => void;
  /** Lista de bônus condicionais ativos */
  activeConditionalBonuses?: string[];
}

// =====================================================
// Hook Principal
// =====================================================

export function useInfiltradorTrack({
  classTrack,
  nex,
  peCurrent,
  agility,
  onPEChange,
  usedAbilitiesThisRound = [],
  onAbilityUsed,
  onActivateEffect,
  isEffectActive,
  computedEffects,
  onToggleConditionalBonus,
  activeConditionalBonuses = [],
}: UseInfiltradorTrackProps) {
  // Estado local para Assassinar (fallback se não tiver sincronização externa)
  const [localAssassinarActive, setLocalAssassinarActive] = useState(false);
  
  // Assassinar pode vir de bônus condicionais externos OU estado local
  const assassinarActive = activeConditionalBonuses.includes('assassinar') || localAssassinarActive;

  // Verifica se é Infiltrador
  const isInfiltrador = classTrack === 'infiltrador';

  // Habilidades desbloqueadas por NEX
  const hasAtaqueFurtivo = nex >= 10;
  const hasGatuno = nex >= 40;
  const hasAssassinar = nex >= 65;
  const hasSombraFugaz = nex >= 99;

  // Verifica se Ataque Furtivo já foi usado nesta rodada
  const ataqueFurtivoUsedThisRound = usedAbilitiesThisRound.includes('ataque-furtivo-trilha');
  
  // Limite de PE por rodada
  const peLimit = useMemo(() => getPELimitByNex(nex), [nex]);
  const maxExtraPE = Math.max(0, peLimit - 1); // -1 porque 1 PE é o custo base

  // Dados base de dano do Ataque Furtivo
  const sneakAttackBaseDice = useMemo(() => getAtaqueFurtivoBaseDice(nex), [nex]);
  
  // Dados de dano do Ataque Furtivo (string formatada)
  const sneakAttackDice = useMemo(() => {
    const sueSneakAttack = computedEffects?.sneakAttack;
    if (sueSneakAttack) {
      const diceCount = sueSneakAttack.totalDice ?? sueSneakAttack.baseDice ?? 1;
      const dieType = sueSneakAttack.dieType ?? 'd6';
      return `+${diceCount}${dieType}`;
    }
    return getAtaqueFurtivoDice(nex);
  }, [computedEffects?.sneakAttack, nex]);

  // Multiplicador do Assassinar
  const sneakAttackMultiplier = useMemo(() => {
    const sueSneakAttack = computedEffects?.sneakAttack;
    if (sueSneakAttack?.multiplier) {
      return sueSneakAttack.multiplier;
    }
    return assassinarActive ? 2 : 1;
  }, [computedEffects?.sneakAttack, assassinarActive]);

  // DT do Assassinar
  const assassinarDT = useMemo(() => getAssassinarDT(agility), [agility]);

  // Dados de furtividade do SUE
  const sueStealthBonuses = useMemo(() => computedEffects?.sneakAttack?.stealthBonuses, [computedEffects]);
  const removesStealthMovementPenalty = sueStealthBonuses?.removesMovementPenalty ?? (nex >= 40);
  const ignoresStealthPenalties = sueStealthBonuses?.ignoresAllPenalties ?? false;

  /**
   * Ativa o Ataque Furtivo com PE extra opcional
   * @param extraPE - PE adicional a gastar para dados extras (0 = só custo base)
   */
  const handleAtaqueFurtivo = useCallback((extraPE: number = 0) => {
    const totalCost = 1 + extraPE;
    
    // Validar PE suficiente
    if (peCurrent < totalCost) {
      toast.error('PE insuficiente', { 
        description: `Ataque Furtivo requer ${totalCost} PE (1 base + ${extraPE} extra).` 
      });
      return;
    }
    
    // Validar limite por rodada
    if (extraPE > maxExtraPE) {
      toast.warning('Limite excedido', { 
        description: `Máximo de ${maxExtraPE} PE extra por rodada (limite: ${peLimit} PE/rodada).` 
      });
      return;
    }
    
    // Validar uso por rodada
    if (ataqueFurtivoUsedThisRound) {
      toast.warning('Já usado nesta rodada', { 
        description: 'Ataque Furtivo só pode ser usado 1x/rodada.' 
      });
      return;
    }

    // Deduzir PE
    onPEChange(-totalCost);
    onAbilityUsed?.('ataque-furtivo-trilha');
    onActivateEffect?.(TRACK_EFFECT_IDS.ATAQUE_FURTIVO, 'Ataque Furtivo', 'instant');
    
    // Calcular dados finais
    const baseDice = sneakAttackBaseDice;
    const totalDice = baseDice + extraPE;
    const finalDice = assassinarActive ? totalDice * 2 : totalDice;
    const doubledText = assassinarActive ? ' (DOBRADO!)' : '';
    
    toast.success('Ataque Furtivo ativado!', {
      description: `+${finalDice}d6 dano extra${doubledText}. Custo: ${totalCost} PE.`
    });

    // Consumir Assassinar após uso
    if (assassinarActive) {
      if (onToggleConditionalBonus) {
        onToggleConditionalBonus('assassinar');
      } else {
        setLocalAssassinarActive(false);
      }
    }
  }, [
    peCurrent, 
    maxExtraPE, 
    peLimit,
    ataqueFurtivoUsedThisRound, 
    onPEChange, 
    onAbilityUsed, 
    onActivateEffect, 
    sneakAttackBaseDice, 
    assassinarActive,
    onToggleConditionalBonus
  ]);

  /**
   * Ativa Assassinar (3 PE + ação de movimento)
   */
  const handleAssassinar = useCallback(() => {
    if (peCurrent < 3) {
      toast.error('PE insuficiente', { description: 'Assassinar requer 3 PE.' });
      return;
    }

    onPEChange(-3);
    
    // Ativar via bônus condicional (sincronizado) ou estado local
    if (onToggleConditionalBonus) {
      onToggleConditionalBonus('assassinar');
    } else {
      setLocalAssassinarActive(true);
    }
    
    onActivateEffect?.(TRACK_EFFECT_IDS.ASSASSINAR, 'Assassinar', 'next-turn');
    
    toast.success('Assassinar ativado!', {
      description: `Até o final do próximo turno: primeiro Ataque Furtivo terá dados dobrados. Alvo fica inconsciente/morrendo (Fort DT ${assassinarDT} evita).`
    });
  }, [peCurrent, onPEChange, onActivateEffect, assassinarDT, onToggleConditionalBonus]);
  
  /**
   * Cancela Assassinar (sem devolver PE)
   */
  const handleCancelAssassinar = useCallback(() => {
    if (onToggleConditionalBonus) {
      onToggleConditionalBonus('assassinar');
    } else {
      setLocalAssassinarActive(false);
    }
    toast.info('Assassinar cancelado');
  }, [onToggleConditionalBonus]);

  /**
   * Ativa Sombra Fugaz (3 PE)
   */
  const handleSombraFugaz = useCallback(() => {
    if (peCurrent < 3) {
      toast.error('PE insuficiente', { description: 'Sombra Fugaz requer 3 PE.' });
      return;
    }

    onPEChange(-3);
    onActivateEffect?.(TRACK_EFFECT_IDS.SOMBRA_FUGAZ, 'Sombra Fugaz', 'instant');
    
    toast.success('Sombra Fugaz ativado!', {
      description: 'Ignora penalidade de –3d20 no teste de Furtividade após ação chamativa.'
    });
  }, [peCurrent, onPEChange, onActivateEffect]);

  return {
    // Estado
    isInfiltrador,
    assassinarActive,
    ataqueFurtivoUsedThisRound,
    
    // Habilidades desbloqueadas
    hasAtaqueFurtivo,
    hasGatuno,
    hasAssassinar,
    hasSombraFugaz,
    
    // Dados derivados
    sneakAttackBaseDice,
    sneakAttackDice,
    sneakAttackMultiplier,
    assassinarDT,
    removesStealthMovementPenalty,
    ignoresStealthPenalties,
    
    // Limites de PE
    peLimit,
    maxExtraPE,
    
    // Dados do SUE
    sueStealthBonuses,
    hasSueData: !!computedEffects?.sneakAttack,
    
    // Handlers
    handleAtaqueFurtivo,
    handleAssassinar,
    handleCancelAssassinar,
    handleSombraFugaz,
    
    // Helpers
    canAffordAtaqueFurtivo: peCurrent >= 1 && !ataqueFurtivoUsedThisRound,
    canAffordAssassinar: peCurrent >= 3 && !assassinarActive,
    canAffordSombraFugaz: peCurrent >= 3,
  };
}
