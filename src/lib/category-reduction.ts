/**
 * Sistema de Redução de Categoria para Ordem Paranormal RPG v1.3
 * 
 * Habilidades que permitem reduzir a categoria de itens para fins de requisitos de patente:
 * 
 * - "A Favorita" (Aniquilador NEX 10%): reduz categoria de 1 arma em I
 * - "Técnica Secreta" (Aniquilador NEX 40%): reduz categoria da arma favorita em II
 * - "Máquina de Matar" (Aniquilador NEX 99%): reduz categoria da arma favorita em III
 * - "Ferramenta Favorita" (Engenheiro - Origem): reduz categoria de 1 item não-arma em I
 * - "Mochila de Utilidades" (Especialista - Poder): reduz categoria e espaço de até 3 itens não-arma
 */

import type { InventoryItem } from './inventory-system';

// Configuração de uma habilidade que reduz categoria
export interface CategoryReductionConfig {
  abilityId: string;           // ID único da habilidade
  abilityName: string;         // Nome para exibição
  sourceName: string;          // Fonte (trilha/origem/poder)
  targetType: 'weapon' | 'item' | 'any';  // Tipo de item afetado
  reductionAmount: number;     // Quanto reduz a categoria (1 = uma categoria)
  spaceReduction?: number;     // Redução de espaços ocupados
  isWeaponExcluded?: boolean;  // Se exclui armas (para Engenheiro/Especialista)
  maxItems?: number;           // Número máximo de itens que podem ter esse benefício
  requiresChoice?: boolean;    // Se o jogador precisa escolher o item
  description: string;         // Descrição do efeito
  minNex?: number;             // NEX mínimo para ter essa habilidade
  replacesAbility?: string;    // Se esta habilidade substitui outra (progressão)
}

/**
 * Catálogo de habilidades que reduzem categoria
 * Inclui progressão completa do Aniquilador
 */
/** Identifica a arma do Aniquilador sem confundir outras reduções de categoria. */
export function isAniquiladorFavoriteWeapon(item: { favoriteAbilityId?: string }): boolean {
  return ['a-favorita', 'tecnica-secreta', 'maquina-de-matar'].includes(item.favoriteAbilityId ?? '');
}

