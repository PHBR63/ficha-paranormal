/**
 * Hook de lógica para a trilha Intuitivo
 * 
 * Gerencia:
 * - Passivas: Mente Sã, Presença Poderosa, Inabalável, Presença do Medo
 * - Cálculos de bônus de resistência e Presença para rituais
 * 
 * @module tracks/ocultista/useIntuitivoTrack
 */

import { useMemo } from 'react';
import type { LucideIcon } from '@/components/icons/ordem-icons';
import { Brain, Shield, Sparkles } from '@/components/icons/ordem-icons';

// =====================================================
// TIPOS E CONSTANTES
// =====================================================

/** Habilidade passiva da trilha Intuitivo */
export interface IntuitivoAbility {
  id: string;
  name: string;
  minNex: number;
  effect: string;
  icon: LucideIcon;
  highlight?: string;
}

/** Habilidades da trilha Intuitivo (todas passivas) */
export const INTUITIVO_ABILITIES: IntuitivoAbility[] = [
  { 
    id: 'mente-sa',
    name: 'Mente Sã', 
    minNex: 10, 
    effect: 'Resistência paranormal +5 (testes contra efeitos paranormais)',
    icon: Shield,
    highlight: '+5 Resistência',
  },
  { 
    id: 'presenca-poderosa',
    name: 'Presença Poderosa', 
    minNex: 40, 
    effect: 'Soma limite de PE/turno à Presença para efeitos de rituais (não afeta DT)',
    icon: Sparkles,
  },
  { 
    id: 'inabalavel',
    name: 'Inabalável', 
    minNex: 65, 
    effect: 'RD Mental 10. Teste Vontade: sucesso = sem dano, falha = metade.',
    icon: Shield,
    highlight: 'RD Mental 10',
  },
  { 
    id: 'presenca-do-medo',
    name: 'Presença do Medo', 
    minNex: 99, 
    effect: 'Aprende o ritual Presença do Medo',
    icon: Brain,
  },
];

// =====================================================
// PROPS DO HOOK
// =====================================================

export interface UseIntuitivoTrackProps {
  classTrack: string | null | undefined;
  nex: number;
  presence?: number;
  peLimitPerTurn?: number;
  /** Trilha de Versatilidade do personagem (se houver) */
  versatilityTrack?: {
    trackId: string;
    abilityId: string;
  } | null;
}

// =====================================================
// HOOK PRINCIPAL
// =====================================================

export function useIntuitivoTrack({
  classTrack,
  nex,
  presence = 1,
  peLimitPerTurn = 2,
  versatilityTrack,
}: UseIntuitivoTrackProps) {
  // Verifica se é trilha Intuitivo (principal)
  const isIntuitivoBase = useMemo(() => {
    if (!classTrack) return false;
    return classTrack.toLowerCase().includes('intuitivo');
  }, [classTrack]);

  // Detecta se tem habilidade de Intuitivo via Versatilidade
  const hasIntuitivoFromVersatility = versatilityTrack?.trackId === 'intuitivo';

  // É Intuitivo se for trilha principal ou via Versatilidade
  const isIntuitivo = isIntuitivoBase || hasIntuitivoFromVersatility;

  // Habilidades desbloqueadas pelo NEX
  const unlockedAbilities = useMemo(() => {
    return INTUITIVO_ABILITIES.filter(a => nex >= a.minNex);
  }, [nex]);

  // Verifica se tem Mente Sã (+5 Res. Paranormal)
  const hasMenteSa = nex >= 10;

  // Verifica se tem Presença Poderosa
  const hasPresencaPoderosa = nex >= 40;

  // Verifica se tem Inabalável (RD Mental 10)
  const hasInabalavel = nex >= 65;

  // Bônus de Resistência Paranormal
  const paranormalResistanceBonus = hasMenteSa ? 5 : 0;

  // Redução de Dano Mental
  const mentalDamageReduction = hasInabalavel ? 10 : 0;

  // Cálculo do bônus de Presença Poderosa
  const presencaPoderosaBonuses = useMemo(() => {
    if (!hasPresencaPoderosa) return null;
    return {
      base: presence,
      bonus: peLimitPerTurn,
      total: presence + peLimitPerTurn,
    };
  }, [hasPresencaPoderosa, presence, peLimitPerTurn]);

  // Presença efetiva para rituais (com bônus se aplicável)
  const effectivePresenceForRituals = hasPresencaPoderosa 
    ? presence + peLimitPerTurn 
    : presence;

  return {
    // Estado
    isIntuitivo,
    
    // Flags
    hasMenteSa,
    hasPresencaPoderosa,
    hasInabalavel,
    
    // Dados
    unlockedAbilities,
    paranormalResistanceBonus,
    mentalDamageReduction,
    presencaPoderosaBonuses,
    effectivePresenceForRituals,
  };
}
