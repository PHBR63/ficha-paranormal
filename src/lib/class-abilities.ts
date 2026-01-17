/**
 * Ordem Paranormal RPG v1.3 - Class Abilities (Camada de Compatibilidade)
 * 
 * MIGRAÇÃO: Este arquivo agora serve como camada de compatibilidade legado.
 * Todos os dados vêm do sistema unificado em src/lib/class-powers/.
 * 
 * Componentes que usam este arquivo continuam funcionando sem alteração,
 * mas a fonte de verdade é agora o sistema unificado.
 * 
 * @deprecated Prefira usar imports de @/lib/class-powers diretamente
 */

import { getAbilityChoicesByNex } from './character-data';
import {
  getPowersByClass,
  getAvailablePowers,
  getCorePowers,
  getChoosablePowers,
  getNewPowersAtNex,
  ALL_CLASS_POWERS as UNIFIED_POWERS,
} from './class-powers/power-registry';
import type { UnifiedClassPower, ClassId } from './class-powers/types';

// ================== TIPO LEGADO ==================

/**
 * Interface legado para habilidades de classe
 * @deprecated Use UnifiedClassPower de @/lib/class-powers/types
 */
export interface ClassAbility {
  id: string;
  name: string;
  description: string;
  minNex: number;
  classId: string;
  isCore?: boolean;
  isRepeatable?: boolean;
}

// ================== CONVERSÃO UNIFICADO -> LEGADO ==================

/**
 * Converte um UnifiedClassPower para o formato ClassAbility legado
 * Mantém compatibilidade com código existente
 */
function toClassAbility(power: UnifiedClassPower): ClassAbility {
  return {
    id: power.id,
    name: power.name,
    description: power.description,
    minNex: power.minNex,
    classId: power.classId,
    isCore: power.isCore,
    isRepeatable: power.isRepeatable,
  };
}

/**
 * Converte array de poderes unificados para formato legado
 */
function toClassAbilities(powers: UnifiedClassPower[]): ClassAbility[] {
  return powers.map(toClassAbility);
}

// ================== ARRAYS LEGADO (derivados do sistema unificado) ==================

/**
 * Poderes do Combatente no formato legado
 * @deprecated Use getPowersByClass('Combatente') de @/lib/class-powers
 */
export const COMBATENTE_ABILITIES: ClassAbility[] = toClassAbilities(
  getPowersByClass('Combatente').filter(p => !p.trackId) // Exclui poderes de trilha
);

/**
 * Poderes do Especialista no formato legado
 * @deprecated Use getPowersByClass('Especialista') de @/lib/class-powers
 */
export const ESPECIALISTA_ABILITIES: ClassAbility[] = toClassAbilities(
  getPowersByClass('Especialista').filter(p => !p.trackId)
);

/**
 * Poderes do Ocultista no formato legado
 * @deprecated Use getPowersByClass('Ocultista') de @/lib/class-powers
 */
export const OCULTISTA_ABILITIES: ClassAbility[] = toClassAbilities(
  getPowersByClass('Ocultista').filter(p => !p.trackId)
);

/**
 * Todos os poderes de classe no formato legado
 * @deprecated Use ALL_CLASS_POWERS de @/lib/class-powers
 */
export const ALL_CLASS_ABILITIES: ClassAbility[] = toClassAbilities(
  UNIFIED_POWERS.filter(p => !p.trackId) // Exclui poderes de trilha para manter compatibilidade
);

// ================== FUNÇÕES LEGADO (delegam para sistema unificado) ==================

/**
 * Retorna as habilidades disponíveis para uma classe e NEX específico
 * @deprecated Use getAvailablePowers de @/lib/class-powers
 */
export function getAvailableAbilities(classId: string, nex: number): ClassAbility[] {
  const powers = getAvailablePowers(classId as ClassId, nex)
    .filter(p => !p.trackId);
  return toClassAbilities(powers);
}

/**
 * Retorna as habilidades core (automáticas) para uma classe e NEX
 * @deprecated Use getCorePowers de @/lib/class-powers
 */
export function getCoreAbilities(classId: string, nex: number): ClassAbility[] {
  const powers = getCorePowers(classId as ClassId)
    .filter(p => p.minNex <= nex && !p.trackId);
  return toClassAbilities(powers);
}

/**
 * Retorna as habilidades escolhíveis para uma classe e NEX
 * @deprecated Use getChoosablePowers de @/lib/class-powers
 */
export function getChoosableAbilities(classId: string, nex: number): ClassAbility[] {
  const powers = getChoosablePowers(classId as ClassId)
    .filter(p => p.minNex <= nex && !p.trackId);
  return toClassAbilities(powers);
}

/**
 * Calcula quantas habilidades o personagem pode escolher baseado no NEX
 * (Mantido: não tem equivalente direto no sistema unificado)
 */
export function getAbilityChoiceCount(nex: number): number {
  return getAbilityChoicesByNex(nex);
}

/**
 * Retorna habilidades organizadas por tier de NEX
 * @deprecated Use funções do power-registry para filtragem
 */
export function getAbilitiesByTier(classId: string): Record<number, ClassAbility[]> {
  const tiers: Record<number, ClassAbility[]> = {};
  const abilities = ALL_CLASS_ABILITIES.filter(a => a.classId === classId);
  
  for (const ability of abilities) {
    if (!tiers[ability.minNex]) {
      tiers[ability.minNex] = [];
    }
    tiers[ability.minNex].push(ability);
  }
  
  return tiers;
}

/**
 * Retorna as habilidades novas desbloqueadas em um NEX específico
 * @deprecated Use getNewPowersAtNex de @/lib/class-powers
 */
export function getNewAbilitiesAtNex(classId: string, nex: number): ClassAbility[] {
  const powers = getNewPowersAtNex(classId as ClassId, nex)
    .filter(p => !p.trackId);
  return toClassAbilities(powers);
}
