/** IDs oficiais cuja ativação reduz o pool de ataque em um d20 (Livro Base, p. 25). */
const DICE_PENALTY_POWERS = new Set(['combate-defensivo', 'combater-duas-armas']);

/**
 * Recebe ativações do painel/modal e retorna penalidade em dados, sem alterar o total.
 * Remove namespaces do SUE e conta cada poder uma vez mesmo se ambos os controles o enviarem.
 */
export function getCombatPowerDicePenalty(activeIds: readonly string[]): number {
  const ids = new Set(activeIds.map(id => id.replace(/^(class-power-|conditional-)/, '')));
  return [...ids].filter(id => DICE_PENALTY_POWERS.has(id)).length;
}
