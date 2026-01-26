/**
 * ritual-validation.ts
 * Ordem Paranormal RPG v1.3
 * 
 * Validação de rituais conforme regras oficiais:
 * - Círculo máximo por NEX
 * - Quantidade de rituais por classe
 * - Validação de aprimoramentos vs círculo/afinidade
 */

import type { CharacterState, ValidationIssue } from '../types';
import { getRitualById } from '@/lib/rituals/ritual-registry';
import { deriveCharacter } from '../derive-character';

// =====================================================
// CONSTANTES - Círculo Máximo por NEX (Livro Base v1.3)
// =====================================================

/**
 * Retorna o círculo máximo de ritual que o personagem pode aprender
 * baseado no NEX (Livro Base v1.3, p.115)
 */
export function getMaxRitualCircleByNex(nex: number): number {
  if (nex >= 85) return 4;  // NEX 85%+ = 4º círculo
  if (nex >= 55) return 3;  // NEX 55-84% = 3º círculo
  if (nex >= 25) return 2;  // NEX 25-54% = 2º círculo
  return 1;                 // NEX 5-24% = 1º círculo
}

// =====================================================
// CONSTANTES - Quantidade de Rituais por NEX (Ocultista)
// =====================================================

/**
 * Tabela de rituais por NEX para Ocultistas (Livro Base v1.3)
 * Mapeamento NEX -> quantidade máxima de rituais
 */
const OCCULTIST_RITUALS_BY_NEX: Record<number, number> = {
  5:  3,
  10: 4,
  15: 5,
  20: 6,
  25: 7,
  30: 8,
  35: 9,
  40: 10,
  45: 11,
  50: 12,
  55: 13,
  60: 14,
  65: 15,
  70: 16,
  75: 17,
  80: 18,
  85: 19,
  90: 20,
  95: 21,
  99: 22,
};

/**
 * Retorna a quantidade máxima de rituais para um Ocultista
 */
function getOccultistMaxRituals(nex: number): number {
  // Encontra o maior NEX <= nex atual
  const validNexes = Object.keys(OCCULTIST_RITUALS_BY_NEX)
    .map(Number)
    .filter(n => n <= nex)
    .sort((a, b) => b - a);
  
  if (validNexes.length === 0) return 3; // Mínimo em NEX 5%
  return OCCULTIST_RITUALS_BY_NEX[validNexes[0]];
}

/**
 * Conta quantos Transcenders o personagem tem para calcular rituais de não-ocultista
 * Não-Ocultistas: 1 ritual por Transcender escolhido (máximo = slots de Transcender usados)
 */
function countTranscenderSlots(state: CharacterState): number {
  // Conta poderes paranormais do personagem
  // Cada Transcender dá 1 poder paranormal ou 1 ritual
  return state.paranormalPowers.length;
}

// =====================================================
// FUNÇÃO PRINCIPAL
// =====================================================

/**
 * Valida rituais do personagem contra regras oficiais
 * 
 * @param state - Estado do personagem
 * @returns Lista de problemas encontrados
 */
export function validateRituals(state: CharacterState): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  
  const isOccultist = state.characterClass === 'Ocultista';
  const maxCircle = getMaxRitualCircleByNex(state.nex);
  
  // 1. Validar quantidade de rituais
  issues.push(...validateRitualCount(state, isOccultist));
  
  // 2. Validar círculo de cada ritual
  issues.push(...validateRitualCircles(state, maxCircle));
  
  // 3. Validar rituais sustentados
  issues.push(...validateSustainedRituals(state));
  
  return issues;
}

/**
 * Valida quantidade de rituais
 */
