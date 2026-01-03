// =====================================================
// Adaptador de Efeitos de Condição
// Ordem Paranormal RPG v1.3
// =====================================================
//
// Converte condições ativas para o formato UnifiedEffect
//

import type { UnifiedEffect, EffectMechanics } from '../unified-effects-engine';
import { CONDITIONS, CONTEXTUAL_DEFENSE_MODIFIERS, ATTACK_MODIFIERS, TEST_MODIFIERS, INITIATIVE_MODIFIERS, type ConditionParams } from '../conditions';

/**
 * Interface para condição ativa com parâmetros dinâmicos
 * Permite passar informações específicas para condições como Machucado, Fragilizado, Envenenado
 */
export interface ActiveConditionWithParams {
  id: string;
  params?: ConditionParams;
}

/**
 * Mapeamento de condições para efeitos mecânicos
 * Expandido com contexto de ataque (melee vs ranged)
 */
export const CONDITION_MECHANICS: Record<string, {
  mechanics: EffectMechanics;
  contextual?: {
    melee?: Partial<EffectMechanics>;
    ranged?: Partial<EffectMechanics>;
  };
}> = {
  // === CONDIÇÕES DE COMBATE ===
  agarrado: {
    mechanics: {
      movementBonus: -999, // Deslocamento 0
      defenseBonus: -2,
      cannotMove: true,
      specialEffects: ['Não pode atacar à distância'],
    },
  },
  
  atordoado: {
    mechanics: {
      defenseBonus: -2,
      cannotAct: true,
      cannotReact: true,
      specialEffects: ['Não pode realizar ações ou reações'],
    },
  },
  
  caido: {
    mechanics: {
      specialEffects: ['–5 Defesa vs corpo a corpo', '+5 Defesa vs distância'],
    },
    contextual: {
      melee: { defenseBonusMelee: -5 },
      ranged: { defenseBonusRanged: 5 },
    },
  },
  
  desprevenido: {
    mechanics: {
      defenseBonus: -5,
      cannotReact: true,
      specialEffects: ['Não pode usar reações'],
    },
  },
  
  enredado: {
    mechanics: {
      movementBonus: -3,
      attackBonus: -2,
      reflexosBonus: -2,
    },
  },
  
  pasmo: {
    mechanics: {
      defenseBonus: -2,
      cannotAct: true,
      specialEffects: ['Não pode realizar ações'],
    },
  },
  
  sangrando: {
    mechanics: {
      specialEffects: ['Início do turno: sofre 1d6 de dano (ignora RD)'],
    },
  },
  
  surpreendido: {
    mechanics: {
      defenseBonus: -5,
      cannotAct: true,
      cannotReact: true,
      specialEffects: ['Não age na primeira rodada', 'Desprevenido contra atacantes'],
    },
  },
  
  vulneravel: {
    mechanics: {
      defenseBonus: -2,
    },
  },
  
  // === CONDIÇÕES SENSORIAIS ===
  cego: {
    mechanics: {
      attackBonus: -5,
      specialEffects: [
        'Falha automática em Percepção visual',
        'Todos os inimigos são invisíveis',
      ],
    },
  },
  
  surdo: {
    mechanics: {
      initiativeBonus: -2,
      specialEffects: ['Falha automática em Percepção auditiva'],
    },
  },
  
  // === CONDIÇÕES FÍSICAS ===
  debilitado: {
    mechanics: {
      allSkillsBonus: -1,
      attackBonus: -1,
      specialEffects: ['–1 em todos os testes'],
    },
  },
  
  doente: {
    mechanics: {
      allSkillsBonus: -2,
      attackBonus: -2,
      specialEffects: [
        '–2 em todos os testes',
        'Descanso não recupera PV, PE ou Sanidade',
      ],
    },
  },
  
  enjoado: {
    mechanics: {
      specialEffects: ['Só pode realizar uma ação padrão por rodada'],
    },
  },
  
  envenenado: {
    mechanics: {
      allSkillsBonus: -2,
      attackBonus: -2,
      specialEffects: ['–2 em todos os testes'],
    },
    // Mecânicas dinâmicas adicionadas em getConditionEffects baseado em params.poisonDamage
  },
  
  esmorecido: {
    mechanics: {
      allSkillsBonus: -2,
    },
  },
  
  exausto: {
    mechanics: {
      allSkillsBonus: -2,
      attackBonus: -2,
      movementMultiplier: 0.5,
      specialEffects: ['–2 em todos os testes', 'Deslocamento pela metade'],
    },
  },
  
  fraco: {
    mechanics: {
      skillBonus: { luta: -2 },
      attributeSkillsBonus: { strength: -2 },
      specialEffects: ['–2 em testes de Força e Luta', 'Capacidade de carga pela metade'],
    },
  },
  
  fragilizado: {
    mechanics: {
      // Mecânicas dinâmicas adicionadas em getConditionEffects baseado em params.damageType
    },
    // Requer params.damageType para efeito completo
  },
  
  imobilizado: {
    mechanics: {
      movementBonus: -999,
      cannotMove: true,
    },
  },
  
  lento: {
    mechanics: {
      movementMultiplier: 0.5,
      specialEffects: ['Apenas 1 ação por turno'],
    },
  },
  
  machucado: {
    mechanics: {
      // Mecânicas dinâmicas adicionadas em getConditionEffects baseado em params.weaponMaxDamage
    },
    // Requer params.weaponMaxDamage para efeito completo
  },
  
  // === CONDIÇÕES MENTAIS ===
  apavorado: {
    mechanics: {
      allSkillsBonus: -2,
      attackBonus: -2,
      specialEffects: ['Deve fugir da fonte do medo', '–2 em todos os testes'],
    },
  },
  
  confuso: {
    mechanics: {
      specialEffects: [
        'Início do turno: role 1d6',
        '1-2: ataca aliado mais próximo',
        '3-4: não faz nada',
        '5-6: age normalmente',
      ],
    },
  },
  
  enlouquecendo: {
    mechanics: {
      cannotAct: true,
      specialEffects: ['Não controla suas ações - Mestre decide'],
    },
  },
  
  fascinado: {
    mechanics: {
      skillBonus: { percepcao: -5 },
      cannotAct: true,
      specialEffects: ['–5 em Percepção', 'Só pode observar a fonte'],
    },
  },
  
  frustrado: {
    mechanics: {
      specialEffects: ['Não pode gastar PE'],
    },
  },
  
  perturbado: {
    mechanics: {
      allSkillsBonus: -2,
      attackBonus: -2,
      specialEffects: ['–2 em todos os testes', 'Pode agir de forma irracional'],
    },
  },
  
  // === CONDIÇÕES CRÍTICAS ===
  inconsciente: {
    mechanics: {
      cannotAct: true,
      cannotReact: true,
      cannotMove: true,
      isUnconscious: true,
      isHelpless: true,
      specialEffects: ['Defesa 5', 'Indefeso'],
    },
  },
  
  indefeso: {
    mechanics: {
      isHelpless: true,
      specialEffects: ['Ataques são acertos automáticos', 'Dano sempre crítico'],
    },
  },
  
  morrendo: {
    mechanics: {
      cannotAct: true,
      cannotReact: true,
      cannotMove: true,
      isUnconscious: true,
      isHelpless: true,
      specialEffects: [
        'Inconsciente',
        'Contador de 3 rodadas até morrer',
        'Dano adicional reduz 1 rodada',
      ],
    },
  },
  
  paralisado: {
    mechanics: {
      cannotAct: true,
      cannotMove: true,
      isHelpless: true,
      specialEffects: ['Defesa 5', 'Indefeso'],
    },
  },
  
  // === CONDIÇÕES DE RITUAIS ===
  'velocidade-mortal-inverso': {
    mechanics: {
      specialEffects: ['Recebe metade do dano que o alvo receberia'],
    },
  },
  
  'velocidade-mortal-buff': {
    mechanics: {
      extraAction: 'movement',
      specialEffects: ['Ação de movimento adicional por turno'],
    },
  },
  
  'velocidade-mortal-discente': {
    mechanics: {
      extraAction: 'standard',
      specialEffects: ['Ação padrão adicional por turno'],
    },
  },
};

