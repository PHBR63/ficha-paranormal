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
import { getPowerById, meetsPrerequisites, ALL_CLASS_POWERS } from '../class-powers';
import type { PowerPrerequisites, TrainingLevel } from '../class-powers/types';

// Importar validadores especializados
import { validateRituals } from './helpers/ritual-validation';
import { validateEquipment } from './helpers/equipment-validation';

// =====================================================
// CONSTANTES DE VALIDAÇÃO
// =====================================================

/**
 * Perícias obrigatórias por classe (Livro Base v1.3)
 */
const CLASS_MANDATORY_SKILLS: Record<string, string[]> = {
  'Combatente': [], // Escolha entre Luta/Pontaria e Fortitude/Reflexos
  'Especialista': [],
  'Ocultista': ['ocultismo', 'vontade'],
};

/**
 * Quantidade base de perícias por classe (Livro Base v1.3)
 * Combatente: 2 + INT perícias
 * Especialista: 4 + INT perícias  
 * Ocultista: 2 + INT perícias
 */
const CLASS_BASE_SKILLS: Record<string, number> = {
  'Combatente': 2,
  'Especialista': 4,
  'Ocultista': 2,
};

/**
 * Perícias concedidas por origem (Livro Base v1.3)
 * Amnésico não tem perícias fixas - o jogador escolhe
 */
const ORIGIN_GRANTED_SKILLS: Record<string, string[]> = {
  'academico': ['ciencias', 'investigacao'],
  'agente-de-saude': ['intuicao', 'medicina'],
  'artista': ['artes', 'enganacao'],
  'atleta': ['acrobacia', 'atletismo'],
  'chef': ['fortitude', 'profissao'],
  'criminoso': ['crime', 'furtividade'],
  'cultista-arrependido': ['ocultismo', 'religiao'],
  'desgarrado': ['fortitude', 'sobrevivencia'],
  'engenheiro': ['profissao', 'tecnologia'],
  'executivo': ['diplomacia', 'profissao'],
  'investigador': ['investigacao', 'percepcao'],
  'lutador': ['luta', 'reflexos'],
  'magnata': ['diplomacia', 'pilotagem'],
  'mercenario': ['iniciativa', 'intimidacao'],
  'militar': ['pontaria', 'tatica'],
  'operario': ['fortitude', 'profissao'],
  'policial': ['percepcao', 'pontaria'],
  'religioso': ['religiao', 'vontade'],
  'servidor-publico': ['intuicao', 'vontade'],
  'ti': ['investigacao', 'tecnologia'],
  'teorico-da-conspiracao': ['investigacao', 'ocultismo'],
  'trabalhador-rural': ['adestramento', 'sobrevivencia'],
  'trambiqueiro': ['crime', 'enganacao'],
  'universitario': ['atualidades', 'investigacao'],
  'vitima': ['reflexos', 'vontade'],
  // Amnésico não tem perícias fixas - excluído intencionalmente
};

/**
 * Pré-requisitos de perícias por trilha (Livro Base v1.3)
 */
const TRACK_SKILL_PREREQUISITES: Record<string, string[]> = {
  'medico-campo': ['medicina'],
  'medico-de-campo': ['medicina'],
  // Outras trilhas não têm pré-requisitos de perícias específicas
};

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
  
  // 7. Validar rituais (Ocultista e não-ocultistas com Transcender)
  issues.push(...validateRituals(state));
  
  // 8. Validar equipamentos (proficiência e capacidade de carga)
  issues.push(...validateEquipment(state));
  
  // 9. Validar poderes e pré-requisitos
  issues.push(...validatePowers(state));
  
  // 10. Validar condições
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
    const normalizedTrack = state.classTrack.toLowerCase();
    
    if (!validTracks.includes(normalizedTrack)) {
      issues.push({
        severity: 'error',
        ruleId: 'invalid-track-for-class',
        message: `Trilha "${state.classTrack}" não é válida para ${state.characterClass}`,
        path: 'classTrack',
      });
    }
    
    // Validar pré-requisitos de perícia da trilha
    const trackPrereqs = TRACK_SKILL_PREREQUISITES[normalizedTrack] || [];
    for (const skillId of trackPrereqs) {
      const level = state.skills[skillId];
      if (!level || level === 'destreinado') {
        const skillDisplayName = getSkillDisplayName(skillId);
        issues.push({
          severity: 'error',
          ruleId: 'missing-track-prereq',
          message: `Trilha "${state.classTrack}" requer "${skillDisplayName}" treinada`,
          path: `skills.${skillId}`,
          suggestedFix: {
            action: 'set',
            field: `skills.${skillId}`,
            value: 'treinado',
            description: `Treinar ${skillDisplayName} (pré-requisito da trilha)`,
          },
          autoFixable: true,
        });
      }
    }
  }
  
  return issues;
}

