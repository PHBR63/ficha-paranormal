/**
 * validateCharacter - Função principal de validação
 * Ordem Paranormal RPG v1.3
 * 
 * Valida o estado do personagem contra todas as regras oficiais,
 * retornando uma lista de problemas com severidade e sugestões de correção.
 * 
 * Esta é uma função PURA - não modifica estado, não tem side effects.
 */

import type {
  CharacterState,
  ValidationResult,
  ValidationIssue,
  SuggestedFix,
  AttributeKey,
} from './types';
import { getClassBaseStats } from './helpers/class-stats';
import { deriveCharacter } from './derive-character';

// =====================================================
// FUNÇÃO PRINCIPAL
// =====================================================

/**
 * Valida o personagem contra todas as regras oficiais
 * 
 * @param state - Estado completo do personagem
 * @returns Resultado da validação com lista de problemas
 */
export function validateCharacter(state: CharacterState): ValidationResult {
  const issues: ValidationIssue[] = [];
  
  // 1. Validar campos obrigatórios
  issues.push(...validateRequiredFields(state));
  
  // 2. Validar atributos
  issues.push(...validateAttributes(state));
  
  // 3. Validar classe e trilha
  issues.push(...validateClassAndTrack(state));
  
  // 4. Validar origem
  issues.push(...validateOrigin(state));
  
  // 5. Validar recursos atuais vs máximos
  issues.push(...validateResources(state));
  
  // 6. Validar perícias
  issues.push(...validateSkills(state));
  
  // 7. Validar rituais (Ocultista)
  issues.push(...validateRituals(state));
  
  // 8. Validar poderes e pré-requisitos
  issues.push(...validatePowers(state));
  
  // 9. Validar condições
  issues.push(...validateConditions(state));
  
  // Contar por severidade
  const errorCount = issues.filter(i => i.severity === 'error').length;
  const warningCount = issues.filter(i => i.severity === 'warning').length;
  
  return {
    valid: errorCount === 0,
    issues,
    errorCount,
    warningCount,
  };
}

// =====================================================
// VALIDADORES ESPECÍFICOS
// =====================================================

/**
 * Valida campos obrigatórios
 */
function validateRequiredFields(state: CharacterState): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  
  if (!state.name || state.name.trim().length === 0) {
    issues.push({
      severity: 'error',
      ruleId: 'required-name',
      message: 'Nome do personagem é obrigatório',
      path: 'name',
      suggestedFix: {
        action: 'set',
        field: 'name',
        description: 'Definir um nome para o personagem',
      },
    });
  }
  
  if (!state.characterClass) {
    issues.push({
      severity: 'error',
      ruleId: 'required-class',
      message: 'Classe é obrigatória',
      path: 'characterClass',
    });
  }
  
  if (!state.origin || state.origin.trim().length === 0) {
    issues.push({
      severity: 'error',
      ruleId: 'required-origin',
      message: 'Origem é obrigatória',
      path: 'origin',
    });
  }
  
  return issues;
}

/**
 * Valida distribuição de atributos
 */
function validateAttributes(state: CharacterState): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const attrs = state.attributes;
  const attributeKeys: AttributeKey[] = ['strength', 'agility', 'vigor', 'intellect', 'presence'];
  
  // Verificar se todos os atributos existem
  for (const key of attributeKeys) {
    if (attrs[key] === undefined || attrs[key] === null) {
      issues.push({
        severity: 'error',
        ruleId: 'missing-attribute',
        message: `Atributo ${getAttributeName(key)} não está definido`,
        path: `attributes.${key}`,
        suggestedFix: {
          action: 'set',
          field: `attributes.${key}`,
          value: 1,
          description: `Definir ${getAttributeName(key)} com valor inicial 1`,
        },
        autoFixable: true,
      });
    }
  }
  
  // Verificar limites (0-5 base, pode aumentar com NEX)
  const maxAttribute = getMaxAttributeByNex(state.nex);
  for (const key of attributeKeys) {
    const value = attrs[key] ?? 0;
    
    if (value < 0) {
      issues.push({
        severity: 'error',
        ruleId: 'attribute-below-minimum',
        message: `${getAttributeName(key)} não pode ser menor que 0`,
        path: `attributes.${key}`,
        suggestedFix: {
          action: 'set',
          field: `attributes.${key}`,
          value: 0,
          description: `Corrigir ${getAttributeName(key)} para 0`,
        },
        autoFixable: true,
      });
    }
    
    if (value > maxAttribute) {
      issues.push({
        severity: 'error',
        ruleId: 'attribute-above-maximum',
        message: `${getAttributeName(key)} não pode ser maior que ${maxAttribute} com NEX ${state.nex}%`,
        path: `attributes.${key}`,
        suggestedFix: {
          action: 'set',
          field: `attributes.${key}`,
          value: maxAttribute,
          description: `Reduzir ${getAttributeName(key)} para ${maxAttribute}`,
        },
        autoFixable: true,
      });
    }
  }
  
  // Verificar regra do zero (apenas 1 atributo pode ser 0)
  const zeroCount = attributeKeys.filter(k => attrs[k] === 0).length;
  if (zeroCount > 1) {
    issues.push({
      severity: 'error',
      ruleId: 'multiple-zero-attributes',
      message: 'Apenas um atributo pode ser reduzido para 0',
      path: 'attributes',
    });
  }
  
  // Verificar soma total de pontos
  const totalPoints = attributeKeys.reduce((sum, k) => sum + (attrs[k] ?? 0), 0);
  const expectedPoints = calculateExpectedAttributePoints(state.nex);
  
  if (totalPoints > expectedPoints) {
    issues.push({
      severity: 'error',
      ruleId: 'too-many-attribute-points',
      message: `Pontos de atributo excedidos: usando ${totalPoints}, máximo é ${expectedPoints}`,
      path: 'attributes',
    });
  } else if (totalPoints < expectedPoints) {
    issues.push({
      severity: 'warning',
      ruleId: 'unused-attribute-points',
      message: `Pontos de atributo não utilizados: usando ${totalPoints} de ${expectedPoints}`,
      path: 'attributes',
    });
  }
  
  return issues;
}

