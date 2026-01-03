/**
 * Constantes Centralizadas - Ordem Paranormal RPG
 * 
 * Este módulo exporta todas as constantes do sistema:
 * - game-ids: IDs de classes, trilhas, origens, patentes, elementos, NEX, perícias
 * - attributes: Definições de atributos (AGI, FOR, INT, PRE, VIG)
 * 
 * @module constants
 */

// =====================================================
// ATRIBUTOS (attributes.ts)
// =====================================================
export {
  // Tipos
  type AttributeKey as AttrKey,
  type AttributeDisplayData,
  type CharacterAttributes,
  
  // Arrays e constantes
  ATTRIBUTE_ORDER,
  ATTRIBUTE_NAMES,
  ATTRIBUTE_ABBR,
  ATTRIBUTE_COLORS,
  ATTRIBUTE_BG_COLORS,
  ATTRIBUTE_BORDER_COLORS,
  ATTRIBUTE_TEXT_COLORS,
  ATTRIBUTE_CARD_CLASSES,
  ATTRIBUTE_RING_COLORS,
  ATTRIBUTE_DISPLAY,
  ABBR_TO_KEY,
  NAME_TO_KEY,
  DEFAULT_ATTRIBUTES,
  
  // Funções utilitárias
  getAttributeName,
  getAttributeAbbr,
  getAttributeColor,
  getAttributeDisplay,
} from './attributes';

// =====================================================
// IDS DO SISTEMA (game-ids.ts)
// =====================================================
export {
  // Classes
  CLASS_IDS,
  VALID_CLASS_IDS,
  type ClassId,
  
  // Trilhas - Constantes
  COMBATENTE_TRACK_IDS,
  ESPECIALISTA_TRACK_IDS,
  OCULTISTA_TRACK_IDS,
  TRACKS_BY_CLASS,
  ALL_TRACK_IDS,
  type TrackId,
  
  // Origens - Constantes
  CORE_ORIGIN_IDS,
  SUPPLEMENT_ORIGIN_IDS,
  VALID_CORE_ORIGIN_IDS,
  VALID_SUPPLEMENT_ORIGIN_IDS,
  ALL_ORIGIN_IDS,
  type OriginId,
  
  // Patentes
  PATENT_IDS,
  VALID_PATENT_IDS,
  type PatentId,
  
  // NEX
  VALID_NEX_VALUES,
  type NexValue,
  
  // Perícias
  SKILL_IDS,
  VALID_SKILL_IDS,
  SKILLS_BY_ATTRIBUTE,
  INTELLECT_SKILL_IDS,
  type SkillId,
  type AttributeKey,
  
  // Elementos
  ELEMENT_IDS,
  VALID_ELEMENT_IDS,
  type ElementId,
  
  // Funções de validação
  isValidClassId,
  isValidTrackId,
  isValidTrackForClass,
  isValidElementId,
  isValidElementIdIgnoreCase,
  isValidOriginId,
  isValidNexValue,
  isValidSkillId,
  isValidPatentId,
  
  // Funções utilitárias
  getTracksForClass,
  normalizeElementId,
  getPatentIdByName,
  isSkillOfAttribute,
  getSkillAttribute,
} from './game-ids';
