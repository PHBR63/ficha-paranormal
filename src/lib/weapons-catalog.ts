/**
 * Catálogo de Armas - Ordem Paranormal RPG v1.3
 * 
 * Baseado no livro de regras oficial
 * Inclui armas corpo a corpo, à distância e especiais
 */

// Tipos de dano disponíveis
export type DamageType = 
  | 'Corte' 
  | 'Impacto' 
  | 'Perfuração' 
  | 'Balístico' 
  | 'Fogo' 
  | 'Frio' 
  | 'Elétrico' 
  | 'Químico'
  | 'Mental'
  | 'Conhecimento';

// Tipo de alcance
export type RangeType = 'Corpo a corpo' | 'Curto' | 'Médio' | 'Longo' | 'Extremo';

// Interface completa para arma do catálogo
export interface CatalogWeapon {
  id: string;
  name: string;
  category: 'I' | 'II' | 'III' | 'IV' | '0';
  type: 'melee' | 'ranged' | 'thrown';
  damage: string;
  damageType: DamageType;
  critical: number; // Margem de crítico (ex: 19 = 19-20)
  criticalMultiplier: number; // x2, x3, etc.
  range?: RangeType;
  spaces: number; // Espaços no inventário
  proficiency: 'simples' | 'tatica' | 'pesada';
  properties?: string[];
  special?: string;
  ammoType?: string;
  description?: string;
}

// ==================== ARMAS CORPO A CORPO ====================

