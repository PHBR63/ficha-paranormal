/**
 * useComandanteCampoTrack - Hook de lógica compartilhada da trilha Comandante de Campo
 * 
 * Encapsula toda a lógica de negócio para habilidades de liderança:
 * - Inspirar Confiança (NEX 10%): Aliado rerola teste
 * - Estrategista (NEX 40%): +1 movimento para aliados
 * - Brecha na Guarda (NEX 65%): Ataque extra para aliado
 * - Oficial Comandante (NEX 99%): +1 ação padrão para aliado
 * 
 * @module tracks/combatente/useComandanteCampoTrack
 */

import { useState, useMemo, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { EffectDuration } from '@/hooks';

// =====================================================
// Constantes e Tipos
// =====================================================

/** Tipos de ação disponíveis */
export type ActionType = 'reaction' | 'standard';

/** Alcance das habilidades */
export type RangeType = 'short' | 'medium';

/** Tipos de máximo de aliados afetados */
export type MaxAlliesType = number | 'intellect' | 'all-visible';

/** Definição de habilidade de liderança */
export interface LeadershipAbility {
  id: string;
  name: string;
  minNex: number;
  peCost: number;
  actionType: ActionType;
  range: RangeType;
  description: string;
  shortEffect: string;
  maxAllies?: MaxAlliesType;
  perRound?: boolean;
  costPerTarget?: boolean;
}

/** IDs de efeitos para integração com SUE */
export const COMANDANTE_EFFECT_IDS = {
  INSPIRAR_CONFIANCA: 'track-inspirar-confianca',
  ESTRATEGISTA: 'track-estrategista',
  BRECHA_NA_GUARDA: 'track-brecha-guarda',
  OFICIAL_COMANDANTE: 'track-oficial-comandante',
} as const;

/** Habilidades do Comandante de Campo */
/** Habilidades base do Comandante de Campo (alcances atualizados dinamicamente) */
export const COMANDANTE_ABILITIES_BASE: LeadershipAbility[] = [
  {
    id: 'inspirar-confianca',
    name: 'Inspirar Confiança',
    minNex: 10,
    peCost: 2,
    actionType: 'reaction',
    range: 'short', // Atualizado para 'medium' a partir de NEX 65%
    description: 'Sua liderança inspira seus aliados. Você pode gastar uma reação e 2 PE para fazer um aliado em alcance curto rolar novamente um teste recém realizado.',
    shortEffect: 'Aliado rerola teste',
    maxAllies: 1,
  },
  {
    id: 'estrategista',
    name: 'Estrategista',
    minNex: 40,
    peCost: 1, // 1 PE TOTAL, não por aliado
    actionType: 'standard',
    range: 'short', // Atualizado para 'medium' a partir de NEX 65%
    description: 'Você pode direcionar aliados em alcance curto. Gaste uma ação padrão e 1 PE para direcionar aliados (máximo igual ao seu Intelecto). No próximo turno dos aliados afetados, eles ganham uma ação de movimento adicional.',
    shortEffect: '+1 ação de movimento',
    maxAllies: 'intellect',
    costPerTarget: false, // 1 PE total
  },
  {
    id: 'brecha-na-guarda',
    name: 'Brecha na Guarda',
    minNex: 65,
    peCost: 2,
    actionType: 'reaction',
    range: 'short', // Alcance do inimigo em relação a você
    description: 'Uma vez por rodada, quando um aliado causar dano em um inimigo que esteja em seu alcance curto, você pode gastar uma reação e 2 PE para que você ou outro aliado em alcance curto faça um ataque adicional contra o mesmo inimigo.',
    shortEffect: 'Ataque extra (você ou aliado)',
    maxAllies: 1,
    perRound: true,
  },
  {
    id: 'oficial-comandante',
    name: 'Oficial Comandante',
    minNex: 99,
    peCost: 5,
    actionType: 'standard',
    range: 'medium',
    description: 'Você pode gastar uma ação padrão e 5 PE para que cada aliado que você possa ver em alcance médio receba uma ação padrão adicional no próximo turno dele.',
    shortEffect: '+1 ação padrão (todos visíveis)',
    maxAllies: 'all-visible',
  },
];

// =====================================================
// Props do Hook
// =====================================================

export interface UseComandanteCampoTrackProps {
  classTrack: string | null | undefined;
  nex: number;
  peCurrent: number;
  intellect: number;
  onPEChange: (newPE: number) => void;
  usedAbilitiesThisRound?: string[];
  onAbilityUsed?: (abilityId: string) => void;
  onActivateEffect?: (id: string, name: string, duration: EffectDuration, metadata?: Record<string, unknown>) => void;
  isEffectActive?: (id: string) => boolean;
  /** Callback para registrar PE gasto na rodada */
  onTrackPESpent?: (abilityName: string, cost: number) => void;
}

// =====================================================
// Hook Principal
// =====================================================

export function useComandanteCampoTrack({
  classTrack,
  nex,
  peCurrent,
  intellect,
  onPEChange,
  usedAbilitiesThisRound = [],
  onAbilityUsed,
  onActivateEffect,
  onTrackPESpent,
}: UseComandanteCampoTrackProps) {
  const { toast } = useToast();

  // Estado local
  const [isOpen, setIsOpen] = useState(true);
  const [activatingAbility, setActivatingAbility] = useState<string | null>(null);

  // Verifica se é trilha Comandante de Campo
  const isComandanteCampo = useMemo(() => {
    if (!classTrack) return false;
    const trackNorm = classTrack.toLowerCase().replace(/\s+/g, '-');
    return trackNorm.includes('comandante') || trackNorm === 'comandante-campo';
  }, [classTrack]);

  // Verifica se tem upgrade de alcance (NEX >= 65, conforme Brecha na Guarda)
  const hasRangeUpgrade = nex >= 65;

  // Habilidades desbloqueadas com alcance dinâmico
  const unlockedAbilities = useMemo(() => {
    if (!isComandanteCampo) return [];
    
    return COMANDANTE_ABILITIES_BASE
      .filter(a => nex >= a.minNex)
      .map(ability => {
        // Atualiza alcance de Inspirar Confiança e Estrategista se NEX >= 65
        if (hasRangeUpgrade && (ability.id === 'inspirar-confianca' || ability.id === 'estrategista')) {
          return {
            ...ability,
            range: 'medium' as RangeType,
            // Atualiza descrição para refletir novo alcance
            description: ability.description.replace('alcance curto', 'alcance médio'),
          };
        }
        return ability;
      });
  }, [isComandanteCampo, nex, hasRangeUpgrade]);

  // Máximo de aliados para Estrategista
  const maxAlliesForEstrategista = Math.max(1, intellect);

  // Verifica se uma habilidade já foi usada nesta rodada
  const isAbilityUsedThisRound = useCallback(
    (abilityId: string) => usedAbilitiesThisRound.includes(abilityId),
    [usedAbilitiesThisRound]
  );

  // Handler para usar habilidade
  const handleUseAbility = useCallback(async (ability: LeadershipAbility) => {
    // Verifica limite por rodada
    if (ability.perRound && isAbilityUsedThisRound(ability.id)) {
      toast({
        title: 'Já usada',
        description: `${ability.name} só pode ser usada 1x/rodada.`,
        variant: 'destructive',
      });
      return;
    }

    // Verifica PE
    if (peCurrent < ability.peCost) {
      toast({
        title: 'PE insuficiente',
        description: `${ability.name} requer ${ability.peCost} PE.`,
        variant: 'destructive',
      });
      return;
    }

    setActivatingAbility(ability.id);
    await new Promise(resolve => setTimeout(resolve, 250));

    const newPE = peCurrent - ability.peCost;
    onPEChange(newPE);
    onTrackPESpent?.(ability.name, ability.peCost);
    onAbilityUsed?.(ability.id);

    // Registra no SUE
    const effectId = COMANDANTE_EFFECT_IDS[ability.id.toUpperCase().replace(/-/g, '_') as keyof typeof COMANDANTE_EFFECT_IDS];
    if (effectId) {
      onActivateEffect?.(effectId, ability.name, 'instant');
    }

    toast({
      title: ability.name,
      description: `${ability.shortEffect} • -${ability.peCost} PE (restam ${newPE})`,
    });

    setActivatingAbility(null);
  }, [peCurrent, onPEChange, onAbilityUsed, isAbilityUsedThisRound, toast, onActivateEffect, onTrackPESpent]);

  // Verifica se pode custear
  const canAfford = useCallback((peCost: number) => peCurrent >= peCost, [peCurrent]);

  // Calcula número de aliados baseado em tipo
  const getMaxAllies = useCallback((maxAllies: MaxAlliesType | undefined): number => {
    if (maxAllies === 'intellect') return maxAlliesForEstrategista;
    if (maxAllies === 'all-visible') return Infinity; // Todos visíveis
    return maxAllies ?? 1;
  }, [maxAlliesForEstrategista]);

  return {
    // Estado
    isComandanteCampo,
    isOpen,
    setIsOpen,
    activatingAbility,

    // Dados
    unlockedAbilities,
    maxAlliesForEstrategista,

    // Handlers
    handleUseAbility,
    canAfford,
    isAbilityUsedThisRound,
    getMaxAllies,
  };
}
