import { getInstalledItemModifications } from './inventory-modifications';
import type { BonusSummary } from '@/hooks/useCharacterBonusSummary';

export interface SituationalItem {
  id?: string; name: string; itemType?: string; catalogType?: string; armorType?: string;
  isEquipped?: boolean; equipSlot?: string; properties?: string[];
  appliedModifications?: string[]; appliedArmorModifications?: string[]; appliedAccessoryModifications?: string[];
}
export type ItemAction = 'conceal' | 'draw' | 'stow';

/** Confere a exceção do item, sem liberar outros usos de Crime nem inferir pelo nome. */
export function itemConcealmentBonus(item: SituationalItem): number {
  const mods = getInstalledItemModifications(item);
  if (item.itemType === 'weapon' && mods.some(id => ['discreta_melee', 'discreta_firearm'].includes(id))) return 5;
  if (item.itemType === 'armor' && item.armorType === 'leve' && mods.includes('discreta') && !mods.includes('reforcada')) return 5;
  if (item.catalogType === 'acessorio' && mods.includes('discreto')) return 5;
  return 0;
}

/** Tática altera somente o saque. Guardar conserva movimento (Livro Base, p. 87). */
export function itemActionCost(item: SituationalItem, action: ItemAction): 'padrão' | 'movimento' | 'livre' {
  if (action === 'conceal') return 'padrão';
  return action === 'draw' && item.itemType === 'weapon' && getInstalledItemModifications(item).some(id => ['tatica_melee', 'tatica_firearm'].includes(id)) ? 'livre' : 'movimento';
}

/** Separa equipamento dos demais bônus para o servidor aplicar o maior bônus de item. */
export function concealmentOtherBonuses(summary: Pick<BonusSummary, 'skills'>): number {
  const skill = summary.skills.crime;
  const equipment = (skill?.breakdown ?? []).filter(entry => entry.active && entry.type === 'equipment' && typeof entry.value === 'number')
    .reduce((total, entry) => total + Number(entry.value), 0);
  return (skill?.total ?? 0) - equipment;
}
