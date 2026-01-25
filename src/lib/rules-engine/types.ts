/**
 * Tipos do Motor de Regras Padronizado
 * Ordem Paranormal RPG v1.3
 * 
 * Define interfaces tipadas para as 4 funções principais:
 * - deriveCharacter: calcula estatísticas derivadas
 * - validateCharacter: valida personagem contra regras
 * - applyEffect: aplica efeitos ao estado
 * - rollAction: executa ações com rolagem
 */

// =====================================================
// TIPOS BASE
// =====================================================

export type ClassId = 'Combatente' | 'Especialista' | 'Ocultista';
export type AttributeKey = 'strength' | 'agility' | 'vigor' | 'intellect' | 'presence';
export type SkillTrainingLevel = 'destreinado' | 'treinado' | 'veterano' | 'expert';
export type ResistanceKey = 'fortitude' | 'reflexos' | 'vontade';

// =====================================================
// ESTADO DO PERSONAGEM (INPUT)
// =====================================================

/**
 * Estado completo do personagem para processamento pelo motor de regras
 */
export interface CharacterState {
  // Identificação
  id: string;
  name: string;
  playerName?: string;
  
  // Classe e progressão
  characterClass: ClassId;
  classTrack?: string;
  nex: number;
  origin: string;
  
  // Atributos base (0-5)
  attributes: Record<AttributeKey, number>;
  
  // Perícias e treinamentos
  skills: Record<string, SkillTrainingLevel>;
  
  // Poderes e habilidades
  classPowers: string[];           // IDs de poderes de classe
  generalPowers: string[];         // IDs de poderes gerais
  paranormalPowers: string[];      // IDs de poderes paranormais
  trackAbilities: string[];        // IDs de habilidades de trilha
  
  // Rituais
  rituals: string[];               // IDs de rituais conhecidos
  sustainedRituals: SustainedRitual[];
  
  // Equipamento
  equippedArmor?: EquippedArmor;
  equippedWeapons: EquippedWeapon[];
  inventory: InventoryItem[];
  
  // Condições ativas
  activeConditions: ActiveCondition[];
  
  // Recursos atuais
  hpCurrent: number;
  peCurrent: number;
  sanCurrent: number;
  
  // Estado de combate (opcional)
  combatState?: {
    inCombat: boolean;
    currentRound: number;
    currentTurn: number;
    peSpentThisTurn: number;
  };
  
  // Dados extras de origem (escolhas, etc.)
  originData?: {
    favoriteWeaponId?: string;
    bonusSkill?: string;
    paranormalPower?: string;
  };
  
  // Afinidade elemental (Ocultista)
  elementalAffinity?: string;
  affinityActive?: boolean;
}

// =====================================================
// SUBTIPOS DO ESTADO
// =====================================================

export interface SustainedRitual {
  ritualId: string;
  ritualName: string;
  element: string;
  circle: number;
  turnsActive: number;
  selectedEnhancements: string[];
  isConcentrating: boolean;
}

export interface EquippedArmor {
  id: string;
  name: string;
  category: 'leve' | 'pesada';
  defenseBonus: number;
  damageReduction?: number;
}

export interface EquippedWeapon {
  id: string;
  name: string;
  category: string;
  damage: string;
  criticalMargin: number;
  criticalMultiplier: number;
  range?: string;
  attackAttribute: 'strength' | 'agility';
  attackSkill: 'luta' | 'pontaria';
  isEquipped: boolean;
  properties?: string[];
  temporaryBuffs?: WeaponBuff[];
}

export interface WeaponBuff {
  sourceId: string;
  sourceName: string;
  bonusDamage?: string;
  bonusAttack?: number;
  element?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: number;
  spaces: number;
  quantity: number;
}

export interface ActiveCondition {
  conditionId: string;
  conditionName: string;
  stacks?: number;
  durationType: 'rounds' | 'scene' | 'permanent' | 'until-rest';
  durationRemaining?: number;
  sourceId?: string;
  sourceName?: string;
  params?: Record<string, unknown>;
}

// =====================================================
// ESTATÍSTICAS DERIVADAS (OUTPUT)
// =====================================================

/**
 * Estatísticas calculadas do personagem
 */
