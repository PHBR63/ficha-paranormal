/**
 * Sistema Unificado de Poderes de Classe - Ordem Paranormal RPG v1.3
 * Tipos e interfaces para definição estruturada de todos os poderes de classe
 * 
 * Este arquivo define a estrutura mecânica para poderes de todas as classes:
 * - Combatente: foco em combate, resistência e versatilidade física
 * - Especialista: foco em perícias, investigação e adaptabilidade
 * - Ocultista: foco em rituais, conhecimento paranormal e manipulação de PE
 */

// ================== TIPOS BASE ==================

/**
 * Identificador único de classe (conforme livro base)
 */
export type ClassId = 'Combatente' | 'Especialista' | 'Ocultista';

/**
 * Tipo de poder - como ele é ativado ou funciona
 */
export type PowerKind =
  | 'passive'      // Efeito permanente (Golpe Pesado, Reflexos Defensivos)
  | 'activated'    // Requer gasto de PE e/ou ação (Ataque Especial)
  | 'reaction'     // Usa reação (Ataque de Oportunidade)
  | 'triggered'    // Ativa automaticamente em condição específica
  | 'resource'     // Modifica recursos do personagem (Incansável)
  | 'proficiency'  // Concede proficiência (Armamento Pesado)
  | 'scaling'      // Efeito que escala com NEX automaticamente (Artista Marcial)
  | 'repeatable'   // Pode ser escolhido múltiplas vezes (Transcender)
  | 'choice';      // Requer escolha do jogador (Especialista em Elemento)

/**
 * Tipo de ação necessária para ativar o poder
 */
export type ActionType = 
  | 'free'         // Ação livre
  | 'movement'     // Ação de movimento  
  | 'standard'     // Ação padrão
  | 'complete'     // Ação completa
  | 'reaction'     // Reação
  | 'none';        // Não requer ação (passivo)

/**
 * Tipos de arma para condições de aplicação
 */
export type WeaponCategory = 
  | 'melee'                      // Corpo a corpo
  | 'ranged'                     // Disparo (arcos, bestas)
  | 'ranged-nonfirearm'          // Disparo SEM armas de fogo (Ninja Urbano)
  | 'firearm'                    // Armas de fogo
  | 'tactical'                   // Armas táticas
  | 'tactical-ranged-nonfirearm' // Táticas de disparo SEM fogo (Ninja Urbano)
  | 'heavy'                      // Armas pesadas
  | 'unarmed'                    // Desarmado
  | 'light-melee'                // Corpo a corpo leve
  | 'simple'                     // Armas simples
  | 'simple-melee'               // Simples corpo a corpo
  | 'simple-ranged'              // Simples de disparo
  | 'tactical-melee'             // Táticas corpo a corpo
  | 'any';                       // Qualquer arma

/**
 * Tipos de proteção
 */
export type ProtectionCategory = 'light' | 'heavy' | 'any';

/**
 * Atributos do sistema
 */
export type Attribute = 'strength' | 'agility' | 'vigor' | 'intellect' | 'presence';

/**
 * Perícias do sistema (lista oficial)
 */
export type Skill =
  | 'acrobacia' | 'adestramento' | 'artes' | 'atletismo'
  | 'atualidades' | 'ciencias' | 'crime' | 'diplomacia'
  | 'enganacao' | 'fortitude' | 'furtividade' | 'iniciativa'
  | 'intimidacao' | 'intuicao' | 'investigacao' | 'luta'
  | 'medicina' | 'ocultismo' | 'percepcao' | 'pilotagem'
  | 'pontaria' | 'profissao' | 'reflexos' | 'religiao'
  | 'sobrevivencia' | 'tatica' | 'tecnologia' | 'vontade';

/**
 * Graus de treinamento em perícias
 */
export type TrainingLevel = 'untrained' | 'trained' | 'veteran' | 'expert';

// ================== VALORES ESCALÁVEIS ==================

/**
 * Valor que escala com NEX (para progressão automática)
 */
export interface ScalingValue {
  baseValue: number;
  scaling: {
    nex: number;
    value: number;
  }[];
}

/**
 * Dado que escala com NEX
 */