/**
 * Converte condições ativas de um personagem para UnifiedEffect[]
 * Suporta parâmetros dinâmicos para condições como Machucado, Fragilizado e Envenenado
 * 
 * @param activeConditions - Array de IDs ou objetos com parâmetros
 * @param attackContext - Contexto de ataque para efeitos condicionais
 * @returns Array de efeitos unificados
 */
export function getConditionEffects(
  activeConditions: (string | ActiveConditionWithParams)[],
  attackContext?: { type: 'melee' | 'ranged' }
): UnifiedEffect[] {
  const effects: UnifiedEffect[] = [];
  
  for (const condition of activeConditions) {
    // Normaliza para objeto com params
    const conditionId = typeof condition === 'string' ? condition : condition.id;
    const params = typeof condition === 'string' ? undefined : condition.params;
    
    const conditionDef = CONDITIONS[conditionId];
    if (!conditionDef) continue;
    
    const mechanicsDef = CONDITION_MECHANICS[conditionId];
    if (!mechanicsDef) {
      // Condição existe mas não tem mecânicas mapeadas
      effects.push({
        id: `condition-${conditionId}`,
        name: conditionDef.name,
        description: conditionDef.effect,
        source: 'condition',
        sourceId: conditionId,
        sourceName: `Condição: ${conditionDef.name}`,
        mechanics: {
          specialEffects: [conditionDef.effect],
        },
        isActive: true,
        isToggleable: false,
      });
      continue;
    }
    
    // Combina mecânicas base com contextuais
    let mechanics: EffectMechanics = { ...mechanicsDef.mechanics };
    
    // === PARÂMETROS DINÂMICOS ===
    
    // Machucado: dano igual ao máximo da arma
    if (conditionId === 'machucado' && params?.weaponMaxDamage) {
      const weaponRef = params.weaponName ? ` (${params.weaponName})` : '';
      mechanics.specialEffects = [
        `Ao realizar ação: sofre ${params.weaponMaxDamage} de dano${weaponRef}`,
      ];
      mechanics.damageOnAction = params.weaponMaxDamage;
    } else if (conditionId === 'machucado') {
      mechanics.specialEffects = ['Ao realizar ação: sofre dano igual ao máximo da arma (não configurado)'];
    }
    
    // Fragilizado: vulnerável a tipo de dano específico
    if (conditionId === 'fragilizado' && params?.damageType) {
      mechanics.specialEffects = [
        `Vulnerável a dano ${params.damageType} (+50% de dano)`,
      ];
      mechanics.damageVulnerability = {
        type: params.damageType,
        multiplier: 1.5,
      };
    } else if (conditionId === 'fragilizado') {
      mechanics.specialEffects = ['Vulnerável a um tipo de dano (+50%) - tipo não especificado'];
    }
    
    // Envenenado: efeitos do veneno
    if (conditionId === 'envenenado' && params?.poisonDamage) {
      const poisonRef = params.poisonName ? ` (${params.poisonName})` : '';
      const dtRef = params.poisonDT ? ` DT ${params.poisonDT}` : '';
      mechanics.specialEffects = [
        '–2 em todos os testes',
        `Dano de veneno: ${params.poisonDamage}${poisonRef}`,
        ...(dtRef ? [`Fortitude${dtRef} para resistir`] : []),
      ];
      mechanics.poisonDamage = params.poisonDamage;
      mechanics.poisonDT = params.poisonDT;
    }
    
    // Aplica modificadores contextuais de defesa
    if (mechanicsDef.contextual && attackContext) {
      const contextMods = mechanicsDef.contextual[attackContext.type];
      if (contextMods) {
        mechanics = { ...mechanics, ...contextMods };
      }
    }
    
    // Adiciona modificadores globais já existentes no sistema
    if (CONTEXTUAL_DEFENSE_MODIFIERS[conditionId]) {
      const ctxMod = CONTEXTUAL_DEFENSE_MODIFIERS[conditionId];
      if (ctxMod.melee && !mechanics.defenseBonusMelee) {
        mechanics.defenseBonusMelee = ctxMod.melee;
      }
      if (ctxMod.ranged && !mechanics.defenseBonusRanged) {
        mechanics.defenseBonusRanged = ctxMod.ranged;
      }
    }
    
    if (ATTACK_MODIFIERS[conditionId] && !mechanics.attackBonus) {
      mechanics.attackBonus = ATTACK_MODIFIERS[conditionId];
    }
    
    if (INITIATIVE_MODIFIERS[conditionId] && !mechanics.initiativeBonus) {
      mechanics.initiativeBonus = INITIATIVE_MODIFIERS[conditionId];
    }
    
    const effect: UnifiedEffect = {
      id: `condition-${conditionId}`,
      name: conditionDef.name,
      description: conditionDef.effect,
      source: 'condition',
      sourceId: conditionId,
      sourceName: `Condição: ${conditionDef.name}`,
      mechanics,
      isActive: true,
      isToggleable: false,
      duration: conditionDef.autoRemove 
        ? { type: 'turns', value: 1 }
        : { type: 'until_removed' },
    };
    
    effects.push(effect);
  }
  
  return effects;
}

