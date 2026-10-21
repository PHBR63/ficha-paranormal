import { describe, expect, it } from 'vitest';
import { getTrackEffects, getTrackCombatBonuses } from '../track-effects-adapter';
import { getOriginEffects } from '../origin-effects-adapter';
import { consolidateEffects } from '@/lib/unified-effects-engine';
import { getWeaponDamageEffects, withoutHandledCombatEffects } from '../weapon-damage-effects';

const attributes = { agility: 2, strength: 2, vigor: 2, intellect: 3, presence: 2 };
const effects = consolidateEffects([
  ...getTrackEffects('atirador-elite', 40, attributes), ...getOriginEffects('militar', 'Militar', attributes.intellect),
], {
  attributes, nex: 40, hpCurrent: 20, hpMax: 20, peCurrent: 20, peMax: 20,
  inCombat: true, isFirstRound: false, currentRound: 2, hasShield: false,
  activeConditions: [], activatedEffects: [],
});

describe('contexto de dano da arma', () => {
  it('Ferramenta de Trabalho só altera ataque, dano e crítico da arma vinculada',()=>{
    const origin=consolidateEffects(getOriginEffects('operario','Operário'),{
      attributes,nex:15,hpCurrent:20,hpMax:20,peCurrent:10,peMax:10,inCombat:true,isFirstRound:false,currentRound:1,hasShield:false,activeConditions:[],activatedEffects:[],
    });
    const other=getWeaponDamageEffects(origin,{id:'other'})!;
    expect([other.attack.general,other.damage.general,other.critical.marginBonus]).toEqual([0,0,0]);
    const linked=getWeaponDamageEffects(origin,{id:'linked',favoriteAbilityId:'ferramenta-de-trabalho'})!;
    expect([linked.attack.general,linked.damage.general,linked.critical.marginBonus]).toEqual([1,1,1]);
  });
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

  it('retira Máquina de Matar das fontes duplicadas do modal sem perder outros dados', () => {
    const source = consolidateEffects(getTrackEffects('aniquilador', 99, attributes), {
      attributes, nex: 99, hpCurrent: 20, hpMax: 20, peCurrent: 20, peMax: 20,
      inCombat: true, isFirstRound: false, currentRound: 2, hasShield: false,
      activeConditions: [], activatedEffects: [],
    });
    expect(source.damage.extraDice).toContain('1W');
    expect(source.critical.marginBonus).toBeGreaterThanOrEqual(2);
    const scoped = withoutHandledCombatEffects(source, ['track-maquina-de-matar'])!;
    expect(scoped.damage.extraDice).not.toContain('1W');
    expect(scoped.critical.marginBonus).toBe(source.critical.marginBonus - 2);
    expect(source.damage.extraDice).toContain('1W');
    const track = getTrackCombatBonuses('aniquilador', 99, attributes, 'ranged', [], {
      representedEffectIds: [], isLongFirearm: false,
      handledEffectIds: ['track-maquina-de-matar'],
    });
    expect(track.extraDamageDice).not.toContain('1W');
    expect(track.criticalMarginBonus).toBe(0);
  });
});
