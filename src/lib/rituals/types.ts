/**
 * Ordem Paranormal RPG - Sistema Unificado de Rituais
 * Interfaces e tipos centrais para o sistema de rituais
 * 
 * Este arquivo é a DEFINIÇÃO CENTRAL de todos os tipos relacionados a rituais.
 * Qualquer componente que trabalhe com rituais deve importar daqui.
 */

// ========================================
// TIPOS BÁSICOS
// ========================================

/** Elementos paranormais disponíveis para rituais */
export type RitualElement = 'sangue' | 'morte' | 'conhecimento' | 'energia' | 'medo';

/** Círculos de poder (níveis de rituais) */
export type RitualCircle = 1 | 2 | 3 | 4;

/** Tipos de execução de rituais */
export type ExecutionType = 
  | 'Padrão' 
  | 'Completa' 
  | 'Reação' 
  | 'Livre' 
  | 'Ritual';

/** Alcances possíveis */
export type RangeType = 
  | 'Pessoal' 
  | 'Toque' 
  | 'Curto' 
  | 'Médio' 
  | 'Longo' 
  | 'Ilimitado'
  | 'Especial';

/** Tipos de duração */
export type DurationType = 
  | 'Instantânea' 
  | 'Cena' 
  | 'Sustentada' 
  | 'Permanente' 
  | 'Especial'
  | '1 dia'
  | '1 semana';

// ========================================
// TIPOS DE EFEITOS E DANO
// ========================================

/** Classificação semântica do ritual */
export type RitualKind = 
  | 'damage'           // Dano direto padrão
  | 'buff'             // Modificadores numéricos temporários
  | 'debuff'           // Penalidades ao alvo
  | 'healing'          // Cura/restauração
  | 'stateOverride'    // Altera regras do jogo (Medo Tangível, Alterar Destino)
  | 'narrativeOverride' // Encerra personagem/história (Martírio de Sangue)
  | 'sense'            // Divinação/detecção (Detecção de Ameaças, Localização)
  | 'interceptor'      // Reage a eventos (Desacelerar Impacto, Tela de Ruído)
  | 'summon'           // Invocação de entidades
  | 'control'          // Controle mental/físico
  | 'transformation'   // Transformação física
  | 'utility';         // Efeitos utilitários diversos

/** Tipos de dano físico */
export type PhysicalDamageType = 'corte' | 'perfuração' | 'impacto' | 'balístico';

/** Tipos de dano elemental */
export type ElementalDamageType = 'fogo' | 'frio' | 'eletricidade' | 'ácido' | 'químico';

/** Tipos de dano paranormal */
export type ParanormalDamageType = 'energia' | 'sangue' | 'morte' | 'conhecimento' | 'medo';

/** Tipos de dano especial */
export type SpecialDamageType = 'mental' | 'sanidade' | 'verdadeiro';

/** Todos os tipos de dano */
export type AnyDamageType = PhysicalDamageType | ElementalDamageType | ParanormalDamageType | SpecialDamageType;

// ========================================
// SISTEMA DE RESISTÊNCIA
// ========================================

/** Tipos de teste de resistência */
export type ResistanceType = 'fortitude' | 'reflexos' | 'vontade';

/** Efeito da resistência */
export type ResistanceEffect = 'anula' | 'parcial' | 'reduz_metade';

/** Configuração de resistência para um ritual */
export interface ResistanceConfig {
  type: ResistanceType;
  effect: ResistanceEffect;
  dt?: number; // DT customizado, se não for padrão
}

// ========================================
// FÓRMULAS DE DADOS
// ========================================

/** Fórmula de rolagem de dados genérica */
export interface DiceFormula {
  diceCount: number;
  diceType: 4 | 6 | 8 | 10 | 12 | 20;
  bonus?: number;
}

/** Fórmula específica para dano */
export interface DamageFormula extends DiceFormula {
  damageType: AnyDamageType;
  ignoresResistance?: boolean;
  ignoresRD?: boolean;
  isAbsolute?: boolean;
}

/** Fórmula para cura */
export interface HealingFormula extends DiceFormula {
  removesConditions?: string[];
}

/** Fórmula para PV temporários */
export interface TempHPFormula extends DiceFormula {
  duration?: 'cena' | 'sustentado' | number; // número de turnos
}

