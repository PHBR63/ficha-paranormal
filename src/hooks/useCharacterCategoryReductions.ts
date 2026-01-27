/**
 * Hook para gerenciar reduções de categoria baseadas nas habilidades do personagem
 * 
 * Detecta automaticamente (via SUE quando disponível, ou fallback legado):
 * - A Favorita / Técnica Secreta / Máquina de Matar (Aniquilador)
 * - Ferramenta Favorita (Engenheiro)
 * - Mochila de Utilidades (Especialista)
 * - Remendo (Técnico)
 * 
 * INTEGRAÇÃO COM SUE:
 * Quando `sueCategoryReductions` é fornecido, o hook usa os dados do SUE como
 * fonte de verdade para as habilidades disponíveis, mantendo compatibilidade
 * com o sistema de marcação de itens favoritos no inventário.
 */

import { useMemo, useCallback, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  getCharacterCategoryReductionAbilities,
  canMarkAsFavorite,
  applyFavoriteAbility,
  removeFavoriteAbility,
  getEffectiveCategory,
  getCategoryReductionAbility,
  CATEGORY_REDUCTION_ABILITIES,
  type CategoryReductionConfig,
  type CharacterCategoryReductionData,
} from '@/lib/category-reduction';
import type { InventoryItem } from '@/lib/inventory-system';

export interface ExtendedInventoryItemWithReduction extends InventoryItem {
  itemType?: string;
  favoriteAbilityId?: string;
  effectiveCategory?: InventoryItem['category'];
}

/**
 * Tipo de dados de redução de categoria vindos do SUE
 * Compatível com ComputedEffects.inventory.categoryReductions
 */
export interface SUECategoryReduction {
  amount: number;
  targetType: 'specific-weapon' | 'any-weapon' | 'item' | 'general-equipment';
  source: string;
  requiresChoice?: boolean;
  appliesToAllCarried?: boolean;
}

