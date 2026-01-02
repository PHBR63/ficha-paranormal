// =====================================================
// Adaptador de Efeitos de Poderes de Classe
// Ordem Paranormal RPG v1.3
// =====================================================
//
// Converte poderes de classe (Combatente, Especialista, Ocultista)
// para o formato UnifiedEffect do Sistema Unificado de Efeitos (SUE).
//
// INTEGRAÇÃO COMPLETA com power-registry.ts:
// - Mapeia automaticamente PowerMechanics → EffectMechanics
// - Suporta progressão por NEX
// - Suporta poderes com escolhas (elemento, ritual, perícia)
// - Suporta poderes ativáveis e passivos
//

import type { UnifiedEffect, EffectMechanics, AttributeType } from '../unified-effects-engine';
import { getPowerById, ALL_CLASS_POWERS } from '../class-powers/power-registry';
import type { 
  UnifiedClassPower, 
  PowerMechanics,
  ScalingValue,
  ScalingDice,
  Attribute,
  Skill,
} from '../class-powers/types';

// =====================================================
// Tipos de Input
// =====================================================

/**
 * Poder de classe ativo com escolhas do jogador
 * Interface compatível com o sistema existente
 */
export interface ActiveClassPower {
  id: string;                      // ID do poder (ex: 'ataque-especial')
  name: string;                    // Nome do poder
  classId: string;                 // Classe do poder
  nex: number;                     // NEX em que foi adquirido
  choices?: {
    element?: string;              // Elemento escolhido (Sangue, Morte, etc.)
    ritual?: string;               // Ritual escolhido (para Ritual Predileto)
    attribute?: string;            // Atributo escolhido
    skill?: string;                // Perícia escolhida
    power?: string;                // Poder escolhido (ex: Transcender)
  };
}

// =====================================================
// Funções de Conversão: PowerMechanics → EffectMechanics
// =====================================================

/**
 * Resolve um valor escalável baseado no NEX
 */
function resolveScalingValue(value: number | ScalingValue, nex: number): number {
  if (typeof value === 'number') return value;
  
  // Encontra o maior NEX que o personagem atingiu
  let resolved = value.baseValue;
  for (const scale of value.scaling) {
    if (nex >= scale.nex) {
      resolved = scale.value;
    }
  }
  return resolved;
}

/**
 * Resolve dado escalável baseado no NEX
 */
function resolveScalingDice(dice: string | ScalingDice, nex: number): string {
  if (typeof dice === 'string') return dice;
  
  let resolved = dice.baseDice;
  for (const scale of dice.scaling) {
    if (nex >= scale.nex) {
      resolved = scale.dice;
    }
  }
  return resolved;
}

/**
 * Converte atributo do sistema de poderes para o formato do SUE
 */
function convertAttribute(attr: Attribute): AttributeType {
  const map: Record<Attribute, AttributeType> = {
    strength: 'strength',
    agility: 'agility',
    vigor: 'vigor',
    intellect: 'intellect',
    presence: 'presence',
  };
  return map[attr];
}

/**
 * Converte PowerMechanics do power-registry para EffectMechanics do SUE
 * Esta é a função central de mapeamento
 */
