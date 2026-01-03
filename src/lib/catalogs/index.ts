/**
 * Catálogos de Equipamentos - Ordem Paranormal RPG
 * 
 * Este módulo centraliza todos os catálogos de equipamentos do jogo:
 * - Armas (corpo a corpo, distância, fogo)
 * - Proteções (leve, pesada, escudo)
 * - Itens gerais (acessórios, explosivos, operacionais, paranormais)
 * - Itens amaldiçoados (suplemento Sobrevivendo ao Horror)
 * 
 * @module catalogs
 */

// =====================================================
// ARMAS
// =====================================================
export {
  // Tipos
  type DamageType,
  type RangeType,
  type AmmoType,
  type MeleeWeaponModification,
  type FirearmModification,
  type WeaponModification,
  type WeaponModificationData,
  type CatalogWeapon,
  
  // Modificações
  MELEE_WEAPON_MODIFICATIONS,
  FIREARM_MODIFICATIONS,
  MODIFICATION_LABELS,
  
  // Catálogos de armas
  MELEE_WEAPONS,
  RANGED_WEAPONS,
  FIREARMS,
  THROWN_WEAPONS,
  SPECIAL_WEAPONS,
  ALL_WEAPONS,
  
  // Labels e helpers
  PROFICIENCY_LABELS,
  
  // Funções utilitárias
  getWeaponById,
  getWeaponsByCategory,
  getWeaponsByProficiency,
  getWeaponModificationById,
  canApplyModification,
  getAvailableModifications,
  getModifiedCategory,
  calculateModifiedWeaponStats,
} from './weapons-catalog';

// =====================================================
// PROTEÇÕES
// =====================================================
export {
  // Tipos
  type ArmorModification,
  type ArmorModificationData,
  type CatalogArmor,
  
  // Modificações
  ARMOR_MODIFICATIONS,
  ARMOR_TYPE_LABELS,
  
  // Catálogos
  BASE_ARMORS,
  MODIFIED_ARMORS,
  ALL_ARMORS,
  
  // Funções utilitárias
  getArmorById,
  getArmorTypeName,
  formatPenalties,
  getModificationById as getArmorModificationById,
  calculateModifiedStats as calculateModifiedArmorStats,
} from './armor-catalog';

// =====================================================
// ITENS GERAIS
// =====================================================
export {
  // Tipos
  type ItemType,
  type ParanormalElement as ItemParanormalElement,
  type CatalogItem,
  
  // Catálogos por categoria
  ACCESSORIES,
  EXPLOSIVES,
  OPERATIONAL_ITEMS,
  PARANORMAL_ITEMS,
  AMMUNITION,
  ALL_ITEMS,
  
  // Labels
  ITEM_TYPE_LABELS,
  ELEMENT_COLORS,
  PARANORMAL_ELEMENTS,
  
  // Funções utilitárias
  getItemById,
  getItemsByType,
  getItemTypeName,
} from './items-catalog';

// =====================================================
// ITENS AMALDIÇOADOS
// =====================================================
export {
  // Tipos
  type CursedItem,
  
  // Catálogo
  CURSED_ITEMS,
  
  // Funções utilitárias
  getCursedItemById,
  getItemsByCategory as getCursedItemsByCategory,
  getItemsByElement as getCursedItemsByElement,
  getCategoryLabel as getCursedCategoryLabel,
} from './cursed-items';
