// =====================================================
// Adaptador de Efeitos de Ritual
// Ordem Paranormal RPG v1.3
// =====================================================
//
// Converte rituais sustentados para o formato UnifiedEffect
// Integra com o sistema existente em ritual-effects-engine.ts
//

import type { UnifiedEffect, EffectMechanics, DamageType } from '../unified-effects-engine';
import { getRitualById, getRitualEffect } from '../rituals/ritual-registry';
import type { RitualMechanics } from '../rituals/types';

/**
 * Interface para ritual sustentado (input)
 */
export interface SustainedRitualInput {
  ritualId: string;
  ritualName: string;
  element: string;
  circle: number;
  selectedEnhancements?: string[];
  turnsActive?: number;
  isConcentrating?: boolean;
}

/**
 * Converte mecânicas de ritual para EffectMechanics unificado
 */
function convertRitualMechanicsToEffects(
  ritual: ReturnType<typeof getRitualById>,
  mechanics: RitualMechanics | undefined,
  ritualName: string
): EffectMechanics {
  const effects: EffectMechanics = {};
  
  if (!mechanics) return effects;
  
  // === Modificadores de Combate ===
  if (mechanics.combatModifiers) {
    const cm = mechanics.combatModifiers;
    
    if (cm.attackBonus) {
      effects.attackBonus = cm.attackBonus;
    }
    if (cm.damageBonus) {
      effects.damageBonus = cm.damageBonus;
    }
    if (cm.defenseBonus) {
      effects.defenseBonus = cm.defenseBonus;
    }
    if (cm.criticalBonus) {
      effects.criticalMarginBonus = cm.criticalBonus;
    }
  }
  
  // === Redução de Dano ===
  if (mechanics.damageReduction) {
    for (const dr of mechanics.damageReduction) {
      if (dr.type === 'all' || !dr.type) {
        effects.damageReduction = (effects.damageReduction || 0) + dr.value;
      } else {
        if (!effects.damageReductionByType) effects.damageReductionByType = {};
        effects.damageReductionByType[dr.type as DamageType] = 
          (effects.damageReductionByType[dr.type as DamageType] || 0) + dr.value;
      }
    }
  }
  
  // === Bônus de Perícia ===
  if (mechanics.skillBonuses) {
    effects.skillBonus = {};
    for (const sb of mechanics.skillBonuses) {
      effects.skillBonus[sb.skill] = (effects.skillBonus[sb.skill] || 0) + sb.bonus;
    }
  }
  
  // === PV Temporários ===
  if (mechanics.tempHP) {
    // Calcula valor se for fórmula de dado
    if (mechanics.tempHP.formula) {
      // Aqui assumimos um valor médio para display
      const match = mechanics.tempHP.formula.match(/(\d+)d(\d+)(?:\+(\d+))?/);
      if (match) {
        const count = parseInt(match[1]);
        const sides = parseInt(match[2]);
        const bonus = parseInt(match[3] || '0');
        effects.tempHP = Math.floor(count * (sides / 2 + 0.5)) + bonus;
      }
    } else if (typeof mechanics.tempHP.value === 'number') {
      effects.tempHP = mechanics.tempHP.value;
    }
  }
  
  // === Efeitos de Arma ===
  if (mechanics.weaponEffects) {
    if (!effects.specialEffects) effects.specialEffects = [];
    for (const we of mechanics.weaponEffects) {
      if (we.damageBonus) {
        effects.damageBonus = (effects.damageBonus || 0) + we.damageBonus;
      }
      if (we.attackBonus) {
        effects.attackBonus = (effects.attackBonus || 0) + we.attackBonus;
      }
      if (we.damageType) {
        effects.specialEffects.push(`Dano se torna ${we.damageType}`);
      }
      if (we.extraDice) {
        effects.extraDamageDice = we.extraDice;
      }
    }
  }
  
  // === Condições aplicadas (para efeitos especiais) ===
  if (mechanics.conditions) {
    if (!effects.specialEffects) effects.specialEffects = [];
    for (const cond of mechanics.conditions) {
      effects.specialEffects.push(`Aplica ${cond.id} ao alvo`);
    }
  }
  
  // === Efeitos de Área ===
  if (mechanics.area) {
    if (!effects.specialEffects) effects.specialEffects = [];
    effects.specialEffects.push(`Área: ${mechanics.area.type} ${mechanics.area.size}m`);
  }
  
  // === Movimento ===
  if (mechanics.movementBonus) {
    effects.movementBonus = mechanics.movementBonus;
  }
  
  // === Ação Extra (ex: Velocidade Mortal) ===
  if (ritual?.name?.toLowerCase().includes('velocidade')) {
    effects.extraAction = 'movement';
    if (!effects.specialEffects) effects.specialEffects = [];
    effects.specialEffects.push('Ação de movimento adicional por turno');
  }
  
  return effects;
}

/**
 * Converte rituais sustentados de um personagem para UnifiedEffect[]
 * 
 * @param sustainedRituals - Array de rituais sustentados
 * @returns Array de efeitos unificados
 */
