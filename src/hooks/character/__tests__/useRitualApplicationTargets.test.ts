import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loadRitualApplicationTargets } from '../useRitualApplicationTargets';

const mocks = vi.hoisted(() => ({ from: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: mocks.from } }));

function response(data: unknown[], error: Error | null = null) {
  const promise = Promise.resolve({ data, error });
  const chain = { select: vi.fn(), eq: vi.fn(), in: vi.fn(), then: promise.then.bind(promise) };
  chain.select.mockReturnValue(chain); chain.eq.mockReturnValue(chain); chain.in.mockReturnValue(chain);
  mocks.from.mockReturnValueOnce(chain);
  return chain;
}

describe('loadRitualApplicationTargets', () => {
  beforeEach(() => mocks.from.mockReset());

  it('jogador recebe somente a ficha atual que lhe pertence', async () => {
    response([]); response([]);
    response([{ id: 'own', name: 'Agente', user_id: 'player', hp_current: 5, hp_max: 10, conditions: [] }]);
    expect(await loadRitualApplicationTargets('own', 'player')).toEqual([
      expect.objectContaining({ id: 'own', user_id: 'player' }),
    ]);
    expect(mocks.from.mock.calls.map(call => call[0])).toEqual(['campaigns', 'campaigns_v2', 'characters']);
  });

  it('combina v1/v2 e rejeita vínculo cuja identidade difere do dono', async () => {
    response([{ id: 'v1' }]); response([{ id: 'v2' }]);
    response([{ character_id: 'linked', user_id: 'player' }]);
    response([{ character_id: 'forged', user_id: 'impostor' }, { character_id: 'linked', user_id: 'player' }]);
    response([
      { id: 'own', name: 'Mestre', user_id: 'master', hp_current: 5, hp_max: 10, conditions: [] },
      { id: 'linked', name: 'Jogador', user_id: 'player', hp_current: 5, hp_max: 10, conditions: [] },
      { id: 'forged', name: 'Outra ficha', user_id: 'unrelated-owner', hp_current: 5, hp_max: 10, conditions: [] },
    ]);
    expect((await loadRitualApplicationTargets('own', 'master')).map(target => target.id)).toEqual(['linked', 'own']);
  });

  it('falha de leitura não é apresentada como nenhum alvo disponível', async () => {
    response([], new Error('Sem conexão')); response([]);
    await expect(loadRitualApplicationTargets('own', 'player')).rejects.toThrow('Sem conexão');
    expect(mocks.from).toHaveBeenCalledTimes(2);
  });

  it('não oferece a ficha atual alheia sem vínculo de campanha do mestre', async () => {
    response([]); response([]);
    response([{ id: 'other', name: 'Outra ficha', user_id: 'other-player', hp_current: 5, hp_max: 10, conditions: [] }]);
    expect(await loadRitualApplicationTargets('other', 'player')).toEqual([]);
  });
});