// ========================================
// SISTEMA DE CONDIÇÕES
// ========================================

/** Condição aplicada por um ritual */
export interface AppliedCondition {
  id: string;
  duration: 'rodada' | 'cena' | 'sustentado' | 'permanente' | number;
  savingThrow?: ResistanceType;
  saveEnds?: boolean; // Pode testar para remover todo turno
}

// ========================================
// MODIFICADORES DE COMBATE
// ========================================

/** Bônus em perícias específicas */
export interface SkillBonusConfig {
  skills: string[];
  bonus: number | string; // número ou fórmula como "1d6"
  isContextual?: boolean;
  context?: string;
}

/** Redução de dano */
export interface DamageReductionConfig {
  types: AnyDamageType[];
  amount: number;
}

/** Efeito em arma */
export interface WeaponEffectConfig {
  damageBonus?: number | string; // número ou fórmula como "1d6"
  damageType?: AnyDamageType;
  extraDice?: DiceFormula;
  attackBonus?: number;
  criticalBonus?: number; // Bônus na margem de ameaça
  criticalMultiplierBonus?: number;
  special?: string;
  isPermanentWound?: boolean;
}

/** Restrições de ação */
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

// ========================================
// SISTEMA DE SUSTENTAÇÃO
// ========================================

/** Configuração de sustentação do ritual */
export interface SustainConfig {
  costPerTurn?: number; // PE por turno
  action?: 'free' | 'move' | 'standard' | 'full';
  concentration?: boolean;
  maxDuration?: number; // Duração máxima em turnos
  endTriggers?: string[]; // Gatilhos que encerram o ritual
}

// ========================================
// SISTEMA DE HOOKS (GATILHOS)
// ========================================

/** Tipos de gatilho para hooks */
export type HookTrigger = 
  | 'onRoll'              // Quando um dado é rolado
  | 'onPreDamage'         // Antes do dano ser aplicado
  | 'onPostDamage'        // Depois do dano ser aplicado
  | 'onFallDamage'        // Quando sofre dano de queda
  | 'onProjectileHit'     // Quando atingido por projétil
  | 'onReduceHP'          // Quando PV seria reduzido
  | 'onTurnStart'         // No início do turno
  | 'onTurnEnd'           // No fim do turno
  | 'onDeath'             // Quando morreria
  | 'onCast'              // Quando conjura ritual
  | 'onConcentrationBreak' // Quando concentração é quebrada
  | 'onResistancePass';   // Quando alvo passa no teste de resistência

/** Definição de um hook */
export interface RitualHook {
  trigger: HookTrigger;
  effect: string; // Descrição do efeito
  condition?: string; // Condição para ativar
  priority?: number; // Ordem de processamento (maior = primeiro)
}

// ========================================
// SISTEMA DE MODOS
// ========================================

/** Modo alternativo de um ritual */
export interface RitualMode {
  name: string;
  description: string;
  casterConditions?: string[]; // Condições aplicadas ao conjurador
  targetConditions?: string[]; // Condições aplicadas ao alvo
  effect?: Partial<RitualMechanics>; // Efeitos mecânicos específicos do modo
}

// ========================================
// EFEITOS MECÂNICOS (CORE)
// ========================================

/** Todos os efeitos mecânicos de um ritual em um nível específico */
export interface RitualMechanics {
  kind: RitualKind;
  
  // === EFEITOS NUMÉRICOS ===
  damage?: DamageFormula;
  damagePerTurn?: DamageFormula;
  healing?: HealingFormula;
  tempHP?: TempHPFormula;
  
  // === MODIFICADORES ===
  attackBonus?: number;
  damageBonus?: number | string;
  defenseBonus?: number;
  skillBonus?: SkillBonusConfig;
  resistanceBonus?: number; // Bônus em testes de resistência
  
  // === RESISTÊNCIAS E REDUÇÕES ===
  damageReduction?: DamageReductionConfig;
  resistance?: ResistanceConfig; // Resistência que o ALVO pode fazer
  
  // === CONDIÇÕES ===
  conditions?: AppliedCondition[];
  actionRestrictions?: ActionRestriction[];
  
