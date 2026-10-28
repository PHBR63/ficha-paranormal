export const COMBAT_MANEUVER_TYPES = ['grapple', 'trip', 'disarm', 'push', 'break'] as const;
export type CombatManeuverType = typeof COMBAT_MANEUVER_TYPES[number];

export const COMBAT_MANEUVER_LABELS: Record<CombatManeuverType, string> = {
  grapple: 'Agarrar', trip: 'Derrubar', disarm: 'Desarmar', push: 'Empurrar', break: 'Quebrar',
};

interface ManeuverInventoryItem {
  id?: unknown; name?: unknown; itemType?: unknown; catalogType?: unknown; weaponType?: unknown;
  type?: unknown; isEquipped?: unknown; isHeld?: unknown;
}

interface ManeuverTarget { id: string; name: string }

/** Lista apenas ataques válidos para a RPC básica; integrações à distância ficam fora deste lote. */
export function eligibleManeuverWeapons(inventory: unknown[]): Array<{ id: string; name: string }> {
  return [{ id: '__unarmed__', name: 'Ataque desarmado' }, ...inventory.flatMap(value => {
    if (!value || typeof value !== 'object') return [];
    const item = value as ManeuverInventoryItem;
    const kind = String(item.weaponType ?? item.type ?? '').toLowerCase();
    return item.itemType === 'weapon' && item.isEquipped === true
      && ['melee', 'corpo a corpo', 'briga'].includes(kind)
      && typeof item.id === 'string' && typeof item.name === 'string'
      ? [{ id: item.id, name: item.name }] : [];
  })];
}

/** Restringe Desarmar/Quebrar a armas equipadas ou objetos comuns marcados como empunhados. */
export function eligibleHeldManeuverItems(inventory: unknown[]): Array<{ id: string; name: string }> {
  return inventory.flatMap(value => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return [];
    const item = value as ManeuverInventoryItem;
    const protectedKind = ['armor', 'protection', 'accessory'].includes(String(item.itemType).toLowerCase())
      || ['acessorio', 'accessory'].includes(String(item.catalogType).toLowerCase());
    const held = item.itemType === 'weapon' ? item.isEquipped === true : item.isHeld === true && item.isEquipped === true;
    return !protectedKind && held && typeof item.id === 'string' && typeof item.name === 'string'
      ? [{ id: item.id, name: item.name }] : [];
  });
}

/** Intersecta membros vinculados com os combatentes do estado v2 ativo. */
export function eligibleManeuverTargets(
  members: ManeuverTarget[], combatantIds: string[], actorId: string,
): ManeuverTarget[] {
  const activeIds = new Set(combatantIds);
  return members.filter(member => member.id !== actorId && activeIds.has(member.id));
}

/** Confirma a exceção Ágil do ataque desarmado por identidade mecânica, não por texto livre. */
export function hasAgileUnarmedTrait(values: unknown[]): boolean {
  const visit = (value: unknown): boolean => {
    if (Array.isArray(value)) return value.some(visit);
    if (!value || typeof value !== 'object') return false;
    const entry = value as Record<string, unknown>;
    const id = String(entry.id ?? entry.powerId ?? entry.name ?? '').normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[ _]+/g, '-');
    return ['artista-marcial', 'artista-marcial-esp'].includes(id) || Object.values(entry).some(visit);
  };
  return values.some(visit);
}

/** Calcula somente a distância prevista pela regra; direção e posição continuam com o mestre. */
export function maneuverDistanceMeters(type: CombatManeuverType, margin: number): number {
  const safeMargin = Math.max(0, Math.trunc(margin));
  if (type === 'push') return 1.5 * (1 + Math.floor(safeMargin / 5));
  if ((type === 'trip' || type === 'disarm') && safeMargin >= 5) return 1.5;
  return 0;
}

export interface ManeuverEffectDescription { automatic: string; manualPending: boolean; distanceMeters: number }

/** Resume o efeito mecânico sem alegar que geometria ou dados de objeto foram aplicados. */
export function describeManeuverEffect(
  type: CombatManeuverType, margin: number, attackerWon: boolean,
): ManeuverEffectDescription {
  if (!attackerWon) return { automatic: 'Nenhum efeito aplicado', manualPending: false, distanceMeters: 0 };
  const distanceMeters = maneuverDistanceMeters(type, margin);
  if (type === 'grapple') return { automatic: 'Vínculo Agarrado criado', manualPending: true, distanceMeters: 0 };
  if (type === 'trip') return { automatic: 'Condição Caído aplicada', manualPending: distanceMeters > 0, distanceMeters };
  if (type === 'disarm') return { automatic: 'Item desequipado', manualPending: true, distanceMeters };
  if (type === 'push') return { automatic: 'Deslocamento calculado', manualPending: true, distanceMeters };
  return { automatic: 'Teste oposto vencido', manualPending: true, distanceMeters: 0 };
}
