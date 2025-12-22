// =====================================================
// Adaptador de Efeitos de Trilha
// Ordem Paranormal RPG v1.3
// =====================================================
//
// Converte habilidades de trilha para o formato UnifiedEffect
// Integra com o sistema existente em track-effects-engine.ts
//

import type { UnifiedEffect, EffectMechanics, AttributeType } from '../unified-effects-engine';
import { getTrackById, getUnlockedAbilities } from '../class-powers/track-registry';
import type { UnifiedTrackAbility } from '../class-powers/track-types';

/**
 * Converte uma habilidade de trilha para EffectMechanics
 */
function convertTrackAbilityToMechanics(
  ability: UnifiedTrackAbility,
  attributes: Record<AttributeType, number>,
  nex: number
): EffectMechanics {
  const mechanics: EffectMechanics = {};
  const m = ability.mechanics;
  
  if (!m) return mechanics;
  
  // === Bônus de Combate ===
  if (m.attackBonus) {
    if (m.contextCondition?.meleeOnly) {
      mechanics.meleeAttackBonus = m.attackBonus;
    } else if (m.contextCondition?.rangedOnly) {
      mechanics.rangedAttackBonus = m.attackBonus;
    } else {
      mechanics.attackBonus = m.attackBonus;
    }
  }
  
  if (m.damageBonus) {
    if (m.contextCondition?.meleeOnly) {
      mechanics.meleeDamageBonus = m.damageBonus;
    } else if (m.contextCondition?.rangedOnly) {
      mechanics.rangedDamageBonus = m.damageBonus;
    } else {
      mechanics.damageBonus = m.damageBonus;
    }
  }
  
  // === Dados extras de dano ===
  if (m.extraDamageDice) {
    mechanics.extraDamageDice = m.extraDamageDice;
  }
  
  // === Crítico ===
  if (m.criticalMarginBonus) {
    mechanics.criticalMarginBonus = m.criticalMarginBonus;
  }
  if (m.criticalMultiplierBonus) {
    mechanics.criticalMultiplierBonus = m.criticalMultiplierBonus;
  }
  
  // === Defesa ===
  if (m.defenseBonus) {
    mechanics.defenseBonus = m.defenseBonus;
  }
  
  // === Resistências ===
  if (m.fortitudeBonus) {
    mechanics.fortitudeBonus = m.fortitudeBonus;
  }
  if (m.reflexosBonus) {
    mechanics.reflexosBonus = m.reflexosBonus;
  }
  if (m.vontadeBonus) {
    mechanics.vontadeBonus = m.vontadeBonus;
  }
  
  // === Redução de Dano ===
  if (m.damageResistance) {
    mechanics.damageReduction = m.damageResistance;
  }
  if (m.mentalDamageResistance) {
    mechanics.paranormalDamageReduction = m.mentalDamageResistance;
  }
  
  // === Recursos ===
  if (m.hpBonus) {
    mechanics.hpBonus = m.hpBonus;
  }
  if (m.peBonus) {
    mechanics.peBonus = m.peBonus;
  }
  if (m.tempHP) {
    mechanics.tempHP = m.tempHP;
  }
  
  // === Movimento ===
  if (m.movementBonus) {
    mechanics.movementBonus = m.movementBonus;
  }
  
  // === Iniciativa ===
  if (m.initiativeBonus) {
    mechanics.initiativeBonus = m.initiativeBonus;
  }
  
  // === Perícias ===
  if (m.skillBonuses) {
    mechanics.skillBonus = m.skillBonuses;
  }
  
  // === Proficiências ===
  if (m.grantsProficiency) {
    mechanics.grantsProficiency = m.grantsProficiency;
  }
  
  // === Efeitos Especiais ===
  if (ability.description) {
    if (!mechanics.specialEffects) mechanics.specialEffects = [];
    // Extrai efeitos especiais da descrição se não forem numéricos
    if (!m.attackBonus && !m.damageBonus && !m.defenseBonus) {
      mechanics.specialEffects.push(ability.description);
    }
  }
  
  // === Flags especiais ===
  if (m.canUseHPAsPE) {
    if (!mechanics.specialEffects) mechanics.specialEffects = [];
    mechanics.specialEffects.push('Pode usar PV como PE para rituais');
  }
  if (m.canUseOccultismAsAttack) {
    if (!mechanics.specialEffects) mechanics.specialEffects = [];
    mechanics.specialEffects.push('Pode usar Ocultismo em ataques corpo a corpo');
  }
  
  return mechanics;
}

/**
 * Converte habilidades de trilha de um personagem para UnifiedEffect[]
 * 
 * @param trackId - ID da trilha ativa
 * @param nex - NEX do personagem
 * @param attributes - Atributos do personagem
 * @param activatedEffects - IDs de efeitos ativados manualmente
 * @returns Array de efeitos unificados
 */
