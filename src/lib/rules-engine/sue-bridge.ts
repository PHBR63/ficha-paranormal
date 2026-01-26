/**
 * SUE-RulesEngine Bridge
 * Ordem Paranormal RPG v1.3
 * 
 * Converte CharacterState do Rules Engine para formato SUE
 * e retorna os efeitos consolidados para uso em deriveCharacter.
 * 
 * Este bridge é a ponte entre os dois sistemas, garantindo que
 * todos os bônus passem pela mesma pipeline com regras de stacking.
 */

import type { CharacterState, BreakdownSource } from './types';
import type { 
  ComputedEffects, 
  EffectCalculationContext,
  UnifiedEffect,
  AttributeType 
} from '../unified-effects-engine';
import { consolidateEffects } from '../unified-effects-engine';
import { getOriginEffects } from '../effects/origin-effects-adapter';
import { getConditionEffects } from '../effects/condition-effects-adapter';
import { getTrackEffects } from '../effects/track-effects-adapter';

// =====================================================
// TIPOS DO BRIDGE
// =====================================================

/**
 * Efeitos computados prontos para uso pelo Rules Engine
 * Inclui breakdowns convertidos para formato BreakdownSource
 */
export interface SUEComputedForRulesEngine {
  // === Recursos ===
  hpBonus: number;
  hpBreakdown: BreakdownSource[];
  peBonus: number;
  peBreakdown: BreakdownSource[];
  sanityBonus: number;
  sanityBreakdown: BreakdownSource[];
  peLimitBonus: number;
  peLimitBreakdown: BreakdownSource[];
  
  // === Defesa ===
  defenseBonus: number;
  defenseBreakdown: BreakdownSource[];
  
  // === Resistências ===
  fortitudeBonus: number;
  fortitudeBreakdown: BreakdownSource[];
  reflexosBonus: number;
  reflexosBreakdown: BreakdownSource[];
  vontadeBonus: number;
  vontadeBreakdown: BreakdownSource[];
  
  // === Movimento ===
  movementBonus: number;
  movementBreakdown: BreakdownSource[];
  
  // === Perícias ===
  skillBonuses: Record<string, number>;
  skillBreakdowns: Record<string, BreakdownSource[]>;
  
  // === Ataque e Dano ===
  attackBonus: number;
  meleeAttackBonus: number;
  rangedAttackBonus: number;
  attackBreakdown: BreakdownSource[];
  
  damageBonus: number;
  meleeDamageBonus: number;
  rangedDamageBonus: number;
  firearmDamageBonus: number;
  damageBreakdown: BreakdownSource[];
  
  // === Crítico ===
  criticalMarginBonus: number;
  criticalMultiplierBonus: number;
  
  // === Proficiências ===
  proficiencies: string[];
  
  // === Referência ao resultado completo do SUE ===
  rawSUE: ComputedEffects;
}

// =====================================================
// FUNÇÃO PRINCIPAL
// =====================================================

/**
 * Obtém todos os bônus do SUE para um CharacterState
 * 
 * @param state - Estado do personagem do Rules Engine
 * @returns Efeitos computados prontos para uso
 */
export function getSUEBonusesForCharacter(state: CharacterState): SUEComputedForRulesEngine {
  // 1. Criar contexto SUE a partir do CharacterState
  const context = createSUEContext(state);
  
  // 2. Coletar todos os efeitos aplicáveis
  const effects = collectAllEffects(state, context);
  
  // 3. Consolidar efeitos com regras de stacking
  const computed = consolidateEffects(effects, context);
  
  // 4. Converter para formato do Rules Engine
  return convertToRulesEngineFormat(computed, state);
}

/**
 * Cria o contexto de cálculo do SUE a partir do CharacterState
 */
function createSUEContext(state: CharacterState): EffectCalculationContext {
  // Calcular HP máximo aproximado para contexto (será refinado depois)
  const approximateHpMax = estimateMaxHP(state);
  const approximatePeMax = estimateMaxPE(state);
  
  return {
    attributes: state.attributes as Record<AttributeType, number>,
    nex: state.nex,
    hpCurrent: state.hpCurrent,
    hpMax: approximateHpMax,
    peCurrent: state.peCurrent,
    peMax: approximatePeMax,
    inCombat: state.combatState?.inCombat ?? false,
    isFirstRound: state.combatState?.currentRound === 1,
    currentRound: state.combatState?.currentRound ?? 0,
    activeConditions: state.activeConditions.map(c => c.conditionId),
    activatedEffects: [], // Poderes ativados manualmente
    equippedWeaponType: state.equippedWeapons[0]?.category,
    equippedArmorType: state.equippedArmor?.category,
    hasShield: false, // TODO: Detectar escudo do inventário
  };
}

