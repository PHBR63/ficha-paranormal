import { repairLegacyCatalogArmor } from '../legacy-modification-repair';
import { getCompatibleAmmunition, getAmmunitionEffects } from '../ammunition-effects';
import { describe, expect, it } from 'vitest';
import { ARMOR_MODIFICATIONS, BASE_ARMORS, MODIFIED_ARMORS, calculateModifiedStats } from '../catalogs/armor-catalog';
import { ACCESSORIES } from '../catalogs/items-catalog';
import { ALL_WEAPON_MODIFICATIONS, ALL_WEAPONS, calculateModifiedWeaponStats, canApplyModification } from '../catalogs/weapons-catalog';
import { ACCESSORY_MODIFICATIONS, calculateAccessorySkillBonuses, validateAccessoryModifications } from '../accessory-modifications';
import { getModificationCategoryError } from '../inventory-modifications';
import { toMobileWeaponEntry } from '@/components/character/mobile/weapon-entry';

describe('Livro Base v1.3: tabelas 3.5, 3.7 e 3.9', () => {
  it('mantém todas as melhorias e a exceção por função de Aprimorado', () => {
    expect(ALL_WEAPON_MODIFICATIONS).toHaveLength(17);
    expect(ALL_WEAPON_MODIFICATIONS.every(mod => mod.categoryIncrease === 1)).toBe(true);
    expect(ARMOR_MODIFICATIONS).toHaveLength(4);
    expect(ACCESSORY_MODIFICATIONS).toHaveLength(5);
  });
  it('corrige proteção leve e categorias das proteções pré-modificadas', () => {
    expect(BASE_ARMORS.map(armor => armor.spaces)).toEqual([2, 5, 2]);
    for (const armor of MODIFIED_ARMORS) {
      const base = BASE_ARMORS.find(entry => entry.type === armor.type)!;
      expect(armor.category).toBe(armor.type === 'leve' ? 'II' : 'III');
      expect(calculateModifiedStats(base, armor.modifications ?? [])).toEqual({ defenseBonus: armor.defenseBonus, rd: armor.rd ?? 0, spaces: armor.spaces });
    }
    expect(ACCESSORIES.map(item => item.category)).toEqual(['0', 'I', 'I']);
  });
  it.each(BASE_ARMORS)('$name recebe somente os efeitos compatíveis, uma vez', armor => {
    const stats = calculateModifiedStats(armor, ['blindada', 'blindada']);
    expect(stats.rd).toBe(armor.type === 'pesada' ? 5 : armor.rd ?? 0);
    expect(stats.spaces).toBe(armor.spaces + (armor.type === 'pesada' ? 1 : 0));
  });
  it('permite Reforçada no escudo, mas não Antibombas/Blindada/Discreta', () => {
    const shield = BASE_ARMORS.find(armor => armor.type === 'escudo')!;
    expect(ARMOR_MODIFICATIONS.filter(mod => mod.applicableTo.includes('escudo')).map(mod => mod.id)).toEqual(['reforcada']);
    expect(calculateModifiedStats(shield, ['reforcada', 'reforcada'])).toEqual({ defenseBonus: 4, rd: 0, spaces: 3 });
  });
  it('não limita silenciosamente melhorias acima da categoria IV', () => {
    expect(getModificationCategoryError('II', 2)).toBeNull();
    expect(getModificationCategoryError('II', 3)).toMatch(/ultrapassam/);
    expect(getModificationCategoryError('inválida', 1)).toMatch(/categoria base/);
  });
  it('mantém os efeitos de ataque, dano, crítico e alcance separados', () => {
    const gun = ALL_WEAPONS.find(weapon => weapon.id === 'revolver')!;
    const stats = calculateModifiedWeaponStats(gun, ['alongada', 'calibre_grosso', 'mira_laser', 'mira_telescopica']);
    expect(stats.attackBonus).toBe(2);
    expect(stats.damage).toBe('3d6');
    expect(stats.criticalMargin).toBe(gun.critical - 2);
    expect(stats.range).toBe('Médio');
    expect(canApplyModification(gun, 'explosiva')).toBe(false);
    expect(stats.specialEffects.join(' ')).toMatch(/qualquer alcance/);
    expect(stats.specialEffects.join(' ')).toMatch(/calibre grosso/);
  });
  it('propaga bônus e requisitos salvos ao combate mobile sem recalcular dano/crítico', () => {
    const entry = toMobileWeaponEntry({ id: 'qa', name: 'Arma', damage: '3d6', critical: 18, criticalMultiplier: 3,
      weaponType: 'firearm', range: 'Longo', attackBonus: 2, specialEffects: ['Requisito conferido'] });
    expect(entry).toMatchObject({ modificationAttackBonus: 2, modificationEffects: ['Requisito conferido'], damage: '3d6', critical: '18', range: 'Longo' });
  });
});