/**
 * Valida origem e perícias concedidas
 */
function validateOrigin(state: CharacterState): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  
  // Normaliza ID da origem
  const originId = state.origin.toLowerCase().replace(/\s+/g, '-');
  
  // Amnésico não tem perícias fixas - pula validação
  if (originId === 'amnesico') {
    return issues;
  }
  
  // Verifica se origem existe no catálogo
  const originSkills = ORIGIN_GRANTED_SKILLS[originId];
  
  if (!originSkills) {
    // Origem não encontrada - pode ser homebrew ou suplemento
    issues.push({
      severity: 'info',
      ruleId: 'unknown-origin',
      message: `Origem "${state.origin}" não encontrada no catálogo oficial`,
      path: 'origin',
    });
    return issues;
  }
  
  // Valida se perícias de origem estão treinadas
  for (const skillId of originSkills) {
    const level = state.skills[skillId];
    if (!level || level === 'destreinado') {
      const skillDisplayName = getSkillDisplayName(skillId);
      const originDisplayName = getOriginDisplayName(originId);
      issues.push({
        severity: 'error',
        ruleId: 'missing-origin-skill',
        message: `Origem "${originDisplayName}" concede "${skillDisplayName}" treinada`,
        path: `skills.${skillId}`,
        suggestedFix: {
          action: 'set',
          field: `skills.${skillId}`,
          value: 'treinado',
          description: `Treinar ${skillDisplayName} (concedida pela origem)`,
        },
        autoFixable: true,
      });
    }
  }
  
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
  
  // 1. Validar perícias obrigatórias de classe
  const mandatorySkills = CLASS_MANDATORY_SKILLS[state.characterClass] || [];
  for (const skillId of mandatorySkills) {
    const level = state.skills[skillId];
    if (!level || level === 'destreinado') {
      const skillDisplayName = getSkillDisplayName(skillId);
      issues.push({
        severity: 'error',
        ruleId: 'missing-mandatory-skill',
        message: `${state.characterClass} deve ter "${skillDisplayName}" treinada`,
        path: `skills.${skillId}`,
        suggestedFix: {
          action: 'set',
          field: `skills.${skillId}`,
          value: 'treinado',
          description: `Treinar ${skillDisplayName}`,
        },
      });
    }
  }
  
  // 2. Validar quantidade de perícias treinadas
  const trainedSkillsCount = Object.values(state.skills).filter(
    level => level && level !== 'destreinado'
  ).length;
  
  const baseSkillCount = CLASS_BASE_SKILLS[state.characterClass] || 2;
  const intellect = state.attributes.intellect || 0;
  const expectedSkillCount = baseSkillCount + intellect;
  
  if (trainedSkillsCount < expectedSkillCount) {
    issues.push({
      severity: 'warning',
      ruleId: 'low-trained-skills',
      message: `Perícias treinadas insuficientes: ${trainedSkillsCount} de ${expectedSkillCount} (${baseSkillCount} + INT ${intellect})`,
      path: 'skills',
    });
  } else if (trainedSkillsCount > expectedSkillCount) {
    issues.push({
      severity: 'warning',
      ruleId: 'excess-trained-skills',
      message: `Perícias treinadas em excesso: ${trainedSkillsCount} de ${expectedSkillCount} permitidas`,
      path: 'skills',
    });
  }
  
  // 3. Verificar níveis veterano/expert vs NEX
  for (const [skill, level] of Object.entries(state.skills)) {
    if (level === 'veterano' && state.nex < 35) {
      issues.push({
        severity: 'error',
        ruleId: 'veteran-before-nex35',
        message: `Perícia "${getSkillDisplayName(skill)}" em nível veterano requer NEX 35%`,
        path: `skills.${skill}`,
        suggestedFix: {
          action: 'set',
          field: `skills.${skill}`,
          value: 'treinado',
          description: `Rebaixar para treinado até NEX 35%`,
        },
      });
    }
    
    if (level === 'expert' && state.nex < 70) {
      issues.push({
        severity: 'error',
        ruleId: 'expert-before-nex70',
        message: `Perícia "${getSkillDisplayName(skill)}" em nível expert requer NEX 70%`,
        path: `skills.${skill}`,
        suggestedFix: {
          action: 'set',
          field: `skills.${skill}`,
          value: state.nex >= 35 ? 'veterano' : 'treinado',
          description: `Rebaixar para ${state.nex >= 35 ? 'veterano' : 'treinado'}`,
        },
      });
    }
  }
  
  return issues;
}