export interface ScalingDice {
  baseDice: string;  // Ex: "1d6"
  scaling: {
    nex: number;
    dice: string;    // Ex: "1d8"
  }[];
}

/**
 * Fórmula de dado genérica
 */
export interface DiceFormula {
  count: number;      // Quantidade de dados
  sides: number;      // Lados do dado
  modifier?: number;  // Modificador fixo
  attribute?: Attribute; // Atributo como modificador
}

// ================== MODIFICADORES DE COMBATE ==================

/**
 * Bônus de ataque
 */
export interface AttackBonusConfig {
  value: number | ScalingValue;
  conditions?: PowerConditions;
}

/**
 * Bônus de dano
 */
export interface DamageBonusConfig {
  value?: number | string | ScalingValue;  // Número, fórmula de dado, ou escala (opcional se usar attribute ou extraDice)
  attribute?: Attribute;                   // Adiciona atributo ao dano
  extraDice?: string | ScalingDice;        // Dados extras (ex: "+1d")
  conditions?: PowerConditions;
}

/**
 * Modificador de margem de crítico
 */
export interface CriticalBonusConfig {
  marginBonus?: number;    // +X na margem de ameaça
  multiplierBonus?: number; // +X no multiplicador
  conditions?: PowerConditions;
}

/**
 * Redução de dano
 */
export interface DamageReductionConfig {
  value: number | ScalingValue;
  types?: string[];        // Tipos de dano afetados (vazio = todos)
  conditions?: PowerConditions;
}

// ================== MODIFICADORES DEFENSIVOS ==================

/**
 * Bônus de defesa
 */
export interface DefenseBonusConfig {
  value?: number | ScalingValue;
  attribute?: Attribute;  // Adiciona atributo à defesa (ex: Agilidade)
  conditions?: PowerConditions;
}

/**
 * Bônus em testes de resistência
 */
export interface ResistanceBonusConfig {
  value: number | ScalingValue;
  types?: ('fortitude' | 'reflexos' | 'vontade' | 'all' | 'poison' | 'fear' | 'paranormal')[];
  conditions?: PowerConditions;
}

// ================== MODIFICADORES DE PERÍCIA ==================

/**
 * Bônus em perícia específica
 */
export interface SkillBonusConfig {
  skill: Skill | Skill[];
  value: number | ScalingValue;
  conditions?: PowerConditions;
}

/**
 * Mudança de atributo-base de perícia
 */
export interface AttributeSwapConfig {
  skills?: Skill[];
  skill?: Skill;
  newAttribute: Attribute | Attribute[];
  cost?: number;  // Custo em PE
  forManeuver?: string;  // Para manobras específicas (ex: 'grapple')
}

/**
 * Treinamento em perícias concedido
 */
export interface SkillTrainingConfig {
  count: number;              // Quantidade base de perícias
  dynamicCount?: boolean;     // Se true, quantidade = count + Intelecto
  targetLevel: TrainingLevel; // Nível máximo de treinamento permitido
  allowMultipleLevels?: boolean; // Se true, permite escolher entre níveis (veterano OU expert)
  restrictions?: Skill[];     // Perícias específicas permitidas
}

// ================== DADOS EXTRAS ==================

/**
 * Configuração para poderes que concedem dados extras (ex: +1d20)
 * Usado por: Na Trilha Certa, Primeira Impressão
 */
export interface ExtraDiceConfig {
  die: string;            // Tipo do dado (ex: 'd20', 'd6')
  count: number;          // Quantidade de dados
  cumulative?: boolean;   // Se os bônus são cumulativos (Na Trilha Certa)
  skills?: Skill[];       // Perícias afetadas (Primeira Impressão)
  conditions?: PowerConditions; // Condições para aplicar
}

// ================== PROFICIÊNCIAS ==================

/**
 * Proficiências concedidas
 */
export interface ProficiencyConfig {
  weapons?: WeaponCategory[];
  protections?: ProtectionCategory[];
  special?: string[];  // Proficiências especiais (ex: "explosivos")
}

// ================== RECURSOS E CUSTOS ==================

/**
 * Configuração de ativação do poder
 */
