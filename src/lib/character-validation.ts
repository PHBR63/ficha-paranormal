/**
 * Ordem Paranormal RPG - Validação de Personagens
 * Garante que apenas classes e trilhas oficiais possam ser usadas
 */

import { CLASSES, CLASS_TRACKS, getClassTracks } from './character-data';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Valida se a classe existe no sistema
 */
export function validateClass(classId: string): ValidationResult {
  const errors: string[] = [];
  
  if (!classId || typeof classId !== 'string') {
    errors.push('Classe é obrigatória');
    return { valid: false, errors };
  }

  const classExists = CLASSES.some(c => c.id === classId || c.name === classId);
  
  if (!classExists) {
    const validClasses = CLASSES.map(c => c.name).join(', ');
    errors.push(`Classe "${classId}" não é válida. Classes disponíveis: ${validClasses}`);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Valida se a trilha existe e pertence à classe selecionada
 */
export function validateTrack(trackId: string | null, classId: string): ValidationResult {
  const errors: string[] = [];

  // Trilha é opcional em NEX < 10%
  if (!trackId) {
    return { valid: true, errors };
  }

  // Verifica se a trilha existe
  const track = CLASS_TRACKS.find(t => t.id === trackId);
  
  if (!track) {
    const validTracks = getClassTracks(classId);
    const trackNames = validTracks.map(t => t.name).join(', ');
    errors.push(`Trilha "${trackId}" não existe. Trilhas disponíveis para ${classId}: ${trackNames || 'nenhuma'}`);
    return { valid: false, errors };
  }

  // Verifica se a trilha pertence à classe
  if (track.classId !== classId) {
    const validTracks = getClassTracks(classId);
    const trackNames = validTracks.map(t => t.name).join(', ');
    errors.push(`Trilha "${track.name}" não pertence à classe "${classId}". Trilhas disponíveis: ${trackNames}`);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Valida um personagem completo antes de salvar
 */
export function validateCharacter(data: {
  name?: string;
  class?: string;
  class_track?: string | null;
  origin?: string;
  nex?: number;
}): ValidationResult {
  const errors: string[] = [];

  // Validar nome
  if (!data.name || data.name.trim().length === 0) {
    errors.push('Nome do personagem é obrigatório');
  } else if (data.name.length > 100) {
    errors.push('Nome do personagem deve ter no máximo 100 caracteres');
  }

  // Validar classe
  if (data.class) {
    const classValidation = validateClass(data.class);
    errors.push(...classValidation.errors);
  } else {
    errors.push('Classe é obrigatória');
  }

  // Validar trilha (se fornecida ou se NEX >= 10%)
  if (data.class) {
    const trackValidation = validateTrack(data.class_track || null, data.class);
    errors.push(...trackValidation.errors);
    
    // Se NEX >= 10%, trilha é obrigatória
    if (data.nex && data.nex >= 10 && !data.class_track) {
      errors.push('Trilha de classe é obrigatória para personagens com NEX 10% ou maior');
    }
  }

  // Validar origem
  if (!data.origin || data.origin.trim().length === 0) {
    errors.push('Origem é obrigatória');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Lista todas as classes válidas
 */
export function getValidClasses(): string[] {
  return CLASSES.map(c => c.id);
}

/**
 * Lista todas as trilhas válidas para uma classe
 */
export function getValidTracks(classId: string): string[] {
  return getClassTracks(classId).map(t => t.id);
}

/**
 * Verifica se um personagem existente tem dados válidos
 * Útil para migração/limpeza de dados
 */
export function checkExistingCharacterValidity(character: {
  name: string;
  class: string;
  class_track?: string | null;
  origin: string;
  nex: number;
}): { isValid: boolean; issues: string[] } {
  const issues: string[] = [];

  // Verificar classe
  const classValidation = validateClass(character.class);
  if (!classValidation.valid) {
    issues.push(`Classe inválida: ${character.class}`);
  }

  // Verificar trilha
  if (character.class_track) {
    const trackValidation = validateTrack(character.class_track, character.class);
    if (!trackValidation.valid) {
      issues.push(`Trilha inválida: ${character.class_track}`);
    }
  }

  return { isValid: issues.length === 0, issues };
}
