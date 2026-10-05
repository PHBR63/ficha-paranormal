/**
 * Hook para testes de resistência integrado com SUE
 * Ordem Paranormal RPG v1.3
 * 
 * Encapsula rollResistanceCheckWithContext para uso nos modais de resistência,
 * retornando formato compatível com DiceRollResult.
 */

import { useCallback, useMemo } from 'react';
import type { CharacterState, ResistanceKey } from '@/lib/rules-engine/types';
import {
  rollResistanceCheckWithContext,
  type ResistanceCheckContext,
  type DetailedResistanceResult,
} from '@/lib/rules-engine';
import type { DiceRollResult } from '@/lib/dice-roller';

// =====================================================
// TIPOS
// =====================================================

/**
 * Configuração mínima do personagem para o hook
 */
export interface ResistanceRollCharacterConfig {
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
  classPowers?: string[];
  generalPowers?: string[];
  paranormalPowers?: Array<{ id: string; name: string; element: string }>;
  
  activeConditions?: string[];
}

/**
 * Resultado do teste compatível com DiceRollResult + detalhes SUE
 */
export interface ResistanceRollResultCompat extends DiceRollResult {
  /** Fontes de bônus do SUE para exibição */
  sources: Array<{ name: string; value: number; type: string }>;
  
  /** Detalhes do teste de resistência */
  resistanceDetails: {
    resistance: ResistanceKey;
    resistanceName: string;
    attributeName: string;
    attributeValue: number;
    passed: boolean;
    dt: number;
  };
}

// =====================================================
// HELPERS DE CONVERSÃO
// =====================================================

/**
 * Converte atributos do hook para CharacterState
 */
function convertAttributesToState(attrs: ResistanceRollCharacterConfig['attributes']): CharacterState['attributes'] {
  return {
    strength: attrs.strength,
    agility: attrs.agility,
    vigor: attrs.vigor,
    intellect: attrs.intellect,
    presence: attrs.presence,
  };
}

/**
 * Converte DetailedResistanceResult para formato compatível
 */
function convertResultToCompat(result: DetailedResistanceResult): ResistanceRollResultCompat {
  const roll = result.roll!;
  const breakdown = result.resistanceBreakdown;
  
  return {
    // Campos do DiceRollResult
    dice: roll.diceRolled,
    keptDice: roll.diceKept[0] || roll.diceRolled[0],
    skillBonus: breakdown.baseBonus,
    otherBonuses: breakdown.sueBonuses.reduce((sum, b) => sum + b.value, 0) + breakdown.manualModifiers,
    extraDice: 0,
    total: roll.total,
    isDisadvantage: roll.isDisadvantage ?? breakdown.attribute.value <= 0,
    isCritical: breakdown.isCriticalSuccess,
    criticalThreshold: 20,
    timestamp: new Date(),
    type: 'resistance',
    label: `Teste de ${breakdown.resistanceName}`,
    
    // Campos extras
    sources: breakdown.sueBonuses.map(b => ({
      name: b.name,
      value: b.value,
      type: b.sourceType,
    })),
    
    resistanceDetails: {
      resistance: breakdown.resistance,
      resistanceName: breakdown.resistanceName,
      attributeName: breakdown.attribute.name,
      attributeValue: breakdown.attribute.value,
      passed: breakdown.passed,
      dt: breakdown.dt,
    },
  };
}

// =====================================================
// HOOK PRINCIPAL
// =====================================================

/**
 * Hook para testes de resistência com integração SUE
 * Retorna funções adaptadas para uso nos modais
 */
export function useResistanceRollWithSUE(config: ResistanceRollCharacterConfig) {
  // Criar CharacterState mínimo
  const characterState = useMemo<CharacterState>(() => {
    return {
      id: config.characterId || 'temp-resistance',
      name: config.characterName || 'Personagem',
      characterClass: config.characterClass as 'Combatente' | 'Especialista' | 'Ocultista',
      classTrack: config.classTrack,
      nex: config.nex,
      origin: config.origin || 'desconhecida',
      
      attributes: convertAttributesToState(config.attributes),
      skills: Object.fromEntries(Object.entries(config.skills ?? {}).map(([skill, value]) => [
        skill, value >= 15 ? 'expert' : value >= 10 ? 'veterano' : value >= 5 ? 'treinado' : 'destreinado',
      ])) as CharacterState['skills'],
      
      classPowers: config.classPowers || [],
      generalPowers: config.generalPowers || [],
      paranormalPowers: config.paranormalPowers?.map(p => p.id) || [],
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
    config.skills,
    config.classPowers,
    config.generalPowers,
    config.paranormalPowers,
    config.activeConditions,
  ]);
  
  /**
   * Executa teste de resistência com bônus do SUE
   */
  const executeResistanceRoll = useCallback((
    resistance: ResistanceKey,
    dt: number,
    options: {
      manualModifiers?: number;
      activatedPowers?: string[];
    } = {}
  ): ResistanceRollResultCompat => {
    // Criar contexto
    const context: ResistanceCheckContext = {
      characterState,
      resistance,
      dt,
      manualModifiers: options.manualModifiers,
      activatedPowers: options.activatedPowers,
    };
    
    // Executar rolagem
    const result = rollResistanceCheckWithContext(context);
    
    // Converter para formato compatível
    return convertResultToCompat(result);
  }, [characterState]);
  
  /**
   * Obtém breakdown de bônus de resistência (para exibição prévia)
   */
  const getResistanceBonusBreakdown = useCallback((resistance: ResistanceKey) => {
    const RESISTANCE_ATTRIBUTE_MAP: Record<ResistanceKey, keyof ResistanceRollCharacterConfig['attributes']> = {
      'fortitude': 'vigor',
      'reflexos': 'agility',
      'vontade': 'presence',
    };
    
    const RESISTANCE_NAMES: Record<ResistanceKey, string> = {
      'fortitude': 'Fortitude',
      'reflexos': 'Reflexos',
      'vontade': 'Vontade',
    };
    
    const ATTRIBUTE_NAMES: Record<string, string> = {
      'vigor': 'Vigor',
      'agility': 'Agilidade',
      'presence': 'Presença',
    };
    
    const attributeKey = RESISTANCE_ATTRIBUTE_MAP[resistance];
    const attributeValue = config.attributes[attributeKey];
    const attributeName = ATTRIBUTE_NAMES[attributeKey];
    const resistanceName = RESISTANCE_NAMES[resistance];
    
    const sources: Array<{ label: string; value: number; type: string }> = [
      {
        label: attributeName,
        value: attributeValue,
        type: 'attribute',
      },
    ];
    
    // TODO: Integrar bônus do SUE para exibição prévia
    
    return {
      resistance,
      resistanceName,
      attributeName,
      attributeValue,
      sources,
      total: attributeValue,
    };
  }, [config.attributes]);
  
  return {
    executeResistanceRoll,
    getResistanceBonusBreakdown,
    characterState,
  };
}
