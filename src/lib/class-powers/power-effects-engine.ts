/**
 * Engine de Efeitos de Poderes de Classe
 * Ordem Paranormal RPG v1.3
 * 
 * Este arquivo é responsável por calcular e aplicar automaticamente
 * todos os bônus e efeitos dos poderes de classe baseado no contexto
 * do personagem (NEX, atributos, equipamento, situação).
 */

import {
  UnifiedClassPower,
  PowerMechanics,
  PowerBonusSummary,
  PowerCalculationContext,
  ScalingValue,
  ScalingDice,
  WeaponCategory,
  ProtectionCategory,
  Attribute,
  Skill,
  PowerConditions,
  ActiveClassPower,
} from './types';
import { getPowerById, ALL_CLASS_POWERS } from './power-registry';

// ================== HELPERS DE ESCALONAMENTO ==================

/**
 * Calcula valor escalável baseado no NEX atual
 * @param value - Valor fixo ou escalável
 * @param nex - NEX atual do personagem
 * @returns Valor numérico calculado
 */
export function resolveScalingValue(value: number | ScalingValue, nex: number): number {
  if (typeof value === 'number') {
    return value;
  }
  
  // Encontra o maior threshold de NEX que o personagem alcançou
  let resolvedValue = value.baseValue;
  
  for (const scale of value.scaling.sort((a, b) => a.nex - b.nex)) {
    if (nex >= scale.nex) {
      resolvedValue = scale.value;
    }
  }
  
  return resolvedValue;
}

/**
 * Calcula dado escalável baseado no NEX atual
 * @param dice - Dado fixo ou escalável
 * @param nex - NEX atual do personagem
 * @returns String do dado (ex: "1d8")
 */
export function resolveScalingDice(dice: string | ScalingDice, nex: number): string {
  if (typeof dice === 'string') {
    return dice;
  }
  
  let resolvedDice = dice.baseDice;
  
  for (const scale of dice.scaling.sort((a, b) => a.nex - b.nex)) {
    if (nex >= scale.nex) {
      resolvedDice = scale.dice;
    }
  }
  
  return resolvedDice;
}

// ================== VERIFICAÇÃO DE CONDIÇÕES ==================

/**
 * Verifica se as condições do poder são atendidas pelo contexto
 * @param conditions - Condições definidas no poder
 * @param context - Contexto atual do personagem
 * @returns true se todas as condições são atendidas
 */
export function checkConditions(
  conditions: PowerConditions | undefined,
  context: PowerCalculationContext
): boolean {
  if (!conditions) {
    return true;
  }
  
  // Verifica tipo de arma
  if (conditions.weaponType) {
    const weaponTypes = Array.isArray(conditions.weaponType) 
      ? conditions.weaponType 
      : [conditions.weaponType];
    
    if (!context.equippedWeaponType || 
        (!weaponTypes.includes(context.equippedWeaponType) && !weaponTypes.includes('any'))) {
      return false;
    }
  }
  
  // Verifica tipo de proteção
  if (conditions.protectionType) {
    if (conditions.protectionType !== 'any' && 
        context.equippedProtectionType !== conditions.protectionType) {
      return false;
    }
  }
  
  // Verifica se está em combate
  if (conditions.inCombat !== undefined && conditions.inCombat !== context.inCombat) {
    return false;
  }
  
  // Verifica se está em investigação
  if (conditions.duringInvestigation !== undefined && 
      conditions.duringInvestigation !== context.inInvestigation) {
    return false;
  }
  
  // Verifica estado do alvo (condicionais complexos - precisam ser verificados em runtime)
  // Essas condições são retornadas como "condicionais" para UI mostrar
  
  return true;
}

/**
 * Verifica se arma é corpo a corpo
 */
export function isMeleeWeapon(weaponType: WeaponCategory | undefined): boolean {
  return weaponType === 'melee' || weaponType === 'unarmed';
}

/**
 * Verifica se arma é à distância
 */
export function isRangedWeapon(weaponType: WeaponCategory | undefined): boolean {
  return weaponType === 'ranged' || weaponType === 'firearm' || 
         weaponType === 'tactical' || weaponType === 'heavy';
}

// ================== CRIAÇÃO DE SUMÁRIO VAZIO ==================