export const MELEE_WEAPONS: CatalogWeapon[] = [
  // === ARMAS SIMPLES ===
  {
    id: 'faca',
    name: 'Faca',
    category: '0',
    type: 'melee',
    damage: '1d4',
    damageType: 'Corte',
    critical: 19,
    criticalMultiplier: 2,
    spaces: 1,
    proficiency: 'simples',
    properties: ['Leve', 'Arremessável'],
    description: 'Uma faca comum, útil para diversas situações.',
  },
  {
    id: 'porrete',
    name: 'Porrete',
    category: '0',
    type: 'melee',
    damage: '1d6',
    damageType: 'Impacto',
    critical: 20,
    criticalMultiplier: 2,
    spaces: 1,
    proficiency: 'simples',
    description: 'Qualquer objeto contundente improvisado.',
  },
  {
    id: 'soqueira',
    name: 'Soqueira',
    category: '0',
    type: 'melee',
    damage: '1d4',
    damageType: 'Impacto',
    critical: 20,
    criticalMultiplier: 2,
    spaces: 1,
    proficiency: 'simples',
    properties: ['Leve'],
    description: 'Brass knuckles que aumentam o dano de socos.',
  },
  {
    id: 'machadinha',
    name: 'Machadinha',
    category: 'I',
    type: 'melee',
    damage: '1d6',
    damageType: 'Corte',
    critical: 20,
    criticalMultiplier: 3,
    spaces: 1,
    proficiency: 'simples',
    properties: ['Arremessável'],
    description: 'Pequeno machado versátil.',
  },
  {
    id: 'bastao',
    name: 'Bastão',
    category: '0',
    type: 'melee',
    damage: '1d6',
    damageType: 'Impacto',
    critical: 20,
    criticalMultiplier: 2,
    spaces: 1,
    proficiency: 'simples',
    properties: ['Duas mãos'],
    description: 'Bastão de madeira ou metal.',
  },

  // === ARMAS TÁTICAS ===
  {
    id: 'espada_curta',
    name: 'Espada Curta',
    category: 'I',
    type: 'melee',
    damage: '1d6',
    damageType: 'Corte',
    critical: 19,
    criticalMultiplier: 2,
    spaces: 1,
    proficiency: 'tatica',
    description: 'Espada leve e ágil.',
  },
  {
    id: 'espada_longa',
    name: 'Espada Longa',
    category: 'I',
    type: 'melee',
    damage: '1d8',
    damageType: 'Corte',
    critical: 19,
    criticalMultiplier: 2,
    spaces: 1,
    proficiency: 'tatica',
    properties: ['Versátil'],
    description: 'Espada tradicional, pode ser usada com uma ou duas mãos.',
  },
  {
    id: 'katana',
    name: 'Katana',
    category: 'II',
    type: 'melee',
    damage: '1d10',
    damageType: 'Corte',
    critical: 19,
    criticalMultiplier: 2,
    spaces: 1,
    proficiency: 'tatica',
    properties: ['Duas mãos', 'Afiada'],
    special: '+2 de dano em ataques desprevenidos',
    description: 'Espada japonesa de lâmina curva.',
  },
  {
    id: 'machado_tatico',
    name: 'Machado Tático',
    category: 'I',
    type: 'melee',
    damage: '1d8',
    damageType: 'Corte',
    critical: 20,
    criticalMultiplier: 3,
    spaces: 1,
    proficiency: 'tatica',
    description: 'Machado militar moderno.',
  },
  {
    id: 'martelo_guerra',
    name: 'Martelo de Guerra',
    category: 'II',
    type: 'melee',
    damage: '1d10',
    damageType: 'Impacto',
    critical: 20,
    criticalMultiplier: 3,
    spaces: 2,
    proficiency: 'tatica',
    properties: ['Duas mãos', 'Esmagador'],
    special: 'Ignora 2 pontos de RD',
    description: 'Pesado martelo de combate.',
  },
  {
    id: 'lanca',
    name: 'Lança',
    category: 'I',
    type: 'melee',
    damage: '1d8',
    damageType: 'Perfuração',
    critical: 20,
    criticalMultiplier: 3,
    spaces: 2,
    proficiency: 'tatica',
    properties: ['Alcance', 'Arremessável'],
    description: 'Lança com ponta afiada.',
  },
  {
    id: 'corrente',
    name: 'Corrente com Peso',
    category: 'I',
    type: 'melee',
    damage: '1d8',
    damageType: 'Impacto',
    critical: 20,
    criticalMultiplier: 2,
    spaces: 1,
    proficiency: 'tatica',
    properties: ['Alcance', 'Agarrar'],
    special: 'Pode usar para derrubar',
    description: 'Corrente com peso na ponta.',
  },

  // === ARMAS PESADAS ===
  {
    id: 'machado_grande',
    name: 'Machado Grande',
    category: 'II',
    type: 'melee',
    damage: '2d6',
    damageType: 'Corte',
    critical: 20,
    criticalMultiplier: 3,
    spaces: 2,
    proficiency: 'pesada',
    properties: ['Duas mãos'],
    description: 'Enorme machado de duas mãos.',
  },
  {
    id: 'montante',
    name: 'Montante',
    category: 'II',
    type: 'melee',
    damage: '2d6',
    damageType: 'Corte',
    critical: 19,
    criticalMultiplier: 2,
    spaces: 2,
    proficiency: 'pesada',
    properties: ['Duas mãos', 'Varredura'],
    special: 'Pode atacar dois alvos adjacentes',
    description: 'Espada gigantesca de duas mãos.',
  },
  {
    id: 'marreta',
    name: 'Marreta',
    category: 'I',
    type: 'melee',
    damage: '2d6',
    damageType: 'Impacto',
    critical: 20,
    criticalMultiplier: 3,
    spaces: 2,
    proficiency: 'pesada',
    properties: ['Duas mãos', 'Esmagador'],
    special: 'Ignora 5 pontos de RD',
    description: 'Enorme martelo de demolição.',
  },
];

// ==================== ARMAS À DISTÂNCIA ====================