export function getRitualEffects(
  sustainedRituals: SustainedRitualInput[]
): UnifiedEffect[] {
  const effects: UnifiedEffect[] = [];
  
  for (const sustained of sustainedRituals) {
    const ritual = getRitualById(sustained.ritualId);
    if (!ritual) continue;
    
    // Obtém mecânicas do ritual
    const mechanics = getRitualEffect(sustained.ritualId, sustained.selectedEnhancements || []);
    
    // Converte para formato unificado
    const effectMechanics = convertRitualMechanicsToEffects(
      ritual, 
      mechanics, 
      sustained.ritualName
    );
    
    // Verifica se tem mecânicas relevantes
    const hasMechanics = Object.keys(effectMechanics).length > 0;
    if (!hasMechanics) {
      // Ritual sem mecânicas mapeadas - cria efeito com descrição
      effectMechanics.specialEffects = [ritual.description || 'Ritual ativo'];
    }
    
    const effect: UnifiedEffect = {
      id: `ritual-${sustained.ritualId}`,
      name: sustained.ritualName,
      description: ritual.description,
      source: 'ritual',
      sourceId: sustained.ritualId,
      sourceName: `Ritual: ${sustained.ritualName}`,
      mechanics: effectMechanics,
      isActive: true,
      isToggleable: false, // Rituais sustentados são sempre ativos enquanto sustentados
      duration: {
        type: 'until_removed',
        sustainCost: sustained.circle, // PE por turno para sustentar
      },
      priority: sustained.circle * 10, // Círculos maiores = maior prioridade
    };
    
    effects.push(effect);
  }
  
  return effects;
}

/**
 * Calcula bônus totais de rituais sustentados
 * Aplica regra de não-acúmulo (maior valor prevalece)
 */
export function calculateRitualBonusTotals(
  sustainedRituals: SustainedRitualInput[]
): {
  attackBonus: number;
  damageBonus: number;
  defenseBonus: number;
  damageReduction: number;
  tempHP: number;
  skillBonuses: Record<string, number>;
  specialEffects: string[];
} {
  const totals = {
    attackBonus: 0,
    damageBonus: 0,
    defenseBonus: 0,
    damageReduction: 0,
    tempHP: 0,
    skillBonuses: {} as Record<string, number>,
    specialEffects: [] as string[],
  };
  
  const effects = getRitualEffects(sustainedRituals);
  
  for (const effect of effects) {
    const m = effect.mechanics;
    
    // Aplica regra de maior valor (não acumula)
    if (m.attackBonus) totals.attackBonus = Math.max(totals.attackBonus, m.attackBonus);
    if (m.damageBonus) totals.damageBonus = Math.max(totals.damageBonus, m.damageBonus);
    if (m.defenseBonus) totals.defenseBonus = Math.max(totals.defenseBonus, m.defenseBonus);
    if (m.damageReduction) totals.damageReduction = Math.max(totals.damageReduction, m.damageReduction);
    if (m.tempHP) totals.tempHP = Math.max(totals.tempHP, m.tempHP);
    
    // Perícias - maior valor por perícia
    if (m.skillBonus) {
      for (const [skill, bonus] of Object.entries(m.skillBonus)) {
        totals.skillBonuses[skill] = Math.max(totals.skillBonuses[skill] || 0, bonus!);
      }
    }
    
    // Efeitos especiais - acumula todos
    if (m.specialEffects) {
      totals.specialEffects.push(...m.specialEffects);
    }
  }
  
  return totals;
}

/**
 * Lista rituais que podem ser sustentados
 * Útil para UI de seleção
 */
export function getSustainableRituals(): Array<{
  id: string;
  name: string;
  circle: number;
  element: string;
  hasCombatEffects: boolean;
}> {
  // Esta função seria expandida para listar todos os rituais sustentáveis
  // Por enquanto retorna array vazio - seria populado do ritual-registry
  return [];
}

/**
 * Obtém resumo de efeitos de rituais para display
 */
export function getRitualEffectsSummary(
  sustainedRituals: SustainedRitualInput[]
): Array<{
  ritualName: string;
  element: string;
  circle: number;
  effects: string[];
  isConcentrating: boolean;
}> {
  return sustainedRituals.map(sr => {
    const ritual = getRitualById(sr.ritualId);
    const effects = getRitualEffects([sr]);
    
    const effectStrings: string[] = [];
    if (effects[0]) {
      const m = effects[0].mechanics;
      if (m.attackBonus) effectStrings.push(`+${m.attackBonus} ataque`);
      if (m.damageBonus) effectStrings.push(`+${m.damageBonus} dano`);
      if (m.defenseBonus) effectStrings.push(`+${m.defenseBonus} Defesa`);
      if (m.damageReduction) effectStrings.push(`RD ${m.damageReduction}`);
      if (m.tempHP) effectStrings.push(`+${m.tempHP} PV temp`);
      if (m.specialEffects) effectStrings.push(...m.specialEffects);
    }
    
    return {
      ritualName: sr.ritualName,
      element: sr.element,
      circle: sr.circle,
      effects: effectStrings.length > 0 ? effectStrings : ['Efeito ativo'],
      isConcentrating: sr.isConcentrating ?? false,
    };
  });
}