/**
 * Cria um sumário de bônus vazio/zerado
 */
export function createEmptyBonusSummary(): PowerBonusSummary {
  return {
    attack: {
      general: 0,
      melee: 0,
      ranged: 0,
      firearm: 0,
    },
    damage: {
      general: 0,
      melee: 0,
      ranged: 0,
      firearm: 0,
      extraDice: [],
      attributeBonuses: [],
    },
    defense: {
      base: 0,
      conditional: 0,
    },
    resistance: {
      fortitude: 0,
      reflexos: 0,
      vontade: 0,
      all: 0,
    },
    skills: {},
    proficiencies: {
      weapons: [],
      protections: [],
    },
    peReductions: [],
    specialFlags: [],
  };
}

// ================== APLICAÇÃO DE MECÂNICAS ==================

/**
 * Aplica as mecânicas de um poder ao sumário de bônus
 * @param summary - Sumário atual a ser modificado
 * @param mechanics - Mecânicas do poder a aplicar
 * @param context - Contexto do personagem
 * @param power - Poder original (para referência)
 */
export function applyMechanics(
  summary: PowerBonusSummary,
  mechanics: Partial<PowerMechanics>,
  context: PowerCalculationContext,
  power?: UnifiedClassPower
): void {
  const nex = context.nex;
  
  // === BÔNUS DE ATAQUE ===
  if (mechanics.attackBonus) {
    const bonus = resolveScalingValue(mechanics.attackBonus.value, nex);
    const conditions = mechanics.attackBonus.conditions;
    
    if (checkConditions(conditions, context)) {
      // Aplica ao tipo apropriado de arma
      if (conditions?.weaponType) {
        const types = Array.isArray(conditions.weaponType) 
          ? conditions.weaponType 
          : [conditions.weaponType];
        
        for (const type of types) {
          if (type === 'melee' || type === 'unarmed') {
            summary.attack.melee += bonus;
          } else if (type === 'ranged') {
            summary.attack.ranged += bonus;
          } else if (type === 'firearm' || type === 'tactical' || type === 'heavy') {
            summary.attack.firearm += bonus;
          }
        }
      } else {
        // Bônus geral
        summary.attack.general += bonus;
      }
    }
  }
  
  // === BÔNUS DE DANO ===
  if (mechanics.damageBonus) {
    const conditions = mechanics.damageBonus.conditions;
    
    if (checkConditions(conditions, context)) {
      // Valor numérico
      if (mechanics.damageBonus.value !== undefined) {
        const value = typeof mechanics.damageBonus.value === 'string'
          ? 0 // Fórmulas são tratadas como dados extras
          : resolveScalingValue(mechanics.damageBonus.value, nex);
        
        if (conditions?.weaponType) {
          const types = Array.isArray(conditions.weaponType) 
            ? conditions.weaponType 
            : [conditions.weaponType];
          
          for (const type of types) {
            if (type === 'melee' || type === 'unarmed') {
              summary.damage.melee += value;
            } else if (type === 'ranged' || type === 'ranged-nonfirearm') {
              // ranged-nonfirearm: armas de disparo que NÃO são de fogo (arcos, bestas, etc.)
              summary.damage.ranged += value;
            } else if (type === 'firearm' || type === 'tactical' || type === 'heavy') {
              summary.damage.firearm += value;
            }
          }
        } else {
          summary.damage.general += value;
        }
        
        // Se for fórmula de dado, adiciona aos dados extras
        if (typeof mechanics.damageBonus.value === 'string') {
          summary.damage.extraDice.push(mechanics.damageBonus.value);
        }
      }
      
      // Dados extras
      if (mechanics.damageBonus.extraDice) {
        const diceStr = resolveScalingDice(mechanics.damageBonus.extraDice, nex);
        if (!summary.damage.extraDice.includes(diceStr)) {
          summary.damage.extraDice.push(diceStr);
        }
      }
      
      // Atributo como bônus
      if (mechanics.damageBonus.attribute) {
        if (!summary.damage.attributeBonuses.includes(mechanics.damageBonus.attribute)) {
          summary.damage.attributeBonuses.push(mechanics.damageBonus.attribute);
        }
      }
    }
  }
  
  // === BÔNUS DE DEFESA ===
  if (mechanics.defenseBonus) {
    const bonus = resolveScalingValue(mechanics.defenseBonus.value, nex);
    const conditions = mechanics.defenseBonus.conditions;
    
    if (checkConditions(conditions, context)) {
      // Se tem condições específicas, é bônus condicional
      if (conditions && Object.keys(conditions).length > 0) {
        summary.defense.conditional += bonus;
      } else {
        summary.defense.base += bonus;
      }
    }
  }
  
  // === BÔNUS DE RESISTÊNCIA ===
  if (mechanics.resistanceBonus) {
    const bonus = resolveScalingValue(mechanics.resistanceBonus.value, nex);
    const types = mechanics.resistanceBonus.types || ['all'];
    
    if (checkConditions(mechanics.resistanceBonus.conditions, context)) {
      for (const type of types) {
        if (type === 'all') {
          summary.resistance.all += bonus;
        } else if (type === 'fortitude') {
          summary.resistance.fortitude += bonus;
        } else if (type === 'reflexos') {
          summary.resistance.reflexos += bonus;
        } else if (type === 'vontade') {
          summary.resistance.vontade += bonus;
        }
      }
    }
  }
  
  // === BÔNUS DE PERÍCIAS ===
  if (mechanics.skillBonuses) {
    for (const skillBonus of mechanics.skillBonuses) {
      const bonus = resolveScalingValue(skillBonus.value, nex);
      
      if (checkConditions(skillBonus.conditions, context)) {
        const skills = Array.isArray(skillBonus.skill) ? skillBonus.skill : [skillBonus.skill];
        
        for (const skill of skills) {
          summary.skills[skill] = (summary.skills[skill] || 0) + bonus;
        }
      }
    }
  }
  
  // === PROFICIÊNCIAS ===
  if (mechanics.proficiencies) {
    if (mechanics.proficiencies.weapons) {
      for (const weapon of mechanics.proficiencies.weapons) {
        if (!summary.proficiencies.weapons.includes(weapon)) {
          summary.proficiencies.weapons.push(weapon);
        }
      }
    }
    
    if (mechanics.proficiencies.protections) {
      for (const protection of mechanics.proficiencies.protections) {
        if (!summary.proficiencies.protections.includes(protection)) {
          summary.proficiencies.protections.push(protection);
        }
      }
    }
  }
  
  // === MODIFICADORES DE PE ===
  if (mechanics.peModifiers) {
    for (const modifier of mechanics.peModifiers) {
      if (checkConditions(modifier.conditions, context)) {
        summary.peReductions.push({
          target: modifier.targets?.join(', ') || 'geral',
          value: modifier.value,
        });
      }
    }
  }
  
  // === DANO DESARMADO (Artista Marcial) ===
  if (mechanics.grantsUnarmedDamage) {
    const diceStr = resolveScalingDice({
      baseDice: mechanics.grantsUnarmedDamage.baseDice,
      scaling: mechanics.grantsUnarmedDamage.scaling,
    }, nex);
    summary.unarmedDamage = diceStr;
  }
  
  // === FLAGS ESPECIAIS ===
  if (mechanics.grantsAgileProperty) {
    if (!summary.specialFlags.includes('agile')) {
      summary.specialFlags.push('agile');
    }
  }
  
  // Adiciona flag do poder para referência
  if (power && !summary.specialFlags.includes(power.id)) {
    summary.specialFlags.push(power.id);
  }
}

