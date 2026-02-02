/**
 * Serialização de Condições
 * 
 * Helpers para converter entre formatos de condições:
 * - PersistedCondition: formato salvo no banco (string ISO para datas)
 * - ActiveCondition: formato usado em runtime (Date objects)
 * 
 * @module conditions/condition-serialization
 */

import type { ActiveCondition } from '@/components/character/ConditionManager';

// ==================== TIPOS ====================

/** Formato de condição persistido no banco */
export interface PersistedCondition {
  id: string;
  name: string;
  turnsRemaining: number | null;
  addedAt: string; // ISO string para serialização
  dyingCounter?: number; // Para condição Morrendo (3, 2, 1, 0 = morte)
}

// ==================== FUNÇÕES ====================

/**
 * Converte condição persistida (banco) para ActiveCondition (runtime)
 * Suporta tanto o formato string legado quanto o objeto completo
 */
export function parseCondition(c: string | PersistedCondition): ActiveCondition {
  if (typeof c === 'string') {
    return { 
      id: c.toLowerCase().replace(/\s+/g, ''), 
      name: c, 
      turnsRemaining: null, 
      addedAt: new Date() 
    };
  }
  return {
    id: c.id,
    name: c.name,
    turnsRemaining: c.turnsRemaining,
    addedAt: new Date(c.addedAt), // Converte string ISO para Date
    dyingCounter: c.dyingCounter, // Preserva contador de morrendo
  };
}

/**
 * Converte ActiveCondition (runtime) para PersistedCondition (banco)
 */
export function serializeCondition(c: ActiveCondition): PersistedCondition {
  return {
    id: c.id,
    name: c.name,
    turnsRemaining: c.turnsRemaining,
    addedAt: c.addedAt instanceof Date ? c.addedAt.toISOString() : c.addedAt as string,
    dyingCounter: c.dyingCounter, // Preserva contador de morrendo
  };
}

/**
 * Extrai nomes de condições (para compatibilidade com MobileCharacterSheet)
 */
export function getConditionNames(conditions: (string | PersistedCondition)[]): string[] {
  return conditions.map(c => typeof c === 'string' ? c : c.name);
}

/**
 * Parseia um array de condições persistidas para ActiveCondition[]
 */
export function parseConditions(conditions: (string | PersistedCondition)[]): ActiveCondition[] {
  return conditions.map(parseCondition);
}

/**
 * Serializa um array de ActiveCondition para PersistedCondition[]
 */
export function serializeConditions(conditions: ActiveCondition[]): PersistedCondition[] {
  return conditions.map(serializeCondition);
}
