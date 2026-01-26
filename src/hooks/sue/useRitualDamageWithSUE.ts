/**
 * Hook para dano de rituais integrado com SUE
 * Ordem Paranormal RPG v1.3
 * 
 * Encapsula rollDamageWithContext adaptado para rituais,
 * retornando formato compatível com os modais.
 */

import { useCallback, useMemo } from 'react';
import type { CharacterState } from '@/lib/rules-engine/types';

// =====================================================
// TIPOS
// =====================================================

/**
 * Configuração mínima do personagem para o hook
 */
export interface RitualDamageCharacterConfig {
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
  
  classPowers?: string[];
  generalPowers?: string[];
  paranormalPowers?: Array<{ id: string; name: string; element: string }>;
  
  activeConditions?: string[];
}

/**
 * Configuração do ritual para dano
 */
export interface RitualDamageConfig {
  ritualId: string;
  ritualName: string;
  element: string;
  circle: number;
  
  /** Fórmula de dano base (ex: "2d6", "3d8") */
  baseDamage: string;
  
  /** Tipo de dano */
  damageType?: string;
  
  /** Se é crítico */
  isCritical?: boolean;
  
  /** Modificadores manuais */
  manualModifiers?: number;
  
  /** Potenciações selecionadas que afetam dano */
  enhancements?: Array<{
    id: string;
    name: string;
    extraDamage?: string;
    extraDice?: number;
    bonusDamage?: number;
  }>;
}

/**
 * Resultado do dano de ritual
 */
export interface RitualDamageResult {
  /** Total de dano */
  total: number;
  
  /** Se foi crítico */
  isCritical: boolean;
  
  /** Dados do dano base do ritual */
  baseDice: number[];
  baseSubtotal: number;
  baseFormula: string;
  
  /** Dados de potenciações */
  enhancementDice: Array<{
    name: string;
    dice: number[];
    subtotal: number;
    formula: string;
  }>;
  
  /** Bônus numéricos */
  bonusSources: Array<{
    source: string;
    value: number;
  }>;
  
  /** Multiplicador de crítico */
  criticalMultiplier: number;
  
  /** Tipo de dano */
  damageType?: string;
  
  /** Elemento do ritual */
  element: string;
}

// =====================================================
// HELPERS
// =====================================================

/**
 * Rola um dado
 */
function rollDie(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}

/**
 * Rola múltiplos dados
 */
function rollDice(count: number, sides: number): number[] {
  const results: number[] = [];
  for (let i = 0; i < count; i++) {
    results.push(rollDie(sides));
  }
  return results;
}

/**
 * Parseia fórmula de dano (ex: "2d6", "3d8+2")
 */
function parseDamageFormula(formula: string): { count: number; sides: number; bonus: number } {
  const match = formula.match(/(\d+)d(\d+)(?:\s*\+\s*(\d+))?/i);
  if (!match) {
    return { count: 1, sides: 6, bonus: 0 };
  }
  return {
    count: parseInt(match[1], 10),
    sides: parseInt(match[2], 10),
    bonus: match[3] ? parseInt(match[3], 10) : 0,
  };
}

/**
 * Converte atributos do hook para CharacterState
 */
function convertAttributesToState(attrs: RitualDamageCharacterConfig['attributes']): CharacterState['attributes'] {
  return {
    strength: attrs.strength,
    agility: attrs.agility,
    vigor: attrs.vigor,
    intellect: attrs.intellect,
    presence: attrs.presence,
  };
}

// =====================================================
// HOOK PRINCIPAL
// =====================================================

/**
 * Hook para dano de rituais com integração SUE
 * Retorna funções adaptadas para uso nos modais
 */
