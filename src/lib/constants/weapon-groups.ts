/**
 * Grupos de Armas para Sub-Escolhas de Poderes de Classe
 * Ordem Paranormal RPG v1.3 - Livro Base
 * 
 * Usado pelo poder "Especialista em Arma" do Combatente
 * e outros poderes que requerem escolha de grupo de armas.
 */

import { Sword, Target, Zap, Crosshair, HandMetal, Bomb, Shield, Pickaxe, Hammer, Sparkles } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/**
 * Interface de um grupo de armas para seleção
 */
export interface WeaponGroup {
  id: string;
  name: string;
  description: string;
  examples: string[];
  icon: LucideIcon;
}

/**
 * Grupos de armas oficiais do sistema
 * Baseado nas categorias do Livro Base e armas disponíveis
 */
export const WEAPON_GROUPS: WeaponGroup[] = [
  {
    id: 'espadas',
    name: 'Espadas',
    description: 'Lâminas de corte e estocada',
    examples: ['Espada longa', 'Espada curta', 'Katana', 'Florete', 'Rapieira'],
    icon: Sword,
  },
  {
    id: 'machados',
    name: 'Machados',
    description: 'Armas de corte com cabeça pesada',
    examples: ['Machado', 'Machado de batalha', 'Machadinha'],
    icon: Pickaxe,
  },
  {
    id: 'armas-contundentes',
    name: 'Armas Contundentes',
    description: 'Armas que causam dano de impacto',
    examples: ['Martelo', 'Maça', 'Porrete', 'Taco de beisebol', 'Bastão'],
    icon: Hammer,
  },
  {
    id: 'armas-de-haste',
    name: 'Armas de Haste',
    description: 'Armas de alcance com cabo longo',
    examples: ['Lança', 'Alabarda', 'Tridente', 'Naginata', 'Bastão de combate'],
    icon: Target,
  },
  {
    id: 'armas-de-arremesso',
    name: 'Armas de Arremesso',
    description: 'Armas projetadas para lançar',
    examples: ['Facas de arremesso', 'Shuriken', 'Dardos', 'Boleadeiras'],
    icon: Target,
  },
  {
    id: 'arcos-bestas',
    name: 'Arcos e Bestas',
    description: 'Armas de disparo não-explosivas',
    examples: ['Arco longo', 'Arco curto', 'Besta', 'Besta de mão'],
    icon: Crosshair,
  },
  {
    id: 'pistolas',
    name: 'Pistolas',
    description: 'Armas de fogo de mão',
    examples: ['Pistola', 'Revólver', 'Pistola automática', 'Desert Eagle'],
    icon: Zap,
  },
  {
    id: 'submetralhadoras',
    name: 'Submetralhadoras',
    description: 'Armas de fogo automáticas compactas',
    examples: ['MP5', 'UZI', 'P90', 'Skorpion'],
    icon: Zap,
  },
  {
    id: 'rifles',
    name: 'Rifles',
    description: 'Armas de fogo longas',
    examples: ['Rifle de assalto', 'Rifle de precisão', 'Carabina', 'AK-47', 'M4'],
    icon: Target,
  },
  {
    id: 'espingardas',
    name: 'Espingardas',
    description: 'Armas de fogo com dispersão',
    examples: ['Espingarda', 'Shotgun de combate', 'Espingarda calibre 12'],
    icon: Target,
  },
  {
    id: 'armas-pesadas',
    name: 'Armas Pesadas',
    description: 'Armas de alto calibre e explosivas',
    examples: ['Metralhadora', 'Lança-foguetes', 'Lança-granadas', 'Bazuca'],
    icon: Bomb,
  },
  {
    id: 'desarmado',
    name: 'Combate Desarmado',
    description: 'Golpes com mãos e pés',
    examples: ['Socos', 'Chutes', 'Cotoveladas', 'Joelhadas', 'Cabeçadas'],
    icon: HandMetal,
  },
  {
    id: 'escudos',
    name: 'Escudos',
    description: 'Armas defensivas para golpear',
    examples: ['Escudo leve', 'Escudo pesado', 'Escudo tático'],
    icon: Shield,
  },
  {
    id: 'armas-improvisadas',
    name: 'Armas Improvisadas',
    description: 'Objetos usados como armas',
    examples: ['Cadeira', 'Garrafa', 'Extintor', 'Pedra', 'Corrente'],
    icon: Sparkles,
  },
];

