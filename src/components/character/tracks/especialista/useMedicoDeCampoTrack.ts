/**
 * useMedicoDeCampoTrack - Hook de lógica para a trilha Médico de Campo
 * 
 * Requisito Especial: Treinado em Medicina + kit de medicina
 * 
 * Encapsula toda a lógica de habilidades da trilha:
 * - NEX 10%: Paramédico - disponibilidade na trilha; resolução no servidor
 * - NEX 40%: Equipe de Trauma - Remove condição negativa (exceto morrendo)
 * - NEX 65%: Resgate - Movimento livre em alcance curto para aliado machucado/morrendo, 
 *            +5 Defesa para AMBOS (curador e alvo) ao curar, metade dos espaços ao carregar
 * - NEX 99%: Reanimação - Traz aliado de volta à vida (1x/cena)
 * 
 * @module tracks/especialista/useMedicoDeCampoTrack
 */

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { TRACK_EFFECT_IDS, type EffectDuration, type ComputedEffects } from '@/hooks';

// =====================================================
// Props do Hook
// =====================================================

/** Tipo para trilha de Versatilidade */
export interface VersatilityTrackInfo {
  trackId: string;
  abilityId: string;
  trackName?: string;
  abilityName?: string;
}

export interface UseMedicoDeCampoTrackProps {
  classTrack: string | null | undefined;
  nex: number;
  peCurrent: number;
  onPEChange: (newPE: number) => void;
  reanimacaoUsedThisScene?: boolean;
  onReanimacaoUsed?: () => void;
  onActivateEffect?: (id: string, name: string, duration: EffectDuration, metadata?: Record<string, unknown>) => void;
  isEffectActive?: (id: string) => boolean;
  computedEffects?: ComputedEffects;
  /** Callback para rastrear PE gasto na rodada */
  onTrackPESpent?: (abilityName: string, cost: number) => void;
  /** HP atual do personagem (para aplicar cura) */
  pvCurrent?: number;
  /** HP máximo do personagem */
  pvMax?: number;
  /** Trilha de Versatilidade do personagem (NEX 50%) */
  versatilityTrack?: VersatilityTrackInfo | null;
}

// =====================================================
// Hook Principal
// =====================================================