describe('Funções de acessórios', () => {
  const config = { primarySkill: 'atualidades', additionalSkill: 'tecnologia', kitSkill: 'enganacao' };
  it('Aprimorado beneficia uma vez cada função e não duplica bônus', () => {
    expect(validateAccessoryModifications(['aprimorado', 'funcao_adicional', 'aprimorado_adicional', 'instrumental'], config, 'utensilio')).toBeNull();
    expect(calculateAccessorySkillBonuses(['aprimorado', 'aprimorado', 'funcao_adicional', 'aprimorado_adicional'], config)).toEqual({ atualidades: 5, tecnologia: 5 });
  });
  it('bloqueia aprimorar função inexistente, mesma perícia e bônus de Luta/Pontaria', () => {
    expect(validateAccessoryModifications(['aprimorado_adicional'], config)).toMatch(/exige/);
    expect(validateAccessoryModifications(['funcao_adicional'], { ...config, additionalSkill: 'atualidades' })).toMatch(/outra/);
    expect(validateAccessoryModifications(['funcao_adicional'], { additionalSkill: 'pontaria' })).toMatch(/exceto/);
    expect(validateAccessoryModifications(['aprimorado'], config, 'kit_pericia')).toMatch(/kit/);
  });
  it('Instrumental exige escolher um kit previsto na tabela de perícias', () => {
    expect(validateAccessoryModifications(['instrumental'], {})).toMatch(/Escolha/);
    expect(validateAccessoryModifications(['instrumental'], { kitSkill: 'sobrevivencia' })).toMatch(/Escolha/);
    expect(validateAccessoryModifications(['instrumental'], { kitSkill: 'enganacao' })).toBeNull();
  });
});


describe('Munição escolhida no ataque', () => {
  const ammo = { id: 'qa-ammo', name: 'Balas longas', catalogType: 'municao', catalogId: 'municao_longa', appliedAmmoModifications: ['dum_dum', 'explosiva', 'explosiva'], quantity: 1 };
  it('aplica benefícios uma vez no pacote correto, sem alterar seu conteúdo', () => {
    expect(getAmmunitionEffects(ammo)).toEqual({ criticalMultiplierBonus: 1, explosiveDice: 2 });
    expect(getAmmunitionEffects()).toEqual({ criticalMultiplierBonus: 0, explosiveDice: 0 });
    expect(ammo.appliedAmmoModifications).toHaveLength(3);
  });
  it('não aplica melhorias de balas a outros tipos de munição', () => {
    expect(getAmmunitionEffects({ ...ammo, catalogId: 'flechas' })).toEqual({ criticalMultiplierBonus: 0, explosiveDice: 0 });
  });
  it('calibre grosso não funciona em arma normal e pacote esgotado é excluído', () => {
    const inventory = [ammo, { ...ammo, id: 'gross', calibreGrosso: true }, { ...ammo, id: 'empty', uses: 0 }];
    expect(getCompatibleAmmunition({ ammoType: 'balas_longas' }, inventory).map(a => a.id)).toEqual(['qa-ammo']);
    expect(getCompatibleAmmunition({ ammoType: 'balas_longas', appliedModifications: ['calibre_grosso'] }, inventory).map(a => a.id)).toEqual(['gross']);
    expect(getCompatibleAmmunition({ ammoType: 'balas_curtas' }, inventory)).toEqual([]);
  });
});


it('recupera melhorias de proteção pré-modificada antiga sem alterar personalizações', () => {
  const legacy = { name: 'Proteção Leve Discreta', itemType: 'armor', category: 'II', slots: 4, defenseBonus: 5, rd: 0 };
  const repaired = repairLegacyCatalogArmor(legacy);
  expect(repaired).toMatchObject({ slots: 1, baseSpaces: 2, baseArmorCategory: 'I', appliedArmorModifications: ['discreta'] });
  expect(repairLegacyCatalogArmor(repaired)).toBe(repaired);
  const custom = { ...legacy, name: 'Proteção especial', defenseBonus: 8 };
  expect(repairLegacyCatalogArmor(custom)).toBe(custom);
  expect(legacy.slots).toBe(4);
});
