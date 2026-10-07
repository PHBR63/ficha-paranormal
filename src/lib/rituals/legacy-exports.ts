/**
 * Exportações de compatibilidade legada para migração gradual
 * 
 * Este arquivo provê todos os tipos, interfaces e funções que eram
 * exportados pelos arquivos antigos (rituals-data.ts e ritual-effects.ts),
 * redirecionando para o novo sistema unificado.
 * 
 * IMPORTANTE: Este arquivo existe para permitir remoção dos arquivos legados
 * sem quebrar os componentes. Gradualmente, os componentes devem migrar
 * para usar diretamente os exports de ritual-registry.ts e types.ts.
 */

import type { UnifiedRitual, RitualMechanics, RitualCircle, RitualElement as UnifiedElement } from './types';
import { 
  getRitualById as getUnifiedRitualById,
  getAllRituals as getUnifiedAllRituals,
  getRitualsByMaxCircle as getUnifiedRitualsByMaxCircle,
  getRitualsByCircle as getUnifiedRitualsByCircle,
  getRitualsByElement as getUnifiedRitualsByElement,
  getRitualEffect,
  getRitualHooks as getUnifiedRitualHooks,
  getRitualModes,
  getEffectiveLevel,
} from './ritual-registry';
import { unifiedToLegacy, mechanicsToLegacyEffect } from './ritual-adapter';

// ========================================
// TIPOS DE RITUAIS-DATA.TS
// ========================================

// Tipo de elemento (compatível com ambos os sistemas)
export type RitualElement = 'sangue' | 'morte' | 'conhecimento' | 'energia' | 'medo';

// Interface de aprimoramento legada
export interface RitualEnhancement {
  name: 'Discente' | 'Verdadeiro';
  cost: number;
  description: string;
  requirements?: string;
}

// Interface principal de ritual legada
export interface Ritual {
  id: string;
  name: string;
  circle: number;
  element: RitualElement;
  execution?: string;
  range?: string;
  target?: string;
  area?: string;
  duration?: string;
  resistance?: string;
  description?: string;
  cost: number;
  enhancements?: RitualEnhancement[];
}

// ========================================
// TIPOS DE RITUAL-EFFECTS.TS
// ========================================

export type RitualKind = 
  | 'damage'
  | 'buff'
  | 'debuff'
  | 'healing'
  | 'stateOverride'
  | 'narrativeOverride'
  | 'sense'
  | 'interceptor'
  | 'summon'
  | 'control'
  | 'transformation'
  | 'utility';

export type HookTrigger = 
  | 'onRoll'
  | 'onPreDamage'
  | 'onPostDamage'
  | 'onFallDamage'
  | 'onProjectileHit'
  | 'onReduceHP'
  | 'onTurnStart'
  | 'onTurnEnd'
  | 'onDeath'
  | 'onCast'
  | 'onConcentrationBreak'
  | 'onResistancePass';

export interface Hook {
  trigger: HookTrigger;
  effect: string;
  condition?: string;
  priority?: number;
}

export interface SustainConfig {
  costPerTurn?: number;
  action?: 'free' | 'move' | 'standard' | 'full';
  concentration?: boolean;
  maxDuration?: number;
  endTriggers?: string[];
}

export interface RitualMode {
  name: string;
  kind: RitualKind;
  description: string;
  effect: Partial<RitualEffect>;
}

export type PhysicalDamageType = 'corte' | 'perfuração' | 'impacto' | 'balístico';
export type ElementalDamageType = 'fogo' | 'frio' | 'eletricidade' | 'ácido' | 'químico';
export type ParanormalDamageType = 'energia' | 'sangue' | 'morte' | 'conhecimento' | 'medo';
export type SpecialDamageType = 'mental' | 'sanidade' | 'verdadeiro';
export type AnyDamageType = PhysicalDamageType | ElementalDamageType | ParanormalDamageType | SpecialDamageType;

export type ResistanceType = 'fortitude' | 'reflexos' | 'vontade';
export type ResistanceEffect = 'anula' | 'parcial' | 'reduz_metade';

