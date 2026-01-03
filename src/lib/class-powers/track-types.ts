/**
 * Sistema Unificado de Trilhas de Classe - Ordem Paranormal RPG v1.3
 * 
 * Define os tipos e interfaces para habilidades de trilha com efeitos mecânicos estruturados.
 * Cada trilha possui 4 habilidades desbloqueadas em NEX 10%, 40%, 65% e 99%.
 * 
 * @module track-types
 */

import type { 
  ClassId, 
  ActionType,
  Attribute,
  Skill,
  WeaponCategory
} from './types';

// =============================================================================
// TIPOS DE HABILIDADE DE TRILHA
// =============================================================================

/**
 * NEX em que as habilidades de trilha são desbloqueadas
 */
export type TrackAbilityNex = 10 | 40 | 65 | 99;

/**
 * Tipo de efeito especial da habilidade de trilha
 */
export type TrackAbilityKind = 
  | 'passive'
  | 'activated'
  | 'reaction'
  | 'triggered'
  | 'resource'
  | 'scaling'
  | 'ritual-modifier'
  | 'grants-ritual';

// =============================================================================
// MECÂNICAS DE HABILIDADE DE TRILHA
// =============================================================================

/**
 * Mecânicas de habilidade de trilha
 * Interface completa com todas as propriedades possíveis
 */
export interface TrackAbilityMechanics {
  /** Tipo da habilidade */
  kind: TrackAbilityKind;
  
  /** Configuração de ativação */
  activation?: {
    cost: number;
    action: ActionType | 'varies';
    perRound?: boolean;
    perScene?: boolean;
    perMission?: boolean;
    additionalCostPerEffect?: number;
    costPerTarget?: boolean;
    costPerCategory?: boolean;
    trigger?: string;
  };
  
  /** Bônus de dano */
  damageBonus?: {
    value?: number;
    attribute?: Attribute;
    extraDice?: { type: 'weapon' | 'fixed'; count: number; dieType?: string };
    conditions?: { weaponType?: string };
  };
  
  /** Bônus de crítico */
  criticalBonus?: {
    marginBonus?: number;
    multiplierBonus?: number;
    conditions?: { weaponType?: string };
    duration?: string;
  };
  
  /** Proficiências concedidas */
  proficiencies?: string[];
  
  /** Redução de categoria */
  categoryReduction?: {
    amount: number;
    targetType: 'specific-weapon' | 'any-weapon' | 'item';
    requiresChoice?: boolean;
    choiceDescription?: string;
    appliesToAllCarried?: boolean;
  };
  
  /** Efeitos de técnica (Aniquilador) */
  techniqueEffects?: Array<{
    id: string;
    name: string;
    description: string;
    peCost: number;
    effects: Record<string, number>;
  }>;
  
  /** Configuração de liderança */
  leadership?: {
    range: 'touch' | 'short' | 'medium' | 'long';
    maxAllies?: number | 'intellect';
    allyEffects: Record<string, boolean>;
  };
  
  /** Ataque furtivo */
  sneakAttack?: {
    scaling: Record<number, { dice: number; dieType: string }>;
    conditions: string[];
    peCost: number;
    usesPerRound: number;
  };
  
  /** Cura */
  healing?: {
    baseDice: string;
    scalingDice?: Record<number, { dice: number; dieType: string }>;
    peCost: number;
    extraDicePECost?: number;
    range: 'self' | 'touch' | 'short';
  };
  
  /** Modificador de ritual */
  ritualModifier?: {
    type: 'range' | 'area' | 'speed' | 'cost' | 'resistance' | 'counter';
    additionalPECost: number;
    effect: string;
    specificRitual?: string;
  };
  
  /** PE temporário */
  temporaryPE?: {
    trigger: string;
    amount: number | 'ritual-circle';
    maxPerScene?: number | 'pe-limit';
  };
  
  /** Ritual concedido */
  grantsRitual?: string;
  
  /** Bônus em perícias */
  skillBonus?: {
    skills: Skill[];
    bonus: number;
  };
  
  /** Bônus em Iniciativa */
  initiativeBonus?: number;
  
  /** PV adicional por % de NEX */
  hpPerNexPercent?: number;
  
  /** Bônus de Vigor no bloqueio */
  blockVigorBonus?: boolean;
  
