/**
 * Catálogo de Armas - Ordem Paranormal RPG
 * 
 * Baseado EXATAMENTE no livro de regras oficial (pgs. 94-97)
 * Inclui armas corpo a corpo, à distância, de fogo e explosivos
 * Modificações conforme Tabela 3.5 (pg. 93)
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

// Tipo de munição
export type AmmoType = 'balas_curtas' | 'balas_longas' | 'cartuchos' | 'flechas' | 'virotes' | 'combustivel' | 'foguete';

// ==================== SISTEMA DE MODIFICAÇÕES (Tabela 3.5) ====================

// Tipos de modificação disponíveis
// Modificações para armas corpo a corpo e de disparo (Tabela 3.5)
export type MeleeWeaponModification = 'certeira' | 'cruel' | 'discreta_melee' | 'perigosa' | 'tatica_melee';
// Modificações para armas de fogo (Tabela 3.5)
export type FirearmModification = 'alongada' | 'calibre_grosso' | 'compensador' | 'discreta_firearm' | 'ferrolho_automatico' | 'mira_laser' | 'mira_telescopica' | 'silenciador' | 'tatica_firearm' | 'visao_de_calor';
// Modificações para munições (Tabela 3.5)
export type AmmoModification = 'dum_dum' | 'explosiva';
export type WeaponModification = MeleeWeaponModification | FirearmModification | AmmoModification;

// Interface para dados de modificação
export interface WeaponModificationData {
  id: WeaponModification;
  name: string;
  description: string;
  applicableTo: ('melee' | 'ranged' | 'firearm')[];
  categoryIncrease: number; // +1 ou 0
  attackBonus?: number;      // Alongada: +2 em testes de ataque
  criticalBonus?: number;    // Perigosa/Mira Laser: +2 margem de ameaça
  damageBonus?: string;      // Calibre Grosso: +1 dado; Cruel: +2 rolagens de dano
  criticalMultiplierBonus?: number; // Dum dum: +1 multiplicador de crítico
  rangeBonus?: number;       // Mira Telescópica: aumenta alcance
  spaceReduction?: number;   // Discreta: -1 espaço
  properties?: string[];     // Propriedades adicionadas
  special?: string;          // Descrição de efeito especial
}

// Catálogo de modificações para armas corpo a corpo e de disparo (Tabela 3.5)
export const MELEE_WEAPON_MODIFICATIONS: WeaponModificationData[] = [
  {
    id: 'certeira',
    name: 'Certeira',
    description: '+2 em testes de ataque.',
    applicableTo: ['melee', 'ranged'],
    categoryIncrease: 1,
    attackBonus: 2,
  },
  {
    id: 'cruel',
    name: 'Cruel',
    description: '+2 em rolagens de dano.',
    applicableTo: ['melee', 'ranged'],
    categoryIncrease: 1,
    damageBonus: '+2',
  },
  {
    id: 'discreta_melee',
    name: 'Discreta',
    description: '+5 em testes para ser ocultada e reduz o espaço em –1.',
    applicableTo: ['melee', 'ranged'],
    categoryIncrease: 0,
    spaceReduction: 1,
    special: '+5 em testes para ser ocultada e reduz o espaço em –1',
  },
  {
    id: 'perigosa',
    name: 'Perigosa',
    description: '+2 em margem de ameaça.',
    applicableTo: ['melee', 'ranged'],
    categoryIncrease: 1,
    criticalBonus: 2,
  },
  {
    id: 'tatica_melee',
    name: 'Tática',
    description: 'Pode sacar como ação livre.',
    applicableTo: ['melee', 'ranged'],
    categoryIncrease: 1,
    special: 'Pode sacar como ação livre',
  },
];

// Catálogo de modificações para armas de fogo (Tabela 3.5)
export const FIREARM_MODIFICATIONS: WeaponModificationData[] = [
  {
    id: 'alongada',
    name: 'Alongada',
    description: '+2 em testes de ataque.',
    applicableTo: ['firearm'],
    categoryIncrease: 1,
    attackBonus: 2,
  },
  {
    id: 'calibre_grosso',
    name: 'Calibre Grosso',
    description: 'Aumenta o dano em mais um dado do mesmo tipo.',
    applicableTo: ['firearm'],
    categoryIncrease: 1,
    damageBonus: '+1 dado',
  },
  {
    id: 'compensador',
    name: 'Compensador',
    description: 'Anula penalidade por rajadas.',
    applicableTo: ['firearm'],
    categoryIncrease: 1,
    special: 'Anula penalidade por rajadas',
  },
  {
    id: 'discreta_firearm',
    name: 'Discreta',
    description: '+5 em testes para ser ocultada e reduz o espaço em –1.',
    applicableTo: ['firearm'],
    categoryIncrease: 0,
    spaceReduction: 1,
    special: '+5 em testes para ser ocultada e reduz o espaço em –1',
  },
  {
    id: 'ferrolho_automatico',
    name: 'Ferrolho Automático',
    description: 'A arma se torna automática.',
    applicableTo: ['firearm'],
    categoryIncrease: 1,
    special: 'A arma se torna automática',
  },
  {
    id: 'mira_laser',
    name: 'Mira Laser',
    description: '+2 em margem de ameaça.',
    applicableTo: ['firearm'],
    categoryIncrease: 1,
    criticalBonus: 2,
  },
  {
    id: 'mira_telescopica',
    name: 'Mira Telescópica',
    description: 'Aumenta alcance da arma e da habilidade Ataque Furtivo.',
    applicableTo: ['firearm'],
    categoryIncrease: 1,
    rangeBonus: 1,
    special: 'Aumenta alcance da arma e da habilidade Ataque Furtivo',
  },
  {
    id: 'silenciador',
    name: 'Silenciador',
    description: 'Reduz em –10 a penalidade em Furtividade para se esconder após atacar.',
    applicableTo: ['firearm'],
    categoryIncrease: 1,
    special: 'Reduz em –10 a penalidade em Furtividade para se esconder após atacar',
  },
  {
    id: 'tatica_firearm',
    name: 'Tática',
    description: 'Pode sacar como ação livre.',
    applicableTo: ['firearm'],
    categoryIncrease: 1,
    special: 'Pode sacar como ação livre',
  },
  {
    id: 'visao_de_calor',
    name: 'Visão de Calor',
    description: 'Ignora camuflagem.',
    applicableTo: ['firearm'],
    categoryIncrease: 1,
    special: 'Ignora camuflagem',
  },
];

// Catálogo de modificações para munições (Tabela 3.5)
export const AMMO_MODIFICATIONS: WeaponModificationData[] = [
  {
    id: 'dum_dum',
    name: 'Dum dum',
    description: '+1 em multiplicador de crítico.',
    applicableTo: ['firearm'],
    categoryIncrease: 1,
    criticalMultiplierBonus: 1,
  },
  {
    id: 'explosiva',
    name: 'Explosiva',
    description: 'Aumenta o dano em +2d6.',
    applicableTo: ['firearm'],
    categoryIncrease: 1,
    damageBonus: '+2d6',
  },
];

// Todas as modificações disponíveis
export const ALL_WEAPON_MODIFICATIONS: WeaponModificationData[] = [
  ...MELEE_WEAPON_MODIFICATIONS,
  ...FIREARM_MODIFICATIONS,
  ...AMMO_MODIFICATIONS,
];

// Interface para arma com modificações aplicadas
export interface ModifiedWeaponStats {
  baseWeapon: CatalogWeapon;
  modifications: WeaponModification[];
  finalCategory: CatalogWeapon['category'];
  attackBonus: number;
  criticalMargin: number;
  criticalMultiplier: number;
  damage: string;
  range?: RangeType;
  addedProperties: string[];
  specialEffects: string[];
}

// Interface completa para arma do catálogo
export interface CatalogWeapon {
  id: string;
  name: string;
  category: 'I' | 'II' | 'III' | 'IV' | '0' | 'especial';
  type: 'melee' | 'ranged' | 'thrown' | 'firearm';
  damage: string;
  damageType: DamageType;
  critical: number; // Margem de crítico (ex: 19 = 19-20, 20 = apenas 20)
  criticalMultiplier: number; // x2, x3, x4
  range?: RangeType;
  spaces: number; // Espaços no inventário
  proficiency: 'simples' | 'tatica' | 'pesada';
  properties?: string[];
  special?: string;
  ammoType?: AmmoType;
  description?: string;
  appliedModifications?: WeaponModification[]; // Modificações aplicadas
}

// ==================== ARMAS SIMPLES - CORPO A CORPO ====================

export const SIMPLE_MELEE_WEAPONS: CatalogWeapon[] = [
  {
    id: 'coronhada',
    name: 'Coronhada',
    category: 'especial',
    type: 'melee',
    damage: '1d4/1d6', // 1d4 pistola, 1d6 fuzil
    damageType: 'Impacto',
    critical: 20,
    criticalMultiplier: 2,
    range: 'Corpo a corpo',
    spaces: 0, // Não ocupa espaço (é a própria arma de fogo)
    proficiency: 'simples',
    properties: ['Especial'],
    description: 'Usar uma arma de fogo corpo a corpo para bater no alvo. Pistolas e revólveres causam 1d4 de dano de impacto; espingardas e fuzis, 1d6.',
  },
  {
    id: 'faca',
    name: 'Faca',
    category: '0',
    type: 'melee',
    damage: '1d4',
    damageType: 'Corte',
    critical: 19,
    criticalMultiplier: 2,
    range: 'Curto', // Arremessável
    spaces: 1,
    proficiency: 'simples',
    properties: ['Ágil', 'Arremessável'],
    description: 'Uma faca de combate comum. Pode ser arremessada em alcance curto.',
  },
  {
    id: 'martelo',
    name: 'Martelo',
    category: '0',
    type: 'melee',
    damage: '1d6',
    damageType: 'Impacto',
    critical: 20,
    criticalMultiplier: 2,
    range: 'Corpo a corpo',
    spaces: 1,
    proficiency: 'simples',
    description: 'Um martelo de construção ou ferramenta similar.',
  },
  {
    id: 'punhal',
    name: 'Punhal',
    category: '0',
    type: 'melee',
    damage: '1d4',
    damageType: 'Perfuração',
    critical: 20,
    criticalMultiplier: 3,
    range: 'Curto', // Arremessável
    spaces: 1,
    proficiency: 'simples',
    properties: ['Ágil', 'Arremessável'],
    description: 'Uma adaga ou punhal de lâmina perfurante. Pode ser arremessado.',
  },
  {
    id: 'machadinha',
    name: 'Machadinha',
    category: '0',
    type: 'melee',
    damage: '1d6',
    damageType: 'Corte',
    critical: 20,
    criticalMultiplier: 3,
    range: 'Curto', // Arremessável
    spaces: 1,
    proficiency: 'simples',
    properties: ['Arremessável'],
    description: 'Pequeno machado versátil. Pode ser arremessado em alcance curto.',
  },
  {
    id: 'bastao',
    name: 'Bastão',
    category: '0',
    type: 'melee',
    damage: '1d6/1d8', // Versátil
    damageType: 'Impacto',
    critical: 20,
    criticalMultiplier: 2,
    range: 'Corpo a corpo',
    spaces: 1,
    proficiency: 'simples',
    properties: ['Versátil'],
    description: 'Bastão de madeira ou metal. Causa 1d6 com uma mão ou 1d8 com duas mãos.',
  },
  {
    id: 'machete',
    name: 'Machete',
    category: '0',
    type: 'melee',
    damage: '1d6',
    damageType: 'Corte',
    critical: 19,
    criticalMultiplier: 2,
    range: 'Corpo a corpo',
    spaces: 1,
    proficiency: 'simples',
    description: 'Facão grande usado para cortar vegetação e como arma.',
  },
  {
    id: 'lanca',
    name: 'Lança',
    category: '0',
    type: 'melee',
    damage: '1d6',
    damageType: 'Perfuração',
    critical: 20,
    criticalMultiplier: 2,
    range: 'Curto', // Arremessável
    spaces: 1,
    proficiency: 'simples',
    properties: ['Arremessável'],
    description: 'Uma lança simples com ponta afiada. Pode ser arremessada.',
  },
  {
    id: 'cajado',
    name: 'Cajado',
    category: '0',
    type: 'melee',
    damage: '1d6/1d6',
    damageType: 'Impacto',
    critical: 20,
    criticalMultiplier: 2,
    range: 'Corpo a corpo',
    spaces: 2,
    proficiency: 'simples',
    properties: ['Duas mãos'],
    description: 'Bastão longo de duas mãos. Pode ser usado para fazer dois ataques, um com cada ponta.',
  },
];

// ==================== ARMAS SIMPLES - À DISTÂNCIA ====================

export const SIMPLE_RANGED_WEAPONS: CatalogWeapon[] = [
  {
    id: 'arco',
    name: 'Arco',
    category: '0',
    type: 'ranged',
    damage: '1d6',
    damageType: 'Perfuração',
    critical: 20,
    criticalMultiplier: 3,
    range: 'Médio',
    spaces: 2,
    proficiency: 'simples',
    properties: ['Duas mãos'],
    ammoType: 'flechas',
    description: 'Arco longo tradicional. Requer flechas para disparar.',
  },
  {
    id: 'besta',
    name: 'Besta',
    category: '0',
    type: 'ranged',
    damage: '1d8',
    damageType: 'Perfuração',
    critical: 19,
    criticalMultiplier: 2,
    range: 'Médio',
    spaces: 2,
    proficiency: 'simples',
    ammoType: 'virotes',
    description: 'Besta mecânica. Requer virotes para disparar.',
  },
  {
    id: 'fuzil_caca',
    name: 'Fuzil de Caça',
    category: 'I',
    type: 'firearm',
    damage: '2d8',
    damageType: 'Balístico',
    critical: 19,
    criticalMultiplier: 3,
    range: 'Médio',
    spaces: 2,
    proficiency: 'simples',
    properties: ['Duas mãos'],
    ammoType: 'balas_longas',
    description: 'Rifle de caça de ação manual. Usado para caçar animais de grande porte.',
  },
];

// ==================== ARMAS SIMPLES - DE FOGO ====================

export const SIMPLE_FIREARMS: CatalogWeapon[] = [
  {
    id: 'pistola',
    name: 'Pistola',
    category: 'I',
    type: 'firearm',
    damage: '1d12',
    damageType: 'Balístico',
    critical: 18,
    criticalMultiplier: 2,
    range: 'Curto',
    spaces: 1,
    proficiency: 'simples',
    ammoType: 'balas_curtas',
    description: 'Pistola semiautomática padrão.',
  },
  {
    id: 'revolver',
    name: 'Revólver',
    category: 'I',
    type: 'firearm',
    damage: '2d6',
    damageType: 'Balístico',
    critical: 19,
    criticalMultiplier: 3,
    range: 'Curto',
    spaces: 1,
    proficiency: 'simples',
    ammoType: 'balas_curtas',
    description: 'Revólver de tambor clássico.',
  },
];

// ==================== ARMAS TÁTICAS - CORPO A CORPO ====================

export const TACTICAL_MELEE_WEAPONS: CatalogWeapon[] = [
  {
    id: 'nunchaku',
    name: 'Nunchaku',
    category: '0',
    type: 'melee',
    damage: '1d8',
    damageType: 'Impacto',
    critical: 20,
    criticalMultiplier: 2,
    range: 'Corpo a corpo',
    spaces: 1,
    proficiency: 'tatica',
    properties: ['Ágil'],
    description: 'Duas hastes conectadas por corrente ou corda. Arma tradicional oriental.',
  },
  {
    id: 'corrente',
    name: 'Corrente',
    category: '0',
    type: 'melee',
    damage: '1d8',
    damageType: 'Impacto',
    critical: 20,
    criticalMultiplier: 2,
    range: 'Corpo a corpo',
    spaces: 2,
    proficiency: 'tatica',
    properties: ['Alcance'],
    description: 'Corrente pesada com peso na ponta. Possui alcance estendido.',
  },
  {
    id: 'espada',
    name: 'Espada',
    category: 'I',
    type: 'melee',
    damage: '1d8/1d10', // Versátil
    damageType: 'Corte',
    critical: 19,
    criticalMultiplier: 2,
    range: 'Corpo a corpo',
    spaces: 1,
    proficiency: 'tatica',
    properties: ['Versátil'],
    description: 'Espada de lâmina reta. Causa 1d8 com uma mão ou 1d10 com duas mãos.',
  },
  {
    id: 'florete',
    name: 'Florete',
    category: 'I',
    type: 'melee',
    damage: '1d6',
    damageType: 'Perfuração',
    critical: 18,
    criticalMultiplier: 2,
    range: 'Corpo a corpo',
    spaces: 1,
    proficiency: 'tatica',
    properties: ['Ágil'],
    description: 'Espada fina e leve, ideal para estocadas precisas.',
  },
  {
    id: 'katana',
    name: 'Katana',
    category: 'I',
    type: 'melee',
    damage: '1d10',
    damageType: 'Corte',
    critical: 19,
    criticalMultiplier: 2,
    range: 'Corpo a corpo',
    spaces: 2,
    proficiency: 'tatica',
    properties: ['Duas mãos', 'Ágil'],
    description: 'Espada japonesa de lâmina curva. Leve e mortalmente afiada.',
  },
  {
    id: 'maca',
    name: 'Maça',
    category: 'I',
    type: 'melee',
    damage: '2d4',
    damageType: 'Impacto',
    critical: 20,
    criticalMultiplier: 2,
    range: 'Corpo a corpo',
    spaces: 1,
    proficiency: 'tatica',
    description: 'Maça de metal com cabeça pesada.',
  },
  {
    id: 'marreta',
    name: 'Marreta',
    category: 'I',
    type: 'melee',
    damage: '3d4',
    damageType: 'Impacto',
    critical: 20,
    criticalMultiplier: 2,
    range: 'Corpo a corpo',
    spaces: 2,
    proficiency: 'tatica',
    properties: ['Duas mãos'],
    description: 'Martelo pesado de demolição.',
  },
  {
    id: 'montante',
    name: 'Montante',
    category: 'I',
    type: 'melee',
    damage: '2d6',
    damageType: 'Corte',
    critical: 19,
    criticalMultiplier: 2,
    range: 'Corpo a corpo',
    spaces: 2,
    proficiency: 'tatica',
    properties: ['Duas mãos'],
    description: 'Espada enorme de duas mãos.',
  },
  {
    id: 'acha',
    name: 'Acha',
    category: 'I',
    type: 'melee',
    damage: '1d12',
    damageType: 'Corte',
    critical: 20,
    criticalMultiplier: 3,
    range: 'Corpo a corpo',
    spaces: 2,
    proficiency: 'tatica',
    properties: ['Duas mãos'],
    description: 'Machado de guerra de duas mãos.',
  },
  {
    id: 'gadanho',
    name: 'Gadanho',
    category: 'I',
    type: 'melee',
    damage: '2d4',
    damageType: 'Corte',
    critical: 20,
    criticalMultiplier: 4,
    range: 'Corpo a corpo',
    spaces: 2,
    proficiency: 'tatica',
    properties: ['Duas mãos'],
    description: 'Foice grande usada como arma. Crítico devastador.',
  },
  {
    id: 'motosserra',
    name: 'Motosserra',
    category: 'I',
    type: 'melee',
    damage: '3d6',
    damageType: 'Corte',
    critical: 20,
    criticalMultiplier: 2,
    range: 'Corpo a corpo',
    spaces: 2,
    proficiency: 'tatica',
    properties: ['Duas mãos'],
    ammoType: 'combustivel',
    description: 'Serra elétrica motorizada. Consome combustível para funcionar.',
  },
];

// ==================== ARMAS TÁTICAS - À DISTÂNCIA ====================

export const TACTICAL_RANGED_WEAPONS: CatalogWeapon[] = [
  {
    id: 'arco_composto',
    name: 'Arco Composto',
    category: 'I',
    type: 'ranged',
    damage: '1d10',
    damageType: 'Perfuração',
    critical: 20,
    criticalMultiplier: 3,
    range: 'Médio',
    spaces: 2,
    proficiency: 'tatica',
    properties: ['Duas mãos'],
    ammoType: 'flechas',
    description: 'Arco moderno com sistema de polias. Mais potente que o arco comum.',
  },
  {
    id: 'balestra',
    name: 'Balestra',
    category: 'I',
    type: 'ranged',
    damage: '1d12',
    damageType: 'Perfuração',
    critical: 19,
    criticalMultiplier: 2,
    range: 'Médio',
    spaces: 2,
    proficiency: 'tatica',
    ammoType: 'virotes',
    description: 'Besta pesada de alta potência.',
  },
];

// ==================== ARMAS TÁTICAS - DE FOGO ====================

export const TACTICAL_FIREARMS: CatalogWeapon[] = [
  {
    id: 'submetralhadora',
    name: 'Submetralhadora',
    category: 'I',
    type: 'firearm',
    damage: '2d6',
    damageType: 'Balístico',
    critical: 19,
    criticalMultiplier: 2,
    range: 'Curto',
    spaces: 2,
    proficiency: 'tatica',
    properties: ['Automática'],
    ammoType: 'balas_curtas',
    description: 'Arma automática compacta. Pode fazer tiro automático.',
  },
  {
    id: 'espingarda',
    name: 'Espingarda',
    category: 'I',
    type: 'firearm',
    damage: '4d6',
    damageType: 'Balístico',
    critical: 20,
    criticalMultiplier: 3,
    range: 'Curto',
    spaces: 2,
    proficiency: 'tatica',
    properties: ['Duas mãos'],
    ammoType: 'cartuchos',
    description: 'Espingarda de cartuchos. Devastadora em curto alcance.',
  },
  {
    id: 'fuzil_assalto',
    name: 'Fuzil de Assalto',
    category: 'II',
    type: 'firearm',
    damage: '2d10',
    damageType: 'Balístico',
    critical: 19,
    criticalMultiplier: 2,
    range: 'Médio',
    spaces: 2,
    proficiency: 'tatica',
    properties: ['Duas mãos', 'Automática'],
    ammoType: 'balas_longas',
    description: 'Fuzil militar automático. Arma padrão de combate.',
  },
  {
    id: 'fuzil_precisao',
    name: 'Fuzil de Precisão',
    category: 'II',
    type: 'firearm',
    damage: '2d10',
    damageType: 'Balístico',
    critical: 19,
    criticalMultiplier: 3,
    range: 'Longo',
    spaces: 2,
    proficiency: 'tatica',
    properties: ['Duas mãos'],
    ammoType: 'balas_longas',
    description: 'Rifle sniper de alta precisão. Ideal para longas distâncias.',
  },
];

// ==================== ARMAS PESADAS ====================

export const HEAVY_WEAPONS: CatalogWeapon[] = [
  {
    id: 'metralhadora',
    name: 'Metralhadora',
    category: 'II',
    type: 'firearm',
    damage: '2d12',
    damageType: 'Balístico',
    critical: 19,
    criticalMultiplier: 3,
    range: 'Médio',
    spaces: 2,
    proficiency: 'pesada',
    properties: ['Duas mãos', 'Automática'],
    ammoType: 'balas_longas',
    description: 'Metralhadora pesada. Poder de fogo devastador.',
  },
  {
    id: 'bazuca',
    name: 'Bazuca',
    category: 'III',
    type: 'firearm',
    damage: '10d8',
    damageType: 'Impacto',
    critical: 20,
    criticalMultiplier: 2,
    range: 'Médio',
    spaces: 2,
    proficiency: 'pesada',
    properties: ['Duas mãos'],
    ammoType: 'foguete',
    description: 'Lançador de foguetes antitanque. Causa dano massivo em área.',
  },
  {
    id: 'lanca_chamas',
    name: 'Lança-chamas',
    category: 'III',
    type: 'firearm',
    damage: '6d6',
    damageType: 'Fogo',
    critical: 20,
    criticalMultiplier: 2,
    range: 'Curto',
    spaces: 2,
    proficiency: 'pesada',
    properties: ['Duas mãos'],
    ammoType: 'combustivel',
    description: 'Projeta jatos de fogo. Queima tudo em seu caminho.',
  },
];

// ==================== EXPLOSIVOS ====================

export const EXPLOSIVES: CatalogWeapon[] = [
  {
    id: 'granada_explosiva',
    name: 'Granada Explosiva',
    category: 'II',
    type: 'thrown',
    damage: '6d6',
    damageType: 'Impacto',
    critical: 20,
    criticalMultiplier: 2,
    range: 'Curto',
    spaces: 1,
    proficiency: 'simples',
    properties: ['Área', 'Consumível'],
    special: 'Afeta todos os alvos em alcance curto a partir do ponto de impacto.',
    description: 'Granada militar padrão.',
  },
  {
    id: 'granada_incendiaria',
    name: 'Granada Incendiária',
    category: 'II',
    type: 'thrown',
    damage: '6d6',
    damageType: 'Fogo',
    critical: 20,
    criticalMultiplier: 2,
    range: 'Curto',
    spaces: 1,
    proficiency: 'simples',
    properties: ['Área', 'Consumível', 'Fogo'],
    special: 'Afeta todos os alvos em alcance curto. A área fica em chamas por um número de rodadas igual ao dano de Fogo.',
    description: 'Granada que espalha fogo.',
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
    special: 'Afeta alvos adjacentes ao ponto de impacto.',
    description: 'Garrafa incendiária improvisada.',
  },
  {
    id: 'dinamite',
    name: 'Dinamite',
    category: 'I',
    type: 'thrown',
    damage: '4d12',
    damageType: 'Impacto',
    critical: 20,
    criticalMultiplier: 2,
    range: 'Curto',
    spaces: 1,
    proficiency: 'simples',
    properties: ['Área', 'Consumível'],
    special: 'Afeta todos os alvos em alcance curto a partir do ponto de impacto. Precisa ser acesa antes de arremessada.',
    description: 'Bastão de explosivo industrial.',
  },
  {
    id: 'mina',
    name: 'Mina',
    category: 'II',
    type: 'thrown',
    damage: '8d6',
    damageType: 'Impacto',
    critical: 20,
    criticalMultiplier: 2,
    range: 'Curto',
    spaces: 1,
    proficiency: 'tatica',
    properties: ['Área', 'Consumível'],
    special: 'Instalada em uma superfície, detona quando alguém se aproxima. Afeta todos os alvos em alcance curto.',
    description: 'Mina terrestre com sensor de proximidade.',
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
    properties: ['Ágil', 'Ritual'],
    special: '+2 em rituais de Sangue, dano afeta entidades paranormais.',
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
    special: 'Dano dobrado contra licantropos e mortos-vivos.',
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
    special: 'Adiciona 1d6 de dano de Conhecimento, afeta entidades paranormais.',
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

// ==================== LISTAS AGRUPADAS POR PROFICIÊNCIA ====================

// Todas as armas corpo a corpo
export const MELEE_WEAPONS: CatalogWeapon[] = [
  ...SIMPLE_MELEE_WEAPONS,
  ...TACTICAL_MELEE_WEAPONS,
];

// Todas as armas à distância (arcos e bestas)
export const RANGED_WEAPONS: CatalogWeapon[] = [
  ...SIMPLE_RANGED_WEAPONS,
  ...TACTICAL_RANGED_WEAPONS,
];

// Todas as armas de fogo
export const FIREARMS: CatalogWeapon[] = [
  ...SIMPLE_FIREARMS,
  ...TACTICAL_FIREARMS,
  ...HEAVY_WEAPONS,
];

// Todos os explosivos
export const THROWN_WEAPONS: CatalogWeapon[] = [
  ...EXPLOSIVES,
];

// ==================== CATÁLOGO COMPLETO ====================

export const ALL_WEAPONS: CatalogWeapon[] = [
  ...MELEE_WEAPONS,
  ...RANGED_WEAPONS,
  ...FIREARMS,
  ...THROWN_WEAPONS,
  ...SPECIAL_WEAPONS,
];

// Função para buscar arma por ID
export function getWeaponById(id: string): CatalogWeapon | undefined {
  return ALL_WEAPONS.find(w => w.id === id);
}

// Função para buscar armas por categoria
export function getWeaponsByCategory(category: 'I' | 'II' | 'III' | 'IV' | '0' | 'especial'): CatalogWeapon[] {
  return ALL_WEAPONS.filter(w => w.category === category);
}

// Função para buscar armas por tipo
export function getWeaponsByType(type: 'melee' | 'ranged' | 'thrown' | 'firearm'): CatalogWeapon[] {
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
  firearm: { label: 'Armas de Fogo', icon: 'Zap' },
  thrown: { label: 'Explosivos', icon: 'Bomb' },
  special: { label: 'Especiais', icon: 'Sparkles' },
};

// Proficiências para UI
export const PROFICIENCY_LABELS = {
  simples: { label: 'Simples', color: 'text-green-500' },
  tatica: { label: 'Tática', color: 'text-blue-500' },
  pesada: { label: 'Pesada', color: 'text-purple-500' },
};

// Tipos de munição para UI
export const AMMO_LABELS: Record<AmmoType, string> = {
  balas_curtas: 'Balas Curtas',
  balas_longas: 'Balas Longas',
  cartuchos: 'Cartuchos',
  flechas: 'Flechas',
  virotes: 'Virotes',
  combustivel: 'Combustível',
  foguete: 'Foguete',
};

// ==================== FUNÇÕES DE MODIFICAÇÃO ====================

// Ordem de categorias para cálculo
const CATEGORY_ORDER: CatalogWeapon['category'][] = ['0', 'I', 'II', 'III', 'IV'];

// Obter modificação por ID
export function getWeaponModificationById(id: WeaponModification): WeaponModificationData | undefined {
  return ALL_WEAPON_MODIFICATIONS.find(m => m.id === id);
}

// Verificar se modificação é aplicável a uma arma
export function canApplyModification(weapon: CatalogWeapon, modId: WeaponModification): boolean {
  const mod = getWeaponModificationById(modId);
  if (!mod) return false;
  
  // Verifica se o tipo da arma é compatível
  if (weapon.type === 'thrown') return false; // Explosivos não podem ser modificados
  if (weapon.category === 'especial') return false; // Armas especiais não podem ser modificadas
  
  return mod.applicableTo.includes(weapon.type);
}

// Obter modificações disponíveis para uma arma (excluindo já aplicadas se especificado)
export function getAvailableModifications(
  weapon: CatalogWeapon, 
  excludeApplied: WeaponModification[] = []
): WeaponModificationData[] {
  return ALL_WEAPON_MODIFICATIONS.filter(mod => 
    canApplyModification(weapon, mod.id) && 
    !excludeApplied.includes(mod.id)
  );
}

// Calcular nova categoria após modificações
export function getModifiedCategory(
  baseCategory: CatalogWeapon['category'], 
  modifications: WeaponModification[]
): CatalogWeapon['category'] {
  if (baseCategory === 'especial') return 'especial';
  
  const baseIndex = CATEGORY_ORDER.indexOf(baseCategory);
  if (baseIndex === -1) return baseCategory;
  
  // Calcula total de aumentos de categoria
  const totalIncrease = modifications.reduce((acc, modId) => {
    const mod = getWeaponModificationById(modId);
    return acc + (mod?.categoryIncrease || 0);
  }, 0);
  
  // Aplica o aumento, máximo Cat IV
  const newIndex = Math.min(baseIndex + totalIncrease, CATEGORY_ORDER.length - 1);
  return CATEGORY_ORDER[newIndex];
}

// Calcular próxima categoria de alcance
function getNextRange(range: RangeType | undefined): RangeType | undefined {
  if (!range) return undefined;
  const rangeOrder: RangeType[] = ['Corpo a corpo', 'Curto', 'Médio', 'Longo', 'Extremo'];
  const index = rangeOrder.indexOf(range);
  if (index === -1 || index >= rangeOrder.length - 1) return range;
  return rangeOrder[index + 1];
}

// Aumentar dado de dano (ex: 1d6 → 2d6, 2d6 → 3d6)
function increaseDamageDie(damage: string): string {
  // Padrão: XdY ou XdY/ZdW (versátil)
  const match = damage.match(/^(\d+)d(\d+)(\/(\d+)d(\d+))?$/);
  if (!match) return damage;
  
  const diceCount = parseInt(match[1]);
  const dieType = match[2];
  
  if (match[3]) {
    // Arma versátil: aumenta ambos os danos
    const versatileDice = parseInt(match[4]);
    return `${diceCount + 1}d${dieType}/${versatileDice + 1}d${match[5]}`;
  }
  
  return `${diceCount + 1}d${dieType}`;
}

// Calcular estatísticas finais com modificações
export function calculateModifiedWeaponStats(
  baseWeapon: CatalogWeapon, 
  modifications: WeaponModification[]
): ModifiedWeaponStats {
  let attackBonus = 0;
  let criticalMargin = baseWeapon.critical;
  let criticalMultiplier = baseWeapon.criticalMultiplier;
  let damage = baseWeapon.damage;
  let range = baseWeapon.range;
  const addedProperties: string[] = [];
  const specialEffects: string[] = [];
  
  // Aplica cada modificação
  for (const modId of modifications) {
    const mod = getWeaponModificationById(modId);
    if (!mod) continue;
    
    // Bônus de ataque (Certeira, Alongada)
    if (mod.attackBonus) {
      attackBonus += mod.attackBonus;
    }
    
    // Bônus de margem de ameaça (Perigosa, Mira Laser: +2)
    if (mod.criticalBonus) {
      criticalMargin -= mod.criticalBonus; // Reduz margem = aumenta chance
    }
    
    // Bônus de dano
    if (mod.damageBonus) {
      if (mod.damageBonus === '+1 dado') {
        // Calibre Grosso: adiciona mais um dado do mesmo tipo
        damage = increaseDamageDie(damage);
      } else if (mod.damageBonus === '+2d6') {
        // Explosiva: adiciona +2d6 ao dano
        damage = `${damage}+2d6`;
      } else if (mod.damageBonus === '+2') {
        // Cruel: +2 em rolagens de dano (bônus fixo)
        damage = `${damage}+2`;
      }
    }
    
    // Bônus de multiplicador de crítico (Dum dum)
    if (mod.criticalMultiplierBonus) {
      criticalMultiplier += mod.criticalMultiplierBonus;
    }
    
    // Bônus de alcance (Mira Telescópica)
    if (mod.rangeBonus) {
      range = getNextRange(range);
    }
    
    // Propriedades adicionais
    if (mod.properties) {
      addedProperties.push(...mod.properties);
    }
    
    // Efeitos especiais
    if (mod.special) {
      specialEffects.push(mod.special);
    }
  }
  
  return {
    baseWeapon,
    modifications,
    finalCategory: getModifiedCategory(baseWeapon.category, modifications),
    attackBonus,
    criticalMargin: Math.max(criticalMargin, 1), // Mínimo 1
    criticalMultiplier,
    damage,
    range,
    addedProperties,
    specialEffects,
  };
}

// Labels para modificações na UI
export const MODIFICATION_LABELS: Record<WeaponModification, { label: string; color: string; icon: string }> = {
  certeira: { label: 'Certeira', color: 'text-blue-500', icon: 'Target' },
  cruel: { label: 'Cruel', color: 'text-red-500', icon: 'Skull' },
  discreta_melee: { label: 'Discreta', color: 'text-gray-500', icon: 'EyeOff' },
  perigosa: { label: 'Perigosa', color: 'text-orange-500', icon: 'AlertTriangle' },
  tatica_melee: { label: 'Tática', color: 'text-purple-500', icon: 'Wrench' },
  alongada: { label: 'Alongada', color: 'text-cyan-500', icon: 'Target' },
  calibre_grosso: { label: 'Calibre Grosso', color: 'text-amber-500', icon: 'CircleDot' },
  compensador: { label: 'Compensador', color: 'text-green-500', icon: 'Crosshair' },
  discreta_firearm: { label: 'Discreta', color: 'text-gray-500', icon: 'EyeOff' },
  ferrolho_automatico: { label: 'Ferrolho Automático', color: 'text-red-400', icon: 'Wrench' },
  mira_laser: { label: 'Mira Laser', color: 'text-red-400', icon: 'Focus' },
  mira_telescopica: { label: 'Mira Telescópica', color: 'text-indigo-500', icon: 'Maximize2' },
  silenciador: { label: 'Silenciador', color: 'text-gray-400', icon: 'EyeOff' },
  tatica_firearm: { label: 'Tática', color: 'text-purple-500', icon: 'Wrench' },
  visao_de_calor: { label: 'Visão de Calor', color: 'text-orange-400', icon: 'Focus' },
  dum_dum: { label: 'Dum dum', color: 'text-red-600', icon: 'Skull' },
  explosiva: { label: 'Explosiva', color: 'text-amber-600', icon: 'AlertTriangle' },
};
