/**
 * Validadores para importação de dados
 * Verifica campos obrigatórios, tipos de dados e duplicatas
 * Atualizado para usar o sistema unificado de rituais
 */

import type { CatalogWeapon, ALL_WEAPONS } from './weapons-catalog';
import type { CatalogArmor, ALL_ARMORS } from './armor-catalog';
import type { CatalogItem, ALL_ITEMS } from './items-catalog';
import type { UnifiedRitual, RitualElement, RitualCircle, ExecutionType, RangeType, DurationType, RitualKind } from './rituals/types';
import { getAllRituals } from './rituals/ritual-registry';

// Re-export dos catálogos para uso na verificação de duplicatas
export { ALL_WEAPONS } from './weapons-catalog';
export { ALL_ARMORS } from './armor-catalog';
export { ALL_ITEMS } from './items-catalog';

// Export de rituais unificados para verificação de duplicatas
export const ALL_RITUALS = getAllRituals();

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

// Interface para contexto de validação com duplicatas
export interface ValidationContext {
  existingIds: Set<string>;
  existingNames: Set<string>;
  seenIdsInBatch: Set<string>;
  seenNamesInBatch: Set<string>;
}

/**
 * Cria contexto de validação com dados existentes do sistema
 */
export function createValidationContext(
  existingItems: Array<{ id: string; name: string }>
): ValidationContext {
  return {
    existingIds: new Set(existingItems.map(i => i.id.toLowerCase())),
    existingNames: new Set(existingItems.map(i => i.name.toLowerCase())),
    seenIdsInBatch: new Set(),
    seenNamesInBatch: new Set()
  };
}

/**
 * Verifica duplicatas de um item
 */
function checkDuplicates(
  id: string | undefined,
  name: string | undefined,
  context: ValidationContext
): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (id) {
    const lowerId = id.toLowerCase();
    // Duplicata no próprio JSON
    if (context.seenIdsInBatch.has(lowerId)) {
      errors.push(`ID "${id}" duplicado no JSON (já apareceu anteriormente)`);
    }
    // Duplicata no sistema
    if (context.existingIds.has(lowerId)) {
      warnings.push(`ID "${id}" já existe no sistema (será sobrescrito)`);
    }
    context.seenIdsInBatch.add(lowerId);
  }

  if (name) {
    const lowerName = name.toLowerCase();
    // Duplicata no próprio JSON
    if (context.seenNamesInBatch.has(lowerName)) {
      warnings.push(`Nome "${name}" duplicado no JSON`);
    }
    // Duplicata no sistema
    if (context.existingNames.has(lowerName)) {
      warnings.push(`Nome "${name}" já existe no sistema`);
    }
    context.seenNamesInBatch.add(lowerName);
  }

  return { errors, warnings };
}

/**
 * Valida uma arma do catálogo
 */
export function validateWeapon(
  data: unknown, 
  index: number, 
  context?: ValidationContext
): ValidatedItem<CatalogWeapon> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const item = data as Record<string, unknown>;

  // Verificar duplicatas
  if (context) {
    const duplicateCheck = checkDuplicates(
      item.id as string | undefined,
      item.name as string | undefined,
      context
    );
    errors.push(...duplicateCheck.errors);
    warnings.push(...duplicateCheck.warnings);
  }

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
export function validateArmor(
  data: unknown, 
  index: number,
  context?: ValidationContext
): ValidatedItem<CatalogArmor> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const item = data as Record<string, unknown>;

  // Verificar duplicatas
  if (context) {
    const duplicateCheck = checkDuplicates(
      item.id as string | undefined,
      item.name as string | undefined,
      context
    );
    errors.push(...duplicateCheck.errors);
    warnings.push(...duplicateCheck.warnings);
  }

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
export function validateItem(
  data: unknown, 
  index: number,
  context?: ValidationContext
): ValidatedItem<CatalogItem> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const item = data as Record<string, unknown>;

  // Verificar duplicatas
  if (context) {
    const duplicateCheck = checkDuplicates(
      item.id as string | undefined,
      item.name as string | undefined,
      context
    );
    errors.push(...duplicateCheck.errors);
    warnings.push(...duplicateCheck.warnings);
  }

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

// Valores válidos para o novo sistema unificado
const VALID_ELEMENTS: RitualElement[] = ['sangue', 'morte', 'conhecimento', 'energia', 'medo'];
const VALID_CIRCLES: RitualCircle[] = [1, 2, 3, 4];
const VALID_EXECUTIONS: ExecutionType[] = ['Padrão', 'Completa', 'Reação', 'Livre', 'Ritual'];
const VALID_RANGES: RangeType[] = ['Pessoal', 'Toque', 'Curto', 'Médio', 'Longo', 'Ilimitado', 'Especial'];
const VALID_DURATIONS: DurationType[] = ['Instantânea', 'Cena', 'Sustentada', 'Permanente', 'Especial', '1 dia', '1 semana'];
const VALID_KINDS: RitualKind[] = ['damage', 'buff', 'debuff', 'healing', 'stateOverride', 'narrativeOverride', 'sense', 'interceptor', 'summon', 'control', 'transformation', 'utility'];

