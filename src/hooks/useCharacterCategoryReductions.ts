/**
 * Hook para gerenciar reduções de categoria baseadas nas habilidades do personagem
 * 
 * Detecta automaticamente:
 * - A Favorita / Técnica Secreta / Máquina de Matar (Aniquilador)
 * - Ferramenta Favorita (Engenheiro)
 * - Mochila de Utilidades (Especialista)
 */

import { useMemo, useCallback } from 'react';
import {
  getCharacterCategoryReductionAbilities,
  canMarkAsFavorite,
  applyFavoriteAbility,
  removeFavoriteAbility,
  getEffectiveCategory,
  getCategoryReductionAbility,
  type CategoryReductionConfig,
  type CharacterCategoryReductionData,
} from '@/lib/category-reduction';
import type { InventoryItem } from '@/lib/inventory-system';

export interface ExtendedInventoryItemWithReduction extends InventoryItem {
  itemType?: string;
  favoriteAbilityId?: string;
  effectiveCategory?: InventoryItem['category'];
}

interface UseCharacterCategoryReductionsProps {
  characterData: CharacterCategoryReductionData;
  inventory: ExtendedInventoryItemWithReduction[];
  onInventoryChange?: (newInventory: ExtendedInventoryItemWithReduction[]) => void;
}

interface UseCharacterCategoryReductionsReturn {
  /** Habilidades de redução disponíveis para o personagem */
  availableAbilities: CategoryReductionConfig[];
  
  /** Verifica se uma habilidade específica está disponível */
  hasAbility: (abilityId: string) => boolean;
  
  /** Obtém a habilidade aplicada a um item */
  getItemAbility: (itemId: string) => CategoryReductionConfig | undefined;
  
  /** Verifica se pode marcar um item como favorito para uma habilidade */
  canMarkItem: (item: ExtendedInventoryItemWithReduction, abilityId: string) => { allowed: boolean; reason?: string };
  
  /** Marca/desmarca um item como favorito para uma habilidade */
  toggleFavorite: (itemId: string, abilityId: string) => void;
  
  /** Remove o status de favorito de um item */
  removeFavorite: (itemId: string) => void;
  
  /** Obtém estatísticas de uso de uma habilidade */
  getAbilityUsage: (abilityId: string) => { current: number; max: number };
  
  /** Calcula o inventário com categorias efetivas aplicadas */
  inventoryWithEffectiveCategories: ExtendedInventoryItemWithReduction[];
}

/**
 * Hook principal para gerenciamento de reduções de categoria
 */
