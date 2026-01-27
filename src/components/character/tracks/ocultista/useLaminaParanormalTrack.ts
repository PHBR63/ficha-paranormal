/**
 * Hook de lógica para a trilha Lâmina Paranormal
 * 
 * Gerencia:
 * - Habilidade ativa: Conjuração Marcial (NEX 65%)
 * - Passivas: Lâmina Maldita, Gladiador Paranormal, Lâmina do Medo
 * - Custo de PE e ativação de efeitos
 * 
 * @module tracks/ocultista/useLaminaParanormalTrack
 */

import { useMemo, useCallback, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { EffectDuration } from '@/hooks/useActivatedEffects';

// =====================================================
// TIPOS E CONSTANTES
// =====================================================

/** Habilidade ativa da trilha Lâmina Paranormal */
export interface LaminaAbility {
  id: string;
  name: string;
  minNex: number;
  peCost: number;
  actionType: 'free';
  shortEffect: string;
  trigger: string;
  description: string;
}

/** Passiva da trilha Lâmina Paranormal */
export interface LaminaPassive {
  name: string;
  minNex: number;
  effect: string;
}

/** IDs de efeitos para o SUE */
export const LAMINA_EFFECT_IDS = {
  CONJURACAO_MARCIAL: 'track-conjuracao-marcial',
} as const;

/** Habilidades ativas da trilha */
export const LAMINA_ABILITIES: LaminaAbility[] = [
  {
    id: 'conjuracao-marcial',
    name: 'Conjuração Marcial',
    minNex: 65,
    peCost: 2,
    actionType: 'free',
    trigger: '1x por rodada, após ritual de ação padrão',
    description: 'Uma vez por rodada, quando lança um ritual com execução de ação padrão, você pode gastar 2 PE para fazer um ataque corpo a corpo como ação livre.',
    shortEffect: 'Ataque corpo a corpo grátis após ritual',
  },
];

/** Passivas da trilha */
export const LAMINA_PASSIVES: LaminaPassive[] = [
  { 
    name: 'Lâmina Maldita', 
    minNex: 10, 
    effect: 'Aprende Amaldiçoar Arma. +1 PE = ação movimento. Usa Ocultismo para ataque.' 
  },
  { 
    name: 'Gladiador Paranormal', 
    minNex: 40, 
    effect: 'Acerto corpo a corpo = +2 PE temp. Máx/cena = limite PE/turno.' 
  },
  { 
    name: 'Lâmina do Medo', 
    minNex: 99, 
    effect: 'Aprende o ritual Lâmina do Medo' 
  },
];

// =====================================================
// PROPS DO HOOK
// =====================================================

export interface UseLaminaParanormalTrackProps {
  classTrack: string | null | undefined;
  nex: number;
  peCurrent: number;
  onPEChange: (newPE: number) => void;
  onRequestAttack?: () => void;
  onActivateEffect?: (id: string, name: string, duration: EffectDuration, metadata?: Record<string, unknown>) => void;
  /** Callback para rastrear PE gasto na rodada */
  onTrackPESpent?: (abilityName: string, cost: number) => void;
  /** Trilha de Versatilidade do personagem (se houver) */
  versatilityTrack?: { trackId: string; abilityId: string } | null;
}

// =====================================================
// HOOK PRINCIPAL
// =====================================================

export function useLaminaParanormalTrack({
  classTrack,
  nex,
  peCurrent,
  onPEChange,
  onRequestAttack,
  onActivateEffect,
  onTrackPESpent,
  versatilityTrack,
}: UseLaminaParanormalTrackProps) {
  const { toast } = useToast();
  const [isActivating, setIsActivating] = useState(false);

  // Verifica se é trilha Lâmina Paranormal (trilha principal)
  const isLaminaBase = useMemo(() => {
    if (!classTrack) return false;
    const trackNorm = classTrack.toLowerCase().replace(/\s+/g, '-');
    return trackNorm.includes('lamina') || trackNorm.includes('lâmina');
  }, [classTrack]);

  // Verifica se tem Lâmina Maldita via Versatilidade (habilidade NEX 10%)
  const hasLaminaMalditaFromVersatility = 
    versatilityTrack?.trackId === 'lamina-paranormal' && 
    versatilityTrack?.abilityId === 'lamina-maldita';

  // Considerar como Lâmina se for a trilha principal OU tiver habilidade via Versatilidade
  const isLamina = isLaminaBase || hasLaminaMalditaFromVersatility;

  // Habilidades desbloqueadas pelo NEX (apenas para trilha principal)
  const unlockedAbilities = useMemo(() => {
    if (!isLaminaBase) return [];
    return LAMINA_ABILITIES.filter(a => nex >= a.minNex);
  }, [nex, isLaminaBase]);

  // Passivas desbloqueadas pelo NEX (ou via Versatilidade para Lâmina Maldita)
  const unlockedPassives = useMemo(() => {
    if (hasLaminaMalditaFromVersatility) {
      // Se obteve via Versatilidade, só tem acesso à Lâmina Maldita
      return LAMINA_PASSIVES.filter(p => p.minNex === 10);
    }
    if (!isLaminaBase) return [];
    return LAMINA_PASSIVES.filter(p => nex >= p.minNex);
  }, [nex, isLaminaBase, hasLaminaMalditaFromVersatility]);

  // Verifica se Conjuração Marcial está disponível (apenas trilha principal)
  const hasConjuracaoMarcial = isLaminaBase && nex >= 65;

  // Verifica se tem Gladiador Paranormal (apenas trilha principal)
  const hasGladiadorParanormal = isLaminaBase && nex >= 40;

  // Verificar se pode pagar o custo de PE
  const canAffordAbility = useCallback((ability: LaminaAbility): boolean => {
    return peCurrent >= ability.peCost;
  }, [peCurrent]);

  // Usar Conjuração Marcial
  const handleConjuracaoMarcial = useCallback(async () => {
    if (peCurrent < 2) {
      toast({ title: 'PE insuficiente', variant: 'destructive' });
      return;
    }

    setIsActivating(true);
    await new Promise(r => setTimeout(r, 300));

    const newPE = peCurrent - 2;
    onPEChange(newPE);
    onTrackPESpent?.('Conjuração Marcial', 2);

    onActivateEffect?.(LAMINA_EFFECT_IDS.CONJURACAO_MARCIAL, 'Conjuração Marcial', 'instant');

    toast({
      title: 'Conjuração Marcial ativado!',
      description: 'Ataque corpo a corpo liberado. -2 PE',
    });

    setIsActivating(false);
    onRequestAttack?.();
  }, [peCurrent, onPEChange, toast, onActivateEffect, onRequestAttack, onTrackPESpent]);

  return {
    // Estado
    isLamina,
    isActivating,
    
    // Flags
    hasConjuracaoMarcial,
    hasGladiadorParanormal,
    
    // Dados
    unlockedAbilities,
    unlockedPassives,
    
    // Ações
    canAffordAbility,
    handleConjuracaoMarcial,
  };
}