/**
 * Coleta todos os efeitos aplicáveis ao personagem
 */
function collectAllEffects(state: CharacterState, context: EffectCalculationContext): UnifiedEffect[] {
  const effects: UnifiedEffect[] = [];
  
  // 1. Efeitos de Origem (getOriginEffects(originId, originName, intellect, activatedEffects))
  const originEffects = getOriginEffects(
    state.origin,
    state.origin,
    context.attributes.intellect,
    context.activatedEffects
  );
  effects.push(...originEffects);
  
  // 2. Efeitos de Condições (getConditionEffects(activeConditions[], attackContext?))
  const conditionIds = state.activeConditions.map(c => c.conditionId);
  if (conditionIds.length > 0) {
    const conditionEffects = getConditionEffects(conditionIds);
    effects.push(...conditionEffects);
  }
  
  // 3. Efeitos de Trilha (getTrackEffects(trackId, nex, attributes, activatedEffects))
  if (state.classTrack) {
    const trackEffects = getTrackEffects(
      state.classTrack,
      context.nex,
      context.attributes,
      context.activatedEffects
    );
    effects.push(...trackEffects);
  }
  
  // TODO: 4. Efeitos de Poderes de Classe
  // TODO: 5. Efeitos de Poderes Gerais
  // TODO: 6. Efeitos de Poderes Paranormais
  // TODO: 7. Efeitos de Rituais Sustentados
  // TODO: 8. Efeitos de Equipamentos
  
  return effects;
}

/**
 * Converte ComputedEffects do SUE para formato do Rules Engine
 */
function convertToRulesEngineFormat(
  computed: ComputedEffects,
  state: CharacterState
): SUEComputedForRulesEngine {
  // Converter breakdown do SUE para BreakdownSource
  const convertBreakdown = (
    breakdown: Array<{ source: string; value: number; conditional?: string }>,
    sourceType: BreakdownSource['sourceType'] = 'power'
  ): BreakdownSource[] => {
    return breakdown.map(b => ({
      name: b.source,
      sourceType,
      value: b.value,
      description: b.conditional,
    }));
  };
  
  // Calcular bônus de HP escalável por NEX (ex: Desgarrado)
  const nexMultiplier = Math.floor(state.nex / 5);
  let hpBonusTotal = computed.resources.hpBonus;
  const hpBreakdown: BreakdownSource[] = [];
  
  // Processar breakdown de recursos para HP
  for (const entry of computed.resources.breakdown) {
    if (entry.source.includes('PV') || entry.source.includes('Calejado')) {
      hpBreakdown.push({
        name: entry.source,
        sourceType: detectSourceType(entry.source),
        value: entry.value,
      });
    }
  }
  
  // Calcular bônus de PE escalável
  let peBonusTotal = computed.resources.peBonus;
  const peBreakdown: BreakdownSource[] = [];
  
  for (const entry of computed.resources.breakdown) {
    if (entry.source.includes('PE') || entry.source.includes('Dedicação')) {
      peBreakdown.push({
        name: entry.source,
        sourceType: detectSourceType(entry.source),
        value: entry.value,
      });
    }
  }
  
  // Calcular bônus de SAN escalável
  let sanityBonusTotal = computed.resources.sanityBonus;
  const sanityBreakdown: BreakdownSource[] = [];
  
  for (const entry of computed.resources.breakdown) {
    if (entry.source.includes('SAN') || entry.source.includes('Sanidade') || entry.source.includes('Cicatrizes')) {
      sanityBreakdown.push({
        name: entry.source,
        sourceType: detectSourceType(entry.source),
        value: entry.value,
      });
    }
  }
  
  // Processar bônus de perícias (computed.skills é Record<string, { bonus, sources }>)
  const skillBonuses: Record<string, number> = {};
  const skillBreakdowns: Record<string, BreakdownSource[]> = {};
  
  for (const [skill, data] of Object.entries(computed.skills)) {
    if (typeof data === 'object' && data !== null && 'bonus' in data) {
      skillBonuses[skill] = (data as { bonus: number }).bonus;
    } else if (typeof data === 'number') {
      skillBonuses[skill] = data;
    }
  }
  
  return {
    // Recursos
    hpBonus: hpBonusTotal,
    hpBreakdown,
    peBonus: peBonusTotal,
    peBreakdown,
    sanityBonus: sanityBonusTotal,
    sanityBreakdown,
    peLimitBonus: computed.resources.peLimitBonus,
    peLimitBreakdown: convertBreakdown(
      computed.resources.breakdown.filter(b => b.source.includes('Limite PE')),
      'origin'
    ),
    
    // Defesa
    defenseBonus: computed.defense.general,
    defenseBreakdown: convertBreakdown(computed.defense.breakdown),
    
    // Resistências (simplificado - filtrar por fonte)
    fortitudeBonus: computed.resistances.fortitude,
    fortitudeBreakdown: computed.resistances.breakdown
      .filter(b => b.resistance === 'fortitude' || !('resistance' in b))
      .map(b => ({ name: b.source, sourceType: 'power' as const, value: b.value })),
    reflexosBonus: computed.resistances.reflexos,
    reflexosBreakdown: computed.resistances.breakdown
      .filter(b => b.resistance === 'reflexos' || !('resistance' in b))
      .map(b => ({ name: b.source, sourceType: 'power' as const, value: b.value })),
    vontadeBonus: computed.resistances.vontade,
    vontadeBreakdown: computed.resistances.breakdown
      .filter(b => b.resistance === 'vontade' || !('resistance' in b))
      .map(b => ({ name: b.source, sourceType: 'power' as const, value: b.value })),
    
    // Movimento
    movementBonus: computed.movement.bonus,
    movementBreakdown: convertBreakdown(computed.movement.breakdown),
    
    // Perícias
    skillBonuses,
    skillBreakdowns,
    
    // Ataque
    attackBonus: computed.attack.general,
    meleeAttackBonus: computed.attack.melee,
    rangedAttackBonus: computed.attack.ranged,
    attackBreakdown: convertBreakdown(computed.attack.breakdown),
    
    // Dano (filtrar apenas entries com value numérico)
    damageBonus: computed.damage.general,
    meleeDamageBonus: computed.damage.melee,
    rangedDamageBonus: computed.damage.ranged,
    firearmDamageBonus: computed.damage.firearm,
    damageBreakdown: computed.damage.breakdown
      .filter(b => typeof b.value === 'number')
      .map(b => ({ name: b.source, sourceType: 'power' as const, value: b.value as number, description: b.conditional })),
    
    // Crítico
    criticalMarginBonus: computed.critical.marginBonus,
    criticalMultiplierBonus: computed.critical.multiplierBonus,
    
    // Proficiências
    proficiencies: computed.proficiencies,
    
    // Referência completa
    rawSUE: computed,
  };
}

