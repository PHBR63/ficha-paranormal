/**
 * Constantes centralizadas de atributos do sistema Ordem Paranormal RPG
 * 
 * Este arquivo define todos os dados relacionados aos 5 atributos do sistema:
 * Agilidade, Força, Intelecto, Presença e Vigor
 * 
 * Uso: Importe estas constantes em qualquer componente que precise
 * exibir ou manipular atributos para garantir consistência.
 */

// Tipo para as chaves de atributo
export type AttributeKey = 'agility' | 'strength' | 'intellect' | 'presence' | 'vigor';

// Interface para dados de exibição de um atributo
export interface AttributeDisplayData {
  /** Nome completo em português (ex: "Agilidade") */
  name: string;
  /** Abreviação de 3 letras (ex: "AGI") */
  abbr: string;
  /** Cor CSS usando variável do design system */
  color: string;
  /** Cor de fundo com transparência */
  bgColor: string;
  /** Cor de borda com transparência */
  borderColor: string;
  /** Cor do texto */
  textColor: string;
  /** Classe combinada para cards */
  cardClass: string;
  /** Classe de ring para foco */
  ringColor: string;
  /** Descrição educativa do atributo conforme Ordem Paranormal RPG */
  description: string;
  /** Casos de uso típicos deste atributo */
  useCases: string[];
}

// Ordem padrão de exibição dos atributos
export const ATTRIBUTE_ORDER: AttributeKey[] = [
  'agility',
  'strength', 
  'intellect',
  'presence',
  'vigor'
];

// Nomes completos dos atributos em português
export const ATTRIBUTE_NAMES: Record<AttributeKey, string> = {
  agility: 'Agilidade',
  strength: 'Força',
  intellect: 'Intelecto',
  presence: 'Presença',
  vigor: 'Vigor',
};

// Abreviações dos atributos (3 letras)
export const ATTRIBUTE_ABBR: Record<AttributeKey, string> = {
  agility: 'AGI',
  strength: 'FOR',
  intellect: 'INT',
  presence: 'PRE',
  vigor: 'VIG',
};

// Cores dos atributos usando variáveis CSS do design system
export const ATTRIBUTE_COLORS: Record<AttributeKey, string> = {
  agility: 'hsl(var(--attr-agility))',
  strength: 'hsl(var(--attr-strength))',
  intellect: 'hsl(var(--attr-intellect))',
  presence: 'hsl(var(--attr-presence))',
  vigor: 'hsl(var(--attr-vigor))',
};

// Classes Tailwind para cores de fundo
export const ATTRIBUTE_BG_COLORS: Record<AttributeKey, string> = {
  agility: 'bg-blue-500/20',
  strength: 'bg-red-500/20',
  intellect: 'bg-yellow-500/20',
  presence: 'bg-purple-500/20',
  vigor: 'bg-green-500/20',
};

// Classes Tailwind para cores de borda
export const ATTRIBUTE_BORDER_COLORS: Record<AttributeKey, string> = {
  agility: 'border-blue-400/50',
  strength: 'border-red-400/50',
  intellect: 'border-yellow-400/50',
  presence: 'border-purple-400/50',
  vigor: 'border-green-400/50',
};

// Classes Tailwind para cores de texto
export const ATTRIBUTE_TEXT_COLORS: Record<AttributeKey, string> = {
  agility: 'text-blue-300',
  strength: 'text-red-300',
  intellect: 'text-yellow-300',
  presence: 'text-purple-300',
  vigor: 'text-green-300',
};

// Classes Tailwind combinadas para cards de atributo
export const ATTRIBUTE_CARD_CLASSES: Record<AttributeKey, string> = {
  agility: 'bg-blue-500/20 border-blue-400/50',
  strength: 'bg-red-500/20 border-red-400/50',
  intellect: 'bg-yellow-500/20 border-yellow-400/50',
  presence: 'bg-purple-500/20 border-purple-400/50',
  vigor: 'bg-green-500/20 border-green-400/50',
};

// Classes Tailwind para ring (foco/destaque)
export const ATTRIBUTE_RING_COLORS: Record<AttributeKey, string> = {
  agility: 'ring-blue-400',
  strength: 'ring-red-400',
  intellect: 'ring-yellow-400',
  presence: 'ring-purple-400',
  vigor: 'ring-green-400',
};