export interface DerivedStats {
  // Recursos máximos
  hpMax: number;
  peMax: number;
  sanMax: number;
  
  // Defesa
  defense: number;
  
  // Resistências
  resistances: {
    fortitude: number;
    reflexos: number;
    vontade: number;
  };
  
  // Limites
  peLimitPerTurn: number;
  peLimitPerCast: number;
  ritualsMaxCount: number;
  ritualsMaxCircle: number;
  
  // Movimento
  movement: number;
  
  // Combate
  attacks: DerivedAttack[];
  
  // Perícias com bônus consolidados
  skillBonuses: Record<string, number>;
  
  // Proficiências
  proficiencies: string[];
  
  // Breakdowns detalhados
  breakdowns: {
    hp: StatBreakdown;
    pe: StatBreakdown;
    san: StatBreakdown;
    defense: StatBreakdown;
    resistances: Record<ResistanceKey, StatBreakdown>;
    movement: StatBreakdown;
    peLimitPerTurn: StatBreakdown;
  };
}

export interface DerivedAttack {
  weaponId: string;
  weaponName: string;
  attackBonus: number;
  damageFormula: string;
  damageBonus: number;
  criticalMargin: number;
  criticalMultiplier: number;
  range?: string;
  breakdown: {
    attack: StatBreakdown;
    damage: StatBreakdown;
  };
}

/**
 * Breakdown de uma estatística mostrando fontes
 */
export interface StatBreakdown {
  total: number;
  base: number;
  sources: BreakdownSource[];
}

export interface BreakdownSource {
  name: string;
  sourceType: 'class' | 'origin' | 'track' | 'power' | 'equipment' | 'condition' | 'ritual' | 'skill' | 'attribute';
  value: number;
  description?: string;
}

// =====================================================
// VALIDAÇÃO
// =====================================================

export type ValidationSeverity = 'error' | 'warning' | 'info';

export interface ValidationIssue {
  severity: ValidationSeverity;
  ruleId: string;
  message: string;
  path?: string;                    // Caminho do campo com problema (ex: "attributes.strength")
  suggestedFix?: SuggestedFix;
  autoFixable?: boolean;
}

export interface SuggestedFix {
  action: 'set' | 'add' | 'remove' | 'recalculate';
  field: string;
  value?: unknown;
  description: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
  errorCount: number;
  warningCount: number;
}

// =====================================================
// EFEITOS
// =====================================================

export type EffectDuration = 
  | { type: 'instant' }
  | { type: 'rounds'; count: number }
  | { type: 'scene' }
  | { type: 'until-rest' }
  | { type: 'permanent' };

export type StackingRule = 'sum' | 'highest' | 'replace' | 'no-stack-same-source' | 'accumulate';

export interface EffectInstance {
  effectId: string;
  sourceId: string;
  sourceType: 'origin' | 'class' | 'track' | 'power' | 'condition' | 'ritual' | 'equipment';
  sourceName: string;
  duration: EffectDuration;
  stackRule: StackingRule;
  tags: string[];
  params?: Record<string, unknown>;
  
  // Modificadores mecânicos
  mechanics: EffectMechanics;
}

export interface EffectMechanics {
  // Combate
  attackBonus?: number;
  damageBonus?: number;
  defenseBonus?: number;
  criticalMarginBonus?: number;
  criticalMultiplierBonus?: number;
  
  // Resistências
  fortitudeBonus?: number;
  reflexosBonus?: number;
  vontadeBonus?: number;
  
  // Recursos
  hpBonus?: number;
  peBonus?: number;
  sanBonus?: number;
  
  // Perícias
  skillBonuses?: Record<string, number>;
  
  // Movimento
  movementBonus?: number;
  
  // Redução de dano
  damageReduction?: number;
  
  // Especiais
  tempHP?: number;
  extraDamageDice?: string;
  
  // Flags
  cannotAct?: boolean;
  cannotMove?: boolean;
  isHelpless?: boolean;
}

// =====================================================
// AÇÕES E ROLAGENS
// =====================================================

export type ActionType = 
  | 'skill-check'
  | 'resistance-check'
  | 'attack-roll'
  | 'damage-roll'
  | 'initiative-roll'
  | 'cast-ritual'
  | 'sustain-ritual'
  | 'activate-power'
  | 'apply-condition';

