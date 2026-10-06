import { getNexLevel } from '@/lib/rules/nex-progression';
/**
 * Helpers de estatísticas base de classe
 * Ordem Paranormal RPG v1.3
 */

import type { ClassId } from '../types';

// =====================================================
// ESTATÍSTICAS BASE DAS CLASSES
// =====================================================

interface ClassBaseStats {
  pvBase: number;
  pvPerNex: number;
  peBase: number;
  pePerNex: number;
  sanBase: number;
  sanPerNex: number;
}

const CLASS_STATS: Record<ClassId, ClassBaseStats> = {
  Combatente: {
    pvBase: 20,
    pvPerNex: 4,
    peBase: 2,
    pePerNex: 2,
    sanBase: 12,
    sanPerNex: 3,
  },
  Especialista: {
    pvBase: 16,
    pvPerNex: 3,
    peBase: 3,
    pePerNex: 3,
    sanBase: 16,
    sanPerNex: 4,
  },
  Ocultista: {
    pvBase: 12,
    pvPerNex: 2,
    peBase: 4,
    pePerNex: 4,
    sanBase: 20,
    sanPerNex: 5,
  },
};

/**
 * Retorna as estatísticas base de uma classe
 */
export function getClassBaseStats(classId: ClassId, nex: number): ClassBaseStats {
  return CLASS_STATS[classId] || CLASS_STATS.Combatente;
}

/**
 * Calcula HP base (sem bônus) para uma classe e NEX
 */
export function calculateBaseHP(classId: ClassId, nex: number, vigor: number): number {
  const stats = getClassBaseStats(classId, nex);
  const nexMultiplier = getNexLevel(nex) - 1;
  return stats.pvBase + vigor + ((stats.pvPerNex + vigor) * Math.max(0, nexMultiplier));
}

/**
 * Calcula PE base (sem bônus) para uma classe e NEX
 */
export function calculateBasePE(classId: ClassId, nex: number, presence: number): number {
  const stats = getClassBaseStats(classId, nex);
  const nexMultiplier = getNexLevel(nex) - 1;
  return stats.peBase + presence + ((stats.pePerNex + presence) * Math.max(0, nexMultiplier));
}

/**
 * Calcula SAN base (sem bônus) para uma classe e NEX
 */
export function calculateBaseSAN(classId: ClassId, nex: number): number {
  const stats = getClassBaseStats(classId, nex);
  const nexMultiplier = getNexLevel(nex) - 1;
  return stats.sanBase + (stats.sanPerNex * Math.max(0, nexMultiplier));
}