export function getTrackEffects(
  trackId: string | null | undefined,
  nex: number,
  attributes: Record<AttributeType, number>,
  activatedEffects: string[] = []
): UnifiedEffect[] {
  const effects: UnifiedEffect[] = [];
  
  if (!trackId) return effects;
  
  const track = getTrackById(trackId);
  if (!track) return effects;
  
  const unlockedAbilities = getUnlockedAbilities(trackId, nex);
  
  for (const ability of unlockedAbilities) {
    const mechanics = convertTrackAbilityToMechanics(ability, attributes, nex);
    
    // Verifica se a habilidade tem mecânicas relevantes
    const hasMechanics = Object.keys(mechanics).length > 0;
    if (!hasMechanics) continue;
    
    // Verifica se é uma habilidade que requer ativação
    const requiresActivation = ability.mechanics?.requiresActivation ?? false;
    const costPE = ability.mechanics?.peCost;
    
    const effect: UnifiedEffect = {
      id: `track-${ability.id}`,
      name: ability.name,
      description: ability.description,
      source: 'track',
      sourceId: ability.id,
      sourceName: `Trilha ${track.name}: ${ability.name}`,
      mechanics,
      isActive: requiresActivation 
        ? activatedEffects.includes(`track-${ability.id}`)
        : true,
      isToggleable: requiresActivation,
      conditions: requiresActivation ? {
        requiresActivation: true,
        costPE,
      } : undefined,
      priority: ability.minNex, // Maior NEX = maior prioridade
    };
    
    effects.push(effect);
  }
  
  return effects;
}

/**
 * Obtém efeitos de trilha para uma situação específica de combate
 * Filtra baseado no contexto (melee vs ranged)
 */
export function getTrackCombatEffects(
  trackId: string | null | undefined,
  nex: number,
  attributes: Record<AttributeType, number>,
  attackType: 'melee' | 'ranged',
  activatedEffects: string[] = []
): UnifiedEffect[] {
  const allEffects = getTrackEffects(trackId, nex, attributes, activatedEffects);
  
  // Filtra efeitos que não se aplicam ao contexto
  return allEffects.filter(effect => {
    // Se não tem condição de contexto, sempre se aplica
    if (!effect.conditions) return true;
    
    // Verifica se o tipo de ataque corresponde
    if (effect.conditions.attackType) {
      if (effect.conditions.attackType !== 'any' && effect.conditions.attackType !== attackType) {
        return false;
      }
    }
    
    return true;
  });
}

/**
 * Lista todas as habilidades de trilha disponíveis
 * Útil para debug e documentação
 */
export function listAllTrackAbilities(trackId: string): Array<{
  id: string;
  name: string;
  minNex: number;
  hasMechanics: boolean;
  description: string;
}> {
  const track = getTrackById(trackId);
  if (!track) return [];
  
  return track.abilities.map(ability => ({
    id: ability.id,
    name: ability.name,
    minNex: ability.minNex,
    hasMechanics: !!ability.mechanics && Object.keys(ability.mechanics).length > 0,
    description: ability.description,
  }));
}

/**
 * Obtém resumo de bônus de trilha para display
 */
export function getTrackBonusSummary(
  trackId: string | null | undefined,
  nex: number,
  attributes: Record<AttributeType, number>
): {
  trackName: string;
  totalAttack: number;
  totalDamage: number;
  totalDefense: number;
  totalInitiative: number;
  totalCriticalMargin: number;
  specialAbilities: string[];
} {
  const summary = {
    trackName: '',
    totalAttack: 0,
    totalDamage: 0,
    totalDefense: 0,
    totalInitiative: 0,
    totalCriticalMargin: 0,
    specialAbilities: [] as string[],
  };
  
  if (!trackId) return summary;
  
  const track = getTrackById(trackId);
  if (!track) return summary;
  
  summary.trackName = track.name;
  
  const effects = getTrackEffects(trackId, nex, attributes);
  
  for (const effect of effects) {
    if (!effect.isActive) continue;
    const m = effect.mechanics;
    
    summary.totalAttack += (m.attackBonus || 0) + (m.meleeAttackBonus || 0) + (m.rangedAttackBonus || 0);
    summary.totalDamage += (m.damageBonus || 0) + (m.meleeDamageBonus || 0) + (m.rangedDamageBonus || 0);
    summary.totalDefense += m.defenseBonus || 0;
    summary.totalInitiative += m.initiativeBonus || 0;
    summary.totalCriticalMargin += m.criticalMarginBonus || 0;
    
    if (m.specialEffects) {
      summary.specialAbilities.push(...m.specialEffects);
    }
  }
  
  return summary;
}
