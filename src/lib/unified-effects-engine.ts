// =====================================================
// Sistema Unificado de Efeitos (SUE) - Motor Central
// Ordem Paranormal RPG v1.3
// =====================================================
// 
// Este módulo define a estrutura base para todos os efeitos
// mecânicos do sistema, permitindo que origens, trilhas,
// poderes, condições e rituais compartilhem uma interface comum.
//

/**
 * Tipo de fonte do efeito - de onde ele vem
 */
export type EffectSource = 
  | 'origin'           // Origem do personagem
  | 'class_ability'    // Habilidade de classe
  | 'class_power'      // Poder de classe
  | 'track'            // Habilidade de trilha
  | 'general_power'    // Poder geral
  | 'paranormal_power' // Poder paranormal
  | 'condition'        // Condição ativa
  | 'ritual'           // Ritual sustentado
  | 'equipment'        // Equipamento
  | 'skill_training';  // Treinamento em perícia

/**
 * Tipo de ataque - para efeitos condicionais
 */
export type AttackType = 'melee' | 'ranged' | 'any';

/**
 * Tipo de dano
 */
export type DamageType = 
  | 'balistico' | 'corte' | 'impacto' | 'perfuracao'  // Físico
  | 'fogo' | 'frio' | 'eletricidade' | 'quimico'       // Elemental
  | 'mental' | 'sangue' | 'morte' | 'conhecimento' | 'energia' | 'medo'; // Paranormal

/**
 * Tipo de resistência
 */
export type ResistanceType = 'fortitude' | 'reflexos' | 'vontade';

/**
 * Tipo de atributo
 */
export type AttributeType = 'strength' | 'agility' | 'vigor' | 'intellect' | 'presence';

/**
 * Mecânicas de efeito - todos os modificadores possíveis
 */
export interface EffectMechanics {
  // === Combate - Ataque ===
  attackBonus?: number;           // Bônus em testes de ataque
  meleeAttackBonus?: number;      // Bônus apenas em corpo a corpo
  rangedAttackBonus?: number;     // Bônus apenas em distância
  
  // === Combate - Dano ===
  damageBonus?: number;           // Bônus em rolagens de dano
  meleeDamageBonus?: number;      // Bônus dano corpo a corpo
  rangedDamageBonus?: number;     // Bônus dano distância
  extraDamageDice?: string;       // Dados extras de dano (ex: "1d6")
  criticalDamageBonus?: number;   // Bônus dano crítico
  
  // === Combate - Crítico ===
  criticalMarginBonus?: number;   // Aumento na margem de ameaça
  criticalMultiplierBonus?: number; // Aumento no multiplicador crítico
  
  // === Combate - Defesa ===
  defenseBonus?: number;          // Bônus em Defesa
  defenseBonusMelee?: number;     // Bônus Defesa vs corpo a corpo
  defenseBonusRanged?: number;    // Bônus Defesa vs distância
  
  // === Resistências ===
  fortitudeBonus?: number;
  reflexosBonus?: number;
  vontadeBonus?: number;
  allResistancesBonus?: number;   // Bônus em todas as resistências
  
  // === Redução de Dano ===
  damageReduction?: number;        // RD física geral
  damageReductionByType?: Partial<Record<DamageType, number>>; // RD por tipo
  paranormalDamageReduction?: number; // RD contra dano paranormal
  
  // === Resistência a Dano (percentual) ===
  damageResistance?: Partial<Record<DamageType, number>>; // Ex: { mental: 5 } = resistência 5 mental
  
  // === Perícias ===
  skillBonus?: Partial<Record<string, number>>; // Bônus por perícia
  allSkillsBonus?: number;         // Bônus em todas as perícias
  attributeSkillsBonus?: Partial<Record<AttributeType, number>>; // Bônus em perícias de atributo
  
  // === Recursos ===
  hpBonus?: number;                // Bônus em PV máximo
  hpBonusPerNex?: number;          // Bônus PV por 5% NEX
  peBonus?: number;                // Bônus em PE máximo
  peBonusPerNex?: number;          // Bônus PE por 5% NEX
  sanityBonus?: number;            // Bônus em Sanidade máxima
  tempHP?: number;                 // PV temporários
  
  // === Movimento ===
  movementBonus?: number;          // Bônus em deslocamento (metros)
  movementMultiplier?: number;     // Multiplicador de deslocamento
  
