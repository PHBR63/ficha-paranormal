import { rollAttributeDicePool } from '@/lib/attribute-dice-pool';
import { getSkillTrainingBonus } from '@/lib/skill-training';
import { getConditionTestDicePenalty } from '@/lib/conditions/condition-test-penalty';
import type { BonusSummary } from '@/hooks/useCharacterBonusSummary';
import type { TestDiceModifiers } from '@/lib/unified-effects-engine';

export interface CastingConcentrationContext { situation: 'normal' | 'ruim' | 'terrivel'; damage: number }
export const DEFAULT_CASTING_CONCENTRATION: CastingConcentrationContext = { situation: 'normal', damage: 0 };
export interface CastingWillConfig { attribute: number; dicePenalty: number; bonuses: { name: string; value: number }[] }

/** Reutiliza treinamento, resumo SUE e penalidades atuais, sem somar SUE duas vezes. */
export function getCastingWillConfig(presence: number, skills: Record<string, number>, summary: BonusSummary & { unifiedEffects?: { computed: { testDice?: TestDiceModifiers } } },
  conditions: string[], extraDice = 0): CastingWillConfig {
  const dice = summary.unifiedEffects?.computed.testDice;
  const modifier = dice ? (dice.all ?? 0) + (dice.attributes?.presence ?? 0) + (dice.skills?.vontade ?? 0)
    : -getConditionTestDicePenalty(conditions, 'presence', 'vontade');
  return {
    attribute: presence > 0 ? presence + extraDice + Math.max(0, modifier) : presence,
    dicePenalty: Math.max(0, -modifier),
    bonuses: [
      { name: 'Treinamento', value: getSkillTrainingBonus(skills, 'vontade') },
      { name: 'Perícia / SUE', value: summary.skills.vontade?.total ?? 0 },
      { name: 'Resistência / SUE', value: summary.resistances.vontade.total },
    ],
  };
}

/** Contexto narrativo é declarado; dano informado aqui não desconta PV novamente. */
export function validateCastingConcentration(context: CastingConcentrationContext): string | null {
  if (!['normal', 'ruim', 'terrivel'].includes(context.situation)) return 'Confira a situação da conjuração.';
  if (!Number.isSafeInteger(context.damage) || context.damage < 0 || context.damage > 1000000) return 'Informe um dano inteiro entre 0 e 1.000.000.';
  return null;
}

/** Sorteia uma vez por pedido; DT e sucesso serão recalculados no servidor. */
export function rollCastingConcentration(context: CastingConcentrationContext, config: CastingWillConfig) {
  const error = validateCastingConcentration(context);
  if (error) throw new Error(error);
  const triggers: { trigger: string; damage?: number }[] = [];
  if (context.situation !== 'normal') triggers.push({ trigger: context.situation });
  if (context.damage > 0) triggers.push({ trigger: 'dano', damage: context.damage });
  const bonus = config.bonuses.reduce((sum, entry) => sum + entry.value, 0);
  return { source: 'system_roll', tests: triggers.map(trigger => {
    const roll = rollAttributeDicePool(config.attribute, config.dicePenalty);
    return { ...trigger, ...roll, attribute: config.attribute, dicePenalty: config.dicePenalty,
      bonuses: config.bonuses, bonus, total: roll.kept + bonus };
  }) };
}