// Dados completos de exibição por atributo
export const ATTRIBUTE_DISPLAY: Record<AttributeKey, AttributeDisplayData> = {
  agility: {
    name: 'Agilidade',
    abbr: 'AGI',
    color: 'hsl(var(--attr-agility))',
    bgColor: 'bg-blue-500/20',
    borderColor: 'border-blue-400/50',
    textColor: 'text-blue-300',
    cardClass: ATTRIBUTE_CARD_CLASSES.agility,
    ringColor: ATTRIBUTE_RING_COLORS.agility,
    description: 'Representa reflexos, coordenação motora e capacidade de reagir rapidamente.',
    useCases: ['Defesa', 'Iniciativa', 'Acrobacia', 'Furtividade', 'Pontaria', 'Pilotagem', 'Reflexos'],
  },
  strength: {
    name: 'Força',
    abbr: 'FOR',
    color: 'hsl(var(--attr-strength))',
    bgColor: 'bg-red-500/20',
    borderColor: 'border-red-400/50',
    textColor: 'text-red-300',
    cardClass: ATTRIBUTE_CARD_CLASSES.strength,
    ringColor: ATTRIBUTE_RING_COLORS.strength,
    description: 'Representa poder físico, capacidade de causar dano corpo a corpo e resistência muscular.',
    useCases: ['Ataques corpo a corpo', 'Atletismo', 'Luta', 'Capacidade de carga'],
  },
  intellect: {
    name: 'Intelecto',
    abbr: 'INT',
    color: 'hsl(var(--attr-intellect))',
    bgColor: 'bg-yellow-500/20',
    borderColor: 'border-yellow-400/50',
    textColor: 'text-yellow-300',
    cardClass: ATTRIBUTE_CARD_CLASSES.intellect,
    ringColor: ATTRIBUTE_RING_COLORS.intellect,
    description: 'Representa capacidade de raciocínio, memória, conhecimento técnico e análise lógica.',
    useCases: ['Investigação', 'Medicina', 'Ciências', 'Tecnologia', 'Tática', 'Ocultismo'],
  },
  presence: {
    name: 'Presença',
    abbr: 'PRE',
    color: 'hsl(var(--attr-presence))',
    bgColor: 'bg-purple-500/20',
    borderColor: 'border-purple-400/50',
    textColor: 'text-purple-300',
    cardClass: ATTRIBUTE_CARD_CLASSES.presence,
    ringColor: ATTRIBUTE_RING_COLORS.presence,
    description: 'Representa força de personalidade, carisma, liderança e capacidade de influenciar outros.',
    useCases: ['Rituais', 'Diplomacia', 'Intimidação', 'Enganação', 'Intuição', 'Vontade'],
  },
  vigor: {
    name: 'Vigor',
    abbr: 'VIG',
    color: 'hsl(var(--attr-vigor))',
    bgColor: 'bg-green-500/20',
    borderColor: 'border-green-400/50',
    textColor: 'text-green-300',
    cardClass: ATTRIBUTE_CARD_CLASSES.vigor,
    ringColor: ATTRIBUTE_RING_COLORS.vigor,
    description: 'Representa resistência física, saúde, constituição e capacidade de suportar danos.',
    useCases: ['Pontos de Vida', 'Fortitude', 'Resistência a venenos', 'Resistência a doenças'],
  },
};

// Mapeamento reverso: abreviação -> chave
export const ABBR_TO_KEY: Record<string, AttributeKey> = {
  AGI: 'agility',
  FOR: 'strength',
  INT: 'intellect',
  PRE: 'presence',
  VIG: 'vigor',
};

// Mapeamento reverso: nome completo -> chave
export const NAME_TO_KEY: Record<string, AttributeKey> = {
  'Agilidade': 'agility',
  'Força': 'strength',
  'Intelecto': 'intellect',
  'Presença': 'presence',
  'Vigor': 'vigor',
};

/**
 * Utilitário: Obtém o nome completo de um atributo
 * Aceita chave (agility) ou abreviação (AGI)
 */
export function getAttributeName(keyOrAbbr: string): string {
  const key = ABBR_TO_KEY[keyOrAbbr] || keyOrAbbr as AttributeKey;
  return ATTRIBUTE_NAMES[key] || keyOrAbbr;
}

/**
 * Utilitário: Obtém a abreviação de um atributo
 * Aceita chave (agility) ou nome completo (Agilidade)
 */
export function getAttributeAbbr(keyOrName: string): string {
  const key = NAME_TO_KEY[keyOrName] || keyOrName as AttributeKey;
  return ATTRIBUTE_ABBR[key] || keyOrName;
}

/**
 * Utilitário: Obtém a cor CSS de um atributo
 */
export function getAttributeColor(key: AttributeKey, opacity?: number): string {
  if (opacity === undefined) return ATTRIBUTE_COLORS[key] || 'hsl(var(--foreground))';
  // Transparência pertence ao HSL; sufixos HEX como "20" invalidam essa cor.
  const variable = ATTRIBUTE_COLORS[key] ? `--attr-${key}` : '--foreground';
  const alpha = Number.isFinite(opacity) ? Math.min(1, Math.max(0, opacity)) : 1;
  return `hsl(var(${variable}) / ${alpha})`;
}

/**
 * Utilitário: Obtém os dados completos de exibição de um atributo
 */
export function getAttributeDisplay(key: AttributeKey): AttributeDisplayData {
  return ATTRIBUTE_DISPLAY[key];
}

/**
 * Tipo para interface de atributos do personagem
 */
export interface CharacterAttributes {
  agility: number;
  strength: number;
  intellect: number;
  presence: number;
  vigor: number;
}

/**
 * Valores padrão de atributos para um novo personagem
 */
export const DEFAULT_ATTRIBUTES: CharacterAttributes = {
  agility: 1,
  strength: 1,
  intellect: 1,
  presence: 1,
  vigor: 1,
};
