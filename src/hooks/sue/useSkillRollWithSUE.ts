/**
 * Hook para testes de perícia integrado com SUE
 * Ordem Paranormal RPG v1.3
 * 
 * Encapsula rollSkillCheckWithContext para uso nos modais de perícia,
 * retornando formato compatível com DiceRollResult.
 */

import { useCallback, useMemo } from 'react';
import type { CharacterState, AttributeKey } from '@/lib/rules-engine/types';
import {
  rollSkillCheckWithContext,
  type SkillCheckContext,
  type DetailedSkillCheckResult,
} from '@/lib/rules-engine';
import type { DiceRollResult } from '@/lib/dice-roller';

// =====================================================
// TIPOS
// =====================================================

/**
 * Configuração mínima do personagem para o hook
 */
export interface SkillRollCharacterConfig {
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
  
  skills: Record<string, number>;
  
  classPowers?: string[];
  generalPowers?: string[];
  paranormalPowers?: Array<{ id: string; name: string; element: string }>;
  
  activeConditions?: string[];
}

/**
 * Resultado do teste compatível com DiceRollResult + detalhes SUE
 */
export interface SkillRollResultCompat extends DiceRollResult {
  /** Fontes de bônus do SUE para exibição */
  sources: Array<{ name: string; value: number; type: string }>;
  
  /** Detalhes do teste */
  skillDetails: {
    skillName: string;
    attributeName: string;
    trainingLevel: string;
    passed: boolean;
    dt?: number;
  };
}

// =====================================================
// HELPERS DE CONVERSÃO
// =====================================================

/**
 * Converte atributos do hook para CharacterState
 */
function convertAttributesToState(attrs: SkillRollCharacterConfig['attributes']): CharacterState['attributes'] {
  return {
    strength: attrs.strength,
    agility: attrs.agility,
    vigor: attrs.vigor,
    intellect: attrs.intellect,
    presence: attrs.presence,
  };
}

/**
 * Converte níveis de perícia numéricos para string
 */
function convertSkillsToState(skills: Record<string, number>): CharacterState['skills'] {
  const result: CharacterState['skills'] = {};
  
  for (const [skill, value] of Object.entries(skills)) {
    if (value >= 15) {
      result[skill] = 'expert';
    } else if (value >= 10) {
      result[skill] = 'veterano';
    } else if (value >= 5) {
      result[skill] = 'treinado';
    } else {
      result[skill] = 'destreinado';
    }
  }
  
  return result;
}

/**
 * Converte DetailedSkillCheckResult para formato compatível
 */
function convertResultToCompat(
  result: DetailedSkillCheckResult,
  skillBonus: number
): SkillRollResultCompat {
  const roll = result.roll!;
  const breakdown = result.skillCheckBreakdown;
  
  return {
    // Campos do DiceRollResult
    dice: roll.diceRolled,
    keptDice: roll.diceKept[0] || roll.diceRolled[0],
    skillBonus,
    otherBonuses: breakdown.sueBonuses.reduce((sum, b) => sum + b.value, 0) + breakdown.manualModifiers,
    extraDice: 0,
    total: roll.total,
    isDisadvantage: breakdown.attribute.value <= 0,
    isCritical: breakdown.isCriticalSuccess,
    criticalThreshold: 20,
    timestamp: new Date(),
    type: 'skill',
    label: `Teste de ${breakdown.skillName}`,
    
    // Campos extras
    sources: breakdown.sueBonuses.map(b => ({
      name: b.name,
      value: b.value,
      type: b.sourceType,
    })),
    
    skillDetails: {
      skillName: breakdown.skillName,
      attributeName: breakdown.attribute.name,
      trainingLevel: breakdown.trainingLevel,
      passed: breakdown.passed,
      dt: breakdown.dt,
    },
  };
}

// =====================================================
// HOOK PRINCIPAL
// =====================================================

/**
 * Hook para testes de perícia com integração SUE
 * Retorna funções adaptadas para uso nos modais
 */
export function useSkillRollWithSUE(config: SkillRollCharacterConfig) {
  // Criar CharacterState mínimo
  const characterState = useMemo<CharacterState>(() => {
    return {
      id: config.characterId || 'temp-skill',
      name: config.characterName || 'Personagem',
      characterClass: config.characterClass as 'Combatente' | 'Especialista' | 'Ocultista',
      classTrack: config.classTrack,
      nex: config.nex,
      origin: config.origin || 'desconhecida',
      
      attributes: convertAttributesToState(config.attributes),
      skills: convertSkillsToState(config.skills),
      
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
   * Executa teste de perícia com bônus do SUE
   */
  const executeSkillRoll = useCallback((
    skill: string,
    options: {
      dt?: number;
      manualModifiers?: number;
      attributeOverride?: AttributeKey;
      activatedPowers?: string[];
    } = {}
  ): SkillRollResultCompat => {
    // Obter bônus de treinamento da perícia
    const skillBonus = config.skills[skill] || config.skills[skill.toLowerCase()] || 0;
    
    // Criar contexto
    const context: SkillCheckContext = {
      characterState,
      skill,
      dt: options.dt,
      manualModifiers: options.manualModifiers,
      attributeOverride: options.attributeOverride,
      activatedPowers: options.activatedPowers,
    };
    
    // Executar rolagem
    const result = rollSkillCheckWithContext(context);
    
    // Converter para formato compatível
    return convertResultToCompat(result, skillBonus);
  }, [characterState, config.skills]);
  
  /**
   * Obtém breakdown de bônus para uma perícia (para exibição)
   */
  const getSkillBonusBreakdown = useCallback((skill: string) => {
    const skillBonus = config.skills[skill] || config.skills[skill.toLowerCase()] || 0;
    
    // Determinar nível de treinamento
    let trainingLevel = 'Destreinado';
    if (skillBonus >= 15) {
      trainingLevel = 'Expert';
    } else if (skillBonus >= 10) {
      trainingLevel = 'Veterano';
    } else if (skillBonus >= 5) {
      trainingLevel = 'Treinado';
    }
    
    return {
      skillBonus,
      trainingLevel,
      // TODO: Integrar bônus do SUE para exibição prévia
    };
  }, [config.skills]);
  
  return {
    executeSkillRoll,
    getSkillBonusBreakdown,
    characterState,
  };
}