export interface GameAction {
  type: ActionType;
  actorId: string;
  targetId?: string;
  
  // Dados específicos por tipo
  skillCheck?: SkillCheckAction;
  resistanceCheck?: ResistanceCheckAction;
  attackRoll?: AttackRollAction;
  damageRoll?: DamageRollAction;
  initiativeRoll?: InitiativeRollAction;
  castRitual?: CastRitualAction;
  sustainRitual?: SustainRitualAction;
  activatePower?: ActivatePowerAction;
  applyCondition?: ApplyConditionAction;
}

export interface SkillCheckAction {
  skill: string;
  attribute?: AttributeKey;       // Override de atributo (Conhecimento Aplicado, etc.)
  dt?: number;
  modifiers?: number;
  activatedPowers?: string[];     // Poderes ativados para este teste
}

export interface ResistanceCheckAction {
  resistance: ResistanceKey;
  dt: number;
  modifiers?: number;
}

export interface AttackRollAction {
  weaponId: string;
  targetDefense?: number;
  modifiers?: number;
  activatedPowers?: string[];
}

export interface DamageRollAction {
  weaponId: string;
  isCritical: boolean;
  modifiers?: number;
}

export interface InitiativeRollAction {
  modifiers?: number;
}

export interface CastRitualAction {
  ritualId: string;
  selectedEnhancements: string[];
  targetId?: string;
  isTrueForm?: boolean;           // Verdadeira forma
  isDisciple?: boolean;           // Discípulo
}

export interface SustainRitualAction {
  sustainedRitualIndex: number;
  peCost: number;
}

export interface ActivatePowerAction {
  powerId: string;
  targetId?: string;
  params?: Record<string, unknown>;
}

export interface ApplyConditionAction {
  conditionId: string;
  targetId: string;
  stacks?: number;
  duration?: EffectDuration;
  sourceId?: string;
  sourceName?: string;
}

// =====================================================
// RESULTADO DE AÇÕES
// =====================================================

export interface ActionResult {
  success: boolean;
  
  // Resultado da rolagem
  roll?: RollResult;
  
  // Mudanças no estado
  stateChanges?: StateChange[];
  
  // Breakdown detalhado
  breakdown: ActionBreakdown;
  
  // Evento para log
  logEvent: LogEvent;
  
  // Erros/avisos
  errors?: string[];
  warnings?: string[];
}

export interface RollResult {
  diceRolled: number[];           // Resultados individuais dos dados
  diceKept: number[];             // Dados mantidos (após highest/lowest)
  baseValue: number;              // Valor base (atributo, perícia, etc.)
  modifiers: number;              // Soma de modificadores
  total: number;                  // Total final
  isCriticalSuccess?: boolean;
  isCriticalFailure?: boolean;
  naturalRoll?: number;           // Valor natural do d20 (para crítico)
}

export interface StateChange {
  field: string;
  oldValue: unknown;
  newValue: unknown;
  reason: string;
}

export interface ActionBreakdown {
  action: string;
  components: BreakdownComponent[];
  formula: string;
  result: string;
}

export interface BreakdownComponent {
  label: string;
  value: number | string;
  source?: string;
}

export interface LogEvent {
  timestamp: Date;
  type: ActionType | 'system' | 'error';
  actor: string;
  target?: string;
  message: string;
  details: Record<string, unknown>;
}

// =====================================================
// CONTEXTO DE CÁLCULO
// =====================================================

/**
 * Contexto para cálculos que dependem de situação
 */
export interface CalculationContext {
  // NEX para escalonamento
  nex: number;
  
  // Atributos
  attributes: Record<AttributeKey, number>;
  
  // Situação de combate
  inCombat?: boolean;
  isFirstRound?: boolean;
  
  // Tipo de ataque (para bônus condicionais)
  attackType?: 'melee' | 'ranged';
  
  // Arma em uso
  weaponType?: 'melee' | 'ranged' | 'firearm';
  weaponProperties?: string[];
  
  // Estado de saúde
  hpPercentage?: number;
  isDying?: boolean;
  
  // Alvo (para efeitos condicionais)
  targetIsUnaware?: boolean;
  targetConditions?: string[];
}
