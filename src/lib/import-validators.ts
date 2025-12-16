/**
 * Validadores para importação de dados
 * Verifica campos obrigatórios e tipos de dados
 */

import type { CatalogWeapon } from './weapons-catalog';
import type { CatalogArmor } from './armor-catalog';
import type { CatalogItem } from './items-catalog';
import type { Ritual } from './rituals-data';

// Interface para resultado de validação
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// Interface para item validado
export interface ValidatedItem<T> {
  data: T;
  validation: ValidationResult;
  index: number;
}

/**
 * Valida uma arma do catálogo
 */
export function validateWeapon(data: unknown, index: number): ValidatedItem<CatalogWeapon> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const item = data as Record<string, unknown>;

  // Campos obrigatórios
  if (!item.id || typeof item.id !== 'string') {
    errors.push('Campo "id" é obrigatório e deve ser string');
  }
  if (!item.name || typeof item.name !== 'string') {
    errors.push('Campo "name" é obrigatório e deve ser string');
  }
  if (!item.category || !['0', 'I', 'II', 'III', 'IV'].includes(item.category as string)) {
    errors.push('Campo "category" é obrigatório (0, I, II, III ou IV)');
  }
  if (!item.type || !['melee', 'ranged', 'firearm'].includes(item.type as string)) {
    errors.push('Campo "type" é obrigatório (melee, ranged ou firearm)');
  }
  if (!item.damage || typeof item.damage !== 'string') {
    errors.push('Campo "damage" é obrigatório (ex: "1d8")');
  }
  if (!item.damageType || typeof item.damageType !== 'string') {
    errors.push('Campo "damageType" é obrigatório (Corte, Impacto, Perfuração ou Balístico)');
  }
  if (item.critical === undefined || typeof item.critical !== 'number') {
    errors.push('Campo "critical" é obrigatório (número, ex: 19)');
  }
  if (item.criticalMultiplier === undefined || typeof item.criticalMultiplier !== 'number') {
    errors.push('Campo "criticalMultiplier" é obrigatório (número, ex: 2)');
  }
  if (item.spaces === undefined || typeof item.spaces !== 'number') {
    errors.push('Campo "spaces" é obrigatório (número)');
  }
  if (!item.proficiency || typeof item.proficiency !== 'string') {
    errors.push('Campo "proficiency" é obrigatório (simples, tatica ou pesada)');
  }

  // Campos opcionais com validação
  if (item.range && typeof item.range !== 'string') {
    warnings.push('Campo "range" deve ser string se fornecido');
  }
  if (item.properties && !Array.isArray(item.properties)) {
    warnings.push('Campo "properties" deve ser array se fornecido');
  }

  return {
    data: data as CatalogWeapon,
    validation: { valid: errors.length === 0, errors, warnings },
    index
  };
}

/**
 * Valida uma armadura do catálogo
 */
export function validateArmor(data: unknown, index: number): ValidatedItem<CatalogArmor> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const item = data as Record<string, unknown>;

  // Campos obrigatórios
  if (!item.id || typeof item.id !== 'string') {
    errors.push('Campo "id" é obrigatório e deve ser string');
  }
  if (!item.name || typeof item.name !== 'string') {
    errors.push('Campo "name" é obrigatório e deve ser string');
  }
  if (!item.category || !['0', 'I', 'II', 'III', 'IV'].includes(item.category as string)) {
    errors.push('Campo "category" é obrigatório (0, I, II, III ou IV)');
  }
  if (item.defenseBonus === undefined || typeof item.defenseBonus !== 'number') {
    errors.push('Campo "defenseBonus" é obrigatório (número)');
  }
  if (item.spaces === undefined || typeof item.spaces !== 'number') {
    errors.push('Campo "spaces" é obrigatório (número)');
  }

  // Campos opcionais com validação
  if (item.damageReduction !== undefined && typeof item.damageReduction !== 'number') {
    warnings.push('Campo "damageReduction" deve ser número se fornecido');
  }
  if (item.skillPenalty !== undefined && typeof item.skillPenalty !== 'number') {
    warnings.push('Campo "skillPenalty" deve ser número se fornecido');
  }

  return {
    data: data as CatalogArmor,
    validation: { valid: errors.length === 0, errors, warnings },
    index
  };
}