export function useRitualDamageWithSUE(config: RitualDamageCharacterConfig) {
  // Criar CharacterState mínimo (para futuras integrações SUE)
  const characterState = useMemo<CharacterState>(() => {
    return {
      id: config.characterId || 'temp-ritual',
      name: config.characterName || 'Personagem',
      characterClass: config.characterClass as 'Combatente' | 'Especialista' | 'Ocultista',
      classTrack: config.classTrack,
      nex: config.nex,
      origin: config.origin || 'desconhecida',
      
      attributes: convertAttributesToState(config.attributes),
      skills: {},
      
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
    config.classPowers,
    config.generalPowers,
    config.paranormalPowers,
    config.activeConditions,
  ]);
  
  /**
   * Executa rolagem de dano de ritual
   */
  const executeRitualDamageRoll = useCallback((ritualConfig: RitualDamageConfig): RitualDamageResult => {
    const isCritical = ritualConfig.isCritical || false;
    const criticalMultiplier = isCritical ? 2 : 1;
    
    // 1. Rolar dano base do ritual
    const baseFormula = parseDamageFormula(ritualConfig.baseDamage);
    const baseDiceCount = baseFormula.count * criticalMultiplier;
    const baseDice = rollDice(baseDiceCount, baseFormula.sides);
    const baseSubtotal = baseDice.reduce((sum, d) => sum + d, 0) + baseFormula.bonus;
    
    // 2. Rolar dados de potenciações
    const enhancementDice: RitualDamageResult['enhancementDice'] = [];
    
    for (const enhancement of ritualConfig.enhancements || []) {
      if (enhancement.extraDamage) {
        const enhFormula = parseDamageFormula(enhancement.extraDamage);
        const enhDiceCount = enhFormula.count * criticalMultiplier;
        const dice = rollDice(enhDiceCount, enhFormula.sides);
        enhancementDice.push({
          name: enhancement.name,
          dice,
          subtotal: dice.reduce((sum, d) => sum + d, 0) + enhFormula.bonus,
          formula: enhancement.extraDamage,
        });
      } else if (enhancement.extraDice) {
        const dice = rollDice(enhancement.extraDice * criticalMultiplier, baseFormula.sides);
        enhancementDice.push({
          name: enhancement.name,
          dice,
          subtotal: dice.reduce((sum, d) => sum + d, 0),
          formula: `${enhancement.extraDice}d${baseFormula.sides}`,
        });
      }
    }
    
    // 3. Coletar bônus numéricos
    const bonusSources: RitualDamageResult['bonusSources'] = [];
    
    // Modificadores manuais
    if (ritualConfig.manualModifiers && ritualConfig.manualModifiers !== 0) {
      bonusSources.push({
        source: 'Modificador',
        value: ritualConfig.manualModifiers,
      });
    }
    
    // Bônus de potenciações
    for (const enhancement of ritualConfig.enhancements || []) {
      if (enhancement.bonusDamage && enhancement.bonusDamage > 0) {
        bonusSources.push({
          source: enhancement.name,
          value: enhancement.bonusDamage,
        });
      }
    }
    
    // TODO: Integrar bônus de dano de rituais do SUE
    
    // 4. Calcular total
    const enhancementTotal = enhancementDice.reduce((sum, e) => sum + e.subtotal, 0);
    const bonusTotal = bonusSources.reduce((sum, b) => sum + b.value, 0);
    const total = baseSubtotal + enhancementTotal + bonusTotal;
    
    return {
      total,
      isCritical,
      baseDice,
      baseSubtotal,
      baseFormula: ritualConfig.baseDamage,
      enhancementDice,
      bonusSources,
      criticalMultiplier,
      damageType: ritualConfig.damageType,
      element: ritualConfig.element,
    };
  }, []);
  
  /**
   * Obtém breakdown de bônus de dano de ritual (para exibição prévia)
   */
  const getRitualDamageBonusBreakdown = useCallback((ritualConfig: RitualDamageConfig) => {
    const sources: Array<{ label: string; value: string; type: string }> = [];
    
    // Dano base
    sources.push({
      label: 'Dano Base',
      value: ritualConfig.baseDamage,
      type: 'ritual',
    });
    
    // Potenciações
    for (const enhancement of ritualConfig.enhancements || []) {
      if (enhancement.extraDamage) {
        sources.push({
          label: enhancement.name,
          value: `+${enhancement.extraDamage}`,
          type: 'enhancement',
        });
      } else if (enhancement.extraDice) {
        const baseFormula = parseDamageFormula(ritualConfig.baseDamage);
        sources.push({
          label: enhancement.name,
          value: `+${enhancement.extraDice}d${baseFormula.sides}`,
          type: 'enhancement',
        });
      } else if (enhancement.bonusDamage) {
        sources.push({
          label: enhancement.name,
          value: `+${enhancement.bonusDamage}`,
          type: 'enhancement',
        });
      }
    }
    
    // TODO: Integrar bônus do SUE para exibição prévia
    
    return {
      sources,
      element: ritualConfig.element,
    };
  }, []);
  
  return {
    executeRitualDamageRoll,
    getRitualDamageBonusBreakdown,
    characterState,
  };
}