// validateRituals movido para helpers/ritual-validation.ts

/**
 * Valida poderes e pré-requisitos
 */
function validatePowers(state: CharacterState): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  
  // Combinar todos os poderes do personagem
  const allPowers = [
    ...state.classPowers,
    ...state.generalPowers,
    ...state.paranormalPowers,
  ];
  
  // Converter estado para formato esperado por meetsPrerequisites
  const characterData = {
    nex: state.nex,
    attributes: {
      strength: state.attributes.strength || 0,
      agility: state.attributes.agility || 0,
      vigor: state.attributes.vigor || 0,
      intellect: state.attributes.intellect || 0,
      presence: state.attributes.presence || 0,
    },
    skills: mapSkillsToTrainingLevel(state.skills),
    powers: allPowers,
    proficiencies: extractProficiencies(state),
  };
  
  // Validar cada poder
  for (const powerId of allPowers) {
    const power = getPowerById(powerId);
    
    if (!power) {
      // Poder não encontrado no catálogo - pode ser homebrew ou ID incorreto
      issues.push({
        severity: 'warning',
        ruleId: 'unknown-power',
        message: `Poder "${powerId}" não encontrado no catálogo oficial`,
        path: 'powers',
      });
      continue;
    }
    
    // Verificar NEX mínimo
    if (power.minNex && state.nex < power.minNex) {
      issues.push({
        severity: 'error',
        ruleId: 'power-nex-requirement',
        message: `Poder "${power.name}" requer NEX ${power.minNex}% (atual: ${state.nex}%)`,
        path: 'powers',
        suggestedFix: {
          action: 'remove',
          field: 'powers',
          value: powerId,
          description: `Remover "${power.name}" até atingir NEX ${power.minNex}%`,
        },
      });
    }
    
    // Verificar classe correta
    if (power.classId && power.classId !== state.characterClass) {
      // Poderes de trilha têm trackId definido
      const isTrackPower = 'trackId' in power && power.trackId;
      if (!isTrackPower) {
        issues.push({
          severity: 'error',
          ruleId: 'power-wrong-class',
          message: `Poder "${power.name}" é exclusivo de ${power.classId}`,
          path: 'powers',
        });
      }
    }
    
    // Verificar pré-requisitos
    if (power.prerequisites) {
      const prereqResult = meetsPrerequisites(power, characterData);
      
      if (!prereqResult.meets) {
        issues.push({
          severity: 'error',
          ruleId: 'power-prerequisites-not-met',
          message: `Poder "${power.name}" requer: ${prereqResult.missing.join(', ')}`,
          path: 'powers',
        suggestedFix: {
          action: 'recalculate',
          field: 'powers',
          description: `Cumprir pré-requisitos: ${prereqResult.missing.join(', ')}`,
        },
        });
      }
    }
  }
  
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

/**
 * Retorna nome de exibição da origem
 */