  // === EFEITOS EM ARMA ===
  weaponEffect?: WeaponEffectConfig;
  
  // === SUSTENTAÇÃO ===
  sustain?: SustainConfig;
  
  // === HOOKS ===
  hooks?: RitualHook[];
  
  // === MODOS ===
  modes?: RitualMode[];
  
  // === ÁREA ===
  areaEffect?: {
    shape: 'esfera' | 'cone' | 'linha' | 'cubo' | 'cilindro' | 'emanação';
    radius?: number;
    length?: number;
    width?: number;
  };
  
  // === EFEITOS SENSORIAIS ===
  senseEffect?: {
    type: 'detect' | 'locate' | 'scry' | 'commune';
    range?: number;
    targets?: string[];
    information?: string;
  };
  
  // === CONTROLE MENTAL ===
  mentalControl?: {
    type: 'charm' | 'dominate' | 'suggestion' | 'fear' | 'possession';
    canForceHarm?: boolean;
    canForceSuicide?: boolean;
    breakConditions?: string[];
  };
  
  // === DESCRIÇÃO ===
  summary: string; // Resumo em texto do efeito
}

// ========================================
// APRIMORAMENTOS
// ========================================

/** Aprimoramento de ritual (Discente/Verdadeiro) */
export interface RitualEnhancement {
  name: 'Discente' | 'Verdadeiro';
  cost: number;
  description: string;
  circleReq?: RitualCircle; // Círculo mínimo requerido
  affinityReq?: boolean; // Requer afinidade com o elemento
}

// ========================================
// INTERFACE PRINCIPAL: RITUAL UNIFICADO
// ========================================

/**
 * Interface principal que representa um ritual completo.
 * Esta é a FONTE ÚNICA DE VERDADE para todas as informações de um ritual.
 */
export interface UnifiedRitual {
  // === IDENTIDADE ===
  id: string;
  name: string;
  circle: RitualCircle;
  element: RitualElement;
  
  // === METADADOS DO LIVRO ===
  execution: ExecutionType;
  range: RangeType;
  target?: string;
  area?: string;
  duration: DurationType;
  description: string; // Descrição completa oficial
  cost: number; // Custo base em PE
  pageReference?: string; // "Livro Base p.XXX"
  
  // === RESISTÊNCIA ===
  resistance?: ResistanceConfig;
  
  // === EFEITOS MECÂNICOS POR NÍVEL ===
  effects: {
    base: RitualMechanics;
    discente?: RitualMechanics;
    verdadeiro?: RitualMechanics;
  };
  
  // === APRIMORAMENTOS ===
  enhancements?: RitualEnhancement[];
  
  // === FLAGS ESPECIAIS ===
  isWeaponBuff?: boolean; // Ritual que encanta armas
  isSustainable?: boolean; // Pode ser sustentado
  requiresConcentration?: boolean; // Requer concentração
  hasModes?: boolean; // Possui modos alternativos
  hasHooks?: boolean; // Possui gatilhos especiais
}

// ========================================
// TIPOS PARA ESTADO DE RUNTIME
// ========================================

/** Ritual ativo/sustentado em tempo de execução */
export interface ActiveRitual {
  instanceId: string; // ID único da instância
  ritualId: string;
  ritualName: string;
  level: 'base' | 'discente' | 'verdadeiro';
  casterId: string;
  casterName: string;
  targetId?: string;
  targetName?: string;
  turnsActive: number;
  peSpentTotal: number;
  isConcentrating: boolean;
  startedRound: number;
  expiresRound?: number;
  activeMode?: string;
  selectedEnhancements: string[];
}

/** Resultado de conjuração */
export interface CastResult {
  success: boolean;
  ritualId: string;
  level: 'base' | 'discente' | 'verdadeiro';
  peSpent: number;
  damage?: number;
  healing?: number;
  conditionsApplied: string[];
  bonusesApplied: string[];
  message: string;
  activeRitual?: ActiveRitual;
}

/** Resultado de validação de conjuração */
export interface CastValidation {
  canCast: boolean;
  reasons: string[];
  peRequired: number;
  circleRequired: RitualCircle;
  hasAffinity: boolean;
  meetsCircleReq: boolean;
  hasSufficientPE: boolean;
  withinTurnLimit: boolean;
}