// =====================================================
// HELPERS
// =====================================================

/**
 * Detecta o tipo de fonte a partir do nome
 */
function detectSourceType(sourceName: string): BreakdownSource['sourceType'] {
  const lower = sourceName.toLowerCase();
  
  if (lower.includes('origem') || lower.includes('desgarrado') || 
      lower.includes('universitário') || lower.includes('vítima') ||
      lower.includes('acadêmico') || lower.includes('militar')) {
    return 'origin';
  }
  if (lower.includes('trilha')) {
    return 'track';
  }
  if (lower.includes('ritual')) {
    return 'ritual';
  }
  if (lower.includes('armadura') || lower.includes('escudo') || lower.includes('arma')) {
    return 'equipment';
  }
  if (lower.includes('condição')) {
    return 'condition';
  }
  
  return 'power';
}

/**
 * Estima HP máximo para contexto inicial
 */
function estimateMaxHP(state: CharacterState): number {
  const classBaseHP: Record<string, number> = {
    'Combatente': 20,
    'Especialista': 12,
    'Ocultista': 8,
  };
  const classHPPerNex: Record<string, number> = {
    'Combatente': 4,
    'Especialista': 3,
    'Ocultista': 2,
  };
  
  const base = classBaseHP[state.characterClass] || 12;
  const perNex = classHPPerNex[state.characterClass] || 3;
  const nexMultiplier = Math.floor(state.nex / 5) - 1;
  
  return base + state.attributes.vigor + (perNex * Math.max(0, nexMultiplier));
}

/**
 * Estima PE máximo para contexto inicial
 */
function estimateMaxPE(state: CharacterState): number {
  const classBasePE: Record<string, number> = {
    'Combatente': 2,
    'Especialista': 3,
    'Ocultista': 4,
  };
  const classPEPerNex: Record<string, number> = {
    'Combatente': 2,
    'Especialista': 3,
    'Ocultista': 4,
  };
  
  const base = classBasePE[state.characterClass] || 3;
  const perNex = classPEPerNex[state.characterClass] || 3;
  const nexMultiplier = Math.floor(state.nex / 5) - 1;
  
  return base + state.attributes.presence + (perNex * Math.max(0, nexMultiplier));
}
