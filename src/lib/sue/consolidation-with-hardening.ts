/**
 * Consolidação de Efeitos com SUE Hardening
 * Ordem Paranormal RPG v1.3
 * 
 * Este módulo integra a ordem fixa de aplicação de efeitos e as regras
 * de stacking explícitas ao processo de consolidação do motor principal.
 * 
 * FLUXO DE PROCESSAMENTO:
 * 1. Recebe lista de UnifiedEffect[]
 * 2. Ordena pela ordem fixa de aplicação (10 passos)
 * 3. Agrupa por fonte para aplicação de stacking
 * 4. Aplica regras de stacking por categoria
 * 5. Retorna efeitos processados prontos para consolidação
 * 
 * @module sue/consolidation-with-hardening
 */

import type { UnifiedEffect, EffectSource } from '../unified-effects-engine';
import { 
  sortEffectsByPriority, 
  groupEffectsBySource, 
  EFFECT_APPLICATION_ORDER,
  type OrderableEffect 
} from './effect-application-order';
import {
  applyStackingRules,
  STACKING_RULES,
  conditionAccumulatesDamage,
  type StackableBonus,
  type BonusCategory,
  type StackingResult,
} from './stacking-rules';

// ========================================
// TIPOS PARA INTEGRAÇÃO
// ========================================

/**
 * Efeito preparado para consolidação (após ordenação e stacking)
 */
export interface PreparedEffect extends UnifiedEffect {
  /** Ordem de aplicação calculada */
  applicationOrder: number;
  
  /** Se passou pelas regras de stacking */
  stackingApplied: boolean;
  
  /** Bônus que foram excluídos por stacking (para debug/UI) */
  excludedByStacking?: string[];
}

/**
 * Resultado do pré-processamento de efeitos
 */
export interface PreprocessResult {
  /** Efeitos ordenados e filtrados por stacking */
  effects: PreparedEffect[];
  
  /** Breakdown de stacking por categoria */
  stackingBreakdowns: Map<BonusCategory, StackingResult>;
  
  /** Efeitos excluídos por stacking (para UI) */
  excludedEffects: Array<{
    effect: UnifiedEffect;
    reason: string;
    replacedBy: string;
  }>;
  
  /** Metadados de processamento */
  metadata: {
    totalReceived: number;
    totalAfterOrdering: number;
    totalAfterStacking: number;
    processingTimeMs: number;
  };
}

// ========================================
// FUNÇÕES DE PRÉ-PROCESSAMENTO
// ========================================

/**
 * Adapta UnifiedEffect para interface OrderableEffect
 */
function toOrderableEffect(effect: UnifiedEffect): OrderableEffect & { original: UnifiedEffect } {
  return {
    source: effect.source,
    sourceId: effect.id,
    priority: undefined, // Usa prioridade padrão
    original: effect,
  };
}

/**
 * Converte mecânicas de efeito para StackableBonus por categoria
 */
