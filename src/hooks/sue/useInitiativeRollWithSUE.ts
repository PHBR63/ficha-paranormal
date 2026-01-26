/**
 * Hook para rolagem de iniciativa integrado com SUE
 * Ordem Paranormal RPG v1.3
 * 
 * Encapsula rollInitiativeWithContext para uso nos componentes de combate,
 * retornando formato compatível com DiceRollResult.
 */

import { useCallback, useMemo } from 'react';
import type { CharacterState } from '@/lib/rules-engine/types';
import {
  rollInitiativeWithContext,
  type InitiativeRollContext,
  type DetailedInitiativeResult,
} from '@/lib/rules-engine';
import type { DiceRollResult } from '@/lib/dice-roller';

// =====================================================
// TIPOS
// =====================================================

/**
 * Configuração mínima do personagem para o hook
 */
export interface InitiativeRollCharacterConfig {
  characterId?: string;
  characterName?: string;
  characterClass: string;
  classTrack?: string;
  nex: number;
  origin?: string;
  
  attributes: {
    agility: number;
    strength: number;
    presence: number;
    intellect: number;
    vigor: number;
  };
  
  skills?: Record<string, number>;
  activeConditions?: string[];
}

/**
 * Resultado da iniciativa compatível com DiceRollResult + detalhes SUE
 */
export interface InitiativeRollResultCompat extends DiceRollResult {
  /** Fontes de bônus do SUE para exibição */
  sources: Array<{ name: string; value: number; type: string }>;
  
  /** Detalhes da iniciativa */
  initiativeDetails: {
    naturalRoll: number;
    agilityBonus: number;
    totalSUEBonus: number;
  };
}

// =====================================================
// HELPERS DE CONVERSÃO
// =====================================================

/**
 * Converte atributos do hook para CharacterState
 */
function convertAttributesToState(attrs: InitiativeRollCharacterConfig['attributes']): CharacterState['attributes'] {
  return {
    strength: attrs.strength,
    agility: attrs.agility,
    vigor: attrs.vigor,
    intellect: attrs.intellect,
    presence: attrs.presence,
  };
}

/**
 * Converte DetailedInitiativeResult para formato compatível
 */
function convertResultToCompat(result: DetailedInitiativeResult): InitiativeRollResultCompat {
  const roll = result.roll!;
  const breakdown = result.initiativeBreakdown;
  
  return {
    // Campos do DiceRollResult
    dice: roll.diceRolled,
    keptDice: roll.diceKept[0] || roll.diceRolled[0],
    skillBonus: 0, // Iniciativa não usa perícia
    otherBonuses: breakdown.agilityBonus + breakdown.sueBonuses.reduce((sum, b) => sum + b.value, 0) + breakdown.manualModifiers,
    extraDice: 0,
    total: roll.total,
    isDisadvantage: false,
    isCritical: false, // Iniciativa não tem crítico
    timestamp: new Date(),
    type: 'skill',
    label: 'Iniciativa',
    
    // Campos extras
    sources: breakdown.sueBonuses.map(b => ({
      name: b.name,
      value: b.value,
      type: b.sourceType,
    })),
    
    initiativeDetails: {
      naturalRoll: breakdown.naturalRoll,
      agilityBonus: breakdown.agilityBonus,
      totalSUEBonus: breakdown.sueBonuses.reduce((sum, b) => sum + b.value, 0),
    },
  };
}

// =====================================================
// HOOK PRINCIPAL
// =====================================================

/**
 * Hook para rolagem de iniciativa com integração SUE
 * Retorna funções adaptadas para uso nos componentes de combate
 */
export function useInitiativeRollWithSUE(config: InitiativeRollCharacterConfig) {
  // Criar CharacterState mínimo
  const characterState = useMemo<CharacterState>(() => {
    return {
      id: config.characterId || 'temp-initiative',
      name: config.characterName || 'Personagem',
      characterClass: config.characterClass as 'Combatente' | 'Especialista' | 'Ocultista',
      classTrack: config.classTrack,
      nex: config.nex,
      origin: config.origin || 'desconhecida',
      
      attributes: convertAttributesToState(config.attributes),
      skills: {},
      
      classPowers: [],
      generalPowers: [],
      paranormalPowers: [],
      trackAbilities: [],
      
      rituals: [],
      sustainedRituals: [],
      
      equippedWeapons: [],
      inventory: [],
      
      activeConditions: (config.activeConditions || []).map(c => ({
        conditionId: c,
        conditionName: c,
        durationType: 'scene' as const,
      })),
      
      hpCurrent: 0,
      peCurrent: 0,
      sanCurrent: 0,
    };
  }, [
    config.characterId,
    config.characterName,
    config.characterClass,
    config.classTrack,
    config.nex,
    config.origin,
    config.attributes,
    config.activeConditions,
  ]);
  
  /**
   * Executa rolagem de iniciativa com bônus do SUE
   */
  const executeInitiativeRoll = useCallback((
    options: {
      manualModifiers?: number;
      activatedPowers?: string[];
    } = {}
  ): InitiativeRollResultCompat => {
    // Criar contexto
    const context: InitiativeRollContext = {
      characterState,
      manualModifiers: options.manualModifiers,
      activatedPowers: options.activatedPowers,
    };
    
    // Executar rolagem
    const result = rollInitiativeWithContext(context);
    
    // Converter para formato compatível
    return convertResultToCompat(result);
  }, [characterState]);
  
  /**
   * Obtém breakdown de bônus de iniciativa (para exibição prévia)
   */
  const getInitiativeBonusBreakdown = useCallback(() => {
    const sources: Array<{ label: string; value: number; type: string }> = [];
    
    // Agilidade
    sources.push({
      label: 'Agilidade',
      value: config.attributes.agility,
      type: 'attribute',
    });
    
    // Bônus de trilha (Operações Especiais)
    if (config.classTrack === 'operacoes-especiais' || 
        config.classTrack === 'Operações Especiais') {
      const nexBonus = Math.floor(config.nex / 5) >= 16 ? 6 
        : Math.floor(config.nex / 5) >= 10 ? 4 
        : 2;
      sources.push({
        label: 'Operações Especiais',
        value: nexBonus,
        type: 'track',
      });
    }
    
    return {
      sources,
      total: sources.reduce((sum, s) => sum + s.value, 0),
    };
  }, [config.attributes.agility, config.classTrack, config.nex]);
  
  return {
    executeInitiativeRoll,
    getInitiativeBonusBreakdown,
    characterState,
  };
}