export function useCharacterCategoryReductions({
  characterData,
  inventory,
  onInventoryChange,
}: UseCharacterCategoryReductionsProps): UseCharacterCategoryReductionsReturn {
  
  // Detecta automaticamente as habilidades disponíveis baseado nos dados do personagem
  const availableAbilities = useMemo(() => {
    return getCharacterCategoryReductionAbilities(characterData);
  }, [characterData.origin, characterData.classTrack, characterData.nex, 
      characterData.abilities, characterData.powers, characterData.generalPowers]);

  // Verifica se uma habilidade específica está disponível
  const hasAbility = useCallback((abilityId: string): boolean => {
    return availableAbilities.some(a => a.abilityId === abilityId);
  }, [availableAbilities]);

  // Obtém a habilidade aplicada a um item
  const getItemAbility = useCallback((itemId: string): CategoryReductionConfig | undefined => {
    const item = inventory.find(i => i.id === itemId);
    if (!item?.favoriteAbilityId) return undefined;
    return getCategoryReductionAbility(item.favoriteAbilityId);
  }, [inventory]);

  // Verifica se pode marcar um item como favorito
  const canMarkItem = useCallback((
    item: ExtendedInventoryItemWithReduction, 
    abilityId: string
  ): { allowed: boolean; reason?: string } => {
    const ability = availableAbilities.find(a => a.abilityId === abilityId);
    if (!ability) {
      return { allowed: false, reason: 'Habilidade não disponível para este personagem' };
    }
    return canMarkAsFavorite(item, ability, inventory);
  }, [availableAbilities, inventory]);

  // Marca/desmarca um item como favorito
  const toggleFavorite = useCallback((itemId: string, abilityId: string) => {
    if (!onInventoryChange) return;

    const item = inventory.find(i => i.id === itemId);
    if (!item) return;

    const ability = getCategoryReductionAbility(abilityId);
    if (!ability) return;

    // Se o item já está usando essa habilidade, remove
    if (item.favoriteAbilityId === abilityId) {
      const newInventory = inventory.map(i => 
        i.id === itemId ? removeFavoriteAbility(i) : i
      );
      onInventoryChange(newInventory);
      return;
    }

    // Verifica se pode aplicar
    const canApply = canMarkAsFavorite(item, ability, inventory);
    if (!canApply.allowed) return;

    // Remove de outro item se necessário (para habilidades com maxItems: 1)
    let newInventory = [...inventory];
    
    if (ability.maxItems === 1) {
      // Remove a habilidade de qualquer outro item que a esteja usando
      newInventory = newInventory.map(i => 
        i.favoriteAbilityId === abilityId ? removeFavoriteAbility(i) : i
      );
    }

    // Aplica a habilidade ao item
    newInventory = newInventory.map(i => 
      i.id === itemId ? applyFavoriteAbility(i, ability) : i
    );

    onInventoryChange(newInventory);
  }, [inventory, onInventoryChange]);

  // Remove o status de favorito de um item
  const removeFavorite = useCallback((itemId: string) => {
    if (!onInventoryChange) return;

    const newInventory = inventory.map(i => 
      i.id === itemId ? removeFavoriteAbility(i) : i
    );
    onInventoryChange(newInventory);
  }, [inventory, onInventoryChange]);

  // Obtém estatísticas de uso de uma habilidade
  const getAbilityUsage = useCallback((abilityId: string): { current: number; max: number } => {
    const ability = getCategoryReductionAbility(abilityId);
    const current = inventory.filter(i => i.favoriteAbilityId === abilityId).length;
    return {
      current,
      max: ability?.maxItems || 1,
    };
  }, [inventory]);

  // Calcula o inventário com categorias efetivas aplicadas
  const inventoryWithEffectiveCategories = useMemo(() => {
    return inventory.map(item => {
      if (!item.favoriteAbilityId) return item;

      const ability = getCategoryReductionAbility(item.favoriteAbilityId);
      if (!ability) return item;

      // Verifica se o personagem ainda tem essa habilidade
      // (pode ter perdido se mudou de trilha ou algo assim)
      if (!availableAbilities.some(a => a.abilityId === item.favoriteAbilityId)) {
        // Remove a habilidade do item se o personagem não a possui mais
        return removeFavoriteAbility(item);
      }

      return {
        ...item,
        effectiveCategory: getEffectiveCategory(item.category, ability.reductionAmount),
      };
    });
  }, [inventory, availableAbilities]);

  return {
    availableAbilities,
    hasAbility,
    getItemAbility,
    canMarkItem,
    toggleFavorite,
    removeFavorite,
    getAbilityUsage,
    inventoryWithEffectiveCategories,
  };
}

/**
 * Componente de resumo das habilidades de redução de categoria
 * Mostra quais habilidades estão disponíveis e seus status de uso
 */
export function getCategoryReductionSummary(
  availableAbilities: CategoryReductionConfig[],
  inventory: ExtendedInventoryItemWithReduction[]
): Array<{
  ability: CategoryReductionConfig;
  itemsUsing: ExtendedInventoryItemWithReduction[];
  slotsRemaining: number;
}> {
  return availableAbilities.map(ability => {
    const itemsUsing = inventory.filter(i => i.favoriteAbilityId === ability.abilityId);
    const slotsRemaining = (ability.maxItems || 1) - itemsUsing.length;
    
    return {
      ability,
      itemsUsing,
      slotsRemaining,
    };
  });
}
