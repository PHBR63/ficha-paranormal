import { afterEach, describe, expect, it, vi } from 'vitest';
import { rollInitiative } from '../game-engine';
afterEach(() => vi.restoreAllMocks());
describe('Iniciativa com atributo zero', () => {
  it('rola dois dados e mantém o menor com Agilidade 0', () => {
    vi.spyOn(Math, 'random').mockReturnValueOnce(0.9).mockReturnValueOnce(0.1);
    expect(rollInitiative(0)).toEqual({ rolls: [19, 3], total: 3 });
  });
  it('mantém o maior e a quantidade de dados de um atributo positivo', () => {
    vi.spyOn(Math, 'random').mockReturnValueOnce(0.1).mockReturnValueOnce(0.9);
    expect(rollInitiative(2)).toEqual({ rolls: [3, 19], total: 19 });
  });
});
