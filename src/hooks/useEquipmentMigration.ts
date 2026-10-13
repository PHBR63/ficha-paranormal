import { repairLegacyCatalogArmor, repairMissingWeaponFields } from '@/lib/legacy-modification-repair';
import { getWeaponById } from '@/lib/catalogs/weapons-catalog';
/**
 * Hook para migração automática de equipamentos no inventário
 * Corrige armaduras, armas e itens existentes que estejam com dados incompletos
 * com base nos catálogos oficiais
 */

import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ALL_ARMORS, ALL_WEAPONS, ALL_ITEMS, type CatalogArmor, type CatalogWeapon, type CatalogItem } from '@/lib/catalogs';

// Interface genérica para item de inventário
interface InventoryItem {
  id?: string;
  name: string;
  itemType?: string;
  // Campos de armadura
  armorType?: string;
  defenseBonus?: number;
  rd?: number;
  agilityPenalty?: number;
  // Campos de arma
  weaponType?: string;
  damage?: string;
  damageType?: string;
  critical?: number;
  criticalMultiplier?: number;
  range?: string;
  proficiency?: string;
  properties?: string[];
  // Campos de item geral
  category?: string;
  spaces?: number;
  effect?: string;
  consumable?: boolean;
  [key: string]: unknown;
}

// ==================== MAPEAMENTOS DE CATÁLOGO ====================

// Mapeamento de armaduras
const ARMOR_NAME_MAP: Record<string, CatalogArmor> = {};
ALL_ARMORS.forEach(armor => {
  ARMOR_NAME_MAP[armor.name.toLowerCase().trim()] = armor;
});

// Mapeamento de armas
const WEAPON_NAME_MAP: Record<string, CatalogWeapon> = {};
ALL_WEAPONS.forEach(weapon => {
  WEAPON_NAME_MAP[weapon.name.toLowerCase().trim()] = weapon;
});

// Mapeamento de itens
const ITEM_NAME_MAP: Record<string, CatalogItem> = {};
ALL_ITEMS.forEach(item => {
  ITEM_NAME_MAP[item.name.toLowerCase().trim()] = item;
});

// ==================== FUNÇÕES DE BUSCA ====================

function findArmorByName(name: string): CatalogArmor | undefined {
  const normalizedName = name.toLowerCase().trim();
  if (ARMOR_NAME_MAP[normalizedName]) return ARMOR_NAME_MAP[normalizedName];
  
  for (const armor of ALL_ARMORS) {
    if (normalizedName.includes(armor.name.toLowerCase()) ||
        armor.name.toLowerCase().includes(normalizedName)) {
      return armor;
    }
  }
  return undefined;
}

function findWeaponByName(name: string): CatalogWeapon | undefined {
  const normalizedName = name.toLowerCase().trim();
  if (WEAPON_NAME_MAP[normalizedName]) return WEAPON_NAME_MAP[normalizedName];
  
  for (const weapon of ALL_WEAPONS) {
    if (normalizedName.includes(weapon.name.toLowerCase()) ||
        weapon.name.toLowerCase().includes(normalizedName)) {
      return weapon;
    }
  }
  return undefined;
}

function findItemByName(name: string): CatalogItem | undefined {
  const normalizedName = name.toLowerCase().trim();
  if (ITEM_NAME_MAP[normalizedName]) return ITEM_NAME_MAP[normalizedName];
  
  for (const item of ALL_ITEMS) {
    if (normalizedName.includes(item.name.toLowerCase()) ||
        item.name.toLowerCase().includes(normalizedName)) {
      return item;
    }
  }
  return undefined;
}

// ==================== VERIFICAÇÃO DE MIGRAÇÃO ====================

function needsArmorMigration(item: InventoryItem): boolean {
  const isArmor = item.itemType === 'armor' || 
                  item.armorType !== undefined ||
                  item.name.toLowerCase().includes('proteção') ||
                  item.name.toLowerCase().includes('escudo');
  
  if (!isArmor) return false;
  return item.defenseBonus === undefined || item.defenseBonus === null;
}

