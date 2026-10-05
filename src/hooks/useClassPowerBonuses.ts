/**
 * useClassPowerBonuses - Hook que calcula bônus dos poderes de classe e trilhas
 * 
 * Integra os engines de poderes (power-effects-engine) e trilhas (track-effects-engine)
 * para calcular automaticamente todos os bônus mecânicos baseados no contexto do personagem.
 * 
 * @module useClassPowerBonuses
 */

import { useMemo } from 'react';
import { 
  calculatePowerBonuses, 
  createEmptyBonusSummary,
  hasPower,
} from '@/lib/class-powers/power-effects-engine';
import { 
  calculateTrackBonuses, 
  createEmptyTrackBonusSummary,
  hasTrackAbility,
} from '@/lib/class-powers/track-effects-engine';
import type { 
  PowerBonusSummary,
  PowerCalculationContext, 
  ActiveClassPower, 
  WeaponCategory, 
  ProtectionCategory 
} from '@/lib/class-powers/types';
import type { 
  TrackBonusSummary,
  TrackCalculationContext 
} from '@/lib/class-powers/track-types';

// ========================================
// TIPOS
// ========================================

/**
 * Configuração de entrada do hook
 */
export interface ClassPowerBonusConfig {
  // Informações básicas do personagem
  nex: number;
  classId: string;
  classTrack?: string | null;
  
  // Atributos
  attributes: {
    strength?: number;
    agility?: number;
    vigor?: number;
    intellect?: number;
    presence?: number;
  };
  
  // Poderes de classe (IDs ou objetos ActiveClassPower)
  classPowers?: (string | ActiveClassPower)[];
  
  // Habilidades legadas (nomes das habilidades para compatibilidade)
  abilities?: string[];
  
  // Contexto de combate
  equippedWeaponType?: WeaponCategory;
  equippedProtectionType?: ProtectionCategory;
  inCombat?: boolean;
  inInvestigation?: boolean;
  
  // Contexto de trilha
  isFavoriteWeapon?: boolean;
}

/**
 * Resultado consolidado dos bônus de classe
 */
export interface ClassPowerBonusResult {
  // Bônus de poderes de classe
  powerBonuses: PowerBonusSummary;
  
  // Bônus de trilha
  trackBonuses: TrackBonusSummary;
  
  // Totais consolidados (para uso rápido)
  totals: {
    attack: { general: number; melee: number; ranged: number; firearm: number };
    damage: { general: number; melee: number; ranged: number; firearm: number };
    defense: number;
    initiative: number;
    criticalMargin: number;
    bonusHP: number;
    damageResistance: number;
    paranormalResistance: number;
    categoryReduction: number;
  };
  
  // Dados extras de dano
  extraDamageDice: string[];
  
  // Atributos usados como bônus de dano
  damageAttributes: string[];
  
  // Bônus de perícias (consolidado)
  skillBonuses: Record<string, number>;
  
  // Proficiências concedidas
  proficiencies: {
    weapons: string[];
    protections: string[];
  };
  
  // Reduções de PE
  peReductions: Array<{ target: string; value: number }>;
  
  // Flags especiais ativas
  specialFlags: string[];
  
  // Dano desarmado (Artista Marcial)
  unarmedDamage?: string;
  
  // Flags especiais de trilha
  canUseHPAsPE: boolean;
  canUseOccultismAsAttack: boolean;
  
  // Breakdown detalhado para UI
  breakdown: {
    powers: Array<{ source: string; effects: string[] }>;
    track: Array<{ source: string; effects: string[] }>;
  };
  
  // Helpers
  hasPower: (powerIdOrName: string) => boolean;
  hasTrackAbility: (abilityId: string) => boolean;
}

// ========================================
// HOOK
// ========================================

/**
 * Hook que calcula automaticamente todos os bônus de poderes de classe e trilha
 */