export const RANGED_WEAPONS: CatalogWeapon[] = [
  // === ARMAS SIMPLES ===
  {
    id: 'arco_curto',
    name: 'Arco Curto',
    category: 'I',
    type: 'ranged',
    damage: '1d6',
    damageType: 'Perfuração',
    critical: 20,
    criticalMultiplier: 3,
    range: 'Médio',
    spaces: 1,
    proficiency: 'simples',
    properties: ['Duas mãos'],
    ammoType: 'flechas',
    description: 'Arco leve e fácil de usar.',
  },
  {
    id: 'besta_leve',
    name: 'Besta Leve',
    category: 'I',
    type: 'ranged',
    damage: '1d8',
    damageType: 'Perfuração',
    critical: 19,
    criticalMultiplier: 2,
    range: 'Médio',
    spaces: 1,
    proficiency: 'simples',
    properties: ['Recarga'],
    ammoType: 'virotes',
    description: 'Besta pequena e portátil.',
  },

  // === PISTOLAS ===
  {
    id: 'pistola_leve',
    name: 'Pistola Leve',
    category: 'I',
    type: 'ranged',
    damage: '1d8',
    damageType: 'Balístico',
    critical: 19,
    criticalMultiplier: 2,
    range: 'Curto',
    spaces: 1,
    proficiency: 'simples',
    properties: ['Leve'],
    ammoType: 'leve',
    description: 'Pistola compacta, fácil de ocultar.',
  },
  {
    id: 'pistola_media',
    name: 'Pistola Média',
    category: 'I',
    type: 'ranged',
    damage: '2d6',
    damageType: 'Balístico',
    critical: 19,
    criticalMultiplier: 2,
    range: 'Curto',
    spaces: 1,
    proficiency: 'simples',
    ammoType: 'leve',
    description: 'Pistola padrão da Ordem.',
  },
  {
    id: 'pistola_pesada',
    name: 'Pistola Pesada',
    category: 'II',
    type: 'ranged',
    damage: '2d8',
    damageType: 'Balístico',
    critical: 19,
    criticalMultiplier: 2,
    range: 'Curto',
    spaces: 1,
    proficiency: 'tatica',
    ammoType: 'pesada',
    description: 'Pistola de alto calibre.',
  },
  {
    id: 'revolver',
    name: 'Revólver',
    category: 'I',
    type: 'ranged',
    damage: '2d6',
    damageType: 'Balístico',
    critical: 20,
    criticalMultiplier: 3,
    range: 'Curto',
    spaces: 1,
    proficiency: 'simples',
    ammoType: 'leve',
    description: 'Revólver clássico de seis tiros.',
  },
  {
    id: 'revolver_magnum',
    name: 'Revólver Magnum',
    category: 'II',
    type: 'ranged',
    damage: '2d10',
    damageType: 'Balístico',
    critical: 20,
    criticalMultiplier: 3,
    range: 'Curto',
    spaces: 1,
    proficiency: 'tatica',
    ammoType: 'pesada',
    special: 'Recuo: -2 em ataques seguidos',
    description: 'Poderoso revólver de alto calibre.',
  },

  // === SUBMETRALHADORAS ===
  {
    id: 'submetralhadora',
    name: 'Submetralhadora',
    category: 'II',
    type: 'ranged',
    damage: '2d6',
    damageType: 'Balístico',
    critical: 19,
    criticalMultiplier: 2,
    range: 'Curto',
    spaces: 1,
    proficiency: 'tatica',
    properties: ['Automática'],
    ammoType: 'leve',
    special: 'Pode fazer rajada (+2 dados de dano, -2 ataque)',
    description: 'Arma automática compacta.',
  },

  // === ESPINGARDAS ===
  {
    id: 'espingarda',
    name: 'Espingarda',
    category: 'II',
    type: 'ranged',
    damage: '4d6',
    damageType: 'Balístico',
    critical: 20,
    criticalMultiplier: 3,
    range: 'Curto',
    spaces: 2,
    proficiency: 'tatica',
    properties: ['Duas mãos', 'Dispersão'],
    ammoType: 'escopeta',
    special: '+2 ataque em curto alcance',
    description: 'Devastadora em curto alcance.',
  },
  {
    id: 'espingarda_tatica',
    name: 'Espingarda Tática',
    category: 'III',
    type: 'ranged',
    damage: '4d6',
    damageType: 'Balístico',
    critical: 19,
    criticalMultiplier: 3,
    range: 'Curto',
    spaces: 2,
    proficiency: 'tatica',
    properties: ['Duas mãos', 'Dispersão', 'Semi-auto'],
    ammoType: 'escopeta',
    special: 'Pode disparar duas vezes por turno',
    description: 'Espingarda militar semi-automática.',
  },

  // === FUZIS ===
  {
    id: 'fuzil_assalto',
    name: 'Fuzil de Assalto',
    category: 'III',
    type: 'ranged',
    damage: '2d10',
    damageType: 'Balístico',
    critical: 19,
    criticalMultiplier: 2,
    range: 'Longo',
    spaces: 2,
    proficiency: 'tatica',
    properties: ['Duas mãos', 'Automática'],
    ammoType: 'pesada',
    special: 'Pode fazer rajada (+2 dados, -2 ataque)',
    description: 'Fuzil militar padrão.',
  },
  {
    id: 'fuzil_precisao',
    name: 'Fuzil de Precisão',
    category: 'III',
    type: 'ranged',
    damage: '2d10',
    damageType: 'Balístico',
    critical: 18,
    criticalMultiplier: 3,
    range: 'Extremo',
    spaces: 2,
    proficiency: 'tatica',
    properties: ['Duas mãos', 'Mira'],
    ammoType: 'pesada',
    special: '+2 ataque com ação de mirar',
    description: 'Rifle sniper de alta precisão.',
  },

  // === ARMAS PESADAS ===
  {
    id: 'metralhadora_leve',
    name: 'Metralhadora Leve',
    category: 'IV',
    type: 'ranged',
    damage: '2d10',
    damageType: 'Balístico',
    critical: 20,
    criticalMultiplier: 2,
    range: 'Longo',
    spaces: 3,
    proficiency: 'pesada',
    properties: ['Duas mãos', 'Automática', 'Supressão'],
    ammoType: 'pesada',
    special: 'Supressão: alvo deve testar Vontade ou ficar Vulnerável',
    description: 'Metralhadora portátil.',
  },
  {
    id: 'lancador_granadas',
    name: 'Lançador de Granadas',
    category: 'IV',
    type: 'ranged',
    damage: '6d6',
    damageType: 'Fogo',
    critical: 20,
    criticalMultiplier: 2,
    range: 'Médio',
    spaces: 2,
    proficiency: 'pesada',
    properties: ['Duas mãos', 'Explosivo', 'Área'],
    ammoType: 'especial',
    special: 'Afeta área de 6m, Reflexos reduz dano à metade',
    description: 'Lança granadas explosivas.',
  },
];

