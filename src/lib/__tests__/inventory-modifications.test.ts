import { describe, expect, it } from 'vitest';
import { preserveInventoryModifications, mergeItemModifications } from '../inventory-modifications';
import { ALL_WEAPONS, calculateModifiedWeaponStats, getModifiedCategory } from '../catalogs/weapons-catalog';
import { BASE_ARMORS, calculateModifiedStats } from '../catalogs/armor-catalog';

describe('Modificações únicas por equipamento', () => {
  it.each(['appliedModifications', 'appliedArmorModifications', 'appliedAccessoryModifications', 'appliedAmmoModifications'])('preserva %s, bases e campos do catálogo após ida e volta da ficha', field => {
    const original = { id: 'item', catalogType: 'acessorio', baseCategory: 'I', baseSpaces: 2, [field]: ['uma', 'uma', 'outra'], custom: { source: 'catálogo' } };
    const saved = JSON.parse(JSON.stringify(preserveInventoryModifications(original)));
    expect(preserveInventoryModifications(saved)).toEqual({ ...original, [field]: ['uma', 'outra'] });
    expect(original[field]).toEqual(['uma', 'uma', 'outra']);
  });
  it('não remove instalações antigas ao receber uma seleção desatualizada', () => {
    expect(mergeItemModifications(['alongada'], ['certeira', 'certeira'])).toEqual(['alongada', 'certeira']);
  });
  it('permite a mesma melhoria em dois equipamentos distintos', () => {
    expect(['primeiro', 'segundo'].map(id => preserveInventoryModifications({ id, appliedModifications: ['alongada'] }))).toHaveLength(2);
  });
  it('não duplica defesa ou espaços da proteção', () => {
    expect(calculateModifiedStats(BASE_ARMORS[0], ['reforcada', 'reforcada'])).toEqual(calculateModifiedStats(BASE_ARMORS[0], ['reforcada']));
  });
  it('não multiplica bônus nem categoria de arma com IDs duplicados', () => {
    const weapon = ALL_WEAPONS.find(w => w.type === 'melee' && w.category !== 'especial')!;
    expect(calculateModifiedWeaponStats(weapon, ['certeira', 'certeira'])).toEqual(calculateModifiedWeaponStats(weapon, ['certeira']));
    expect(getModifiedCategory('0', ['alongada', 'alongada'])).toBe('I');
  });
});
