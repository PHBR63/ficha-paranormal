/**
 * Ordem Paranormal RPG - Motor de Efeitos de Rituais
 * Aplica automaticamente os efeitos mecânicos de rituais nas fichas e campanhas
 * 
 * Este motor é responsável por:
 * - Calcular bônus ativos de rituais sustentados
 * - Aplicar condições de rituais
 * - Processar hooks de rituais (gatilhos de evento)
 * - Gerenciar dano, cura e efeitos especiais
 */

import { 
  getRitualById, 
  getRitualEffect, 
  getEffectiveLevel,
  calculateRitualCost,
} from './ritual-registry';
import type { 
  UnifiedRitual, 
  RitualMechanics,
  RitualHook,
  AppliedCondition,
  WeaponEffectConfig,
  DamageReductionConfig,
  SkillBonusConfig,
  SustainConfig,
  RitualDamage,
  RitualHealing,
} from './types';

// ========================================
// TYPE GUARDS
// ========================================

function isRitualDamage(value: unknown): value is RitualDamage {
  return typeof value === 'object' && value !== null && 'diceCount' in value && 'diceType' in value;
}

function isRitualHealing(value: unknown): value is RitualHealing {
  return typeof value === 'object' && value !== null && 'diceCount' in value && 'diceType' in value;
}

// ========================================
// TIPOS DE RESULTADO
// ========================================

/** Resultado de aplicação de ritual */
export interface RitualApplicationResult {
  success: boolean;
  ritualId: string;
  ritualName: string;
  level: 'base' | 'discente' | 'verdadeiro';
  peSpent: number;
  effects: AppliedEffects;
  messages: string[];
  errors?: string[];
}

/** Efeitos aplicados pelo ritual */
export interface AppliedEffects {
  // Modificadores de combate
  attackBonus?: number;
  damageBonus?: number | string;
  defenseBonus?: number;
  resistanceBonus?: number;
  
  // Efeitos de arma
  weaponEffect?: WeaponEffectConfig;
  
  // Redução de dano
  damageReduction?: DamageReductionConfig;
  
  // Bônus de perícias
  skillBonuses?: SkillBonusConfig;
  
  // PV temporários (fórmula)
  tempHP?: {
    diceCount: number;
    diceType: number;
    bonus?: number;
    rolled?: number; // Valor rolado
  };
  
  // Dano causado (fórmula)
  damage?: {
    diceCount: number;
    diceType: number;
    bonus?: number;
    damageType: string;
    rolled?: number; // Valor rolado
  };
  
  // Cura realizada (fórmula)
  healing?: {
    diceCount: number;
    diceType: number;
    bonus?: number;
    rolled?: number; // Valor rolado
  };
  
  // Condições aplicadas
  conditions?: AppliedCondition[];
  
  // Restrições de ação
  actionRestrictions?: string[];
  
  // Sustentação (se ritual é sustentável)
  sustain?: SustainConfig;
  
  // Efeito de área
  areaEffect?: {
    shape: string;
    radius?: number;
    length?: number;
  };
}

/** Estado consolidado de bônus de rituais ativos */
export interface ActiveRitualBonuses {
  // Bônus de combate (usa o maior valor - rituais não acumulam)
  attackBonus: number;
  damageBonus: number;
  defenseBonus: number;
  resistanceBonus: number;
  tempHP: number;
  
  // Efeitos de arma ativos
  weaponEffects: Array<{
    source: string;
    effect: WeaponEffectConfig;
  }>;
  
  // Reduções de dano ativas
  damageReductions: Array<{
    source: string;
    reduction: DamageReductionConfig;
  }>;
  
  // Bônus de perícias ativos
  skillBonuses: Array<{
    source: string;
    skills: string[];
    bonus: string | number;
  }>;
  
  // Condições de rituais ativas
  activeConditions: Array<{
    source: string;
    conditionId: string;
  }>;
  
  // Fontes dos bônus para UI
  sources: Array<{
    ritualId: string;
    ritualName: string;
    level: string;
    bonusType: string;
    value: number | string;
  }>;
}

/** Input de ritual sustentado */
export interface SustainedRitualInput {
  ritualId: string;
  ritualName: string;
  selectedEnhancements: string[];
  turnsActive: number;
  isConcentrating: boolean;
}