export interface ActivationConfig {
  cost: number | ScalingValue;  // Custo em PE
  action: ActionType;
  perScene?: boolean;           // Limitado a uma vez por cena
  perRound?: boolean;           // Limitado a uma vez por rodada
  perDay?: boolean;             // Limitado a uma vez por dia
}

/**
 * Modificadores de custo de PE
 */
export interface PEModifierConfig {
  value: number;               // Redução (negativo) ou aumento (positivo)
  targets?: string[];          // Alvos específicos (ritual, elemento, etc)
  conditions?: PowerConditions;
}

/**
 * Ações adicionais concedidas
 */
export interface ExtraActionConfig {
  actionType: 'investigation' | 'attack' | 'movement' | 'standard';
  cost?: number;          // Custo em PE
  perScene?: boolean;
  attributeBase?: Attribute;  // Atributo alternativo para o teste
  skillBonus?: number;    // Bônus no teste
}

// ================== PRÉ-REQUISITOS ==================

/**
 * Pré-requisitos para obter o poder
 */
export interface PowerPrerequisites {
  minNex?: number;
  attributes?: Partial<Record<Attribute, number>>;
  skills?: {
    skill: Skill;
    level?: TrainingLevel;
  }[];
  powers?: string[];       // IDs de poderes necessários
  proficiencies?: string[];
}

// ================== CONDIÇÕES DE APLICAÇÃO ==================

/**
 * Condições para o poder se aplicar
 */
export interface PowerConditions {
  weaponType?: WeaponCategory | WeaponCategory[];
  protectionType?: ProtectionCategory;
  targetState?: ('unaware' | 'flanked' | 'prone' | 'grappled')[];
  targetConditions?: ('prone' | 'surprised' | 'flanked' | 'grappled' | 'unaware')[];
  onCritical?: boolean;
  onHit?: boolean;
  inCombat?: boolean;
  duringInvestigation?: boolean;
  firstInScene?: boolean;           // Apenas primeira vez na cena
  duringCharge?: boolean;           // Durante investida
  twoHanded?: boolean;              // Usando arma com duas mãos
  weaknessRevealed?: boolean;       // Fraqueza revelada por perícia
  crowdPresent?: boolean;           // Multidão presente
  onSuccessfulClueSearch?: boolean; // Após sucesso em procurar pistas (Na Trilha Certa)
}

// ================== MECÂNICAS DO PODER ==================

/**
 * Todas as mecânicas que um poder pode ter
 */
export interface PowerMechanics {
  /** Tipo principal do poder */
  kind: PowerKind;
  
  /** Configuração de ativação (se aplicável) */
  activation?: ActivationConfig;
  
  // === COMBATE OFENSIVO ===
  attackBonus?: AttackBonusConfig;
  /** Quantidade de d20 removidos de testes de ataque; separada do bônus numérico. */
  attackDicePenalty?: number;
  damageBonus?: DamageBonusConfig;
  criticalBonus?: CriticalBonusConfig;
  
  // === COMBATE DEFENSIVO ===
  defenseBonus?: DefenseBonusConfig;
  resistanceBonus?: ResistanceBonusConfig;
  damageReduction?: DamageReductionConfig;
  
  // === PERÍCIAS ===
  skillBonuses?: SkillBonusConfig[];
  attributeSwap?: AttributeSwapConfig;
  skillTraining?: SkillTrainingConfig;
  
  // === PROFICIÊNCIAS ===
  proficiencies?: ProficiencyConfig;
  
  // === RECURSOS ===
  peModifiers?: PEModifierConfig[];
  extraActions?: ExtraActionConfig[];
  
  // === ESPECIAIS ===
  grantsUnarmedDamage?: ScalingDice;  // Artista Marcial
  grantsAgileProperty?: boolean;       // Ataques ágeis
  
  // === CONDIÇÕES PARA APLICAR ===
  conditions?: PowerConditions;
  
  // === ESCOLHAS DO JOGADOR ===
  requiresChoice?: {
    type: 'element' | 'skill' | 'ritual' | 'power' | 'attribute' | 'weaponGroup' | 'item';
    count?: number;
    options?: string[];
  };
  
