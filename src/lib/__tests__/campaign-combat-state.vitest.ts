import { describe, expect, it } from 'vitest';
import { advanceCombatTurn, campaignCombatSchema, emptyCampaignCombat, removeCombatant, sortCombatants } from '../campaign-combat';

describe('Ordem e integridade do combate compartilhado', () => {
  const state = { active: true, round: 2, currentTurnIndex: 1, combatants: [
    { id: 'a', name: 'A', initiative: 15 }, { id: 'b', name: 'B', initiative: 12 }, { id: 'c', name: 'C', initiative: 5 },
  ] };
  it('incrementa a rodada apenas depois do último participante', () => {
    expect(advanceCombatTurn(state)).toMatchObject({ round: 2, currentTurnIndex: 2 });
    expect(advanceCombatTurn({ ...state, currentTurnIndex: 2 })).toMatchObject({ round: 3, currentTurnIndex: 0 });
  });
  it('reordena mantendo quem está agindo', () => {
    const reordered = sortCombatants(state, state.combatants.map(entry => entry.id === 'c' ? { ...entry, initiative: 20 } : entry));
    expect(reordered.combatants[reordered.currentTurnIndex].id).toBe('b');
  });
  it('remover alguém antes do atual não troca o turno', () => {
    const changed = removeCombatant(state, 'a');
    expect(changed.combatants[changed.currentTurnIndex].id).toBe('b');
  });
  it('remover o atual segue para quem vinha depois', () => {
    const changed = removeCombatant(state, 'b');
    expect(changed.combatants[changed.currentTurnIndex].id).toBe('c');
  });
  it('combate vazio não avança a rodada', () => {
    expect(advanceCombatTurn(emptyCampaignCombat())).toEqual(emptyCampaignCombat());
  });
  it.each([
    { ...state, currentTurnIndex: 3 }, { ...state, round: 0 },
    { ...state, combatants: [state.combatants[0], state.combatants[0]] },
    { ...state, combatants: [{ id: 'a', name: ' ', initiative: 10 }] },
  ])('recusa estado inconsistente antes de enviar ao servidor', invalid => {
    expect(campaignCombatSchema.safeParse(invalid).success).toBe(false);
  });
});