/**
 * Valida classe e trilha
 */
function validateClassAndTrack(state: CharacterState): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  
  const validClasses = ['Combatente', 'Especialista', 'Ocultista'];
  if (!validClasses.includes(state.characterClass)) {
    issues.push({
      severity: 'error',
      ruleId: 'invalid-class',
      message: `Classe inválida: ${state.characterClass}`,
      path: 'characterClass',
    });
  }
  
  // Trilha obrigatória a partir de NEX 10%
  if (state.nex >= 10 && !state.classTrack) {
    issues.push({
      severity: 'error',
      ruleId: 'missing-track',
      message: 'Trilha de classe é obrigatória para personagens com NEX 10% ou maior',
      path: 'classTrack',
    });
  }
  
  // Validar se trilha pertence à classe
  if (state.classTrack) {
    const validTracks = getValidTracksForClass(state.characterClass);
    if (!validTracks.includes(state.classTrack)) {
      issues.push({
        severity: 'error',
        ruleId: 'invalid-track-for-class',
        message: `Trilha "${state.classTrack}" não é válida para ${state.characterClass}`,
        path: 'classTrack',
      });
    }
  }
  
  return issues;
}

/**
 * Valida origem
 */
function validateOrigin(state: CharacterState): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  
  // TODO: Validar se origem existe no catálogo
  // TODO: Validar se perícias de origem estão treinadas (exceto Amnésico)
  
  return issues;
}

/**
 * Valida recursos atuais vs máximos
 */
function validateResources(state: CharacterState): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const derived = deriveCharacter(state);
  
  // HP atual > máximo
  if (state.hpCurrent > derived.hpMax) {
    issues.push({
      severity: 'warning',
      ruleId: 'hp-exceeds-max',
      message: `PV atual (${state.hpCurrent}) excede o máximo (${derived.hpMax})`,
      path: 'hpCurrent',
      suggestedFix: {
        action: 'set',
        field: 'hpCurrent',
        value: derived.hpMax,
        description: `Reduzir PV para ${derived.hpMax}`,
      },
      autoFixable: true,
    });
  }
  
  // PE atual > máximo
  if (state.peCurrent > derived.peMax) {
    issues.push({
      severity: 'warning',
      ruleId: 'pe-exceeds-max',
      message: `PE atual (${state.peCurrent}) excede o máximo (${derived.peMax})`,
      path: 'peCurrent',
      suggestedFix: {
        action: 'set',
        field: 'peCurrent',
        value: derived.peMax,
        description: `Reduzir PE para ${derived.peMax}`,
      },
      autoFixable: true,
    });
  }
  
  // SAN atual > máximo
  if (state.sanCurrent > derived.sanMax) {
    issues.push({
      severity: 'warning',
      ruleId: 'san-exceeds-max',
      message: `Sanidade atual (${state.sanCurrent}) excede o máximo (${derived.sanMax})`,
      path: 'sanCurrent',
      suggestedFix: {
        action: 'set',
        field: 'sanCurrent',
        value: derived.sanMax,
        description: `Reduzir Sanidade para ${derived.sanMax}`,
      },
      autoFixable: true,
    });
  }
  
  // Valores negativos
  if (state.peCurrent < 0) {
    issues.push({
      severity: 'error',
      ruleId: 'pe-negative',
      message: 'PE não pode ser negativo',
      path: 'peCurrent',
      suggestedFix: {
        action: 'set',
        field: 'peCurrent',
        value: 0,
        description: 'Definir PE para 0',
      },
      autoFixable: true,
    });
  }
  
  if (state.sanCurrent < 0) {
    issues.push({
      severity: 'error',
      ruleId: 'san-negative',
      message: 'Sanidade não pode ser negativa',
      path: 'sanCurrent',
      suggestedFix: {
        action: 'set',
        field: 'sanCurrent',
        value: 0,
        description: 'Definir Sanidade para 0',
      },
      autoFixable: true,
    });
  }
  
  return issues;
}

