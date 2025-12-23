/**
 * useAttributeValidation - Hook para validação de integridade dos atributos do personagem
 * Detecta quando atributos vêm null/undefined do banco e previne exibição de fallback "1"
 * 
 * Regras oficiais: Atributos válidos são de 0 a 5 (não negativos)
 */

import { useCallback, useMemo } from 'react';

// Interface de atributos esperados
interface CharacterAttributes {
  agility?: number | null;
  strength?: number | null;
  intellect?: number | null;
  presence?: number | null;
  vigor?: number | null;
}

// Resultado da validação
interface AttributeValidationResult {
  /** Atributos são válidos e completos */
  isValid: boolean;
  /** Lista de atributos ausentes ou inválidos */
  missingAttributes: string[];
  /** Atributos com valores inválidos (fora de 0-5) */
  invalidAttributes: string[];
  /** Flag indicando se algum atributo é undefined/null */
  hasIncompleteData: boolean;
  /** Atributos normalizados (com placeholders visuais onde necessário) */
  normalized: {
    agility: number | null;
    strength: number | null;
    intellect: number | null;
    presence: number | null;
    vigor: number | null;
  };
  /** Mensagem descritiva do problema (se houver) */
  errorMessage: string | null;
}

// Lista de atributos padrão
const ATTRIBUTE_KEYS = ['agility', 'strength', 'intellect', 'presence', 'vigor'] as const;
type AttributeKey = typeof ATTRIBUTE_KEYS[number];

// Mapeamento de nomes em PT-BR
const ATTRIBUTE_NAMES: Record<AttributeKey, string> = {
  agility: 'Agilidade',
  strength: 'Força',
  intellect: 'Intelecto',
  presence: 'Presença',
  vigor: 'Vigor',
};

/**
 * Verifica se um valor de atributo é válido (número de 0 a 5)
 */
function isValidAttributeValue(value: number | null | undefined): value is number {
  return typeof value === 'number' && value >= 0 && value <= 5;
}

/**
 * Hook para validar e normalizar atributos de personagem
 */
export function useAttributeValidation(attributes: CharacterAttributes): AttributeValidationResult {
  return useMemo(() => {
    const missingAttributes: string[] = [];
    const invalidAttributes: string[] = [];
    
    // Verifica cada atributo
    for (const key of ATTRIBUTE_KEYS) {
      const value = attributes[key];
      
      // Undefined ou null = dados incompletos
      if (value === undefined || value === null) {
        missingAttributes.push(ATTRIBUTE_NAMES[key]);
      } 
      // Valor fora do range válido (0-5)
      else if (typeof value !== 'number' || value < 0 || value > 5) {
        invalidAttributes.push(ATTRIBUTE_NAMES[key]);
      }
    }
    
    const hasIncompleteData = missingAttributes.length > 0;
    const hasInvalidData = invalidAttributes.length > 0;
    const isValid = !hasIncompleteData && !hasInvalidData;
    
    // Normaliza atributos - mantém null para UI mostrar placeholder
    const normalized = {
      agility: isValidAttributeValue(attributes.agility) ? attributes.agility : null,
      strength: isValidAttributeValue(attributes.strength) ? attributes.strength : null,
      intellect: isValidAttributeValue(attributes.intellect) ? attributes.intellect : null,
      presence: isValidAttributeValue(attributes.presence) ? attributes.presence : null,
      vigor: isValidAttributeValue(attributes.vigor) ? attributes.vigor : null,
    };
    
    // Monta mensagem de erro
    let errorMessage: string | null = null;
    if (hasIncompleteData) {
      errorMessage = `Dados incompletos: ${missingAttributes.join(', ')}`;
    } else if (hasInvalidData) {
      errorMessage = `Valores inválidos: ${invalidAttributes.join(', ')}`;
    }
    
    return {
      isValid,
      missingAttributes,
      invalidAttributes,
      hasIncompleteData,
      normalized,
      errorMessage,
    };
  }, [attributes]);
}

/**
 * Função utilitária para log de diagnóstico de atributos
 * Somente loga se houver problemas (evita spam no console)
 */
export function logAttributeDiagnostics(
  characterId: string,
  characterName: string,
  attributes: CharacterAttributes,
  context: string = 'load'
): void {
  const validation = validateAttributesSync(attributes);
  
  if (!validation.isValid) {
    console.warn(`[AttributeValidation] ${context} - Personagem "${characterName}" (${characterId})`, {
      missing: validation.missingAttributes,
      invalid: validation.invalidAttributes,
      raw: attributes,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Versão síncrona da validação para uso fora de componentes React
 */
export function validateAttributesSync(attributes: CharacterAttributes): Omit<AttributeValidationResult, 'normalized'> {
  const missingAttributes: string[] = [];
  const invalidAttributes: string[] = [];
  
  for (const key of ATTRIBUTE_KEYS) {
    const value = attributes[key];
    
    if (value === undefined || value === null) {
      missingAttributes.push(ATTRIBUTE_NAMES[key]);
    } else if (typeof value !== 'number' || value < 0 || value > 5) {
      invalidAttributes.push(ATTRIBUTE_NAMES[key]);
    }
  }
  
  const hasIncompleteData = missingAttributes.length > 0;
  const hasInvalidData = invalidAttributes.length > 0;
  const isValid = !hasIncompleteData && !hasInvalidData;
  
  let errorMessage: string | null = null;
  if (hasIncompleteData) {
    errorMessage = `Dados incompletos: ${missingAttributes.join(', ')}`;
  } else if (hasInvalidData) {
    errorMessage = `Valores inválidos: ${invalidAttributes.join(', ')}`;
  }
  
  return {
    isValid,
    missingAttributes,
    invalidAttributes,
    hasIncompleteData,
    errorMessage,
  };
}

export type { CharacterAttributes, AttributeValidationResult };
