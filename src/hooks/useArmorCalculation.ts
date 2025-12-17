/**
 * Hook para cálculo de proteção baseado em equipamentos
 * Calcula RD total, penalidades e bônus de defesa das proteções equipadas
 * 
 * Regras corrigidas:
 * - Armaduras (leve/pesada) dão RD e podem ter penalidades
 * - Escudos dão bônus de defesa (não RD) e podem ter penalidades
 */

import { useMemo } from 'react';

// Interface para item de proteção equipado
export interface ArmorStats {
  rd: number;
  defenseBonus: number;
  agilityPenalty: number;
  speedPenalty: number;
  armorType?: string;
  special?: string;
}

// Interface para resultado do cálculo
export interface ProtectionCalculation {
  // RD apenas de armaduras (não escudos)
  totalRD: number;
  // Bônus de defesa das armaduras (Proteção Leve +5, Proteção Pesada +10)
  armorDefenseBonus: number;
  // Penalidades somadas (armadura + escudo)
  totalAgilityPenalty: number;
  totalSpeedPenalty: number;
  // Bônus de defesa do escudo (+2)
  shieldDefenseBonus: number;
  // Armaduras equipadas
  equippedArmors: Array<{
    name: string;
    rd: number;
    defenseBonus: number;
    agilityPenalty: number;
    speedPenalty: number;
    type: string;
  }>;
  // Escudo equipado
  equippedShield: {
    name: string;
    defenseBonus: number;
    agilityPenalty: number;
    speedPenalty: number;
  } | null;
  // Valores efetivos (com bônus de armadura + escudo)
  effectiveDefense: number;
  effectiveMovement: number;
  hasArmorEquipped: boolean;
  hasShieldEquipped: boolean;
}

/**
 * Extrai bônus de defesa do campo special do escudo
 */
function extractShieldDefenseBonus(special?: string): number {
  if (!special) return 0;
  const match = special.match(/Defesa \+(\d+)/i);
  return match ? parseInt(match[1]) : 0;
}

/**
 * Calcula proteção total baseada nos itens equipados
 * @param inventory - Array de itens do inventário
 * @param baseDefense - Defesa base do personagem (10 + AGI)
 * @param baseMovement - Deslocamento base do personagem
 * @returns Cálculo completo de proteção
 */
export function useArmorCalculation(
  inventory: Array<{
    name: string;
    isEquipped?: boolean;
    itemType?: string;
    equipSlot?: string;
    rd?: number;
    defenseBonus?: number;
    agilityPenalty?: number;
    speedPenalty?: number;
    armorType?: string;
    special?: string;
  }>,
  baseDefense: number,
  baseMovement: number
): ProtectionCalculation {
  return useMemo(() => {
    // Filtra armaduras equipadas (não escudos)
    const equippedArmors = inventory
      .filter(item => 
        item.isEquipped && 
        item.itemType === 'armor' && 
        item.armorType !== 'escudo'
      )
      .map(item => ({
        name: item.name,
        rd: item.rd || 0,
        defenseBonus: item.defenseBonus || 0,
        agilityPenalty: item.agilityPenalty || 0,
        speedPenalty: item.speedPenalty || 0,
        type: item.armorType || 'leve',
      }));

    // Filtra escudo equipado
    const shieldItem = inventory.find(item => 
      item.isEquipped && 
      item.itemType === 'armor' && 
      item.armorType === 'escudo'
    );

    // Escudo: usa defenseBonus do item ou extrai do special como fallback
    const equippedShield = shieldItem ? {
      name: shieldItem.name,
      defenseBonus: shieldItem.defenseBonus || extractShieldDefenseBonus(shieldItem.special),
      agilityPenalty: shieldItem.agilityPenalty || 0,
      speedPenalty: shieldItem.speedPenalty || 0,
    } : null;

    // RD apenas de armaduras (escudos NÃO dão RD)
    const totalRD = equippedArmors.reduce((sum, armor) => sum + armor.rd, 0);
    
    // Bônus de defesa das armaduras (Proteção Leve +5, Proteção Pesada +10)
    const armorDefenseBonus = equippedArmors.reduce((sum, armor) => sum + armor.defenseBonus, 0);
    
    // Penalidades de armadura (Proteção Pesada -5 em testes de carga)
    const armorAgilityPenalty = equippedArmors.reduce((sum, armor) => sum + armor.agilityPenalty, 0);
    const armorSpeedPenalty = equippedArmors.reduce((sum, armor) => sum + armor.speedPenalty, 0);
    
    // Penalidades de escudo
    const shieldAgilityPenalty = equippedShield?.agilityPenalty || 0;
    const shieldSpeedPenalty = equippedShield?.speedPenalty || 0;
    
    // Totais (armadura + escudo)
    const totalAgilityPenalty = armorAgilityPenalty + shieldAgilityPenalty;
    const totalSpeedPenalty = armorSpeedPenalty + shieldSpeedPenalty;
    
    // Bônus de defesa do escudo (+2)
    const shieldDefenseBonus = equippedShield?.defenseBonus || 0;

    // Calcula valores efetivos
    // Defesa = 10 + AGI + Bônus Armadura + Bônus Escudo
    // NOTA: Penalidade de armadura pesada (-5) é em testes de perícias, NÃO na defesa
    const effectiveDefense = Math.max(10, baseDefense + armorDefenseBonus + shieldDefenseBonus);
    
    // Penalidade de deslocamento reduz movimento em metros
    const effectiveMovement = Math.max(1.5, baseMovement + totalSpeedPenalty);

    return {
      totalRD,
      armorDefenseBonus,
      totalAgilityPenalty,
      totalSpeedPenalty,
      shieldDefenseBonus,
      equippedArmors,
      equippedShield,
      effectiveDefense,
      effectiveMovement,
      hasArmorEquipped: equippedArmors.length > 0,
      hasShieldEquipped: equippedShield !== null,
    };
  }, [inventory, baseDefense, baseMovement]);
}

