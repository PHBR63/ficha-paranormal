/**
 * useTecnicoTrack - Hook de lógica para a trilha Técnico
 * 
 * Encapsula toda a lógica de habilidades da trilha:
 * - NEX 10%: Inventário Otimizado (passiva) - FOR + INT para carga, -1 categoria itens gerais
 * - NEX 40%: Remendão (1 PE) - Remove condição Quebrado
 * - NEX 65%: Improvisar (2 PE + 2 PE/cat) - Cria equipamento geral
 * - NEX 99%: Preparado para Tudo (3 PE/cat) - Encontra qualquer item
 * 
 * @module tracks/especialista/useTecnicoTrack
 */

import { useState, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import { TRACK_EFFECT_IDS, type EffectDuration, type ComputedEffects } from '@/hooks';

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
  onActivateEffect?: (id: string, name: string, duration: EffectDuration, metadata?: Record<string, unknown>) => void;
  isEffectActive?: (id: string) => boolean;
  computedEffects?: ComputedEffects;
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
  onActivateEffect,
  isEffectActive,
  computedEffects,
}: UseTecnicoTrackProps) {
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

  // Verifica se é a trilha correta
  const isTecnico = classTrack === 'tecnico';

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
   * Handler para Remendão (1 PE)
   */
  const handleRemendao = useCallback(() => {
    if (peCurrent < 1) {
      toast.error('PE insuficiente', {
        description: 'Você precisa de 1 PE para usar Remendão.'
      });
      return;
    }

    onPEChange(peCurrent - 1);
    
    onActivateEffect?.(TRACK_EFFECT_IDS.REMENDAO ?? 'track-remendao', 'Remendão', 'scene');
    
    toast.success('Remendão ativado!', {
      description: 'Gaste uma ação completa para remover a condição Quebrado de um equipamento adjacente até o final da cena.'
    });
  }, [peCurrent, onPEChange, onActivateEffect]);

  /**
   * Handler para Improvisar (2 PE base + 2 PE por categoria)
   */
  const handleImprovisar = useCallback((categoria: number) => {
    const peCost = 2 + (2 * categoria);
    if (peCurrent < peCost) {
      toast.error('PE insuficiente', {
        description: `Você precisa de ${peCost} PE para improvisar um item de categoria ${categoria}.`
      });
      return;
    }

    onPEChange(peCurrent - peCost);
    setImprovisarDrawerOpen(false);
    
    onActivateEffect?.(TRACK_EFFECT_IDS.IMPROVISAR ?? 'track-improvisar', 'Improvisar', 'scene', { categoria });
    
    toast.success('Equipamento improvisado!', {
      description: `Você criou uma versão funcional de um equipamento geral de categoria ${categoria}. O item será inútil ao final da cena.`
    });
  }, [peCurrent, onPEChange, onActivateEffect]);

  /**
   * Handler para Preparado para Tudo (3 PE por categoria)
   */
  const handlePreparadoParaTudo = useCallback((categoria: number) => {
    const peCost = 3 * categoria;
    if (peCurrent < peCost) {
      toast.error('PE insuficiente', {
        description: `Você precisa de ${peCost} PE para lembrar de um item de categoria ${categoria}.`
      });
      return;
    }

    onPEChange(peCurrent - peCost);
    setPreparadoDrawerOpen(false);
    
    onActivateEffect?.(TRACK_EFFECT_IDS.PREPARADO_PARA_TUDO ?? 'track-preparado-para-tudo', 'Preparado para Tudo', 'instant', { categoria });
    
    toast.success('Preparado para Tudo!', {
      description: `Você lembrou que colocou um item de categoria ${categoria} no fundo da bolsa! Gaste uma ação de movimento para encontrá-lo.`
    });
  }, [peCurrent, onPEChange, onActivateEffect]);

  /**
   * Calcula custo de improvisar por categoria
   */
  const getImprovisarCost = useCallback((categoria: number) => 2 + (2 * categoria), []);

  /**
   * Calcula custo de Preparado para Tudo por categoria
   */
  const getPreparadoCost = useCallback((categoria: number) => 3 * categoria, []);

  return {
    // Estado
    isTecnico,
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
    
    // Dados do SUE
    sueTechnicianData,
    hasSueData: !!computedEffects,
    
    // Handlers
    handleRemendao,
    handleImprovisar,
    handlePreparadoParaTudo,
    
    // Helpers
    getImprovisarCost,
    getPreparadoCost,
    canAffordRemendao: peCurrent >= 1,
    canAffordImprovisar: (categoria: number) => peCurrent >= getImprovisarCost(categoria),
    canAffordPreparado: (categoria: number) => peCurrent >= getPreparadoCost(categoria),
  };
}
