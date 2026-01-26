/**
 * Hook para rolagem de combate integrado com SUE (Sistema Unificado de Efeitos)
 * Ordem Paranormal RPG v1.3
 * 
 * Encapsula as funções *WithContext do rules-engine para uso nos modais de combate,
 * mantendo compatibilidade com o sistema de feedback e UI existente.
 */

import { useCallback, useMemo } from 'react';
import type { CharacterState, EquippedWeapon } from '@/lib/rules-engine/types';
import {
  rollAttackWithContext,
  rollDamageWithContext,
  type AttackRollContext,
  type DetailedAttackResult,
  type DamageRollContext,
  type DetailedDamageResult,
} from '@/lib/rules-engine';
import type { ComputedEffects } from '@/lib/unified-effects-engine';

// =====================================================
// TIPOS DE ENTRADA (compatíveis com os modais)
// =====================================================

/**
 * Dados da arma no formato esperado pelos modais
 */
export interface WeaponEntryCompat {
  id: string;
  name: string;
  type: 'Briga' | 'Arremesso' | 'Disparo' | 'Corpo a Corpo';
  damage: string;
  damageType?: string;
  critical?: string;
  criticalMultiplier?: string;
  category?: '0' | 'I' | 'II';
  isFavoriteWeapon?: boolean;
}

/**
 * Atributos do personagem no formato do modal
 */
export interface CharacterAttributesCompat {
  agility: number;
  strength: number;
  presence: number;
  intellect: number;
  vigor: number;
}

/**
 * Configuração do hook
 */
export interface UseCombatRollWithSUEConfig {
  // Dados do personagem
  characterId?: string;
  characterName?: string;
  characterClass: string;
  classTrack?: string;
  nex: number;
  origin?: string;
  
  // Atributos e perícias
  attributes: CharacterAttributesCompat;
  skills: Record<string, number>;
  
  // Poderes e habilidades
  abilities: string[];
  classPowers?: string[];
  generalPowers?: string[];
  paranormalPowers?: Array<{ id: string; name: string; element: string }>;
  
  // Efeitos unificados
  unifiedEffects?: ComputedEffects;
  
  // Condições ativas
  activeConditions?: string[];
  
  // Poderes ativados
  activatedPowers?: string[];
  
  // Bônus condicionais ativos
  activeConditionalBonuses?: string[];
}

/**
 * Resultado do ataque convertido para formato do modal
 */
export interface AttackRollResultCompat {
  // Campos compatíveis com DiceRollResult
  dice: number[];
  kept: number;
  modifier: number;
  total: number;
  label: string;
  isCritical: boolean;
  
  // Campos extras do DetailedAttackResult
  sueBonuses: Array<{ name: string; value: number; sourceType: string }>;
  criticalThreshold: number;
  hit: boolean;
  targetDefense?: number;
}

/**
 * Resultado do dano convertido para formato do modal
 */
export interface DamageRollResultCompat {
  // Resultado geral
  total: number;
  isCritical: boolean;
  
  // Breakdown para exibição
  weaponDice: number[];
  weaponSubtotal: number;
  weaponFormula: string;
  
  // Buffs separados
  buffResults: Array<{
    source: string;
    element?: string;
    formula: string;
    dice: number[];
    subtotal: number;
  }>;
  
  // Bônus numéricos
  bonusSources: Array<{
    source: string;
    value: number;
  }>;
  
  // Crítico
  criticalMultiplier: number;
  damageType?: string;
}

// =====================================================
// HELPERS DE CONVERSÃO
// =====================================================

/**
 * Converte atributos do modal para formato do CharacterState
 */