// ==================== ARMAS DE ARREMESSO ====================

export const THROWN_WEAPONS: CatalogWeapon[] = [
  {
    id: 'granada_fragmentacao',
    name: 'Granada de Fragmentação',
    category: 'II',
    type: 'thrown',
    damage: '6d6',
    damageType: 'Perfuração',
    critical: 20,
    criticalMultiplier: 2,
    range: 'Curto',
    spaces: 1,
    proficiency: 'simples',
    properties: ['Área', 'Consumível'],
    special: 'Área de 6m, Reflexos DT 15 para metade do dano',
    description: 'Granada explosiva padrão.',
  },
  {
    id: 'granada_atordoante',
    name: 'Granada Atordoante',
    category: 'II',
    type: 'thrown',
    damage: '2d6',
    damageType: 'Impacto',
    critical: 20,
    criticalMultiplier: 2,
    range: 'Curto',
    spaces: 1,
    proficiency: 'simples',
    properties: ['Área', 'Consumível'],
    special: 'Área 6m, Fortitude DT 15 ou fica Atordoado 1 turno',
    description: 'Flashbang para incapacitar.',
  },
  {
    id: 'granada_fumaca',
    name: 'Granada de Fumaça',
    category: 'I',
    type: 'thrown',
    damage: '0',
    damageType: 'Impacto',
    critical: 20,
    criticalMultiplier: 1,
    range: 'Curto',
    spaces: 1,
    proficiency: 'simples',
    properties: ['Área', 'Consumível'],
    special: 'Cria área de fumaça 6m por 3 rodadas, concede ocultação',
    description: 'Cria cobertura de fumaça.',
  },
  {
    id: 'coquetel_molotov',
    name: 'Coquetel Molotov',
    category: '0',
    type: 'thrown',
    damage: '2d6',
    damageType: 'Fogo',
    critical: 20,
    criticalMultiplier: 2,
    range: 'Curto',
    spaces: 1,
    proficiency: 'simples',
    properties: ['Área', 'Consumível', 'Fogo'],
    special: 'Área 3m pega fogo por 3 rodadas (1d6/turno)',
    description: 'Garrafa incendiária improvisada.',
  },
  {
    id: 'shuriken',
    name: 'Shuriken (3)',
    category: '0',
    type: 'thrown',
    damage: '1d4',
    damageType: 'Perfuração',
    critical: 20,
    criticalMultiplier: 2,
    range: 'Curto',
    spaces: 1,
    proficiency: 'simples',
    properties: ['Leve', 'Consumível'],
    description: 'Conjunto de 3 estrelas de arremesso.',
  },
];