function convertPowerMechanicsToEffects(
  mechanics: PowerMechanics,
  power: UnifiedClassPower,
  nex: number,
  choices?: ActiveClassPower['choices']
): EffectMechanics {
  const effects: EffectMechanics = {};
  
  // === COMBATE - ATAQUE ===
  if (mechanics.attackBonus) {
    const bonus = resolveScalingValue(mechanics.attackBonus.value, nex);
    
    // Aplica condição de tipo de arma
    if (mechanics.conditions?.weaponType) {
      const weaponTypes = Array.isArray(mechanics.conditions.weaponType) 
        ? mechanics.conditions.weaponType 
        : [mechanics.conditions.weaponType];
        
      if (weaponTypes.includes('melee')) {
        effects.meleeAttackBonus = bonus;
      } else if (weaponTypes.includes('ranged') || weaponTypes.includes('firearm')) {
        effects.rangedAttackBonus = bonus;
      } else {
        effects.attackBonus = bonus;
      }
    } else {
      effects.attackBonus = bonus;
    }
  }
  
  // === COMBATE - DANO ===
  if (mechanics.damageBonus) {
    let damageValue: number = 0;
    
    // Resolve valor numérico ou escalável
    if (mechanics.damageBonus.value !== undefined) {
      if (typeof mechanics.damageBonus.value === 'string') {
        // É uma fórmula de dado - coloca em extraDice
        effects.extraDamageDice = mechanics.damageBonus.value;
      } else {
        damageValue = resolveScalingValue(mechanics.damageBonus.value, nex);
      }
    }
    
    // Aplica condição de tipo de arma
    if (mechanics.conditions?.weaponType) {
      const weaponTypes = Array.isArray(mechanics.conditions.weaponType) 
        ? mechanics.conditions.weaponType 
        : [mechanics.conditions.weaponType];
        
      if (weaponTypes.includes('melee') || weaponTypes.includes('unarmed')) {
        effects.meleeDamageBonus = (effects.meleeDamageBonus || 0) + damageValue;
      } else if (weaponTypes.includes('ranged') || weaponTypes.includes('firearm')) {
        effects.rangedDamageBonus = (effects.rangedDamageBonus || 0) + damageValue;
      } else if (damageValue > 0) {
        effects.damageBonus = damageValue;
      }
    } else if (damageValue > 0) {
      effects.damageBonus = damageValue;
    }
    
    // Dados extras
    if (mechanics.damageBonus.extraDice) {
      effects.extraDamageDice = resolveScalingDice(mechanics.damageBonus.extraDice, nex);
    }
  }
  
  // === COMBATE - CRÍTICO ===
  if (mechanics.criticalBonus) {
    if (mechanics.criticalBonus.marginBonus) {
      effects.criticalMarginBonus = mechanics.criticalBonus.marginBonus;
    }
    if (mechanics.criticalBonus.multiplierBonus) {
      effects.criticalMultiplierBonus = mechanics.criticalBonus.multiplierBonus;
    }
  }
  
  // === DEFESA ===
  if (mechanics.defenseBonus) {
    effects.defenseBonus = resolveScalingValue(mechanics.defenseBonus.value, nex);
  }
  
  // === RESISTÊNCIAS ===
  if (mechanics.resistanceBonus) {
    const bonus = resolveScalingValue(mechanics.resistanceBonus.value, nex);
    const types = mechanics.resistanceBonus.types || ['all'];
    
    for (const type of types) {
      if (type === 'all') {
        effects.allResistancesBonus = (effects.allResistancesBonus || 0) + bonus;
      } else if (type === 'fortitude') {
        effects.fortitudeBonus = (effects.fortitudeBonus || 0) + bonus;
      } else if (type === 'reflexos') {
        effects.reflexosBonus = (effects.reflexosBonus || 0) + bonus;
      } else if (type === 'vontade') {
        effects.vontadeBonus = (effects.vontadeBonus || 0) + bonus;
      }
    }
  }
  
  // === REDUÇÃO DE DANO ===
  if (mechanics.damageReduction) {
    effects.damageReduction = resolveScalingValue(mechanics.damageReduction.value, nex);
  }
  
  // === PERÍCIAS ===
  if (mechanics.skillBonuses) {
    effects.skillBonus = {};
    for (const sb of mechanics.skillBonuses) {
      const skills = Array.isArray(sb.skill) ? sb.skill : [sb.skill];
      const bonus = resolveScalingValue(sb.value, nex);
      
      for (const skill of skills) {
        effects.skillBonus[skill] = (effects.skillBonus[skill] || 0) + bonus;
      }
    }
  }
  
  // === PROFICIÊNCIAS ===
  if (mechanics.proficiencies) {
    effects.grantsProficiency = [];
    if (mechanics.proficiencies.weapons) {
      effects.grantsProficiency.push(...mechanics.proficiencies.weapons);
    }
    if (mechanics.proficiencies.protections) {
      effects.grantsProficiency.push(...mechanics.proficiencies.protections);
    }
    if (mechanics.proficiencies.special) {
      effects.grantsProficiency.push(...mechanics.proficiencies.special);
    }
  }
  
  // === MODIFICADORES DE PE PARA RITUAIS ===
  if (mechanics.peModifiers) {
    for (const mod of mechanics.peModifiers) {
      if (mod.targets?.includes('ritual')) {
        effects.ritualPEReduction = (effects.ritualPEReduction || 0) + Math.abs(mod.value);
      }
      // Elemento específico
      if (mod.targets?.some(t => ['sangue', 'morte', 'conhecimento', 'energia', 'medo'].includes(t))) {
        if (!effects.ritualPEReductionByElement) effects.ritualPEReductionByElement = {};
        for (const target of mod.targets) {
          if (['sangue', 'morte', 'conhecimento', 'energia', 'medo'].includes(target)) {
            effects.ritualPEReductionByElement[target] = 
              (effects.ritualPEReductionByElement[target] || 0) + Math.abs(mod.value);
          }
        }
      }
    }
  }
  
  // === PODERES COM ESCOLHA DE ELEMENTO (Especialista/Mestre em Elemento) ===
  if (choices?.element && mechanics.requiresChoice?.type === 'element') {
    const element = choices.element.toLowerCase();
    
    // Mapeia para DT ou redução de PE baseado no ID do poder
    if (power.id.includes('especialista-em-elemento')) {
      if (!effects.ritualDTBonusByElement) effects.ritualDTBonusByElement = {};
      effects.ritualDTBonusByElement[element] = 2;
    } else if (power.id.includes('mestre-em-elemento')) {
      if (!effects.ritualPEReductionByElement) effects.ritualPEReductionByElement = {};
      effects.ritualPEReductionByElement[element] = 1;
    }
  }
  
  // === PODERES COM ESCOLHA DE RITUAL (Ritual Predileto) ===
  if (choices?.ritual && power.id.includes('ritual-predileto')) {
    effects.ritualPEReduction = 1;
    if (!effects.specialEffects) effects.specialEffects = [];
    effects.specialEffects.push(`Ritual Predileto: -1 PE em ${choices.ritual}`);
  }
  
  // === DANO COM ATRIBUTO (Artista Marcial) ===
  if (mechanics.grantsUnarmedDamage) {
    effects.extraDamageDice = resolveScalingDice(mechanics.grantsUnarmedDamage, nex);
    if (!effects.specialEffects) effects.specialEffects = [];
    effects.specialEffects.push(`Dano desarmado: ${effects.extraDamageDice}`);
  }
  
  // === ATAQUE ÁGIL ===
  if (mechanics.grantsAgileProperty) {
    if (!effects.specialEffects) effects.specialEffects = [];
    effects.specialEffects.push('Ataques desarmados usam Agilidade');
  }
  
  // === AÇÕES EXTRAS ===
  if (mechanics.extraActions) {
    for (const action of mechanics.extraActions) {
      if (!effects.specialEffects) effects.specialEffects = [];
      const actionNames: Record<string, string> = {
        investigation: 'investigação',
        attack: 'ataque',
        movement: 'movimento',
        standard: 'padrão',
      };
      effects.specialEffects.push(`Ação extra de ${actionNames[action.actionType] || action.actionType}`);
    }
  }
  
  // === REDUÇÃO DE CATEGORIA ===
  if (mechanics.categoryReduction) {
    effects.categoryReduction = {
      amount: mechanics.categoryReduction.amount,
      targetType: mechanics.categoryReduction.targetType,
      requiresChoice: mechanics.categoryReduction.requiresChoice,
      choiceDescription: mechanics.categoryReduction.choiceDescription,
      appliesToAllCarried: mechanics.categoryReduction.appliesToAllCarried,
    };
  }
  
  // === CONTRA-MÁGICA ===
  if (mechanics.counterSpell) {
    effects.counterSpell = {
      costMatchesTarget: mechanics.counterSpell.costMatchesTarget,
      testSkill: mechanics.counterSpell.testSkill as string,
      testType: mechanics.counterSpell.testType as 'opposed' | 'fixed',
    };
  }
  
  // === PODER PASSIVO SEM MECÂNICAS ESPECÍFICAS ===
  if (Object.keys(effects).length === 0 && mechanics.kind === 'passive') {
    effects.specialEffects = [power.description.slice(0, 100) + '...'];
  }
  
  // === NOTA CONDICIONAL ===
  if (mechanics.conditions) {
    const condNotes: string[] = [];
    
    if (mechanics.conditions.weaponType) {
      const types = Array.isArray(mechanics.conditions.weaponType)
        ? mechanics.conditions.weaponType
        : [mechanics.conditions.weaponType];
      const typeNames: Record<string, string> = {
        melee: 'corpo a corpo',
        ranged: 'distância',
        firearm: 'armas de fogo',
        tactical: 'armas táticas',
        heavy: 'armas pesadas',
        unarmed: 'desarmado',
      };
      condNotes.push(types.map(t => typeNames[t] || t).join(', '));
    }
    
    if (mechanics.conditions.onCritical) {
      condNotes.push('em acerto crítico');
    }
    
    if (mechanics.conditions.targetState) {
      condNotes.push(`alvo ${mechanics.conditions.targetState.join(', ')}`);
    }
    
    if (condNotes.length > 0) {
      effects.conditionalNote = `Apenas ${condNotes.join('; ')}`;
    }
  }
  
  return effects;
}

