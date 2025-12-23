/**
 * Utilitários compartilhados para componentes mobile
 * Centraliza helpers de formatação, cores e mapeamentos
 * 
 * IDs centralizados em: src/lib/constants/game-ids.ts
 */

import { getSkillAttribute as getSkillAttr, type AttributeKey } from '@/lib/constants/game-ids';
import { getElementConfig } from '@/lib/element-config';

// ============= ATRIBUTOS =============

/**
 * Mapeamento de AttributeKey para abreviação de atributo
 */
export const ATTRIBUTE_ABBREV: Record<AttributeKey, string> = {
  agility: 'AGI',
  strength: 'FOR',
  intellect: 'INT',
  presence: 'PRE',
  vigor: 'VIG',
};

/**
 * Determina o atributo de cada perícia (usando função centralizada)
 * @param skill Nome da perícia
 * @returns Abreviação do atributo (AGI, FOR, INT, PRE, VIG)
 */
export function getSkillAttributeAbbrev(skill: string): string {
  // Normaliza a perícia removendo acentos para compatibilidade
  const normalized = skill.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  
  const attr = getSkillAttr(normalized);
  if (attr) {
    return ATTRIBUTE_ABBREV[attr];
  }
  
  // Fallback para perícias com acentos (compatibilidade com dados antigos)
  const legacyMap: Record<string, string> = {
    'ciências': 'INT', 'investigação': 'INT', 'profissão': 'INT',
    'sobrevivência': 'INT', 'tática': 'INT',
    'enganação': 'PRE', 'intimidação': 'PRE', 'intuição': 'PRE',
    'percepção': 'PRE',
  };
  return legacyMap[skill.toLowerCase()] || 'INT';
}

/**
 * Retorna classe de cor Tailwind para cada atributo
 * @param attr Abreviação do atributo (AGI, FOR, INT, PRE, VIG)
 * @returns Classes CSS para background e texto
 */
export function getAttributeColor(attr: string): string {
  const colors: Record<string, string> = {
    'AGI': 'bg-blue-500/20 text-blue-400',
    'FOR': 'bg-orange-500/20 text-orange-400',
    'INT': 'bg-purple-500/20 text-purple-400',
    'PRE': 'bg-pink-500/20 text-pink-400',
    'VIG': 'bg-green-500/20 text-green-400',
  };
  return colors[attr] || 'bg-muted text-muted-foreground';
}

// ============= ELEMENTOS PARANORMAIS =============

/**
 * Retorna ícone emoji para cada elemento paranormal
 * Usa config centralizado em lib/element-config.ts
 * @param element Nome do elemento
 * @returns Emoji representando o elemento
 */
export function getElementIcon(element: string): string {
  const config = getElementConfig(element);
  return config?.emoji || '✨';
}

/**
 * Retorna classes de cor para cada elemento paranormal
 * Usa config centralizado em lib/element-config.ts
 * @param element Nome do elemento
 * @returns Classes CSS para background e border
 */
export function getElementColor(element: string): string {
  const config = getElementConfig(element);
  if (config) {
    return `${config.bg} ${config.border}`;
  }
  return 'bg-paranormal/10 border-paranormal/30';
}

// ============= ITENS E INVENTÁRIO =============

/**
 * Retorna ícone emoji para tipo de item
 * @param type Tipo ou categoria do item
 * @returns Emoji representando o tipo
 */
export function getItemIcon(type: string): string {
  const icons: Record<string, string> = {
    'weapon': '⚔️',
    'armor': '🛡️',
    'medical': '💊',
    'investigation': '🔍',
    'communication': '📡',
    'field': '🎒',
    'paranormal': '✨',
    'document': '📄',
    'survival': '⛺',
    'I': '🟢',
    'II': '🔵',
    'III': '🟣',
    'IV': '🔴',
    '0': '⚪',
  };
  return icons[type] || '📦';
}

/**
 * Retorna classe de cor para categoria de item
 * @param category Categoria do item (0, I, II, III, IV)
 * @returns Classes CSS para background e texto
 */
export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    '0': 'bg-muted text-muted-foreground',
    'I': 'bg-green-500/20 text-green-400',
    'II': 'bg-blue-500/20 text-blue-400',
    'III': 'bg-purple-500/20 text-purple-400',
    'IV': 'bg-red-500/20 text-red-400',
  };
  return colors[category] || 'bg-muted text-muted-foreground';
}

// ============= TIPOS =============

/** Tipo de filtro para lista de perícias */
export type SkillFilter = 'all' | 'trained' | 'AGI' | 'FOR' | 'INT' | 'PRE' | 'VIG';

/** Tipo de ordenação para lista de perícias */
export type SkillSort = 'bonus' | 'alpha' | 'attribute';

// NOTA: Os tipos BonusSource e WeaponEntry são exportados de seus componentes originais:
// - BonusSource: src/components/character/mobile/MobileDiceRollModal.tsx
// - WeaponEntry: src/components/character/mobile/MobileCombatPanel.tsx
// Para evitar duplicação, importe diretamente desses módulos.
