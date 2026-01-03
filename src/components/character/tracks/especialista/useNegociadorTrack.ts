/**
 * useNegociadorTrack - Hook de lógica para a trilha Negociador
 * 
 * Encapsula toda a lógica de habilidades da trilha:
 * - NEX 10%: Eloquência - Fascina alvos em alcance curto (1 PE, concentração)
 * - NEX 40%: Discurso Motivador - +2 em testes de perícia (4 PE / 8 PE em NEX 65%)
 * - NEX 65%: Eu Conheço um Cara - Ativa rede de contatos (1x/missão)
 * - NEX 99%: Truque de Mestre - Copia habilidade de aliado (5 PE)
 * 
 * @module tracks/especialista/useNegociadorTrack
 */

import { useState, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import { TRACK_EFFECT_IDS, type EffectDuration, type ComputedEffects } from '@/hooks';

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
}: UseNegociadorTrackProps) {
  const [isConcentrating, setIsConcentrating] = useState(eloquenciaActive);

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
  const isNegociador = classTrack === 'Negociador' || classTrack === 'negociador';

  // Habilidades desbloqueadas por NEX
  const hasEloquencia = nex >= 10;
  const hasDiscursoMotivador = nex >= 40;
  const hasConhecoCara = nex >= 65;
  const hasTruqueMestre = nex >= 99;
  
  // Discurso Motivador: 4 PE para +2, ou 8 PE para +2 (NEX 65+)
  const discursoMotivadorCost = 4;
  const discursoMotivadorEnhancedCost = 8;
  const canUseEnhancedDiscurso = nex >= 65;

  /**
   * Ativa/Desativa Eloquência (1 PE para ativar, concentração)
   */
  const handleEloquencia = useCallback(() => {
    if (isConcentrating) {
      setIsConcentrating(false);
      onEloquenciaToggle?.(false);
      toast.info('Eloquência encerrada', { 
        description: 'Você parou de concentrar.' 
      });
      return;
    }
    
    if (peCurrent < 1) {
      toast.error('PE insuficiente', { description: 'Eloquência requer 1 PE.' });
      return;
    }

    onPEChange(peCurrent - 1);
    setIsConcentrating(true);
    onEloquenciaToggle?.(true);
    
    onActivateEffect?.(TRACK_EFFECT_IDS.ELOQUENCIA ?? 'track-eloquencia', 'Eloquência', 'concentration');
    
    toast.success('Eloquência ativada!', {
      description: 'Faça teste de Diplomacia/Enganação/Intimidação vs Vontade dos alvos. Alvos fascinados enquanto você se concentrar.'
    });
  }, [peCurrent, isConcentrating, onPEChange, onEloquenciaToggle, onActivateEffect]);

  /**
   * Usa Discurso Motivador (4 PE ou 8 PE)
   */
  const handleDiscursoMotivador = useCallback((enhanced: boolean) => {
    const cost = enhanced ? discursoMotivadorEnhancedCost : discursoMotivadorCost;
    
    if (peCurrent < cost) {
      toast.error('PE insuficiente', { description: `Discurso Motivador requer ${cost} PE.` });
      return;
    }

    onPEChange(peCurrent - cost);
    
    onActivateEffect?.(TRACK_EFFECT_IDS.DISCURSO_MOTIVADOR ?? 'track-discurso-motivador', 'Discurso Motivador', 'scene', { enhanced, bonus: 2 });
    
    toast.success('Discurso Motivador!', {
      description: `Você e aliados em alcance curto ganham +2 em testes de perícia até o fim da cena.`
    });
  }, [peCurrent, onPEChange, onActivateEffect]);

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
   * Usa Truque de Mestre (5 PE)
   */
  const handleTruqueMestre = useCallback(() => {
    if (peCurrent < 5) {
      toast.error('PE insuficiente', { description: 'Truque de Mestre requer 5 PE.' });
      return;
    }

    onPEChange(peCurrent - 5);
    
    onActivateEffect?.(TRACK_EFFECT_IDS.TRUQUE_MESTRE ?? 'track-truque-mestre', 'Truque de Mestre', 'scene');
    
    toast.success('Truque de Mestre!', {
      description: 'Simule o efeito de qualquer habilidade que um aliado tenha usado nesta cena. Você ignora pré-requisitos mas paga todos os custos.'
    });
  }, [peCurrent, onPEChange, onActivateEffect]);

  return {
    // Estado
    isNegociador,
    isConcentrating,
    
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
    
    // Helpers
    canAffordEloquencia: peCurrent >= 1 || isConcentrating,
    canAffordDiscurso: peCurrent >= discursoMotivadorCost,
    canAffordEnhancedDiscurso: peCurrent >= discursoMotivadorEnhancedCost && canUseEnhancedDiscurso,
    canAffordTruqueMestre: peCurrent >= 5,
    conhecoCaraUsedThisMission,
  };
}
