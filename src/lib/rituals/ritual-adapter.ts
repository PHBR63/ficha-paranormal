/**
 * Adaptador de compatibilidade entre o sistema antigo (rituals-data.ts)
 * e o novo sistema unificado (unified-rituals.ts)
 * 
 * Este arquivo provê funções para converter entre os formatos e
 * manter compatibilidade durante a migração gradual.
 */

import type { UnifiedRitual, RitualMechanics, RitualDamage, RitualHealing, RitualResistance } from './types';
import type { Ritual as LegacyRitual, RitualEnhancement as LegacyEnhancement, RitualEffect as LegacyRitualEffect } from './legacy-exports';
import { getRitualById, getEffectiveLevel, getRitualEffect } from './ritual-registry';

// ========================================
// TYPE GUARDS para tipos union
// ========================================

function isRitualDamage(value: unknown): value is RitualDamage {
  return typeof value === 'object' && value !== null && 'diceCount' in value && 'diceType' in value;
}

function isRitualHealing(value: unknown): value is RitualHealing {
  return typeof value === 'object' && value !== null && 'diceCount' in value && 'diceType' in value;
}

function isRitualResistance(value: unknown): value is RitualResistance {
  return typeof value === 'object' && value !== null && 'type' in value;
}

// ========================================
// CONVERSÃO: UnifiedRitual -> Ritual (legado)
// ========================================

/**
 * Converte um UnifiedRitual para o formato legado Ritual
 * Útil para componentes que ainda usam o tipo antigo
 */
export function unifiedToLegacy(unified: UnifiedRitual): LegacyRitual {
  // Processa resistance - pode ser string ou objeto
  let resistanceStr: string | undefined;
  if (unified.resistance) {
    if (isRitualResistance(unified.resistance)) {
      resistanceStr = `${unified.resistance.type.charAt(0).toUpperCase()}${unified.resistance.type.slice(1)}`;
    } else if (typeof unified.resistance === 'string') {
      resistanceStr = unified.resistance;
    }
  }

  return {
    id: unified.id,
    name: unified.name,
    circle: unified.circle,
    element: unified.element as any,
    execution: unified.execution,
    range: unified.range,
    target: unified.target,
    area: unified.area,
    duration: unified.duration,
    resistance: resistanceStr,
    description: unified.description,
    cost: unified.cost,
    enhancements: unified.enhancements?.map(enh => ({
      name: enh.name,
      cost: enh.cost,
      description: enh.description,
      requirements: enh.circleReq 
        ? `Requer ${enh.circleReq}º círculo${enh.affinityReq ? ' e afinidade' : ''}` 
        : enh.affinityReq ? 'Requer afinidade' : undefined,
    })),
  };
}

/**
 * Converte array de UnifiedRituals para formato legado
 */
export function unifiedArrayToLegacy(rituals: UnifiedRitual[]): LegacyRitual[] {
  return rituals.map(unifiedToLegacy);
}

// ========================================
// CONVERSÃO: RitualMechanics -> RitualEffect (legado)
// ========================================

/**
 * Converte RitualMechanics do sistema unificado para RitualEffect legado
 */
