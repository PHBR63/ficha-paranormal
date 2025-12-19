/**
 * useRitualCombatBonuses - Hook para extrair bônus de combate de rituais sustentados
 * Processa automaticamente attackModifier, damageModifier, weaponEffect de rituais ativos
 * 
 * ATUALIZADO: Agora usa o sistema unificado de rituais
 */

import { useMemo } from 'react';
import { getActiveRitualEffectUnified } from '@/lib/rituals/ritual-adapter';
import { getRitualEffect, getEffectiveLevel } from '@/lib/rituals/ritual-registry';
import type { RitualMechanics } from '@/lib/rituals/types';

// Interface mínima para ritual sustentado (compatível com ambos os tipos)
export interface SustainedRitualInput {
  ritualId: string;
  ritualName?: string;
  selectedEnhancements: string[];
}

// Interface para bônus de combate de ritual
export interface RitualCombatBonus {
  source: string;
  ritualId: string;
  level: 'base' | 'discente' | 'verdadeiro';
  attackModifier?: number;
  damageModifier?: number;
  defenseModifier?: number;
  weaponEffect?: {
    damageType?: string;
    extraDice?: { count: number; type: number };
    damageBonus?: number;
    special?: string;
  };
  tempHP?: number;
  damageReduction?: {
    types: string[];
    amount: number;
  };
}

// Interface para breakdown consolidado
export interface RitualCombatSummary {
  totalAttackBonus: number;
  totalDamageBonus: number;
  totalDefenseBonus: number;
  totalTempHP: number;
  weaponEffects: Array<{
    source: string;
    damageType?: string;
    extraDice?: { count: number; type: number };
    special?: string;
  }>;
  damageReductions: Array<{
    source: string;
    types: string[];
    amount: number;
  }>;
  bonuses: RitualCombatBonus[];
  hasActiveRituals: boolean;
}

