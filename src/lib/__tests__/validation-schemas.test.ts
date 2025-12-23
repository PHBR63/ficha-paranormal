/**
 * Testes unitários para os schemas de validação Zod
 * Garante que as regras de validação funcionam corretamente
 */

import { describe, it, expect } from 'vitest';
import {
  conceptFieldsSchema,
  attributesSchema,
  createAttributesSchemaForNex,
  skillIdSchema,
  skillsSelectionSchema,
  classSchema,
  originSchema,
  nexSchema,
  patentSchema,
  validTracks,
  validateField,
  validateAttributesForNex,
  VALID_SKILL_IDS,
} from '../validation-schemas';

// ============================================
// TESTES: conceptFieldsSchema
// ============================================

describe('conceptFieldsSchema', () => {
  describe('campo name', () => {
    it('deve aceitar nomes válidos', () => {
      const result = conceptFieldsSchema.shape.name.safeParse('João Silva');
      expect(result.success).toBe(true);
    });

    it('deve aceitar nomes com acentos', () => {
      const result = conceptFieldsSchema.shape.name.safeParse('José André Müller');
      expect(result.success).toBe(true);
    });

    it('deve aceitar nomes com hífen', () => {
      const result = conceptFieldsSchema.shape.name.safeParse("Ana-Maria D'Silva");
      expect(result.success).toBe(true);
    });

    it('deve rejeitar nomes muito curtos', () => {
      const result = conceptFieldsSchema.shape.name.safeParse('A');
      expect(result.success).toBe(false);
      expect(result.error?.errors[0]?.message).toContain('pelo menos 2 caracteres');
    });

    it('deve rejeitar nomes muito longos', () => {
      const longName = 'A'.repeat(101);
      const result = conceptFieldsSchema.shape.name.safeParse(longName);
      expect(result.success).toBe(false);
      expect(result.error?.errors[0]?.message).toContain('no máximo 100 caracteres');
    });

    it('deve rejeitar nomes com números', () => {
      const result = conceptFieldsSchema.shape.name.safeParse('João123');
      expect(result.success).toBe(false);
      expect(result.error?.errors[0]?.message).toContain('apenas letras');
    });

    it('deve rejeitar nomes com caracteres especiais', () => {
      const result = conceptFieldsSchema.shape.name.safeParse('João@Silva');
      expect(result.success).toBe(false);
    });

    it('deve aceitar string vazia (opcional)', () => {
      const result = conceptFieldsSchema.shape.name.safeParse('');
      expect(result.success).toBe(true);
    });
  });

  describe('campo concept', () => {
    it('deve aceitar conceitos válidos', () => {
      const result = conceptFieldsSchema.shape.concept.safeParse(
        'Ex-policial assombrado pelo caso que não conseguiu resolver'
      );
      expect(result.success).toBe(true);
    });

    it('deve rejeitar conceitos muito longos', () => {
      const longConcept = 'A'.repeat(201);
      const result = conceptFieldsSchema.shape.concept.safeParse(longConcept);
      expect(result.success).toBe(false);
      expect(result.error?.errors[0]?.message).toContain('no máximo 200 caracteres');
    });

    it('deve aceitar string vazia', () => {
      const result = conceptFieldsSchema.shape.concept.safeParse('');
      expect(result.success).toBe(true);
    });
  });

  describe('campo background', () => {
    it('deve aceitar históricos longos até o limite', () => {
      const background = 'A'.repeat(2000);
      const result = conceptFieldsSchema.shape.background.safeParse(background);
      expect(result.success).toBe(true);
    });

    it('deve rejeitar históricos muito longos', () => {
      const background = 'A'.repeat(2001);
      const result = conceptFieldsSchema.shape.background.safeParse(background);
      expect(result.success).toBe(false);
      expect(result.error?.errors[0]?.message).toContain('no máximo 2000 caracteres');
    });
  });

  describe('campo appearance', () => {
    it('deve aceitar descrições de aparência válidas', () => {
      const result = conceptFieldsSchema.shape.appearance.safeParse(
        'Alto, cabelos negros, cicatriz no rosto'
      );
      expect(result.success).toBe(true);
    });

    it('deve rejeitar aparência muito longa', () => {
      const appearance = 'A'.repeat(501);
      const result = conceptFieldsSchema.shape.appearance.safeParse(appearance);
      expect(result.success).toBe(false);
    });
  });

  describe('campo personality', () => {
    it('deve aceitar descrições de personalidade válidas', () => {
      const result = conceptFieldsSchema.shape.personality.safeParse(
        'Reservado, analítico, desconfiado'
      );
      expect(result.success).toBe(true);
    });

    it('deve rejeitar personalidade muito longa', () => {
      const personality = 'A'.repeat(501);
      const result = conceptFieldsSchema.shape.personality.safeParse(personality);
      expect(result.success).toBe(false);
    });
  });

  describe('campo gender', () => {
    it('deve aceitar gêneros válidos', () => {
      expect(conceptFieldsSchema.shape.gender.safeParse('Masculino').success).toBe(true);
      expect(conceptFieldsSchema.shape.gender.safeParse('Feminino').success).toBe(true);
      expect(conceptFieldsSchema.shape.gender.safeParse('Não-binário').success).toBe(true);
    });

    it('deve rejeitar gênero muito longo', () => {
      const gender = 'A'.repeat(51);
      const result = conceptFieldsSchema.shape.gender.safeParse(gender);
      expect(result.success).toBe(false);
    });
  });
});