/**
 * Obtém as mecânicas corretas para o NEX atual (base + progression)
 */
function getMechanicsForNex(power: UnifiedClassPower, nex: number): PowerMechanics {
  let mechanics = { ...power.effects.base };
  
  // Aplica progressões se existirem
  if (power.effects.progression) {
    const progressionNexes = Object.keys(power.effects.progression)
      .map(Number)
      .sort((a, b) => a - b);
      
    for (const progNex of progressionNexes) {
      if (nex >= progNex) {
        mechanics = {
          ...mechanics,
          ...power.effects.progression[progNex],
        };
      }
    }
  }
  
  return mechanics;
}

// =====================================================
// Função Principal de Conversão
// =====================================================

/**
 * Converte poderes de classe ativos para UnifiedEffect[]
 * 
 * @param classPowers - Lista de poderes de classe do personagem
 * @param nex - NEX atual do personagem
 * @param attributes - Atributos do personagem
 * @param activatedEffects - IDs de efeitos ativados manualmente
 * @returns Array de UnifiedEffect
 */
export function getClassPowerEffects(
  classPowers: ActiveClassPower[],
  nex: number,
  attributes: Record<AttributeType, number>,
  activatedEffects: string[] = []
): UnifiedEffect[] {
  const effects: UnifiedEffect[] = [];
  
  for (const activePower of classPowers) {
    // Busca definição do poder no registro
    const powerDef = getPowerById(activePower.id);
    
    if (!powerDef) {
      // Fallback: tenta usar sistema legado
      const legacyEffect = getLegacyPowerEffect(activePower, attributes, activatedEffects);
      if (legacyEffect) {
        effects.push(legacyEffect);
      }
      continue;
    }
    
    // Obtém mecânicas para o NEX atual
    const mechanics = getMechanicsForNex(powerDef, nex);
    
    // Converte para EffectMechanics
    const effectMechanics = convertPowerMechanicsToEffects(
      mechanics,
      powerDef,
      nex,
      activePower.choices
    );
    
    // Se não há mecânicas relevantes, pula
    if (Object.keys(effectMechanics).length === 0) continue;
    
    // Determina se o efeito precisa de ativação manual
    const requiresActivation = mechanics.kind === 'activated' && mechanics.activation !== undefined;
    const isActivated = activatedEffects.includes(`class-power-${activePower.id}`);
    
    // Cria o UnifiedEffect
    const effect: UnifiedEffect = {
      id: `class-power-${activePower.id}`,
      name: powerDef.name,
      description: powerDef.description,
      source: 'class_power',
      sourceId: activePower.id,
      sourceName: `${powerDef.classId}: ${powerDef.name}`,
      mechanics: effectMechanics,
      conditions: requiresActivation ? {
        requiresActivation: true,
        costPE: typeof mechanics.activation?.cost === 'number' 
          ? mechanics.activation.cost 
          : resolveScalingValue(mechanics.activation?.cost || 0, nex),
        costAction: mechanics.activation?.action === 'free' ? 'free' : 
                    mechanics.activation?.action === 'reaction' ? 'reaction' :
                    mechanics.activation?.action === 'movement' ? 'movement' :
                    mechanics.activation?.action === 'standard' ? 'standard' :
                    mechanics.activation?.action === 'complete' ? 'full' : undefined,
      } : undefined,
      isActive: requiresActivation ? isActivated : true,
      isToggleable: requiresActivation,
      priority: powerDef.minNex, // Poderes de NEX mais alto têm prioridade
    };
    
    effects.push(effect);
  }
  
  return effects;
}