/**
 * Calcula proteção sem hook (para uso em funções)
 */
export function calculateArmorProtection(
  inventory: Array<{
    name: string;
    isEquipped?: boolean;
    itemType?: string;
    equipSlot?: string;
    rd?: number;
    defenseBonus?: number;
    agilityPenalty?: number;
    speedPenalty?: number;
    armorType?: string;
    special?: string;
  }>,
  baseDefense: number,
  baseMovement: number
): ProtectionCalculation {
  // Filtra armaduras equipadas (não escudos)
  const equippedArmors = inventory
    .filter(item => 
      item.isEquipped && 
      item.itemType === 'armor' && 
      item.armorType !== 'escudo'
    )
    .map(item => ({
      name: item.name,
      rd: item.rd || 0,
      defenseBonus: item.defenseBonus || 0,
      agilityPenalty: item.agilityPenalty || 0,
      speedPenalty: item.speedPenalty || 0,
      type: item.armorType || 'leve',
    }));

  // Filtra escudo equipado
  const shieldItem = inventory.find(item => 
    item.isEquipped && 
    item.itemType === 'armor' && 
    item.armorType === 'escudo'
  );

  const equippedShield = shieldItem ? {
    name: shieldItem.name,
    defenseBonus: shieldItem.defenseBonus || extractShieldDefenseBonus(shieldItem.special),
    agilityPenalty: shieldItem.agilityPenalty || 0,
    speedPenalty: shieldItem.speedPenalty || 0,
  } : null;

  const totalRD = equippedArmors.reduce((sum, armor) => sum + armor.rd, 0);
  const armorDefenseBonus = equippedArmors.reduce((sum, armor) => sum + armor.defenseBonus, 0);
  const totalAgilityPenalty = equippedArmors.reduce((sum, armor) => sum + armor.agilityPenalty, 0) + (equippedShield?.agilityPenalty || 0);
  const totalSpeedPenalty = equippedArmors.reduce((sum, armor) => sum + armor.speedPenalty, 0) + (equippedShield?.speedPenalty || 0);
  const shieldDefenseBonus = equippedShield?.defenseBonus || 0;

  const effectiveDefense = Math.max(10, baseDefense + armorDefenseBonus + shieldDefenseBonus);
  const effectiveMovement = Math.max(1.5, baseMovement + totalSpeedPenalty);

  return {
    totalRD,
    armorDefenseBonus,
    totalAgilityPenalty,
    totalSpeedPenalty,
    shieldDefenseBonus,
    equippedArmors,
    equippedShield,
    effectiveDefense,
    effectiveMovement,
    hasArmorEquipped: equippedArmors.length > 0,
    hasShieldEquipped: equippedShield !== null,
  };
}
