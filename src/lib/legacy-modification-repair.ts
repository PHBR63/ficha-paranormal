import { getCategoryReductionAbility, getEffectiveCategory } from './category-reduction';
import { BASE_ARMORS, MODIFIED_ARMORS } from './catalogs/armor-catalog';

/** Recupera bases e melhorias de proteções oficiais antigas identificadas exatamente pelo nome.
 * Itens personalizados e itens já migrados permanecem intactos; retorna uma cópia apenas se reparável.
 */
export function repairLegacyCatalogArmor<T extends { name: string; itemType?: string; [key: string]: unknown }>(item: T): T {
  if (item.itemType !== 'armor' || item.baseArmorCategory !== undefined || (Array.isArray(item.appliedArmorModifications) && item.appliedArmorModifications.length > 0)) return item;
  const catalog = [...BASE_ARMORS, ...MODIFIED_ARMORS].find(armor => armor.name === item.name);
  if (!catalog || item.defenseBonus !== catalog.defenseBonus || (item.rd ?? 0) !== (catalog.rd ?? 0)) return item;
  const base = BASE_ARMORS.find(armor => armor.type === catalog.type)!;
  return { ...item, catalogId: catalog.id, armorType: catalog.type,
    category: catalog.category, effectiveCategory: getEffectiveCategory(catalog.category, typeof item.favoriteAbilityId === 'string' ? getCategoryReductionAbility(item.favoriteAbilityId)?.reductionAmount ?? 0 : 0),
    slots: catalog.spaces, appliedArmorModifications: catalog.modifications ?? [],
    baseArmorCategory: base.category, baseDefenseBonus: base.defenseBonus, baseRd: base.rd ?? 0, baseSpaces: base.spaces };
}