interface UseCharacterCategoryReductionsProps {
  characterData: CharacterCategoryReductionData;
  inventory: ExtendedInventoryItemWithReduction[];
  onInventoryChange?: (newInventory: ExtendedInventoryItemWithReduction[]) => void;
  /** Dados de redução de categoria vindos do SUE (fonte preferencial) */
  sueCategoryReductions?: SUECategoryReduction[];
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
 * Converte dados do SUE para CategoryReductionConfig
 * Mapeia o source do SUE para encontrar a configuração correspondente
 */
function mapSUEToConfig(sueReduction: SUECategoryReduction): CategoryReductionConfig | null {
  // Tenta encontrar configuração pelo nome da fonte
  const sourceLower = sueReduction.source.toLowerCase();
  
  // Mapeamento de sources do SUE para abilityIds do sistema de redução
  const sourceToAbilityMap: Record<string, string> = {
    'aniquilador': sueReduction.amount >= 3 ? 'maquina-de-matar' : 
                   sueReduction.amount >= 2 ? 'tecnica-secreta' : 'a-favorita',
    'a favorita': 'a-favorita',
    'técnica secreta': 'tecnica-secreta',
    'máquina de matar': 'maquina-de-matar',
    'engenheiro': 'ferramenta-favorita',
    'ferramenta favorita': 'ferramenta-favorita',
    'mochila': 'mochila-utilidades',
    'técnico': 'remendo-tecnico',
    'remendo': 'remendo-tecnico',
  };
  
  // Encontra o abilityId correspondente
  let abilityId: string | undefined;
  for (const [key, id] of Object.entries(sourceToAbilityMap)) {
    if (sourceLower.includes(key)) {
      abilityId = id;
      break;
    }
  }
  
  if (abilityId) {
    return getCategoryReductionAbility(abilityId) || null;
  }
  
  // Se não encontrou, cria uma configuração dinâmica baseada nos dados do SUE
  return {
    abilityId: `sue-${sueReduction.source.replace(/\s+/g, '-').toLowerCase()}`,
    abilityName: sueReduction.source.split(':').pop()?.trim() || sueReduction.source,
    sourceName: sueReduction.source,
    targetType: sueReduction.targetType === 'specific-weapon' || sueReduction.targetType === 'any-weapon' 
      ? 'weapon' 
      : sueReduction.targetType === 'general-equipment' 
        ? 'any' 
        : 'item',
    reductionAmount: sueReduction.amount,
    maxItems: sueReduction.appliesToAllCarried ? 999 : 1,
    requiresChoice: sueReduction.requiresChoice,
    description: `Reduz categoria em ${sueReduction.amount} (via ${sueReduction.source})`,
  };
}

/**
 * Hook principal para gerenciamento de reduções de categoria
 */
export function useCharacterCategoryReductions({
  characterData,
  inventory,
  onInventoryChange,
  sueCategoryReductions,
}: UseCharacterCategoryReductionsProps): UseCharacterCategoryReductionsReturn {
  
  // Detecta habilidades disponíveis - preferência para dados do SUE
  const availableAbilities = useMemo(() => {
    // Se temos dados do SUE, usa como fonte de verdade
    if (sueCategoryReductions && sueCategoryReductions.length > 0) {
      const abilities: CategoryReductionConfig[] = [];
      const seen = new Set<string>();
      
      for (const sueReduction of sueCategoryReductions) {
        const config = mapSUEToConfig(sueReduction);
        if (config && !seen.has(config.abilityId)) {
          seen.add(config.abilityId);
          abilities.push(config);
        }
      }
      
      return abilities;
    }
    
    // Fallback: detecção legada baseada nos dados do personagem
    return getCharacterCategoryReductionAbilities(characterData);
  }, [
    sueCategoryReductions,
    characterData.origin, 
    characterData.classTrack, 
    characterData.nex, 
    characterData.abilities, 
    characterData.powers, 
    characterData.generalPowers
  ]);

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

  // IDs de habilidades do Aniquilador para migração automática
  const ANIQUILADOR_ABILITY_IDS = ['a-favorita', 'tecnica-secreta', 'maquina-de-matar'];
  
  // Nomes amigáveis das habilidades para o toast
  const ABILITY_NAMES: Record<string, string> = {
    'a-favorita': 'A Favorita',
    'tecnica-secreta': 'Técnica Secreta',
    'maquina-de-matar': 'Máquina de Matar',
  };
  
  // Hook de toast para notificações
  const { toast } = useToast();
  
  // Ref para rastrear a última habilidade de Aniquilador ativa (evita toasts repetidos)
  const lastAniquiladorAbilityRef = useRef<string | null>(null);
  
  // Calcula o inventário com categorias efetivas aplicadas e detecta migrações
  const { inventoryWithEffectiveCategories, migrationInfo } = useMemo(() => {
    // Encontra a habilidade de Aniquilador disponível para o NEX atual (se houver)
    const currentAniquiladorAbility = availableAbilities.find(a => 
      ANIQUILADOR_ABILITY_IDS.includes(a.abilityId)
    );
    
    let migrationDetected: { 
      weaponName: string; 
      fromAbility: string; 
      toAbility: string;
      fromReduction: number;
      toReduction: number;
    } | null = null;
    
    const processedInventory = inventory.map(item => {
      if (!item.favoriteAbilityId) return item;

      const savedAbility = getCategoryReductionAbility(item.favoriteAbilityId);
      if (!savedAbility) return item;

      // Verifica se o item está usando uma habilidade de Aniquilador
      const isAniquiladorAbility = ANIQUILADOR_ABILITY_IDS.includes(item.favoriteAbilityId);
      
      if (isAniquiladorAbility) {
        // Se o personagem não tem mais nenhuma habilidade de Aniquilador, remove
        if (!currentAniquiladorAbility) {
          return removeFavoriteAbility(item);
        }
        
        // MIGRAÇÃO AUTOMÁTICA: Atualiza para a habilidade correta baseada no NEX atual
        const correctAbility = currentAniquiladorAbility;
        
        // Detecta se houve migração (habilidade diferente da salva)
        if (item.favoriteAbilityId !== correctAbility.abilityId) {
          migrationDetected = {
            weaponName: item.name,
            fromAbility: item.favoriteAbilityId,
            toAbility: correctAbility.abilityId,
            fromReduction: savedAbility.reductionAmount,
            toReduction: correctAbility.reductionAmount,
          };
        }
        
        const categoryToReduce = item.category;
        
        return {
          ...item,
          favoriteAbilityId: correctAbility.abilityId,
          effectiveCategory: getEffectiveCategory(categoryToReduce, correctAbility.reductionAmount),
        };
      }

      // Para outras habilidades (não-Aniquilador), mantém comportamento anterior
      if (!availableAbilities.some(a => a.abilityId === item.favoriteAbilityId)) {
        return removeFavoriteAbility(item);
      }

      const categoryToReduce = item.category;
      
      return {
        ...item,
        effectiveCategory: getEffectiveCategory(categoryToReduce, savedAbility.reductionAmount),
      };
    });
    
    return { 
      inventoryWithEffectiveCategories: processedInventory, 
      migrationInfo: migrationDetected 
    };
  }, [inventory, availableAbilities]);
  
  // Efeito para disparar toast quando há migração de habilidade
  useEffect(() => {
    if (!migrationInfo) return;
    
    const currentAbilityId = migrationInfo.toAbility;
    
    // Evita disparar toast repetidamente para a mesma habilidade
    if (lastAniquiladorAbilityRef.current === currentAbilityId) return;
    lastAniquiladorAbilityRef.current = currentAbilityId;
    
    const fromName = ABILITY_NAMES[migrationInfo.fromAbility] || migrationInfo.fromAbility;
    const toName = ABILITY_NAMES[migrationInfo.toAbility] || migrationInfo.toAbility;
    
    // Determina se foi upgrade ou downgrade
    const isUpgrade = migrationInfo.toReduction > migrationInfo.fromReduction;
    
    toast({
      title: isUpgrade ? '⚔️ Habilidade Evoluiu!' : '📉 Habilidade Ajustada',
      description: `${migrationInfo.weaponName}: ${fromName} → ${toName} (Cat. -${migrationInfo.toReduction})`,
      variant: isUpgrade ? 'default' : 'default',
      duration: 5000,
    });
  }, [migrationInfo, toast]);

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
