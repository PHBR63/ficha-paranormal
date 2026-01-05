/**
 * useOperacoesEspeciaisTrack - Hook de lógica compartilhada da trilha Operações Especiais
 * 
 * Encapsula toda a lógica de negócio:
 * - Passivas: Iniciativa Aprimorada (NEX 10%), Sempre Alerta (NEX 99%)
 * - Ativas: Ataque Extra (NEX 40%), Surto de Adrenalina (NEX 65%)
 * 
 * @module tracks/combatente/useOperacoesEspeciaisTrack
 */

import { useState, useMemo, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { EffectDuration, ComputedEffects } from '@/hooks';

// =====================================================
// Constantes e Tipos
// =====================================================

/** Tipo de ação extra do Surto de Adrenalina */
export type SurtoChoice = 'standard' | 'movement';

/** Definição de habilidade ativa */
export interface OperacoesAbility {
  id: string;
  name: string;
  minNex: number;
  peCost: number;
  description: string;
  shortEffect: string;
  perRound?: boolean;
  requiresChoice?: boolean;
}

/** Definição de habilidade passiva */
export interface PassiveAbility {
  id: string;
  name: string;
  minNex: number;
  description: string;
  effect: string;
}

/** IDs de efeitos para integração com SUE */
export const OPERACOES_EFFECT_IDS = {
  ATAQUE_EXTRA: 'track-ataque-extra',
  SURTO_ADRENALINA: 'track-surto-adrenalina',
} as const;

/** Habilidades ativas de Operações Especiais */
export const OPERACOES_ABILITIES: OperacoesAbility[] = [
  {
    id: 'ataque-extra',
    name: 'Ataque Extra',
    minNex: 40,
    peCost: 2,
    description: 'Uma vez por rodada, quando faz um ataque, você pode gastar 2 PE para fazer um ataque adicional.',
    shortEffect: '+1 ataque',
    perRound: true,
  },
  {
    id: 'surto-de-adrenalina',
    name: 'Surto de Adrenalina',
    minNex: 65,
    peCost: 5,
    description: 'Você pode gastar 5 PE para realizar uma ação padrão ou de movimento adicional na rodada. Você pode usar esta habilidade uma vez por rodada.',
    shortEffect: '+1 ação (padrão ou movimento)',
    perRound: true,
    requiresChoice: true,
  },
];

/** Habilidades passivas de Operações Especiais */
export const PASSIVE_ABILITIES: PassiveAbility[] = [
  {
    id: 'iniciativa-aprimorada',
    name: 'Iniciativa Aprimorada',
    minNex: 10,
    description: 'Você recebe +5 em testes de iniciativa e, na primeira rodada de cada combate, pode realizar uma ação de movimento adicional.',
    effect: '+5 Init, mov. extra (1ª rod.)',
  },
  {
    id: 'sempre-alerta',
    name: 'Sempre Alerta',
    minNex: 99,
    description: 'Você recebe 1 ação padrão adicional no início de cada cena de combate.',
    effect: '+1 ação padrão (início combate)',
  },
];

// =====================================================
// Props do Hook
// =====================================================

export interface UseOperacoesEspeciaisTrackProps {
  classTrack: string | null | undefined;
  nex: number;
  peCurrent: number;
  onPEChange: (newPE: number) => void;
  usedAbilitiesThisRound?: string[];
  onAbilityUsed?: (abilityId: string) => void;
  onActivateEffect?: (id: string, name: string, duration: EffectDuration, metadata?: Record<string, unknown>) => void;
  isEffectActive?: (id: string) => boolean;
  computedEffects?: ComputedEffects;
}

// =====================================================
// Hook Principal
// =====================================================

export function useOperacoesEspeciaisTrack({
  classTrack,
  nex,
  peCurrent,
  onPEChange,
  usedAbilitiesThisRound: externalUsedAbilities,
  onAbilityUsed,
  onActivateEffect,
}: UseOperacoesEspeciaisTrackProps) {
  const { toast } = useToast();

  // Estado local
  const [isOpen, setIsOpen] = useState(true);
  const [localUsedAbilities, setLocalUsedAbilities] = useState<Set<string>>(new Set());
  const [showSurtoModal, setShowSurtoModal] = useState(false);

  // Usa tracking externo se fornecido
  const usedAbilitiesSet = useMemo(() => {
    if (externalUsedAbilities) {
      return new Set(externalUsedAbilities);
    }
    return localUsedAbilities;
  }, [externalUsedAbilities, localUsedAbilities]);

  // Verifica se é trilha Operações Especiais
  const isOperacoesEspeciais = useMemo(() => {
    if (!classTrack) return false;
    const normalized = classTrack.toLowerCase().replace(/[^a-z]/g, '');
    return normalized.includes('operacoes') || normalized.includes('especiais') ||
      classTrack === 'operacoes-especiais';
  }, [classTrack]);

  // Habilidades desbloqueadas
  const unlockedAbilities = useMemo(() => {
    if (!isOperacoesEspeciais) return [];
    return OPERACOES_ABILITIES.filter(a => nex >= a.minNex);
  }, [isOperacoesEspeciais, nex]);

  // Passivas desbloqueadas
  const unlockedPassives = useMemo(() => {
    if (!isOperacoesEspeciais) return [];
    return PASSIVE_ABILITIES.filter(p => nex >= p.minNex);
  }, [isOperacoesEspeciais, nex]);

  // Marca habilidade como usada
  const markAbilityAsUsed = useCallback((abilityId: string) => {
    if (onAbilityUsed) {
      onAbilityUsed(abilityId);
    } else {
      setLocalUsedAbilities(prev => new Set(prev).add(abilityId));
    }
  }, [onAbilityUsed]);

  // Verifica se já foi usada
  const isAbilityUsed = useCallback(
    (abilityId: string) => usedAbilitiesSet.has(abilityId),
    [usedAbilitiesSet]
  );

  // Handler para usar habilidade
  const handleUseAbility = useCallback((ability: OperacoesAbility) => {
    if (ability.perRound && isAbilityUsed(ability.id)) {
      toast({
        title: 'Limite por rodada',
        description: `${ability.name} já foi usada.`,
        variant: 'destructive',
      });
      return;
    }

    if (peCurrent < ability.peCost) {
      toast({
        title: 'PE insuficiente',
        description: `${ability.name} requer ${ability.peCost} PE.`,
        variant: 'destructive',
      });
      return;
    }

    // Se precisa de escolha (Surto), abre modal
    if (ability.requiresChoice) {
      setShowSurtoModal(true);
      return;
    }

    // Executa direto
    onPEChange(peCurrent - ability.peCost);
    markAbilityAsUsed(ability.id);

    // Registra no SUE
    if (ability.id === 'ataque-extra') {
      onActivateEffect?.(OPERACOES_EFFECT_IDS.ATAQUE_EXTRA, 'Ataque Extra', 'round');
    }

    toast({
      title: `${ability.name}!`,
      description: `${ability.shortEffect}. -${ability.peCost} PE`,
    });
  }, [peCurrent, onPEChange, markAbilityAsUsed, isAbilityUsed, toast, onActivateEffect]);

  // Handler para escolha do Surto
  const handleSurtoChoice = useCallback((choice: SurtoChoice) => {
    const ability = OPERACOES_ABILITIES.find(a => a.id === 'surto-de-adrenalina')!;

    onPEChange(peCurrent - ability.peCost);
    markAbilityAsUsed(ability.id);
    setShowSurtoModal(false);

    // Registra no SUE
    onActivateEffect?.(OPERACOES_EFFECT_IDS.SURTO_ADRENALINA, 'Surto de Adrenalina', 'round', { choice });

    toast({
      title: 'Surto de Adrenalina!',
      description: `+1 ${choice === 'standard' ? 'ação padrão' : 'movimento'}. -${ability.peCost} PE`,
    });
  }, [peCurrent, onPEChange, markAbilityAsUsed, toast, onActivateEffect]);

  // Reset de usos locais
  const resetRoundUsage = useCallback(() => {
    if (!externalUsedAbilities) {
      setLocalUsedAbilities(new Set());
    }
  }, [externalUsedAbilities]);

  // Verifica se pode custear
  const canAfford = useCallback((peCost: number) => peCurrent >= peCost, [peCurrent]);

  // Verifica se tem algum uso local (para mostrar botão de reset)
  const hasLocalUsage = useMemo(() => {
    return !externalUsedAbilities && localUsedAbilities.size > 0;
  }, [externalUsedAbilities, localUsedAbilities]);

  return {
    // Estado
    isOperacoesEspeciais,
    isOpen,
    setIsOpen,
    showSurtoModal,
    setShowSurtoModal,

    // Dados
    unlockedAbilities,
    unlockedPassives,
    hasLocalUsage,

    // Handlers
    handleUseAbility,
    handleSurtoChoice,
    resetRoundUsage,
    canAfford,
    isAbilityUsed,
  };
}