/**
 * Mapeamento de IDs de armas do catálogo para seus grupos
 * Baseado nas armas oficiais do Livro Base v1.3
 */
const WEAPON_ID_TO_GROUP: Record<string, string> = {
  // === ESPADAS ===
  'espada': 'espadas',
  'florete': 'espadas',
  'katana': 'espadas',
  'espada_longa': 'espadas',
  'espada_curta': 'espadas',
  'rapieira': 'espadas',
  'sabre': 'espadas',
  
  // === MACHADOS ===
  'machado': 'machados',
  'machado_batalha': 'machados',
  'machadinha': 'machados',
  'machado_grande': 'machados',
  
  // === ARMAS CONTUNDENTES ===
  'martelo': 'armas-contundentes',
  'maca': 'armas-contundentes',
  'porrete': 'armas-contundentes',
  'taco_beisebol': 'armas-contundentes',
  'bastao': 'armas-contundentes',
  'marreta': 'armas-contundentes',
  'nunchaku': 'armas-contundentes',
  'corrente': 'armas-contundentes',
  'soqueira': 'armas-contundentes',
  'cassetete': 'armas-contundentes',
  
  // === ARMAS DE HASTE ===
  'lanca': 'armas-de-haste',
  'alabarda': 'armas-de-haste',
  'tridente': 'armas-de-haste',
  'naginata': 'armas-de-haste',
  'bastao_combate': 'armas-de-haste',
  'foice': 'armas-de-haste',
  
  // === ARMAS DE ARREMESSO ===
  'faca': 'armas-de-arremesso',
  'shuriken': 'armas-de-arremesso',
  'dardo': 'armas-de-arremesso',
  'boleadeira': 'armas-de-arremesso',
  'facas_arremesso': 'armas-de-arremesso',
  'granada': 'armas-de-arremesso',
  'coquetel_molotov': 'armas-de-arremesso',
  
  // === ARCOS E BESTAS ===
  'arco_longo': 'arcos-bestas',
  'arco_curto': 'arcos-bestas',
  'besta': 'arcos-bestas',
  'besta_mao': 'arcos-bestas',
  'arco': 'arcos-bestas',
  'arco_composto': 'arcos-bestas',
  
  // === PISTOLAS ===
  'pistola': 'pistolas',
  'revolver': 'pistolas',
  'pistola_automatica': 'pistolas',
  'pistola_pesada': 'pistolas',
  'pistola_ligeira': 'pistolas',
  
  // === SUBMETRALHADORAS ===
  'submetralhadora': 'submetralhadoras',
  'smg': 'submetralhadoras',
  'uzi': 'submetralhadoras',
  'mp5': 'submetralhadoras',
  
  // === RIFLES ===
  'fuzil_assalto': 'rifles',
  'fuzil_precisao': 'rifles',
  'carabina': 'rifles',
  'rifle': 'rifles',
  'rifle_caca': 'rifles',
  'fuzil': 'rifles',
  'sniper': 'rifles',
  
  // === ESPINGARDAS ===
  'espingarda': 'espingardas',
  'shotgun': 'espingardas',
  'espingarda_combate': 'espingardas',
  
  // === ARMAS PESADAS ===
  'metralhadora': 'armas-pesadas',
  'lanca_foguetes': 'armas-pesadas',
  'lanca_granadas': 'armas-pesadas',
  'bazuca': 'armas-pesadas',
  'minigun': 'armas-pesadas',
  'lancador_granadas': 'armas-pesadas',
  
  // === COMBATE DESARMADO ===
  'desarmado': 'desarmado',
  'soco': 'desarmado',
  'chute': 'desarmado',
  
  // === ESCUDOS ===
  'escudo_leve': 'escudos',
  'escudo_pesado': 'escudos',
  'escudo_tatico': 'escudos',
  'escudo': 'escudos',
  
  // === ARMAS IMPROVISADAS ===
  'improvisada': 'armas-improvisadas',
  'cadeira': 'armas-improvisadas',
  'garrafa': 'armas-improvisadas',
  'extintor': 'armas-improvisadas',
};

/**
 * Retorna um grupo de armas pelo ID
 */
export function getWeaponGroupById(id: string): WeaponGroup | undefined {
  return WEAPON_GROUPS.find(g => g.id === id);
}

/**
 * Retorna o nome de um grupo de armas pelo ID
 */