/**
 * Valida perícias
 */
function validateSkills(state: CharacterState): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  
  // TODO: Validar quantidade de perícias treinadas
  // TODO: Validar perícias obrigatórias de classe (Ocultista: Ocultismo, Vontade)
  // TODO: Validar níveis veterano/expert vs NEX
  
  // Verificar níveis veterano/expert
  for (const [skill, level] of Object.entries(state.skills)) {
    if (level === 'veterano' && state.nex < 35) {
      issues.push({
        severity: 'error',
        ruleId: 'veteran-before-nex35',
        message: `Perícia "${skill}" em nível veterano requer NEX 35%`,
        path: `skills.${skill}`,
      });
    }
    
    if (level === 'expert' && state.nex < 70) {
      issues.push({
        severity: 'error',
        ruleId: 'expert-before-nex70',
        message: `Perícia "${skill}" em nível expert requer NEX 70%`,
        path: `skills.${skill}`,
      });
    }
  }
  
  return issues;
}

/**
 * Valida rituais (Ocultista)
 */
function validateRituals(state: CharacterState): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  
  if (state.characterClass !== 'Ocultista' && state.rituals.length > 0) {
    // Não-ocultistas podem ter rituais via Transcender, mas menos
    // TODO: Validar quantidade de rituais para não-ocultistas
  }
  
  const derived = deriveCharacter(state);
  
  if (state.rituals.length > derived.ritualsMaxCount) {
    issues.push({
      severity: 'error',
      ruleId: 'too-many-rituals',
      message: `Rituais excedidos: ${state.rituals.length} de ${derived.ritualsMaxCount} permitidos`,
      path: 'rituals',
    });
  }
  
  // TODO: Validar círculo dos rituais vs círculo máximo permitido
  
  return issues;
}

/**
 * Valida poderes e pré-requisitos
 */
function validatePowers(state: CharacterState): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  
  // TODO: Validar pré-requisitos de poderes de classe
  // TODO: Validar pré-requisitos de poderes gerais
  // TODO: Validar pré-requisitos de poderes paranormais
  
  return issues;
}

/**
 * Valida condições ativas
 */
function validateConditions(state: CharacterState): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  
  // TODO: Validar se condições existem no catálogo
  // TODO: Validar durações
  
  return issues;
}

// =====================================================
// FUNÇÕES AUXILIARES
// =====================================================

function getAttributeName(key: AttributeKey): string {
  const names: Record<AttributeKey, string> = {
    strength: 'Força',
    agility: 'Agilidade',
    vigor: 'Vigor',
    intellect: 'Intelecto',
    presence: 'Presença',
  };
  return names[key];
}

function getMaxAttributeByNex(nex: number): number {
  if (nex >= 85) return 5;
  if (nex >= 55) return 4;
  if (nex >= 25) return 4;
  return 3; // NEX 5-20%
}

function calculateExpectedAttributePoints(nex: number): number {
  // Base: 5 (1 em cada) + 4 pool + bônus NEX
  const basePoints = 5 + 4;
  
  // Bônus por NEX
  let nexBonus = 0;
  if (nex >= 25) nexBonus++;
  if (nex >= 55) nexBonus++;
  if (nex >= 85) nexBonus++;
  
  return basePoints + nexBonus;
}

function getValidTracksForClass(classId: string): string[] {
  switch (classId) {
    case 'Combatente':
      return ['aniquilador', 'comandante-campo', 'guerreiro', 'operacoes-especiais', 'tropa-choque'];
    case 'Especialista':
      return ['atirador-elite', 'infiltrador', 'medico-campo', 'negociador', 'tecnico'];
    case 'Ocultista':
      return ['conduite', 'flagelador', 'graduado', 'intuitivo', 'lamina-paranormal'];
    default:
      return [];
  }
}

export default validateCharacter;
