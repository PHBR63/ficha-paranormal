/** Lê os dados e o bônus fixo da fórmula da arma, mantendo o fallback legado. */
export function parseWeaponDamage(damage: string): { count: number; size: number; bonus: number } {
  const match = damage.match(/(\d+)d(\d+)([+-]\d+)?/i);
  if (!match) return { count: 1, size: 6, bonus: 0 };
  return {
    count: parseInt(match[1]) || 1,
    size: parseInt(match[2]) || 6,
    bonus: match[3] ? parseInt(match[3]) : 0,
  };
}
