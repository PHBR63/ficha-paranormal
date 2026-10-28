import { describe, expect, it } from 'vitest';
import {
  describeManeuverEffect, eligibleHeldManeuverItems, eligibleManeuverTargets,
  eligibleManeuverWeapons, maneuverDistanceMeters,
} from '../combat-maneuvers';

describe('efeitos das manobras do Livro Base', () => {
  it.each([[0, 1.5], [4, 1.5], [5, 3], [9, 3], [10, 4.5]])(
    'calcula Empurrar com margem %i como %s m',
    (margin, expected) => expect(maneuverDistanceMeters('push', margin)).toBe(expected),
  );

  it('só cria deslocamento extra de Derrubar e Desarmar a partir da margem 5', () => {
    expect(maneuverDistanceMeters('trip', 4)).toBe(0);
    expect(maneuverDistanceMeters('trip', 5)).toBe(1.5);
    expect(maneuverDistanceMeters('disarm', 5)).toBe(1.5);
  });

  it('mantém Quebrar explicitamente pendente de objeto e geometria', () => {
    expect(describeManeuverEffect('break', 7, true)).toMatchObject({
      automatic: 'Teste oposto vencido', manualPending: true,
    });
  });

  it('não aplica efeito quando o atacante perde', () => {
    expect(describeManeuverEffect('grapple', 3, false)).toMatchObject({
      automatic: 'Nenhum efeito aplicado', manualPending: false,
    });
  });

  it('oferece desarmado e armas corpo a corpo equipadas, sem arma de fogo', () => {
    expect(eligibleManeuverWeapons([
      { id: 'espada', name: 'Espada', itemType: 'weapon', weaponType: 'melee', isEquipped: true },
      { id: 'pistola', name: 'Pistola', itemType: 'weapon', weaponType: 'firearm', isEquipped: true },
      { id: 'faca', name: 'Faca guardada', itemType: 'weapon', weaponType: 'melee', isEquipped: false },
    ])).toEqual([{ id: '__unarmed__', name: 'Ataque desarmado' }, { id: 'espada', name: 'Espada' }]);
  });

  it('lista para Desarmar/Quebrar somente arma ou objeto realmente empunhado', () => {
    expect(eligibleHeldManeuverItems([
      { id: 'espada', name: 'Espada', itemType: 'weapon', isEquipped: true },
      { id: 'maleta', name: 'Maleta', itemType: 'item', isEquipped: true, isHeld: true },
      { id: 'colete', name: 'Colete', itemType: 'protection', isEquipped: true, isHeld: true },
      { id: 'oculos', name: 'Óculos', itemType: 'item', catalogType: 'acessorio', isEquipped: true, isHeld: true },
      { id: 'faca', name: 'Faca guardada', itemType: 'weapon', isEquipped: false },
    ])).toEqual([{ id: 'espada', name: 'Espada' }, { id: 'maleta', name: 'Maleta' }]);
  });

  it('oferece como alvo apenas outro combatente presente no combate ativo', () => {
    const members = [
      { id: 'actor', name: 'Atacante' }, { id: 'target', name: 'Alvo' }, { id: 'bench', name: 'Reserva' },
    ];
    expect(eligibleManeuverTargets(members, ['actor', 'target'], 'actor'))
      .toEqual([{ id: 'target', name: 'Alvo' }]);
  });
});
