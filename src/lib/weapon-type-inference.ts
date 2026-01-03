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
 * 1. Se já tem weaponType definido, usar
 * 2. Se tem ammoType, é uma arma de fogo
 * 3. Se o range é "Corpo a corpo", é melee
 * 4. Se tem propriedade Arremessável, é ranged
 * 5. Se o tipo de dano é Balístico, é firearm
 * 6. Fallback para melee
 */
export function inferWeaponType(item: WeaponLikeItem): WeaponType {
  // Se já tem weaponType definido, usar
  if (item.weaponType) {
    return item.weaponType;
  }

  // Se tem ammoType, é uma arma de fogo
  if (item.ammoType) {
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
