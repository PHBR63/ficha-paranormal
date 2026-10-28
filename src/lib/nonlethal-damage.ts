export type DamageMode = 'lethal' | 'nonlethal';

export interface DamageModeWeapon {
  weaponType: 'Briga' | 'Arremesso' | 'Disparo' | 'Corpo a Corpo' | string;
  naturallyNonlethal?: boolean;
  allowsLethalWithoutPenalty?: boolean;
}

/**
 * Resolve a declaração anterior ao ataque. Armas à distância comuns não podem
 * usar a conversão da p. 88; Briga e itens marcados são não letais por padrão.
 */
export function resolveDamageMode(weapon: DamageModeWeapon, mode: DamageMode) {
  const melee = weapon.weaponType === 'Briga' || weapon.weaponType === 'Corpo a Corpo';
  const naturalMode: DamageMode = weapon.naturallyNonlethal === true || weapon.weaponType === 'Briga'
    ? 'nonlethal' : 'lethal';
  const allowed = mode === naturalMode || melee;
  const ignoresConversionPenalty = naturalMode === 'nonlethal' && mode === 'lethal'
    && weapon.allowsLethalWithoutPenalty === true;
  return { mode, naturalMode, penalty: allowed && mode !== naturalMode && !ignoresConversionPenalty ? -5 as const : 0 as const, allowed };
}

/** Calcula somente os limiares; a persistência e as condições são do servidor. */
export function calculateNonlethalState(input: { hpCurrent: number; hpMax: number; nonlethalDamage: number }) {
  const lethalDamage = Math.max(0, input.hpMax - input.hpCurrent);
  const combinedDamage = lethalDamage + Math.max(0, input.nonlethalDamage);
  return { lethalDamage, combinedDamage, unconscious: combinedDamage >= input.hpMax, dying: input.hpCurrent === 0 };
}

/** Aplica a ordem oficial de cura sem ultrapassar os PV máximos. */
export function calculateHealingPriority(input: { hpCurrent: number; hpMax: number; nonlethalDamage: number; amount: number }) {
  const amount = Math.max(0, Math.trunc(input.amount));
  const nonlethalHealed = Math.min(Math.max(0, input.nonlethalDamage), amount);
  const nonlethalAfter = Math.max(0, input.nonlethalDamage - nonlethalHealed);
  const hpHealed = Math.min(Math.max(0, input.hpMax - input.hpCurrent), amount - nonlethalHealed);
  return { hpAfter: input.hpCurrent + hpHealed, nonlethalAfter, nonlethalHealed, hpHealed };
}
