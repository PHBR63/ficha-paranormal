import { getNexLevel } from '@/lib/rules/nex-progression';
/**
 * Hook de Setup de Rolagem de Combate
 * 
 * Centraliza a lógica de preparação de ataques com armas,
 * calculando automaticamente bônus do SUE, buffs de arma e modificadores.
 * 
 * @module hooks/character/useCombatRollSetup
 */

import { useCallback } from 'react';
import type { WeaponBuff } from '@/hooks/useWeaponBuffs';
import type { BonusSource } from '@/components/dice/DiceRollModal';

// Defaults compartilhados mantêm os callbacks estáveis quando as listas são omitidas.
const EMPTY_WEAPON_BUFFS: WeaponBuff[] = [];
const EMPTY_BONUS_SOURCES: BonusSource[] = [];

/** Tipo de arma para cálculo de ataque */
export type WeaponType = 'melee' | 'ranged' | 'firearm' | 'thrown';

/** Dados da arma para setup de ataque */
export interface WeaponData {
  id: string;
  name: string;
  damage: string;
  damageType?: string;
  weaponType: WeaponType;
  critical?: number;
  criticalMultiplier?: number;
  range?: string;
  proficiency?: string;
  properties?: string[];
}

/** Configuração de ataque calculada */
export interface AttackSetup {
  /** Nome da arma */
  weaponName: string;
  /** Atributo usado (FOR ou AGI) */
  attributeValue: number;
  /** Nome do atributo */
  attributeName: string;
  /** Bônus base de proficiência */
  proficiencyBonus: number;
  /** Bônus total de ataque */
  totalAttackBonus: number;
  /** Dado de dano base */
  baseDamage: string;
  /** Bônus de dano */
  damageBonus: number;
  /** Breakdown de bônus para exibição */
  bonusSources: BonusSource[];
  /** Crítico */
  criticalRange: number;
  criticalMultiplier: number;
}

/** Parâmetros do hook */
interface UseCombatRollSetupParams {
  /** Atributos do personagem */
  attributes: {
    strength: number;
    agility: number;
  };
  /** NEX do personagem */
  nex: number;
  /** Bônus de ataque do SUE */
  attackBonus?: number;
  /** Bônus de dano do SUE */
  damageBonus?: number;
  /** Buffs ativos nas armas */
  weaponBuffs?: WeaponBuff[];
  /** Fontes de bônus do SUE para breakdown */
  bonusSources?: BonusSource[];
}

/**
 * Hook para preparar rolagens de combate com armas
 * 
 * Calcula automaticamente qual atributo usar (FOR/AGI),
 * aplica bônus do SUE e buffs de arma.
 * 
 * @example
 * ```tsx
 * const { prepareAttack } = useCombatRollSetup({
 *   attributes: { strength: 2, agility: 3 },
 *   nex: 50,
 *   attackBonus: bonusSummary.attackBonus,
 *   damageBonus: bonusSummary.damageBonus,
 * });
 * 
 * const setup = prepareAttack(weapon);
 * // Abre modal com setup.totalAttackBonus, setup.bonusSources, etc.
 * ```
 */