// ================== CÁLCULO PRINCIPAL ==================

/**
 * Calcula todos os bônus dos poderes de classe de um personagem
 * @param characterPowers - Lista de poderes do personagem (IDs ou ActiveClassPower)
 * @param context - Contexto atual do personagem
 * @returns Sumário completo de todos os bônus
 */
export function calculatePowerBonuses(
  characterPowers: (string | ActiveClassPower)[],
  context: PowerCalculationContext
): PowerBonusSummary {
  const summary = createEmptyBonusSummary();
  
  for (const powerRef of characterPowers) {
    const powerId = typeof powerRef === 'string' ? powerRef : powerRef.powerId;
    const power = getPowerById(powerId);
    
    if (!power) {
      // Tenta buscar por nome (compatibilidade com sistema antigo)
      const foundPower = ALL_CLASS_POWERS.find(
        p => p.name.toLowerCase() === powerId.toLowerCase()
      );
      
      if (foundPower) {
        applyPowerEffects(summary, foundPower, context);
      }
      continue;
    }
    
    applyPowerEffects(summary, power, context);
  }
  
  return summary;
}

/**
 * Aplica todos os efeitos de um poder específico
 * @param summary - Sumário a ser modificado
 * @param power - Poder a aplicar
 * @param context - Contexto do personagem
 */