  /** Resistência paranormal */
  paranormalResistance?: number;
  
  /** Resistência a dano mental */
  mentalDamageResistance?: number;
  
  /** Bônus na DT dos rituais */
  ritualDTBonus?: number;
  
  /** Permite usar PV como PE */
  hpAsPE?: boolean;
  
  /** Permite usar Ocultismo como ataque */
  occultismAsAttack?: boolean;
  
  /** Ações extras */
  extraActions?: Array<{
    type: string;
    trigger: string;
    weaponRestriction?: string;
    maneuverOptions?: string[];
    replaceDamage?: boolean;
  }>;
  
  /** Redução de dano */
  damageReduction?: {
    type: 'half' | 'fixed';
    damageTypes: string[];
    fixedAmount?: number;
  };
  
  // ===== PROPRIEDADES ESPECÍFICAS DE TRILHAS =====
  
  /** Multiplicador de Ataque Especial (Guerreiro) */
  specialAttackMultiplier?: number;
  
  /** Provocar inimigo (Tropa de Choque) */
  taunt?: {
    range: string;
    resistanceTest: string;
    dtAttribute: string;
  };
  
  /** Efeitos quando machucado (Tropa de Choque) */
  whenWounded?: {
    defenseBonus: number;
    damageResistance: number;
  };
  
  /** Efeitos quando morrendo (Tropa de Choque) */
  whenDying?: {
    canAct: boolean;
    notHelpless: boolean;
  };
  
  /** Dano máximo em crítico (Atirador de Elite) */
  maximumDamageOnCritical?: {
    weaponType: string;
  };
  
  /** Remove penalidade de furtividade ao mover (estrutura completa) */
  stealthMovementPenalty?: boolean | {
    removes?: boolean;
    reducesBy?: number;
  };
  
  /** Multiplicador de ataque furtivo (Assassinar) */
  sneakAttackMultiplier?: number;
  
  /** Ignora penalidade de furtividade (estrutura completa) */
  ignoreStealthPenalty?: boolean | {
    movementPenalty?: boolean;
    armorPenalty?: boolean;
    allPenalties?: boolean;
  };
  
  /** Controle de estado do alvo */
  targetStateControl?: {
    options: string[];
    resistanceTest: string;
    dtAttribute: string;
  };
  
  /** Remove condição (Médico de Campo) - estrutura completa */
  removeCondition?: {
    range: string;
    excludedConditions: string[];
    peCost?: number;
    actionType?: string;
  };
  
  /** Movimento livre para aliado (Resgate) */
  freeMovementTo?: {
    condition: string;
    perRound: boolean;
  };
  
  /** Bônus ao curar (Resgate) - estrutura completa */
  onHeal?: {
    targetDefenseBonus: number;
    duration: string;
    turns?: number;
  };
  
  /** Ressurreição (Reanimação) - estrutura completa */
  resurrect?: {
    excludedDeathTypes: string[];
    sameSceneOnly: boolean;
    usesPerScene?: number;
    peCost?: number;
    actionType?: string;
    hpRestored?: string;
  };
  
  /** Efeito social (Negociador) */
  socialEffect?: {
    range: string;
    targetAll: boolean;
    skillOptions: string[];
    resistanceSkill: string;
    effect: string;
    duration: string;
    immunityOnSuccess: string;
  };
  
  /** Buff para aliados (Discurso Motivador) */
  allyBuff?: {
    range: string;
    skillBonus: number;
    duration: string;
    includeSelf: boolean;
  };
  
  /** Rede de contatos (Eu Conheço um Cara) */
  contacts?: {
    effects: string[];
    gmDiscretion: boolean;
  };
  
  /** Copiar habilidade (Truque de Mestre) */
  copyAbility?: {
    source: string;
    seenInScene: boolean;
    ignorePrerequisites: boolean;
    payOriginalCosts: boolean;
  };
  
  /** Capacidade de carga (Técnico) */
  carryCapacity?: {
    addAttribute: Attribute;
  };
  
  /** Redução de espaço de item */
  itemSpaceReduction?: number;
  
  /** Reparar equipamento (Remendo) */
  repairEquipment?: {
    range: string;
    removeCondition: string;
  };
  
  /** Criar equipamento (Improvisar) */
  createEquipment?: {
    type: string;
    duration: string;
    destroyedAfter: boolean;
  };
  
