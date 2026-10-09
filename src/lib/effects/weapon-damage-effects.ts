import type { ComputedEffects } from '@/lib/unified-effects-engine';

/** Mira de Elite depende da arma usada, não apenas de um ataque à distância. */
export function hasLongFirearmDamage(weapon?: { type?: string; ammoType?: string } | null): boolean {
  return weapon?.type === 'Disparo' && weapon.ammoType === 'balas_longas';
}

/**
 * Ajusta o resumo da ficha para a arma selecionada sem alterar o objeto recebido.
 * Retira somente Mira de Elite de armas inelegíveis; conserva origem e outros bônus.
 */
export function getWeaponDamageEffects(
  computed: ComputedEffects | undefined,
  weapon?: { type?: string; ammoType?: string } | null,
): ComputedEffects | undefined {
  if (!computed || hasLongFirearmDamage(weapon)) return computed;
  const excluded = computed.damage.breakdown.filter(entry =>
    entry.effectId === 'track-mira-elite' || entry.effectId === 'versatility-mira-elite',
  );
  if (excluded.length === 0) return computed;
  const excludedBonus = excluded.reduce((total, entry) => total + (typeof entry.value === 'number' ? entry.value : 0), 0);
  return {
    ...computed,
    damage: {
      ...computed.damage,
      ranged: computed.damage.ranged - excludedBonus,
      breakdown: computed.damage.breakdown.filter(entry => !excluded.includes(entry)),
    },
  };
}