function effectToStackableBonuses(effect: UnifiedEffect): StackableBonus[] {
  const bonuses: StackableBonus[] = [];
  const m = effect.mechanics;
  
  if (!m) return bonuses;
  
  // === Ataque ===
  if (m.attackBonus) {
    bonuses.push({
      id: `${effect.id}_attack`,
      source: effect.source,
      sourceId: effect.id,
      sourceName: effect.sourceName,
      value: m.attackBonus,
      category: 'attack',
      active: effect.isActive,
    });
  }
  if (m.meleeAttackBonus) {
    bonuses.push({
      id: `${effect.id}_melee_attack`,
      source: effect.source,
      sourceId: effect.id,
      sourceName: effect.sourceName,
      value: m.meleeAttackBonus,
      category: 'attack',
      active: effect.isActive,
      subtype: 'melee',
    });
  }
  if (m.rangedAttackBonus) {
    bonuses.push({
      id: `${effect.id}_ranged_attack`,
      source: effect.source,
      sourceId: effect.id,
      sourceName: effect.sourceName,
      value: m.rangedAttackBonus,
      category: 'attack',
      active: effect.isActive,
      subtype: 'ranged',
    });
  }
  
  // === Dano ===
  if (m.damageBonus) {
    bonuses.push({
      id: `${effect.id}_damage`,
      source: effect.source,
      sourceId: effect.id,
      sourceName: effect.sourceName,
      value: m.damageBonus,
      category: 'damage',
      active: effect.isActive,
    });
  }
  if (m.meleeDamageBonus) {
    bonuses.push({
      id: `${effect.id}_melee_damage`,
      source: effect.source,
      sourceId: effect.id,
      sourceName: effect.sourceName,
      value: m.meleeDamageBonus,
      category: 'damage',
      active: effect.isActive,
      subtype: 'melee',
    });
  }
  if (m.rangedDamageBonus) {
    bonuses.push({
      id: `${effect.id}_ranged_damage`,
      source: effect.source,
      sourceId: effect.id,
      sourceName: effect.sourceName,
      value: m.rangedDamageBonus,
      category: 'damage',
      active: effect.isActive,
      subtype: 'ranged',
    });
  }
  
  // === Defesa ===
  if (m.defenseBonus) {
    // Determina subtipo para regra especial de defesa
    let subtype = 'general';
    if (effect.source === 'equipment') {
      // Detecta tipo de equipamento pelo nome/ID
      const lowerName = effect.sourceName.toLowerCase();
      if (lowerName.includes('armadura') || lowerName.includes('armor')) {
        subtype = 'armor';
      } else if (lowerName.includes('escudo') || lowerName.includes('shield')) {
        subtype = 'shield';
      } else if (lowerName.includes('paranormal')) {
        subtype = 'paranormal';
      }
    }
    
    bonuses.push({
      id: `${effect.id}_defense`,
      source: effect.source,
      sourceId: effect.id,
      sourceName: effect.sourceName,
      value: m.defenseBonus,
      category: 'defense',
      active: effect.isActive,
      subtype,
    });
  }
  
  // === Resistências ===
  if (m.fortitudeBonus) {
    bonuses.push({
      id: `${effect.id}_fortitude`,
      source: effect.source,
      sourceId: effect.id,
      sourceName: effect.sourceName,
      value: m.fortitudeBonus,
      category: 'resistance',
      active: effect.isActive,
      subtype: 'fortitude',
    });
  }
  if (m.reflexosBonus) {
    bonuses.push({
      id: `${effect.id}_reflexos`,
      source: effect.source,
      sourceId: effect.id,
      sourceName: effect.sourceName,
      value: m.reflexosBonus,
      category: 'resistance',
      active: effect.isActive,
      subtype: 'reflexos',
    });
  }
  if (m.vontadeBonus) {
    bonuses.push({
      id: `${effect.id}_vontade`,
      source: effect.source,
      sourceId: effect.id,
      sourceName: effect.sourceName,
      value: m.vontadeBonus,
      category: 'resistance',
      active: effect.isActive,
      subtype: 'vontade',
    });
  }
  
  // === Recursos ===
  if (m.hpBonus) {
    bonuses.push({
      id: `${effect.id}_hp`,
      source: effect.source,
      sourceId: effect.id,
      sourceName: effect.sourceName,
      value: m.hpBonus,
      category: 'resource',
      active: effect.isActive,
      subtype: 'hp',
    });
  }
  if (m.peBonus) {
    bonuses.push({
      id: `${effect.id}_pe`,
      source: effect.source,
      sourceId: effect.id,
      sourceName: effect.sourceName,
      value: m.peBonus,
      category: 'resource',
      active: effect.isActive,
      subtype: 'pe',
    });
  }
  if (m.sanityBonus) {
    bonuses.push({
      id: `${effect.id}_san`,
      source: effect.source,
      sourceId: effect.id,
      sourceName: effect.sourceName,
      value: m.sanityBonus,
      category: 'resource',
      active: effect.isActive,
      subtype: 'san',
    });
  }
  
  // === Movimento ===
  if (m.movementBonus) {
    bonuses.push({
      id: `${effect.id}_movement`,
      source: effect.source,
      sourceId: effect.id,
      sourceName: effect.sourceName,
      value: m.movementBonus,
      category: 'movement',
      active: effect.isActive,
    });
  }
  
  // === Iniciativa ===
  if (m.initiativeBonus) {
    bonuses.push({
      id: `${effect.id}_initiative`,
      source: effect.source,
      sourceId: effect.id,
      sourceName: effect.sourceName,
      value: m.initiativeBonus,
      category: 'initiative',
      active: effect.isActive,
    });
  }
  
  // === Crítico ===
  if (m.criticalMarginBonus) {
    bonuses.push({
      id: `${effect.id}_crit_margin`,
      source: effect.source,
      sourceId: effect.id,
      sourceName: effect.sourceName,
      value: m.criticalMarginBonus,
      category: 'critical',
      active: effect.isActive,
      subtype: 'margin',
    });
  }
  if (m.criticalMultiplierBonus) {
    bonuses.push({
      id: `${effect.id}_crit_mult`,
      source: effect.source,
      sourceId: effect.id,
      sourceName: effect.sourceName,
      value: m.criticalMultiplierBonus,
      category: 'critical',
      active: effect.isActive,
      subtype: 'multiplier',
    });
  }
  
  // === Redução de Dano ===
  if (m.damageReduction) {
    bonuses.push({
      id: `${effect.id}_dr`,
      source: effect.source,
      sourceId: effect.id,
      sourceName: effect.sourceName,
      value: m.damageReduction,
      category: 'damage_reduction',
      active: effect.isActive,
    });
  }
  
  return bonuses;
}