function applyPowerEffects(
  summary: PowerBonusSummary,
  power: UnifiedClassPower,
  context: PowerCalculationContext
): void {
  // Aplica efeitos base
  applyMechanics(summary, power.effects.base, context, power);
  
  // Aplica progressão por NEX
  if (power.effects.progression) {
    for (const [nexStr, mechanics] of Object.entries(power.effects.progression)) {
      const nexThreshold = parseInt(nexStr);
      
      if (context.nex >= nexThreshold) {
        applyMechanics(summary, mechanics, context, power);
      }
    }
  }
}

// ================== FUNÇÕES DE CONSULTA ESPECÍFICA ==================

/**
 * Verifica se um personagem tem um poder específico (por ID ou nome)
 * @param characterPowers - Poderes do personagem
 * @param powerIdOrName - ID ou nome do poder
 * @returns true se possui o poder
 */
export function hasPower(
  characterPowers: (string | ActiveClassPower)[],
  powerIdOrName: string
): boolean {
  const normalizedSearch = powerIdOrName.toLowerCase();
  
  for (const powerRef of characterPowers) {
    const powerId = typeof powerRef === 'string' ? powerRef : powerRef.powerId;
    
    // Busca por ID direto
    if (powerId.toLowerCase() === normalizedSearch) {
      return true;
    }
    
    // Busca por nome no registro
    const power = getPowerById(powerId);
    if (power && power.name.toLowerCase() === normalizedSearch) {
      return true;
    }
  }
  
  // Busca no registro pelo nome
  const foundPower = ALL_CLASS_POWERS.find(
    p => p.name.toLowerCase() === normalizedSearch || p.id.toLowerCase() === normalizedSearch
  );
  
  if (foundPower) {
    return characterPowers.some(powerRef => {
      const id = typeof powerRef === 'string' ? powerRef : powerRef.powerId;
      return id === foundPower.id || id.toLowerCase() === foundPower.name.toLowerCase();
    });
  }
  
  return false;
}

/**
 * Obtém o bônus de ataque total para um tipo de arma
 * @param summary - Sumário de bônus calculado
 * @param weaponType - Tipo de arma
 * @returns Bônus total de ataque
 */
export function getAttackBonus(
  summary: PowerBonusSummary,
  weaponType: WeaponCategory
): number {
  let bonus = summary.attack.general;
  
  if (weaponType === 'melee' || weaponType === 'unarmed') {
    bonus += summary.attack.melee;
  } else if (weaponType === 'ranged') {
    bonus += summary.attack.ranged;
  } else {
    bonus += summary.attack.firearm;
  }
  
  return bonus;
}

/**
 * Obtém o bônus de dano total para um tipo de arma
 * @param summary - Sumário de bônus calculado
 * @param weaponType - Tipo de arma
 * @returns Bônus total de dano
 */
export function getDamageBonus(
  summary: PowerBonusSummary,
  weaponType: WeaponCategory
): number {
  let bonus = summary.damage.general;
  
  if (weaponType === 'melee' || weaponType === 'unarmed') {
    bonus += summary.damage.melee;
  } else if (weaponType === 'ranged') {
    bonus += summary.damage.ranged;
  } else {
    bonus += summary.damage.firearm;
  }
  
  return bonus;
}

/**
 * Obtém bônus de resistência total para um tipo
 * @param summary - Sumário de bônus calculado
 * @param type - Tipo de resistência
 * @returns Bônus total
 */
export function getResistanceBonus(
  summary: PowerBonusSummary,
  type: 'fortitude' | 'reflexos' | 'vontade'
): number {
  return summary.resistance.all + summary.resistance[type];
}

/**
 * Obtém bônus de perícia
 * @param summary - Sumário de bônus calculado
 * @param skill - Nome da perícia
 * @returns Bônus na perícia
 */
