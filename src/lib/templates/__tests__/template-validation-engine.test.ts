/**
 * Testes do Motor de Validação de Templates
 * Valida o engine contra regras oficiais v1.3
 * 
 * @module lib/templates/__tests__/template-validation-engine.test
 */

import { describe, it, expect } from 'vitest';
import {
  validateTemplate,
  isTemplateValid,
  getValidationSummary,
} from '../template-validation-engine';
import { CLASS_IDS, ELEMENT_IDS } from '@/lib/constants/game-ids';
import type { CharacterTemplateData } from '@/types/templates';
import { TEMPLATE_SCHEMA_VERSION } from '@/types/templates';

// ========================================
// Fixtures de Templates Válidos
// ========================================

const validCombatanteTemplate: CharacterTemplateData = {
  origin: 'militar',
  classId: CLASS_IDS.COMBATENTE,
  classTrack: 'guerreiro',
  attributes: {
    strength: 2,
    agility: 0,
    vigor: 1,
    intellect: 0,
    presence: 1,
  },
  trainedSkills: ['luta', 'fortitude', 'pontaria', 'tatica'],
  classPowers: [],
  equipment: { weapons: [], items: [] },
  schema_version: TEMPLATE_SCHEMA_VERSION,
};

const validOcultistaTemplate: CharacterTemplateData = {
  origin: 'academico',
  classId: CLASS_IDS.OCULTISTA,
  classTrack: 'condutor',
  elementalAffinity: ELEMENT_IDS.ENERGIA,
  attributes: {
    strength: 0,
    agility: 0,
    vigor: 1,
    intellect: 2,
    presence: 1,
  },
  trainedSkills: ['ciencias', 'investigacao', 'ocultismo', 'vontade'],
  classPowers: [],
  initialRituals: ['choque', 'luz'],
  equipment: { weapons: [], items: [] },
  schema_version: TEMPLATE_SCHEMA_VERSION,
};

const validEspecialistaTemplate: CharacterTemplateData = {
  origin: 'investigador',
  classId: CLASS_IDS.ESPECIALISTA,
  classTrack: 'negociador',
  attributes: {
    strength: 0,
    agility: 1,
    vigor: 0,
    intellect: 2,
    presence: 1,
  },
  trainedSkills: ['investigacao', 'percepcao', 'diplomacia', 'intuicao'],
  classPowers: [],
  equipment: { weapons: [], items: [] },
  schema_version: TEMPLATE_SCHEMA_VERSION,
};

// ========================================
// Testes de Validação de Atributos
// ========================================

describe('validateTemplate - Atributos', () => {
  it('deve validar template com atributos corretos', () => {
    const result = validateTemplate(validCombatanteTemplate);
    
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('deve rejeitar atributo acima do máximo (5)', () => {
    const template: CharacterTemplateData = {
      ...validCombatanteTemplate,
      attributes: { strength: 6, agility: 0, vigor: 0, intellect: 0, presence: 0 },
    };
    
    const result = validateTemplate(template);
    
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.code === 'ATTR_ABOVE_MAX')).toBe(true);
  });

  it('deve rejeitar atributo abaixo do mínimo (0)', () => {
    const template: CharacterTemplateData = {
      ...validCombatanteTemplate,
      attributes: { strength: -1, agility: 0, vigor: 0, intellect: 0, presence: 0 },
    };
    
    const result = validateTemplate(template);
    
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.code === 'ATTR_BELOW_MIN')).toBe(true);
  });

  it('deve avisar se pontos de atributo excedem limite de NEX 5%', () => {
    const template: CharacterTemplateData = {
      ...validCombatanteTemplate,
      attributes: { strength: 3, agility: 3, vigor: 3, intellect: 0, presence: 0 },
    };
    
    const result = validateTemplate(template);
    
    // Ainda é válido, mas deve ter warning
    expect(result.warnings.some(e => e.code === 'ATTR_POINTS_EXCEEDED')).toBe(true);
  });
});

// ========================================
// Testes de Validação de Classe
// ========================================

describe('validateTemplate - Classe', () => {
  it('deve validar classe Combatente', () => {
    const result = validateTemplate(validCombatanteTemplate);
    expect(result.errors.filter(e => e.category === 'class')).toHaveLength(0);
  });

  it('deve validar classe Especialista', () => {
    const result = validateTemplate(validEspecialistaTemplate);
    expect(result.errors.filter(e => e.category === 'class')).toHaveLength(0);
  });

  it('deve validar classe Ocultista com afinidade', () => {
    const result = validateTemplate(validOcultistaTemplate);
    expect(result.errors.filter(e => e.category === 'class')).toHaveLength(0);
  });

  it('deve rejeitar classe inválida', () => {
    const template: CharacterTemplateData = {
      ...validCombatanteTemplate,
      classId: 'ClasseInexistente',
    };
    
    const result = validateTemplate(template);
    
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.code === 'CLASS_INVALID')).toBe(true);
  });

  it('deve rejeitar Ocultista sem afinidade elemental', () => {
    const template: CharacterTemplateData = {
      ...validOcultistaTemplate,
      elementalAffinity: undefined,
    };
    
    const result = validateTemplate(template);
    
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.code === 'AFFINITY_MISSING')).toBe(true);
  });

  it('deve rejeitar afinidade elemental inválida', () => {
    const template: CharacterTemplateData = {
      ...validOcultistaTemplate,
      elementalAffinity: 'ElementoInexistente',
    };
    
    const result = validateTemplate(template);
    
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.code === 'AFFINITY_INVALID')).toBe(true);
  });
});

// ========================================
// Testes de Validação de Trilha
// ========================================