/**
 * Pré-processa efeitos aplicando ordem fixa e regras de stacking
 * 
 * Este é o ponto de entrada principal para integração com consolidateEffects
 */
export function preprocessEffectsWithHardening(
  effects: UnifiedEffect[]
): PreprocessResult {
  const startTime = performance.now();
  
  // 1. Ordena efeitos pela ordem fixa de aplicação
  const orderable = effects.map(toOrderableEffect);
  const sorted = sortEffectsByPriority(orderable);
  
  // 2. Extrai todos os bônus para aplicar stacking
  const allBonuses: StackableBonus[] = [];
  for (const item of sorted) {
    const bonuses = effectToStackableBonuses(item.original);
    allBonuses.push(...bonuses);
  }
  
  // 3. Aplica regras de stacking por categoria
  const categories: BonusCategory[] = [
    'attack', 'damage', 'defense', 'resistance', 
    'skill', 'resource', 'movement', 'initiative', 
    'critical', 'damage_reduction',
  ];
  
  const stackingBreakdowns = new Map<BonusCategory, StackingResult>();
  const excludedBonusIds = new Set<string>();
  
  for (const category of categories) {
    const categoryBonuses = allBonuses.filter(b => b.category === category);
    if (categoryBonuses.length > 0) {
      const result = applyStackingRules(categoryBonuses, category);
      stackingBreakdowns.set(category, result);
      
      // Marca bônus excluídos
      for (const excluded of result.excluded) {
        excludedBonusIds.add(excluded.id);
      }
    }
  }
  
  // 4. Prepara lista de efeitos finais com metadados
  const preparedEffects: PreparedEffect[] = [];
  const excludedEffects: PreprocessResult['excludedEffects'] = [];
  
  for (let i = 0; i < sorted.length; i++) {
    const item = sorted[i];
    const effect = item.original;
    
    // Verifica se todos os bônus do efeito foram excluídos
    const effectBonuses = effectToStackableBonuses(effect);
    const excludedBonuses = effectBonuses.filter(b => excludedBonusIds.has(b.id));
    const hasRemainingBonuses = effectBonuses.some(b => !excludedBonusIds.has(b.id));
    
    // Se o efeito tem bônus que não foram excluídos, inclui
    if (hasRemainingBonuses || effectBonuses.length === 0) {
      preparedEffects.push({
        ...effect,
        applicationOrder: i,
        stackingApplied: true,
        excludedByStacking: excludedBonuses.map(b => b.id),
      });
    } else if (excludedBonuses.length > 0) {
      // Efeito completamente excluído por stacking
      const replacedBy = findReplacingEffect(effect, sorted.map(s => s.original));
      excludedEffects.push({
        effect,
        reason: 'Substituído por bônus maior',
        replacedBy: replacedBy?.sourceName ?? 'Outro efeito',
      });
    }
  }
  
  const endTime = performance.now();
  
  return {
    effects: preparedEffects,
    stackingBreakdowns,
    excludedEffects,
    metadata: {
      totalReceived: effects.length,
      totalAfterOrdering: sorted.length,
      totalAfterStacking: preparedEffects.length,
      processingTimeMs: endTime - startTime,
    },
  };
}