export const CATEGORY_REDUCTION_ABILITIES: CategoryReductionConfig[] = [
  // ===== ANIQUILADOR (COMBATENTE) =====
  {
    abilityId: 'a-favorita',
    abilityName: 'A Favorita',
    sourceName: 'Aniquilador (Combatente)',
    targetType: 'weapon',
    reductionAmount: 1,
    maxItems: 1,
    requiresChoice: true,
    minNex: 10,
    description: 'Escolha uma arma para ser sua favorita. A categoria da arma escolhida é reduzida em I.',
  },
  {
    abilityId: 'tecnica-secreta',
    abilityName: 'Técnica Secreta',
    sourceName: 'Aniquilador (Combatente)',
    targetType: 'weapon',
    reductionAmount: 2,
    maxItems: 1,
    requiresChoice: true,
    minNex: 40,
    replacesAbility: 'a-favorita',
    description: 'A categoria da arma favorita passa a ser reduzida em II.',
  },
  {
    abilityId: 'maquina-de-matar',
    abilityName: 'Máquina de Matar',
    sourceName: 'Aniquilador (Combatente)',
    targetType: 'weapon',
    reductionAmount: 3,
    maxItems: 1,
    requiresChoice: true,
    minNex: 99,
    replacesAbility: 'tecnica-secreta',
    description: 'A categoria da arma favorita passa a ser reduzida em III, ela recebe +2 na margem de ameaça e seu dano aumenta em um dado do mesmo tipo.',
  },
  
  // ===== ENGENHEIRO (ORIGEM) =====
  {
    abilityId: 'ferramenta-favorita',
    abilityName: 'Ferramenta Favorita',
    sourceName: 'Engenheiro (Origem)',
    targetType: 'item',
    reductionAmount: 1,
    isWeaponExcluded: true,
    maxItems: 1,
    requiresChoice: true,
    description: 'Escolha um item (exceto armas). Ele é considerado uma categoria abaixo para fins de requisitos de patente.',
  },
  
  // ===== ESPECIALISTA (PODER DE CLASSE) =====
  {
    abilityId: 'mochila-utilidades',
    abilityName: 'Mochila de Utilidades',
    sourceName: 'Especialista (Poder)',
    targetType: 'item',
    reductionAmount: 1,
    spaceReduction: 1,
    isWeaponExcluded: true,
    maxItems: 3,
    requiresChoice: true,
    minNex: 15,
    description: 'Escolha até 3 equipamentos (exceto armas). Cada um ocupa 1 espaço a menos e é considerado uma categoria abaixo.',
  },
  
  // ===== TÉCNICO (ESPECIALISTA) =====
  {
    abilityId: 'remendo-tecnico',
    abilityName: 'Remendo (Técnico)',
    sourceName: 'Técnico (Especialista)',
    targetType: 'any',
    reductionAmount: 1,
    maxItems: 999, // Afeta todos os equipamentos que carrega
    requiresChoice: false, // Aplica automaticamente a todos os equipamentos
    minNex: 40,
    description: 'Qualquer equipamento que você carregue tem sua categoria reduzida em 1 (mas nunca reduzida a 0).',
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
 * Interface para dados do personagem usados na detecção de habilidades
 */
export interface CharacterCategoryReductionData {
  origin: string;
  classId: string;
  classTrack?: string;
  nex: number;
  abilities?: string[];
  powers?: string[];
  generalPowers?: Array<{ id: string; name: string }>;
}

/**
 * Obtém todas as habilidades de redução de categoria que um personagem possui
 * baseado em sua origem, trilha, NEX e poderes
 * 
 * REGRA IMPORTANTE: Progressões substituem habilidades anteriores
 * Ex: Aniquilador NEX 40% tem Técnica Secreta (-2), não A Favorita (-1)
 */
export function getCharacterCategoryReductionAbilities(
  characterData: CharacterCategoryReductionData
): CategoryReductionConfig[] {
  const { origin, classTrack, nex, abilities = [], powers = [], generalPowers = [] } = characterData;
  const result: CategoryReductionConfig[] = [];

  // Normaliza strings para comparação
  const originLower = origin?.toLowerCase() || '';
  const trackLower = classTrack?.toLowerCase() || '';
  const abilitiesLower = abilities.map(a => a.toLowerCase());
  const powersLower = powers.map(p => p.toLowerCase());
  const generalPowerIds = generalPowers.map(p => p.id?.toLowerCase() || '');
  const generalPowerNames = generalPowers.map(p => p.name?.toLowerCase() || '');

  // ===== ANIQUILADOR (COMBATENTE) =====
  // Verifica progressão: Máquina de Matar > Técnica Secreta > A Favorita
  if (trackLower.includes('aniquilador') || abilitiesLower.some(a => a.includes('favorita'))) {
    if (nex >= 99) {
      // NEX 99%: Máquina de Matar (reduz 3 categorias)
      const ability = getCategoryReductionAbility('maquina-de-matar');
      if (ability) result.push(ability);
    } else if (nex >= 40) {
      // NEX 40%: Técnica Secreta (reduz 2 categorias)
      const ability = getCategoryReductionAbility('tecnica-secreta');
      if (ability) result.push(ability);
    } else if (nex >= 10) {
      // NEX 10%: A Favorita (reduz 1 categoria)
      const ability = getCategoryReductionAbility('a-favorita');
      if (ability) result.push(ability);
    }
  }

  // ===== FERRAMENTA FAVORITA (ENGENHEIRO) =====
  if (originLower.includes('engenheiro') || 
      abilitiesLower.some(a => a.includes('ferramenta favorita'))) {
    const ability = getCategoryReductionAbility('ferramenta-favorita');
    if (ability) result.push(ability);
  }

  // ===== MOCHILA DE UTILIDADES (ESPECIALISTA) =====
  // Pode ser obtido como poder de classe em NEX 15%+
  if (
    generalPowerIds.includes('mochila-utilidades') ||
    generalPowerNames.some(n => n.includes('mochila de utilidades')) ||
    powersLower.some(p => p.includes('mochila')) ||
    abilitiesLower.some(a => a.includes('mochila'))
  ) {
    const ability = getCategoryReductionAbility('mochila-utilidades');
    if (ability) result.push(ability);
  }

  // ===== REMENDO (TÉCNICO - ESPECIALISTA) =====
  // NEX 40%: Qualquer equipamento tem categoria reduzida em 1
  if (trackLower.includes('tecnico') || trackLower.includes('técnico')) {
    if (nex >= 40) {
      const ability = getCategoryReductionAbility('remendo-tecnico');
      if (ability) result.push(ability);
    }
  }

  return result;
}

/**
 * Conta quantos itens estão usando uma habilidade de redução específica
 */
export function countItemsUsingAbility(
  inventory: Array<{ favoriteAbilityId?: string }>,
  abilityId: string
): number {
  return inventory.filter(item => item.favoriteAbilityId === abilityId).length;
}

/**
 * Verifica se um item pode ser marcado como favorito para uma habilidade
 */
export function canMarkAsFavorite(
  item: InventoryItem & { itemType?: string; favoriteAbilityId?: string },
  ability: CategoryReductionConfig,
  inventory: Array<{ favoriteAbilityId?: string }>
): { allowed: boolean; reason?: string } {
  // Verifica se o item já está usando essa habilidade
  if (item.favoriteAbilityId === ability.abilityId) {
    return { allowed: true }; // Pode desmarcar
  }

  // Verifica se pode aplicar a redução neste tipo de item
  if (!canApplyCategoryReduction(item, ability)) {
    if (ability.isWeaponExcluded && item.itemType === 'weapon') {
      return { allowed: false, reason: 'Esta habilidade não pode ser aplicada em armas' };
    }
    if (ability.targetType === 'weapon' && item.itemType !== 'weapon') {
      return { allowed: false, reason: 'Esta habilidade só pode ser aplicada em armas' };
    }
    if (item.category === '0') {
      return { allowed: false, reason: 'Item sem categoria não precisa de redução' };
    }
    return { allowed: false, reason: 'Este item não é elegível para esta habilidade' };
  }

  // Verifica limite de itens
  const currentCount = countItemsUsingAbility(inventory, ability.abilityId);
  const maxItems = ability.maxItems || 1;
  
  if (currentCount >= maxItems) {
    return { 
      allowed: false, 
      reason: `Limite de ${maxItems} item(ns) já atingido para "${ability.abilityName}"` 
    };
  }

  return { allowed: true };
}

/**
 * Aplica a redução de categoria a um item
 */
export function applyFavoriteAbility(
  item: InventoryItem & { itemType?: string; favoriteAbilityId?: string; effectiveCategory?: string },
  ability: CategoryReductionConfig
): typeof item {
  const effectiveCategory = getEffectiveCategory(item.category, ability.reductionAmount);
  const effectiveSpaces = ability.spaceReduction 
    ? getEffectiveSpaces(item.slots, ability.spaceReduction)
    : item.slots;

  return {
    ...item,
    favoriteAbilityId: ability.abilityId,
    effectiveCategory: effectiveCategory as InventoryItem['category'],
    slots: effectiveSpaces,
  };
}

/**
 * Remove a redução de categoria de um item
 */
export function removeFavoriteAbility(
  item: InventoryItem & { favoriteAbilityId?: string; effectiveCategory?: string }
): typeof item {
  const { favoriteAbilityId, effectiveCategory, ...rest } = item;
  return {
    ...rest,
    favoriteAbilityId: undefined,
    effectiveCategory: undefined,
  };
}
