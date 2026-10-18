import { describe, expect, it } from 'vitest';
import { savedClassPowerNames } from '../character-power-input';

describe('poderes de classe salvos', () => {
  it('usa o ID quando falta nome e ignora registros vazios', () => {
    expect(savedClassPowerNames([
      { id: 'saque-rapido-esp' },
      { id: 'saque-rapido', name: 'Saque Rápido' },
      null,
      undefined,
      { name: '' },
    ])).toEqual(['saque-rapido-esp', 'Saque Rápido']);
  });
});
