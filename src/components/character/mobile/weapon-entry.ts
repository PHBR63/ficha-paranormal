import type { InventoryItem } from '@/lib/inventory-system';
import { isAniquiladorFavoriteWeapon } from '@/lib/category-reduction';
import { normalizeWeaponTypeForDisplay } from '@/lib/weapon-type-inference';
import type { WeaponEntry } from './MobileCombatPanel';

type MobileWeaponInventoryData = Parameters<typeof normalizeWeaponTypeForDisplay>[0] &
  Pick<InventoryItem, 'id' | 'name' | 'ammoCurrent' | 'ammoMax' | 'favoriteAbilityId'> & {
    damage?: string;
    critical?: number | string;
    criticalRange?: number | string;
    criticalMultiplier?: number | string;
  };

/**
 * Converte a arma do inventário para o contrato usado pelo painel e modal móvel.
 * Recebe estatísticas salvas e devolve uma nova WeaponEntry, sem alterar ou salvar o item.
 * O campo critical é obrigatório neste fluxo: criticalRange não é lido pelos consumidores.
 */
export function toMobileWeaponEntry(item: MobileWeaponInventoryData): WeaponEntry {
  return {
    id: item.id,
    name: item.name,
    type: normalizeWeaponTypeForDisplay(item),
    damage: item.damage || '1d6',
    damageType: item.damageType,
    critical: String(Number.parseInt(String(item.critical ?? item.criticalRange ?? 20), 10) || 20),
    criticalMultiplier: typeof item.criticalMultiplier === 'number'
      ? `x${item.criticalMultiplier}`
      : item.criticalMultiplier || 'x2',
    range: item.range,
    ammoCurrent: item.ammoCurrent,
    ammoMax: item.ammoMax,
    ammoType: item.ammoType,
    isFavoriteWeapon: isAniquiladorFavoriteWeapon(item),
    favoriteAbilityId: item.favoriteAbilityId,
  };
}
