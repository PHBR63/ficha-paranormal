/**
 * Motor de Validação de Templates
 * Valida templates contra as regras oficiais do Ordem Paranormal RPG v1.3
 * 
 * @module lib/templates/template-validation-engine
 */

import {
  CLASS_IDS,
  VALID_CLASS_IDS,
  isValidClassId,
  isValidOriginId,
  isValidTrackId,
  isValidTrackForClass,
  isValidSkillId,
  isValidElementId,
  VALID_NEX_VALUES,
  VALID_SKILL_IDS,
} from '@/lib/constants/game-ids';
import { CLASSES, ORIGINS } from '@/lib/character-data';
import type { CharacterTemplateData } from '@/types/templates';

// ========================================
// Tipos de Resultado de Validação
// ========================================

/**
 * Severidade do erro de validação
 */
export type ValidationSeverity = 'error' | 'warning' | 'info';

/**
 * Categoria do erro de validação
 */
export type ValidationCategory = 
  | 'attributes'
  | 'class'
  | 'origin'
  | 'track'
  | 'skills'
  | 'powers'
  | 'rituals'
  | 'equipment'
  | 'schema';

/**
 * Erro de validação individual
 */
export interface TemplateValidationError {
  /** Código único do erro */
  code: string;
  /** Categoria do erro */
  category: ValidationCategory;
  /** Severidade */
  severity: ValidationSeverity;
  /** Mensagem legível */
  message: string;
  /** Campo que causou o erro (opcional) */
  field?: string;
  /** Valor esperado (opcional) */
  expected?: string | number;
  /** Valor recebido (opcional) */
  received?: string | number;
}

/**
 * Resultado completo da validação
 */
export interface TemplateValidationResult {
  /** Template é válido para uso */
  isValid: boolean;
  /** Lista de erros encontrados */
  errors: TemplateValidationError[];
  /** Lista de avisos (não impedem uso) */
  warnings: TemplateValidationError[];
  /** Lista de sugestões (informativas) */
  infos: TemplateValidationError[];
  /** Resumo por categoria */
  summary: Record<ValidationCategory, number>;
}

// ========================================
// Constantes de Validação
// ========================================

/** Limite máximo de pontos de atributo para distribuição (NEX 5%) */
const ATTRIBUTE_POINTS_NEX_5 = 4;

/** Limite máximo por atributo individual */
const MAX_ATTRIBUTE_VALUE = 5;

/** Limite mínimo por atributo individual */
const MIN_ATTRIBUTE_VALUE = 0;

/** Mapeamento de círculos de ritual máximos por NEX */
const MAX_RITUAL_CIRCLE_BY_NEX: Record<number, number> = {
  5: 1, 10: 1, 15: 1, 20: 1, 25: 1, 30: 1, 35: 1,
  40: 2, 45: 2, 50: 2, 55: 2, 60: 2,
  65: 3, 70: 3, 75: 3, 80: 3,
  85: 4, 90: 4, 95: 4, 99: 4,
};

// ========================================
// Funções de Validação por Categoria
// ========================================

/**
 * Valida atributos do template
 */
function validateAttributes(
  data: CharacterTemplateData,
  errors: TemplateValidationError[]
): void {
  const { attributes } = data;
  
  if (!attributes) {
    errors.push({
      code: 'ATTR_MISSING',
      category: 'attributes',
      severity: 'error',
      message: 'Atributos não definidos no template.',
    });
    return;
  }

  const attrKeys = ['strength', 'agility', 'vigor', 'intellect', 'presence'] as const;
  let totalPoints = 0;

  // Verifica cada atributo
  for (const key of attrKeys) {
    const value = attributes[key];

    if (typeof value !== 'number') {
      errors.push({
        code: 'ATTR_INVALID_TYPE',
        category: 'attributes',
        severity: 'error',
        message: `Atributo ${key} deve ser um número.`,
        field: key,
        received: typeof value,
      });
      continue;
    }

    if (value < MIN_ATTRIBUTE_VALUE) {
      errors.push({
        code: 'ATTR_BELOW_MIN',
        category: 'attributes',
        severity: 'error',
        message: `Atributo ${key} não pode ser menor que ${MIN_ATTRIBUTE_VALUE}.`,
        field: key,
        expected: MIN_ATTRIBUTE_VALUE,
        received: value,
      });
    }

    if (value > MAX_ATTRIBUTE_VALUE) {
      errors.push({
        code: 'ATTR_ABOVE_MAX',
        category: 'attributes',
        severity: 'error',
        message: `Atributo ${key} não pode ser maior que ${MAX_ATTRIBUTE_VALUE}.`,
        field: key,
        expected: MAX_ATTRIBUTE_VALUE,
        received: value,
      });
    }

    totalPoints += value;
  }

  // Verifica total de pontos (para NEX 5%)
  if (totalPoints > ATTRIBUTE_POINTS_NEX_5) {
    errors.push({
      code: 'ATTR_POINTS_EXCEEDED',
      category: 'attributes',
      severity: 'warning',
      message: `Template usa ${totalPoints} pontos de atributo. Para NEX 5%, o limite é ${ATTRIBUTE_POINTS_NEX_5}.`,
      expected: ATTRIBUTE_POINTS_NEX_5,
      received: totalPoints,
    });
  }
}