/**
 * Valida um ritual no formato UnifiedRitual
 */
export function validateRitual(
  data: unknown, 
  index: number,
  context?: ValidationContext
): ValidatedItem<UnifiedRitual> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const item = data as Record<string, unknown>;

  // Verificar duplicatas
  if (context) {
    const duplicateCheck = checkDuplicates(
      item.id as string | undefined,
      item.name as string | undefined,
      context
    );
    errors.push(...duplicateCheck.errors);
    warnings.push(...duplicateCheck.warnings);
  }

  // === CAMPOS OBRIGATÓRIOS DE IDENTIDADE ===
  if (!item.id || typeof item.id !== 'string') {
    errors.push('Campo "id" é obrigatório e deve ser string');
  }
  if (!item.name || typeof item.name !== 'string') {
    errors.push('Campo "name" é obrigatório e deve ser string');
  }
  
  // Validar círculo (1-4)
  if (item.circle === undefined || typeof item.circle !== 'number') {
    errors.push('Campo "circle" é obrigatório e deve ser número');
  } else if (!VALID_CIRCLES.includes(item.circle as RitualCircle)) {
    errors.push(`Campo "circle" deve ser 1, 2, 3 ou 4 (recebido: ${item.circle})`);
  }
  
  // Validar elemento
  if (!item.element || typeof item.element !== 'string') {
    errors.push('Campo "element" é obrigatório');
  } else if (!VALID_ELEMENTS.includes(item.element as RitualElement)) {
    errors.push(`Campo "element" inválido: "${item.element}". Valores válidos: ${VALID_ELEMENTS.join(', ')}`);
  }

  // === METADADOS DO LIVRO ===
  if (!item.execution || typeof item.execution !== 'string') {
    errors.push('Campo "execution" é obrigatório');
  } else if (!VALID_EXECUTIONS.includes(item.execution as ExecutionType)) {
    warnings.push(`Campo "execution" não reconhecido: "${item.execution}". Valores recomendados: ${VALID_EXECUTIONS.join(', ')}`);
  }
  
  if (!item.range || typeof item.range !== 'string') {
    errors.push('Campo "range" é obrigatório');
  } else if (!VALID_RANGES.includes(item.range as RangeType)) {
    warnings.push(`Campo "range" não reconhecido: "${item.range}". Valores recomendados: ${VALID_RANGES.join(', ')}`);
  }
  
  if (!item.duration || typeof item.duration !== 'string') {
    errors.push('Campo "duration" é obrigatório');
  } else if (!VALID_DURATIONS.includes(item.duration as DurationType)) {
    warnings.push(`Campo "duration" não reconhecido: "${item.duration}". Valores recomendados: ${VALID_DURATIONS.join(', ')}`);
  }
  
  if (!item.description || typeof item.description !== 'string') {
    errors.push('Campo "description" é obrigatório');
  }
  
  if (item.cost === undefined || typeof item.cost !== 'number') {
    errors.push('Campo "cost" é obrigatório (custo em PE)');
  } else if (item.cost < 0) {
    errors.push('Campo "cost" não pode ser negativo');
  }

  // === ESTRUTURA DE EFFECTS ===
  if (!item.effects || typeof item.effects !== 'object') {
    errors.push('Campo "effects" é obrigatório e deve conter efeitos mecânicos');
  } else {
    const effects = item.effects as Record<string, unknown>;
    
    // Validar effects.base (obrigatório)
    if (!effects.base || typeof effects.base !== 'object') {
      errors.push('Campo "effects.base" é obrigatório');
    } else {
      const baseEffect = effects.base as Record<string, unknown>;
      
      // Validar kind (obrigatório no base)
      if (!baseEffect.kind || typeof baseEffect.kind !== 'string') {
        errors.push('Campo "effects.base.kind" é obrigatório');
      } else if (!VALID_KINDS.includes(baseEffect.kind as RitualKind)) {
        errors.push(`Campo "effects.base.kind" inválido: "${baseEffect.kind}". Valores válidos: ${VALID_KINDS.join(', ')}`);
      }
      
      // Validar summary (obrigatório no base)
      if (!baseEffect.summary || typeof baseEffect.summary !== 'string') {
        errors.push('Campo "effects.base.summary" é obrigatório (resumo do efeito)');
      }
      
      // Validar damage se presente
      if (baseEffect.damage) {
        validateDamageFormula(baseEffect.damage as Record<string, unknown>, 'effects.base.damage', errors, warnings);
      }
      
      // Validar healing se presente
      if (baseEffect.healing) {
        validateHealingFormula(baseEffect.healing as Record<string, unknown>, 'effects.base.healing', errors, warnings);
      }
    }
    
    // Validar effects.discente (opcional)
    if (effects.discente) {
      if (typeof effects.discente !== 'object') {
        warnings.push('Campo "effects.discente" deve ser objeto se fornecido');
      } else {
        const discenteEffect = effects.discente as Record<string, unknown>;
        if (!discenteEffect.summary) {
          warnings.push('Campo "effects.discente.summary" recomendado para descrever o aprimoramento');
        }
      }
    }
    
    // Validar effects.verdadeiro (opcional)
    if (effects.verdadeiro) {
      if (typeof effects.verdadeiro !== 'object') {
        warnings.push('Campo "effects.verdadeiro" deve ser objeto se fornecido');
      } else {
        const verdadeiroEffect = effects.verdadeiro as Record<string, unknown>;
        if (!verdadeiroEffect.summary) {
          warnings.push('Campo "effects.verdadeiro.summary" recomendado para descrever o aprimoramento');
        }
      }
    }
  }

  // === CAMPOS OPCIONAIS COM VALIDAÇÃO ===
  if (item.enhancements && !Array.isArray(item.enhancements)) {
    warnings.push('Campo "enhancements" deve ser array se fornecido');
  } else if (Array.isArray(item.enhancements)) {
    (item.enhancements as unknown[]).forEach((enh, i) => {
      const enhancement = enh as Record<string, unknown>;
      if (!enhancement.name || (enhancement.name !== 'Discente' && enhancement.name !== 'Verdadeiro')) {
        warnings.push(`Campo "enhancements[${i}].name" deve ser "Discente" ou "Verdadeiro"`);
      }
      if (enhancement.cost === undefined || typeof enhancement.cost !== 'number') {
        warnings.push(`Campo "enhancements[${i}].cost" deve ser número`);
      }
      if (!enhancement.description || typeof enhancement.description !== 'string') {
        warnings.push(`Campo "enhancements[${i}].description" deve ser string`);
      }
    });
  }
  
  // Validar resistance se presente
  if (item.resistance) {
    if (typeof item.resistance !== 'object') {
      warnings.push('Campo "resistance" deve ser objeto com type e effect');
    } else {
      const res = item.resistance as Record<string, unknown>;
      if (!res.type || !['fortitude', 'reflexos', 'vontade'].includes(res.type as string)) {
        warnings.push('Campo "resistance.type" deve ser fortitude, reflexos ou vontade');
      }
      if (!res.effect || !['anula', 'parcial', 'reduz_metade'].includes(res.effect as string)) {
        warnings.push('Campo "resistance.effect" deve ser anula, parcial ou reduz_metade');
      }
    }
  }

  return {
    data: data as UnifiedRitual,
    validation: { valid: errors.length === 0, errors, warnings },
    index
  };
}

