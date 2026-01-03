/**
 * Poderes Gerais - Ordem Paranormal RPG
 * 
 * ⚠️ CONTEÚDO NÃO OFICIAL - HOMEBREW ⚠️
 * Os poderes neste módulo NÃO fazem parte do livro base.
 * 
 * @module general-powers
 */

// Re-exporta tudo do arquivo de definições
export {
  // Tipos
  type GeneralPower,
  
  // Constantes
  GENERAL_POWERS,
  GENERAL_POWERS_ARE_HOMEBREW,
  
  // Funções
  getAvailableGeneralPowers,
  getGeneralPowersByCategory,
  getGeneralPowerById,
  getGeneralPowerCategories,
  getCategoryName,
} from './power-definitions';

// ==================== REGISTRY DE PODERES GERAIS ====================

import { GENERAL_POWERS, type GeneralPower } from './power-definitions';

/**
 * Registry de poderes gerais para acesso O(1)
 * Mapeia ID -> Poder
 */
export const GENERAL_POWER_REGISTRY: Map<string, GeneralPower> = new Map(
  GENERAL_POWERS.map(power => [power.id, power])
);

/**
 * Busca um poder geral no registry
 */
export function getPowerFromRegistry(id: string): GeneralPower | undefined {
  return GENERAL_POWER_REGISTRY.get(id);
}

/**
 * Retorna todos os IDs de poderes gerais
 */
export function getAllGeneralPowerIds(): string[] {
  return Array.from(GENERAL_POWER_REGISTRY.keys());
}

/**
 * Verifica se um ID de poder geral é válido
 */
export function isValidGeneralPowerId(id: string): boolean {
  return GENERAL_POWER_REGISTRY.has(id);
}

/**
 * Retorna poderes por NEX mínimo
 */
export function getPowersByMinNex(minNex: number): GeneralPower[] {
  return GENERAL_POWERS.filter(p => p.minNex === minNex);
}

/**
 * Retorna poderes que concedem rituais
 */
export function getRitualGrantingPowers(): GeneralPower[] {
  return GENERAL_POWERS.filter(p => p.grantsRitual);
}

/**
 * Retorna poderes com requisitos
 */
export function getPowersWithRequirements(): GeneralPower[] {
  return GENERAL_POWERS.filter(p => p.requirement);
}

/**
 * Agrupa poderes por categoria
 */
export function getPowersGroupedByCategory(): Record<GeneralPower['category'], GeneralPower[]> {
  return {
    combate: GENERAL_POWERS.filter(p => p.category === 'combate'),
    pericia: GENERAL_POWERS.filter(p => p.category === 'pericia'),
    paranormal: GENERAL_POWERS.filter(p => p.category === 'paranormal'),
    social: GENERAL_POWERS.filter(p => p.category === 'social'),
    sobrevivencia: GENERAL_POWERS.filter(p => p.category === 'sobrevivencia'),
  };
}
