import { canModifyAmmunition } from './inventory-modifications';

export interface CombatAmmunition {
  id: string;
  name: string;
  itemType?: string;
  catalogType?: string;
  catalogId?: string;
  ammoType?: string;
  quantity?: number;
  uses?: number;
  calibreGrosso?: boolean;
  appliedAmmoModifications?: string[];
}

/** Filtra pacotes compatíveis com o tipo de munição e com o calibre da arma. Não consome itens. */
export function getCompatibleAmmunition(weapon: { ammoType?: string; appliedModifications?: string[] }, inventory: readonly CombatAmmunition[]): CombatAmmunition[] {
  const gross = weapon.appliedModifications?.includes('calibre_grosso') ?? false;
  return inventory.filter(item => {
    const name = item.name.replace(/\s*\(Mod\.\)$/, '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    const type = item.ammoType ?? (item.catalogId === 'municao_curta' ? 'balas_curtas' : item.catalogId === 'municao_longa' ? 'balas_longas' : ['balas curtas', 'municao curta'].includes(name) ? 'balas_curtas' : ['balas longas', 'municao longa'].includes(name) ? 'balas_longas' : undefined);
    return type === weapon.ammoType && !!type && !!item.calibreGrosso === gross && (item.quantity ?? 1) > 0 && (item.uses === undefined || item.uses > 0);
  });
}

/** Bônus exclusivos do pacote escolhido: dados de Explosiva não multiplicam no crítico. */
export function getAmmunitionEffects(ammunition?: CombatAmmunition): { criticalMultiplierBonus: number; explosiveDice: number } {
  if (!ammunition || !canModifyAmmunition(ammunition)) return { criticalMultiplierBonus: 0, explosiveDice: 0 };
  const mods = new Set(ammunition.appliedAmmoModifications ?? []);
  return { criticalMultiplierBonus: mods.has('dum_dum') ? 1 : 0, explosiveDice: mods.has('explosiva') ? 2 : 0 };
}