export interface DamageFormula {
  diceCount: number;
  diceType: number;
  diceMultiplier?: number;
  bonus?: number;
  damageType: AnyDamageType;
  ignoresResistance?: boolean;
  ignoresRD?: boolean;
  isAbsolute?: boolean;
}

export interface ResourceModifier {
  peMax?: number;
  hpMax?: number;
  sanMax?: number;
  movementMax?: number;
}

export type ActionRestriction = 
  | 'mustAttack'
  | 'mustAttackNearest'
  | 'cannotSpeak'
  | 'cannotCast'
  | 'cannotMove'
  | 'cannotUseItems'
  | 'mustFlee'
  | 'mustObey'
  | 'cannotHarm'
  | 'cannotConcentrate'
  | 'cannotStealth';

export interface RitualEffect {
  summary?: string;
  kind?: RitualKind;
  hooks?: Hook[];
  sustain?: SustainConfig;
  modes?: RitualMode[];
  actionRestrictions?: ActionRestriction[];
  resourceModifier?: ResourceModifier;
  
  damage?: DamageFormula;
  damagePerTurn?: DamageFormula;
  
  healing?: {
    diceCount: number;
    diceType: number;
    bonus?: number;
  };
  
  tempHP?: {
    diceCount: number;
    diceType: number;
    bonus?: number;
  };
  
  appliesConditions?: {
    id?: string;
    conditionId?: string;
    duration?: number | 'rodada' | 'cena' | 'sustentado' | 'permanente';
    turnsCount?: number;
    savingThrow?: ResistanceType;
    isPermanent?: boolean;
  }[];
  
  defenseModifier?: number;
  attackModifier?: number;
  damageModifier?: number;
  
  weaponEffect?: {
    damageBonus?: number;
    damageType?: AnyDamageType;
    extraDice?: { count: number; type: number };
    bonusDamage?: DamageFormula;
    attackBonus?: number;
    criticalBonus?: number;
    criticalMultiplierBonus?: number;
    special?: string;
    isPermanentWound?: boolean;
  };
  
  resistance?: {
    type: ResistanceType;
    effect: ResistanceEffect;
    dt?: number;
  };
  
  areaEffect?: {
    shape: 'esfera' | 'cone' | 'linha' | 'cubo' | 'cilindro' | 'emanação';
    radius?: number;
    length?: number;
    width?: number;
  };
  
  skillModifier?: {
    skills: string[];
    bonus: number;
    isContextual?: boolean;
    context?: string;
  };
  
  damageReduction?: {
    types: AnyDamageType[];
    amount: number;
  };
  
  senseEffect?: {
    type: 'detect' | 'locate' | 'scry' | 'commune';
    range?: number;
    targets?: string[];
    information?: string;
  };
  
  mentalControl?: {
    type: 'charm' | 'dominate' | 'suggestion' | 'fear' | 'possession';
    canForceHarm?: boolean;
    canForceSuicide?: boolean;
    breakConditions?: string[];
  };
  
  special?: string;
}

export interface RitualEffectsByLevel {
  base: RitualEffect;
  discente?: RitualEffect;
  verdadeiro?: RitualEffect;
}

// ========================================
// DADOS - RITUAIS CONVERTIDOS DO SISTEMA UNIFICADO
// ========================================

// Converte todos os rituais unificados para formato legado
function convertAllRituals(): Ritual[] {
  return getUnifiedAllRituals().map(unified => unifiedToLegacy(unified));
}

// Cache de rituais convertidos
let _cachedRituals: Ritual[] | null = null;

function getCachedRituals(): Ritual[] {
  if (!_cachedRituals) {
    _cachedRituals = convertAllRituals();
  }
  return _cachedRituals;
}

// Array de todos os rituais (compatibilidade com ALL_RITUALS)
export const ALL_RITUALS: Ritual[] = getCachedRituals();

