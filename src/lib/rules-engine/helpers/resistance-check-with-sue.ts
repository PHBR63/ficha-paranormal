/**
 * Funções de teste de resistência com integração SUE
 * Ordem Paranormal RPG v1.3
 * 
 * Versões avançadas que integram automaticamente os bônus
 * do Sistema Unificado de Efeitos (SUE) nas rolagens.
 */

import type {
  CharacterState,
  ActionResult,
  BreakdownSource,
  ResistanceKey,
} from '../types';
import { rollSkillCheckWithContext } from './skill-check-with-sue';

// =====================================================
// TIPOS
// =====================================================

/**
 * Contexto expandido para teste de resistência
 */
export interface ResistanceCheckContext {
  /** Estado completo do personagem */
  characterState: CharacterState;
  
  /** Tipo de resistência (Fortitude, Reflexos, Vontade) */
  resistance: ResistanceKey;
  
  /** Dificuldade do teste (DT) */
  dt: number;
  
  /** Modificadores manuais do jogador/mestre */
  manualModifiers?: number;
  
  /** Poderes ativados para este teste */
  activatedPowers?: string[];
}

/**
 * Resultado detalhado de teste de resistência
 */
export interface DetailedResistanceResult extends ActionResult {
  /** Breakdown detalhado do teste */
  resistanceBreakdown: {
    /** Tipo de resistência */
    resistance: ResistanceKey;
    
    /** Nome da resistência em português */
    resistanceName: string;
    
    /** Atributo base usado */
    attribute: {
      name: string;
      value: number;
    };
    
    /** Bônus base da resistência */
    baseBonus: number;
    
    /** Bônus do SUE (poderes, origem, trilha, etc.) */
    sueBonuses: BreakdownSource[];
    
    /** Modificadores manuais */
    manualModifiers: number;
    
    /** Total do teste */
    total: number;
    
    /** DT do teste */
    dt: number;
    
    /** Se passou no teste */
    passed: boolean;
    
    /** Se foi crítico natural (20) */
    isCriticalSuccess: boolean;
    
    /** Se foi falha crítica (1) */
    isCriticalFailure: boolean;
  };
}

// =====================================================
// MAPA DE RESISTÊNCIAS
// =====================================================

const RESISTANCE_NAMES: Record<ResistanceKey, string> = {
  'fortitude': 'Fortitude',
  'reflexos': 'Reflexos',
  'vontade': 'Vontade',
};

// =====================================================
// FUNÇÃO PRINCIPAL
// =====================================================

/**
 * Executa teste de resistência com contexto completo do personagem
 * Integra automaticamente todos os bônus do SUE
 */
export function rollResistanceCheckWithContext(context: ResistanceCheckContext): DetailedResistanceResult {
  const result = rollSkillCheckWithContext({
    characterState: context.characterState,
    skill: context.resistance,
    dt: context.dt,
    manualModifiers: context.manualModifiers,
    activatedPowers: context.activatedPowers,
  });
  const detail = result.skillCheckBreakdown;
  const { skillCheckBreakdown: _skillDetail, ...action } = result;
  return {
    ...action,
    logEvent: { ...result.logEvent, type: 'resistance-check' },
    resistanceBreakdown: {
      resistance: context.resistance,
      resistanceName: RESISTANCE_NAMES[context.resistance],
      attribute: { name: detail.attribute.name, value: detail.attribute.value },
      baseBonus: detail.trainingBonus,
      sueBonuses: detail.sueBonuses,
      manualModifiers: detail.manualModifiers,
      total: detail.total, dt: context.dt, passed: detail.passed,
      isCriticalSuccess: detail.isCriticalSuccess,
      isCriticalFailure: detail.isCriticalFailure,
    },
  };
}