// ========================================
// FUNÇÕES DE ROLAGEM DE DADOS
// ========================================

/** Rola dados (formato: XdY+Z) */
export function rollDice(count: number, type: number, bonus: number = 0): number {
  let total = 0;
  for (let i = 0; i < count; i++) {
    total += Math.floor(Math.random() * type) + 1;
  }
  return total + bonus;
}

/** Parseia string de dados (ex: "2d6+3") e retorna o valor rolado */
export function parseAndRollDice(diceStr: string): number {
  const match = diceStr.match(/(\d+)d(\d+)(?:\+(\d+))?/);
  if (!match) return 0;
  
  const count = parseInt(match[1]);
  const type = parseInt(match[2]);
  const bonus = match[3] ? parseInt(match[3]) : 0;
  
  return rollDice(count, type, bonus);
}

// ========================================
// MOTOR DE APLICAÇÃO
// ========================================

/**
 * Aplica um ritual a um personagem
 * Processa todos os efeitos mecânicos e retorna o resultado
 */
export function applyRitual(
  ritualId: string,
  selectedEnhancements: string[] = [],
  options?: {
    isNonOccultist?: boolean;
    rollDice?: boolean; // Se true, rola os dados automaticamente
  }
): RitualApplicationResult {
  const ritual = getRitualById(ritualId);
  if (!ritual) {
    return {
      success: false,
      ritualId,
      ritualName: 'Desconhecido',
      level: 'base',
      peSpent: 0,
      effects: {},
      messages: [],
      errors: ['Ritual não encontrado'],
    };
  }

  const level = getEffectiveLevel(selectedEnhancements);
  const mechanics = getRitualEffect(ritualId, selectedEnhancements);
  const peCost = calculateRitualCost(ritual, selectedEnhancements, options?.isNonOccultist);

  if (!mechanics) {
    return {
      success: false,
      ritualId,
      ritualName: ritual.name,
      level,
      peSpent: peCost,
      effects: {},
      messages: [],
      errors: ['Mecânicas do ritual não definidas'],
    };
  }

  const effects: AppliedEffects = {};
  const messages: string[] = [];

  // Processa modificadores de combate
  if (mechanics.attackBonus !== undefined) {
    effects.attackBonus = mechanics.attackBonus;
    messages.push(`+${mechanics.attackBonus} em testes de ataque`);
  }

  if (mechanics.damageBonus !== undefined) {
    effects.damageBonus = mechanics.damageBonus;
    messages.push(`+${mechanics.damageBonus} em dano`);
  }

  if (mechanics.defenseBonus !== undefined) {
    effects.defenseBonus = mechanics.defenseBonus;
    messages.push(`+${mechanics.defenseBonus} em Defesa`);
  }

  if (mechanics.resistanceBonus !== undefined) {
    effects.resistanceBonus = mechanics.resistanceBonus;
    messages.push(`+${mechanics.resistanceBonus} em testes de resistência`);
  }

  // Processa efeito de arma
  if (mechanics.weaponEffect) {
    effects.weaponEffect = mechanics.weaponEffect;
    if (mechanics.weaponEffect.damageBonus) {
      messages.push(`Arma causa +${mechanics.weaponEffect.damageBonus} de dano ${mechanics.weaponEffect.damageType || ''}`);
    }
    if (mechanics.weaponEffect.attackBonus) {
      messages.push(`+${mechanics.weaponEffect.attackBonus} em ataques com a arma`);
    }
  }

  // Processa redução de dano
  if (mechanics.damageReduction) {
    effects.damageReduction = mechanics.damageReduction;
    const types = mechanics.damageReduction.types?.join(', ') || 'todos';
    messages.push(`RD ${mechanics.damageReduction.amount} contra ${types}`);
  }

  // Processa bônus de perícias
  if (mechanics.skillBonus) {
    effects.skillBonuses = mechanics.skillBonus;
    messages.push(`+${mechanics.skillBonus.bonus} em ${mechanics.skillBonus.skills.join(', ')}`);
  }

  // Processa PV temporários
  if (mechanics.tempHP) {
    effects.tempHP = {
      diceCount: mechanics.tempHP.diceCount,
      diceType: mechanics.tempHP.diceType,
      bonus: mechanics.tempHP.bonus,
    };
    
    if (options?.rollDice) {
      effects.tempHP.rolled = rollDice(
        mechanics.tempHP.diceCount,
        mechanics.tempHP.diceType,
        mechanics.tempHP.bonus || 0
      );
      messages.push(`Recebe ${effects.tempHP.rolled} PV temporários`);
    } else {
      messages.push(`Recebe ${mechanics.tempHP.diceCount}d${mechanics.tempHP.diceType}${mechanics.tempHP.bonus ? `+${mechanics.tempHP.bonus}` : ''} PV temporários`);
    }
  }

  // Processa dano (com type guard)
  if (mechanics.damage && isRitualDamage(mechanics.damage)) {
    const dmg = mechanics.damage;
    effects.damage = {
      diceCount: dmg.diceCount,
      diceType: dmg.diceType,
      bonus: dmg.bonus,
      damageType: dmg.damageType || 'não especificado',
    };
    
    if (options?.rollDice) {
      effects.damage.rolled = rollDice(dmg.diceCount, dmg.diceType, dmg.bonus || 0);
      messages.push(`Causa ${effects.damage.rolled} de dano de ${dmg.damageType || 'não especificado'}`);
    } else {
      messages.push(`Causa ${dmg.diceCount}d${dmg.diceType}${dmg.bonus ? `+${dmg.bonus}` : ''} de dano de ${dmg.damageType || 'não especificado'}`);
    }
  } else if (typeof mechanics.damage === 'string') {
    // Dano em formato string (ex: "2d6+3")
    messages.push(`Causa ${mechanics.damage} de dano`);
  }

  // Processa cura (com type guard)
  if (mechanics.healing && isRitualHealing(mechanics.healing)) {
    const heal = mechanics.healing;
    effects.healing = {
      diceCount: heal.diceCount,
      diceType: heal.diceType,
      bonus: heal.bonus,
    };
    
    if (options?.rollDice) {
      effects.healing.rolled = rollDice(heal.diceCount, heal.diceType, heal.bonus || 0);
      messages.push(`Cura ${effects.healing.rolled} PV`);
    } else {
      messages.push(`Cura ${heal.diceCount}d${heal.diceType}${heal.bonus ? `+${heal.bonus}` : ''} PV`);
    }
  } else if (typeof mechanics.healing === 'string') {
    messages.push(`Cura ${mechanics.healing} PV`);
  }

  // Processa condições
  if (mechanics.conditions && mechanics.conditions.length > 0) {
    effects.conditions = mechanics.conditions.map(c => ({
      id: c.id,
      name: c.id, // Usa ID como nome por padrão
      duration: c.duration,
    }));
    const conditionNames = mechanics.conditions.map(c => c.id).join(', ');
    messages.push(`Aplica condição: ${conditionNames}`);
  }

  // Processa restrições de ação
  if (mechanics.actionRestrictions) {
    effects.actionRestrictions = mechanics.actionRestrictions;
  }

  // Processa sustentação
  if (mechanics.sustain) {
    effects.sustain = mechanics.sustain;
    if (mechanics.sustain.concentration) {
      messages.push('Requer concentração');
    }
  }

  // Processa área
  if (mechanics.areaEffect) {
    effects.areaEffect = mechanics.areaEffect;
    messages.push(`Afeta área: ${mechanics.areaEffect.shape}${mechanics.areaEffect.radius ? ` ${mechanics.areaEffect.radius}m` : ''}`);
  }

  return {
    success: true,
    ritualId,
    ritualName: ritual.name,
    level,
    peSpent: peCost,
    effects,
    messages,
  };
}

