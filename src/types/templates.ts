/**
 * Sistema de Templates de Personagem
 * Tipos TypeScript para templates de criação rápida
 * 
 * @module types/templates
 */

// ========================================
// Tipos de Dados do Template
// ========================================

/**
 * Estratégia de distribuição de atributos
 */
export type AttributeDistributionStrategy = 'balanced' | 'focused' | 'custom';

/**
 * Nível de dificuldade do template
 */
export type TemplateDifficulty = 'beginner' | 'intermediate' | 'advanced';

/**
 * Atributos do template com estratégia
 */
export interface TemplateAttributes {
  strength: number;
  agility: number;
  vigor: number;
  intellect: number;
  presence: number;
  distribution_strategy?: AttributeDistributionStrategy;
  notes?: string;
}

/**
 * Poder de classe com escolhas opcionais
 */
export interface TemplateClassPower {
  powerId: string;
  nex: number;
  choices?: Record<string, string>;
}

/**
 * Poder paranormal do template
 */
export interface TemplateParanormalPower {
  powerId: string;
  nex: number;
}

/**
 * Item de equipamento com quantidade
 */
export interface TemplateEquipmentItem {
  id: string;
  quantity: number;
}

/**
 * Equipamento inicial do template
 */
export interface TemplateEquipment {
  weapons: TemplateEquipmentItem[];
  armor?: string;
  items: TemplateEquipmentItem[];
}

/**
 * Sugestões de aparência do personagem
 */
export interface TemplateAppearance {
  suggested_name?: string;
  suggested_age?: string;
  suggested_background?: string;
  suggested_concept?: string;
}

/**
 * Sugestão de progressão por NEX
 */
export interface TemplateProgressionSuggestion {
  power?: string;
  ritual?: string;
  attribute_increase?: Record<string, number>;
  notes?: string;
}

/**
 * Progressão sugerida do template
 */
export interface TemplateProgression {
  nex: number;
  suggestions: TemplateProgressionSuggestion;
}

/**
 * Dados completos do template (JSONB)
 */
export interface CharacterTemplateData {
  /** ID da origem */
  origin: string;
  /** ID da classe */
  classId: string;
  /** ID da trilha de classe (pode ser null) */
  classTrack: string | null;
  /** Afinidade elemental para Ocultistas */
  elementalAffinity?: string;
  /** Configuração de atributos */
  attributes: TemplateAttributes;
  /** IDs das perícias treinadas */
  trainedSkills: string[];
  /** Escolhas de perícia de classe */
  classSkillChoices?: string[];
  /** Poderes de classe */
  classPowers: TemplateClassPower[];
  /** Poderes paranormais (opcional) */
  paranormalPowers?: TemplateParanormalPower[];
  /** Poderes gerais (opcional) */
  generalPowers?: string[];
  /** Rituais iniciais */
  initialRituals?: string[];
  /** Equipamento inicial */
  equipment: TemplateEquipment;
  /** Sugestões de aparência */
  appearance?: TemplateAppearance;
  /** Roadmap de progressão */
  progression?: TemplateProgression[];
  /** Versão do schema para migrações futuras */
  schema_version: number;
}

// ========================================
// Tipos de Entidade do Banco
// ========================================

/**
 * Template de personagem (tabela character_templates)
 */
export interface CharacterTemplate {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  description: string | null;
  author_id: string;
  is_public: boolean;
  is_official: boolean;
  tags: string[];
  difficulty_level: TemplateDifficulty | null;
  usage_count: number;
  rating: number | null;
  rating_count: number;
  template_data: CharacterTemplateData;
  min_nex: number;
  max_nex: number;
  deleted_at: string | null;
}

/**
 * Avaliação de template (tabela template_ratings)
 */
export interface TemplateRating {
  id: string;
  template_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

/**
 * Aplicação de template (tabela template_applications)
 */
export interface TemplateApplication {
  id: string;
  template_id: string;
  user_id: string;
  character_id: string | null;
  applied_at: string;
}

// ========================================
// Tipos de Filtro e Busca
// ========================================

/**
 * Filtros para busca de templates
 */
export interface TemplateFilters {
  classId?: string;
  trackId?: string;
  originId?: string;
  difficulty?: TemplateDifficulty;
  tags?: string[];
  authorId?: string;
  isOfficial?: boolean;
  search?: string;
  minNex?: number;
  maxNex?: number;
  sortBy?: TemplateSortOption;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Opções de ordenação
 */
export type TemplateSortOption = 
  | 'rating' 
  | 'usage_count' 
  | 'created_at' 
  | 'name';

// ========================================
// DTOs (Data Transfer Objects)
// ========================================

/**
 * DTO para criar um novo template
 */
export interface CreateTemplateDto {
  name: string;
  description?: string;
  is_public: boolean;
  tags: string[];
  difficulty_level?: TemplateDifficulty;
  template_data: CharacterTemplateData;
  min_nex?: number;
  max_nex?: number;
}

/**
 * DTO para atualizar um template
 */
export interface UpdateTemplateDto {
  name?: string;
  description?: string;
  is_public?: boolean;
  tags?: string[];
  difficulty_level?: TemplateDifficulty;
  template_data?: CharacterTemplateData;
  min_nex?: number;
  max_nex?: number;
}

/**
 * DTO para avaliar um template
 */
export interface RateTemplateDto {
  rating: number;
  comment?: string;
}

// ========================================
// Tipos de Resposta
// ========================================

/**
 * Template com informações do autor
 */
export interface TemplateWithAuthor extends CharacterTemplate {
  author?: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

/**
 * Resultado paginado de templates
 */
export interface PaginatedTemplates {
  templates: TemplateWithAuthor[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ========================================
// Tags Predefinidas
// ========================================

/**
 * Tags de função/papel
 */
export const ROLE_TAGS = [
  'tanque',
  'dps',
  'suporte',
  'controller',
  'face',
  'utilitário',
] as const;

/**
 * Tags de estilo de jogo
 */
export const STYLE_TAGS = [
  'melee',
  'ranged',
  'stealth',
  'social',
  'investigação',
  'paranormal',
  'híbrido',
] as const;

/**
 * Tags de tema
 */
export const THEME_TAGS = [
  'horror',
  'combate',
  'investigação',
  'infiltração',
  'diplomacia',
  'sobrevivência',
] as const;

/**
 * Todas as tags predefinidas
 */
export const ALL_TEMPLATE_TAGS = [
  ...ROLE_TAGS,
  ...STYLE_TAGS,
  ...THEME_TAGS,
] as const;

export type TemplateTag = typeof ALL_TEMPLATE_TAGS[number];

// ========================================
// Constantes de Dificuldade
// ========================================

/**
 * Mapeamento de dificuldade para label
 */
export const DIFFICULTY_LABELS: Record<TemplateDifficulty, string> = {
  beginner: 'Iniciante',
  intermediate: 'Intermediário',
  advanced: 'Avançado',
};

/**
 * Cores de dificuldade (classes Tailwind)
 */
export const DIFFICULTY_COLORS: Record<TemplateDifficulty, string> = {
  beginner: 'text-green-500 bg-green-500/10 border-green-500/30',
  intermediate: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30',
  advanced: 'text-red-500 bg-red-500/10 border-red-500/30',
};

// ========================================
// Versão atual do schema
// ========================================

export const TEMPLATE_SCHEMA_VERSION = 1;