  // === Iniciativa ===
  initiativeBonus?: number;
  
  // === Ações ===
  extraAction?: 'movement' | 'standard' | 'free' | 'full'; // Ação extra
  
  // === Efeitos Especiais (não numéricos) ===
  specialEffects?: string[];       // Lista de efeitos especiais textuais
  conditionalNote?: string;        // Nota sobre condição de aplicação (ex: "Apenas armas longas")
  
  // === Proficiências ===
  grantsProficiency?: string[];    // Proficiências concedidas
  
  // === Flags de Comportamento ===
  cannotAct?: boolean;             // Não pode agir
  cannotReact?: boolean;           // Não pode usar reações
  cannotMove?: boolean;            // Não pode se mover
  isHelpless?: boolean;            // Indefeso
  isUnconscious?: boolean;         // Inconsciente
  
  // === Flags de Crítico ===
  maximumDamageOnCrit?: boolean;   // Crítico causa dano máximo (Atirar para Matar)
  
  // =====================================================
  // RITUAIS - Mecânicas específicas para poderes de classe
  // =====================================================
  
  // === Bônus de DT de Rituais ===
  ritualDTBonus?: number;          // Bônus na DT de todos os rituais
  ritualDTBonusByElement?: Partial<Record<string, number>>; // +DT por elemento
  
  // === Bônus de Dano/Cura de Rituais ===
  ritualDamageBonus?: number;      // Bônus fixo em dano/cura de rituais
  ritualDamageAttributeBonus?: AttributeType; // Soma atributo no dano/cura de rituais
  
  // === Modificadores de PE de Rituais ===
  ritualPEReduction?: number;      // Redução geral de PE em rituais
  ritualPEReductionByElement?: Partial<Record<string, number>>; // Redução por elemento
  ritualPEReductionByRange?: Partial<Record<string, number>>; // Redução por alcance (pessoal, etc)
  
  // === Modificadores de Ritual de Trilha ===
  ritualModifiers?: Array<{
    id: string;                    // ID do modificador
    name: string;                  // Nome para exibição
    type: 'range' | 'action' | 'area' | 'duration'; // Tipo de modificação
    effect: string;                // Descrição do efeito
    peCost: number;                // Custo adicional em PE
    perRound?: boolean;            // Se aplica por rodada
    isActivatable?: boolean;       // Se requer ativação manual
  }>;
}

/**
 * Condições de aplicação do efeito
 * Define QUANDO o efeito se aplica
 */
export interface EffectConditions {
  // === Condições de Ataque ===
  attackType?: AttackType;         // Tipo de ataque requerido
  targetConditions?: string[];     // Condições que o alvo deve ter
  weaponType?: string[];           // Tipos de arma requeridos
  weaponCategory?: 'simple' | 'tactical' | 'heavy' | 'improvised'; // Categoria de arma
  
  // === Condições do Personagem ===
  characterConditions?: string[];  // Condições que o personagem deve ter
  hpPercentBelow?: number;         // PV abaixo de X% (ex: 50 para <50%)
  hpPercentAbove?: number;         // PV acima de X%
  
  // === Condições de Equipamento ===
  requiresShield?: boolean;
  requiresArmor?: boolean;
  requiresNoArmor?: boolean;
  
  // === Condições de Contexto ===
  inCombat?: boolean;
  firstRoundOnly?: boolean;        // Apenas na primeira rodada
  
  // === Condições de Ativação Manual ===
  requiresActivation?: boolean;    // Precisa ser ativado manualmente
  costPE?: number;                 // Custo em PE para ativar
  costAction?: 'free' | 'movement' | 'standard' | 'full' | 'reaction'; // Custo de ação
  
  // === Condições de Atributo ===
  minAttribute?: Partial<Record<AttributeType, number>>; // Atributo mínimo
}

/**
 * Duração do efeito
 */
export interface EffectDuration {
  type: 'permanent' | 'scene' | 'combat' | 'turns' | 'rounds' | 'until_removed';
  value?: number;                  // Número de turnos/rodadas
  sustainCost?: number;            // Custo PE por turno para sustentar
}

/**
 * Efeito Unificado - Estrutura principal
 * Qualquer fonte de bônus/modificador implementa esta interface
 */
