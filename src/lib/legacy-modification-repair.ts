import { getCategoryReductionAbility, getEffectiveCategory } from './category-reduction';
import { BASE_ARMORS, MODIFIED_ARMORS } from './catalogs/armor-catalog';
import { calculateModifiedWeaponStats, getWeaponModificationById, type CatalogWeapon, type WeaponModification } from './catalogs/weapons-catalog';
import { getInstalledItemModifications } from './inventory-modifications';

/** Completa somente campos ausentes da arma; preserva valores salvos e aplica melhorias conhecidas às bases faltantes. */
export function repairMissingWeaponFields<T extends { name: string; [key: string]: unknown }>(item: T, catalog: CatalogWeapon): T {
  const known = getInstalledItemModifications(item).filter(id => getWeaponModificationById(id as WeaponModification)) as WeaponModification[];
  const stats = calculateModifiedWeaponStats(catalog, known);
  return { ...item,
    damage: item.damage ?? stats.damage, damageType: item.damageType ?? catalog.damageType,
    critical: item.critical ?? stats.criticalMargin, criticalMultiplier: item.criticalMultiplier ?? stats.criticalMultiplier,
    range: item.range ?? stats.range, proficiency: item.proficiency ?? catalog.proficiency,
    properties: item.properties ?? [...(catalog.properties ?? []), ...stats.addedProperties],
    special: item.special ?? [catalog.special, ...stats.specialEffects].filter(Boolean).join('; '),
    spaces: item.spaces ?? stats.finalSpaces, weaponType: item.weaponType ?? catalog.type,
    category: item.category ?? stats.finalCategory,
  };
}

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
