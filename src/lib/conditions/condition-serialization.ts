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
import type { ConditionParams } from './condition-definitions';
import { resolveConditionId } from './condition-identity';

// ==================== TIPOS ====================

/** Formato de condição persistido no banco */
export interface PersistedCondition {
  id: string;
  name: string;
  turnsRemaining: number | null;
  addedAt: string; // ISO string para serialização
  dyingCounter?: number; // Para condição Morrendo (3, 2, 1, 0 = morte)
  params?: ConditionParams;
}

// ==================== FUNÇÕES ====================

/**
 * Converte condição persistida (banco) para ActiveCondition (runtime)
 * Suporta tanto o formato string legado quanto o objeto completo
 */
export function parseCondition(c: string | PersistedCondition | Partial<PersistedCondition>): ActiveCondition {
  if (typeof c === 'string') {
    return { 
      id: resolveConditionId(c),
      name: c, 
      turnsRemaining: null, 
      addedAt: new Date() 
    };
  }
  const originalId = typeof c.id === 'string' && c.id.trim() ? c.id : typeof c.name === 'string' && c.name.trim() ? c.name : 'condicao-sem-identificacao';
  const name = typeof c.name === 'string' && c.name.trim() ? c.name : originalId;
  const sourceDate = c.addedAt ?? '';
  const date = new Date(sourceDate);
  return {
    ...c,
    id: resolveConditionId(originalId),
    name,
    turnsRemaining: c.turnsRemaining ?? null,
    addedAt: Number.isNaN(date.getTime()) ? sourceDate : date,
    dyingCounter: c.dyingCounter, // Preserva contador de morrendo
    params: c.params,
  };
}

/**
 * Converte ActiveCondition (runtime) para PersistedCondition (banco)
 */
export function serializeCondition(c: ActiveCondition): PersistedCondition {
  return {
    ...c,
    id: c.id,
    name: c.name,
    turnsRemaining: c.turnsRemaining,
    addedAt: c.addedAt instanceof Date && !Number.isNaN(c.addedAt.getTime()) ? c.addedAt.toISOString() : String(c.addedAt),
    dyingCounter: c.dyingCounter, // Preserva contador de morrendo
    params: c.params,
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