export function getWeaponGroupName(id: string): string {
  return getWeaponGroupById(id)?.name || id;
}

/**
 * Retorna o ID do grupo de uma arma pelo ID ou nome da arma
 * Usa mapeamento direto e inferência por nome como fallback
 */
export function getWeaponGroupForWeapon(weaponIdOrName: string): string | null {
  if (!weaponIdOrName) return null;
  
  // Normaliza para minúsculas e remove acentos/espaços
  const normalized = weaponIdOrName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_');
  
  // Tenta mapeamento direto por ID
  if (WEAPON_ID_TO_GROUP[normalized]) {
    return WEAPON_ID_TO_GROUP[normalized];
  }
  
  // Tenta mapeamento por ID sem normalização
  if (WEAPON_ID_TO_GROUP[weaponIdOrName]) {
    return WEAPON_ID_TO_GROUP[weaponIdOrName];
  }
  
  // Fallback: inferência por nome
  const nameLower = weaponIdOrName.toLowerCase();
  
  // Espadas
  if (nameLower.includes('espada') || nameLower.includes('katana') || 
      nameLower.includes('florete') || nameLower.includes('rapieira') ||
      nameLower.includes('sabre')) {
    return 'espadas';
  }
  
  // Machados
  if (nameLower.includes('machado') || nameLower.includes('machadinha')) {
    return 'machados';
  }
  
  // Contundentes
  if (nameLower.includes('martelo') || nameLower.includes('maca') || 
      nameLower.includes('maça') || nameLower.includes('porrete') ||
      nameLower.includes('marreta') || nameLower.includes('bastao') ||
      nameLower.includes('bastão') || nameLower.includes('nunchaku') ||
      nameLower.includes('cassetete') || nameLower.includes('soqueira')) {
    return 'armas-contundentes';
  }
  
  // Hastes
  if (nameLower.includes('lanca') || nameLower.includes('lança') ||
      nameLower.includes('alabarda') || nameLower.includes('tridente') ||
      nameLower.includes('foice') || nameLower.includes('naginata')) {
    return 'armas-de-haste';
  }
  
  // Arremesso
  if (nameLower.includes('arremesso') || nameLower.includes('shuriken') ||
      nameLower.includes('dardo') || nameLower.includes('boleadeira') ||
      nameLower.includes('granada') || nameLower.includes('molotov')) {
    return 'armas-de-arremesso';
  }
  
  // Arcos e Bestas
  if (nameLower.includes('arco') || nameLower.includes('besta') ||
      nameLower.includes('balestra')) {
    return 'arcos-bestas';
  }
  
  // Pistolas
  if (nameLower.includes('pistola') || nameLower.includes('revolver') ||
      nameLower.includes('revólver')) {
    return 'pistolas';
  }
  
  // Submetralhadoras
  if (nameLower.includes('submetralhadora') || nameLower.includes('smg') ||
      nameLower.includes('uzi') || nameLower.includes('mp5')) {
    return 'submetralhadoras';
  }
  
  // Rifles/Fuzis
  if (nameLower.includes('fuzil') || nameLower.includes('rifle') ||
      nameLower.includes('carabina') || nameLower.includes('sniper')) {
    return 'rifles';
  }
  
  // Espingardas
  if (nameLower.includes('espingarda') || nameLower.includes('shotgun')) {
    return 'espingardas';
  }
  
  // Armas Pesadas
  if (nameLower.includes('metralhadora') || nameLower.includes('bazuca') ||
      nameLower.includes('lanca-foguete') || nameLower.includes('lança-foguete') ||
      nameLower.includes('lancador') || nameLower.includes('lançador') ||
      nameLower.includes('minigun')) {
    return 'armas-pesadas';
  }
  
  // Desarmado
  if (nameLower.includes('desarmado') || nameLower.includes('soco') ||
      nameLower.includes('chute')) {
    return 'desarmado';
  }
  
  // Escudos
  if (nameLower.includes('escudo')) {
    return 'escudos';
  }
  
  // Improvisadas
  if (nameLower.includes('improvisad')) {
    return 'armas-improvisadas';
  }
  
  return null;
}

/**
 * Verifica se uma arma pertence a um grupo específico
 */
export function isWeaponInGroup(weaponIdOrName: string, groupId: string): boolean {
  const weaponGroup = getWeaponGroupForWeapon(weaponIdOrName);
  return weaponGroup === groupId;
}
