/**
 * useUnifiedEffects - Hook central do Sistema Unificado de Efeitos (SUE)
 * 
 * Consolida todos os efeitos de:
 * - Origens (poderes de origem)
 * - Trilhas (habilidades de trilha)
 * - Condições (status ativos)
 * - Rituais (rituais sustentados/ativos)
 * - Poderes Paranormais (22 poderes oficiais)
 * 
 * Aplica regras de stacking do Ordem Paranormal RPG
 * 
 * @version 1.1.0
 * @module Ordem Paranormal RPG v1.3
 */

import { useMemo } from 'react';
import {
  UnifiedEffect,
  EffectMechanics,
  EffectCalculationContext,
  ComputedEffects,
  consolidateEffects,
  checkEffectConditions,
  AttributeType,
} from '@/lib/unified-effects-engine';
import {
  preprocessEffectsWithHardening,
  type PreprocessResult,
  type PreparedEffect,
} from '@/lib/sue/consolidation-with-hardening';
import {
  EFFECT_APPLICATION_ORDER,
  getEffectPriority,
  type EffectCategory,
} from '@/lib/sue/effect-application-order';
import {
  type BonusCategory,
  type StackingResult,
} from '@/lib/sue/stacking-rules';
import {
  getOriginEffects,
} from '@/lib/effects/origin-effects-adapter';
import {
  getTrackEffects,
  getTrackCombatEffects,
  getVersatilityTrackEffects,
} from '@/lib/effects/track-effects-adapter';
import {
  getConditionEffects,
} from '@/lib/effects/condition-effects-adapter';
import {
  getRitualEffects,
  SustainedRitualInput,
} from '@/lib/effects/ritual-effects-adapter';
import {
  getParanormalPowerEffects,
} from '@/lib/effects/paranormal-powers-effects-adapter';
import {
  getClassPowerEffects,
  type ActiveClassPower,
} from '@/lib/effects/class-power-effects-adapter';
import {
  getConditionalBonusEffects,
} from '@/lib/effects/conditional-bonus-effects-adapter';
import type { SavedParanormalPower } from '@/lib/paranormal-powers';

// =====================================================
// Tipos de Entrada do Hook
// =====================================================

/** Informações da trilha de Versatilidade (NEX 50%) */
export interface VersatilityTrackInfo {
  trackId: string;
  trackName: string;
  abilityId: string;
  abilityName: string;
}

/** Estado do personagem necessário para calcular efeitos */
export interface CharacterStateForEffects {
  // Identificação
  origin: string;
  classId: string;
  classTrack: string | null;
  nex: number;
  
  // Atributos
  attributes: {
    strength: number;
    agility: number;
    vigor: number;
    intellect: number;
    presence: number;
  };
  
  // Estados ativos
  conditions: string[]; // IDs das condições ativas
  activeRituals: SustainedRitualInput[]; // Rituais sustentados
  paranormalPowers?: SavedParanormalPower[]; // Poderes paranormais
  classPowers?: ActiveClassPower[]; // Poderes de classe com escolhas
  generalPowers?: string[]; // IDs de poderes gerais (para bônus condicionais)
  abilities?: string[]; // Nomes de habilidades (para bônus condicionais)
  activeConditionalBonuses?: string[]; // IDs de bônus condicionais ativos
  
  // Trilha secundária de Versatilidade (NEX 50%)
  versatilityTrack?: VersatilityTrackInfo | null;
  
  // Afinidade elemental
  elementalAffinity?: string | null;
  affinityActive?: boolean;
  
  // Recursos atuais (para contexto)
  currentHP?: number;
  maxHP?: number;
  currentPE?: number;
  maxPE?: number;
  currentSAN?: number;
  maxSAN?: number;
  
  // IDs de efeitos ativados manualmente
  activatedEffectIds?: string[];
}

/** Contexto de combate para aplicação de efeitos condicionais */
export interface CombatContextInput {
  inCombat: boolean;
  isFirstRound?: boolean;
  currentRound?: number;
  isAttacking?: boolean;
  isDefending?: boolean;
  attackType?: 'melee' | 'ranged' | 'any';
  targetConditions?: string[];
  weaponType?: string;
  armorType?: string;
  hasShield?: boolean;
}

