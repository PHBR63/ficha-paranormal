import { getInstalledItemModifications } from './inventory-modifications';
import type { SituationalItem } from './item-situational-actions';

const FIREARMS = ['pistola', 'revolver', 'fuzil_caca', 'submetralhadora', 'espingarda', 'fuzil_assalto', 'fuzil_precisao', 'metralhadora'];
export type StealthWeapon = SituationalItem & { weaponType?: string; catalogId?: string };
/** Recebe a arma real: nomes e melhorias incompatíveis não concedem redução (Base p.60). */
export function hasApplicableSilencer(item: StealthWeapon): boolean {
  return item.itemType === 'weapon' && (item.weaponType === 'firearm' || FIREARMS.includes(item.catalogId ?? ''))
    && getInstalledItemModifications(item).includes('silenciador');
}
/** Penalidades em dados, separadas de treino/bônus numéricos; Gatuno remove somente movimento. */
export function postAttackStealthPenalty(silencer: boolean, fullMovement: boolean, otherLoudAction: boolean, gatuno = false): number {
  return (silencer && !otherLoudAction ? 1 : 3) + (fullMovement && !gatuno ? 1 : 0);
}