// ==================== ARMAS ESPECIAIS/PARANORMAIS ====================

export const SPECIAL_WEAPONS: CatalogWeapon[] = [
  {
    id: 'adaga_ritual',
    name: 'Adaga Ritual',
    category: 'II',
    type: 'melee',
    damage: '1d4',
    damageType: 'Conhecimento',
    critical: 19,
    criticalMultiplier: 2,
    spaces: 1,
    proficiency: 'simples',
    properties: ['Leve', 'Ritual'],
    special: '+2 em rituais de Sangue, dano afeta entidades',
    description: 'Adaga abençoada para rituais.',
  },
  {
    id: 'lamina_prata',
    name: 'Lâmina de Prata',
    category: 'II',
    type: 'melee',
    damage: '1d8',
    damageType: 'Corte',
    critical: 19,
    criticalMultiplier: 2,
    spaces: 1,
    proficiency: 'tatica',
    properties: ['Prata'],
    special: 'Dano dobrado contra licantropos e mortos-vivos',
    description: 'Espada forjada em prata pura.',
  },
  {
    id: 'municao_consagrada',
    name: 'Munição Consagrada (20)',
    category: 'II',
    type: 'ranged',
    damage: '+1d6',
    damageType: 'Conhecimento',
    critical: 20,
    criticalMultiplier: 2,
    spaces: 1,
    proficiency: 'simples',
    properties: ['Consumível', 'Abençoado'],
    special: 'Adiciona 1d6 de dano de Conhecimento, afeta entidades',
    description: 'Balas abençoadas por rituais.',
  },
  {
    id: 'lamina_sangue',
    name: 'Lâmina de Sangue',
    category: 'III',
    type: 'melee',
    damage: '2d6',
    damageType: 'Corte',
    critical: 18,
    criticalMultiplier: 2,
    spaces: 1,
    proficiency: 'tatica',
    properties: ['Maldita', 'Paranormal'],
    special: 'Crítico causa Sangrando. Ao atacar, perde 1 PV.',
    description: 'Lâmina amaldiçoada que se alimenta de sangue.',
  },
];

// ==================== CATÁLOGO COMPLETO ====================

export const ALL_WEAPONS: CatalogWeapon[] = [
  ...MELEE_WEAPONS,
  ...RANGED_WEAPONS,
  ...THROWN_WEAPONS,
  ...SPECIAL_WEAPONS,
];

// Função para buscar arma por ID
export function getWeaponById(id: string): CatalogWeapon | undefined {
  return ALL_WEAPONS.find(w => w.id === id);
}

// Função para buscar armas por categoria
export function getWeaponsByCategory(category: 'I' | 'II' | 'III' | 'IV' | '0'): CatalogWeapon[] {
  return ALL_WEAPONS.filter(w => w.category === category);
}

// Função para buscar armas por tipo
export function getWeaponsByType(type: 'melee' | 'ranged' | 'thrown'): CatalogWeapon[] {
  return ALL_WEAPONS.filter(w => w.type === type);
}

// Função para buscar armas por proficiência
export function getWeaponsByProficiency(proficiency: 'simples' | 'tatica' | 'pesada'): CatalogWeapon[] {
  return ALL_WEAPONS.filter(w => w.proficiency === proficiency);
}

// Categorias para UI
export const WEAPON_CATEGORIES = {
  melee: { label: 'Corpo a Corpo', icon: 'Sword' },
  ranged: { label: 'À Distância', icon: 'Crosshair' },
  thrown: { label: 'Arremesso', icon: 'Target' },
  special: { label: 'Especiais', icon: 'Sparkles' },
};

// Proficiências para UI
export const PROFICIENCY_LABELS = {
  simples: { label: 'Simples', color: 'text-green-500' },
  tatica: { label: 'Tática', color: 'text-blue-500' },
  pesada: { label: 'Pesada', color: 'text-purple-500' },
};