export interface UnifiedEffect {
  id: string;                      // ID único do efeito
  name: string;                    // Nome para exibição
  description?: string;            // Descrição do efeito
  source: EffectSource;            // Tipo de fonte
  sourceId: string;                // ID da fonte (ex: id da origem)
  sourceName: string;              // Nome da fonte para display
  
  mechanics: EffectMechanics;      // Efeitos mecânicos
  conditions?: EffectConditions;   // Condições de aplicação
  duration?: EffectDuration;       // Duração
  
  // Metadata
  isActive: boolean;               // Se está ativo agora
  isToggleable: boolean;           // Se pode ser ativado/desativado
  priority?: number;               // Prioridade para resolução de conflitos
}

/**
 * Contexto para cálculo de efeitos
 * Representa o estado atual do personagem e situação
 */
export interface EffectCalculationContext {
  // Atributos
  attributes: Record<AttributeType, number>;
  
  // Estado atual
  nex: number;
  hpCurrent: number;
  hpMax: number;
  peCurrent: number;
  peMax: number;
  
  // Situação de combate
  inCombat: boolean;
  isFirstRound: boolean;
  currentRound: number;
  
  // Equipamento
  equippedWeaponType?: string;
  equippedArmorType?: string;
  hasShield: boolean;
  
  // Condições ativas
  activeConditions: string[];
  
  // Efeitos condicionais ativados manualmente
  activatedEffects: string[];
  
  // Contexto de ataque (se aplicável)
  attackContext?: {
    type: AttackType;
    targetConditions: string[];
    weaponType?: string;
  };
}

/**
 * Resultado do cálculo de efeitos consolidados
 */
export interface ComputedEffects {
  // === Combate ===
  attack: {
    general: number;
    melee: number;
    ranged: number;
    breakdown: Array<{ source: string; value: number; conditional?: string }>;
  };
  damage: {
    general: number;
    melee: number;
    ranged: number;
    extraDice: string[];
    breakdown: Array<{ source: string; value: number | string; conditional?: string }>;
  };
  critical: {
    marginBonus: number;
    multiplierBonus: number;
    breakdown: Array<{ source: string; value: number; type: 'margin' | 'multiplier' }>;
  };
  defense: {
    general: number;
    vsMelee: number;
    vsRanged: number;
    breakdown: Array<{ source: string; value: number; conditional?: string }>;
  };
  
  // === Resistências ===
  resistances: {
    fortitude: number;
    reflexos: number;
    vontade: number;
    breakdown: Array<{ source: string; value: number; resistance: ResistanceType }>;
  };
  
  // === Redução de Dano ===
  damageReduction: {
    physical: number;
    paranormal: number;
    byType: Partial<Record<DamageType, number>>;
    breakdown: Array<{ source: string; value: number; type?: DamageType }>;
  };
  
  // === Resistência a Dano ===
  damageResistance: Partial<Record<DamageType, number>>;
  
  // === Perícias ===
  skills: Record<string, { bonus: number; sources: string[] }>;
  
  // === Recursos ===
  resources: {
    hpBonus: number;
    peBonus: number;
    sanityBonus: number;
    tempHP: number;
    breakdown: Array<{ source: string; value: number; resource: 'hp' | 'pe' | 'sanity' | 'tempHP' }>;
  };
  
  // === Movimento ===
  movement: {
    bonus: number;
    multiplier: number;
    breakdown: Array<{ source: string; value: number }>;
  };
  
  // === Iniciativa ===
  initiative: {
    bonus: number;
    breakdown: Array<{ source: string; value: number }>;
  };
  
  // === Efeitos Especiais ===
  specialEffects: Array<{ source: string; effect: string }>;
  
  // === Proficiências ===
  proficiencies: string[];
  
  // === Flags ===
  flags: {
    cannotAct: boolean;
    cannotReact: boolean;
    cannotMove: boolean;
    isHelpless: boolean;
    isUnconscious: boolean;
  };
  
  // === Efeitos Toggleáveis ===
  toggleableEffects: Array<{
    id: string;
    name: string;
    source: string;
    isActive: boolean;
    effects: string[];
    condition?: string;
    costPE?: number;
  }>;
  