function needsWeaponMigration(item: InventoryItem): boolean {
  const isWeapon = item.itemType === 'weapon' || 
                   item.weaponType !== undefined ||
                   item.damage !== undefined;
  
  if (!isWeapon) return false;
  
  // Precisa migração se faltar campos essenciais (incluindo weaponType)
  return item.damage === undefined || 
         item.damageType === undefined ||
         item.critical === undefined ||
         item.criticalMultiplier === undefined ||
         item.weaponType === undefined; // NOVO: verifica weaponType
}

function needsItemMigration(item: InventoryItem): boolean {
  const isGeneralItem = item.itemType === 'item' || item.itemType === 'general';
  
  if (!isGeneralItem) return false;
  
  // Precisa migração se faltar campos essenciais
  return item.spaces === undefined || item.category === undefined;
}

// ==================== FUNÇÕES DE MIGRAÇÃO ====================

function migrateArmorItem(item: InventoryItem): InventoryItem {
  const catalogArmor = findArmorByName(item.name);
  
  if (!catalogArmor) {
    console.warn(`[EquipmentMigration] Armadura não encontrada: ${item.name}`);
    return {
      ...item,
      defenseBonus: item.defenseBonus ?? 0,
      rd: item.rd ?? 0,
      agilityPenalty: item.agilityPenalty ?? 0,
      armorType: item.armorType ?? 'leve',
    };
  }
  
  console.log(`[EquipmentMigration] Corrigindo armadura "${item.name}"`);
  return {
    ...item,
    defenseBonus: catalogArmor.defenseBonus,
    rd: catalogArmor.rd || 0,
    agilityPenalty: catalogArmor.agilityPenalty,
    armorType: catalogArmor.type,
    special: item.special || catalogArmor.special,
  };
}

function migrateWeaponItem(item: InventoryItem): InventoryItem {
  const catalogWeapon = (typeof item.catalogId === 'string' ? getWeaponById(item.catalogId) : undefined) ?? findWeaponByName(item.name);
  
  if (!catalogWeapon) {
    console.warn(`[EquipmentMigration] Arma não encontrada: ${item.name}`);
    return {
      ...item,
      damage: item.damage ?? '1d4',
      damageType: item.damageType ?? 'Impacto',
      critical: item.critical ?? 20,
      criticalMultiplier: item.criticalMultiplier ?? 2,
      proficiency: item.proficiency ?? 'simples',
    };
  }
  
  console.log(`[EquipmentMigration] Corrigindo arma "${item.name}"`);
  return repairMissingWeaponFields(item, catalogWeapon);
}

function migrateGeneralItem(item: InventoryItem): InventoryItem {
  const catalogItem = findItemByName(item.name);
  
  if (!catalogItem) {
    console.warn(`[EquipmentMigration] Item não encontrado: ${item.name}`);
    return {
      ...item,
      spaces: item.spaces ?? 1,
      category: item.category ?? '0',
    };
  }
  
  console.log(`[EquipmentMigration] Corrigindo item "${item.name}"`);
  return {
    ...item,
    spaces: typeof catalogItem.spaces === 'number' ? catalogItem.spaces : 1,
    category: catalogItem.category,
    effect: item.effect || catalogItem.effect,
    consumable: catalogItem.consumable,
  };
}

// ==================== RESULTADO DA MIGRAÇÃO ====================

interface MigrationResult {
  inventory: InventoryItem[];
  armorCount: number;
  weaponCount: number;
  itemCount: number;
  totalCount: number;
}

// ==================== HOOK PRINCIPAL ====================

