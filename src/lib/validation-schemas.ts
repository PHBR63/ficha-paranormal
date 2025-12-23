/**
 * Schemas de validação Zod centralizados para criação de personagem
 * Garante consistência e segurança nos dados de entrada
 */

import { z } from 'zod';

// ============================================
// SCHEMAS DE CAMPOS DE TEXTO (StepConcept)
// ============================================

export const conceptFieldsSchema = z.object({
  name: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'Nome deve conter apenas letras, espaços e hífens')
    .optional()
    .or(z.literal('')),
  playerName: z.string()
    .max(100, 'Nome do jogador deve ter no máximo 100 caracteres')
    .optional()
    .or(z.literal('')),
  concept: z.string()
    .max(200, 'Conceito deve ter no máximo 200 caracteres')
    .optional()
    .or(z.literal('')),
  gender: z.string()
    .max(50, 'Gênero deve ter no máximo 50 caracteres')
    .optional()
    .or(z.literal('')),
  appearance: z.string()
    .max(500, 'Aparência deve ter no máximo 500 caracteres')
    .optional()
    .or(z.literal('')),
  personality: z.string()
    .max(500, 'Personalidade deve ter no máximo 500 caracteres')
    .optional()
    .or(z.literal('')),
  background: z.string()
    .max(2000, 'Histórico deve ter no máximo 2000 caracteres')
    .optional()
    .or(z.literal('')),
});

// ============================================
// SCHEMAS DE ATRIBUTOS (StepAttributes)
// ============================================

// Valores válidos de atributo base (0-5, dependendo do NEX)
const attributeValue = z.number().int().min(0).max(5);

export const attributesSchema = z.object({
  agility: attributeValue,
  strength: attributeValue,
  intellect: attributeValue,
  presence: attributeValue,
  vigor: attributeValue,
}).refine(
  // Regra: no máximo 1 atributo pode ser 0
  (attrs) => {
    const zeroCount = Object.values(attrs).filter(v => v === 0).length;
    return zeroCount <= 1;
  },
  { message: 'Apenas um atributo pode ser reduzido a 0' }
);

// Validador dinâmico baseado no NEX
export function createAttributesSchemaForNex(nex: number, maxPoints: number) {
  const maxAttr = nex <= 15 ? 3 : nex <= 35 ? 4 : 5;
  
  return z.object({
    agility: z.number().int().min(0).max(maxAttr),
    strength: z.number().int().min(0).max(maxAttr),
    intellect: z.number().int().min(0).max(maxAttr),
    presence: z.number().int().min(0).max(maxAttr),
    vigor: z.number().int().min(0).max(maxAttr),
  }).refine(
    (attrs) => {
      const total = Object.values(attrs).reduce((a, b) => a + b, 0);
      return total === maxPoints;
    },
    { message: `O total de pontos deve ser exatamente ${maxPoints}` }
  ).refine(
    (attrs) => {
      const zeroCount = Object.values(attrs).filter(v => v === 0).length;
      return zeroCount <= 1;
    },
    { message: 'Apenas um atributo pode ser reduzido a 0' }
  );
}

// ============================================
// SCHEMAS DE PERÍCIAS (StepSkills)
// ============================================

// IDs válidos de perícias do sistema
export const VALID_SKILL_IDS = [
  'acrobacia', 'adestramento', 'arte', 'atletismo', 'atualidades',
  'ciencias', 'crime', 'diplomacia', 'enganacao', 'fortitude',
  'furtividade', 'iniciativa', 'intimidacao', 'intuicao', 'investigacao',
  'luta', 'medicina', 'ocultismo', 'percepcao', 'pilotagem',
  'pontaria', 'profissao', 'reflexos', 'religiao', 'sobrevivencia',
  'tatica', 'tecnologia', 'vontade',
] as const;

export type ValidSkillId = typeof VALID_SKILL_IDS[number];

export const skillIdSchema = z.enum(VALID_SKILL_IDS);

export const skillsSelectionSchema = z.object({
  freeSkills: z.array(skillIdSchema).max(10, 'Máximo de 10 perícias livres'),
  classSkillChoices: z.record(z.string(), skillIdSchema),
  conflictResolutions: z.record(skillIdSchema, skillIdSchema),
});

