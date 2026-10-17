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

/** Tática libera apenas o saque; Saque Rápido libera saque e guarda (Livro Base, pp. 25 e 87). */
export function itemActionCost(item: SituationalItem, action: ItemAction, hasQuickDraw = false): 'padrão' | 'movimento' | 'livre' {
  if (action === 'conceal') return 'padrão';
  if (hasQuickDraw) return 'livre';
  return action === 'draw' && item.itemType === 'weapon' && getInstalledItemModifications(item).some(id => ['tatica_melee', 'tatica_firearm'].includes(id)) ? 'livre' : 'movimento';
}

/** Reconhece somente o poder da ficha; o servidor revalida posse e treino. */
export function hasQuickDrawPower(powers: Array<{ id?: string; name?: string }>, abilities: string[]): boolean {
  const matches = (value: string) => ['saque-rapido', 'saque-rapido-esp', 'saque rapido'].includes(
    value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/_/g, '-'));
  return powers.some(power => matches(power.id ?? '') || matches(power.name ?? '')) || abilities.some(matches);
}

/** Separa equipamento dos demais bônus para o servidor aplicar o maior bônus de item. */
export function concealmentOtherBonuses(summary: Pick<BonusSummary, 'skills'>): number {
  const skill = summary.skills.crime;
  const equipment = (skill?.breakdown ?? []).filter(entry => entry.active && entry.type === 'equipment' && typeof entry.value === 'number')
    .reduce((total, entry) => total + Number(entry.value), 0);
  return (skill?.total ?? 0) - equipment;
}