/**
 * Calcula bônus consolidados de múltiplos rituais sustentados
 * REGRA OFICIAL: Rituais não acumulam entre si - usa apenas o maior valor
 */
export function calculateActiveRitualBonuses(
  sustainedRituals: SustainedRitualInput[]
): ActiveRitualBonuses {
  const result: ActiveRitualBonuses = {
    attackBonus: 0,
    damageBonus: 0,
    defenseBonus: 0,
    resistanceBonus: 0,
    tempHP: 0,
    weaponEffects: [],
    damageReductions: [],
    skillBonuses: [],
    activeConditions: [],
    sources: [],
  };

  for (const ritual of sustainedRituals) {
    const level = getEffectiveLevel(ritual.selectedEnhancements);
    const mechanics = getRitualEffect(ritual.ritualId, ritual.selectedEnhancements);
    if (!mechanics) continue;

    // Attack bonus - usa o maior
    if (mechanics.attackBonus !== undefined && mechanics.attackBonus > result.attackBonus) {
      result.attackBonus = mechanics.attackBonus;
      result.sources.push({
        ritualId: ritual.ritualId,
        ritualName: ritual.ritualName,
        level,
        bonusType: 'ataque',
        value: mechanics.attackBonus,
      });
    }

    // Damage bonus - usa o maior (se for número)
    if (mechanics.damageBonus !== undefined) {
      const dmgValue = typeof mechanics.damageBonus === 'number' ? mechanics.damageBonus : 0;
      if (dmgValue > result.damageBonus) {
        result.damageBonus = dmgValue;
        result.sources.push({
          ritualId: ritual.ritualId,
          ritualName: ritual.ritualName,
          level,
          bonusType: 'dano',
          value: mechanics.damageBonus,
        });
      }
    }

    // Defense bonus - usa o maior
    if (mechanics.defenseBonus !== undefined && mechanics.defenseBonus > result.defenseBonus) {
      result.defenseBonus = mechanics.defenseBonus;
      result.sources.push({
        ritualId: ritual.ritualId,
        ritualName: ritual.ritualName,
        level,
        bonusType: 'defesa',
        value: mechanics.defenseBonus,
      });
    }

    // Resistance bonus - usa o maior
    if (mechanics.resistanceBonus !== undefined && mechanics.resistanceBonus > result.resistanceBonus) {
      result.resistanceBonus = mechanics.resistanceBonus;
    }

    // Weapon effects - coleta todos (podem ser diferentes)
    if (mechanics.weaponEffect) {
      result.weaponEffects.push({
        source: ritual.ritualName,
        effect: mechanics.weaponEffect,
      });
    }

    // Damage reductions - coleta todos
    if (mechanics.damageReduction) {
      result.damageReductions.push({
        source: ritual.ritualName,
        reduction: mechanics.damageReduction,
      });
    }

    // Skill bonuses - coleta todos
    if (mechanics.skillBonus) {
      result.skillBonuses.push({
        source: ritual.ritualName,
        skills: mechanics.skillBonus.skills,
        bonus: mechanics.skillBonus.bonus,
      });
    }

    // Conditions - coleta todos
    if (mechanics.conditions) {
      for (const cond of mechanics.conditions) {
        result.activeConditions.push({
          source: ritual.ritualName,
          conditionId: cond.id,
        });
      }
    }

    // TempHP - calcula média esperada e usa o maior
    if (mechanics.tempHP) {
      const avgTempHP = Math.floor(
        (mechanics.tempHP.diceCount * (mechanics.tempHP.diceType + 1)) / 2 + 
        (mechanics.tempHP.bonus || 0)
      );
      if (avgTempHP > result.tempHP) {
        result.tempHP = avgTempHP;
      }
    }
  }

  return result;
}

