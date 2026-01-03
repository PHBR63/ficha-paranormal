/**
 * Origens - Ordem Paranormal RPG
 * 
 * Módulo consolidado para todas as origens do sistema.
 * Inclui origens do livro base e suplementos.
 * 
 * @module origins
 */

// Re-exporta tipos e funções do arquivo de suplementos
export {
  type SupplementOrigin,
  SUPPLEMENT_ORIGINS,
  getAllSupplementOrigins,
  getSupplementOriginById,
} from './supplement-origins';

// ==================== REGISTRY DE ORIGENS ====================

import { SUPPLEMENT_ORIGINS, type SupplementOrigin } from './supplement-origins';

/**
 * Registry unificado de todas as origens (base + suplementos)
 * Mapeia ID -> Origem para acesso O(1)
 */
export const ORIGIN_REGISTRY: Map<string, SupplementOrigin> = new Map(
  SUPPLEMENT_ORIGINS.map(origin => [origin.id, origin])
);

/**
 * Busca uma origem pelo ID no registry
 */
export function getOriginFromRegistry(id: string): SupplementOrigin | undefined {
  return ORIGIN_REGISTRY.get(id);
}

/**
 * Retorna todos os IDs de origens disponíveis
 */
export function getAllOriginIds(): string[] {
  return Array.from(ORIGIN_REGISTRY.keys());
}

/**
 * Verifica se um ID de origem é válido
 */
export function isValidOriginId(id: string): boolean {
  return ORIGIN_REGISTRY.has(id);
}

/**
 * Retorna origens filtradas por fonte
 */
export function getOriginsBySource(source: string): SupplementOrigin[] {
  return SUPPLEMENT_ORIGINS.filter(origin => origin.source === source);
}

/**
 * Retorna todas as fontes únicas de origens
 */
export function getOriginSources(): string[] {
  const sources = new Set(SUPPLEMENT_ORIGINS.map(o => o.source).filter(Boolean));
  return Array.from(sources) as string[];
}
