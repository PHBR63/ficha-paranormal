/**
 * useTropaDeChoqueTrack - Hook de lógica compartilhada da trilha Tropa de Choque
 * 
 * Encapsula toda a lógica de negócio:
 * - Passivas: Casca Grossa (NEX 10%), Inquebrável (NEX 99%)
 * - Ativas: Cai Dentro (NEX 40%), Duro de Matar (NEX 65%)
 * - Integração com SUE para bônus condicionais quando machucado
 * 
 * @module tracks/combatente/useTropaDeChoqueTrack
 */

import { useState, useMemo, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { EffectDuration, ComputedEffects } from '@/hooks';

// =====================================================
// Constantes e Tipos
// =====================================================

/** Definição de habilidade ativa (reação) */
export interface TropaAbility {
  id: string;
  name: string;
  minNex: number;
  peCost: number;
  actionType: 'reaction';
  description: string;
  shortEffect: string;
  usesVigorDT?: boolean;
  progressionNex?: number;
  progressionText?: string;
}

/** Definição de habilidade passiva/condicional */
export interface PassiveAbility {
  id: string;
  name: string;
  minNex: number;
  description: string;
  effect: string;
  conditionalEffect?: string;
  conditionalId?: string;
}

/** IDs de efeitos para integração com SUE */
export const TROPA_EFFECT_IDS = {
  CAI_DENTRO: 'track-cai-dentro',
  DURO_DE_MATAR: 'track-duro-matar',
} as const;

/** Habilidades ativas (reações) da Tropa de Choque */
export const TROPA_ABILITIES: TropaAbility[] = [
  {
    id: 'cai-dentro',
    name: 'Cai Dentro',
    minNex: 40,
    peCost: 1,
    actionType: 'reaction',
    description: 'Sempre que um oponente em alcance curto ataca um de seus aliados, você pode gastar uma reação e 1 PE para fazer com que esse oponente faça um teste de Vontade (DT Vig). Se falhar, o oponente deve atacar você em vez de seu aliado.',
    shortEffect: 'Força inimigo a atacar você',
    usesVigorDT: true,
  },
  {
    id: 'duro-de-matar',
    name: 'Duro de Matar',
    minNex: 65,
    peCost: 2,
    actionType: 'reaction',
    description: 'Ao sofrer dano não paranormal, você pode gastar uma reação e 2 PE para reduzir esse dano à metade. Em NEX 85%, você pode usar esta habilidade para reduzir dano paranormal.',
    shortEffect: 'Reduz dano à metade',
    progressionNex: 85,
    progressionText: 'Inclui dano paranormal',
  },
];

/** Habilidades passivas/condicionais da Tropa de Choque */
export const PASSIVE_ABILITIES: PassiveAbility[] = [
  {
    id: 'casca-grossa',
    name: 'Casca Grossa',
    minNex: 10,
    description: 'Você recebe +1 PV para cada 5% de NEX e, quando faz um bloqueio, soma seu Vigor na resistência a dano recebida.',
    effect: '+1 PV por 5% NEX (automático)',
    conditionalEffect: '+Vigor em RD ao bloquear',
    conditionalId: 'bloqueio-casca-grossa',
  },
  {
    id: 'inquebravel',
    name: 'Inquebrável',
    minNex: 99,
    description: 'Enquanto estiver machucado, você recebe +5 na Defesa e resistência a dano 5. Enquanto estiver morrendo, você não fica indefeso e ainda pode realizar ações.',
    effect: '+5 Defesa, RD 5 (quando machucado)',
    conditionalEffect: 'Ativa quando PV < 50%',
    conditionalId: 'inquebravel',
  },
];

// =====================================================
// Props do Hook
// =====================================================

export interface UseTropaDeChoqueTrackProps {
  classTrack: string | null | undefined;
  nex: number;
  peCurrent: number;
  vigor: number;
  hpCurrent: number;
  hpMax: number;
  onPEChange: (newPE: number) => void;
  onActivateEffect?: (id: string, name: string, duration: EffectDuration, metadata?: Record<string, unknown>) => void;
  isEffectActive?: (id: string) => boolean;
  computedEffects?: ComputedEffects;
}

// =====================================================
// Hook Principal
// =====================================================

export function useTropaDeChoqueTrack({
  classTrack,
  nex,
  peCurrent,
  vigor,
  hpCurrent,
  hpMax,
  onPEChange,
  onActivateEffect,
  computedEffects,
}: UseTropaDeChoqueTrackProps) {
  const { toast } = useToast();

  // Estado local
  const [isOpen, setIsOpen] = useState(true);

  // Verifica se é trilha Tropa de Choque
  const isTropaDeChoque = useMemo(() => {
    if (!classTrack) return false;
    const normalized = classTrack.toLowerCase().replace(/[^a-z]/g, '');
    return normalized.includes('tropa') || normalized.includes('choque') ||
      classTrack === 'tropa-choque';
  }, [classTrack]);

  // Habilidades desbloqueadas
  const unlockedAbilities = useMemo(() => {
    if (!isTropaDeChoque) return [];
    return TROPA_ABILITIES.filter(a => nex >= a.minNex);
  }, [isTropaDeChoque, nex]);

  // Passivas desbloqueadas
  const unlockedPassives = useMemo(() => {
    if (!isTropaDeChoque) return [];
    return PASSIVE_ABILITIES.filter(p => nex >= p.minNex);
  }, [isTropaDeChoque, nex]);

  // Cálculos derivados
  const vigorDT = useMemo(() => 10 + vigor, [vigor]);
  const isWounded = useMemo(() => hpCurrent < (hpMax / 2), [hpCurrent, hpMax]);
  const cascaGrossaHP = useMemo(() => Math.floor(nex / 5), [nex]);

  // Dados do SUE para bônus condicionais
  const sueWoundedBonuses = computedEffects?.combatAdvanced?.conditionalBonuses?.whenWounded;
  const sueDyingBonuses = computedEffects?.combatAdvanced?.conditionalBonuses?.whenDying;

  // Bônus ativos quando machucado (do SUE ou fallback)
  const woundedDefenseBonus = useMemo(() => {
    if (sueWoundedBonuses && isWounded) {
      return sueWoundedBonuses.defenseBonus ?? 0;
    }
    return (nex >= 99 && isWounded) ? 5 : 0;
  }, [sueWoundedBonuses, isWounded, nex]);

  const woundedDamageResistance = useMemo(() => {
    if (sueWoundedBonuses && isWounded) {
      return sueWoundedBonuses.damageReduction ?? 0;
    }
    return (nex >= 99 && isWounded) ? 5 : 0;
  }, [sueWoundedBonuses, isWounded, nex]);

  const canActWhileDying = sueDyingBonuses?.canAct ?? false;

  // Handler para usar habilidade
  const handleUseAbility = useCallback((ability: TropaAbility) => {
    if (peCurrent < ability.peCost) {
      toast({
        title: 'PE insuficiente',
        description: `${ability.name} requer ${ability.peCost} PE.`,
        variant: 'destructive',
      });
      return;
    }

    onPEChange(peCurrent - ability.peCost);

    // Mensagem e registro no SUE específicos por habilidade
    if (ability.id === 'cai-dentro') {
      onActivateEffect?.(TROPA_EFFECT_IDS.CAI_DENTRO, 'Cai Dentro', 'instant', { dt: vigorDT });
      toast({
        title: 'Cai Dentro!',
        description: `Inimigo testa Vontade (DT ${vigorDT}). -${ability.peCost} PE`,
      });
    } else if (ability.id === 'duro-de-matar') {
      const canReduceParanormal = nex >= 85;
      onActivateEffect?.(TROPA_EFFECT_IDS.DURO_DE_MATAR, 'Duro de Matar', 'instant');
      toast({
        title: 'Duro de Matar!',
        description: `Dano ${canReduceParanormal ? '(físico ou paranormal)' : 'não paranormal'} reduzido à metade. -${ability.peCost} PE`,
      });
    }
  }, [peCurrent, onPEChange, vigorDT, nex, toast, onActivateEffect]);

  // Verifica se pode custear
  const canAfford = useCallback((peCost: number) => peCurrent >= peCost, [peCurrent]);

  // Verifica se tem progressão desbloqueada
  const hasProgression = useCallback((ability: TropaAbility) => {
    return ability.progressionNex ? nex >= ability.progressionNex : false;
  }, [nex]);

  return {
    // Estado
    isTropaDeChoque,
    isOpen,
    setIsOpen,

    // Dados
    unlockedAbilities,
    unlockedPassives,
    vigorDT,
    isWounded,
    cascaGrossaHP,
    vigor,

    // Bônus condicionais
    woundedDefenseBonus,
    woundedDamageResistance,
    canActWhileDying,
    sueWoundedBonuses,

    // Handlers
    handleUseAbility,
    canAfford,
    hasProgression,
  };
}
