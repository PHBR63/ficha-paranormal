/**
 * Registro e Utilitários de Rituais
 * Ordem Paranormal RPG v1.3
 */

import { UNIFIED_RITUALS } from './unified-rituals';
import type { UnifiedRitual, RitualEnhancement, RitualMechanics } from './types';

// Mapa para busca rápida
const RITUAL_BY_ID = new Map<string, UnifiedRitual>(
  UNIFIED_RITUALS.map(r => [r.id, r])
);

/**
 * Retorna todos os rituais
 */
export function getAllRituals(): UnifiedRitual[] {
  return UNIFIED_RITUALS;
}

/**
 * Busca um ritual pelo ID
 */
export function getRitualById(id: string): UnifiedRitual | undefined {
  return RITUAL_BY_ID.get(id);
}

/**
 * Retorna rituais por elemento
 */
export function getRitualsByElement(element: string): UnifiedRitual[] {
  const lowerElement = element.toLowerCase();
  return UNIFIED_RITUALS.filter(r => r.element.toLowerCase() === lowerElement);
}

/**
 * Retorna rituais por círculo
 */
export function getRitualsByCircle(circle: number): UnifiedRitual[] {
  return UNIFIED_RITUALS.filter(r => r.circle === circle);
}

/**
 * Retorna rituais até um círculo máximo
 */
export function getRitualsByMaxCircle(maxCircle: number): UnifiedRitual[] {
  return UNIFIED_RITUALS.filter(r => r.circle <= maxCircle);
}

/**
 * Determina o nível efetivo do ritual (Base, Discente, Verdadeiro)
 * baseado nos aprimoramentos selecionados
 */
export function getEffectiveLevel(selectedEnhancements: string[] = []): 'base' | 'discente' | 'verdadeiro' {
  if (selectedEnhancements.some(e => e.toLowerCase() === 'verdadeiro')) {
    return 'verdadeiro';
  }
  if (selectedEnhancements.some(e => e.toLowerCase() === 'discente')) {
    return 'discente';
  }
  return 'base';
}

/**
 * Retorna o efeito atual de um ritual baseado nos aprimoramentos ou nível
 * Aceita tanto o ritual/ID quanto selectedEnhancements ou level direto
 */
export function getRitualEffect(
  ritualOrId: UnifiedRitual | string, 
  selectedEnhancementsOrLevel: string[] | 'base' | 'discente' | 'verdadeiro' = []
): RitualMechanics | undefined {
  const ritual = typeof ritualOrId === 'string' 
    ? getRitualById(ritualOrId) 
    : ritualOrId;
  
  if (!ritual) return undefined;
  
  // Determina o nível
  const level = typeof selectedEnhancementsOrLevel === 'string'
    ? selectedEnhancementsOrLevel
    : getEffectiveLevel(selectedEnhancementsOrLevel);
  
  if (level === 'verdadeiro' && ritual.effects.verdadeiro) {
    return { ...ritual.effects.base, ...ritual.effects.verdadeiro };
  }
  if (level === 'discente' && ritual.effects.discente) {
    return { ...ritual.effects.base, ...ritual.effects.discente };
  }
  return ritual.effects.base;
}

/**
 * Calcula o custo total de PE do ritual
 * Aceita ritualId (string), ritual (UnifiedRitual), ou apenas os parâmetros básicos
 */
export function calculateRitualCost(
  ritualOrId: UnifiedRitual | string,
  selectedEnhancements: string[] = [],
  _isNonOccultist: boolean = false
): number {
  const ritual = typeof ritualOrId === 'string' 
    ? getRitualById(ritualOrId) 
    : ritualOrId;
  
  if (!ritual) return 0;
  
  let totalCost = ritual.cost;

  if (ritual.enhancements) {
    for (const enhancementName of selectedEnhancements) {
      const enhancement = ritual.enhancements.find(
        e => e.name.toLowerCase() === enhancementName.toLowerCase()
      );
      if (enhancement) {
        totalCost += enhancement.cost;
      }
    }
  }

  // Livro Base v1.3 p.119: o custo é igual para todas as classes.
  // O terceiro argumento legado permanece aceito para preservar consumidores existentes.

  return totalCost;
}

/**
 * Verifica se o personagem pode conjurar o ritual
 */
export function canCastRitual(
  ritualOrId: UnifiedRitual | string,
  characterCircle: number,
  currentPE: number,
  elementalAffinity?: string
): { canCast: boolean; reason?: string } {
  const ritual = typeof ritualOrId === 'string' 
    ? getRitualById(ritualOrId) 
    : ritualOrId;
  
  if (!ritual) {
    return { canCast: false, reason: 'Ritual não encontrado' };
  }
  
  if (ritual.circle > characterCircle) {
    return { canCast: false, reason: `Requer círculo ${ritual.circle}` };
  }
  if (ritual.cost > currentPE) {
    return { canCast: false, reason: `PE insuficiente (${currentPE}/${ritual.cost})` };
  }
  return { canCast: true };
}

/**
 * Verifica se o personagem pode usar um aprimoramento
 */
export function canUseEnhancement(
  ritualOrId: UnifiedRitual | string,
  enhancementName: string,
  characterCircle: number,
  elementalAffinity?: string
): { canUse: boolean; reason?: string } {
  const ritual = typeof ritualOrId === 'string' 
    ? getRitualById(ritualOrId) 
    : ritualOrId;
  
  if (!ritual) {
    return { canUse: false, reason: 'Ritual não encontrado' };
  }
  
  const enhancement = ritual.enhancements?.find(
    e => e.name.toLowerCase() === enhancementName.toLowerCase()
  );
  
  if (!enhancement) {
    return { canUse: true }; // Se não existe, permite (fallback)
  }
  
  if (enhancement.circleReq && enhancement.circleReq > characterCircle) {
    return { canUse: false, reason: `Requer círculo ${enhancement.circleReq}` };
  }
  
  if (enhancement.affinityReq) {
    if (!elementalAffinity) {
      return { canUse: false, reason: 'Requer afinidade elemental' };
    }
    // Verifica se a afinidade corresponde ao elemento do ritual
    if (elementalAffinity.toLowerCase() !== ritual.element.toLowerCase()) {
      return { canUse: false, reason: `Requer afinidade com ${ritual.element}` };
    }
  }
  
  return { canUse: true };
}

/**
 * Retorna os modos de um ritual (se houver)
 */
export function getRitualModes(ritualId: string): Array<{ name: string; description: string }> {
  const ritual = getRitualById(ritualId);
  if (!ritual) return [];
  return ritual.effects.base.modes ?? [];
}

/**
 * Retorna os hooks de um ritual (gatilhos de evento)
 */
export function getRitualHooks(ritualId: string): Array<{ trigger: string; effect: string }> {
  const ritual = getRitualById(ritualId);
  if (!ritual) return [];
  return ritual.effects.base.hooks ?? [];
}

/**
 * Pesquisa rituais por texto
 */
export function searchRituals(query: string): UnifiedRitual[] {
  const lowerQuery = query.toLowerCase();
  return UNIFIED_RITUALS.filter(r =>
    r.name.toLowerCase().includes(lowerQuery) ||
    r.description?.toLowerCase().includes(lowerQuery)
  );
}