  // =====================================================
  // RITUAIS - Bônus consolidados para rituais
  // =====================================================
  rituals: {
    // Bônus de DT
    dtBonus: number;
    dtBonusByElement: Record<string, number>;
    
    // Bônus de dano/cura
    damageBonus: number;
    damageAttributeBonus: AttributeType | null;
    
    // Reduções de PE
    peReduction: number;
    peReductionByElement: Record<string, number>;
    peReductionByRange: Record<string, number>;
    
    // Modificadores de trilha disponíveis
    availableModifiers: Array<{
      id: string;
      name: string;
      type: 'range' | 'action' | 'area' | 'duration';
      effect: string;
      peCost: number;
      perRound?: boolean;
      isActivatable?: boolean;
      source: string;
    }>;
    
    // Breakdown para UI
    breakdown: Array<{ source: string; effect: string }>;
  };
}

/**
 * Verifica se as condições de um efeito são atendidas
 */
export function checkEffectConditions(
  effect: UnifiedEffect,
  context: EffectCalculationContext
): boolean {
  const conditions = effect.conditions;
  if (!conditions) return true;
  
  // Verifica tipo de ataque
  if (conditions.attackType && context.attackContext) {
    if (conditions.attackType !== 'any' && conditions.attackType !== context.attackContext.type) {
      return false;
    }
  }
  
  // Verifica condições do alvo
  if (conditions.targetConditions && context.attackContext) {
    const hasAllConditions = conditions.targetConditions.every(
      c => context.attackContext!.targetConditions.includes(c)
    );
    if (!hasAllConditions) return false;
  }
  
  // Verifica HP
  if (conditions.hpPercentBelow !== undefined) {
    const hpPercent = (context.hpCurrent / context.hpMax) * 100;
    if (hpPercent >= conditions.hpPercentBelow) return false;
  }
  if (conditions.hpPercentAbove !== undefined) {
    const hpPercent = (context.hpCurrent / context.hpMax) * 100;
    if (hpPercent <= conditions.hpPercentAbove) return false;
  }
  
  // Verifica condições do personagem
  if (conditions.characterConditions) {
    const hasAllConditions = conditions.characterConditions.every(
      c => context.activeConditions.includes(c)
    );
    if (!hasAllConditions) return false;
  }
  
  // Verifica escudo
  if (conditions.requiresShield && !context.hasShield) return false;
  
  // Verifica armadura
  if (conditions.requiresArmor && !context.equippedArmorType) return false;
  if (conditions.requiresNoArmor && context.equippedArmorType) return false;
  
  // Verifica combate
  if (conditions.inCombat !== undefined && conditions.inCombat !== context.inCombat) return false;
  
  // Verifica primeira rodada
  if (conditions.firstRoundOnly && !context.isFirstRound) return false;
  
  // Verifica ativação manual
  if (conditions.requiresActivation && !context.activatedEffects.includes(effect.id)) {
    return false;
  }
  
  // Verifica atributos mínimos
  if (conditions.minAttribute) {
    for (const [attr, minValue] of Object.entries(conditions.minAttribute)) {
      if (context.attributes[attr as AttributeType] < minValue!) return false;
    }
  }
  
  return true;
}

/**
 * Consolida uma lista de efeitos em um resultado computado
 */
