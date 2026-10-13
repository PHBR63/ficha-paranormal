import { describe, expect, it } from 'vitest';
import { hasApplicableSilencer, postAttackStealthPenalty } from '../post-attack-stealth';

describe('Esconder-se após ataque — dados situacionais', () => {
  it('exige arma de fogo e melhoria instalada, sem inferir pelo nome', () => {
    expect(hasApplicableSilencer({ name: 'Silenciador', itemType: 'weapon' })).toBe(false);
    expect(hasApplicableSilencer({ name: 'Espada', itemType: 'weapon', appliedModifications: ['silenciador'] })).toBe(false);
    expect(hasApplicableSilencer({ name: 'Pistola', itemType: 'weapon', catalogId: 'pistola', appliedModifications: ['silenciador'] })).toBe(true);
  });
  it.each([[false,false,false,false,3],[true,false,false,false,1],[true,true,false,false,2],
    [true,false,true,false,3],[true,true,true,false,4],[true,true,false,true,1],[false,true,false,true,3]])
    ('silenciador=%s movimento=%s chamativa=%s gatuno=%s → %s dados', (silencer,movement,loud,gatuno,expected) => {
      expect(postAttackStealthPenalty(silencer,movement,loud,gatuno)).toBe(expected);
    });
});
