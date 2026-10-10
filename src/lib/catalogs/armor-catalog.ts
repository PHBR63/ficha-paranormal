/**
 * Catálogo de Proteções - Ordem Paranormal RPG
 * Baseado EXATAMENTE no livro de regras oficial (Tabela 3.6, p. 62)
 * 
 * IMPORTANTE: O livro tem apenas 3 tipos de proteção base:
 * - Proteção Leve (+5 Defesa, Cat I, 2 espaços)
 * - Proteção Pesada (+10 Defesa, Cat II, 5 espaços) 
 * - Escudo (+2 Defesa, Cat I, 2 espaços)
 * 
 * Modificações podem ser aplicadas para criar variações.
 */

// Tipo de modificação de proteção
export type ArmorModification = 'antibombas' | 'blindada' | 'discreta' | 'reforcada';

// Interface para modificações
export interface ArmorModificationData {
  id: ArmorModification;
  name: string;
  description: string;
  effect: string;
  applicableTo: ('leve' | 'pesada' | 'escudo')[];
  defenseBonus?: number;
  spacesModifier?: number;
  rdBonus?: number;
}

// Interface para equipamentos de proteção
export interface CatalogArmor {
  id: string;
  name: string;
  type: 'leve' | 'pesada' | 'escudo';
  defenseBonus: number; // Bônus de Defesa fornecido pela proteção
  rd?: number; // Resistência a Dano (apenas Proteção Pesada tem RD 2 contra balístico, corte, impacto e perfuração)
  agilityPenalty: number; // Penalidade em testes de perícias que sofrem penalidade de carga
  category: 'I' | 'II' | 'III' | 'IV';
  spaces: number;
  description: string;
  special?: string;
  modifications?: ArmorModification[];
}

// ==================== MODIFICAÇÕES PARA PROTEÇÕES ====================
// Tabela 3.7: Modificações para Proteções (p. 62)

export const ARMOR_MODIFICATIONS: ArmorModificationData[] = [
  {
    id: 'antibombas',
    name: 'Antibombas',
    description: 'Quimicamente tratada para resistir ao calor e revestida de preenchimentos para amortecer estilhaços. Acompanha um capacete com viseira para proteger da luz e barulho de explosões.',
    effect: '+5 em testes de resistência contra efeitos de área',
    applicableTo: ['pesada'], // Só pode ser aplicada em proteções pesadas
  },
  {
    id: 'blindada',
    name: 'Blindada',
    description: 'Reforçada com placas de aço e cerâmica costuradas dentro das camadas de kevlar. Aumenta a resistência a dano para 5 e o espaço ocupado em +1.',
    effect: 'Aumenta RD para 5 e espaço em +1',
    applicableTo: ['pesada'], // Só pode ser aplicada em proteções pesadas
    rdBonus: 3, // RD 2 -> 5
    spacesModifier: 1,
  },
  {
    id: 'discreta',
    name: 'Discreta',
    description: 'Colete compacto feito com kevlar denso para reduzir o volume. Reduz o número de espaços ocupados em 1, fornece +5 em testes de Crime para ser ocultada e permite que você faça esse teste mesmo que não seja treinado na perícia.',
    effect: '+5 em testes de ocultar e reduz o espaço em -1',
    applicableTo: ['leve'], // Só pode ser aplicada em proteções leves
    spacesModifier: -1,
  },
  {
    id: 'reforcada',
    name: 'Reforçada',
    description: 'Aumenta a Defesa fornecida em +2 e o espaço ocupado em +1. Uma proteção não pode ser reforçada e discreta ao mesmo tempo.',
    effect: 'Aumenta a Defesa em +2 e o espaço em +1',
    applicableTo: ['leve', 'pesada', 'escudo'],
    defenseBonus: 2,
    spacesModifier: 1,
  },
];

// ==================== PROTEÇÕES BASE ====================
// Conforme Tabela 3.6: Proteções (p. 62)

export const BASE_ARMORS: CatalogArmor[] = [
  {
    id: 'protecao_leve',
    name: 'Proteção Leve',
    type: 'leve',
    defenseBonus: 5,
    agilityPenalty: 0,
    category: 'I',
    spaces: 2,
    description: 'Jaqueta de couro pesada ou um colete de kevlar. Essa proteção é tipicamente usada por seguranças e policiais.',
  },
  {
    id: 'protecao_pesada',
    name: 'Proteção Pesada',
    type: 'pesada',
    defenseBonus: 10,
    rd: 2, // Resistência a balístico, corte, impacto e perfuração 2
    agilityPenalty: -5, // -5 em testes de perícias que sofrem penalidade de carga
    category: 'II',
    spaces: 5,
    description: 'Equipamento usado por forças especiais da polícia e pelo exército. Consiste de capacete, ombreiras, joelheiras e caneleiras, além de um colete com várias camadas de kevlar. Fornece resistência a balístico, corte, impacto e perfuração 2. No entanto, por ser desconfortável e volumosa, impõe -5 em testes de perícias que sofrem penalidade de carga.',
    special: 'Resistência a balístico, corte, impacto e perfuração 2. -5 em testes de perícias com penalidade de carga.',
  },
  {
    id: 'escudo',
    name: 'Escudo',
    type: 'escudo',
    defenseBonus: 2,
    agilityPenalty: 0,
    category: 'I',
    spaces: 2,
    description: 'Um escudo medieval ou moderno, como aqueles usados por tropas de choque. Precisa ser empunhado em uma mão e fornece Defesa +2. Bônus na Defesa fornecido por um escudo acumula com o de uma proteção. Para efeitos de proficiência e penalidade por não proficiência, escudos contam como proteção pesada.',
    special: 'Empunhado em uma mão. Bônus acumula com proteção. Conta como proteção pesada para proficiência.',
  },
];

