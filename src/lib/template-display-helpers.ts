/**
 * Helpers para exibição de dados de templates
 * Converte IDs internos em nomes formatados para exibição
 * 
 * @module lib/template-display-helpers
 */

import { ORIGINS, CLASSES, CLASS_TRACKS, SKILLS } from './character-data';
import { ALL_TRACKS } from './class-powers/track-registry';
import { ATTRIBUTE_NAMES, ATTRIBUTE_ABBR, type AttributeKey } from './constants/attributes';

/**
 * Retorna o nome formatado de uma origem pelo ID
 */
export function getOriginDisplayName(originId: string): string {
  const origin = ORIGINS.find(o => o.id === originId || o.id.toLowerCase() === originId.toLowerCase());
  return origin?.name || originId;
}

/**
 * Retorna o nome formatado de uma classe pelo ID
 */
export function getClassDisplayName(classId: string): string {
  const normalizedId = classId?.toLowerCase();
  const classData = CLASSES.find(c => c.id.toLowerCase() === normalizedId);
  
  if (classData) return classData.name;
  
  // Fallback para capitalizar
  switch (normalizedId) {
    case 'combatente': return 'Combatente';
    case 'especialista': return 'Especialista';
    case 'ocultista': return 'Ocultista';
    default: return classId || 'Desconhecido';
  }
}

/**
 * Retorna o nome formatado de uma trilha pelo ID
 */
export function getTrackDisplayName(trackId: string): string {
  // Busca no registro unificado
  const track = ALL_TRACKS.find(t => t.id === trackId || t.id.toLowerCase() === trackId.toLowerCase());
  if (track) return track.name;
  
  // Fallback para CLASS_TRACKS legado
  const legacyTrack = CLASS_TRACKS.find(t => t.id === trackId || t.id.toLowerCase() === trackId.toLowerCase());
  if (legacyTrack) return legacyTrack.name;
  
  // Formata o ID como fallback
  return trackId?.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || '';
}

/**
 * Retorna o nome formatado de uma perícia pelo ID
 */
export function getSkillDisplayName(skillId: string): string {
  const skill = SKILLS.find(s => s.id === skillId || s.id.toLowerCase() === skillId.toLowerCase());
  return skill?.name || skillId?.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || '';
}

/**
 * Retorna a sigla de um atributo
 */
export function getAttributeAbbreviation(key: string): string {
  const normalizedKey = key.toLowerCase() as AttributeKey;
  return ATTRIBUTE_ABBR[normalizedKey] || key.toUpperCase().slice(0, 3);
}

/**
 * Retorna o nome completo de um atributo
 */
export function getAttributeDisplayName(key: string): string {
  const normalizedKey = key.toLowerCase() as AttributeKey;
  return ATTRIBUTE_NAMES[normalizedKey] || key;
}

/**
 * Mapeamento de elementos para nomes em português
 */
const ELEMENT_NAMES: Record<string, string> = {
  'sangue': 'Sangue',
  'morte': 'Morte',
  'energia': 'Energia',
  'conhecimento': 'Conhecimento',
  'medo': 'Medo',
  'blood': 'Sangue',
  'death': 'Morte',
  'energy': 'Energia',
  'knowledge': 'Conhecimento',
  'fear': 'Medo',
};

/**
 * Retorna o nome formatado de um elemento pelo ID
 */
export function getElementDisplayName(elementId: string): string {
  const normalized = elementId?.toLowerCase() || '';
  return ELEMENT_NAMES[normalized] || elementId?.replace(/\b\w/g, c => c.toUpperCase()) || '';
}

/**
 * Cores de elementos para exibição
 */
export const ELEMENT_COLORS: Record<string, string> = {
  'sangue': 'text-red-500',
  'morte': 'text-gray-500',
  'energia': 'text-yellow-500',
  'conhecimento': 'text-blue-500',
  'medo': 'text-purple-500',
  'blood': 'text-red-500',
  'death': 'text-gray-500',
  'energy': 'text-yellow-500',
  'knowledge': 'text-blue-500',
  'fear': 'text-purple-500',
};

/**
 * Retorna a classe de cor para um elemento
 */
export function getElementColorClass(elementId: string): string {
  const normalized = elementId?.toLowerCase() || '';
  return ELEMENT_COLORS[normalized] || 'text-primary';
}

/**
 * Formata lista de perícias para exibição compacta
 */
export function formatSkillsList(skills: string[], maxVisible: number = 4): { visible: string[]; remaining: number } {
  const formatted = skills.map(getSkillDisplayName);
  const visible = formatted.slice(0, maxVisible);
  const remaining = Math.max(0, formatted.length - maxVisible);
  return { visible, remaining };
}

/**
 * Formata lista de poderes para exibição
 */
export function formatPowersList(powers: Array<{ id: string; name: string } | string>): string[] {
  return powers.map(p => {
    if (typeof p === 'string') return p;
    return p.name || p.id;
  });
}

/**
 * Cores de atributos para highlight
 */
export const ATTRIBUTE_HIGHLIGHT_COLORS: Record<string, string> = {
  agility: 'bg-blue-500/20 border-blue-400/50 text-blue-400',
  strength: 'bg-red-500/20 border-red-400/50 text-red-400',
  vigor: 'bg-green-500/20 border-green-400/50 text-green-400',
  intellect: 'bg-yellow-500/20 border-yellow-400/50 text-yellow-400',
  presence: 'bg-purple-500/20 border-purple-400/50 text-purple-400',
};

/**
 * Retorna a classe de highlight para um atributo
 */
export function getAttributeHighlightClass(key: string, value: number, threshold: number = 2): string {
  const normalizedKey = key.toLowerCase();
  if (value >= threshold && ATTRIBUTE_HIGHLIGHT_COLORS[normalizedKey]) {
    return ATTRIBUTE_HIGHLIGHT_COLORS[normalizedKey];
  }
  return 'bg-muted/30 border-border text-muted-foreground';
}