export function useEquipmentMigration() {
  const migrationRanRef = useRef(false);

  const migrateInventory = useCallback((inventory: InventoryItem[]): {
    needsMigration: boolean;
    migratedInventory: InventoryItem[];
    armorCount: number;
    weaponCount: number;
    itemCount: number;
  } => {
    let needsMigration = false;
    let armorCount = 0;
    let weaponCount = 0;
    let itemCount = 0;
    
    const migratedInventory = inventory.map(item => {
      const repaired = repairLegacyCatalogArmor(item);
      if (repaired !== item) { needsMigration = true; armorCount++; return repaired; }
      if (needsArmorMigration(item)) {
        needsMigration = true;
        armorCount++;
        return migrateArmorItem(item);
      }
      if (needsWeaponMigration(item)) {
        needsMigration = true;
        weaponCount++;
        return migrateWeaponItem(item);
      }
      if (needsItemMigration(item)) {
        needsMigration = true;
        itemCount++;
        return migrateGeneralItem(item);
      }
      return item;
    });
    
    return { needsMigration, migratedInventory, armorCount, weaponCount, itemCount };
  }, []);

  const runMigration = useCallback(async (
    characterId: string,
    inventory: InventoryItem[]
  ): Promise<MigrationResult | null> => {
    if (migrationRanRef.current) {
      return null;
    }

    const { needsMigration, migratedInventory, armorCount, weaponCount, itemCount } = migrateInventory(inventory);
    
    if (!needsMigration) {
      return null;
    }

    const totalCount = armorCount + weaponCount + itemCount;
    console.log(`[EquipmentMigration] Migrando ${totalCount} item(ns) para ${characterId}`);
    
    const { error } = await supabase
      .from('characters')
      .update({ inventory: JSON.parse(JSON.stringify(migratedInventory)) })
      .eq('id', characterId);
    
    if (error) {
      console.error('[EquipmentMigration] Erro ao salvar:', error);
      return null;
    }
    
    migrationRanRef.current = true;
    console.log('[EquipmentMigration] Migração concluída');
    
    return { inventory: migratedInventory, armorCount, weaponCount, itemCount, totalCount };
  }, [migrateInventory]);

  const resetMigration = useCallback(() => {
    migrationRanRef.current = false;
  }, []);

  return { migrateInventory, runMigration, resetMigration };
}

// ==================== FUNÇÕES DE VALIDAÇÃO (para uso em adição de itens) ====================

export function validateArmorItem(item: InventoryItem): InventoryItem {
  if (item.itemType !== 'armor' && !item.armorType) return item;

  const catalogArmor = findArmorByName(item.name);
  if (catalogArmor) {
    return {
      ...item,
      defenseBonus: item.defenseBonus ?? catalogArmor.defenseBonus,
      rd: item.rd ?? (catalogArmor.rd || 0),
      agilityPenalty: item.agilityPenalty ?? catalogArmor.agilityPenalty,
      armorType: item.armorType ?? catalogArmor.type,
    };
  }
  
  return {
    ...item,
    defenseBonus: item.defenseBonus ?? 0,
    rd: item.rd ?? 0,
    agilityPenalty: item.agilityPenalty ?? 0,
  };
}

export function validateWeaponItem(item: InventoryItem): InventoryItem {
  if (item.itemType !== 'weapon' && !item.weaponType && !item.damage) return item;

  const catalogWeapon = (typeof item.catalogId === 'string' ? getWeaponById(item.catalogId) : undefined) ?? findWeaponByName(item.name);
  if (catalogWeapon) {
    return repairMissingWeaponFields(item, catalogWeapon);
  }
  
  return {
    ...item,
    damage: item.damage ?? '1d4',
    damageType: item.damageType ?? 'Impacto',
    critical: item.critical ?? 20,
    criticalMultiplier: item.criticalMultiplier ?? 2,
  };
}

export function validateGeneralItem(item: InventoryItem): InventoryItem {
  if (item.itemType !== 'item' && item.itemType !== 'general') return item;

  const catalogItem = findItemByName(item.name);
  if (catalogItem) {
    return {
      ...item,
      spaces: item.spaces ?? (typeof catalogItem.spaces === 'number' ? catalogItem.spaces : 1),
      category: item.category ?? catalogItem.category,
      effect: item.effect ?? catalogItem.effect,
      consumable: item.consumable ?? catalogItem.consumable,
    };
  }
  
  return {
    ...item,
    spaces: item.spaces ?? 1,
    category: item.category ?? '0',
  };
}

export function validateInventoryItem(item: InventoryItem): InventoryItem {
  if (item.itemType === 'armor' || item.armorType) {
    return validateArmorItem(item);
  }
  if (item.itemType === 'weapon' || item.weaponType || item.damage) {
    return validateWeaponItem(item);
  }
  if (item.itemType === 'item' || item.itemType === 'general') {
    return validateGeneralItem(item);
  }
  return item;
}

export function validateInventoryItems(inventory: InventoryItem[]): InventoryItem[] {
  return inventory.map(validateInventoryItem);
}