/**
 * Valida classe do template
 */
function validateClass(
  data: CharacterTemplateData,
  errors: TemplateValidationError[]
): void {
  const { classId } = data;

  if (!classId) {
    errors.push({
      code: 'CLASS_MISSING',
      category: 'class',
      severity: 'error',
      message: 'Classe não definida no template.',
    });
    return;
  }

  if (!isValidClassId(classId)) {
    errors.push({
      code: 'CLASS_INVALID',
      category: 'class',
      severity: 'error',
      message: `Classe "${classId}" não é válida. Classes válidas: ${VALID_CLASS_IDS.join(', ')}.`,
      field: 'classId',
      received: classId,
    });
  }
}

/**
 * Valida origem do template
 */
function validateOrigin(
  data: CharacterTemplateData,
  errors: TemplateValidationError[]
): void {
  const { origin } = data;

  if (!origin) {
    errors.push({
      code: 'ORIGIN_MISSING',
      category: 'origin',
      severity: 'error',
      message: 'Origem não definida no template.',
    });
    return;
  }

  if (!isValidOriginId(origin)) {
    errors.push({
      code: 'ORIGIN_INVALID',
      category: 'origin',
      severity: 'error',
      message: `Origem "${origin}" não é reconhecida no sistema.`,
      field: 'origin',
      received: origin,
    });
  }
}

/**
 * Valida trilha de classe do template
 */
function validateClassTrack(
  data: CharacterTemplateData,
  errors: TemplateValidationError[]
): void {
  const { classId, classTrack } = data;

  // Trilha é opcional
  if (!classTrack) {
    return;
  }

  if (!isValidTrackId(classTrack)) {
    errors.push({
      code: 'TRACK_INVALID',
      category: 'track',
      severity: 'error',
      message: `Trilha "${classTrack}" não é reconhecida no sistema.`,
      field: 'classTrack',
      received: classTrack,
    });
    return;
  }

  // Verifica se trilha pertence à classe
  if (classId && !isValidTrackForClass(classTrack, classId)) {
    errors.push({
      code: 'TRACK_CLASS_MISMATCH',
      category: 'track',
      severity: 'error',
      message: `Trilha "${classTrack}" não pertence à classe "${classId}".`,
      field: 'classTrack',
    });
  }
}

/**
 * Valida afinidade elemental (Ocultistas)
 */
function validateElementalAffinity(
  data: CharacterTemplateData,
  errors: TemplateValidationError[]
): void {
  const { classId, elementalAffinity } = data;

  // Apenas Ocultistas precisam de afinidade
  if (classId !== CLASS_IDS.OCULTISTA) {
    if (elementalAffinity) {
      errors.push({
        code: 'AFFINITY_NOT_REQUIRED',
        category: 'class',
        severity: 'warning',
        message: `Afinidade elemental definida, mas classe "${classId}" não é Ocultista.`,
        field: 'elementalAffinity',
      });
    }
    return;
  }

  // Ocultista precisa de afinidade
  if (!elementalAffinity) {
    errors.push({
      code: 'AFFINITY_MISSING',
      category: 'class',
      severity: 'error',
      message: 'Ocultistas devem ter uma afinidade elemental definida.',
      field: 'elementalAffinity',
    });
    return;
  }

  if (!isValidElementId(elementalAffinity)) {
    errors.push({
      code: 'AFFINITY_INVALID',
      category: 'class',
      severity: 'error',
      message: `Afinidade "${elementalAffinity}" não é um elemento válido.`,
      field: 'elementalAffinity',
      received: elementalAffinity,
    });
  }
}