export function useClassPowerBonuses(config: ClassPowerBonusConfig): ClassPowerBonusResult {
  const {
    nex,
    classId,
    classTrack,
    attributes,
    classPowers = [],
    abilities = [],
    equippedWeaponType,
    equippedProtectionType,
    inCombat = false,
    inInvestigation = false,
    isFavoriteWeapon = false,
  } = config;
  
  return useMemo(() => {
    // Contexto para cálculo de poderes
    const powerContext: PowerCalculationContext = {
      nex,
      attributes: {
        strength: attributes.strength ?? 1,
        agility: attributes.agility ?? 1,
        vigor: attributes.vigor ?? 1,
        intellect: attributes.intellect ?? 1,
        presence: attributes.presence ?? 1,
      },
      equippedWeaponType,
      equippedProtectionType,
      inCombat,
      inInvestigation,
    };
    
    // Contexto para cálculo de trilha
    const trackContext: TrackCalculationContext = {
      nex,
      attributes: powerContext.attributes,
      inCombat,
      isFavoriteWeapon,
      weaponType: equippedWeaponType,
    };
    
    // Calcula bônus de poderes de classe
    const powerBonuses = classPowers.length > 0
      ? calculatePowerBonuses(classPowers, powerContext)
      : createEmptyBonusSummary();
    
    // Calcula bônus de trilha (se houver trilha ativa)
    const trackBonuses = classTrack
      ? calculateTrackBonuses(classTrack, trackContext)
      : createEmptyTrackBonusSummary();
    
    // Consolida totais
    const totals = {
      attack: {
        general: powerBonuses.attack.general,
        melee: powerBonuses.attack.melee,
        ranged: powerBonuses.attack.ranged,
        firearm: powerBonuses.attack.firearm,
      },
      damage: {
        general: powerBonuses.damage.general + trackBonuses.damageBonus,
        melee: powerBonuses.damage.melee,
        ranged: powerBonuses.damage.ranged,
        firearm: powerBonuses.damage.firearm,
      },
      defense: powerBonuses.defense.base + powerBonuses.defense.conditional + trackBonuses.defenseBonus,
      initiative: trackBonuses.initiativeBonus,
      criticalMargin: trackBonuses.criticalMarginBonus,
      bonusHP: trackBonuses.bonusHP,
      // Agora inclui RD dos poderes de classe (Tanque de Guerra, etc.)
      damageResistance: trackBonuses.damageResistance + powerBonuses.damageReduction.physical + powerBonuses.damageReduction.conditional,
      paranormalResistance: trackBonuses.paranormalResistance + powerBonuses.damageReduction.paranormal,
      categoryReduction: trackBonuses.categoryReduction,
    };
    
    // Consolida dados extras
    const extraDamageDice = [
      ...powerBonuses.damage.extraDice,
      ...trackBonuses.extraDamageDice,
    ];
    
    // Consolida bônus de perícias
    const skillBonuses: Record<string, number> = { ...powerBonuses.skills };
    for (const [skill, bonus] of Object.entries(trackBonuses.skillBonuses)) {
      skillBonuses[skill] = (skillBonuses[skill] || 0) + bonus;
    }
    
    // Breakdown para UI
    const breakdown = {
      powers: powerBonuses.specialFlags.length > 0
        ? [{ source: 'Poderes de Classe', effects: powerBonuses.specialFlags }]
        : [],
      track: trackBonuses.breakdown,
    };
    
    // Helpers
    const hasPowerCheck = (powerIdOrName: string) => 
      hasPower(classPowers, powerIdOrName);
    
    const hasTrackAbilityCheck = (abilityId: string) =>
      hasTrackAbility(abilityId, classTrack || undefined, nex);
    
    return {
      powerBonuses,
      trackBonuses,
      totals,
      extraDamageDice,
      damageAttributes: powerBonuses.damage.attributeBonuses,
      skillBonuses,
      proficiencies: powerBonuses.proficiencies,
      peReductions: powerBonuses.peReductions,
      specialFlags: powerBonuses.specialFlags,
      unarmedDamage: powerBonuses.unarmedDamage,
      canUseHPAsPE: trackBonuses.canUseHPAsPE,
      canUseOccultismAsAttack: trackBonuses.canUseOccultismAsAttack,
      breakdown,
      hasPower: hasPowerCheck,
      hasTrackAbility: hasTrackAbilityCheck,
    };
  }, [
    nex,
    classId,
    classTrack,
    attributes,
    classPowers,
    abilities,
    equippedWeaponType,
    equippedProtectionType,
    inCombat,
    inInvestigation,
    isFavoriteWeapon,
  ]);
}

/**
 * Hook simplificado para verificar se tem um poder específico
 */
export function useHasPower(
  classPowers: (string | ActiveClassPower)[],
  powerIdOrName: string
): boolean {
  return useMemo(() => hasPower(classPowers, powerIdOrName), [classPowers, powerIdOrName]);
}

/**
 * Hook simplificado para verificar se tem uma habilidade de trilha
 */
export function useHasTrackAbility(
  classTrack: string | null | undefined,
  nex: number,
  abilityId: string
): boolean {
  return useMemo(
    () => hasTrackAbility(abilityId, classTrack || undefined, nex),
    [classTrack, nex, abilityId]
  );
}
