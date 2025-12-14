/**
 * Hook para cálculo de proteção baseado em equipamentos
 * Calcula RD total, penalidades e bônus de defesa das proteções equipadas
 */

import { useMemo } from 'react';

// Interface para item de proteção equipado
export interface ArmorStats {
  rd: number;
  agilityPenalty: number;
  speedPenalty: number;
  armorType?: string;
  special?: string;
}

// Interface para resultado do cálculo
export interface ProtectionCalculation {
  totalRD: number;
  totalAgilityPenalty: number;
  totalSpeedPenalty: number;
  equippedArmors: Array<{
    name: string;
    rd: number;
    agilityPenalty: number;
    speedPenalty: number;
    type: string;
  }>;
  effectiveDefense: number;
  effectiveMovement: number;
  hasArmorEquipped: boolean;
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
    rd?: number;
    agilityPenalty?: number;
    speedPenalty?: number;
    armorType?: string;
  }>,
  baseDefense: number,
  baseMovement: number
): ProtectionCalculation {
  return useMemo(() => {
    // Filtra apenas proteções equipadas
    const equippedArmors = inventory
      .filter(item => item.isEquipped && item.itemType === 'armor' && item.rd !== undefined)
      .map(item => ({
        name: item.name,
        rd: item.rd || 0,
        agilityPenalty: item.agilityPenalty || 0,
        speedPenalty: item.speedPenalty || 0,
        type: item.armorType || 'leve',
      }));

    // Soma totais
    const totalRD = equippedArmors.reduce((sum, armor) => sum + armor.rd, 0);
    const totalAgilityPenalty = equippedArmors.reduce((sum, armor) => sum + armor.agilityPenalty, 0);
    const totalSpeedPenalty = equippedArmors.reduce((sum, armor) => sum + armor.speedPenalty, 0);

    // Calcula valores efetivos
    // Penalidade de agilidade afeta a defesa (Defesa = 10 + AGI)
    const effectiveDefense = Math.max(10, baseDefense + totalAgilityPenalty);
    
    // Penalidade de deslocamento reduz movimento em metros
    const effectiveMovement = Math.max(1.5, baseMovement + totalSpeedPenalty);

    return {
      totalRD,
      totalAgilityPenalty,
      totalSpeedPenalty,
      equippedArmors,
      effectiveDefense,
      effectiveMovement,
      hasArmorEquipped: equippedArmors.length > 0,
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
    rd?: number;
    agilityPenalty?: number;
    speedPenalty?: number;
    armorType?: string;
  }>,
  baseDefense: number,
  baseMovement: number
): ProtectionCalculation {
  const equippedArmors = inventory
    .filter(item => item.isEquipped && item.itemType === 'armor' && item.rd !== undefined)
    .map(item => ({
      name: item.name,
      rd: item.rd || 0,
      agilityPenalty: item.agilityPenalty || 0,
      speedPenalty: item.speedPenalty || 0,
      type: item.armorType || 'leve',
    }));

  const totalRD = equippedArmors.reduce((sum, armor) => sum + armor.rd, 0);
  const totalAgilityPenalty = equippedArmors.reduce((sum, armor) => sum + armor.agilityPenalty, 0);
  const totalSpeedPenalty = equippedArmors.reduce((sum, armor) => sum + armor.speedPenalty, 0);

  const effectiveDefense = Math.max(10, baseDefense + totalAgilityPenalty);
  const effectiveMovement = Math.max(1.5, baseMovement + totalSpeedPenalty);

  return {
    totalRD,
    totalAgilityPenalty,
    totalSpeedPenalty,
    equippedArmors,
    effectiveDefense,
    effectiveMovement,
    hasArmorEquipped: equippedArmors.length > 0,
  };
}
