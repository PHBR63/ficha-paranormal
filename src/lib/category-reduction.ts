/**
 * Sistema de Redução de Categoria para Ordem Paranormal RPG
 * 
 * Habilidades como "A Favorita" (Aniquilador) e "Ferramenta Favorita" (Engenheiro)
 * permitem que um item específico seja tratado como se tivesse uma categoria menor.
 */

import type { InventoryItem } from './inventory-system';

// Configuração de uma habilidade que reduz categoria
export interface CategoryReductionConfig {
  abilityId: string;           // ID único da habilidade
  abilityName: string;         // Nome para exibição
  sourceName: string;          // Fonte (trilha/origem)
  targetType: 'weapon' | 'item' | 'any';  // Tipo de item afetado
  reductionAmount: number;     // Quanto reduz a categoria (1 = uma categoria)
  spaceReduction?: number;     // Redução de espaços ocupados
  isWeaponExcluded?: boolean;  // Se exclui armas (para Engenheiro/Especialista)
  maxItems?: number;           // Número máximo de itens que podem ter esse benefício
  requiresChoice?: boolean;    // Se o jogador precisa escolher o item
  description: string;         // Descrição do efeito
}

// Catálogo de habilidades que reduzem categoria
export const CATEGORY_REDUCTION_ABILITIES: CategoryReductionConfig[] = [
  {
    abilityId: 'a-favorita',
    abilityName: 'A Favorita',
    sourceName: 'Aniquilador (Combatente)',
    targetType: 'weapon',
    reductionAmount: 1,
    maxItems: 1,
    requiresChoice: true,
    description: 'Escolha uma arma. Ela é considerada uma categoria abaixo para fins de requisitos de patente.',
  },
  {
    abilityId: 'ferramenta-favorita',
    abilityName: 'Ferramenta Favorita',
    sourceName: 'Engenheiro (Origem)',
    targetType: 'item',
    reductionAmount: 1,
    isWeaponExcluded: true,
    maxItems: 1,
    requiresChoice: true,
    description: 'Escolha um equipamento que não seja uma arma. Ele é considerado uma categoria abaixo para fins de requisitos de patente.',
  },
  {
    abilityId: 'mochila-utilidades',
    abilityName: 'Mochila de Utilidades',
    sourceName: 'Especialista (Classe)',
    targetType: 'item',
    reductionAmount: 1,
    spaceReduction: 1,
    isWeaponExcluded: true,
    maxItems: 3,
    requiresChoice: true,
    description: 'Escolha até 3 equipamentos (exceto armas). Cada um ocupa 1 espaço a menos e é considerado uma categoria abaixo.',
  },
];

// Ordem das categorias (do menor para maior)
const CATEGORY_ORDER: ('0' | 'I' | 'II' | 'III' | 'IV')[] = ['0', 'I', 'II', 'III', 'IV'];

/**
 * Calcula a categoria efetiva de um item após aplicar reduções de habilidades
 */
export function getEffectiveCategory(
  baseCategory: InventoryItem['category'],
  reductionAmount: number = 0
): InventoryItem['category'] {
  if (baseCategory === '0' || reductionAmount === 0) {
    return baseCategory;
  }

  const currentIndex = CATEGORY_ORDER.indexOf(baseCategory);
  if (currentIndex === -1) return baseCategory;

  // Aplica a redução, mínimo categoria 0
  const newIndex = Math.max(0, currentIndex - reductionAmount);
  return CATEGORY_ORDER[newIndex];
}

/**
 * Obtém a configuração de uma habilidade por ID
 */
export function getCategoryReductionAbility(abilityId: string): CategoryReductionConfig | undefined {
  return CATEGORY_REDUCTION_ABILITIES.find(a => a.abilityId === abilityId);
}

/**
 * Verifica se um item pode receber o benefício de uma habilidade
 */
export function canApplyCategoryReduction(
  item: InventoryItem & { itemType?: string },
  ability: CategoryReductionConfig
): boolean {
  // Verifica se o item já tem categoria 0
  if (item.category === '0') return false;

  // Verifica o tipo de alvo
  if (ability.targetType === 'weapon' && item.itemType !== 'weapon') return false;
  if (ability.targetType === 'item' && ability.isWeaponExcluded && item.itemType === 'weapon') return false;

  return true;
}

/**
 * Formata a categoria para exibição, mostrando a redução
 */
export function formatCategoryWithReduction(
  baseCategory: InventoryItem['category'],
  effectiveCategory: InventoryItem['category'],
  abilityName?: string
): string {
  if (baseCategory === effectiveCategory) {
    return `Cat. ${baseCategory}`;
  }

  const source = abilityName ? ` (${abilityName})` : '';
  return `Cat. ${effectiveCategory} ← ${baseCategory}${source}`;
}

/**
 * Calcula os espaços efetivos de um item após aplicar reduções
 */
export function getEffectiveSpaces(
  baseSpaces: number,
  spaceReduction: number = 0
): number {
  return Math.max(0, baseSpaces - spaceReduction);
}

// Interface para item com informações de redução de categoria
export interface ItemWithCategoryReduction {
  itemId: string;
  abilityId: string;
  effectiveCategory: InventoryItem['category'];
  effectiveSpaces?: number;
}

/**
 * Obtém todas as habilidades de redução que um personagem possui
 * baseado em suas habilidades, poderes e origem
 */
export function getCharacterCategoryReductionAbilities(
  characterAbilities: string[],
  characterPowers: string[],
  characterOrigin: string,
  characterClassTrack?: string
): CategoryReductionConfig[] {
  const abilities: CategoryReductionConfig[] = [];

  // Verifica cada habilidade do catálogo
  for (const config of CATEGORY_REDUCTION_ABILITIES) {
    // A Favorita - Aniquilador
    if (config.abilityId === 'a-favorita') {
      if (characterClassTrack?.toLowerCase().includes('aniquilador') ||
          characterAbilities.some(a => a.toLowerCase().includes('favorita'))) {
        abilities.push(config);
      }
    }

    // Ferramenta Favorita - Engenheiro
    if (config.abilityId === 'ferramenta-favorita') {
      if (characterOrigin?.toLowerCase().includes('engenheiro') ||
          characterAbilities.some(a => a.toLowerCase().includes('ferramenta favorita'))) {
        abilities.push(config);
      }
    }

    // Mochila de Utilidades - Especialista
    if (config.abilityId === 'mochila-utilidades') {
      if (characterAbilities.some(a => a.toLowerCase().includes('mochila')) ||
          characterPowers.some(p => p.toLowerCase().includes('mochila'))) {
        abilities.push(config);
      }
    }
  }

  return abilities;
}