// ============================================
// TESTES: attributesSchema
// ============================================

describe('attributesSchema', () => {
  it('deve aceitar atributos válidos padrão', () => {
    const attrs = {
      agility: 2,
      strength: 1,
      intellect: 2,
      presence: 2,
      vigor: 2,
    };
    const result = attributesSchema.safeParse(attrs);
    expect(result.success).toBe(true);
  });

  it('deve aceitar um atributo em 0', () => {
    const attrs = {
      agility: 0,
      strength: 2,
      intellect: 2,
      presence: 3,
      vigor: 2,
    };
    const result = attributesSchema.safeParse(attrs);
    expect(result.success).toBe(true);
  });

  it('deve rejeitar múltiplos atributos em 0', () => {
    const attrs = {
      agility: 0,
      strength: 0,
      intellect: 3,
      presence: 3,
      vigor: 3,
    };
    const result = attributesSchema.safeParse(attrs);
    expect(result.success).toBe(false);
    expect(result.error?.errors[0]?.message).toContain('um atributo pode ser reduzido a 0');
  });

  it('deve rejeitar atributos negativos', () => {
    const attrs = {
      agility: -1,
      strength: 2,
      intellect: 2,
      presence: 2,
      vigor: 2,
    };
    const result = attributesSchema.safeParse(attrs);
    expect(result.success).toBe(false);
  });

  it('deve rejeitar atributos acima de 5', () => {
    const attrs = {
      agility: 6,
      strength: 2,
      intellect: 2,
      presence: 2,
      vigor: 2,
    };
    const result = attributesSchema.safeParse(attrs);
    expect(result.success).toBe(false);
  });

  it('deve rejeitar valores não inteiros', () => {
    const attrs = {
      agility: 2.5,
      strength: 2,
      intellect: 2,
      presence: 2,
      vigor: 2,
    };
    const result = attributesSchema.safeParse(attrs);
    expect(result.success).toBe(false);
  });
});

// ============================================
// TESTES: createAttributesSchemaForNex
// ============================================