/**
 * Encontra o efeito que substituiu outro por stacking
 */
function findReplacingEffect(
  excluded: UnifiedEffect,
  allEffects: UnifiedEffect[]
): UnifiedEffect | null {
  // Procura efeitos da mesma fonte com valores maiores
  return allEffects.find(e => 
    e.source === excluded.source &&
    e.id !== excluded.id &&
    e.isActive
  ) ?? null;
}

// ========================================
// WRAPPER PARA CONSOLIDATE EFFECTS
// ========================================

/**
 * Ordena efeitos para processamento no consolidateEffects
 * 
 * Esta função deve ser chamada no início do consolidateEffects
 * para garantir a ordem determinística de aplicação.
 */
export function orderEffectsForConsolidation(effects: UnifiedEffect[]): UnifiedEffect[] {
  const orderable = effects.map(toOrderableEffect);
  const sorted = sortEffectsByPriority(orderable);
  return sorted.map(item => item.original);
}

/**
 * Verifica se um bônus deve ser aplicado considerando stacking
 * 
 * Use esta função dentro do loop de consolidateEffects para
 * verificar se um bônus específico deve ser contabilizado.
 */
export function shouldApplyBonus(
  effectId: string,
  category: BonusCategory,
  value: number,
  source: EffectSource,
  appliedBonuses: Map<string, { source: EffectSource; value: number; category: BonusCategory }[]>
): { apply: boolean; reason?: string } {
  const config = STACKING_RULES[source];
  const rule = config.categoryOverrides?.[category] ?? config.defaultRule;
  
  // Regra sum_all: sempre aplica
  if (rule === 'sum_all') {
    return { apply: true };
  }
  
  // Busca bônus já aplicados da mesma categoria
  const existing = appliedBonuses.get(category) ?? [];
  
  // highest_same_type: verifica se é o maior
  if (rule === 'highest_same_type') {
    const sameSource = existing.filter(b => b.source === source);
    const maxExisting = sameSource.reduce((max, b) => Math.max(max, b.value), 0);
    
    if (value > maxExisting) {
      return { apply: true };
    } else {
      return { 
        apply: false, 
        reason: `Substituído por valor maior (${maxExisting})` 
      };
    }
  }
  
  // Outros casos: aplica por padrão
  return { apply: true };
}

/**
 * Cria um tracker de bônus aplicados para uso em consolidateEffects
 */
export function createBonusTracker(): Map<string, { source: EffectSource; value: number; category: BonusCategory }[]> {
  return new Map();
}

/**
 * Registra um bônus aplicado no tracker
 */
export function trackAppliedBonus(
  tracker: Map<string, { source: EffectSource; value: number; category: BonusCategory }[]>,
  category: BonusCategory,
  source: EffectSource,
  value: number
): void {
  const existing = tracker.get(category) ?? [];
  existing.push({ source, value, category });
  tracker.set(category, existing);
}