/**
 * Valida um item do catálogo
 */
export function validateItem(data: unknown, index: number): ValidatedItem<CatalogItem> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const item = data as Record<string, unknown>;

  // Campos obrigatórios
  if (!item.id || typeof item.id !== 'string') {
    errors.push('Campo "id" é obrigatório e deve ser string');
  }
  if (!item.name || typeof item.name !== 'string') {
    errors.push('Campo "name" é obrigatório e deve ser string');
  }
  if (!item.type || typeof item.type !== 'string') {
    errors.push('Campo "type" é obrigatório (operacional, vestuario, etc.)');
  }
  if (!item.category || !['0', 'I', 'II', 'III', 'IV'].includes(item.category as string)) {
    errors.push('Campo "category" é obrigatório (0, I, II, III ou IV)');
  }
  if (item.spaces === undefined || typeof item.spaces !== 'number') {
    errors.push('Campo "spaces" é obrigatório (número)');
  }

  // Campos opcionais com validação
  if (item.consumable !== undefined && typeof item.consumable !== 'boolean') {
    warnings.push('Campo "consumable" deve ser boolean se fornecido');
  }

  return {
    data: data as CatalogItem,
    validation: { valid: errors.length === 0, errors, warnings },
    index
  };
}

/**
 * Valida um ritual
 */
export function validateRitual(data: unknown, index: number): ValidatedItem<Ritual> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const item = data as Record<string, unknown>;

  // Campos obrigatórios
  if (!item.id || typeof item.id !== 'string') {
    errors.push('Campo "id" é obrigatório e deve ser string');
  }
  if (!item.name || typeof item.name !== 'string') {
    errors.push('Campo "name" é obrigatório e deve ser string');
  }
  if (item.circle === undefined || typeof item.circle !== 'number' || item.circle < 1 || item.circle > 4) {
    errors.push('Campo "circle" é obrigatório (1-4)');
  }
  if (!item.element || typeof item.element !== 'string') {
    errors.push('Campo "element" é obrigatório (sangue, conhecimento, energia, medo, morte)');
  }
  if (!item.execution || typeof item.execution !== 'string') {
    errors.push('Campo "execution" é obrigatório (Padrão, Completa, Livre, Reação)');
  }
  if (!item.range || typeof item.range !== 'string') {
    errors.push('Campo "range" é obrigatório');
  }
  if (!item.duration || typeof item.duration !== 'string') {
    errors.push('Campo "duration" é obrigatório');
  }
  if (!item.description || typeof item.description !== 'string') {
    errors.push('Campo "description" é obrigatório');
  }
  if (item.cost === undefined || typeof item.cost !== 'number') {
    errors.push('Campo "cost" é obrigatório (custo em PE)');
  }

  // Campos opcionais com validação
  if (item.enhancements && !Array.isArray(item.enhancements)) {
    warnings.push('Campo "enhancements" deve ser array se fornecido');
  }
  if (item.resistance && typeof item.resistance !== 'string') {
    warnings.push('Campo "resistance" deve ser string se fornecido');
  }

  return {
    data: data as Ritual,
    validation: { valid: errors.length === 0, errors, warnings },
    index
  };
}

/**
 * Valida um array de dados
 */
export function validateBatch<T>(
  data: unknown[],
  validator: (item: unknown, index: number) => ValidatedItem<T>
): ValidatedItem<T>[] {
  return data.map((item, index) => validator(item, index));
}

/**
 * Tenta fazer parse de JSON com tratamento de erro
 */
export function parseJsonSafe(jsonString: string): { success: boolean; data?: unknown; error?: string } {
  try {
    const data = JSON.parse(jsonString);
    return { success: true, data };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro ao fazer parse do JSON' 
    };
  }
}

/**
 * Normaliza dados para array (aceita objeto único ou array)
 */
export function normalizeToArray(data: unknown): unknown[] {
  if (Array.isArray(data)) {
    return data;
  }
  return [data];
}