describe('createAttributesSchemaForNex', () => {
  it('deve limitar atributos a 3 para NEX 5-15%', () => {
    const schema = createAttributesSchemaForNex(5, 9);
    
    // Válido: atributos até 3
    const validAttrs = { agility: 2, strength: 2, intellect: 2, presence: 2, vigor: 1 };
    expect(schema.safeParse(validAttrs).success).toBe(true);
    
    // Inválido: atributo 4
    const invalidAttrs = { agility: 4, strength: 2, intellect: 1, presence: 1, vigor: 1 };
    expect(schema.safeParse(invalidAttrs).success).toBe(false);
  });

  it('deve limitar atributos a 4 para NEX 20-35%', () => {
    const schema = createAttributesSchemaForNex(25, 10);
    
    // Válido: atributos até 4
    const validAttrs = { agility: 4, strength: 2, intellect: 2, presence: 1, vigor: 1 };
    expect(schema.safeParse(validAttrs).success).toBe(true);
    
    // Inválido: atributo 5
    const invalidAttrs = { agility: 5, strength: 2, intellect: 1, presence: 1, vigor: 1 };
    expect(schema.safeParse(invalidAttrs).success).toBe(false);
  });

  it('deve permitir atributos até 5 para NEX 40%+', () => {
    const schema = createAttributesSchemaForNex(50, 11);
    
    const validAttrs = { agility: 5, strength: 2, intellect: 2, presence: 1, vigor: 1 };
    expect(schema.safeParse(validAttrs).success).toBe(true);
  });

  it('deve validar o total de pontos', () => {
    const schema = createAttributesSchemaForNex(5, 9);
    
    // Total 9 pontos - válido
    const validAttrs = { agility: 2, strength: 2, intellect: 2, presence: 2, vigor: 1 };
    expect(schema.safeParse(validAttrs).success).toBe(true);
    
    // Total 8 pontos - inválido
    const invalidAttrs = { agility: 2, strength: 2, intellect: 2, presence: 1, vigor: 1 };
    expect(schema.safeParse(invalidAttrs).success).toBe(false);
  });
});

// ============================================
// TESTES: skillIdSchema
// ============================================

describe('skillIdSchema', () => {
  it('deve aceitar IDs de perícias válidos', () => {
    expect(skillIdSchema.safeParse('acrobacia').success).toBe(true);
    expect(skillIdSchema.safeParse('luta').success).toBe(true);
    expect(skillIdSchema.safeParse('ocultismo').success).toBe(true);
    expect(skillIdSchema.safeParse('investigacao').success).toBe(true);
  });

  it('deve rejeitar IDs de perícias inválidos', () => {
    expect(skillIdSchema.safeParse('pericia-inventada').success).toBe(false);
    expect(skillIdSchema.safeParse('magia').success).toBe(false);
    expect(skillIdSchema.safeParse('').success).toBe(false);
  });

  it('deve ter todas as 28 perícias válidas', () => {
    expect(VALID_SKILL_IDS.length).toBe(28);
  });
});

// ============================================
// TESTES: skillsSelectionSchema
// ============================================

describe('skillsSelectionSchema', () => {
  it('deve aceitar seleção de perícias válida', () => {
    const selection = {
      freeSkills: ['acrobacia', 'luta', 'percepcao'],
      classSkillChoices: { choice1: 'atletismo' },
      conflictResolutions: {},
    };
    const result = skillsSelectionSchema.safeParse(selection);
    expect(result.success).toBe(true);
  });

  it('deve rejeitar mais de 10 perícias livres', () => {
    const selection = {
      freeSkills: [
        'acrobacia', 'luta', 'percepcao', 'atletismo', 'furtividade',
        'intimidacao', 'investigacao', 'medicina', 'ocultismo', 'pontaria',
        'reflexos', // 11 perícias
      ],
      classSkillChoices: {},
      conflictResolutions: {},
    };
    const result = skillsSelectionSchema.safeParse(selection);
    expect(result.success).toBe(false);
  });

  it('deve rejeitar perícias inválidas na seleção', () => {
    const selection = {
      freeSkills: ['pericia-fake'],
      classSkillChoices: {},
      conflictResolutions: {},
    };
    const result = skillsSelectionSchema.safeParse(selection);
    expect(result.success).toBe(false);
  });
});

// ============================================
// TESTES: classSchema e originSchema
// ============================================

describe('classSchema', () => {
  it('deve aceitar classes válidas', () => {
    expect(classSchema.safeParse('combatente').success).toBe(true);
    expect(classSchema.safeParse('especialista').success).toBe(true);
    expect(classSchema.safeParse('ocultista').success).toBe(true);
  });

  it('deve rejeitar classes inválidas', () => {
    expect(classSchema.safeParse('mago').success).toBe(false);
    expect(classSchema.safeParse('guerreiro').success).toBe(false);
    expect(classSchema.safeParse('').success).toBe(false);
  });
});

