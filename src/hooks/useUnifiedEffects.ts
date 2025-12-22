/**
 * useUnifiedEffects - Hook central do Sistema Unificado de Efeitos (SUE)
 * 
 * Consolida todos os efeitos de:
 * - Origens (poderes de origem)
 * - Trilhas (habilidades de trilha)
 * - Condições (status ativos)
 * - Rituais (rituais sustentados/ativos)
 * 
 * Aplica regras de stacking do Ordem Paranormal RPG
 * 
 * @version 1.0.0
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
  getOriginEffects,
} from '@/lib/effects/origin-effects-adapter';
import {
  getTrackEffects,
  getTrackCombatEffects,
} from '@/lib/effects/track-effects-adapter';
import {
  getConditionEffects,
} from '@/lib/effects/condition-effects-adapter';
import {
  getRitualEffects,
  SustainedRitualInput,
} from '@/lib/effects/ritual-effects-adapter';

// =====================================================
// Tipos de Entrada do Hook
// =====================================================

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
  };
  
  // Helpers
  hasEffect: (effectId: string) => boolean;
  getEffectsFromSource: (source: UnifiedEffect['source']) => UnifiedEffect[];
  isEffectActive: (effectId: string) => boolean;
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
    
    // Efeitos de condições
    const conditionEffects = collectConditionEffects(characterState.conditions);
    
    // Efeitos de rituais
    // Parâmetros: sustainedRituals (apenas este parâmetro)
    const ritualEffects = getRitualEffects(characterState.activeRituals);

    // ===== FASE 2: Combina todos os efeitos =====
    const allEffects: UnifiedEffect[] = [
      ...originEffects,
      ...trackEffects,
      ...trackCombatEffects,
      ...conditionEffects,
      ...ritualEffects,
    ];

    // ===== FASE 3: Cria contexto de cálculo =====
    const calculationContext = createCalculationContext(characterState, combatContext);

    // ===== FASE 4: Consolida com regras de stacking =====
    const computed = consolidateEffects(allEffects, calculationContext);

    // ===== FASE 5: Agrupa por fonte =====
    const bySource = groupEffectsBySource(allEffects);

    // ===== FASE 6: Helpers =====
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

    return {
      allEffects,
      computed,
      bySource,
      hasEffect,
      getEffectsFromSource,
      isEffectActive,
    };
  }, [
    characterState.origin,
    characterState.classTrack,
    characterState.nex,
    characterState.attributes,
    characterState.conditions,
    characterState.activeRituals,
    characterState.elementalAffinity,
    characterState.affinityActive,
    characterState.currentHP,
    characterState.maxHP,
    characterState.activatedEffectIds,
    combatContext?.inCombat,
    combatContext?.isFirstRound,
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
