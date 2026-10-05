/**
 * Inferência de tipo de arma para o sistema de inventário
 * 
 * Resolve o problema de armas de fogo sendo categorizadas como corpo a corpo
 * quando o campo weaponType não está definido.
 */

import type { CatalogWeapon } from './catalogs';

export type WeaponType = CatalogWeapon['type'];

interface WeaponLikeItem {
  weaponType?: WeaponType;
  type?: WeaponType; // Campo equivalente nos objetos do catálogo.
  ammoType?: string;
  range?: string;
  properties?: string[];
  damageType?: string;
  itemType?: string;
  name?: string; // Para heurística de inferência por nome de armas conhecidas
}

/**
 * Infere o tipo de arma baseado em suas características
 * 
 * Ordem de prioridade:
 * Preserva weaponType do inventário ou type do catálogo antes das heurísticas.
 * Nos itens legados, flechas/virotes indicam disparo; combustível em uma
 * arma corpo a corpo não transforma a arma em arma de fogo.
 * Sem informação explícita, usa munição, dano, nome, propriedades e alcance.
 */
export function inferWeaponType(item: WeaponLikeItem): WeaponType {
  // Se já tem weaponType definido, usar
  if (item.weaponType) {
    return item.weaponType;
  }

  if (item.type) {
    return item.type;
  }

  // Arcos e bestas usam munição, mas não são armas de fogo (Base 1.3, p. 56–57).
  if (item.ammoType) {
    const ammoType = item.ammoType.toLowerCase();
    if (ammoType === 'flechas' || ammoType === 'virotes') return 'ranged';
    if (ammoType === 'combustivel' && item.range?.toLowerCase() === 'corpo a corpo') {
      return 'melee';
    }
    return 'firearm';
  }

  // Se o tipo de dano é Balístico, é firearm
  if (item.damageType?.toLowerCase().includes('balístico') || 
      item.damageType?.toLowerCase().includes('balistico')) {
    return 'firearm';
  }

  // HEURÍSTICA POR NOME: detecta armas conhecidas pelo nome
  if (item.name) {
    const nameLower = item.name.toLowerCase();
    
    // Armas de fogo conhecidas (fuzis, pistolas, etc.)
    if (nameLower.includes('fuzil') ||
        nameLower.includes('pistola') ||
        nameLower.includes('revólver') || nameLower.includes('revolver') ||
        nameLower.includes('submetralhadora') ||
        nameLower.includes('espingarda') ||
        nameLower.includes('metralhadora') ||
        nameLower.includes('sniper') ||
        nameLower.includes('carabina') ||
        nameLower.includes('rifle') ||
        nameLower.includes('bazuca') ||
        nameLower.includes('lança-foguete') ||
        nameLower.includes('lança-granadas') ||
        nameLower.includes('shotgun')) {
      return 'firearm';
    }
    
    // Arcos, bestas = ranged
    if (nameLower.includes('arco') ||
        nameLower.includes('besta') ||
        nameLower.includes('balestra') ||
        nameLower.includes('funda') ||
        nameLower.includes('zarabatana')) {
      return 'ranged';
    }
  }

  // Se tem propriedade que indica arma de fogo
  if (item.properties) {
    const propsLower = item.properties.map(p => p.toLowerCase());
    
    // Propriedades exclusivas de armas de fogo
    if (propsLower.some(p => 
      p.includes('automática') || 
      p.includes('automatica') ||
      p.includes('recarga') ||
      p.includes('rajada')
    )) {
      return 'firearm';
    }
    
    // Arremessável indica ranged
    if (propsLower.some(p => p.includes('arremessável') || p.includes('arremessavel'))) {
      return 'ranged';
    }
  }

  // Se o range é "Corpo a corpo", é melee
  if (item.range?.toLowerCase() === 'corpo a corpo') {
    return 'melee';
  }

  // Se tem alcance definido (Curto, Médio, Longo, Extremo), provavelmente é ranged ou firearm
  if (item.range) {
    const rangeLower = item.range.toLowerCase();
    if (rangeLower === 'curto' || rangeLower === 'médio' || rangeLower === 'medio' || 
        rangeLower === 'longo' || rangeLower === 'extremo') {
      // Sem ammoType mas com alcance = arco/besta/arremesso
      return 'ranged';
    }
  }

  // Fallback para melee
  return 'melee';
}

/**
 * Verifica se uma arma é de fogo (usa munição)
 */
export function isFirearm(item: WeaponLikeItem): boolean {
  return inferWeaponType(item) === 'firearm';
}

/**
 * Verifica se uma arma é de combate corpo a corpo
 */
export function isMeleeWeapon(item: WeaponLikeItem): boolean {
  return inferWeaponType(item) === 'melee';
}

/**
 * Verifica se uma arma é de ataque à distância (arcos, bestas, arremesso)
 */
export function isRangedWeapon(item: WeaponLikeItem): boolean {
  return inferWeaponType(item) === 'ranged';
}

/**
 * Tipo de arma para exibição no UI (formato usado no MobileCombatPanel)
 */
export type WeaponDisplayType = 'Briga' | 'Arremesso' | 'Disparo' | 'Corpo a Corpo';

/**
 * Converte o tipo interno de arma para o tipo de exibição no UI
 * 
 * Mapeamento:
 * - firearm → 'Disparo'
 * - ranged → 'Arremesso'
 * - melee → 'Corpo a Corpo'
 */
export function normalizeWeaponTypeForDisplay(item: WeaponLikeItem): WeaponDisplayType {
  const internalType = inferWeaponType(item);
  
  switch (internalType) {
    case 'firearm':
      return 'Disparo';
    case 'ranged':
      return 'Arremesso';
    case 'melee':
    default:
      return 'Corpo a Corpo';
  }
}

/**
 * Verifica se uma arma requer munição para uso
 */
export function requiresAmmo(item: WeaponLikeItem): boolean {
  return isFirearm(item) || !!item.ammoType;
}
