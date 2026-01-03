/**
 * Poderes Paranormais - Ordem Paranormal RPG
 * 
 * Módulo consolidado para poderes paranormais.
 * Baseado nas páginas 114-116 do livro oficial.
 * 
 * @module paranormal-powers
 */

// Re-exporta tudo do arquivo de definições
export {
  // Tipos
  type ParanormalElement,
  type PowerPrerequisite,
  type PowerEffect,
  type PowerChoiceType,
  type ParanormalPower,
  type SavedParanormalPower,
  
  // Constantes de elementos (UI)
  ELEMENT_LABELS,
  ELEMENT_COLORS,
  ELEMENT_BG_COLORS,
  AFFINITY_DESCRIPTIONS,
  
  // Catálogo de poderes
  PARANORMAL_POWERS,
  
  // Funções
  getPowersByElement,
  getPowerById,
  getElementPowerCount,
  canChoosePower,
  getPowerEffect,
  calculatePowerModifiers,
  hasRerollOne,
  getRerollRange,
  getActivePowerEffects,
} from './power-definitions';

// ==================== REGISTRY DE PODERES PARANORMAIS ====================

import { PARANORMAL_POWERS, type ParanormalPower, type ParanormalElement } from './power-definitions';

/**
 * Registry de poderes paranormais para acesso O(1)
 * Mapeia ID -> Poder
 */
export const PARANORMAL_POWER_REGISTRY: Map<string, ParanormalPower> = new Map(
  PARANORMAL_POWERS.map(power => [power.id, power])
);

/**
 * Busca um poder paranormal no registry
 */
export function getPowerFromRegistry(id: string): ParanormalPower | undefined {
  return PARANORMAL_POWER_REGISTRY.get(id);
}

/**
 * Retorna todos os IDs de poderes paranormais
 */
export function getAllParanormalPowerIds(): string[] {
  return Array.from(PARANORMAL_POWER_REGISTRY.keys());
}

/**
 * Verifica se um ID de poder paranormal é válido
 */
export function isValidParanormalPowerId(id: string): boolean {
  return PARANORMAL_POWER_REGISTRY.has(id);
}

/**
 * Retorna poderes por elemento
 */
export function getPowersByElementFromRegistry(element: ParanormalElement | 'generic'): ParanormalPower[] {
  return PARANORMAL_POWERS.filter(p => p.element === element);
}

/**
 * Retorna poderes genéricos (podem ser escolhidos múltiplas vezes)
 */
export function getGenericPowers(): ParanormalPower[] {
  return PARANORMAL_POWERS.filter(p => p.isGeneric);
}

/**
 * Retorna poderes que requerem escolha do jogador
 */
export function getPowersRequiringChoice(): ParanormalPower[] {
  return PARANORMAL_POWERS.filter(p => p.requiresChoice);
}

/**
 * Retorna poderes que têm pré-requisito
 */
export function getPowersWithPrerequisites(): ParanormalPower[] {
  return PARANORMAL_POWERS.filter(p => p.prerequisite);
}

/**
 * Retorna poderes disponíveis para um elemento e contagem atual
 */
export function getAvailablePowersForElement(
  element: ParanormalElement,
  currentPowerIds: string[]
): ParanormalPower[] {
  return PARANORMAL_POWERS.filter(power => {
    // Poderes de outros elementos não são relevantes
    if (power.element !== element && power.element !== 'generic') return false;
    
    // Se já tem o poder (e não é genérico), não pode escolher
    if (!power.isGeneric && currentPowerIds.includes(power.id)) return false;
    
    // Verificar pré-requisitos
    if (power.prerequisite?.element && power.prerequisite?.count) {
      const elementCount = currentPowerIds.filter(id => {
        const p = PARANORMAL_POWER_REGISTRY.get(id);
        return p?.element === power.prerequisite!.element;
      }).length;
      
      if (elementCount < power.prerequisite.count) return false;
    }
    
    return true;
  });
}
