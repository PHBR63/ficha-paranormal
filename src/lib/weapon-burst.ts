/** Dados estruturados do inventário; nunca infere Automática pelo nome da arma. */
export interface BurstWeapon {
  weaponType?: string; type?: string; catalogId?: string; properties?: string[];
  appliedModifications?: string[]; special?: string;
}
export interface WeaponBurstSnapshot { enabled: boolean; dicePenalty: number; extraWeaponDice: number; compensated: boolean }
const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

/** Automática nativa ou Ferrolho habilitam rajada; Compensador não torna uma arma automática. */
export function getWeaponBurstCapabilities(weapon: BurstWeapon | null) {
  const catalogAutomatic = ['fuzil_assalto', 'submetralhadora', 'metralhadora'].includes(weapon?.catalogId ?? '');
  const firearm = weapon?.weaponType === 'firearm' || weapon?.type === 'Disparo' || catalogAutomatic;
  const automatic = firearm && (catalogAutomatic || (weapon?.properties ?? []).some(property => ['automatica', 'automatico'].includes(normalize(property)))
    || ['automatica', 'automatico'].includes(normalize(weapon?.special ?? '')) || !!weapon?.appliedModifications?.includes('ferrolho_automatico'));
  return { available: automatic, compensated: automatic && !!weapon?.appliedModifications?.includes('compensador') };
}

/** Retrato da escolha deste ataque; o dano reutiliza o retrato confirmado, não o toggle atual. */
export function resolveWeaponBurst(weapon: BurstWeapon | null, enabled: boolean): WeaponBurstSnapshot {
  const capabilities = getWeaponBurstCapabilities(weapon);
  const active = enabled && capabilities.available;
  return { enabled: active, dicePenalty: active && !capabilities.compensated ? 1 : 0,
    extraWeaponDice: active ? 1 : 0, compensated: active && capabilities.compensated };
}

/** O dado de rajada entra nos dados da arma ANTES de multiplicar o crítico (Base, pp. 59 e 84). */
export function burstWeaponDiceCount(baseCount: number, burst: WeaponBurstSnapshot | undefined, critical: boolean, multiplier: number): number {
  return (baseCount + (burst?.enabled ? burst.extraWeaponDice : 0)) * (critical ? multiplier : 1);
}