export function getSkillBonus(
  summary: PowerBonusSummary,
  skill: Skill | string
): number {
  return summary.skills[skill] || 0;
}

// ================== FUNÇÕES DE CUSTO DE PE ==================

/**
 * Calcula custo de PE modificado baseado nos poderes
 * @param baseCost - Custo base em PE
 * @param target - Alvo do custo (ritual, elemento, etc)
 * @param summary - Sumário de bônus
 * @returns Custo modificado
 */
export function calculateModifiedPECost(
  baseCost: number,
  target: string,
  summary: PowerBonusSummary
): number {
  let cost = baseCost;
  
  for (const reduction of summary.peReductions) {
    if (reduction.target === 'geral' || 
        reduction.target.toLowerCase().includes(target.toLowerCase())) {
      cost += reduction.value; // value é negativo para reduções
    }
  }
  
  return Math.max(0, cost);
}

// ================== ADAPTADOR PARA SISTEMA LEGADO ==================

/**
 * Converte lista de abilities (formato antigo) para IDs de poderes
 * @param abilities - Array de strings com nomes de habilidades
 * @returns Array de IDs de poderes correspondentes
 */
export function mapLegacyAbilitiesToPowerIds(abilities: string[]): string[] {
  const powerIds: string[] = [];
  
  for (const ability of abilities) {
    const normalizedName = ability.toLowerCase().trim();
    
    // Busca no registro pelo nome
    const power = ALL_CLASS_POWERS.find(
      p => p.name.toLowerCase() === normalizedName
    );
    
    if (power) {
      powerIds.push(power.id);
    } else {
      // Mantém o nome original para compatibilidade
      powerIds.push(ability);
    }
  }
  
  return powerIds;
}

/**
 * Calcula bônus a partir de abilities legadas
 * @param abilities - Array de nomes de habilidades (formato antigo)
 * @param context - Contexto do personagem
 * @returns Sumário de bônus
 */
export function calculateBonusesFromLegacyAbilities(
  abilities: string[],
  context: PowerCalculationContext
): PowerBonusSummary {
  const powerIds = mapLegacyAbilitiesToPowerIds(abilities);
  return calculatePowerBonuses(powerIds, context);
}

// ================== FUNÇÕES DE DEBUG/VALIDAÇÃO ==================

/**
 * Retorna lista detalhada de bônus aplicados por cada poder
 * Útil para debug e exibição ao usuário
 */
export function getDetailedPowerBreakdown(
  characterPowers: (string | ActiveClassPower)[],
  context: PowerCalculationContext
): Array<{
  powerId: string;
  powerName: string;
  bonuses: Partial<PowerBonusSummary>;
  conditions: string[];
}> {
  const breakdown: Array<{
    powerId: string;
    powerName: string;
    bonuses: Partial<PowerBonusSummary>;
    conditions: string[];
  }> = [];
  
  for (const powerRef of characterPowers) {
    const powerId = typeof powerRef === 'string' ? powerRef : powerRef.powerId;
    const power = getPowerById(powerId) || ALL_CLASS_POWERS.find(
      p => p.name.toLowerCase() === powerId.toLowerCase()
    );
    
    if (!power) continue;
    
    // Calcula bônus isolado deste poder
    const isolated = createEmptyBonusSummary();
    applyPowerEffects(isolated, power, context);
    
    // Extrai condições
    const conditions: string[] = [];
    const cond = power.effects.base.conditions;
    
    if (cond?.weaponType) {
      const types = Array.isArray(cond.weaponType) ? cond.weaponType : [cond.weaponType];
      conditions.push(`Arma: ${types.join(', ')}`);
    }
    if (cond?.onCritical) {
      conditions.push('Em crítico');
    }
    if (cond?.targetState) {
      conditions.push(`Alvo: ${cond.targetState.join(', ')}`);
    }
    if (cond?.inCombat) {
      conditions.push('Em combate');
    }
    if (cond?.duringInvestigation) {
      conditions.push('Durante investigação');
    }
    
    breakdown.push({
      powerId: power.id,
      powerName: power.name,
      bonuses: isolated,
      conditions,
    });
  }
  
  return breakdown;
}