  // === PODERES CONCEDIDOS ===
  grantsPower?: string;  // ID de outro poder concedido (Transcender)
  noSanityGain?: boolean; // Não ganha Sanidade neste aumento de NEX (Transcender)
  
  // === DADOS EXTRAS (poderes que concedem +Xd20 ou similar) ===
  extraDice?: ExtraDiceConfig;
  
  // === RECURSOS ADICIONAIS ===
  movementBonus?: number;            // Bônus de deslocamento em metros
  hpBonus?: { perNex5?: number };    // Bônus de PV (por 5% de NEX)
  peBonus?: { perNex5?: number };    // Bônus de PE (por 5% de NEX)
  extraRituals?: number;             // Rituais extras conhecidos
  healingDice?: string;              // Dados de cura (ex: "1d6")
  damageType?: string;               // Tipo de dano concedido (ex: "paranormal")
  
  // === PV TEMPORÁRIO ===
  tempHP?: {
    value: number;
    duration: 'untilNextTurn' | 'scene' | 'rounds';
    rounds?: number;
  };
  
  // === BÔNUS DE ATRIBUTO ===
  attributeBonus?: {
    attribute: Attribute;
    value: number;
    max?: number;
  };
  
  // === RECUPERAÇÃO DE PE ===
  peRecovery?: {
    attribute?: Attribute;
    value?: number;
    minimum?: number;
  };
  
  // === PV COMO PE ===
  hpAsPE?: {
    ratio: number;  // Quantos PV por 1 PE (ex: 2)
  };
  
  // ==========================================
  // MECÂNICAS DE TRILHA (track-specific)
  // ==========================================
  
  // === REDUÇÃO DE CATEGORIA ===
  categoryReduction?: {
    amount: number;
    targetType: 'specific-weapon' | 'any-weapon' | 'item' | 'general-equipment';
    requiresChoice?: boolean;
    choiceDescription?: string;
    appliesToAllCarried?: boolean;
  };
  
  // === TÉCNICAS (Aniquilador) ===
  techniqueEffects?: Array<{
    id: string;
    name: string;
    description: string;
    peCost: number;
    effects: Record<string, number>;
  }>;
  
  // === LIDERANÇA (Comandante de Campo) ===
  leadership?: {
    range: 'touch' | 'short' | 'medium' | 'long';
    maxAllies?: number | 'intellect';
    allyEffects: Record<string, boolean>;
  };
  
  // === ATAQUE FURTIVO (Infiltrador) ===
  sneakAttack?: {
    scaling: Record<number, { dice: number; dieType: string }>;
    conditions: string[];
    peCost: number;
    usesPerRound: number;
  };
  
  // === CURA (Médico de Campo) ===
  healing?: {
    baseDice: string;
    scalingDice?: Record<number, { dice: number; dieType: string }>;
    peCost: number;
    extraDicePECost?: number;
    range: 'self' | 'touch' | 'short';
  };
  
  // === MODIFICADOR DE RITUAL (Conduíte) ===
  ritualModifier?: {
    type: 'range' | 'area' | 'speed' | 'cost' | 'resistance' | 'counter';
    additionalPECost: number;
    effect: string;
    specificRitual?: string;
  };
  
  // === CONTRA-MÁGICA (Anular Ritual) ===
  counterSpell?: {
    costMatchesTarget: boolean;
    testSkill: Skill;
    testType: 'opposed' | 'fixed';
  };
  
  // === RITUAL CONCEDIDO ===
  grantsRitual?: string;
  
  // === PE TEMPORÁRIO ===
  temporaryPE?: {
    trigger: string;
    amount: number | 'ritual-circle';
    maxPerScene?: number | 'pe-limit';
  };
  
  // === BÔNUS EM PERÍCIAS (múltiplas) ===
  skillBonus?: {
    skills: Skill[];
    bonus: number;
  };
  
  // === INICIATIVA ===
  initiativeBonus?: number;
  
  // === PV POR NEX ===
  hpPerNexPercent?: number;
  
  // === BLOQUEIO COM VIGOR ===
  blockVigorBonus?: boolean;
  
  // === RESISTÊNCIA PARANORMAL ===
  paranormalResistance?: number;
  