// Arrays por círculo (compatibilidade legada)
export const FIRST_CIRCLE_RITUALS: Ritual[] = ALL_RITUALS.filter(r => r.circle === 1);
export const SECOND_CIRCLE_RITUALS: Ritual[] = ALL_RITUALS.filter(r => r.circle === 2);
export const THIRD_CIRCLE_RITUALS: Ritual[] = ALL_RITUALS.filter(r => r.circle === 3);
export const FOURTH_CIRCLE_RITUALS: Ritual[] = ALL_RITUALS.filter(r => r.circle === 4);

// ========================================
// FUNÇÕES AUXILIARES DE RITUALS-DATA.TS
// ========================================

/**
 * Retorna rituais até um círculo máximo
 */
export function getRitualsByMaxCircle(maxCircle: number): Ritual[] {
  return ALL_RITUALS.filter(ritual => ritual.circle <= maxCircle);
}

/**
 * Retorna rituais de um elemento específico
 */
export function getRitualsByElement(element: RitualElement): Ritual[] {
  return ALL_RITUALS.filter(ritual => ritual.element === element);
}

/**
 * Retorna rituais de um círculo específico
 */
export function getRitualsByCircle(circle: number): Ritual[] {
  return ALL_RITUALS.filter(ritual => ritual.circle === circle);
}

/**
 * Retorna o círculo máximo de ritual baseado no NEX
 */
export function getMaxRitualCircle(nex: number): number {
  if (nex >= 85) return 4;
  if (nex >= 55) return 3;
  if (nex >= 25) return 2;
  return 1;
}

/**
 * Retorna o número de rituais conhecidos baseado no NEX (para Ocultista)
 */
export function getRitualCount(nex: number): number {
  const ritualCounts: Record<number, number> = {
    5: 3, 10: 4, 15: 5, 20: 6, 25: 7, 30: 8, 35: 9, 40: 10,
    45: 11, 50: 12, 55: 13, 60: 14, 65: 15, 70: 16, 75: 17,
    80: 18, 85: 19, 90: 20, 95: 21, 99: 22,
  };
  return ritualCounts[nex] || 3;
}

/**
 * Retorna um ritual pelo ID
 */
export function getRitualById(id: string): Ritual | undefined {
  return ALL_RITUALS.find(ritual => ritual.id === id);
}

/**
 * Retorna todos os elementos disponíveis
 */
export function getAllElements(): RitualElement[] {
  return ['sangue', 'morte', 'conhecimento', 'energia', 'medo'];
}

// ========================================
// EFEITOS - MAPEAMENTO DO SISTEMA UNIFICADO
// ========================================

/**
 * Constrói o mapa de efeitos a partir do sistema unificado
 */
function buildRitualEffectsMap(): Record<string, RitualEffectsByLevel> {
  const effectsMap: Record<string, RitualEffectsByLevel> = {};
  
  for (const ritual of getUnifiedAllRituals()) {
    const baseEffect = getRitualEffect(ritual.id, 'base');
    const discenteEffect = getRitualEffect(ritual.id, 'discente');
    const verdadeiroEffect = getRitualEffect(ritual.id, 'verdadeiro');
    
    if (baseEffect) {
      effectsMap[ritual.id] = {
        base: mechanicsToLegacyEffect(baseEffect),
        discente: discenteEffect ? mechanicsToLegacyEffect(discenteEffect) : undefined,
        verdadeiro: verdadeiroEffect ? mechanicsToLegacyEffect(verdadeiroEffect) : undefined,
      };
    }
  }
  
  return effectsMap;
}

// Cache de efeitos
let _cachedEffects: Record<string, RitualEffectsByLevel> | null = null;

function getCachedEffects(): Record<string, RitualEffectsByLevel> {
  if (!_cachedEffects) {
    _cachedEffects = buildRitualEffectsMap();
  }
  return _cachedEffects;
}

// Mapa de efeitos (compatibilidade com RITUAL_EFFECTS)
export const RITUAL_EFFECTS: Record<string, RitualEffectsByLevel> = getCachedEffects();

// ========================================
// FUNÇÕES DE RITUAL-EFFECTS.TS
// ========================================

