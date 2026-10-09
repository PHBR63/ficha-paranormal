import { describe, expect, it } from 'vitest';
import { getTrackEffects, getTrackCombatBonuses } from '../track-effects-adapter';
import { getOriginEffects } from '../origin-effects-adapter';
import { consolidateEffects } from '@/lib/unified-effects-engine';
import { getWeaponDamageEffects } from '../weapon-damage-effects';

const attributes = { agility: 2, strength: 2, vigor: 2, intellect: 3, presence: 2 };
const effects = consolidateEffects([
  ...getTrackEffects('atirador-elite', 40, attributes), ...getOriginEffects('militar', 'Militar', attributes.intellect),
], {
  attributes, nex: 40, hpCurrent: 20, hpMax: 20, peCurrent: 20, peMax: 20,
  inCombat: true, isFirstRound: false, currentRound: 2, hasShield: false,
  activeConditions: [], activatedEffects: [],
});

describe('contexto de dano da arma', () => {
  it('conserva origem e dados do resumo ao retirar Mira de uma pistola', () => {
    const before = structuredClone(effects);
    const resolved = getWeaponDamageEffects(effects, { type: 'Disparo', ammoType: 'balas_curtas' })!;
    expect(resolved.damage.firearm).toBe(2);
    expect(resolved.damage.ranged).toBe(0);
    expect(resolved.damage.breakdown.some(entry => entry.source.includes('Militar'))).toBe(true);
    expect(effects).toEqual(before);
  });

  it('mantém 3 de Intelecto e 2 de origem sem somar novamente a trilha', () => {
    const resolved = getWeaponDamageEffects(effects, { type: 'Disparo', ammoType: 'balas_longas' })!;
    const track = getTrackCombatBonuses('atirador-elite', 40, attributes, 'ranged', [], {
      representedEffectIds: resolved.damage.breakdown.flatMap(entry => entry.effectId ? [entry.effectId] : []),
      isLongFirearm: true,
    });
    expect(resolved.damage.general + resolved.damage.ranged + resolved.damage.firearm + track.damageBonus).toBe(5);
    expect(track.damageBonus).toBe(0);
  });

  it('não concede Intelecto a arma sem munição comprovada ou corpo a corpo', () => {
    expect(getWeaponDamageEffects(effects, { type: 'Disparo' })!.damage.ranged).toBe(0);
    expect(getWeaponDamageEffects(effects, { type: 'Corpo a Corpo', ammoType: 'balas_longas' })!.damage.ranged).toBe(0);
  });
});