export function useCombatRollSetup({
  attributes,
  nex,
  attackBonus = 0,
  damageBonus = 0,
  weaponBuffs = EMPTY_WEAPON_BUFFS,
  bonusSources = EMPTY_BONUS_SOURCES,
}: UseCombatRollSetupParams) {
  
  /**
   * Determina o atributo de ataque baseado no tipo de arma
   * - Corpo a corpo: FOR (ou AGI se arma leve e AGI > FOR)
   * - Distância: AGI
   * - Arma de fogo: AGI
   * - Arremesso: FOR (ou AGI para alcance)
   */
  const getAttackAttribute = useCallback((weaponType: WeaponType, properties?: string[]) => {
    const isLightWeapon = properties?.includes('leve') || properties?.includes('Leve');
    
    switch (weaponType) {
      case 'melee':
        // Armas leves podem usar AGI se for maior que FOR
        if (isLightWeapon && attributes.agility > attributes.strength) {
          return { value: attributes.agility, name: 'Agilidade' };
        }
        return { value: attributes.strength, name: 'Força' };
        
      case 'ranged':
      case 'firearm':
        return { value: attributes.agility, name: 'Agilidade' };
        
      case 'thrown':
        // Arremesso usa FOR para dano, mas AGI para acerto
        return { value: attributes.agility, name: 'Agilidade' };
        
      default:
        return { value: attributes.strength, name: 'Força' };
    }
  }, [attributes.strength, attributes.agility]);

  /**
   * Calcula bônus de proficiência baseado no NEX
   * Meia-proficiência para armas simples, proficiência completa para marciais
   */
  const getProficiencyBonus = useCallback((proficiency?: string): number => {
    const halfProficiency = Math.floor(nex / 10);
    const fullProficiency = getNexLevel(nex);
    
    if (proficiency === 'simples' || proficiency === 'simple') {
      return halfProficiency;
    }
    return fullProficiency;
  }, [nex]);

  /**
   * Busca buffs aplicados (globais, não por arma específica)
   * WeaponBuff não tem weaponId - são buffs globais de rituais
   */
  const getActiveBuffs = useCallback((): WeaponBuff[] => {
    return weaponBuffs;
  }, [weaponBuffs]);

  /**
   * Prepara todos os dados para uma rolagem de ataque
   */
  const prepareAttack = useCallback((weapon: WeaponData): AttackSetup => {
    // Determina atributo
    const attr = getAttackAttribute(weapon.weaponType, weapon.properties);
    
    // Calcula bônus de proficiência
    const profBonus = getProficiencyBonus(weapon.proficiency);
    
    // Busca buffs ativos (globais)
    const activeBuffs = getActiveBuffs();
    const buffAttackBonus = activeBuffs.reduce((sum, b) => sum + (b.attackBonus || 0), 0);
    // WeaponBuff usa bonusDamage (DamageFormula), não damageBonus numérico
    // Para simplicidade, contamos apenas attackBonus aqui
    
    // Calcula totais
    const totalAttack = attr.value + profBonus + attackBonus + buffAttackBonus;
    const totalDamage = damageBonus;
    
    // Monta breakdown com tipo BonusSource correto
    const sources: BonusSource[] = [
      { label: attr.name, value: attr.value, type: 'other' as const },
      ...(profBonus > 0 ? [{ label: 'Proficiência', value: profBonus, type: 'skill' as const }] : []),
      ...bonusSources.filter(b => b.value !== 0),
      ...activeBuffs
        .filter(b => (b.attackBonus || 0) !== 0)
        .map(b => ({
          label: `Buff: ${b.ritualName}`,
          value: b.attackBonus || 0,
          type: 'other' as const,
        })),
    ];
    
    return {
      weaponName: weapon.name,
      attributeValue: attr.value,
      attributeName: attr.name,
      proficiencyBonus: profBonus,
      totalAttackBonus: totalAttack,
      baseDamage: weapon.damage,
      damageBonus: totalDamage,
      bonusSources: sources,
      criticalRange: weapon.critical || 20,
      criticalMultiplier: weapon.criticalMultiplier || 2,
    };
  }, [
    getAttackAttribute,
    getProficiencyBonus,
    getActiveBuffs,
    attackBonus,
    damageBonus,
    bonusSources,
  ]);

  /**
   * Verifica se uma arma usa corpo a corpo ou distância
   */
  const isMeleeWeapon = useCallback((weaponType: WeaponType): boolean => {
    return weaponType === 'melee';
  }, []);

  /**
   * Verifica se uma arma é de arremesso
   */
  const isThrownWeapon = useCallback((weaponType: WeaponType): boolean => {
    return weaponType === 'thrown';
  }, []);

  return {
    prepareAttack,
    getAttackAttribute,
    getProficiencyBonus,
    getActiveBuffs,
    isMeleeWeapon,
    isThrownWeapon,
  };
}
