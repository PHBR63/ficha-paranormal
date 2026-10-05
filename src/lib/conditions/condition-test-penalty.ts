import type { AttributeType } from '../unified-effects-engine';
import { getConditionEffects } from '../effects/condition-effects-adapter';
import { CONDITIONS } from './condition-definitions';

/** Normaliza IDs e nomes legados sem modificar os dados persistidos. */
const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

/**
 * Recebe condições, atributo, perícia e tipo opcional de ataque; retorna penalidade em d20.
 * Usa as mecânicas canônicas do adaptador, incluindo condições compostas e graus substituídos.
 * Não soma penalidades ao total numérico nem reaplica bônus de poderes já calculados pela tela.
 */
export function getConditionTestDicePenalty(
  conditions: string[], attribute: AttributeType, skill = '', attackType?: 'melee' | 'ranged',
): number {
  const ids = conditions.map(value => {
    const normalized = normalize(value);
    const definition = Object.values(CONDITIONS).find(condition =>
      normalize(condition.id) === normalized || normalize(condition.name) === normalized,
    );
    return definition?.id ?? normalized;
  });
  const skillKey = normalize(skill);
  const modifier = getConditionEffects(ids).reduce((total, effect) => {
    const dice = effect.mechanics.testDice;
    return total + (dice?.all ?? 0) + (dice?.attributes?.[attribute] ?? 0)
      + (dice?.skills?.[skillKey] ?? 0)
      + (attackType ? (dice?.attacks ?? 0) + (dice?.[attackType] ?? 0) : 0);
  }, 0);
  return Math.max(0, -modifier);
}

/** Resolve atributo de um ID/nome de teste ou de uma troca explícita, usando o mapa da tela. */
export function resolveConditionTestAttribute(
  skill: string, skillAttributes: Readonly<Record<string, AttributeType>>, override?: string,
): AttributeType {
  const key = normalize(skill);
  const aliases: Record<string, AttributeType> = {
    forca: 'strength', agilidade: 'agility', vigor: 'vigor', intelecto: 'intellect', presenca: 'presence',
    strength: 'strength', agility: 'agility', intellect: 'intellect', presence: 'presence',
  };
  return (override ? aliases[override] : undefined) ?? skillAttributes[key] ?? aliases[key] ?? 'intellect';
}