// ==================== PROTEÇÕES COM MODIFICAÇÕES PRÉ-DEFINIDAS ====================
// Estas são combinações comuns de proteção + modificação

export const MODIFIED_ARMORS: CatalogArmor[] = [
  // Proteção Leve Discreta (Cat I por modificação -> Cat II)
  {
    id: 'protecao_leve_discreta',
    name: 'Proteção Leve Discreta',
    type: 'leve',
    defenseBonus: 5,
    agilityPenalty: 0,
    category: 'II', // Modificação aumenta categoria em 1
    spaces: 1,
    description: 'Colete compacto feito com kevlar denso para reduzir o volume. Pode ser ocultado sob roupas.',
    special: '+5 em testes de Crime para ocultar, mesmo sem treinamento.',
    modifications: ['discreta'],
  },
  // Proteção Leve Reforçada (Cat I -> Cat II)
  {
    id: 'protecao_leve_reforcada',
    name: 'Proteção Leve Reforçada',
    type: 'leve',
    defenseBonus: 7, // 5 + 2
    agilityPenalty: 0,
    category: 'II',
    spaces: 3,
    description: 'Colete de kevlar com placas adicionais para maior proteção.',
    modifications: ['reforcada'],
  },
  // Proteção Pesada Antibombas (Cat II -> Cat III)
  {
    id: 'protecao_pesada_antibombas',
    name: 'Proteção Pesada Antibombas',
    type: 'pesada',
    defenseBonus: 10,
    rd: 2,
    agilityPenalty: -5,
    category: 'III',
    spaces: 5,
    description: 'Armadura pesada tratada quimicamente para resistir ao calor e estilhaços. Inclui capacete com viseira.',
    special: 'Resistência a balístico, corte, impacto e perfuração 2. +5 em testes de resistência contra efeitos de área.',
    modifications: ['antibombas'],
  },
  // Proteção Pesada Blindada (Cat II -> Cat III)
  {
    id: 'protecao_pesada_blindada',
    name: 'Proteção Pesada Blindada',
    type: 'pesada',
    defenseBonus: 10,
    rd: 5, // 2 + 3
    agilityPenalty: -5,
    category: 'III',
    spaces: 6, // 5 + 1
    description: 'Armadura pesada reforçada com placas de aço e cerâmica. Proteção máxima.',
    special: 'Resistência a balístico, corte, impacto e perfuração 5.',
    modifications: ['blindada'],
  },
  // Proteção Pesada Reforçada (Cat II -> Cat III)
  {
    id: 'protecao_pesada_reforcada',
    name: 'Proteção Pesada Reforçada',
    type: 'pesada',
    defenseBonus: 12, // 10 + 2
    rd: 2,
    agilityPenalty: -5,
    category: 'III',
    spaces: 6, // 5 + 1
    description: 'Armadura pesada com camadas extras de proteção.',
    special: 'Resistência a balístico, corte, impacto e perfuração 2.',
    modifications: ['reforcada'],
  },
];

// Catálogo completo de proteções
export const ALL_ARMORS: CatalogArmor[] = [
  ...BASE_ARMORS,
  ...MODIFIED_ARMORS,
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
    penalties.push(`${armor.agilityPenalty} em perícias com penalidade de carga`);
  }
  
  return penalties.length > 0 ? penalties.join(', ') : 'Nenhuma';
}

// Função para obter modificação por ID
export function getModificationById(id: ArmorModification): ArmorModificationData | undefined {
  return ARMOR_MODIFICATIONS.find(mod => mod.id === id);
}

/** Retorna a melhoria incompatível presente na proteção, ou undefined. */
export function getArmorModificationConflict(modification: ArmorModification, installed: readonly ArmorModification[]): ArmorModification | undefined {
  const opposite = modification === 'discreta' ? 'reforcada' : modification === 'reforcada' ? 'discreta' : undefined;
  return opposite && installed.includes(opposite) ? opposite : undefined;
}

// Função para calcular stats finais com modificações
export function calculateModifiedStats(
  baseArmor: CatalogArmor,
  modifications: ArmorModification[]
): { defenseBonus: number; rd: number; spaces: number } {
  let defenseBonus = baseArmor.defenseBonus;
  let rd = baseArmor.rd || 0;
  let spaces = baseArmor.spaces;

  [...new Set(modifications)].forEach(modId => {
    const mod = getModificationById(modId);
    if (mod && mod.applicableTo.includes(baseArmor.type)) {
      if (mod.defenseBonus) defenseBonus += mod.defenseBonus;
      if (mod.rdBonus) rd += mod.rdBonus;
      if (mod.spacesModifier) spaces += mod.spacesModifier;
    }
  });

  return { defenseBonus, rd, spaces: Math.max(0, spaces) };
}

// Labels para UI
export const ARMOR_TYPE_LABELS = {
  leve: { label: 'Proteção Leve', color: 'text-green-500' },
  pesada: { label: 'Proteção Pesada', color: 'text-blue-500' },
  escudo: { label: 'Escudo', color: 'text-purple-500' },
};