/**
 * Calcula modificadores totais de condições para uma situação específica
 * Útil para cálculos rápidos sem criar objetos UnifiedEffect
 */
export function getConditionModifiersSummary(activeConditions: string[]): {
  attackMod: number;
  defenseMod: number;
  defenseVsMeleeMod: number;
  defenseVsRangedMod: number;
  initiativeMod: number;
  allTestsMod: number;
  canAct: boolean;
  canReact: boolean;
  canMove: boolean;
  isHelpless: boolean;
} {
  let attackMod = 0;
  let defenseMod = 0;
  let defenseVsMeleeMod = 0;
  let defenseVsRangedMod = 0;
  let initiativeMod = 0;
  let allTestsMod = 0;
  let canAct = true;
  let canReact = true;
  let canMove = true;
  let isHelpless = false;
  
  for (const conditionId of activeConditions) {
    const mech = CONDITION_MECHANICS[conditionId];
    if (!mech) continue;
    
    const m = mech.mechanics;
    
    if (m.attackBonus) attackMod += m.attackBonus;
    if (m.defenseBonus) defenseMod += m.defenseBonus;
    if (m.initiativeBonus) initiativeMod += m.initiativeBonus;
    if (m.allSkillsBonus) allTestsMod += m.allSkillsBonus;
    
    if (m.cannotAct) canAct = false;
    if (m.cannotReact) canReact = false;
    if (m.cannotMove) canMove = false;
    if (m.isHelpless) isHelpless = true;
    
    // Contextuais
    if (mech.contextual?.melee?.defenseBonusMelee) {
      defenseVsMeleeMod += mech.contextual.melee.defenseBonusMelee;
    }
    if (mech.contextual?.ranged?.defenseBonusRanged) {
      defenseVsRangedMod += mech.contextual.ranged.defenseBonusRanged;
    }
  }
  
  return {
    attackMod,
    defenseMod,
    defenseVsMeleeMod,
    defenseVsRangedMod,
    initiativeMod,
    allTestsMod,
    canAct,
    canReact,
    canMove,
    isHelpless,
  };
}

/**
 * Lista todas as condições com suas mecânicas
 * Útil para debug e documentação
 */
export function listAllConditionEffects(): Array<{
  id: string;
  name: string;
  hasMechanics: boolean;
  effects: string[];
}> {
  return Object.entries(CONDITIONS).map(([id, condition]) => {
    const mechanics = CONDITION_MECHANICS[id];
    return {
      id,
      name: condition.name,
      hasMechanics: !!mechanics,
      effects: mechanics?.mechanics.specialEffects || [condition.effect],
    };
  });
}