/**
 * Valida uma fórmula de dano
 */
function validateDamageFormula(
  formula: Record<string, unknown>,
  path: string,
  errors: string[],
  warnings: string[]
): void {
  if (formula.diceCount !== undefined && typeof formula.diceCount !== 'number') {
    errors.push(`Campo "${path}.diceCount" deve ser número`);
  }
  if (formula.diceType !== undefined && typeof formula.diceType !== 'number') {
    errors.push(`Campo "${path}.diceType" deve ser número`);
  }
  if (!formula.damageType || typeof formula.damageType !== 'string') {
    warnings.push(`Campo "${path}.damageType" recomendado (tipo de dano)`);
  }
}

/**
 * Valida uma fórmula de cura
 */
function validateHealingFormula(
  formula: Record<string, unknown>,
  path: string,
  errors: string[],
  warnings: string[]
): void {
  if (formula.diceCount !== undefined && typeof formula.diceCount !== 'number') {
    errors.push(`Campo "${path}.diceCount" deve ser número`);
  }
  if (formula.diceType !== undefined && typeof formula.diceType !== 'number') {
    errors.push(`Campo "${path}.diceType" deve ser número`);
  }
}

/**
 * Valida um array de dados com verificação de duplicatas
 */
export function validateBatch<T>(
  data: unknown[],
  validator: (item: unknown, index: number, context?: ValidationContext) => ValidatedItem<T>,
  context?: ValidationContext
): ValidatedItem<T>[] {
  return data.map((item, index) => validator(item, index, context));
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
