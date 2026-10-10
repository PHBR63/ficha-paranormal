/** Contexto verificado no servidor; dados narrativos continuam sendo confirmados pela mesa. */
export interface RitualSituationalContext {
  characterId: string;
  ritualId: string;
  execution: string;
  source: 'memorized' | 'grimoire' | 'unverified';
  grimoireItems: { id: string; name: string }[];
  bladeEligible: boolean;
  bladeAvailable: boolean;
  bladeKnowledge: 'confirmed' | 'absent' | 'unverified';
  canReview: boolean;
}

export interface RitualSituationalDeclaration {
  grimoireItemId?: string;
  grimoireHeld?: boolean;
  grimoireRead?: boolean;
  bladeMovement?: boolean;
  /** Custo do ritual, versões e outros modificadores, antes do adicional de Lâmina Maldita. */
  costBeforeBlade?: number;
}

export const EMPTY_RITUAL_SITUATIONAL: RitualSituationalDeclaration = {};

/** Bloqueia somente os requisitos deste lote, sem atribuir ações extras nem inferir fonte antiga. */
export function validateRitualSituational(context: RitualSituationalContext | undefined, declaration: RitualSituationalDeclaration): string | null {
  if (!context) return null;
  if (context.source === 'unverified') return 'A fonte deste ritual precisa ser conferida antes da conjuração.';
  if (context.source === 'grimoire') {
    if (!context.grimoireItems.length) return 'O Grimório Ritualístico não está no inventário. Recupere o item antes de conjurar.';
    if (!context.grimoireItems.some(item => item.id === declaration.grimoireItemId)) return 'Selecione o Grimório Ritualístico utilizado.';
    if (!declaration.grimoireHeld || !declaration.grimoireRead) return 'Confirme que empunha o grimório e já gastou a ação completa folheando-o para este ritual.';
  }
  if (declaration.bladeMovement && !context.bladeEligible) return 'Lâmina Maldita exige conhecimento anterior do ritual confirmado.';
  return null;
}

/** O adicional de movimento não é descontado nem substitui os aprimoramentos do ritual. */
export function ritualBladeExtraCost(context: RitualSituationalContext | undefined, declaration: RitualSituationalDeclaration): number {
  return context?.bladeEligible && declaration.bladeMovement === true ? 1 : 0;
}

/** Apresenta a ação efetiva; a consulta do grimório é uma preparação separada. */
export function ritualSituationalExecution(execution: string, context: RitualSituationalContext | undefined, declaration: RitualSituationalDeclaration): string {
  return ritualBladeExtraCost(context, declaration) ? 'Movimento' : execution;
}