describe('validateTemplate - Trilha', () => {
  it('deve validar trilha válida para a classe', () => {
    const result = validateTemplate(validCombatanteTemplate);
    expect(result.errors.filter(e => e.category === 'track')).toHaveLength(0);
  });

  it('deve permitir template sem trilha', () => {
    const template: CharacterTemplateData = {
      ...validCombatanteTemplate,
      classTrack: null,
    };
    
    const result = validateTemplate(template);
    expect(result.errors.filter(e => e.category === 'track')).toHaveLength(0);
  });

  it('deve rejeitar trilha inválida', () => {
    const template: CharacterTemplateData = {
      ...validCombatanteTemplate,
      classTrack: 'trilha-inexistente',
    };
    
    const result = validateTemplate(template);
    
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.code === 'TRACK_INVALID')).toBe(true);
  });

  it('deve rejeitar trilha de outra classe', () => {
    const template: CharacterTemplateData = {
      ...validCombatanteTemplate,
      classTrack: 'condutor', // Trilha de Ocultista
    };
    
    const result = validateTemplate(template);
    
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.code === 'TRACK_CLASS_MISMATCH')).toBe(true);
  });
});

// ========================================
// Testes de Validação de Origem
// ========================================

describe('validateTemplate - Origem', () => {
  it('deve validar origem válida', () => {
    const result = validateTemplate(validCombatanteTemplate);
    expect(result.errors.filter(e => e.category === 'origin')).toHaveLength(0);
  });

  it('deve rejeitar origem inválida', () => {
    const template: CharacterTemplateData = {
      ...validCombatanteTemplate,
      origin: 'origem-inexistente',
    };
    
    const result = validateTemplate(template);
    
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.code === 'ORIGIN_INVALID')).toBe(true);
  });

  it('deve rejeitar template sem origem', () => {
    const template: CharacterTemplateData = {
      ...validCombatanteTemplate,
      origin: '',
    };
    
    const result = validateTemplate(template);
    
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.code === 'ORIGIN_MISSING')).toBe(true);
  });
});

// ========================================
// Testes de Validação de Perícias
// ========================================

describe('validateTemplate - Perícias', () => {
  it('deve validar perícias válidas', () => {
    const result = validateTemplate(validCombatanteTemplate);
    expect(result.errors.filter(e => e.category === 'skills')).toHaveLength(0);
  });

  it('deve rejeitar perícia inválida', () => {
    const template: CharacterTemplateData = {
      ...validCombatanteTemplate,
      trainedSkills: ['luta', 'pericia-inexistente'],
    };
    
    const result = validateTemplate(template);
    
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.code === 'SKILL_INVALID')).toBe(true);
  });

  it('deve avisar sobre perícias duplicadas', () => {
    const template: CharacterTemplateData = {
      ...validCombatanteTemplate,
      trainedSkills: ['luta', 'luta', 'fortitude'],
    };
    
    const result = validateTemplate(template);
    
    expect(result.warnings.some(e => e.code === 'SKILLS_DUPLICATE')).toBe(true);
  });
});

// ========================================
// Testes de Validação de Rituais
// ========================================

describe('validateTemplate - Rituais', () => {
  it('deve validar rituais para Ocultista', () => {
    const result = validateTemplate(validOcultistaTemplate);
    expect(result.errors.filter(e => e.category === 'rituals')).toHaveLength(0);
  });

  it('deve avisar se Combatente tiver rituais no NEX 5%', () => {
    const template: CharacterTemplateData = {
      ...validCombatanteTemplate,
      initialRituals: ['choque'],
    };
    
    const result = validateTemplate(template);
    
    expect(result.warnings.some(e => e.code === 'RITUALS_NOT_ALLOWED')).toBe(true);
  });

  it('deve avisar se Ocultista tiver mais de 3 rituais no NEX 5%', () => {
    const template: CharacterTemplateData = {
      ...validOcultistaTemplate,
      initialRituals: ['ritual1', 'ritual2', 'ritual3', 'ritual4'],
    };
    
    const result = validateTemplate(template);
    
    expect(result.warnings.some(e => e.code === 'RITUALS_EXCEEDED')).toBe(true);
  });
});

// ========================================
// Testes de Funções Auxiliares
// ========================================

describe('isTemplateValid', () => {
  it('deve retornar true para template válido', () => {
    expect(isTemplateValid(validCombatanteTemplate)).toBe(true);
  });

  it('deve retornar false para template inválido', () => {
    const invalidTemplate: CharacterTemplateData = {
      ...validCombatanteTemplate,
      classId: 'ClasseInvalida',
    };
    
    expect(isTemplateValid(invalidTemplate)).toBe(false);
  });
});

describe('getValidationSummary', () => {
  it('deve retornar mensagem de sucesso para template válido', () => {
    const result = validateTemplate(validCombatanteTemplate);
    const summary = getValidationSummary(result);
    
    expect(summary).toContain('válido');
  });

  it('deve retornar mensagem de erro com contagem', () => {
    const invalidTemplate: CharacterTemplateData = {
      ...validCombatanteTemplate,
      classId: 'ClasseInvalida',
      origin: 'origem-invalida',
    };
    
    const result = validateTemplate(invalidTemplate);
    const summary = getValidationSummary(result);
    
    expect(summary).toContain('inválido');
    expect(summary).toContain('erro');
  });
});

// ========================================
// Testes de Templates Oficiais do Seed
// ========================================

describe('validateTemplate - Templates Oficiais', () => {
  it('deve validar todos os templates oficiais do seed', async () => {
    // Importa os templates oficiais
    const { OFFICIAL_TEMPLATES } = await import('../official-templates-seed');
    
    for (const template of OFFICIAL_TEMPLATES) {
      const result = validateTemplate(template.data);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    }
  });
});
