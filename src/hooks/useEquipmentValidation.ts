/**
 * useEquipmentValidation - Hook para validação de equipamento
 * 
 * Valida regras de equipamento como:
 * - Armas de duas mãos bloqueiam arma secundária e escudo
 * - Escudos ocupam uma mão
 * - Calcula penalidades totais de armadura
 */

import { useMemo } from 'react';
import { EquipmentSlotType } from '@/components/inventory/EquipmentSlots';
import { InventoryItem } from '@/lib/inventory-system';

// Interface para itens com dados de combate
interface CombatInventoryItem extends InventoryItem {
  itemType?: string;
  equipSlot?: EquipmentSlotType;
  properties?: string[];
  rd?: number;
  agilityPenalty?: number;
  speedPenalty?: number;
  armorType?: 'leve' | 'pesada' | 'escudo';
  special?: string;
}

// Resultado da validação de equipamento
interface EquipmentValidation {
  // Arma principal é de duas mãos?
  isPrimaryTwoHanded: boolean;
  // Slots bloqueados
  blockedSlots: EquipmentSlotType[];
  // Penalidades totais de armadura
  totalArmorRD: number;
  totalAgilityPenalty: number;
  totalSpeedPenalty: number;
  // Bônus de defesa de escudo
  shieldDefenseBonus: number;
  // Itens equipados por slot
  equippedItems: Record<EquipmentSlotType, CombatInventoryItem | null>;
}

/**
 * Hook para validar e calcular estatísticas de equipamento
 */
export function useEquipmentValidation(inventory: CombatInventoryItem[]): EquipmentValidation {
  return useMemo(() => {
    // Mapear itens equipados
    const equippedItems: Record<EquipmentSlotType, CombatInventoryItem | null> = {
      primary_weapon: null,
      secondary_weapon: null,
      armor: null,
      shield: null,
      accessory_1: null,
      accessory_2: null,
    };

    inventory.forEach(item => {
      if (item.isEquipped && item.equipSlot) {
        equippedItems[item.equipSlot] = item;
      }
    });

    // Verificar se arma principal é de duas mãos
    const primaryWeapon = equippedItems.primary_weapon;
    const isPrimaryTwoHanded = primaryWeapon?.properties?.some(prop => 
      prop.toLowerCase().includes('duas mãos') || 
      prop.toLowerCase().includes('duas maos')
    ) ?? false;

    // Determinar slots bloqueados
    const blockedSlots: EquipmentSlotType[] = [];
    if (isPrimaryTwoHanded) {
      blockedSlots.push('secondary_weapon', 'shield');
    }

    // Calcular penalidades de armadura (apenas do slot 'armor', não do escudo)
    const armor = equippedItems.armor;
    let totalArmorRD = armor?.rd ?? 0;
    let totalAgilityPenalty = armor?.agilityPenalty ?? 0;
    let totalSpeedPenalty = armor?.speedPenalty ?? 0;

    // Calcular bônus de defesa do escudo
    let shieldDefenseBonus = 0;
    const shield = equippedItems.shield;
    if (shield?.special) {
      const match = shield.special.match(/Defesa \+(\d+)/i);
      if (match) {
        shieldDefenseBonus = parseInt(match[1]);
      }
    }
    // Adicionar penalidades do escudo também
    if (shield) {
      totalAgilityPenalty += shield.agilityPenalty ?? 0;
      totalSpeedPenalty += shield.speedPenalty ?? 0;
    }

    return {
      isPrimaryTwoHanded,
      blockedSlots,
      totalArmorRD,
      totalAgilityPenalty,
      totalSpeedPenalty,
      shieldDefenseBonus,
      equippedItems,
    };
  }, [inventory]);
}

/**
 * Função utilitária para verificar se um item pode ser equipado
 */
export function canEquipItem(
  item: CombatInventoryItem,
  equippedItems: Record<EquipmentSlotType, CombatInventoryItem | null>,
  isPrimaryTwoHanded: boolean
): { canEquip: boolean; reason?: string; targetSlot?: EquipmentSlotType } {
  const itemType = item.itemType || 'misc';

  // Para armas
  if (itemType === 'weapon') {
    const isTwoHanded = item.properties?.some(prop => 
      prop.toLowerCase().includes('duas mãos') || 
      prop.toLowerCase().includes('duas maos')
    ) ?? false;

    if (isTwoHanded) {
      // Arma de duas mãos precisa que primário esteja vazio
      if (equippedItems.primary_weapon) {
        return { 
          canEquip: false, 
          reason: 'Desequipe a arma principal primeiro' 
        };
      }
      return { canEquip: true, targetSlot: 'primary_weapon' };
    }

    // Arma de uma mão
    if (!equippedItems.primary_weapon) {
      return { canEquip: true, targetSlot: 'primary_weapon' };
    }
    
    if (isPrimaryTwoHanded) {
      return { 
        canEquip: false, 
        reason: 'Arma principal ocupa as duas mãos' 
      };
    }
    
    if (!equippedItems.secondary_weapon) {
      return { canEquip: true, targetSlot: 'secondary_weapon' };
    }
    
    return { 
      canEquip: false, 
      reason: 'Todos os slots de arma estão ocupados' 
    };
  }

  // Para armaduras
  if (itemType === 'armor') {
    if (item.armorType === 'escudo') {
      if (isPrimaryTwoHanded) {
        return { 
          canEquip: false, 
          reason: 'Arma principal ocupa as duas mãos' 
        };
      }
      if (equippedItems.shield) {
        return { 
          canEquip: false, 
          reason: 'Já há um escudo equipado' 
        };
      }
      return { canEquip: true, targetSlot: 'shield' };
    }
    
    // Armadura normal
    if (equippedItems.armor) {
      return { 
        canEquip: false, 
        reason: 'Já há uma proteção equipada' 
      };
    }
    return { canEquip: true, targetSlot: 'armor' };
  }

  // Para acessórios
  if (!equippedItems.accessory_1) {
    return { canEquip: true, targetSlot: 'accessory_1' };
  }
  if (!equippedItems.accessory_2) {
    return { canEquip: true, targetSlot: 'accessory_2' };
  }
  
  return { 
    canEquip: false, 
    reason: 'Todos os slots de acessório estão ocupados' 
  };
}

export default useEquipmentValidation;
