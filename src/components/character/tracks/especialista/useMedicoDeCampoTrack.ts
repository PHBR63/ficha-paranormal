/**
 * useMedicoDeCampoTrack - Hook de lógica para a trilha Médico de Campo
 * 
 * Requisito Especial: Treinado em Medicina + kit de medicina
 * 
 * Encapsula toda a lógica de habilidades da trilha:
 * - NEX 10%: Paramédico - Cura 2d10 PV (escala com NEX), +1 PE por dado extra
 * - NEX 40%: Equipe de Trauma - Remove condição negativa (exceto morrendo)
 * - NEX 65%: Resgate - Movimento livre em alcance curto para aliado machucado/morrendo, 
 *            +5 Defesa para AMBOS (curador e alvo) ao curar, metade dos espaços ao carregar
 * - NEX 99%: Reanimação - Traz aliado de volta à vida (1x/cena)
 * 
 * @module tracks/especialista/useMedicoDeCampoTrack
 */

import { useState, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import { TRACK_EFFECT_IDS, type EffectDuration, type ComputedEffects } from '@/hooks';

// =====================================================
// Funções Auxiliares
// =====================================================

/**
 * Calcula os dados de cura do Paramédico baseado no NEX
 */
export function getParamedicoDice(nex: number): { base: number; dieType: string; formula: string } {
  if (nex >= 99) return { base: 5, dieType: 'd10', formula: '5d10' };
  if (nex >= 65) return { base: 4, dieType: 'd10', formula: '4d10' };
  if (nex >= 40) return { base: 3, dieType: 'd10', formula: '3d10' };
  return { base: 2, dieType: 'd10', formula: '2d10' };
}

// =====================================================
// Props do Hook
// =====================================================

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
}: UseMedicoDeCampoTrackProps) {
  const [extraDice, setExtraDice] = useState(0);
  const [showParamedicoDrawer, setShowParamedicoDrawer] = useState(false);

  // Verifica se é Médico de Campo (suporta múltiplos formatos)
  const isMedicoCampo = classTrack === 'Médico de Campo' || classTrack === 'medico-campo';

  // Dados de cura do SUE
  const sueHealing = computedEffects?.healing;
  const sueSupport = computedEffects?.support;

  // Dados de cura base - usa SUE se disponível
  const healingDice = useMemo(() => {
    if (sueHealing?.baseDice && sueHealing?.dieType) {
      return {
        base: sueHealing.baseDice,
        dieType: sueHealing.dieType,
        formula: `${sueHealing.baseDice}${sueHealing.dieType}`
      };
    }
    return getParamedicoDice(nex);
  }, [sueHealing, nex]);

  // Custo total do Paramédico (2 PE base + 1 PE por dado extra)
  const paramedicoCost = 2 + extraDice;

  // Habilidades desbloqueadas por NEX
  const hasParamedico = nex >= 10;
  const hasEquipeTrauma = nex >= 40;
  const hasResgate = nex >= 65;
  const hasReanimacao = nex >= 99;

  // Dados de suporte do SUE
  const freeMovementAbility = sueSupport?.freeMovement ?? null;
  const onHealEffects = sueSupport?.onHealEffects ?? [];
  const removeConditionAbilities = sueSupport?.removeConditionAbilities ?? [];
  const resurrectAbilities = sueSupport?.resurrectAbilities ?? [];

  // Bônus de defesa ao curar (Resgate) - aplica-se a ambos: curador e alvo
  const selfDefenseBonus = onHealEffects.length > 0 ? (onHealEffects[0] as unknown as { selfDefenseBonus?: number }).selfDefenseBonus ?? 5 : 5;
  const targetDefenseBonus = onHealEffects.length > 0 ? onHealEffects[0].targetDefenseBonus : 5;

  /**
   * Abre drawer para configurar Paramédico
   */
  const handleOpenParamedico = useCallback(() => {
    setExtraDice(0);
    setShowParamedicoDrawer(true);
  }, []);

  /**
   * Executa a cura do Paramédico
   */
  const handleUseParamedico = useCallback(() => {
    if (peCurrent < paramedicoCost) {
      toast.error('PE insuficiente', { 
        description: `Paramédico requer ${paramedicoCost} PE (2 base + ${extraDice} extras).` 
      });
      return;
    }

    onPEChange(peCurrent - paramedicoCost);
    
    const totalDice = healingDice.base + extraDice;
    const formula = `${totalDice}d10`;
    const defenseBonusText = hasResgate 
      ? ` Você e o aliado recebem +${targetDefenseBonus} Defesa até o início do seu próximo turno.` 
      : '';
    
    onActivateEffect?.(TRACK_EFFECT_IDS.PARAMEDICO ?? 'track-paramedico', 'Paramédico', 'instant', { dice: totalDice });
    
    // Ativar efeito de defesa do Resgate se desbloqueado
    if (hasResgate) {
      onActivateEffect?.(
        TRACK_EFFECT_IDS.RESGATE_DEFENSE ?? 'track-resgate-defense', 
        'Resgate (Defesa)', 
        'next-turn',  // Até o início do próximo turno
        { selfBonus: selfDefenseBonus, targetBonus: targetDefenseBonus }
      );
    }
    
    toast.success('Paramédico ativado!', {
      description: `Cure ${formula} PV de si mesmo ou aliado adjacente.${defenseBonusText} Custo: ${paramedicoCost} PE.`
    });
    
    setShowParamedicoDrawer(false);
  }, [peCurrent, paramedicoCost, extraDice, healingDice.base, onPEChange, selfDefenseBonus, targetDefenseBonus, hasResgate, onActivateEffect]);

  /**
   * Usa Equipe de Trauma (2 PE)
   */
  const handleEquipeTrauma = useCallback(() => {
    if (peCurrent < 2) {
      toast.error('PE insuficiente', { description: 'Equipe de Trauma requer 2 PE.' });
      return;
    }

    onPEChange(peCurrent - 2);
    
    const excludedConditions = removeConditionAbilities.length > 0 
      ? removeConditionAbilities[0].excludedConditions 
      : ['morrendo'];
    
    onActivateEffect?.(TRACK_EFFECT_IDS.EQUIPE_TRAUMA ?? 'track-equipe-trauma', 'Equipe de Trauma', 'instant');
    
    // Ativar efeito de defesa do Resgate se desbloqueado
    if (hasResgate) {
      onActivateEffect?.(
        TRACK_EFFECT_IDS.RESGATE_DEFENSE ?? 'track-resgate-defense', 
        'Resgate (Defesa)', 
        'next-turn',  // Até o início do próximo turno
        { selfBonus: selfDefenseBonus, targetBonus: targetDefenseBonus }
      );
    }
    
    const defenseBonusText = hasResgate 
      ? ` Você e o aliado recebem +${targetDefenseBonus} Defesa até o início do seu próximo turno.` 
      : '';
    
    toast.success('Equipe de Trauma ativado!', {
      description: `Remove uma condição negativa (exceto ${excludedConditions.join(', ')}) de aliado adjacente.${defenseBonusText}`
    });
  }, [peCurrent, onPEChange, removeConditionAbilities, onActivateEffect, hasResgate, selfDefenseBonus, targetDefenseBonus]);

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
    onReanimacaoUsed?.();
    
    const excludedDeathTypes = resurrectAbilities.length > 0 
      ? resurrectAbilities[0].excludedDeathTypes 
      : ['dano massivo'];
    
    onActivateEffect?.(TRACK_EFFECT_IDS.REANIMACAO ?? 'track-reanimacao', 'Reanimação', 'scene');
    
    toast.success('Reanimação ativada!', {
      description: `Traz de volta à vida um personagem que morreu nesta cena (exceto morte por ${excludedDeathTypes.join(', ')}).`
    });
  }, [peCurrent, reanimacaoUsedThisScene, onPEChange, onReanimacaoUsed, resurrectAbilities, onActivateEffect]);

  return {
    // Estado
    isMedicoCampo,
    extraDice,
    setExtraDice,
    showParamedicoDrawer,
    setShowParamedicoDrawer,
    
    // Habilidades desbloqueadas
    hasParamedico,
    hasEquipeTrauma,
    hasResgate,
    hasReanimacao,
    
    // Dados derivados
    healingDice,
    paramedicoCost,
    selfDefenseBonus,
    targetDefenseBonus,
    
    // Dados do SUE
    sueHealing,
    sueSupport,
    hasSueData: !!(sueHealing || sueSupport),
    
    // Handlers
    handleOpenParamedico,
    handleUseParamedico,
    handleEquipeTrauma,
    handleReanimacao,
    
    // Helpers
    canAffordParamedico: peCurrent >= paramedicoCost,
    canAffordEquipeTrauma: peCurrent >= 2,
    canAffordReanimacao: peCurrent >= 10 && !reanimacaoUsedThisScene,
  };
}