/**
 * Processa hooks de rituais para um evento específico
 */
export function processRitualHooks(
  sustainedRituals: SustainedRitualInput[],
  trigger: string,
  context?: Record<string, unknown>
): Array<{ ritualName: string; hookEffect: string }> {
  const triggeredEffects: Array<{ ritualName: string; hookEffect: string }> = [];

  for (const ritual of sustainedRituals) {
    const ritualData = getRitualById(ritual.ritualId);
    if (!ritualData) continue;

    const mechanics = getRitualEffect(ritual.ritualId, ritual.selectedEnhancements);
    if (!mechanics?.hooks) continue;

    for (const hook of mechanics.hooks) {
      if (hook.trigger === trigger) {
        triggeredEffects.push({
          ritualName: ritual.ritualName,
          hookEffect: hook.effect,
        });
      }
    }
  }

  return triggeredEffects;
}

/**
 * Verifica se um ritual pode ser sustentado
 */
export function canSustainRitual(ritualId: string): boolean {
  const ritual = getRitualById(ritualId);
  return ritual?.isSustainable ?? false;
}

/**
 * Retorna o sumário do efeito de um ritual
 */
export function getRitualEffectSummary(ritualId: string, selectedEnhancements: string[] = []): string {
  const mechanics = getRitualEffect(ritualId, selectedEnhancements);
  return mechanics?.summary || 'Efeito não especificado';
}
