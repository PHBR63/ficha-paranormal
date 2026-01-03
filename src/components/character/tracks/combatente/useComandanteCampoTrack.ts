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
  maxAllies?: number | 'intellect';
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
export const COMANDANTE_ABILITIES: LeadershipAbility[] = [
  {
    id: 'inspirar-confianca',
    name: 'Inspirar Confiança',
    minNex: 10,
    peCost: 2,
    actionType: 'reaction',
    range: 'short',
    description: 'Quando um aliado em alcance curto faz um teste e erra, você pode gastar uma reação e 2 PE para fazer o aliado repetir o teste.',
    shortEffect: 'Aliado rerola teste',
    maxAllies: 1,
  },
  {
    id: 'estrategista',
    name: 'Estrategista',
    minNex: 40,
    peCost: 1,
    actionType: 'standard',
    range: 'short',
    description: 'Você pode gastar uma ação padrão e 1 PE por aliado em alcance curto (máximo igual ao seu Intelecto) para fazer esses aliados moverem-se 1 quadrado (1,5m).',
    shortEffect: '+1 movimento para aliados',
    maxAllies: 'intellect',
    costPerTarget: true,
  },
  {
    id: 'brecha-na-guarda',
    name: 'Brecha na Guarda',
    minNex: 65,
    peCost: 2,
    actionType: 'reaction',
    range: 'medium',
    description: 'Quando você acerta um ataque contra um inimigo, pode gastar uma reação e 2 PE para fazer um aliado em alcance médio realizar um ataque contra o mesmo inimigo.',
    shortEffect: 'Aliado faz ataque extra',
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
    description: 'Você pode gastar uma ação padrão e 5 PE para fazer um aliado em alcance médio realizar uma ação padrão.',
    shortEffect: '+1 ação padrão para aliado',
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

  // Habilidades desbloqueadas
  const unlockedAbilities = useMemo(() => {
    if (!isComandanteCampo) return [];
    return COMANDANTE_ABILITIES.filter(a => nex >= a.minNex);
  }, [isComandanteCampo, nex]);

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
  }, [peCurrent, onPEChange, onAbilityUsed, isAbilityUsedThisRound, toast, onActivateEffect]);

  // Verifica se pode custear
  const canAfford = useCallback((peCost: number) => peCurrent >= peCost, [peCurrent]);

  // Calcula número de aliados baseado em tipo
  const getMaxAllies = useCallback((maxAllies: number | 'intellect' | undefined) => {
    if (maxAllies === 'intellect') return maxAlliesForEstrategista;
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
