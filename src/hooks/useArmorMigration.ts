/**
 * Hook para migração automática de armaduras no inventário
 * Corrige armaduras existentes que não possuem defenseBonus ou rd
 * com base no catálogo oficial de armaduras
 */

import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ALL_ARMORS, CatalogArmor } from '@/lib/armor-catalog';

// Interface mínima para item de inventário com campos de armadura
interface ArmorInventoryItem {
  id?: string;
  name: string;
  itemType?: string;
  armorType?: string;
  defenseBonus?: number;
  rd?: number;
  agilityPenalty?: number;
  [key: string]: unknown;
}

// Mapeamento de nomes de armadura para dados do catálogo
const ARMOR_NAME_MAP: Record<string, CatalogArmor> = {};

// Popula o mapeamento com nomes normalizados
ALL_ARMORS.forEach(armor => {
  const normalizedName = armor.name.toLowerCase().trim();
  ARMOR_NAME_MAP[normalizedName] = armor;
});

/**
 * Encontra a armadura do catálogo pelo nome
 */
function findArmorByName(name: string): CatalogArmor | undefined {
  const normalizedName = name.toLowerCase().trim();
  
  // Busca exata
  if (ARMOR_NAME_MAP[normalizedName]) {
    return ARMOR_NAME_MAP[normalizedName];
  }
  
  // Busca parcial
  for (const armor of ALL_ARMORS) {
    if (normalizedName.includes(armor.name.toLowerCase()) ||
        armor.name.toLowerCase().includes(normalizedName)) {
      return armor;
    }
  }
  
  return undefined;
}

/**
 * Verifica se um item de inventário é uma armadura que precisa de migração
 */
function needsArmorMigration(item: ArmorInventoryItem): boolean {
  const isArmor = item.itemType === 'armor' || 
                  item.armorType !== undefined ||
                  item.name.toLowerCase().includes('proteção') ||
                  item.name.toLowerCase().includes('escudo');
  
  if (!isArmor) return false;
  
  // Precisa de migração se não tiver defenseBonus ou rd definidos
  return item.defenseBonus === undefined || item.defenseBonus === null;
}

/**
 * Corrige os dados de uma armadura com base no catálogo
 */
function migrateArmorItem(item: ArmorInventoryItem): ArmorInventoryItem {
  const catalogArmor = findArmorByName(item.name);
  
  if (!catalogArmor) {
    console.warn(`[ArmorMigration] Armadura não encontrada no catálogo: ${item.name}`);
    // Valores padrão seguros se não encontrar no catálogo
    return {
      ...item,
      defenseBonus: item.defenseBonus ?? 0,
      rd: item.rd ?? 0,
      agilityPenalty: item.agilityPenalty ?? 0,
      armorType: item.armorType ?? 'leve',
    };
  }
  
  console.log(`[ArmorMigration] Corrigindo armadura "${item.name}" com dados do catálogo:`, {
    defenseBonus: catalogArmor.defenseBonus,
    rd: catalogArmor.rd || 0,
    agilityPenalty: catalogArmor.agilityPenalty,
    armorType: catalogArmor.type,
  });
  
  return {
    ...item,
    defenseBonus: catalogArmor.defenseBonus,
    rd: catalogArmor.rd || 0,
    agilityPenalty: catalogArmor.agilityPenalty,
    armorType: catalogArmor.type,
    special: item.special || catalogArmor.special,
  };
}

/**
 * Hook para migração automática de armaduras
 */
export function useArmorMigration() {
  const migrationRanRef = useRef(false);

  /**
   * Migra todas as armaduras de um inventário
   * Retorna o inventário corrigido se houve mudanças, ou null se não houve
   */
  const migrateInventory = useCallback((inventory: ArmorInventoryItem[]): {
    needsMigration: boolean;
    migratedInventory: ArmorInventoryItem[];
    migratedCount: number;
  } => {
    let needsMigration = false;
    let migratedCount = 0;
    
    const migratedInventory = inventory.map(item => {
      if (needsArmorMigration(item)) {
        needsMigration = true;
        migratedCount++;
        return migrateArmorItem(item);
      }
      return item;
    });
    
    return { needsMigration, migratedInventory, migratedCount };
  }, []);

  /**
   * Executa a migração e persiste no banco de dados
   */
  /**
   * Resultado da migração com contagem
   */
  interface MigrationResult {
    inventory: ArmorInventoryItem[];
    count: number;
  }

  const runMigration = useCallback(async (
    characterId: string,
    inventory: ArmorInventoryItem[]
  ): Promise<MigrationResult | null> => {
    // Evita executar migração múltiplas vezes
    if (migrationRanRef.current) {
      return null;
    }

    const { needsMigration, migratedInventory, migratedCount } = migrateInventory(inventory);
    
    if (!needsMigration) {
      return null;
    }

    console.log(`[ArmorMigration] Migrando ${migratedCount} armadura(s) para o personagem ${characterId}`);
    
    // Persiste no banco
    const { error } = await supabase
      .from('characters')
      .update({ inventory: JSON.parse(JSON.stringify(migratedInventory)) })
      .eq('id', characterId);
    
    if (error) {
      console.error('[ArmorMigration] Erro ao salvar migração:', error);
      return null;
    }
    
    migrationRanRef.current = true;
    console.log('[ArmorMigration] Migração concluída com sucesso');
    
    return { inventory: migratedInventory, count: migratedCount };
  }, [migrateInventory]);

  /**
   * Reseta o estado de migração (útil quando mudar de personagem)
   */
  const resetMigration = useCallback(() => {
    migrationRanRef.current = false;
  }, []);

  return {
    migrateInventory,
    runMigration,
    resetMigration,
  };
}

/**
 * Valida e normaliza um item de armadura antes de salvar
 * Garante que defenseBonus e rd estejam sempre presentes
 */
export function validateArmorItem(item: ArmorInventoryItem): ArmorInventoryItem {
  // Se não for armadura, retorna sem modificação
  if (item.itemType !== 'armor' && !item.armorType) {
    return item;
  }

  // Busca no catálogo para obter valores corretos
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
  
  // Fallback com valores padrão seguros
  return {
    ...item,
    defenseBonus: item.defenseBonus ?? 0,
    rd: item.rd ?? 0,
    agilityPenalty: item.agilityPenalty ?? 0,
  };
}

/**
 * Valida um array inteiro de inventário
 */
export function validateInventoryArmors(inventory: ArmorInventoryItem[]): ArmorInventoryItem[] {
  return inventory.map(item => {
    if (item.itemType === 'armor' || item.armorType) {
      return validateArmorItem(item);
    }
    return item;
  });
}