// Função auxiliar para extrair nome legível do ritualId
function formatRitualName(ritualId: string): string {
  return ritualId
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Extrai bônus de combate das mecânicas unificadas
 */
function extractBonusFromMechanics(
  mechanics: RitualMechanics,
  ritualId: string,
  ritualName: string,
  level: 'base' | 'discente' | 'verdadeiro'
): RitualCombatBonus | null {
  const bonus: RitualCombatBonus = {
    source: ritualName,
    ritualId,
    level,
  };

  // Extrai modificadores numéricos
  if (mechanics.attackBonus !== undefined) {
    bonus.attackModifier = mechanics.attackBonus;
  }

  if (mechanics.damageBonus !== undefined) {
    bonus.damageModifier = typeof mechanics.damageBonus === 'number' 
      ? mechanics.damageBonus 
      : 0;
  }

  if (mechanics.defenseBonus !== undefined) {
    bonus.defenseModifier = mechanics.defenseBonus;
  }

  // Extrai weaponEffect
  if (mechanics.weaponEffect) {
    const we = mechanics.weaponEffect;
    bonus.weaponEffect = {
      damageType: we.damageType,
      special: we.special,
    };
    
    // Parseia damageBonus se for string de dado
    if (we.damageBonus && typeof we.damageBonus === 'string') {
      const diceMatch = we.damageBonus.match(/(\d+)d(\d+)/);
      if (diceMatch) {
        bonus.weaponEffect.extraDice = {
          count: parseInt(diceMatch[1]),
          type: parseInt(diceMatch[2]),
        };
      }
    }
    
    // Também extrai attackBonus do weaponEffect
    if (we.attackBonus) {
      bonus.attackModifier = (bonus.attackModifier || 0) + we.attackBonus;
    }
  }

  // Extrai tempHP
  if (mechanics.tempHP) {
    // Para UI, mostra o valor médio esperado
    const avgDice = (mechanics.tempHP.diceCount * (mechanics.tempHP.diceType + 1)) / 2;
    bonus.tempHP = Math.floor(avgDice + (mechanics.tempHP.bonus || 0));
  }

  // Extrai damageReduction
  if (mechanics.damageReduction) {
    bonus.damageReduction = {
      types: mechanics.damageReduction.types,
      amount: mechanics.damageReduction.amount,
    };
  }

  // Só retorna se tem algum efeito de combate
  if (bonus.attackModifier || bonus.damageModifier || bonus.defenseModifier ||
      bonus.weaponEffect || bonus.tempHP || bonus.damageReduction) {
    return bonus;
  }

  return null;
}

/**
 * Hook principal para extrair bônus de combate de rituais sustentados
 * @param sustainedRituals Lista de rituais sustentados ativos
 * @returns Resumo consolidado de bônus de combate
 */
export function useRitualCombatBonuses(
  sustainedRituals: SustainedRitualInput[] = []
): RitualCombatSummary {
  return useMemo(() => {
    const bonuses: RitualCombatBonus[] = [];
    
    // Processa cada ritual sustentado
    for (const ritual of sustainedRituals) {
      const level = getEffectiveLevel(ritual.selectedEnhancements || []);
      
      // Primeiro tenta o sistema unificado
      const mechanics = getRitualEffect(ritual.ritualId, level);
      
      if (mechanics) {
        const bonus = extractBonusFromMechanics(
          mechanics,
          ritual.ritualId,
          ritual.ritualName || formatRitualName(ritual.ritualId),
          level
        );
        if (bonus) bonuses.push(bonus);
        continue;
      }
      
      // Fallback para sistema legado
      const legacyEffect = getActiveRitualEffectUnified(ritual.ritualId, ritual.selectedEnhancements || []);
      if (!legacyEffect) continue;
      
      const bonus: RitualCombatBonus = {
        source: ritual.ritualName || formatRitualName(ritual.ritualId),
        ritualId: ritual.ritualId,
        level,
      };
      
      // Extrai modificadores numéricos do efeito legado
      if (legacyEffect.attackModifier) {
        bonus.attackModifier = legacyEffect.attackModifier;
      }
      
      if (legacyEffect.damageModifier) {
        bonus.damageModifier = legacyEffect.damageModifier;
      }
      
      if (legacyEffect.defenseModifier) {
        bonus.defenseModifier = legacyEffect.defenseModifier;
      }
      
      // Extrai weaponEffect
      if (legacyEffect.weaponEffect) {
        bonus.weaponEffect = {
          damageType: legacyEffect.weaponEffect.damageType,
          extraDice: legacyEffect.weaponEffect.extraDice,
          damageBonus: legacyEffect.weaponEffect.damageBonus,
          special: legacyEffect.weaponEffect.special,
        };
      }
      
      // Extrai tempHP
      if (legacyEffect.tempHP) {
        if (legacyEffect.tempHP.bonus && legacyEffect.tempHP.diceCount === 0) {
          bonus.tempHP = legacyEffect.tempHP.bonus;
        } else if (legacyEffect.tempHP.diceCount && legacyEffect.tempHP.diceType) {
          const avgDice = (legacyEffect.tempHP.diceCount * (legacyEffect.tempHP.diceType + 1)) / 2;
          bonus.tempHP = Math.floor(avgDice + (legacyEffect.tempHP.bonus || 0));
        }
      }
      
      // Extrai damageReduction
      if (legacyEffect.damageReduction) {
        bonus.damageReduction = {
          types: legacyEffect.damageReduction.types as string[],
          amount: legacyEffect.damageReduction.amount,
        };
      }
      
      // Só adiciona se tem algum efeito de combate
      if (bonus.attackModifier || bonus.damageModifier || bonus.defenseModifier ||
          bonus.weaponEffect || bonus.tempHP || bonus.damageReduction) {
        bonuses.push(bonus);
      }
    }
    
    // Consolida totais - REGRA OFICIAL: Rituais NÃO acumulam entre si
    // Usa apenas o MAIOR bônus de cada tipo
    const attackModifiers = bonuses.map(b => b.attackModifier || 0);
    const damageModifiers = bonuses.map(b => b.damageModifier || 0);
    const defenseModifiers = bonuses.map(b => b.defenseModifier || 0);
    const tempHPs = bonuses.map(b => b.tempHP || 0);
    
    const totalAttackBonus = attackModifiers.length > 0 ? Math.max(...attackModifiers) : 0;
    const totalDamageBonus = damageModifiers.length > 0 ? Math.max(...damageModifiers) : 0;
    const totalDefenseBonus = defenseModifiers.length > 0 ? Math.max(...defenseModifiers) : 0;
    const totalTempHP = tempHPs.length > 0 ? Math.max(...tempHPs) : 0;
    
    // Coleta weaponEffects
    const weaponEffects = bonuses
      .filter(b => b.weaponEffect?.extraDice || b.weaponEffect?.damageType)
      .map(b => ({
        source: b.source,
        damageType: b.weaponEffect!.damageType,
        extraDice: b.weaponEffect!.extraDice,
        special: b.weaponEffect!.special,
      }));
    
    // Coleta damageReductions
    const damageReductions = bonuses
      .filter(b => b.damageReduction)
      .map(b => ({
        source: b.source,
        types: b.damageReduction!.types,
        amount: b.damageReduction!.amount,
      }));
    
    return {
      totalAttackBonus,
      totalDamageBonus,
      totalDefenseBonus,
      totalTempHP,
      weaponEffects,
      damageReductions,
      bonuses,
      hasActiveRituals: bonuses.length > 0,
    };
  }, [sustainedRituals]);
}

/**
 * Hook auxiliar para obter bônus formatados para exibição no CombatRollModal
 */
export function useRitualBonusesForCombat(
  sustainedRituals: SustainedRitualInput[] = []
): Array<{
  id: string;
  name: string;
  source: 'ritual';
  attackBonus?: number;
  damageBonus?: number | string;
  isPassive: true;
  description: string;
}> {
  const summary = useRitualCombatBonuses(sustainedRituals);
  
  return useMemo(() => {
    return summary.bonuses.map(bonus => {
      const parts: string[] = [];
      
      if (bonus.attackModifier) {
        parts.push(`+${bonus.attackModifier} ataque`);
      }
      if (bonus.damageModifier) {
        parts.push(`+${bonus.damageModifier} dano`);
      }
      if (bonus.weaponEffect?.extraDice) {
        const dice = `${bonus.weaponEffect.extraDice.count}d${bonus.weaponEffect.extraDice.type}`;
        const type = bonus.weaponEffect.damageType || '';
        parts.push(`+${dice}${type ? ` ${type}` : ''}`);
      }
      if (bonus.defenseModifier) {
        parts.push(`+${bonus.defenseModifier} defesa`);
      }
      
      // Formata dano para CombatRollModal
      let damageBonus: number | string | undefined;
      if (bonus.damageModifier) {
        damageBonus = bonus.damageModifier;
      }
      
      return {
        id: `ritual-${bonus.ritualId}`,
        name: `${bonus.source} (${parts.join(', ')})`,
        source: 'ritual' as const,
        attackBonus: bonus.attackModifier,
        damageBonus,
        isPassive: true as const,
        description: `Bônus de ritual sustentado: ${parts.join(', ')}`,
      };
    });
  }, [summary.bonuses]);
}
