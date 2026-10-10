/** Campos persistidos das melhorias. A unicidade é por item, nunca por ficha. */
const MODIFICATION_FIELDS = [
  'appliedModifications',
  'appliedArmorModifications',
  'appliedAccessoryModifications',
  'appliedAmmoModifications',
] as const;

/** Preserva todos os metadados e copia listas válidas sem IDs repetidos. */
export function preserveInventoryModifications<T extends object>(item: T): T {
  const result = { ...item };
  const fields = result as Record<string, unknown>;
  for (const field of MODIFICATION_FIELDS) {
    if (Array.isArray(fields[field])) {
      fields[field] = [...new Set(fields[field] as unknown[])];
    }
  }
  return result;
}

/** Mantém melhorias instaladas e acrescenta cada nova melhoria somente uma vez. */
export function mergeItemModifications<T extends string>(installed: readonly T[], selected: readonly T[]): T[] {
  return [...new Set([...installed, ...selected])];
}

/** Identifica balas pelo catálogo; nomes exatos mantêm compatibilidade com itens antigos. */
export function canModifyAmmunition(item: {
  name: string; itemType?: string; catalogType?: string; catalogId?: string; ammoType?: string;
}): boolean {
  if (item.catalogType !== 'municao' && item.itemType !== 'consumable') return false;
  if (item.catalogId) return ['municao_curta', 'municao_longa'].includes(item.catalogId);
  if (item.ammoType) return ['balas_curtas', 'balas_longas'].includes(item.ammoType);
  const name = item.name.replace(/\s*\(Mod\.\)$/, '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  return ['municao curta', 'municao longa', 'balas curtas', 'balas longas'].includes(name);
}

/** Reúne IDs instalados para os indicadores de arma, proteção, equipamento e munição. */
export function getInstalledItemModifications(item: object): string[] {
  const fields = item as Record<string, unknown>;
  return [...new Set(MODIFICATION_FIELDS.flatMap(field =>
    Array.isArray(fields[field]) ? fields[field].filter((id): id is string => typeof id === 'string') : []
  ))];
}

/** Não permite que melhorias excedentes sejam silenciosamente achatadas para categoria IV. */
export function getModificationCategoryError(baseCategory: string, modificationCount: number): string | null {
  const categories = ['0', 'I', 'II', 'III', 'IV'];
  const base = categories.indexOf(baseCategory);
  if (base < 0) return 'A categoria base deste item precisa ser conferida antes de modificá-lo.';
  if (base + modificationCount > 4) return 'As melhorias ultrapassam a categoria IV suportada pelo inventário. Reduza a seleção; a categoria não será limitada silenciosamente.';
  return null;
}