/**
 * Valida perícias treinadas do template
 */
function validateSkills(
  data: CharacterTemplateData,
  errors: TemplateValidationError[]
): void {
  const { classId, trainedSkills, attributes } = data;

  if (!trainedSkills || !Array.isArray(trainedSkills)) {
    errors.push({
      code: 'SKILLS_MISSING',
      category: 'skills',
      severity: 'error',
      message: 'Lista de perícias treinadas não definida.',
    });
    return;
  }

  // Verifica perícias individuais
  for (const skillId of trainedSkills) {
    if (!isValidSkillId(skillId)) {
      errors.push({
        code: 'SKILL_INVALID',
        category: 'skills',
        severity: 'error',
        message: `Perícia "${skillId}" não é reconhecida no sistema.`,
        field: 'trainedSkills',
        received: skillId,
      });
    }
  }

  // Verifica duplicatas
  const uniqueSkills = new Set(trainedSkills);
  if (uniqueSkills.size < trainedSkills.length) {
    errors.push({
      code: 'SKILLS_DUPLICATE',
      category: 'skills',
      severity: 'warning',
      message: 'Existem perícias duplicadas na lista.',
      field: 'trainedSkills',
    });
  }

  // Calcula limite de perícias
  const classData = CLASSES.find(c => c.id === classId);
  const originData = ORIGINS.find(o => o.id === data.origin);
  const intellect = attributes?.intellect || 0;
  
  if (classData) {
    const baseSkills = classData.freeSkillsBase || 1;
    const originSkills = originData?.skills?.length || 0;
    const maxSkills = intellect + baseSkills + originSkills;

    if (trainedSkills.length > maxSkills) {
      errors.push({
        code: 'SKILLS_EXCEEDED',
        category: 'skills',
        severity: 'warning',
        message: `Template tem ${trainedSkills.length} perícias, mas limite para NEX 5% é ${maxSkills} (INT ${intellect} + Base ${baseSkills} + Origem ${originSkills}).`,
        expected: maxSkills,
        received: trainedSkills.length,
      });
    }
  }
}

/**
 * Valida poderes de classe do template
 */
function validateClassPowers(
  data: CharacterTemplateData,
  errors: TemplateValidationError[]
): void {
  const { classPowers, classId } = data;

  if (!classPowers || !Array.isArray(classPowers)) {
    // Poderes de classe são opcionais para templates básicos
    return;
  }

  for (const power of classPowers) {
    if (!power.powerId) {
      errors.push({
        code: 'POWER_ID_MISSING',
        category: 'powers',
        severity: 'error',
        message: 'Poder de classe sem ID definido.',
        field: 'classPowers',
      });
      continue;
    }

    if (typeof power.nex !== 'number' || !VALID_NEX_VALUES.includes(power.nex as any)) {
      errors.push({
        code: 'POWER_NEX_INVALID',
        category: 'powers',
        severity: 'warning',
        message: `NEX ${power.nex} do poder "${power.powerId}" não é um valor válido.`,
        field: 'classPowers',
        received: power.nex,
      });
    }
  }
}

/**
 * Valida poderes paranormais do template
 */
function validateParanormalPowers(
  data: CharacterTemplateData,
  errors: TemplateValidationError[]
): void {
  const { paranormalPowers, classId } = data;

  if (!paranormalPowers || !Array.isArray(paranormalPowers) || paranormalPowers.length === 0) {
    // Poderes paranormais são opcionais
    return;
  }

  // Apenas Ocultistas e Cultistas Arrependidos podem ter poderes paranormais no NEX 5%
  if (classId !== CLASS_IDS.OCULTISTA && data.origin !== 'cultista-arrependido') {
    errors.push({
      code: 'PARANORMAL_NOT_ALLOWED',
      category: 'powers',
      severity: 'warning',
      message: 'Poderes paranormais definidos, mas classe não é Ocultista e origem não é Cultista Arrependido.',
      field: 'paranormalPowers',
    });
  }

  for (const power of paranormalPowers) {
    if (!power.powerId) {
      errors.push({
        code: 'PARANORMAL_ID_MISSING',
        category: 'powers',
        severity: 'error',
        message: 'Poder paranormal sem ID definido.',
        field: 'paranormalPowers',
      });
    }
  }
}

/**
 * Valida rituais iniciais do template
 */
