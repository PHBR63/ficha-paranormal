/**
 * useRitualCombatBonuses - Hook para extrair bônus de combate de rituais sustentados
 * Processa automaticamente attackModifier, damageModifier, weaponEffect de rituais ativos
 */

import { useMemo } from 'react';
import { getActiveRitualEffect, RitualEffect } from '@/lib/ritual-effects';

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
 * Hook principal para extrair bônus de combate de rituais sustentados
 * @param sustainedRituals Lista de rituais sustentados ativos
 * @returns Resumo consolidado de bônus de combate
 */
// Função auxiliar para determinar nível baseado nos enhancements
function getEffectLevel(selectedEnhancements: string[]): 'base' | 'discente' | 'verdadeiro' {
  if (selectedEnhancements.includes('Verdadeiro')) return 'verdadeiro';
  if (selectedEnhancements.includes('Discente')) return 'discente';
  return 'base';
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
      // Usa selectedEnhancements do ritual
      const effect = getActiveRitualEffect(ritual.ritualId, ritual.selectedEnhancements || []);
      if (!effect) continue;
      
      const level = getEffectLevel(ritual.selectedEnhancements || []);
      
      const bonus: RitualCombatBonus = {
        source: ritual.ritualName || formatRitualName(ritual.ritualId),
        ritualId: ritual.ritualId,
        level,
      };
      
      // Extrai modificadores numéricos
      if (effect.attackModifier) {
        bonus.attackModifier = effect.attackModifier;
      }
      
      if (effect.damageModifier) {
        bonus.damageModifier = effect.damageModifier;
      }
      
      if (effect.defenseModifier) {
        bonus.defenseModifier = effect.defenseModifier;
      }
      
      // Extrai weaponEffect
      if (effect.weaponEffect) {
        bonus.weaponEffect = {
          damageType: effect.weaponEffect.damageType,
          extraDice: effect.weaponEffect.extraDice,
          damageBonus: effect.weaponEffect.damageBonus,
          special: effect.weaponEffect.special,
        };
      }
      
      // Extrai tempHP
      if (effect.tempHP) {
        // Se tempHP tem bonus fixo, usa direto
        // Se tem dados, calcula o máximo esperado
        if (effect.tempHP.bonus && effect.tempHP.diceCount === 0) {
          bonus.tempHP = effect.tempHP.bonus;
        } else if (effect.tempHP.diceCount && effect.tempHP.diceType) {
          // Para UI, mostra o valor médio esperado
          const avgDice = (effect.tempHP.diceCount * (effect.tempHP.diceType + 1)) / 2;
          bonus.tempHP = Math.floor(avgDice + (effect.tempHP.bonus || 0));
        }
      }
      
      // Extrai damageReduction
      if (effect.damageReduction) {
        bonus.damageReduction = {
          types: effect.damageReduction.types,
          amount: effect.damageReduction.amount,
        };
      }
      
      // Só adiciona se tem algum efeito de combate
      if (bonus.attackModifier || bonus.damageModifier || bonus.defenseModifier ||
          bonus.weaponEffect || bonus.tempHP || bonus.damageReduction) {
        bonuses.push(bonus);
      }
    }
    
    // Consolida totais
    const totalAttackBonus = bonuses.reduce((sum, b) => sum + (b.attackModifier || 0), 0);
    const totalDamageBonus = bonuses.reduce((sum, b) => sum + (b.damageModifier || 0), 0);
    const totalDefenseBonus = bonuses.reduce((sum, b) => sum + (b.defenseModifier || 0), 0);
    const totalTempHP = bonuses.reduce((sum, b) => sum + (b.tempHP || 0), 0);
    
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
      // weaponEffect com extraDice será processado separadamente no CombatRollModal
      
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
