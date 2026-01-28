/**
 * useTecnicoTrack - Hook de lógica para a trilha Técnico
 * 
 * Encapsula toda a lógica de habilidades da trilha:
 * - NEX 10%: Inventário Otimizado (passiva) - FOR + INT para carga
 * - NEX 40%: Remendão (1 PE) - Remove condição Quebrado até fim da cena; redução de categoria em equipamentos gerais
 * - NEX 65%: Improvisar (2 PE + 2 PE/cat) - Cria equipamento geral
 * - NEX 99%: Preparado para Tudo (2 PE/cat) - Encontra qualquer item (exceto armas)
 * 
 * @module tracks/especialista/useTecnicoTrack
 */

import { useState, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import { TRACK_EFFECT_IDS, type EffectDuration, type ComputedEffects } from '@/hooks';
import type { CatalogItem } from '@/lib/catalogs';
import type { InventoryItem } from '@/lib/inventory-system';
import { categoryToNumber, calculateImprovisarCost } from './ImprovisarItemSelector';

// =====================================================
// Props do Hook
// =====================================================

export interface UseTecnicoTrackProps {
  classTrack: string | null | undefined;
  nex: number;
  peCurrent: number;
  onPEChange: (newPE: number) => void;
  attributes?: {
    strength: number;
    intellect: number;
  };
  /** Inventário do personagem (para Remendão) */
  inventory?: InventoryItem[];
  /** Callback para adicionar item temporário ao inventário */
  onAddTemporaryItem?: (item: InventoryItem) => void;
  onActivateEffect?: (id: string, name: string, duration: EffectDuration, metadata?: Record<string, unknown>) => void;
  isEffectActive?: (id: string) => boolean;
  computedEffects?: ComputedEffects;
  /** Callback para rastrear PE gasto na rodada */
  onTrackPESpent?: (abilityName: string, cost: number) => void;
  /** Trilha de Versatilidade do personagem (se houver) */
  versatilityTrack?: {
    trackId: string;
    abilityId: string;
  } | null;
}

// =====================================================
// Hook Principal
// =====================================================

export function useTecnicoTrack({
  classTrack,
  nex,
  peCurrent,
  onPEChange,
  attributes,
  inventory = [],
  onAddTemporaryItem,
  onActivateEffect,
  isEffectActive,
  computedEffects,
  onTrackPESpent,
  versatilityTrack,
}: UseTecnicoTrackProps) {
  const [remendaoDrawerOpen, setRemendaoDrawerOpen] = useState(false);
  const [improvisarDrawerOpen, setImprovisarDrawerOpen] = useState(false);
  const [preparadoDrawerOpen, setPreparadoDrawerOpen] = useState(false);

  // Dados do SUE para exibir bônus consolidados
  const sueTechnicianData = useMemo(() => {
    if (!computedEffects) return null;
    return {
      carryCapacity: computedEffects.technician?.carryCapacity,
      itemSpaceReduction: computedEffects.technician?.itemSpaceReduction?.total ?? 0,
      categoryReduction: computedEffects.inventory?.totalCategoryReduction ?? 0,
    };
  }, [computedEffects]);

  // Verifica se é a trilha correta (principal)
  const isTecnicoBase = classTrack === 'tecnico';

  // Detecta se tem habilidade de Técnico via Versatilidade
  const hasTecnicoFromVersatility = versatilityTrack?.trackId === 'tecnico';

  // É Técnico se for trilha principal ou via Versatilidade
  const isTecnico = isTecnicoBase || hasTecnicoFromVersatility;

  // Habilidades disponíveis por NEX
  const hasInventarioOtimizado = nex >= 10;
  const hasRemendao = nex >= 40;
  const hasImprovisar = nex >= 65;
  const hasPreparadoParaTudo = nex >= 99;

  // Conta habilidades ativas
  const activeCount = [hasInventarioOtimizado, hasRemendao, hasImprovisar, hasPreparadoParaTudo]
    .filter(Boolean).length;

  // Calcula capacidade de carga otimizada
  const carryCapacity = useMemo(() => {
    if (sueTechnicianData?.carryCapacity) {
      return sueTechnicianData.carryCapacity;
    }
    if (attributes) {
      return (attributes.strength + attributes.intellect) * 5;
    }
    return null;
  }, [attributes, sueTechnicianData]);

  /**
   * Handler para Remendão (1 PE) - com seleção de item
   */
  const handleRemendao = useCallback((item: InventoryItem) => {
    if (peCurrent < 1) {
      toast.error('PE insuficiente', {
        description: 'Você precisa de 1 PE para usar Remendão.'
      });
      return;
    }

    onPEChange(peCurrent - 1);
    onTrackPESpent?.('Remendão', 1);
    setRemendaoDrawerOpen(false);
    
    onActivateEffect?.(TRACK_EFFECT_IDS.REMENDAO ?? 'track-remendao', 'Remendão', 'scene', { 
      itemId: item.id,
      itemName: item.name 
    });
    
    toast.success('Remendão ativado!', {
      description: `"${item.name}" teve a condição Quebrado removida até o final da cena.`
    });
  }, [peCurrent, onPEChange, onActivateEffect, onTrackPESpent]);

  /**
   * Handler para Improvisar com item específico do catálogo
   * Adiciona o item como temporário ao inventário
   */
  const handleImprovisar = useCallback((item: CatalogItem, cost: number) => {
    if (peCurrent < cost) {
      toast.error('PE insuficiente', {
        description: `Você precisa de ${cost} PE para improvisar "${item.name}".`
      });
      return;
    }

    onPEChange(peCurrent - cost);
    onTrackPESpent?.('Improvisar', cost);
    setImprovisarDrawerOpen(false);
    
    // Cria o item temporário no inventário
    const temporaryItem: InventoryItem = {
      id: crypto.randomUUID(),
      name: `${item.name} (Improvisado)`,
      category: item.category as InventoryItem['category'],
      slots: typeof item.spaces === 'number' ? item.spaces : 1,
      quantity: 1,
      description: item.description,
      consumable: item.consumable,
      uses: item.uses,
      maxUses: item.uses,
      effect: item.effect,
      isTemporary: true,
      temporarySource: 'Improvisar (Técnico NEX 65%)',
    };
    
    // Adiciona ao inventário se callback disponível
    onAddTemporaryItem?.(temporaryItem);
    
    onActivateEffect?.(TRACK_EFFECT_IDS.IMPROVISAR ?? 'track-improvisar', 'Improvisar', 'scene', { 
      itemId: temporaryItem.id,
      itemName: item.name,
      categoria: item.category,
      cost 
    });
    
    toast.success('Equipamento improvisado!', {
      description: `"${item.name}" foi adicionado ao inventário. O item será inútil ao final da cena.`
    });
  }, [peCurrent, onPEChange, onAddTemporaryItem, onActivateEffect, onTrackPESpent]);

  /**
   * Handler para Preparado para Tudo com item específico do catálogo
   * Adiciona o item permanentemente ao inventário
   */
  const handlePreparadoParaTudo = useCallback((item: CatalogItem, cost: number) => {
    if (peCurrent < cost) {
      toast.error('PE insuficiente', {
        description: `Você precisa de ${cost} PE para encontrar "${item.name}".`
      });
      return;
    }

    onPEChange(peCurrent - cost);
    onTrackPESpent?.('Preparado para Tudo', cost);
    setPreparadoDrawerOpen(false);
    
    // Cria o item PERMANENTE no inventário
    const permanentItem: InventoryItem = {
      id: crypto.randomUUID(),
      name: item.name,
      category: item.category as InventoryItem['category'],
      slots: typeof item.spaces === 'number' ? item.spaces : 1,
      quantity: 1,
      description: item.description,
      consumable: item.consumable,
      uses: item.uses,
      maxUses: item.uses,
      effect: item.effect,
      isTemporary: false, // PERMANENTE
    };
    
    // Adiciona ao inventário permanentemente
    onAddTemporaryItem?.(permanentItem);
    
    onActivateEffect?.(TRACK_EFFECT_IDS.PREPARADO_PARA_TUDO ?? 'track-preparado-para-tudo', 'Preparado para Tudo', 'instant', { 
      itemId: permanentItem.id,
      itemName: item.name,
      categoria: item.category,
      cost 
    });
    
    toast.success('Você lembrou que tinha isso!', {
      description: `"${item.name}" foi adicionado ao seu inventário.`
    });
  }, [peCurrent, onPEChange, onAddTemporaryItem, onActivateEffect, onTrackPESpent]);

  /**
   * Calcula custo de improvisar por item
   */
  const getImprovisarCostForItem = useCallback((item: CatalogItem) => calculateImprovisarCost(item), []);

  /**
   * Calcula custo de Preparado para Tudo por item (2 PE por categoria)
   */
  const getPreparadoCostForItem = useCallback((item: CatalogItem) => {
    const cat = categoryToNumber(item.category);
    return cat === 0 ? 2 : 2 * cat;
  }, []);

  return {
    // Estado
    isTecnico,
    remendaoDrawerOpen,
    setRemendaoDrawerOpen,
    improvisarDrawerOpen,
    setImprovisarDrawerOpen,
    preparadoDrawerOpen,
    setPreparadoDrawerOpen,
    
    // Habilidades desbloqueadas
    hasInventarioOtimizado,
    hasRemendao,
    hasImprovisar,
    hasPreparadoParaTudo,
    activeCount,
    
    // Dados derivados
    carryCapacity,
    inventory,
    
    // Dados do SUE
    sueTechnicianData,
    hasSueData: !!computedEffects,
    
    // Handlers
    handleRemendao,
    handleImprovisar,
    handlePreparadoParaTudo,
    
    // Helpers
    getImprovisarCostForItem,
    getPreparadoCostForItem,
    canAffordRemendao: peCurrent >= 1,
    canAffordImprovisar: (item: CatalogItem) => peCurrent >= calculateImprovisarCost(item),
    canAffordPreparado: (item: CatalogItem) => {
      const cat = categoryToNumber(item.category);
      const cost = cat === 0 ? 2 : 2 * cat;
      return peCurrent >= cost;
    },
    peCurrent,
  };
}