  /** Retirar item retroativamente (Preparado para Tudo) */
  retrieveItem?: {
    excludeWeapons: boolean;
    retroactive: boolean;
  };
  
  /** Contra-mágica (Anular Ritual) */
  counterSpell?: {
    costMatchesTarget: boolean;
    testSkill: string;
    testType: string;
  };
  
  /** Restrição de recuperação de PV */
  hpRecoveryRestriction?: string;
  
  /** Rituais bônus (Saber Ampliado) - estrutura completa */
  bonusRituals?: {
    perCircle: number;
    ignoresLimit: boolean;
    circleRestriction?: number[];
  };
  
  /** Grimório (Graduado) */
  grimoire?: {
    maxRituals: number | 'intellect';
    allowedCircles: number[];
    bonusPerNewCircle: number;
    ignoresLimit: boolean;
    castingAction: string;
    requiresWielding: boolean;
    inventorySlots: number;
    recreationCost: string;
  };
  
  /** Adiciona atributo ao limite de PE */
  addAttributeToPELimit?: Attribute;
  
  /** Bônus de poder de ritual - estrutura completa */
  ritualPowerBonus?: {
    addPELimit: boolean;
    affectsDT: boolean;
    affectsDamage?: boolean;
  };
  
  /** Redução de dano paranormal com teste - estrutura completa */
  paranormalDamageReduction?: {
    testSkill: string;
    onSuccess: string;
    onFailure: string;
  };
  
  /** RD Paranormal com Teste (estrutura completa para Fase 5) */
  paranormalDamageTest?: {
    testSkill: string;
    onSuccess: string;
    onFailure: string;
    dtType: string;
    fixedDT?: number;
  };
}

/**
 * Progressão de habilidade de trilha
 */
export interface TrackAbilityProgression {
  [nex: number]: Partial<TrackAbilityMechanics>;
}

// =============================================================================
// INTERFACE PRINCIPAL DE HABILIDADE DE TRILHA
// =============================================================================

/**
 * Interface unificada de habilidade de trilha
 */
export interface UnifiedTrackAbility {
  id: string;
  name: string;
  trackId: string;
  minNex: TrackAbilityNex;
  description: string;
  pageReference?: string;
  effects: {
    base: TrackAbilityMechanics;
    progression?: TrackAbilityProgression;
  };
  isInitial?: boolean;
  tags?: string[];
}

// =============================================================================
// INTERFACE DE TRILHA
// =============================================================================

/**
 * Interface unificada de trilha de classe
 */
export interface UnifiedTrack {
  id: string;
  name: string;
  classId: ClassId;
  description: string;
  pageReference?: string;
  abilities: UnifiedTrackAbility[];
  isSuplement?: boolean;
  supplementName?: string;
  tags?: string[];
}

// =============================================================================
// TIPOS DE RUNTIME
// =============================================================================

/**
 * Trilha ativa de um personagem
 */
export interface ActiveTrack {
  trackId: string;
  unlockedAbilities: string[];
  choices?: Record<string, unknown>;
}

/**
 * Contexto para cálculo de bônus de trilha
 */
export interface TrackCalculationContext {
  nex: number;
  attributes: Record<Attribute, number>;
  activeTrack?: ActiveTrack;
  inCombat?: boolean;
  weaponType?: WeaponCategory;
  isFavoriteWeapon?: boolean;
  targetUnaware?: boolean;
  targetFlanked?: boolean;
  castingRitual?: boolean;
  ritualCircle?: number;
}

/**
 * Resumo de bônus calculados das trilhas
 */
export interface TrackBonusSummary {
  attackBonus: number;
  damageBonus: number;
  extraDamageDice: string[];
  criticalMarginBonus: number;
  criticalMultiplierBonus: number;
  defenseBonus: number;
  initiativeBonus: number;
  bonusHP: number;
  damageResistance: number;
  paranormalResistance: number;
  mentalDamageResistance: number;
  skillBonuses: Record<Skill, number>;
  categoryReduction: number;
  ritualDTBonus: number;
  canUseHPAsPE: boolean;
  canUseOccultismAsAttack: boolean;
  breakdown: Array<{
    source: string;
    abilityId: string;
    effects: string[];
  }>;
}