// =====================================================
// Sistema Legado (fallback para poderes não migrados)
// =====================================================

/**
 * Mapeamento legado para poderes que ainda não estão no power-registry
 * Este bloco garante retrocompatibilidade durante a migração
 */
const LEGACY_POWER_CONFIGS: Record<string, {
  name: string;
  description: string;
  getEffects: (power: ActiveClassPower, attributes: Record<AttributeType, number>) => Partial<EffectMechanics>;
}> = {
  'especialista-em-elemento': {
    name: 'Especialista em Elemento',
    description: '+2 na DT para resistir aos seus rituais do elemento escolhido',
    getEffects: (power) => {
      const element = power.choices?.element?.toLowerCase();
      if (!element) return {};
      return { ritualDTBonusByElement: { [element]: 2 } };
    },
  },
  'mestre-em-elemento': {
    name: 'Mestre em Elemento',
    description: '-1 PE para lançar rituais do elemento escolhido',
    getEffects: (power) => {
      const element = power.choices?.element?.toLowerCase();
      if (!element) return {};
      return { ritualPEReductionByElement: { [element]: 1 } };
    },
  },
  'ritual-potente': {
    name: 'Ritual Potente',
    description: 'Soma Intelecto nas rolagens de dano ou efeitos de cura de rituais',
    getEffects: () => ({ ritualDamageAttributeBonus: 'intellect' }),
  },
  'ritual-predileto': {
    name: 'Ritual Predileto',
    description: '-1 PE no custo do ritual escolhido',
    getEffects: (power) => {
      const ritual = power.choices?.ritual;
      if (!ritual) return {};
      return {
        ritualPEReduction: 1,
        specialEffects: [`Ritual Predileto: -1 PE em ${ritual}`],
      };
    },
  },
  'tatuagem-ritualistica': {
    name: 'Tatuagem Ritualística',
    description: '-1 PE em rituais de alcance pessoal que têm você como alvo',
    getEffects: () => ({ ritualPEReductionByRange: { 'pessoal': 1 } }),
  },
  'envolto-em-misterio': {
    name: 'Envolto em Mistério',
    description: '+5 em Enganação e Intimidação contra não-treinados em Ocultismo',
    getEffects: () => ({
      skillBonus: { 'enganacao': 5, 'intimidacao': 5 },
      conditionalNote: 'Contra pessoas não treinadas em Ocultismo',
    }),
  },
  'identificacao-paranormal': {
    name: 'Identificação Paranormal',
    description: '+10 em Ocultismo para identificar criaturas, objetos ou rituais paranormais',
    getEffects: () => ({
      skillBonus: { 'ocultismo': 10 },
      conditionalNote: 'Para identificar criaturas, objetos ou rituais paranormais',
    }),
  },
  'golpe-brutal': {
    name: 'Golpe Brutal',
    description: 'Aumenta margem de ameaça corpo a corpo em +2',
    getEffects: () => ({
      criticalMarginBonus: 2,
      conditionalNote: 'Apenas ataques corpo a corpo',
    }),
  },
  'golpe-pesado': {
    name: 'Golpe Pesado',
    description: '+2 no dano corpo a corpo',
    getEffects: () => ({ meleeDamageBonus: 2 }),
  },
  'golpe-demolidor': {
    name: 'Golpe Demolidor',
    description: '+4 no dano corpo a corpo',
    getEffects: () => ({ meleeDamageBonus: 4 }),
  },
  'mira-firme': {
    name: 'Mira Firme',
    description: '+2 no dano à distância',
    getEffects: () => ({ rangedDamageBonus: 2 }),
  },
  'balistica-avancada': {
    name: 'Balística Avançada',
    description: '+2 no dano com armas de fogo',
    getEffects: () => ({
      rangedDamageBonus: 2,
      conditionalNote: 'Apenas armas de fogo',
    }),
  },
};

