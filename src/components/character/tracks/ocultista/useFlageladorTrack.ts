/**
 * Hook de lógica para a trilha Flagelador
 * 
 * Gerencia:
 * - Habilidade ativa: Abraçar a Dor (NEX 40%)
 * - Passivas: Poder do Flagelo, Absorver Angústia, Medo Tangível
 * - Custo de PE e ativação de efeitos
 * 
 * @module tracks/ocultista/useFlageladorTrack
 */

import { useMemo, useCallback, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { EffectDuration } from '@/hooks/useActivatedEffects';

// =====================================================
// TIPOS E CONSTANTES
// =====================================================

/** Habilidade ativa da trilha Flagelador */
export interface FlageladorAbility {
  id: string;
  name: string;
  minNex: number;
  peCost: number;
  actionType: 'reaction';
  shortEffect: string;
  trigger: string;
  description: string;
}

/** Passiva da trilha Flagelador */
export interface FlageladorPassive {
  name: string;
  minNex: number;
  effect: string;
}

/** IDs de efeitos para o SUE */
export const FLAGELADOR_EFFECT_IDS = {
  ABRACAR_DOR: 'track-abracar-dor',
} as const;

/** Habilidades ativas da trilha */
export const FLAGELADOR_ABILITIES: FlageladorAbility[] = [
  {
    id: 'abracar-a-dor',
    name: 'Abraçar a Dor',
    minNex: 40,
    peCost: 2,
    actionType: 'reaction',
    trigger: 'Ao sofrer dano paranormal',
    description: 'Sempre que sofrer dano paranormal, você pode gastar uma reação e 2 PE para reduzir esse dano à metade.',
    shortEffect: 'Reduz dano paranormal à metade',
  },
];

/** Passivas da trilha */
export const FLAGELADOR_PASSIVES: FlageladorPassive[] = [
  { name: 'Poder do Flagelo', minNex: 10, effect: 'Use PV como PE (1:1). Só recupera com descanso.' },
  { name: 'Absorver Angústia', minNex: 65, effect: 'Ao matar com ritual: +PE temp = círculo' },
  { name: 'Medo Tangível', minNex: 99, effect: 'Aprende o ritual Medo Tangível' },
];

// =====================================================
// PROPS DO HOOK
// =====================================================

export interface UseFlageladorTrackProps {
  classTrack: string | null | undefined;
  nex: number;
  peCurrent: number;
  onPEChange: (newPE: number) => void;
  onActivateEffect?: (id: string, name: string, duration: EffectDuration, metadata?: Record<string, unknown>) => void;
  /** Callback para rastrear PE gasto na rodada */
  onTrackPESpent?: (abilityName: string, cost: number) => void;
  /** Trilha de Versatilidade do personagem (se houver) */
  versatilityTrack?: {
    trackId: string;
    abilityId: string;
  } | null;
}

// =====================================================
// HOOK PRINCIPAL
// =====================================================

export function useFlageladorTrack({
  classTrack,
  nex,
  peCurrent,
  onPEChange,
  onActivateEffect,
  onTrackPESpent,
  versatilityTrack,
}: UseFlageladorTrackProps) {
  const { toast } = useToast();
  const [isActivating, setIsActivating] = useState(false);

  // Verifica se é trilha Flagelador (principal)
  const isFlageladorBase = useMemo(() => {
    if (!classTrack) return false;
    return classTrack.toLowerCase().includes('flagelador');
  }, [classTrack]);

  // Detecta se tem habilidade de Flagelador via Versatilidade
  const hasFlageladorFromVersatility = versatilityTrack?.trackId === 'flagelador';

  // É Flagelador se for trilha principal ou via Versatilidade
  const isFlagelador = isFlageladorBase || hasFlageladorFromVersatility;

  // Habilidades desbloqueadas pelo NEX
  const unlockedAbilities = useMemo(() => {
    return FLAGELADOR_ABILITIES.filter(a => nex >= a.minNex);
  }, [nex]);

  // Passivas desbloqueadas pelo NEX
  const unlockedPassives = useMemo(() => {
    return FLAGELADOR_PASSIVES.filter(p => nex >= p.minNex);
  }, [nex]);

  // Verifica se Abraçar a Dor está disponível
  const hasAbracarDor = nex >= 40;

  // Verifica se tem Poder do Flagelo
  const hasPoderDoFlagelo = nex >= 10;

  // Verificar se pode pagar o custo de PE
  const canAffordAbility = useCallback((ability: FlageladorAbility): boolean => {
    return peCurrent >= ability.peCost;
  }, [peCurrent]);

  // Usar Abraçar a Dor
  const handleAbracarDor = useCallback(async () => {
    if (peCurrent < 2) {
      toast({ title: 'PE insuficiente', variant: 'destructive' });
      return;
    }

    setIsActivating(true);
    await new Promise(r => setTimeout(r, 300));

    const newPE = peCurrent - 2;
    onPEChange(newPE);
    onTrackPESpent?.('Abraçar a Dor', 2);

    onActivateEffect?.(FLAGELADOR_EFFECT_IDS.ABRACAR_DOR, 'Abraçar a Dor', 'instant');

    toast({
      title: 'Abraçar a Dor ativado!',
      description: 'Dano paranormal reduzido à metade. -2 PE',
    });

    setIsActivating(false);
  }, [peCurrent, onPEChange, toast, onActivateEffect, onTrackPESpent]);

  return {
    // Estado
    isFlagelador,
    isActivating,
    
    // Flags
    hasAbracarDor,
    hasPoderDoFlagelo,
    
    // Dados
    unlockedAbilities,
    unlockedPassives,
    
    // Ações
    canAffordAbility,
    handleAbracarDor,
  };
}
