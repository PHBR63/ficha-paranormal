/**
 * Hook de lógica para a trilha Graduado
 * 
 * Gerencia:
 * - Passivas: Saber Ampliado, Grimório Ritualístico, Rituais Eficientes, Conhecendo o Medo
 * - Cálculo de capacidade do Grimório (baseado em Intelecto)
 * 
 * @module tracks/ocultista/useGraduadoTrack
 */

import { useMemo } from 'react';
import type { LucideIcon } from 'lucide-react';
import { BookOpen, Sparkles, BookMarked } from 'lucide-react';

// =====================================================
// TIPOS E CONSTANTES
// =====================================================

/** Habilidade passiva da trilha Graduado */
export interface GraduadoAbility {
  id: string;
  name: string;
  minNex: number;
  effect: string;
  icon: LucideIcon;
}

/** Habilidades da trilha Graduado (todas passivas) */
export const GRADUADO_ABILITIES: GraduadoAbility[] = [
  { 
    id: 'saber-ampliado',
    name: 'Saber Ampliado', 
    minNex: 10, 
    effect: '+1 ritual de cada círculo (não conta no limite)',
    icon: Sparkles,
  },
  { 
    id: 'grimorio-ritualistico',
    name: 'Grimório Ritualístico', 
    minNex: 40, 
    effect: 'Armazena rituais 1º/2º círculo = INT. Ação completa para conjurar.',
    icon: BookMarked,
  },
  { 
    id: 'rituais-eficientes',
    name: 'Rituais Eficientes', 
    minNex: 65, 
    effect: 'DT dos seus rituais +5',
    icon: Sparkles,
  },
  { 
    id: 'conhecendo-o-medo',
    name: 'Conhecendo o Medo', 
    minNex: 99, 
    effect: 'Aprende o ritual Conhecendo o Medo',
    icon: BookOpen,
  },
];

// =====================================================
// PROPS DO HOOK
// =====================================================

export interface UseGraduadoTrackProps {
  classTrack: string | null | undefined;
  nex: number;
  intellect?: number;
  /** Trilha de Versatilidade do personagem (se houver) */
  versatilityTrack?: {
    trackId: string;
    abilityId: string;
  } | null;
}

// =====================================================
// HOOK PRINCIPAL
// =====================================================

export function useGraduadoTrack({
  classTrack,
  nex,
  intellect = 1,
  versatilityTrack,
}: UseGraduadoTrackProps) {
  // Verifica se é trilha Graduado (principal)
  const isGraduadoBase = useMemo(() => {
    if (!classTrack) return false;
    return classTrack.toLowerCase().includes('graduado');
  }, [classTrack]);

  // Detecta se tem habilidade de Graduado via Versatilidade
  const hasGraduadoFromVersatility = versatilityTrack?.trackId === 'graduado';

  // É Graduado se for trilha principal ou via Versatilidade
  const isGraduado = isGraduadoBase || hasGraduadoFromVersatility;

  // Habilidades desbloqueadas pelo NEX
  const unlockedAbilities = useMemo(() => {
    return GRADUADO_ABILITIES.filter(a => nex >= a.minNex);
  }, [nex]);

  // Verifica se tem Grimório Ritualístico
  const hasGrimorio = nex >= 40;

  // Capacidade do Grimório (baseada em Intelecto)
  const grimorioCapacity = useMemo(() => {
    if (!hasGrimorio) return 0;
    return Math.max(1, intellect);
  }, [hasGrimorio, intellect]);

  // Verifica se tem Rituais Eficientes (+5 DT)
  const hasRituaisEficientes = nex >= 65;

  // Bônus de DT dos rituais
  const ritualDTBonus = hasRituaisEficientes ? 5 : 0;

  return {
    // Estado
    isGraduado,
    
    // Flags
    hasGrimorio,
    hasRituaisEficientes,
    
    // Dados
    unlockedAbilities,
    grimorioCapacity,
    ritualDTBonus,
  };
}
