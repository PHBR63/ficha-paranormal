/**
 * Tipos para Sistema Unificado de Rituais
 * Ordem Paranormal RPG v1.3
 */

// Tipos básicos para validação e consulta
export type RitualElement = 'sangue' | 'morte' | 'conhecimento' | 'energia' | 'medo';
export type RitualCircle = 1 | 2 | 3 | 4;
export type ExecutionType = 'Padrão' | 'Completa' | 'Reação' | 'Livre' | 'Ritual';
export type RangeType = 'Pessoal' | 'Toque' | 'Curto' | 'Médio' | 'Longo' | 'Ilimitado' | 'Especial';
export type DurationType = 'Instantânea' | 'Cena' | 'Sustentada' | 'Permanente' | 'Especial' | '1 dia' | '1 semana';
export type RitualKind = 
  | 'damage' | 'buff' | 'debuff' | 'healing' | 'stateOverride' 
  | 'narrativeOverride' | 'sense' | 'interceptor' | 'summon' 
  | 'control' | 'transformation' | 'utility';

export interface RitualEnhancement {
  name: 'Discente' | 'Verdadeiro';
  cost: number;
  description: string;
  circleReq?: number;
  affinityReq?: boolean;
}

export interface WeaponEffectConfig {
  damageBonus?: number | string;
  attackBonus?: number;
  criticalBonus?: number;
  criticalMultiplierBonus?: number;
  extraDice?: { diceCount: number; diceType: number };
  damageType?: string;
  special?: string;
}

export interface RitualResistance {
  type: 'fortitude' | 'reflexos' | 'vontade';
  effect: 'anula' | 'parcial' | 'reduz_metade';
  dt?: number;
}

export interface RitualDamage {
  diceCount: number;
  diceType: number;
  bonus?: number;
  damageType?: string;
}

export interface RitualHealing {
  diceCount: number;
  diceType: number;
  bonus?: number;
  removesConditions?: string[];
}

export interface RitualAreaEffect {
  shape: string;
  radius?: number;
  length?: number;
}

export interface RitualCondition {
  id: string;
  duration?: number | string;
  saveEnds?: boolean;
}

export interface RitualSustain {
  action?: string;
  concentration?: boolean;
  costPerTurn?: number;
  maxDuration?: number;
}

export interface RitualMode {
  name: string;
  description: string;
}

export interface RitualHook {
  trigger: string;
  effect: string;
}

export interface RitualMentalControl {
  type: string;
  canForceHarm?: boolean;
  canForceSuicide?: boolean;
}

// Interface flexível para mecânicas de ritual
export interface RitualMechanics {
  kind?: RitualKind;
  attackBonus?: number;
  damageBonus?: number | string;
  defenseBonus?: number;
  resistanceBonus?: number;
  damage?: RitualDamage | string;
  healing?: RitualHealing | string;
  damagePerTurn?: RitualDamage | string;
  tempHP?: { diceCount: number; diceType: number; bonus?: number };
  damageReduction?: { amount: number; types?: string[] };
  skillBonus?: { skills: string[]; bonus: number; isContextual?: boolean; context?: string };
  weaponEffect?: WeaponEffectConfig;
  conditions?: RitualCondition[];
  actionRestrictions?: string[];
  resistance?: RitualResistance;
  sustain?: RitualSustain;
  modes?: RitualMode[];
  hooks?: RitualHook[];
  areaEffect?: RitualAreaEffect;
  mentalControl?: RitualMentalControl;
  senseEffect?: { type: string; range?: number; information?: string; targets?: string };
  summary?: string;
}

// Tipos auxiliares para compatibilidade
export interface AppliedCondition {
  id: string;
  name: string;
  duration?: number | string;
  stacks?: number;
}

export interface DamageReductionConfig {
  amount: number;
  types?: string[];
}

export interface SkillBonusConfig {
  skills: string[];
  bonus: number;
  isContextual?: boolean;
  context?: string;
}

export interface SustainConfig {
  action?: string;
  concentration?: boolean;
  costPerTurn?: number;
  maxDuration?: number;
}

export interface UnifiedRitual {
  id: string;
  name: string;
  element: string;
  circle: number;
  description?: string;
  cost: number;
  isSustainable?: boolean;
  duration?: string;
  range?: string;
  execution?: string;
  resistance?: string | RitualResistance;
  target?: string;
  area?: string;
  isWeaponBuff?: boolean;
  hasModes?: boolean;
  hasHooks?: boolean;
  enhancements?: RitualEnhancement[];
  effects: {
    base: RitualMechanics;
    discente?: RitualMechanics;
    verdadeiro?: RitualMechanics;
  };
}