function convertAttributesToState(attrs: CharacterAttributesCompat): CharacterState['attributes'] {
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
 * Converte arma do modal para formato do EquippedWeapon
 */
function convertWeaponToState(weapon: WeaponEntryCompat): EquippedWeapon {
  const isMelee = weapon.type === 'Corpo a Corpo' || weapon.type === 'Briga';
  
  // Parsear margem de crítico (ex: "19" ou "20")
  let criticalMargin = 20;
  if (weapon.critical) {
    const match = weapon.critical.match(/(\d+)/);
    if (match) {
      criticalMargin = parseInt(match[1], 10);
    }
  }
  
  // Parsear multiplicador de crítico (ex: "x2" ou "x3")
  let criticalMultiplier = 2;
  if (weapon.criticalMultiplier) {
    const match = weapon.criticalMultiplier.match(/x?(\d+)/i);
    if (match) {
      criticalMultiplier = parseInt(match[1], 10);
    }
  }
  
  return {
    id: weapon.id,
    name: weapon.name,
    category: weapon.type,
    damage: weapon.damage,
    criticalMargin,
    criticalMultiplier,
    attackAttribute: isMelee ? 'strength' : 'agility',
    attackSkill: isMelee ? 'luta' : 'pontaria',
    isEquipped: true,
    properties: [],
  };
}

/**
 * Converte DetailedAttackResult para DiceRollResult (compatível com modais)
 */
function convertAttackResultToCompat(result: DetailedAttackResult): AttackRollResultCompat {
  const roll = result.roll!;
  
  return {
    // Campos do DiceRollResult
    dice: roll.diceRolled,
    kept: roll.diceKept[0] || roll.diceRolled[0],
    modifier: roll.modifiers,
    total: roll.total,
    label: result.breakdown.action,
    isCritical: roll.isCriticalSuccess ?? false,
    
    // Campos extras
    sueBonuses: result.attackBreakdown.sueBonuses.map(b => ({
      name: b.name,
      value: b.value,
      sourceType: b.sourceType,
    })),
    criticalThreshold: result.attackBreakdown.criticalThreshold,
    hit: result.attackBreakdown.hit,
    targetDefense: result.attackBreakdown.targetDefense,
  };
}

/**
 * Converte DetailedDamageResult para DamageRollResultCompat
 */
function convertDamageResultToCompat(result: DetailedDamageResult): DamageRollResultCompat {
  const breakdown = result.damageBreakdown;
  
  return {
    total: breakdown.total,
    isCritical: !!result.roll?.isCriticalSuccess,
    
    weaponDice: breakdown.weaponDamage.rolls,
    weaponSubtotal: breakdown.weaponDamage.subtotal,
    weaponFormula: breakdown.weaponDamage.formula,
    
    buffResults: breakdown.buffDamage.map(b => ({
      source: b.source,
      element: b.element,
      formula: b.formula,
      dice: b.rolls,
      subtotal: b.subtotal,
    })),
    
    bonusSources: breakdown.bonuses,
    
    criticalMultiplier: breakdown.criticalMultiplier || 2,
    damageType: breakdown.damageType,
  };
}

// =====================================================
// HOOK PRINCIPAL
// =====================================================

/**
 * Hook para rolagem de combate com integração SUE
 * Retorna funções adaptadas para uso nos modais de combate
 */
export function useCombatRollWithSUE(config: UseCombatRollWithSUEConfig) {
  // Criar CharacterState mínimo para as funções WithContext
  const characterState = useMemo<CharacterState>(() => {
    return {
      id: config.characterId || 'temp-combat',
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
      
      equippedWeapons: [], // Será populado na chamada
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
   * Executa rolagem de ataque usando rollAttackWithContext
   * Retorna resultado compatível com o formato esperado pelos modais
   */
  const executeAttackRoll = useCallback((
    weapon: WeaponEntryCompat,
    options: {
      targetDefense?: number;
      manualModifiers?: number;
      activatedPowers?: string[];
    } = {}
  ): AttackRollResultCompat => {
    // Adicionar arma ao estado
    const equippedWeapon = convertWeaponToState(weapon);
    const stateWithWeapon: CharacterState = {
      ...characterState,
      equippedWeapons: [equippedWeapon],
    };
    
    // Criar contexto de ataque
    const context: AttackRollContext = {
      characterState: stateWithWeapon,
      weaponId: weapon.id,
      targetDefense: options.targetDefense ?? undefined,
      manualModifiers: options.manualModifiers,
      activatedPowers: options.activatedPowers || config.activatedPowers,
    };
    
    // Executar rolagem
    const result = rollAttackWithContext(context);
    
    // Converter para formato compatível
    return convertAttackResultToCompat(result);
  }, [characterState, config.activatedPowers]);
  
  /**
   * Executa rolagem de dano usando rollDamageWithContext
   * Retorna resultado compatível com o formato esperado pelos modais
   */
  const executeDamageRoll = useCallback((
    weapon: WeaponEntryCompat,
    options: {
      isCritical: boolean;
      criticalMargin?: number;
      manualModifiers?: number;
      activatedPowers?: string[];
      weaponBuffs?: Array<{
        sourceId: string;
        sourceName: string;
        bonusDamage?: string;
        bonusAttack?: number;
        element?: string;
      }>;
    }
  ): DamageRollResultCompat => {
    // Converter arma e adicionar buffs
    const equippedWeapon: EquippedWeapon = {
      ...convertWeaponToState(weapon),
      temporaryBuffs: options.weaponBuffs?.map(b => ({
        sourceId: b.sourceId,
        sourceName: b.sourceName,
        bonusDamage: b.bonusDamage,
        bonusAttack: b.bonusAttack,
        element: b.element,
      })),
    };
    
    const stateWithWeapon: CharacterState = {
      ...characterState,
      equippedWeapons: [equippedWeapon],
    };
    
    // Criar contexto de dano
    const context: DamageRollContext = {
      characterState: stateWithWeapon,
      weaponId: weapon.id,
      isCritical: options.isCritical,
      criticalMargin: options.criticalMargin,
      manualModifiers: options.manualModifiers,
      activatedPowers: options.activatedPowers || config.activatedPowers,
    };
    
    // Executar rolagem
    const result = rollDamageWithContext(context);
    
    // Converter para formato compatível
    return convertDamageResultToCompat(result);
  }, [characterState, config.activatedPowers]);
  
  /**
   * Obtém breakdown de bônus de ataque para exibição
   * Usa as mesmas fontes do SUE mas retorna para o UI
   */
  const getAttackBonusBreakdown = useCallback((weapon: WeaponEntryCompat) => {
    const isMelee = weapon.type === 'Corpo a Corpo' || weapon.type === 'Briga';
    const skill = isMelee ? 'luta' : 'pontaria';
    const attribute = isMelee ? config.attributes.strength : config.attributes.agility;
    
    const sources: Array<{ label: string; value: number; type: string }> = [];
    
    // Perícia
    const skillBonus = config.skills[skill] || 0;
    if (skillBonus > 0) {
      sources.push({
        label: isMelee ? 'Luta' : 'Pontaria',
        value: skillBonus,
        type: 'skill',
      });
    }
    
    // SUE (se disponível)
    if (config.unifiedEffects) {
      if (config.unifiedEffects.attack.general > 0) {
        sources.push({
          label: 'Poderes',
          value: config.unifiedEffects.attack.general,
          type: 'power',
        });
      }
      
      if (isMelee && config.unifiedEffects.attack.melee > 0) {
        sources.push({
          label: 'Ataque Corpo a Corpo',
          value: config.unifiedEffects.attack.melee,
          type: 'track',
        });
      }
      
      if (!isMelee && config.unifiedEffects.attack.ranged > 0) {
        sources.push({
          label: 'Ataque à Distância',
          value: config.unifiedEffects.attack.ranged,
          type: 'track',
        });
      }
    }
    
    return {
      attribute,
      attributeName: isMelee ? 'Força' : 'Agilidade',
      skillBonus,
      skillName: isMelee ? 'Luta' : 'Pontaria',
      sources,
      total: sources.reduce((sum, s) => sum + s.value, 0),
    };
  }, [config.attributes, config.skills, config.unifiedEffects]);
  
  /**
   * Obtém breakdown de bônus de dano para exibição
   */
  const getDamageBonusBreakdown = useCallback((weapon: WeaponEntryCompat) => {
    const isMelee = weapon.type === 'Corpo a Corpo' || weapon.type === 'Briga';
    const isFirearm = weapon.type === 'Disparo';
    
    const sources: Array<{ label: string; value: number; type: string }> = [];
    
    // Força para corpo a corpo
    if (isMelee && config.attributes.strength > 0) {
      sources.push({
        label: 'Força',
        value: config.attributes.strength,
        type: 'attribute',
      });
    }
    
    // SUE (se disponível)
    if (config.unifiedEffects) {
      if (config.unifiedEffects.damage.general > 0) {
        sources.push({
          label: 'Poderes',
          value: config.unifiedEffects.damage.general,
          type: 'power',
        });
      }
      
      if (isMelee && config.unifiedEffects.damage.melee > 0) {
        sources.push({
          label: 'Dano Corpo a Corpo',
          value: config.unifiedEffects.damage.melee,
          type: 'track',
        });
      }
      
      if (!isMelee && config.unifiedEffects.damage.ranged > 0) {
        sources.push({
          label: 'Dano à Distância',
          value: config.unifiedEffects.damage.ranged,
          type: 'track',
        });
      }
      
      if (isFirearm && config.unifiedEffects.damage.firearm > 0) {
        sources.push({
          label: 'Arma de Fogo',
          value: config.unifiedEffects.damage.firearm,
          type: 'track',
        });
      }
    }
    
    return {
      sources,
      total: sources.reduce((sum, s) => sum + s.value, 0),
    };
  }, [config.attributes, config.unifiedEffects]);
  
  return {
    // Funções de rolagem
    executeAttackRoll,
    executeDamageRoll,
    
    // Funções de breakdown para UI
    getAttackBonusBreakdown,
    getDamageBonusBreakdown,
    
    // Estado interno para debug
    characterState,
  };
}

export type { CharacterState };