export function mechanicsToLegacyEffect(mechanics: RitualMechanics): LegacyRitualEffect {
  const effect: LegacyRitualEffect = {
    kind: mechanics.kind,
  };

  // Dano - pode ser string ou objeto
  if (mechanics.damage) {
    if (isRitualDamage(mechanics.damage)) {
      effect.damage = {
        diceCount: mechanics.damage.diceCount,
        diceType: mechanics.damage.diceType,
        diceMultiplier: mechanics.damage.diceMultiplier,
        bonus: mechanics.damage.bonus,
        damageType: mechanics.damage.damageType as any,
      };
    }
    // Se for string, não convertermos (formato legado não suporta string direta)
  }

  // Cura - pode ser string ou objeto
  if (mechanics.healing) {
    if (isRitualHealing(mechanics.healing)) {
      effect.healing = {
        diceCount: mechanics.healing.diceCount,
        diceType: mechanics.healing.diceType,
        bonus: mechanics.healing.bonus,
      };
    }
  }

  // PV temporários
  if (mechanics.tempHP) {
    effect.tempHP = {
      diceCount: mechanics.tempHP.diceCount,
      diceType: mechanics.tempHP.diceType,
      bonus: mechanics.tempHP.bonus,
    };
  }

  // Modificadores
  if (mechanics.defenseBonus !== undefined) effect.defenseModifier = mechanics.defenseBonus;
  if (mechanics.attackBonus !== undefined) effect.attackModifier = mechanics.attackBonus;
  if (mechanics.damageBonus !== undefined) {
    effect.damageModifier = typeof mechanics.damageBonus === 'number' 
      ? mechanics.damageBonus 
      : 0;
  }

  // Efeito de arma
  if (mechanics.weaponEffect) {
    effect.weaponEffect = {
      damageType: mechanics.weaponEffect.damageType as any,
      special: mechanics.weaponEffect.special,
    };
    
    // Parseia damageBonus se for string de dado
    if (mechanics.weaponEffect.damageBonus && typeof mechanics.weaponEffect.damageBonus === 'string') {
      const diceMatch = mechanics.weaponEffect.damageBonus.match(/(\d+)d(\d+)/);
      if (diceMatch) {
        effect.weaponEffect.extraDice = {
          count: parseInt(diceMatch[1]),
          type: parseInt(diceMatch[2]),
        };
      }
    }
    
    if (mechanics.weaponEffect.attackBonus) {
      effect.weaponEffect.attackBonus = mechanics.weaponEffect.attackBonus;
    }
    if (mechanics.weaponEffect.criticalBonus) {
      effect.weaponEffect.criticalBonus = mechanics.weaponEffect.criticalBonus;
    }
    if (mechanics.weaponEffect.criticalMultiplierBonus) {
      effect.weaponEffect.criticalMultiplierBonus = mechanics.weaponEffect.criticalMultiplierBonus;
    }
  }

  // Redução de dano
  if (mechanics.damageReduction) {
    effect.damageReduction = {
      types: mechanics.damageReduction.types as any[] || [],
      amount: mechanics.damageReduction.amount,
    };
  }

  // Resistência
  if (mechanics.resistance && isRitualResistance(mechanics.resistance)) {
    effect.resistance = {
      type: mechanics.resistance.type,
      effect: mechanics.resistance.effect,
      dt: mechanics.resistance.dt,
    };
  }

  // Área
  if (mechanics.areaEffect) {
    effect.areaEffect = {
      shape: mechanics.areaEffect.shape as any,
      radius: mechanics.areaEffect.radius,
      length: mechanics.areaEffect.length,
    };
  }

  // Condições
  if (mechanics.conditions && mechanics.conditions.length > 0) {
    effect.appliesConditions = mechanics.conditions.map(c => ({
      id: c.id,
      conditionId: c.id,
      duration: c.duration as any,
    }));
  }

  // Sustentação
  if (mechanics.sustain) {
    effect.sustain = {
      action: mechanics.sustain.action as any,
      concentration: mechanics.sustain.concentration,
      costPerTurn: mechanics.sustain.costPerTurn,
      maxDuration: mechanics.sustain.maxDuration,
    };
  }

  // Bônus de perícia
  if (mechanics.skillBonus) {
    effect.skillModifier = {
      skills: mechanics.skillBonus.skills,
      bonus: typeof mechanics.skillBonus.bonus === 'number' 
        ? mechanics.skillBonus.bonus 
        : 0,
      context: mechanics.skillBonus.context,
    };
  }

  // Restrições de ação
  if (mechanics.actionRestrictions) {
    effect.actionRestrictions = mechanics.actionRestrictions as any[];
  }

  return effect;
}

// ========================================
// FUNÇÃO PRINCIPAL DE EFEITOS
// ========================================

/**
 * Retorna o efeito ativo de um ritual baseado nos aprimoramentos selecionados
 * Compatível com o formato legado RitualEffect
 * 
 * SUBSTITUI: getActiveRitualEffect de ritual-effects.ts
 */
export function getActiveRitualEffectUnified(
  ritualId: string,
  selectedEnhancements: string[] = []
): LegacyRitualEffect | undefined {
  const level = getEffectiveLevel(selectedEnhancements);
  const mechanics = getRitualEffect(ritualId, level);
  
  if (!mechanics) {
    // Fallback para efeito base se não encontrar
    const baseMechanics = getRitualEffect(ritualId, 'base');
    return baseMechanics ? mechanicsToLegacyEffect(baseMechanics) : undefined;
  }
  
  return mechanicsToLegacyEffect(mechanics);
}

// ========================================
// RE-EXPORTS PARA FACILITAR MIGRAÇÃO
// ========================================

export { 
  getRitualById,
  getRitualsByCircle,
  getRitualsByElement,
  getRitualsByMaxCircle,
  searchRituals,
  getAllRituals,
  getRitualEffect,
  getRitualModes,
  getRitualHooks,
  canCastRitual,
  canUseEnhancement,
  calculateRitualCost,
  getEffectiveLevel,
} from './ritual-registry';

export type { UnifiedRitual, RitualMechanics } from './types';