  // === BÔNUS DT RITUAL ===
  ritualDTBonus?: number;
  
  // === PROVOCAR (Tropa de Choque) ===
  taunt?: {
    range: string;
    resistanceTest: string;
    dtAttribute: string;
  };
  
  // === EFEITOS QUANDO MACHUCADO/MORRENDO ===
  whenWounded?: {
    defenseBonus: number;
    damageResistance: number;
  };
  whenDying?: {
    canAct: boolean;
    notHelpless: boolean;
  };
  
  // === DANO MÁXIMO EM CRÍTICO ===
  maximumDamageOnCritical?: {
    weaponType: string;
  };
  
  // === FURTIVIDADE ===
  stealthMovementPenalty?: boolean | {
    removes?: boolean;
    reducesBy?: number;
  };
  sneakAttackMultiplier?: number;
  ignoreStealthPenalty?: boolean | {
    movementPenalty?: boolean;
    armorPenalty?: boolean;
    allPenalties?: boolean;
  };
  
  // === CAPACIDADE DE CARGA ===
  carryCapacity?: {
    addAttribute: Attribute;
  };
  itemSpaceReduction?: number;
  
  // === REPARO ===
  repairEquipment?: {
    range: string;
    removeCondition: string;
  };
  
  // === REMOÇÃO DE CONDIÇÃO ===
  removeCondition?: {
    range: string;
    excludedConditions: string[];
  };
  
  // === RESSURREIÇÃO ===
  resurrect?: {
    excludedDeathTypes: string[];
    sameSceneOnly: boolean;
  };
  
  // === EFEITO SOCIAL ===
  socialEffect?: {
    range: string;
    targetAll: boolean;
    skillOptions: string[];
    resistanceSkill: string;
    effect: string;
    duration: string;
    concentrationAction?: 'free' | 'movement' | 'standard' | 'complete';  // Ação para manter concentração
    hostileBonus?: number;           // Bônus de resistência para alvos hostis/em combate
    hostileRetestPerRound?: boolean; // Novo teste por rodada para hostis
    immunityOnSuccess: string;
  };
  
  // === BUFF DE ALIADOS ===
  allyBuff?: {
    range: string;
    skillBonus?: number;        // Bônus numérico fixo (legado)
    skillDiceBonus?: number;    // Bônus em dados (+Xd20)
    bonusType?: 'flat' | 'dice';  // Tipo de bônus
    duration: string;
    includeSelf: boolean;
  };
  
  // === CONTATOS ===
  contacts?: {
    effects: string[];
    gmDiscretion: boolean;
  };
  
  // === COPIAR HABILIDADE ===
  copyAbility?: {
    source: string;
    seenInScene: boolean;
    ignorePrerequisites: boolean;
    payOriginalCosts: boolean;
  };
  
  // === CRIAR EQUIPAMENTO ===
  createEquipment?: {
    type: string;
    duration: string;
    destroyedAfter: boolean;
  };
  
  // === RETIRAR ITEM ===
  retrieveItem?: {
    excludeWeapons: boolean;
    retroactive: boolean;
  };
  
  // === MOVIMENTO LIVRE ===
  freeMovementTo?: {
    condition?: string;               // Condição única (legado v1.0)
    conditions?: string[];            // Múltiplas condições v1.3 (machucado OU morrendo)
    range?: 'touch' | 'short' | 'medium' | 'long';  // Alcance para ativar
    perRound: boolean;
  };
  
  // === BÔNUS AO CURAR ===
  onHeal?: {
    selfDefenseBonus?: number;        // Bônus para o curador (Resgate v1.3)
    targetDefenseBonus: number;
    duration: string;
  };
  
  // === CONTROLE DE ESTADO DO ALVO ===
  targetStateControl?: {
    options: string[];
    resistanceTest: string;
    dtAttribute: string;
  };
  
  // === OCULTISMO COMO ATAQUE ===
  occultismAsAttack?: boolean;
  
  // === MULTIPLICADOR DE ATAQUE ESPECIAL ===
  specialAttackMultiplier?: number;
  