export function consolidateEffects(
  effects: UnifiedEffect[],
  context: EffectCalculationContext
): ComputedEffects {
  const result: ComputedEffects = {
    attack: { general: 0, melee: 0, ranged: 0, breakdown: [] },
    damage: { general: 0, melee: 0, ranged: 0, extraDice: [], breakdown: [] },
    critical: { marginBonus: 0, multiplierBonus: 0, breakdown: [] },
    defense: { general: 0, vsMelee: 0, vsRanged: 0, breakdown: [] },
    resistances: { fortitude: 0, reflexos: 0, vontade: 0, breakdown: [] },
    damageReduction: { physical: 0, paranormal: 0, byType: {}, breakdown: [] },
    damageResistance: {},
    skills: {},
    resources: { hpBonus: 0, peBonus: 0, sanityBonus: 0, tempHP: 0, breakdown: [] },
    movement: { bonus: 0, multiplier: 1, breakdown: [] },
    initiative: { bonus: 0, breakdown: [] },
    specialEffects: [],
    proficiencies: [],
    flags: {
      cannotAct: false,
      cannotReact: false,
      cannotMove: false,
      isHelpless: false,
      isUnconscious: false,
    },
    toggleableEffects: [],
    // === RITUAIS ===
    rituals: {
      dtBonus: 0,
      dtBonusByElement: {},
      damageBonus: 0,
      damageAttributeBonus: null,
      peReduction: 0,
      peReductionByElement: {},
      peReductionByRange: {},
      availableModifiers: [],
      breakdown: [],
    },
  };
  
  for (const effect of effects) {
    // Registra efeitos toggleáveis
    if (effect.isToggleable) {
      result.toggleableEffects.push({
        id: effect.id,
        name: effect.name,
        source: effect.sourceName,
        isActive: effect.isActive,
        effects: effect.mechanics.specialEffects || [],
        condition: effect.conditions?.requiresActivation ? 'Ativação manual' : undefined,
        costPE: effect.conditions?.costPE,
      });
    }
    
    // Verifica condições
    if (!checkEffectConditions(effect, context) || !effect.isActive) {
      continue;
    }
    
    const m = effect.mechanics;
    const source = effect.sourceName;
    
    // === Ataque ===
    if (m.attackBonus) {
      result.attack.general += m.attackBonus;
      result.attack.breakdown.push({ source, value: m.attackBonus });
    }
    if (m.meleeAttackBonus) {
      result.attack.melee += m.meleeAttackBonus;
      result.attack.breakdown.push({ source, value: m.meleeAttackBonus, conditional: 'corpo a corpo' });
    }
    if (m.rangedAttackBonus) {
      result.attack.ranged += m.rangedAttackBonus;
      result.attack.breakdown.push({ source, value: m.rangedAttackBonus, conditional: 'distância' });
    }
    
    // === Dano ===
    if (m.damageBonus) {
      result.damage.general += m.damageBonus;
      result.damage.breakdown.push({ source, value: m.damageBonus });
    }
    if (m.meleeDamageBonus) {
      result.damage.melee += m.meleeDamageBonus;
      result.damage.breakdown.push({ source, value: m.meleeDamageBonus, conditional: 'corpo a corpo' });
    }
    if (m.rangedDamageBonus) {
      result.damage.ranged += m.rangedDamageBonus;
      result.damage.breakdown.push({ source, value: m.rangedDamageBonus, conditional: 'distância' });
    }
    if (m.extraDamageDice) {
      result.damage.extraDice.push(m.extraDamageDice);
      result.damage.breakdown.push({ source, value: m.extraDamageDice });
    }
    
    // === Crítico ===
    if (m.criticalMarginBonus) {
      result.critical.marginBonus += m.criticalMarginBonus;
      result.critical.breakdown.push({ source, value: m.criticalMarginBonus, type: 'margin' });
    }
    if (m.criticalMultiplierBonus) {
      result.critical.multiplierBonus += m.criticalMultiplierBonus;
      result.critical.breakdown.push({ source, value: m.criticalMultiplierBonus, type: 'multiplier' });
    }
    
    // === Defesa ===
    if (m.defenseBonus) {
      result.defense.general += m.defenseBonus;
      result.defense.breakdown.push({ source, value: m.defenseBonus });
    }
    if (m.defenseBonusMelee) {
      result.defense.vsMelee += m.defenseBonusMelee;
      result.defense.breakdown.push({ source, value: m.defenseBonusMelee, conditional: 'vs corpo a corpo' });
    }
    if (m.defenseBonusRanged) {
      result.defense.vsRanged += m.defenseBonusRanged;
      result.defense.breakdown.push({ source, value: m.defenseBonusRanged, conditional: 'vs distância' });
    }
    
    // === Resistências ===
    if (m.fortitudeBonus) {
      result.resistances.fortitude += m.fortitudeBonus;
      result.resistances.breakdown.push({ source, value: m.fortitudeBonus, resistance: 'fortitude' });
    }
    if (m.reflexosBonus) {
      result.resistances.reflexos += m.reflexosBonus;
      result.resistances.breakdown.push({ source, value: m.reflexosBonus, resistance: 'reflexos' });
    }
    if (m.vontadeBonus) {
      result.resistances.vontade += m.vontadeBonus;
      result.resistances.breakdown.push({ source, value: m.vontadeBonus, resistance: 'vontade' });
    }
    if (m.allResistancesBonus) {
      result.resistances.fortitude += m.allResistancesBonus;
      result.resistances.reflexos += m.allResistancesBonus;
      result.resistances.vontade += m.allResistancesBonus;
      result.resistances.breakdown.push({ source, value: m.allResistancesBonus, resistance: 'fortitude' });
      result.resistances.breakdown.push({ source, value: m.allResistancesBonus, resistance: 'reflexos' });
      result.resistances.breakdown.push({ source, value: m.allResistancesBonus, resistance: 'vontade' });
    }
    
    // === Redução de Dano ===
    if (m.damageReduction) {
      result.damageReduction.physical += m.damageReduction;
      result.damageReduction.breakdown.push({ source, value: m.damageReduction });
    }
    if (m.paranormalDamageReduction) {
      result.damageReduction.paranormal += m.paranormalDamageReduction;
      result.damageReduction.breakdown.push({ source, value: m.paranormalDamageReduction, type: 'mental' });
    }
    if (m.damageReductionByType) {
      for (const [type, value] of Object.entries(m.damageReductionByType)) {
        const t = type as DamageType;
        result.damageReduction.byType[t] = (result.damageReduction.byType[t] || 0) + value!;
        result.damageReduction.breakdown.push({ source, value: value!, type: t });
      }
    }
    
    // === Resistência a Dano ===
    if (m.damageResistance) {
      for (const [type, value] of Object.entries(m.damageResistance)) {
        const t = type as DamageType;
        result.damageResistance[t] = Math.max(result.damageResistance[t] || 0, value!);
      }
    }
    
    // === Perícias ===
    if (m.skillBonus) {
      for (const [skill, bonus] of Object.entries(m.skillBonus)) {
        if (!result.skills[skill]) {
          result.skills[skill] = { bonus: 0, sources: [] };
        }
        result.skills[skill].bonus += bonus!;
        result.skills[skill].sources.push(source);
      }
    }
    if (m.allSkillsBonus) {
      // Aplicado globalmente - cada componente deve usar
      result.skills['_all'] = { 
        bonus: (result.skills['_all']?.bonus || 0) + m.allSkillsBonus, 
        sources: [...(result.skills['_all']?.sources || []), source] 
      };
    }
    
    // === Recursos ===
    if (m.hpBonus) {
      result.resources.hpBonus += m.hpBonus;
      result.resources.breakdown.push({ source, value: m.hpBonus, resource: 'hp' });
    }
    if (m.hpBonusPerNex) {
      const bonus = m.hpBonusPerNex * Math.floor(context.nex / 5);
      result.resources.hpBonus += bonus;
      result.resources.breakdown.push({ source, value: bonus, resource: 'hp' });
    }
    if (m.peBonus) {
      result.resources.peBonus += m.peBonus;
      result.resources.breakdown.push({ source, value: m.peBonus, resource: 'pe' });
    }
    if (m.peBonusPerNex) {
      const bonus = m.peBonusPerNex * Math.floor(context.nex / 5);
      result.resources.peBonus += bonus;
      result.resources.breakdown.push({ source, value: bonus, resource: 'pe' });
    }
    if (m.sanityBonus) {
      result.resources.sanityBonus += m.sanityBonus;
      result.resources.breakdown.push({ source, value: m.sanityBonus, resource: 'sanity' });
    }
    if (m.tempHP) {
      result.resources.tempHP = Math.max(result.resources.tempHP, m.tempHP);
      result.resources.breakdown.push({ source, value: m.tempHP, resource: 'tempHP' });
    }
    
    // === Movimento ===
    if (m.movementBonus) {
      result.movement.bonus += m.movementBonus;
      result.movement.breakdown.push({ source, value: m.movementBonus });
    }
    if (m.movementMultiplier) {
      result.movement.multiplier *= m.movementMultiplier;
    }
    
    // === Iniciativa ===
    if (m.initiativeBonus) {
      result.initiative.bonus += m.initiativeBonus;
      result.initiative.breakdown.push({ source, value: m.initiativeBonus });
    }
    
    // === Efeitos Especiais ===
    if (m.specialEffects) {
      for (const eff of m.specialEffects) {
        result.specialEffects.push({ source, effect: eff });
      }
    }
    
    // === Proficiências ===
    if (m.grantsProficiency) {
      for (const prof of m.grantsProficiency) {
        if (!result.proficiencies.includes(prof)) {
          result.proficiencies.push(prof);
        }
      }
    }
    
    // === Flags ===
    if (m.cannotAct) result.flags.cannotAct = true;
    if (m.cannotReact) result.flags.cannotReact = true;
    if (m.cannotMove) result.flags.cannotMove = true;
    if (m.isHelpless) result.flags.isHelpless = true;
    if (m.isUnconscious) result.flags.isUnconscious = true;
    
    // =====================================================
    // RITUAIS - Processa mecânicas específicas de rituais
    // =====================================================
    
    // Bônus de DT geral
    if (m.ritualDTBonus) {
      result.rituals.dtBonus += m.ritualDTBonus;
      result.rituals.breakdown.push({ source, effect: `+${m.ritualDTBonus} DT em rituais` });
    }
    
    // Bônus de DT por elemento
    if (m.ritualDTBonusByElement) {
      for (const [element, bonus] of Object.entries(m.ritualDTBonusByElement)) {
        result.rituals.dtBonusByElement[element] = 
          (result.rituals.dtBonusByElement[element] || 0) + bonus!;
        result.rituals.breakdown.push({ source, effect: `+${bonus} DT rituais de ${element}` });
      }
    }
    
    // Bônus de dano/cura fixo
    if (m.ritualDamageBonus) {
      result.rituals.damageBonus += m.ritualDamageBonus;
      result.rituals.breakdown.push({ source, effect: `+${m.ritualDamageBonus} dano/cura rituais` });
    }
    
    // Bônus de dano/cura baseado em atributo (último ganha)
    if (m.ritualDamageAttributeBonus) {
      result.rituals.damageAttributeBonus = m.ritualDamageAttributeBonus;
      result.rituals.breakdown.push({ 
        source, 
        effect: `+${m.ritualDamageAttributeBonus.toUpperCase()} em dano/cura de rituais` 
      });
    }
    
    // Redução de PE geral
    if (m.ritualPEReduction) {
      result.rituals.peReduction += m.ritualPEReduction;
      result.rituals.breakdown.push({ source, effect: `-${m.ritualPEReduction} PE em rituais` });
    }
    
    // Redução de PE por elemento
    if (m.ritualPEReductionByElement) {
      for (const [element, reduction] of Object.entries(m.ritualPEReductionByElement)) {
        result.rituals.peReductionByElement[element] = 
          (result.rituals.peReductionByElement[element] || 0) + reduction!;
        result.rituals.breakdown.push({ source, effect: `-${reduction} PE rituais de ${element}` });
      }
    }
    
    // Redução de PE por alcance
    if (m.ritualPEReductionByRange) {
      for (const [range, reduction] of Object.entries(m.ritualPEReductionByRange)) {
        result.rituals.peReductionByRange[range] = 
          (result.rituals.peReductionByRange[range] || 0) + reduction!;
        result.rituals.breakdown.push({ source, effect: `-${reduction} PE rituais de alcance ${range}` });
      }
    }
    
    // Modificadores de trilha (Conduíte, etc.)
    if (m.ritualModifiers) {
      for (const mod of m.ritualModifiers) {
        result.rituals.availableModifiers.push({
          ...mod,
          source,
        });
        result.rituals.breakdown.push({ 
          source, 
          effect: `${mod.name}: ${mod.effect} (+${mod.peCost} PE)` 
        });
      }
    }
  }
  
  return result;
}

/**
 * Cria um contexto de cálculo padrão a partir de dados básicos
 */
export function createDefaultContext(params: {
  attributes: Record<AttributeType, number>;
  nex: number;
  hpCurrent: number;
  hpMax: number;
  peCurrent: number;
  peMax: number;
  activeConditions?: string[];
  activatedEffects?: string[];
  inCombat?: boolean;
  equippedWeaponType?: string;
  equippedArmorType?: string;
  hasShield?: boolean;
}): EffectCalculationContext {
  return {
    attributes: params.attributes,
    nex: params.nex,
    hpCurrent: params.hpCurrent,
    hpMax: params.hpMax,
    peCurrent: params.peCurrent,
    peMax: params.peMax,
    inCombat: params.inCombat ?? false,
    isFirstRound: false,
    currentRound: 0,
    equippedWeaponType: params.equippedWeaponType,
    equippedArmorType: params.equippedArmorType,
    hasShield: params.hasShield ?? false,
    activeConditions: params.activeConditions ?? [],
    activatedEffects: params.activatedEffects ?? [],
  };
}
