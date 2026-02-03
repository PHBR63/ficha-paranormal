/**
 * Barrel Exports - Sistema de Templates
 * 
 * @module lib/templates
 */

// Motor de Validação
export {
  validateTemplate,
  isTemplateValid,
  getValidationSummary,
  type TemplateValidationResult,
  type TemplateValidationError,
  type ValidationSeverity,
  type ValidationCategory,
} from './template-validation-engine';

// Templates Oficiais (seed)
export {
  OFFICIAL_TEMPLATES,
  getOfficialTemplateById,
  getOfficialTemplatesByClass,
} from './official-templates-seed';
