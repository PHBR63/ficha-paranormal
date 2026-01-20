/**
 * useInfiltradorTrack - Hook de lógica para a trilha Infiltrador
 * 
 * Encapsula toda a lógica de habilidades da trilha conforme Livro Base v1.3:
 * - NEX 10%: Ataque Furtivo (1 PE para +Xd6 dano extra baseado no NEX)
 *   - NEX 10%: +1d6
 *   - NEX 40%: +2d6  
 *   - NEX 65%: +3d6
 *   - NEX 99%: +4d6
 * - NEX 40%: Gatuno (+5 Atletismo/Crime, esconder sem penalidade de movimento)
 * - NEX 65%: Assassinar (3 PE, dobra dados do Ataque Furtivo até final do próximo turno)
 * - NEX 99%: Sombra Fugaz (3 PE, ignora penalidade de -3d20 Furtividade após ação chamativa)
 * 
 * NOTA: O custo do Ataque Furtivo é FIXO em 1 PE. 
 * Os dados são determinados automaticamente pelo NEX, sem opção de PE extra.
 * 
 * @module tracks/especialista/useInfiltradorTrack
 */

import { useState, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import { TRACK_EFFECT_IDS, type EffectDuration, type ComputedEffects } from '@/hooks';

// =====================================================
// Constantes
// =====================================================

/** Custo fixo de PE do Ataque Furtivo (regra oficial) */
export const SNEAK_ATTACK_PE_COST = 1;

// =====================================================
// Funções Auxiliares
// =====================================================

/**
 * Calcula a quantidade de dados do Ataque Furtivo baseado no NEX
 * Conforme tabela oficial do Livro Base v1.3
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
  /** Callback para rastrear PE gasto na rodada */
  onTrackPESpent?: (abilityName: string, cost: number) => void;
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
  onTrackPESpent,
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

  // Dados de dano do Ataque Furtivo (determinados pelo NEX)
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
   * Ativa o Ataque Furtivo (custo fixo 1 PE)
   * Dados determinados automaticamente pelo NEX
   */
  const handleAtaqueFurtivo = useCallback(() => {
    // Validar PE suficiente (sempre 1 PE)
    if (peCurrent < SNEAK_ATTACK_PE_COST) {
      toast.error('PE insuficiente', { 
        description: 'Ataque Furtivo requer 1 PE.' 
      });
      return;
    }
    
    // Validar uso por rodada (1x/rodada)
    if (ataqueFurtivoUsedThisRound) {
      toast.warning('Já usado nesta rodada', { 
        description: 'Ataque Furtivo só pode ser usado 1x/rodada.' 
      });
      return;
    }

    // Deduzir PE (sempre 1)
    onPEChange(-SNEAK_ATTACK_PE_COST);
    onTrackPESpent?.('Ataque Furtivo', SNEAK_ATTACK_PE_COST);
    onAbilityUsed?.('ataque-furtivo-trilha');
    onActivateEffect?.(TRACK_EFFECT_IDS.ATAQUE_FURTIVO, 'Ataque Furtivo', 'instant');
    
    // Calcular dados finais (baseado no NEX, dobrado se Assassinar ativo)
    const finalDice = assassinarActive ? sneakAttackBaseDice * 2 : sneakAttackBaseDice;
    const doubledText = assassinarActive ? ' (DOBRADO!)' : '';
    
    toast.success('Ataque Furtivo ativado!', {
      description: `+${finalDice}d6 dano extra${doubledText}. Custo: 1 PE.`
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
    ataqueFurtivoUsedThisRound, 
    onPEChange, 
    onAbilityUsed, 
    onActivateEffect, 
    sneakAttackBaseDice, 
    assassinarActive,
    onToggleConditionalBonus,
    onTrackPESpent
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
    onTrackPESpent?.('Assassinar', 3);
    
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
  }, [peCurrent, onPEChange, onActivateEffect, assassinarDT, onToggleConditionalBonus, onTrackPESpent]);
  
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
    onTrackPESpent?.('Sombra Fugaz', 3);
    onActivateEffect?.(TRACK_EFFECT_IDS.SOMBRA_FUGAZ, 'Sombra Fugaz', 'instant');
    
    toast.success('Sombra Fugaz ativado!', {
      description: 'Ignora penalidade de –3d20 no teste de Furtividade após ação chamativa.'
    });
  }, [peCurrent, onPEChange, onActivateEffect, onTrackPESpent]);

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
    
    // Dados do SUE
    sueStealthBonuses,
    hasSueData: !!computedEffects?.sneakAttack,
    
    // Handlers
    handleAtaqueFurtivo,
    handleAssassinar,
    handleCancelAssassinar,
    handleSombraFugaz,
    
    // Helpers
    canAffordAtaqueFurtivo: peCurrent >= SNEAK_ATTACK_PE_COST && !ataqueFurtivoUsedThisRound,
    canAffordAssassinar: peCurrent >= 3 && !assassinarActive,
    canAffordSombraFugaz: peCurrent >= 3,
  };
}
