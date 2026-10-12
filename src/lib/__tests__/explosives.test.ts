import { describe, expect, it } from 'vitest';
import { parseConditions } from '@/lib/conditions/condition-serialization';
import { prepareConditionTurn } from '@/lib/rules/condition-turn';
import { getConditionEffects } from '@/lib/effects/condition-effects-adapter';
describe('Condições aplicadas por explosivos', () => {
  it('duas fontes Em Chamas causam um único 1d6 por início de turno', () => {
    const conditions = parseConditions([{ id: 'em_chamas', name: 'Fogo A', turnsRemaining: null, addedAt: '2026-10-12T12:00:00Z' }, { id: 'em-chamas', name: 'Fogo B', turnsRemaining: null, addedAt: '2026-10-12T12:01:00Z' }]);
    const result = prepareConditionTurn(conditions, 2, 0, () => 0.5);
    expect(result.effects).toHaveLength(1);
    expect(result.effects[0]).toMatchObject({ rolled: 4, conditionId: 'em_chamas' });
  });
  it('Ofuscado usa penalidades de dados, sem inventar redução numérica', () => {
    const effects = getConditionEffects(['ofuscado']);
    expect(effects.some(effect => effect.mechanics.testDice?.attacks === -1 && effect.mechanics.testDice?.skills?.percepcao === -1)).toBe(true);
  });
});
