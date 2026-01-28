/**
 * useNegociadorTrack - Hook de lógica para a trilha Negociador
 * 
 * Encapsula toda a lógica de habilidades da trilha:
 * - NEX 10%: Eloquência - Fascina alvos em alcance curto (1 PE por alvo, ação completa, concentração)
 * - NEX 40%: Discurso Motivador - +1d20 em testes de perícia (4 PE) / +2d20 (8 PE em NEX 65%)
 * - NEX 65%: Eu Conheço um Cara - Ativa rede de contatos (1x/missão)
 * - NEX 99%: Truque de Mestre - Copia habilidade de aliado (5 PE + custo da habilidade)
 * 
 * @module tracks/especialista/useNegociadorTrack
 */

import { useState, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import { TRACK_EFFECT_IDS, type EffectDuration, type ComputedEffects } from '@/hooks';

// =====================================================
// Tipos
// =====================================================

/** Estrutura de habilidade selecionada para Truque de Mestre */
export interface SelectedAbility {
  id: string;
  name: string;
  description: string;
  peCost: number | 'varies' | 'passive';
  isPassive: boolean;
}

// =====================================================
// Props do Hook
// =====================================================

export interface UseNegociadorTrackProps {
  classTrack: string | null | undefined;
  nex: number;
  peCurrent: number;
  onPEChange: (newPE: number) => void;
  eloquenciaActive?: boolean;
  onEloquenciaToggle?: (active: boolean) => void;
  conhecoCaraUsedThisMission?: boolean;
  onConhecoCaraUsed?: () => void;
  onActivateEffect?: (id: string, name: string, duration: EffectDuration, metadata?: Record<string, unknown>) => void;
  isEffectActive?: (id: string) => boolean;
  computedEffects?: ComputedEffects;
  /** Callback para rastrear PE gasto na rodada */
  onTrackPESpent?: (abilityName: string, cost: number) => void;
  /** Trilha de Versatilidade do personagem (se houver) */
  versatilityTrack?: { trackId: string; abilityId: string } | null;
}

// =====================================================
// Hook Principal
// =====================================================

export function useNegociadorTrack({
  classTrack,
  nex,
  peCurrent,
  onPEChange,
  eloquenciaActive = false,
  onEloquenciaToggle,
  conhecoCaraUsedThisMission = false,
  onConhecoCaraUsed,
  onActivateEffect,
  isEffectActive,
  computedEffects,
  onTrackPESpent,
  versatilityTrack,
}: UseNegociadorTrackProps) {
  const [isConcentrating, setIsConcentrating] = useState(eloquenciaActive);
  const [showTruqueMestreModal, setShowTruqueMestreModal] = useState(false);

  // Dados do SUE
  const sueAbilities = useMemo(() => {
    if (!computedEffects) return null;
    return {
      allyBuff: computedEffects.allyBuff,
      socialEffect: computedEffects.socialEffect,
      contacts: computedEffects.contacts,
      copyAbility: computedEffects.copyAbility,
    };
  }, [computedEffects]);

  // Verifica se é Negociador (suporta múltiplos formatos)
  const isNegociadorBase = classTrack === 'Negociador' || classTrack === 'negociador';
  
  // Verifica se tem Eloquência via Versatilidade (habilidade NEX 10% do Negociador)
  const hasEloquenciaFromVersatility = 
    versatilityTrack?.trackId === 'negociador' && 
    versatilityTrack?.abilityId === 'eloquencia';

  // Considerar como Negociador se for a trilha principal OU tiver habilidade via Versatilidade
  const isNegociador = isNegociadorBase || hasEloquenciaFromVersatility;

  // Habilidades desbloqueadas por NEX (ou via Versatilidade)
  const hasEloquencia = (isNegociadorBase && nex >= 10) || hasEloquenciaFromVersatility;
  const hasDiscursoMotivador = isNegociadorBase && nex >= 40;
  const hasConhecoCara = isNegociadorBase && nex >= 65;
  const hasTruqueMestre = isNegociadorBase && nex >= 99;
  
  // Discurso Motivador: 4 PE para +2, ou 8 PE para +2 (NEX 65+)
  const discursoMotivadorCost = 4;
  const discursoMotivadorEnhancedCost = 8;
  const canUseEnhancedDiscurso = nex >= 65;

  /**
   * Ativa/Desativa Eloquência (1 PE por alvo, ação completa, concentração)
   * @param targetCount - Número de alvos afetados (custo = 1 PE × targetCount)
   */
  const handleEloquencia = useCallback((targetCount: number = 1) => {
    // Se já está concentrando, encerra
    if (isConcentrating) {
      setIsConcentrating(false);
      onEloquenciaToggle?.(false);
      toast.info('Eloquência encerrada', { 
        description: 'Você parou de concentrar.' 
      });
      return;
    }
    
    // Custo = 1 PE por alvo
    const totalCost = targetCount;
    
    if (peCurrent < totalCost) {
      toast.error('PE insuficiente', { 
        description: `Eloquência requer ${totalCost} PE (1 PE por alvo).` 
      });
      return;
    }

    onPEChange(peCurrent - totalCost);
    onTrackPESpent?.('Eloquência', totalCost);
    setIsConcentrating(true);
    onEloquenciaToggle?.(true);
    
    onActivateEffect?.(
      TRACK_EFFECT_IDS.ELOQUENCIA ?? 'track-eloquencia', 
      'Eloquência', 
      'concentration',
      { targetCount, concentrationAction: 'standard' }
    );
    
    toast.success('Eloquência ativada!', {
      description: `${targetCount} alvo(s) afetado(s). Teste Diplomacia/Enganação/Intimidação vs Vontade. Concentre-se (1 ação padrão/rodada). Hostis: +5 resistência e novo teste/rodada.`
    });
  }, [peCurrent, isConcentrating, onPEChange, onEloquenciaToggle, onActivateEffect, onTrackPESpent]);

  /**
   * Usa Discurso Motivador (4 PE para +1d20, ou 8 PE para +2d20 em NEX 65%+)
   * @param enhanced - Se true, usa versão aprimorada (8 PE, +2d20)
   */
  const handleDiscursoMotivador = useCallback((enhanced: boolean) => {
    const cost = enhanced ? discursoMotivadorEnhancedCost : discursoMotivadorCost;
    const diceBonus = enhanced ? 2 : 1;
    
    if (peCurrent < cost) {
      toast.error('PE insuficiente', { description: `Discurso Motivador requer ${cost} PE.` });
      return;
    }

    onPEChange(peCurrent - cost);
    onTrackPESpent?.('Discurso Motivador', cost);
    
    onActivateEffect?.(
      TRACK_EFFECT_IDS.DISCURSO_MOTIVADOR ?? 'track-discurso-motivador', 
      'Discurso Motivador', 
      'scene', 
      { enhanced, diceBonus, bonusType: 'dice' }
    );
    
    toast.success('Discurso Motivador!', {
      description: `Você e aliados em alcance curto ganham +${diceBonus}d20 em testes de perícia até o fim da cena.`
    });
  }, [peCurrent, onPEChange, onActivateEffect, onTrackPESpent]);

  /**
   * Usa "Eu Conheço um Cara" (1x/missão)
   */
  const handleConhecoCara = useCallback(() => {
    if (conhecoCaraUsedThisMission) {
      toast.warning('Já usado nesta missão', { 
        description: '"Eu Conheço um Cara" só pode ser usado 1x por missão.' 
      });
      return;
    }

    onConhecoCaraUsed?.();
    
    onActivateEffect?.(TRACK_EFFECT_IDS.EU_CONHECO_UM_CARA ?? 'track-eu-conheco-um-cara', 'Eu Conheço um Cara', 'scene');
    
    toast.success('Eu Conheço um Cara!', {
      description: 'Ative sua rede de contatos para trocar equipamentos, obter informações, resgatar alguém ou resolver problema similar. O Mestre define os limites.'
    });
  }, [conhecoCaraUsedThisMission, onConhecoCaraUsed, onActivateEffect]);

  /**
   * Abre o modal de seleção de habilidade para Truque de Mestre
   */
  const handleOpenTruqueMestre = useCallback(() => {
    if (peCurrent < 5) {
      toast.error('PE insuficiente', { description: 'Truque de Mestre requer pelo menos 5 PE.' });
      return;
    }
    setShowTruqueMestreModal(true);
  }, [peCurrent]);

  /**
   * Usa Truque de Mestre com uma habilidade selecionada
   * @param ability - Habilidade selecionada para copiar
   */
  const handleTruqueMestre = useCallback((ability?: SelectedAbility) => {
    // Se não há habilidade, apenas abre o modal
    if (!ability) {
      handleOpenTruqueMestre();
      return;
    }

    // Calcula custo total (5 PE base + custo da habilidade)
    let abilityCost = 0;
    if (ability.peCost !== 'passive' && ability.peCost !== 'varies' && typeof ability.peCost === 'number') {
      abilityCost = ability.peCost;
    }
    const totalCost = 5 + abilityCost;

    if (peCurrent < totalCost) {
      toast.error('PE insuficiente', { 
        description: `Truque de Mestre + ${ability.name} requer ${totalCost} PE.` 
      });
      return;
    }

    onPEChange(peCurrent - totalCost);
    onTrackPESpent?.('Truque de Mestre', totalCost);
    setShowTruqueMestreModal(false);
    
    onActivateEffect?.(
      TRACK_EFFECT_IDS.TRUQUE_MESTRE ?? 'track-truque-mestre', 
      'Truque de Mestre', 
      'scene',
      { copiedAbility: ability.id, copiedAbilityName: ability.name }
    );
    
    toast.success(`Truque de Mestre: ${ability.name}!`, {
      description: `Você simulou "${ability.name}". Custo total: ${totalCost} PE. ${ability.isPassive ? 'Efeito passivo ativo até o fim da cena.' : 'Execute a ação da habilidade normalmente.'}`
    });
  }, [peCurrent, onPEChange, onActivateEffect, onTrackPESpent, handleOpenTruqueMestre]);

  /**
   * Fecha o modal de Truque de Mestre
   */
  const handleCloseTruqueMestreModal = useCallback(() => {
    setShowTruqueMestreModal(false);
  }, []);

  return {
    // Estado
    isNegociador,
    isConcentrating,
    showTruqueMestreModal,
    
    // Habilidades desbloqueadas
    hasEloquencia,
    hasDiscursoMotivador,
    hasConhecoCara,
    hasTruqueMestre,
    canUseEnhancedDiscurso,
    
    // Dados derivados
    discursoMotivadorCost,
    discursoMotivadorEnhancedCost,
    
    // Dados do SUE
    sueAbilities,
    hasSueData: !!computedEffects,
    
    // Handlers
    handleEloquencia,
    handleDiscursoMotivador,
    handleConhecoCara,
    handleTruqueMestre,
    handleOpenTruqueMestre,
    handleCloseTruqueMestreModal,
    
    // Helpers
    canAffordEloquencia: peCurrent >= 1 || isConcentrating,
    canAffordDiscurso: peCurrent >= discursoMotivadorCost,
    canAffordEnhancedDiscurso: peCurrent >= discursoMotivadorEnhancedCost && canUseEnhancedDiscurso,
    canAffordTruqueMestre: peCurrent >= 5,
    conhecoCaraUsedThisMission,
  };
}
