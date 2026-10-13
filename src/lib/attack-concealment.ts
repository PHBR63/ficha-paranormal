import { getInstalledItemModifications } from './inventory-modifications';
import type { DiceRollResult } from './dice-roller';

export type ConcealmentLevel = 'none' | 'light' | 'total';
export interface AttackVisibilitySelection { level: ConcealmentLevel; confirmed: boolean; totalCover: boolean }
export type ConcealmentResult = {
  level: ConcealmentLevel; attackerBlind: boolean; heatVisionApplied: boolean;
  chance: number; die: number | null; failed: boolean; targetDefense: number | null;
};
const FIREARMS = ['pistola','revolver','fuzil_caca','submetralhadora','espingarda','fuzil_assalto','fuzil_precisao','metralhadora'];
/** Usa somente tipo/identidade estruturados: arco ou descrição textual não concedem Visão de Calor. */
export function hasHeatVision(weapon: { weaponType?: string; catalogId?: string; appliedModifications?: string[] } | null): boolean {
  return !!weapon && (weapon.weaponType === 'firearm' || FIREARMS.includes(weapon.catalogId ?? ''))
    && getInstalledItemModifications(weapon).includes('visao_de_calor');
}
export function concealmentChance(level: ConcealmentLevel, blind: boolean, heat: boolean): number {
  return heat ? 0 : blind || level === 'total' ? 50 : level === 'light' ? 20 : 0;
}
/** Chance resolvida não equivale a acertar Defesa; falha definitiva bloqueia dano mesmo sem Defesa. */
export function attackCanRollDamage(result: DiceRollResult, defense: number | null): boolean {
  const confirmedDefense = result.concealmentResult ? result.concealmentResult.targetDefense : defense;
  return !result.concealmentResult?.failed && (confirmedDefense === null || result.total >= confirmedDefense);
}
export function describeConcealment(result: ConcealmentResult): string {
  return `Camuflagem ${result.level === 'none' ? 'não declarada' : result.level === 'light' ? 'leve' : 'total'}${result.attackerBlind ? ' · Cego: alvos com camuflagem total' : ''}${result.heatVisionApplied ? ' · Visão de Calor da arma ignora camuflagem' : ''} · chance ${result.chance}%${result.die === null ? ' · sem d10 necessário' : ` · d10 ${result.die}`} · ${result.failed ? 'falha por camuflagem; dano bloqueado' : 'sem falha por camuflagem; confira o acerto contra Defesa'}`;
}
/** Valida a resposta do servidor, sem aceitar uma chance/face incompatível como confirmação. */
export function parseConcealmentResult(value: unknown): ConcealmentResult {
  if (!value || typeof value !== 'object') throw new Error('Camuflagem não confirmada pelo servidor.');
  const result = value as ConcealmentResult;
  if (!['none','light','total'].includes(result.level) || typeof result.attackerBlind !== 'boolean'
    || typeof result.heatVisionApplied !== 'boolean' || typeof result.failed !== 'boolean'
    || result.chance !== concealmentChance(result.level,result.attackerBlind,result.heatVisionApplied)
    || (result.chance === 0 ? result.die !== null : !Number.isInteger(result.die) || Number(result.die)<1 || Number(result.die)>10)
    || result.failed !== (result.die !== null && result.die <= result.chance/10)
    || (result.targetDefense !== null && (!Number.isInteger(result.targetDefense) || result.targetDefense<0 || result.targetDefense>1000)))
    throw new Error('Resultado de camuflagem divergente. Recupere a mesma tentativa.');
  return result;
}
