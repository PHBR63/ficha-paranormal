import { getActiveRitualEffect, type DamageFormula, type Ritual, type SustainConfig } from '@/lib/rituals/legacy-exports';
import type { WeaponBuff } from '@/hooks/useWeaponBuffs';

export type WeaponBuffApplicationPayload = Omit<WeaponBuff, 'id' | 'appliedAt'>;
export interface SustainApplicationPayload {
  ritualId: string;
  ritualName: string;
  element: string;
  circle: number;
  selectedEnhancements: string[];
  sustainConfig: SustainConfig;
}

/** Normaliza o dano do catálogo nas mesmas fontes usadas pelo motor de buffs. */
function normalizeWeaponDamage(weaponEffect: NonNullable<ReturnType<typeof getActiveRitualEffect>>['weaponEffect'], element: DamageFormula['damageType']): DamageFormula | undefined {
  if (!weaponEffect) return undefined;
  if (weaponEffect.bonusDamage) return { ...weaponEffect.bonusDamage };
  if (weaponEffect.extraDice) return {
    diceCount: weaponEffect.extraDice.count || 1,
    diceType: weaponEffect.extraDice.type || 6,
    damageType: weaponEffect.damageType ?? element,
  };
  const alternate = weaponEffect as unknown as { damageBonus?: unknown };
  if (typeof alternate.damageBonus !== 'string') return undefined;
  const match = alternate.damageBonus.match(/^(\d+)d(\d+)(?:\+(-?\d+))?$/i);
  if (!match) throw new Error('O dano adicional deste ritual precisa de conferência manual.');
  return {
    diceCount: Number(match[1]), diceType: Number(match[2]),
    damageType: weaponEffect.damageType ?? element,
    ...(match[3] !== undefined ? { bonus: Number(match[3]) } : {}),
  };
}

/**
 * Cria somente o valor transacional do bônus. O servidor define ID/data;
 * nenhum estado, rolagem ou callback de persistência é disparado aqui.
 * O motor atual agrega buffs da ficha, sem vínculo a uma arma específica.
 */
export function buildWeaponBuff(ritual: Ritual, enhancements: string[]): WeaponBuffApplicationPayload {
  const effect = getActiveRitualEffect(ritual.id, enhancements);
  if (!effect?.weaponEffect) throw new Error('Este ritual não possui bônus de arma automatizado.');
  const weapon = effect.weaponEffect;
  const bonusDamage = normalizeWeaponDamage(weapon, ritual.element);
  if (!bonusDamage && weapon.attackBonus === undefined && weapon.criticalBonus === undefined && weapon.criticalMultiplierBonus === undefined) throw new Error('O efeito desta arma exige aplicação manual.');
  return {
    ritualId: ritual.id, ritualName: ritual.name, element: ritual.element,
    ...(bonusDamage ? { bonusDamage } : {}),
    ...(weapon.attackBonus !== undefined ? { attackBonus: weapon.attackBonus } : {}),
    ...(weapon.criticalBonus !== undefined ? { criticalBonus: weapon.criticalBonus } : {}),
    ...(weapon.criticalMultiplierBonus !== undefined ? { criticalMultiplierBonus: weapon.criticalMultiplierBonus } : {}),
    duration: effect.sustain || ritual.duration?.toLowerCase().includes('sustent') ? 'sustentado' : 'cena', enhancements: [...enhancements],
  };
}

/** Cria o registro compatível com o painel existente; PE de manutenção não é cobrado nesta ativação. */
export function buildSustainPayload(ritual: Ritual, enhancements: string[], sustainConfig: SustainConfig): SustainApplicationPayload {
  const effect = getActiveRitualEffect(ritual.id, enhancements);
  if (!effect?.sustain && !ritual.duration?.toLowerCase().includes('sustent')) throw new Error('Este nível do ritual não possui sustentação automatizada.');
  const cost = sustainConfig.costPerTurn;
  if (cost !== undefined && (!Number.isSafeInteger(cost) || cost < 0)) throw new Error('Custo de sustentação inválido.');
  if (sustainConfig.maxDuration !== undefined && (!Number.isSafeInteger(sustainConfig.maxDuration) || sustainConfig.maxDuration < 1)) throw new Error('Duração de sustentação inválida.');
  // O catálogo unificado usa movement; o painel legado usa move para a mesma ação.
  const rawAction: unknown = sustainConfig.action;
  const action = rawAction === 'movement' ? 'move' : rawAction;
  if (action !== undefined && action !== 'free' && action !== 'move' && action !== 'standard' && action !== 'full') throw new Error('Ação de sustentação inválida.');
  const validatedAction = action as SustainConfig['action'];
  return {
    ritualId: ritual.id, ritualName: ritual.name, element: ritual.element, circle: ritual.circle,
    selectedEnhancements: [...enhancements],
    sustainConfig: { ...sustainConfig, ...(validatedAction !== undefined ? { action: validatedAction } : {}), ...(sustainConfig.endTriggers ? { endTriggers: [...sustainConfig.endTriggers] } : {}) },
  };
}
