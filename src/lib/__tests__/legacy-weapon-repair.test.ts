import { describe, expect, it } from 'vitest';
import { repairMissingWeaponFields } from '../legacy-modification-repair';
import { getWeaponById } from '../catalogs/weapons-catalog';
const pistol = getWeaponById('pistola')!;
describe('Reparo de arma incompleta', () => {
  it('não apaga categoria modificada quando completa o crítico faltante', () => {
    const item = { name: 'Pistola', category: 'II', damage: '2d12', appliedModifications: ['silenciador'], custom: 'preservado' };
    const repaired = repairMissingWeaponFields(item, pistol);
    expect(repaired.category).toBe('II'); expect(repaired.damage).toBe('2d12');
    expect(repaired.custom).toBe('preservado'); expect(repaired.appliedModifications).toEqual(['silenciador']);
    expect(item).not.toHaveProperty('critical');
  });
  it('preenche campos ausentes com melhorias reais, deduplicadas', () => {
    const repaired = repairMissingWeaponFields({ name: 'Pistola', appliedModifications: ['calibre_grosso', 'calibre_grosso', 'mira_laser', 'discreta_firearm'] }, pistol);
    expect(repaired).toMatchObject({ category: 'IV', damage: '2d12', critical: 16, spaces: 0 });
  });
  it('preserva espaços zero e propriedades e efeitos personalizados', () => {
    const repaired = repairMissingWeaponFields({ name: 'Pistola', spaces: 0, properties: [], special: 'Regra declarada', critical: 19, range: 'Longo' }, pistol);
    expect(repaired).toMatchObject({ spaces: 0, properties: [], special: 'Regra declarada', critical: 19, range: 'Longo' });
  });
});