export function getRitualEffects(ritualId: string): RitualEffectsByLevel | undefined {
  return RITUAL_EFFECTS[ritualId];
}

export function getActiveRitualEffect(
  ritualId: string, 
  selectedEnhancements: string[]
): RitualEffect | undefined {
  const effects = RITUAL_EFFECTS[ritualId];
  if (!effects) return undefined;

  let activeEffect: RitualEffect = { ...effects.base };

  if (selectedEnhancements.includes('Discente') && effects.discente) {
    activeEffect = mergeEffects(activeEffect, effects.discente);
  }

  if (selectedEnhancements.includes('Verdadeiro') && effects.verdadeiro) {
    activeEffect = mergeEffects(activeEffect, effects.verdadeiro);
  }

  return activeEffect;
}

function mergeEffects(base: RitualEffect, enhancement: RitualEffect): RitualEffect {
  return {
    ...base,
    ...enhancement,
    appliesConditions: [
      ...(base.appliesConditions || []),
      ...(enhancement.appliesConditions || []),
    ],
    hooks: [
      ...(base.hooks || []),
      ...(enhancement.hooks || []),
    ],
    actionRestrictions: [
      ...(base.actionRestrictions || []),
      ...(enhancement.actionRestrictions || []),
    ],
    modes: enhancement.modes || base.modes,
  };
}

export function formatDamageFormula(formula: DamageFormula): string {
  let result = '';
  
  if (formula.diceCount > 0 && formula.diceType > 0) {
    result = `${formula.diceCount}d${formula.diceType}`;
    if (formula.diceMultiplier && formula.diceMultiplier !== 1) {
      result += `×${formula.diceMultiplier}`;
    }
  }
  
  if (formula.bonus && formula.bonus > 0) {
    result += result ? `+${formula.bonus}` : `${formula.bonus}`;
  }
  
  if (formula.isAbsolute) {
    result = `${formula.bonus || 0} (absoluto)`;
  }
  
  return result || '0';
}

export function ritualDealsDamage(ritualId: string): boolean {
  const effects = RITUAL_EFFECTS[ritualId];
  if (!effects) return false;
  
  return !!(
    effects.base.damage || 
    effects.base.damagePerTurn ||
    effects.discente?.damage || 
    effects.discente?.damagePerTurn ||
    effects.verdadeiro?.damage ||
    effects.verdadeiro?.damagePerTurn
  );
}

export function ritualAppliesConditions(ritualId: string): boolean {
  const effects = RITUAL_EFFECTS[ritualId];
  if (!effects) return false;
  
  return !!(
    effects.base.appliesConditions?.length ||
    effects.discente?.appliesConditions?.length ||
    effects.verdadeiro?.appliesConditions?.length
  );
}

export function getRitualKind(ritualId: string): RitualKind | undefined {
  const effects = RITUAL_EFFECTS[ritualId];
  return effects?.base.kind;
}

export function ritualHasHooks(ritualId: string): boolean {
  const effects = RITUAL_EFFECTS[ritualId];
  if (!effects) return false;
  
  return !!(
    effects.base.hooks?.length ||
    effects.discente?.hooks?.length ||
    effects.verdadeiro?.hooks?.length
  );
}

export function getRitualHooks(ritualId: string): Hook[] {
  const effects = RITUAL_EFFECTS[ritualId];
  if (!effects) return [];
  
  return [
    ...(effects.base.hooks || []),
    ...(effects.discente?.hooks || []),
    ...(effects.verdadeiro?.hooks || []),
  ];
}

export function ritualRequiresSustain(ritualId: string): boolean {
  const effects = RITUAL_EFFECTS[ritualId];
  return !!effects?.base.sustain;
}

export function getRitualActionRestrictions(ritualId: string): ActionRestriction[] {
  const effects = RITUAL_EFFECTS[ritualId];
  if (!effects) return [];
  
  return [
    ...(effects.base.actionRestrictions || []),
    ...(effects.discente?.actionRestrictions || []),
    ...(effects.verdadeiro?.actionRestrictions || []),
  ];
}
