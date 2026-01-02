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
  // EQUIPAMENTO E INVENTÁRIO
  // =====================================================
  
  // === Redução de Categoria de Equipamento ===
  categoryReduction?: {
    amount: number;                          // Quantidade da redução (-1, -2)
    targetType: 'specific-weapon' | 'any-weapon' | 'item'; // Tipo de alvo
    requiresChoice?: boolean;                // Se requer escolha do jogador
    choiceDescription?: string;              // Descrição da escolha
    appliesToAllCarried?: boolean;           // Se aplica a todos itens carregados
  };
  
  // === Contra-Mágica ===
  counterSpell?: {
    costMatchesTarget: boolean;              // PE = custo do ritual alvo
    testSkill: string;                       // Perícia do teste (Ocultismo)
    testType: 'opposed' | 'fixed';           // Tipo de teste
  };
  
  // === Ataque Furtivo (Infiltrador) ===
  sneakAttack?: {
    baseDice: number;                        // Quantidade de dados base
    dieType: string;                         // Tipo de dado (d6)
    scaling?: Record<number, { dice: number; dieType: string }>; // Escala por NEX
    conditions: string[];                    // Condições requeridas (alvo desprevenido, etc)
    peCost: number;                          // Custo em PE
    usesPerRound: number;                    // Usos por rodada
    multiplier?: number;                     // Multiplicador (Assassinar)
  };
  
  // === Cura (Médico de Campo) ===
  healing?: {
    baseDice: number;                        // Quantidade de dados base
    dieType: string;                         // Tipo de dado (d10)
    scaling?: Record<number, { dice: number; dieType: string }>; // Escala por NEX
    peCost: number;                          // Custo base em PE
    extraDicePECost?: number;                // Custo por dado extra (+1 PE por dado)
    range: 'self' | 'touch' | 'short';       // Alcance
    actionType?: 'standard' | 'movement' | 'complete'; // Tipo de ação
  };
  
  // === Liderança (Comandante de Campo) ===
  leadership?: {
    range: 'curto' | 'medio' | 'longo' | 'alcance-voz'; // Alcance do efeito
    maxAllies: number | 'intellect' | 'presence';       // Máximo de aliados afetados
    peCost: number;                                      // Custo em PE
    actionType: 'free' | 'reaction' | 'standard';        // Tipo de ação
    usesPerRound?: number;                               // Usos por rodada
    usesPerScene?: number;                               // Usos por cena
    allyEffects: {
      rerollTest?: boolean;                              // Aliado pode rerolar um teste
      extraMovementAction?: boolean;                     // Ação de movimento extra
      extraAttack?: boolean;                             // Ataque adicional
      extraStandardAction?: boolean;                     // Ação padrão extra
      tempHP?: number;                                   // PV temporários
      bonusToNextTest?: number;                          // Bônus no próximo teste
    };
    scaling?: Record<number, {                           // Progressão por NEX
      maxAllies?: number | 'intellect' | 'presence';
      peCost?: number;
      allyEffects?: {
        rerollTest?: boolean;
        extraMovementAction?: boolean;
        extraAttack?: boolean;
        extraStandardAction?: boolean;
        tempHP?: number;
        bonusToNextTest?: number;
      };
    }>;
  };
  
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
    type: 'range' | 'action' | 'area' | 'duration' | 'counter'; // Tipo de modificação
    effect: string;                // Descrição do efeito
    peCost: number;                // Custo adicional em PE (0 para custo variável)
    perRound?: boolean;            // Se aplica por rodada
    isActivatable?: boolean;       // Se requer ativação manual
    variableCost?: boolean;        // Se true, custo é igual ao ritual alvo (Anular Ritual)
    actionType?: 'reaction';       // Tipo de ação necessária
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
  // EQUIPAMENTO E INVENTÁRIO
  // =====================================================
  inventory: {
    // Reduções de categoria de equipamento (Aniquilador, Técnico)
    categoryReductions: Array<{
      amount: number;
      targetType: 'specific-weapon' | 'any-weapon' | 'item';
      source: string;
      requiresChoice?: boolean;
      appliesToAllCarried?: boolean;
    }>;
    totalCategoryReduction: number;    // Soma de todas as reduções
  };
  
  // === Habilidades de Contra-Mágica ===
  counterSpellAbilities: Array<{
    source: string;
    costMatchesTarget: boolean;
    testSkill: string;
    testType: 'opposed' | 'fixed';
  }>;
  
  // === Ataque Furtivo ===
  sneakAttack: {
    available: boolean;                      // Se o personagem tem Ataque Furtivo
    baseDice: number;                        // Dados base para o NEX atual
    dieType: string;                         // Tipo de dado (d6)
    conditions: string[];                    // Condições requeridas
    peCost: number;                          // Custo em PE
    usesPerRound: number;                    // Usos por rodada
    multiplier: number;                      // Multiplicador (1 = normal, 2 = Assassinar)
    totalDice: number;                       // Dados totais com multiplicador
    sources: Array<{
      source: string;
      dice: number;
      dieType: string;
      multiplier?: number;
    }>;
  };
  
  // === Cura (Médico de Campo) ===
  healing: {
    available: boolean;                      // Se o personagem tem habilidade de cura
    baseDice: number;                        // Dados base para o NEX atual
    dieType: string;                         // Tipo de dado (d10)
    peCost: number;                          // Custo base em PE
    extraDicePECost: number;                 // Custo por dado adicional
    range: 'self' | 'touch' | 'short';       // Alcance
    actionType: 'standard' | 'movement' | 'complete'; // Tipo de ação
    sources: Array<{
      source: string;
      dice: number;
      dieType: string;
      peCost: number;
    }>;
  };
  
  // === Liderança (Comandante de Campo) ===
  leadership: {
    available: boolean;                      // Se o personagem tem habilidades de liderança
    abilities: Array<{
      id: string;                            // ID único da habilidade
      name: string;                          // Nome para exibição
      range: 'curto' | 'medio' | 'longo' | 'alcance-voz';
      maxAllies: number | 'intellect' | 'presence';
      peCost: number;
      actionType: 'free' | 'reaction' | 'standard';
      usesPerRound?: number;
      usesPerScene?: number;
      allyEffects: {
        rerollTest?: boolean;
        extraMovementAction?: boolean;
        extraAttack?: boolean;
        extraStandardAction?: boolean;
        tempHP?: number;
        bonusToNextTest?: number;
      };
      source: string;                        // Fonte da habilidade
    }>;
    // Resumo consolidado de todos os efeitos disponíveis
    availableEffects: {
      rerollTest: boolean;
      extraMovementAction: boolean;
      extraAttack: boolean;
      extraStandardAction: boolean;
      tempHP: number;
      bonusToNextTest: number;
    };
  };
  
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
      type: 'range' | 'action' | 'area' | 'duration' | 'counter';
      effect: string;
      peCost: number;
      perRound?: boolean;
      isActivatable?: boolean;
      variableCost?: boolean;
      actionType?: 'reaction';
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
    // === EQUIPAMENTO E INVENTÁRIO ===
    inventory: {
      categoryReductions: [],
      totalCategoryReduction: 0,
    },
    // === CONTRA-MÁGICA ===
    counterSpellAbilities: [],
    // === ATAQUE FURTIVO ===
    sneakAttack: {
      available: false,
      baseDice: 0,
      dieType: 'd6',
      conditions: [],
      peCost: 0,
      usesPerRound: 0,
      multiplier: 1,
      totalDice: 0,
      sources: [],
    },
    // === CURA ===
    healing: {
      available: false,
      baseDice: 0,
      dieType: 'd10',
      peCost: 0,
      extraDicePECost: 0,
      range: 'touch',
      actionType: 'standard',
      sources: [],
    },
    // === LIDERANÇA ===
    leadership: {
      available: false,
      abilities: [],
      availableEffects: {
        rerollTest: false,
        extraMovementAction: false,
        extraAttack: false,
        extraStandardAction: false,
        tempHP: 0,
        bonusToNextTest: 0,
      },
    },
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
    // EQUIPAMENTO E INVENTÁRIO
    // =====================================================
    
    // === Redução de Categoria ===
    if (m.categoryReduction) {
      result.inventory.categoryReductions.push({
        amount: m.categoryReduction.amount,
        targetType: m.categoryReduction.targetType,
        source,
        requiresChoice: m.categoryReduction.requiresChoice,
        appliesToAllCarried: m.categoryReduction.appliesToAllCarried,
      });
      result.inventory.totalCategoryReduction += m.categoryReduction.amount;
    }
    
    // === Contra-Mágica ===
    if (m.counterSpell) {
      result.counterSpellAbilities.push({
        source,
        costMatchesTarget: m.counterSpell.costMatchesTarget,
        testSkill: m.counterSpell.testSkill,
        testType: m.counterSpell.testType,
      });
    }
    
    // === Ataque Furtivo ===
    if (m.sneakAttack) {
      result.sneakAttack.available = true;
      
      // Calcula dados baseado no NEX do contexto
      let dice = m.sneakAttack.baseDice;
      const dieType = m.sneakAttack.dieType;
      
      // Aplica escalonamento por NEX se disponível
      if (m.sneakAttack.scaling) {
        const nexThresholds = Object.keys(m.sneakAttack.scaling)
          .map(Number)
          .sort((a, b) => b - a); // Ordem decrescente
        
        for (const threshold of nexThresholds) {
          if (context.nex >= threshold) {
            const scaling = m.sneakAttack.scaling[threshold];
            dice = scaling.dice;
            break;
          }
        }
      }
      
      // Aplica multiplicador (Assassinar)
      const multiplier = m.sneakAttack.multiplier ?? 1;
      if (multiplier > result.sneakAttack.multiplier) {
        result.sneakAttack.multiplier = multiplier;
      }
      
      // Atualiza dados base (maior valor ganha)
      if (dice > result.sneakAttack.baseDice) {
        result.sneakAttack.baseDice = dice;
        result.sneakAttack.dieType = dieType;
      }
      
      // Merge condições
      if (m.sneakAttack.conditions) {
        for (const cond of m.sneakAttack.conditions) {
          if (!result.sneakAttack.conditions.includes(cond)) {
            result.sneakAttack.conditions.push(cond);
          }
        }
      }
      
      // Custo e usos (primeiro a definir)
      if (result.sneakAttack.peCost === 0) {
        result.sneakAttack.peCost = m.sneakAttack.peCost;
      }
      if (result.sneakAttack.usesPerRound === 0) {
        result.sneakAttack.usesPerRound = m.sneakAttack.usesPerRound;
      }
      
      // Registra fonte
      result.sneakAttack.sources.push({
        source,
        dice,
        dieType,
        multiplier: m.sneakAttack.multiplier,
      });
      
      // Calcula total com multiplicador
      result.sneakAttack.totalDice = result.sneakAttack.baseDice * result.sneakAttack.multiplier;
    }
    
    // === Cura (Médico de Campo) ===
    if (m.healing) {
      result.healing.available = true;
      
      // Calcula dados baseado no NEX do contexto
      let dice = m.healing.baseDice;
      const dieType = m.healing.dieType;
      
      // Aplica escalonamento por NEX se disponível
      if (m.healing.scaling) {
        const nexThresholds = Object.keys(m.healing.scaling)
          .map(Number)
          .sort((a, b) => b - a); // Ordem decrescente
        
        for (const threshold of nexThresholds) {
          if (context.nex >= threshold) {
            const scaling = m.healing.scaling[threshold];
            dice = scaling.dice;
            break;
          }
        }
      }
      
      // Atualiza dados base (maior valor ganha)
      if (dice > result.healing.baseDice) {
        result.healing.baseDice = dice;
        result.healing.dieType = dieType;
      }
      
      // Custo em PE (primeiro a definir)
      if (result.healing.peCost === 0) {
        result.healing.peCost = m.healing.peCost;
      }
      
      // Custo por dado extra
      if (m.healing.extraDicePECost && result.healing.extraDicePECost === 0) {
        result.healing.extraDicePECost = m.healing.extraDicePECost;
      }
      
      // Range e action type (primeiro a definir)
      if (m.healing.range) {
        result.healing.range = m.healing.range;
      }
      if (m.healing.actionType) {
        result.healing.actionType = m.healing.actionType;
      }
      
      // Registra fonte
      result.healing.sources.push({
        source,
        dice,
        dieType,
        peCost: m.healing.peCost,
      });
    }
    
    // === Liderança (Comandante de Campo) ===
    if (m.leadership) {
      result.leadership.available = true;
      
      // Calcula maxAllies e allyEffects baseado no NEX se houver scaling
      let maxAllies = m.leadership.maxAllies;
      let allyEffects = { ...m.leadership.allyEffects };
      let peCost = m.leadership.peCost;
      
      if (m.leadership.scaling) {
        const nexThresholds = Object.keys(m.leadership.scaling)
          .map(Number)
          .sort((a, b) => b - a); // Ordem decrescente
        
        for (const threshold of nexThresholds) {
          if (context.nex >= threshold) {
            const scaling = m.leadership.scaling[threshold];
            if (scaling.maxAllies !== undefined) maxAllies = scaling.maxAllies;
            if (scaling.peCost !== undefined) peCost = scaling.peCost;
            if (scaling.allyEffects) {
              allyEffects = { ...allyEffects, ...scaling.allyEffects };
            }
            break;
          }
        }
      }
      
      // Adiciona habilidade à lista
      result.leadership.abilities.push({
        id: effect.id,
        name: effect.name,
        range: m.leadership.range,
        maxAllies,
        peCost,
        actionType: m.leadership.actionType,
        usesPerRound: m.leadership.usesPerRound,
        usesPerScene: m.leadership.usesPerScene,
        allyEffects,
        source,
      });
      
      // Consolida efeitos disponíveis
      if (allyEffects.rerollTest) {
        result.leadership.availableEffects.rerollTest = true;
      }
      if (allyEffects.extraMovementAction) {
        result.leadership.availableEffects.extraMovementAction = true;
      }
      if (allyEffects.extraAttack) {
        result.leadership.availableEffects.extraAttack = true;
      }
      if (allyEffects.extraStandardAction) {
        result.leadership.availableEffects.extraStandardAction = true;
      }
      if (allyEffects.tempHP) {
        result.leadership.availableEffects.tempHP = Math.max(
          result.leadership.availableEffects.tempHP,
          allyEffects.tempHP
        );
      }
      if (allyEffects.bonusToNextTest) {
        result.leadership.availableEffects.bonusToNextTest = Math.max(
          result.leadership.availableEffects.bonusToNextTest,
          allyEffects.bonusToNextTest
        );
      }
    }
    
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
