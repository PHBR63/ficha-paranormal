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
 * 
 * REGRA OFICIAL (Livro Base v1.3):
 * - Base: 2d10 (fixo em todos os NEX)
 * - Dados extras permitidos escalam com NEX:
 *   - NEX 10-35%: 0 extras (máx 2d10, custo 2 PE)
 *   - NEX 40-60%: 1 extra (máx 3d10, custo 3 PE)
 *   - NEX 65-95%: 2 extras (máx 4d10, custo 4 PE)
 *   - NEX 99%: 3 extras (máx 5d10, custo 5 PE)
 */
export function getParamedicoDice(nex: number): { 
  base: number; 
  dieType: string; 
  formula: string;
  maxExtraDice: number; // Limite de dados extras permitidos pelo NEX
} {
  // Base é SEMPRE 2d10 conforme regras oficiais
  const base = 2;
  const dieType = 'd10';
  
  // Dados extras permitidos escalam com NEX
  let maxExtraDice = 0;
  if (nex >= 99) maxExtraDice = 3;      // máx 5d10, 5 PE
  else if (nex >= 65) maxExtraDice = 2; // máx 4d10, 4 PE
  else if (nex >= 40) maxExtraDice = 1; // máx 3d10, 3 PE
  // NEX 10-35%: 0 extras               // máx 2d10, 2 PE
  
  return { 
    base, 
    dieType, 
    formula: `${base}${dieType}`,
    maxExtraDice,
  };
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
  /** Callback para rastrear PE gasto na rodada */
  onTrackPESpent?: (abilityName: string, cost: number) => void;
  /** HP atual do personagem (para aplicar cura) */
  pvCurrent?: number;
  /** HP máximo do personagem */
  pvMax?: number;
  /** Callback para atualizar HP */
  onHPChange?: (newHP: number) => void;
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
  onHPChange,
}: UseMedicoDeCampoTrackProps) {
  const [extraDice, setExtraDice] = useState(0);
  const [showParamedicoDrawer, setShowParamedicoDrawer] = useState(false);
  const [showHealingRollModal, setShowHealingRollModal] = useState(false);
  const [pendingHealConfig, setPendingHealConfig] = useState<{ totalDice: number; cost: number } | null>(null);

  // Verifica se é Médico de Campo (suporta múltiplos formatos)
  const isMedicoCampo = classTrack === 'Médico de Campo' || classTrack === 'medico-campo';

  // Dados de cura do SUE
  const sueHealing = computedEffects?.healing;
  const sueSupport = computedEffects?.support;

  // Dados de cura base - usa SUE se disponível, mas SEMPRE respeita maxExtraDice
  const healingDice = useMemo(() => {
    const baseDice = getParamedicoDice(nex);
    
    // SUE pode sobrescrever valores base, mas maxExtraDice vem do NEX
    if (sueHealing?.baseDice && sueHealing?.dieType) {
      return {
        base: sueHealing.baseDice,
        dieType: sueHealing.dieType,
        formula: `${sueHealing.baseDice}${sueHealing.dieType}`,
        maxExtraDice: baseDice.maxExtraDice, // Sempre usa o limite do NEX
      };
    }
    return baseDice;
  }, [sueHealing, nex]);

  // Limite máximo de dados extras baseado no NEX
  const maxExtraDice = healingDice.maxExtraDice ?? 0;

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

  // Bônus de cura da origem (ex: Agente de Saúde - Técnica Medicinal adiciona INT)
  const healingBonusFromOrigin = useMemo(() => {
    return {
      value: sueHealing?.bonusFromOrigin ?? 0,
      source: sueHealing?.bonusFromOriginSource ?? null,
    };
  }, [sueHealing]);

  /**
   * Abre drawer para configurar Paramédico
   */
  const handleOpenParamedico = useCallback(() => {
    setExtraDice(0);
    setShowParamedicoDrawer(true);
  }, []);

  /**
   * Executa a cura do Paramédico - abre o modal de rolagem
   */
  const handleUseParamedico = useCallback(() => {
    if (peCurrent < paramedicoCost) {
      toast.error('PE insuficiente', { 
        description: `Paramédico requer ${paramedicoCost} PE (2 base + ${extraDice} extras).` 
      });
      return;
    }

    // Deduz PE
    onPEChange(peCurrent - paramedicoCost);
    onTrackPESpent?.('Paramédico', paramedicoCost);
    
    const totalDice = healingDice.base + extraDice;
    
    // Ativar efeito do Paramédico
    onActivateEffect?.(TRACK_EFFECT_IDS.PARAMEDICO ?? 'track-paramedico', 'Paramédico', 'instant', { dice: totalDice });
    
    // Ativar efeito de defesa do Resgate se desbloqueado
    if (hasResgate) {
      onActivateEffect?.(
        TRACK_EFFECT_IDS.RESGATE_DEFENSE ?? 'track-resgate-defense', 
        'Resgate (Defesa)', 
        'next-turn',
        { selfBonus: selfDefenseBonus, targetBonus: targetDefenseBonus }
      );
    }
    
    // Armazenar configuração e abrir modal de rolagem
    setPendingHealConfig({ totalDice, cost: paramedicoCost });
    setShowParamedicoDrawer(false);
    setShowHealingRollModal(true);
  }, [peCurrent, paramedicoCost, extraDice, healingDice.base, onPEChange, selfDefenseBonus, targetDefenseBonus, hasResgate, onActivateEffect, onTrackPESpent]);

  /**
   * Aplica a cura no personagem após rolagem
   */
  const handleApplyHealing = useCallback((amount: number, target: 'self' | string) => {
    if (target === 'self' && onHPChange) {
      const newHp = Math.min(pvCurrent + amount, pvMax);
      onHPChange(newHp);
      
      const defenseBonusText = hasResgate 
        ? ` Você e o aliado recebem +${targetDefenseBonus} Defesa.` 
        : '';
      
      toast.success(`Curou ${amount} PV!`, {
        description: `HP: ${pvCurrent} → ${newHp}/${pvMax}.${defenseBonusText}`,
      });
    }
    // target === string -> modo campanha futuro (curar aliado por ID)
    
    setShowHealingRollModal(false);
    setPendingHealConfig(null);
  }, [pvCurrent, pvMax, onHPChange, hasResgate, targetDefenseBonus]);

  /**
   * Usa Equipe de Trauma (2 PE)
   */
  const handleEquipeTrauma = useCallback(() => {
    if (peCurrent < 2) {
      toast.error('PE insuficiente', { description: 'Equipe de Trauma requer 2 PE.' });
      return;
    }

    onPEChange(peCurrent - 2);
    onTrackPESpent?.('Equipe de Trauma', 2);
    
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
    isMedicoCampo,
    extraDice,
    setExtraDice,
    showParamedicoDrawer,
    setShowParamedicoDrawer,
    showHealingRollModal,
    setShowHealingRollModal,
    pendingHealConfig,
    
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
    maxExtraDice, // Limite de dados extras pelo NEX
    healingBonusFromOrigin, // Bônus de origem (INT de Agente de Saúde)
    
    // Dados do SUE
    sueHealing,
    sueSupport,
    hasSueData: !!(sueHealing || sueSupport),
    
    // Handlers
    handleOpenParamedico,
    handleUseParamedico,
    handleEquipeTrauma,
    handleReanimacao,
    handleApplyHealing,
    
    // Props de HP para o modal
    pvCurrent,
    pvMax,
    
    // Helpers
    canAffordParamedico: peCurrent >= paramedicoCost,
    canAffordEquipeTrauma: peCurrent >= 2,
    canAffordReanimacao: peCurrent >= 10 && !reanimacaoUsedThisScene,
    canAddExtraDice: extraDice < maxExtraDice && peCurrent >= paramedicoCost + 1,
  };
}