describe('originSchema', () => {
  it('deve aceitar origens válidas', () => {
    expect(originSchema.safeParse('academico').success).toBe(true);
    expect(originSchema.safeParse('militar').success).toBe(true);
    expect(originSchema.safeParse('amnésico').success).toBe(true);
  });

  it('deve rejeitar origens inválidas', () => {
    expect(originSchema.safeParse('origem-inventada').success).toBe(false);
    expect(originSchema.safeParse('').success).toBe(false);
  });
});

// ============================================
// TESTES: nexSchema e patentSchema
// ============================================

describe('nexSchema', () => {
  it('deve aceitar valores de NEX válidos', () => {
    expect(nexSchema.safeParse(5).success).toBe(true);
    expect(nexSchema.safeParse(25).success).toBe(true);
    expect(nexSchema.safeParse(50).success).toBe(true);
    expect(nexSchema.safeParse(99).success).toBe(true);
  });

  it('deve rejeitar valores de NEX inválidos', () => {
    expect(nexSchema.safeParse(0).success).toBe(false);
    expect(nexSchema.safeParse(7).success).toBe(false);
    expect(nexSchema.safeParse(100).success).toBe(false);
    expect(nexSchema.safeParse(-5).success).toBe(false);
  });
});

describe('patentSchema', () => {
  it('deve aceitar patentes válidas', () => {
    expect(patentSchema.safeParse('recruta').success).toBe(true);
    expect(patentSchema.safeParse('operador').success).toBe(true);
    expect(patentSchema.safeParse('agente-especial').success).toBe(true);
    expect(patentSchema.safeParse('oficial-de-operacoes').success).toBe(true);
    expect(patentSchema.safeParse('agente-de-elite').success).toBe(true);
  });

  it('deve rejeitar patentes inválidas', () => {
    expect(patentSchema.safeParse('general').success).toBe(false);
    expect(patentSchema.safeParse('').success).toBe(false);
  });
});

// ============================================
// TESTES: validTracks
// ============================================

describe('validTracks', () => {
  it('deve ter trilhas para combatente', () => {
    expect(validTracks.combatente).toContain('aniquilador');
    expect(validTracks.combatente).toContain('guerreiro');
    expect(validTracks.combatente).toContain('tropa-de-choque');
  });

  it('deve ter trilhas para especialista', () => {
    expect(validTracks.especialista).toContain('infiltrador');
    expect(validTracks.especialista).toContain('medico-de-campo');
    expect(validTracks.especialista).toContain('tecnico');
  });

  it('deve ter trilhas para ocultista', () => {
    expect(validTracks.ocultista).toContain('conduite');
    expect(validTracks.ocultista).toContain('flagelador');
    expect(validTracks.ocultista).toContain('graduado');
  });

  it('NÃO deve conter trilha inválida "condutor"', () => {
    expect(validTracks.ocultista).not.toContain('condutor');
  });
});

// ============================================
// TESTES: Funções auxiliares
// ============================================

describe('validateField', () => {
  it('deve retornar valid:true para campos válidos', () => {
    const result = validateField(skillIdSchema, 'acrobacia');
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('deve retornar valid:false com mensagem de erro para campos inválidos', () => {
    const result = validateField(skillIdSchema, 'pericia-invalida');
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });
});

describe('validateAttributesForNex', () => {
  it('deve validar atributos corretamente para NEX 5', () => {
    const validAttrs = { agility: 2, strength: 2, intellect: 2, presence: 2, vigor: 1 };
    const result = validateAttributesForNex(validAttrs, 5, 9);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('deve retornar erros para atributos inválidos', () => {
    const invalidAttrs = { agility: 5, strength: 2, intellect: 2, presence: 2, vigor: 1 };
    const result = validateAttributesForNex(invalidAttrs, 5, 9);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('deve validar o total de pontos', () => {
    const wrongTotal = { agility: 1, strength: 1, intellect: 1, presence: 1, vigor: 1 };
    const result = validateAttributesForNex(wrongTotal, 5, 9);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.toLowerCase().includes('total'))).toBe(true);
  });
});