/**
 * Obtém efeito de poder usando sistema legado
 */
function getLegacyPowerEffect(
  power: ActiveClassPower,
  attributes: Record<AttributeType, number>,
  activatedEffects: string[]
): UnifiedEffect | null {
  const config = LEGACY_POWER_CONFIGS[power.id];
  if (!config) return null;
  
  const mechanics = config.getEffects(power, attributes);
  if (Object.keys(mechanics).length === 0) return null;
  
  return {
    id: `class-power-${power.id}`,
    name: config.name,
    description: config.description,
    source: 'class_power',
    sourceId: power.id,
    sourceName: `${power.classId}: ${config.name}`,
    mechanics,
    isActive: true,
    isToggleable: false,
  };
}

// =====================================================
// Funções Auxiliares
// =====================================================

/**
 * Retorna lista de poderes que requerem escolha
 */
export function getPowersRequiringChoice(): string[] {
  return ALL_CLASS_POWERS
    .filter(p => p.effects.base.requiresChoice)
    .map(p => p.id);
}

/**
 * Retorna o tipo de escolha requerido por um poder
 */
export function getChoiceTypeForPower(powerId: string): string | undefined {
  const power = getPowerById(powerId);
  return power?.effects.base.requiresChoice?.type;
}

/**
 * Verifica se um poder tem configuração de efeitos
 */
