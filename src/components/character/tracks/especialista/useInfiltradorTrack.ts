/**
 * useInfiltradorTrack - Hook de lógica para a trilha Infiltrador
 * 
 * Encapsula toda a lógica de habilidades da trilha:
 * - NEX 10%: Ataque Furtivo (+1d6/+2d6/+3d6/+4d6 dano extra, corpo a corpo ou alcance curto)
 * - NEX 40%: Gatuno (+5 Atletismo/Crime, esconder sem penalidade de movimento)
 * - NEX 65%: Assassinar (dobra dados do Ataque Furtivo, até final do próximo turno)
 * - NEX 99%: Sombra Fugaz (ignora penalidade de -3d20 Furtividade após ação chamativa)
 * 
 * @module tracks/especialista/useInfiltradorTrack
 */

import { useState, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import { TRACK_EFFECT_IDS, type EffectDuration, type ComputedEffects } from '@/hooks';

// =====================================================
// Funções Auxiliares
// =====================================================

/**
 * Calcula os dados de dano extra do Ataque Furtivo baseado no NEX
 */
export function getAtaqueFurtivoDice(nex: number): string {
  if (nex >= 99) return '+4d6';
  if (nex >= 65) return '+3d6';
  if (nex >= 40) return '+2d6';
  return '+1d6';
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
}: UseInfiltradorTrackProps) {
  const [assassinarActive, setAssassinarActive] = useState(false);

  // Verifica se é Infiltrador
  const isInfiltrador = classTrack === 'infiltrador';

  // Habilidades desbloqueadas por NEX
  const hasAtaqueFurtivo = nex >= 10;
  const hasGatuno = nex >= 40;
  const hasAssassinar = nex >= 65;
  const hasSombraFugaz = nex >= 99;

  // Verifica se Ataque Furtivo já foi usado nesta rodada
  const ataqueFurtivoUsedThisRound = usedAbilitiesThisRound.includes('ataque-furtivo-trilha');

  // Dados de dano do Ataque Furtivo
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
   * Ativa o Ataque Furtivo (1 PE, 1x/rodada)
   */
  const handleAtaqueFurtivo = useCallback(() => {
    if (peCurrent < 1) {
      toast.error('PE insuficiente', { description: 'Ataque Furtivo requer 1 PE.' });
      return;
    }
    if (ataqueFurtivoUsedThisRound) {
      toast.warning('Já usado nesta rodada', { description: 'Ataque Furtivo só pode ser usado 1x/rodada.' });
      return;
    }

    onPEChange(-1);
    onAbilityUsed?.('ataque-furtivo-trilha');
    onActivateEffect?.(TRACK_EFFECT_IDS.ATAQUE_FURTIVO, 'Ataque Furtivo', 'instant');
    
    const doubledDice = (assassinarActive || sneakAttackMultiplier > 1) ? ' (DOBRADO!)' : '';
    
    toast.success('Ataque Furtivo ativado!', {
      description: `${sneakAttackDice} dano extra${doubledDice}. Custo: 1 PE.`
    });

    if (assassinarActive) {
      setAssassinarActive(false);
    }
  }, [peCurrent, ataqueFurtivoUsedThisRound, onPEChange, onAbilityUsed, onActivateEffect, sneakAttackDice, sneakAttackMultiplier, assassinarActive]);

  /**
   * Ativa Assassinar (3 PE + ação de movimento)
   */
  const handleAssassinar = useCallback(() => {
    if (peCurrent < 3) {
      toast.error('PE insuficiente', { description: 'Assassinar requer 3 PE.' });
      return;
    }

    onPEChange(-3);
    setAssassinarActive(true);
    onActivateEffect?.(TRACK_EFFECT_IDS.ASSASSINAR, 'Assassinar', 'next-turn');
    
    toast.success('Assassinar ativado!', {
      description: `Até o final do próximo turno: primeiro Ataque Furtivo terá dados dobrados. Alvo fica inconsciente/morrendo (Fort DT ${assassinarDT} evita).`
    });
  }, [peCurrent, onPEChange, onActivateEffect, assassinarDT]);

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
    handleSombraFugaz,
    
    // Helpers
    canAffordAtaqueFurtivo: peCurrent >= 1 && !ataqueFurtivoUsedThisRound,
    canAffordAssassinar: peCurrent >= 3 && !assassinarActive,
    canAffordSombraFugaz: peCurrent >= 3,
  };
}
