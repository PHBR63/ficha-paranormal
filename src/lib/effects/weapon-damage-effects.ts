import type { ComputedEffects } from "@/lib/unified-effects-engine";

/**
 * Remove do resumo efeitos de arma calculados explicitamente pelo modal.
 * Recebe o resumo consolidado e IDs já tratados; devolve uma cópia sem esses
 * dados e margens, preservando outras fontes com valores iguais.
 */
export function withoutHandledCombatEffects(
  computed: ComputedEffects | undefined,
  handledEffectIds: readonly string[],
): ComputedEffects | undefined {
  if (!computed || handledEffectIds.length === 0) return computed;
  const handled = new Set(handledEffectIds);
  const removedDice = computed.damage.breakdown
    .filter((entry) => entry.effectId && handled.has(entry.effectId) && typeof entry.value === "string")
    .map((entry) => entry.value as string);
  const extraDice = [...computed.damage.extraDice];
  for (const dice of removedDice) {
    const index = extraDice.indexOf(dice);
    if (index >= 0) extraDice.splice(index, 1);
  }
  const removedCritical = computed.critical.breakdown.filter(
    (entry) => entry.effectId && handled.has(entry.effectId),
  );
  return {
    ...computed,
    damage: {
      ...computed.damage,
      extraDice,
      breakdown: computed.damage.breakdown.filter(
        (entry) => !entry.effectId || !handled.has(entry.effectId),
      ),
    },
    critical: {
      ...computed.critical,
      marginBonus: computed.critical.marginBonus - removedCritical
        .filter((entry) => entry.type === "margin")
        .reduce((total, entry) => total + entry.value, 0),
      multiplierBonus: computed.critical.multiplierBonus - removedCritical
        .filter((entry) => entry.type === "multiplier")
        .reduce((total, entry) => total + entry.value, 0),
      breakdown: computed.critical.breakdown.filter(
        (entry) => !entry.effectId || !handled.has(entry.effectId),
      ),
    },
  };
}

/** Mira de Elite depende da arma usada, não apenas de um ataque à distância. */
export function hasLongFirearmDamage(
  weapon?: { type?: string; ammoType?: string } | null,
): boolean {
  return weapon?.type === "Disparo" && weapon.ammoType === "balas_longas";
}

/**
 * Ajusta o resumo da ficha para a arma selecionada sem alterar o objeto recebido.
 * Retira somente Mira de Elite de armas inelegíveis; conserva origem e outros bônus.
 */
export function getWeaponDamageEffects(
  computed: ComputedEffects | undefined,
  weapon?: {
    id?: string;
    type?: string;
    ammoType?: string;
    favoriteAbilityId?: string;
  } | null,
): ComputedEffects | undefined {
  if (!computed) return computed;
  // Ferramenta de Trabalho pertence à arma vinculada, não a todos os ataques do Operário.
  const originSources = computed.damage.breakdown
    .filter((entry) => entry.effectId === "origin-ferramenta-de-trabalho")
    .map((entry) => entry.source);
  let scoped = computed;
  if (
    originSources.length &&
    weapon?.favoriteAbilityId !== "ferramenta-de-trabalho"
  ) {
    const remove = (
      entries: Array<{ source: string; value: number | string }>,
    ) =>
      entries
        .filter((entry) => originSources.includes(entry.source))
        .reduce(
          (sum, entry) =>
            sum + (typeof entry.value === "number" ? entry.value : 0),
          0,
        );
    scoped = {
      ...computed,
      attack: {
        ...computed.attack,
        general: computed.attack.general - remove(computed.attack.breakdown),
        breakdown: computed.attack.breakdown.filter(
          (entry) => !originSources.includes(entry.source),
        ),
      },
      damage: {
        ...computed.damage,
        general: computed.damage.general - remove(computed.damage.breakdown),
        breakdown: computed.damage.breakdown.filter(
          (entry) => !originSources.includes(entry.source),
        ),
      },
      critical: {
        ...computed.critical,
        marginBonus:
          computed.critical.marginBonus -
          remove(
            computed.critical.breakdown.filter(
              (entry) => entry.type === "margin",
            ),
          ),
        breakdown: computed.critical.breakdown.filter(
          (entry) => !originSources.includes(entry.source),
        ),
      },
    };
  }
  if (hasLongFirearmDamage(weapon)) return scoped;
  const excluded = scoped.damage.breakdown.filter(
    (entry) =>
      entry.effectId === "track-mira-elite" ||
      entry.effectId === "versatility-mira-elite",
  );
  if (excluded.length === 0) return scoped;
  const excludedBonus = excluded.reduce(
    (total, entry) =>
      total + (typeof entry.value === "number" ? entry.value : 0),
    0,
  );
  return {
    ...scoped,
    damage: {
      ...scoped.damage,
      ranged: scoped.damage.ranged - excludedBonus,
      breakdown: scoped.damage.breakdown.filter(
        (entry) => !excluded.includes(entry),
      ),
    },
  };
}