// ============================================
// SCHEMAS DE CLASSE E ORIGEM
// ============================================

export const validClasses = ['combatente', 'especialista', 'ocultista'] as const;
export const classSchema = z.enum(validClasses);

export const validOrigins = [
  'academico', 'agente-de-saude', 'amnésico', 'artista', 'atleta',
  'chef', 'criminoso', 'culto-afro', 'desgarrado', 'diplomata',
  'engenheiro', 'executivo', 'investigador', 'lutador', 'magnata',
  'mercenario', 'militar', 'operario', 'politico', 'religioso',
  'servidor-publico', 'teórico-da-conspiração', 'ti', 'trabalhador-rural',
  'trambiqueiro', 'universitario', 'vitima',
] as const;
export const originSchema = z.enum(validOrigins);

// ============================================
// SCHEMAS DE TRILHAS
// ============================================

export const validTracks = {
  combatente: ['aniquilador', 'comandante-de-campo', 'guerreiro', 'operacoes-especiais', 'tropa-de-choque'],
  especialista: ['atiradordeelite', 'infiltrador', 'medico-de-campo', 'negociador', 'tecnico'],
  ocultista: ['conduite', 'flagelador', 'graduado', 'intuitivo', 'lâmina-paranormal'],
} as const;

export function getTrackSchema(characterClass: typeof validClasses[number]) {
  const tracks = validTracks[characterClass];
  return z.enum(tracks as unknown as [string, ...string[]]);
}

// ============================================
// SCHEMAS DE NEX E PATENTE
// ============================================

export const validNexValues = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 99] as const;
export const nexSchema = z.number().refine(
  (val) => validNexValues.includes(val as typeof validNexValues[number]),
  { message: 'NEX deve ser um valor válido (5%, 10%, 15%, ..., 99%)' }
);

export const validPatents = ['recruta', 'operador', 'agente-especial', 'oficial-de-operacoes', 'agente-de-elite'] as const;
export const patentSchema = z.enum(validPatents);

// ============================================
// SCHEMA COMPLETO DO PERSONAGEM (para validação final)
// ============================================

export const characterFormSchema = z.object({
  // Conceito
  name: z.string().min(2).max(100),
  playerName: z.string().max(100).optional(),
  concept: z.string().max(200).optional(),
  age: z.number().int().min(15).max(99).nullable(),
  gender: z.string().max(50).optional(),
  appearance: z.string().max(500).optional(),
  personality: z.string().max(500).optional(),
  background: z.string().max(2000).optional(),
  photoUrl: z.string().url().nullable().optional(),
  
  // Mecânicas base
  nex: nexSchema,
  patent: patentSchema,
  origin: originSchema,
  characterClass: classSchema,
  classTrack: z.string().optional(),
  
  // Atributos
  attributes: attributesSchema,
  
  // Perícias
  freeSkills: z.array(skillIdSchema),
  classSkillChoices: z.record(z.string(), skillIdSchema),
  conflictResolutions: z.record(z.string(), skillIdSchema),
});

// ============================================
// HELPERS DE VALIDAÇÃO
// ============================================

export type ConceptFields = z.infer<typeof conceptFieldsSchema>;
export type AttributesData = z.infer<typeof attributesSchema>;
export type SkillsSelection = z.infer<typeof skillsSelectionSchema>;
export type CharacterFormSchema = z.infer<typeof characterFormSchema>;

/**
 * Valida um campo individual e retorna erro se houver
 */
export function validateField<T extends z.ZodSchema>(
  schema: T,
  value: unknown
): { valid: boolean; error?: string } {
  const result = schema.safeParse(value);
  if (result.success) {
    return { valid: true };
  }
  return { 
    valid: false, 
    error: result.error.errors[0]?.message || 'Campo inválido' 
  };
}

/**
 * Valida atributos com regras dinâmicas baseadas no NEX
 */
export function validateAttributesForNex(
  attributes: Record<string, number>,
  nex: number,
  maxPoints: number
): { valid: boolean; errors: string[] } {
  const schema = createAttributesSchemaForNex(nex, maxPoints);
  const result = schema.safeParse(attributes);
  
  if (result.success) {
    return { valid: true, errors: [] };
  }
  
  return {
    valid: false,
    errors: result.error.errors.map(e => e.message),
  };
}
