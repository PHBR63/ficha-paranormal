/**
 * Ordem Paranormal RPG - Registro de Rituais
 * API de consulta para o sistema unificado de rituais
 */

import type { 
  UnifiedRitual, 
  RitualElement, 
  RitualCircle,
  RitualMechanics,
  RitualMode,
  RitualHook,
} from './types';
import { 
  UNIFIED_RITUALS, 
  RITUAL_BY_ID, 
  RITUALS_BY_CIRCLE, 
  RITUALS_BY_ELEMENT 
} from './unified-rituals';

// ========================================
// FUNÇÕES DE BUSCA
// ========================================

/** Busca ritual por ID */
export function getRitualById(id: string): UnifiedRitual | undefined {
  return RITUAL_BY_ID.get(id);
}

/** Retorna todos os rituais de um círculo específico */
export function getRitualsByCircle(circle: RitualCircle): UnifiedRitual[] {
  return RITUALS_BY_CIRCLE.get(circle) || [];
}

/** Retorna todos os rituais de um elemento específico */
export function getRitualsByElement(element: RitualElement): UnifiedRitual[] {
  return RITUALS_BY_ELEMENT.get(element) || [];
}

/** Retorna rituais até o círculo máximo (baseado em NEX) */
export function getRitualsByMaxCircle(maxCircle: number): UnifiedRitual[] {
  return UNIFIED_RITUALS.filter(r => r.circle <= maxCircle);
}

/** Busca rituais por nome (parcial, case-insensitive) */
export function searchRituals(query: string): UnifiedRitual[] {
  const lowerQuery = query.toLowerCase();
  return UNIFIED_RITUALS.filter(r => 
    r.name.toLowerCase().includes(lowerQuery) ||
    r.description.toLowerCase().includes(lowerQuery)
  );
}

/** Retorna todos os rituais */
export function getAllRituals(): UnifiedRitual[] {
  return [...UNIFIED_RITUALS];
}

// ========================================
// FUNÇÕES DE EFEITOS
// ========================================

/** Retorna os efeitos mecânicos de um ritual em um nível específico */
export function getRitualEffect(
  id: string, 
  level: 'base' | 'discente' | 'verdadeiro'
): RitualMechanics | undefined {
  const ritual = getRitualById(id);
  if (!ritual) return undefined;
  
  if (level === 'base') return ritual.effects.base;
  if (level === 'discente') return ritual.effects.discente;
  if (level === 'verdadeiro') return ritual.effects.verdadeiro;
  
  return undefined;
}

/** Retorna os modos disponíveis de um ritual */
export function getRitualModes(id: string): RitualMode[] {
  const ritual = getRitualById(id);
  if (!ritual) return [];
  
  // Modos podem estar no efeito base
  return ritual.effects.base.modes || [];
}

/** Retorna os hooks de um ritual */
export function getRitualHooks(id: string): RitualHook[] {
  const ritual = getRitualById(id);
  if (!ritual) return [];
  
  return ritual.effects.base.hooks || [];
}

// ========================================
// FUNÇÕES DE VALIDAÇÃO
// ========================================

/** Verifica se um personagem pode conjurar um ritual */
export function canCastRitual(
  ritualId: string,
  characterCircle: number,
  characterPE: number,
  characterAffinity?: string
): { canCast: boolean; reason?: string } {
  const ritual = getRitualById(ritualId);
  if (!ritual) {
    return { canCast: false, reason: 'Ritual não encontrado' };
  }
  
  if (ritual.circle > characterCircle) {
    return { canCast: false, reason: `Requer ${ritual.circle}º círculo` };
  }
  
  if (characterPE < ritual.cost) {
    return { canCast: false, reason: `PE insuficiente (${ritual.cost} PE necessário)` };
  }
  
  return { canCast: true };
}

/** Verifica se um aprimoramento pode ser usado */
export function canUseEnhancement(
  ritualId: string,
  enhancementName: 'Discente' | 'Verdadeiro',
  characterCircle: number,
  characterAffinity?: string
): { canUse: boolean; reason?: string } {
  const ritual = getRitualById(ritualId);
  if (!ritual || !ritual.enhancements) {
    return { canUse: false, reason: 'Aprimoramento não disponível' };
  }
  
  const enhancement = ritual.enhancements.find(e => e.name === enhancementName);
  if (!enhancement) {
    return { canUse: false, reason: 'Aprimoramento não encontrado' };
  }
  
  if (enhancement.circleReq && characterCircle < enhancement.circleReq) {
    return { canUse: false, reason: `Requer ${enhancement.circleReq}º círculo` };
  }
  
  if (enhancement.affinityReq) {
    const hasAffinity = characterAffinity?.toLowerCase() === ritual.element.toLowerCase();
    if (!hasAffinity) {
      return { canUse: false, reason: `Requer afinidade com ${ritual.element}` };
    }
  }
  
  return { canUse: true };
}

// ========================================
// FUNÇÕES UTILITÁRIAS
// ========================================

/** Calcula o custo total de PE de um ritual com aprimoramentos */
export function calculateRitualCost(
  ritualId: string,
  selectedEnhancements: string[],
  isNonOccultist: boolean = false
): number {
  const ritual = getRitualById(ritualId);
  if (!ritual) return 0;
  
  let totalCost = ritual.cost;
  
  for (const enhName of selectedEnhancements) {
    const enh = ritual.enhancements?.find(e => e.name === enhName);
    if (enh) totalCost += enh.cost;
  }
  
  // Não-ocultistas pagam o dobro
  if (isNonOccultist) totalCost *= 2;
  
  return totalCost;
}

/** Retorna o nível efetivo baseado nos aprimoramentos selecionados */
export function getEffectiveLevel(
  selectedEnhancements: string[]
): 'base' | 'discente' | 'verdadeiro' {
  if (selectedEnhancements.includes('Verdadeiro')) return 'verdadeiro';
  if (selectedEnhancements.includes('Discente')) return 'discente';
  return 'base';
}
