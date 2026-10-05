import { z } from 'zod';

/** Estado compartilhado; recebe apenas participantes e informações do turno. */
export const combatantSchema = z.object({
  id: z.string().min(1).max(100),
  name: z.string().trim().min(1).max(100),
  initiative: z.number().int().min(-1000).max(1000),
  photoUrl: z.string().url().nullable().optional(),
  isNPC: z.boolean().optional(),
  hpCurrent: z.number().int().min(0).optional(),
  hpMax: z.number().int().min(0).optional(),
});

export const campaignCombatSchema = z.object({
  active: z.boolean(),
  round: z.number().int().min(1).max(1_000_000),
  currentTurnIndex: z.number().int().min(0),
  combatants: z.array(combatantSchema).max(100),
}).superRefine((state, context) => {
  if (state.currentTurnIndex >= Math.max(1, state.combatants.length)) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['currentTurnIndex'], message: 'Turno fora da lista de participantes.' });
  }
  if (new Set(state.combatants.map(entry => entry.id)).size !== state.combatants.length) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['combatants'], message: 'Participantes duplicados.' });
  }
});

export type CombatantEntry = z.infer<typeof combatantSchema>;
export type CampaignCombatState = z.infer<typeof campaignCombatSchema>;

/** Estado inicial também usado ao encerrar; não exclui o registro no servidor. */
export function emptyCampaignCombat(): CampaignCombatState {
  return { active: false, round: 1, currentTurnIndex: 0, combatants: [] };
}

/** Avança um turno e incrementa a rodada apenas ao concluir a ordem inteira. */
export function advanceCombatTurn(state: CampaignCombatState): CampaignCombatState {
  if (!state.active || state.combatants.length === 0) return state;
  const next = state.currentTurnIndex + 1;
  return { ...state, currentTurnIndex: next % state.combatants.length, round: state.round + (next === state.combatants.length ? 1 : 0) };
}

/** Reordena a iniciativa preservando a identidade de quem está agindo. */
export function sortCombatants(state: CampaignCombatState, entries: CombatantEntry[]): CampaignCombatState {
  const currentId = state.combatants[state.currentTurnIndex]?.id;
  const combatants = [...entries].sort((a, b) => b.initiative - a.initiative);
  const index = combatants.findIndex(entry => entry.id === currentId);
  return { ...state, combatants, currentTurnIndex: Math.max(0, index) };
}

/** Remove um participante; se era o atual, passa ao próximo sobrevivente da ordem. */
export function removeCombatant(state: CampaignCombatState, id: string): CampaignCombatState {
  const combatants = state.combatants.filter(entry => entry.id !== id);
  const currentId = state.combatants[state.currentTurnIndex]?.id;
  const preserved = combatants.findIndex(entry => entry.id === currentId);
  return { ...state, combatants, currentTurnIndex: preserved >= 0 ? preserved : state.currentTurnIndex % Math.max(1, combatants.length) };
}