function validateRitualCount(state: CharacterState, isOccultist: boolean): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const ritualCount = state.rituals.length;
  
  if (isOccultist) {
    // Ocultista: usa tabela de rituais por NEX
    const maxRituals = getOccultistMaxRituals(state.nex);
    
    if (ritualCount > maxRituals) {
      issues.push({
        severity: 'error',
        ruleId: 'too-many-rituals-occultist',
        message: `Rituais excedidos: ${ritualCount} de ${maxRituals} permitidos para Ocultista NEX ${state.nex}%`,
        path: 'rituals',
        suggestedFix: {
          action: 'recalculate',
          field: 'rituals',
          description: `Remover ${ritualCount - maxRituals} ritual(is) para ficar dentro do limite`,
        },
      });
    }
  } else {
    // Não-Ocultista: máximo de 1 ritual por Transcender
    // Cada Transcender permite escolher 1 poder paranormal OU 1 ritual
    const transcenderCount = countTranscenderSlots(state);
    
    // Se tem rituais mas não é ocultista, precisa ter Transcender
    if (ritualCount > 0 && transcenderCount === 0 && state.paranormalPowers.length === 0) {
      issues.push({
        severity: 'error',
        ruleId: 'ritual-without-transcender',
        message: `${state.characterClass} não pode ter rituais sem o poder Transcender`,
        path: 'rituals',
        suggestedFix: {
          action: 'remove',
          field: 'rituals',
          description: 'Remover rituais ou adquirir Transcender',
        },
      });
    }
    
    // Não-ocultistas têm limite muito restrito
    // Regra: podem ter rituais apenas via Transcender ou poderes específicos
    // Por simplicidade: 1 ritual por cada 2 poderes paranormais (aproximação)
    const maxRitualsNonOccultist = Math.max(0, Math.floor(transcenderCount / 2));
    
    if (ritualCount > maxRitualsNonOccultist && maxRitualsNonOccultist > 0) {
      issues.push({
        severity: 'warning',
        ruleId: 'too-many-rituals-non-occultist',
        message: `${state.characterClass} com ${transcenderCount} poderes paranormais pode ter no máximo ${maxRitualsNonOccultist} ritual(is)`,
        path: 'rituals',
      });
    }
  }
  
  return issues;
}

/**
 * Valida se cada ritual está dentro do círculo máximo permitido
 */
function validateRitualCircles(state: CharacterState, maxCircle: number): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  
  for (const ritualId of state.rituals) {
    const ritual = getRitualById(ritualId);
    
    if (!ritual) {
      issues.push({
        severity: 'warning',
        ruleId: 'unknown-ritual',
        message: `Ritual "${ritualId}" não encontrado no catálogo oficial`,
        path: 'rituals',
      });
      continue;
    }
    
    if (ritual.circle > maxCircle) {
      issues.push({
        severity: 'error',
        ruleId: 'ritual-circle-too-high',
        message: `Ritual "${ritual.name}" é ${ritual.circle}º círculo, mas NEX ${state.nex}% permite apenas ${maxCircle}º círculo`,
        path: 'rituals',
        suggestedFix: {
          action: 'remove',
          field: 'rituals',
          value: ritualId,
          description: `Remover "${ritual.name}" até atingir NEX suficiente`,
        },
      });
    }
  }
  
  return issues;
}

/**
 * Valida rituais sustentados ativos
 */
function validateSustainedRituals(state: CharacterState): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  
  for (const sustained of state.sustainedRituals) {
    // Verificar se o ritual sustentado existe na lista de rituais conhecidos
    if (!state.rituals.includes(sustained.ritualId)) {
      issues.push({
        severity: 'error',
        ruleId: 'sustained-unknown-ritual',
        message: `Ritual sustentado "${sustained.ritualName}" não está na lista de rituais conhecidos`,
        path: 'sustainedRituals',
        suggestedFix: {
          action: 'remove',
          field: 'sustainedRituals',
          description: `Cancelar sustentação de "${sustained.ritualName}"`,
        },
      });
    }
    
    // Validar círculo do ritual sustentado
    const maxCircle = getMaxRitualCircleByNex(state.nex);
    if (sustained.circle > maxCircle) {
      issues.push({
        severity: 'error',
        ruleId: 'sustained-circle-too-high',
        message: `Ritual sustentado "${sustained.ritualName}" é ${sustained.circle}º círculo, acima do permitido`,
        path: 'sustainedRituals',
      });
    }
  }
  
  return issues;
}

// =====================================================
// EXPORTAÇÕES
// =====================================================

export {
  getOccultistMaxRituals,
  countTranscenderSlots,
};
