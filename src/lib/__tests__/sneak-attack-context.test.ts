import { describe, expect, it } from 'vitest';
import { effectiveSneakAttackRange, hasTelescopicSight, validateSneakAttackDeclaration } from '../sneak-attack-context';

const rifle = { type: 'Disparo', weaponType: 'firearm', range: 'Longo', baseRange: 'Médio', appliedModifications: ['mira_telescopica'] };

describe('alcance e condição do Ataque Furtivo', () => {
  it('aplica a Mira uma vez a partir do alcance original', () => {
    expect(hasTelescopicSight(rifle)).toBe(true);
    expect(effectiveSneakAttackRange(rifle)).toBe('long');
    expect(effectiveSneakAttackRange({ ...rifle, range: 'Extremo' })).toBe('long');
    expect(effectiveSneakAttackRange({ ...rifle, appliedModifications: [] })).toBe('medium');
    expect(effectiveSneakAttackRange({ ...rifle, baseRange: undefined })).toBeNull();
    expect(hasTelescopicSight({ ...rifle, weaponType: 'ranged' })).toBe(false);
  });

  it('aceita alvo desprevenido à distância somente com Mira e dentro do alcance', () => {
    expect(validateSneakAttackDeclaration(rifle, { range: 'long', targetStatus: 'flat_footed' })).toBeNull();
    expect(validateSneakAttackDeclaration(rifle, { range: 'extreme', targetStatus: 'flat_footed' })).toMatch(/além do alcance/);
    expect(validateSneakAttackDeclaration({ ...rifle, appliedModifications: [] }, { range: 'medium', targetStatus: 'flat_footed' })).toMatch(/Mira Telescópica/);
    expect(validateSneakAttackDeclaration({ ...rifle, appliedModifications: [] }, { range: 'short', targetStatus: 'flat_footed' })).toBeNull();
  });

  it('flanqueamento exige corpo a corpo e não se aplica a arma de fogo', () => {
    expect(validateSneakAttackDeclaration(rifle, { range: 'long', targetStatus: 'flanked' })).toMatch(/Flanqueamento/);
    expect(validateSneakAttackDeclaration(rifle, { range: 'melee', targetStatus: 'flanked' })).toMatch(/corpo a corpo/);
    expect(validateSneakAttackDeclaration({ type: 'Corpo a Corpo', weaponType: 'melee', range: 'Corpo a corpo' }, { range: 'melee', targetStatus: 'flanked' })).toBeNull();
  });

  it('exige declaração completa e alcance persistido conhecido', () => {
    expect(validateSneakAttackDeclaration(rifle, { range: 'short' })).toMatch(/Declare/);
    expect(validateSneakAttackDeclaration({ type: 'Disparo' }, { range: 'short', targetStatus: 'flat_footed' })).toMatch(/Confira o alcance/);
  });
});
