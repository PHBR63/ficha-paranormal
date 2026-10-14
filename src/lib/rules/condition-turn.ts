import type { ActiveCondition } from '@/components/character/ConditionManager';
import { resolveConditionId } from '../conditions/condition-identity';
import { BASE_RULES_PROFILE } from './base-profile';

export interface TurnEffect {
  conditionId: string;
  label: string;
  dice: number[];
  rolled: number;
  finalAmount: number;
  ignoresResistance: boolean;
}
export interface ConditionTurnResolution {
  profile: typeof BASE_RULES_PROFILE.id;
  revision: number;
  /** Bônus declarado para o teste de Vigor; os dados de Sangrando são sorteados no servidor. */
  bleedingModifier: number;
  effects: TurnEffect[];
  bleedingTests: Array<{ index: number; dice: number[]; kept: number; modifier: number; total: number; dt: number; passed: boolean }>;
  removeIndexes: number[];
  notices: string[];
}

/** Reconhece apenas dados limitados ou valor fixo; nunca interpreta "2d6" como 2. */
export function parseRecurringDamage(formula: string): { count: number; faces: number; bonus: number } {
  const value = formula.trim().toLowerCase();
  if (/^\d{1,6}$/.test(value)) return { count: 0, faces: 0, bonus: Number(value) };
  const match = /^(\d{1,2})d(\d{1,3})(?:\s*([+-])\s*(\d{1,5}))?$/.exec(value);
  if (!match || Number(match[1]) < 1 || Number(match[1]) > 50 || Number(match[2]) < 2 || Number(match[2]) > 100) {
    throw new Error('Dano recorrente inválido. Use valor inteiro ou uma fórmula como 2d6+3.');
  }
  return { count: Number(match[1]), faces: Number(match[2]), bonus: Number(match[4] ?? 0) * (match[3] === '-' ? -1 : 1) };
}

/** Prepara efeitos declarados; Sangrando não sorteia dados nem altera PV no navegador. */
export function prepareConditionTurn(conditions: ActiveCondition[], vigor: number, modifier = 0,
  random: () => number = Math.random): ConditionTurnResolution {
  if (!Number.isSafeInteger(vigor) || Math.abs(vigor) > 100 || !Number.isSafeInteger(modifier) || Math.abs(modifier) > 1000) {
    throw new Error('Informe Vigor e modificador inteiros válidos.');
  }
  const roll = (faces: number) => {
    const value = random();
    if (!Number.isFinite(value) || value < 0 || value >= 1) throw new Error('Resultado de dado inválido.');
    return Math.floor(value * faces) + 1;
  };
  const resolution: ConditionTurnResolution = {
    profile: BASE_RULES_PROFILE.id, revision: BASE_RULES_PROFILE.revision, bleedingModifier: modifier,
    effects: [], bleedingTests: [], removeIndexes: [], notices: [],
  };
  let fireResolved = false;
  let bleedingDeclared = false;
  for (const [index, condition] of conditions.entries()) {
    const id = resolveConditionId(condition.id);
    let formula: string | undefined;
    if (id === 'confuso') {
      const die = roll(6);
      if (die === 6) {
        resolution.removeIndexes.push(index);
        resolution.notices.push('Confuso: d6 = 6. A condição termina na confirmação; pode agir normalmente.');
      } else if (die === 1) {
        resolution.notices.push(`Confuso: d6 = 1; direção d8 = ${roll(8)}. Movimente-se na direção correspondente do mapa, conferida com o mestre.`);
      } else if (die <= 3) {
        resolution.notices.push(`Confuso: d6 = ${die}. Não pode fazer ações neste turno.`);
      } else {
        resolution.notices.push(`Confuso: d6 = ${die}. Ataque com a arma empunhada o ser mais próximo; se estiver sozinho, role apenas o dano contra si. Resolva alvo e ataque com o mestre.`);
      }
    } else if (id === 'sangrando') {
      if (!bleedingDeclared) {
        resolution.notices.push('Sangrando: teste de Vigor DT 20 e eventual 1d6 de perda de PV são resolvidos pelo servidor na confirmação. Não recebe RD; PV temporários gerais são gastos primeiro. O 20 natural segue a regra personalizada da mesa.');
        bleedingDeclared = true;
      }
      continue;
    } else if (id === 'em-chamas' || id === 'em_chamas') {
      // A condição Em Chamas não multiplica o 1d6 por quantidade de fontes registradas.
      if (fireResolved) continue;
      fireResolved = true;
      formula = '1d6';
    } else if (id === 'envenenado') {
      formula = condition.params?.poisonDamage;
      if (!formula) resolution.notices.push('Envenenado: informe o dano e confira a descrição do veneno; não há dano padrão presumido.');
    } else if (id === 'morrendo' || id === 'enlouquecendo') {
      resolution.notices.push(`${condition.name}: confira a contagem cumulativa de inícios de turno na mesma cena com o mestre. Esta prévia não decreta morte nem transforma a ficha em NPC.`);
    }
    if (!formula) continue;
    const damage = parseRecurringDamage(formula);
    const dice = Array.from({ length: damage.count }, () => roll(damage.faces));
    const rolled = Math.max(0, dice.reduce((total, die) => total + die, damage.bonus));
    resolution.effects.push({ conditionId: id, label: condition.name, dice, rolled, finalAmount: rolled, ignoresResistance: id === 'sangrando' });
  }
  return resolution;
}

/** Aceita apenas valores finais válidos; perda de PV por Sangrando não recebe RD. */
export function validateTurnResolution(resolution: ConditionTurnResolution): number {
  if (resolution.profile !== BASE_RULES_PROFILE.id || resolution.revision !== BASE_RULES_PROFILE.revision) throw new Error('Perfil de regras incompatível.');
  return resolution.effects.reduce((total, effect) => {
    if (!Number.isSafeInteger(effect.finalAmount) || effect.finalAmount < 0 || effect.finalAmount > effect.rolled ||
      (effect.ignoresResistance && effect.finalAmount !== effect.rolled)) throw new Error('Confira o dano final; perda de PV de Sangrando não é reduzida por RD.');
    return total + effect.finalAmount;
  }, 0);
}

/** Remove apenas as instâncias estabilizadas; conserva parâmetros e metadados de todas as demais. */
export function conditionsAfterTurn(conditions: ActiveCondition[], resolution: ConditionTurnResolution): ActiveCondition[] {
  return conditions.filter((_condition, index) => !resolution.removeIndexes.includes(index));
}
