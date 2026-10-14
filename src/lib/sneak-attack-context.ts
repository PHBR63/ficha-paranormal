export type AttackRange = 'melee' | 'short' | 'medium' | 'long' | 'extreme';
export type SneakTargetStatus = 'flat_footed' | 'flanked';
export interface SneakAttackDeclaration {
  range: AttackRange;
  targetStatus: SneakTargetStatus;
}
export interface SneakAttackResult extends SneakAttackDeclaration {
  [key: string]: string | number | boolean;
  telescopicSightApplied: boolean;
  weaponMaximumRange: number;
  declaredBy: 'player';
  masterReview: 'available';
  applied: boolean;
  roundLimitChecked: boolean;
}

export interface SneakAttackWeapon {
  type?: string;
  weaponType?: string;
  catalogId?: string;
  range?: string;
  baseRange?: string;
  appliedModifications?: string[];
}

const ranges: AttackRange[] = ['melee', 'short', 'medium', 'long', 'extreme'];
const firearmIds = ['pistola', 'revolver', 'fuzil_caca', 'submetralhadora', 'espingarda', 'fuzil_assalto', 'fuzil_precisao', 'metralhadora'];

/** Converte o alcance persistido para uma categoria estável, sem presumir alcance ausente. */
export function parseAttackRange(value: string | undefined): AttackRange | null {
  const normalized = value?.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  return ({ 'corpo a corpo': 'melee', curto: 'short', medio: 'medium', longo: 'long', extremo: 'extreme' } as Record<string, AttackRange>)[normalized ?? ''] ?? null;
}

/** A Mira só concede a exceção se estiver instalada em uma arma de fogo estruturada. */
export function hasTelescopicSight(weapon: SneakAttackWeapon | null): boolean {
  return !!weapon && (weapon.weaponType === 'firearm' || firearmIds.includes(weapon.catalogId ?? ''))
    && Array.isArray(weapon.appliedModifications) && weapon.appliedModifications.includes('mira_telescopica');
}

/** Recalcula a partir do alcance original quando disponível, sem ampliar a Mira duas vezes. */
export function effectiveSneakAttackRange(weapon: SneakAttackWeapon | null): AttackRange | null {
  if (!weapon) return null;
  if (hasTelescopicSight(weapon) && !weapon.baseRange) return null;
  const base = parseAttackRange(weapon.baseRange ?? weapon.range);
  if (!base) return null;
  return hasTelescopicSight(weapon) ? ranges[Math.min(ranges.length - 1, ranges.indexOf(base) + 1)] : base;
}

/** Avalia a declaração do jogador; a condição do alvo permanece revisável pelo mestre. */
export function validateSneakAttackDeclaration(weapon: SneakAttackWeapon | null, declaration: Partial<SneakAttackDeclaration> | null): string | null {
  if (!weapon || !declaration?.range || !declaration.targetStatus) return 'Declare o alcance e a condição do alvo para Ataque Furtivo.';
  const weaponRange = effectiveSneakAttackRange(weapon);
  if (!weaponRange) return 'Confira o alcance desta arma antes de usar Ataque Furtivo.';
  if (!ranges.includes(declaration.range) || !['flat_footed', 'flanked'].includes(declaration.targetStatus))
    return 'Alcance ou condição do alvo inválido.';
  const ranged = ['Disparo', 'Arremesso'].includes(weapon.type ?? '') || ['firearm', 'ranged', 'thrown'].includes(weapon.weaponType ?? '')
    || firearmIds.includes(weapon.catalogId ?? '');
  if (ranged && declaration.range === 'melee') return 'Este ataque à distância não pode ser declarado corpo a corpo.';
  if (ranges.indexOf(declaration.range) > ranges.indexOf(weaponRange)) return 'O alvo está além do alcance desta arma.';
  if (declaration.targetStatus === 'flanked')
    return declaration.range === 'melee' && !ranged ? null : 'Flanqueamento só permite Ataque Furtivo corpo a corpo.';
  if (declaration.range === 'melee' || declaration.range === 'short' || hasTelescopicSight(weapon)) return null;
  return 'Ataque Furtivo além do alcance curto exige Mira Telescópica instalada nesta arma.';
}

/** Confere o formato do recibo antes de exibi-lo como validação do servidor. */
export function parseSneakAttackResult(value: unknown, declaration?: SneakAttackDeclaration): SneakAttackResult {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Ataque Furtivo não confirmado pelo servidor.');
  const result = value as SneakAttackResult;
  if (!ranges.includes(result.range) || !['flat_footed', 'flanked'].includes(result.targetStatus)
    || typeof result.telescopicSightApplied !== 'boolean'
    || !Number.isInteger(result.weaponMaximumRange) || result.weaponMaximumRange < 0 || result.weaponMaximumRange > 4
    || result.declaredBy !== 'player' || result.masterReview !== 'available'
    || typeof result.applied !== 'boolean' || typeof result.roundLimitChecked !== 'boolean'
    || (declaration && (result.range !== declaration.range || result.targetStatus !== declaration.targetStatus)))
    throw new Error('Confirmação do Ataque Furtivo divergente. Recupere a mesma tentativa.');
  return result;
}