export function useMedicoDeCampoTrack({
  classTrack,
  nex,
  peCurrent,
  onPEChange,
  reanimacaoUsedThisScene = false,
  onReanimacaoUsed,
  onActivateEffect,
  isEffectActive,
  computedEffects,
  onTrackPESpent,
  pvCurrent = 0,
  pvMax = 0,
  versatilityTrack,
}: UseMedicoDeCampoTrackProps) {
  // Estado para o modal de Equipe de Trauma
  const [showEquipeTraumaModal, setShowEquipeTraumaModal] = useState(false);
  // Verifica se é Médico de Campo (trilha principal)
  const isMedicoCampo = ['Médico de Campo', 'medico-campo', 'medico-de-campo'].includes(classTrack ?? '');
  
  // Verifica se obteve Paramédico via Versatilidade (NEX 50%)
  const hasParamedicoFromVersatility = 
    nex >= 50 && ['medico-campo', 'medico-de-campo'].includes(versatilityTrack?.trackId ?? '') &&
    versatilityTrack?.abilityId === 'paramedico';

  // Dados de cura do SUE
  const sueHealing = computedEffects?.healing;
  const sueSupport = computedEffects?.support;

  // Habilidades desbloqueadas por NEX (ou via Versatilidade)
  // Paramédico: desbloqueado no NEX 10% da trilha OU via Versatilidade
  const hasParamedico = (isMedicoCampo && nex >= 10) || hasParamedicoFromVersatility;
  // Versatilidade concede somente o primeiro poder da trilha (Livro Base, p. 30).
  const hasEquipeTrauma = isMedicoCampo && nex >= 40;
  const hasResgate = isMedicoCampo && nex >= 65;
  const hasReanimacao = isMedicoCampo && nex >= 99;

  // Dados de suporte do SUE
  const freeMovementAbility = sueSupport?.freeMovement ?? null;
  const onHealEffects = sueSupport?.onHealEffects ?? [];
  const removeConditionAbilities = sueSupport?.removeConditionAbilities ?? [];
  const resurrectAbilities = sueSupport?.resurrectAbilities ?? [];

  // Bônus de defesa ao curar (Resgate) - aplica-se a ambos: curador e alvo
  const selfDefenseBonus = onHealEffects.length > 0 ? (onHealEffects[0] as unknown as { selfDefenseBonus?: number }).selfDefenseBonus ?? 5 : 5;
  const targetDefenseBonus = onHealEffects.length > 0 ? onHealEffects[0].targetDefenseBonus : 5;

  /**
   * Abre o modal de seleção de alvo para Equipe de Trauma
   */
  const handleOpenEquipeTrauma = useCallback(() => {
    setShowEquipeTraumaModal(true);
  }, []);

  /**
   * Usa Equipe de Trauma (2 PE) - chamado após seleção de alvo e condição
   * @param targetId - ID do alvo ('self', 'narrative', ou characterId do aliado)
   * @param conditionId - ID da condição a remover (null se narrativo)
   */
  const handleEquipeTrauma = useCallback((targetId: 'self' | 'narrative' | string, conditionId: string | null) => {
    if (peCurrent < 2) {
      toast.error('PE insuficiente', { description: 'Equipe de Trauma requer 2 PE.' });
      return;
    }

    // Deduz PE
    onPEChange(peCurrent - 2);
    onTrackPESpent?.('Equipe de Trauma', 2);
    
    const excludedConditions = removeConditionAbilities.length > 0 
      ? removeConditionAbilities[0].excludedConditions 
      : ['morrendo'];
    
    // Ativar efeito do Equipe de Trauma
    onActivateEffect?.(
      TRACK_EFFECT_IDS.EQUIPE_TRAUMA ?? 'track-equipe-trauma', 
      'Equipe de Trauma', 
      'instant',
      { targetId, conditionId }
    );
    
    // Ativar efeito de defesa do Resgate se desbloqueado
    if (hasResgate) {
      onActivateEffect?.(
        TRACK_EFFECT_IDS.RESGATE_DEFENSE ?? 'track-resgate-defense', 
        'Resgate (Defesa)', 
        'next-turn',  // Até o início do próximo turno
        { selfBonus: selfDefenseBonus, targetBonus: targetDefenseBonus }
      );
    }
    
    // Mensagem de feedback
    const targetText = targetId === 'self' 
      ? 'de você mesmo' 
      : targetId === 'narrative' 
        ? 'do aliado adjacente' 
        : 'do aliado';
    
    const defenseBonusText = hasResgate 
      ? ` Você e o aliado recebem +${targetDefenseBonus} Defesa até o início do seu próximo turno.` 
      : '';
    
    toast.success('Equipe de Trauma ativado!', {
      description: conditionId 
        ? `Condição removida ${targetText}.${defenseBonusText}`
        : `Remoção de condição ${targetText} (narrativo).${defenseBonusText}`
    });
    
    // Fecha o modal
    setShowEquipeTraumaModal(false);
  }, [peCurrent, onPEChange, removeConditionAbilities, onActivateEffect, hasResgate, selfDefenseBonus, targetDefenseBonus, onTrackPESpent]);

  /**
   * Usa Reanimação (10 PE, 1x/cena)
   */
  const handleReanimacao = useCallback(() => {
    if (reanimacaoUsedThisScene) {
      toast.warning('Já usado nesta cena', { 
        description: 'Reanimação só pode ser usada 1x por cena.' 
      });
      return;
    }
    
    if (peCurrent < 10) {
      toast.error('PE insuficiente', { description: 'Reanimação requer 10 PE.' });
      return;
    }

    onPEChange(peCurrent - 10);
    onTrackPESpent?.('Reanimação', 10);
    onReanimacaoUsed?.();
    
    const excludedDeathTypes = resurrectAbilities.length > 0 
      ? resurrectAbilities[0].excludedDeathTypes 
      : ['dano massivo'];
    
    onActivateEffect?.(TRACK_EFFECT_IDS.REANIMACAO ?? 'track-reanimacao', 'Reanimação', 'scene');
    
    toast.success('Reanimação ativada!', {
      description: `Traz de volta à vida um personagem que morreu nesta cena (exceto morte por ${excludedDeathTypes.join(', ')}).`
    });
  }, [peCurrent, reanimacaoUsedThisScene, onPEChange, onReanimacaoUsed, resurrectAbilities, onActivateEffect, onTrackPESpent]);

  return {
    // Estado
    // Retorna true se tem acesso ao Médico de Campo (trilha principal OU Paramédico via Versatilidade)
    isMedicoCampo: isMedicoCampo || hasParamedicoFromVersatility,
    
    // Estado do modal Equipe de Trauma
    showEquipeTraumaModal,
    setShowEquipeTraumaModal,
    
    // Habilidades desbloqueadas
    hasParamedico,
    hasEquipeTrauma,
    hasResgate,
    hasReanimacao,
    
    // Dados derivados
    selfDefenseBonus,
    targetDefenseBonus,
    
    // Dados do SUE
    sueHealing,
    sueSupport,
    hasSueData: !!(sueHealing || sueSupport),
    
    // Handlers
    handleOpenEquipeTrauma, // Abre o modal de seleção de alvo
    handleEquipeTrauma,     // Executa a ação após seleção
    handleReanimacao,
    
    // Props de HP para o modal
    pvCurrent,
    pvMax,
    
    // Helpers
    canAffordEquipeTrauma: peCurrent >= 2,
    canAffordReanimacao: peCurrent >= 10 && !reanimacaoUsedThisScene,
  };
}
