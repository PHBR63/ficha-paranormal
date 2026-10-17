import { describe, expect, it } from 'vitest';
import { concealmentOtherBonuses, hasQuickDrawPower, itemActionCost, itemConcealmentBonus } from '../item-situational-actions';
import { getSkillTrainingRequirement } from '../skill-test-requirements';

describe('ocultação e saque por item', () => {
  const base = { id: 'item', name: 'Arma', itemType: 'weapon' };
  it.each(['discreta_melee', 'discreta_firearm'])('arma %s dá +5 somente para o item', id => {
    expect(itemConcealmentBonus({ ...base, appliedModifications: [id] } as typeof base)).toBe(5);
    expect(itemConcealmentBonus(base)).toBe(0);
    expect(getSkillTrainingRequirement('crime', {})).toMatch(/exige treinamento/);
  });
  it('Discreta exige proteção leve e não aceita Reforçada', () => {
    const armor = { ...base, itemType: 'armor', armorType: 'leve', appliedArmorModifications: ['discreta'] };
    expect(itemConcealmentBonus(armor)).toBe(5);
    expect(itemConcealmentBonus({ ...armor, armorType: 'pesada' })).toBe(0);
    expect(itemConcealmentBonus({ ...armor, appliedArmorModifications: ['discreta', 'reforcada'] })).toBe(0);
  });
  it('Discreto não libera consumíveis ou um nome semelhante', () => {
    const item = { ...base, itemType: 'misc', catalogType: 'acessorio', appliedAccessoryModifications: ['discreto'] };
    expect(itemConcealmentBonus(item)).toBe(5);
    expect(itemConcealmentBonus({ ...item, catalogType: 'municao' })).toBe(0);
    expect(itemConcealmentBonus({ ...base, name: 'Arma Discreta' })).toBe(0);
  });
  it.each(['tatica_melee', 'tatica_firearm'])('Tática %s muda saque, nunca guardar', id => {
    const item = { ...base, appliedModifications: [id] };
    expect(itemActionCost(item, 'draw')).toBe('livre');
    expect(itemActionCost(item, 'stow')).toBe('movimento');
    expect(itemActionCost(item, 'conceal')).toBe('padrão');
  });
  it('saque normal usa movimento', () => expect(itemActionCost(base, 'draw')).toBe('movimento'));
  it('Saque Rápido altera saque e guarda, preservando ocultação e Tática', () => {
    expect(hasQuickDrawPower([{ name: 'Saque Rápido' }], [])).toBe(true);
    expect(hasQuickDrawPower([], ['saque-rapido'])).toBe(true);
    expect(hasQuickDrawPower([{ name: 'Saque Rápido Aprimorado' }], [])).toBe(false);
    expect(itemActionCost(base, 'draw', true)).toBe('livre');
    expect(itemActionCost(base, 'stow', true)).toBe('livre');
    expect(itemActionCost(base, 'conceal', true)).toBe('padrão');
    expect(itemActionCost(base, 'stow', false)).toBe('movimento');
  });
  it('não duplica equipamento e preserva os demais bônus', () => {
    expect(concealmentOtherBonuses({ skills: { crime: { total: 7, breakdown: [
      { source: 'Acessório aprovado', value: 5, type: 'equipment', active: true },
      { source: 'Poder', value: 2, type: 'ability', active: true },
    ] } } })).toBe(2);
    expect(concealmentOtherBonuses({ skills: {} })).toBe(0);
  });
});
