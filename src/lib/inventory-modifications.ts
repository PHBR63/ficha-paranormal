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