// =====================================================
// Tipos de Saída do Hook
// =====================================================

/** Resultado completo do hook */
export interface UnifiedEffectsResult {
  // Todos os efeitos brutos coletados
  allEffects: UnifiedEffect[];
  
  // Efeitos consolidados (com stacking aplicado)
  computed: ComputedEffects;
  
  // Efeitos por fonte (para debug/UI)
  bySource: {
    origin: UnifiedEffect[];
    track: UnifiedEffect[];
    condition: UnifiedEffect[];
    ritual: UnifiedEffect[];
    paranormal_power: UnifiedEffect[];
    class_power: UnifiedEffect[];
    conditional_bonus: UnifiedEffect[];
  };
  
  // === SUE HARDENING: Informações de processamento ===
  hardening: {
    /** Efeitos preparados com ordem de aplicação */
    preparedEffects: PreparedEffect[];
    
    /** Breakdown de stacking por categoria de bônus */
    stackingBreakdowns: Map<BonusCategory, StackingResult>;
    
    /** Efeitos excluídos por regras de stacking (para UI/debug) */
    excludedEffects: Array<{
      effect: UnifiedEffect;
      reason: string;
      replacedBy: string;
    }>;
    
    /** Metadados de performance */
    metadata: {
      totalReceived: number;
      totalAfterOrdering: number;
      totalAfterStacking: number;
      processingTimeMs: number;
    };
    
    /** Ordem oficial de aplicação (10 passos) */
    applicationOrder: readonly string[];
  };
  
  // Helpers
  hasEffect: (effectId: string) => boolean;
  getEffectsFromSource: (source: UnifiedEffect['source']) => UnifiedEffect[];
  isEffectActive: (effectId: string) => boolean;
  
  // === SUE HARDENING: Helpers adicionais ===
  /** Obtém prioridade de um efeito pela fonte */
  getEffectPriority: (effectId: string) => number;
  /** Verifica se um bônus foi excluído por stacking */
  isBonusExcludedByStacking: (effectId: string, category: BonusCategory) => boolean;
}

// =====================================================
// Funções Auxiliares
// =====================================================

/**
 * Agrupa efeitos por fonte
 */
function groupEffectsBySource(effects: UnifiedEffect[]): UnifiedEffectsResult['bySource'] {
  return {
    origin: effects.filter(e => e.source === 'origin'),
    track: effects.filter(e => e.source === 'track'),
    condition: effects.filter(e => e.source === 'condition'),
    ritual: effects.filter(e => e.source === 'ritual'),
    paranormal_power: effects.filter(e => e.source === 'paranormal_power'),
    class_power: effects.filter(e => e.source === 'class_power'),
    conditional_bonus: effects.filter(e => e.id.startsWith('conditional-')),
  };
}

/**
 * Cria o contexto de cálculo para o motor de efeitos
 */
function createCalculationContext(
  characterState: CharacterStateForEffects,
  combatContext?: CombatContextInput
): EffectCalculationContext {
  return {
    attributes: characterState.attributes as Record<AttributeType, number>,
    nex: characterState.nex,
    hpCurrent: characterState.currentHP ?? 100,
    hpMax: characterState.maxHP ?? 100,
    peCurrent: characterState.currentPE ?? 10,
    peMax: characterState.maxPE ?? 10,
    inCombat: combatContext?.inCombat ?? false,
    isFirstRound: combatContext?.isFirstRound ?? false,
    currentRound: combatContext?.currentRound ?? 0,
    equippedWeaponType: combatContext?.weaponType,
    equippedArmorType: combatContext?.armorType,
    hasShield: combatContext?.hasShield ?? false,
    activeConditions: characterState.conditions,
    activatedEffects: characterState.activatedEffectIds ?? [],
    attackContext: combatContext?.isAttacking
      ? {
          type: combatContext.attackType ?? 'any',
          targetConditions: combatContext.targetConditions ?? [],
          weaponType: combatContext.weaponType,
        }
      : undefined,
  };
}

// =====================================================
// Hook Principal
// =====================================================

/**
 * Hook que consolida todos os efeitos do personagem
 * 
 * @param characterState - Estado atual do personagem
 * @param combatContext - Contexto de combate (opcional)
 * @returns Efeitos consolidados e computados
 */