function validateRituals(
  data: CharacterTemplateData,
  errors: TemplateValidationError[]
): void {
  const { initialRituals, classId } = data;

  if (!initialRituals || !Array.isArray(initialRituals) || initialRituals.length === 0) {
    // Rituais são opcionais
    return;
  }

  // Verifica se classe pode ter rituais no NEX inicial
  if (classId !== CLASS_IDS.OCULTISTA) {
    errors.push({
      code: 'RITUALS_NOT_ALLOWED',
      category: 'rituals',
      severity: 'warning',
      message: `Rituais definidos, mas classe "${classId}" não começa com rituais no NEX 5%.`,
      field: 'initialRituals',
    });
  }

  // Verifica limite de rituais para Ocultista NEX 5%
  if (classId === CLASS_IDS.OCULTISTA && initialRituals.length > 3) {
    errors.push({
      code: 'RITUALS_EXCEEDED',
      category: 'rituals',
      severity: 'warning',
      message: `Ocultista NEX 5% pode ter no máximo 3 rituais, template tem ${initialRituals.length}.`,
      expected: 3,
      received: initialRituals.length,
    });
  }
}

/**
 * Valida equipamento do template
 */
function validateEquipment(
  data: CharacterTemplateData,
  errors: TemplateValidationError[]
): void {
  const { equipment } = data;

  if (!equipment) {
    // Equipamento é opcional
    return;
  }

  // Validações básicas de estrutura
  if (equipment.weapons && !Array.isArray(equipment.weapons)) {
    errors.push({
      code: 'EQUIPMENT_WEAPONS_INVALID',
      category: 'equipment',
      severity: 'error',
      message: 'Campo "weapons" deve ser um array.',
      field: 'equipment.weapons',
    });
  }

  if (equipment.items && !Array.isArray(equipment.items)) {
    errors.push({
      code: 'EQUIPMENT_ITEMS_INVALID',
      category: 'equipment',
      severity: 'error',
      message: 'Campo "items" deve ser um array.',
      field: 'equipment.items',
    });
  }
}

/**
 * Valida versão do schema
 */
function validateSchema(
  data: CharacterTemplateData,
  errors: TemplateValidationError[]
): void {
  if (typeof data.schema_version !== 'number') {
    errors.push({
      code: 'SCHEMA_VERSION_MISSING',
      category: 'schema',
      severity: 'info',
      message: 'Versão do schema não definida, assumindo versão 1.',
      field: 'schema_version',
    });
  }
}

// ========================================
// Função Principal de Validação
// ========================================

/**
 * Valida um template completo contra as regras oficiais v1.3
 * 
 * @param data - Dados do template a validar
 * @returns Resultado da validação com erros, avisos e informações
 */
export function validateTemplate(data: CharacterTemplateData): TemplateValidationResult {
  const allErrors: TemplateValidationError[] = [];

  // Executa todas as validações
  validateAttributes(data, allErrors);
  validateClass(data, allErrors);
  validateOrigin(data, allErrors);
  validateClassTrack(data, allErrors);
  validateElementalAffinity(data, allErrors);
  validateSkills(data, allErrors);
  validateClassPowers(data, allErrors);
  validateParanormalPowers(data, allErrors);
  validateRituals(data, allErrors);
  validateEquipment(data, allErrors);
  validateSchema(data, allErrors);

  // Separa por severidade
  const errors = allErrors.filter(e => e.severity === 'error');
  const warnings = allErrors.filter(e => e.severity === 'warning');
  const infos = allErrors.filter(e => e.severity === 'info');

  // Calcula resumo por categoria
  const summary: Record<ValidationCategory, number> = {
    attributes: 0,
    class: 0,
    origin: 0,
    track: 0,
    skills: 0,
    powers: 0,
    rituals: 0,
    equipment: 0,
    schema: 0,
  };

  for (const error of allErrors) {
    summary[error.category]++;
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    infos,
    summary,
  };
}

/**
 * Valida um template de forma rápida (apenas erros críticos)
 * 
 * @param data - Dados do template
 * @returns true se válido, false se inválido
 */
export function isTemplateValid(data: CharacterTemplateData): boolean {
  const result = validateTemplate(data);
  return result.isValid;
}

/**
 * Obtém mensagem resumida dos erros
 */
export function getValidationSummary(result: TemplateValidationResult): string {
  if (result.isValid) {
    return result.warnings.length > 0
      ? `Template válido com ${result.warnings.length} aviso(s).`
      : 'Template válido.';
  }

  return `Template inválido: ${result.errors.length} erro(s) encontrado(s).`;
}
