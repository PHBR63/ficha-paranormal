/**
 * useGuerreiroTrack - Hook de lógica compartilhada da trilha Guerreiro
 * 
 * Encapsula toda a lógica de negócio para uso em componentes desktop e mobile:
 * - Habilidades ativas: Revidar (NEX 40%), Força Opressora (NEX 65%)
 * - Habilidades passivas: Técnica Letal (NEX 10%), Potência Máxima (NEX 99%)
 * 
 * @module tracks/combatente/useGuerreiroTrack
 */

import { useState, useMemo, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { EffectDuration, ComputedEffects } from '@/hooks';

// =====================================================
// Constantes e Tipos
// =====================================================

/** Tipos de ação disponíveis */
export type ActionType = 'reaction' | 'free';

/** Tipos de manobra do Força Opressora */
export type ManeuverType = 'derrubar' | 'empurrar';

/** Definição de habilidade ativável do Guerreiro */
export interface GuerreiroAbility {
  id: string;
  name: string;
  minNex: number;
  peCost: number;
  actionType: ActionType;
  description: string;
  shortEffect: string;
  trigger?: string;
  followUp?: {
    description: string;
    peCost: number;
  };
  options?: {
    id: string;
    name: string;
    description: string;
  }[];
}

/** Definição de habilidade passiva */
export interface PassiveAbility {
  id: string;
  name: string;
  minNex: number;
  description: string;
  shortEffect: string;
}

/** IDs de efeitos do Guerreiro para integração com SUE */
export const GUERREIRO_EFFECT_IDS = {
  REVIDAR: 'track-revidar',
  FORCA_OPRESSORA: 'track-forca-opressora',
} as const;

/** Habilidades ativas do Guerreiro */
export const GUERREIRO_ABILITIES: GuerreiroAbility[] = [
  {
    id: 'revidar',
    name: 'Revidar',
    minNex: 40,
    peCost: 2,
    actionType: 'reaction',
    trigger: 'Após bloquear um ataque corpo a corpo',
    description: 'Quando você bloqueia um ataque corpo a corpo, pode gastar uma reação e 2 PE para fazer um ataque corpo a corpo contra o inimigo que o atacou.',
    shortEffect: 'Contra-ataque após bloquear',
  },
  {
    id: 'forca-opressora',
    name: 'Força Opressora',
    minNex: 65,
    peCost: 1,
    actionType: 'free',
    trigger: 'Após acertar ataque corpo a corpo',
    description: 'Quando você acerta um ataque corpo a corpo, pode gastar uma ação livre e 1 PE para realizar uma manobra derrubar ou empurrar contra o mesmo inimigo como parte do mesmo ataque.',
    shortEffect: 'Manobra grátis após acertar',
    followUp: {
      description: 'Se você escolheu derrubar e teve sucesso, pode gastar +1 PE para fazer um ataque corpo a corpo adicional contra o mesmo alvo.',
      peCost: 1,
    },
    options: [
      {
        id: 'derrubar',
        name: 'Derrubar',
        description: 'Teste de manobra. Se vencer, o inimigo fica caído. Pode gastar +1 PE para ataque adicional.',
      },
      {
        id: 'empurrar',
        name: 'Empurrar',
        description: 'Teste de manobra com +5 para cada 10 pontos de dano causados. Empurra 1,5m por margem de 5.',
      },
    ],
  },
];

/** Habilidades passivas do Guerreiro */
export const PASSIVE_ABILITIES: PassiveAbility[] = [
  {
    id: 'tecnica-letal',
    name: 'Técnica Letal',
    minNex: 10,
    description: '+2 na margem de ameaça com ataques corpo a corpo. Já automatizado no cálculo de crítico.',
    shortEffect: '+2 margem crítico corpo a corpo',
  },
  {
    id: 'potencia-maxima',
    name: 'Potência Máxima',
    minNex: 99,
    description: 'Dobra os bônus do Ataque Especial com ataques corpo a corpo. Selecione no modal de combate.',
    shortEffect: '2x Ataque Especial corpo a corpo',
  },
];

// =====================================================
// Props do Hook
// =====================================================

export interface UseGuerreiroTrackProps {
  classTrack: string | null | undefined;
  nex: number;
  peCurrent: number;
  onPEChange: (newPE: number) => void;
  onRequestAttack?: () => void;
  onActivateEffect?: (id: string, name: string, duration: EffectDuration, metadata?: Record<string, unknown>) => void;
  isEffectActive?: (id: string) => boolean;
  computedEffects?: ComputedEffects;
}

// =====================================================
// Hook Principal
// =====================================================

export function useGuerreiroTrack({
  classTrack,
  nex,
  peCurrent,
  onPEChange,
  onRequestAttack,
  onActivateEffect,
  computedEffects,
}: UseGuerreiroTrackProps) {
  const { toast } = useToast();

  // Estado local
  const [isOpen, setIsOpen] = useState(true);
  const [activatingAbility, setActivatingAbility] = useState<string | null>(null);
  const [forcaOpressoraModalOpen, setForcaOpressoraModalOpen] = useState(false);
  const [selectedManeuver, setSelectedManeuver] = useState<ManeuverType | null>(null);

  // Verifica se é trilha Guerreiro
  const isGuerreiro = useMemo(() => {
    if (!classTrack) return false;
    const trackNorm = classTrack.toLowerCase().replace(/\s+/g, '-');
    return trackNorm.includes('guerreiro');
  }, [classTrack]);

  // Habilidades desbloqueadas pelo NEX
  const unlockedAbilities = useMemo(() => {
    if (!isGuerreiro) return [];
    return GUERREIRO_ABILITIES.filter(a => nex >= a.minNex);
  }, [isGuerreiro, nex]);

  // Passivas desbloqueadas
  const unlockedPassives = useMemo(() => {
    if (!isGuerreiro) return [];
    return PASSIVE_ABILITIES.filter(p => nex >= p.minNex);
  }, [isGuerreiro, nex]);

  // Dados de bônus passivos do SUE
  const suePassiveBonuses = useMemo(() => {
    if (!computedEffects) return null;
    return {
      criticalMarginBonus: computedEffects.critical.marginBonus,
      specialAttackMultiplier: computedEffects.combatAdvanced.specialAttackMultiplier.value,
      hasMaxDamageOnCrit: computedEffects.combatAdvanced.maximumDamageOnCrit.enabled,
    };
  }, [computedEffects]);

  // Handler para usar Revidar
  const handleUseRevidar = useCallback(async () => {
    const ability = GUERREIRO_ABILITIES.find(a => a.id === 'revidar');
    if (!ability) return;

    if (peCurrent < ability.peCost) {
      toast({
        title: 'PE insuficiente',
        description: `${ability.name} requer ${ability.peCost} PE.`,
        variant: 'destructive',
      });
      return;
    }

    setActivatingAbility(ability.id);
    await new Promise(resolve => setTimeout(resolve, 300));

    const newPE = peCurrent - ability.peCost;
    onPEChange(newPE);

    // Registra no SUE
    onActivateEffect?.(GUERREIRO_EFFECT_IDS.REVIDAR, 'Revidar', 'instant');

    toast({
      title: `${ability.name} ativado!`,
      description: `${ability.shortEffect}. -${ability.peCost} PE (restam ${newPE})`,
    });

    setActivatingAbility(null);
    onRequestAttack?.();
  }, [peCurrent, onPEChange, toast, onRequestAttack, onActivateEffect]);

  // Handler para abrir modal de Força Opressora
  const handleOpenForcaOpressora = useCallback(() => {
    const ability = GUERREIRO_ABILITIES.find(a => a.id === 'forca-opressora');
    if (!ability) return;

    if (peCurrent < ability.peCost) {
      toast({
        title: 'PE insuficiente',
        description: `${ability.name} requer ${ability.peCost} PE.`,
        variant: 'destructive',
      });
      return;
    }

    setForcaOpressoraModalOpen(true);
  }, [peCurrent, toast]);

  // Handler para confirmar Força Opressora
  const handleConfirmForcaOpressora = useCallback(async (withExtraAttack: boolean = false) => {
    const ability = GUERREIRO_ABILITIES.find(a => a.id === 'forca-opressora');
    if (!ability || !selectedManeuver) return;

    let totalCost = ability.peCost;
    if (withExtraAttack && selectedManeuver === 'derrubar' && ability.followUp) {
      totalCost += ability.followUp.peCost;
    }

    if (peCurrent < totalCost) {
      toast({
        title: 'PE insuficiente',
        description: `Esta ação requer ${totalCost} PE.`,
        variant: 'destructive',
      });
      return;
    }

    setActivatingAbility(ability.id);
    await new Promise(resolve => setTimeout(resolve, 300));

    const newPE = peCurrent - totalCost;
    onPEChange(newPE);

    const maneuverName = selectedManeuver === 'derrubar' ? 'Derrubar' : 'Empurrar';
    const extraInfo = selectedManeuver === 'empurrar'
      ? 'Bônus: +5 para cada 10 de dano causado.'
      : withExtraAttack
        ? 'Se derrubar, faça um ataque adicional!'
        : 'Role o teste de manobra contra o alvo.';

    // Registra no SUE
    onActivateEffect?.(GUERREIRO_EFFECT_IDS.FORCA_OPRESSORA, 'Força Opressora', 'instant', {
      maneuver: selectedManeuver,
      withExtraAttack,
    });

    toast({
      title: `${ability.name} - ${maneuverName}`,
      description: `${extraInfo} -${totalCost} PE (restam ${newPE})`,
    });

    setActivatingAbility(null);
    setForcaOpressoraModalOpen(false);
    setSelectedManeuver(null);

    if (withExtraAttack && selectedManeuver === 'derrubar') {
      onRequestAttack?.();
    }
  }, [peCurrent, onPEChange, selectedManeuver, toast, onRequestAttack, onActivateEffect]);

  // Verifica se pode custear uma habilidade
  const canAfford = useCallback((peCost: number) => peCurrent >= peCost, [peCurrent]);

  return {
    // Estado
    isGuerreiro,
    isOpen,
    setIsOpen,
    activatingAbility,
    forcaOpressoraModalOpen,
    setForcaOpressoraModalOpen,
    selectedManeuver,
    setSelectedManeuver,

    // Dados
    unlockedAbilities,
    unlockedPassives,
    suePassiveBonuses,

    // Handlers
    handleUseRevidar,
    handleOpenForcaOpressora,
    handleConfirmForcaOpressora,
    canAfford,
  };
}