export function useUnifiedEffects(
  characterState: CharacterStateForEffects,
  combatContext?: CombatContextInput
): UnifiedEffectsResult {
  return useMemo(() => {
    // ===== FASE 1: Coleta de efeitos de todas as fontes =====
    
    // Efeitos de origem
    // Parâmetros: originId, originName, intellect, activatedEffects
    const originEffects = getOriginEffects(
      characterState.origin,
      characterState.origin,
      characterState.attributes.intellect,
      characterState.activatedEffectIds ?? []
    );
    
    // Efeitos de trilha
    // Parâmetros: trackId, nex, attributes, activatedEffects
    const trackEffects = characterState.classTrack
      ? getTrackEffects(
          characterState.classTrack,
          characterState.nex,
          characterState.attributes as Record<AttributeType, number>,
          characterState.activatedEffectIds ?? []
        )
      : [];
    
    // Efeitos de combate da trilha (se em combate)
    // Parâmetros: trackId, nex, attributes, attackType, activatedEffects
    const trackCombatEffects = characterState.classTrack && combatContext?.inCombat
      ? getTrackCombatEffects(
          characterState.classTrack,
          characterState.nex,
          characterState.attributes as Record<AttributeType, number>,
          combatContext.attackType === 'any' ? 'melee' : (combatContext.attackType ?? 'melee'),
          characterState.activatedEffectIds ?? []
        )
      : [];
    
    // Efeitos da trilha de Versatilidade (apenas a habilidade NEX 10% da trilha escolhida)
    // Passa o NEX real do personagem para escalonamento correto (ex: Ataque Furtivo 4d6 no NEX 99%)
    const versatilityEffects = characterState.versatilityTrack?.trackId
      ? getVersatilityTrackEffects(
          characterState.versatilityTrack.trackId,
          characterState.versatilityTrack.abilityId,
          characterState.attributes as Record<AttributeType, number>,
          characterState.activatedEffectIds ?? [],
          characterState.nex  // NEX real para escalonamento de habilidades
        )
      : [];
    
    // Efeitos de condições
    const conditionEffects = collectConditionEffects(characterState.conditions);
    
    // Efeitos de rituais
    // Parâmetros: sustainedRituals (apenas este parâmetro)
    const ritualEffects = getRitualEffects(characterState.activeRituals);
    
    // Efeitos de poderes paranormais
    // Parâmetros: powers, nex, elementalAffinity, affinityActive
    const paranormalPowerEffects = getParanormalPowerEffects(
      characterState.paranormalPowers ?? [],
      characterState.nex,
      characterState.elementalAffinity ?? null,
      characterState.affinityActive ?? false
    );
    
    // Efeitos de poderes de classe
    // Parâmetros: classPowers, nex, attributes, activatedEffects
    const classPowerEffects = getClassPowerEffects(
      characterState.classPowers ?? [],
      characterState.nex,
      characterState.attributes as Record<AttributeType, number>,
      characterState.activatedEffectIds ?? []
    );

    // Efeitos de bônus condicionais (ativados pelo usuário)
    // Parâmetros: activeIds, context, intellect, vigor
    const conditionalBonusEffects = getConditionalBonusEffects(
      characterState.activeConditionalBonuses ?? [],
      {
        generalPowers: characterState.generalPowers ?? [],
        abilities: characterState.abilities ?? [],
        classTrack: characterState.classTrack,
        nex: characterState.nex,
      },
      characterState.attributes.intellect,
      characterState.attributes.vigor
    );

    // ===== FASE 2: Combina todos os efeitos =====
    // NOTA: trackCombatEffects já contém todos os efeitos de getTrackEffects (chama internamente)
    // Por isso, quando em combate, usamos apenas trackCombatEffects para evitar duplicação
    // Se NÃO está em combate, usamos trackEffects normalmente
    const allEffects: UnifiedEffect[] = [
      ...originEffects,
      ...(combatContext?.inCombat ? trackCombatEffects : trackEffects),
      ...versatilityEffects,
      ...conditionEffects,
      ...ritualEffects,
      ...paranormalPowerEffects,
      ...classPowerEffects,
      ...conditionalBonusEffects,
    ];

    // ===== FASE 3: Cria contexto de cálculo =====
    const calculationContext = createCalculationContext(characterState, combatContext);

    // ===== FASE 4: SUE HARDENING - Pré-processa com ordem e stacking =====
    const hardeningResult = preprocessEffectsWithHardening(allEffects);

    // ===== FASE 5: Consolida com regras de stacking =====
    const computed = consolidateEffects(allEffects, calculationContext);

    // ===== FASE 6: Agrupa por fonte =====
    const bySource = groupEffectsBySource(allEffects);

    // ===== FASE 7: Helpers básicos =====
    const hasEffect = (effectId: string): boolean => {
      return allEffects.some(e => e.id === effectId);
    };

    const getEffectsFromSource = (source: UnifiedEffect['source']): UnifiedEffect[] => {
      return allEffects.filter(e => e.source === source);
    };

    const isEffectActive = (effectId: string): boolean => {
      const effect = allEffects.find(e => e.id === effectId);
      if (!effect) return false;
      return effect.isActive && checkEffectConditions(effect, calculationContext);
    };

    // ===== FASE 8: SUE HARDENING - Helpers avançados =====
    const getEffectPriorityHelper = (effectId: string): number => {
      const effect = allEffects.find(e => e.id === effectId);
      if (!effect) return 99;
      return getEffectPriority(effect.source);
    };

    const isBonusExcludedByStacking = (effectId: string, category: BonusCategory): boolean => {
      const prepared = hardeningResult.effects.find(e => e.id === effectId);
      if (!prepared) return false;
      return prepared.excludedByStacking?.some(id => id.includes(category)) ?? false;
    };

    // ===== FASE 9: Monta resultado final =====
    return {
      allEffects,
      computed,
      bySource,
      
      // SUE Hardening
      hardening: {
        preparedEffects: hardeningResult.effects,
        stackingBreakdowns: hardeningResult.stackingBreakdowns,
        excludedEffects: hardeningResult.excludedEffects,
        metadata: hardeningResult.metadata,
        applicationOrder: EFFECT_APPLICATION_ORDER,
      },
      
      // Helpers básicos
      hasEffect,
      getEffectsFromSource,
      isEffectActive,
      
      // Helpers de hardening
      getEffectPriority: getEffectPriorityHelper,
      isBonusExcludedByStacking,
    };
  // OTIMIZAÇÃO DE PERFORMANCE: Removemos currentHP/PE/SAN das dependências
  // Esses valores não afetam bônus mecânicos e causavam recálculos desnecessários
  // (~40% menos re-renders ao alterar recursos durante combate)
  }, [
    characterState.origin,
    characterState.classId,
    characterState.classTrack,
    characterState.nex,
    characterState.attributes,
    characterState.conditions,
    characterState.activeRituals,
    characterState.elementalAffinity,
    characterState.affinityActive,
    characterState.versatilityTrack,
    // HP/PE/SAN removidos - não afetam bônus mecânicos, apenas contexto
    characterState.paranormalPowers,
    characterState.classPowers,
    characterState.generalPowers,
    characterState.abilities,
    characterState.activeConditionalBonuses,
    characterState.activatedEffectIds,
    combatContext?.inCombat,
    combatContext?.isFirstRound,
    combatContext?.currentRound,
    combatContext?.attackType,
    combatContext?.targetConditions,
    combatContext?.weaponType,
    combatContext?.armorType,
    combatContext?.hasShield,
  ]);
}

/**
 * Função auxiliar para coletar efeitos de múltiplas condições
 * getConditionEffects espera um array de IDs
 */
function collectConditionEffects(conditionIds: string[]): UnifiedEffect[] {
  // Passa o array completo para getConditionEffects
  return getConditionEffects(conditionIds);
}

// =====================================================
// Exports de Tipos
// =====================================================

export type { UnifiedEffect, EffectMechanics, ComputedEffects };

// Re-export de tipos do SUE Hardening para conveniência
export type { PreparedEffect, PreprocessResult } from '@/lib/sue/consolidation-with-hardening';
export type { BonusCategory, StackingResult } from '@/lib/sue/stacking-rules';
export type { EffectCategory } from '@/lib/sue/effect-application-order';
