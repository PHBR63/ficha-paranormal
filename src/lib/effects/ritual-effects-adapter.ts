// =====================================================
// Adaptador de Efeitos de Ritual
// Ordem Paranormal RPG v1.3
// =====================================================
//
// Converte rituais sustentados para o formato UnifiedEffect
// Integra com o sistema existente em ritual-effects-engine.ts
//

import type { UnifiedEffect, EffectMechanics, DamageType } from '../unified-effects-engine';
import { getRitualById } from '../rituals/ritual-registry';
import type { RitualMechanics, UnifiedRitual } from '../rituals/types';

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
 * Usa os nomes de propriedade corretos da interface RitualMechanics
 */
function convertRitualMechanicsToEffects(
  ritual: UnifiedRitual | undefined,
  mechanics: RitualMechanics | undefined,
  ritualName: string
): EffectMechanics {
  const effects: EffectMechanics = {};
  
  if (!mechanics) return effects;
  
  // === Modificadores de Combate (propriedades diretas) ===
  if (mechanics.attackBonus) {
    effects.attackBonus = mechanics.attackBonus;
  }
  if (mechanics.damageBonus) {
    if (typeof mechanics.damageBonus === 'number') {
      effects.damageBonus = mechanics.damageBonus;
    }
  }
  if (mechanics.defenseBonus) {
    effects.defenseBonus = mechanics.defenseBonus;
  }
  
  // === Redução de Dano (DamageReductionConfig tem types[] e amount) ===
  if (mechanics.damageReduction) {
    const dr = mechanics.damageReduction;
    effects.damageReduction = dr.amount;
    // Se tem tipos específicos, adiciona ao byType também
    if (dr.types && dr.types.length > 0) {
      if (!effects.damageReductionByType) effects.damageReductionByType = {};
      for (const dtype of dr.types) {
        effects.damageReductionByType[dtype as DamageType] = dr.amount;
      }
    }
  }
  
  // === Bônus de Perícia (SkillBonusConfig tem skills[] e bonus) ===
  if (mechanics.skillBonus) {
    const sb = mechanics.skillBonus;
    if (sb.skills && typeof sb.bonus === 'number') {
      effects.skillBonus = {};
      for (const skill of sb.skills) {
        effects.skillBonus[skill] = sb.bonus;
      }
    }
  }
  
  // === PV Temporários (TempHPFormula extends DiceFormula com diceCount, diceType, bonus) ===
  if (mechanics.tempHP) {
    const thp = mechanics.tempHP;
    // Calcula valor médio dos dados
    if (thp.diceCount && thp.diceType) {
      const avgRoll = Math.floor(thp.diceCount * (thp.diceType / 2 + 0.5)) + (thp.bonus || 0);
      effects.tempHP = avgRoll;
    }
  }
  
  // === Efeitos de Arma (weaponEffect) ===
  if (mechanics.weaponEffect) {
    const we = mechanics.weaponEffect;
    if (!effects.specialEffects) effects.specialEffects = [];
    
    if (we.damageBonus && typeof we.damageBonus === 'number') {
      effects.damageBonus = (effects.damageBonus || 0) + we.damageBonus;
    }
    if (we.attackBonus) {
      effects.attackBonus = (effects.attackBonus || 0) + we.attackBonus;
    }
    if (we.damageType) {
      effects.specialEffects.push(`Dano se torna ${we.damageType}`);
    }
    if (we.extraDice) {
      effects.extraDamageDice = `${we.extraDice.diceCount}d${we.extraDice.diceType}`;
    }
    if (we.criticalBonus) {
      effects.criticalMarginBonus = we.criticalBonus;
    }
  }
  
  // === Condições aplicadas (para efeitos especiais) ===
  if (mechanics.conditions) {
    if (!effects.specialEffects) effects.specialEffects = [];
    for (const cond of mechanics.conditions) {
      effects.specialEffects.push(`Aplica ${cond.id} ao alvo`);
    }
  }
  
  // === Efeitos de Área (areaEffect) ===
  if (mechanics.areaEffect) {
    if (!effects.specialEffects) effects.specialEffects = [];
    const area = mechanics.areaEffect;
    const size = area.radius || area.length || 0;
    effects.specialEffects.push(`Área: ${area.shape} ${size}m`);
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
 * Obtém mecânicas de um ritual pelo ID
 */
function getRitualMechanics(ritual: UnifiedRitual | undefined): RitualMechanics | undefined {
  if (!ritual) return undefined;
  
  // Retorna mecânicas base via effects.base
  return ritual.effects?.base;
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
    const mechanics = getRitualMechanics(ritual);
    
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