  // === RITUAIS BÔNUS (Graduado) ===
  bonusRituals?: {
    perCircle: number;
    ignoresLimit: boolean;
  };
  
  // === GRIMÓRIO (Graduado) ===
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
  
  // === RESISTÊNCIA A DANO MENTAL ===
  mentalDamageResistance?: number;
  
  // === AÇÕES EXTRAS (Operações Especiais) ===
  extraActionsTrack?: Array<{
    type: string;
    trigger: string;
    weaponRestriction?: string;
    maneuverOptions?: string[];
    replaceDamage?: boolean;
  }>;
  
  // === REDUÇÃO DE DANO PARANORMAL ===
  paranormalDamageReduction?: {
    testSkill: Skill;
    onSuccess: 'negate' | 'half';
    onFailure: 'half' | 'full';
  };
  
  // === BÔNUS DE PODER DE RITUAL ===
  ritualPowerBonus?: {
    addPELimit: boolean;
    affectsDT: boolean;
  };
  
  // === PV RECUPERAÇÃO RESTRITA (Flagelador) ===
  hpRecoveryRestriction?: 'rest-only' | 'magic-only';
}

/**
 * Progressão por NEX - define mudanças em níveis específicos
 */
export interface PowerProgression {
  [nex: number]: Partial<PowerMechanics>;
}

// ================== INTERFACE PRINCIPAL ==================

/**
 * Interface unificada para um poder de classe
 * Combina descrição narrativa com mecânicas estruturadas
 */
export interface UnifiedClassPower {
  /** Identificador único do poder (snake_case) */
  id: string;
  
  /** Nome oficial conforme livro */
  name: string;
  
  /** Classe que possui este poder */
  classId: ClassId;
  
  /** ID da trilha (se for poder de trilha) */
  trackId?: string;
  
  /** Se é habilidade core (automática) ou escolhível */
  isCore?: boolean;
  
  /** NEX mínimo para obter */
  minNex: number;
  
  /** Descrição oficial do livro */
  description: string;
  
  /** Referência à página do livro */
  pageReference?: string;
  
  /** Mecânicas base do poder */
  effects: {
    base: PowerMechanics;
    progression?: PowerProgression;
  };
  
  /** Pré-requisitos além do NEX */
  prerequisites?: PowerPrerequisites;
  
  /** Se pode ser escolhido múltiplas vezes */
  isRepeatable?: boolean;
  
  /** Tags para categorização */
  tags?: string[];
}

// ================== TIPOS DE RUNTIME ==================

/**
 * Poder ativo em um personagem (com escolhas resolvidas)
 */
export interface ActiveClassPower {
  powerId: string;
  selectedAt: number;  // NEX em que foi selecionado
  choices?: {
    type: string;
    value: string | string[];
  };
}

/**
 * Resumo de bônus calculados dos poderes
 */
export interface PowerBonusSummary {
  attack: {
    general: number;
    melee: number;
    ranged: number;
    firearm: number;
  };
  damage: {
    general: number;
    melee: number;
    ranged: number;
    firearm: number;
    extraDice: string[];
    attributeBonuses: Attribute[];
  };
  defense: {
    base: number;
    conditional: number;
  };
  resistance: {
    fortitude: number;
    reflexos: number;
    vontade: number;
    all: number;
  };
  /** Redução de dano (Tanque de Guerra, etc.) */
  damageReduction: {
    physical: number;      // RD física geral
    paranormal: number;    // RD paranormal
    conditional: number;   // RD condicional (proteção pesada, etc.)
  };
  skills: Record<string, number>;
  proficiencies: {
    weapons: WeaponCategory[];
    protections: ProtectionCategory[];
  };
  peReductions: {
    target: string;
    value: number;
  }[];
  unarmedDamage?: string;
  specialFlags: string[];
}

/**
 * Contexto para cálculo de bônus (situação atual)
 */
export interface PowerCalculationContext {
  nex: number;
  attributes: Record<Attribute, number>;
  equippedWeaponType?: WeaponCategory;
  equippedProtectionType?: ProtectionCategory;
  isAttacking?: boolean;
  isDefending?: boolean;
  inCombat?: boolean;
  inInvestigation?: boolean;
  targetState?: string[];
}
