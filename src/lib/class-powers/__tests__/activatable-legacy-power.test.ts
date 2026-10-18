import { describe, expect, it } from 'vitest';
import { hasPowerOrAbility } from '../activatable-powers-bridge';

describe('poder legado sem nome', () => {
  it('reconhece o ID correspondente e não falha ao verificar outros poderes', () => {
    const powers = [{ id: 'saque-rapido-esp' }, null];
    expect(hasPowerOrAbility(powers, [], 'saque-rapido-esp', 'Saque Rápido')).toBe(true);
    expect(hasPowerOrAbility(powers, [], 'ataque-especial', 'Ataque Especial')).toBe(false);
  });
});
