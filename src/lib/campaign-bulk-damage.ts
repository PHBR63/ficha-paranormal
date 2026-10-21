/** Resultado independente de cada ajuste de PV durante o dano em área manual. */
export interface BulkDamageResult {
  appliedIds: string[];
  failedIds: string[];
}

/**
 * Aplica o dano final informado pelo mestre a cada ficha e devolve as falhas.
 * Recebe IDs, valor final por alvo e o ajuste de PV já autorizado pelo servidor.
 */
export async function applyDamagePerCharacter(
  characterIds: string[],
  damage: number,
  modifyHP?: (characterId: string, delta: number) => Promise<boolean>,
): Promise<BulkDamageResult> {
  const appliedIds: string[] = [];
  const failedIds: string[] = [];
  for (const charId of characterIds) {
    try {
      if (modifyHP && await modifyHP(charId, -damage)) appliedIds.push(charId);
      else failedIds.push(charId);
    } catch {
      failedIds.push(charId);
    }
  }
  return { appliedIds, failedIds };
}
