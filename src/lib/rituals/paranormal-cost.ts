import { rollAttributeDicePool } from '@/lib/attribute-dice-pool';
import { getSkillTrainingBonus } from '@/lib/skill-training';
import { getConditionTestDicePenalty } from '@/lib/conditions/condition-test-penalty';
import type { BonusSummary } from '@/hooks/useCharacterBonusSummary';
import type { TestDiceModifiers } from '@/lib/unified-effects-engine';

/** Prepara Ocultismo com as fontes atuais; o servidor confere dados e calcula SAN. */
export function rollParanormalCost(element: string, intellect: number, skills: Record<string, number>, summary: BonusSummary & { unifiedEffects?: { computed: { testDice?: TestDiceModifiers } } },
  conditions: string[], extraDice = 0) {
  if (element.toLowerCase() === 'medo') return { source: 'system_roll', element: 'medo' };
  const dice = summary.unifiedEffects?.computed.testDice;
  const modifier = dice ? (dice.all ?? 0) + (dice.attributes?.intellect ?? 0) + (dice.skills?.ocultismo ?? 0)
    : -getConditionTestDicePenalty(conditions, 'intellect', 'ocultismo');
  const attribute = intellect > 0 ? intellect + extraDice + Math.max(0, modifier) : intellect;
  const dicePenalty = Math.max(0, -modifier);
  const bonuses = [
    { name: 'Treinamento', value: getSkillTrainingBonus(skills, 'ocultismo') },
    { name: 'Perícia / SUE', value: summary.skills.ocultismo?.total ?? 0 },
  ];
  const bonus = bonuses.reduce((total, item) => total + item.value, 0);
  const roll = rollAttributeDicePool(attribute, dicePenalty);
  return { source: 'system_roll', element: element.toLowerCase(), test: { ...roll, attribute, dicePenalty, bonuses, bonus, total: roll.kept + bonus } };
}
