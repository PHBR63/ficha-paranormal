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
import type { UnifiedTrackAbility, TrackAbilityMechanics } from '../class-powers/track-types';

/**
 * Converte uma habilidade de trilha para EffectMechanics
 * Usa effects.base ao invés de mechanics conforme a interface UnifiedTrackAbility
 * 
 * Suporta:
 * - Bônus de dano fixo e por atributo (ex: Mira de Elite usa Intelecto)
 * - Ataque Furtivo escalonado por NEX
 * - Bônus de crítico, iniciativa, perícias, etc.
 */
function convertTrackAbilityToMechanics(
  ability: UnifiedTrackAbility,
  attributes: Record<AttributeType, number>,
  nex: number
): EffectMechanics {
  const mechanics: EffectMechanics = {};
  const m = ability.effects?.base;
  
  if (!m) return mechanics;
  
  // === Bônus de Dano (com suporte a atributo) ===
  if (m.damageBonus) {
    const dmgBonus = m.damageBonus;
    
    // Se o bônus usa um atributo, calcula o valor baseado no atributo
    if (dmgBonus.attribute) {
      const attrValue = attributes[dmgBonus.attribute as AttributeType] || 0;
      
      // Aplica condicionalmente baseado no tipo de arma
      if (dmgBonus.conditions?.weaponType === 'firearm-long') {
        // Mira de Elite: +INT em dano com armas de fogo longas
        mechanics.rangedDamageBonus = attrValue;
        mechanics.conditionalNote = 'Apenas armas de fogo com balas longas';
      } else if (dmgBonus.conditions?.weaponType === 'melee') {
        mechanics.meleeDamageBonus = attrValue;
      } else if (dmgBonus.conditions?.weaponType === 'ranged') {
        mechanics.rangedDamageBonus = attrValue;
      } else {
        mechanics.damageBonus = attrValue;
      }
    }
    // Bônus fixo de dano
    else if (dmgBonus.value) {
      if (dmgBonus.conditions?.weaponType === 'melee') {
        mechanics.meleeDamageBonus = dmgBonus.value;
      } else if (dmgBonus.conditions?.weaponType === 'ranged') {
        mechanics.rangedDamageBonus = dmgBonus.value;
      } else {
        mechanics.damageBonus = dmgBonus.value;
      }
    }
    
    // Dados extras de dano
    if (dmgBonus.extraDice) {
      mechanics.extraDamageDice = `${dmgBonus.extraDice.count}${dmgBonus.extraDice.dieType || 'd6'}`;
    }
  }
  
  // === Ataque Furtivo Escalonado (Infiltrador) ===
  if (m.sneakAttack?.scaling) {
    const scaling = m.sneakAttack.scaling;
    
    // Encontra o tier de NEX aplicável (maior NEX <= nex atual)
    const applicableTiers = Object.keys(scaling)
      .map(Number)
      .filter(n => n <= nex)
      .sort((a, b) => b - a);
    
    if (applicableTiers.length > 0) {
      const tier = applicableTiers[0];
      const diceData = scaling[tier];
      
      if (diceData) {
        mechanics.extraDamageDice = `${diceData.dice}${diceData.dieType || 'd6'}`;
        mechanics.conditionalNote = 'Ataque Furtivo: alvo desprevenido, flanqueado ou corpo a corpo com arma leve';
      }
    }
  }
  
  // === Bônus de Crítico ===
  if (m.criticalBonus) {
    if (m.criticalBonus.marginBonus) {
      mechanics.criticalMarginBonus = m.criticalBonus.marginBonus;
    }
    if (m.criticalBonus.multiplierBonus) {
      mechanics.criticalMultiplierBonus = m.criticalBonus.multiplierBonus;
    }
  }
  
  // === Iniciativa ===
  if (m.initiativeBonus) {
    mechanics.initiativeBonus = m.initiativeBonus;
  }
  
  // === PV adicional por NEX ===
  if (m.hpPerNexPercent) {
    const bonus = m.hpPerNexPercent * Math.floor(nex / 5);
    mechanics.hpBonus = bonus;
  }
  
  // === Resistência Paranormal ===
  if (m.paranormalResistance) {
    mechanics.paranormalDamageReduction = m.paranormalResistance;
  }
  
  // === Resistência a Dano Mental ===
  if (m.mentalDamageResistance) {
    mechanics.damageResistance = { mental: m.mentalDamageResistance };
  }
  
  // === Perícias ===
  if (m.skillBonus) {
    mechanics.skillBonus = {};
    for (const skill of m.skillBonus.skills) {
      mechanics.skillBonus[skill] = m.skillBonus.bonus;
    }
  }
  
  // === Proficiências ===
  if (m.proficiencies) {
    mechanics.grantsProficiency = m.proficiencies;
  }
  
  // === Flags especiais ===
  if (m.hpAsPE) {
    if (!mechanics.specialEffects) mechanics.specialEffects = [];
    mechanics.specialEffects.push('Pode usar PV como PE para rituais');
  }
  if (m.occultismAsAttack) {
    if (!mechanics.specialEffects) mechanics.specialEffects = [];
    mechanics.specialEffects.push('Pode usar Ocultismo em ataques corpo a corpo');
  }
  
  // === Dano Máximo em Crítico (Atirar para Matar) ===
  if (m.maximumDamageOnCritical) {
    if (!mechanics.specialEffects) mechanics.specialEffects = [];
    mechanics.specialEffects.push('Crítico com arma de fogo causa dano máximo');
    mechanics.maximumDamageOnCrit = true;
  }
  
  // === Redução de Dano ===
  if (m.damageReduction) {
    if (m.damageReduction.type === 'fixed' && m.damageReduction.fixedAmount) {
      mechanics.damageReduction = m.damageReduction.fixedAmount;
    }
  }
  
  // === Descrição como efeito especial se não há mecânicas numéricas ===
  const hasNumericMechanics = 
    mechanics.attackBonus || mechanics.damageBonus || mechanics.defenseBonus ||
    mechanics.meleeDamageBonus || mechanics.rangedDamageBonus ||
    mechanics.criticalMarginBonus || mechanics.initiativeBonus ||
    mechanics.hpBonus || mechanics.damageReduction || mechanics.extraDamageDice;
    
  if (!hasNumericMechanics && ability.description) {
    if (!mechanics.specialEffects) mechanics.specialEffects = [];
    mechanics.specialEffects.push(ability.description);
  }
  
  return mechanics;
}

/**
 * Verifica se a habilidade requer ativação manual
 */
function requiresActivation(m: TrackAbilityMechanics | undefined): boolean {
  if (!m) return false;
  return m.kind === 'activated' || m.kind === 'reaction';
}

/**
 * Obtém custo de PE da habilidade
 */
function getAbilityPECost(m: TrackAbilityMechanics | undefined): number | undefined {
  if (!m?.activation) return undefined;
  return m.activation.cost;
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
    const needsActivation = requiresActivation(ability.effects?.base);
    const costPE = getAbilityPECost(ability.effects?.base);
    
    const effect: UnifiedEffect = {
      id: `track-${ability.id}`,
      name: ability.name,
      description: ability.description,
      source: 'track',
      sourceId: ability.id,
      sourceName: `Trilha ${track.name}: ${ability.name}`,
      mechanics,
      isActive: needsActivation 
        ? activatedEffects.includes(`track-${ability.id}`)
        : true,
      isToggleable: needsActivation,
      conditions: needsActivation ? {
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
    hasMechanics: !!ability.effects?.base && Object.keys(ability.effects.base).length > 0,
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