export function hasPowerEffects(powerId: string): boolean {
  const power = getPowerById(powerId);
  if (!power) return !!LEGACY_POWER_CONFIGS[powerId];
  
  const mechanics = power.effects.base;
  return !!(
    mechanics.attackBonus ||
    mechanics.damageBonus ||
    mechanics.defenseBonus ||
    mechanics.criticalBonus ||
    mechanics.resistanceBonus ||
    mechanics.damageReduction ||
    mechanics.skillBonuses ||
    mechanics.proficiencies ||
    mechanics.peModifiers ||
    mechanics.grantsUnarmedDamage ||
    mechanics.extraActions
  );
}

/**
 * Lista todos os poderes com efeitos configurados
 */
export function listAllClassPowerEffects(): Array<{ id: string; name: string; description: string }> {
  const fromRegistry = ALL_CLASS_POWERS.map(p => ({
    id: p.id,
    name: p.name,
    description: p.description,
  }));
  
  const fromLegacy = Object.entries(LEGACY_POWER_CONFIGS)
    .filter(([id]) => !fromRegistry.find(p => p.id === id))
    .map(([id, config]) => ({
      id,
      name: config.name,
      description: config.description,
    }));
  
  return [...fromRegistry, ...fromLegacy];
}

/**
 * Obtém informações sobre o efeito de um poder específico
 */
export function getClassPowerEffectInfo(powerId: string): {
  id: string;
  name: string;
  description: string;
  requiresChoice?: boolean;
  choiceType?: string;
} | undefined {
  const power = getPowerById(powerId);
  if (power) {
    return {
      id: power.id,
      name: power.name,
      description: power.description,
      requiresChoice: !!power.effects.base.requiresChoice,
      choiceType: power.effects.base.requiresChoice?.type,
    };
  }
  
  const legacy = LEGACY_POWER_CONFIGS[powerId];
  if (legacy) {
    return {
      id: powerId,
      name: legacy.name,
      description: legacy.description,
    };
  }
  
  return undefined;
}

/**
 * Obtém estatísticas de cobertura do adapter
 */
export function getClassPowerAdapterStats(): {
  totalPowers: number;
  powersFromRegistry: number;
  powersFromLegacy: number;
  powersWithEffects: number;
} {
  const totalPowers = ALL_CLASS_POWERS.length;
  const powersWithEffects = ALL_CLASS_POWERS.filter(p => hasPowerEffects(p.id)).length;
  const legacyCount = Object.keys(LEGACY_POWER_CONFIGS).length;
  
  return {
    totalPowers,
    powersFromRegistry: totalPowers,
    powersFromLegacy: legacyCount,
    powersWithEffects: powersWithEffects + legacyCount,
  };
}