function getOriginDisplayName(originId: string): string {
  const originNames: Record<string, string> = {
    'academico': 'Acadêmico',
    'agente-de-saude': 'Agente de Saúde',
    'amnesico': 'Amnésico',
    'artista': 'Artista',
    'atleta': 'Atleta',
    'chef': 'Chef',
    'criminoso': 'Criminoso',
    'cultista-arrependido': 'Cultista Arrependido',
    'desgarrado': 'Desgarrado',
    'engenheiro': 'Engenheiro',
    'executivo': 'Executivo',
    'investigador': 'Investigador',
    'lutador': 'Lutador',
    'magnata': 'Magnata',
    'mercenario': 'Mercenário',
    'militar': 'Militar',
    'operario': 'Operário',
    'policial': 'Policial',
    'religioso': 'Religioso',
    'servidor-publico': 'Servidor Público',
    'ti': 'T.I.',
    'teorico-da-conspiracao': 'Teórico da Conspiração',
    'trabalhador-rural': 'Trabalhador Rural',
    'trambiqueiro': 'Trambiqueiro',
    'universitario': 'Universitário',
    'vitima': 'Vítima',
  };
  return originNames[originId] || originId.charAt(0).toUpperCase() + originId.slice(1).replace(/-/g, ' ');
}

/**
 * Retorna nome de exibição da perícia
 */
function getSkillDisplayName(skillId: string): string {
  const skillNames: Record<string, string> = {
    'acrobacia': 'Acrobacia',
    'adestramento': 'Adestramento',
    'artes': 'Artes',
    'atletismo': 'Atletismo',
    'atualidades': 'Atualidades',
    'ciencias': 'Ciências',
    'crime': 'Crime',
    'diplomacia': 'Diplomacia',
    'enganacao': 'Enganação',
    'fortitude': 'Fortitude',
    'furtividade': 'Furtividade',
    'iniciativa': 'Iniciativa',
    'intimidacao': 'Intimidação',
    'intuicao': 'Intuição',
    'investigacao': 'Investigação',
    'luta': 'Luta',
    'medicina': 'Medicina',
    'ocultismo': 'Ocultismo',
    'percepcao': 'Percepção',
    'pilotagem': 'Pilotagem',
    'pontaria': 'Pontaria',
    'profissao': 'Profissão',
    'reflexos': 'Reflexos',
    'religiao': 'Religião',
    'sobrevivencia': 'Sobrevivência',
    'tatica': 'Tática',
    'tecnologia': 'Tecnologia',
    'vontade': 'Vontade',
  };
  return skillNames[skillId] || skillId.charAt(0).toUpperCase() + skillId.slice(1);
}

/**
 * Converte formato de skills do CharacterState para TrainingLevel
 */
function mapSkillsToTrainingLevel(skills: Record<string, string>): Record<string, string> {
  const mapped: Record<string, string> = {};
  
  for (const [skill, level] of Object.entries(skills)) {
    // Mapeia 'treinado' -> 'trained', 'veterano' -> 'veteran', etc.
    const levelMap: Record<string, string> = {
      'destreinado': 'untrained',
      'treinado': 'trained',
      'veterano': 'veteran',
      'expert': 'expert',
    };
    mapped[skill] = levelMap[level] || level;
  }
  
  return mapped;
}

/**
 * Extrai proficiências do personagem baseado em poderes e classe
 */
function extractProficiencies(state: CharacterState): string[] {
  const proficiencies: string[] = [];
  
  // Proficiências base por classe (Livro Base v1.3)
  switch (state.characterClass) {
    case 'Combatente':
      proficiencies.push('simples', 'taticas', 'leves');
      break;
    case 'Especialista':
      proficiencies.push('simples', 'leves');
      break;
    case 'Ocultista':
      proficiencies.push('simples');
      break;
  }
  
  // Verificar poderes que concedem proficiências
  const proficiencyPowers: Record<string, string[]> = {
    'armamento-pesado': ['pesadas'],
    'proficiencia-armas-taticas': ['taticas'],
    'proficiencia-protecoes-pesadas': ['pesadas'],
  };
  
  for (const powerId of state.classPowers) {
    if (proficiencyPowers[powerId]) {
      proficiencies.push(...proficiencyPowers[powerId]);
    }
  }
  
  return [...new Set(proficiencies)]; // Remove duplicatas
}

export default validateCharacter;
