/**
 * Catálogo de Equipamentos de Proteção - Ordem Paranormal RPG
 * Contém armaduras, coletes e escudos com RD e penalidades
 */

// Interface para equipamentos de proteção
export interface CatalogArmor {
  id: string;
  name: string;
  type: 'leve' | 'pesada' | 'escudo';
  rd: number; // Resistência a Dano
  agilityPenalty: number; // Penalidade em Agilidade
  speedPenalty: number; // Penalidade em Deslocamento (metros)
  category: 'I' | 'II' | 'III' | 'IV';
  spaces: number;
  description: string;
  special?: string;
}

// ==================== PROTEÇÕES LEVES ====================
export const LIGHT_ARMORS: CatalogArmor[] = [
  {
    id: 'colete_kevlar',
    name: 'Colete de Kevlar',
    type: 'leve',
    rd: 2,
    agilityPenalty: 0,
    speedPenalty: 0,
    category: 'I',
    spaces: 2,
    description: 'Colete leve e discreto, feito de fibras de kevlar. Pode ser usado sob roupas.',
    special: 'Discreto: pode ser escondido sob roupas comuns.'
  },
  {
    id: 'colete_tatico',
    name: 'Colete Tático',
    type: 'leve',
    rd: 4,
    agilityPenalty: 0,
    speedPenalty: 0,
    category: 'I',
    spaces: 2,
    description: 'Colete tático padrão da Ordem, com bolsos para equipamentos.',
    special: 'Possui bolsos que permitem carregar 2 itens de categoria 0.'
  },
  {
    id: 'jaqueta_couro',
    name: 'Jaqueta de Couro Reforçada',
    type: 'leve',
    rd: 1,
    agilityPenalty: 0,
    speedPenalty: 0,
    category: 'I',
    spaces: 1,
    description: 'Jaqueta de couro reforçada com placas discretas.',
    special: 'Discreto: parece uma jaqueta comum.'
  },
  {
    id: 'roupa_tatica',
    name: 'Roupa Tática Leve',
    type: 'leve',
    rd: 3,
    agilityPenalty: 0,
    speedPenalty: 0,
    category: 'II',
    spaces: 2,
    description: 'Conjunto de roupa tática com proteção em áreas vitais.',
  },
  {
    id: 'colete_policial',
    name: 'Colete Policial',
    type: 'leve',
    rd: 5,
    agilityPenalty: -1,
    speedPenalty: 0,
    category: 'II',
    spaces: 3,
    description: 'Colete balístico de uso policial, mais robusto que o kevlar comum.',
  }
];

// ==================== PROTEÇÕES PESADAS ====================
export const HEAVY_ARMORS: CatalogArmor[] = [
  {
    id: 'colete_tactico_pesado',
    name: 'Colete Tático Pesado',
    type: 'pesada',
    rd: 6,
    agilityPenalty: -2,
    speedPenalty: -1.5,
    category: 'II',
    spaces: 4,
    description: 'Colete pesado com placas cerâmicas de alta resistência.',
  },
  {
    id: 'armadura_riot',
    name: 'Armadura de Choque',
    type: 'pesada',
    rd: 8,
    agilityPenalty: -3,
    speedPenalty: -3,
    category: 'III',
    spaces: 5,
    description: 'Armadura completa usada por forças de choque, cobre todo o corpo.',
    special: 'Resistência +2 contra dano de impacto.'
  },
  {
    id: 'armadura_tatica_completa',
    name: 'Armadura Tática Completa',
    type: 'pesada',
    rd: 7,
    agilityPenalty: -2,
    speedPenalty: -1.5,
    category: 'III',
    spaces: 5,
    description: 'Armadura corporal completa usada por operações especiais.',
  },
  {
    id: 'armadura_eod',
    name: 'Armadura EOD',
    type: 'pesada',
    rd: 10,
    agilityPenalty: -5,
    speedPenalty: -4.5,
    category: 'IV',
    spaces: 8,
    description: 'Armadura de desarmamento de explosivos, extremamente pesada.',
    special: 'Resistência +5 contra dano de fogo e explosão.'
  },
  {
    id: 'exoesqueleto_ordem',
    name: 'Exoesqueleto da Ordem',
    type: 'pesada',
    rd: 12,
    agilityPenalty: -1,
    speedPenalty: 0,
    category: 'IV',
    spaces: 10,
    description: 'Exoesqueleto motorizado experimental da Ordem, combina proteção com mobilidade.',
    special: 'Força +2 para testes de Luta e carregar peso. Requer bateria (8 horas de uso).'
  }
];

// ==================== ESCUDOS ====================
export const SHIELDS: CatalogArmor[] = [
  {
    id: 'escudo_riot',
    name: 'Escudo de Choque',
    type: 'escudo',
    rd: 4,
    agilityPenalty: -1,
    speedPenalty: 0,
    category: 'II',
    spaces: 3,
    description: 'Escudo transparente usado por forças de choque.',
    special: 'Defesa +2 contra ataques à distância vindos da frente. Ocupa uma mão.'
  },
  {
    id: 'escudo_balistico',
    name: 'Escudo Balístico',
    type: 'escudo',
    rd: 6,
    agilityPenalty: -2,
    speedPenalty: -1.5,
    category: 'III',
    spaces: 4,
    description: 'Escudo balístico pesado, capaz de deter projéteis de grosso calibre.',
    special: 'Defesa +4 contra ataques à distância vindos da frente. Ocupa uma mão.'
  },
  {
    id: 'escudo_tatico',
    name: 'Escudo Tático',
    type: 'escudo',
    rd: 3,
    agilityPenalty: 0,
    speedPenalty: 0,
    category: 'I',
    spaces: 2,
    description: 'Escudo leve e compacto para operações táticas.',
    special: 'Defesa +1 contra ataques corpo a corpo. Ocupa uma mão.'
  },
  {
    id: 'escudo_paranormal',
    name: 'Escudo Paranormal',
    type: 'escudo',
    rd: 5,
    agilityPenalty: 0,
    speedPenalty: 0,
    category: 'IV',
    spaces: 3,
    description: 'Escudo imbuído com energia paranormal, capaz de bloquear ataques sobrenaturais.',
    special: 'Defesa +2 contra rituais e ataques paranormais. Ocupa uma mão. Requer 1 PE por cena para ativar.'
  }
];

// Catálogo completo de proteções
export const ALL_ARMORS: CatalogArmor[] = [
  ...LIGHT_ARMORS,
  ...HEAVY_ARMORS,
  ...SHIELDS
];

// Função para buscar proteção por ID
export function getArmorById(id: string): CatalogArmor | undefined {
  return ALL_ARMORS.find(armor => armor.id === id);
}

// Função para obter nome do tipo
export function getArmorTypeName(type: CatalogArmor['type']): string {
  const names: Record<CatalogArmor['type'], string> = {
    leve: 'Proteção Leve',
    pesada: 'Proteção Pesada',
    escudo: 'Escudo'
  };
  return names[type];
}

// Função para formatar penalidades
export function formatPenalties(armor: CatalogArmor): string {
  const penalties: string[] = [];
  
  if (armor.agilityPenalty !== 0) {
    penalties.push(`AGI ${armor.agilityPenalty}`);
  }
  
  if (armor.speedPenalty !== 0) {
    penalties.push(`Desl. ${armor.speedPenalty}m`);
  }
  
  return penalties.length > 0 ? penalties.join(', ') : 'Nenhuma';
}
